package com.catus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * UserProfile entity representing the user_profiles table.
 * Contains detailed profile information for each user.
 */
@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "nickname", nullable = false, length = 20)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private Gender gender;

    @Column(name = "age_group", length = 20)
    private String ageGroup;

    @Column(name = "occupation", length = 50)
    private String occupation;

    @Column(name = "service_purpose", columnDefinition = "TEXT")
    private String servicePurpose;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Gender enum
     */
    public enum Gender {
        MALE,
        FEMALE,
        OTHER
    }

    /**
     * Update profile information
     */
    public void updateProfile(String nickname, String bio) {
        if (nickname != null && !nickname.isBlank()) {
            this.nickname = nickname;
        }
        if (bio != null) {
            this.bio = bio;
        }
    }

    /**
     * Update profile image URL
     */
    public void updateProfileImage(String imageUrl) {
        this.profileImageUrl = imageUrl;
    }
}
