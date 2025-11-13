package com.catus.backend.service;

import com.catus.backend.exception.ErrorCode;
import com.catus.backend.exception.BusinessException;
import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service for sending Firebase Cloud Messaging (FCM) push notifications
 */
@Slf4j
@Service
public class FcmService {

    private final FirebaseMessaging firebaseMessaging;

    public FcmService(@Autowired(required = false) FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
        if (firebaseMessaging == null) {
            log.warn("FcmService initialized without FirebaseMessaging - notifications will be disabled");
        }
    }

    /**
     * Send a push notification to a single device
     *
     * @param fcmToken Device FCM token
     * @param title Notification title
     * @param body Notification body
     * @param data Additional data payload
     * @return Message ID if successful
     * @throws BusinessException if FCM is not available or send fails
     */
    public String sendNotification(String fcmToken, String title, String body, Map<String, String> data) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging is not initialized. Cannot send notification to token: {}", maskToken(fcmToken));
            throw new BusinessException(ErrorCode.FCM_SEND_FAILED, "Firebase not initialized");
        }

        if (fcmToken == null || fcmToken.isEmpty()) {
            log.warn("FCM token is empty. Cannot send notification.");
            throw new BusinessException(ErrorCode.FCM_TOKEN_INVALID, "FCM token is empty");
        }

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .build())
                    .setApnsConfig(ApnsConfig.builder()
                            .setAps(Aps.builder()
                                    .setSound("default")
                                    .build())
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            String messageId = firebaseMessaging.send(message);

            log.info("Successfully sent notification. Message ID: {}", messageId);
            return messageId;

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send FCM notification to token {}: {} - {}",
                    maskToken(fcmToken), e.getMessagingErrorCode(), e.getMessage());

            // Check if token is invalid/unregistered
            MessagingErrorCode errorCode = e.getMessagingErrorCode();
            if (errorCode == MessagingErrorCode.INVALID_ARGUMENT
                    || errorCode == MessagingErrorCode.UNREGISTERED) {
                throw new BusinessException(ErrorCode.FCM_TOKEN_INVALID, "Invalid or unregistered FCM token");
            }

            throw new BusinessException(ErrorCode.FCM_SEND_FAILED, "Failed to send push notification: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending FCM notification: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.FCM_SEND_FAILED, "Unexpected error sending push notification");
        }
    }

    /**
     * Send batch notifications (up to 500 messages per call)
     *
     * @param notifications List of notification requests
     * @return BatchResponse with success/failure details
     */
    public BatchResponse sendBatchNotifications(List<NotificationRequest> notifications) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging is not initialized. Cannot send batch notifications.");
            throw new BusinessException(ErrorCode.FCM_SEND_FAILED, "Firebase not initialized");
        }

        if (notifications == null || notifications.isEmpty()) {
            log.warn("No notifications to send in batch");
            return null;
        }

        // FCM batch limit is 500 messages
        if (notifications.size() > 500) {
            log.warn("Batch size {} exceeds FCM limit of 500. Processing first 500 only.", notifications.size());
            notifications = notifications.subList(0, 500);
        }

        List<Message> messages = new ArrayList<>();
        for (NotificationRequest request : notifications) {
            if (request.getFcmToken() == null || request.getFcmToken().isEmpty()) {
                log.warn("Skipping notification with empty FCM token");
                continue;
            }

            Message.Builder messageBuilder = Message.builder()
                    .setToken(request.getFcmToken())
                    .setNotification(Notification.builder()
                            .setTitle(request.getTitle())
                            .setBody(request.getBody())
                            .build())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .build())
                    .setApnsConfig(ApnsConfig.builder()
                            .setAps(Aps.builder()
                                    .setSound("default")
                                    .build())
                            .build());

            if (request.getData() != null && !request.getData().isEmpty()) {
                messageBuilder.putAllData(request.getData());
            }

            messages.add(messageBuilder.build());
        }

        if (messages.isEmpty()) {
            log.warn("No valid messages to send in batch");
            return null;
        }

        try {
            BatchResponse response = firebaseMessaging.sendAll(messages);
            log.info("Batch notification sent. Success: {}, Failure: {}",
                    response.getSuccessCount(), response.getFailureCount());

            // Log individual failures
            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        log.warn("Failed to send notification {}: {}",
                                i, responses.get(i).getException().getMessage());
                    }
                }
            }

            return response;

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send batch notifications: {} - {}", e.getMessagingErrorCode(), e.getMessage());
            throw new BusinessException(ErrorCode.FCM_SEND_FAILED, "Failed to send batch notifications");
        } catch (Exception e) {
            log.error("Unexpected error sending batch notifications: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.FCM_SEND_FAILED, "Unexpected error sending batch notifications");
        }
    }

    /**
     * Check if Firebase is available for sending notifications
     */
    public boolean isAvailable() {
        return firebaseMessaging != null;
    }

    /**
     * Mask FCM token for logging (show first and last 4 characters)
     */
    private String maskToken(String token) {
        if (token == null || token.length() < 10) {
            return "****";
        }
        return token.substring(0, 4) + "..." + token.substring(token.length() - 4);
    }

    /**
     * Inner class for batch notification requests
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class NotificationRequest {
        private String fcmToken;
        private String title;
        private String body;
        private Map<String, String> data;
    }
}
