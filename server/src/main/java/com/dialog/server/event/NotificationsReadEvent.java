package com.dialog.server.event;

import lombok.Getter;

@Getter
public class NotificationsReadEvent {

    private final Long userId;
    private final Long unreadCount;

    public NotificationsReadEvent(Long userId, Long unreadCount) {
        this.userId = userId;
        this.unreadCount = unreadCount;
    }
}
