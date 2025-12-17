package com.dialog.server.service;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.event.NotificationCreatedEvent;
import com.dialog.server.event.NotificationsReadEvent;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class PollingNotificationService {

    private final Map<String, DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>>>
            waitingRequests = new ConcurrentHashMap<>();

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public void pollNotifications(
            Long userId,
            String sessionId,
            Long lastNotificationId,
            DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        if (lastNotificationId != null) {
            List<Notification> missedNotifications = notificationService.findMissedNotifications(user, lastNotificationId);
            if (!missedNotifications.isEmpty()) {
                Long unreadCount = notificationService.getUnreadCount(user.getId());
                NotificationPollingResponse response = NotificationPollingResponse.of(
                        missedNotifications, unreadCount);
                deferredResult.setResult(ResponseEntity.ok(new ApiSuccessResponse<>(response)));
                return;
            }
        }

        String connectionKey = createConnectionKey(user.getId(), sessionId);
        deferredResult.onCompletion(() -> waitingRequests.remove(connectionKey));
        waitingRequests.put(connectionKey, deferredResult);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationEvent(NotificationCreatedEvent event) {
        Notification savedNotification = event.getNotification();
        Long unreadCount = event.getUnreadCount();
        User receiver = savedNotification.getReceiver();
        notifyToActivePollers(receiver.getId(), NotificationPollingResponse.of(savedNotification, unreadCount));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationsReadEvent(NotificationsReadEvent event) {
        notifyToActivePollers(event.getUserId(), NotificationPollingResponse.createBulkReadResponse(event.getUnreadCount()));
    }

    public void notifyToActivePollers(Long receiverId, NotificationPollingResponse response) {
        List<String> connections = waitingRequests.keySet().stream()
                .filter(key -> key.startsWith(receiverId.toString()))
                .toList();

        for (String connection : connections) {
            DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult =
                    waitingRequests.get(connection);

            if (deferredResult != null && !deferredResult.isSetOrExpired()) {
                try {
                    deferredResult.setResult(
                            ResponseEntity.ok(new ApiSuccessResponse<>(response))
                    );
                } catch (Exception e) {
                    log.debug("Failed to send notification to a disconnected client: {}", connection);
                } finally {
                    waitingRequests.remove(connection);
                }
            }
        }
    }

    private String createConnectionKey(Long userId, String sessionId) {
        return userId + "_" + sessionId;
    }
}
