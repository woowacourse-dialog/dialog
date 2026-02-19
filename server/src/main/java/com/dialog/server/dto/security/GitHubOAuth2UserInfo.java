package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.util.Map;

public class GitHubOAuth2UserInfo implements OAuth2UserInfo {

    public static final String ID_PARAM = "id";
    public static final String IMAGE_URL_PARAM = "avatar_url";

    private final Map<String, Object> attributes;

    public GitHubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getOAuthUserId() {
        Object id = attributes.get(ID_PARAM);
        if (id == null) {
            throw new DialogException(ErrorCode.OAUTH_USER_ID_MISSING);
        }
        if (id instanceof Number) {
            return String.valueOf(((Number) id).longValue());
        }
        return id.toString();
    }

    @Override
    public String getProfileImageUrl() {
        Object url = attributes.get(IMAGE_URL_PARAM);
        return url == null ? null : url.toString();
    }

    @Override
    public String getNickname() {
        return getGithubUsername();
    }

    @Override
    public SocialType getSocialType() {
        return SocialType.GITHUB;
    }

    public String getGithubUsername() {
        return (String) attributes.get("login");
    }

}
