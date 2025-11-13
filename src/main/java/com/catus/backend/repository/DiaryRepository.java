package com.catus.backend.repository;

import com.catus.backend.model.Diary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Diary entity.
 * Provides methods to query diaries by user, date range, and public status.
 */
@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {

    /**
     * Find diary by user ID and specific date.
     *
     * @param userId    the user ID
     * @param diaryDate the diary date
     * @return Optional containing the diary if found
     */
    @Query("SELECT d FROM Diary d WHERE d.user.userId = :userId AND d.diaryDate = :diaryDate")
    Optional<Diary> findByUserIdAndDiaryDate(@Param("userId") Long userId, @Param("diaryDate") LocalDate diaryDate);

    /**
     * Find all diaries by user ID within a date range (for monthly calendar).
     *
     * @param userId    the user ID
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of diaries within the date range
     */
    @Query("SELECT d FROM Diary d WHERE d.user.userId = :userId " +
           "AND d.diaryDate BETWEEN :startDate AND :endDate " +
           "ORDER BY d.diaryDate DESC")
    List<Diary> findByUserIdAndDiaryDateBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Check if diary exists for a user on a specific date.
     *
     * @param userId    the user ID
     * @param diaryDate the diary date
     * @return true if diary exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM Diary d " +
           "WHERE d.user.userId = :userId AND d.diaryDate = :diaryDate")
    boolean existsByUserIdAndDiaryDate(@Param("userId") Long userId, @Param("diaryDate") LocalDate diaryDate);

    /**
     * Find random public diaries (for Phase 5 - Community Feed).
     *
     * @param limit the maximum number of diaries to return
     * @return list of random public diaries
     */
    @Query(value = "SELECT d FROM Diary d WHERE d.isPublic = true ORDER BY FUNCTION('RANDOM')")
    List<Diary> findPublicDiariesRandomly(@Param("limit") int limit);

    /**
     * Find all diaries by user ID, ordered by date descending.
     *
     * @param userId the user ID
     * @return list of all user's diaries
     */
    @Query("SELECT d FROM Diary d WHERE d.user.userId = :userId ORDER BY d.diaryDate DESC")
    List<Diary> findAllByUserId(@Param("userId") Long userId);

    /**
     * Find diary by ID and user ID (for authorization check).
     *
     * @param diaryId the diary ID
     * @param userId  the user ID
     * @return Optional containing the diary if found and belongs to user
     */
    @Query("SELECT d FROM Diary d WHERE d.diaryId = :diaryId AND d.user.userId = :userId")
    Optional<Diary> findByIdAndUserId(@Param("diaryId") Long diaryId, @Param("userId") Long userId);
}
