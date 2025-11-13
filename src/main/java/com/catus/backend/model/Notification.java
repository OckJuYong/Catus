package com.catus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Notification entity representing the notifications table.
 * Stores notification records for push notifications sent to users.
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_user_created", columnList = "user_id,created_at DESC"),
        @Index(name = "idx_is_sent", columnList = "is_sent")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_sent", nullable = false)
    @Builder.Default
    private Boolean isSent = false;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    /**
     * Mark notification as sent
     */
    public void markAsSent() {
        this.isSent = true;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * Create a diary generated notification
     */
    public static Notification createDiaryGenerated(User user, Long diaryId, String diaryDate) {
        return Notification.builder()
                .user(user)
                .type(NotificationType.DIARY_GENERATED)
                .title("일기가 생성되었어요!")
                .content("오늘의 달리와의 대화가 일기로 완성되었어요 📔")
                .metadata(Map.of("diaryId", diaryId, "diaryDate", diaryDate))
                .isSent(false)
                .build();
    }

    /**
     * Create a support message received notification
     */
    public static Notification createSupportReceived(User user, Long messageId, Long diaryId, String diaryDate) {
        return Notification.builder()
                .user(user)
                .type(NotificationType.SUPPORT_RECEIVED)
                .title("응원 메시지를 받았어요!")
                .content(diaryDate + " 일기에 누군가의 따뜻한 응원이 도착했어요 💌")
                .metadata(Map.of("messageId", messageId, "diaryId", diaryId))
                .isSent(false)
                .build();
    }

    /**
     * Create a daily reminder notification
     */
    public static Notification createDailyReminder(User user) {
        return Notification.builder()
                .user(user)
                .type(NotificationType.DAILY_REMINDER)
                .title("달리가 기다리고 있어요 🐱")
                .content("오늘 하루는 어떠셨나요? 달리에게 이야기해주세요")
                .metadata(Map.of())
                .isSent(false)
                .build();
    }
}
