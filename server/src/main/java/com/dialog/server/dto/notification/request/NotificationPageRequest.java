package com.dialog.server.dto.notification.request;

public record NotificationPageRequest(
    Integer page,
    Integer size
) {
    public NotificationPageRequest {
        if (page == null || page < 0) {
            page = 0;
        }
        if (size == null || size <= 0) {
            size = 20;
        }
        if (size > 50) {
            size = 50;
        }
    }
}