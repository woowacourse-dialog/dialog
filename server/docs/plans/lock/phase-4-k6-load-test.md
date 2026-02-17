# Phase 4: k6 부하 테스트 스크립트 + 테스트 데이터

> 생성일: 2026-02-17 | 상태: DRAFT

## 목적

동일한 OfflineDiscussion에 다수의 VU가 동시에 참여 요청을 보내는 k6 스크립트와, 그를 위한 테스트 데이터 SQL을 작성한다.

---

## 작업 4-1: setup-test-data.sql

**파일**: `monitoring/k6/setup-test-data.sql` (신규)

### 요구사항

- 100명의 테스트 유저 (ID 10001~10100)
- 1개의 테스트 OfflineDiscussion (ID 10001)
  - `maxParticipantCount = 100` (50 VU 동시 참여 허용)
  - `startAt = 30일 후` (참여 시간 검증 통과)
  - `participantCount = 0`

### 테이블 구조 고려사항

**discussions + offline_discussions (JOINED 상속)**:
- `Discussion`은 `@Inheritance(strategy = InheritanceType.JOINED)` 사용
- `discussions` 테이블에 기본 필드, `offline_discussions` 테이블에 확장 필드
- 두 테이블 모두에 INSERT 필요 (같은 `discussion_id` 공유)

**users 테이블**:
- `User` 엔티티의 필드: `id`, `oauthId`, `nickname`, `githubId`, `track`, `webPushNotification`, `role`, `deletedAt`
- `data.sql`의 INSERT 패턴 참고: `(user_id, nickname, track, web_push_notification, created_at, modified_at, is_deleted)`
- `oauthId`, `githubId`, `role`은 nullable → 생략 가능

**maxParticipantCount = 100 우회**:
- `OfflineDiscussion`의 `validateMaxParticipantCount()`는 1~10 범위만 허용 (OfflineDiscussion.java:116)
- BUT: 이 검증은 `@Builder` 생성자(92행)와 `update()` 메서드(168행)에서만 호출됨
- JPA가 DB에서 로딩할 때는 `@NoArgsConstructor`(19행) 사용 → 검증 우회
- SQL 직접 삽입은 JPA 검증을 거치지 않으므로 문제 없음

### SQL 구현

```sql
-- ============================================
-- 부하 테스트 데이터 (앱 시작 후 data.sql 실행 완료 후 실행)
-- ============================================

-- 기존 부하 테스트 데이터 정리 (재실행 대비)
DELETE FROM discussion_participants WHERE discussion_id = 10001;
DELETE FROM offline_discussions WHERE discussion_id = 10001;
DELETE FROM discussions WHERE discussion_id = 10001;
DELETE FROM users WHERE user_id >= 10001 AND user_id <= 10100;

-- 100명의 테스트 유저 생성
-- data.sql 패턴과 동일: (user_id, nickname, track, web_push_notification, created_at, modified_at, is_deleted)
INSERT INTO users (user_id, nickname, track, web_push_notification, created_at, modified_at, is_deleted)
SELECT
    10000 + seq.n AS user_id,
    CONCAT('loadtest_user_', seq.n) AS nickname,
    'BACKEND' AS track,
    false AS web_push_notification,
    NOW() AS created_at,
    NOW() AS modified_at,
    false AS is_deleted
FROM (
    SELECT @row := @row + 1 AS n
    FROM information_schema.columns, (SELECT @row := 0) r
    LIMIT 100
) seq;

-- 테스트 OfflineDiscussion 생성 (discussions 테이블)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (10001, '부하 테스트용 토론', '부하 테스트 대상 오프라인 토론입니다.', 'BACKEND', '부하 테스트', 1, NOW(), NOW(), NULL);

-- 테스트 OfflineDiscussion 생성 (offline_discussions 테이블)
INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (10001,
        DATE_ADD(NOW(), INTERVAL 30 DAY),
        DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 2 HOUR,
        '부하 테스트 장소',
        0,
        100);
```

### ID 범위 설계

| 대상 | ID 범위 | 비고 |
|------|---------|------|
| 기존 users (data.sql) | 1~9 | 충돌 없음 |
| 기존 discussions (data.sql) | 100~120 | 충돌 없음 |
| 테스트 users | 10001~10100 | 안전한 간격 |
| 테스트 discussion | 10001 | 안전한 간격 |

---

## 작업 4-2: k6 부하 테스트 스크립트

**파일**: `monitoring/k6/load-test-participation.js` (신규)

### 전제조건

- k6 설치: `brew install k6`
- Spring App 실행 중 (프로파일: `local,loadtest`)
- `setup-test-data.sql` 실행 완료

### 구현

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// --- 커스텀 메트릭 ---
const participationSuccess = new Counter('participation_success');
const participationErrors = new Counter('participation_errors');
const errorRate = new Rate('error_rate');

// --- 설정 (환경변수로 오버라이드 가능) ---
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const DISCUSSION_ID = __ENV.DISCUSSION_ID || '10001';
const USER_ID_START = parseInt(__ENV.USER_ID_START || '10001');

// --- 시나리오 ---
export const options = {
    scenarios: {
        burst_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s',  target: 10 },   // 워밍업
                { duration: '10s', target: 50 },   // 부하 증가
                { duration: '20s', target: 50 },   // 지속 부하
                { duration: '5s',  target: 0 },    // 감소
            ],
            gracefulRampDown: '5s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<5000'],  // p95 < 5초
        error_rate: ['rate<0.8'],            // 에러율 80% 미만 (이미 참여한 VU의 재요청은 에러)
    },
};

// --- 메인 함수 (각 VU가 반복 실행) ---
export default function () {
    const userId = USER_ID_START + (__VU - 1);
    const url = `${BASE_URL}/api/discussions/${DISCUSSION_ID}/participants`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'X-Test-User-Id': `${userId}`,
        },
        timeout: '10s',
    };

    const response = http.post(url, null, params);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 3000ms': (r) => r.timings.duration < 3000,
    });

    if (success) {
        participationSuccess.add(1);
    } else {
        participationErrors.add(1);
    }
    errorRate.add(!success);

    sleep(0.1);
}
```

### 요청 흐름 분석

```
VU 1  → userId 10001 → POST /api/discussions/10001/participants
VU 2  → userId 10002 → POST /api/discussions/10001/participants
...
VU 50 → userId 10050 → POST /api/discussions/10001/participants
```

**첫 번째 반복 (iteration 0)**:
- 모든 VU가 동일한 Discussion(10001)에 참여 시도
- 비관적 락: `SELECT ... FOR UPDATE`로 직렬화 → 한 번에 1개 요청만 처리
- maxParticipantCount=100이므로 50명 모두 성공

**두 번째 이후 반복**:
- 이미 참여한 유저 → `ALREADY_PARTICIPATION_DISCUSSION` 에러 (400)
- 하지만 `participate()` 메서드에서 **락 획득 후** 검증하므로 커넥션 점유/경합은 동일하게 발생
  ```java
  // DiscussionParticipantService.java:29
  Discussion discussion = getDiscussionByIdWithLock(discussionId);  // ← 여기서 락 획득
  // ... 이후에 검증 로직
  ```

### 에러율이 높은 이유

`ramping-vus`에서 각 VU는 반복(iteration)을 계속 실행한다. VU가 첫 번째 반복에서 참여 성공하면, 두 번째 반복부터는 모두 400 에러가 된다. 이는 **정상적인 동작**이며, 락 경합 측정에는 영향을 주지 않는다.

### 환경변수 오버라이드

```bash
# 기본 실행
k6 run load-test-participation.js

# VU 수 변경 (커맨드라인으로 시나리오 오버라이드)
k6 run --vus 100 --duration 30s load-test-participation.js

# Discussion ID 변경
k6 run -e DISCUSSION_ID=10002 load-test-participation.js

# 다른 서버 대상
k6 run -e BASE_URL=http://192.168.1.10:8080 load-test-participation.js
```

---

## 검증

```bash
# 1. k6 설치 확인
k6 version

# 2. 테스트 데이터 삽입
mysql -h 127.0.0.1 -P 3306 -u <user> -p<pass> <db> < monitoring/k6/setup-test-data.sql

# 3. 데이터 확인
mysql -h 127.0.0.1 -P 3306 -u <user> -p<pass> <db> -e "SELECT COUNT(*) FROM users WHERE user_id >= 10001"
# → 100

mysql -h 127.0.0.1 -P 3306 -u <user> -p<pass> <db> -e "SELECT max_participant_count FROM offline_discussions WHERE discussion_id = 10001"
# → 100

# 4. k6 dry-run (1 VU, 1 iteration)
k6 run --vus 1 --iterations 1 monitoring/k6/load-test-participation.js
# → participation_success: 1 확인

# 5. 본 실행
k6 run monitoring/k6/load-test-participation.js
# → 터미널 출력에서 http_req_duration p95, p99 확인
```
