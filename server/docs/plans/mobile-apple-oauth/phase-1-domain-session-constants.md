# Phase 1: Domain 기반 + 세션 상수

**상태**: DRAFT
**작성일**: 2026-02-13
**선행 조건**: 없음
**예상 산출물**: SocialType Enum, User 엔티티 수정, OAuth2UserInfo 인터페이스, SessionConstants 클래스

---

## 목표

Apple OAuth를 포함한 멀티 프로바이더 인증 기반을 마련한다.
- `SocialType` Enum으로 OAuth 제공자를 구분
- `User` 엔티티에 `socialType` 필드 추가 (기존 데이터 호환)
- `OAuth2UserInfo` 인터페이스로 프로바이더별 추상화
- 세션 키 상수를 독립 클래스로 추출

---

## Step 1: SocialType Enum 생성

### 새 파일

**`src/main/java/com/dialog/server/domain/SocialType.java`**

```java
package com.dialog.server.domain;

public enum SocialType {
    GITHUB, APPLE
}
```

### 체크포인트
- [x] `@Enumerated(EnumType.STRING)` 전략과 일관 (기존 `Role`, `Track` 모두 STRING)
- [x] 향후 KAKAO, GOOGLE 등 추가 시 Enum에 값만 추가하면 됨

---

## Step 2: User 엔티티에 socialType 추가

### 수정 파일: `src/main/java/com/dialog/server/domain/User.java`

#### 2-1. 필드 추가

**위치**: 기존 필드 `githubId` 아래 (현재 line 30~32 부근)

```java
// 추가할 필드
@Enumerated(EnumType.STRING)
private SocialType socialType;
```

**주의**: `@Column(nullable = false)` 제약을 두지 않는다.
- prod 환경(`ddl-auto: update`)에서 기존 데이터의 `social_type`은 NULL
- JPA가 컬럼 추가 시 기존 행에 NULL이 들어감

#### 2-2. Builder 수정

**현재 코드** (`User.java:46-55`):
```java
@Builder
private User(String oauthId,
             String nickname,
             String githubId,
             Track track,
             boolean webPushNotification,
             Role role) {
    this.oauthId = oauthId;
    this.nickname = nickname;
    this.githubId = githubId;
    this.track = track;
    this.webPushNotification = webPushNotification;
    this.role = role;
}
```

**변경 후**:
```java
@Builder
private User(String oauthId,
             String nickname,
             String githubId,
             SocialType socialType,
             Track track,
             boolean webPushNotification,
             Role role) {
    this.oauthId = oauthId;
    this.nickname = nickname;
    this.githubId = githubId;
    this.socialType = socialType != null ? socialType : SocialType.GITHUB;  // 기본값
    this.track = track;
    this.webPushNotification = webPushNotification;
    this.role = role;
}
```

**핵심 변경 포인트**:
- `SocialType socialType` 파라미터 추가
- `socialType != null ? socialType : SocialType.GITHUB` — 기본값 GITHUB
  - 기존 코드에서 `.socialType()` 호출 누락 시 NPE 방지 (v3 리뷰 C1 반영)
  - prod 기존 데이터의 NULL → JPA 로드 시 null이지만 Builder 통한 신규 생성은 기본값 보장

#### 2-3. import 추가

```java
import com.dialog.server.domain.SocialType;  // 동일 패키지이므로 불필요
```

> 동일 패키지(`com.dialog.server.domain`)이므로 import 불필요.

#### 2-4. UNIQUE 인덱스 — 1차 배포에서는 제외

```java
// 2차 배포에서 추가 (1차 배포에서는 이 어노테이션 없이 배포)
@Table(name = "users", indexes = {
    @Index(name = "uk_oauth_social", columnList = "oauthId, socialType", unique = true)
})
```

**prod 마이그레이션 전략 (2단계 배포)**:
1. **1차 배포**: `@Index` 없이 배포 → `ddl-auto: update`가 `social_type VARCHAR(255)` nullable 컬럼만 추가
2. **수동 SQL 실행**:
   ```sql
   UPDATE users SET social_type = 'GITHUB' WHERE social_type IS NULL;
   CREATE UNIQUE INDEX uk_oauth_social ON users(oauth_id, social_type);
   ```
3. **2차 배포**: `@Table(indexes = @Index(...))` 어노테이션 추가

---

## Step 3: OAuth2UserInfo 인터페이스 + 구현체 수정

### 3-1. 새 파일: OAuth2UserInfo 인터페이스

**`src/main/java/com/dialog/server/dto/security/OAuth2UserInfo.java`**

```java
package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;

public interface OAuth2UserInfo {
    String getOAuthUserId();
    String getProfileImageUrl();
    String getNickname();
    SocialType getSocialType();
}
```

### 3-2. 수정 파일: GitHubOAuth2UserInfo

**현재 코드** (`GitHubOAuth2UserInfo.java`):
```java
public class GitHubOAuth2UserInfo {
    // ... (인터페이스 미구현)
    public String getUserId() {
        return (String) attributes.get("login");
    }
}
```

**변경 후**:
```java
package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.util.Map;

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

    /**
     * GitHub 전용: githubId(login) 조회용
     * Phase 2 Step 6에서 instanceof 패턴 매칭으로 사용
     */
    public String getGithubUsername() {
        return (String) attributes.get("login");
    }
}
```

**변경 포인트**:
- `implements OAuth2UserInfo` 추가
- `getUserId()` → `getGithubUsername()` (GitHub 전용 메서드로 명확화)
  - **주의 (v3 리뷰 C2)**: 기존 `getUserId()`는 `UserService.java:52,53`에서 사용 중
  - Phase 2 Step 6에서 `saveTempUser()` 변경 완료 시까지 `getUserId()`를 `@Deprecated`로 유지
- `getNickname()`, `getSocialType()` 추가
- `GITHUB_USER_ID_MISSING` → `OAUTH_USER_ID_MISSING` 변경

#### `getUserId()` 삭제 전략 (컴파일 에러 방지)

Phase 1에서는 `getUserId()`를 `@Deprecated`로 남겨둔다:

```java
/**
 * @deprecated Phase 2 완료 후 삭제. {@link #getGithubUsername()} 사용.
 */
@Deprecated
public String getUserId() {
    return (String) attributes.get("login");
}
```

Phase 2 Step 6 완료 후 삭제.

### 3-3. 새 파일: AppleOAuth2UserInfo

**`src/main/java/com/dialog/server/dto/security/AppleOAuth2UserInfo.java`**

```java
package com.dialog.server.dto.security;

import com.dialog.server.domain.SocialType;
import java.util.Map;

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
        // 2순위: email에서 추출 (private relay 제외)
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

**설계 결정**:
- `defaultProfileImageUrl`을 생성자 주입 (v3 리뷰 M4: 환경별 설정 외부화)
- private relay email 필터: `matches()` 정규식 사용 (v3 리뷰 H3: 우회 방지)
- `ProfileImage.basicImageUri`가 `@Column(nullable = false)`이므로 `getProfileImageUrl()`은 항상 non-null 반환

### 3-4. ErrorCode 변경

**수정 파일**: `src/main/java/com/dialog/server/exception/ErrorCode.java`

**현재 코드** (`ErrorCode.java:8`):
```java
GITHUB_USER_ID_MISSING("1001", "GitHub에서 사용자 ID를 가져올 수 없습니다.", HttpStatus.BAD_GATEWAY),
```

**변경 후**:
```java
OAUTH_USER_ID_MISSING("1001", "OAuth 제공자에서 사용자 ID를 가져올 수 없습니다.", HttpStatus.BAD_GATEWAY),
```

> v3 리뷰 M5 반영: ErrorCode 변경을 Step 12까지 지연하지 않고 Step 3에서 함께 변경.
> `GITHUB_USER_ID_MISSING`을 사용하는 곳은 `GitHubOAuth2UserInfo.java`뿐이므로 함께 변경.

---

## Step 4: 세션 상수 클래스 추출

### 새 파일

**`src/main/java/com/dialog/server/controller/constants/SessionConstants.java`**

```java
package com.dialog.server.controller.constants;

public final class SessionConstants {
    public static final String PENDING_OAUTH_ID = "pending_oauth_id";
    public static final String PENDING_SOCIAL_TYPE = "pending_social_type";

    private SessionConstants() {}
}
```

**설계 이유** (v3 리뷰 H7):
- 기존에 `OAuth2SuccessHandler.PENDING_OAUTH_ID`로 선언 → `AuthController`가 `OAuth2SuccessHandler`에 의존
- `MobileAuthController`가 웹 OAuth 핸들러에 의존하지 않도록 독립 클래스로 추출
- `private` 생성자로 인스턴스화 방지

> **주의**: `OAuth2SuccessHandler`의 `PENDING_OAUTH_ID` 상수와 `AuthController`의 import는 Phase 3에서 변경한다.
> Phase 1에서는 `SessionConstants` 클래스 생성만 수행.

---

## 테스트 수정

Phase 1 완료 후 기존 테스트에 `.socialType(SocialType.GITHUB)` 추가를 **권장**하지만, Builder 기본값이 있으므로 누락 시에도 컴파일 에러 없음.

### 명시적 추가 권장 (3개 파일)

#### AuthServiceTest.java

**위치**: `setUp()` 메서드 내 `User.builder()` 2곳

```java
// line 43-47 부근
user = userRepository.save(
    User.builder()
        .oauthId("oauth123")
        .nickname("testUser")
        .socialType(SocialType.GITHUB)  // 추가
        .role(Role.USER)
        .build()
);

// line 49-52 부근
tempUser = userRepository.save(
    User.builder()
        .oauthId("oauth1234")
        .socialType(SocialType.GITHUB)  // 추가
        .build()
);
```

#### UserServiceTest.java

**위치**: `createUser()` 메서드

```java
// line 184-191 부근
private User createUser() {
    return User.builder()
        .nickname("minggom")
        .role(Role.USER)
        .track(Track.BACKEND)
        .webPushNotification(true)
        .oauthId("oauthId1")
        .socialType(SocialType.GITHUB)  // 추가
        .build();
}
```

#### CustomOAuth2UserServiceTest.java

**위치**: `setUp()` 메서드 내 `User.builder()`

```java
// line 73-80 부근
userRepository.save(
    User.builder()
        .oauthId(registeredOAuthId)
        .nickname("test")
        .webPushNotification(false)
        .socialType(SocialType.GITHUB)  // 추가
        .role(Role.USER)
        .build()
);
```

---

## 검증 체크리스트

```bash
# 1. 빌드 확인
./gradlew clean build -x test

# 2. 테스트 실행
./gradlew test

# 3. 확인 사항
# - User 엔티티에 socialType 필드가 추가되었는가
# - Builder에서 socialType 기본값이 GITHUB인가
# - OAuth2UserInfo 인터페이스를 GitHubOAuth2UserInfo가 구현하는가
# - AppleOAuth2UserInfo가 OAuth2UserInfo를 구현하는가
# - ErrorCode.GITHUB_USER_ID_MISSING → OAUTH_USER_ID_MISSING 변경되었는가
# - SessionConstants 클래스가 생성되었는가
# - 기존 테스트가 모두 통과하는가
```

---

## 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 신규 | `domain/SocialType.java` | OAuth 제공자 Enum |
| 수정 | `domain/User.java` | `socialType` 필드 + Builder 기본값 |
| 신규 | `dto/security/OAuth2UserInfo.java` | 프로바이더 추상화 인터페이스 |
| 수정 | `dto/security/GitHubOAuth2UserInfo.java` | 인터페이스 구현 + 메서드 추가 |
| 신규 | `dto/security/AppleOAuth2UserInfo.java` | Apple id_token claims 추출 |
| 수정 | `exception/ErrorCode.java` | `GITHUB_USER_ID_MISSING` → `OAUTH_USER_ID_MISSING` |
| 신규 | `controller/constants/SessionConstants.java` | 세션 키 상수 |
| 수정 | `AuthServiceTest.java` | `.socialType(SocialType.GITHUB)` 추가 |
| 수정 | `UserServiceTest.java` | `.socialType(SocialType.GITHUB)` 추가 |
| 수정 | `CustomOAuth2UserServiceTest.java` | `.socialType(SocialType.GITHUB)` 추가 |

---

## 리스크

| 등급 | 리스크 | 완화 방안 |
|------|--------|----------|
| LOW | `getUserId()` @Deprecated 남겨둠 → Phase 2 전 사용 가능 | Phase 2 완료 후 반드시 삭제 |
| LOW | prod DB에 social_type NULL 데이터 존재 | Builder 기본값 + 2단계 배포 전략 |
| LOW | `GITHUB_USER_ID_MISSING` → `OAUTH_USER_ID_MISSING` 리네이밍 | 사용처 1곳(GitHubOAuth2UserInfo)만 함께 변경 |
