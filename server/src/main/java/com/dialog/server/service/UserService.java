package com.dialog.server.service;

import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.NotificationSettingResponse;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.dto.request.UserMypageUpdateRequest;
import com.dialog.server.dto.response.BasicProfileImageResponse;
import com.dialog.server.dto.response.MyTrackGetTrackResponse;
import com.dialog.server.dto.response.ProfileImageGetResponse;
import com.dialog.server.dto.response.ProfileImageUpdateResponse;
import com.dialog.server.dto.security.GitHubOAuth2UserInfo;
import com.dialog.server.dto.security.OAuth2UserInfo;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import com.dialog.server.util.ImageFileExtractor;
import com.dialog.server.util.ProfileImageFileInfo;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProfileImageRepository profileImageRepository;
    private final S3Uploader s3Uploader;
    private final ImageFileExtractor imageFileExtractor;

    @Transactional(readOnly = true)
    public UserInfoResponse getUserInfo(Long userId) {
        User findUser = getUserById(userId);
        return UserInfoResponse.from(findUser);
    }

    @Transactional
    public User findOrCreateTempUser(OAuth2UserInfo userInfo) {
        try {
            return userRepository.findByOauthIdAndSocialType(
                            userInfo.getOAuthUserId(), userInfo.getSocialType())
                    .orElseGet(() -> saveTempUser(userInfo));
        } catch (DataIntegrityViolationException e) {
            return userRepository.findByOauthIdAndSocialType(
                            userInfo.getOAuthUserId(), userInfo.getSocialType())
                    .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        }
    }

    private User saveTempUser(OAuth2UserInfo userInfo) {
        String githubId = null;
        if (userInfo instanceof GitHubOAuth2UserInfo gitHubInfo) {
            githubId = gitHubInfo.getGithubUsername();
        }

        final User tempUser = User.builder()
                .oauthId(userInfo.getOAuthUserId())
                .nickname(userInfo.getNickname())
                .githubId(githubId)
                .socialType(userInfo.getSocialType())
                .role(Role.TEMP_USER)
                .build();
        final ProfileImage profileImage = ProfileImage.builder()
                .user(tempUser)
                .basicImageUri(userInfo.getProfileImageUrl())
                .build();
        final User saved = userRepository.save(tempUser);
        profileImageRepository.save(profileImage);
        return saved;
    }

    @Transactional
    public NotificationSettingResponse updateNotification(NotificationSettingRequest request, Long userId) {
        boolean notificationEnable = request.isNotificationEnable();
        User user = getUserById(userId);
        user.updateNotificationSetting(notificationEnable);
        User updatedUser = userRepository.save(user);
        return NotificationSettingResponse.from(updatedUser);
    }

    @Transactional
    public BasicProfileImageResponse registerBasicProfileImage(String basicProfileUri, Long userId) {
        User user = getUserById(userId);
        validateConflictProfileImage(user);
        ProfileImage profileImage = createBasicProfileFile(basicProfileUri, user);
        profileImageRepository.save(profileImage);
        return BasicProfileImageResponse.from(profileImage);
    }

    @Transactional
    public ProfileImageUpdateResponse updateProfileImage(MultipartFile imageFile, Long userId) {
        User user = getUserById(userId);
        ProfileImage savedProfileImage = profileImageRepository.findByUser(user)
                .orElseThrow(() -> new DialogException(ErrorCode.PROFILE_IMAGE_NOT_FOUND));
        ProfileImage updateProfile = uploadAndSaveProfileImage(imageFile, savedProfileImage);
        return ProfileImageUpdateResponse.from(updateProfile);
    }

    @Transactional
    public void modifyUserInfo(Long userId, UserMypageUpdateRequest userMypageUpdateRequest) {
        User user = getUserById(userId);
        user.updateUser(userMypageUpdateRequest.nickname(), userMypageUpdateRequest.track());
    }

    @Transactional(readOnly = true)
    public ProfileImageGetResponse getProfileImage(Long userId) {
        User user = getUserById(userId);
        ProfileImage profileImage = profileImageRepository.findByUser(user)
                .orElseThrow(() -> new DialogException(ErrorCode.PROFILE_IMAGE_NOT_FOUND));
        String customImageUri = profileImage.getCustomImageUri();
        String basicImageUri = profileImage.getBasicImageUri();
        return new ProfileImageGetResponse(customImageUri, basicImageUri);
    }

    @Transactional
    public void withdraw(Long userId) {
        User user = getUserById(userId);
        user.withdraw();
    }

    private void validateConflictProfileImage(User user) {
        boolean exists = profileImageRepository.existsByUser(user);
        if (exists) {
            throw new DialogException(ErrorCode.CONFLICT_PROFILE_IMAGE);
        }
    }

    private ProfileImage createBasicProfileFile(String basicProfileUri, User user) {
        return ProfileImage.builder()
                .basicImageUri(basicProfileUri)
                .user(user)
                .build();
    }

    private ProfileImage uploadAndSaveProfileImage(MultipartFile imageFile, ProfileImage profileImage) {
        ProfileImageFileInfo fileInfo = imageFileExtractor.getInfo(imageFile);
        String updatedImageUri;
        try {
            updatedImageUri = s3Uploader.uploadProfileImage(imageFile, fileInfo.storedFileName());
        } catch (IOException e) {
            throw new DialogException(ErrorCode.FAILED_SAVE_IMAGE);
        }
        profileImage.updateProfileImage(fileInfo, updatedImageUri);
        profileImageRepository.save(profileImage);
        return profileImage;
    }

    public MyTrackGetTrackResponse getTrack(Long userId) {
        User user = getUserById(userId);
        return MyTrackGetTrackResponse.from(user);
    }

    private User getUserById(final Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    }
}
