import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import PageBanner from './PageBanner';

describe('PageBanner', () => {
  describe('기본 렌더링', () => {
    it('title을 렌더링한다', () => {
      render(<PageBanner title="내 토론" />);
      expect(screen.getByText('내 토론')).toBeInTheDocument();
    });
    it('banner 클래스를 적용한다', () => {
      const { container } = render(<PageBanner title="내 토론" />);
      expect(container.firstChild).toHaveClass('banner');
    });
  });

  describe('아이콘', () => {
    it('icon prop이 있으면 아이콘을 렌더링한다', () => {
      render(<PageBanner title="내 토론" icon={<span data-testid="icon">📋</span>} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('부제목', () => {
    it('subtitle prop이 있으면 부제목을 렌더링한다', () => {
      render(<PageBanner title="내 토론" subtitle="내가 작성한 토론 목록" />);
      expect(screen.getByText('내가 작성한 토론 목록')).toBeInTheDocument();
    });
  });

  describe('뒤로가기', () => {
    it('onBack prop이 있으면 뒤로가기 버튼을 렌더링한다', () => {
      render(<PageBanner title="내 토론" onBack={() => {}} />);
      expect(screen.getByLabelText('뒤로 가기')).toBeInTheDocument();
    });
    it('뒤로가기 클릭 시 onBack을 호출한다', async () => {
      const handleBack = vi.fn();
      render(<PageBanner title="내 토론" onBack={handleBack} />);
      await userEvent.click(screen.getByLabelText('뒤로 가기'));
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
    it('onBack prop이 없으면 뒤로가기 버튼을 렌더링하지 않는다', () => {
      render(<PageBanner title="내 토론" />);
      expect(screen.queryByLabelText('뒤로 가기')).not.toBeInTheDocument();
    });
  });
});
