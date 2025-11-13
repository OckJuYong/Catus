package com.catus.backend.dto.diary;

import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for manual diary generation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateDiaryRequest {

    /**
     * Date to generate diary for (defaults to today if not provided)
     */
    @PastOrPresent(message = "Diary date cannot be in the future")
    private LocalDate date;

    /**
     * Get the date, defaulting to today if not set
     */
    public LocalDate getDateOrToday() {
        return date != null ? date : LocalDate.now();
    }
}
