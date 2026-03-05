import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiscussionContent from './DiscussionContent';

describe('DiscussionContent', () => {
  it('마크다운 본문을 렌더링한다', () => {
    render(<DiscussionContent content={`## 제목\n\n본문 내용입니다.`} />);
    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByText('본문 내용입니다.')).toBeInTheDocument();
  });

  it('빈 내용일 때 빈 영역을 렌더링한다', () => {
    const { container } = render(<DiscussionContent content="" />);
    expect(container.querySelector('[class*="content"]')).toBeInTheDocument();
  });

  it('코드 블록을 렌더링한다', () => {
    const code = `\`\`\`javascript\nconst x = 1;\n\`\`\``;
    const { container } = render(<DiscussionContent content={code} />);
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(container.textContent).toContain('const');
    expect(container.textContent).toContain('1');
  });

  it('리스트를 렌더링한다', () => {
    render(<DiscussionContent content={`- 항목 1\n- 항목 2\n- 항목 3`} />);
    expect(screen.getByText('항목 1')).toBeInTheDocument();
    expect(screen.getByText('항목 2')).toBeInTheDocument();
  });
});
