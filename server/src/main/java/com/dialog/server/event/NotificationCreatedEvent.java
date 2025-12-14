package com.dialog.server.event;

import com.dialog.server.domain.Notification;

public class NotificationCreatedEvent {

    private final Notification notification;
    private final Long unreadCount;

    public NotificationCreatedEvent(Notification notification, Long unreadCount) {
        this.notification = notification;
        this.unreadCount = unreadCount;
    }

    public Notification getNotification() {
        return notification;
    }

    public Long getUnreadCount() {
        return unreadCount;
    }
}
