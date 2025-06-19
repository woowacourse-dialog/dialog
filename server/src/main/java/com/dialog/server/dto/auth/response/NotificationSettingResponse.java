package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.User;

public record NotificationSettingResponse(boolean isNotificationEnable) {
    public static NotificationSettingResponse from(User user) {
        return new NotificationSettingResponse(user.isEmailNotification());
    }
}
