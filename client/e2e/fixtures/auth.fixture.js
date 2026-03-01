import { test as base } from '@playwright/test';
import {
  mockLoggedIn,
  mockLoggedOut,
  blockFirebase,
  mockDiscussions,
  mockNotifications,
} from '../helpers/api-mocks.js';

/**
 * 인증 상태별 page fixture를 제공한다.
 *
 * - authedPage: 로그인된 사용자 (login/check → true, user/mine → mock user)
 * - guestPage: 비로그인 사용자 (login/check → false)
 *
 * 두 fixture 모두 Firebase 관련 요청을 차단한다.
 */
export const test = base.extend({
  authedPage: async ({ page }, use) => {
    await blockFirebase(page);
    await mockLoggedIn(page);
    await mockDiscussions(page);
    await mockNotifications(page);
    await use(page);
  },

  guestPage: async ({ page }, use) => {
    await blockFirebase(page);
    await mockLoggedOut(page);
    await mockDiscussions(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
