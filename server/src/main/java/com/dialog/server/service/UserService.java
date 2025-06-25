package com.dialog.server.service;

import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.NotificationSettingResponse;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.dto.response.BasicProfileImageResponse;
import com.dialog.server.dto.response.ProfileImageGetResponse;
import com.dialog.server.dto.response.ProfileImageUpdateResponse;
import com.dialog.server.dto.security.GitHubOAuth2UserInfo;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProfileImageRepository profileImageRepository;
    private final S3Uploader s3Uploader;

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
                .email(oAuth2UserInfo.getEmail())
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
        ProfileImage savedProfileImage = profileImageRepository.findByUser(user).orElseThrow(() -> new DialogException(ErrorCode.PROFILE_IMAGE_NOT_FOUND));
        ProfileImage updateProfile = uploadAndSaveProfileImage(imageFile, savedProfileImage);
        return ProfileImageUpdateResponse.from(updateProfile);
    }

    @Transactional(readOnly = true)
    public ProfileImageGetResponse getProfileImage(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        ProfileImage profileImage = profileImageRepository.findByUser(user).orElseThrow(() -> new DialogException(ErrorCode.PROFILE_IMAGE_NOT_FOUND));
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
        validBasicProfileUri(basicProfileUri);
        return ProfileImage.builder()
                .basicImageUri(basicProfileUri)
                .user(user)
                .build();
    }

    private void validBasicProfileUri(String basicProfileUri) {
        if (basicProfileUri == null || basicProfileUri.isBlank()) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    private ProfileImage uploadAndSaveProfileImage(MultipartFile imageFile, ProfileImage profileImage) {
        validEmptyFile(imageFile);
        String originFilename = getOriginFileName(imageFile);
        String fileExtension = getFileExtension(originFilename);
        String storedFileName = getStoredFileName(fileExtension);
        String updatedImageUri;
        try {
            String uploadDirName = "profile-images";
            updatedImageUri = s3Uploader.upload(imageFile, uploadDirName, storedFileName);
        } catch (IOException e) {
            throw new DialogException(ErrorCode.FAILED_SAVE_IMAGE);
        }
        profileImage.updateProfileImage(originFilename, storedFileName, updatedImageUri);
        profileImageRepository.save(profileImage);
        return profileImage;
    }

    private void validEmptyFile(MultipartFile imageFile) {
        if (imageFile.isEmpty()) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    private String getOriginFileName(MultipartFile imageFile) {
        String originFilename = imageFile.getOriginalFilename();
        String invalidPath = "..";
        if (originFilename == null || originFilename.contains(invalidPath)) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
        return originFilename;
    }

    private String getFileExtension(String fileName) {
        String separator = ".";
        int separatorIndex = fileName.lastIndexOf(separator);
        String fileExtension;
        if (separatorIndex == -1) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        } else {
            fileExtension = fileName.substring(separatorIndex + 1).toLowerCase();
        }
        validateAvailableExtension(fileExtension);
        return fileExtension;
    }

    private String getStoredFileName(String fileExtension) {
        String storedFileRegex = "%s.%s";
        UUID uuid = UUID.randomUUID();
        return String.format(storedFileRegex, uuid, fileExtension);
    }

    private void validateAvailableExtension(String extension) {
        List<String> availableExtensions = List.of("png", "jpg", "jpeg", "gif");
        if (!availableExtensions.contains(extension)) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }
}
