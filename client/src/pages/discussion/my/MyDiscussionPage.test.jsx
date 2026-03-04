import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import MyDiscussionPage from './MyDiscussionPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/useMyDiscussionList', () => ({
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

import useMyDiscussionList from '../../../hooks/useMyDiscussionList';

const mockDiscussions = [
  {
    id: 1,
    discussionType: 'ONLINE',
    commonDiscussionInfo: { title: '첫 번째 토론' },
  },
  {
    id: 2,
    discussionType: 'OFFLINE',
    commonDiscussionInfo: { title: '두 번째 토론' },
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <MyDiscussionPage />
    </MemoryRouter>
  );
}

describe('MyDiscussionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMyDiscussionList.mockReturnValue({
      items: mockDiscussions,
      loading: false,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
  });

  it('"내가 개설한 토론" 배너를 표시한다', () => {
    renderPage();
    expect(screen.getByText('내가 개설한 토론')).toBeInTheDocument();
  });

  it('토론 목록을 렌더링한다', () => {
    renderPage();
    expect(screen.getByText('첫 번째 토론')).toBeInTheDocument();
    expect(screen.getByText('두 번째 토론')).toBeInTheDocument();
  });

  it('목록이 비어있으면 "새 토론 만들기" 버튼이 있는 빈 상태를 표시한다', () => {
    useMyDiscussionList.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
    renderPage();
    expect(screen.getByText('새 토론 만들기')).toBeInTheDocument();
  });

  it('"새 토론 만들기" 클릭 시 /discussion/new로 이동한다', async () => {
    const user = userEvent.setup();
    useMyDiscussionList.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
    renderPage();
    await user.click(screen.getByText('새 토론 만들기'));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/new');
  });

  it('로딩 중이면 로딩 스피너를 표시한다', () => {
    useMyDiscussionList.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
