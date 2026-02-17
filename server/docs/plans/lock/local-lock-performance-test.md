# 로컬락 도입 성능 비교를 위한 모니터링 + 부하 테스트 환경 구축

> 생성일: 2026-02-17 | 상태: DRAFT

## Context

현재 토론 참여 로직(`POST /api/discussions/{discussionId}/participants`)은 DB 비관적 락(`SELECT ... FOR UPDATE`)을 사용 중이다. 이를 애플리케이션 레벨 로컬락(ReentrantLock)으로 교체하기 위한 근거 수집이 필요하다.

**목표**: Prometheus + Grafana로 메트릭을 시각화하고, k6로 동일한 부하를 걸어서 비관적 락 vs 로컬락의 성능 차이를 정량적으로 비교한다.

---

## Phase 구성

| Phase | 파일 | 내용 | 생성/수정 파일 수 |
|-------|------|------|-----------------|
| [Phase 1](./phase-1-spring-config.md) | Spring 설정 변경 | application-local.yml 수정 + LoadTestAuthFilter 생성 | 2 |
| [Phase 2](./phase-2-monitoring-infra.md) | 모니터링 인프라 | Docker Compose + Prometheus + Grafana provisioning | 4 |
| [Phase 3](./phase-3-grafana-dashboard.md) | Grafana 대시보드 | 13개 패널의 성능 비교 대시보드 JSON | 1 |
| [Phase 4](./phase-4-k6-load-test.md) | k6 부하 테스트 | 부하 테스트 스크립트 + 테스트 데이터 SQL | 2 |
| [Phase 5](./phase-5-execution-guide.md) | 실행 가이드 | Before/After 비교 실행 순서 + 결과 비교 기준 | 0 (가이드) |

---

## 아키텍처

```
[k6 (host)] --> POST :8080 --> [Spring App (host, IDE)]
                                       |
                                 [MySQL (Docker :3306)]

[Prometheus (Docker :9090)] --> scrape :8080/actuator/prometheus
[Grafana (Docker :3000)]    --> query Prometheus
```

---

## 전체 파일 변경/생성 목록

### 수정 (1개)
- `src/main/resources/application-local.yml`

### 생성 (8개)
- `src/main/java/com/dialog/server/config/LoadTestAuthFilter.java`
- `monitoring/docker-compose.monitoring.yml`
- `monitoring/prometheus/prometheus.yml`
- `monitoring/grafana/provisioning/datasources/datasource.yml`
- `monitoring/grafana/provisioning/dashboards/dashboard.yml`
- `monitoring/grafana/provisioning/dashboards/dialog-performance.json`
- `monitoring/k6/load-test-participation.js`
- `monitoring/k6/setup-test-data.sql`

---

## 측정 핵심 지표

| 지표 | 의미 | 기대 변화 (로컬락 도입 후) |
|------|------|--------------------------|
| `hikaricp_connections_usage_seconds` | 커넥션 점유 시간 | 감소 (핵심 근거) |
| `hikaricp_connections_pending` | 커넥션 대기 스레드 | 감소 |
| `http_server_requests_seconds` p95 | 응답 시간 | 감소 가능 |
| `jvm_threads_states{state="blocked"}` | JVM blocked 스레드 | 증가 (예상된 변화) |
