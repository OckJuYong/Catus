package com.catus.backend.dto.chat;

import com.catus.backend.model.ChatMessage;
import com.catus.backend.model.EmotionType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for chat message data.
 * Contains the conversation exchange between user and AI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {

    /**
     * Unique message ID
     */
    private Long id;

    /**
     * User's original message
     */
    private String userMessage;

    /**
     * AI companion's response
     */
    private String aiResponse;

    /**
     * Detected emotion from user's message
     */
    private EmotionType detectedEmotion;

    /**
     * Timestamp when the message was created
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * Factory method to create response from ChatMessage entity
     */
    public static ChatMessageResponse from(ChatMessage chatMessage) {
        return ChatMessageResponse.builder()
            .id(chatMessage.getMessageId())
            .userMessage(chatMessage.getUserMessage())
            .aiResponse(chatMessage.getAiResponse())
            .detectedEmotion(chatMessage.getDetectedEmotion())
            .timestamp(chatMessage.getCreatedAt())
            .build();
    }
}
