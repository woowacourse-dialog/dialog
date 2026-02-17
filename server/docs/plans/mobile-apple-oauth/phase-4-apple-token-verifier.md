# Phase 4: Apple 토큰 검증 서비스

**상태**: DRAFT
**작성일**: 2026-02-13
**선행 조건**: Phase 1 완료 (ErrorCode에 Apple 관련 코드 추가를 위한 기반)
**예상 산출물**: AppleTokenVerifier 서비스, ErrorCode 추가

---

## 목표

Apple identityToken(JWT)을 검증하는 서비스를 구현한다.
- Apple JWKS 공개키로 서명 검증
- `iss`, `aud`, `exp` 표준 클레임 검증
- `nonce` 클레임 검증 (replay attack 방지)
- `aud` 클레임의 String/List 다형성 처리

---

## Step 11: AppleTokenVerifier

### 새 파일: `src/main/java/com/dialog/server/service/AppleTokenVerifier.java`

```java
package com.dialog.server.service;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

@Component
public class AppleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(AppleTokenVerifier.class);

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

            // nonce 검증 (replay attack 방지)
            String tokenNonce = jwt.getClaimAsString("nonce");
            if (!expectedNonce.equals(tokenNonce)) {
                log.warn("Apple token nonce mismatch");
                throw new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN);
            }

            return jwt.getClaims();
        } catch (DialogException e) {
            throw e;  // nonce 검증 실패는 그대로 전파
        } catch (JwtValidationException e) {
            log.warn("Apple token validation failed: type={}", e.getClass().getSimpleName());
            throw new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN);
        } catch (JwtException e) {
            log.error("Apple token decode failed", e);
            throw new DialogException(ErrorCode.APPLE_AUTH_SERVER_ERROR);
        }
    }
}
```

### 의존성 확인

`NimbusJwtDecoder`는 기존 의존성 체인에 포함:
```
spring-boot-starter-oauth2-client
  → spring-security-oauth2-jose
    → nimbus-jose-jwt
```

**사전 검증 명령어**:
```bash
./gradlew dependencies --configuration runtimeClasspath | grep nimbus
```

### 설계 상세

#### 생성자 — JWT Validator 설정

| Validator | 역할 | 비고 |
|-----------|------|------|
| `JwtTimestampValidator` | `exp` 클레임 만료 검증 | 기본 30초 허용 |
| `JwtIssuerValidator("https://appleid.apple.com")` | `iss` 클레임 검증 | Apple 공식 발급자 |
| 커스텀 aud validator | `aud` 클레임 검증 | String 또는 List 처리 |

#### aud 커스텀 Validator 상세 (v3 리뷰 H3 반영)

Apple의 `aud` 클레임은 상황에 따라 **String** 또는 **List**로 반환:
- 단일 앱: `"aud": "com.dialog.app"` (String)
- 멀티 서비스: `"aud": ["com.dialog.app", "com.dialog.service"]` (List)

```java
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
```

> `JwtClaimValidator<>("aud", audiences::contains)` 대신 커스텀 validator를 사용하는 이유:
> 기본 `JwtClaimValidator`는 `aud`가 List일 때 `Set.contains(List)` 비교를 하여 항상 실패.

#### nonce 검증 (v3 리뷰 C5 반영)

```java
String tokenNonce = jwt.getClaimAsString("nonce");
if (!expectedNonce.equals(tokenNonce)) {
    log.warn("Apple token nonce mismatch");
    throw new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN);
}
```

- 클라이언트(iOS 앱)가 Apple Sign In 요청 시 nonce를 생성하여 전달
- Apple은 nonce를 id_token에 포함
- 서버는 클라이언트가 보낸 nonce와 토큰 내 nonce를 비교
- 불일치 시: replay attack 또는 토큰 변조 의심 → 401 응답

#### 예외 처리 전략

| 예외 타입 | 의미 | 응답 | 로그 레벨 |
|-----------|------|------|-----------|
| `DialogException` (nonce 불일치) | 토큰 변조/replay attack | 401 | warn |
| `JwtValidationException` | 만료/iss/aud 검증 실패 | 401 | warn |
| `JwtException` | JWT 디코딩 실패 (서명/형식) | 502 | error |

**보안 고려사항**:
- 로그에 `e.getMessage()` 대신 `e.getClass().getSimpleName()` 사용 → 민감 정보 노출 방지
- `APPLE_AUTH_SERVER_ERROR` 메시지에서 "Apple" 제거 (v3 리뷰 M8)

### ErrorCode 추가

**수정 파일**: `src/main/java/com/dialog/server/exception/ErrorCode.java`

현재 `WITHDRAW_USER`가 "1006"을 사용 중이므로 다른 코드 할당:

```java
// 1XXX 인증, 보안 관련 — 기존 마지막: WITHDRAW_USER("1006")
INVALID_IDENTITY_TOKEN("1007", "유효하지 않은 인증 토큰입니다.", HttpStatus.UNAUTHORIZED),
APPLE_AUTH_SERVER_ERROR("1008", "인증에 실패했습니다. 잠시 후 다시 시도해주세요.", HttpStatus.BAD_GATEWAY),
```

> **주의**: 기존 계획에서 1006/1007 사용 → 실제 코드 확인 결과 `WITHDRAW_USER`가 "1006"이므로 **1007/1008**으로 조정.

---

## 단위 테스트 계획

### 테스트 파일: `src/test/java/com/dialog/server/service/AppleTokenVerifierTest.java`

#### 테스트 시나리오

| # | 시나리오 | 예상 결과 | 비고 |
|---|---------|----------|------|
| 1 | 유효한 토큰 + 올바른 nonce | claims Map 반환 | 정상 케이스 |
| 2 | 만료된 토큰 | `INVALID_IDENTITY_TOKEN` 예외 | `JwtTimestampValidator` 실패 |
| 3 | 잘못된 서명 | `APPLE_AUTH_SERVER_ERROR` 예외 | `JwtException` |
| 4 | 잘못된 aud | `INVALID_IDENTITY_TOKEN` 예외 | 커스텀 aud validator 실패 |
| 5 | nonce 불일치 | `INVALID_IDENTITY_TOKEN` 예외 | replay attack 방지 |
| 6 | aud가 List인 경우 | claims Map 반환 | String/List 다형성 |
| 7 | 잘못된 iss | `INVALID_IDENTITY_TOKEN` 예외 | `JwtIssuerValidator` 실패 |

#### 테스트 전략

`NimbusJwtDecoder`는 외부(Apple JWKS) 의존이므로 단위 테스트에서는 **모킹 또는 로컬 JWK**를 사용:

```java
@ExtendWith(MockitoExtension.class)
class AppleTokenVerifierTest {

    // 방법 1: NimbusJwtDecoder를 목으로 주입 (리플렉션)
    // 방법 2: 테스트용 RSA 키쌍 생성 → 로컬 JWK 서버 (MockWebServer)
}
```

> 권장: MockWebServer로 Apple JWKS 엔드포인트를 모킹하여 실제 JWT 검증 플로우를 테스트.

---

## 검증 체크리스트

```bash
# 1. 의존성 확인
./gradlew dependencies --configuration runtimeClasspath | grep nimbus

# 2. 빌드 + 테스트
./gradlew clean test

# 3. 확인 사항
# - AppleTokenVerifier가 @Component로 등록되는가
# - application.yml에 apple.oauth2.allowed-audiences 설정이 있는가 (Phase 6에서 추가)
# - NimbusJwtDecoder가 classpath에 있는가
# - nonce 검증 로직이 존재하는가
# - aud 커스텀 validator가 String/List 모두 처리하는가
# - ErrorCode에 INVALID_IDENTITY_TOKEN, APPLE_AUTH_SERVER_ERROR가 추가되었는가
```

---

## 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 신규 | `service/AppleTokenVerifier.java` | Apple JWT 검증 (JWKS + nonce + aud) |
| 수정 | `exception/ErrorCode.java` | `INVALID_IDENTITY_TOKEN`, `APPLE_AUTH_SERVER_ERROR` 추가 |

---

## 리스크

| 등급 | 리스크 | 완화 방안 |
|------|--------|----------|
| HIGH | Apple JWKS 엔드포인트 장애 시 인증 불가 | `NimbusJwtDecoder`는 JWKS 캐싱 지원. 기본 5분 캐시 + 에러 시 재시도 내장 |
| MEDIUM | `apple.oauth2.allowed-audiences` 설정 누락 | Phase 6에서 설정 추가 + 테스트 환경에서 확인 |
| LOW | ErrorCode 코드 충돌 | 기존 코드 확인 후 1007/1008 할당 (충돌 없음) |
