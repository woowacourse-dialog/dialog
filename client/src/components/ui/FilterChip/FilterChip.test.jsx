import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import FilterChip from './FilterChip';

describe('FilterChip', () => {
  describe('기본 렌더링', () => {
    it('label 텍스트를 렌더링한다', () => {
      render(<FilterChip label="전체" onClick={() => {}} />);
      expect(screen.getByText('전체')).toBeInTheDocument();
    });
    it('button 역할을 가진다', () => {
      render(<FilterChip label="전체" onClick={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('선택 상태', () => {
    it('selected=false — default 클래스를 적용한다', () => {
      render(<FilterChip label="전체" selected={false} onClick={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('default');
    });
    it('selected=true — selected 클래스를 적용한다', () => {
      render(<FilterChip label="전체" selected={true} onClick={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('selected');
    });
  });

  describe('상호작용', () => {
    it('클릭 시 onClick을 호출한다', async () => {
      const handleClick = vi.fn();
      render(<FilterChip label="전체" onClick={handleClick} />);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성', () => {
    it('aria-pressed가 selected prop과 일치한다', () => {
      render(<FilterChip label="전체" selected={true} onClick={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('크기', () => {
    it('size="sm" — sm 클래스', () => {
      render(<FilterChip label="전체" size="sm" onClick={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('sm');
    });
    it('size="md" — md 클래스 (기본)', () => {
      render(<FilterChip label="전체" onClick={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('md');
    });
  });
});
