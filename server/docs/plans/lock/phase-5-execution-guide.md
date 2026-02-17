# Phase 5: Before/After 비교 실행 가이드

> 생성일: 2026-02-17 | 상태: DRAFT

## 목적

비관적 락(Before)과 로컬락(After) 각각에 대해 동일한 부하 테스트를 수행하고, 결과를 비교하는 실행 가이드.

---

## 사전 준비 (1회만)

```bash
# 1. k6 설치
brew install k6

# 2. 프로젝트 디렉토리로 이동
cd /Users/kwonkeonhyeong/Desktop/dialog/server
```

---

## Before 테스트: 비관적 락 (현재 코드)

### Step 1: 인프라 시작

```bash
# MySQL 시작 (이미 실행 중이면 생략)
docker compose -f docker-compose.develop.db.yml up -d

# 모니터링 스택 시작
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
cd ..
```

### Step 2: 앱 시작

IDE에서 Spring Boot 앱을 다음 프로파일로 실행:

```
Active Profiles: local,loadtest
```

또는 CLI로:
```bash
./gradlew bootRun --args='--spring.profiles.active=local,loadtest'
```

### Step 3: 연결 확인

```bash
# Prometheus가 앱을 스크레이핑하는지 확인
open http://localhost:9090/targets
# → dialog-spring-app 상태가 "UP"

# HikariCP 메트릭 확인
curl -s http://localhost:8080/actuator/prometheus | grep hikaricp_connections_active
# → hikaricp_connections_active{pool="DialogHikariPool",...} 값 출력

# Grafana 대시보드 확인
open http://localhost:3000
# → "Dialog Performance" 폴더 > 대시보드 클릭
```

### Step 4: 테스트 데이터 삽입

```bash
# local 프로파일은 ddl-auto:create이므로 앱 시작 시 data.sql이 이미 실행됨
# 추가 테스트 데이터 삽입
mysql -h 127.0.0.1 -P 3306 -u ${DEVELOP_DB_USERNAME} -p${DEVELOP_DB_PASSWORD} ${DB_NAME} < monitoring/k6/setup-test-data.sql
```

### Step 5: 부하 테스트 실행

```bash
k6 run monitoring/k6/load-test-participation.js
```

### Step 6: 결과 캡처

**k6 터미널 출력 저장**:
```bash
k6 run monitoring/k6/load-test-participation.js 2>&1 | tee monitoring/results/before-k6-output.txt
```

**Grafana 대시보드 캡처**:
1. `http://localhost:3000` 접속
2. 대시보드 시간 범위를 테스트 구간으로 조정 (약 "Last 2 minutes")
3. 각 Row별 스크린샷 저장:
   - `monitoring/results/before-hikaricp.png`
   - `monitoring/results/before-http.png`
   - `monitoring/results/before-threads.png`

### Step 7: 핵심 수치 기록

| 지표 | Before (비관적 락) |
|------|-------------------|
| http_req_duration p95 | k6 출력에서 확인 |
| http_req_duration p99 | k6 출력에서 확인 |
| http_req_duration max | k6 출력에서 확인 |
| hikaricp_connections_active 최대 | Grafana에서 확인 |
| hikaricp_connections_pending 최대 | Grafana에서 확인 |
| hikaricp_connections_usage_seconds p95 | Grafana에서 확인 |
| hikaricp_connections_timeout_total | Grafana에서 확인 |
| participation_success | k6 출력에서 확인 |
| participation_errors | k6 출력에서 확인 |

---

## After 테스트: 로컬락 (구현 후)

### Step 1: 로컬락 코드 구현

`DiscussionParticipantService.java`에서:
- `findByIdForUpdate()` 대신 `findById()` 사용
- `ConcurrentHashMap<Long, ReentrantLock>` 기반 로컬락 적용
- 락 획득 → 비즈니스 로직(트랜잭션) → 락 해제 구조

### Step 2: 앱 재시작

```bash
# IDE에서 앱 재시작 (동일 프로파일: local,loadtest)
# ddl-auto:create이므로 DB가 자동 초기화됨
```

### Step 3: 테스트 데이터 재삽입

```bash
# 앱 재시작으로 DB가 초기화되었으므로 다시 삽입
mysql -h 127.0.0.1 -P 3306 -u ${DEVELOP_DB_USERNAME} -p${DEVELOP_DB_PASSWORD} ${DB_NAME} < monitoring/k6/setup-test-data.sql
```

### Step 4: (선택) Prometheus 데이터 초기화

Before 데이터와 After 데이터가 섞이지 않도록:

```bash
cd monitoring
docker compose -f docker-compose.monitoring.yml restart prometheus
cd ..
```

### Step 5: 부하 테스트 실행

```bash
k6 run monitoring/k6/load-test-participation.js 2>&1 | tee monitoring/results/after-k6-output.txt
```

### Step 6: 결과 캡처

Grafana에서 동일하게 스크린샷 캡처:
- `monitoring/results/after-hikaricp.png`
- `monitoring/results/after-http.png`
- `monitoring/results/after-threads.png`

---

## 결과 비교

### 비교 테이블

| 지표 | Before (비관적 락) | After (로컬락) | 변화 |
|------|-------------------|---------------|------|
| http_req_duration p95 | | | |
| http_req_duration p99 | | | |
| http_req_duration max | | | |
| hikaricp_connections_active 최대 | | | |
| hikaricp_connections_pending 최대 | | | |
| hikaricp_connections_usage_seconds p95 | | | |
| hikaricp_connections_timeout_total | | | |
| jvm_threads blocked 최대 | | | |
| jvm_threads waiting 최대 | | | |

### 기대되는 변화

| 지표 | 예상 방향 | 이유 |
|------|----------|------|
| `hikaricp_connections_active` | 감소 | 로컬락은 DB 커넥션 밖에서 대기하므로 커넥션 점유 시간 단축 |
| `hikaricp_connections_pending` | 감소 | 커넥션 풀 고갈이 줄어듦 |
| `hikaricp_connections_usage_seconds` | 감소 | 트랜잭션 내 대기 시간 제거 |
| `http_req_duration p95` | 감소 가능 | 커넥션 대기 시간 감소로 전체 응답 시간 단축 |
| `jvm_threads blocked` | 증가 | ReentrantLock은 JVM의 `blocked` 상태로 대기 |
| `jvm_threads waiting` | 감소 | DB 락 대기(JDBC의 waiting) 감소 |
| `hikaricp_connections_timeout_total` | 감소/0 | 커넥션 풀 고갈 가능성 감소 |

### 결론 도출 기준

로컬락 도입이 유의미하다고 판단하는 기준:

1. **필수**: `hikaricp_connections_usage_seconds` p95가 Before보다 감소
2. **필수**: `hikaricp_connections_pending` 최대값이 Before보다 감소
3. **권장**: `http_req_duration` p95가 Before 대비 개선되거나 동등
4. **허용**: `jvm_threads blocked`가 증가하는 것은 예상된 변화 (DB 대기 → JVM 대기로 전환)

---

## 정리

```bash
# 모니터링 스택 종료
cd monitoring
docker compose -f docker-compose.monitoring.yml down

# 볼륨까지 정리 (데이터 완전 삭제)
docker compose -f docker-compose.monitoring.yml down -v
```
