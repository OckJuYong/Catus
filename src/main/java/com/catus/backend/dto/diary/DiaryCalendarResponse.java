package com.catus.backend.dto.diary;

import com.catus.backend.model.Diary;
import com.catus.backend.model.EmotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for monthly calendar view showing brief diary information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaryCalendarResponse {

    private int year;
    private int month;
    private List<DiaryCalendarItem> diaries;

    /**
     * Individual diary item for calendar view (minimal information)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiaryCalendarItem {
        private Long diaryId;
        private LocalDate diaryDate;
        private EmotionType emotion;

        public static DiaryCalendarItem from(Diary diary) {
            return DiaryCalendarItem.builder()
                .diaryId(diary.getDiaryId())
                .diaryDate(diary.getDiaryDate())
                .emotion(diary.getEmotion())
                .build();
        }
    }

    /**
     * Create calendar response from list of diaries
     */
    public static DiaryCalendarResponse from(int year, int month, List<Diary> diaries) {
        List<DiaryCalendarItem> items = diaries.stream()
            .map(DiaryCalendarItem::from)
            .collect(Collectors.toList());

        return DiaryCalendarResponse.builder()
            .year(year)
            .month(month)
            .diaries(items)
            .build();
    }
}
