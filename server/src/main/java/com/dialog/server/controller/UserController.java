package com.dialog.server.controller;

import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.NotificationSettingResponse;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RequestMapping("/api/user")
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/mine")
    public ResponseEntity<ApiSuccessResponse<UserInfoResponse>> getUserInfo(Principal principal) {
        String oauthId = principal.getName();
        UserInfoResponse response = userService.getUserInfo(oauthId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @PatchMapping("/mine/notifications")
    public ResponseEntity<ApiSuccessResponse<NotificationSettingResponse>> patchNotification(@RequestBody @Valid NotificationSettingRequest request, Principal principal) {
        String oauthId = principal.getName();
        NotificationSettingResponse response = userService.updateNotification(request, oauthId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }
}
