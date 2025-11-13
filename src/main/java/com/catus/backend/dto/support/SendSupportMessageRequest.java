package com.catus.backend.dto.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for sending support message to a diary owner.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendSupportMessageRequest {

    /**
     * The diary ID to send support message to
     */
    @NotNull(message = "Diary ID is required")
    private Long diaryId;

    /**
     * The support message content
     */
    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 500, message = "Content must be between 1 and 500 characters")
    private String content;

    /**
     * Whether to send message anonymously (sender_id = NULL)
     */
    @NotNull(message = "isAnonymous flag is required")
    @Builder.Default
    private Boolean isAnonymous = true;
}
