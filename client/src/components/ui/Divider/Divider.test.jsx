import { render, screen } from '../../../test/render';
import Divider from './Divider';

describe('Divider', () => {
  it('separator 역할을 가진 요소를 렌더링한다', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('기본 방향은 horizontal이다', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toHaveClass('horizontal');
  });

  it('direction="vertical" -- vertical 클래스를 적용한다', () => {
    render(<Divider direction="vertical" />);
    expect(screen.getByRole('separator')).toHaveClass('vertical');
  });

  it('spacing="sm" -- spacingSm 클래스', () => {
    render(<Divider spacing="sm" />);
    expect(screen.getByRole('separator')).toHaveClass('spacingSm');
  });

  it('spacing="md" -- spacingMd 클래스 (기본)', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toHaveClass('spacingMd');
  });

  it('spacing="lg" -- spacingLg 클래스', () => {
    render(<Divider spacing="lg" />);
    expect(screen.getByRole('separator')).toHaveClass('spacingLg');
  });

  it('spacing="none" -- spacingNone 클래스', () => {
    render(<Divider spacing="none" />);
    expect(screen.getByRole('separator')).toHaveClass('spacingNone');
  });
});
