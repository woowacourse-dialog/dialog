package com.dialog.server.dto.notification.resposne;

import com.dialog.server.domain.MessagingToken;

public record MyTokenResponse(String token) {
    public static MyTokenResponse from(MessagingToken token) {
        return new MyTokenResponse(token.getFcmToken());
    }
}
