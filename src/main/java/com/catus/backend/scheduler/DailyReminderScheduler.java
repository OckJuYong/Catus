package com.catus.backend.scheduler;

import com.catus.backend.model.NotificationType;
import com.catus.backend.model.User;
import com.catus.backend.model.UserSetting;
import com.catus.backend.repository.UserRepository;
import com.catus.backend.repository.UserSettingRepository;
import com.catus.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Scheduler for sending daily reminder notifications.
 * Runs every hour to check and send reminders to users based on their preferred reminder time.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyReminderScheduler {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;

    /**
     * Send daily reminders to users at their preferred time.
     * Runs every hour at minute 0 (cron: "0 0 * * * *").
     *
     * This scheduler checks all users and sends reminders to those whose
     * daily_reminder_time matches the current hour.
     *
     * Note: For production, consider using a more sophisticated approach
     * like distributed scheduling or time-window checking to handle
     * server restarts and ensure delivery reliability.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void sendDailyReminders() {
        LocalTime currentTime = LocalTime.now();
        int currentHour = currentTime.getHour();

        log.info("Starting daily reminder check for hour: {}", currentHour);

        try {
            // Find all user settings with daily_reminder_time in current hour
            List<UserSetting> settings = userSettingRepository.findAll();

            int eligibleCount = 0;
            int successCount = 0;
            int skippedCount = 0;

            for (UserSetting setting : settings) {
                // Check if reminder time matches current hour
                if (setting.getDailyReminderTime().getHour() != currentHour) {
                    continue;
                }

                eligibleCount++;

                // Check if notifications are enabled
                if (!setting.getNotificationEnabled()) {
                    log.debug("Notifications disabled for user {}, skipping reminder", setting.getUser().getUserId());
                    skippedCount++;
                    continue;
                }

                // Check if user is active
                User user = setting.getUser();
                if (!user.isActive()) {
                    log.debug("User {} is not active, skipping reminder", user.getUserId());
                    skippedCount++;
                    continue;
                }

                // Check if FCM token is set
                if (setting.getFcmToken() == null || setting.getFcmToken().isEmpty()) {
                    log.debug("No FCM token for user {}, skipping reminder", user.getUserId());
                    skippedCount++;
                    continue;
                }

                try {
                    // Create and send reminder notification
                    Map<String, Object> metadata = new HashMap<>();
                    notificationService.createNotification(
                            user.getUserId(),
                            NotificationType.DAILY_REMINDER,
                            metadata
                    );
                    successCount++;
                    log.info("Daily reminder sent to user {}", user.getUserId());

                } catch (Exception e) {
                    log.error("Failed to send reminder to user {}: {}", user.getUserId(), e.getMessage());
                }
            }

            log.info("Daily reminder check completed for hour {}. " +
                    "Eligible: {}, Sent: {}, Skipped: {}",
                    currentHour, eligibleCount, successCount, skippedCount);

        } catch (Exception e) {
            log.error("Fatal error during daily reminder batch: {}", e.getMessage(), e);
        }
    }

    /**
     * Default reminder at 9 PM for users who haven't set a custom time.
     * This is a fallback scheduled task that runs at 21:00 (9 PM).
     *
     * Note: This is deprecated in favor of the hourly check above,
     * but kept as a backup for default behavior.
     */
    @Scheduled(cron = "0 0 21 * * *")
    public void sendDefaultReminders() {
        log.info("Running default 9 PM reminder check");

        try {
            // Find all active users
            List<User> users = userRepository.findAll();

            int successCount = 0;
            int skippedCount = 0;

            for (User user : users) {
                if (!user.isActive()) {
                    continue;
                }

                UserSetting settings = userSettingRepository.findByUser_UserId(user.getUserId())
                        .orElse(null);

                if (settings == null) {
                    log.debug("No settings found for user {}, skipping", user.getUserId());
                    continue;
                }

                // Only send if reminder time is exactly 21:00 (to avoid duplicates with hourly scheduler)
                if (settings.getDailyReminderTime().getHour() != 21 ||
                        settings.getDailyReminderTime().getMinute() != 0) {
                    continue;
                }

                // Check if notifications are enabled
                if (!settings.getNotificationEnabled()) {
                    skippedCount++;
                    continue;
                }

                // Check if FCM token is set
                if (settings.getFcmToken() == null || settings.getFcmToken().isEmpty()) {
                    skippedCount++;
                    continue;
                }

                try {
                    Map<String, Object> metadata = new HashMap<>();
                    notificationService.createNotification(
                            user.getUserId(),
                            NotificationType.DAILY_REMINDER,
                            metadata
                    );
                    successCount++;
                    log.info("Default reminder sent to user {}", user.getUserId());

                } catch (Exception e) {
                    log.error("Failed to send default reminder to user {}: {}", user.getUserId(), e.getMessage());
                }
            }

            log.info("Default 9 PM reminder check completed. Sent: {}, Skipped: {}",
                    successCount, skippedCount);

        } catch (Exception e) {
            log.error("Fatal error during default reminder batch: {}", e.getMessage(), e);
        }
    }
}
