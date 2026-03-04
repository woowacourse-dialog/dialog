import { render, screen } from '../../../test/render';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('기본 렌더링', () => {
    it('스피너 요소를 렌더링한다', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    it('spinner 클래스를 적용한다', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
    it('status 역할을 가진다', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('메시지', () => {
    it('message prop이 있으면 메시지를 표시한다', () => {
      render(<LoadingSpinner message="로딩 중..." />);
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });
    it('message prop이 없으면 메시지를 표시하지 않는다', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.querySelector('p')).not.toBeInTheDocument();
    });
  });

  describe('크기', () => {
    it('size="sm" — sm 클래스', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      expect(container.querySelector('svg')).toHaveClass('sm');
    });
    it('size="md" — md 클래스 (기본)', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.querySelector('svg')).toHaveClass('md');
    });
    it('size="lg" — lg 클래스', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      expect(container.querySelector('svg')).toHaveClass('lg');
    });
  });

  describe('전체 페이지', () => {
    it('fullPage=true — fullPage 클래스', () => {
      render(<LoadingSpinner fullPage />);
      expect(screen.getByRole('status')).toHaveClass('fullPage');
    });
  });

  describe('접근성', () => {
    it('aria-label이 설정된다', () => {
      render(<LoadingSpinner message="데이터 로딩" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', '데이터 로딩');
    });
  });
});
