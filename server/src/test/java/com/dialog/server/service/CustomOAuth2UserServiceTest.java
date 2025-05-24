package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.security.OAuth2UserPrincipal;
import com.dialog.server.repository.UserRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@ActiveProfiles("test")
@Import({CustomOAuth2UserService.class})
@DataJpaTest
class CustomOAuth2UserServiceTest {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean(name = "defaultOAuth2UserService")
    private OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService;

    private OAuth2UserRequest userRequest;

    private OAuth2User registered;
    private OAuth2User unRegistered;
    private String registeredOAuthId = "1234";
    private String registeredMail = "test@example.com";

    @BeforeEach
    void setUp() {
        userRequest = mock(OAuth2UserRequest.class);

        registered = new DefaultOAuth2User(
                List.of(),
                Map.of("id", registeredOAuthId,
                        "email", registeredMail),
                "id");
        unRegistered = new DefaultOAuth2User(
                List.of(),
                Map.of("id", "0000",
                        "email", "test2@example.com"),
                "id");

        userRepository.save(
                User.builder()
                        .oauthId(registeredOAuthId)
                        .email(registeredMail)
                        .nickname("test")
                        .phoneNotification(false)
                        .emailNotification(false)
                        .role(Role.USER)
                        .build()
        );
    }

    @Test
    @DisplayName("DB에 사용자가 있는 경우 사용자를 불러와 OAuth2UserPrinciple을 생성한다")
    void loadExistUserTest() {
        // given
        when(defaultOAuth2UserService.loadUser(userRequest)).thenReturn(registered);

        // when
        final OAuth2UserPrincipal principal = (OAuth2UserPrincipal) customOAuth2UserService.loadUser(userRequest);

        // then
        assertAll(
                () -> assertThat(principal.user().getOauthId()).isEqualTo(registeredOAuthId),
                () -> assertThat(principal.user().isRegistered()).isTrue(),
                () -> assertThat(principal.attributes().get("id")).isEqualTo(registeredOAuthId)
        );
    }

    @Test
    @DisplayName("사용자가 없는 경우 DB에 임시 사용자를 생성하고 그를 담아 OAuth2UserPrinciple을")
    void loadNonExistUserTest() {
        // given
        when(defaultOAuth2UserService.loadUser(userRequest)).thenReturn(unRegistered);

        // when
        final OAuth2UserPrincipal principal = (OAuth2UserPrincipal) customOAuth2UserService.loadUser(userRequest);

        // then
        assertAll(
                () -> assertThat(principal.user().getOauthId()).isEqualTo("0000"),
                () -> assertThat(principal.user().isRegistered()).isFalse(),
                () -> assertThat(principal.attributes().get("id")).isEqualTo("0000")
        );
    }
}