package com.dialog.server.dto.notification.resposne;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.PollingStatus;

public record NotificationPollingResponse(
        PollingStatus status,
        NotificationResponse notificationsResponse,
        Long isReadFalseCount
) {
    public static NotificationPollingResponse of(Notification notification, Long unreadCount) {
        NotificationResponse notificationsResponse = NotificationResponse.from(notification);
        return new NotificationPollingResponse(PollingStatus.NEW_NOTIFICATION, notificationsResponse, unreadCount);
    }

    public static NotificationPollingResponse createTimeoutResponse() {
        return new NotificationPollingResponse(PollingStatus.TIMEOUT, NotificationResponse.getEmptyResponse(), 0L);
    }
}
