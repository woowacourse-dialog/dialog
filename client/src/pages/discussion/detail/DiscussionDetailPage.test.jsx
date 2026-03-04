import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DiscussionDetailPage from './DiscussionDetailPage';

// Mock all API modules
vi.mock('../../../api/discussion', () => ({
  findDiscussionById: vi.fn(),
  deleteDiscussion: vi.fn(),
  participateDiscussion: vi.fn(),
  isParticipating: vi.fn(),
  getComments: vi.fn(),
  createComment: vi.fn(),
  generateDiscussionSummary: vi.fn(),
}));

vi.mock('../../../api/like', () => ({
  likeDiscussion: vi.fn(),
  deleteLikeDiscussion: vi.fn(),
  getLikeStatus: vi.fn(),
}));

vi.mock('../../../api/scrap', () => ({
  scrapDiscussion: vi.fn(),
  deleteScrapDiscussion: vi.fn(),
  getScrapStatus: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthContext: { Provider: ({ children }) => children },
}));

const renderPage = (id = '1') =>
  render(
    <MemoryRouter initialEntries={[`/discussion/${id}`]}>
      <Routes>
        <Route path="/discussion/:id" element={<DiscussionDetailPage />} />
        <Route path="/" element={<div>홈</div>} />
        <Route path="/discussion/:id/edit" element={<div>수정 페이지</div>} />
      </Routes>
    </MemoryRouter>
  );

const onlineDiscussion = {
  data: {
    id: 1,
    discussionType: 'ONLINE',
    commonDiscussionInfo: {
      title: 'React 토론',
      content: '본문입니다.',
      category: 'FRONTEND',
      likeCount: 5,
      summary: '',
      author: { id: 1, name: '작성자', profileImage: null },
    },
    onlineDiscussionInfo: { endDate: '2099-12-31' },
  },
};

describe('DiscussionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 중 Loading 표시', async () => {
    const { findDiscussionById } = await import('../../../api/discussion');
    const { useAuth } = await import('../../../context/AuthContext');
    findDiscussionById.mockReturnValue(new Promise(() => {}));
    useAuth.mockReturnValue({ currentUser: null });

    renderPage();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('토론 없음 → "토론을 찾을 수 없습니다" 표시', async () => {
    const { findDiscussionById } = await import('../../../api/discussion');
    const { useAuth } = await import('../../../context/AuthContext');
    findDiscussionById.mockRejectedValueOnce(new Error('Not found'));
    useAuth.mockReturnValue({ currentUser: null });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/토론을 찾을 수 없습니다/)).toBeInTheDocument();
    });
  });

  it('온라인 토론 → Header + Content + OnlineInfoCard + ActionBar + AISummary 조합', async () => {
    const { findDiscussionById } = await import('../../../api/discussion');
    const { getLikeStatus } = await import('../../../api/like');
    const { getScrapStatus } = await import('../../../api/scrap');
    const { useAuth } = await import('../../../context/AuthContext');

    findDiscussionById.mockResolvedValueOnce(onlineDiscussion);
    getLikeStatus.mockResolvedValueOnce({ data: { isLiked: false } });
    getScrapStatus.mockResolvedValueOnce({ data: { isScraped: false } });
    useAuth.mockReturnValue({ currentUser: { id: 1 } });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('React 토론')).toBeInTheDocument();
      expect(screen.getByText('종료일')).toBeInTheDocument();
    });
  });

  it('작성자 → 수정/삭제 버튼 표시', async () => {
    const { findDiscussionById } = await import('../../../api/discussion');
    const { getLikeStatus } = await import('../../../api/like');
    const { getScrapStatus } = await import('../../../api/scrap');
    const { useAuth } = await import('../../../context/AuthContext');

    findDiscussionById.mockResolvedValueOnce(onlineDiscussion);
    getLikeStatus.mockResolvedValueOnce({ data: { isLiked: false } });
    getScrapStatus.mockResolvedValueOnce({ data: { isScraped: false } });
    useAuth.mockReturnValue({ currentUser: { id: 1 } });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('수정')).toBeInTheDocument();
      expect(screen.getByText('삭제')).toBeInTheDocument();
    });
  });

  it('삭제 클릭 → ConfirmModal 표시 → 확인 시 DELETE API 호출', async () => {
    const { findDiscussionById, deleteDiscussion } = await import('../../../api/discussion');
    const { getLikeStatus } = await import('../../../api/like');
    const { getScrapStatus } = await import('../../../api/scrap');
    const { useAuth } = await import('../../../context/AuthContext');

    findDiscussionById.mockResolvedValueOnce(onlineDiscussion);
    getLikeStatus.mockResolvedValueOnce({ data: { isLiked: false } });
    getScrapStatus.mockResolvedValueOnce({ data: { isScraped: false } });
    deleteDiscussion.mockResolvedValueOnce({});
    useAuth.mockReturnValue({ currentUser: { id: 1 } });

    renderPage();
    await waitFor(() => screen.getByText('삭제'));
    await userEvent.click(screen.getByText('삭제'));
    // ConfirmModal opens
    await waitFor(() => {
      expect(screen.getByText('확인')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('확인'));
    expect(deleteDiscussion).toHaveBeenCalledWith('1');
  });

  it('수정 클릭 → /discussion/:id/edit 이동', async () => {
    const { findDiscussionById } = await import('../../../api/discussion');
    const { getLikeStatus } = await import('../../../api/like');
    const { getScrapStatus } = await import('../../../api/scrap');
    const { useAuth } = await import('../../../context/AuthContext');

    findDiscussionById.mockResolvedValueOnce(onlineDiscussion);
    getLikeStatus.mockResolvedValueOnce({ data: { isLiked: false } });
    getScrapStatus.mockResolvedValueOnce({ data: { isScraped: false } });
    useAuth.mockReturnValue({ currentUser: { id: 1 } });

    renderPage();
    await waitFor(() => screen.getByText('수정'));
    await userEvent.click(screen.getByText('수정'));
    expect(screen.getByText('수정 페이지')).toBeInTheDocument();
  });
});
