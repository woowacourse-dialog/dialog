package com.dialog.server.dto.notification.resposne;

import java.util.List;

public record NotificationPageResponse(
    List<NotificationResponse> notifications,
    Long unreadCount,
    int currentPage,
    int pageSize,
    long totalElements,
    int totalPages
) {
    public static NotificationPageResponse of(
        List<NotificationResponse> notifications,
        Long unreadCount,
        int currentPage,
        int pageSize,
        long totalElements
    ) {
        return new NotificationPageResponse(
                notifications,
                unreadCount,
                currentPage,
                pageSize,
                totalElements,
                (int) Math.ceil((double) totalElements / pageSize)
        );
    }
}
