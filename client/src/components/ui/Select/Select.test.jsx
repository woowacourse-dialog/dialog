import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Select from './Select';

describe('Select', () => {
  const options = [
    { value: 'backend', label: '백엔드' },
    { value: 'frontend', label: '프론트엔드' },
    { value: 'android', label: '안드로이드' },
  ];

  describe('기본 렌더링', () => {
    it('select 요소를 렌더링한다', () => {
      render(<Select options={options} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('options를 모두 렌더링한다', () => {
      render(<Select options={options} />);
      expect(screen.getByText('백엔드')).toBeInTheDocument();
      expect(screen.getByText('프론트엔드')).toBeInTheDocument();
      expect(screen.getByText('안드로이드')).toBeInTheDocument();
    });

    it('placeholder를 표시한다', () => {
      render(<Select options={options} placeholder="선택하세요" />);
      expect(screen.getByText('선택하세요')).toBeInTheDocument();
    });
  });

  describe('라벨', () => {
    it('label prop이 있으면 label 요소를 렌더링한다', () => {
      render(<Select options={options} label="트랙" />);
      expect(screen.getByText('트랙')).toBeInTheDocument();
    });

    it('label과 select가 htmlFor/id로 연결된다', () => {
      render(<Select options={options} label="트랙" id="track-select" />);
      const label = screen.getByText('트랙');
      expect(label).toHaveAttribute('for', 'track-select');
      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'track-select');
    });
  });

  describe('값 변경', () => {
    it('옵션 선택 시 onChange를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<Select options={options} onChange={handleChange} />);
      await userEvent.selectOptions(screen.getByRole('combobox'), 'backend');
      expect(handleChange).toHaveBeenCalled();
    });

    it('value prop으로 선택된 값을 제어한다', () => {
      render(<Select options={options} value="frontend" onChange={() => {}} />);
      expect(screen.getByRole('combobox')).toHaveValue('frontend');
    });
  });

  describe('에러 상태', () => {
    it('error prop이 있으면 에러 메시지를 표시한다', () => {
      render(<Select options={options} error="필수 선택입니다" />);
      expect(screen.getByText('필수 선택입니다')).toBeInTheDocument();
    });

    it('에러 상태에서 error 클래스를 적용한다', () => {
      render(<Select options={options} error="에러" />);
      const selectEl = screen.getByRole('combobox');
      const container = selectEl.parentElement;
      expect(container).toHaveClass('error');
    });
  });

  describe('ref 전달', () => {
    it('ref를 전달하면 select 요소에 연결된다', () => {
      const ref = { current: null };
      render(<Select options={options} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('비활성화', () => {
    it('disabled 상태에서 select가 비활성화된다', () => {
      render(<Select options={options} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });
});
