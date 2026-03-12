import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentForm from './CommentForm';

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

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('작성 모드', () => {
    it('텍스트 입력 영역을 렌더링한다', () => {
      render(<CommentForm onSave={vi.fn()} />);
      expect(screen.getByPlaceholderText(/댓글을 작성/)).toBeInTheDocument();
    });

    it('"작성" 버튼을 렌더링한다', () => {
      render(<CommentForm onSave={vi.fn()} submitText="작성" />);
      expect(screen.getByRole('button', { name: '작성' })).toBeInTheDocument();
    });

    it('내용이 비어있으면 등록 버튼이 disabled', () => {
      render(<CommentForm onSave={vi.fn()} />);
      expect(screen.getByRole('button', { name: '작성' })).toBeDisabled();
    });

    it('내용 입력 후 등록 버튼이 enabled', async () => {
      render(<CommentForm onSave={vi.fn()} />);
      const textarea = screen.getByPlaceholderText(/댓글을 작성/);
      await userEvent.type(textarea, '테스트 댓글');
      expect(screen.getByRole('button', { name: '작성' })).not.toBeDisabled();
    });

    it('등록 클릭 시 onSave를 호출한다', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<CommentForm onSave={onSave} submitText="작성" />);
      const textarea = screen.getByPlaceholderText(/댓글을 작성/);
      await userEvent.type(textarea, '테스트 댓글');
      await userEvent.click(screen.getByRole('button', { name: '작성' }));
      expect(onSave).toHaveBeenCalledWith('테스트 댓글');
    });

    it('등록 성공 후 입력 영역이 초기화된다', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<CommentForm onSave={onSave} />);
      const textarea = screen.getByPlaceholderText(/댓글을 작성/);
      await userEvent.type(textarea, '테스트 댓글');
      await userEvent.click(screen.getByRole('button', { name: '작성' }));
      expect(textarea).toHaveValue('');
    });
  });

  describe('수정 모드', () => {
    it('기존 내용이 채워진다', () => {
      render(
        <CommentForm
          initialContent="기존 댓글"
          onSave={vi.fn()}
          onCancel={vi.fn()}
          submitText="수정"
        />
      );
      expect(screen.getByDisplayValue('기존 댓글')).toBeInTheDocument();
    });

    it('"수정" 버튼과 "취소" 버튼을 렌더링한다', () => {
      render(
        <CommentForm
          initialContent="기존 댓글"
          onSave={vi.fn()}
          onCancel={vi.fn()}
          submitText="수정"
        />
      );
      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('취소 클릭 시 onCancel을 호출한다', async () => {
      const onCancel = vi.fn();
      render(
        <CommentForm
          initialContent="기존 댓글"
          onSave={vi.fn()}
          onCancel={onCancel}
          submitText="수정"
        />
      );
      await userEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(onCancel).toHaveBeenCalled();
    });

    it('취소 클릭 시 내용이 원래 값으로 복원된다', async () => {
      render(
        <CommentForm
          initialContent="기존 댓글"
          onSave={vi.fn()}
          onCancel={vi.fn()}
          submitText="수정"
        />
      );
      const textarea = screen.getByDisplayValue('기존 댓글');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, '수정된 내용');
      await userEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(screen.getByDisplayValue('기존 댓글')).toBeInTheDocument();
    });
  });

  describe('제출 중 상태', () => {
    it('제출 중에는 "작성 중..." 표시 + disabled', async () => {
      const onSave = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
      render(<CommentForm onSave={onSave} submitText="작성" />);
      const textarea = screen.getByPlaceholderText(/댓글을 작성/);
      await userEvent.type(textarea, '테스트');
      await userEvent.click(screen.getByRole('button', { name: '작성' }));
      expect(screen.getByText('작성 중...')).toBeInTheDocument();
    });
  });
});
