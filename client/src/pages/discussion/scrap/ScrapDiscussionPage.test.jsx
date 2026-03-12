import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import ScrapDiscussionPage from './ScrapDiscussionPage';

vi.mock('../../../hooks/useScrapDiscussionList', () => ({
  default: vi.fn(),
}));

vi.mock('../../../hooks/useInfiniteScroll', () => ({
  default: vi.fn(() => ({ current: null })),
}));

vi.mock('../../../components/Discussion/DiscussionList', () => ({
  default: ({ items, emptyMessage }) => (
    <div data-testid="discussion-list">
      {items.length === 0 ? emptyMessage : items.map((item) => (
        <div key={item.id}>{item.commonDiscussionInfo.title}</div>
      ))}
    </div>
  ),
}));

import useScrapDiscussionList from '../../../hooks/useScrapDiscussionList';

const mockDiscussions = [
  {
    id: 1,
    discussionType: 'ONLINE',
    commonDiscussionInfo: { title: '스크랩된 토론 1' },
  },
  {
    id: 2,
    discussionType: 'OFFLINE',
    commonDiscussionInfo: { title: '스크랩된 토론 2' },
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ScrapDiscussionPage />
    </MemoryRouter>
  );
}

describe('ScrapDiscussionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScrapDiscussionList.mockReturnValue({
      items: mockDiscussions,
      loading: false,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
  });

  it('"내가 스크랩한 토론" 배너를 표시한다', () => {
    renderPage();
    expect(screen.getByText('내가 스크랩한 토론')).toBeInTheDocument();
  });

  it('토론 목록을 렌더링한다', () => {
    renderPage();
    expect(screen.getByText('스크랩된 토론 1')).toBeInTheDocument();
    expect(screen.getByText('스크랩된 토론 2')).toBeInTheDocument();
  });

  it('목록이 비어있으면 빈 상태를 표시한다', () => {
    useScrapDiscussionList.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/스크랩한 토론이 없습니다/)).toBeInTheDocument();
  });
});
