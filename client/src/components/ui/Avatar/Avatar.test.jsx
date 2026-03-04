import { render, screen, fireEvent } from '../../../test/render';
import Avatar from './Avatar';

describe('Avatar', () => {
  describe('이미지 렌더링', () => {
    it('src가 있으면 img 태그를 렌더링한다', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="테스트" />);
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('alt 텍스트가 설정된다', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="테스트" />);
      expect(screen.getByRole('img')).toHaveAttribute('alt', '테스트');
    });

    it('이미지가 원형으로 표시된다 (avatar 클래스)', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="테스트" />);
      expect(screen.getByRole('img').parentElement).toHaveClass('avatar');
    });
  });

  describe('이니셜 fallback', () => {
    it('src가 없으면 이니셜을 표시한다', () => {
      render(<Avatar name="홍길동" />);
      expect(screen.getByText('홍')).toBeInTheDocument();
    });

    it('name="홍길동" -- "홍" 이니셜을 표시한다', () => {
      render(<Avatar name="홍길동" />);
      expect(screen.getByText('홍')).toBeInTheDocument();
    });

    it('name이 없으면 기본 아이콘을 표시한다', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('이미지 에러', () => {
    it('이미지 로드 실패 시 이니셜로 대체한다', () => {
      render(<Avatar src="https://example.com/broken.jpg" name="홍길동" />);
      fireEvent.error(screen.getByRole('img'));
      expect(screen.getByText('홍')).toBeInTheDocument();
    });
  });

  describe('크기', () => {
    it('size="sm" -- sm 클래스', () => {
      render(<Avatar name="홍" size="sm" />);
      expect(screen.getByText('홍').parentElement).toHaveClass('sm');
    });
    it('size="md" -- 기본, md 클래스', () => {
      render(<Avatar name="홍" />);
      expect(screen.getByText('홍').parentElement).toHaveClass('md');
    });
    it('size="lg" -- lg 클래스', () => {
      render(<Avatar name="홍" size="lg" />);
      expect(screen.getByText('홍').parentElement).toHaveClass('lg');
    });
    it('size="xl" -- xl 클래스', () => {
      render(<Avatar name="홍" size="xl" />);
      expect(screen.getByText('홍').parentElement).toHaveClass('xl');
    });
  });
});
