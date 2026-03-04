import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/render';
import userEvent from '@testing-library/user-event';
import CommentItem from './CommentItem';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthContext: { Provider: ({ children }) => children },
}));

vi.mock('../../api/discussion', () => ({
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
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
import { updateComment, deleteComment } from '../../api/discussion';

const baseComment = {
  discussionCommentId: 1,
  content: '테스트 댓글입니다.',
  createdAt: '2025-01-01T12:00:00',
  modifiedAt: '2025-01-01T12:00:00',
  author: {
    authorId: 1,
    nickname: '홍길동',
    profileImage: { basicImageUri: '/avatar.png', customImageUri: null },
  },
  childComments: [],
};

describe('CommentItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('아바타 + 닉네임 + 날짜 + 댓글 본문을 렌더링한다', () => {
      useAuth.mockReturnValue({ currentUser: null });

      render(<CommentItem comment={baseComment} onReply={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('테스트 댓글입니다.')).toBeInTheDocument();
      expect(screen.getByAltText('홍길동')).toBeInTheDocument();
    });

    it('수정됨 표시 (createdAt !== modifiedAt)', () => {
      useAuth.mockReturnValue({ currentUser: null });

      const modifiedComment = {
        ...baseComment,
        modifiedAt: '2025-01-02T12:00:00',
      };
      render(<CommentItem comment={modifiedComment} onReply={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('(수정됨)')).toBeInTheDocument();
    });

    it('수정되지 않았으면 수정됨 표시 없음', () => {
      useAuth.mockReturnValue({ currentUser: null });

      render(<CommentItem comment={baseComment} onReply={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.queryByText('(수정됨)')).not.toBeInTheDocument();
    });
  });

  describe('본인 댓글 액션', () => {
    it('본인 댓글일 때 수정/삭제 버튼을 표시한다', () => {
      useAuth.mockReturnValue({ currentUser: { id: 1 } });

      render(<CommentItem comment={baseComment} onReply={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('수정')).toBeInTheDocument();
      expect(screen.getByText('삭제')).toBeInTheDocument();
    });

    it('타인 댓글일 때 수정/삭제 버튼을 숨긴다', () => {
      useAuth.mockReturnValue({ currentUser: { id: 999 } });

      render(<CommentItem comment={baseComment} onReply={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.queryByText('수정')).not.toBeInTheDocument();
      expect(screen.queryByText('삭제')).not.toBeInTheDocument();
    });

    it('수정 클릭 시 인라인 CommentForm으로 전환', async () => {
      useAuth.mockReturnValue({ currentUser: { id: 1 } });

      render(<CommentItem comment={baseComment} onReply={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      await userEvent.click(screen.getByText('수정'));
      // 수정 모드에서는 textarea에 기존 값이 설정됨
      expect(screen.getByDisplayValue('테스트 댓글입니다.')).toBeInTheDocument();
    });

    it('삭제 클릭 시 ConfirmModal 표시 후 확인하면 deleteComment API 호출', async () => {
      useAuth.mockReturnValue({ currentUser: { id: 1 } });
      deleteComment.mockResolvedValueOnce({});
      const onDelete = vi.fn();

      render(
        <CommentItem
          comment={baseComment}
          onReply={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={onDelete}
        />
      );
      await userEvent.click(screen.getByText('삭제'));
      // ConfirmModal이 열림
      await userEvent.click(screen.getByText('확인'));

      expect(deleteComment).toHaveBeenCalledWith(1);
      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('답글 시스템', () => {
    it('depth=0 + 로그인 시 "답글쓰기" 버튼을 표시한다', () => {
      useAuth.mockReturnValue({ currentUser: { id: 999 } });

      render(
        <CommentItem
          comment={baseComment}
          depth={0}
          onReply={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByText('답글쓰기')).toBeInTheDocument();
    });

    it('depth > 0일 때 "답글쓰기" 버튼을 숨긴다', () => {
      useAuth.mockReturnValue({ currentUser: { id: 999 } });

      render(
        <CommentItem
          comment={baseComment}
          depth={1}
          onReply={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.queryByText('답글쓰기')).not.toBeInTheDocument();
    });

    it('비로그인 시 "답글쓰기" 버튼을 숨긴다', () => {
      useAuth.mockReturnValue({ currentUser: null });

      render(
        <CommentItem
          comment={baseComment}
          depth={0}
          onReply={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.queryByText('답글쓰기')).not.toBeInTheDocument();
    });

    it('답글쓰기 클릭 시 인라인 답글 폼 표시', async () => {
      useAuth.mockReturnValue({ currentUser: { id: 999 } });

      render(
        <CommentItem
          comment={baseComment}
          depth={0}
          onReply={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      await userEvent.click(screen.getByText('답글쓰기'));
      expect(screen.getByPlaceholderText(/답글을 작성/)).toBeInTheDocument();
    });
  });

  describe('답글 목록 (childComments) 렌더링', () => {
    it('자식 댓글이 있으면 들여쓰기하여 렌더링한다', () => {
      useAuth.mockReturnValue({ currentUser: null });

      const commentWithReplies = {
        ...baseComment,
        childComments: [
          {
            ...baseComment,
            discussionCommentId: 2,
            content: '답글입니다.',
            author: { authorId: 2, nickname: '이영희', profileImage: null },
            childComments: [],
          },
        ],
      };

      render(
        <CommentItem
          comment={commentWithReplies}
          depth={0}
          onReply={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByText('답글입니다.')).toBeInTheDocument();
      expect(screen.getByText('이영희')).toBeInTheDocument();
    });
  });
});
