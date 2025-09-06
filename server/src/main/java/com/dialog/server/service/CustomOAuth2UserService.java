package com.dialog.server.service;

import com.dialog.server.domain.User;
import com.dialog.server.dto.security.GitHubOAuth2UserInfo;
import com.dialog.server.dto.security.OAuth2UserPrincipal;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService;
    private final UserService userService;

    public CustomOAuth2UserService(@Qualifier("defaultOAuth2UserService") OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService,
                                   UserService userService) {
        this.defaultOAuth2UserService = defaultOAuth2UserService;
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = defaultOAuth2UserService.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        GitHubOAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(attributes);

        User user = userService.findOrCreateTempUser(userInfo);

        return new OAuth2UserPrincipal(user, attributes);
    }
}
