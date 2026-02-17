# Phase 6: 설정

**상태**: DRAFT
**작성일**: 2026-02-13
**선행 조건**: Phase 4 완료 (AppleTokenVerifier가 설정을 참조)
**예상 산출물**: application-develop.yml 수정, application-prod.yml 수정, application-test.yml 수정

---

## 목표

Apple OAuth에 필요한 설정을 환경별 application.yml에 추가한다.
- `apple.oauth2.allowed-audiences`: Apple identityToken aud 검증용 번들/서비스 ID
- `apple.oauth2.default-profile-image-url`: Apple 유저 기본 프로필 이미지 URL

---

## Step 15: application.yml Apple 설정 추가

### 15-1. application-develop.yml

**수정 파일**: `src/main/resources/application-develop.yml`

**추가 위치**: 파일 끝 또는 `app:` 섹션 아래

```yaml
apple:
  oauth2:
    allowed-audiences: ${APPLE_ALLOWED_AUDIENCES}
    default-profile-image-url: ${APPLE_DEFAULT_PROFILE_IMAGE_URL:https://dialog-profile.s3.ap-northeast-2.amazonaws.com/default-apple-profile.png}
```

**설정 설명**:
| 키 | 값 | 비고 |
|---|---|---|
| `allowed-audiences` | 환경변수 `APPLE_ALLOWED_AUDIENCES` | 콤마 구분: `com.dialog.app,com.dialog.service` |
| `default-profile-image-url` | 환경변수 `APPLE_DEFAULT_PROFILE_IMAGE_URL` | 기본값 포함 (S3 URL) |

**`allowed-audiences` 상세**:
- Apple identityToken의 `aud` 클레임과 비교
- iOS 앱 번들 ID: `com.dialog.app`
- Apple Service ID (웹 확장 시): `com.dialog.service`
- Spring은 콤마 구분 문자열을 `List<String>`으로 자동 변환

**`default-profile-image-url` 상세**:
- Apple은 프로필 이미지를 제공하지 않으므로 기본 이미지 필요
- `ProfileImage.basicImageUri`가 `@Column(nullable = false)`이므로 반드시 필요
- `${...:-default}` 문법으로 환경변수 없을 때 기본값 사용

### 15-2. application-prod.yml

**수정 파일**: `src/main/resources/application-prod.yml`

**추가 내용**: (develop과 동일)

```yaml
apple:
  oauth2:
    allowed-audiences: ${APPLE_ALLOWED_AUDIENCES}
    default-profile-image-url: ${APPLE_DEFAULT_PROFILE_IMAGE_URL:https://dialog-profile.s3.ap-northeast-2.amazonaws.com/default-apple-profile.png}
```

### 15-3. application-test.yml

**수정 파일**: `src/test/resources/application-test.yml`

**추가 내용**:

```yaml
apple:
  oauth2:
    allowed-audiences: test-bundle-id,test-service-id
    default-profile-image-url: https://test-profile-image.example.com/default.png
```

**테스트 환경 차이점**:
- 환경변수 대신 하드코딩된 테스트 값 사용
- `AppleTokenVerifier`는 `@MockBean`으로 모킹하므로 실제 aud 검증은 수행하지 않음
- 단, `@SpringBootTest`에서 빈 생성 시 설정이 필요하므로 반드시 추가

---

## 환경변수 목록

### 새로 필요한 환경변수

| 환경변수 | 예시 값 | 용도 | 필수 |
|----------|--------|------|:---:|
| `APPLE_ALLOWED_AUDIENCES` | `com.dialog.app,com.dialog.service` | identityToken aud 검증 | O |
| `APPLE_DEFAULT_PROFILE_IMAGE_URL` | `https://dialog-profile.s3.ap-northeast-2.amazonaws.com/default-apple-profile.png` | Apple 유저 기본 프로필 | X (기본값 있음) |

### 배포 환경별 설정

| 환경 | `APPLE_ALLOWED_AUDIENCES` | `APPLE_DEFAULT_PROFILE_IMAGE_URL` |
|------|--------------------------|----------------------------------|
| develop | 개발용 번들 ID | 개발 S3 URL (기본값 사용 가능) |
| prod | 프로덕션 번들 ID | 프로덕션 S3 URL |
| test | `test-bundle-id,test-service-id` (하드코딩) | `https://test-profile-image.example.com/default.png` (하드코딩) |

---

## 사전 준비 사항

### Apple Developer Console

1. **App ID 생성**: Apple Developer Console → Identifiers → App IDs
   - "Sign in with Apple" capability 활성화
2. **번들 ID 확인**: iOS 앱 번들 ID (예: `com.dialog.app`)
   - identityToken의 `aud` 클레임에 이 값이 포함됨
3. **Service ID** (선택): 웹에서도 Apple 로그인을 지원할 경우
   - Identifiers → Services IDs → 생성

### S3 기본 프로필 이미지

1. S3 버킷에 기본 Apple 프로필 이미지 업로드
   - 파일: `default-apple-profile.png`
   - 경로: `s3://{bucket}/default-apple-profile.png`
2. 접근 설정:
   - **방법 A**: S3 버킷 정책에 `public-read` 추가
   - **방법 B**: CloudFront 배포를 통한 접근 (권장)
3. URL을 환경변수 `APPLE_DEFAULT_PROFILE_IMAGE_URL`로 설정

---

## 검증 체크리스트

```bash
# 1. 빌드 + 테스트 (application-test.yml에 설정이 있어야 빈 생성 성공)
./gradlew clean test

# 2. develop 환경 로컬 실행 (환경변수 필요)
APPLE_ALLOWED_AUDIENCES=com.dialog.app ./gradlew bootRun --args='--spring.profiles.active=develop'

# 3. 확인 사항
# - application-develop.yml에 apple.oauth2 섹션이 있는가
# - application-prod.yml에 apple.oauth2 섹션이 있는가
# - application-test.yml에 apple.oauth2 섹션이 있는가
# - AppleTokenVerifier 빈이 정상 생성되는가
# - MobileAuthController의 @Value("${apple.oauth2.default-profile-image-url}")이 주입되는가
# - 기존 테스트가 모두 통과하는가 (application-test.yml 설정 추가 후)
```

---

## 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 수정 | `src/main/resources/application-develop.yml` | `apple.oauth2` 섹션 추가 |
| 수정 | `src/main/resources/application-prod.yml` | `apple.oauth2` 섹션 추가 |
| 수정 | `src/test/resources/application-test.yml` | `apple.oauth2` 테스트 값 추가 |

---

## 리스크

| 등급 | 리스크 | 완화 방안 |
|------|--------|----------|
| HIGH | `APPLE_ALLOWED_AUDIENCES` 환경변수 누락 시 앱 기동 실패 | `@Value` 주입 실패 → 명확한 에러 메시지. 배포 체크리스트에 추가 |
| MEDIUM | S3 기본 프로필 이미지 URL 변경 | 환경변수로 외부화했으므로 재배포 없이 변경 가능 |
| LOW | test.yml 설정 누락 시 테스트 실패 | Phase 6에서 반드시 추가 |
