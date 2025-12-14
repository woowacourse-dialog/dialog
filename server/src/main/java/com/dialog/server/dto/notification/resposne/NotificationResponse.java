package com.dialog.server.dto.notification.resposne;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long senderId,
        String senderNickname,
        String message,
        NotificationType type,
        LocalDateTime createdAt,
        boolean isRead
        ) {
    public static NotificationResponse from(Notification notification) {
        Long receiverId = notification.getReceiver().getId();
        String receiverNickname = notification.getReceiver().getNickname();
        NotificationType type = notification.getType();
        String message = type.getMessage(notification.getSender());
        LocalDateTime createdAt = notification.getCreatedAt();
        boolean isRead = notification.isRead();

        return new NotificationResponse(
                notification.getId(),
                receiverId,
                receiverNickname,
                message,
                type,
                createdAt,
                isRead
        );
    }

    public static NotificationResponse getEmptyResponse() {
        return new NotificationResponse(null, null, null, null, null, null, false);
    }
}
