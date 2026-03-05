import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiscussionHeader from './DiscussionHeader';

const onlineDiscussion = {
  discussionType: 'ONLINE',
  commonDiscussionInfo: {
    title: 'React 상태 관리 방법론 토론',
    category: 'FRONTEND',
    author: {
      id: 1,
      name: '홍길동',
      profileImage: { basicImageUri: '/avatar.png', customImageUri: null },
    },
  },
  onlineDiscussionInfo: {
    endDate: '2025-12-31',
  },
};

const offlineDiscussion = {
  discussionType: 'OFFLINE',
  commonDiscussionInfo: {
    title: '백엔드 아키텍처 스터디',
    category: 'BACKEND',
    author: {
      id: 2,
      name: '이영희',
      profileImage: null,
    },
  },
  offlineDiscussionInfo: {
    startAt: '2025-06-01T14:00:00',
    endAt: '2025-06-01T16:00:00',
    participantCount: 3,
    maxParticipantCount: 6,
  },
};

describe('DiscussionHeader', () => {
  describe('배지 렌더링', () => {
    it('트랙 배지를 렌더링한다 — 온라인 토론', () => {
      render(<DiscussionHeader discussion={onlineDiscussion} />);
      expect(screen.getByText('프론트엔드')).toBeInTheDocument();
    });

    it('트랙 배지를 렌더링한다 — 오프라인 토론', () => {
      render(<DiscussionHeader discussion={offlineDiscussion} />);
      expect(screen.getByText('백엔드')).toBeInTheDocument();
    });

    it('상태 배지를 렌더링한다', () => {
      render(<DiscussionHeader discussion={onlineDiscussion} />);
      // getDiscussionStatusWithLabel에 의해 계산된 label 표시
      // endDate가 과거이므로 '토론 완료' 상태
      const badges = screen.getAllByText(/토론/);
      const statusBadge = badges.find(el =>
        el.className.includes('badge') && el.className.includes('status')
      );
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('제목 렌더링', () => {
    it('토론 제목을 h1으로 렌더링한다', () => {
      render(<DiscussionHeader discussion={onlineDiscussion} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('React 상태 관리 방법론 토론');
    });
  });

  describe('작성자 정보', () => {
    it('작성자 아바타를 렌더링한다', () => {
      render(<DiscussionHeader discussion={onlineDiscussion} />);
      expect(screen.getByAltText('홍길동')).toBeInTheDocument();
    });

    it('작성자 이름을 렌더링한다', () => {
      render(<DiscussionHeader discussion={onlineDiscussion} />);
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('"님이 개설한 토론" 텍스트를 렌더링한다', () => {
      render(<DiscussionHeader discussion={onlineDiscussion} />);
      expect(screen.getByText(/님이 개설한 토론/)).toBeInTheDocument();
    });

    it('프로필 이미지가 없을 때 fallback 처리한다', () => {
      render(<DiscussionHeader discussion={offlineDiscussion} />);
      expect(screen.getByAltText('이영희')).toBeInTheDocument();
    });
  });
});
