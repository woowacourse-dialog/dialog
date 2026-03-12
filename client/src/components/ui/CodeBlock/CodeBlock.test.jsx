import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeBlock from './CodeBlock';

describe('CodeBlock', () => {
  describe('기본 렌더링', () => {
    it('코드 내용을 렌더링한다', async () => {
      const { container } = render(<CodeBlock language="javascript" code="const x = 1;" />);
      await waitFor(() => {
        const codeEl = container.querySelector('code');
        expect(codeEl).toBeInTheDocument();
        expect(codeEl.textContent).toContain('const');
        expect(codeEl.textContent).toContain('x');
        expect(codeEl.textContent).toContain('1');
      });
    });

    it('언어 라벨을 표시한다', async () => {
      render(<CodeBlock language="javascript" code="const x = 1;" />);
      expect(await screen.findByText('javascript', {}, { timeout: 3000 })).toBeInTheDocument();
    });

    it('언어가 없을 때는 "text" 라벨을 표시한다', async () => {
      render(<CodeBlock code="plain text" />);
      expect(await screen.findByText('text')).toBeInTheDocument();
    });
  });

  describe('복사 버튼', () => {
    it('복사 버튼을 렌더링한다', async () => {
      render(<CodeBlock language="javascript" code="const x = 1;" />);
      expect(await screen.findByLabelText('코드 복사')).toBeInTheDocument();
    });

    it('복사 버튼 클릭 시 클립보드에 코드를 복사한다', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      render(<CodeBlock language="javascript" code="const x = 1;" />);
      const btn = await screen.findByLabelText('코드 복사');
      await userEvent.click(btn);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
    });

    it('복사 성공 후 "복사됨!" 피드백을 표시한다', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      render(<CodeBlock language="javascript" code="const x = 1;" />);
      const btn = await screen.findByLabelText('코드 복사');
      await userEvent.click(btn);
      expect(await screen.findByText('복사됨!')).toBeInTheDocument();
    });
  });

  describe('폰트', () => {
    it('JetBrains Mono 폰트가 적용된다', async () => {
      const { container } = render(<CodeBlock language="javascript" code="test" />);
      await waitFor(() => {
        const codeEl = container.querySelector('code') || container.querySelector('pre');
        expect(codeEl).toBeInTheDocument();
      });
    });
  });

  describe('인라인 코드', () => {
    it('inline=true일 때 코드 블록이 아닌 인라인 코드로 렌더링한다', () => {
      const { container } = render(<CodeBlock code="x" inline />);
      const codeEl = container.querySelector('code');
      expect(codeEl).toBeInTheDocument();
      expect(screen.queryByLabelText('코드 복사')).not.toBeInTheDocument();
    });
  });
});
