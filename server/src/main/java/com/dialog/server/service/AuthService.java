package com.dialog.server.service;

import com.dialog.server.domain.Role;
import com.dialog.server.domain.SocialType;
import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.AppleLoginRequest;
import com.dialog.server.dto.auth.request.SignupRequest;
import com.dialog.server.dto.auth.response.OAuthLoginResponse;
import com.dialog.server.dto.security.AppleOAuth2UserInfo;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.UserRepository;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final AppleTokenVerifier appleTokenVerifier;
    private final String appleDefaultProfileImageUrl;

    public AuthService(UserRepository userRepository,
                       UserService userService,
                       AppleTokenVerifier appleTokenVerifier,
                       @Value("${apple.oauth2.default-profile-image-url}") String appleDefaultProfileImageUrl) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.appleTokenVerifier = appleTokenVerifier;
        this.appleDefaultProfileImageUrl = appleDefaultProfileImageUrl;
    }

    public User loginWithApple(AppleLoginRequest request) {
        Map<String, Object> claims = appleTokenVerifier.verify(request.identityToken());

        if (request.firstName() != null) {
            claims = new HashMap<>(claims);
            claims.put("firstName", request.firstName());
            claims.put("lastName", request.lastName());
        }

        AppleOAuth2UserInfo userInfo = new AppleOAuth2UserInfo(claims, appleDefaultProfileImageUrl);
        return userService.findOrCreateTempUser(userInfo);
    }

    @Transactional
    public Long registerUser(SignupRequest signupRequest, String oauthId, SocialType socialType) {
        User user = userRepository.findByOauthIdAndSocialType(oauthId, socialType)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != null && user.isRegistered()) {
            throw new DialogException(ErrorCode.REGISTERED_USER);
        }

        user.register(
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
