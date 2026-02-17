# Phase 3: 기존 웹 GitHub 플로우 호환

**상태**: DRAFT
**작성일**: 2026-02-13
**선행 조건**: Phase 2 완료 (AuthService.registerUser 시그니처 변경, SessionConstants 생성)
**예상 산출물**: OAuth2SuccessHandler 수정, AuthController 수정

---

## 목표

기존 웹 GitHub OAuth 로그인 → 회원가입 → 로그인 유지 플로우에 `SocialType`을 통합한다.
- `OAuth2SuccessHandler`에서 `pending_social_type` 세션 저장
- `AuthController`에서 `SessionConstants` 사용 + `SocialType` 전달
- 기존 GitHub 웹 플로우의 회귀 방지

---

## Step 9: OAuth2SuccessHandler 수정

### 수정 파일: `src/main/java/com/dialog/server/controller/handler/OAuth2SuccessHandler.java`

#### 9-1. import 변경

**현재 import**:
```java
// (PENDING_OAUTH_ID는 이 클래스 내부 상수)
```

**추가할 import**:
```java
import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;
```

#### 9-2. 상수 제거

**현재 코드** (`OAuth2SuccessHandler.java:18`):
```java
public static final String PENDING_OAUTH_ID = "pending_oauth_id";
```

**삭제**: 이 상수를 제거하고 `SessionConstants.PENDING_OAUTH_ID` import로 대체.

#### 9-3. `handleUnregisteredUser()` 수정

**현재 코드** (`OAuth2SuccessHandler.java:42-48`):
```java
private void handleUnregisteredUser(HttpServletRequest request, HttpServletResponse response,
                                    OAuth2UserPrincipal principal) throws IOException {
    HttpSession session = request.getSession(true);
    session.setAttribute(PENDING_OAUTH_ID, principal.getName());

    String redirectUrl = frontendUrl + SIGNUP_PATH;
    getRedirectStrategy().sendRedirect(request, response, redirectUrl);
}
```

**변경 후**:
```java
private void handleUnregisteredUser(HttpServletRequest request, HttpServletResponse response,
                                    OAuth2UserPrincipal principal) throws IOException {
    HttpSession session = request.getSession(true);
    session.setAttribute(PENDING_OAUTH_ID, principal.getName());
    session.setAttribute(PENDING_SOCIAL_TYPE, principal.user().getSocialType());  // 추가

    String redirectUrl = frontendUrl + SIGNUP_PATH;
    getRedirectStrategy().sendRedirect(request, response, redirectUrl);
}
```

**변경 포인트**:
- `session.setAttribute(PENDING_SOCIAL_TYPE, principal.user().getSocialType())` 1줄 추가
- `principal.user()`는 `OAuth2UserPrincipal`의 `user()` 메서드 → `User` 엔티티 반환
- `User.getSocialType()`은 Phase 1 Step 2에서 추가됨
- 기존 GitHub 유저: `SocialType.GITHUB` 저장 (Builder 기본값)

#### 완성 코드

```java
package com.dialog.server.controller.handler;

import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;
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
    // PENDING_OAUTH_ID 상수 삭제 — SessionConstants로 이동

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
        session.setAttribute(PENDING_SOCIAL_TYPE, principal.user().getSocialType());

        String redirectUrl = frontendUrl + SIGNUP_PATH;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private void setAuthenticationInSession(HttpServletRequest request, Authentication authentication) {
        SecurityContextHolder.getContext().setAuthentication(authentication);
        HttpSession session = request.getSession(true);
        session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());
    }
}
```

---

## Step 10: AuthController 수정

### 수정 파일: `src/main/java/com/dialog/server/controller/AuthController.java`

#### 10-1. import 변경

**현재 import** (`AuthController.java:3`):
```java
import static com.dialog.server.controller.handler.OAuth2SuccessHandler.PENDING_OAUTH_ID;
```

**변경 후**:
```java
import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;
```

**추가 import**:
```java
import com.dialog.server.domain.SocialType;
import lombok.extern.slf4j.Slf4j;
```

#### 10-2. 클래스 어노테이션

```java
@Slf4j  // 추가
@RequestMapping("/api")
@RestController
public class AuthController {
```

#### 10-3. `signup()` 메서드 수정

**현재 코드** (`AuthController.java:27-36`):
```java
@PostMapping("/signup")
public ResponseEntity<ApiSuccessResponse<SignupResponse>> signup(
        @RequestBody SignupRequest signupRequest, HttpServletRequest request) {
    final String oauthId = extractOAuthIdFromSession(request);
    Long userId = authService.registerUser(signupRequest, oauthId);

    final Authentication authentication = authService.authenticate(userId);
    SecurityContextHolder.getContext().setAuthentication(authentication);

    HttpSession session = request.getSession(true);
    session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());
    session.removeAttribute(PENDING_OAUTH_ID);
    return ResponseEntity.ok(new ApiSuccessResponse<>(new SignupResponse(userId)));
}
```

**변경 후**:
```java
@PostMapping("/signup")
public ResponseEntity<ApiSuccessResponse<SignupResponse>> signup(
        @RequestBody SignupRequest signupRequest, HttpServletRequest request) {
    final String oauthId = extractOAuthIdFromSession(request);
    final SocialType socialType = extractSocialTypeFromSession(request);

    Long userId = authService.registerUser(signupRequest, oauthId, socialType);

    final Authentication authentication = authService.authenticate(userId);
    SecurityContextHolder.getContext().setAuthentication(authentication);

    HttpSession session = request.getSession(true);
    session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());
    session.removeAttribute(PENDING_OAUTH_ID);
    session.removeAttribute(PENDING_SOCIAL_TYPE);
    return ResponseEntity.ok(new ApiSuccessResponse<>(new SignupResponse(userId)));
}
```

**변경 포인트**:
- `extractSocialTypeFromSession(request)` 호출 추가
- `authService.registerUser(signupRequest, oauthId)` → `authService.registerUser(signupRequest, oauthId, socialType)`
- `session.removeAttribute(PENDING_SOCIAL_TYPE)` 추가

#### 10-4. `extractSocialTypeFromSession()` 신규 메서드

```java
private SocialType extractSocialTypeFromSession(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session == null) {
        throw new DialogException(ErrorCode.INVALID_SIGNUP);
    }
    SocialType socialType = (SocialType) session.getAttribute(PENDING_SOCIAL_TYPE);
    if (socialType == null) {
        // v3 리뷰 H1 반영: fallback 대신 에러 처리
        log.error("pending_social_type not found in session — 세션 불일치 감지");
        throw new DialogException(ErrorCode.INVALID_SIGNUP);
    }
    return socialType;
}
```

**설계 결정 (v3 리뷰 H1)**:
- ~~v2: `socialType == null`이면 `SocialType.GITHUB` fallback~~ → 삭제
- v3: `socialType == null`이면 예외 발생
- 이유: Apple 유저가 `socialType` 없이 signup하면 GITHUB으로 등록되는 데이터 불일치 방지
- `log.error`로 세션 불일치 감지 기록

---

## 검증 체크리스트

```bash
# 1. 빌드 + 테스트
./gradlew clean test

# 2. 확인 사항
# - OAuth2SuccessHandler에서 PENDING_OAUTH_ID 상수가 제거되었는가
# - OAuth2SuccessHandler가 SessionConstants.PENDING_OAUTH_ID를 import하는가
# - handleUnregisteredUser()에서 pending_social_type을 세션에 저장하는가
# - AuthController가 SessionConstants.PENDING_OAUTH_ID를 import하는가
# - AuthController.signup()에서 socialType을 추출하는가
# - AuthController.signup()에서 pending_social_type을 세션에서 제거하는가
# - extractSocialTypeFromSession()에서 null 시 fallback 없이 예외를 던지는가
```

### 회귀 테스트 시나리오

GitHub 웹 로그인 플로우를 수동 검증:

1. **기존 회원 로그인**: GitHub OAuth → `OAuth2SuccessHandler.handleRegisteredUser()` → 홈 리다이렉트
2. **신규 회원 가입**:
   - GitHub OAuth → `handleUnregisteredUser()` → 세션에 `pending_oauth_id` + `pending_social_type(GITHUB)` 저장
   - `POST /api/signup` → `extractOAuthIdFromSession()` + `extractSocialTypeFromSession()` → `registerUser(request, oauthId, SocialType.GITHUB)`
   - 성공 → 세션에서 `pending_oauth_id` + `pending_social_type` 제거

---

## 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 수정 | `controller/handler/OAuth2SuccessHandler.java` | `PENDING_OAUTH_ID` 상수 제거 → `SessionConstants` import, `pending_social_type` 세션 저장 |
| 수정 | `controller/AuthController.java` | `SessionConstants` import, `extractSocialTypeFromSession()` 추가, `registerUser()` 시그니처 변경 |

---

## 리스크

| 등급 | 리스크 | 완화 방안 |
|------|--------|----------|
| MEDIUM | `PENDING_OAUTH_ID` 상수 제거 시 다른 파일에서 참조 | `AuthController`만 참조 — Phase 3에서 함께 변경 |
| LOW | 기존 GitHub 유저 세션에 `pending_social_type` 없음 | `extractSocialTypeFromSession()`에서 null 체크 + 예외 처리 (v3 리뷰 H1) |
| LOW | `@Slf4j` 추가 | Lombok 의존성 이미 존재 |
