# 모바일 Apple OAuth API 구현 계획 (v3)

**상태**: DRAFT
**작성일**: 2026-02-13
**범위**: 모바일 앱 전용 Apple OAuth 로그인 API
**이전 계획**: v2 (5인 리뷰 팀 검증 완료 → v3 리뷰 반영)
**변경 사유**: v3 리뷰 팀의 CRITICAL/HIGH 발견사항 반영 (트랜잭션 롤백 이슈 제외)

### 세부 구현 계획 문서

| Phase | 문서 | 설명 |
|-------|------|------|
| Phase 1 | [phase-1-domain-session-constants.md](./phase-1-domain-session-constants.md) | Domain 기반 + 세션 상수 (Step 1~4) |
| Phase 2 | [phase-2-repository-service.md](./phase-2-repository-service.md) | Repository & Service 계층 (Step 5~8) |
| Phase 3 | [phase-3-web-github-compat.md](./phase-3-web-github-compat.md) | 기존 웹 GitHub 플로우 호환 (Step 9~10) |
| Phase 4 | [phase-4-apple-token-verifier.md](./phase-4-apple-token-verifier.md) | Apple 토큰 검증 서비스 (Step 11) |
| Phase 5 | [phase-5-mobile-api-endpoint.md](./phase-5-mobile-api-endpoint.md) | 모바일 API 엔드포인트 (Step 12~14) |
| Phase 6 | [phase-6-configuration.md](./phase-6-configuration.md) | 설정 (Step 15) |

---

## Context

모바일 앱(iOS/Android)에서 Apple Sign In으로 로그인하기 위한 REST API를 추가한다.
v2 계획에서 리뷰 팀이 발견한 이슈(Builder 기본값 누락, getUserId() 리네이밍 영향, nonce 미검증, 배포 순서 미정의, aud 배열 처리, 세션 fallback 문제 등)를 모두 반영한다.

### 핵심 결정사항
- **인증 방식**: 세션(JSESSIONID) 유지 (기존 웹과 동일)
- **OAuth2UserInfo**: 인터페이스로 설계 (추상 클래스 대신)
- **Apple 프로필 이미지**: 설정으로 외부화된 기본 이미지 URL 할당
- **DB 마이그레이션**: Flyway 미사용 프로젝트이므로 JPA ddl-auto + data.sql로 관리
- **nonce 검증**: Apple 공식 가이드라인 준수, replay attack 방지
- **세션 상수**: 별도 `SessionConstants` 클래스로 관리

---

## 코드베이스 실사 결과 (v1과 다른 점)

| 항목 | v1 가정 | 실제 코드 |
|------|---------|-----------|
| Flyway | 마이그레이션 스크립트 작성 | **Flyway 미사용**. JPA ddl-auto만 사용 |
| ProfileImage.basicImageUri | nullable 가정 | **`@Column(nullable = false)` + Builder에서 null/blank 시 예외** (`ProfileImage.java:37,70-73`) |
| githubId 사용처 | 비즈니스 로직 다수 | **UserInfoResponse 표시 용도만** (`UserInfoResponse.java:9`) |
| data.sql | 미언급 | **users INSERT에 role, oauth_id, github_id 없음** — develop은 `ddl-auto: create`로 매번 재생성 |
| WebSecurityConfig | permitAll 경로 추가 필요 | **현재 `anyRequest().permitAll()`** (개발 모드) |
| CSRF | 비활성화 필요 | **이미 전역 비활성화** (`WebSecurityConfig.java:28`) |
| OAuth2UserInfo | 추상 클래스 | **인터페이스로 변경** (공유 구현 없음) |
| findUserByOauthId 호출처 | 미확인 | **2곳**: `AuthService.java:23`, `UserService.java:45` |
| getUserId() 호출처 | 미확인 | **`UserService.java:52,53`** — `nickname`과 `githubId` 설정에 사용 |
| Enum 전략 | 미확인 | **Role, Track 모두 `@Enumerated(EnumType.STRING)` 사용** — 일관성 확인 |

---

## 변경 영향 분석

### 신규 파일 (8개)

| # | 파일 (전체 경로) | 설명 |
|---|-----------------|------|
| 1 | `domain/SocialType.java` | OAuth 제공자 Enum |
| 2 | `dto/security/OAuth2UserInfo.java` | OAuth 유저 정보 **인터페이스** |
| 3 | `dto/security/AppleOAuth2UserInfo.java` | Apple id_token claims에서 정보 추출 |
| 4 | `service/AppleTokenVerifier.java` | Apple identityToken JWKS + nonce 검증 |
| 5 | `dto/auth/request/AppleLoginRequest.java` | 모바일 Apple 로그인 요청 DTO |
| 6 | `dto/auth/response/OAuthLoginResponse.java` | 모바일 OAuth 로그인 응답 DTO |
| 7 | `controller/MobileAuthController.java` | 모바일 Apple OAuth REST API |
| 8 | `controller/constants/SessionConstants.java` | 세션 키 상수 관리 |

### 수정 파일 (11개)

| # | 파일 (전체 경로) | 변경 내용 |
|---|-----------------|----------|
| 1 | `domain/User.java` | `socialType` 필드 추가 (Builder 기본값 `GITHUB`) |
| 2 | `dto/security/GitHubOAuth2UserInfo.java` | `OAuth2UserInfo` 인터페이스 구현 |
| 3 | `repository/UserRepository.java` | `findByOauthIdAndSocialType()` 추가, 기존 메서드 `@Deprecated` 후 삭제 |
| 4 | `service/UserService.java` | `findOrCreateTempUser(OAuth2UserInfo)` 파라미터 변경, Apple 기본 이미지 처리 |
| 5 | `service/AuthService.java` | `registerUser()`에 `SocialType` 파라미터 추가 |
| 6 | `service/CustomOAuth2UserService.java` | `OAuth2UserInfo` 타입 사용 (타입 일관성) |
| 7 | `controller/AuthController.java` | `SessionConstants` 사용, `pending_social_type` 세션 추출 |
| 8 | `controller/handler/OAuth2SuccessHandler.java` | `SessionConstants` 사용, `pending_social_type` 세션 저장 |
| 9 | `exception/ErrorCode.java` | Apple 관련 에러 코드 추가 |
| 10 | `dto/auth/response/UserInfoResponse.java` | `socialType` 필드 추가 (프론트엔드 제공자 구분) |
| 11 | `data.sql` | users INSERT에 `social_type`, `role`, `oauth_id`, `github_id` 추가 |

### 테스트 수정 파일

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `AuthServiceTest.java` | `User.builder()`에 `.socialType()` 추가, `registerUser()` 시그니처 변경 |
| 2 | `UserServiceTest.java` | `createUser()`에 `.socialType()` 추가 |
| 3 | `CustomOAuth2UserServiceTest.java` | `User.builder()`에 `.socialType()` 추가 |

### 의존성 변경: **없음**
`NimbusJwtDecoder`는 `spring-boot-starter-oauth2-client` → `spring-security-oauth2-jose` → `nimbus-jose-jwt` 전이 의존성으로 이미 존재.

> **사전 검증**: 구현 전 `./gradlew dependencies | grep nimbus` 로 확인.

---

## 단계별 구현 계획

### Phase 1: Domain 기반 + 세션 상수 (Step 1~4)

#### Step 1: SocialType Enum 생성

**새 파일**: `src/main/java/com/dialog/server/domain/SocialType.java`

```java
public enum SocialType {
    GITHUB, APPLE
}
```

#### Step 2: User 엔티티에 socialType 추가

**수정 파일**: `src/main/java/com/dialog/server/domain/User.java`

```java
// 추가할 필드 (line 35 부근)
@Enumerated(EnumType.STRING)
private SocialType socialType;
```

**핵심**: `nullable = false` 제약을 두지 않는다. 이유:
- prod 환경(`ddl-auto: update`)에서 기존 데이터의 `social_type`은 NULL
- JPA가 컬럼 추가 시 기존 행에 NULL이 들어감
- **Builder에서 기본값 `GITHUB` 처리** (v3 리뷰 C1 반영)

Builder에 `socialType` 파라미터 추가 (기본값 포함):

```java
@Builder
private User(String oauthId, String nickname, String githubId,
             SocialType socialType, Track track,
             boolean webPushNotification, Role role) {
    this.oauthId = oauthId;
    this.nickname = nickname;
    this.githubId = githubId;
    this.socialType = socialType != null ? socialType : SocialType.GITHUB;  // 기본값
    this.track = track;
    this.webPushNotification = webPushNotification;
    this.role = role;
}
```

> v2와 차이: `this.socialType = socialType` → `socialType != null ? socialType : SocialType.GITHUB` (v3 리뷰 C1 반영)
> - 기존 코드에서 `.socialType()` 호출 누락 시 NPE 방지
> - prod 기존 데이터의 NULL → JPA 로드 시 null이지만 Builder 통한 신규 생성은 기본값 보장

**UNIQUE 인덱스** — **1차 배포에서는 제외**, 2차 배포에서 추가:

```java
// 2차 배포에서 추가 (1차 배포에서는 이 어노테이션 없이 배포)
@Table(name = "users", indexes = {
    @Index(name = "uk_oauth_social", columnList = "oauthId, socialType", unique = true)
})
```

**prod 마이그레이션 전략 — 2단계 배포** (v3 리뷰 C4 반영):

1. **1차 배포**: `@Index` 어노테이션 **없이** 배포 → `ddl-auto: update`가 `social_type VARCHAR(255)` nullable 컬럼만 추가
2. **수동 SQL 실행**:
   ```sql
   UPDATE users SET social_type = 'GITHUB' WHERE social_type IS NULL;
   CREATE UNIQUE INDEX uk_oauth_social ON users(oauth_id, social_type);
   ```
3. **2차 배포**: `@Table(indexes = @Index(...))` 어노테이션 추가 (이미 존재하는 인덱스는 무시됨)

> v2와 차이: 단일 배포 → **2단계 배포**로 변경. `ddl-auto: update`가 인덱스 생성과 데이터 UPDATE 순서를 보장하지 않으므로 분리 (v3 리뷰 C4 반영)

#### Step 3: OAuth2UserInfo 인터페이스 + 하위 구현체

**새 파일**: `src/main/java/com/dialog/server/dto/security/OAuth2UserInfo.java`

```java
public interface OAuth2UserInfo {
    String getOAuthUserId();
    String getProfileImageUrl();
    String getNickname();
    SocialType getSocialType();
}
```

**수정 파일**: `src/main/java/com/dialog/server/dto/security/GitHubOAuth2UserInfo.java`

```java
public class GitHubOAuth2UserInfo implements OAuth2UserInfo {

    public static final String ID_PARAM = "id";
    public static final String IMAGE_URL_PARAM = "avatar_url";

    private final Map<String, Object> attributes;

    public GitHubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getOAuthUserId() {
        Object id = attributes.get(ID_PARAM);
        if (id == null) {
            throw new DialogException(ErrorCode.OAUTH_USER_ID_MISSING);
        }
        if (id instanceof Number) {
            return String.valueOf(((Number) id).longValue());
        }
        return id.toString();
    }

    @Override
    public String getProfileImageUrl() {
        Object url = attributes.get(IMAGE_URL_PARAM);
        return url == null ? null : url.toString();
    }

    @Override
    public String getNickname() {
        return (String) attributes.get("login");
    }

    @Override
    public SocialType getSocialType() {
        return SocialType.GITHUB;
    }

    // GitHub 전용: githubId(login) 조회용
    public String getGithubUsername() {
        return (String) attributes.get("login");
    }
}
```

변경 포인트:
- `implements OAuth2UserInfo` 추가
- 기존 `getUserId()` → `getGithubUsername()` (GitHub 전용 메서드로 명확화)
- `getNickname()`, `getSocialType()` 추가
- `GITHUB_USER_ID_MISSING` → `OAUTH_USER_ID_MISSING` 변경 (ErrorCode.java에서도 동시 변경)

> **주의 (v3 리뷰 C2 반영)**: 기존 `getUserId()`는 `UserService.java:52,53`에서 `nickname`과 `githubId` 설정에 사용됨. `getUserId()` 삭제 시 Phase 2의 Step 6에서 `saveTempUser()` 변경이 완료될 때까지 컴파일 에러 발생. Phase 1~2를 연속 구현하거나, `getUserId()`를 `@Deprecated`로 남겨두고 Phase 2 완료 후 삭제.

**새 파일**: `src/main/java/com/dialog/server/dto/security/AppleOAuth2UserInfo.java`

```java
public class AppleOAuth2UserInfo implements OAuth2UserInfo {

    private final String defaultProfileImageUrl;
    private final Map<String, Object> claims;

    public AppleOAuth2UserInfo(Map<String, Object> claims, String defaultProfileImageUrl) {
        this.claims = claims;
        this.defaultProfileImageUrl = defaultProfileImageUrl;
    }

    @Override
    public String getOAuthUserId() {
        return (String) claims.get("sub");
    }

    @Override
    public String getProfileImageUrl() {
        return defaultProfileImageUrl;  // Apple은 프로필 이미지 미제공 → 기본 이미지
    }

    @Override
    public String getNickname() {
        // 1순위: 최초 인증 시 전달된 이름
        String firstName = (String) claims.get("firstName");
        if (firstName != null && !firstName.isBlank()) {
            String lastName = (String) claims.get("lastName");
            return lastName != null ? firstName + " " + lastName : firstName;
        }
        // 2순위: email에서 추출 (private relay 제외 — 정규식으로 정확히 매칭)
        String email = (String) claims.get("email");
        if (email != null && !email.matches(".*@privaterelay\\.appleid\\.com$")) {
            return email.split("@")[0];
        }
        // 3순위: 고유한 기본값 (중복 방지)
        String sub = getOAuthUserId();
        return "Apple_" + (sub != null ? sub.substring(0, Math.min(sub.length(), 8)) : "User");
    }

    @Override
    public SocialType getSocialType() {
        return SocialType.APPLE;
    }
}
```

> v2와 차이:
> - `DEFAULT_PROFILE_IMAGE_URL` 하드코딩 → **생성자 주입**으로 변경 (v3 리뷰 M4 반영, 환경별 설정 외부화)
> - private relay email 필터: `contains()` → **정규식 `matches()`** (v3 리뷰 보안 H3 반영, 우회 방지)

**수정 파일**: `src/main/java/com/dialog/server/exception/ErrorCode.java`

```java
// 기존 GITHUB_USER_ID_MISSING 이름 변경 (Step 3에서 함께 처리)
OAUTH_USER_ID_MISSING("1001", "OAuth 제공자에서 사용자 ID를 가져올 수 없습니다.", HttpStatus.BAD_GATEWAY),
```

> v2와 차이: ErrorCode 변경을 Step 12에서 분리하여 **Step 3과 동시에 처리** (v3 리뷰 M5 반영, 컴파일 에러 즉시 해결)

#### Step 4: 세션 상수 클래스 추출

**새 파일**: `src/main/java/com/dialog/server/controller/constants/SessionConstants.java`

```java
public final class SessionConstants {
    public static final String PENDING_OAUTH_ID = "pending_oauth_id";
    public static final String PENDING_SOCIAL_TYPE = "pending_social_type";

    private SessionConstants() {}
}
```

> v3 리뷰 H7 반영: `PENDING_OAUTH_ID`를 `OAuth2SuccessHandler`에서 분리. `MobileAuthController`가 웹 OAuth 핸들러에 의존하지 않도록 도메인 개념(세션 키)을 독립적으로 관리.

**이 Phase 완료 후**: 기존 테스트 컴파일 깨짐 확인 → Step 2에서 Builder 파라미터 추가했으므로 테스트의 `User.builder()` 호출에 `.socialType(SocialType.GITHUB)` 추가 필요. 단, Builder 기본값이 있으므로 **`.socialType()` 누락 시에도 기본값 `GITHUB`로 동작**하여 컴파일 에러는 발생하지 않음. 명시적으로 추가하는 것을 권장.

**테스트 수정 대상**:
- `AuthServiceTest.java:43-54` — `User.builder()` 2곳에 `.socialType(SocialType.GITHUB)` 추가
- `UserServiceTest.java:184-191` — `createUser()`에 `.socialType(SocialType.GITHUB)` 추가
- `CustomOAuth2UserServiceTest.java:73-80` — `User.builder()`에 `.socialType(SocialType.GITHUB)` 추가

---

### Phase 2: Repository & Service 계층 (Step 5~7)

#### Step 5: UserRepository 변경

**수정 파일**: `src/main/java/com/dialog/server/repository/UserRepository.java`

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByOauthIdAndSocialType(String oauthId, SocialType socialType);

    @Deprecated  // Phase 2 완료 후 Step 8(cleanup)에서 삭제
    Optional<User> findUserByOauthId(String oauthId);

    List<User> findByWebPushNotificationAndIdNot(boolean webPushNotification, Long id);
}
```

> v2와 차이: `findUserByOauthId()` 즉시 삭제 → **`@Deprecated` 표시 후 Phase 2 완료 시 삭제** (v3 리뷰 H5 반영, 구현 순서 오류 방지)

#### Step 6: UserService 변경

**수정 파일**: `src/main/java/com/dialog/server/service/UserService.java`

```java
@Transactional
public User findOrCreateTempUser(OAuth2UserInfo userInfo) {
    try {
        return userRepository.findByOauthIdAndSocialType(
                    userInfo.getOAuthUserId(), userInfo.getSocialType())
                .orElseGet(() -> saveTempUser(userInfo));
    } catch (DataIntegrityViolationException e) {
        return userRepository.findByOauthIdAndSocialType(
                    userInfo.getOAuthUserId(), userInfo.getSocialType())
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    }
}

private User saveTempUser(OAuth2UserInfo userInfo) {
    String githubId = null;
    if (userInfo instanceof GitHubOAuth2UserInfo gitHubInfo) {
        githubId = gitHubInfo.getGithubUsername();
    }

    final User tempUser = User.builder()
            .oauthId(userInfo.getOAuthUserId())
            .nickname(userInfo.getNickname())       // 기존 getUserId() → getNickname()
            .githubId(githubId)                     // 기존 getUserId() → getGithubUsername() (instanceof 패턴 매칭)
            .socialType(userInfo.getSocialType())
            .role(Role.TEMP_USER)
            .build();
    final ProfileImage profileImage = ProfileImage.builder()
            .user(tempUser)
            .basicImageUri(userInfo.getProfileImageUrl())
            .build();
    final User saved = userRepository.save(tempUser);
    profileImageRepository.save(profileImage);
    return saved;
}
```

변경 포인트:
- 파라미터: `GitHubOAuth2UserInfo` → `OAuth2UserInfo` (인터페이스)
- **`nickname`: `oAuth2UserInfo.getUserId()` → `userInfo.getNickname()`** (v3 리뷰 C2 반영)
- **`githubId`: `oAuth2UserInfo.getUserId()` → `gitHubInfo.getGithubUsername()`** (v3 리뷰 C2 반영, `instanceof` 패턴 매칭)
- `basicImageUri`: Apple은 `getProfileImageUrl()`이 기본 이미지 URL 반환 → NOT NULL 제약 만족
- Race Condition 대응: UNIQUE 인덱스(`uk_oauth_social`) + `DataIntegrityViolationException` catch 추가

#### Step 7: AuthService 변경

**수정 파일**: `src/main/java/com/dialog/server/service/AuthService.java`

```java
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
```

**수정 파일**: `src/main/java/com/dialog/server/service/CustomOAuth2UserService.java`

```java
@Override
public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = defaultOAuth2UserService.loadUser(userRequest);

    Map<String, Object> attributes = oAuth2User.getAttributes();
    OAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(attributes);  // 타입 일관성을 위해 OAuth2UserInfo로 선언

    User user = userService.findOrCreateTempUser(userInfo);

    return new OAuth2UserPrincipal(user, attributes);
}
```

> v2와 차이: `GitHubOAuth2UserInfo userInfo` → `OAuth2UserInfo userInfo` 타입 변경 (v3 리뷰 반영, 타입 일관성). `findOrCreateTempUser` 파라미터가 `OAuth2UserInfo`로 바뀌므로 업캐스팅으로 호환되지만, 선언 타입도 인터페이스로 맞추는 것이 일관성 있음.

#### Step 8: Cleanup — `findUserByOauthId()` 삭제

Step 5에서 `@Deprecated` 표시한 `findUserByOauthId()`를 **UserRepository에서 삭제**.

> 전제: Step 6(`UserService`)과 Step 7(`AuthService`)에서 모든 호출처가 `findByOauthIdAndSocialType()`으로 변경 완료.

---

### Phase 3: 기존 웹 GitHub 플로우 호환 (Step 9~10)

#### Step 9: OAuth2SuccessHandler 수정

**수정 파일**: `src/main/java/com/dialog/server/controller/handler/OAuth2SuccessHandler.java`

```java
import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;

// 기존 상수 제거:
// public static final String PENDING_OAUTH_ID = "pending_oauth_id";  // SessionConstants로 이동

// handleUnregisteredUser 메서드에 1줄 추가:
private void handleUnregisteredUser(HttpServletRequest request, HttpServletResponse response,
                                    OAuth2UserPrincipal principal) throws IOException {
    HttpSession session = request.getSession(true);
    session.setAttribute(PENDING_OAUTH_ID, principal.getName());
    session.setAttribute(PENDING_SOCIAL_TYPE, principal.user().getSocialType());  // 추가

    String redirectUrl = frontendUrl + SIGNUP_PATH;
    getRedirectStrategy().sendRedirect(request, response, redirectUrl);
}
```

#### Step 10: AuthController 수정

**수정 파일**: `src/main/java/com/dialog/server/controller/AuthController.java`

```java
import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;

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

> v2와 차이:
> - `OAuth2SuccessHandler.PENDING_SOCIAL_TYPE` → `SessionConstants.PENDING_SOCIAL_TYPE` (v3 리뷰 H7 반영)
> - fallback `SocialType.GITHUB` 반환 → **`throw DialogException`** (v3 리뷰 H1 반영, Apple 유저 데이터 불일치 방지)

---

### Phase 4: Apple 토큰 검증 서비스 (Step 11)

#### Step 11: AppleTokenVerifier

**새 파일**: `src/main/java/com/dialog/server/service/AppleTokenVerifier.java`

```java
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
                // v3 리뷰 H3 반영: aud 클레임이 String 또는 List 모두 처리
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

            // v3 리뷰 C5 반영: nonce 검증 (replay attack 방지)
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

> v2와 차이:
> - `JwtClaimValidator<>("aud", audiences::contains)` → **커스텀 aud validator** (v3 리뷰 H3 반영, String/List 모두 처리)
> - `verify(String identityToken)` → **`verify(String identityToken, String expectedNonce)`** (v3 리뷰 C5 반영)
> - nonce 클레임 검증 로직 추가
> - 로깅에서 `e.getMessage()` 제거 → `e.getClass().getSimpleName()`만 (민감 정보 노출 방지)

---

### Phase 5: 모바일 API 엔드포인트 (Step 12~14)

#### Step 12: 모바일 DTO

**새 파일**: `src/main/java/com/dialog/server/dto/auth/request/AppleLoginRequest.java`

```java
public record AppleLoginRequest(
    @NotBlank String identityToken,
    @NotBlank String nonce,     // v3 리뷰 C5 반영: replay attack 방지
    String firstName,           // 최초 인증 시에만 제공 (nullable)
    String lastName             // 최초 인증 시에만 제공 (nullable)
) {}
```

> v2와 차이: `nonce` 필드 추가 (`@NotBlank`)

**새 파일**: `src/main/java/com/dialog/server/dto/auth/response/OAuthLoginResponse.java`

```java
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

#### Step 13: MobileAuthController

**새 파일**: `src/main/java/com/dialog/server/controller/MobileAuthController.java`

```java
import static com.dialog.server.controller.constants.SessionConstants.PENDING_OAUTH_ID;
import static com.dialog.server.controller.constants.SessionConstants.PENDING_SOCIAL_TYPE;
import static org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY;

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
            Authentication authentication = authService.authenticate(user.getId());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(SPRING_SECURITY_CONTEXT_KEY,
                    SecurityContextHolder.getContext());

            return ResponseEntity.ok(
                    new ApiSuccessResponse<>(OAuthLoginResponse.registered(user)));
        } else {
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(PENDING_OAUTH_ID, user.getOauthId());
            session.setAttribute(PENDING_SOCIAL_TYPE, user.getSocialType());

            return ResponseEntity.ok(
                    new ApiSuccessResponse<>(OAuthLoginResponse.needsSignup()));
        }
    }
}
```

> v2와 차이:
> - `SessionConstants`에서 상수 import (v3 리뷰 H7 반영)
> - `appleTokenVerifier.verify(token)` → `verify(token, nonce)` (v3 리뷰 C5 반영)
> - `AppleOAuth2UserInfo` 생성자에 `appleDefaultProfileImageUrl` 전달 (v3 리뷰 M4 반영)
> - 기술 부채 참고: 향후 모바일 GitHub 추가 시 `MobileAuthService`로 비즈니스 로직 추출 필요 (v3 리뷰 M1)

#### Step 14: ErrorCode + WebSecurityConfig + data.sql + UserInfoResponse

**수정 파일**: `src/main/java/com/dialog/server/exception/ErrorCode.java`

```java
// 추가 (OAUTH_USER_ID_MISSING 변경은 Step 3에서 이미 처리)
INVALID_IDENTITY_TOKEN("1006", "유효하지 않은 인증 토큰입니다.", HttpStatus.UNAUTHORIZED),
APPLE_AUTH_SERVER_ERROR("1007", "인증에 실패했습니다. 잠시 후 다시 시도해주세요.", HttpStatus.BAD_GATEWAY),
```

> v2와 차이: `APPLE_AUTH_SERVER_ERROR` 메시지에서 "Apple" 제거 (v3 리뷰 M8 반영, 외부 시스템 정보 노출 방지)

**수정 파일**: `src/main/java/com/dialog/server/config/WebSecurityConfig.java`

현재 `anyRequest().permitAll()`이므로 즉시 변경 불필요. 단, TODO 주석 해제 시 반영할 내용을 주석으로 추가:

```java
// TODO: 개발 완료 시 아래 주석 해제
// .requestMatchers("/", "/api/signup", "/api/signup/check",
//                  "/api/auth/mobile/apple").permitAll()
// .requestMatchers("/api/login/check").hasAnyRole("TEMP_USER", "USER", "ADMIN")
// .anyRequest().hasAnyRole("USER", "ADMIN")
```

> v2와 차이: `anyRequest().authenticated()` → **`hasAnyRole("USER", "ADMIN")`** + `TEMP_USER` 별도 경로 지정 (v3 리뷰 H6 반영, TEMP_USER 권한 범위 명시)

**수정 파일**: `src/main/java/com/dialog/server/dto/auth/response/UserInfoResponse.java`

`socialType` 필드 추가:

```java
// 기존 필드에 추가
private SocialType socialType;

public static UserInfoResponse from(User user) {
    // ... 기존 매핑 + socialType 추가
}
```

> v3 리뷰 H4 반영: Apple 사용자의 `githubId = null` 시 프론트엔드가 제공자 구분 가능하도록 `socialType` 필드 추가.

**수정 파일**: `src/main/resources/data.sql`

users INSERT문 수정 (develop 환경 `ddl-auto: create` 대응):

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

> v2와 차이: 실제 data.sql 확인 결과 `oauth_id`, `github_id`, `social_type`, `role` 모두 누락이었으므로 전체 재작성 (v3 리뷰 H2 반영)

---

### Phase 6: 설정 (Step 15)

#### Step 15: application.yml Apple 설정 추가

**수정 파일**: `src/main/resources/application-develop.yml`, `application-prod.yml`

```yaml
apple:
  oauth2:
    allowed-audiences: ${APPLE_ALLOWED_AUDIENCES}  # 콤마 구분: com.dialog.app,com.dialog.service
    default-profile-image-url: ${APPLE_DEFAULT_PROFILE_IMAGE_URL:https://dialog-profile.s3.ap-northeast-2.amazonaws.com/default-apple-profile.png}
```

> v2와 차이: `default-profile-image-url` 설정 추가 (v3 리뷰 M4 반영, 환경별 다른 S3 URL 대응)

**수정 파일**: `src/test/resources/application-test.yml`

```yaml
apple:
  oauth2:
    allowed-audiences: test-bundle-id,test-service-id
    default-profile-image-url: https://test-profile-image.example.com/default.png
```

---

## 구현 순서 & 체크포인트

```
Phase 1 (Step 1~4) → 테스트 통과 확인
     ↓
Phase 2 (Step 5~8) → 테스트 통과 확인, findUserByOauthId 삭제 확인
     ↓
Phase 3 (Step 9~10) → 기존 GitHub 웹 플로우 회귀 확인
     ↓
Phase 4 (Step 11)  → AppleTokenVerifier 단위 테스트 (nonce 검증 포함)
     ↓
Phase 5 (Step 12~14) → MobileAuthController 통합 테스트
     ↓
Phase 6 (Step 15)  → 설정 확인
```

---

## v3 리뷰 반영 사항 요약

### v2 리뷰 반영 (유지)

| 리뷰 ID | 등급 | 문제 | 반영 |
|---------|------|------|------|
| C1 | CRITICAL | Flyway 마이그레이션 없음 | 프로젝트가 Flyway 미사용. JPA ddl-auto + prod 수동 SQL로 대응 |
| C2 | CRITICAL | UNIQUE 인덱스 + Race Condition | `@Table(indexes=...)` + `DataIntegrityViolationException` catch |
| C3 | CRITICAL | ProfileImage.basicImageUri NOT NULL | Apple 기본 이미지 URL 반환 |
| C4 | CRITICAL | aud 단일값 검증 | `allowed-audiences` 리스트로 변경 |
| C5 | CRITICAL | githubId null 영향 | 실사 결과 표시 용도만(UserInfoResponse). null 허용 |

### v3 리뷰 반영 (신규)

| 리뷰 ID | 등급 | 문제 | 반영 |
|---------|------|------|------|
| v3-C1 | CRITICAL | Builder에 socialType 기본값 없음 | `socialType != null ? socialType : SocialType.GITHUB` |
| v3-C2 | CRITICAL | getUserId() 리네이밍 → 컴파일 에러 | Step 6에 `.nickname(userInfo.getNickname())` 명시 |
| v3-C4 | CRITICAL | prod UNIQUE 인덱스 생성 순서 미정의 | 2단계 배포 전략으로 변경 |
| v3-C5 | CRITICAL | Apple nonce 검증 누락 | `AppleLoginRequest`에 nonce 필드 + 검증 로직 추가 |
| v3-H1 | HIGH | pending_social_type fallback GITHUB | fallback 제거, 에러 처리로 변경 |
| v3-H2 | HIGH | data.sql 컬럼 누락 | data.sql 전체 재작성 |
| v3-H3 | HIGH | aud 클레임 배열 미처리 | 커스텀 validator로 String/List 모두 처리 |
| v3-H4 | HIGH | UserInfoResponse githubId null 노출 | socialType 필드 추가 |
| v3-H5 | HIGH | findUserByOauthId 삭제 시점 오류 | @Deprecated → cleanup step 분리 |
| v3-H6 | HIGH | TEMP_USER 권한 범위 미정의 | WebSecurityConfig TODO에 hasAnyRole 규칙 명시 |
| v3-H7 | HIGH | 세션 상수가 OAuth2SuccessHandler 종속 | SessionConstants 별도 클래스 추출 |
| v3-M4 | MEDIUM | Apple 기본 이미지 URL 하드코딩 | application.yml 외부화 |
| v3-M5 | MEDIUM | ErrorCode 변경 Step 12까지 지연 | Step 3에서 함께 변경 |
| v3-M8 | MEDIUM | 에러 메시지 외부 시스템 정보 노출 | "Apple" 제거 |

### 미반영 (향후 과제)

| 리뷰 ID | 등급 | 문제 | 사유 |
|---------|------|------|------|
| v3-C3 | CRITICAL | DataIntegrityViolationException 트랜잭션 롤백 | 코드 아키텍처 변경 필요, 별도 작업으로 진행 |
| v3-M1 | MEDIUM | MobileAuthController 비즈니스 로직 과다 | 단일 엔드포인트 단계. 모바일 GitHub 추가 시 MobileAuthService 추출 |

---

## 검증 방법

### 빌드 & 기존 테스트
```bash
./gradlew clean test
```

### 단위 테스트 (신규)
- `AppleOAuth2UserInfo`: nickname 추출 (firstName/lastName, email, fallback)
- `AppleTokenVerifier`: 유효한 토큰, 만료 토큰, 잘못된 서명, nonce 불일치, aud 검증 실패, Apple 서버 오류
- `GitHubOAuth2UserInfo`: OAuth2UserInfo 구현 후 기존 동작 유지

### 통합 테스트 (신규)
- `MobileAuthController`: Apple 엔드포인트 (AppleTokenVerifier 모킹)
  - 신규 회원: `isRegistered=false` + 세션에 `pending_oauth_id`, `pending_social_type` 저장
  - 기존 회원: `isRegistered=true` + SecurityContext 설정
  - nonce 불일치: 401 응답
- `AuthController.signup()`: `socialType` 전달 검증, `pending_social_type` 없을 시 에러

### 회귀 테스트
- 기존 `AuthServiceTest`, `UserServiceTest`, `CustomOAuth2UserServiceTest` 통과 확인
- GitHub 웹 로그인 → 회원가입 → 로그인 유지 플로우

### 수동 테스트 (iOS)
- Apple Sign In → identityToken + nonce → `POST /api/auth/mobile/apple` → JSESSIONID → 후속 API 호출

---

## 사전 준비 사항

### Apple Developer Console
1. App ID 생성 → "Sign in with Apple" capability 활성화
2. iOS 앱 번들 ID 확인 (identityToken `aud` 검증에 필요)

### 환경변수
```
APPLE_ALLOWED_AUDIENCES=com.dialog.app,com.dialog.service  # 번들ID,서비스ID
APPLE_DEFAULT_PROFILE_IMAGE_URL=https://dialog-profile.s3.ap-northeast-2.amazonaws.com/default-apple-profile.png
```

### Apple 기본 프로필 이미지
- S3에 기본 Apple 프로필 이미지 업로드 필요 (public-read 또는 CloudFront 설정)
- URL을 환경변수 `APPLE_DEFAULT_PROFILE_IMAGE_URL`로 설정
