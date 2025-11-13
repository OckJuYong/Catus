package com.catus.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for successful login
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Login response with JWT tokens and user information")
public class LoginResponse {

    @Schema(description = "JWT access token (24h expiration)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "JWT refresh token (7d expiration)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "Token type", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Access token expiration time in milliseconds", example = "86400000")
    private Long expiresIn;

    @Schema(description = "User information")
    private UserInfo user;

    @Schema(description = "Whether this is a new user registration", example = "false")
    private boolean isNewUser;

    /**
     * Nested user information DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "User information")
    public static class UserInfo {
        @Schema(description = "User ID", example = "123")
        private Long userId;

        @Schema(description = "Email address", example = "user@example.com")
        private String email;

        @Schema(description = "Nickname", example = "John Doe")
        private String nickname;

        @Schema(description = "Profile image URL", example = "https://catus-diary-images.s3.amazonaws.com/profiles/123/profile.jpg")
        private String profileImageUrl;
    }
}
