package com.catus.backend.dto.support;

import com.catus.backend.model.EmotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for random public diary (for support message sending).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RandomDiaryResponse {

    /**
     * The diary ID
     */
    private Long diaryId;

    /**
     * The diary owner's user ID
     */
    private Long userId;

    /**
     * The diary date
     */
    private LocalDate diaryDate;

    /**
     * The detected emotion
     */
    private EmotionType emotion;

    /**
     * The diary summary text
     */
    private String summary;

    /**
     * The AI-generated image URL
     */
    private String imageUrl;
}
