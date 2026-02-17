# Phase 5: 모바일 API 엔드포인트

**상태**: DRAFT
**작성일**: 2026-02-13
**선행 조건**: Phase 1~4 완료 (SocialType, OAuth2UserInfo, UserService 변경, AppleTokenVerifier)
**예상 산출물**: AppleLoginRequest DTO, OAuthLoginResponse DTO, MobileAuthController, data.sql 수정, UserInfoResponse 수정

---

## 목표

모바일 앱(iOS)에서 Apple Sign In으로 로그인하기 위한 REST API 엔드포인트를 구현한다.
- `POST /api/auth/mobile/apple` — Apple identityToken 검증 + 유저 조회/생성
- 신규 유저: 세션에 `pending_oauth_id` + `pending_social_type` 저장 → 기존 `/api/signup` 재사용
- 기존 회원: SecurityContext 설정 + JSESSIONID 반환

---

## Step 12: 모바일 DTO

### 12-1. AppleLoginRequest

**새 파일**: `src/main/java/com/dialog/server/dto/auth/request/AppleLoginRequest.java`

```java
package com.dialog.server.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

public record AppleLoginRequest(
    @NotBlank String identityToken,
    @NotBlank String nonce,
    String firstName,
    String lastName
) {}
```

**필드 설명**:
| 필드 | 타입 | 검증 | 설명 |
|------|------|------|------|
| `identityToken` | String | `@NotBlank` | Apple Sign In에서 받은 JWT |
| `nonce` | String | `@NotBlank` | 클라이언트에서 생성한 nonce (replay attack 방지) |
| `firstName` | String | nullable | 최초 인증 시에만 Apple이 제공 |
| `lastName` | String | nullable | 최초 인증 시에만 Apple이 제공 |

> `nonce`가 `@NotBlank`인 이유 (v3 리뷰 C5): replay attack 방지를 위해 필수.
> `firstName`/`lastName`이 nullable인 이유: Apple은 최초 인증 시에만 이름을 제공하고, 이후 로그인에서는 제공하지 않음.

### 12-2. OAuthLoginResponse

**새 파일**: `src/main/java/com/dialog/server/dto/auth/response/OAuthLoginResponse.java`

```java
package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.User;

public record OAuthLoginResponse(
    boolean isRegistered,
    Long userId,
    String nickname
) {
    public static OAuthLoginResponse registered(User user) {
        return new OAuthLoginResponse(true, user.getId(), user.getNickname());
    }

    public static OAuthLoginResponse needsSignup() {
        return new OAuthLoginResponse(false, null, null);
    }
}
```

**응답 시나리오**:
| 상황 | `isRegistered` | `userId` | `nickname` | 후속 플로우 |
|------|:---:|:---:|:---:|:---:|
| 기존 회원 로그인 | `true` | 유저 ID | 유저 닉네임 | 홈으로 이동 |
| 신규 회원 (회원가입 필요) | `false` | `null` | `null` | `POST /api/signup` 호출 |

---

## Step 13: MobileAuthController

### 새 파일: `src/main/java/com/dialog/server/controller/MobileAuthController.java`

```java
package com.dialog.server.controller;

import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;
import static org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY;

import com.dialog.server.domain.User;
import com.dialog.server.dto.auth.request.AppleLoginRequest;
import com.dialog.server.dto.auth.response.OAuthLoginResponse;
import com.dialog.server.dto.security.AppleOAuth2UserInfo;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.AppleTokenVerifier;
import com.dialog.server.service.AuthService;
import com.dialog.server.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    private final AppleTokenVerifier appleTokenVerifier;
    private final UserService userService;
    private final AuthService authService;

    @Value("${apple.oauth2.default-profile-image-url}")
    private String appleDefaultProfileImageUrl;

    @PostMapping("/apple")
    public ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> appleLogin(
            @RequestBody @Valid AppleLoginRequest request,
            HttpServletRequest httpRequest) {

        // 1. identityToken + nonce 검증
        Map<String, Object> claims = appleTokenVerifier.verify(
                request.identityToken(), request.nonce());

        // 2. 최초 인증 시 이름 정보 추가
        if (request.firstName() != null) {
            claims = new HashMap<>(claims);
            claims.put("firstName", request.firstName());
            claims.put("lastName", request.lastName());
        }

        // 3. 유저 조회/생성
        AppleOAuth2UserInfo userInfo = new AppleOAuth2UserInfo(claims, appleDefaultProfileImageUrl);
        User user = userService.findOrCreateTempUser(userInfo);

        // 4. 결과 처리
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
```

### API 플로우 상세

```
iOS App                          Server
  |                                |
  |-- Apple Sign In ------------->|
  |   (identityToken, nonce,      |
  |    firstName?, lastName?)     |
  |                                |
  |                        1. verify(identityToken, nonce)
  |                           - JWKS 서명 검증
  |                           - iss, aud, exp 검증
  |                           - nonce 일치 확인
  |                                |
  |                        2. firstName 있으면 claims에 추가
  |                                |
  |                        3. findOrCreateTempUser(AppleOAuth2UserInfo)
  |                           - oauthId(sub) + APPLE로 조회
  |                           - 없으면 TEMP_USER 생성
  |                                |
  |                        4-A. 기존 회원 (isRegistered)
  |<-- {isRegistered:true,    <---|   - SecurityContext 설정
  |     userId, nickname}          |   - JSESSIONID 세션 쿠키
  |     + JSESSIONID cookie        |
  |                                |
  |                        4-B. 신규 회원 (!isRegistered)
  |<-- {isRegistered:false}   <---|   - 세션에 pending_oauth_id 저장
  |     + JSESSIONID cookie        |   - 세션에 pending_social_type 저장
  |                                |
  |-- POST /api/signup ---------->|   (기존 API 재사용)
  |   (track, webPushNotification) |
  |<-- {userId}              <----|
  |     + JSESSIONID cookie        |
```

### 설계 결정

1. **`claims` 복사** (Step 2): `appleTokenVerifier.verify()` 반환값은 `Jwt.getClaims()`의 unmodifiable Map이므로 `new HashMap<>(claims)`로 복사 후 `firstName`/`lastName` 추가.

2. **`appleDefaultProfileImageUrl` 주입**: `@Value`로 application.yml에서 읽음 (v3 리뷰 M4). Phase 6에서 설정 추가.

3. **기술 부채** (v3 리뷰 M1): 현재 `MobileAuthController`에 비즈니스 로직이 직접 있음. 향후 모바일 GitHub 추가 시 `MobileAuthService`로 추출 필요.

4. **`SessionConstants` 사용** (v3 리뷰 H7): `OAuth2SuccessHandler`에 의존하지 않고 독립적인 세션 키 상수 사용.

---

## Step 14: data.sql + UserInfoResponse + WebSecurityConfig

### 14-1. data.sql 수정

**수정 파일**: `src/main/resources/data.sql`

**현재 코드** (line 1-10):
```sql
INSERT INTO users (user_id, nickname, track, web_push_notification, created_at, modified_at, is_deleted)
VALUES (1, '김개발','BACKEND', true, NOW(), NOW(), false),
       (2, '홍길동','BACKEND', false, NOW(), NOW(), false),
       ...
```

**변경 후**:
```sql
INSERT INTO users (user_id, oauth_id, nickname, github_id, social_type, track, role, web_push_notification, created_at, modified_at, is_deleted)
VALUES (1, 'oauth_1', '김개발', 'kimdev', 'GITHUB', 'BACKEND', 'USER', true, NOW(), NOW(), false),
       (2, 'oauth_2', '홍길동', 'hong', 'GITHUB', 'BACKEND', 'USER', false, NOW(), NOW(), false),
       (3, 'oauth_3', '박코딩', 'parkcoding', 'GITHUB', 'FRONTEND', 'USER', true, NOW(), NOW(), false),
       (4, 'oauth_4', '한스', 'hans', 'GITHUB', 'FRONTEND', 'USER', true, NOW(), NOW(), false),
       (5, 'oauth_5', '다로', 'daro', 'GITHUB', 'FRONTEND', 'USER', false, NOW(), NOW(), false),
       (6, 'oauth_6', '밍곰', 'minggom', 'GITHUB', 'BACKEND', 'USER', true, NOW(), NOW(), false),
       (7, 'oauth_7', '히포', 'hippo', 'GITHUB', 'ANDROID', 'USER', true, NOW(), NOW(), false),
       (8, 'oauth_8', '서프귀여워', 'surfcute', 'GITHUB', 'ANDROID', 'USER', false, NOW(), NOW(), false),
       (9, 'oauth_9', '차니', 'chani', 'GITHUB', 'BACKEND', 'USER', true, NOW(), NOW(), false)
;
```

**변경 포인트** (v3 리뷰 H2):
- `oauth_id`, `github_id`, `social_type`, `role` 컬럼 추가
- develop 환경에서 `ddl-auto: create`로 매번 재생성되므로 전체 컬럼 포함 필요
- `social_type`이 없으면 JPA가 NULL로 삽입하여 `findByOauthIdAndSocialType()` 쿼리 실패

### 14-2. UserInfoResponse 수정

**수정 파일**: `src/main/java/com/dialog/server/dto/auth/response/UserInfoResponse.java`

**현재 코드**:
```java
public record UserInfoResponse(
        Long id,
        String nickname,
        String githubId,
        Track track,
        boolean isNotificationEnabled
) {
    public static UserInfoResponse from(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getNickname(),
                user.getGithubId(),
                user.getTrack(),
                user.isWebPushNotification()
        );
    }
}
```

**변경 후**:
```java
package com.dialog.server.dto.auth.response;

import com.dialog.server.domain.SocialType;
import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;

public record UserInfoResponse(
        Long id,
        String nickname,
        String githubId,
        Track track,
        boolean isNotificationEnabled,
        SocialType socialType
) {
    public static UserInfoResponse from(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getNickname(),
                user.getGithubId(),
                user.getTrack(),
                user.isWebPushNotification(),
                user.getSocialType()
        );
    }
}
```

**변경 포인트** (v3 리뷰 H4):
- `socialType` 필드 추가
- Apple 사용자의 `githubId = null` 시 프론트엔드가 제공자 구분 가능

### 14-3. WebSecurityConfig TODO 주석 업데이트

**수정 파일**: `src/main/java/com/dialog/server/config/WebSecurityConfig.java`

현재 `anyRequest().permitAll()`이므로 즉시 변경 불필요. TODO 주석 반영할 내용:

```java
// TODO: 개발 완료 시 아래 주석 해제
// .requestMatchers("/", "/api/signup", "/api/signup/check",
//                  "/api/auth/mobile/apple").permitAll()
// .requestMatchers("/api/login/check").hasAnyRole("TEMP_USER", "USER", "ADMIN")
// .anyRequest().hasAnyRole("USER", "ADMIN")
```

> v3 리뷰 H6: `TEMP_USER`가 접근할 수 있는 경로를 명시적으로 제한.

---

## 통합 테스트 계획

### 테스트 파일: `src/test/java/com/dialog/server/controller/MobileAuthControllerTest.java`

#### 테스트 시나리오

| # | 시나리오 | HTTP 요청 | 예상 응답 | 세션 상태 |
|---|---------|----------|----------|----------|
| 1 | 신규 Apple 유저 로그인 | `POST /api/auth/mobile/apple` | `isRegistered=false` | `pending_oauth_id`, `pending_social_type=APPLE` |
| 2 | 기존 Apple 유저 로그인 | `POST /api/auth/mobile/apple` | `isRegistered=true`, userId, nickname | SecurityContext 설정 |
| 3 | nonce 불일치 | `POST /api/auth/mobile/apple` | 401 `INVALID_IDENTITY_TOKEN` | 세션 변경 없음 |
| 4 | identityToken 빈값 | `POST /api/auth/mobile/apple` | 400 (validation) | 세션 변경 없음 |
| 5 | nonce 빈값 | `POST /api/auth/mobile/apple` | 400 (validation) | 세션 변경 없음 |

#### 테스트 전략

`AppleTokenVerifier`를 `@MockBean`으로 모킹:

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MobileAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppleTokenVerifier appleTokenVerifier;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("신규 Apple 유저 로그인 — isRegistered=false + 세션 저장")
    void newAppleUserLogin() throws Exception {
        // given
        Map<String, Object> claims = Map.of("sub", "apple_user_001", "email", "test@icloud.com");
        when(appleTokenVerifier.verify(anyString(), anyString())).thenReturn(claims);

        // when & then
        mockMvc.perform(post("/api/auth/mobile/apple")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identityToken":"valid.jwt.token","nonce":"test-nonce"}
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRegistered").value(false));
    }

    @Test
    @DisplayName("기존 Apple 유저 로그인 — isRegistered=true + SecurityContext")
    void existingAppleUserLogin() throws Exception {
        // given: DB에 기존 유저 생성
        userRepository.save(User.builder()
                .oauthId("apple_user_002")
                .nickname("TestUser")
                .socialType(SocialType.APPLE)
                .role(Role.USER)
                .track(Track.BACKEND)
                .build());

        Map<String, Object> claims = Map.of("sub", "apple_user_002");
        when(appleTokenVerifier.verify(anyString(), anyString())).thenReturn(claims);

        // when & then
        mockMvc.perform(post("/api/auth/mobile/apple")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identityToken":"valid.jwt.token","nonce":"test-nonce"}
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRegistered").value(true))
                .andExpect(jsonPath("$.data.userId").isNumber())
                .andExpect(jsonPath("$.data.nickname").value("TestUser"));
    }

    @Test
    @DisplayName("nonce 불일치 — 401 응답")
    void nonceMismatch() throws Exception {
        // given
        when(appleTokenVerifier.verify(anyString(), anyString()))
                .thenThrow(new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN));

        // when & then
        mockMvc.perform(post("/api/auth/mobile/apple")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identityToken":"valid.jwt.token","nonce":"wrong-nonce"}
                    """))
                .andExpect(status().isUnauthorized());
    }
}
```

### AuthController 통합 테스트 추가

`socialType` 전달 검증 + `pending_social_type` 없을 시 에러:

```java
@Test
@DisplayName("pending_social_type 없을 시 signup 실패")
void signupWithoutSocialType() throws Exception {
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("pending_oauth_id", "test-oauth-id");
    // pending_social_type 설정하지 않음

    mockMvc.perform(post("/api/signup")
            .session(session)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"track":"BACKEND","webPushNotification":true}
                """))
            .andExpect(status().isUnauthorized());
}
```

---

## 검증 체크리스트

```bash
# 1. 빌드 + 테스트
./gradlew clean test

# 2. 확인 사항
# - POST /api/auth/mobile/apple 엔드포인트가 존재하는가
# - AppleLoginRequest에 @NotBlank 검증이 있는가
# - OAuthLoginResponse가 registered/needsSignup 팩토리 메서드를 제공하는가
# - data.sql에 social_type, oauth_id, github_id, role이 포함되어 있는가
# - UserInfoResponse에 socialType 필드가 추가되었는가
# - 기존 테스트가 모두 통과하는가
```

---

## 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 신규 | `dto/auth/request/AppleLoginRequest.java` | 모바일 Apple 로그인 요청 DTO |
| 신규 | `dto/auth/response/OAuthLoginResponse.java` | 모바일 OAuth 로그인 응답 DTO |
| 신규 | `controller/MobileAuthController.java` | 모바일 Apple OAuth REST API |
| 수정 | `data.sql` | users INSERT에 oauth_id, github_id, social_type, role 추가 |
| 수정 | `dto/auth/response/UserInfoResponse.java` | socialType 필드 추가 |

---

## 리스크

| 등급 | 리스크 | 완화 방안 |
|------|--------|----------|
| MEDIUM | data.sql 변경으로 develop 환경 기존 참조 깨짐 | users의 FK를 참조하는 discussions, comments 등은 user_id(1~9)만 참조하므로 영향 없음 |
| LOW | `appleDefaultProfileImageUrl` 설정 누락 | Phase 6에서 설정 추가. 테스트 환경은 `application-test.yml`에 추가 |
| LOW | `MobileAuthController` 비즈니스 로직 과다 | 단일 엔드포인트 단계. 모바일 GitHub 추가 시 `MobileAuthService` 추출 (v3 리뷰 M1) |
