package com.dialog.server.dto.notification.resposne;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.PollingStatus;

import java.util.Collections;
import java.util.List;

public record NotificationPollingResponse(
        PollingStatus status,
        List<NotificationResponse> notifications,
        Long unreadCount
) {
    public static NotificationPollingResponse of(List<Notification> notifications, Long unreadCount) {
        List<NotificationResponse> notificationResponses = notifications.stream()
                .map(NotificationResponse::from)
                .toList();
        return new NotificationPollingResponse(PollingStatus.NEW_NOTIFICATION, notificationResponses, unreadCount);
    }

    public static NotificationPollingResponse of(Notification notification, Long unreadCount) {
        NotificationResponse notificationResponse = NotificationResponse.from(notification);
        return new NotificationPollingResponse(PollingStatus.NEW_NOTIFICATION, List.of(notificationResponse), unreadCount);
    }

    public static NotificationPollingResponse createTimeoutResponse() {
        return new NotificationPollingResponse(PollingStatus.TIMEOUT, Collections.emptyList(), 0L);
    }

    public static NotificationPollingResponse createBulkReadResponse(Long unreadCount) {
        return new NotificationPollingResponse(PollingStatus.NEW_NOTIFICATION, Collections.emptyList(), unreadCount);
    }
}
