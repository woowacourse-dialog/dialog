# Phase 1: Spring 설정 변경 (Actuator + HikariCP + 부하 테스트 인증 필터)

> 생성일: 2026-02-17 | 상태: DRAFT

## 목적

부하 테스트 환경에서 Prometheus 메트릭 수집과 k6 인증을 가능하게 하는 Spring 설정을 추가한다.

---

## 작업 1-1: application-local.yml 수정

**파일**: `src/main/resources/application-local.yml`

### 변경 내용

기존 파일 끝에 다음 두 섹션을 추가한다.

#### (A) Actuator 엔드포인트 노출

현재 `local` 프로파일에는 management 설정이 없어 `/actuator/prometheus` 엔드포인트에 접근할 수 없다. (`develop`, `prod`에만 존재)

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "health,info,prometheus"
```

#### (B) HikariCP 명시 설정

현재 HikariCP 설정이 전혀 없어 기본값이 적용되고 있다. 명시적으로 설정해야 Prometheus 메트릭에서 `pool` 태그로 필터링이 가능하다.

```yaml
# 기존 spring.datasource 하위에 hikari 블록 추가
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 10
      connection-timeout: 30000
      pool-name: DialogHikariPool
```

### 주의사항

- `spring.datasource` 키가 이미 존재하므로 (6행), `hikari` 블록을 그 하위에 병합해야 한다. 별도의 `spring.datasource` 루트를 만들면 YAML 중복 키 문제 발생.
- 최종 구조:
  ```yaml
  spring:
    datasource:
      url: ${DEVELOP_DB_URL}
      username: ${DEVELOP_DB_USERNAME}
      password: ${DEVELOP_DB_PASSWORD}
      driver-class-name: com.mysql.cj.jdbc.Driver
      hikari:                          # 여기에 추가
        maximum-pool-size: 10
        minimum-idle: 10
        connection-timeout: 30000
        pool-name: DialogHikariPool
  ```

### 설정값 근거

| 설정 | 값 | 이유 |
|------|-----|------|
| `maximum-pool-size` | 10 | HikariCP 기본값과 동일. 50 VU 동시 요청 시 비관적 락의 커넥션 고갈 문제를 드러나게 함 |
| `minimum-idle` | 10 | 풀 크기를 고정하여 메트릭 비교 시 변수 제거 |
| `connection-timeout` | 30000 | 기본값 30초. 타임아웃 발생 시 `hikaricp_connections_timeout_total` 메트릭에 기록됨 |
| `pool-name` | DialogHikariPool | Grafana 대시보드에서 `{pool="DialogHikariPool"}`로 필터링 |

---

## 작업 1-2: LoadTestAuthFilter 생성

**파일**: `src/main/java/com/dialog/server/config/LoadTestAuthFilter.java` (신규)

### 배경

k6에서 `POST /api/discussions/{id}/participants`를 호출하려면 인증이 필요하다.

- `WebSecurityConfig`(config/WebSecurityConfig.java:32)에서 `anyRequest().permitAll()`로 모든 요청이 허용되지만
- `AuthenticatedUserIdArgumentResolver`(resolver:30-41)가 `SecurityContextHolder`에서 `authentication.getName()`을 호출하여 userId(Long)를 추출
- `authentication == null`이면 `AUTHENTICATION_NOT_FOUND` 예외
- `AnonymousAuthenticationToken`이면 `LOGIN_REQUIRED` 예외

따라서 k6 요청의 `X-Test-User-Id` 헤더 값을 읽어 `SecurityContext`에 `Authentication`을 세팅하는 필터가 필요하다.

### 구현 코드

```java
package com.dialog.server.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Profile("loadtest")
public class LoadTestAuthFilter extends OncePerRequestFilter {

    private static final String TEST_USER_ID_HEADER = "X-Test-User-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userIdHeader = request.getHeader(TEST_USER_ID_HEADER);
        if (userIdHeader != null) {
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    userIdHeader,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }
}
```

### 동작 원리

1. k6가 `X-Test-User-Id: 10001` 헤더를 보냄
2. 필터가 헤더를 읽어 `UsernamePasswordAuthenticationToken` 생성 (principal = `"10001"` 문자열)
3. `AuthenticatedUserIdArgumentResolver`에서 `authentication.getName()` → `"10001"` 반환
4. `Long.valueOf("10001")` → userId `10001L`로 파싱 성공
5. `DiscussionParticipantService.participate(10001L, discussionId)` 정상 호출

### 프로파일 격리

- `@Profile("loadtest")` → `loadtest` 프로파일이 활성화될 때만 빈 등록
- 일반 `local` 개발 시에는 이 필터가 전혀 로드되지 않음
- 앱 실행 시 `--spring.profiles.active=local,loadtest`로 두 프로파일을 함께 활성화

---

## 검증

```bash
# 앱 실행 후 (프로파일: local,loadtest)

# 1. Actuator 엔드포인트 접근 확인
curl -s http://localhost:8080/actuator/prometheus | head -5
# → prometheus 메트릭 출력 확인

# 2. HikariCP 메트릭 존재 확인
curl -s http://localhost:8080/actuator/prometheus | grep 'hikaricp_connections_active'
# → hikaricp_connections_active{pool="DialogHikariPool",...} 값 출력

# 3. LoadTestAuthFilter 동작 확인
curl -H "X-Test-User-Id: 1" -X POST http://localhost:8080/api/discussions/106/participants
# → 200 OK (data.sql의 ID 106은 모집 중 토론, userId 1은 data.sql에 존재)

# 4. 헤더 없이 요청 시 인증 실패 확인
curl -X POST http://localhost:8080/api/discussions/106/participants
# → 인증 에러 응답
```
