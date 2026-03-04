import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDiscussionList from '../../../hooks/useDiscussionList';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import useFilterParams from '../../../hooks/useFilterParams';
import SearchBar from '../../../components/SearchBar/SearchBar';
import FilterCard from '../../../components/Filter/FilterCard';
import FilterBottomSheet from '../../../components/Filter/FilterBottomSheet';
import DiscussionList from '../../../components/Discussion/DiscussionList';
import FloatingActionButton from '../../../components/FloatingActionButton/FloatingActionButton';
import Button from '../../../components/ui/Button/Button';
import { SlidersHorizontal } from 'lucide-react';
import styles from './SearchResultPage.module.css';

const DEFAULT_PAGE_SIZE = 10;

const SearchResultPage = () => {
  const navigate = useNavigate();
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const {
    categories,
    statuses,
    discussionTypes,
    searchType,
    query,
    searchParams,
    handleCategoryChange,
    handleStatusChange,
    handleDiscussionTypeChange,
  } = useFilterParams('/discussion/search');

  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useDiscussionList({
    searchParams: { searchType, query, categories, statuses, discussionTypes },
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const loaderRef = useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore });

  const handleSearch = ({ searchType, query }) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('searchType', String(searchType));
    newParams.set('query', query);
    navigate(`/discussion/search?${newParams.toString()}`);
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
      {/* 검색바 (프리필) */}
      <div className={styles.searchSection}>
        <SearchBar
          onSearch={handleSearch}
          initialType={searchType}
          initialQuery={query}
        />
      </div>

      {/* 검색 결과 헤더 */}
      <div className={styles.resultHeader}>
        <h2 className={styles.resultTitle}>검색 결과</h2>
        {query && (
          <span className={styles.resultQuery}>&ldquo;{query}&rdquo;</span>
        )}
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
      <div className={styles.layout}>
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

        <main className={styles.main}>
          <DiscussionList
            items={items}
            loading={loading}
            error={error}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            loaderRef={loaderRef}
            emptyMessage="검색 결과가 없습니다."
            endMessage="모든 검색 결과를 불러왔습니다."
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

      {/* FAB — 항상 표시 */}
      <FloatingActionButton onClick={() => navigate('/discussion/new')} />
    </div>
  );
};

export default SearchResultPage;
