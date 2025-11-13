package com.catus.backend.controller;

import com.catus.backend.dto.LoginRequest;
import com.catus.backend.dto.LoginResponse;
import com.catus.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for Kakao OAuth login and token management.
 * Provides endpoints for user authentication and token refresh.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "🔐 인증", description = "카카오 로그인 및 JWT 토큰 관리 API")
public class AuthController {

    private final AuthService authService;

    /**
     * Kakao OAuth login endpoint (primary endpoint for frontend)
     * Exchanges Kakao authorization code for JWT tokens
     */
    @PostMapping("/kakao")
    @Operation(summary = "카카오 로그인", description = "카카오 인증 코드를 JWT 액세스 토큰과 리프레시 토큰으로 교환합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그인 성공",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터"),
            @ApiResponse(responseCode = "401", description = "유효하지 않거나 만료된 카카오 인증 코드"),
            @ApiResponse(responseCode = "503", description = "카카오 API 통신 오류")
    })
    public ResponseEntity<LoginResponse> kakaoLogin(@Valid @RequestBody LoginRequest request) {
        log.info("Kakao login request received");

        LoginResponse response = authService.login(request.getCode(), request.getRedirectUri());

        log.info("Login successful for user: {} (new user: {})",
                response.getUser().getEmail(), response.isNewUser());

        return ResponseEntity.ok(response);
    }

    /**
     * Generic login endpoint (legacy, redirects to kakao login)
     * @deprecated Use /kakao endpoint instead
     */
    @PostMapping("/login")
    @Operation(summary = "로그인 (레거시)", description = "카카오 로그인으로 리다이렉트됩니다")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return kakaoLogin(request);
    }

    /**
     * Refresh access token using refresh token
     */
    @PostMapping("/refresh")
    @Operation(summary = "액세스 토큰 갱신", description = "리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "토큰 갱신 성공",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "401", description = "유효하지 않거나 만료된 리프레시 토큰")
    })
    public ResponseEntity<LoginResponse> refreshToken(
            @RequestHeader("Authorization") String authHeader) {
        log.info("Token refresh request received");

        // Extract refresh token from Authorization header
        String refreshToken = authHeader.replace("Bearer ", "");

        LoginResponse response = authService.refreshAccessToken(refreshToken);

        log.info("Token refreshed successfully for user: {}", response.getUser().getUserId());

        return ResponseEntity.ok(response);
    }

    /**
     * Logout endpoint - removes refresh token from Redis
     */
    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "리프레시 토큰을 무효화하고 사용자를 로그아웃합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<Void> logout(org.springframework.security.core.Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Logout request received for user {}", userId);

        // Remove refresh token from Redis
        authService.removeRefreshToken(userId);

        log.info("Logout successful for user {}", userId);

        return ResponseEntity.ok().build();
    }
}
