package com.catus.backend.util;

import com.catus.backend.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for JwtTokenProvider
 */
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private static final String TEST_SECRET = "test-secret-key-for-jwt-token-generation-must-be-long-enough-for-hs256";
    private static final long ACCESS_TOKEN_EXPIRATION = 86400000L; // 24 hours
    private static final long REFRESH_TOKEN_EXPIRATION = 604800000L; // 7 days

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(
                TEST_SECRET,
                ACCESS_TOKEN_EXPIRATION,
                REFRESH_TOKEN_EXPIRATION
        );
    }

    @Test
    @DisplayName("Should generate valid access token")
    void shouldGenerateValidAccessToken() {
        // Given
        Long userId = 123L;
        String email = "test@example.com";
        String kakaoId = "kakao_12345";

        // When
        String token = jwtTokenProvider.generateAccessToken(userId, email, kakaoId);

        // Then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void shouldGenerateValidRefreshToken() {
        // Given
        Long userId = 123L;

        // When
        String token = jwtTokenProvider.generateRefreshToken(userId);

        // Then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("Should extract user ID from token")
    void shouldExtractUserIdFromToken() {
        // Given
        Long expectedUserId = 123L;
        String token = jwtTokenProvider.generateAccessToken(expectedUserId, "test@example.com", "kakao_12345");

        // When
        Long actualUserId = jwtTokenProvider.getUserIdFromToken(token);

        // Then
        assertThat(actualUserId).isEqualTo(expectedUserId);
    }

    @Test
    @DisplayName("Should extract email from token")
    void shouldExtractEmailFromToken() {
        // Given
        String expectedEmail = "test@example.com";
        String token = jwtTokenProvider.generateAccessToken(123L, expectedEmail, "kakao_12345");

        // When
        String actualEmail = jwtTokenProvider.getEmailFromToken(token);

        // Then
        assertThat(actualEmail).isEqualTo(expectedEmail);
    }

    @Test
    @DisplayName("Should extract Kakao ID from token")
    void shouldExtractKakaoIdFromToken() {
        // Given
        String expectedKakaoId = "kakao_12345";
        String token = jwtTokenProvider.generateAccessToken(123L, "test@example.com", expectedKakaoId);

        // When
        String actualKakaoId = jwtTokenProvider.getKakaoIdFromToken(token);

        // Then
        assertThat(actualKakaoId).isEqualTo(expectedKakaoId);
    }

    @Test
    @DisplayName("Should validate valid token")
    void shouldValidateValidToken() {
        // Given
        String token = jwtTokenProvider.generateAccessToken(123L, "test@example.com", "kakao_12345");

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should throw exception for malformed token")
    void shouldThrowExceptionForMalformedToken() {
        // Given
        String malformedToken = "invalid.token.here";

        // When & Then
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(malformedToken))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    @DisplayName("Should throw exception for empty token")
    void shouldThrowExceptionForEmptyToken() {
        // Given
        String emptyToken = "";

        // When & Then
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(emptyToken))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should throw exception for expired token")
    void shouldThrowExceptionForExpiredToken() throws InterruptedException {
        // Given - Create provider with very short expiration (1ms)
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(
                TEST_SECRET,
                1L, // 1 millisecond
                1000L
        );
        String token = shortLivedProvider.generateAccessToken(123L, "test@example.com", "kakao_12345");

        // Wait for token to expire
        Thread.sleep(10);

        // When & Then
        assertThatThrownBy(() -> shortLivedProvider.validateToken(token))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("Should throw exception for token with invalid signature")
    void shouldThrowExceptionForInvalidSignature() {
        // Given - Create token with one secret, validate with different secret
        JwtTokenProvider provider1 = new JwtTokenProvider(
                "secret-key-one-for-testing-jwt-signature-validation-hs256",
                ACCESS_TOKEN_EXPIRATION,
                REFRESH_TOKEN_EXPIRATION
        );
        JwtTokenProvider provider2 = new JwtTokenProvider(
                "secret-key-two-different-from-first-for-jwt-testing",
                ACCESS_TOKEN_EXPIRATION,
                REFRESH_TOKEN_EXPIRATION
        );

        String token = provider1.generateAccessToken(123L, "test@example.com", "kakao_12345");

        // When & Then
        assertThatThrownBy(() -> provider2.validateToken(token))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid token signature");
    }

    @Test
    @DisplayName("Should return correct expiration times")
    void shouldReturnCorrectExpirationTimes() {
        // When
        long accessExpiration = jwtTokenProvider.getAccessTokenExpiration();
        long refreshExpiration = jwtTokenProvider.getRefreshTokenExpiration();

        // Then
        assertThat(accessExpiration).isEqualTo(ACCESS_TOKEN_EXPIRATION);
        assertThat(refreshExpiration).isEqualTo(REFRESH_TOKEN_EXPIRATION);
    }

    @Test
    @DisplayName("Should generate different tokens for different users")
    void shouldGenerateDifferentTokensForDifferentUsers() {
        // Given
        Long userId1 = 123L;
        Long userId2 = 456L;

        // When
        String token1 = jwtTokenProvider.generateAccessToken(userId1, "user1@example.com", "kakao_123");
        String token2 = jwtTokenProvider.generateAccessToken(userId2, "user2@example.com", "kakao_456");

        // Then
        assertThat(token1).isNotEqualTo(token2);
        assertThat(jwtTokenProvider.getUserIdFromToken(token1)).isEqualTo(userId1);
        assertThat(jwtTokenProvider.getUserIdFromToken(token2)).isEqualTo(userId2);
    }
}
