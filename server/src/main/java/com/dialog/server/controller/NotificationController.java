package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.notification.request.NotificationPageRequest;
import com.dialog.server.dto.notification.resposne.NotificationPageResponse;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.NotificationService;
import jakarta.servlet.http.HttpSession;
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

    @GetMapping("/polling")
    public DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> getPollingNotifications(
            @AuthenticatedUserId Long userId,
            @RequestParam(required = false) Long lastNotificationId,
            HttpSession session
    ) {
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
                = new DeferredResult<>(30_000L);

        String sessionId = session.getId();

        deferredResult.onTimeout(() -> {
            deferredResult.setResult(
                    ResponseEntity.ok(new ApiSuccessResponse<>(
                            NotificationPollingResponse.createTimeoutResponse()
                    ))
            );
        });

        notificationService.pollNotifications(userId, sessionId, lastNotificationId, deferredResult);

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

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiSuccessResponse<Void>> updateNotificationAsRead(
            @AuthenticatedUserId Long userId,
            @PathVariable Long notificationId
    ) {
        notificationService.updateNotificationAsRead(userId, notificationId);

        return ResponseEntity.ok(new ApiSuccessResponse<>(null));
    }
}
