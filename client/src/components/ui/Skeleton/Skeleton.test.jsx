import { render } from '../../../test/render';
import Skeleton from './Skeleton';

describe('Skeleton', () => {
  it('기본 렌더링 -- skeleton 클래스를 적용한다', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('skeleton');
  });

  describe('variant', () => {
    it('variant="text" -- text 클래스', () => {
      const { container } = render(<Skeleton variant="text" />);
      expect(container.firstChild).toHaveClass('text');
    });

    it('variant="circle" -- circle 클래스', () => {
      const { container } = render(<Skeleton variant="circle" />);
      expect(container.firstChild).toHaveClass('circle');
    });

    it('variant="rect" -- rect 클래스 (기본)', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('rect');
    });
  });

  describe('크기', () => {
    it('width prop을 style에 적용한다', () => {
      const { container } = render(<Skeleton width="200px" />);
      expect(container.firstChild).toHaveStyle({ width: '200px' });
    });

    it('height prop을 style에 적용한다', () => {
      const { container } = render(<Skeleton height="40px" />);
      expect(container.firstChild).toHaveStyle({ height: '40px' });
    });
  });

  describe('접근성', () => {
    it('aria-hidden="true"가 설정된다', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
