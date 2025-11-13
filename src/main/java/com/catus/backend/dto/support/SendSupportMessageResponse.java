package com.catus.backend.dto.support;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO after successfully sending a support message.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendSupportMessageResponse {

    /**
     * The created message ID
     */
    private Long messageId;

    /**
     * The recipient user ID
     */
    private Long recipientId;

    /**
     * The message content
     */
    private String content;

    /**
     * Message creation timestamp
     */
    private LocalDateTime createdAt;
}
