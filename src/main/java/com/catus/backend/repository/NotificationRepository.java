package com.catus.backend.repository;

import com.catus.backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Notification entity.
 * Provides data access methods for notification-related operations.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find notifications by user ID ordered by creation date descending
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Page of notifications
     */
    Page<Notification> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find all unsent notifications
     * @return List of notifications that haven't been sent
     */
    List<Notification> findByIsSentFalse();

    /**
     * Find unsent notifications for a specific user
     * @param userId User ID
     * @return List of unsent notifications for the user
     */
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.isSent = false ORDER BY n.createdAt DESC")
    List<Notification> findUnsentNotificationsByUserId(@Param("userId") Long userId);

    /**
     * Count total notifications for a user
     * @param userId User ID
     * @return Count of notifications
     */
    long countByUser_UserId(Long userId);
}
