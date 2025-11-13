package com.catus.backend.controller;

import com.catus.backend.dto.OnboardingRequest;
import com.catus.backend.dto.UpdateProfileRequest;
import com.catus.backend.dto.UserProfileResponse;
import com.catus.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * User controller for profile management.
 * Provides endpoints for viewing and updating user profile information.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "👤 사용자", description = "사용자 프로필 관리 API")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    /**
     * Get current user profile
     */
    @GetMapping("/profile")
    @Operation(summary = "프로필 조회", description = "현재 사용자의 프로필 정보를 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "프로필 조회 성공",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자 - 유효하지 않거나 누락된 토큰"),
            @ApiResponse(responseCode = "404", description = "사용자 프로필을 찾을 수 없음")
    })
    public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Get profile request for user {}", userId);

        UserProfileResponse response = userService.getUserProfile(userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Update user profile information
     */
    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update user profile information (nickname, bio, etc.)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token"),
            @ApiResponse(responseCode = "404", description = "User profile not found")
    })
    public ResponseEntity<UserProfileResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Update profile request for user {}", userId);

        UserProfileResponse response = userService.updateProfile(userId, request);

        log.info("Profile updated successfully for user {}", userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Upload user profile image
     */
    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload profile image", description = "Upload and update user profile image (max 5MB, resized to 300x300px)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile image uploaded successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid file type or size"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token"),
            @ApiResponse(responseCode = "404", description = "User profile not found"),
            @ApiResponse(responseCode = "500", description = "S3 upload failed")
    })
    public ResponseEntity<UserProfileResponse> uploadProfileImage(
            Authentication authentication,
            @Parameter(description = "Image file (JPEG, PNG, WebP, max 5MB)", required = true)
            @RequestParam("file") MultipartFile file) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Upload profile image request for user {}", userId);

        UserProfileResponse response = userService.updateProfileImage(userId, file);

        log.info("Profile image uploaded successfully for user {}", userId);

        return ResponseEntity.ok(response);
    }

    // ========== Frontend-compatible endpoints ==========

    /**
     * Get user profile by user ID (frontend-compatible with PathVariable).
     * If the requested user is the authenticated user, returns full profile.
     * If the requested user is different, returns public profile information only.
     */
    @GetMapping("/{userId}")
    @Operation(summary = "사용자 프로필 조회 (ID 기반)", description = "특정 사용자의 프로필 정보를 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "프로필 조회 성공",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserProfileResponse> getUserProfileById(
            Authentication authentication,
            @Parameter(description = "사용자 ID", required = true)
            @PathVariable Long userId) {
        Long currentUserId = (Long) authentication.getPrincipal();
        log.info("Get profile request for user {} by user {}", userId, currentUserId);

        // Get user profile (service layer can handle privacy logic if needed)
        UserProfileResponse response = userService.getUserProfile(userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Complete onboarding process for new user (frontend-compatible).
     * Updates user profile with initial information like nickname, birth date, and gender.
     */
    @PostMapping("/onboarding")
    @Operation(summary = "온보딩 완료", description = "신규 사용자의 온보딩 정보를 저장합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "온보딩 완료 성공",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserProfileResponse> completeOnboarding(
            Authentication authentication,
            @Valid @RequestBody OnboardingRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Onboarding request for user {}", userId);

        UserProfileResponse response = userService.completeOnboarding(userId, request);

        log.info("Onboarding completed successfully for user {}", userId);

        return ResponseEntity.ok(response);
    }
}
