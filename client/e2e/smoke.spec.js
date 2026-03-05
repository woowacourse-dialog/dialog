import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Smoke Tests', () => {
  test('홈페이지가 로드된다 (비로그인)', async ({ guestPage }) => {
    await guestPage.goto('/');
    await expect(guestPage).toHaveURL('/');
    await expect(guestPage.locator('header')).toBeVisible();
  });

  test('회원가입 페이지가 로드된다', async ({ guestPage }) => {
    await guestPage.goto('/signup');
    await expect(guestPage.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });

  test('비로그인 시 GitHub 로그인 버튼이 표시된다', async ({ guestPage }) => {
    await guestPage.goto('/');
    await expect(guestPage.getByText('Sign in with GitHub')).toBeVisible();
  });

  test('로그인 시 로그아웃/마이페이지 버튼이 표시된다', async ({ authedPage }) => {
    await authedPage.goto('/');
    await expect(authedPage.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(authedPage.getByRole('button', { name: 'My Page' })).toBeVisible();
  });
});
