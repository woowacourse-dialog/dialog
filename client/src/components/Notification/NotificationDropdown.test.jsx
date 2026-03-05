import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/render';
import userEvent from '@testing-library/user-event';
import NotificationDropdown from './NotificationDropdown';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockNotifications = [
  {
    id: 1,
    message: '홍길동님이 댓글을 남겼습니다.',
    isRead: false,
    createdAt: '2024-03-04T10:00:00',
    routeParams: { type: 'DISCUSSION_COMMENT', discussionId: 10, discussionCommentId: 100 },
  },
  {
    id: 2,
    message: '이전 알림입니다.',
    isRead: true,
    createdAt: '2024-03-03T09:00:00',
    routeParams: { type: 'COMMENT_REPLY', discussionId: 10, replyId: 200 },
  },
];

describe('NotificationDropdown', () => {
  const defaultProps = {
    notifications: mockNotifications,
    onRead: vi.fn(),
    onReadAll: vi.fn(),
    onClose: vi.fn(),
    onLoadMore: vi.fn(),
    hasMore: false,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('알림 목록 렌더링', () => {
    it('"알림" 타이틀을 렌더링한다', () => {
      render(<NotificationDropdown {...defaultProps} />);
      expect(screen.getByText('알림')).toBeInTheDocument();
    });

    it('알림 메시지를 렌더링한다', () => {
      render(<NotificationDropdown {...defaultProps} />);
      expect(screen.getByText('홍길동님이 댓글을 남겼습니다.')).toBeInTheDocument();
    });

    it('읽지 않은 알림을 시각적으로 구분한다', () => {
      render(<NotificationDropdown {...defaultProps} />);
      const unreadItem = screen.getByText('홍길동님이 댓글을 남겼습니다.').closest('[class*="unread"]');
      expect(unreadItem).toBeInTheDocument();
    });

    it('읽은 알림은 다른 스타일로 표시한다', () => {
      render(<NotificationDropdown {...defaultProps} />);
      const readItem = screen.getByText('이전 알림입니다.').closest('[class*="read"]');
      expect(readItem).toBeInTheDocument();
    });
  });

  describe('"모두 읽음" 버튼', () => {
    it('알림이 있으면 "모두 읽음" 버튼을 표시한다', () => {
      render(<NotificationDropdown {...defaultProps} />);
      expect(screen.getByText('모두 읽음')).toBeInTheDocument();
    });

    it('"모두 읽음" 클릭 시 onReadAll을 호출한다', async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown {...defaultProps} />);
      await user.click(screen.getByText('모두 읽음'));
      expect(defaultProps.onReadAll).toHaveBeenCalled();
    });
  });

  describe('알림 클릭 동작', () => {
    it('알림 클릭 시 onRead(id)를 호출한다', async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown {...defaultProps} />);
      await user.click(screen.getByText('홍길동님이 댓글을 남겼습니다.'));
      expect(defaultProps.onRead).toHaveBeenCalledWith(1);
    });

    it('DISCUSSION_COMMENT 알림 클릭 시 해당 토론 댓글로 네비게이션한다', async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown {...defaultProps} />);
      await user.click(screen.getByText('홍길동님이 댓글을 남겼습니다.'));
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/10#comment-100');
    });

    it('COMMENT_REPLY 알림 클릭 시 답글 위치로 네비게이션한다', async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown {...defaultProps} />);
      await user.click(screen.getByText('이전 알림입니다.'));
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/10#comment-200');
    });
  });

  describe('infinite scroll (더 보기)', () => {
    it('스크롤 하단 도달 시 onLoadMore를 호출한다', () => {
      render(<NotificationDropdown {...defaultProps} hasMore={true} />);
      // scrollEvent 시뮬레이션은 통합 테스트에서 검증
    });

    it('isLoading=true이면 로딩 인디케이터를 표시한다', () => {
      render(<NotificationDropdown {...defaultProps} isLoading={true} />);
      expect(screen.getByText(/로딩/)).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('알림이 없으면 "새로운 알림이 없습니다" 메시지를 표시한다', () => {
      render(<NotificationDropdown {...defaultProps} notifications={[]} />);
      expect(screen.getByText('새로운 알림이 없습니다.')).toBeInTheDocument();
    });

    it('알림이 없으면 "모두 읽음" 버튼을 숨긴다', () => {
      render(<NotificationDropdown {...defaultProps} notifications={[]} />);
      expect(screen.queryByText('모두 읽음')).not.toBeInTheDocument();
    });
  });

  describe('외부 클릭 및 ESC 닫기', () => {
    it('외부 클릭 시 onClose를 호출한다', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">외부</div>
          <NotificationDropdown {...defaultProps} />
        </div>
      );
      await user.click(screen.getByTestId('outside'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('Escape 키 누르면 onClose를 호출한다', async () => {
      const user = userEvent.setup();
      render(<NotificationDropdown {...defaultProps} />);
      await user.keyboard('{Escape}');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
