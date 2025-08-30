package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.User;

public record UserInfoResponse(
        Long id,
        String nickname,
        boolean isNotificationEnabled
) {
    public static UserInfoResponse from(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getNickname(),
                user.isWebPushNotification()
        );
    }
}
