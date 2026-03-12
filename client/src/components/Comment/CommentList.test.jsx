import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/render';
import userEvent from '@testing-library/user-event';
import CommentList from './CommentList';

vi.mock('../../api/discussion', () => ({
  getComments: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthContext: { Provider: ({ children }) => children },
}));

// Mock MarkdownRender to just render text
vi.mock('../Markdown/MarkdownRender', () => ({
  default: ({ content }) => <div data-testid="markdown-render">{content}</div>,
}));

// Mock MarkdownEditor to render a simple textarea
vi.mock('../MarkdownEditor/MarkdownEditor', () => ({
  default: ({ value, onChange, placeholder }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

import { useAuth } from '../../context/AuthContext';
import { getComments, createComment } from '../../api/discussion';

const mockComments = [
  {
    discussionCommentId: 1,
    content: '첫 번째 댓글',
    createdAt: '2025-01-01T12:00:00',
    modifiedAt: '2025-01-01T12:00:00',
    author: { authorId: 1, nickname: '홍길동', profileImage: null },
    childComments: [
      {
        discussionCommentId: 2,
        content: '답글입니다',
        createdAt: '2025-01-01T13:00:00',
        modifiedAt: '2025-01-01T13:00:00',
        author: { authorId: 2, nickname: '이영희', profileImage: null },
        childComments: [],
      },
    ],
  },
  {
    discussionCommentId: 3,
    content: '두 번째 댓글',
    createdAt: '2025-01-02T12:00:00',
    modifiedAt: '2025-01-02T12:00:00',
    author: { authorId: 3, nickname: '박민수', profileImage: null },
    childComments: [],
  },
];

const renderWithRouter = (ui, { hash = '' } = {}) =>
  render(ui, { route: `/discussion/1${hash}` });

describe('CommentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('댓글 수 표시', () => {
    it('전체 댓글 수를 헤더에 표시한다 (부모 + 자식)', async () => {
      getComments.mockResolvedValueOnce(mockComments);
      useAuth.mockReturnValue({ currentUser: null });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => {
        // 부모 2개 + 답글 1개 = 3개
        expect(screen.getByText(/댓글 3개/)).toBeInTheDocument();
      });
    });
  });

  describe('로그인 / 비로그인 분기', () => {
    it('로그인 시 상단 CommentForm을 표시한다', async () => {
      getComments.mockResolvedValueOnce(mockComments);
      useAuth.mockReturnValue({ currentUser: { id: 1 } });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/댓글을 작성/)).toBeInTheDocument();
      });
    });

    it('비로그인 시 "댓글을 작성하려면 로그인이 필요합니다"를 표시한다', async () => {
      getComments.mockResolvedValueOnce(mockComments);
      useAuth.mockReturnValue({ currentUser: null });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => {
        expect(screen.getByText(/로그인이 필요합니다/)).toBeInTheDocument();
      });
    });
  });

  describe('댓글 트리 구조 렌더링', () => {
    it('부모 댓글과 자식 댓글을 트리 구조로 렌더링한다', async () => {
      getComments.mockResolvedValueOnce(mockComments);
      useAuth.mockReturnValue({ currentUser: null });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => {
        expect(screen.getByText('첫 번째 댓글')).toBeInTheDocument();
        expect(screen.getByText('답글입니다')).toBeInTheDocument();
        expect(screen.getByText('두 번째 댓글')).toBeInTheDocument();
      });
    });
  });

  describe('댓글 작성 후 목록 갱신', () => {
    it('댓글 작성 성공 시 목록을 재조회한다', async () => {
      getComments.mockResolvedValue(mockComments);
      createComment.mockResolvedValueOnce({});
      useAuth.mockReturnValue({ currentUser: { id: 1 } });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => screen.getByPlaceholderText(/댓글을 작성/));

      const textarea = screen.getByPlaceholderText(/댓글을 작성/);
      await userEvent.type(textarea, '새 댓글');
      await userEvent.click(screen.getByRole('button', { name: '댓글 등록' }));

      expect(createComment).toHaveBeenCalledWith({
        content: '새 댓글',
        discussionId: 1,
        parentDiscussionCommentId: null,
      });
      // refreshTrigger 증가로 getComments 재호출
      await waitFor(() => {
        expect(getComments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('빈 댓글 목록', () => {
    it('댓글이 없을 때 안내 메시지를 표시한다', async () => {
      getComments.mockResolvedValueOnce([]);
      useAuth.mockReturnValue({ currentUser: null });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => {
        expect(screen.getByText(/아직 댓글이 없습니다/)).toBeInTheDocument();
      });
    });
  });

  describe('URL 해시 스크롤', () => {
    it('URL에 #comment-1이 있으면 해당 댓글로 스크롤한다', async () => {
      getComments.mockResolvedValueOnce(mockComments);
      useAuth.mockReturnValue({ currentUser: null });

      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;

      renderWithRouter(
        <CommentList discussionId={1} />,
        { hash: '#comment-1' }
      );

      await waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      });
    });
  });

  describe('에러 처리', () => {
    it('API 에러 시 에러 메시지와 재시도 버튼을 표시한다', async () => {
      getComments.mockRejectedValueOnce(new Error('Network error'));
      useAuth.mockReturnValue({ currentUser: null });

      renderWithRouter(<CommentList discussionId={1} />);
      await waitFor(() => {
        expect(screen.getByText(/댓글을 불러오는데 실패/)).toBeInTheDocument();
        expect(screen.getByText('다시 시도')).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중 "댓글을 불러오는 중..." 표시', () => {
      getComments.mockReturnValue(new Promise(() => {}));
      useAuth.mockReturnValue({ currentUser: null });

      renderWithRouter(<CommentList discussionId={1} />);
      expect(screen.getByText(/불러오는 중/)).toBeInTheDocument();
    });
  });
});
