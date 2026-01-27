package com.dialog.server.controller;

import static com.dialog.server.controller.AuthController.SESSION_PARAM;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.auth.request.NotificationSettingRequest;
import com.dialog.server.dto.auth.response.NotificationSettingResponse;
import com.dialog.server.dto.auth.response.UserInfoResponse;
import com.dialog.server.dto.request.UserMypageUpdateRequest;
import com.dialog.server.dto.response.MyTrackGetTrackResponse;
import com.dialog.server.dto.response.ProfileImageGetResponse;
import com.dialog.server.dto.response.ProfileImageUpdateResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseEntity.BodyBuilder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RequestMapping("/api/user")
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/mine")
    public ResponseEntity<ApiSuccessResponse<UserInfoResponse>> getUserInfo(@AuthenticatedUserId Long userId) {
        UserInfoResponse response = userService.getUserInfo(userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @PatchMapping("/mine")
    public ResponseEntity<ApiSuccessResponse<Void>> patchNickname(
            @AuthenticatedUserId Long userId,
            @RequestBody UserMypageUpdateRequest userMypageUpdateRequest
    ) {
        userService.modifyUserInfo(userId, userMypageUpdateRequest);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/mine/notifications")
    public ResponseEntity<ApiSuccessResponse<NotificationSettingResponse>> patchNotification(
            @RequestBody @Valid NotificationSettingRequest request, @AuthenticatedUserId Long userId) {
        NotificationSettingResponse response = userService.updateNotification(request, userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @GetMapping("/mine/profile-image")
    public ResponseEntity<ApiSuccessResponse<ProfileImageGetResponse>> getProfileImage(
            @AuthenticatedUserId Long userId
    ) {
        ProfileImageGetResponse response = userService.getProfileImage(userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @PatchMapping("/mine/profile-image")
    public ResponseEntity<ApiSuccessResponse<ProfileImageUpdateResponse>> patchProfileImage(
            @RequestParam("file") MultipartFile imageFile,
            @AuthenticatedUserId Long userId
    ) {
        ProfileImageUpdateResponse response = userService.updateProfileImage(imageFile, userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @GetMapping("/mine/track")
    public ResponseEntity<ApiSuccessResponse<MyTrackGetTrackResponse>> getTrack(@AuthenticatedUserId Long userId) {
        MyTrackGetTrackResponse response = userService.getTrack(userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @DeleteMapping("/mine")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteUser(
            @AuthenticatedUserId Long userId,
            @CookieValue(name = SESSION_PARAM, required = false) String sessionId,
            HttpServletRequest request
    ) {
        userService.withdraw(userId);
        clearLoginInfo(sessionId, request);

        return ResponseEntity.ok().build();
    }

    private void clearLoginInfo(String sessionId, HttpServletRequest request) {
        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        BodyBuilder responseBuilder = ResponseEntity.ok();
        if (sessionId != null) {
            ResponseCookie cookie = ResponseCookie.from(SESSION_PARAM, "")
                    .path("/")
                    .maxAge(0)
                    .httpOnly(true)
                    .build();
            responseBuilder.header(HttpHeaders.SET_COOKIE, cookie.toString());
        }
    }
}
