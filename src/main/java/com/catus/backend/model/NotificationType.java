package com.catus.backend.model;

/**
 * Enum for notification types
 */
public enum NotificationType {
    /**
     * Notification sent when diary is automatically generated
     */
    DIARY_GENERATED,

    /**
     * Notification sent when user receives a support message
     */
    SUPPORT_RECEIVED,

    /**
     * Daily reminder notification to encourage journaling
     */
    DAILY_REMINDER
}
