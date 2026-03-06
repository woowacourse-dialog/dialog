import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input', () => {
  describe('기본 렌더링', () => {
    it('input 요소를 렌더링한다', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('placeholder를 표시한다', () => {
      render(<Input placeholder="입력하세요" />);
      expect(screen.getByPlaceholderText('입력하세요')).toBeInTheDocument();
    });

    it('기본 type은 text이다', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });
  });

  describe('라벨', () => {
    it('label prop이 있으면 label 요소를 렌더링한다', () => {
      render(<Input label="이름" />);
      expect(screen.getByText('이름')).toBeInTheDocument();
    });

    it('label과 input이 htmlFor/id로 연결된다', () => {
      render(<Input label="이름" id="name-input" />);
      const label = screen.getByText('이름');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'name-input');
      expect(input).toHaveAttribute('id', 'name-input');
    });

    it('label이 없으면 label 요소를 렌더링하지 않는다', () => {
      render(<Input />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('값 변경', () => {
    it('입력값 변경 시 onChange를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      await userEvent.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('value prop으로 제어할 수 있다', () => {
      render(<Input value="hello" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('hello');
    });
  });

  describe('에러 상태', () => {
    it('error prop이 있으면 에러 메시지를 표시한다', () => {
      render(<Input error="필수 입력입니다" />);
      expect(screen.getByText('필수 입력입니다')).toBeInTheDocument();
    });

    it('에러 상태에서 error 클래스를 적용한다', () => {
      render(<Input error="에러" />);
      const container = screen.getByRole('textbox').parentElement;
      expect(container).toHaveClass('error');
    });
  });

  describe('아이콘', () => {
    it('leftIcon prop으로 왼쪽에 아이콘을 표시한다', () => {
      render(<Input leftIcon={<span data-testid="left">🔍</span>} />);
      expect(screen.getByTestId('left')).toBeInTheDocument();
    });

    it('rightIcon prop으로 오른쪽에 아이콘을 표시한다', () => {
      render(<Input rightIcon={<span data-testid="right">✕</span>} />);
      expect(screen.getByTestId('right')).toBeInTheDocument();
    });
  });

  describe('ref 전달', () => {
    it('ref를 전달하면 input 요소에 연결된다', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('비활성화', () => {
    it('disabled 상태에서 입력이 불가능하다', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('헬퍼 텍스트', () => {
    it('helperText prop으로 도움말을 표시한다', () => {
      render(<Input helperText="최소 3자 이상" />);
      expect(screen.getByText('최소 3자 이상')).toBeInTheDocument();
    });
  });
});
