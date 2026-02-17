# Apple OAuth Login 구현 계획

**상태**: DRAFT (리뷰 반영 v2)
**작성일**: 2026-02-13

---

## Context

현재 프로젝트는 GitHub OAuth2 로그인만 지원한다. Apple OAuth 로그인을 추가하여 사용자에게 두 번째 소셜 로그인 옵션을 제공한다.

**핵심 차이점:** GitHub은 일반 OAuth2(UserInfo endpoint 사용), Apple은 OIDC 기반(id_token 사용, UserInfo endpoint 없음). 따라서 Apple은 별도의 `OidcUserService` 경로로 처리해야 한다.

**Apple OAuth 특이사항:**
- `client_secret`이 정적 문자열이 아닌 ES256으로 서명한 JWT (최대 6개월 유효)
- `response_mode=form_post` 필수 (POST 콜백)
- 사용자 이름(firstName, lastName)은 최초 인증 시에만 제공 → **반드시 저장해야 함**
- UserInfo endpoint 없음 — id_token의 claims에서 사용자 정보 추출
- Token endpoint에 `User-Agent` 헤더 필수

### 왜 clientId 이외의 환경변수가 필요한가?

프론트엔드 JS SDK 방식(Sign in with Apple JS)을 사용하면 `clientId`만으로 구현 가능하다. 하지만 이 프로젝트는 **백엔드 서버사이드 방식**(Spring Security OAuth2 Login)을 사용하므로, 서버가 직접 Apple Token Endpoint에 Authorization Code를 교환해야 한다. 이때 `client_secret`(ES256 JWT)이 필요하고, 이를 생성하려면 다음 4가지가 모두 필요하다:

| 값 | JWT에서의 역할 | 설명 |
|---|---|---|
| `APPLE_TEAM_ID` | `iss` (issuer) | Apple Developer 팀 식별자 |
| `APPLE_CLIENT_ID` | `sub` (subject) | Service ID |
| `APPLE_KEY_ID` | JWT header `kid` | 서명 키 식별자 |
| `APPLE_PRIVATE_KEY` | ES256 서명 | `.p8` 파일의 프라이빗 키 |

> **대안 검토**: 프론트엔드 JS SDK 방식으로 전환하면 환경변수를 줄이고 client_secret 만료 문제를 없앨 수 있으나, 기존 GitHub OAuth 흐름과 구조가 달라져 코드 일관성이 떨어진다. 현재 Spring Security 기반 서버사이드 방식을 유지한다.

---

## 변경 범위 요약

### 새로 생성할 파일 (7개)
| 파일 | 설명 |
|------|------|
| `domain/SocialType.java` | OAuth 제공자 Enum (GITHUB, APPLE) |
| `dto/security/OAuth2UserInfo.java` | OAuth 유저 정보 추상 클래스 |
| `dto/security/AppleOAuth2UserInfo.java` | Apple id_token claims 추출 |
| `dto/security/SocialUserPrincipal.java` | GitHub/Apple Principal 공통 인터페이스 |
| `dto/security/OidcUserPrincipal.java` | Apple OIDC Principal 클래스 |
| `service/CustomOidcUserService.java` | Apple OIDC 유저 서비스 |
| `service/AppleClientSecretGenerator.java` | Apple client_secret JWT 생성 전용 서비스 |

### 수정할 파일 (10개)
| 파일 | 변경 내용 |
|------|----------|
| `domain/User.java` | `socialType` 필드 추가 |
| `dto/security/GitHubOAuth2UserInfo.java` | `OAuth2UserInfo` 상속으로 변경 |
| `dto/security/OAuth2UserPrincipal.java` | `SocialUserPrincipal` 인터페이스 구현 추가 |
| `service/CustomOAuth2UserService.java` | `OAuth2UserInfo` 추상 타입 사용 |
| `service/UserService.java` | `findOrCreateTempUser()` 파라미터를 `OAuth2UserInfo`로 변경 |
| `service/AuthService.java` | `findUserByOauthId()` → `findUserByOauthIdAndSocialType()` 변경 |
| `repository/UserRepository.java` | `findUserByOauthIdAndSocialType()` 메서드 추가 |
| `config/OAuth2Config.java` | Apple `ClientRegistration` 등록 + `AppleClientSecretGenerator` 활용 |
| `config/WebSecurityConfig.java` | `oidcUserService` 등록 |
| `controller/handler/OAuth2SuccessHandler.java` | `SocialUserPrincipal` 인터페이스로 캐스팅 변경 |
| `exception/ErrorCode.java` | `OAUTH_USER_ID_MISSING`, `UNSUPPORTED_OAUTH_PROVIDER` 에러 코드 추가 |
| `application-develop.yml` | Apple OAuth 설정 추가 |
| `application-prod.yml` | Apple OAuth 설정 추가 |

---

## 단계별 구현 계획

### Step 1: SocialType Enum 생성

**새 파일:** `domain/SocialType.java`

```java
public enum SocialType {
    GITHUB, APPLE
}
```

### Step 2: User 엔티티에 socialType 추가

**수정 파일:** `domain/User.java`

```java
// 추가할 필드
@Enumerated(EnumType.STRING)
private SocialType socialType;
```

- Builder에 `socialType` 파라미터 추가

> **DB 스키마 변경 참고**: 현재 프로젝트는 Flyway를 사용하지 않고 `ddl-auto`를 사용 중이므로, JPA가 자동으로 컬럼을 추가한다. 단, **프로덕션 배포 전** 기존 데이터에 대해 아래 SQL을 수동 실행해야 한다:
> ```sql
> -- 1. 기존 GitHub 유저에 socialType 설정
> UPDATE users SET social_type = 'GITHUB' WHERE social_type IS NULL;
> -- 2. oauthId + socialType 복합 UNIQUE 인덱스 추가
> ALTER TABLE users ADD UNIQUE INDEX uk_oauth_id_social_type (oauth_id, social_type);
> ```
> `social_type` 컬럼은 JPA 레벨에서 `@Column(nullable = false)` 제약을 건다. 기존 데이터 마이그레이션(UPDATE) 후 NOT NULL이 보장되므로 안전하다.

### Step 3: OAuth2UserInfo 추상 클래스 생성 및 리팩토링

**새 파일:** `dto/security/OAuth2UserInfo.java`

```java
public abstract class OAuth2UserInfo {
    protected final Map<String, Object> attributes;

    protected OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public abstract String getOAuthUserId();       // 고유 식별자 (GitHub: id, Apple: sub)
    public abstract String getProfileImageUrl();   // 프로필 이미지 (nullable)
    public abstract String getNickname();           // 표시 이름
    public abstract SocialType getSocialType();     // 제공자 타입

    // GitHub은 login 반환, Apple은 null 반환
    public String getProviderUsername() { return null; }
}
```

**수정 파일:** `dto/security/GitHubOAuth2UserInfo.java`

- `OAuth2UserInfo`를 상속하도록 변경
- 기존 `getUserId()` → `getProviderUsername()` + `getNickname()` 으로 분리
- `getSocialType()` → `SocialType.GITHUB` 반환
- 기존 `getOAuthUserId()`, `getProfileImageUrl()` 유지

**새 파일:** `dto/security/AppleOAuth2UserInfo.java`

```java
public class AppleOAuth2UserInfo extends OAuth2UserInfo {

    public AppleOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getOAuthUserId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getProfileImageUrl() {
        return null;  // Apple은 프로필 이미지 미제공
    }

    @Override
    public String getNickname() {
        // 1순위: 최초 인증 시 전달된 이름
        String firstName = (String) attributes.get("firstName");
        if (firstName != null && !firstName.isBlank()) {
            String lastName = (String) attributes.get("lastName");
            return lastName != null ? firstName + " " + lastName : firstName;
        }

        // 2순위: email에서 추출 (private relay 이메일 제외)
        String email = (String) attributes.get("email");
        if (email != null && !email.contains("privaterelay.appleid.com")) {
            return email.split("@")[0];
        }

        // 3순위: 기본값
        return "Apple User";
    }

    @Override
    public SocialType getSocialType() {
        return SocialType.APPLE;
    }
}
```

> **리뷰 반영**: Apple Private Relay 이메일(`xxx@privaterelay.appleid.com`)에서 의미 없는 해시를 nickname으로 사용하는 문제를 방지한다. 이름 정보가 있으면 우선 사용하고, private relay 이메일은 건너뛴다.

### Step 4: SocialUserPrincipal 인터페이스 생성

**새 파일:** `dto/security/SocialUserPrincipal.java`

```java
public interface SocialUserPrincipal {
    User user();
}
```

**수정 파일:** `dto/security/OAuth2UserPrincipal.java`

```java
// 변경: SocialUserPrincipal 구현 추가
public record OAuth2UserPrincipal(User user, Map<String, Object> attributes)
    implements OAuth2User, SocialUserPrincipal { ... }
```

**새 파일:** `dto/security/OidcUserPrincipal.java`

```java
public class OidcUserPrincipal extends DefaultOidcUser implements SocialUserPrincipal {
    private final User user;

    public OidcUserPrincipal(User user, OidcIdToken idToken) {
        super(user.getRole().toAuthorities(), idToken, "sub");
        this.user = user;
    }

    @Override
    public User user() { return user; }

    @Override
    public String getName() { return user.getOauthId(); }
}
```

### Step 5: UserService, UserRepository, AuthService 수정

**수정 파일:** `repository/UserRepository.java`

```java
// 추가
Optional<User> findUserByOauthIdAndSocialType(String oauthId, SocialType socialType);
```

> **리뷰 반영**: `oauthId + socialType` 복합 UNIQUE 인덱스가 DB에 추가되므로, 이 쿼리는 인덱스를 활용하여 빠르게 조회된다.

**수정 파일:** `service/UserService.java`

```java
// 변경 전:
public User findOrCreateTempUser(GitHubOAuth2UserInfo userInfo) {
    return userRepository.findUserByOauthId(userInfo.getOAuthUserId())
            .orElseGet(() -> saveTempUser(userInfo));
}

// 변경 후:
public User findOrCreateTempUser(OAuth2UserInfo userInfo) {
    return userRepository.findUserByOauthIdAndSocialType(
                userInfo.getOAuthUserId(), userInfo.getSocialType())
            .orElseGet(() -> saveTempUser(userInfo));
}

private User saveTempUser(OAuth2UserInfo userInfo) {
    final User tempUser = User.builder()
            .oauthId(userInfo.getOAuthUserId())
            .nickname(userInfo.getNickname())
            .githubId(userInfo.getProviderUsername())  // Apple은 null, GitHub은 login
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

**수정 파일:** `service/AuthService.java`

> **리뷰 반영**: `AuthService.registerUser()`도 `findUserByOauthId()`를 사용하므로 반드시 함께 수정해야 한다. 누락 시 런타임 오류 발생.

```java
// 변경 전:
public Long registerUser(SignupRequest signupRequest, String oauthId) {
    User user = userRepository.findUserByOauthId(oauthId)
            .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    ...
}

// 변경 후:
// AuthService에서는 oauthId만으로 조회하는 상황 (session에서 꺼낸 값).
// session에 socialType도 함께 저장하도록 OAuth2SuccessHandler를 수정하거나,
// oauthId가 provider별로 고유하다는 점을 활용하여 기존 메서드를 유지할 수 있다.
//
// 결정: session에 "pending_social_type"을 추가 저장하고, AuthService에서 함께 사용한다.
public Long registerUser(SignupRequest signupRequest, String oauthId, SocialType socialType) {
    User user = userRepository.findUserByOauthIdAndSocialType(oauthId, socialType)
            .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    ...
}
```

이에 따라 **AuthController.signup()** 에서 session에서 `pending_social_type`을 꺼내 `registerUser()`에 전달하도록 수정한다.

### Step 6: CustomOAuth2UserService 수정 (GitHub용)

**수정 파일:** `service/CustomOAuth2UserService.java`

```java
@Override
public OAuth2User loadUser(OAuth2UserRequest userRequest) {
    OAuth2User oAuth2User = defaultOAuth2UserService.loadUser(userRequest);

    // registrationId로 provider 판별 → 적절한 OAuth2UserInfo 생성
    String registrationId = userRequest.getClientRegistration().getRegistrationId();
    OAuth2UserInfo userInfo = createOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

    User user = userService.findOrCreateTempUser(userInfo);
    return new OAuth2UserPrincipal(user, oAuth2User.getAttributes());
}

private OAuth2UserInfo createOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
    if ("github".equals(registrationId)) {
        return new GitHubOAuth2UserInfo(attributes);
    }
    throw new DialogException(ErrorCode.UNSUPPORTED_OAUTH_PROVIDER);
}
```

### Step 7: CustomOidcUserService 생성 (Apple용)

**새 파일:** `service/CustomOidcUserService.java`

```java
@Service
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final UserService userService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {
        OidcIdToken idToken = userRequest.getIdToken();

        // id_token claims에서 Apple 유저 정보 추출
        Map<String, Object> claims = new HashMap<>(idToken.getClaims());

        // 최초 인증 시 전달되는 user 정보(firstName, lastName)는
        // Apple이 authorization response의 "user" 파라미터로 전달한다.
        // Spring Security가 이를 additionalParameters로 전달하는지 확인 필요.
        // 전달되지 않으면 별도 처리가 필요하다 (아래 주의사항 참조).

        AppleOAuth2UserInfo userInfo = new AppleOAuth2UserInfo(claims);

        // DB에서 유저 조회 또는 임시 유저 생성
        User user = userService.findOrCreateTempUser(userInfo);

        return new OidcUserPrincipal(user, idToken);
    }
}
```

> Apple은 UserInfo endpoint가 없으므로 `DefaultOidcUserService`를 호출하지 않고, id_token claims만 사용한다.

> **주의 (리뷰 반영)**: Apple은 사용자 이름(firstName, lastName)을 **최초 인증 시에만** authorization response의 `user` JSON 파라미터로 전달한다. Spring Security의 OIDC 흐름에서 이 값이 `OidcUserRequest`에 어떻게 전달되는지 구현 시 확인이 필요하다. 전달되지 않으면 `AuthorizationCodeTokenResponseClient`를 커스텀하여 `user` 파라미터를 별도로 파싱해야 한다.

### Step 8: OAuth2SuccessHandler 수정

**수정 파일:** `controller/handler/OAuth2SuccessHandler.java`

```java
// 변경 전:
OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();

// 변경 후:
SocialUserPrincipal principal = (SocialUserPrincipal) authentication.getPrincipal();
```

추가로, 미등록 사용자 처리 시 session에 `pending_social_type`도 저장:

```java
private void handleUnregisteredUser(HttpServletRequest request, ..., SocialUserPrincipal principal) {
    request.getSession().setAttribute("pending_oauth_id", principal.user().getOauthId());
    request.getSession().setAttribute("pending_social_type", principal.user().getSocialType());
    // ... 리다이렉트
}
```

`SocialUserPrincipal.user()` 메서드를 사용하므로 나머지 로직은 변경 불필요.

### Step 9: AppleClientSecretGenerator 서비스 + OAuth2Config 설정

> **리뷰 반영**: JWT 생성 로직을 `OAuth2Config`에서 분리하여 별도 서비스 클래스로 만든다. 또한 앱 기동 시 1회 생성이 아닌, 만료 전 자동 갱신을 지원한다.

**새 파일:** `service/AppleClientSecretGenerator.java`

```java
@Component
public class AppleClientSecretGenerator {

    private final String teamId;
    private final String clientId;
    private final String keyId;
    private final ECPrivateKey privateKey;

    private String cachedSecret;
    private Instant cachedExpiry;

    public AppleClientSecretGenerator(
            @Value("${apple.oauth2.team-id}") String teamId,
            @Value("${apple.oauth2.client-id}") String clientId,
            @Value("${apple.oauth2.key-id}") String keyId,
            @Value("${apple.oauth2.private-key}") String privateKeyContent) {
        this.teamId = teamId;
        this.clientId = clientId;
        this.keyId = keyId;
        this.privateKey = loadPrivateKey(privateKeyContent);
    }

    /**
     * client_secret JWT를 반환한다.
     * 캐싱된 값이 만료 30일 전이면 자동으로 재생성한다.
     */
    public synchronized String getClientSecret() {
        if (cachedSecret == null || Instant.now().isAfter(cachedExpiry.minus(30, ChronoUnit.DAYS))) {
            cachedSecret = generateClientSecret();
            cachedExpiry = Instant.now().plus(180, ChronoUnit.DAYS);
        }
        return cachedSecret;
    }

    private String generateClientSecret() {
        // 1. nimbus-jose-jwt로 ES256 서명 JWT 생성
        //    - header: kid=keyId, alg=ES256
        //    - payload: iss=teamId, sub=clientId, aud=https://appleid.apple.com
        //    - exp: 현재시간 + 6개월 (180일)
        // 2. JWT 문자열 반환
    }

    private ECPrivateKey loadPrivateKey(String base64Content) {
        // Base64 디코딩 → PKCS8EncodedKeySpec → ECPrivateKey 변환
    }
}
```

> **리뷰 반영 (CRITICAL)**: 앱 기동 시 1회 생성 방식에서 **만료 30일 전 자동 갱신** 방식으로 변경. 6개월 이상 무중단 운영 시에도 Apple 로그인이 중단되지 않는다. `synchronized`로 동시 갱신을 방지한다.

**수정 파일:** `config/OAuth2Config.java`

```java
@Configuration
public class OAuth2Config {

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService() {
        return new DefaultOAuth2UserService();
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${spring.security.oauth2.client.registration.github.client-id}") String githubClientId,
            @Value("${spring.security.oauth2.client.registration.github.client-secret}") String githubClientSecret,
            @Value("${spring.security.oauth2.client.registration.github.redirect-uri}") String githubRedirectUri,
            AppleClientSecretGenerator appleSecretGenerator,
            @Value("${apple.oauth2.client-id}") String appleClientId,
            @Value("${apple.oauth2.redirect-uri}") String appleRedirectUri) {

        // GitHub: Spring의 CommonOAuth2Provider 활용
        ClientRegistration github = CommonOAuth2Provider.GITHUB.getBuilder("github")
                .clientId(githubClientId)
                .clientSecret(githubClientSecret)
                .redirectUri(githubRedirectUri)
                .build();

        // Apple: 동적 client_secret + OIDC 설정
        ClientRegistration apple = ClientRegistration.withRegistrationId("apple")
                .clientId(appleClientId)
                .clientSecret(appleSecretGenerator.getClientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(appleRedirectUri)
                .scope("openid", "email", "name")
                .authorizationUri("https://appleid.apple.com/auth/authorize?response_mode=form_post")
                .tokenUri("https://appleid.apple.com/auth/token")
                .jwkSetUri("https://appleid.apple.com/auth/keys")
                .userNameAttributeName("sub")
                .clientName("Apple")
                .build();

        return new InMemoryClientRegistrationRepository(github, apple);
    }
}
```

> **참고**: `InMemoryClientRegistrationRepository`에 저장된 `ClientRegistration`의 `clientSecret`은 Bean 생성 시점의 값이 고정된다. 장기 운영 시 `AppleClientSecretGenerator`의 갱신 값이 반영되지 않을 수 있다. 이 경우 커스텀 `ClientRegistrationRepository`를 구현하여 매 요청마다 `appleSecretGenerator.getClientSecret()`을 호출하도록 개선해야 한다. 이는 구현 시 확인 후 결정한다.

**build.gradle 변경 불필요**: `nimbus-jose-jwt`는 `spring-boot-starter-oauth2-client`의 전이 의존성으로 이미 포함되어 있다. Spring Boot 3.4.5의 의존성 관리가 버전을 고정하므로 명시적 추가는 불필요하다.

### Step 10: WebSecurityConfig 수정

**수정 파일:** `config/WebSecurityConfig.java`

```java
// 변경: CustomOidcUserService 주입 추가
private final CustomOidcUserService customOidcUserService;

// 변경: oidcUserService 등록 추가
.userInfoEndpoint(userInfo -> userInfo
    .userService(customOAuth2UserService)          // GitHub (OAuth2)
    .oidcUserService(customOidcUserService)        // Apple (OIDC)
)
```

> **CSRF 관련 (리뷰 반영)**: 현재 프로젝트는 `csrf(AbstractHttpConfigurer::disable)`로 CSRF를 전역 비활성화했으므로, Apple의 `response_mode=form_post`(POST 콜백)와 충돌하지 않는다. 별도 처리 불필요.

> **id_token 검증 (리뷰 반영)**: Spring Security의 `OidcIdTokenValidator`가 기본적으로 `iss`(issuer), `aud`(audience), `exp`(expiration) 검증을 수행한다. Apple의 JWKS URI(`https://appleid.apple.com/auth/keys`)를 통해 서명도 자동 검증된다. `nonce` 검증은 Spring Security가 authorization request에 nonce를 포함하고 id_token에서 자동으로 검증하므로 별도 설정이 필요 없다.

### Step 11: application.yml 설정 추가

**수정 파일:** `application-develop.yml`, `application-prod.yml`

```yaml
# 기존 github 설정 유지

# Apple OAuth2 설정 추가 (spring.security 밖, 커스텀 프로퍼티)
apple:
  oauth2:
    team-id: ${APPLE_TEAM_ID}
    client-id: ${APPLE_CLIENT_ID}
    key-id: ${APPLE_KEY_ID}
    private-key: ${APPLE_PRIVATE_KEY}           # Base64 인코딩된 .p8 키 내용
    redirect-uri: ${APPLE_OAUTH_REDIRECT_URI}   # ex: {baseUrl}/api/login/oauth2/code/apple
```

> Apple의 `ClientRegistration`을 프로그래밍 방식으로 빌드하므로, `spring.security.oauth2.client.registration.apple` 대신 커스텀 프로퍼티(`apple.oauth2.*`)를 사용한다.

> **보안 참고 (리뷰 반영)**: `APPLE_PRIVATE_KEY` 환경변수는 `.p8` 프라이빗 키의 Base64 인코딩 값이다. 프로덕션에서는 환경변수 로깅에서 이 값이 노출되지 않도록 주의한다. 향후 AWS Secrets Manager, Vault 등 시크릿 관리 서비스로 전환을 고려한다.

### Step 12: ErrorCode 업데이트

**수정 파일:** `exception/ErrorCode.java`

```java
// 1XXX 인증 관련에 추가 (현재 마지막: 1005)
OAUTH_USER_ID_MISSING("1006", "OAuth 제공자에서 사용자 ID를 가져올 수 없습니다.", HttpStatus.BAD_GATEWAY),
UNSUPPORTED_OAUTH_PROVIDER("1007", "지원하지 않는 OAuth 제공자입니다.", HttpStatus.BAD_REQUEST),
```

> 기존 `GITHUB_USER_ID_MISSING`(1001)은 유지. 새 코드에서는 `OAUTH_USER_ID_MISSING` 사용. 향후 `GITHUB_USER_ID_MISSING`을 사용하는 코드를 점진적으로 `OAUTH_USER_ID_MISSING`으로 마이그레이션한다.

---

## findUserByOauthId() 호출처 변경 체크리스트

> **리뷰 반영**: 기존 `findUserByOauthId()` 메서드를 사용하는 모든 호출처를 빠짐없이 변경해야 한다. 누락 시 런타임 오류.

| 호출처 | 변경 내용 | 비고 |
|--------|----------|------|
| `UserService.findOrCreateTempUser()` | `findUserByOauthIdAndSocialType()` 사용 | OAuth2UserInfo에서 socialType 추출 |
| `AuthService.registerUser()` | `findUserByOauthIdAndSocialType()` 사용 | session에서 socialType 추출 |

기존 `findUserByOauthId()` 메서드는 모든 호출처 변경 후 삭제한다.

---

## GitHub/Apple 동일 이메일 계정 정책

> **리뷰 반영**: 같은 이메일로 GitHub과 Apple에서 각각 로그인한 경우의 정책을 명시한다.

**결정: 별도 계정으로 유지**
- `oauthId + socialType` 복합 키로 사용자를 식별하므로, GitHub과 Apple은 서로 다른 계정이다
- 동일 이메일이라도 각 provider의 `sub`/`id`가 다르므로 자동 통합하지 않는다
- 향후 "계정 연결" 기능이 필요하면 별도 기능으로 구현한다

---

## 기존 코드 재활용 목록

| 기존 컴포넌트 | 재활용 방식 |
|---------------|------------|
| `OAuth2SuccessHandler` | `SocialUserPrincipal` 캐스팅 변경 + `pending_social_type` session 저장 추가 |
| `OAuth2FailureHandler` | 변경 없이 그대로 사용 |
| `AuthController.signup()` | `pending_social_type` session에서 추출하여 `registerUser()`에 전달하도록 수정 |
| `AuthService.registerUser()` | `socialType` 파라미터 추가, `findUserByOauthIdAndSocialType()` 사용 |
| `AuthService.authenticate()` | 변경 없이 그대로 사용 |
| 세션 기반 인증 플로우 전체 | 변경 없이 그대로 사용 |

---

## Apple OAuth 로그인 전체 플로우 (구현 후)

```
[Frontend]                    [Backend]                         [Apple]
    │                             │                                │
    │  1. "Apple 로그인" 클릭      │                                │
    │──────────────────────────>│                                │
    │  GET /api/oauth2/          │                                │
    │  authorization/apple       │                                │
    │                             │  2. Apple 인가 페이지로 리다이렉트  │
    │                             │──────────────────────────────>│
    │                             │  ?response_mode=form_post      │
    │                             │  &scope=openid email name      │
    │                             │                                │
    │  3. Apple ID 로그인 & 동의                                     │
    │                             │                                │
    │                             │  4. POST 콜백 (form_post)       │
    │                             │<──────────────────────────────│
    │                             │  POST /api/login/oauth2/code/  │
    │                             │  apple (code + id_token + user)│
    │                             │                                │
    │                             │  5. Code → Token 교환           │
    │                             │──────────────────────────────>│
    │                             │  client_secret = 동적 JWT       │
    │                             │                                │
    │                             │  6. id_token 검증               │
    │                             │  (iss, aud, exp, nonce, JWKS)  │
    │                             │  7. CustomOidcUserService      │
    │                             │     → AppleOAuth2UserInfo      │
    │                             │     → findOrCreateTempUser()   │
    │                             │                                │
    │                             │  8. OAuth2SuccessHandler       │
    │                             │     (기존과 동일 분기)            │
    │                             │                                │
    │  [기존 회원] ← 리다이렉트 ──│  → ${frontendUrl}/              │
    │  [신규 회원] ← 리다이렉트 ──│  → ${frontendUrl}/signup        │
```

---

## 사전 준비 사항 (Apple Developer Console)

구현 전 Apple Developer Console에서 다음을 설정해야 함:

1. **App ID** 생성 → "Sign in with Apple" capability 활성화
2. **Service ID** 생성 → `client_id`로 사용 (ex: `com.dialog.webapp`)
   - Web Domain 등록 (프로토콜 제외, ex: `dialog.com`)
   - Return URL 등록 (ex: `https://api.dialog.com/api/login/oauth2/code/apple`)
3. **Key** 생성 → `.p8` 파일 다운로드 (1회만 가능), Key ID 기록
4. **Team ID** 확인 → Membership Details 페이지

환경변수로 설정할 값:
- `APPLE_TEAM_ID`: 10자리 Team ID
- `APPLE_CLIENT_ID`: Service ID (ex: `com.dialog.webapp`)
- `APPLE_KEY_ID`: 10자리 Key ID
- `APPLE_PRIVATE_KEY`: `.p8` 파일 내용을 Base64 인코딩한 값
- `APPLE_OAUTH_REDIRECT_URI`: `{baseUrl}/api/login/oauth2/code/apple`

---

## 검증 방법

### 1. 단위 테스트
- `AppleOAuth2UserInfo`: id_token claims에서 정보 추출 검증
  - `sub`에서 oauthId 추출
  - email에서 nickname 생성 (일반 이메일, private relay 이메일, null 이메일)
  - firstName/lastName이 있는 경우 우선 사용
- `AppleClientSecretGenerator`: JWT 생성 검증
  - 헤더 (kid, alg=ES256)
  - 페이로드 (iss=teamId, sub=clientId, aud=apple, exp)
  - 서명 알고리즘
  - **캐싱 동작**: 만료 30일 전 재생성 확인
- `UserService.findOrCreateTempUser()`: `OAuth2UserInfo` 타입별 유저 생성 검증
  - GitHub: githubId 설정됨, socialType=GITHUB
  - Apple: githubId null, socialType=APPLE
- `UserRepository.findUserByOauthIdAndSocialType()`: 복합 조건 조회 검증

### 2. 통합 테스트
- GitHub 기존 로그인 플로우가 정상 동작하는지 **회귀 테스트** (필수)
- Apple OIDC 플로우 모킹 테스트 (id_token 모킹)
- `AuthService.registerUser()`에 socialType 전달 검증
- `OAuth2SuccessHandler`에서 `SocialUserPrincipal` 캐스팅 동작 검증

### 3. 수동 테스트
- Apple Developer Console 설정 완료 후 실제 Apple 로그인 테스트
- 신규 회원: Apple 로그인 → `/signup` 리다이렉트 → 회원가입 완료
- 기존 회원: Apple 로그인 → `/` 리다이렉트 → 로그인 상태 확인
- GitHub 로그인: 기존과 동일하게 동작하는지 확인
- **동일 이메일 테스트**: GitHub과 Apple에서 같은 이메일로 각각 가입 → 별도 계정 생성 확인

### 4. 로컬 개발 시 주의
- Apple은 `localhost` 리다이렉트를 지원하지 않음
- ngrok 등 터널링 서비스 사용 필요

---

## 구현 시 확인해야 할 리스크 항목

| # | 리스크 | 심각도 | 확인 시점 |
|---|--------|-------|----------|
| 1 | `InMemoryClientRegistrationRepository`에 저장된 clientSecret이 갱신되는지 | HIGH | Step 9 구현 시 |
| 2 | Apple의 `user` 파라미터(firstName/lastName)가 Spring Security에서 접근 가능한지 | HIGH | Step 7 구현 시 |
| 3 | Spring Security OIDC가 `response_mode=form_post` POST 콜백을 정상 처리하는지 | MEDIUM | Step 10 통합 테스트 시 |
| 4 | `ddl-auto`로 `social_type` 컬럼 자동 추가 후 기존 데이터 NULL 처리 | MEDIUM | 프로덕션 배포 전 |
