package com.dialog.server.service;

import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.security.GitHubOAuth2UserInfo;
import com.dialog.server.dto.security.OAuth2UserPrincipal;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService;
    private final ProfileImageRepository profileImageRepository;

    public CustomOAuth2UserService(UserRepository userRepository,
                                   @Qualifier("defaultOAuth2UserService") OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService,
                                   ProfileImageRepository profileImageRepository) {
        this.userRepository = userRepository;
        this.defaultOAuth2UserService = defaultOAuth2UserService;
        this.profileImageRepository = profileImageRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = defaultOAuth2UserService.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        GitHubOAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(attributes);

        User user = userRepository.findUserByOauthId(userInfo.getOAuthUserId())
                .orElseGet(() -> saveTempUser(userInfo));

        return new OAuth2UserPrincipal(user, attributes);
    }

    @Transactional
    protected User saveTempUser(GitHubOAuth2UserInfo oAuth2UserInfo) {
        final User tempUser = User.builder()
                .oauthId(oAuth2UserInfo.getOAuthUserId())
                .email(oAuth2UserInfo.getEmail())
                .role(Role.TEMP_USER)
                .build();
        final ProfileImage profileImage = ProfileImage.builder()
                .user(tempUser)
                .accessUrl(oAuth2UserInfo.getProfileImageUrl())
                .build();
        final User saved = userRepository.save(tempUser);
        profileImageRepository.save(profileImage);
        return saved;
    }
}
