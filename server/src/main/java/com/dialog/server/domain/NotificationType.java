package com.dialog.server.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum NotificationType {
    DISCUSSION_COMMENT("%s님이 토론에 의견을 남겼습니다."),
    COMMENT_REPLY("%s님이 의견에 답글을 남겼습니다."),
    MENTION("%s님이 토론에서 회원님을 멘션했습니다.");

    private final String message;

    public String getMessage(User sender) {
        return String.format(message, sender.getNickname());
    }
}
