import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDiscussionList from '../hooks/useDiscussionList';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import useFilterParams from '../hooks/useFilterParams';
import SearchBar from '../components/SearchBar/SearchBar';
import FilterCard from '../components/Filter/FilterCard';
import FilterBottomSheet from '../components/Filter/FilterBottomSheet';
import DiscussionList from '../components/Discussion/DiscussionList';
import FloatingActionButton from '../components/FloatingActionButton/FloatingActionButton';
import Button from '../components/ui/Button/Button';
import { SlidersHorizontal } from 'lucide-react';
import styles from './Home.module.css';

const DEFAULT_PAGE_SIZE = 10;

const Home = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const {
    categories,
    statuses,
    discussionTypes,
    handleCategoryChange,
    handleStatusChange,
    handleDiscussionTypeChange,
  } = useFilterParams('/discussion');

  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useDiscussionList({
    searchParams: { categories, statuses, discussionTypes },
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const loaderRef = useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore });

  const handleSearch = ({ searchType, query }) => {
    const params = new URLSearchParams();
    params.set('searchType', String(searchType));
    params.set('query', query);
    navigate(`/discussion/search?${params.toString()}`);
  };

  const handleFilterReset = () => {
    handleCategoryChange([]);
    handleStatusChange([]);
    handleDiscussionTypeChange([]);
  };

  const handleFilterApply = ({ categories, statuses, discussionTypes }) => {
    handleCategoryChange(categories);
    handleStatusChange(statuses);
    handleDiscussionTypeChange(discussionTypes);
  };

  return (
    <div className={styles.page}>
      {/* 검색바 */}
      <div className={styles.searchSection}>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* 모바일 필터 버튼 */}
      <div className={styles.mobileFilterButton}>
        <Button
          variant="secondary"
          leftIcon={<SlidersHorizontal size={16} />}
          onClick={() => setShowFilterSheet(true)}
        >
          필터
        </Button>
      </div>

      {/* 메인 레이아웃: 사이드바 + 콘텐츠 */}
      <div className={styles.layout} data-testid="home-layout">
        {/* 데스크톱 사이드바 */}
        <aside className={styles.sidebar}>
          <FilterCard
            selectedCategories={categories}
            selectedStatuses={statuses}
            selectedDiscussionTypes={discussionTypes}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
            onDiscussionTypeChange={handleDiscussionTypeChange}
            onReset={handleFilterReset}
          />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className={styles.main}>
          <DiscussionList
            items={items}
            loading={loading}
            error={error}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            loaderRef={loaderRef}
            emptyMessage="게시글이 없습니다."
            endMessage="모든 게시물을 불러왔습니다."
          />
        </main>
      </div>

      {/* 모바일 필터 바텀시트 */}
      <FilterBottomSheet
        isOpen={showFilterSheet}
        selectedCategories={categories}
        selectedStatuses={statuses}
        selectedDiscussionTypes={discussionTypes}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        onClose={() => setShowFilterSheet(false)}
      />

      {/* FAB — 로그인 시만 */}
      {isLoggedIn && (
        <FloatingActionButton onClick={() => navigate('/discussion/new')} />
      )}
    </div>
  );
};

export default Home;
