import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/render';
import DiscussionList from './DiscussionList';

// DiscussionCard mock (isolate from child component)
vi.mock('./DiscussionCard', () => ({
  default: ({ id, commonDiscussionInfo }) => (
    <div data-testid={`card-${id}`}>{commonDiscussionInfo.title}</div>
  ),
}));

const mockItems = [
  {
    id: 1,
    discussionType: 'ONLINE',
    commonDiscussionInfo: { title: '토론 1', author: 'A', category: 'FRONTEND', commentCount: 0, profileImage: {} },
    onlineDiscussionInfo: { endDate: '2024-03-15' },
    offlineDiscussionInfo: null,
  },
  {
    id: 2,
    discussionType: 'OFFLINE',
    commonDiscussionInfo: { title: '토론 2', author: 'B', category: 'BACKEND', commentCount: 2, profileImage: {} },
    onlineDiscussionInfo: null,
    offlineDiscussionInfo: { place: '서울', startAt: '14:00', endAt: '16:00', participantCount: 3, maxParticipantCount: 8 },
  },
];

describe('DiscussionList', () => {
  describe('목록 렌더링', () => {
    it('items 배열로 DiscussionCard 목록을 렌더링한다', () => {
      render(
        <DiscussionList
          items={mockItems}
          loading={false}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
    });

    it('items의 순서대로 렌더링한다', () => {
      render(
        <DiscussionList
          items={mockItems}
          loading={false}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      const cards = screen.getAllByTestId(/^card-/);
      expect(cards[0]).toHaveTextContent('토론 1');
      expect(cards[1]).toHaveTextContent('토론 2');
    });
  });

  describe('로딩 상태', () => {
    it('loading=true이면 로딩 인디케이터를 표시한다', () => {
      render(
        <DiscussionList
          items={[]}
          loading={true}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.getByText(/로딩/)).toBeInTheDocument();
    });

    it('loading=true이면 빈 상태 메시지를 표시하지 않는다', () => {
      render(
        <DiscussionList
          items={[]}
          loading={true}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.queryByText('게시글이 없습니다.')).not.toBeInTheDocument();
    });
  });

  describe('에러 상태', () => {
    it('error가 있으면 에러 메시지를 표시한다', () => {
      render(
        <DiscussionList
          items={[]}
          loading={false}
          error="데이터를 불러올 수 없습니다."
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.getByText('데이터를 불러올 수 없습니다.')).toBeInTheDocument();
    });
  });

  describe('빈 목록', () => {
    it('items가 비어있고 로딩도 아니면 EmptyState를 표시한다', () => {
      render(
        <DiscussionList
          items={[]}
          loading={false}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
          emptyMessage="게시글이 없습니다."
        />
      );
      expect(screen.getByText('게시글이 없습니다.')).toBeInTheDocument();
    });

    it('커스텀 emptyMessage를 사용할 수 있다', () => {
      render(
        <DiscussionList
          items={[]}
          loading={false}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
          emptyMessage="검색 결과가 없습니다."
        />
      );
      expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });
  });

  describe('infinite scroll', () => {
    it('hasMore=true이면 sentinel 요소를 렌더링한다', () => {
      render(
        <DiscussionList
          items={mockItems}
          loading={false}
          error={null}
          hasMore={true}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.getByTestId('scroll-sentinel')).toBeInTheDocument();
    });

    it('hasMore=false이면 sentinel 요소를 렌더링하지 않는다', () => {
      render(
        <DiscussionList
          items={mockItems}
          loading={false}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.queryByTestId('scroll-sentinel')).not.toBeInTheDocument();
    });

    it('isFetchingMore=true이면 추가 로딩 인디케이터를 표시한다', () => {
      render(
        <DiscussionList
          items={mockItems}
          loading={false}
          error={null}
          hasMore={true}
          isFetchingMore={true}
          loaderRef={{ current: null }}
        />
      );
      expect(screen.getByTestId('fetching-more-indicator')).toBeInTheDocument();
    });
  });

  describe('endMessage', () => {
    it('hasMore=false이고 items가 있으면 endMessage를 표시한다', () => {
      render(
        <DiscussionList
          items={mockItems}
          loading={false}
          error={null}
          hasMore={false}
          isFetchingMore={false}
          loaderRef={{ current: null }}
          endMessage="모든 게시물을 불러왔습니다."
        />
      );
      expect(screen.getByText('모든 게시물을 불러왔습니다.')).toBeInTheDocument();
    });
  });
});
