package com.catus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SupportMessage entity representing the support_messages table.
 * Stores anonymous peer support messages sent to diary owners.
 */
@Entity
@Table(name = "support_messages",
    indexes = {
        @Index(name = "idx_support_recipient", columnList = "recipient_id,created_at DESC"),
        @Index(name = "idx_support_diary", columnList = "diary_id,created_at DESC")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false)
    private Diary diary;

    /**
     * Sender ID - NULL for completely anonymous messages
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Flag indicating if message contains filtered profanity
     */
    @Column(name = "is_filtered", nullable = false)
    @Builder.Default
    private Boolean isFiltered = false;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Helper method to set diary by diaryId
     */
    public void setDiaryId(Long diaryId) {
        if (this.diary == null) {
            this.diary = new Diary();
        }
        this.diary.setDiaryId(diaryId);
    }

    /**
     * Get diaryId directly
     */
    public Long getDiaryId() {
        return diary != null ? diary.getDiaryId() : null;
    }

    /**
     * Helper method to set sender by userId (nullable for anonymous)
     */
    public void setSenderId(Long senderId) {
        if (senderId == null) {
            this.sender = null;
        } else {
            if (this.sender == null) {
                this.sender = new User();
            }
            this.sender.setUserId(senderId);
        }
    }

    /**
     * Get senderId directly
     */
    public Long getSenderId() {
        return sender != null ? sender.getUserId() : null;
    }

    /**
     * Helper method to set recipient by userId
     */
    public void setRecipientId(Long recipientId) {
        if (this.recipient == null) {
            this.recipient = new User();
        }
        this.recipient.setUserId(recipientId);
    }

    /**
     * Get recipientId directly
     */
    public Long getRecipientId() {
        return recipient != null ? recipient.getUserId() : null;
    }

    /**
     * Check if message is anonymous
     */
    public boolean isAnonymous() {
        return sender == null;
    }

    /**
     * Mark message as read
     */
    public void markAsRead() {
        this.isRead = true;
    }
}
