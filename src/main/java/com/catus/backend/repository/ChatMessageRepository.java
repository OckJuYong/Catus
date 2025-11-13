package com.catus.backend.repository;

import com.catus.backend.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for ChatMessage entity.
 * Provides custom query methods for conversation history and context retrieval.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Find recent chat messages for a user, ordered by creation time descending.
     * Used to provide conversation context to AI.
     *
     * @param userId   the user ID
     * @param pageable pagination information (typically limit to last 10 messages)
     * @return list of recent chat messages
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.user.userId = :userId ORDER BY cm.createdAt DESC")
    List<ChatMessage> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Find chat messages within a date range for a user.
     * Used for conversation history retrieval with date filtering.
     *
     * @param userId    the user ID
     * @param startDate start of the date range
     * @param endDate   end of the date range
     * @param pageable  pagination information
     * @return page of chat messages within the date range
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.user.userId = :userId " +
           "AND cm.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByUserIdAndCreatedAtBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    /**
     * Find all chat messages for a user, ordered by creation time descending.
     *
     * @param userId   the user ID
     * @param pageable pagination information
     * @return page of all chat messages for the user
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.user.userId = :userId ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Count total messages for a user
     *
     * @param userId the user ID
     * @return total message count
     */
    long countByUserUserId(Long userId);

    /**
     * Find distinct user IDs who had chat messages within a date range.
     * Used by DiaryScheduler to identify users for automatic diary generation.
     *
     * @param startDate start of the date range
     * @param endDate   end of the date range
     * @return list of distinct user IDs who had messages in the date range
     */
    @Query("SELECT DISTINCT cm.user.userId FROM ChatMessage cm " +
           "WHERE cm.createdAt BETWEEN :startDate AND :endDate")
    List<Long> findDistinctUserIdsByCreatedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
