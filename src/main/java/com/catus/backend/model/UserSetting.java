package com.catus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * UserSetting entity representing the user_settings table.
 * Contains user preferences and notification settings.
 */
@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "setting_id")
    private Long settingId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "notification_enabled", nullable = false)
    @Builder.Default
    private Boolean notificationEnabled = true;

    @Column(name = "diary_generation_enabled", nullable = false)
    @Builder.Default
    private Boolean diaryGenerationEnabled = true;

    @Column(name = "support_message_enabled", nullable = false)
    @Builder.Default
    private Boolean supportMessageEnabled = true;

    @Column(name = "daily_reminder_time", nullable = false)
    @Builder.Default
    private LocalTime dailyReminderTime = LocalTime.of(21, 0);

    @Column(name = "diary_generation_time", nullable = false)
    @Builder.Default
    private LocalTime diaryGenerationTime = LocalTime.of(0, 10);

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_style", nullable = false, length = 20)
    @Builder.Default
    private AiStyle aiStyle = AiStyle.FRIENDLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", nullable = false, length = 20)
    @Builder.Default
    private Theme theme = Theme.LIGHT;

    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * AI conversation style enum
     */
    public enum AiStyle {
        FRIENDLY,
        SERIOUS
    }

    /**
     * Theme enum
     */
    public enum Theme {
        LIGHT,
        DARK
    }

    /**
     * Update FCM token for push notifications
     */
    public void updateFcmToken(String token) {
        this.fcmToken = token;
    }

    /**
     * Create default settings for a new user
     */
    public static UserSetting createDefault(User user) {
        return UserSetting.builder()
                .user(user)
                .notificationEnabled(true)
                .diaryGenerationEnabled(true)
                .supportMessageEnabled(true)
                .dailyReminderTime(LocalTime.of(21, 0))
                .diaryGenerationTime(LocalTime.of(0, 10))
                .aiStyle(AiStyle.FRIENDLY)
                .theme(Theme.LIGHT)
                .build();
    }
}
