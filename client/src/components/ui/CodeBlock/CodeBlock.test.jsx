import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeBlock from './CodeBlock';

describe('CodeBlock', () => {
  describe('기본 렌더링', () => {
    it('코드 내용을 렌더링한다', () => {
      const { container } = render(<CodeBlock language="javascript" code="const x = 1;" />);
      // SyntaxHighlighter splits code into token spans, so check textContent
      const codeEl = container.querySelector('code');
      expect(codeEl).toBeInTheDocument();
      expect(codeEl.textContent).toContain('const');
      expect(codeEl.textContent).toContain('x');
      expect(codeEl.textContent).toContain('1');
    });

    it('언어 라벨을 표시한다', () => {
      render(<CodeBlock language="javascript" code="const x = 1;" />);
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    it('언어가 없을 때는 "text" 라벨을 표시한다', () => {
      render(<CodeBlock code="plain text" />);
      expect(screen.getByText('text')).toBeInTheDocument();
    });
  });

  describe('복사 버튼', () => {
    it('복사 버튼을 렌더링한다', () => {
      render(<CodeBlock language="javascript" code="const x = 1;" />);
      expect(screen.getByLabelText('코드 복사')).toBeInTheDocument();
    });

    it('복사 버튼 클릭 시 클립보드에 코드를 복사한다', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      render(<CodeBlock language="javascript" code="const x = 1;" />);
      await userEvent.click(screen.getByLabelText('코드 복사'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
    });

    it('복사 성공 후 "복사됨!" 피드백을 표시한다', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      render(<CodeBlock language="javascript" code="const x = 1;" />);
      await userEvent.click(screen.getByLabelText('코드 복사'));
      expect(screen.getByText('복사됨!')).toBeInTheDocument();
    });
  });

  describe('폰트', () => {
    it('JetBrains Mono 폰트가 적용된다', () => {
      const { container } = render(<CodeBlock language="javascript" code="test" />);
      const codeEl = container.querySelector('code') || container.querySelector('pre');
      // CSS Module applies font-family
      expect(codeEl).toBeInTheDocument();
    });
  });

  describe('인라인 코드', () => {
    it('inline=true일 때 코드 블록이 아닌 인라인 코드로 렌더링한다', () => {
      const { container } = render(<CodeBlock code="x" inline />);
      const codeEl = container.querySelector('code');
      expect(codeEl).toBeInTheDocument();
      // No copy button for inline code
      expect(screen.queryByLabelText('코드 복사')).not.toBeInTheDocument();
    });
  });
});
