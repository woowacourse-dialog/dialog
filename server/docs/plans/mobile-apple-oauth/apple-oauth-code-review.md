# Code Review Report

**브랜치**: `feat/apple-oauth` | **Base**: `develop`
**커밋 수**: 6개 | **변경 파일**: 30개 (+747/-36)
**변경 도메인**: controller, domain, dto, service, repository, exception, config | **팀 규모**: 6명
**리뷰 일시**: 2026-02-13

---

## Summary

| 등급 | 건수 | 주요 발견자 |
|------|------|------------|
| CRITICAL | 2 | security, database |
| HIGH | 8 | security, architecture, database, test |
| MEDIUM | 10 | code-quality, security, test, architecture |

## Verdict: REQUEST CHANGES

> CRITICAL 2건, HIGH 8건 — 보안 및 데이터 무결성 이슈 해결 필수

---

## CRITICAL Issues (반드시 수정)

### 1. [보안/인가] SecurityConfig permitAll() — 모든 엔드포인트 인증 미적용

- **발견자**: security-reviewer
- **파일**: `WebSecurityConfig.java:32`
- **문제**: `anyRequest().permitAll()`로 모든 엔드포인트가 비인증 사용자에게 노출됨. TODO 주석 처리 상태.
- **영향**: 이 PR에서 도입한 것은 아니지만(pre-existing), Apple OAuth 배포 시 인증이 필요한 모든 API가 무방비 상태. `/api/auth/mobile/apple`도 명시적 permitAll 목록에 포함되어 있지 않음.
- **수정**: 주석 처리된 인가 설정을 활성화하고, `/api/auth/mobile/apple`을 permitAll 목록에 추가. Apple OAuth 머지 전 반드시 해결.

### 2. [DB] (oauthId, socialType) Unique 제약조건 누락

- **발견자**: database-reviewer, security-reviewer
- **파일**: `User.java:21-22`
- **문제**: `@Table`에 `(oauth_id, social_type)` 복합 unique constraint가 없음. `UserService.findOrCreateTempUser()`의 `DataIntegrityViolationException` catch 로직이 실제 DB 제약 없이 **동작하지 않음**.
- **영향**: 동시 요청 시 같은 oauthId+socialType으로 중복 User 생성 가능. Race condition 방어 코드가 무력화됨.
- **수정**:
  ```java
  @Table(name = "users", uniqueConstraints = {
      @UniqueConstraint(name = "uk_user_oauth_social", columnNames = {"oauth_id", "social_type"})
  })
  ```

---

## HIGH Issues (강력 권고)

### 1. [보안] Nonce 검증 불충분 — Replay Attack 취약

- **발견자**: security-reviewer | **반론 판정**: CRITICAL → HIGH (DOWNGRADE)
- **파일**: `AppleTokenVerifier.java:61`
- **문제**: Nonce가 단순 문자열 비교만 수행. 사용 후 소멸(invalidation) 처리 없음.
- **수정**: 서버 측 nonce 발급 → Redis/DB 저장 → 사용 후 삭제. 또는 Apple 공식 권장 SHA256 해시 비교 패턴 적용.
- **DA 근거**: HTTPS 환경에서 토큰 탈취 자체가 어렵고 Apple 토큰 만료가 짧아(~10분) CRITICAL까지는 아니나, 심층 방어 원칙상 필수.

### 2. [아키텍처] MobileAuthController 비즈니스 로직 비대화

- **발견자**: architecture-reviewer, code-quality-reviewer | **반론 판정**: AGREE
- **파일**: `MobileAuthController.java:41-72`
- **문제**: 토큰 검증 → 사용자 조회/생성 → 세션 설정 → 응답 생성의 전체 오케스트레이션이 Controller에 직접 존재. 기존 `AuthController`는 Service에 위임하는 패턴.
- **수정**: `AuthService.loginWithApple()` 등 Service 메서드로 추출. Controller는 요청/응답만 담당.

### 3. [보안] @Valid 누락 — MobileAuthController

- **발견자**: security-reviewer | **반론 판정**: AGREE
- **파일**: `MobileAuthController.java:42`
- **문제**: `@RequestBody AppleLoginRequest`에 `@Valid` 없음. `@NotBlank` 등 validation annotation이 동작하지 않음.
- **수정**: `@Valid @RequestBody AppleLoginRequest request`

### 4. [DB] 복합 인덱스 누락 — findByOauthIdAndSocialType

- **발견자**: database-reviewer | **반론 판정**: AGREE
- **파일**: `UserRepository.java:18-19`
- **문제**: `(oauthId, socialType)` 복합 인덱스가 없어 로그인 시 매번 full table scan.
- **수정**: CRITICAL #2의 uniqueConstraint 추가로 인덱스도 함께 생성됨. 또는 별도 `@Index` 추가.

### 5. [DB] 기존 데이터 마이그레이션 전략 부재

- **발견자**: database-reviewer
- **파일**: `User.java:37-38`, `UserRepository.java:18-19`
- **문제**: `ddl-auto: update`가 `social_type` 컬럼을 추가하지만 기존 행은 NULL. `findByOauthIdAndSocialType` 쿼리에서 `socialType = :socialType` 조건이 있으므로, **기존 GitHub 사용자가 로그인 불가**.
- **수정**: 마이그레이션 SQL 실행: `UPDATE users SET social_type = 'GITHUB' WHERE social_type IS NULL;` 또는 `@Column(columnDefinition = "VARCHAR(255) DEFAULT 'GITHUB'")` DB 기본값 설정.

### 6. [보안] Rate Limiting 부재

- **발견자**: security-reviewer
- **파일**: `MobileAuthController.java:42`
- **문제**: `/api/auth/mobile/apple` 엔드포인트에 rate limiting이 없어 무차별 요청 공격 가능.
- **수정**: bucket4j, resilience4j, 또는 API Gateway 레벨에서 IP 기반 rate limiting 적용.

### 7. [보안] nickname 입력 무검증

- **발견자**: security-reviewer
- **파일**: `MobileAuthController.java:50-53`, `AppleOAuth2UserInfo.java:28-32`
- **문제**: 클라이언트에서 전달한 `firstName`/`lastName`이 검증 없이 닉네임으로 저장됨. `saveTempUser`에는 길이 제한이 없음 (`updateUser`에는 2~15자 제한 있음).
- **수정**: 입력 길이 제한, HTML 이스케이프, 특수문자 필터링 적용.

### 8. [테스트] findOrCreateTempUser() 단위 테스트 누락

- **발견자**: test-reviewer | **반론 판정**: AGREE
- **파일**: `UserService.java:45-55`
- **문제**: 핵심 비즈니스 로직(사용자 생성/조회 분기, 동시성 방어)에 대한 직접 테스트 없음.
- **수정**: (1) 기존 사용자 조회 성공, (2) 신규 사용자 생성, (3) DataIntegrityViolationException 재조회 fallback 테스트 추가.

---

## MEDIUM Issues (개선 권고)

| # | 카테고리 | 이슈 | 파일 | 발견자 |
|---|---------|------|------|--------|
| 1 | 보안 | 세션 고정 공격 방어 누락 — 로그인 후 세션 ID 미갱신 | `MobileAuthController.java:66-76` | security |
| 2 | 보안 | NPE 가능성 — `User.isRegistered()`에서 role null 미검사 | `User.java:78` | security |
| 3 | 보안 | 에러 로깅에 토큰 정보 노출 가능성 | `AppleTokenVerifier.java:73` | security |
| 4 | 코드품질 | AuthController 중복 코드 — `extractOAuthId/extractSocialType` 세션 null 체크 반복 | `AuthController.java:96-121` | code-quality |
| 5 | 코드품질 | Dead Code — `GitHubOAuth2UserInfo.getNickname()`과 `getGithubUsername()` 동일 반환 | `GitHubOAuth2UserInfo.java:38,51` | code-quality |
| 6 | 코드품질 | 로깅 방식 불일치 — `LoggerFactory` vs `@Slf4j` 혼용 | `AppleTokenVerifier.java:25` | code-quality |
| 7 | 코드품질 | 매직 스트링 — `AppleOAuth2UserInfo` claim key 상수화 미적용 | `AppleOAuth2UserInfo.java:28-37` | code-quality |
| 8 | 아키텍처 | `@Value` Controller 직접 주입 — 설정값이 Controller 책임 벗어남 | `MobileAuthController.java:39-40` | architecture |
| 9 | 아키텍처 | `instanceof` 사용 — `UserService.saveTempUser()`에서 OCP 위반 | `UserService.java:59` | architecture |
| 10 | 테스트 | `findByOauthIdAndSocialType()` Repository 테스트 부재 | `UserRepository.java:18-19` | test |

---

## SUGGESTION (참고)

- AppleTokenVerifier를 향후 `infrastructure`/`client` 패키지로 분리 고려 (DA: 기존 패턴과 일관성 유지 차원에서 현재는 허용)
- 모바일 앱에서 세션 기반 → JWT 토큰 기반 인증 전환 검토 (DA: 기존 전체 아키텍처 변경이므로 별도 이슈)
- JWKS 캐싱 전략 도입 (DA: 초기 단계에서 허용 가능, 트래픽 증가 시 도입)
- Apple 알고리즘 RS256 명시적 제한 설정
- Flyway 마이그레이션 도구 도입 (DA: 이 PR 범위 밖, 별도 이슈)
- Phase 2-3 커밋 분리 (구조적 vs 행동적 변경)

---

## GOOD (잘된 점)

- **[인터페이스 설계]** `OAuth2UserInfo` 인터페이스 도입으로 GitHub/Apple 다형성 처리. OCP 준수.
- **[의존성 방향]** Controller → Service → Repository 방향 전체적으로 올바르게 유지.
- **[SessionConstants]** 세션 키 상수 클래스 분리로 매직 스트링 제거.
- **[ErrorCode 일반화]** `GITHUB_USER_ID_MISSING` → `OAUTH_USER_ID_MISSING` 프로바이더 중립적 체계.
- **[동시성 방어]** `DataIntegrityViolationException` catch 후 재조회 패턴 (DB 제약 추가 후 정상 동작).
- **[복합 키 조회]** `findByOauthIdAndSocialType`으로 멀티 프로바이더 ID 충돌 방지.
- **[토큰 검증]** `NimbusJwtDecoder` 사용으로 서명/발급자/만료/대상 검증 자동 처리.
- **[JPQL 안전성]** 모든 Repository 쿼리가 `@Param` 바인딩 사용, 인젝션 위험 없음.
- **[테스트 커버리지]** 신규 5개 테스트 파일, Mock 정책 준수 (`@MockitoBean`은 외부 API인 `AppleTokenVerifier`에만 적용).
- **[Phase별 커밋]** 6개 커밋이 논리적으로 잘 분리됨.

---

## 반론 검증 결과 (devils-advocate)

| 원본 이슈 | 원본 등급 | 판정 | 조정 등급 | 사유 요약 |
|-----------|----------|------|----------|----------|
| Nonce 미검증 | CRITICAL | DOWNGRADE | HIGH | HTTPS + 짧은 만료시간으로 공격 난이도 높음 |
| Controller 비즈니스 로직 | HIGH | AGREE | HIGH | 기존 패턴과 불일치, 테스트 어려움 |
| @Valid 누락 | HIGH | AGREE | HIGH | validation annotation 무력화 |
| 인덱스 누락 | HIGH | AGREE | HIGH | 핵심 쿼리 full table scan |
| findOrCreateTempUser 테스트 | HIGH | AGREE | HIGH | 핵심 비즈니스 로직 미커버 |
| 한글 테스트명 불일치 | MEDIUM | AGREE | MEDIUM | 컨벤션 일관성 |
| AppleTokenVerifier 레이어 | HIGH | DOWNGRADE | SUGGESTION | 기존 패턴과 일관성 |
| JWKS 캐싱 부재 | MEDIUM | DOWNGRADE | SUGGESTION | 초기 단계 허용 가능 |
| 세션 기반 인증 적합성 | MEDIUM | DOWNGRADE | SUGGESTION | 전체 아키텍처 변경 범위 밖 |
| DTO 위치 | MEDIUM | DISMISS | - | 기존 컨벤션 정확히 준수 |
| 매직 스트링 혼용 | MEDIUM | DISMISS | - | 실제 리터럴 사용 없음 |
| 불필요한 import | MEDIUM | DISMISS | - | 실체 없는 지적 |
| 에러 메시지 노출 | MEDIUM | DISMISS | - | Spring Boot 기본 처리 |
| Flyway 부재 | MEDIUM | DISMISS | - | PR 범위 밖 |

---

## 핵심 수정 사항 요약 (머지 전 필수)

1. `(oauthId, socialType)` unique constraint + 인덱스 추가
2. 기존 데이터 `social_type` NULL → `'GITHUB'` 마이그레이션
3. SecurityConfig 인가 설정 활성화
4. Nonce 일회성 검증 구현
5. `@Valid` 추가
6. MobileAuthController 비즈니스 로직 → Service 추출
7. `findOrCreateTempUser()` 테스트 추가
