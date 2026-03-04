import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import SegmentControl from './SegmentControl';

describe('SegmentControl', () => {
  const options = [
    { value: 'online', label: '온라인' },
    { value: 'offline', label: '오프라인' },
  ];

  describe('기본 렌더링', () => {
    it('모든 옵션을 렌더링한다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} />);
      expect(screen.getByText('온라인')).toBeInTheDocument();
      expect(screen.getByText('오프라인')).toBeInTheDocument();
    });

    it('radiogroup 역할을 가진다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });

  describe('선택 상태', () => {
    it('선택된 옵션에 active 클래스를 적용한다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} />);
      expect(screen.getByText('온라인').closest('button')).toHaveClass('active');
    });

    it('선택되지 않은 옵션에 active 클래스가 없다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} />);
      expect(screen.getByText('오프라인').closest('button')).not.toHaveClass('active');
    });
  });

  describe('상호작용', () => {
    it('옵션 클릭 시 onChange를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<SegmentControl options={options} value="online" onChange={handleChange} />);
      await userEvent.click(screen.getByText('오프라인'));
      expect(handleChange).toHaveBeenCalledWith('offline');
    });

    it('이미 선택된 옵션 클릭 시 onChange가 호출되지 않는다', async () => {
      const handleChange = vi.fn();
      render(<SegmentControl options={options} value="online" onChange={handleChange} />);
      await userEvent.click(screen.getByText('온라인'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('비활성화', () => {
    it('disabled 상태에서 클릭해도 onChange가 호출되지 않는다', async () => {
      const handleChange = vi.fn();
      render(<SegmentControl options={options} value="online" onChange={handleChange} disabled />);
      await userEvent.click(screen.getByText('오프라인'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('disabled 상태에서 disabled 클래스를 적용한다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} disabled />);
      expect(screen.getByRole('radiogroup')).toHaveClass('disabled');
    });
  });

  describe('읽기 전용', () => {
    it('readOnly일 때 클릭해도 변경되지 않는다', async () => {
      const handleChange = vi.fn();
      render(<SegmentControl options={options} value="online" onChange={handleChange} readOnly />);
      await userEvent.click(screen.getByText('오프라인'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('readOnly일 때 보조 텍스트를 표시한다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} readOnly helperText="변경 불가" />);
      expect(screen.getByText('변경 불가')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('각 옵션이 radio 역할을 가진다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} />);
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
    });

    it('선택된 옵션이 aria-checked="true"이다', () => {
      render(<SegmentControl options={options} value="online" onChange={() => {}} />);
      const radios = screen.getAllByRole('radio');
      const selected = radios.find(r => r.textContent === '온라인');
      expect(selected).toHaveAttribute('aria-checked', 'true');
    });
  });
});
