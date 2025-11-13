package com.catus.backend.service;

import com.catus.backend.dto.LoginResponse;
import com.catus.backend.exception.UnauthorizedException;
import com.catus.backend.model.User;
import com.catus.backend.model.UserProfile;
import com.catus.backend.model.UserSetting;
import com.catus.backend.repository.UserProfileRepository;
import com.catus.backend.repository.UserRepository;
import com.catus.backend.repository.UserSettingRepository;
import com.catus.backend.service.KakaoOAuthService.KakaoUserInfo;
import com.catus.backend.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private KakaoOAuthService kakaoOAuthService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserSettingRepository userSettingRepository;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private static final String TEST_CODE = "test_code";
    private static final String TEST_REDIRECT_URI = "http://localhost:8080/callback";
    private static final String TEST_KAKAO_TOKEN = "kakao_access_token";
    private static final String TEST_ACCESS_TOKEN = "jwt_access_token";
    private static final String TEST_REFRESH_TOKEN = "jwt_refresh_token";

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Should successfully login existing user")
    void shouldSuccessfullyLoginExistingUser() {
        // Given - Existing user
        KakaoUserInfo kakaoUserInfo = createKakaoUserInfo("kakao_123", "test@example.com", "TestUser");
        User existingUser = createUser(1L, "kakao_123", "test@example.com");
        UserProfile userProfile = createUserProfile(1L, existingUser, "TestUser");

        when(kakaoOAuthService.getAccessToken(TEST_CODE, TEST_REDIRECT_URI)).thenReturn(TEST_KAKAO_TOKEN);
        when(kakaoOAuthService.getUserInfo(TEST_KAKAO_TOKEN)).thenReturn(kakaoUserInfo);
        when(userRepository.findByKakaoId("kakao_123")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userProfileRepository.findByUser_UserId(1L)).thenReturn(Optional.of(userProfile));
        when(jwtTokenProvider.generateAccessToken(1L, "test@example.com", "kakao_123"))
                .thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken(1L)).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(jwtTokenProvider.getRefreshTokenExpiration()).thenReturn(604800000L);

        // When
        LoginResponse response = authService.login(TEST_CODE, TEST_REDIRECT_URI);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo(TEST_ACCESS_TOKEN);
        assertThat(response.getRefreshToken()).isEqualTo(TEST_REFRESH_TOKEN);
        assertThat(response.isNewUser()).isFalse();
        assertThat(response.getUser().getUserId()).isEqualTo(1L);
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");

        verify(userRepository, never()).save(argThat(user -> user.getUserId() == null)); // No new user created
        verify(valueOperations).set(eq("refresh_token:1"), eq(TEST_REFRESH_TOKEN), anyLong(), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("Should successfully register and login new user")
    void shouldSuccessfullyRegisterNewUser() {
        // Given - New user
        KakaoUserInfo kakaoUserInfo = createKakaoUserInfo("kakao_new", "newuser@example.com", "NewUser");
        User newUser = createUser(2L, "kakao_new", "newuser@example.com");
        UserProfile newProfile = createUserProfile(2L, newUser, "NewUser");

        when(kakaoOAuthService.getAccessToken(TEST_CODE, TEST_REDIRECT_URI)).thenReturn(TEST_KAKAO_TOKEN);
        when(kakaoOAuthService.getUserInfo(TEST_KAKAO_TOKEN)).thenReturn(kakaoUserInfo);
        when(userRepository.findByKakaoId("kakao_new")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(newUser);
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(newProfile);
        when(userSettingRepository.save(any(UserSetting.class))).thenReturn(new UserSetting());
        when(userProfileRepository.findByUser_UserId(2L)).thenReturn(Optional.of(newProfile));
        when(jwtTokenProvider.generateAccessToken(2L, "newuser@example.com", "kakao_new"))
                .thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken(2L)).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(jwtTokenProvider.getRefreshTokenExpiration()).thenReturn(604800000L);

        // When
        LoginResponse response = authService.login(TEST_CODE, TEST_REDIRECT_URI);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isNewUser()).isTrue();
        assertThat(response.getUser().getEmail()).isEqualTo("newuser@example.com");

        verify(userRepository).save(any(User.class));
        verify(userProfileRepository).save(any(UserProfile.class));
        verify(userSettingRepository).save(any(UserSetting.class));
    }

    @Test
    @DisplayName("Should throw exception when Kakao returns no email")
    void shouldThrowExceptionWhenNoEmail() {
        // Given
        KakaoUserInfo kakaoUserInfo = createKakaoUserInfo("kakao_123", null, "TestUser");

        when(kakaoOAuthService.getAccessToken(TEST_CODE, TEST_REDIRECT_URI)).thenReturn(TEST_KAKAO_TOKEN);
        when(kakaoOAuthService.getUserInfo(TEST_KAKAO_TOKEN)).thenReturn(kakaoUserInfo);

        // When & Then
        assertThatThrownBy(() -> authService.login(TEST_CODE, TEST_REDIRECT_URI))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Email is required");
    }

    @Test
    @DisplayName("Should validate refresh token successfully")
    void shouldValidateRefreshTokenSuccessfully() {
        // Given
        Long userId = 1L;
        String refreshToken = "valid_refresh_token";

        when(valueOperations.get("refresh_token:1")).thenReturn(refreshToken);

        // When
        boolean isValid = authService.validateRefreshToken(userId, refreshToken);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject invalid refresh token")
    void shouldRejectInvalidRefreshToken() {
        // Given
        Long userId = 1L;
        String refreshToken = "invalid_token";

        when(valueOperations.get("refresh_token:1")).thenReturn("different_token");

        // When
        boolean isValid = authService.validateRefreshToken(userId, refreshToken);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should remove refresh token on logout")
    void shouldRemoveRefreshTokenOnLogout() {
        // Given
        Long userId = 1L;

        // When
        authService.removeRefreshToken(userId);

        // Then
        verify(redisTemplate).delete("refresh_token:1");
    }

    @Test
    @DisplayName("Should refresh access token successfully")
    void shouldRefreshAccessTokenSuccessfully() {
        // Given
        Long userId = 1L;
        String refreshToken = TEST_REFRESH_TOKEN;
        User user = createUser(userId, "kakao_123", "test@example.com");
        UserProfile profile = createUserProfile(1L, user, "TestUser");

        when(jwtTokenProvider.validateToken(refreshToken)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(refreshToken)).thenReturn(userId);
        when(valueOperations.get("refresh_token:1")).thenReturn(refreshToken);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser_UserId(userId)).thenReturn(Optional.of(profile));
        when(jwtTokenProvider.generateAccessToken(userId, "test@example.com", "kakao_123"))
                .thenReturn("new_access_token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);

        // When
        LoginResponse response = authService.refreshAccessToken(refreshToken);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("new_access_token");
        assertThat(response.getRefreshToken()).isEqualTo(refreshToken); // Same refresh token
        assertThat(response.isNewUser()).isFalse();
    }

    @Test
    @DisplayName("Should throw exception when refreshing with invalid token")
    void shouldThrowExceptionWhenRefreshingWithInvalidToken() {
        // Given
        String invalidToken = "invalid_token";

        when(jwtTokenProvider.validateToken(invalidToken))
                .thenThrow(new UnauthorizedException());

        // When & Then
        assertThatThrownBy(() -> authService.refreshAccessToken(invalidToken))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should store refresh token in Redis with correct TTL")
    void shouldStoreRefreshTokenWithCorrectTTL() {
        // Given
        KakaoUserInfo kakaoUserInfo = createKakaoUserInfo("kakao_123", "test@example.com", "TestUser");
        User user = createUser(1L, "kakao_123", "test@example.com");
        UserProfile profile = createUserProfile(1L, user, "TestUser");

        when(kakaoOAuthService.getAccessToken(any(), any())).thenReturn(TEST_KAKAO_TOKEN);
        when(kakaoOAuthService.getUserInfo(any())).thenReturn(kakaoUserInfo);
        when(userRepository.findByKakaoId(any())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);
        when(userProfileRepository.findByUser_UserId(any())).thenReturn(Optional.of(profile));
        when(jwtTokenProvider.generateAccessToken(any(), any(), any())).thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(jwtTokenProvider.getRefreshTokenExpiration()).thenReturn(604800000L); // 7 days

        // When
        authService.login(TEST_CODE, TEST_REDIRECT_URI);

        // Then
        ArgumentCaptor<Long> ttlCaptor = ArgumentCaptor.forClass(Long.class);
        verify(valueOperations).set(
                eq("refresh_token:1"),
                eq(TEST_REFRESH_TOKEN),
                ttlCaptor.capture(),
                eq(TimeUnit.SECONDS)
        );

        long expectedTTL = 604800000L / 1000; // Convert ms to seconds
        assertThat(ttlCaptor.getValue()).isEqualTo(expectedTTL);
    }

    // Helper methods

    private KakaoUserInfo createKakaoUserInfo(String kakaoId, String email, String nickname) {
        return KakaoUserInfo.builder()
                .kakaoId(kakaoId)
                .email(email)
                .nickname(nickname)
                .profileImageUrl("https://example.com/image.jpg")
                .build();
    }

    private User createUser(Long userId, String kakaoId, String email) {
        User user = User.builder()
                .kakaoId(kakaoId)
                .email(email)
                .status(User.UserStatus.ACTIVE)
                .build();
        if (userId != null) {
            user.setUserId(userId);
        }
        return user;
    }

    private UserProfile createUserProfile(Long profileId, User user, String nickname) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname(nickname)
                .build();
        if (profileId != null) {
            profile.setProfileId(profileId);
        }
        return profile;
    }
}
