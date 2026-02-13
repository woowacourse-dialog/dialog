package com.dialog.server.service;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AppleTokenVerifier {

    private final NimbusJwtDecoder jwtDecoder;

    public AppleTokenVerifier(
            @Value("${apple.oauth2.allowed-audiences}") List<String> allowedAudiences) {
        this.jwtDecoder = NimbusJwtDecoder
                .withJwkSetUri("https://appleid.apple.com/auth/keys")
                .build();

        Set<String> audiences = Set.copyOf(allowedAudiences);
        this.jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtIssuerValidator("https://appleid.apple.com"),
                jwt -> {
                    Object aud = jwt.getClaim("aud");
                    if (aud instanceof String s) {
                        if (audiences.contains(s)) {
                            return OAuth2TokenValidatorResult.success();
                        }
                    } else if (aud instanceof List<?> l) {
                        if (l.stream().anyMatch(a -> audiences.contains(String.valueOf(a)))) {
                            return OAuth2TokenValidatorResult.success();
                        }
                    }
                    return OAuth2TokenValidatorResult.failure(
                            new OAuth2Error("invalid_token", "Invalid audience", null));
                }
        ));
    }

    public Map<String, Object> verify(String identityToken, String expectedNonce) {
        try {
            Jwt jwt = jwtDecoder.decode(identityToken);

            String tokenNonce = jwt.getClaimAsString("nonce");
            if (!expectedNonce.equals(tokenNonce)) {
                log.warn("Apple token nonce mismatch");
                throw new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN);
            }

            return jwt.getClaims();
        } catch (DialogException e) {
            throw e;
        } catch (JwtValidationException e) {
            log.warn("Apple token validation failed: type={}", e.getClass().getSimpleName());
            throw new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN);
        } catch (JwtException e) {
            log.error("Apple token decode failed: type={}", e.getClass().getSimpleName());
            throw new DialogException(ErrorCode.APPLE_AUTH_SERVER_ERROR);
        }
    }
}
