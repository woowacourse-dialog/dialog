package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AppleTokenVerifierTest {

    @Mock
    private NimbusJwtDecoder jwtDecoder;

    private AppleTokenVerifier appleTokenVerifier;

    @BeforeEach
    void setUp() {
        appleTokenVerifier = new AppleTokenVerifier(List.of("test-bundle-id", "test-service-id"));
        ReflectionTestUtils.setField(appleTokenVerifier, "jwtDecoder", jwtDecoder);
    }

    @Test
    @DisplayName("유효한 토큰으로 claims를 반환한다")
    void verify_validToken() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", "apple_user_001")
                .claim("email", "test@icloud.com")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(jwtDecoder.decode(anyString())).thenReturn(jwt);

        Map<String, Object> claims = appleTokenVerifier.verify("valid.jwt.token");

        assertThat(claims).containsEntry("sub", "apple_user_001");
        assertThat(claims).containsEntry("email", "test@icloud.com");
    }

    @Test
    @DisplayName("JWT 검증 실패 시 INVALID_IDENTITY_TOKEN 예외를 던진다")
    void verify_jwtValidationFailed() {
        JwtValidationException validationException = new JwtValidationException(
                "Validation failed",
                List.of(new OAuth2Error("invalid_token", "Token expired", null)));
        when(jwtDecoder.decode(anyString())).thenThrow(validationException);

        assertThatThrownBy(() -> appleTokenVerifier.verify("expired.jwt.token"))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("code", ErrorCode.INVALID_IDENTITY_TOKEN.code);
    }

    @Test
    @DisplayName("JWT 디코딩 실패 시 APPLE_AUTH_SERVER_ERROR 예외를 던진다")
    void verify_jwtDecodeFailed() {
        when(jwtDecoder.decode(anyString())).thenThrow(new JwtException("Decode failed"));

        assertThatThrownBy(() -> appleTokenVerifier.verify("bad.jwt.token"))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("code", ErrorCode.APPLE_AUTH_SERVER_ERROR.code);
    }
}
