package com.catus.backend.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for ending a conversation and performing final analysis.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EndConversationRequest {

    /**
     * List of messages in the conversation (for emotion analysis).
     */
    @NotNull(message = "Messages cannot be null")
    private List<String> messages;

    /**
     * Optional diary ID to associate with the conversation.
     */
    private Long diaryId;
}
