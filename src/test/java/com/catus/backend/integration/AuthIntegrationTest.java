package com.catus.backend.integration;

import com.catus.backend.dto.LoginRequest;
import com.catus.backend.dto.LoginResponse;
import com.catus.backend.model.User;
import com.catus.backend.repository.UserProfileRepository;
import com.catus.backend.repository.UserRepository;
import com.catus.backend.repository.UserSettingRepository;
import com.catus.backend.service.KakaoOAuthService;
import com.catus.backend.service.KakaoOAuthService.KakaoUserInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test for authentication flow.
 * Tests the complete login process from controller to database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserSettingRepository userSettingRepository;

    @MockBean
    private KakaoOAuthService kakaoOAuthService;

    @BeforeEach
    void setUp() {
        // Clean up database before each test
        userSettingRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully login new user and create profile")
    void shouldSuccessfullyLoginNewUser() throws Exception {
        // Given
        KakaoUserInfo kakaoUserInfo = KakaoUserInfo.builder()
                .kakaoId("kakao_12345")
                .email("newuser@example.com")
                .nickname("NewUser")
                .profileImageUrl("https://example.com/profile.jpg")
                .build();

        when(kakaoOAuthService.getAccessToken(any(), any())).thenReturn("kakao_access_token");
        when(kakaoOAuthService.getUserInfo(any())).thenReturn(kakaoUserInfo);

        LoginRequest request = LoginRequest.builder()
                .code("test_authorization_code")
                .redirectUri("http://localhost:8080/callback")
                .build();

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andExpect(jsonPath("$.user.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.user.nickname").value("NewUser"))
                .andReturn();

        // Then - Verify database state
        String responseJson = result.getResponse().getContentAsString();
        LoginResponse response = objectMapper.readValue(responseJson, LoginResponse.class);

        assertThat(response.getAccessToken()).isNotEmpty();
        assertThat(response.getRefreshToken()).isNotEmpty();

        // Verify user was created in database
        User createdUser = userRepository.findByKakaoId("kakao_12345").orElse(null);
        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getEmail()).isEqualTo("newuser@example.com");
        assertThat(createdUser.getStatus()).isEqualTo(User.UserStatus.ACTIVE);

        // Verify profile was created
        assertThat(userProfileRepository.findByUser_UserId(createdUser.getUserId())).isPresent();

        // Verify settings were created
        assertThat(userSettingRepository.findByUser_UserId(createdUser.getUserId())).isPresent();
    }

    @Test
    @DisplayName("Should successfully login existing user")
    void shouldSuccessfullyLoginExistingUser() throws Exception {
        // Given - Create existing user
        User existingUser = User.builder()
                .kakaoId("kakao_existing")
                .email("existing@example.com")
                .status(User.UserStatus.ACTIVE)
                .build();
        existingUser = userRepository.save(existingUser);

        userProfileRepository.save(com.catus.backend.model.UserProfile.builder()
                .user(existingUser)
                .nickname("ExistingUser")
                .build());

        userSettingRepository.save(com.catus.backend.model.UserSetting.createDefault(existingUser));

        KakaoUserInfo kakaoUserInfo = KakaoUserInfo.builder()
                .kakaoId("kakao_existing")
                .email("existing@example.com")
                .nickname("ExistingUser")
                .build();

        when(kakaoOAuthService.getAccessToken(any(), any())).thenReturn("kakao_access_token");
        when(kakaoOAuthService.getUserInfo(any())).thenReturn(kakaoUserInfo);

        LoginRequest request = LoginRequest.builder()
                .code("test_code")
                .redirectUri("http://localhost:8080/callback")
                .build();

        // When
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewUser").value(false))
                .andExpect(jsonPath("$.user.email").value("existing@example.com"));

        // Then - Verify no duplicate users created
        long userCount = userRepository.count();
        assertThat(userCount).isEqualTo(1L);
    }

    @Test
    @DisplayName("Should return 400 for invalid login request")
    void shouldReturn400ForInvalidRequest() throws Exception {
        // Given - Empty request
        LoginRequest request = LoginRequest.builder()
                .code("") // Empty code
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VAL001"));
    }

    @Test
    @DisplayName("Should access protected endpoint with valid JWT token")
    void shouldAccessProtectedEndpointWithValidToken() throws Exception {
        // Given - Create user and login
        KakaoUserInfo kakaoUserInfo = KakaoUserInfo.builder()
                .kakaoId("kakao_test")
                .email("test@example.com")
                .nickname("TestUser")
                .build();

        when(kakaoOAuthService.getAccessToken(any(), any())).thenReturn("kakao_token");
        when(kakaoOAuthService.getUserInfo(any())).thenReturn(kakaoUserInfo);

        LoginRequest loginRequest = LoginRequest.builder()
                .code("test_code")
                .redirectUri("http://localhost:8080/callback")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String loginJson = loginResult.getResponse().getContentAsString();
        LoginResponse loginResponse = objectMapper.readValue(loginJson, LoginResponse.class);
        String accessToken = loginResponse.getAccessToken();

        // When - Access protected endpoint with token
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.nickname").value("TestUser"));
    }

    @Test
    @DisplayName("Should return 401 when accessing protected endpoint without token")
    void shouldReturn401WithoutToken() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return 401 with invalid token")
    void shouldReturn401WithInvalidToken() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer invalid_token_here"))
                .andExpect(status().isUnauthorized());
    }
}
