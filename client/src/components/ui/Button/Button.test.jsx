import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  describe('렌더링', () => {
    it('children 텍스트를 렌더링한다', () => {
      render(<Button>확인</Button>);
      expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    });

    it('기본 variant는 primary이다', () => {
      render(<Button>확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('primary');
    });

    it('기본 type은 button이다', () => {
      render(<Button>확인</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('variant', () => {
    it('variant="primary" -- primary 클래스를 적용한다', () => {
      render(<Button variant="primary">확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('primary');
    });
    it('variant="secondary" -- secondary 클래스를 적용한다', () => {
      render(<Button variant="secondary">확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('secondary');
    });
    it('variant="ghost" -- ghost 클래스를 적용한다', () => {
      render(<Button variant="ghost">확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('ghost');
    });
    it('variant="danger" -- danger 클래스를 적용한다', () => {
      render(<Button variant="danger">확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('danger');
    });
    it('variant="fab" -- fab 클래스를 적용한다', () => {
      render(<Button variant="fab">+</Button>);
      expect(screen.getByRole('button')).toHaveClass('fab');
    });
  });

  describe('크기', () => {
    it('size="sm" -- sm 클래스를 적용한다', () => {
      render(<Button size="sm">확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('sm');
    });
    it('size="md" -- 기본, md 클래스를 적용한다', () => {
      render(<Button>확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('md');
    });
    it('size="lg" -- lg 클래스를 적용한다', () => {
      render(<Button size="lg">확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('lg');
    });
  });

  describe('상호작용', () => {
    it('클릭 시 onClick 핸들러를 호출한다', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>확인</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 onClick이 호출되지 않는다', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>확인</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disabled 상태에서 disabled 속성이 설정된다', () => {
      render(<Button disabled>확인</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('아이콘', () => {
    it('leftIcon prop으로 왼쪽에 아이콘을 렌더링한다', () => {
      render(<Button leftIcon={<span data-testid="left-icon">←</span>}>확인</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });
    it('rightIcon prop으로 오른쪽에 아이콘을 렌더링한다', () => {
      render(<Button rightIcon={<span data-testid="right-icon">→</span>}>확인</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('전체 너비', () => {
    it('fullWidth prop이 true면 fullWidth 클래스를 적용한다', () => {
      render(<Button fullWidth>확인</Button>);
      expect(screen.getByRole('button')).toHaveClass('fullWidth');
    });
  });

  describe('ref 전달', () => {
    it('ref를 전달하면 button 요소에 연결된다', () => {
      const ref = { current: null };
      render(<Button ref={ref}>확인</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('로딩', () => {
    it('loading 상태에서 버튼이 disabled된다', () => {
      render(<Button loading>확인</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
    it('loading 상태에서 "처리중..." 텍스트를 표시한다', () => {
      render(<Button loading>확인</Button>);
      expect(screen.getByText('처리중...')).toBeInTheDocument();
    });
  });
});
