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
