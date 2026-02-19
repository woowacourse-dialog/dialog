package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;

public interface OAuth2UserInfo {
    String getOAuthUserId();
    String getProfileImageUrl();
    String getNickname();
    SocialType getSocialType();
}
