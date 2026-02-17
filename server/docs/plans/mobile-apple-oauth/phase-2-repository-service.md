# Phase 2: Repository & Service 계층

**상태**: DRAFT
**작성일**: 2026-02-13
**선행 조건**: Phase 1 완료 (SocialType, OAuth2UserInfo 인터페이스, User.socialType 필드)
**예상 산출물**: UserRepository 변경, UserService 변경, AuthService 변경, Cleanup

---

## 목표

- `UserRepository`에 `findByOauthIdAndSocialType()` 추가
- `UserService.findOrCreateTempUser()`를 `OAuth2UserInfo` 인터페이스 기반으로 변경
- `AuthService.registerUser()`에 `SocialType` 파라미터 추가
- `CustomOAuth2UserService`의 타입 일관성 확보
- 기존 `findUserByOauthId()` 삭제 (Cleanup)

---

## Step 5: UserRepository 변경

### 수정 파일: `src/main/java/com/dialog/server/repository/UserRepository.java`

#### 현재 코드

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findById(@Param("id") Long id);

    @Query("SELECT u FROM User u WHERE u.oauthId = :oauthId AND u.deletedAt IS NULL")
    Optional<User> findUserByOauthId(@Param("oauthId") String oauthId);

    @Query("SELECT u FROM User u WHERE u.webPushNotification = :webPushNotification AND u.id != :id AND u.deletedAt IS NULL")
    List<User> findByWebPushNotificationAndIdNot(@Param("webPushNotification") boolean webPushNotification, @Param("id") Long id);
}
```

#### 변경 후

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findById(@Param("id") Long id);

    @Query("SELECT u FROM User u WHERE u.oauthId = :oauthId AND u.socialType = :socialType AND u.deletedAt IS NULL")
    Optional<User> findByOauthIdAndSocialType(@Param("oauthId") String oauthId, @Param("socialType") SocialType socialType);

    @Deprecated  // Step 8(Cleanup)에서 삭제
    @Query("SELECT u FROM User u WHERE u.oauthId = :oauthId AND u.deletedAt IS NULL")
    Optional<User> findUserByOauthId(@Param("oauthId") String oauthId);

    @Query("SELECT u FROM User u WHERE u.webPushNotification = :webPushNotification AND u.id != :id AND u.deletedAt IS NULL")
    List<User> findByWebPushNotificationAndIdNot(@Param("webPushNotification") boolean webPushNotification, @Param("id") Long id);
}
```

**변경 포인트**:
- `findByOauthIdAndSocialType()` 추가 — `@Query`에 `u.socialType = :socialType` 조건 추가
- `findUserByOauthId()` `@Deprecated` 표시 (v3 리뷰 H5: 즉시 삭제 시 구현 순서 오류 방지)
- import 추가: `import com.dialog.server.domain.SocialType;`

**주의**: `deletedAt IS NULL` 조건 유지 (소프트 딜리트 패턴 준수).

---

## Step 6: UserService 변경

### 수정 파일: `src/main/java/com/dialog/server/service/UserService.java`

#### 6-1. `findOrCreateTempUser()` 파라미터 변경

**현재 코드** (`UserService.java:42-44`):
```java
@Transactional
public User findOrCreateTempUser(GitHubOAuth2UserInfo userInfo) {
    return userRepository.findUserByOauthId(userInfo.getOAuthUserId())
            .orElseGet(() -> saveTempUser(userInfo));
}
```

**변경 후**:
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
```

**변경 포인트**:
- 파라미터: `GitHubOAuth2UserInfo` → `OAuth2UserInfo` (인터페이스)
- `findUserByOauthId()` → `findByOauthIdAndSocialType()`
- Race Condition 대응: `DataIntegrityViolationException` catch 추가
  - UNIQUE 인덱스(`uk_oauth_social`)가 있을 때 동시 요청으로 중복 INSERT 시도 시
  - 예외 발생 → 재조회로 이미 생성된 유저 반환

**import 추가**:
```java
import com.dialog.server.dto.security.OAuth2UserInfo;
import org.springframework.dao.DataIntegrityViolationException;
```

**import 제거** (Phase 2 Cleanup 시):
```java
// import com.dialog.server.dto.security.GitHubOAuth2UserInfo;  // 더 이상 불필요
```
> 단, `saveTempUser()`에서 `GitHubOAuth2UserInfo`를 `instanceof`로 사용하므로 import 유지 필요.

#### 6-2. `saveTempUser()` 변경

**현재 코드** (`UserService.java:46-56`):
```java
private User saveTempUser(GitHubOAuth2UserInfo oAuth2UserInfo) {
    final User tempUser = User.builder()
            .oauthId(oAuth2UserInfo.getOAuthUserId())
            .nickname(oAuth2UserInfo.getUserId())
            .githubId(oAuth2UserInfo.getUserId())
            .role(Role.TEMP_USER)
            .build();
    final ProfileImage profileImage = ProfileImage.builder()
            .user(tempUser)
            .basicImageUri(oAuth2UserInfo.getProfileImageUrl())
            .build();
    final User saved = userRepository.save(tempUser);
    profileImageRepository.save(profileImage);
    return saved;
}
```

**변경 후**:
```java
private User saveTempUser(OAuth2UserInfo userInfo) {
    String githubId = null;
    if (userInfo instanceof GitHubOAuth2UserInfo gitHubInfo) {
        githubId = gitHubInfo.getGithubUsername();
    }

    final User tempUser = User.builder()
            .oauthId(userInfo.getOAuthUserId())
            .nickname(userInfo.getNickname())
            .githubId(githubId)
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

**변경 포인트** (v3 리뷰 C2 반영):
| 필드 | Before | After | 이유 |
|------|--------|-------|------|
| `nickname` | `oAuth2UserInfo.getUserId()` | `userInfo.getNickname()` | 인터페이스 메서드 사용, Apple은 이름/이메일 기반 |
| `githubId` | `oAuth2UserInfo.getUserId()` | `gitHubInfo.getGithubUsername()` | `instanceof` 패턴 매칭으로 GitHub일 때만 설정 |
| `socialType` | (없음) | `userInfo.getSocialType()` | 프로바이더 구분 |
| `basicImageUri` | `oAuth2UserInfo.getProfileImageUrl()` | `userInfo.getProfileImageUrl()` | Apple은 기본 이미지 URL 반환 (NOT NULL 만족) |

**`basicImageUri` NOT NULL 보장**:
- `ProfileImage.java:37,70-73`에서 `@Column(nullable = false)` + Builder에서 null/blank 시 예외
- GitHub: `avatar_url` 반환 (항상 non-null)
- Apple: `AppleOAuth2UserInfo.getProfileImageUrl()`이 `defaultProfileImageUrl` 반환 (설정값)

---

## Step 7: AuthService + CustomOAuth2UserService 변경

### 7-1. AuthService 변경

**수정 파일**: `src/main/java/com/dialog/server/service/AuthService.java`

**현재 코드** (`AuthService.java:19-30`):
```java
@Transactional
public Long registerUser(SignupRequest signupRequest, String oauthId) {
    User user = userRepository.findUserByOauthId(oauthId)
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

**변경 후**:
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

**변경 포인트**:
- 시그니처: `registerUser(SignupRequest, String)` → `registerUser(SignupRequest, String, SocialType)`
- `findUserByOauthId()` → `findByOauthIdAndSocialType()`
- import 추가: `import com.dialog.server.domain.SocialType;`

**호출처 영향** (Phase 3에서 처리):
- `AuthController.signup()` — `SocialType` 파라미터 추가 필요

### 7-2. CustomOAuth2UserService 변경

**수정 파일**: `src/main/java/com/dialog/server/service/CustomOAuth2UserService.java`

**현재 코드**에서 `loadUser()` 내부:
```java
GitHubOAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(attributes);
```

**변경 후**:
```java
OAuth2UserInfo userInfo = new GitHubOAuth2UserInfo(attributes);
```

**변경 포인트**:
- 선언 타입: `GitHubOAuth2UserInfo` → `OAuth2UserInfo`
- `findOrCreateTempUser()` 파라미터가 `OAuth2UserInfo`로 변경되었으므로 업캐스팅으로 호환
- 선언 타입도 인터페이스로 맞추는 것이 타입 일관성에 좋음
- import 추가: `import com.dialog.server.dto.security.OAuth2UserInfo;`

---

## Step 8: Cleanup — `findUserByOauthId()` 삭제

### 전제 조건
Step 5~7에서 모든 호출처가 `findByOauthIdAndSocialType()`으로 변경 완료.

### 호출처 확인

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `UserService.findOrCreateTempUser()` | `findUserByOauthId()` | `findByOauthIdAndSocialType()` (Step 6) |
| `AuthService.registerUser()` | `findUserByOauthId()` | `findByOauthIdAndSocialType()` (Step 7) |

### 삭제 대상

**`UserRepository.java`**에서 아래 코드 삭제:
```java
@Deprecated
@Query("SELECT u FROM User u WHERE u.oauthId = :oauthId AND u.deletedAt IS NULL")
Optional<User> findUserByOauthId(@Param("oauthId") String oauthId);
```

---

## 테스트 수정

### AuthServiceTest.java

#### `registerUser()` 시그니처 변경 반영

**현재 코드** (`AuthServiceTest.java:66`):
```java
final Long id = authService.registerUser(signupRequest, tempUser.getOauthId());
```

**변경 후**:
```java
final Long id = authService.registerUser(signupRequest, tempUser.getOauthId(), SocialType.GITHUB);
```

**모든 `registerUser()` 호출처** (3곳):
1. `registerUserTest()` (line 66 부근)
2. `alreadyRegisteredUserTest()` (line 79 부근)
3. `notOAuthUserTest()` (line 91 부근)

```java
// alreadyRegisteredUserTest
assertThatThrownBy(() -> authService.registerUser(signupRequest, user.getOauthId(), SocialType.GITHUB))
        .isInstanceOf(DialogException.class);

// notOAuthUserTest
assertThatThrownBy(() -> authService.registerUser(signupRequest, newOAuthId, SocialType.GITHUB))
        .isInstanceOf(DialogException.class);
```

**import 추가**:
```java
import com.dialog.server.domain.SocialType;
```

### CustomOAuth2UserServiceTest.java

기존 테스트 코드에서 `User.builder()` 호출은 Phase 1에서 `.socialType()` 추가 완료.
`CustomOAuth2UserService.loadUser()` 내부 타입 변경은 동작에 영향 없으므로 추가 수정 불필요.

---

## 검증 체크리스트

```bash
# 1. 빌드 + 테스트
./gradlew clean test

# 2. 확인 사항
# - findByOauthIdAndSocialType()이 UserRepository에 존재하는가
# - findUserByOauthId()가 삭제되었는가 (Step 8 완료 후)
# - UserService.findOrCreateTempUser()가 OAuth2UserInfo 인터페이스를 받는가
# - saveTempUser()에서 instanceof 패턴 매칭으로 githubId를 설정하는가
# - AuthService.registerUser()에 SocialType 파라미터가 추가되었는가
# - DataIntegrityViolationException catch가 존재하는가
# - 기존 3개 테스트 파일이 모두 통과하는가
```

---

## 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 수정 | `repository/UserRepository.java` | `findByOauthIdAndSocialType()` 추가, `findUserByOauthId()` @Deprecated → 삭제 |
| 수정 | `service/UserService.java` | `findOrCreateTempUser()` 인터페이스 기반, `saveTempUser()` instanceof 패턴 매칭 |
| 수정 | `service/AuthService.java` | `registerUser()` SocialType 파라미터 추가 |
| 수정 | `service/CustomOAuth2UserService.java` | 선언 타입 `OAuth2UserInfo`로 변경 |
| 수정 | `AuthServiceTest.java` | `registerUser()` 호출에 `SocialType.GITHUB` 추가 |

---

## 리스크

| 등급 | 리스크 | 완화 방안 |
|------|--------|----------|
| MEDIUM | `DataIntegrityViolationException` catch 시 트랜잭션 롤백 | v3 리뷰 C3에서 지적. 현재는 `@Transactional` 레벨에서 처리. 별도 작업으로 개선 예정 |
| LOW | `findUserByOauthId()` 삭제 시점 | Step 5~7 완료 확인 후 Step 8 실행 |
| LOW | `CustomOAuth2UserService` 타입 변경 | 업캐스팅이므로 기능 동일 |
