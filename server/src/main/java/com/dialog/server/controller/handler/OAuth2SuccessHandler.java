package com.dialog.server.controller.handler;

import static org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY;

import com.dialog.server.dto.security.OAuth2UserPrincipal;
import com.dialog.server.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String SIGNUP_PATH = "/signup";
    private static final String HOME_PATH = "/";
    public static final String PENDING_OAUTH_ID = "pending_oauth_id";

    private final AuthService authService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();

        if (principal.user().isRegistered()) {
            handleRegisteredUser(request, response, principal);
        } else {
            handleUnregisteredUser(request, response, principal);
        }
    }

    private void handleRegisteredUser(HttpServletRequest request, HttpServletResponse response,
                                      OAuth2UserPrincipal principal) throws IOException {
        final Authentication authentication = authService.authenticate(principal.user().getId());

        setAuthenticationInSession(request, authentication);

        String redirectUrl = frontendUrl + HOME_PATH;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private void handleUnregisteredUser(HttpServletRequest request, HttpServletResponse response,
                                        OAuth2UserPrincipal principal) throws IOException {
        HttpSession session = request.getSession(true);
        session.setAttribute(PENDING_OAUTH_ID, principal.getName());

        String redirectUrl = frontendUrl + SIGNUP_PATH;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private void setAuthenticationInSession(HttpServletRequest request, Authentication authentication) {
        SecurityContextHolder.getContext().setAuthentication(authentication);

        HttpSession session = request.getSession(true);
        session.setAttribute(
                SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext()
        );
    }
}
