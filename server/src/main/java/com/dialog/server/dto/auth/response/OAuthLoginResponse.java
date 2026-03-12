package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.User;

public record OAuthLoginResponse(
    boolean isRegistered,
    Long userId,
    String nickname
) {
    public static OAuthLoginResponse registered(User user) {
        return new OAuthLoginResponse(true, user.getId(), user.getNickname());
    }

    public static OAuthLoginResponse needsSignup() {
        return new OAuthLoginResponse(false, null, null);
    }
}
