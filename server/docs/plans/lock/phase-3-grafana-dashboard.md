# Phase 3: Grafana 대시보드 구성

> 생성일: 2026-02-17 | 상태: DRAFT

## 목적

비관적 락 vs 로컬락 비교에 필요한 핵심 메트릭을 시각화하는 Grafana 대시보드 JSON을 생성한다.

---

## 파일

**파일**: `monitoring/grafana/provisioning/dashboards/dialog-performance.json` (신규)

---

## 대시보드 레이아웃

4개 Row, 총 13개 패널로 구성한다.

### Row 1: HikariCP Connection Pool (핵심 비교 지표)

비관적 락의 가장 큰 문제점인 **DB 커넥션 점유**를 시각화한다.

| # | 패널 이름 | 타입 | PromQL | 설명 |
|---|----------|------|--------|------|
| 1 | Active Connections | Time series | `hikaricp_connections_active{pool="DialogHikariPool"}` | 현재 사용 중인 커넥션 수. 비관적 락에서는 풀 사이즈(10)에 가깝게 올라감 |
| 2 | Pending Threads | Time series | `hikaricp_connections_pending{pool="DialogHikariPool"}` | 커넥션 대기 중인 스레드 수. 비관적 락에서 스파이크 예상 |
| 3 | Connection Usage Time (p95) | Time series | `histogram_quantile(0.95, rate(hikaricp_connections_usage_seconds_bucket{pool="DialogHikariPool"}[30s]))` | 커넥션 checkout~checkin 시간. 비관적 락에서 더 길어야 함 |
| 4 | Connection Acquire Time (p95) | Time series | `histogram_quantile(0.95, rate(hikaricp_connections_acquire_seconds_bucket{pool="DialogHikariPool"}[30s]))` | 커넥션 획득 대기 시간. 풀이 고갈되면 증가 |
| 5 | Connection Timeouts | Stat | `hikaricp_connections_timeout_total{pool="DialogHikariPool"}` | 커넥션 타임아웃 누적 횟수 |

### Row 2: HTTP Endpoint Performance

참여 API의 응답 시간을 비교한다.

| # | 패널 이름 | 타입 | PromQL | 설명 |
|---|----------|------|--------|------|
| 6 | Request Rate (req/s) | Time series | `rate(http_server_requests_seconds_count{uri=~".*participants.*", method="POST"}[30s])` | 초당 요청 처리량 |
| 7 | Response Time p95 | Time series | `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{uri=~".*participants.*", method="POST"}[30s]))` | 95번째 백분위 응답 시간 |
| 8 | Response Time p99 | Time series | `histogram_quantile(0.99, rate(http_server_requests_seconds_bucket{uri=~".*participants.*", method="POST"}[30s]))` | 99번째 백분위 응답 시간 |
| 9 | Max Response Time | Time series | `http_server_requests_seconds_max{uri=~".*participants.*", method="POST"}` | 최대 응답 시간 |
| 10 | Error Count | Stat | `increase(http_server_requests_seconds_count{uri=~".*participants.*", status!~"2.."}[5m])` | 비정상 응답 누적 수 |

### Row 3: JVM Threads

스레드 상태 패턴 차이를 관찰한다.
- 비관적 락: `waiting` 스레드 증가 (DB 락 대기는 JVM에서 waiting으로 표시)
- 로컬락: `blocked` 스레드 증가 (ReentrantLock은 JVM의 monitor lock으로 blocked 표시)

| # | 패널 이름 | 타입 | PromQL | 설명 |
|---|----------|------|--------|------|
| 11 | Thread States | Time series (stacked) | `jvm_threads_states_threads` group by `state` | 모든 스레드 상태를 누적 그래프로 표시 |
| 12 | Live Threads | Stat | `jvm_threads_live_threads` | 현재 총 스레드 수 |

### Row 4: Summary (비교용 스냅샷)

| # | 패널 이름 | 타입 | PromQL | 설명 |
|---|----------|------|--------|------|
| 13 | Pool Utilization (%) | Gauge | `hikaricp_connections_active{pool="DialogHikariPool"} / hikaricp_connections_max{pool="DialogHikariPool"} * 100` | 커넥션 풀 사용률 |

---

## JSON 구현 가이드

### 대시보드 메타데이터

```json
{
  "dashboard": {
    "title": "Dialog - Lock Performance Comparison",
    "tags": ["dialog", "performance", "lock"],
    "timezone": "Asia/Seoul",
    "refresh": "5s",
    "time": {
      "from": "now-5m",
      "to": "now"
    }
  }
}
```

### 패널 공통 설정

- Time series 패널: `legend.displayMode: "list"`, `legend.placement: "bottom"`
- 단위:
  - 커넥션 수: `short`
  - 시간: `s` (seconds)
  - 비율: `percent` (0-100)
- 축소 해상도: `maxDataPoints: 100`

### Time range

- 기본 `Last 5 minutes` → 부하 테스트 1회 실행(40초)을 전체 볼 수 있는 범위
- Auto refresh `5s` → Prometheus scrape_interval과 동일

---

## 검증

```bash
# Phase 2의 모니터링 스택이 실행 중인 상태에서

# 1. Grafana 접근
open http://localhost:3000

# 2. "Dialog Performance" 폴더 > "Dialog - Lock Performance Comparison" 대시보드 클릭

# 3. 앱이 실행 중이면 HikariCP, JVM 메트릭이 실시간 표시되는지 확인

# 4. 패널이 모두 13개인지, Row가 4개인지 확인

# 5. 시간 범위를 "Last 5 minutes"로 설정 후 데이터가 보이는지 확인
```

---

## 비교 시 활용법

1. **Before 테스트 실행 후**: Grafana 시간 범위를 테스트 구간으로 설정 → 스크린샷 캡처
2. **After 테스트 실행 후**: 동일하게 캡처
3. 두 스크린샷을 나란히 놓고 비교

또는 Grafana의 **Annotations** 기능으로 Before/After 테스트 시작 시점을 마킹하면 같은 대시보드에서 시간 범위를 이동하며 비교 가능.
