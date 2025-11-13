package com.catus.backend.dto;

import com.catus.backend.model.UserProfile;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for user profile information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User profile information")
public class UserProfileResponse {

    @Schema(description = "User ID", example = "123")
    private Long userId;

    @Schema(description = "Email address", example = "user@example.com")
    private String email;

    @Schema(description = "Nickname", example = "John Doe")
    private String nickname;

    @Schema(description = "Profile image URL", example = "https://catus-diary-images.s3.amazonaws.com/profiles/123/profile.jpg")
    private String profileImageUrl;

    @Schema(description = "Bio/introduction", example = "I love writing diaries!")
    private String bio;

    @Schema(description = "Gender", example = "MALE")
    private String gender;

    @Schema(description = "Age group", example = "20대")
    private String ageGroup;

    @Schema(description = "Occupation", example = "Software Engineer")
    private String occupation;

    @Schema(description = "Service usage purpose", example = "To track my emotions daily")
    private String servicePurpose;

    @Schema(description = "Profile creation timestamp", example = "2024-01-01T00:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Profile last update timestamp", example = "2024-01-01T00:00:00")
    private LocalDateTime updatedAt;

    /**
     * Factory method to create response from entities
     */
    public static UserProfileResponse from(com.catus.backend.model.User user, UserProfile profile) {
        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(profile.getNickname())
                .profileImageUrl(profile.getProfileImageUrl())
                .bio(profile.getBio())
                .gender(profile.getGender() != null ? profile.getGender().name() : null)
                .ageGroup(profile.getAgeGroup())
                .occupation(profile.getOccupation())
                .servicePurpose(profile.getServicePurpose())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
