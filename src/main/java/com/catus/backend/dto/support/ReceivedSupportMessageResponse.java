package com.catus.backend.dto.support;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for a single received support message.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceivedSupportMessageResponse {

    /**
     * The message ID
     */
    private Long messageId;

    /**
     * The diary ID that received the message
     */
    private Long diaryId;

    /**
     * The diary date
     */
    private LocalDate diaryDate;

    /**
     * Sender nickname (or "익명" for anonymous)
     */
    private String senderNickname;

    /**
     * The message content
     */
    private String content;

    /**
     * Whether message has been read
     */
    private Boolean isRead;

    /**
     * Message creation timestamp
     */
    private LocalDateTime createdAt;
}
