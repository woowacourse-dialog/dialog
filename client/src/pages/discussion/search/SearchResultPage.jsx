import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDiscussionList from '../../../hooks/useDiscussionList';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import useFilterParams from '../../../hooks/useFilterParams';
import DiscussionList from '../../../components/DiscussionList';
import FloatingActionButton from '../../../components/FloatingActionButton/FloatingActionButton';

import SearchBar from '../../../components/SearchBar';
import DiscussionFilterBar from '../../../components/DiscussionFilterBar';

const DEFAULT_PAGE_SIZE = 10;

const SearchResultPage = () => {
  const navigate = useNavigate();

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

  // 검색 핸들러: 기존 필터는 유지하면서 검색어만 변경
  const handleSearch = ({ searchType, query }) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('searchType', String(searchType));
    newParams.set('query', query);
    navigate(`/discussion/search?${newParams.toString()}`);
  };

  return (
    <>

      <div style={{ marginTop: 64, maxWidth: 1200, margin: '64px auto 0', padding: '0 20px' }}>
        <SearchBar
          onSearch={handleSearch}
          initialType={searchType}
          initialQuery={query}
        />
        <DiscussionFilterBar
          selectedCategories={categories}
          selectedStatuses={statuses}
          selectedDiscussionTypes={discussionTypes}
          onCategoryChange={handleCategoryChange}
          onStatusChange={handleStatusChange}
          onDiscussionTypeChange={handleDiscussionTypeChange}
        />
        <h2 style={{ marginTop: 24, textAlign: 'center', padding: '16px' }}>검색 결과</h2>
        <DiscussionList
          items={items}
          loading={loading}
          error={error}
          hasMore={hasMore}
          isFetchingMore={isFetchingMore}
          loaderRef={loaderRef}
          emptyMessage={'검색 결과가 없습니다.'}
          endMessage={'모든 검색 결과를 불러왔습니다.'}
        />
      </div>
      <FloatingActionButton onClick={() => navigate('/discussion/new')} />
    </>
  );
};

export default SearchResultPage;
