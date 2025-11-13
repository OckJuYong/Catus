package com.catus.backend.service;

import com.catus.backend.dto.LoginResponse;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.exception.UnauthorizedException;
import com.catus.backend.model.User;
import com.catus.backend.model.UserProfile;
import com.catus.backend.model.UserSetting;
import com.catus.backend.repository.UserProfileRepository;
import com.catus.backend.repository.UserRepository;
import com.catus.backend.repository.UserSettingRepository;
import com.catus.backend.service.KakaoOAuthService.KakaoUserInfo;
import com.catus.backend.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * Authentication service handling user login and registration.
 * Manages JWT token generation and refresh token storage in Redis.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final KakaoOAuthService kakaoOAuthService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserSettingRepository userSettingRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";

    /**
     * Process Kakao OAuth login
     * @param code Kakao authorization code
     * @param redirectUri Redirect URI used in OAuth flow
     * @return LoginResponse with JWT tokens and user info
     */
    @Transactional
    public LoginResponse login(String code, String redirectUri) {
        log.info("Processing Kakao OAuth login");

        // Step 1: Exchange code for Kakao access token
        String kakaoAccessToken = kakaoOAuthService.getAccessToken(code, redirectUri);

        // Step 2: Fetch user info from Kakao
        KakaoUserInfo kakaoUserInfo = kakaoOAuthService.getUserInfo(kakaoAccessToken);

        if (kakaoUserInfo.getEmail() == null) {
            throw new UnauthorizedException(ErrorCode.INVALID_KAKAO_CODE,
                    "Email is required but not provided by Kakao");
        }

        // Step 3: Find or create user
        User user = userRepository.findByKakaoId(kakaoUserInfo.getKakaoId())
                .orElse(null);

        boolean isNewUser = false;

        if (user == null) {
            // New user registration
            user = createNewUser(kakaoUserInfo);
            isNewUser = true;
            log.info("New user registered: {} ({})", user.getEmail(), user.getUserId());
        } else {
            // Existing user - update last login
            user.updateLastLogin();
            userRepository.save(user);
            log.info("Existing user logged in: {} ({})", user.getEmail(), user.getUserId());
        }

        // Step 4: Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getUserId(),
                user.getEmail(),
                user.getKakaoId()
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUserId());

        // Step 5: Store refresh token in Redis
        storeRefreshToken(user.getUserId(), refreshToken);

        // Step 6: Build and return response
        UserProfile profile = userProfileRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Profile not found after user creation"));

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .isNewUser(isNewUser)
                .user(LoginResponse.UserInfo.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .nickname(profile.getNickname())
                        .profileImageUrl(profile.getProfileImageUrl())
                        .build())
                .build();
    }

    /**
     * Create new user with profile and settings
     */
    private User createNewUser(KakaoUserInfo kakaoUserInfo) {
        // Create user entity
        User user = User.builder()
                .kakaoId(kakaoUserInfo.getKakaoId())
                .email(kakaoUserInfo.getEmail())
                .status(User.UserStatus.ACTIVE)
                .lastLoginAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        // Create user profile
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname(kakaoUserInfo.getNickname() != null
                        ? kakaoUserInfo.getNickname()
                        : "User" + user.getUserId())
                .profileImageUrl(kakaoUserInfo.getProfileImageUrl())
                .build();
        userProfileRepository.save(profile);

        // Create user settings with defaults
        UserSetting setting = UserSetting.createDefault(user);
        userSettingRepository.save(setting);

        return user;
    }

    /**
     * Store refresh token in Redis with expiration
     */
    private void storeRefreshToken(Long userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        long expirationSeconds = jwtTokenProvider.getRefreshTokenExpiration() / 1000;

        redisTemplate.opsForValue().set(key, refreshToken, expirationSeconds, TimeUnit.SECONDS);
        log.debug("Stored refresh token for user {} in Redis with TTL {} seconds", userId, expirationSeconds);
    }

    /**
     * Validate refresh token from Redis
     */
    public boolean validateRefreshToken(Long userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        String storedToken = redisTemplate.opsForValue().get(key);

        return storedToken != null && storedToken.equals(refreshToken);
    }

    /**
     * Remove refresh token from Redis (logout)
     */
    public void removeRefreshToken(Long userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.delete(key);
        log.info("Removed refresh token for user {}", userId);
    }

    /**
     * Refresh access token using refresh token
     */
    @Transactional(readOnly = true)
    public LoginResponse refreshAccessToken(String refreshToken) {
        // Validate refresh token format
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Invalid refresh token");
        }

        // Extract user ID from refresh token
        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // Validate refresh token in Redis
        if (!validateRefreshToken(userId, refreshToken)) {
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN,
                    "Refresh token not found or expired");
        }

        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.USER_NOT_FOUND,
                        "User not found"));

        if (!user.isActive()) {
            throw new UnauthorizedException(ErrorCode.INACTIVE_USER, "User account is inactive");
        }

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getUserId(),
                user.getEmail(),
                user.getKakaoId()
        );

        // Get user profile
        UserProfile profile = userProfileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // Return same refresh token
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .isNewUser(false)
                .user(LoginResponse.UserInfo.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .nickname(profile.getNickname())
                        .profileImageUrl(profile.getProfileImageUrl())
                        .build())
                .build();
    }
}
