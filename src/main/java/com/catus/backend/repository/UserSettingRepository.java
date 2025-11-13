package com.catus.backend.repository;

import com.catus.backend.model.UserSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for UserSetting entity.
 * Provides data access methods for user settings operations.
 */
@Repository
public interface UserSettingRepository extends JpaRepository<UserSetting, Long> {

    /**
     * Find user settings by user ID
     * @param userId User ID
     * @return Optional containing the user settings if found
     */
    Optional<UserSetting> findByUser_UserId(Long userId);

    /**
     * Check if settings exist for user
     * @param userId User ID
     * @return true if settings exist
     */
    boolean existsByUser_UserId(Long userId);

    /**
     * Delete settings by user ID
     * @param userId User ID
     */
    void deleteByUser_UserId(Long userId);
}
