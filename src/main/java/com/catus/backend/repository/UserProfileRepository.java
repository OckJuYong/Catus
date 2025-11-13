package com.catus.backend.repository;

import com.catus.backend.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for UserProfile entity.
 * Provides data access methods for user profile operations.
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    /**
     * Find user profile by user ID
     * @param userId User ID
     * @return Optional containing the user profile if found
     */
    Optional<UserProfile> findByUser_UserId(Long userId);

    /**
     * Check if profile exists for user
     * @param userId User ID
     * @return true if profile exists
     */
    boolean existsByUser_UserId(Long userId);

    /**
     * Delete profile by user ID
     * @param userId User ID
     */
    void deleteByUser_UserId(Long userId);
}
