package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;
import java.util.Map;

public class AppleOAuth2UserInfo implements OAuth2UserInfo {

    private static final String CLAIM_SUB = "sub";
    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_FIRST_NAME = "firstName";
    private static final String CLAIM_LAST_NAME = "lastName";

    private final String defaultProfileImageUrl;
    private final Map<String, Object> claims;

    public AppleOAuth2UserInfo(Map<String, Object> claims, String defaultProfileImageUrl) {
        this.claims = claims;
        this.defaultProfileImageUrl = defaultProfileImageUrl;
    }

    @Override
    public String getOAuthUserId() {
        return (String) claims.get(CLAIM_SUB);
    }

    @Override
    public String getProfileImageUrl() {
        return defaultProfileImageUrl;
    }

    @Override
    public String getNickname() {
        String firstName = (String) claims.get(CLAIM_FIRST_NAME);
        if (firstName != null && !firstName.isBlank()) {
            String lastName = (String) claims.get(CLAIM_LAST_NAME);
            String nickname = lastName != null ? firstName + " " + lastName : firstName;
            return truncate(nickname);
        }
        String email = (String) claims.get(CLAIM_EMAIL);
        if (email != null && !email.matches(".*@privaterelay\\.appleid\\.com$")) {
            return truncate(email.split("@")[0]);
        }
        String sub = getOAuthUserId();
        return "Apple_" + (sub != null ? sub.substring(0, Math.min(sub.length(), 8)) : "User");
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() > 15 ? value.substring(0, 15) : value;
    }

    @Override
    public SocialType getSocialType() {
        return SocialType.APPLE;
    }
}
