package com.dialog.server.service;

import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.NotificationSettingResponse;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.dto.response.BasicProfileImageResponse;
import com.dialog.server.dto.response.MyTrackGetTrackResponse;
import com.dialog.server.dto.response.ProfileImageGetResponse;
import com.dialog.server.dto.response.ProfileImageUpdateResponse;
import com.dialog.server.dto.security.GitHubOAuth2UserInfo;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
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
        User findUser = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        return UserInfoResponse.from(findUser);
    }

    @Transactional
    public User findOrCreateTempUser(GitHubOAuth2UserInfo userInfo) {
        return userRepository.findUserByOauthId(userInfo.getOAuthUserId())
                .orElseGet(() -> saveTempUser(userInfo));
    }

    private User saveTempUser(GitHubOAuth2UserInfo oAuth2UserInfo) {
        final User tempUser = User.builder()
                .oauthId(oAuth2UserInfo.getOAuthUserId())
                .role(Role.TEMP_USER)
                .build();
        final ProfileImage profileImage = ProfileImage.builder()
                .user(tempUser)
                .basicImageUri(oAuth2UserInfo.getProfileImageUrl())
                .build();
        final User saved = userRepository.save(tempUser);
        profileImageRepository.save(profileImage);
        return saved;
    }

    @Transactional
    public NotificationSettingResponse updateNotification(NotificationSettingRequest request, Long userId) {
        boolean notificationEnable = request.isNotificationEnable();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        user.updateNotificationSetting(notificationEnable);
        User updatedUser = userRepository.save(user);
        return NotificationSettingResponse.from(updatedUser);
    }

    @Transactional
    public BasicProfileImageResponse registerBasicProfileImage(String basicProfileUri, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        validateConflictProfileImage(user);
        ProfileImage profileImage = createBasicProfileFile(basicProfileUri, user);
        profileImageRepository.save(profileImage);
        return BasicProfileImageResponse.from(profileImage);
    }

    @Transactional
    public ProfileImageUpdateResponse updateProfileImage(MultipartFile imageFile, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        ProfileImage savedProfileImage = profileImageRepository.findByUser(user)
                .orElseThrow(() -> new DialogException(ErrorCode.PROFILE_IMAGE_NOT_FOUND));
        ProfileImage updateProfile = uploadAndSaveProfileImage(imageFile, savedProfileImage);
        return ProfileImageUpdateResponse.from(updateProfile);
    }

    @Transactional(readOnly = true)
    public ProfileImageGetResponse getProfileImage(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        ProfileImage profileImage = profileImageRepository.findByUser(user)
                .orElseThrow(() -> new DialogException(ErrorCode.PROFILE_IMAGE_NOT_FOUND));
        String customImageUri = profileImage.getCustomImageUri();
        String basicImageUri = profileImage.getBasicImageUri();
        return new ProfileImageGetResponse(customImageUri, basicImageUri);
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
        User user = userRepository.findById(userId).orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        return MyTrackGetTrackResponse.from(user);
    }
}
