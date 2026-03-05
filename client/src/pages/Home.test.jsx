import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/render';
import userEvent from '@testing-library/user-event';
import Home from './Home';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock hooks
vi.mock('../context/AuthContext', () => ({
  AuthContext: { Provider: ({ children }) => children },
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useFilterParams', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useDiscussionList', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useInfiniteScroll', () => ({
  default: vi.fn(() => ({ current: null })),
}));

vi.mock('../hooks/useNotification', () => ({
  useNotification: vi.fn(() => ({ showGuideModal: false, setShowGuideModal: vi.fn() })),
}));

// Mock components
vi.mock('../components/SearchBar/SearchBar', () => ({
  default: ({ onSearch }) => (
    <div data-testid="searchbar">
      <button onClick={() => onSearch({ searchType: 0, query: 'test' })}>검색</button>
    </div>
  ),
}));

vi.mock('../components/Filter/FilterCard', () => ({
  default: () => <div data-testid="filter-card">FilterCard</div>,
}));

vi.mock('../components/Filter/FilterBottomSheet', () => ({
  default: ({ isOpen, onApply, onReset, onClose }) => (
    isOpen ? (
      <div data-testid="filter-bottom-sheet">
        <button onClick={() => onApply({ categories: ['frontend'], statuses: [], discussionTypes: [] })}>
          적용하기
        </button>
        <button onClick={onReset}>초기화</button>
        <button onClick={onClose}>닫기</button>
      </div>
    ) : null
  ),
}));

vi.mock('../components/Discussion/DiscussionList', () => ({
  default: ({ items, emptyMessage }) => (
    <div data-testid="discussion-list">
      {items.length === 0 ? emptyMessage : `${items.length}개 토론`}
    </div>
  ),
}));

vi.mock('../components/FloatingActionButton/FloatingActionButton', () => ({
  default: ({ onClick }) => (
    <button data-testid="fab" aria-label="새 토론 작성" onClick={onClick}>+</button>
  ),
}));

import { useAuth } from '../context/AuthContext';
import useFilterParams from '../hooks/useFilterParams';
import useDiscussionList from '../hooks/useDiscussionList';

describe('Home 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      isLoggedIn: false,
      currentUser: null,
    });

    useFilterParams.mockReturnValue({
      categories: [],
      statuses: [],
      discussionTypes: [],
      handleCategoryChange: vi.fn(),
      handleStatusChange: vi.fn(),
      handleDiscussionTypeChange: vi.fn(),
    });

    useDiscussionList.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      hasMore: false,
      isFetchingMore: false,
      loadMore: vi.fn(),
    });
  });

  describe('기본 렌더링', () => {
    it('SearchBar를 렌더링한다', () => {
      render(<Home />);
      expect(screen.getByTestId('searchbar')).toBeInTheDocument();
    });

    it('FilterCard (사이드바)를 렌더링한다', () => {
      render(<Home />);
      expect(screen.getByTestId('filter-card')).toBeInTheDocument();
    });

    it('DiscussionList를 렌더링한다', () => {
      render(<Home />);
      expect(screen.getByTestId('discussion-list')).toBeInTheDocument();
    });

    it('사이드바 + 메인 콘텐츠 가로 배치 구조이다', () => {
      render(<Home />);
      const layout = screen.getByTestId('home-layout');
      expect(layout).toBeInTheDocument();
    });

    it('토론 목록이 비어있으면 "게시글이 없습니다." 메시지를 표시한다', () => {
      render(<Home />);
      expect(screen.getByText('게시글이 없습니다.')).toBeInTheDocument();
    });

    it('토론 목록이 있으면 개수를 표시한다', () => {
      useDiscussionList.mockReturnValue({
        items: [{ id: 1 }, { id: 2 }],
        loading: false,
        error: null,
        hasMore: false,
        isFetchingMore: false,
        loadMore: vi.fn(),
      });
      render(<Home />);
      expect(screen.getByText('2개 토론')).toBeInTheDocument();
    });
  });

  describe('필터 연동', () => {
    it('URL 파라미터 변경 시 DiscussionList가 재요청한다', () => {
      useFilterParams.mockReturnValue({
        categories: ['frontend'],
        statuses: [],
        discussionTypes: [],
        handleCategoryChange: vi.fn(),
        handleStatusChange: vi.fn(),
        handleDiscussionTypeChange: vi.fn(),
      });

      render(<Home />);
      expect(useDiscussionList).toHaveBeenCalledWith(
        expect.objectContaining({
          searchParams: expect.objectContaining({
            categories: ['frontend'],
          }),
        })
      );
    });

    it('useFilterParams를 /discussion basePath로 호출한다', () => {
      render(<Home />);
      expect(useFilterParams).toHaveBeenCalledWith('/discussion');
    });
  });

  describe('검색 핸들러', () => {
    it('검색 시 /discussion/search로 이동한다', async () => {
      const user = userEvent.setup();
      render(<Home />);
      await user.click(screen.getByText('검색'));
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/discussion/search')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('searchType=0')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('query=test')
      );
    });
  });

  describe('FAB', () => {
    it('로그인 상태에서 FAB(+) 버튼을 표시한다', () => {
      useAuth.mockReturnValue({
        isLoggedIn: true,
        currentUser: { nickname: 'user1' },
      });

      render(<Home />);
      expect(screen.getByRole('button', { name: /새 토론/ })).toBeInTheDocument();
    });

    it('비로그인 상태에서 FAB를 표시하지 않는다', () => {
      useAuth.mockReturnValue({
        isLoggedIn: false,
        currentUser: null,
      });

      render(<Home />);
      expect(screen.queryByRole('button', { name: /새 토론/ })).not.toBeInTheDocument();
    });

    it('FAB 클릭 시 /discussion/new로 이동한다', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isLoggedIn: true,
        currentUser: { nickname: 'user1' },
      });

      render(<Home />);
      await user.click(screen.getByRole('button', { name: /새 토론/ }));
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/new');
    });
  });

  describe('반응형', () => {
    it('모바일 필터 버튼이 존재한다', () => {
      render(<Home />);
      const filterButton = screen.getByRole('button', { name: /필터/ });
      expect(filterButton).toBeInTheDocument();
    });

    it('필터 버튼 클릭 시 FilterBottomSheet를 오픈한다', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Initially bottom sheet is not visible
      expect(screen.queryByTestId('filter-bottom-sheet')).not.toBeInTheDocument();

      // Click mobile filter button
      await user.click(screen.getByRole('button', { name: /필터/ }));

      // Bottom sheet should now be visible
      expect(screen.getByTestId('filter-bottom-sheet')).toBeInTheDocument();
    });

    it('FilterBottomSheet에서 "적용하기" 시 필터가 적용된다', async () => {
      const handleCategoryChange = vi.fn();
      const handleStatusChange = vi.fn();
      const handleDiscussionTypeChange = vi.fn();

      useFilterParams.mockReturnValue({
        categories: [],
        statuses: [],
        discussionTypes: [],
        handleCategoryChange,
        handleStatusChange,
        handleDiscussionTypeChange,
      });

      const user = userEvent.setup();
      render(<Home />);

      // Open bottom sheet
      await user.click(screen.getByRole('button', { name: /필터/ }));

      // Click apply
      await user.click(screen.getByText('적용하기'));

      // Handlers should be called
      expect(handleCategoryChange).toHaveBeenCalledWith(['frontend']);
      expect(handleStatusChange).toHaveBeenCalledWith([]);
      expect(handleDiscussionTypeChange).toHaveBeenCalledWith([]);
    });

    it('FilterBottomSheet 닫기 시 바텀시트가 사라진다', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Open bottom sheet
      await user.click(screen.getByRole('button', { name: /필터/ }));
      expect(screen.getByTestId('filter-bottom-sheet')).toBeInTheDocument();

      // Close bottom sheet
      await user.click(screen.getByText('닫기'));
      expect(screen.queryByTestId('filter-bottom-sheet')).not.toBeInTheDocument();
    });

    it('필터 초기화 시 모든 필터가 해제된다', async () => {
      const handleCategoryChange = vi.fn();
      const handleStatusChange = vi.fn();
      const handleDiscussionTypeChange = vi.fn();

      useFilterParams.mockReturnValue({
        categories: ['frontend'],
        statuses: ['recruiting'],
        discussionTypes: ['online'],
        handleCategoryChange,
        handleStatusChange,
        handleDiscussionTypeChange,
      });

      const user = userEvent.setup();
      render(<Home />);

      // Open bottom sheet
      await user.click(screen.getByRole('button', { name: /필터/ }));

      // Click reset in bottom sheet
      await user.click(screen.getByText('초기화'));

      // All handlers called with empty arrays
      expect(handleCategoryChange).toHaveBeenCalledWith([]);
      expect(handleStatusChange).toHaveBeenCalledWith([]);
      expect(handleDiscussionTypeChange).toHaveBeenCalledWith([]);
    });
  });
});
