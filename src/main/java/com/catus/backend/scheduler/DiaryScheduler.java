package com.catus.backend.scheduler;

import com.catus.backend.exception.BusinessException;
import com.catus.backend.model.DiaryGenerationType;
import com.catus.backend.repository.ChatMessageRepository;
import com.catus.backend.repository.DiaryRepository;
import com.catus.backend.service.DiaryGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Scheduler for automatic daily diary generation.
 * Runs every day at 00:10 AM to generate diaries for users who had chat messages yesterday.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DiaryScheduler {

    private final DiaryGenerationService diaryGenerationService;
    private final ChatMessageRepository chatMessageRepository;
    private final DiaryRepository diaryRepository;

    /**
     * Scheduled task to generate daily diaries for all eligible users.
     * Runs at 00:10 AM every day (cron: "0 10 0 * * *").
     *
     * Process:
     * 1. Find all users who had chat messages yesterday
     * 2. For each user, check if diary already exists
     * 3. Generate diary if not exists
     * 4. Handle errors gracefully to ensure batch completion
     * 5. Log summary statistics
     */
    @Scheduled(cron = "0 10 0 * * *")
    public void generateDailyDiaries() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.plusDays(1).atStartOfDay();

        log.info("Starting daily diary generation for date: {}", yesterday);

        try {
            // Find all users who had chat messages yesterday
            List<Long> userIds = chatMessageRepository.findDistinctUserIdsByCreatedAtBetween(
                startOfYesterday, endOfYesterday
            );

            if (userIds.isEmpty()) {
                log.info("No users found with chat messages for date: {}", yesterday);
                return;
            }

            log.info("Found {} users with chat messages", userIds.size());

            // Track success and failure counts
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger failureCount = new AtomicInteger(0);
            AtomicInteger skippedCount = new AtomicInteger(0);

            // Process each user
            userIds.forEach(userId -> {
                try {
                    // Skip if diary already exists
                    if (diaryRepository.existsByUserIdAndDiaryDate(userId, yesterday)) {
                        log.debug("Diary already exists for user: {}, skipping", userId);
                        skippedCount.incrementAndGet();
                        return;
                    }

                    // Generate diary
                    diaryGenerationService.generateDiary(userId, yesterday, DiaryGenerationType.AUTO);
                    successCount.incrementAndGet();
                    log.info("Successfully generated diary for user: {}", userId);

                } catch (BusinessException e) {
                    failureCount.incrementAndGet();
                    log.warn("Failed to generate diary for user {}: {} - {}",
                        userId, e.getErrorCode(), e.getMessage());
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    log.error("Unexpected error generating diary for user {}: {}",
                        userId, e.getMessage(), e);
                }
            });

            // Log summary
            log.info("Daily diary generation completed for date: {}. " +
                    "Total users: {}, Success: {}, Failed: {}, Skipped: {}",
                yesterday, userIds.size(), successCount.get(), failureCount.get(), skippedCount.get());

        } catch (Exception e) {
            log.error("Fatal error during daily diary generation batch: {}", e.getMessage(), e);
        }
    }
}
