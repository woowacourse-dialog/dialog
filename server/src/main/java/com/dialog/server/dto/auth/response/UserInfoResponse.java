package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.SocialType;
import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;

public record UserInfoResponse(
        Long id,
        String nickname,
        String githubId,
        Track track,
        boolean isNotificationEnabled,
        SocialType socialType
) {
    public static UserInfoResponse from(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getNickname(),
                user.getGithubId(),
                user.getTrack(),
                user.isWebPushNotification(),
                user.getSocialType()
        );
    }
}
