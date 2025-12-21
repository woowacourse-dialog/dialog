package com.dialog.server.service;

import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import com.dialog.server.domain.RouteParams;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.request.NotificationPageRequest;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.NotificationPageResponse;
import com.dialog.server.dto.notification.resposne.NotificationResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.event.NotificationCreatedEvent;
import com.dialog.server.event.NotificationsReadEvent;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.MessagingTokenRepository;
import com.dialog.server.repository.NotificationRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Slf4j
@Service
public class NotificationService {
    private final MessagingTokenRepository messagingTokenRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;
    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

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
        final List<Long> notificationTargetIds = userRepository.findByWebPushNotificationAndIdNot(
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

    @Transactional
    public void createAndPropagateNotification(User sender, User receiver, NotificationType type, RouteParams routeParams) {
        Notification notification = Notification.builder()
                .sender(sender)
                .receiver(receiver)
                .type(type)
                .routeParams(routeParams)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        Long unreadCount = notificationRepository.countByReceiverAndIsReadFalse(receiver);

        eventPublisher.publishEvent(new NotificationCreatedEvent(savedNotification, unreadCount));
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationPage(Long userId, NotificationPageRequest request) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(request.page(), request.size());

        Page<Notification> notificationPage = notificationRepository.findAllByReceiverOrderByCreatedAtDesc(receiver,
                pageable);

        List<NotificationResponse> notificationResponses = notificationPage.getContent()
                .stream()
                .map(NotificationResponse::from)
                .toList();

        Long unreadCount = notificationRepository.countByReceiverAndIsReadFalse(receiver);

        return NotificationPageResponse.of(
                notificationResponses,
                unreadCount,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        return notificationRepository.countByReceiverAndIsReadFalse(receiver);
    }

    @Transactional
    public void updateNotificationAsRead(Long userId, Long notificationId) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        Notification notification = notificationRepository.findByIdAndReceiver(notificationId, receiver)
                .orElseThrow(() -> new DialogException(ErrorCode.NOTIFICATION_NOT_FOUND));

        notification.read();
    }

    @Transactional
    public void updateAllNotificationAsRead(Long userId) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        int updateCount = notificationRepository.bulkUpdateAsRead(receiver, LocalDateTime.now());

        if (updateCount > 0) {
            Long newUnreadCount = notificationRepository.countByReceiverAndIsReadFalse(receiver);
            eventPublisher.publishEvent(new NotificationsReadEvent(userId, newUnreadCount));
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> findMissedNotifications(User user, Long lastNotificationId) {
        return notificationRepository.findAllByReceiverAndIdGreaterThanOrderByCreatedAtAsc(
                user, lastNotificationId);
    }
}
