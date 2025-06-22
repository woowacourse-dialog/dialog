package com.dialog.server.service;

import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.MessagingTokenRepository;
import com.dialog.server.repository.UserRepository;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    private final MessagingTokenRepository messagingTokenRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;

    public NotificationService(MessagingTokenRepository messagingTokenRepository, UserRepository userRepository,
                               FcmService fcmService) {
        this.messagingTokenRepository = messagingTokenRepository;
        this.userRepository = userRepository;
        this.fcmService = fcmService;
    }

    public TokenCreationResponse addMessagingToken(Long userId, String token) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        final MessagingToken messagingToken = MessagingToken.builder()
                .user(user)
                .fcmToken(token)
                .build();
        return new TokenCreationResponse(messagingTokenRepository.save(messagingToken).getId());
    }

    public void deleteMessagingToken(Long id) {
        messagingTokenRepository.deleteById(id);
    }

    public List<MyTokenResponse> getMessagingTokensByUserId(Long userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        return messagingTokenRepository.findMessagingTokensByUser(user).stream()
                .map(MyTokenResponse::from)
                .toList();
    }

    public void updateToken(Long userId, Long tokenId, String newToken) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        final MessagingToken messagingToken = messagingTokenRepository.findById(tokenId)
                .orElseThrow(() -> new DialogException(ErrorCode.MESSAGING_TOKEN_NOT_FOUND));
        if (!messagingToken.getUser().getId().equals(user.getId())) {
            throw new DialogException(ErrorCode.UNAUTHORIZED_TOKEN_ACCESS);
        }
        messagingToken.updateToken(newToken);
    }

    public void sendDiscussionCreatedNotification(Long authorId, String path) {
        final User author = userRepository.findById(authorId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        final List<Long> notificationTargetIds = userRepository.findByEmailNotificationAndIdNot(
                true, author.getId()
        ).stream()
                .map(User::getId)
                .toList();
        final List<String> toSend = messagingTokenRepository.findByUserIdIn(notificationTargetIds).stream()
                .map(MessagingToken::getFcmToken)
                .toList();
        for (String token : toSend) {
            try {
                fcmService.sendNotification(token, "Dialog", "새 토론 게시글이 등록되었습니다.", path);
            } catch (Exception e) {
                log.error("Fail to send push notification, receiver token : {}", token);
            }
        }
    }
}
