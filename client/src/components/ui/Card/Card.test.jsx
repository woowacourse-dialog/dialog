import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Card from './Card';

describe('Card', () => {
  describe('기본 렌더링', () => {
    it('children을 렌더링한다', () => {
      render(<Card>카드 내용</Card>);
      expect(screen.getByText('카드 내용')).toBeInTheDocument();
    });

    it('card 클래스를 적용한다', () => {
      render(<Card>내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('card');
    });
  });

  describe('패딩', () => {
    it('padding="sm" -- paddingSm 클래스', () => {
      render(<Card padding="sm">내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('paddingSm');
    });

    it('padding="md" -- paddingMd 클래스 (기본)', () => {
      render(<Card>내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('paddingMd');
    });

    it('padding="lg" -- paddingLg 클래스', () => {
      render(<Card padding="lg">내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('paddingLg');
    });

    it('padding="none" -- paddingNone 클래스', () => {
      render(<Card padding="none">내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('paddingNone');
    });
  });

  describe('상호작용', () => {
    it('onClick이 있으면 button 역할을 가진다', () => {
      render(<Card onClick={() => {}}>클릭 카드</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('onClick 카드에 clickable 클래스를 적용한다', () => {
      render(<Card onClick={() => {}}>내용</Card>);
      expect(screen.getByRole('button')).toHaveClass('clickable');
    });

    it('클릭 시 onClick 핸들러를 호출한다', async () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>내용</Card>);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick이 없으면 정적 카드 (button 역할 없음)', () => {
      render(<Card>정적 카드</Card>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('hover', () => {
    it('hoverable prop이 true면 hoverable 클래스를 적용한다', () => {
      render(<Card hoverable>내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('hoverable');
    });
  });

  describe('커스텀', () => {
    it('className prop으로 추가 클래스를 적용할 수 있다', () => {
      render(<Card className="custom-class">내용</Card>);
      expect(screen.getByText('내용').closest('[class]')).toHaveClass('custom-class');
    });
  });
});
