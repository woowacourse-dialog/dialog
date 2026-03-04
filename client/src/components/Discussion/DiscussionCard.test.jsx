import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/render';
import userEvent from '@testing-library/user-event';
import DiscussionCard from './DiscussionCard';

// useNavigate mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const defaultAuth = {
  isLoggedIn: true,
  currentUser: { nickname: '다른유저' },
  authLoading: false,
  checkLoginStatus: () => {},
  logout: () => {},
};

const authorAuth = {
  isLoggedIn: true,
  currentUser: { nickname: '홍길동' },
  authLoading: false,
  checkLoginStatus: () => {},
  logout: () => {},
};

const onlineDiscussion = {
  id: 1,
  discussionType: 'ONLINE',
  commonDiscussionInfo: {
    title: '리액트 훅 깊게 이해하기',
    author: '홍길동',
    profileImage: { basicImageUri: 'https://example.com/avatar.jpg' },
    category: 'FRONTEND',
    commentCount: 5,
    summary: null,
  },
  onlineDiscussionInfo: {
    endDate: '2024-03-15',
  },
  offlineDiscussionInfo: null,
};

describe('DiscussionCard — 온라인', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('배지 렌더링', () => {
    it('상태 배지를 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      // getDiscussionStatus에 따라 "토론 중" 또는 "토론 완료"
      expect(screen.getByText(/토론 중|토론 완료/)).toBeInTheDocument();
    });

    it('"온라인" 타입 배지를 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByText('온라인')).toBeInTheDocument();
    });

    it('트랙 배지를 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByText('FE')).toBeInTheDocument();
    });
  });

  describe('콘텐츠 렌더링', () => {
    it('제목을 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByText('리액트 훅 깊게 이해하기')).toBeInTheDocument();
    });

    it('작성자 아바타를 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByAltText('홍길동')).toBeInTheDocument();
    });

    it('작성자 이름을 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('종료일을 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByText(/2024-03-15/)).toBeInTheDocument();
    });

    it('댓글 수를 렌더링한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('요약 미리보기', () => {
    it('summary가 있으면 미리보기를 표시한다', () => {
      const withSummary = {
        ...onlineDiscussion,
        commonDiscussionInfo: {
          ...onlineDiscussion.commonDiscussionInfo,
          summary: '이 토론에서는 리액트 훅의 동작 원리를 심층적으로 분석합니다.',
        },
      };
      render(<DiscussionCard {...withSummary} />, { authValue: defaultAuth });
      expect(screen.getByText(/리액트 훅의 동작 원리/)).toBeInTheDocument();
    });

    it('summary가 100자를 초과하면 truncate한다', () => {
      const longSummary = 'a'.repeat(150);
      const withLongSummary = {
        ...onlineDiscussion,
        commonDiscussionInfo: {
          ...onlineDiscussion.commonDiscussionInfo,
          summary: longSummary,
        },
      };
      render(<DiscussionCard {...withLongSummary} />, { authValue: defaultAuth });
      expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
    });

    it('summary가 null이면 미리보기를 표시하지 않는다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.queryByTestId('summary-preview')).not.toBeInTheDocument();
    });
  });

  describe('네비게이션', () => {
    it('카드 클릭 시 /discussion/:id로 이동한다', async () => {
      const user = userEvent.setup();
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      await user.click(screen.getByText('리액트 훅 깊게 이해하기'));
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/1');
    });
  });

  describe('MoreMenu (작성자)', () => {
    it('현재 사용자가 작성자가 아니면 MoreMenu를 표시하지 않는다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: defaultAuth });
      expect(screen.queryByLabelText('더보기 메뉴')).not.toBeInTheDocument();
    });

    it('현재 사용자가 작성자이면 MoreMenu를 표시한다', () => {
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: authorAuth });
      expect(screen.getByLabelText('더보기 메뉴')).toBeInTheDocument();
    });

    it('MoreMenu의 "수정" 클릭 시 /discussion/:id/edit로 이동한다', async () => {
      const user = userEvent.setup();
      render(<DiscussionCard {...onlineDiscussion} />, { authValue: authorAuth });
      await user.click(screen.getByLabelText('더보기 메뉴'));
      await user.click(screen.getByText('수정'));
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/1/edit');
    });

    it('MoreMenu의 "삭제" 클릭 시 onDelete를 호출한다', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<DiscussionCard {...onlineDiscussion} onDelete={onDelete} />, { authValue: authorAuth });
      await user.click(screen.getByLabelText('더보기 메뉴'));
      await user.click(screen.getByText('삭제'));
      expect(onDelete).toHaveBeenCalledWith(1);
    });
  });
});

// ===== 4-2 오프라인 =====

const offlineDiscussion = {
  id: 2,
  discussionType: 'OFFLINE',
  commonDiscussionInfo: {
    title: '코드 리뷰 스터디',
    author: '김철수',
    profileImage: { basicImageUri: 'https://example.com/avatar2.jpg' },
    category: 'BACKEND',
    commentCount: 3,
    summary: null,
  },
  onlineDiscussionInfo: null,
  offlineDiscussionInfo: {
    place: '강남역 스터디카페',
    startAt: '2024-03-20 14:00',
    endAt: '2024-03-20 16:00',
    participantCount: 4,
    maxParticipantCount: 8,
  },
};

describe('DiscussionCard — 오프라인', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('"오프라인" 타입 배지를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText('오프라인')).toBeInTheDocument();
  });

  it('상태 배지를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText(/모집 중|모집 완료|토론 중|토론 완료/)).toBeInTheDocument();
  });

  it('트랙 배지를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText('BE')).toBeInTheDocument();
  });

  it('제목을 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText('코드 리뷰 스터디')).toBeInTheDocument();
  });

  it('작성자 정보를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByAltText('김철수')).toBeInTheDocument();
  });

  it('장소를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText('강남역 스터디카페')).toBeInTheDocument();
  });

  it('시간 범위를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText(/14:00.*16:00/)).toBeInTheDocument();
  });

  it('참가자 수를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText(/4 \/ 8명/)).toBeInTheDocument();
  });

  it('댓글 수를 렌더링한다', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('종료일을 표시하지 않는다 (온라인 전용)', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.queryByText(/종료일/)).not.toBeInTheDocument();
  });

  it('요약 미리보기를 표시하지 않는다 (온라인 전용)', () => {
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    expect(screen.queryByTestId('summary-preview')).not.toBeInTheDocument();
  });

  it('카드 클릭 시 /discussion/:id로 이동한다', async () => {
    const user = userEvent.setup();
    render(<DiscussionCard {...offlineDiscussion} />, { authValue: defaultAuth });
    await user.click(screen.getByText('코드 리뷰 스터디'));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/2');
  });
});
