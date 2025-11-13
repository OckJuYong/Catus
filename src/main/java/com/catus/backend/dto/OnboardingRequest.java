package com.catus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user onboarding information.
 * Used when new users complete their initial profile setup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingRequest {

    /**
     * User's preferred nickname.
     * Must be between 2 and 20 characters.
     */
    @NotBlank(message = "Nickname cannot be empty")
    @Size(min = 2, max = 20, message = "Nickname must be between 2 and 20 characters")
    private String nickname;

    /**
     * User's birth date in format YYYY-MM-DD.
     * Optional field for personalization.
     */
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Birth date must be in format YYYY-MM-DD")
    private String birthDate;

    /**
     * User's gender.
     * Valid values: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
     * Optional field.
     */
    @Pattern(regexp = "^(MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY)$",
            message = "Gender must be one of: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
    private String gender;
}
