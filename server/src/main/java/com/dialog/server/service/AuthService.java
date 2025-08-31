package com.dialog.server.service;

import com.dialog.server.domain.Role;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.SignupRequest;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class AuthService {

    private final UserRepository userRepository;

    @Transactional
    public Long registerUser(SignupRequest signupRequest, String oauthId) {
        User user = userRepository.findUserByOauthId(oauthId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != null && user.isRegistered()) {
            throw new DialogException(ErrorCode.REGISTERED_USER);
        }

        user.register(
                signupRequest.nickname(),
                signupRequest.track(),
                signupRequest.webPushNotification(),
                Role.USER
        );
        return user.getId();
    }

    public Authentication authenticate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() == null || !user.isRegistered()) {
            throw new DialogException(ErrorCode.NOT_REGISTERED_USER);
        }

        return new UsernamePasswordAuthenticationToken(
                userId,
                null, // OAuth 로그인만 허용하므로 비밀번호 없음
                user.getRole().toAuthorities()
        );
    }
}
