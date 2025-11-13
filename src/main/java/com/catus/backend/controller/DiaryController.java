package com.catus.backend.controller;

import com.catus.backend.dto.diary.DiaryCalendarResponse;
import com.catus.backend.dto.diary.DiaryResponse;
import com.catus.backend.dto.diary.GenerateDiaryRequest;
import com.catus.backend.dto.diary.UpdateDiaryRequest;
import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.Diary;
import com.catus.backend.repository.DiaryRepository;
import com.catus.backend.service.DiaryGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * REST Controller for diary operations.
 * Provides endpoints for diary generation, retrieval, and management.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/diaries")
@RequiredArgsConstructor
@Tag(name = "📔 일기", description = "감정 일기 생성 및 관리 API")
@SecurityRequirement(name = "bearerAuth")
public class DiaryController {

    private final DiaryGenerationService diaryGenerationService;
    private final DiaryRepository diaryRepository;

    /**
     * GET /api/v1/diaries - Get monthly calendar view of diaries
     *
     * @param userId authenticated user ID from JWT token
     * @param year   year parameter (e.g., 2024)
     * @param month  month parameter (1-12)
     * @return calendar view with diary items for the month
     */
    @GetMapping
    @Operation(summary = "월별 일기 조회", description = "지정한 년/월의 일기 목록을 캘린더 형식으로 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "월별 일기 조회 성공",
                    content = @Content(schema = @Schema(implementation = DiaryCalendarResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 년도/월 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<DiaryCalendarResponse> getMonthlyDiaries(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "년도 (2020-2100)", required = true) @RequestParam @Min(2020) @Max(2100) int year,
        @Parameter(description = "월 (1-12)", required = true) @RequestParam @Min(1) @Max(12) int month
    ) {
        log.info("Fetching monthly diaries for user {} - year: {}, month: {}", userId, year, month);

        // Calculate start and end dates for the month
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Fetch diaries for the month
        List<Diary> diaries = diaryRepository.findByUserIdAndDiaryDateBetween(userId, startDate, endDate);

        // Convert to response DTO
        DiaryCalendarResponse response = DiaryCalendarResponse.from(year, month, diaries);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/diaries/{date} - Get diary details for a specific date
     *
     * @param userId authenticated user ID from JWT token
     * @param date   diary date in yyyy-MM-dd format
     * @return diary details
     */
    @GetMapping("/{date}")
    @Operation(summary = "특정 날짜 일기 조회", description = "지정한 날짜의 일기 상세 정보를 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "일기 조회 성공",
                    content = @Content(schema = @Schema(implementation = DiaryResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "해당 날짜의 일기를 찾을 수 없음")
    })
    public ResponseEntity<DiaryResponse> getDiaryByDate(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "일기 날짜 (yyyy-MM-dd)", required = true) @PathVariable LocalDate date
    ) {
        log.info("Fetching diary for user {} on date {}", userId, date);

        Diary diary = diaryRepository.findByUserIdAndDiaryDate(userId, date)
            .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND,
                "No diary found for date: " + date));

        DiaryResponse response = DiaryResponse.from(diary);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/diaries/generate - Manually generate diary for a date
     * POST /api/v1/diaries - Frontend-compatible alias
     *
     * @param userId  authenticated user ID from JWT token
     * @param request generation request (date optional, defaults to today)
     * @return generated diary details
     */
    @PostMapping(value = {"", "/generate"})  // Both root and /generate paths
    @Operation(summary = "일기 생성", description = "지정한 날짜(기본값: 오늘)의 일기를 수동으로 생성합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "일기 생성 성공",
                    content = @Content(schema = @Schema(implementation = DiaryResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (이미 일기가 존재하거나 대화 내역 부족)"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<DiaryResponse> generateDiary(
        @AuthenticationPrincipal Long userId,
        @RequestBody(required = false) @Valid GenerateDiaryRequest request
    ) {
        LocalDate date = (request != null && request.getDate() != null)
            ? request.getDate()
            : LocalDate.now();

        log.info("Manually generating diary for user {} on date {}", userId, date);

        Diary diary = diaryGenerationService.generateDiary(
            userId,
            date,
            com.catus.backend.model.DiaryGenerationType.MANUAL
        );

        DiaryResponse response = DiaryResponse.from(diary);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/v1/diaries/{id} - Update diary content
     *
     * @param userId  authenticated user ID from JWT token
     * @param id      diary ID
     * @param request update request with new emotion/summary
     * @return updated diary details
     */
    @PutMapping("/{id}")
    @Operation(summary = "일기 수정", description = "일기의 감정 또는 요약 내용을 수정합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "일기 수정 성공",
                    content = @Content(schema = @Schema(implementation = DiaryResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음 또는 접근 권한 없음")
    })
    public ResponseEntity<DiaryResponse> updateDiary(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "일기 ID", required = true) @PathVariable Long id,
        @RequestBody @Valid UpdateDiaryRequest request
    ) {
        log.info("Updating diary {} for user {}", id, userId);

        // Fetch diary and verify ownership
        Diary diary = diaryRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND,
                "Diary not found or access denied"));

        // Update diary content
        diary.updateContent(request.getEmotion(), request.getSummary());
        Diary updatedDiary = diaryRepository.save(diary);

        DiaryResponse response = DiaryResponse.from(updatedDiary);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/diaries/{id}/public - Toggle diary public/private status
     *
     * @param userId authenticated user ID from JWT token
     * @param id     diary ID
     * @return updated diary details
     */
    @PatchMapping("/{id}/public")
    @Operation(summary = "일기 공개 설정 토글", description = "일기의 공개/비공개 상태를 전환합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "공개 설정 변경 성공",
                    content = @Content(schema = @Schema(implementation = DiaryResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음 또는 접근 권한 없음")
    })
    public ResponseEntity<DiaryResponse> toggleDiaryPublic(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "일기 ID", required = true) @PathVariable Long id
    ) {
        log.info("Toggling public status for diary {} by user {}", id, userId);

        // Fetch diary and verify ownership
        Diary diary = diaryRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND,
                "Diary not found or access denied"));

        // Toggle public status
        diary.togglePublic();
        Diary updatedDiary = diaryRepository.save(diary);

        DiaryResponse response = DiaryResponse.from(updatedDiary);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/diaries/check/{date} - Check if diary can be generated for a date
     *
     * @param userId authenticated user ID from JWT token
     * @param date   date to check
     * @return simple boolean response
     */
    @GetMapping("/check/{date}")
    @Operation(summary = "일기 생성 가능 여부 확인", description = "지정한 날짜에 일기를 생성할 수 있는지 확인합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "확인 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    public ResponseEntity<CanGenerateResponse> canGenerateDiary(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "확인할 날짜 (yyyy-MM-dd)", required = true) @PathVariable LocalDate date
    ) {
        log.info("Checking if diary can be generated for user {} on date {}", userId, date);

        boolean canGenerate = diaryGenerationService.canGenerateDiary(userId, date);

        return ResponseEntity.ok(new CanGenerateResponse(canGenerate));
    }

    // ========== Frontend-compatible endpoints ==========

    /**
     * PUT /api/v1/diaries/{date} - Update diary by date (frontend-compatible)
     *
     * @param userId  authenticated user ID from JWT token
     * @param date    diary date in yyyy-MM-dd format
     * @param request update request with new emotion/summary
     * @return updated diary details
     */
    @PutMapping("/{date}")
    @Operation(summary = "일기 수정 (날짜 기반)", description = "특정 날짜의 일기 내용을 수정합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "일기 수정 성공",
                    content = @Content(schema = @Schema(implementation = DiaryResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음")
    })
    public ResponseEntity<DiaryResponse> updateDiaryByDate(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "일기 날짜 (yyyy-MM-dd)", required = true) @PathVariable LocalDate date,
        @RequestBody @Valid UpdateDiaryRequest request
    ) {
        log.info("Updating diary by date {} for user {}", date, userId);

        // Fetch diary by date and verify ownership
        Diary diary = diaryRepository.findByUserIdAndDiaryDate(userId, date)
            .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND,
                "No diary found for date: " + date));

        // Update diary content
        diary.updateContent(request.getEmotion(), request.getSummary());
        Diary updatedDiary = diaryRepository.save(diary);

        DiaryResponse response = DiaryResponse.from(updatedDiary);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/diaries/{date} - Delete diary by date (frontend-compatible)
     *
     * @param userId authenticated user ID from JWT token
     * @param date   diary date in yyyy-MM-dd format
     * @return no content
     */
    @DeleteMapping("/{date}")
    @Operation(summary = "일기 삭제 (날짜 기반)", description = "특정 날짜의 일기를 삭제합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "일기 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음")
    })
    public ResponseEntity<Void> deleteDiaryByDate(
        @AuthenticationPrincipal Long userId,
        @Parameter(description = "일기 날짜 (yyyy-MM-dd)", required = true) @PathVariable LocalDate date
    ) {
        log.info("Deleting diary by date {} for user {}", date, userId);

        // Fetch diary by date and verify ownership
        Diary diary = diaryRepository.findByUserIdAndDiaryDate(userId, date)
            .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND,
                "No diary found for date: " + date));

        // Delete diary
        diaryRepository.delete(diary);

        log.info("Diary deleted successfully for user {} on date {}", userId, date);
        return ResponseEntity.noContent().build();
    }

    /**
     * Simple response DTO for can-generate check
     */
    record CanGenerateResponse(boolean canGenerate) {}
}
