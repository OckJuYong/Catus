package com.catus.backend.repository;

import com.catus.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entity.
 * Provides data access methods for user-related operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by Kakao OAuth ID
     * @param kakaoId Kakao OAuth ID
     * @return Optional containing the user if found
     */
    Optional<User> findByKakaoId(String kakaoId);

    /**
     * Find user by email
     * @param email User email
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Find active user by Kakao ID (not deleted)
     * @param kakaoId Kakao OAuth ID
     * @return Optional containing the active user if found
     */
    @Query("SELECT u FROM User u WHERE u.kakaoId = :kakaoId AND u.status = 'ACTIVE' AND u.deletedAt IS NULL")
    Optional<User> findActiveUserByKakaoId(@Param("kakaoId") String kakaoId);

    /**
     * Check if user exists by Kakao ID
     * @param kakaoId Kakao OAuth ID
     * @return true if user exists
     */
    boolean existsByKakaoId(String kakaoId);

    /**
     * Check if user exists by email
     * @param email User email
     * @return true if user exists
     */
    boolean existsByEmail(String email);
}
