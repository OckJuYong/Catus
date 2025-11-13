package com.catus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Diary entity representing the diaries table.
 * Automatically generated daily from chat messages, storing emotion analysis and AI-generated summary.
 */
@Entity
@Table(name = "diaries",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_diary_user_date", columnNames = {"user_id", "diary_date"})
    },
    indexes = {
        @Index(name = "idx_diary_user_date", columnList = "user_id,diary_date DESC"),
        @Index(name = "idx_diary_public", columnList = "is_public,created_at DESC")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diary_id")
    private Long diaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "diary_date", nullable = false)
    private LocalDate diaryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "emotion", nullable = false, length = 20)
    private EmotionType emotion;

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "generation_type", nullable = false, length = 20)
    @Builder.Default
    private DiaryGenerationType generationType = DiaryGenerationType.AUTO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Helper method to set user by userId
     */
    public void setUserId(Long userId) {
        if (this.user == null) {
            this.user = new User();
        }
        this.user.setUserId(userId);
    }

    /**
     * Get userId directly
     */
    public Long getUserId() {
        return user != null ? user.getUserId() : null;
    }

    /**
     * Toggle public/private status
     */
    public void togglePublic() {
        this.isPublic = !this.isPublic;
    }

    /**
     * Update diary content
     */
    public void updateContent(EmotionType emotion, String summary) {
        if (emotion != null) {
            this.emotion = emotion;
        }
        if (summary != null && !summary.isBlank()) {
            this.summary = summary;
        }
    }
}
