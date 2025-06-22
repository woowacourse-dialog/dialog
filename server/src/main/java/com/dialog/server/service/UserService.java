package com.dialog.server.service;

import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.NotificationSettingResponse;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.dto.security.GitHubOAuth2UserInfo;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProfileImageRepository profileImageRepository;

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
                .accessUrl(oAuth2UserInfo.getProfileImageUrl())
                .build();
        final User saved = userRepository.save(tempUser);
        profileImageRepository.save(profileImage);
        return saved;
    }

    public NotificationSettingResponse updateNotification(NotificationSettingRequest request, Long userId) {
        boolean notificationEnable = request.isNotificationEnable();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        user.updateNotificationSetting(notificationEnable);
        User updatedUser = userRepository.save(user);
        return NotificationSettingResponse.from(updatedUser);
    }
}
