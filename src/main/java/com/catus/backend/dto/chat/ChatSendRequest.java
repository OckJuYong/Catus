package com.catus.backend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for sending a chat message via /send endpoint.
 * Uses "content" field name for frontend compatibility.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSendRequest {

    /**
     * User's message content (frontend uses "content" instead of "message").
     * Max 500 characters to maintain conversation quality and API efficiency.
     */
    @NotBlank(message = "Content cannot be empty")
    @Size(min = 1, max = 500, message = "Content must be between 1 and 500 characters")
    private String content;
}
