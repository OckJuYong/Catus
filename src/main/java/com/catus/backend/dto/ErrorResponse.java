package com.catus.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standard error response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Error response")
public class ErrorResponse {

    @Schema(description = "HTTP status code", example = "400")
    private int status;

    @Schema(description = "Error code", example = "INVALID_INPUT")
    private String code;

    @Schema(description = "Error message", example = "Invalid request parameters")
    private String message;

    @Schema(description = "Detailed error information")
    private String details;

    @Schema(description = "Validation errors (for field validation failures)")
    private List<FieldError> fieldErrors;

    @Schema(description = "Timestamp of the error", example = "2024-01-01T00:00:00")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @Schema(description = "Request path", example = "/api/v1/users/profile")
    private String path;

    /**
     * Field validation error DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "Field validation error")
    public static class FieldError {
        @Schema(description = "Field name", example = "nickname")
        private String field;

        @Schema(description = "Rejected value", example = "a")
        private Object rejectedValue;

        @Schema(description = "Error message", example = "Nickname must be between 2 and 20 characters")
        private String message;
    }
}
