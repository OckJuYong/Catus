package com.catus.backend.service;

import com.catus.backend.dto.notification.NotificationPageResponse;
import com.catus.backend.dto.notification.NotificationResponse;
import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.*;
import com.catus.backend.repository.NotificationRepository;
import com.catus.backend.repository.UserRepository;
import com.catus.backend.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing notifications and integration with FCM
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;
    private final FcmService fcmService;

    /**
     * Create a notification and attempt to send it via FCM
     *
     * @param userId User ID
     * @param type Notification type
     * @param metadata Additional metadata
     * @return Created notification
     */
    @Transactional
    public Notification createNotification(Long userId, NotificationType type, Map<String, Object> metadata) {
        log.info("Creating notification for user {}: type={}", userId, type);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Create notification based on type
        Notification notification;
        switch (type) {
            case DIARY_GENERATED:
                Long diaryId = (Long) metadata.get("diaryId");
                String diaryDate = (String) metadata.get("diaryDate");
                notification = Notification.createDiaryGenerated(user, diaryId, diaryDate);
                break;

            case SUPPORT_RECEIVED:
                Long messageId = (Long) metadata.get("messageId");
                Long diaryIdForSupport = (Long) metadata.get("diaryId");
                String diaryDateForSupport = (String) metadata.get("diaryDate");
                notification = Notification.createSupportReceived(user, messageId, diaryIdForSupport, diaryDateForSupport);
                break;

            case DAILY_REMINDER:
                notification = Notification.createDailyReminder(user);
                break;

            default:
                throw new IllegalArgumentException("Unsupported notification type: " + type);
        }

        // Save notification first
        notification = notificationRepository.save(notification);
        log.info("Notification saved with ID: {}", notification.getNotificationId());

        // Attempt to send via FCM
        sendNotificationToUser(notification);

        return notification;
    }

    /**
     * Send a notification via FCM
     * Does not throw exception if sending fails - logs error and keeps notification unsent
     */
    private void sendNotificationToUser(Notification notification) {
        // Check if FCM is available
        if (!fcmService.isAvailable()) {
            log.warn("FCM is not available. Notification {} will remain unsent.", notification.getNotificationId());
            return;
        }

        // Get user settings to check FCM token and notification preferences
        UserSetting settings = userSettingRepository.findByUser_UserId(notification.getUser().getUserId())
                .orElse(null);

        if (settings == null) {
            log.warn("User settings not found for user {}. Cannot send notification.", notification.getUser().getUserId());
            return;
        }

        // Check if notifications are enabled
        if (!settings.getNotificationEnabled()) {
            log.info("Notifications disabled for user {}. Skipping.", notification.getUser().getUserId());
            return;
        }

        // Check type-specific settings
        if (notification.getType() == NotificationType.DIARY_GENERATED && !settings.getDiaryGenerationEnabled()) {
            log.info("Diary generation notifications disabled for user {}. Skipping.", notification.getUser().getUserId());
            return;
        }

        if (notification.getType() == NotificationType.SUPPORT_RECEIVED && !settings.getSupportMessageEnabled()) {
            log.info("Support message notifications disabled for user {}. Skipping.", notification.getUser().getUserId());
            return;
        }

        // Get FCM token
        String fcmToken = settings.getFcmToken();
        if (fcmToken == null || fcmToken.isEmpty()) {
            log.warn("FCM token not set for user {}. Cannot send notification.", notification.getUser().getUserId());
            return;
        }

        // Prepare data payload
        Map<String, String> data = new HashMap<>();
        data.put("notificationId", notification.getNotificationId().toString());
        data.put("type", notification.getType().toString());

        if (notification.getMetadata() != null) {
            notification.getMetadata().forEach((key, value) ->
                    data.put(key, value != null ? value.toString() : "")
            );
        }

        // Send notification
        try {
            String messageId = fcmService.sendNotification(
                    fcmToken,
                    notification.getTitle(),
                    notification.getContent(),
                    data
            );

            // Mark as sent
            notification.markAsSent();
            notificationRepository.save(notification);

            log.info("Notification {} sent successfully. FCM Message ID: {}", notification.getNotificationId(), messageId);

        } catch (BusinessException e) {
            log.error("Failed to send notification {}: {}", notification.getNotificationId(), e.getMessage());
            // Don't throw exception - notification remains unsent for retry
        } catch (Exception e) {
            log.error("Unexpected error sending notification {}: {}", notification.getNotificationId(), e.getMessage(), e);
        }
    }

    /**
     * Send pending (unsent) notifications
     * Can be called by scheduler for batch processing
     *
     * @return Number of notifications successfully sent
     */
    @Transactional
    public int sendPendingNotifications() {
        if (!fcmService.isAvailable()) {
            log.warn("FCM is not available. Cannot send pending notifications.");
            return 0;
        }

        List<Notification> pendingNotifications = notificationRepository.findByIsSentFalse();
        log.info("Found {} pending notifications to send", pendingNotifications.size());

        if (pendingNotifications.isEmpty()) {
            return 0;
        }

        int successCount = 0;

        // Send in batches of 500 (FCM limit)
        for (int i = 0; i < pendingNotifications.size(); i += 500) {
            int endIndex = Math.min(i + 500, pendingNotifications.size());
            List<Notification> batch = pendingNotifications.subList(i, endIndex);

            List<FcmService.NotificationRequest> requests = new ArrayList<>();

            for (Notification notification : batch) {
                UserSetting settings = userSettingRepository.findByUser_UserId(notification.getUser().getUserId())
                        .orElse(null);

                if (settings == null || settings.getFcmToken() == null || settings.getFcmToken().isEmpty()) {
                    continue;
                }

                if (!settings.getNotificationEnabled()) {
                    continue;
                }

                Map<String, String> data = new HashMap<>();
                data.put("notificationId", notification.getNotificationId().toString());
                data.put("type", notification.getType().toString());

                if (notification.getMetadata() != null) {
                    notification.getMetadata().forEach((key, value) ->
                            data.put(key, value != null ? value.toString() : "")
                    );
                }

                requests.add(FcmService.NotificationRequest.builder()
                        .fcmToken(settings.getFcmToken())
                        .title(notification.getTitle())
                        .body(notification.getContent())
                        .data(data)
                        .build());
            }

            if (requests.isEmpty()) {
                continue;
            }

            try {
                var response = fcmService.sendBatchNotifications(requests);
                if (response != null) {
                    // Mark successfully sent notifications
                    for (int j = 0; j < response.getResponses().size(); j++) {
                        if (response.getResponses().get(j).isSuccessful()) {
                            Notification notification = batch.get(j);
                            notification.markAsSent();
                            notificationRepository.save(notification);
                            successCount++;
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error sending batch notifications: {}", e.getMessage(), e);
            }
        }

        log.info("Successfully sent {} out of {} pending notifications", successCount, pendingNotifications.size());
        return successCount;
    }

    /**
     * Get notification history for a user
     *
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Paginated notification responses
     */
    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationHistory(Long userId, Pageable pageable) {
        log.info("Fetching notification history for user {}: page={}, size={}",
                userId, pageable.getPageNumber(), pageable.getPageSize());

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        Page<Notification> notificationsPage = notificationRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId, pageable);

        Page<NotificationResponse> responsePage = notificationsPage.map(NotificationResponse::from);

        return NotificationPageResponse.from(responsePage);
    }

    /**
     * Update FCM token for a user
     *
     * @param userId User ID
     * @param fcmToken FCM token
     */
    @Transactional
    public void updateFcmToken(Long userId, String fcmToken) {
        log.info("Updating FCM token for user {}", userId);

        UserSetting settings = userSettingRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "User settings not found"));

        settings.updateFcmToken(fcmToken);
        userSettingRepository.save(settings);

        log.info("FCM token updated successfully for user {}", userId);
    }
}
