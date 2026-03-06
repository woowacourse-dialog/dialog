import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import ToggleSwitch from './ToggleSwitch';

describe('ToggleSwitch', () => {
  describe('렌더링', () => {
    it('label prop이 있으면 라벨을 표시한다', () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} label="알림" />);
      expect(screen.getByText('알림')).toBeInTheDocument();
    });
  });

  describe('상태', () => {
    it('checked=true -- checked 클래스를 적용한다', () => {
      render(<ToggleSwitch checked={true} onChange={() => {}} />);
      expect(screen.getByRole('switch')).toHaveClass('checked');
    });

    it('checked=false -- checked 클래스를 적용하지 않는다', () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);
      expect(screen.getByRole('switch')).not.toHaveClass('checked');
    });
  });

  describe('상호작용', () => {
    it('클릭 시 onChange를 호출한다', async () => {
      const handleChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={handleChange} />);
      await userEvent.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 onChange가 호출되지 않는다', async () => {
      const handleChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={handleChange} disabled />);
      await userEvent.click(screen.getByRole('switch'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('switch 역할을 가진다', () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('aria-checked가 checked prop과 일치한다', () => {
      render(<ToggleSwitch checked={true} onChange={() => {}} />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });
});
