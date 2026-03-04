import { render, screen } from '../../../test/render';
import Badge from './Badge';

describe('Badge', () => {
  describe('Status 배지', () => {
    it('variant="status" type="active" -- "토론 중" 텍스트와 statusActive 클래스', () => {
      render(<Badge variant="status" type="active" />);
      expect(screen.getByText('토론 중')).toBeInTheDocument();
      expect(screen.getByText('토론 중').closest('[class]')).toHaveClass('statusActive');
    });

    it('variant="status" type="completed" -- "토론 완료" 텍스트와 statusCompleted 클래스', () => {
      render(<Badge variant="status" type="completed" />);
      expect(screen.getByText('토론 완료')).toBeInTheDocument();
      expect(screen.getByText('토론 완료').closest('[class]')).toHaveClass('statusCompleted');
    });

    it('variant="status" type="recruiting" -- "모집 중" 텍스트와 statusRecruiting 클래스', () => {
      render(<Badge variant="status" type="recruiting" />);
      expect(screen.getByText('모집 중')).toBeInTheDocument();
      expect(screen.getByText('모집 중').closest('[class]')).toHaveClass('statusRecruiting');
    });

    it('variant="status" type="recruitComplete" -- "모집 완료" 텍스트와 statusRecruitComplete 클래스', () => {
      render(<Badge variant="status" type="recruitComplete" />);
      expect(screen.getByText('모집 완료')).toBeInTheDocument();
      expect(screen.getByText('모집 완료').closest('[class]')).toHaveClass('statusRecruitComplete');
    });
  });

  describe('Track 배지', () => {
    it('variant="track" type="BACKEND" -- "BE" 텍스트와 trackBe 클래스', () => {
      render(<Badge variant="track" type="BACKEND" />);
      expect(screen.getByText('BE')).toBeInTheDocument();
      expect(screen.getByText('BE').closest('[class]')).toHaveClass('trackBe');
    });

    it('variant="track" type="FRONTEND" -- "FE" 텍스트와 trackFe 클래스', () => {
      render(<Badge variant="track" type="FRONTEND" />);
      expect(screen.getByText('FE')).toBeInTheDocument();
      expect(screen.getByText('FE').closest('[class]')).toHaveClass('trackFe');
    });

    it('variant="track" type="ANDROID" -- "AN" 텍스트와 trackAn 클래스', () => {
      render(<Badge variant="track" type="ANDROID" />);
      expect(screen.getByText('AN')).toBeInTheDocument();
      expect(screen.getByText('AN').closest('[class]')).toHaveClass('trackAn');
    });

    it('variant="track" type="COMMON" -- "ALL" 텍스트와 trackCommon 클래스', () => {
      render(<Badge variant="track" type="COMMON" />);
      expect(screen.getByText('ALL')).toBeInTheDocument();
      expect(screen.getByText('ALL').closest('[class]')).toHaveClass('trackCommon');
    });
  });

  describe('DiscussionType 배지', () => {
    it('variant="discussionType" type="online" -- "온라인" 텍스트', () => {
      render(<Badge variant="discussionType" type="online" />);
      expect(screen.getByText('온라인')).toBeInTheDocument();
    });

    it('variant="discussionType" type="offline" -- "오프라인" 텍스트', () => {
      render(<Badge variant="discussionType" type="offline" />);
      expect(screen.getByText('오프라인')).toBeInTheDocument();
    });
  });

  describe('커스텀', () => {
    it('children으로 직접 텍스트를 전달하면 해당 텍스트를 렌더링한다', () => {
      render(<Badge variant="status" type="active">커스텀</Badge>);
      expect(screen.getByText('커스텀')).toBeInTheDocument();
    });

    it('size="sm" -- sm 클래스를 적용한다', () => {
      render(<Badge variant="track" type="BACKEND" size="sm" />);
      expect(screen.getByText('BE').closest('[class]')).toHaveClass('sm');
    });
  });
});
