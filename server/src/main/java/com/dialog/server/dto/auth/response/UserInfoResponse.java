package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;

public record UserInfoResponse(
        Long id,
        String nickname,
        String githubId,
        Track track,
        boolean isNotificationEnabled
) {
    public static UserInfoResponse from(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getNickname(),
                user.getGithubId(),
                user.getTrack(),
                user.isWebPushNotification()
        );
    }
}
