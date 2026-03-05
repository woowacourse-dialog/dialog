import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnlineInfoCard from './OnlineInfoCard';

describe('OnlineInfoCard', () => {
  it('마감일을 표시한다', () => {
    render(<OnlineInfoCard endDate="2025-12-31" />);
    expect(screen.getByText('2025-12-31')).toBeInTheDocument();
  });

  it('"종료일" 라벨을 표시한다', () => {
    render(<OnlineInfoCard endDate="2025-12-31" />);
    expect(screen.getByText('종료일')).toBeInTheDocument();
  });

  it('캘린더 아이콘을 렌더링한다', () => {
    const { container } = render(<OnlineInfoCard endDate="2025-12-31" />);
    // lucide-react Calendar 아이콘이 SVG로 렌더링됨
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
