package com.catus.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating user profile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Update user profile request")
public class UpdateProfileRequest {

    @Size(min = 2, max = 20, message = "Nickname must be between 2 and 20 characters")
    @Schema(description = "Nickname (2-20 characters)", example = "John Doe")
    private String nickname;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    @Schema(description = "Bio/introduction (max 500 characters)", example = "I love writing diaries!")
    private String bio;

    @Schema(description = "Gender", example = "MALE", allowableValues = {"MALE", "FEMALE", "OTHER"})
    private String gender;

    @Size(max = 20, message = "Age group must not exceed 20 characters")
    @Schema(description = "Age group", example = "20대")
    private String ageGroup;

    @Size(max = 50, message = "Occupation must not exceed 50 characters")
    @Schema(description = "Occupation", example = "Software Engineer")
    private String occupation;

    @Size(max = 500, message = "Service purpose must not exceed 500 characters")
    @Schema(description = "Service usage purpose", example = "To track my emotions daily")
    private String servicePurpose;
}
