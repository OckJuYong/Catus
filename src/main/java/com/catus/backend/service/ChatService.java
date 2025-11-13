package com.catus.backend.service;

import com.catus.backend.dto.chat.ChatMessageResponse;
import com.catus.backend.dto.chat.EndConversationRequest;
import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.ChatMessage;
import com.catus.backend.model.EmotionType;
import com.catus.backend.model.User;
import com.catus.backend.repository.ChatMessageRepository;
import com.catus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for chat-related business logic.
 * Handles message sending, conversation history, and AI interaction orchestration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;

    // Number of recent messages to use for conversation context
    private static final int CONTEXT_MESSAGE_LIMIT = 10;

    /**
     * Send a message and get AI response.
     * Includes conversation context from recent messages.
     *
     * @param userId      the user ID
     * @param userMessage the user's message
     * @return response containing the conversation exchange
     * @throws BusinessException if user not found or message processing fails
     */
    @Transactional
    public ChatMessageResponse sendMessage(Long userId, String userMessage) {
        log.debug("Processing message from user {}: {}", userId, userMessage);

        // Validate message length
        if (userMessage == null || userMessage.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_MESSAGE);
        }
        if (userMessage.length() > 500) {
            throw new BusinessException(ErrorCode.MESSAGE_TOO_LONG);
        }

        // Verify user exists and is active
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.INACTIVE_USER);
        }

        // Get recent conversation history for context
        List<ChatMessage> recentMessages = chatMessageRepository.findRecentByUserId(
            userId,
            PageRequest.of(0, CONTEXT_MESSAGE_LIMIT)
        );

        // Detect emotion from user message
        EmotionType detectedEmotion = geminiService.detectEmotion(userMessage);
        log.debug("Detected emotion: {}", detectedEmotion);

        // Generate AI response with context
        String aiResponse = geminiService.generateResponse(userMessage, recentMessages);
        log.debug("Generated AI response: {}", aiResponse);

        // Save chat message
        ChatMessage chatMessage = ChatMessage.builder()
            .user(user)
            .userMessage(userMessage)
            .aiResponse(aiResponse)
            .detectedEmotion(detectedEmotion)
            .build();

        chatMessage = chatMessageRepository.save(chatMessage);
        log.info("Saved chat message {} for user {}", chatMessage.getMessageId(), userId);

        return ChatMessageResponse.from(chatMessage);
    }

    /**
     * Get conversation history for a user.
     * Optionally filter by date.
     *
     * @param userId   the user ID
     * @param date     optional date filter (null for all messages)
     * @param pageable pagination information
     * @return page of chat message responses
     */
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getConversationHistory(Long userId, LocalDate date, Pageable pageable) {
        log.debug("Retrieving conversation history for user {} on date {}", userId, date);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        Page<ChatMessage> messages;

        if (date != null) {
            // Filter by specific date
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

            messages = chatMessageRepository.findByUserIdAndCreatedAtBetween(
                userId,
                startOfDay,
                endOfDay,
                pageable
            );
        } else {
            // Get all messages
            messages = chatMessageRepository.findAllByUserId(userId, pageable);
        }

        return messages.map(ChatMessageResponse::from);
    }

    /**
     * Get recent messages for a user (for context display).
     *
     * @param userId the user ID
     * @param limit  number of recent messages to retrieve
     * @return list of recent chat message responses
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getRecentMessages(Long userId, int limit) {
        log.debug("Retrieving {} recent messages for user {}", limit, userId);

        List<ChatMessage> recentMessages = chatMessageRepository.findRecentByUserId(
            userId,
            PageRequest.of(0, limit)
        );

        return recentMessages.stream()
            .map(ChatMessageResponse::from)
            .collect(Collectors.toList());
    }

    /**
     * Get total message count for a user.
     *
     * @param userId the user ID
     * @return total number of messages
     */
    @Transactional(readOnly = true)
    public long getMessageCount(Long userId) {
        return chatMessageRepository.countByUserUserId(userId);
    }

    /**
     * Get chat history by diary ID (frontend-compatible).
     * Returns messages associated with a specific diary.
     *
     * @param userId  the user ID
     * @param diaryId the diary ID
     * @return list of chat messages for the diary
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatHistoryByDiary(Long userId, Long diaryId) {
        log.debug("Retrieving chat history for user {} and diary {}", userId, diaryId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // TODO: Implement diary-specific chat history retrieval
        // For now, return recent messages as a placeholder
        // In the future, you should:
        // 1. Add diaryId field to ChatMessage entity
        // 2. Add findByUserIdAndDiaryId method to repository
        // 3. Or query by diary's date range

        List<ChatMessage> messages = chatMessageRepository.findRecentByUserId(
            userId,
            PageRequest.of(0, 50)
        );

        return messages.stream()
            .map(ChatMessageResponse::from)
            .collect(Collectors.toList());
    }

    /**
     * End conversation and perform final analysis.
     * This can trigger diary generation or emotion summary.
     *
     * @param userId  the user ID
     * @param request the end conversation request
     */
    @Transactional
    public void endConversation(Long userId, EndConversationRequest request) {
        log.info("Ending conversation for user {}", userId);

        // Verify user exists
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Perform final emotion analysis on the conversation
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            String conversationSummary = String.join(" ", request.getMessages());
            EmotionType overallEmotion = geminiService.detectEmotion(conversationSummary);

            log.info("Overall conversation emotion for user {}: {}", userId, overallEmotion);

            // If a diary ID is provided, you could update the diary with the emotion
            if (request.getDiaryId() != null) {
                log.info("Associating conversation with diary {}", request.getDiaryId());
                // TODO: Update diary with emotion and conversation summary
            }
        }

        log.info("Conversation ended successfully for user {}", userId);
    }
}
