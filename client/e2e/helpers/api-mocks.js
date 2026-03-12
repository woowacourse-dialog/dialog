/**
 * API 모킹 헬퍼
 *
 * AuthContext가 마운트 시 /api/login/check → /api/user/mine 순으로 호출하고,
 * authLoading이 false가 될 때까지 children을 렌더링하지 않으므로
 * 이 API들을 반드시 모킹해야 페이지가 로드된다.
 */

const MOCK_USER = {
  id: 1,
  nickname: 'testuser',
  profileImageUrl: 'https://example.com/avatar.png',
  role: 'USER',
};

/**
 * 로그인된 사용자 상태를 모킹한다.
 * - GET /api/login/check → { data: { isLoggedIn: true } }
 * - GET /api/user/mine → { data: MOCK_USER }
 */
export async function mockLoggedIn(page, user = MOCK_USER) {
  await page.route('**/api/login/check', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { isLoggedIn: true } }),
    }),
  );

  await page.route('**/api/user/mine', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: user }),
    }),
  );
}

/**
 * 비로그인 사용자 상태를 모킹한다.
 * - GET /api/login/check → { data: { isLoggedIn: false } }
 */
export async function mockLoggedOut(page) {
  await page.route('**/api/login/check', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { isLoggedIn: false } }),
    }),
  );
}

/**
 * Firebase/FCM 관련 요청을 차단한다.
 * service worker 등록과 FCM 토큰 전송을 무시한다.
 */
export async function blockFirebase(page) {
  await page.route('**/firebase-messaging-sw.js', (route) => route.abort());
  await page.route('**/api/fcm-tokens', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null }),
    }),
  );
}

/**
 * 토론 목록 API를 모킹한다.
 */
export async function mockDiscussions(page, discussions = []) {
  await page.route('**/api/discussions?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          content: discussions,
          totalPages: 1,
          totalElements: discussions.length,
          number: 0,
          size: 10,
        },
      }),
    }),
  );
}

/**
 * 알림 관련 API를 모킹한다.
 */
export async function mockNotifications(page) {
  await page.route('**/api/notifications/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }),
  );

  await page.route('**/api/notifications*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          content: [],
          totalPages: 0,
          totalElements: 0,
          number: 0,
          size: 10,
        },
      }),
    }),
  );
}

export { MOCK_USER };
