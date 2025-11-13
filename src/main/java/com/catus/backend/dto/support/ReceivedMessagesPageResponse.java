package com.catus.backend.dto.support;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated response for received support messages.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceivedMessagesPageResponse {

    /**
     * List of received messages
     */
    private List<ReceivedSupportMessageResponse> messages;

    /**
     * Total number of messages
     */
    private Long totalElements;

    /**
     * Total number of pages
     */
    private Integer totalPages;

    /**
     * Current page number (0-indexed)
     */
    private Integer currentPage;

    /**
     * Page size
     */
    private Integer pageSize;
}
