package com.catus.backend.service;

import com.catus.backend.dto.UpdateProfileRequest;
import com.catus.backend.dto.UserProfileResponse;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.exception.UserNotFoundException;
import com.catus.backend.model.User;
import com.catus.backend.model.UserProfile;
import com.catus.backend.repository.UserProfileRepository;
import com.catus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service for user profile management operations.
 * Handles profile retrieval, updates, and image uploads.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final S3Service s3Service;

    /**
     * Get user profile by user ID
     * @param userId User ID
     * @return UserProfileResponse
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        log.info("Fetching profile for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserProfile profile = userProfileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Profile not found for user: " + userId));

        return UserProfileResponse.from(user, profile);
    }

    /**
     * Update user profile information
     * @param userId User ID
     * @param request Update request with new profile data
     * @return Updated UserProfileResponse
     */
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        log.info("Updating profile for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserProfile profile = userProfileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Profile not found for user: " + userId));

        // Update basic fields
        if (request.getNickname() != null && !request.getNickname().isBlank()) {
            profile.setNickname(request.getNickname());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }

        // Update optional fields
        if (request.getGender() != null) {
            try {
                profile.setGender(UserProfile.Gender.valueOf(request.getGender().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid gender value: {}", request.getGender());
            }
        }
        if (request.getAgeGroup() != null) {
            profile.setAgeGroup(request.getAgeGroup());
        }
        if (request.getOccupation() != null) {
            profile.setOccupation(request.getOccupation());
        }
        if (request.getServicePurpose() != null) {
            profile.setServicePurpose(request.getServicePurpose());
        }

        userProfileRepository.save(profile);
        log.info("Profile updated successfully for user {}", userId);

        return UserProfileResponse.from(user, profile);
    }

    /**
     * Upload and update user profile image
     * @param userId User ID
     * @param file Image file to upload
     * @return Updated UserProfileResponse
     */
    @Transactional
    public UserProfileResponse updateProfileImage(Long userId, MultipartFile file) {
        log.info("Updating profile image for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserProfile profile = userProfileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Profile not found for user: " + userId));

        // Upload image to S3
        String imageUrl = s3Service.uploadProfileImage(file, userId);

        // Update profile with new image URL
        profile.updateProfileImage(imageUrl);
        userProfileRepository.save(profile);

        log.info("Profile image updated successfully for user {}: {}", userId, imageUrl);

        return UserProfileResponse.from(user, profile);
    }

    /**
     * Check if user exists and is active
     * @param userId User ID
     * @return true if user exists and is active
     */
    @Transactional(readOnly = true)
    public boolean isUserActive(Long userId) {
        return userRepository.findById(userId)
                .map(User::isActive)
                .orElse(false);
    }

    /**
     * Complete onboarding process for new user.
     * Updates user profile with initial information.
     *
     * @param userId User ID
     * @param request Onboarding information (nickname, birthDate, gender)
     * @return Updated UserProfileResponse
     */
    @Transactional
    public UserProfileResponse completeOnboarding(Long userId, com.catus.backend.dto.OnboardingRequest request) {
        log.info("Completing onboarding for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserProfile profile = userProfileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Profile not found for user: " + userId));

        // Update nickname (required)
        if (request.getNickname() != null && !request.getNickname().isBlank()) {
            profile.setNickname(request.getNickname());
        }

        // Update birth date (optional)
        if (request.getBirthDate() != null && !request.getBirthDate().isBlank()) {
            // Store as string or convert to LocalDate if needed
            // For now, we'll store in ageGroup or a custom field
            log.info("Birth date provided for user {}: {}", userId, request.getBirthDate());
            // TODO: Add birthDate field to UserProfile entity if needed
        }

        // Update gender (optional)
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                profile.setGender(UserProfile.Gender.valueOf(request.getGender().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid gender value during onboarding: {}", request.getGender());
            }
        }

        userProfileRepository.save(profile);
        log.info("Onboarding completed successfully for user {}", userId);

        return UserProfileResponse.from(user, profile);
    }
}
