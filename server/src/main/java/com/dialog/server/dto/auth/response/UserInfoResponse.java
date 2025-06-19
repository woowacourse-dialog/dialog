package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.User;

public record UserInfoResponse(
        String nickname,
        String email,
        boolean isNotificationEnabled
) {
    public static UserInfoResponse from(User user) {
        return new UserInfoResponse(
                user.getNickname(),
                user.getEmail(),
                user.isEmailNotification()
        );
    }
}
