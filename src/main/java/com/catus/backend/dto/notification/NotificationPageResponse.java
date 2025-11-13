package com.catus.backend.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Response DTO for paginated notification list
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPageResponse {

    private List<NotificationResponse> notifications;
    private long totalElements;
    private int totalPages;

    /**
     * Create paginated response from Page object
     */
    public static NotificationPageResponse from(Page<NotificationResponse> page) {
        return NotificationPageResponse.builder()
                .notifications(page.getContent())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
