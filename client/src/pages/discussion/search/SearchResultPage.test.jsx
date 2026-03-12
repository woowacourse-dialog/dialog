import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import SearchResultPage from './SearchResultPage';

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
vi.mock('../../../context/AuthContext', () => ({
  AuthContext: { Provider: ({ children }) => children },
  useAuth: vi.fn(() => ({ isLoggedIn: false, currentUser: null })),
}));

vi.mock('../../../hooks/useFilterParams', () => ({
  default: vi.fn(),
}));

vi.mock('../../../hooks/useDiscussionList', () => ({
  default: vi.fn(),
}));

vi.mock('../../../hooks/useInfiniteScroll', () => ({
  default: vi.fn(() => ({ current: null })),
}));

// Mock components
vi.mock('../../../components/SearchBar/SearchBar', () => ({
  default: ({ initialType, initialQuery, onSearch }) => (
    <div data-testid="searchbar">
      <span data-testid="initial-type">{initialType}</span>
      <span data-testid="initial-query">{initialQuery}</span>
      <button onClick={() => onSearch({ searchType: 0, query: 'new-search' })}>검색</button>
    </div>
  ),
}));

vi.mock('../../../components/Filter/FilterCard', () => ({
  default: () => <div data-testid="filter-card">FilterCard</div>,
}));

vi.mock('../../../components/Filter/FilterBottomSheet', () => ({
  default: ({ isOpen, onApply, onReset, onClose }) => (
    isOpen ? (
      <div data-testid="filter-bottom-sheet">
        <button onClick={() => onApply({ categories: ['backend'], statuses: [], discussionTypes: [] })}>
          적용하기
        </button>
        <button onClick={onReset}>초기화</button>
        <button onClick={onClose}>닫기</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../components/Discussion/DiscussionList', () => ({
  default: ({ items, emptyMessage }) => (
    <div data-testid="discussion-list">
      {items.length === 0 ? emptyMessage : `${items.length}개 결과`}
    </div>
  ),
}));

vi.mock('../../../components/FloatingActionButton/FloatingActionButton', () => ({
  default: ({ onClick }) => (
    <button data-testid="fab" aria-label="새 토론 작성" onClick={onClick}>+</button>
  ),
}));

import useFilterParams from '../../../hooks/useFilterParams';
import useDiscussionList from '../../../hooks/useDiscussionList';

describe('SearchResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useFilterParams.mockReturnValue({
      categories: [],
      statuses: [],
      discussionTypes: [],
      searchType: 0,
      query: 'React',
      searchParams: new URLSearchParams('searchType=0&query=React'),
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
      render(<SearchResultPage />);
      expect(screen.getByTestId('searchbar')).toBeInTheDocument();
    });

    it('FilterCard를 렌더링한다', () => {
      render(<SearchResultPage />);
      expect(screen.getByTestId('filter-card')).toBeInTheDocument();
    });

    it('DiscussionList를 렌더링한다', () => {
      render(<SearchResultPage />);
      expect(screen.getByTestId('discussion-list')).toBeInTheDocument();
    });

    it('"검색 결과" 섹션 헤더를 표시한다', () => {
      render(<SearchResultPage />);
      const heading = screen.getByRole('heading', { name: '검색 결과' });
      expect(heading).toBeInTheDocument();
    });

    it('검색어가 있으면 검색어를 표시한다', () => {
      const { container } = render(<SearchResultPage />);
      const querySpan = container.querySelector('.resultQuery');
      expect(querySpan).toBeInTheDocument();
      expect(querySpan.textContent).toContain('React');
    });
  });

  describe('검색어 프리필', () => {
    it('SearchBar에 검색 타입을 미리 채운다', () => {
      render(<SearchResultPage />);
      expect(screen.getByTestId('initial-type')).toHaveTextContent('0');
    });

    it('SearchBar에 검색어를 미리 채운다', () => {
      render(<SearchResultPage />);
      expect(screen.getByTestId('initial-query')).toHaveTextContent('React');
    });
  });

  describe('검색 결과', () => {
    it('검색 결과가 있으면 DiscussionList에 표시한다', () => {
      useDiscussionList.mockReturnValue({
        items: [{ id: 1 }],
        loading: false,
        error: null,
        hasMore: false,
        isFetchingMore: false,
        loadMore: vi.fn(),
      });
      render(<SearchResultPage />);
      expect(screen.getByText('1개 결과')).toBeInTheDocument();
    });

    it('검색 결과가 없으면 "검색 결과가 없습니다." 메시지를 표시한다', () => {
      render(<SearchResultPage />);
      expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });
  });

  describe('FAB', () => {
    it('로그인 상태와 무관하게 FAB를 항상 표시한다', () => {
      render(<SearchResultPage />);
      expect(screen.getByTestId('fab')).toBeInTheDocument();
    });

    it('FAB 클릭 시 /discussion/new로 이동한다', async () => {
      const user = userEvent.setup();
      render(<SearchResultPage />);
      await user.click(screen.getByTestId('fab'));
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/new');
    });
  });

  describe('검색 핸들러', () => {
    it('검색 시 기존 필터를 유지하면서 검색어만 변경한다', async () => {
      const user = userEvent.setup();
      render(<SearchResultPage />);
      await user.click(screen.getByText('검색'));
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/discussion/search')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('query=new-search')
      );
    });
  });

  describe('필터 연동', () => {
    it('useDiscussionList에 searchType과 query를 포함하여 호출한다', () => {
      render(<SearchResultPage />);
      expect(useDiscussionList).toHaveBeenCalledWith(
        expect.objectContaining({
          searchParams: expect.objectContaining({
            searchType: 0,
            query: 'React',
          }),
        })
      );
    });

    it('useFilterParams를 /discussion/search basePath로 호출한다', () => {
      render(<SearchResultPage />);
      expect(useFilterParams).toHaveBeenCalledWith('/discussion/search');
    });

    it('필터 적용 시 핸들러가 호출된다', async () => {
      const handleCategoryChange = vi.fn();
      const handleStatusChange = vi.fn();
      const handleDiscussionTypeChange = vi.fn();

      useFilterParams.mockReturnValue({
        categories: [],
        statuses: [],
        discussionTypes: [],
        searchType: 0,
        query: 'React',
        searchParams: new URLSearchParams('searchType=0&query=React'),
        handleCategoryChange,
        handleStatusChange,
        handleDiscussionTypeChange,
      });

      const user = userEvent.setup();
      render(<SearchResultPage />);

      // Open bottom sheet via mobile filter button
      await user.click(screen.getByRole('button', { name: /필터/ }));

      // Apply filter
      await user.click(screen.getByText('적용하기'));

      expect(handleCategoryChange).toHaveBeenCalledWith(['backend']);
      expect(handleStatusChange).toHaveBeenCalledWith([]);
      expect(handleDiscussionTypeChange).toHaveBeenCalledWith([]);
    });

    it('필터 초기화 시 모든 필터가 해제된다', async () => {
      const handleCategoryChange = vi.fn();
      const handleStatusChange = vi.fn();
      const handleDiscussionTypeChange = vi.fn();

      useFilterParams.mockReturnValue({
        categories: ['frontend'],
        statuses: ['recruiting'],
        discussionTypes: ['online'],
        searchType: 0,
        query: 'React',
        searchParams: new URLSearchParams('searchType=0&query=React'),
        handleCategoryChange,
        handleStatusChange,
        handleDiscussionTypeChange,
      });

      const user = userEvent.setup();
      render(<SearchResultPage />);

      // Open bottom sheet
      await user.click(screen.getByRole('button', { name: /필터/ }));

      // Reset
      await user.click(screen.getByText('초기화'));

      expect(handleCategoryChange).toHaveBeenCalledWith([]);
      expect(handleStatusChange).toHaveBeenCalledWith([]);
      expect(handleDiscussionTypeChange).toHaveBeenCalledWith([]);
    });
  });
});
