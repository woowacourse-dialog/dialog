# Mobile App + Web OAuth 통합 구현 계획

**상태**: DRAFT
**작성일**: 2026-02-13
**대체**: `apple-oauth-implementation.md` (웹 전용 계획 → 웹+앱 통합 계획으로 대체)

---

## Context

현재 프로젝트는 **웹 브라우저 기반 GitHub OAuth2 로그인**(Spring Security OAuth2 Login, 세션 인증)만 지원한다.
모바일 앱(iOS + Android)으로 서비스를 확장하면서, Apple OAuth 로그인을 추가하고 모바일 앱에서도 OAuth 로그인을 지원해야 한다.

### 핵심 결정사항

| 항목 | 결정 |
|------|------|
| 인증 방식 | 기존 세션 방식 유지 (JSESSIONID 쿠키) |
| 웹 호환성 | 기존 웹 OAuth 플로우 유지 + 모바일 API 추가 |
| 모바일 플랫폼 | iOS + Android |
| OAuth 제공자 | GitHub + Apple |

### 왜 세션 방식을 모바일에서도 사용하는가?

- iOS `URLSession`/`Alamofire`, Android `OkHttp`/`Retrofit` 모두 쿠키 자동 관리를 지원
- 기존 웹 인프라(세션 기반)를 그대로 활용하여 서버 변경 범위 최소화
- 서버 측 세션 관리로 토큰 탈취 리스크 감소
- 추후 JWT 전환이 필요하면 모바일 API 응답만 변경하면 됨 (API 계약은 동일)

### 웹 vs 모바일 OAuth 플로우 차이

| | 웹 (기존 + 확장) | 모바일 (신규) |
|---|---|---|
| **GitHub** | Spring Security OAuth2 Login (redirect) | REST API (`POST /api/auth/mobile/github`) — 앱이 authorization code를 전달 |
| **Apple** | Spring Security OIDC Login (redirect) | REST API (`POST /api/auth/mobile/apple`) — 앱이 identityToken을 전달 |
| **인증 후** | 세션 쿠키 자동 설정 (브라우저) | 세션 쿠키 응답으로 전달 (앱이 쿠키 저장) |
| **신규 회원** | frontendUrl/signup 으로 리다이렉트 | 응답 JSON의 `isRegistered=false`로 판단 → 앱이 회원가입 화면 표시 |
| **기존 회원** | frontendUrl/ 으로 리다이렉트 | 응답 JSON의 `isRegistered=true` + 유저 정보 반환 |

### Apple OAuth 모바일 vs 웹 차이

| | iOS (모바일) | Android (모바일) | 웹 |
|---|---|---|---|
| **SDK** | ASAuthorizationAppleIDProvider (네이티브) | Sign in with Apple JS (WebView) | Spring Security OIDC Login |
| **앱이 받는 값** | identityToken (JWT) + authorizationCode + user | identityToken (JWT) + authorizationCode | authorization code (서버 콜백) |
| **백엔드 처리** | identityToken JWKS 검증 | identityToken JWKS 검증 | code → token 교환 → id_token 검증 |
| **client_secret 필요** | 불필요 | 불필요 | 필요 (ES256 JWT) |

> **핵심**: 모바일에서는 앱이 Apple/GitHub 인증 UI를 직접 처리하고, 서버는 결과 토큰/코드만 받아 검증한다. 웹에서는 기존처럼 Spring Security가 전체 redirect 플로우를 관리한다.

---

## 변경 범위 요약

### 새로 생성할 파일 (12개)

| # | 파일 | 설명 | 대상 |
|---|------|------|------|
| 1 | `domain/SocialType.java` | OAuth 제공자 Enum (GITHUB, APPLE) | 공통 |
| 2 | `dto/security/OAuth2UserInfo.java` | OAuth 유저 정보 추상 클래스 | 공통 |
| 3 | `dto/security/AppleOAuth2UserInfo.java` | Apple id_token claims 추출 | 공통 |
| 4 | `dto/security/SocialUserPrincipal.java` | GitHub/Apple Principal 공통 인터페이스 | 웹 |
| 5 | `dto/security/OidcUserPrincipal.java` | Apple OIDC Principal (DefaultOidcUser 상속) | 웹 |
| 6 | `dto/auth/request/AppleLoginRequest.java` | 모바일 Apple 로그인 요청 DTO | 모바일 |
| 7 | `dto/auth/request/GitHubLoginRequest.java` | 모바일 GitHub 로그인 요청 DTO | 모바일 |
| 8 | `dto/auth/response/OAuthLoginResponse.java` | 모바일 OAuth 로그인 응답 DTO | 모바일 |
| 9 | `service/CustomOidcUserService.java` | Apple OIDC 유저 서비스 | 웹 |
| 10 | `service/AppleClientSecretGenerator.java` | Apple client_secret JWT 생성 | 웹 |
| 11 | `service/AppleTokenVerifier.java` | Apple identityToken JWKS 검증 | 모바일 |
| 12 | `controller/MobileAuthController.java` | 모바일 OAuth REST API 엔드포인트 | 모바일 |

### 수정할 파일 (14개)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `domain/User.java` | `socialType` 필드 추가, Builder 수정 |
| 2 | `dto/security/GitHubOAuth2UserInfo.java` | `OAuth2UserInfo` 상속으로 변경 |
| 3 | `dto/security/OAuth2UserPrincipal.java` | `SocialUserPrincipal` 인터페이스 구현 추가 |
| 4 | `service/CustomOAuth2UserService.java` | `OAuth2UserInfo` 추상 타입 사용, registrationId 분기 |
| 5 | `service/UserService.java` | `findOrCreateTempUser()` 파라미터를 `OAuth2UserInfo`로 변경 |
| 6 | `service/AuthService.java` | `registerUser()`에 `SocialType` 파라미터 추가 |
| 7 | `repository/UserRepository.java` | `findUserByOauthIdAndSocialType()` 메서드 추가 |
| 8 | `config/OAuth2Config.java` | Apple `ClientRegistration` 등록 + `AppleClientSecretGenerator` 활용 |
| 9 | `config/WebSecurityConfig.java` | `oidcUserService` 등록 + 모바일 API 경로 허용 |
| 10 | `config/CorsConfig.java` | 모바일 앱 Origin 허용 추가 |
| 11 | `controller/handler/OAuth2SuccessHandler.java` | `SocialUserPrincipal` 캐스팅 + `pending_social_type` 세션 저장 |
| 12 | `controller/AuthController.java` | `signup()`에서 `pending_social_type` 세션 추출 |
| 13 | `exception/ErrorCode.java` | 새 에러 코드 추가 |
| 14 | `application-develop.yml` / `application-prod.yml` | Apple OAuth 설정 추가 |

---

## 단계별 구현 계획

### Part A: 공통 기반 (Steps 1~5)

> 웹/모바일 양쪽에서 공유하는 도메인, DTO, 서비스 계층 변경

#### Step 1: SocialType Enum 생성

**새 파일:** `domain/SocialType.java`

```java
public enum SocialType {
    GITHUB, APPLE
}
```

#### Step 2: User 엔티티에 socialType 추가

**수정 파일:** `domain/User.java`

```java
// 추가할 필드
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private SocialType socialType;
```

- Builder에 `socialType` 파라미터 추가

> **DB 마이그레이션**: 현재 develop은 `ddl-auto: create`, prod는 `ddl-auto: update`를 사용한다.
> - develop: 자동 재생성되므로 문제 없음
> - prod: JPA가 `social_type` 컬럼을 자동 추가하지만, 기존 데이터의 NULL 처리 필요:
> ```sql
> -- 1. 기존 GitHub 유저에 socialType 설정
> UPDATE users SET social_type = 'GITHUB' WHERE social_type IS NULL;
> -- 2. oauthId + socialType 복합 UNIQUE 인덱스 추가
> ALTER TABLE users ADD UNIQUE INDEX uk_oauth_id_social_type (oauth_id, social_type);
> ```

#### Step 3: OAuth2UserInfo 추상 클래스 + 하위 구현체

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
- `getUserId()` → `getProviderUsername()` + `getNickname()`으로 분리
  - `getNickname()`: `attributes.get("login")` 반환
  - `getProviderUsername()`: `attributes.get("login")` 반환
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

> Apple Private Relay 이메일(`xxx@privaterelay.appleid.com`)에서 의미 없는 해시를 nickname으로 사용하는 문제를 방지한다.

#### Step 4: UserRepository + UserService 변경

**수정 파일:** `repository/UserRepository.java`

```java
// 추가
Optional<User> findUserByOauthIdAndSocialType(String oauthId, SocialType socialType);
```

> `oauthId + socialType` 복합 UNIQUE 인덱스가 DB에 추가되므로 인덱스를 활용한 빠른 조회가 가능하다.

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

#### Step 5: AuthService + AuthController 변경

**수정 파일:** `service/AuthService.java`

```java
// 변경 전:
public Long registerUser(SignupRequest signupRequest, String oauthId) {
    User user = userRepository.findUserByOauthId(oauthId)
            .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    ...
}

// 변경 후:
public Long registerUser(SignupRequest signupRequest, String oauthId, SocialType socialType) {
    User user = userRepository.findUserByOauthIdAndSocialType(oauthId, socialType)
            .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    ...
}
```

**수정 파일:** `controller/AuthController.java`

```java
@PostMapping("/signup")
public ResponseEntity<ApiSuccessResponse<SignupResponse>> signup(
        @RequestBody SignupRequest signupRequest, HttpServletRequest request) {
    final String oauthId = extractOAuthIdFromSession(request);
    final SocialType socialType = extractSocialTypeFromSession(request);

    Long userId = authService.registerUser(signupRequest, oauthId, socialType);
    // ... 기존 로직 동일 (authenticate, session 저장, pending 제거)

    // pending_social_type도 함께 제거
    session.removeAttribute("pending_social_type");
}

private SocialType extractSocialTypeFromSession(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session == null) {
        throw new DialogException(ErrorCode.INVALID_SIGNUP);
    }
    SocialType socialType = (SocialType) session.getAttribute("pending_social_type");
    // 마이그레이션 기간 동안 null이면 GITHUB으로 기본 처리
    return socialType != null ? socialType : SocialType.GITHUB;
}
```

#### Step 5-1: ErrorCode 업데이트

**수정 파일:** `exception/ErrorCode.java`

```java
// 1XXX 인증 관련에 추가
OAUTH_USER_ID_MISSING("1006", "OAuth 제공자에서 사용자 ID를 가져올 수 없습니다.", HttpStatus.BAD_GATEWAY),
UNSUPPORTED_OAUTH_PROVIDER("1007", "지원하지 않는 OAuth 제공자입니다.", HttpStatus.BAD_REQUEST),
INVALID_IDENTITY_TOKEN("1008", "유효하지 않은 인증 토큰입니다.", HttpStatus.UNAUTHORIZED),
GITHUB_CODE_EXCHANGE_FAILED("1009", "GitHub 인증 코드 교환에 실패했습니다.", HttpStatus.BAD_GATEWAY),
```

---

### Part B: 웹 OAuth 확장 — Apple (Steps 6~10)

> 기존 웹 브라우저 OAuth 플로우에 Apple OIDC 로그인을 추가

#### Step 6: SocialUserPrincipal 인터페이스 생성

**새 파일:** `dto/security/SocialUserPrincipal.java`

```java
/**
 * GitHub(OAuth2UserPrincipal)과 Apple(OidcUserPrincipal)의 공통 인터페이스.
 * OAuth2SuccessHandler에서 provider에 무관하게 User를 추출할 때 사용.
 */
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

#### Step 7: CustomOAuth2UserService 수정 (웹 GitHub)

**수정 파일:** `service/CustomOAuth2UserService.java`

```java
@Override
public OAuth2User loadUser(OAuth2UserRequest userRequest) {
    OAuth2User oAuth2User = defaultOAuth2UserService.loadUser(userRequest);

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

#### Step 8: CustomOidcUserService 생성 (웹 Apple)

**새 파일:** `service/CustomOidcUserService.java`

```java
@Service
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final UserService userService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {
        OidcIdToken idToken = userRequest.getIdToken();
        Map<String, Object> claims = new HashMap<>(idToken.getClaims());

        // Apple 최초 인증 시 전달되는 user 정보(firstName, lastName)는
        // authorization response의 "user" 파라미터로 전달됨.
        // Spring Security가 이를 additionalParameters로 전달하는지 구현 시 확인 필요.
        // → 전달되지 않으면 AuthorizationCodeTokenResponseClient 커스텀 필요.

        AppleOAuth2UserInfo userInfo = new AppleOAuth2UserInfo(claims);
        User user = userService.findOrCreateTempUser(userInfo);
        return new OidcUserPrincipal(user, idToken);
    }
}
```

> Apple은 UserInfo endpoint가 없으므로 `DefaultOidcUserService`를 호출하지 않고, id_token claims만 사용한다.

#### Step 9: AppleClientSecretGenerator + OAuth2Config

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
        // nimbus-jose-jwt로 ES256 서명 JWT 생성
        // header: kid=keyId, alg=ES256
        // payload: iss=teamId, sub=clientId, aud=https://appleid.apple.com
        // exp: 현재시간 + 6개월 (180일)
    }

    private ECPrivateKey loadPrivateKey(String base64Content) {
        // Base64 디코딩 → PKCS8EncodedKeySpec → ECPrivateKey 변환
    }
}
```

> `nimbus-jose-jwt`는 `spring-boot-starter-oauth2-client`의 전이 의존성으로 이미 포함. `build.gradle` 변경 불필요.

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

> **주의**: `InMemoryClientRegistrationRepository`에 저장된 `clientSecret`은 Bean 생성 시점에 고정됨. 6개월 이상 무중단 운영 시 커스텀 `ClientRegistrationRepository`로 교체 필요. 구현 시 확인 후 결정.

#### Step 10: WebSecurityConfig + OAuth2SuccessHandler 수정

**수정 파일:** `config/WebSecurityConfig.java`

```java
@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOidcUserService customOidcUserService;  // 추가
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(corsConfigurer -> corsConfigurer.configurationSource(corsConfigurationSource))
                .authorizeHttpRequests(auth -> auth
                        // 모바일 OAuth 엔드포인트 허용
                        .requestMatchers("/api/auth/mobile/**").permitAll()
                        // TODO: 개발 완료 시 아래 행 삭제
                        .anyRequest().permitAll()
                )
                .oauth2Login(oAuth2LoginConfigurer -> oAuth2LoginConfigurer
                        .authorizationEndpoint(authorization -> authorization.baseUri("/api/oauth2/authorization"))
                        .redirectionEndpoint(redirection -> redirection.baseUri("/api/login/oauth2/code/*"))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)      // GitHub (OAuth2)
                                .oidcUserService(customOidcUserService)    // Apple (OIDC)
                        )
                );
        return http.build();
    }
}
```

> **CSRF**: 현재 `csrf(AbstractHttpConfigurer::disable)`로 전역 비활성화. Apple의 `response_mode=form_post`(POST 콜백)와 충돌 없음.
>
> **id_token 검증**: Spring Security의 `OidcIdTokenValidator`가 `iss`, `aud`, `exp` 자동 검증. Apple JWKS URI 통해 서명도 자동 검증. `nonce`도 자동 처리.

**수정 파일:** `controller/handler/OAuth2SuccessHandler.java`

```java
// 변경 전:
OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();

// 변경 후:
SocialUserPrincipal principal = (SocialUserPrincipal) authentication.getPrincipal();
```

`handleUnregisteredUser`에 `pending_social_type` 세션 저장 추가:

```java
private void handleUnregisteredUser(HttpServletRequest request, HttpServletResponse response,
                                    SocialUserPrincipal principal) throws IOException {
    HttpSession session = request.getSession(true);
    session.setAttribute(PENDING_OAUTH_ID, principal.user().getOauthId());
    session.setAttribute("pending_social_type", principal.user().getSocialType());

    String redirectUrl = frontendUrl + SIGNUP_PATH;
    getRedirectStrategy().sendRedirect(request, response, redirectUrl);
}
```

`SocialUserPrincipal.user()` 메서드를 사용하므로 `handleRegisteredUser` 로직은 `principal.user().getId()` 접근으로 변경.

---

### Part C: 모바일 OAuth API (Steps 11~14)

> 모바일 앱 전용 REST API 엔드포인트. 앱이 OAuth 인증 결과(토큰/코드)를 서버에 전달하면 검증 후 세션 생성.

#### Step 11: AppleTokenVerifier (모바일 Apple 검증)

**새 파일:** `service/AppleTokenVerifier.java`

```java
@Component
public class AppleTokenVerifier {

    private final NimbusJwtDecoder jwtDecoder;

    public AppleTokenVerifier(@Value("${apple.oauth2.client-id}") String clientId) {
        this.jwtDecoder = NimbusJwtDecoder
                .withJwkSetUri("https://appleid.apple.com/auth/keys")
                .build();

        this.jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtIssuerValidator("https://appleid.apple.com"),
                new JwtClaimValidator<>("aud", clientId::equals)
        ));
    }

    /**
     * Apple identityToken(JWT)을 검증하고 claims를 반환한다.
     *
     * 검증 항목:
     * - 서명: Apple JWKS(RS256) 자동 검증
     * - iss: "https://appleid.apple.com"
     * - aud: 우리 client_id
     * - exp: 만료 여부
     *
     * @param identityToken iOS/Android 앱에서 받은 Apple identityToken (JWT 문자열)
     * @return id_token claims (sub, email, email_verified 등)
     * @throws DialogException INVALID_IDENTITY_TOKEN
     */
    public Map<String, Object> verify(String identityToken) {
        try {
            Jwt jwt = jwtDecoder.decode(identityToken);
            return jwt.getClaims();
        } catch (JwtException e) {
            throw new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN);
        }
    }
}
```

> `NimbusJwtDecoder`는 Spring Security OAuth2 Resource Server의 클래스. `spring-boot-starter-oauth2-client`에는 포함되지 않을 수 있으므로, `spring-boot-starter-oauth2-resource-server` 의존성 추가가 필요한지 구현 시 확인.
>
> 대안: `nimbus-jose-jwt` 라이브러리를 직접 사용하여 JWKS 검증을 수동 구현할 수도 있다. `spring-boot-starter-oauth2-client`의 전이 의존성으로 이미 포함되어 있음.

#### Step 12: GitHubOAuthClient (모바일 GitHub 검증)

모바일 앱에서 GitHub authorization code를 받아 서버에서 access token 교환 + 유저 정보 조회를 수행하는 클라이언트. 기존 웹 플로우에서는 Spring Security가 자동으로 처리하지만, 모바일 API에서는 수동으로 처리해야 한다.

> **별도 서비스 클래스 대신 `MobileAuthController` 내에서 `RestClient`로 직접 처리하는 방안도 검토.** GitHub API 호출이 2개(token exchange + user info)뿐이므로, 별도 클래스 없이 컨트롤러/서비스에서 직접 처리해도 복잡도가 낮다. 구현 시 결정.

**처리 플로우:**

```
1. POST https://github.com/login/oauth/access_token
   - client_id, client_secret, code
   - → access_token 반환

2. GET https://api.github.com/user
   - Authorization: Bearer {access_token}
   - → GitHub 유저 정보 (id, login, avatar_url 등) 반환
```

**주요 고려사항:**
- `client_id`, `client_secret`은 기존 application.yml의 GitHub OAuth 설정 재사용
- 모바일 앱의 GitHub OAuth redirect URI가 기존 웹과 다를 수 있음 (custom URL scheme: `dialog://oauth/github`)
  - GitHub OAuth App 설정에서 모바일 redirect URI도 등록 필요
- 에러 처리: GitHub API 호출 실패 시 `GITHUB_CODE_EXCHANGE_FAILED` 에러 반환

#### Step 13: 모바일 OAuth DTO

**새 파일:** `dto/auth/request/AppleLoginRequest.java`

```java
public record AppleLoginRequest(
    @NotBlank String identityToken,   // Apple identityToken (JWT)
    String firstName,                  // 최초 인증 시에만 제공 (nullable)
    String lastName                    // 최초 인증 시에만 제공 (nullable)
) {}
```

**새 파일:** `dto/auth/request/GitHubLoginRequest.java`

```java
public record GitHubLoginRequest(
    @NotBlank String code              // GitHub authorization code
) {}
```

**새 파일:** `dto/auth/response/OAuthLoginResponse.java`

```java
public record OAuthLoginResponse(
    boolean isRegistered,              // true: 기존 회원, false: 신규 (회원가입 필요)
    Long userId,                       // registered일 때만 유의미
    String nickname                    // registered일 때만 유의미
) {
    public static OAuthLoginResponse registered(User user) {
        return new OAuthLoginResponse(true, user.getId(), user.getNickname());
    }

    public static OAuthLoginResponse needsSignup() {
        return new OAuthLoginResponse(false, null, null);
    }
}
```

#### Step 14: MobileAuthController

**새 파일:** `controller/MobileAuthController.java`

```java
@RestController
@RequestMapping("/api/auth/mobile")
@RequiredArgsConstructor
public class MobileAuthController {

    private final AppleTokenVerifier appleTokenVerifier;
    private final UserService userService;
    private final AuthService authService;

    // GitHub API 호출을 위한 설정값
    @Value("${spring.security.oauth2.client.registration.github.client-id}")
    private String githubClientId;
    @Value("${spring.security.oauth2.client.registration.github.client-secret}")
    private String githubClientSecret;

    /**
     * 모바일 Apple 로그인
     *
     * iOS: ASAuthorizationAppleIDProvider에서 받은 identityToken 전달
     * Android: Sign in with Apple JS(WebView)에서 받은 identityToken 전달
     */
    @PostMapping("/apple")
    public ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> appleLogin(
            @RequestBody @Valid AppleLoginRequest request,
            HttpServletRequest httpRequest) {

        // 1. Apple identityToken 검증 (JWKS)
        Map<String, Object> claims = appleTokenVerifier.verify(request.identityToken());

        // 2. 최초 인증 시 전달된 이름 정보를 claims에 추가
        if (request.firstName() != null) {
            claims.put("firstName", request.firstName());
            claims.put("lastName", request.lastName());
        }

        // 3. AppleOAuth2UserInfo 생성 → findOrCreateTempUser
        AppleOAuth2UserInfo userInfo = new AppleOAuth2UserInfo(claims);
        User user = userService.findOrCreateTempUser(userInfo);

        // 4. 세션 처리 (OAuth2SuccessHandler와 동일한 로직)
        return handleOAuthResult(user, httpRequest);
    }

    /**
     * 모바일 GitHub 로그인
     *
     * 모바일 앱이 ASWebAuthenticationSession(iOS) 또는
     * Custom Chrome Tab(Android)에서 받은 authorization code 전달
     */
    @PostMapping("/github")
    public ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> githubLogin(
            @RequestBody @Valid GitHubLoginRequest request,
            HttpServletRequest httpRequest) {

        // 1. GitHub authorization code → access token 교환
        // 2. access token으로 GitHub 유저 정보 조회
        Map<String, Object> attributes = exchangeGitHubCodeForUserInfo(request.code());

        // 3. GitHubOAuth2UserInfo 생성 → findOrCreateTempUser
        GitHubOAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(attributes);
        User user = userService.findOrCreateTempUser(userInfo);

        // 4. 세션 처리
        return handleOAuthResult(user, httpRequest);
    }

    /**
     * OAuth 결과 처리 (공통)
     * - 기존 회원: authenticate → 세션 생성 → isRegistered=true
     * - 신규 회원: pending_oauth_id 세션 저장 → isRegistered=false
     */
    private ResponseEntity<ApiSuccessResponse<OAuthLoginResponse>> handleOAuthResult(
            User user, HttpServletRequest httpRequest) {

        if (user.isRegistered()) {
            // 기존 회원: 즉시 인증
            Authentication authentication = authService.authenticate(user.getId());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());

            return ResponseEntity.ok(
                    new ApiSuccessResponse<>(OAuthLoginResponse.registered(user)));
        } else {
            // 신규 회원: 회원가입 대기 (웹과 동일하게 pending 정보를 세션에 저장)
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(PENDING_OAUTH_ID, user.getOauthId());
            session.setAttribute("pending_social_type", user.getSocialType());

            return ResponseEntity.ok(
                    new ApiSuccessResponse<>(OAuthLoginResponse.needsSignup()));
        }
    }

    private Map<String, Object> exchangeGitHubCodeForUserInfo(String code) {
        // RestClient를 사용한 GitHub API 호출
        // 1. POST https://github.com/login/oauth/access_token
        //    - client_id, client_secret, code
        //    - Accept: application/json
        //    - → { "access_token": "...", "token_type": "bearer", "scope": "..." }
        //
        // 2. GET https://api.github.com/user
        //    - Authorization: Bearer {access_token}
        //    - → { "id": 12345, "login": "user", "avatar_url": "..." }
        //
        // 에러 시 GITHUB_CODE_EXCHANGE_FAILED 예외 발생
    }
}
```

> **핵심 설계**: `handleOAuthResult()`는 `OAuth2SuccessHandler`의 로직을 REST API 버전으로 재현한 것. 웹 플로우의 "리다이렉트"를 모바일 플로우의 "JSON 응답"으로 대체.
>
> **세션 처리**: 모바일 앱이 `POST /api/auth/mobile/apple` 호출 시, 응답의 `Set-Cookie: JSESSIONID=xxx` 헤더를 저장하고 이후 요청에 포함해야 함. 이는 모바일 HTTP 클라이언트의 쿠키 관리 설정으로 처리.

---

### Part D: 설정 및 CORS (Steps 15~16)

#### Step 15: application.yml 설정 추가

**수정 파일:** `application-develop.yml`, `application-prod.yml`

```yaml
# 기존 spring.security.oauth2.client.registration.github 유지

# Apple OAuth2 설정 추가 (커스텀 프로퍼티)
apple:
  oauth2:
    team-id: ${APPLE_TEAM_ID}
    client-id: ${APPLE_CLIENT_ID}
    key-id: ${APPLE_KEY_ID}
    private-key: ${APPLE_PRIVATE_KEY}           # Base64 인코딩된 .p8 키 내용
    redirect-uri: ${APPLE_OAUTH_REDIRECT_URI}   # 웹용: {baseUrl}/api/login/oauth2/code/apple
```

> Apple `ClientRegistration`을 프로그래밍 방식으로 빌드하므로, `spring.security.oauth2.client.registration.apple` 대신 커스텀 프로퍼티(`apple.oauth2.*`)를 사용한다.
>
> **보안**: `APPLE_PRIVATE_KEY`는 `.p8` 프라이빗 키의 Base64 인코딩 값. 프로덕션에서는 환경변수 로깅에서 노출되지 않도록 주의. 향후 AWS Secrets Manager 전환 고려.

#### Step 16: CorsConfig 수정

**수정 파일:** `config/CorsConfig.java`

모바일 앱은 웹 브라우저가 아니므로 CORS 제약이 적용되지 않는다. 하지만 개발 중 시뮬레이터/에뮬레이터에서 테스트하거나, 웹뷰 기반 접근이 있을 수 있으므로:

```java
// 필요시 모바일 앱의 Origin 추가
// 네이티브 앱은 CORS 헤더가 불필요하지만,
// Android WebView는 Origin 헤더를 보낼 수 있음
configuration.setAllowedOrigins(List.of(frontendUrl));
// → 모바일에서 이슈 발생 시 추가 Origin 또는 allowedOriginPatterns 설정
```

> **참고**: 네이티브 모바일 앱(URLSession, OkHttp)은 CORS를 적용하지 않으므로 별도 설정이 불필요한 경우가 대부분. Android WebView에서 이슈가 발생하면 그때 조정.

---

## 전체 플로우 다이어그램

### 웹 플로우 (기존 GitHub + 신규 Apple)

```
[Browser]                       [Backend]                         [GitHub/Apple]
    │                               │                                │
    │  1. "로그인" 클릭              │                                │
    │  GET /api/oauth2/             │                                │
    │  authorization/{provider}     │                                │
    │──────────────────────────>│                                │
    │                               │  2. 인가 페이지로 리다이렉트     │
    │                               │──────────────────────────────>│
    │                               │                                │
    │  3. 사용자 로그인 & 동의                                        │
    │                               │                                │
    │                               │  4. 콜백                       │
    │                               │<──────────────────────────────│
    │                               │  GET/POST /api/login/oauth2/  │
    │                               │  code/{provider}               │
    │                               │                                │
    │                               │  5. GitHub: UserInfo API 호출  │
    │                               │     Apple: id_token 검증       │
    │                               │                                │
    │                               │  6. CustomOAuth2/OidcUserService│
    │                               │     → findOrCreateTempUser()   │
    │                               │                                │
    │                               │  7. OAuth2SuccessHandler       │
    │                               │                                │
    │  [기존 회원] ← 리다이렉트 ──│  → frontendUrl/                │
    │  [신규 회원] ← 리다이렉트 ──│  → frontendUrl/signup          │
```

### 모바일 플로우 (GitHub + Apple)

```
[Mobile App]                    [Backend]                         [GitHub/Apple]
    │                               │                                │
    │  1. 네이티브 OAuth UI          │                                │
    │     iOS Apple: ASAuthorization│                                │
    │     Android Apple: WebView    │                                │
    │     GitHub: WebAuth/CustomTab │                                │
    │──────────────────────────────────────────────────────────────>│
    │                               │                                │
    │  2. OAuth 결과 수신            │                                │
    │     Apple: identityToken      │                                │
    │     GitHub: authorization code│                                │
    │<──────────────────────────────────────────────────────────────│
    │                               │                                │
    │  3. 백엔드 API 호출           │                                │
    │  POST /api/auth/mobile/apple  │                                │
    │  또는 /api/auth/mobile/github │                                │
    │──────────────────────────>│                                │
    │                               │  4. 검증                       │
    │                               │     Apple: JWKS 서명 검증      │
    │                               │     GitHub: code→token 교환    │
    │                               │             → UserInfo 조회    │
    │                               │──────────────────────────────>│
    │                               │                                │
    │                               │  5. findOrCreateTempUser()     │
    │                               │  6. 세션 생성 (JSESSIONID)     │
    │                               │                                │
    │  7. JSON 응답 수신            │                                │
    │     + Set-Cookie: JSESSIONID  │                                │
    │<──────────────────────────│                                │
    │                               │                                │
    │  [isRegistered=true]          │                                │
    │  → 홈 화면으로 이동           │                                │
    │                               │                                │
    │  [isRegistered=false]         │                                │
    │  → 회원가입 화면 표시         │                                │
    │  POST /api/signup             │                                │
    │  (with JSESSIONID cookie)     │                                │
    │──────────────────────────>│                                │
    │                               │  8. registerUser()             │
    │                               │  9. authenticate()             │
    │                               │  10. 세션 갱신                  │
    │  ← 200 OK                     │                                │
    │<──────────────────────────│                                │
```

---

## GitHub/Apple 동일 이메일 계정 정책

**결정: 별도 계정으로 유지**
- `oauthId + socialType` 복합 키로 사용자를 식별하므로, GitHub과 Apple은 서로 다른 계정
- 동일 이메일이라도 각 provider의 `sub`/`id`가 다르므로 자동 통합하지 않음
- 향후 "계정 연결" 기능이 필요하면 별도 기능으로 구현

---

## findUserByOauthId() 호출처 변경 체크리스트

기존 `findUserByOauthId()` 메서드를 사용하는 모든 호출처를 `findUserByOauthIdAndSocialType()`으로 변경해야 한다.

| 호출처 | 변경 내용 | 비고 |
|--------|----------|------|
| `UserService.findOrCreateTempUser()` | `findUserByOauthIdAndSocialType()` 사용 | OAuth2UserInfo에서 socialType 추출 |
| `AuthService.registerUser()` | `findUserByOauthIdAndSocialType()` 사용 | session에서 socialType 추출 |

기존 `findUserByOauthId()` 메서드는 모든 호출처 변경 후 삭제한다.

---

## 기존 코드 재활용 목록

| 기존 컴포넌트 | 재활용 방식 |
|---------------|------------|
| `OAuth2SuccessHandler` | `SocialUserPrincipal` 캐스팅 변경 + `pending_social_type` 저장 추가 |
| `OAuth2FailureHandler` | 변경 없이 그대로 사용 |
| `AuthController.signup()` | `pending_social_type` 세션에서 추출하여 `registerUser()`에 전달 |
| `AuthService.authenticate()` | 변경 없이 그대로 사용 |
| `AuthenticatedUserIdArgumentResolver` | 변경 없이 그대로 사용 |
| 세션 기반 인증 플로우 전체 | 웹/모바일 양쪽에서 동일하게 사용 |
| `LoginCheckResponse`, `SignupRequest/Response` | 변경 없이 그대로 사용 |

---

## 사전 준비 사항

### Apple Developer Console 설정

1. **App ID** 생성 → "Sign in with Apple" capability 활성화
2. **Service ID** 생성 → `client_id`로 사용 (ex: `com.dialog.webapp`)
   - Web Domain 등록 (프로토콜 제외, ex: `dialog.com`)
   - Return URL 등록 (웹용: `https://api.dialog.com/api/login/oauth2/code/apple`)
3. **Key** 생성 → `.p8` 파일 다운로드 (1회만 가능), Key ID 기록
4. **Team ID** 확인 → Membership Details 페이지

### GitHub OAuth App 설정

- 기존 GitHub OAuth App에 모바일용 callback URL 추가 등록
  - iOS: custom URL scheme (ex: `dialog://oauth/github`) 또는 Universal Link
  - Android: Custom Chrome Tab redirect URI

### 환경변수

```
# Apple (신규)
APPLE_TEAM_ID=          # 10자리 Team ID
APPLE_CLIENT_ID=        # Service ID (ex: com.dialog.webapp)
APPLE_KEY_ID=           # 10자리 Key ID
APPLE_PRIVATE_KEY=      # .p8 파일 내용을 Base64 인코딩한 값
APPLE_OAUTH_REDIRECT_URI=  # 웹용: {baseUrl}/api/login/oauth2/code/apple

# GitHub (기존 유지)
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
OAUTH_REDIRECT_URI=     # 웹용 기존 redirect URI 유지
```

---

## 검증 방법

### 1. 단위 테스트
- `AppleOAuth2UserInfo`: id_token claims에서 정보 추출 검증
  - `sub`에서 oauthId 추출
  - email에서 nickname 생성 (일반 이메일, private relay 이메일, null 이메일)
  - firstName/lastName이 있는 경우 우선 사용
- `AppleClientSecretGenerator`: JWT 생성 검증 (헤더, 페이로드, 서명, 캐싱 동작)
- `AppleTokenVerifier`: identityToken 검증 (유효한 토큰, 만료 토큰, 잘못된 서명)
- `GitHubOAuth2UserInfo`: OAuth2UserInfo 상속 후 기존 동작 유지 검증
- `UserService.findOrCreateTempUser()`: OAuth2UserInfo 타입별 유저 생성 검증
  - GitHub: githubId 설정됨, socialType=GITHUB
  - Apple: githubId null, socialType=APPLE
- `UserRepository.findUserByOauthIdAndSocialType()`: 복합 조건 조회 검증

### 2. 통합 테스트
- GitHub 기존 웹 로그인 플로우 **회귀 테스트** (필수 - 기존 기능 깨지지 않는지)
- Apple 웹 OIDC 플로우 모킹 테스트
- `MobileAuthController` Apple 엔드포인트 테스트 (identityToken 모킹)
- `MobileAuthController` GitHub 엔드포인트 테스트 (code exchange 모킹)
- `AuthController.signup()` socialType 전달 검증
- `OAuth2SuccessHandler` `SocialUserPrincipal` 캐스팅 동작 검증

### 3. 수동 테스트 (모바일)
- iOS 시뮬레이터: Apple Sign In → 백엔드 API → 세션 쿠키 → 후속 API 호출
- Android 에뮬레이터: WebView Apple Sign In → 백엔드 API → 세션 쿠키
- 모바일 GitHub OAuth: 웹뷰 → 코드 → 백엔드 API → 세션 쿠키
- 신규 회원: OAuth → isRegistered=false → /api/signup → 회원가입 완료
- 기존 회원: OAuth → isRegistered=true → 바로 사용
- **동일 이메일 테스트**: GitHub과 Apple에서 같은 이메일로 각각 가입 → 별도 계정 생성 확인

### 4. 수동 테스트 (웹)
- 기존 GitHub 로그인 플로우 정상 동작 확인
- Apple 웹 로그인 플로우 정상 동작 확인

### 5. 로컬 개발 시 주의
- Apple은 `localhost` 리다이렉트를 지원하지 않음 → ngrok 등 터널링 서비스 사용 필요
- 모바일 앱 테스트 시 백엔드 서버가 모바일 기기에서 접근 가능해야 함

---

## 구현 시 확인해야 할 리스크 항목

| # | 리스크 | 심각도 | 확인 시점 |
|---|--------|--------|----------|
| 1 | `InMemoryClientRegistrationRepository`에 저장된 Apple clientSecret이 6개월 후에도 갱신되는지 | HIGH | Step 9 구현 시 |
| 2 | Apple 최초 인증 시 `user` 파라미터(firstName/lastName)가 Spring Security OIDC에서 접근 가능한지 | HIGH | Step 8 구현 시 |
| 3 | `NimbusJwtDecoder` 사용 시 `spring-boot-starter-oauth2-resource-server` 의존성 필요 여부 | MEDIUM | Step 11 구현 시 |
| 4 | Spring Security OIDC가 Apple의 `response_mode=form_post` POST 콜백을 정상 처리하는지 | MEDIUM | Step 10 통합 테스트 시 |
| 5 | 모바일 앱에서 JSESSIONID 쿠키 관리가 정상 동작하는지 (iOS URLSession, Android OkHttp) | MEDIUM | Step 14 모바일 테스트 시 |
| 6 | `ddl-auto: update`로 `social_type` 컬럼 자동 추가 후 기존 데이터 NULL 처리 | MEDIUM | 프로덕션 배포 전 |
| 7 | GitHub OAuth App에 모바일 redirect URI 추가 등록이 필요한지 | LOW | Step 12 구현 전 |

---

## 구현 순서 권장

1. **Part A (공통 기반)** → 먼저 완료. 웹/모바일 양쪽의 기초.
2. **Part C (모바일 API)** → 앱 개발 우선이라면 Part B보다 먼저 진행 가능.
3. **Part B (웹 Apple)** → 웹에서 Apple 로그인이 급하지 않으면 나중에.
4. **Part D (설정)** → Part B/C와 병행.

> Part A → Part C 순서로 진행하면 웹 Apple OAuth 없이도 모바일 Apple + GitHub 로그인이 먼저 동작한다. 웹 Apple은 이후 추가하면 된다.
