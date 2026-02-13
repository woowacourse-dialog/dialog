package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;
import java.util.Map;

public class AppleOAuth2UserInfo implements OAuth2UserInfo {

    private final String defaultProfileImageUrl;
    private final Map<String, Object> claims;

    public AppleOAuth2UserInfo(Map<String, Object> claims, String defaultProfileImageUrl) {
        this.claims = claims;
        this.defaultProfileImageUrl = defaultProfileImageUrl;
    }

    @Override
    public String getOAuthUserId() {
        return (String) claims.get("sub");
    }

    @Override
    public String getProfileImageUrl() {
        return defaultProfileImageUrl;
    }

    @Override
    public String getNickname() {
        String firstName = (String) claims.get("firstName");
        if (firstName != null && !firstName.isBlank()) {
            String lastName = (String) claims.get("lastName");
            return lastName != null ? firstName + " " + lastName : firstName;
        }
        String email = (String) claims.get("email");
        if (email != null && !email.matches(".*@privaterelay\\.appleid\\.com$")) {
            return email.split("@")[0];
        }
        String sub = getOAuthUserId();
        return "Apple_" + (sub != null ? sub.substring(0, Math.min(sub.length(), 8)) : "User");
    }

    @Override
    public SocialType getSocialType() {
        return SocialType.APPLE;
    }
}
