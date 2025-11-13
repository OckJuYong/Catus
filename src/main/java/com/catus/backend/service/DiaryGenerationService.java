package com.catus.backend.service;

import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.ChatMessage;
import com.catus.backend.model.Diary;
import com.catus.backend.model.DiaryGenerationType;
import com.catus.backend.model.EmotionType;
import com.catus.backend.model.User;
import com.catus.backend.repository.ChatMessageRepository;
import com.catus.backend.repository.DiaryRepository;
import com.catus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for generating daily diaries from chat messages.
 * Analyzes emotions, creates AI summaries, and generates images.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiaryGenerationService {

    private final DiaryRepository diaryRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final DalleService dalleService;
    private final S3Service s3Service;
    private final NotificationService notificationService;

    /**
     * Generate diary for a specific user and date.
     * This is the main entry point for diary generation.
     *
     * @param userId the user ID
     * @param date   the date to generate diary for
     * @param generationType AUTO or MANUAL
     * @return the generated Diary entity
     * @throws BusinessException if diary already exists or no chat messages available
     */
    @Transactional
    public Diary generateDiary(Long userId, LocalDate date, DiaryGenerationType generationType) {
        log.info("Generating diary for user {} on date {}", userId, date);

        // 1. Validate user exists
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. Get chat messages for the specified date
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<ChatMessage> messages = chatMessageRepository.findByUserIdAndCreatedAtBetween(
            userId, startOfDay, endOfDay, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        if (messages.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_CHAT_MESSAGES_FOR_DIARY,
                "No chat messages found for date: " + date);
        }

        log.info("Found {} chat messages for diary generation", messages.size());

        try {
            // 4. Analyze emotions and determine dominant emotion
            EmotionType dominantEmotion = analyzeDominantEmotion(messages);
            log.info("Dominant emotion detected: {}", dominantEmotion);

            // 5. Generate summary using Gemini
            String summary = geminiService.generateDiarySummary(messages);
            log.info("Generated summary: {}", summary);

            // 6. Generate image using DALL-E
            String dalleImageUrl = dalleService.generateDiaryImage(dominantEmotion, summary);
            log.info("Generated DALL-E image: {}", dalleImageUrl);

            // 7. Upload image to S3
            String s3ImageUrl = s3Service.uploadFromUrl(dalleImageUrl, userId, "diaries");
            log.info("Uploaded image to S3: {}", s3ImageUrl);

            // 8. Create and save diary
            Diary diary = Diary.builder()
                .user(user)
                .diaryDate(date)
                .emotion(dominantEmotion)
                .summary(summary)
                .imageUrl(s3ImageUrl)
                .isPublic(false)
                .generationType(generationType)
                .build();

            Diary savedDiary;
            try {
                savedDiary = diaryRepository.save(diary);
                log.info("Successfully generated diary with ID: {}", savedDiary.getDiaryId());
            } catch (DataIntegrityViolationException e) {
                // Handle race condition: another thread/request created diary for same user+date
                if (e.getMessage() != null &&
                    (e.getMessage().contains("uk_diary_user_date") ||
                     e.getMessage().contains("diary_user_id_diary_date_key"))) {
                    log.warn("Diary already exists for user {} on date {} (race condition detected)", userId, date);
                    throw new BusinessException(ErrorCode.DIARY_ALREADY_EXISTS,
                        String.format("Diary already exists for date: %s", date));
                }
                throw e;
            }

            // 9. Send notification to user
            try {
                Map<String, Object> notificationMetadata = new HashMap<>();
                notificationMetadata.put("diaryId", savedDiary.getDiaryId());
                notificationMetadata.put("diaryDate", date.toString());
                notificationService.createNotification(userId,
                    com.catus.backend.model.NotificationType.DIARY_GENERATED,
                    notificationMetadata);
                log.info("Diary generation notification sent to user {}", userId);
            } catch (Exception e) {
                log.error("Failed to send diary generation notification to user {}: {}",
                    userId, e.getMessage());
                // Don't fail diary generation if notification fails
            }

            return savedDiary;

        } catch (BusinessException e) {
            log.error("Business exception during diary generation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during diary generation", e);
            throw new BusinessException(ErrorCode.DIARY_GENERATION_FAILED,
                "Failed to generate diary: " + e.getMessage());
        }
    }

    /**
     * Analyze chat messages to determine the dominant emotion for the day.
     * Uses a simple voting mechanism based on detected emotions.
     *
     * @param messages list of chat messages
     * @return the dominant emotion type
     */
    private EmotionType analyzeDominantEmotion(List<ChatMessage> messages) {
        Map<EmotionType, Integer> emotionCounts = new HashMap<>();

        // Count occurrences of each emotion
        for (ChatMessage message : messages) {
            EmotionType emotion = message.getDetectedEmotion();
            if (emotion != null) {
                emotionCounts.put(emotion, emotionCounts.getOrDefault(emotion, 0) + 1);
            }
        }

        // Remove NORMAL from consideration if there are other emotions
        if (emotionCounts.size() > 1 && emotionCounts.containsKey(EmotionType.NORMAL)) {
            emotionCounts.remove(EmotionType.NORMAL);
        }

        // Find emotion with highest count
        EmotionType dominantEmotion = emotionCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(EmotionType.NORMAL);

        log.debug("Emotion distribution: {}", emotionCounts);
        return dominantEmotion;
    }

    /**
     * Check if diary can be generated for a specific date.
     *
     * @param userId the user ID
     * @param date   the date to check
     * @return true if diary can be generated, false otherwise
     */
    public boolean canGenerateDiary(Long userId, LocalDate date) {
        // Check if diary already exists
        if (diaryRepository.existsByUserIdAndDiaryDate(userId, date)) {
            return false;
        }

        // Check if there are chat messages for the date
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        long messageCount = chatMessageRepository.findByUserIdAndCreatedAtBetween(
            userId, startOfDay, endOfDay, org.springframework.data.domain.Pageable.unpaged()
        ).getTotalElements();

        return messageCount > 0;
    }
}
