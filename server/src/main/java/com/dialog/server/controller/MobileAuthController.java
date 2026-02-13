package com.dialog.server.controller;

import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;
import static org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY;

import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.AppleLoginRequest;
import com.dialog.server.dto.auth.response.OAuthLoginResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/mobile")
@RequiredArgsConstructor
public class MobileAuthController {

    private final AuthService authService;

    @PostMapping("/apple")
    public ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> appleLogin(
            @Valid @RequestBody AppleLoginRequest request,
            HttpServletRequest httpRequest) {

        User user = authService.loginWithApple(request);

        if (user.isRegistered()) {
            return handleRegisteredUser(httpRequest, user);
        } else {
            return handleUnregisteredUser(httpRequest, user);
        }
    }

    private ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> handleRegisteredUser(
            HttpServletRequest httpRequest, User user) {
        Authentication authentication = authService.authenticate(user.getId());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());

        return ResponseEntity.ok(
                new ApiSuccessResponse<>(OAuthLoginResponse.registered(user)));
    }

    private ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> handleUnregisteredUser(
            HttpServletRequest httpRequest, User user) {
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(PENDING_OAUTH_ID, user.getOauthId());
        session.setAttribute(PENDING_SOCIAL_TYPE, user.getSocialType());

        return ResponseEntity.ok(
                new ApiSuccessResponse<>(OAuthLoginResponse.needsSignup()));
    }
}
