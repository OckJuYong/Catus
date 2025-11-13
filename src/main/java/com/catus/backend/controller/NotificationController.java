package com.catus.backend.controller;

import com.catus.backend.dto.notification.NotificationPageResponse;
import com.catus.backend.dto.notification.RegisterFcmTokenRequest;
import com.catus.backend.service.NotificationService;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Notification controller for managing push notifications.
 * Provides endpoints for FCM token registration and notification history.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "🔔 알림", description = "푸시 알림 관리 API")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Register FCM token for push notifications
     */
    @PostMapping("/settings/fcm-token")
    @Operation(summary = "FCM 토큰 등록", description = "푸시 알림을 위한 Firebase Cloud Messaging 토큰을 등록 또는 업데이트합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "FCM 토큰 등록 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 FCM 토큰 형식"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    public ResponseEntity<Void> registerFcmToken(
            Authentication authentication,
            @Valid @RequestBody RegisterFcmTokenRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Register FCM token request for user {}", userId);

        notificationService.updateFcmToken(userId, request.getFcmToken());

        log.info("FCM token registered successfully for user {}", userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get notification history
     */
    @GetMapping("/notifications")
    @Operation(summary = "알림 내역 조회", description = "사용자의 알림 내역을 페이지네이션으로 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "알림 내역 조회 성공",
                    content = @Content(schema = @Schema(implementation = NotificationPageResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    public ResponseEntity<NotificationPageResponse> getNotifications(
            Authentication authentication,
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기 (최대 100)", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Get notifications request for user {}: page={}, size={}", userId, page, size);

        // Limit max page size to 100
        size = Math.min(size, 100);

        Pageable pageable = PageRequest.of(page, size);
        NotificationPageResponse response = notificationService.getNotificationHistory(userId, pageable);

        log.info("Retrieved {} notifications for user {}", response.getNotifications().size(), userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark notification as read (optional feature for future implementation)
     */
    @PatchMapping("/notifications/{notificationId}/read")
    @Operation(summary = "알림 읽음 처리", description = "특정 알림을 읽음으로 표시합니다 (향후 구현 예정)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "알림 읽음 처리 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "알림을 찾을 수 없음")
    })
    public ResponseEntity<Void> markAsRead(
            Authentication authentication,
            @Parameter(description = "알림 ID", required = true)
            @PathVariable Long notificationId) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Mark notification {} as read for user {}", notificationId, userId);

        // TODO: Implement mark as read functionality
        // For now, just return 204 to allow API exploration
        log.warn("Mark as read feature not yet implemented");

        return ResponseEntity.noContent().build();
    }
}
