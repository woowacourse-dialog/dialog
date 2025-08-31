package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.SignupRequest;
import com.dialog.server.exception.DialogException;
import com.dialog.server.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;

@Import(JpaConfig.class)
@DataJpaTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    private UserRepository userRepository;

    private AuthService authService;

    private User user; // 등록된 사용자
    private User tempUser; // 등록되지 않은 사용자 (OAuth 로그인만 수행, 회원가입 하지 않음)

    private String newNickname = "new-nickname";
    private String newOAuthId = "new-oauth-id";

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository);

        user = userRepository.save(
                User.builder()
                        .oauthId("oauth123")
                        .nickname("testUser")
                        .role(Role.USER)
                        .build()
        );
        tempUser = userRepository.save(
                User.builder()
                        .oauthId("oauth1234")
                        .build()
        );
    }

    @Test
    @DisplayName("사용자 회원가입 성공")
    void registerUserTest() {
        // given
        SignupRequest signupRequest = new SignupRequest(
                newNickname,
                Track.BACKEND,
                false
        );

        // when
        final Long id = authService.registerUser(signupRequest, tempUser.getOauthId());

        // then
        final Optional<User> user = userRepository.findById(id);

        assertThat(user).isPresent();
        assertAll(
                () -> assertThat(user.get().getOauthId()).isEqualTo(tempUser.getOauthId()),
                () -> assertThat(user.get().getNickname()).isEqualTo(newNickname)
        );
    }

    @Test
    @DisplayName("이미 회원가입한 사용자라면 예외가 발생한다.")
    void alreadyRegisteredUserTest() {
        // given
        SignupRequest signupRequest = new SignupRequest(
                newNickname,
                Track.BACKEND,
                false
        );

        // when, then
        assertThatThrownBy(() -> authService.registerUser(signupRequest, user.getOauthId()))
                .isInstanceOf(DialogException.class);
    }

    @Test
    @DisplayName("깃허브 로그인을 하지 않고 회원가입 시도 시 예외가 발생한다")
    void notOAuthUserTest() {
        // given
        SignupRequest signupRequest = new SignupRequest(
                newNickname,
                Track.BACKEND,
                false
        );

        // when, then
        assertThatThrownBy(() -> authService.registerUser(signupRequest, newOAuthId))
                .isInstanceOf(DialogException.class);
    }

    @Test
    @DisplayName("등록된 사용자의 인증이 성공적으로 이루어진다")
    void authenticateSuccessTest() {
        // when
        Authentication authentication = authService.authenticate(user.getId());

        // then
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getPrincipal()).isEqualTo(user.getId());
        assertThat(authentication.getCredentials()).isNull();

        assertThat(authentication.getAuthorities()).hasSize(1);
    }

    @Test
    @DisplayName("존재하지 않는 OAuth ID로 인증 시 예외가 발생한다")
    void authenticateWithNonExistingUserTest() {
        // when, then
        assertThatThrownBy(() -> authService.authenticate(999L))
                .isInstanceOf(DialogException.class);
    }

    @Test
    @DisplayName("등록되지 않은 사용자 인증 시 예외가 발생한다")
    void authenticateUnregisteredUserTest() {
        // when, then
        assertThatThrownBy(() -> authService.authenticate(tempUser.getId()))
                .isInstanceOf(DialogException.class);
    }
}
