package com.catus.backend.dto.diary;

import com.catus.backend.model.Diary;
import com.catus.backend.model.DiaryGenerationType;
import com.catus.backend.model.EmotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for diary detail information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaryResponse {

    private Long diaryId;
    private LocalDate diaryDate;
    private EmotionType emotion;
    private String summary;
    private String imageUrl;
    private Boolean isPublic;
    private DiaryGenerationType generationType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert Diary entity to DiaryResponse DTO
     */
    public static DiaryResponse from(Diary diary) {
        return DiaryResponse.builder()
            .diaryId(diary.getDiaryId())
            .diaryDate(diary.getDiaryDate())
            .emotion(diary.getEmotion())
            .summary(diary.getSummary())
            .imageUrl(diary.getImageUrl())
            .isPublic(diary.getIsPublic())
            .generationType(diary.getGenerationType())
            .createdAt(diary.getCreatedAt())
            .updatedAt(diary.getUpdatedAt())
            .build();
    }
}
