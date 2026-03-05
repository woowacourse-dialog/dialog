import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor', () => {
  describe('기본 렌더링', () => {
    it('텍스트 입력 영역을 렌더링한다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('placeholder를 표시한다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} placeholder="내용을 입력하세요" />);
      expect(screen.getByPlaceholderText('내용을 입력하세요')).toBeInTheDocument();
    });

    it('기본 placeholder를 표시한다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      expect(screen.getByPlaceholderText(/마크다운 형식/)).toBeInTheDocument();
    });
  });

  describe('3가지 탭 전환', () => {
    it('작성 / 미리보기 / 분할 3개 탭을 렌더링한다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      expect(screen.getByText('작성')).toBeInTheDocument();
      expect(screen.getByText('미리보기')).toBeInTheDocument();
      expect(screen.getByText('분할')).toBeInTheDocument();
    });

    it('초기 상태에서 작성 탭이 활성화된다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('미리보기 탭 클릭 시 textarea가 숨겨진다', async () => {
      render(<MarkdownEditor value="# 테스트" onChange={vi.fn()} />);
      await userEvent.click(screen.getByText('미리보기'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('테스트')).toBeInTheDocument();
    });

    it('분할 탭 클릭 시 textarea와 미리보기가 동시에 표시된다', async () => {
      render(<MarkdownEditor value="# 테스트" onChange={vi.fn()} />);
      await userEvent.click(screen.getByText('분할'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('테스트')).toBeInTheDocument();
    });
  });

  describe('텍스트 입력', () => {
    it('텍스트 입력 시 onChange가 호출된다', async () => {
      const onChange = vi.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello');
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('툴바 버튼', () => {
    it('8개 툴바 버튼을 렌더링한다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      const toolbarBtns = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('img')
      );
      expect(toolbarBtns).toHaveLength(8);
    });

    it('각 버튼에 title 속성이 있다', () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      expect(screen.getByTitle(/굵게/)).toBeInTheDocument();
      expect(screen.getByTitle(/기울임/)).toBeInTheDocument();
      expect(screen.getByTitle(/인라인 코드/)).toBeInTheDocument();
      expect(screen.getByTitle(/코드 블록/)).toBeInTheDocument();
      expect(screen.getByTitle(/불릿 리스트/)).toBeInTheDocument();
      expect(screen.getByTitle(/번호 리스트/)).toBeInTheDocument();
      expect(screen.getByTitle(/인용문/)).toBeInTheDocument();
      expect(screen.getByTitle(/링크/)).toBeInTheDocument();
    });
  });

  describe('단축키 동작', () => {
    it('Ctrl+B → 선택 텍스트를 볼드 처리한다', async () => {
      const onChange = vi.fn();
      render(<MarkdownEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox');

      // Simulate text selection
      textarea.focus();
      textarea.setSelectionRange(0, 5); // "hello"
      await userEvent.keyboard('{Control>}b{/Control}');

      expect(onChange).toHaveBeenCalled();
    });

    it('Ctrl+I → 선택 텍스트를 이탤릭 처리한다', async () => {
      const onChange = vi.fn();
      render(<MarkdownEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      textarea.setSelectionRange(0, 5);
      await userEvent.keyboard('{Control>}i{/Control}');

      expect(onChange).toHaveBeenCalled();
    });

    it('Ctrl+K → 링크 삽입', async () => {
      const onChange = vi.fn();
      render(<MarkdownEditor value="hello" onChange={onChange} />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      textarea.setSelectionRange(0, 5);
      await userEvent.keyboard('{Control>}k{/Control}');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('미리보기 영역', () => {
    it('미리보기 탭에서 마크다운을 렌더링한다', async () => {
      const mdContent = '## 제목\n\n- 항목 1\n- 항목 2';
      render(<MarkdownEditor value={mdContent} onChange={vi.fn()} />);
      await userEvent.click(screen.getByText('미리보기'));
      expect(await screen.findByText('제목')).toBeInTheDocument();
      expect(screen.getByText('항목 1')).toBeInTheDocument();
      expect(screen.getByText('항목 2')).toBeInTheDocument();
    });

    it('빈 내용일 때 안내 텍스트를 표시한다', async () => {
      render(<MarkdownEditor value="" onChange={vi.fn()} />);
      await userEvent.click(screen.getByText('미리보기'));
      expect(screen.getByText('내용을 입력해주세요.')).toBeInTheDocument();
    });

    it('분할 모드에서 텍스트 영역과 미리보기가 나란히 표시된다', async () => {
      const { container } = render(<MarkdownEditor value="# 테스트" onChange={vi.fn()} />);
      await userEvent.click(screen.getByText('분할'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('테스트')).toBeInTheDocument();
      // split class is applied for grid layout
      const contentEl = container.querySelector('[class*="contentSplit"]') ||
                        container.querySelector('[class*="split"]');
      expect(contentEl).toBeInTheDocument();
    });
  });
});
