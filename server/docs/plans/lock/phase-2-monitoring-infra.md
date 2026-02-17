# Phase 2: 모니터링 인프라 구축 (Prometheus + Grafana Docker)

> 생성일: 2026-02-17 | 상태: DRAFT

## 목적

Prometheus와 Grafana를 Docker Compose로 구성하여, Spring App이 수집하는 Micrometer 메트릭을 시각화할 수 있는 환경을 만든다.

---

## 디렉토리 구조

```
monitoring/
├── docker-compose.monitoring.yml
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasource.yml
        └── dashboards/
            ├── dashboard.yml
            └── dialog-performance.json   ← Phase 3에서 생성
```

---

## 작업 2-1: docker-compose.monitoring.yml

**파일**: `monitoring/docker-compose.monitoring.yml` (신규)

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: dialog-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:10.4.0
    container_name: dialog-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
```

### 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| `extra_hosts` | `host.docker.internal:host-gateway` | macOS Docker Desktop에서 호스트 머신(localhost)에 접근하기 위함. Spring App은 IDE에서 실행되므로 Docker 네트워크 밖에 있음 |
| `GF_AUTH_ANONYMOUS_ENABLED` | `true` | 개발 중 로그인 없이 대시보드 접근 가능하도록 |
| Volume `:ro` | 프로비저닝만 | 설정 파일은 읽기 전용, 데이터 볼륨은 쓰기 가능 |
| 기존 MySQL docker-compose와 분리 | 별도 파일 | 모니터링은 독립적으로 시작/중지할 수 있어야 함 |

---

## 작업 2-2: prometheus.yml

**파일**: `monitoring/prometheus/prometheus.yml` (신규)

```yaml
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'dialog-spring-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8080']
        labels:
          application: 'dialog-server'
```

### 설정 근거

| 설정 | 값 | 이유 |
|------|-----|------|
| `scrape_interval` | 5s | 부하 테스트(총 40초)에서 최소 8개 데이터 포인트를 확보하기 위함. 기본값 15s로는 2~3포인트밖에 안 됨 |
| `targets` | `host.docker.internal:8080` | Spring App이 호스트에서 실행되므로 Docker 내부에서 호스트에 접근하는 주소 |
| `metrics_path` | `/actuator/prometheus` | Spring Actuator + Micrometer Prometheus가 노출하는 기본 경로 |

---

## 작업 2-3: Grafana 데이터소스 프로비저닝

**파일**: `monitoring/grafana/provisioning/datasources/datasource.yml` (신규)

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### 포인트

- `url: http://prometheus:9090` → Grafana와 Prometheus가 같은 Docker Compose 네트워크에 있으므로 서비스명으로 접근
- `isDefault: true` → 대시보드에서 별도 데이터소스 지정 없이 바로 사용 가능

---

## 작업 2-4: Grafana 대시보드 프로비저닝

**파일**: `monitoring/grafana/provisioning/dashboards/dashboard.yml` (신규)

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: 'Dialog Performance'
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
      foldersFromFilesStructure: false
```

### 포인트

- `folder: 'Dialog Performance'` → Grafana에서 "Dialog Performance" 폴더 아래에 대시보드 자동 생성
- `path` → 컨테이너 내부 경로. `docker-compose.monitoring.yml`에서 `./grafana/provisioning`을 `/etc/grafana/provisioning`으로 마운트했으므로, 이 경로의 `.json` 파일이 자동 로드됨
- `dialog-performance.json`은 Phase 3에서 생성

---

## 검증

```bash
# 1. 모니터링 스택 시작
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d

# 2. Prometheus 상태 확인 (앱이 아직 안 떠 있으면 target은 DOWN 상태)
open http://localhost:9090/targets
# → "dialog-spring-app" job이 보여야 함

# 3. 앱 시작 후 Prometheus target 확인
# → State가 "UP"으로 변경

# 4. Grafana 접근 확인
open http://localhost:3000
# → 로그인 없이 접근 가능 (anonymous 활성화)
# → 좌측 메뉴 > Dashboards > "Dialog Performance" 폴더 존재 확인

# 5. Prometheus 데이터소스 연결 확인
# → Grafana > Connections > Data sources > Prometheus가 "Default" 표시

# 6. 정리
docker compose -f docker-compose.monitoring.yml down
# 볼륨 포함 정리: docker compose -f docker-compose.monitoring.yml down -v
```
