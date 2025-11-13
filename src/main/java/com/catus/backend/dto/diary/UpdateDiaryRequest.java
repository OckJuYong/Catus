package com.catus.backend.dto.diary;

import com.catus.backend.model.EmotionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating diary content.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDiaryRequest {

    /**
     * Updated emotion (optional)
     */
    private EmotionType emotion;

    /**
     * Updated summary text (optional)
     */
    @NotBlank(message = "Summary cannot be blank")
    @Size(max = 1000, message = "Summary must not exceed 1000 characters")
    private String summary;
}
