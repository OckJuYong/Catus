package com.catus.backend.controller;

import com.catus.backend.dto.support.*;
import com.catus.backend.service.SupportMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for support message operations.
 * Provides endpoints for anonymous peer support messaging.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
@Tag(name = "💌 응원 메시지", description = "익명 응원 메시지 송수신 API")
@SecurityRequirement(name = "bearerAuth")
public class SupportMessageController {

    private final SupportMessageService supportMessageService;

    /**
     * GET /api/v1/support/random-diary - Get a random public diary from other users.
     * Excludes the requester's own diaries. Only returns public diaries.
     *
     * @param userId authenticated user ID from JWT token
     * @return RandomDiaryResponse
     */
    @GetMapping("/random-diary")
    @Operation(summary = "랜덤 공개 일기 조회", description = "다른 사용자의 공개 일기 중 하나를 랜덤으로 조회합니다 (본인 일기 제외)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "랜덤 일기 조회 성공",
                    content = @Content(schema = @Schema(implementation = RandomDiaryResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "공개 일기를 찾을 수 없음")
    })
    public ResponseEntity<RandomDiaryResponse> getRandomPublicDiary(
        @AuthenticationPrincipal Long userId
    ) {
        log.info("User {} requesting random public diary", userId);

        RandomDiaryResponse response = supportMessageService.getRandomPublicDiary(userId);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/support/messages - Send anonymous support message to a diary owner.
     * Rate limited to 3 messages per user per day.
     *
     * @param userId  authenticated user ID from JWT token
     * @param request the send message request
     * @return SendSupportMessageResponse
     */
    @PostMapping("/messages")
    @Operation(summary = "응원 메시지 전송", description = "일기 작성자에게 익명 응원 메시지를 전송합니다 (하루 3회 제한)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "응원 메시지 전송 성공",
                    content = @Content(schema = @Schema(implementation = SendSupportMessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 또는 일일 전송 제한 초과"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음")
    })
    public ResponseEntity<SendSupportMessageResponse> sendSupportMessage(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody SendSupportMessageRequest request
    ) {
        log.info("User {} sending support message to diary {}", userId, request.getDiaryId());

        SendSupportMessageResponse response = supportMessageService.sendSupportMessage(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/support/messages/received - Get all support messages received by authenticated user.
     * Paginated response with default page size of 20.
     *
     * @param userId authenticated user ID from JWT token
     * @param page   page number (0-indexed)
     * @param size   page size (default 20, max 100)
     * @return ReceivedMessagesPageResponse
     */
    @GetMapping("/messages/received")
    @Operation(summary = "받은 응원 메시지 조회", description = "받은 응원 메시지 목록을 페이지네이션으로 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "받은 메시지 조회 성공",
                    content = @Content(schema = @Schema(implementation = ReceivedMessagesPageResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<ReceivedMessagesPageResponse> getReceivedMessages(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") @RequestParam(defaultValue = "0") @Min(0) int page,
        @Parameter(description = "페이지 크기 (최대 100)", example = "20") @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        log.info("User {} fetching received messages - page: {}, size: {}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        ReceivedMessagesPageResponse response = supportMessageService.getReceivedMessages(userId, pageable);

        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/support/messages/{messageId}/read - Mark a support message as read.
     * Only the recipient can mark their own messages as read.
     *
     * @param userId    authenticated user ID from JWT token
     * @param messageId the message ID to mark as read
     * @return 204 No Content on success
     */
    @PatchMapping("/messages/{messageId}/read")
    @Operation(summary = "메시지 읽음 처리", description = "받은 응원 메시지를 읽음으로 표시합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "읽음 처리 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "메시지를 찾을 수 없음 또는 접근 권한 없음")
    })
    public ResponseEntity<Void> markMessageAsRead(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "메시지 ID", required = true) @PathVariable Long messageId
    ) {
        log.info("User {} marking message {} as read", userId, messageId);

        supportMessageService.markAsRead(messageId, userId);

        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/support/messages/unread-count - Get count of unread messages.
     *
     * @param userId authenticated user ID from JWT token
     * @return unread count
     */
    @GetMapping("/messages/unread-count")
    @Operation(summary = "읽지 않은 메시지 개수 조회", description = "읽지 않은 응원 메시지의 총 개수를 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "개수 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<Long> getUnreadCount(
        @AuthenticationPrincipal Long userId
    ) {
        log.info("User {} fetching unread message count", userId);

        long count = supportMessageService.getUnreadCount(userId);

        return ResponseEntity.ok(count);
    }

    // ========== Frontend-compatible endpoints ==========

    /**
     * GET /api/v1/support/received - Get received messages (frontend-compatible alias).
     * Alias for /messages/received endpoint.
     */
    @GetMapping("/received")
    @Operation(summary = "받은 응원 메시지 조회 (별칭)", description = "받은 응원 메시지 목록을 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "받은 메시지 조회 성공",
                    content = @Content(schema = @Schema(implementation = ReceivedMessagesPageResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<ReceivedMessagesPageResponse> getReceivedMessagesAlias(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") @RequestParam(defaultValue = "0") @Min(0) int page,
        @Parameter(description = "페이지 크기 (최대 100)", example = "20") @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return getReceivedMessages(userId, page, size);
    }

    /**
     * POST /api/v1/support/send - Send support message (frontend-compatible alias).
     * Alias for /messages endpoint.
     */
    @PostMapping("/send")
    @Operation(summary = "응원 메시지 전송 (별칭)", description = "일기 작성자에게 익명 응원 메시지를 전송합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "응원 메시지 전송 성공",
                    content = @Content(schema = @Schema(implementation = SendSupportMessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 또는 일일 전송 제한 초과"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음")
    })
    public ResponseEntity<SendSupportMessageResponse> sendSupportMessageAlias(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody SendSupportMessageRequest request
    ) {
        return sendSupportMessage(userId, request);
    }

    /**
     * PUT /api/v1/support/{messageId}/read - Mark message as read (frontend-compatible alias).
     * Alias for PATCH /messages/{messageId}/read endpoint.
     */
    @PutMapping("/{messageId}/read")
    @Operation(summary = "메시지 읽음 처리 (별칭)", description = "받은 응원 메시지를 읽음으로 표시합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "읽음 처리 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "메시지를 찾을 수 없음 또는 접근 권한 없음")
    })
    public ResponseEntity<Void> markMessageAsReadAlias(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "메시지 ID", required = true) @PathVariable Long messageId
    ) {
        return markMessageAsRead(userId, messageId);
    }

    /**
     * GET /api/v1/support/sent - Get sent messages (frontend-compatible).
     * Returns messages sent by the authenticated user.
     */
    @GetMapping("/sent")
    @Operation(summary = "보낸 응원 메시지 조회", description = "내가 보낸 응원 메시지 목록을 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "보낸 메시지 조회 성공",
                    content = @Content(schema = @Schema(implementation = ReceivedMessagesPageResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<ReceivedMessagesPageResponse> getSentMessages(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") @RequestParam(defaultValue = "0") @Min(0) int page,
        @Parameter(description = "페이지 크기 (최대 100)", example = "20") @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        log.info("User {} fetching sent messages - page: {}, size: {}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        ReceivedMessagesPageResponse response = supportMessageService.getSentMessages(userId, pageable);

        return ResponseEntity.ok(response);
    }
}
