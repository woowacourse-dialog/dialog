package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

        notificationService.pollNotifications(userId, sessionId, deferredResult);

        return deferredResult;
    }
}
