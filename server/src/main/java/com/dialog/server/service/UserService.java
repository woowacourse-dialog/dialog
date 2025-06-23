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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProfileImageRepository profileImageRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

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
        ProfileImage updateProfile = updateProfileFile(imageFile, savedProfileImage);
        saveImageFileToLocalStorage(imageFile, updateProfile);
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

    private ProfileImage updateProfileFile(MultipartFile imageFile, ProfileImage profileImage) {
        validEmptyFile(imageFile);
        String originFilename = getOriginFileName(imageFile);
        String fileExtension = getFileExtension(originFilename);
        String storedFileName = getStoredFileName(fileExtension);
        String customImageUri = getCustomImageUri("/profile-images/", storedFileName);
        String filePath = getFileExtension(storedFileName);
        profileImage.updateProfileImage(filePath, originFilename, storedFileName, customImageUri);
        return profileImage;
    }

    private void saveImageFileToLocalStorage(MultipartFile imageFile, ProfileImage profileImage) {
        try {
            Path filePath = getFilePath(profileImage.getStoredFileName());
            imageFile.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new DialogException(ErrorCode.FAILED_SAVE_IMAGE);
        }
    }

    private void validEmptyFile(MultipartFile imageFile) {
        if (imageFile.isEmpty()) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    private String getOriginFileName(MultipartFile imageFile) {
        String originFilename = imageFile.getOriginalFilename();
        if (originFilename == null || originFilename.contains("..")) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
        return originFilename;
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        String fileExtension = (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1).toLowerCase();
        validateImageExtension(fileExtension);
        return fileExtension;
    }

    private String getStoredFileName(String fileExtension) {
        return UUID.randomUUID() + "." + fileExtension;
    }

    private String getCustomImageUri(String prefix, String storedFileName) {
        return prefix + storedFileName;
    }

    private Path getFilePath(String storedFileName) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            return uploadPath.resolve(storedFileName);
        } catch (IOException exception) {
            throw new DialogException(ErrorCode.FAILED_SAVE_IMAGE);
        }
    }

    private void validateImageExtension(String extension) {
        if (!("jpg".equals(extension) || "jpeg".equals(extension) || "png".equals(extension) || "gif".equals(extension))) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }
}
