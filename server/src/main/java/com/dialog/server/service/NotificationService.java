package com.dialog.server.service;

import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.request.NotificationPageRequest;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.NotificationPageResponse;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.dto.notification.resposne.NotificationResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.event.NotificationCreatedEvent;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.MessagingTokenRepository;
import com.dialog.server.repository.NotificationRepository;
import com.dialog.server.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.context.request.async.DeferredResult;

@AllArgsConstructor
@Slf4j
@Service
public class NotificationService {
    private final Map<String, DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>>>
            waitingRequests = new ConcurrentHashMap<>();
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

    @Transactional(readOnly = true)
    public void pollNotifications(
            Long userId,
            String sessionId,
            Long lastNotificationId,
            DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
    ) {
        User user = userRepository.findById(userId).orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        if (lastNotificationId != null) {
            List<Notification> missedNotifications = notificationRepository.findAllByReceiverAndIdGreaterThanOrderByCreatedAtAsc(
                    user, lastNotificationId);
            if (!missedNotifications.isEmpty()) {
                long unreadCount = notificationRepository.countByReceiverAndIsReadFalse(user);
                deferredResult.setResult(
                        ResponseEntity.ok(
                                new ApiSuccessResponse<>(NotificationPollingResponse.of(missedNotifications, unreadCount))
                        )
                );
                return;
            }
        }

        String connectionKey = createConnectionKey(user.getId(), sessionId);
        deferredResult.onCompletion(() -> waitingRequests.remove(connectionKey));
        waitingRequests.put(connectionKey, deferredResult);
    }

    private String createConnectionKey(Long userId, String sessionId) {
        return userId + "_" + sessionId;
    }

    @Transactional
    public void createAndPropagateNotification(User sender, User receiver, NotificationType type) {
        Notification notification = Notification.builder()
                .sender(sender)
                .receiver(receiver)
                .type(type)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        Long unreadCount = notificationRepository.countByReceiverAndIsReadFalse(receiver);

        eventPublisher.publishEvent(new NotificationCreatedEvent(savedNotification, unreadCount));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationEvent(NotificationCreatedEvent event) {
        Notification savedNotification = event.getNotification();
        Long unreadCount = event.getUnreadCount();
        User receiver = savedNotification.getReceiver();

        List<String> connections = waitingRequests.keySet().stream()
                .filter(key -> key.startsWith(receiver.getId().toString()))
                .toList();

        for (String connection : connections) {
            try {
                DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult = waitingRequests.get(connection);
                if (deferredResult != null && !deferredResult.isSetOrExpired()) {
                    deferredResult.setResult(
                            ResponseEntity.ok(
                                    new ApiSuccessResponse<>(NotificationPollingResponse.of(savedNotification, unreadCount))
                            )
                    );
                }
            } catch (Exception e) {
                log.warn("알림 전송에 실패하였습니다. sender : {} receiver : {} type : {}",
                        savedNotification.getSender().getId(),
                        receiver.getId(),
                        savedNotification.getType()
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationPage(Long userId, NotificationPageRequest request) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(request.page(), request.size());

        Page<Notification> notificationPage = notificationRepository.findAllByReceiverOrderByCreatedAtDesc(receiver, pageable);

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

    @Transactional
    public void updateNotificationAsRead(Long userId, Long notificationId) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        Notification notification = notificationRepository.findByIdAndReceiver(notificationId, receiver)
                .orElseThrow(() -> new DialogException(ErrorCode.NOTIFICATION_NOT_FOUND));

        notification.read();
    }
}
