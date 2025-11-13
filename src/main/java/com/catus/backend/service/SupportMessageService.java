package com.catus.backend.service;

import com.catus.backend.dto.support.*;
import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.Diary;
import com.catus.backend.model.SupportMessage;
import com.catus.backend.model.User;
import com.catus.backend.model.UserProfile;
import com.catus.backend.repository.DiaryRepository;
import com.catus.backend.repository.SupportMessageRepository;
import com.catus.backend.repository.UserProfileRepository;
import com.catus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Service for support message operations.
 * Handles anonymous peer support messaging with rate limiting and content filtering.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupportMessageService {

    private final SupportMessageRepository supportMessageRepository;
    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final NotificationService notificationService;

    // Korean profanity keywords for basic filtering
    private static final Set<String> PROFANITY_KEYWORDS = new HashSet<>(Arrays.asList(
        "욕설", "비속어", "시발", "씨발", "개새", "병신", "미친", "지랄", "니미",
        "좆", "존나", "개같", "ㅅㅂ", "ㅂㅅ", "ㄱㅅ", "ㅈㄹ", "fuck", "shit", "damn"
    ));

    private static final int MAX_MESSAGES_PER_DAY = 3;
    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:support_message:";

    /**
     * Get a random public diary from other users.
     * Excludes the requester's own diaries.
     *
     * @param currentUserId the authenticated user ID
     * @return RandomDiaryResponse
     */
    @Transactional(readOnly = true)
    public RandomDiaryResponse getRandomPublicDiary(Long currentUserId) {
        log.info("Fetching random public diary excluding user {}", currentUserId);

        List<Diary> publicDiaries = diaryRepository.findPublicDiariesRandomly(100);

        // Filter out current user's diaries
        List<Diary> filteredDiaries = publicDiaries.stream()
            .filter(diary -> !diary.getUserId().equals(currentUserId))
            .toList();

        if (filteredDiaries.isEmpty()) {
            log.warn("No public diaries available for user {}", currentUserId);
            throw new BusinessException(ErrorCode.DIARY_NOT_FOUND);
        }

        // Return the first one (already random from query)
        Diary randomDiary = filteredDiaries.get(0);

        return RandomDiaryResponse.builder()
            .diaryId(randomDiary.getDiaryId())
            .userId(randomDiary.getUserId())
            .diaryDate(randomDiary.getDiaryDate())
            .emotion(randomDiary.getEmotion())
            .summary(randomDiary.getSummary())
            .imageUrl(randomDiary.getImageUrl())
            .build();
    }

    /**
     * Send a support message to a diary owner.
     * Validates rate limits, content, and diary accessibility.
     *
     * @param senderId the sender user ID (authenticated user)
     * @param request  the send message request
     * @return SendSupportMessageResponse
     */
    @Transactional
    public SendSupportMessageResponse sendSupportMessage(Long senderId, SendSupportMessageRequest request) {
        log.info("User {} sending support message to diary {}", senderId, request.getDiaryId());

        // 1. Check rate limit
        checkRateLimit(senderId);

        // 2. Validate content length
        if (request.getContent() == null || request.getContent().trim().isEmpty()
            || request.getContent().length() > 500) {
            throw new BusinessException(ErrorCode.INVALID_CONTENT_LENGTH);
        }

        // 3. Filter profanity
        boolean isFiltered = filterProfanity(request.getContent());
        if (isFiltered) {
            log.warn("Profanity detected in message from user {}", senderId);
            throw new BusinessException(ErrorCode.INAPPROPRIATE_CONTENT);
        }

        // 4. Find and validate diary
        Diary diary = diaryRepository.findById(request.getDiaryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND));

        // 5. Check if diary is public
        if (!diary.getIsPublic()) {
            throw new BusinessException(ErrorCode.DIARY_NOT_PUBLIC);
        }

        // 6. Check if sender is trying to support their own diary
        if (diary.getUserId().equals(senderId)) {
            throw new BusinessException(ErrorCode.CANNOT_SUPPORT_OWN_DIARY);
        }

        // 7. Get recipient user
        User recipient = userRepository.findById(diary.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 8. Create and save support message
        SupportMessage message = SupportMessage.builder()
            .diary(diary)
            .sender(request.getIsAnonymous() ? null : userRepository.findById(senderId).orElse(null))
            .recipient(recipient)
            .content(request.getContent().trim())
            .isFiltered(false)
            .isRead(false)
            .build();

        SupportMessage savedMessage = supportMessageRepository.save(message);

        // 9. Increment rate limit counter
        incrementRateLimitCounter(senderId);

        log.info("Support message {} created successfully", savedMessage.getMessageId());

        // 10. Send notification to recipient
        try {
            java.util.Map<String, Object> notificationMetadata = new java.util.HashMap<>();
            notificationMetadata.put("messageId", savedMessage.getMessageId());
            notificationMetadata.put("diaryId", diary.getDiaryId());
            notificationMetadata.put("diaryDate", diary.getDiaryDate().toString());
            notificationService.createNotification(recipient.getUserId(),
                com.catus.backend.model.NotificationType.SUPPORT_RECEIVED,
                notificationMetadata);
            log.info("Support message notification sent to user {}", recipient.getUserId());
        } catch (Exception e) {
            log.error("Failed to send support message notification to user {}: {}",
                recipient.getUserId(), e.getMessage());
            // Don't fail message sending if notification fails
        }

        return SendSupportMessageResponse.builder()
            .messageId(savedMessage.getMessageId())
            .recipientId(recipient.getUserId())
            .content(savedMessage.getContent())
            .createdAt(savedMessage.getCreatedAt())
            .build();
    }

    /**
     * Get all support messages received by the authenticated user.
     *
     * @param userId   the authenticated user ID
     * @param pageable pagination information
     * @return ReceivedMessagesPageResponse
     */
    @Transactional(readOnly = true)
    public ReceivedMessagesPageResponse getReceivedMessages(Long userId, Pageable pageable) {
        log.info("Fetching received messages for user {}, page {}", userId, pageable.getPageNumber());

        Page<SupportMessage> messagePage = supportMessageRepository
            .findByRecipientIdOrderByCreatedAtDesc(userId, pageable);

        List<ReceivedSupportMessageResponse> messageResponses = messagePage.getContent().stream()
            .map(this::toReceivedMessageResponse)
            .collect(Collectors.toList());

        return ReceivedMessagesPageResponse.builder()
            .messages(messageResponses)
            .totalElements(messagePage.getTotalElements())
            .totalPages(messagePage.getTotalPages())
            .currentPage(messagePage.getNumber())
            .pageSize(messagePage.getSize())
            .build();
    }

    /**
     * Get all support messages sent by the authenticated user (frontend-compatible).
     *
     * @param userId   the authenticated user ID (sender)
     * @param pageable pagination information
     * @return ReceivedMessagesPageResponse (reusing same structure for sent messages)
     */
    @Transactional(readOnly = true)
    public ReceivedMessagesPageResponse getSentMessages(Long userId, Pageable pageable) {
        log.info("Fetching sent messages for user {}, page {}", userId, pageable.getPageNumber());

        // Find messages where sender is the current user
        Page<SupportMessage> messagePage = supportMessageRepository
            .findBySenderIdOrderByCreatedAtDesc(userId, pageable);

        List<ReceivedSupportMessageResponse> messageResponses = messagePage.getContent().stream()
            .map(this::toSentMessageResponse)
            .collect(Collectors.toList());

        return ReceivedMessagesPageResponse.builder()
            .messages(messageResponses)
            .totalElements(messagePage.getTotalElements())
            .totalPages(messagePage.getTotalPages())
            .currentPage(messagePage.getNumber())
            .pageSize(messagePage.getSize())
            .build();
    }

    /**
     * Mark a support message as read.
     *
     * @param messageId the message ID
     * @param userId    the authenticated user ID (must be recipient)
     */
    @Transactional
    public void markAsRead(Long messageId, Long userId) {
        log.info("Marking message {} as read by user {}", messageId, userId);

        SupportMessage message = supportMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SUPPORT_MESSAGE_NOT_FOUND));

        // Verify user is the recipient
        if (!message.getRecipientId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        message.markAsRead();
        supportMessageRepository.save(message);
    }

    /**
     * Get count of unread messages for a user.
     *
     * @param userId the user ID
     * @return count of unread messages
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return supportMessageRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /**
     * Check rate limit for support messages (max 3 per day).
     *
     * @param userId the user ID
     */
    private void checkRateLimit(Long userId) {
        String key = RATE_LIMIT_KEY_PREFIX + userId + ":" + LocalDate.now();
        String countStr = redisTemplate.opsForValue().get(key);

        int count = countStr != null ? Integer.parseInt(countStr) : 0;

        if (count >= MAX_MESSAGES_PER_DAY) {
            log.warn("Rate limit exceeded for user {}: {} messages sent today", userId, count);
            throw new BusinessException(ErrorCode.SUPPORT_MESSAGE_LIMIT_EXCEEDED);
        }
    }

    /**
     * Increment rate limit counter in Redis.
     *
     * @param userId the user ID
     */
    private void incrementRateLimitCounter(Long userId) {
        String key = RATE_LIMIT_KEY_PREFIX + userId + ":" + LocalDate.now();
        Long newCount = redisTemplate.opsForValue().increment(key);

        // Set expiration to end of day (24 hours from now)
        if (newCount != null && newCount == 1) {
            redisTemplate.expire(key, 24, TimeUnit.HOURS);
        }

        log.debug("User {} message count: {}", userId, newCount);
    }

    /**
     * Basic profanity filter for Korean content.
     *
     * @param content the message content
     * @return true if profanity detected, false otherwise
     */
    private boolean filterProfanity(String content) {
        if (content == null || content.isEmpty()) {
            return false;
        }

        String lowerContent = content.toLowerCase();

        return PROFANITY_KEYWORDS.stream()
            .anyMatch(lowerContent::contains);
    }

    /**
     * Convert SupportMessage entity to ReceivedSupportMessageResponse DTO.
     *
     * @param message the support message
     * @return ReceivedSupportMessageResponse
     */
    private ReceivedSupportMessageResponse toReceivedMessageResponse(SupportMessage message) {
        String senderNickname = "익명"; // Default to anonymous

        // If not anonymous, get sender nickname
        if (!message.isAnonymous() && message.getSender() != null) {
            Long senderId = message.getSenderId();
            UserProfile senderProfile = userProfileRepository.findByUser_UserId(senderId).orElse(null);
            if (senderProfile != null && senderProfile.getNickname() != null) {
                senderNickname = senderProfile.getNickname();
            }
        }

        return ReceivedSupportMessageResponse.builder()
            .messageId(message.getMessageId())
            .diaryId(message.getDiaryId())
            .diaryDate(message.getDiary().getDiaryDate())
            .senderNickname(senderNickname)
            .content(message.getContent())
            .isRead(message.getIsRead())
            .createdAt(message.getCreatedAt())
            .build();
    }

    /**
     * Convert SupportMessage entity to response DTO for sent messages.
     *
     * @param message the support message
     * @return ReceivedSupportMessageResponse
     */
    private ReceivedSupportMessageResponse toSentMessageResponse(SupportMessage message) {
        // For sent messages, show recipient nickname instead of sender
        String recipientNickname = "익명";

        if (message.getRecipient() != null) {
            Long recipientId = message.getRecipientId();
            UserProfile recipientProfile = userProfileRepository.findByUser_UserId(recipientId).orElse(null);
            if (recipientProfile != null && recipientProfile.getNickname() != null) {
                recipientNickname = recipientProfile.getNickname();
            }
        }

        return ReceivedSupportMessageResponse.builder()
            .messageId(message.getMessageId())
            .diaryId(message.getDiaryId())
            .diaryDate(message.getDiary().getDiaryDate())
            .senderNickname(recipientNickname)  // Using senderNickname field to show recipient
            .content(message.getContent())
            .isRead(message.getIsRead())
            .createdAt(message.getCreatedAt())
            .build();
    }
}
