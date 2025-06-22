package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@Import(JpaConfig.class)
@ActiveProfiles("test")
@DataJpaTest
public class UserServiceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileImageRepository profileImageRepository;

    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, profileImageRepository);
        user = userRepository.save(createUser());
    }

    @Test
    void 유저_정보를_생성한다() {
        //given&when
        UserInfoResponse userInfo = userService.getUserInfo(user.getId());
        //then
        assertAll(
                () -> assertThat(userInfo.nickname()).isEqualTo("minggom"),
                () -> assertThat(userInfo.email()).isEqualTo("hippo@test.com"),
                () -> assertThat(userInfo.isNotificationEnabled()).isTrue()
        );
    }

    @Test
    void 알림_수신_여부_변경요청_확인() {
        //given
        NotificationSettingRequest request = new NotificationSettingRequest(false);
        //when
        userService.updateNotification(request, user.getId());
        UserInfoResponse userInfo = userService.getUserInfo(user.getId());
        //then
        Assertions.assertThat(userInfo.isNotificationEnabled()).isFalse();
    }

    private User createUser() {
        return User.builder()
                .nickname("minggom")
                .email("hippo@test.com")
                .role(Role.USER)
                .emailNotification(true)
                .phoneNotification(true)
                .phoneNumber("01012345678")
                .oauthId("oauthId1")
                .build();
    }
}
