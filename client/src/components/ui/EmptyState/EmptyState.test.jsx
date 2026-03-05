import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  describe('기본 렌더링', () => {
    it('메시지 텍스트를 렌더링한다', () => {
      render(<EmptyState message="데이터가 없습니다" />);
      expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
    });
    it('emptyState 클래스를 적용한다', () => {
      const { container } = render(<EmptyState message="데이터가 없습니다" />);
      expect(container.firstChild).toHaveClass('emptyState');
    });
  });

  describe('아이콘', () => {
    it('icon prop이 있으면 아이콘을 렌더링한다', () => {
      render(<EmptyState message="없음" icon={<span data-testid="icon">📭</span>} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
    it('icon prop이 없으면 기본 아이콘을 렌더링하지 않는다', () => {
      const { container } = render(<EmptyState message="없음" />);
      expect(container.querySelector('[class*="icon"]')).not.toBeInTheDocument();
    });
  });

  describe('제목', () => {
    it('title prop이 있으면 제목을 렌더링한다', () => {
      render(<EmptyState message="없음" title="비어있음" />);
      expect(screen.getByText('비어있음')).toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('actionLabel prop이 있으면 버튼을 렌더링한다', () => {
      render(<EmptyState message="없음" actionLabel="새로 만들기" onAction={() => {}} />);
      expect(screen.getByRole('button', { name: '새로 만들기' })).toBeInTheDocument();
    });
    it('버튼 클릭 시 onAction을 호출한다', async () => {
      const handleAction = vi.fn();
      render(<EmptyState message="없음" actionLabel="새로 만들기" onAction={handleAction} />);
      await userEvent.click(screen.getByRole('button', { name: '새로 만들기' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
    it('actionLabel이 없으면 버튼을 렌더링하지 않는다', () => {
      render(<EmptyState message="없음" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('부제목', () => {
    it('description prop으로 부가 설명을 표시한다', () => {
      render(<EmptyState message="없음" description="나중에 다시 확인해주세요" />);
      expect(screen.getByText('나중에 다시 확인해주세요')).toBeInTheDocument();
    });
  });
});
