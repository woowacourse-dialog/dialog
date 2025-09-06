package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.dto.response.BasicProfileImageResponse;
import com.dialog.server.dto.response.ProfileImageGetResponse;
import com.dialog.server.dto.response.ProfileImageUpdateResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.UserRepository;
import com.dialog.server.util.ImageFileExtractor;
import java.io.File;
import java.io.IOException;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.multipart.MultipartFile;

@Import({JpaConfig.class, UserService.class, ImageFileExtractor.class})
@ActiveProfiles("test")
@DataJpaTest
public class UserServiceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @MockitoBean
    private S3Uploader s3Uploader;

    private User user;

    @BeforeEach
    void setUp() throws IOException {
        user = userRepository.save(createUser());

        Mockito.when(s3Uploader.uploadProfileImage(any(MultipartFile.class), any(String.class)))
                .thenReturn("https://awss3.com/profile-images/mocked-image.png");
    }

    @Test
    void 유저_정보를_생성한다() {
        //given&when
        UserInfoResponse userInfo = userService.getUserInfo(user.getId());
        //then
        assertAll(
                () -> assertThat(userInfo.nickname()).isEqualTo("minggom"),
                () -> assertThat(userInfo.track()).isEqualTo(Track.BACKEND),
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

    @Test
    void 프로필_이미지_정상등록_성공() {
        BasicProfileImageResponse response = userService.registerBasicProfileImage("https://test.com/basicUri1", user.getId());
        ProfileImageGetResponse getProfileImageResponse = userService.getProfileImage(user.getId());
        assertThat(response.basicImageUri()).isEqualTo(getProfileImageResponse.basicImageUri());
    }

    @Test
    void 존재하지_않는_유저_프로필_등록_시_예외_발생() throws IOException {
        MultipartFile imageFile = Mockito.mock(MultipartFile.class);
        Mockito.when(imageFile.getOriginalFilename()).thenReturn("profile_test.png");
        Mockito.when(imageFile.isEmpty()).thenReturn(false);
        doNothing().when(imageFile).transferTo(any(File.class));

        assertThatThrownBy(() -> userService.registerBasicProfileImage("https://test.com/basicUri1", 999L))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void 등록된_프로필_이미지가_존재하는_경우_예외_발생() {
        userService.registerBasicProfileImage("https://test.com/basicUri1", user.getId());

        assertThatThrownBy(() -> userService.registerBasicProfileImage("https://test.com/basicUri2", user.getId()))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONFLICT_PROFILE_IMAGE);
    }

    @ParameterizedTest
    @CsvSource(value = {"''", "' '", "null"}, nullValues = "null")
    void basicUri_경로_빈_값이면_예외_발생(String basicUri) {
        assertThatThrownBy(() -> userService.registerBasicProfileImage(basicUri, user.getId()))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_IMAGE_FORMAT);
    }

    @ParameterizedTest
    @CsvSource(value = {".png", ".jpg", ".jpeg", ".gif"})
    void 허용된_확장자인_경우_확인(String extension) throws IOException {
        MultipartFile imageFile = Mockito.mock(MultipartFile.class);
        Mockito.when(imageFile.getOriginalFilename()).thenReturn("profile_test" + extension);
        Mockito.when(imageFile.isEmpty()).thenReturn(false);
        doNothing().when(imageFile).transferTo(any(File.class));

        userService.registerBasicProfileImage("https://test.com/basicUri1", user.getId());
        assertDoesNotThrow(() -> userService.updateProfileImage(imageFile, user.getId()));
    }

    @ParameterizedTest
    @CsvSource(value = {".bmp", ".webp", ".svg", ".tiff", ".tif", ".heic", ".heif", ".ico", ".avif"})
    void 허용된_확장자가_아닌_경우_예외_발생(String extension) throws IOException {
        MultipartFile imageFile = Mockito.mock(MultipartFile.class);
        Mockito.when(imageFile.getOriginalFilename()).thenReturn("profile_test" + extension);
        Mockito.when(imageFile.isEmpty()).thenReturn(false);
        doNothing().when(imageFile).transferTo(any(File.class));

        userService.registerBasicProfileImage("https://test.com/basicUri1", user.getId());
        assertThatThrownBy(() -> userService.updateProfileImage(imageFile, user.getId()))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_IMAGE_FORMAT);
    }

    @Test
    void 프로필_이미지_수정_확인() throws IOException {
        BasicProfileImageResponse savedResponse = userService.registerBasicProfileImage("https://test.com/basicUri1", user.getId());

        MultipartFile updateProfileFile = Mockito.mock(MultipartFile.class);
        Mockito.when(updateProfileFile.getOriginalFilename()).thenReturn("update_profile_test.png");
        Mockito.when(updateProfileFile.isEmpty()).thenReturn(false);
        doNothing().when(updateProfileFile).transferTo(any(File.class));

        ProfileImageUpdateResponse updateResponse = userService.updateProfileImage(updateProfileFile, user.getId());

        assertAll(
                () -> assertThat(savedResponse.basicImageUri()).isEqualTo(updateResponse.basicImageUri()),
                () -> assertThat(savedResponse.customImageUri()).isNotEqualTo(updateResponse.customImageUri())
        );
    }


    private User createUser() {
        return User.builder()
                .nickname("minggom")
                .role(Role.USER)
                .track(Track.BACKEND)
                .webPushNotification(true)
                .oauthId("oauthId1")
                .build();
    }
}
