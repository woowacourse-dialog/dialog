package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.notification.request.NotificationPageRequest;
import com.dialog.server.dto.notification.resposne.NotificationPageResponse;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.NotificationService;
import com.dialog.server.service.PollingNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.async.DeferredResult;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final PollingNotificationService pollingNotificationService;

    @GetMapping("/polling")
    public DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> getPollingNotifications(
            @AuthenticatedUserId Long userId,
            @RequestParam(required = false) Long lastNotificationId,
            @RequestParam String sessionId
    ) {
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
                = new DeferredResult<>(30_000L);

        deferredResult.onTimeout(() -> {
            // todo : timeout 나는 경우에는 굳이 UnreadCount 갱신하지 말고 기존의 UnreadCount 보여주는 방향으로 구현
            Long unreadCount = notificationService.getUnreadCount(userId);
            deferredResult.setResult(
                    ResponseEntity.ok(new ApiSuccessResponse<>(
                            NotificationPollingResponse.createTimeoutResponse(unreadCount)
                    ))
            );
        });

        pollingNotificationService.pollNotifications(userId, sessionId, lastNotificationId, deferredResult);

        return deferredResult;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiSuccessResponse<NotificationPageResponse>> getNotificationPage(
            @AuthenticatedUserId Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        NotificationPageRequest request = new NotificationPageRequest(page, size);
        NotificationPageResponse response = notificationService.getNotificationPage(userId, request);

        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @PatchMapping("/{notificationId}")
    public ResponseEntity<ApiSuccessResponse<Void>> updateNotificationAsRead(
            @AuthenticatedUserId Long userId,
            @PathVariable Long notificationId
    ) {
        notificationService.updateNotificationAsRead(userId, notificationId);

        return ResponseEntity.ok(new ApiSuccessResponse<>(null));
    }

    @PatchMapping("/all")
    public ResponseEntity<ApiSuccessResponse<Void>> updateAllNotificationAsRead(
        @AuthenticatedUserId Long userId
    ) {
        notificationService.updateAllNotificationAsRead(userId);

        return ResponseEntity.ok(new ApiSuccessResponse<>(null));
    }
}
