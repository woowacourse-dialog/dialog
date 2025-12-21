package com.dialog.server.dto.notification.resposne;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import com.dialog.server.domain.RouteParams;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long senderId,
        String senderNickname,
        String message,
        NotificationType type,
        RouteParams routeParams,
        LocalDateTime createdAt,
        boolean isRead
        ) {
    public static NotificationResponse from(Notification notification) {
        Long senderId = notification.getSender().getId();
        String senderNickname = notification.getSender().getNickname();
        NotificationType type = notification.getType();
        RouteParams routeParams = notification.getRouteParams();
        String message = type.getMessage(notification.getSender());
        LocalDateTime createdAt = notification.getCreatedAt();
        boolean isRead = notification.isRead();

        return new NotificationResponse(
                notification.getId(),
                senderId,
                senderNickname,
                message,
                type,
                routeParams,
                createdAt,
                isRead
        );
    }

    public static NotificationResponse getEmptyResponse() {
        return new NotificationResponse(null, null, null, null,null, null, null, false);
    }
}
