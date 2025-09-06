package com.dialog.server.controller;

import static com.dialog.server.controller.handler.OAuth2SuccessHandler.PENDING_OAUTH_ID;
import static org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY;

import com.dialog.server.domain.Role;
import com.dialog.server.dto.auth.request.SignupRequest;
import com.dialog.server.dto.auth.response.LoginCheckResponse;
import com.dialog.server.dto.auth.response.SignupResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseEntity.BodyBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api")
@RestController
public class AuthController {

    public static final String SESSION_PARAM = "JSESSIONID";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiSuccessResponse<SignupResponse>> signup(@RequestBody SignupRequest signupRequest, HttpServletRequest request) {
        final String oauthId = extractOAuthIdFromSession(request);
        Long userId = authService.registerUser(signupRequest, oauthId);

        final Authentication authentication = authService.authenticate(userId);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        HttpSession session = request.getSession(true);
        session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());
        session.removeAttribute(PENDING_OAUTH_ID);
        return ResponseEntity.ok(new ApiSuccessResponse<>(new SignupResponse(userId)));
    }

    @GetMapping("/login/check")
    public ResponseEntity<ApiSuccessResponse<LoginCheckResponse>> checkLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        boolean isLoggedIn = false;
        if (authentication != null && authentication.isAuthenticated()) {
            isLoggedIn = Role.isLoggedInFromAuthorities(authentication.getAuthorities());
        }
        return ResponseEntity.ok(new ApiSuccessResponse<>(new LoginCheckResponse(isLoggedIn)));
    }

    @DeleteMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = SESSION_PARAM, required = false) String sessionId,
                                           HttpServletRequest request) {
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
        return responseBuilder.build();
    }

    private String extractOAuthIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new DialogException(ErrorCode.INVALID_SIGNUP);
        }

        String oauthId = (String) session.getAttribute(PENDING_OAUTH_ID);
        if (oauthId == null) {
            throw new DialogException(ErrorCode.INVALID_SIGNUP);
        }

        return oauthId;
    }
}
