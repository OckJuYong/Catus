package com.catus.backend.repository;

import com.catus.backend.model.SupportMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for SupportMessage entity.
 * Provides methods to query support messages by recipient and diary.
 */
@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    /**
     * Find all support messages received by a user, ordered by creation date descending.
     *
     * @param recipientId the recipient user ID
     * @param pageable    pagination information
     * @return page of support messages
     */
    @Query("SELECT sm FROM SupportMessage sm " +
           "WHERE sm.recipient.userId = :recipientId " +
           "ORDER BY sm.createdAt DESC")
    Page<SupportMessage> findByRecipientIdOrderByCreatedAtDesc(
        @Param("recipientId") Long recipientId,
        Pageable pageable
    );

    /**
     * Count unread support messages for a recipient.
     *
     * @param recipientId the recipient user ID
     * @return count of unread messages
     */
    @Query("SELECT COUNT(sm) FROM SupportMessage sm " +
           "WHERE sm.recipient.userId = :recipientId AND sm.isRead = false")
    long countByRecipientIdAndIsReadFalse(@Param("recipientId") Long recipientId);

    /**
     * Find support messages by diary ID, ordered by creation date descending.
     *
     * @param diaryId  the diary ID
     * @param pageable pagination information
     * @return page of support messages for the diary
     */
    @Query("SELECT sm FROM SupportMessage sm " +
           "WHERE sm.diary.diaryId = :diaryId " +
           "ORDER BY sm.createdAt DESC")
    Page<SupportMessage> findByDiaryIdOrderByCreatedAtDesc(
        @Param("diaryId") Long diaryId,
        Pageable pageable
    );

    /**
     * Find all support messages sent by a user, ordered by creation date descending.
     * (Frontend-compatible - for viewing sent messages)
     *
     * @param senderId the sender user ID
     * @param pageable pagination information
     * @return page of support messages sent by the user
     */
    @Query("SELECT sm FROM SupportMessage sm " +
           "WHERE sm.sender.userId = :senderId " +
           "ORDER BY sm.createdAt DESC")
    Page<SupportMessage> findBySenderIdOrderByCreatedAtDesc(
        @Param("senderId") Long senderId,
        Pageable pageable
    );
}
