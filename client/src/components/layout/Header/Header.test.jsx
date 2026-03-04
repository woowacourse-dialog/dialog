import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Header from './Header';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthContext: { Provider: ({ children }) => children },
}));

vi.mock('../../../hooks/useNotificationPolling', () => ({
  default: vi.fn(() => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    loadMore: vi.fn(),
    hasMore: false,
    isLoading: false,
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useAuth } from '../../../context/AuthContext';
import useNotificationPolling from '../../../hooks/useNotificationPolling';

describe('Header', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('비로그인 상태', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isLoggedIn: false,
        currentUser: null,
        logout: vi.fn(),
      });
      useNotificationPolling.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        loadMore: vi.fn(),
        hasMore: false,
        isLoading: false,
      });
    });

    it('로고 이미지와 "Dialog" 텍스트를 렌더링한다', () => {
      render(<Header />);
      expect(screen.getByAltText('Dialog Logo')).toBeInTheDocument();
      expect(screen.getByText('Dialog')).toBeInTheDocument();
    });

    it('로고 클릭 시 "/"로 네비게이션한다', () => {
      render(<Header />);
      const logo = screen.getByText('Dialog').closest('a');
      expect(logo).toHaveAttribute('href', '/');
    });

    it('"GitHub로 로그인" 버튼을 렌더링한다', () => {
      render(<Header />);
      expect(screen.getByText('GitHub로 로그인')).toBeInTheDocument();
    });

    it('GitHub 로그인 버튼 클릭 시 OAuth URL로 리다이렉트한다', async () => {
      const user = userEvent.setup();
      delete window.location;
      window.location = { href: '' };

      render(<Header />);
      await user.click(screen.getByText('GitHub로 로그인'));
      expect(window.location.href).toContain('oauth2/authorization/github');
    });

    it('알림 벨 아이콘을 렌더링하지 않는다', () => {
      render(<Header />);
      expect(screen.queryByLabelText('알림')).not.toBeInTheDocument();
    });

    it('아바타를 렌더링하지 않는다', () => {
      render(<Header />);
      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
    });
  });

  describe('로그인 상태', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
      mockLogout.mockClear();
      useAuth.mockReturnValue({
        isLoggedIn: true,
        currentUser: { nickname: '김개발', profileImage: null },
        logout: mockLogout,
      });
      useNotificationPolling.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        loadMore: vi.fn(),
        hasMore: false,
        isLoading: false,
      });
    });

    it('알림 벨 아이콘을 렌더링한다', () => {
      render(<Header />);
      expect(screen.getByLabelText('알림')).toBeInTheDocument();
    });

    it('사용자 아바타를 렌더링한다', () => {
      render(<Header />);
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    });

    it('GitHub 로그인 버튼을 렌더링하지 않는다', () => {
      render(<Header />);
      expect(screen.queryByText('GitHub로 로그인')).not.toBeInTheDocument();
    });

    it('읽지 않은 알림이 있으면 배지를 표시한다', () => {
      useNotificationPolling.mockReturnValue({
        notifications: [],
        unreadCount: 5,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        loadMore: vi.fn(),
        hasMore: false,
        isLoading: false,
      });
      render(<Header />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('읽지 않은 알림이 99개 초과면 "99+"를 표시한다', () => {
      useNotificationPolling.mockReturnValue({
        notifications: [],
        unreadCount: 150,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        loadMore: vi.fn(),
        hasMore: false,
        isLoading: false,
      });
      render(<Header />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('벨 아이콘 클릭 시 알림 드롭다운 영역을 토글한다', async () => {
      const user = userEvent.setup();
      render(<Header />);

      // Initially no dropdown
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();

      // Click bell to show
      await user.click(screen.getByLabelText('알림'));
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    it('아바타 클릭 시 ProfileDropdown을 토글한다', async () => {
      const user = userEvent.setup();
      render(<Header />);

      // Initially no dropdown
      expect(screen.queryByText('마이페이지')).not.toBeInTheDocument();

      // Click avatar to show
      await user.click(screen.getByTestId('user-avatar'));
      expect(screen.getByText('마이페이지')).toBeInTheDocument();
    });
  });
});
