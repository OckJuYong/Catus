package com.catus.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Kakao OAuth login
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Login request with Kakao authorization code")
public class LoginRequest {

    @NotBlank(message = "Authorization code is required")
    @Schema(description = "Kakao OAuth authorization code", example = "abcdef123456", required = true)
    private String code;

    @Schema(description = "Redirect URI used in OAuth flow", example = "http://localhost:8080/api/v1/auth/callback")
    private String redirectUri;
}
