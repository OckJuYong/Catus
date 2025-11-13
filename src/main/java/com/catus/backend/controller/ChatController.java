package com.catus.backend.controller;

import com.catus.backend.dto.chat.ChatMessageResponse;
import com.catus.backend.dto.chat.ChatSendRequest;
import com.catus.backend.dto.chat.EndConversationRequest;
import com.catus.backend.dto.chat.SendMessageRequest;
import com.catus.backend.service.ChatService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Chat controller for AI companion (Dali) interaction.
 * Provides endpoints for sending messages and retrieving conversation history.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "💬 채팅", description = "AI 동반자 달리(Dali)와의 대화 API")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {

    private final ChatService chatService;

    /**
     * Send a message to the AI companion and get response
     */
    @PostMapping("/messages")
    @Operation(summary = "메시지 전송", description = "달리(AI 동반자)에게 메시지를 전송하고 응답을 받습니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "메시지 전송 성공",
                    content = @Content(schema = @Schema(implementation = ChatMessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 메시지 (비어있거나 너무 긺)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token"),
            @ApiResponse(responseCode = "503", description = "Gemini API unavailable")
    })
    public ResponseEntity<ChatMessageResponse> sendMessage(
            Authentication authentication,
            @Valid @RequestBody SendMessageRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Chat message request from user {}", userId);

        ChatMessageResponse response = chatService.sendMessage(userId, request.getMessage());

        log.info("Chat message processed successfully for user {}", userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Get conversation history with optional date filtering
     */
    @GetMapping("/messages")
    @Operation(summary = "Get conversation history", description = "Retrieve chat message history with optional date filtering and pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversation history retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<Page<ChatMessageResponse>> getConversationHistory(
            Authentication authentication,
            @Parameter(description = "Filter by specific date (format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (max 100)")
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Get conversation history request for user {} (date: {}, page: {}, size: {})",
                userId, date, page, size);

        // Limit page size to prevent excessive data retrieval
        int safeSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, safeSize);

        Page<ChatMessageResponse> history = chatService.getConversationHistory(userId, date, pageable);

        log.debug("Retrieved {} messages for user {}", history.getNumberOfElements(), userId);

        return ResponseEntity.ok(history);
    }

    /**
     * Get recent messages (for quick context display)
     */
    @GetMapping("/messages/recent")
    @Operation(summary = "Get recent messages", description = "Retrieve the most recent chat messages (max 50)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recent messages retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token")
    })
    public ResponseEntity<List<ChatMessageResponse>> getRecentMessages(
            Authentication authentication,
            @Parameter(description = "Number of recent messages to retrieve (default 10, max 50)")
            @RequestParam(defaultValue = "10") int limit) {
        Long userId = (Long) authentication.getPrincipal();
        log.debug("Get recent messages request for user {} (limit: {})", userId, limit);

        // Limit to reasonable number
        int safeLimit = Math.min(Math.max(limit, 1), 50);

        List<ChatMessageResponse> recentMessages = chatService.getRecentMessages(userId, safeLimit);

        return ResponseEntity.ok(recentMessages);
    }

    /**
     * Get message count for the user
     */
    @GetMapping("/messages/count")
    @Operation(summary = "Get message count", description = "Get total number of messages for the user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Message count retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing token")
    })
    public ResponseEntity<Long> getMessageCount(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        log.debug("Get message count request for user {}", userId);

        long count = chatService.getMessageCount(userId);

        return ResponseEntity.ok(count);
    }

    // ========== Frontend-compatible endpoints ==========

    /**
     * Send message endpoint (frontend-compatible with "content" field)
     * Alternative to /messages endpoint for frontend compatibility
     */
    @PostMapping("/send")
    @Operation(summary = "메시지 전송 (프론트 호환)", description = "달리에게 메시지를 전송합니다 (content 필드 사용)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "메시지 전송 성공",
                    content = @Content(schema = @Schema(implementation = ChatMessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 메시지"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "503", description = "Gemini API unavailable")
    })
    public ResponseEntity<ChatMessageResponse> sendMessageViaContent(
            Authentication authentication,
            @Valid @RequestBody ChatSendRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Chat message request from user {} via /send", userId);

        // Convert content to message and use existing service
        ChatMessageResponse response = chatService.sendMessage(userId, request.getContent());

        log.info("Chat message processed successfully for user {}", userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Get chat history by diary ID (frontend-compatible)
     */
    @GetMapping("/history/{diaryId}")
    @Operation(summary = "다이어리별 채팅 기록 조회", description = "특정 다이어리의 채팅 기록을 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "채팅 기록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Diary not found")
    })
    public ResponseEntity<List<ChatMessageResponse>> getChatHistoryByDiary(
            Authentication authentication,
            @Parameter(description = "다이어리 ID", required = true)
            @PathVariable Long diaryId) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("Get chat history by diary {} for user {}", diaryId, userId);

        // Get chat messages for specific diary
        List<ChatMessageResponse> history = chatService.getChatHistoryByDiary(userId, diaryId);

        return ResponseEntity.ok(history);
    }

    /**
     * End conversation and perform final analysis
     */
    @PostMapping("/end")
    @Operation(summary = "대화 종료", description = "대화를 종료하고 최종 감정 분석을 수행합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "대화 종료 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> endConversation(
            Authentication authentication,
            @Valid @RequestBody EndConversationRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        log.info("End conversation request from user {}", userId);

        // Process end of conversation (emotion analysis, diary generation, etc.)
        chatService.endConversation(userId, request);

        log.info("Conversation ended successfully for user {}", userId);

        return ResponseEntity.ok().build();
    }
}
