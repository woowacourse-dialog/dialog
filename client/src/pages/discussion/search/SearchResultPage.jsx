import React, { useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useDiscussionList from '../../../hooks/useDiscussionList';
import DiscussionList from '../../../components/DiscussionList';
import Header from '../../../components/Header/Header';
import SearchBar from '../../../components/SearchBar';
import DiscussionFilterBar from '../../../components/DiscussionFilterBar';

const DEFAULT_PAGE_SIZE = 10;

const SearchResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loaderRef = useRef(null);

  // URL에서 검색 및 필터 파라미터 추출
  const searchType = Number(searchParams.get('searchType')) || 0;
  const query = searchParams.get('query') || '';
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
  const discussionTypes = searchParams.get('discussionTypes')?.split(',').filter(Boolean) || [];

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

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || isFetchingMore) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !isFetchingMore) {
        loadMore();
      }
    }, { threshold: 1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, isFetchingMore]);

  // 검색 핸들러: 기존 필터는 유지하면서 검색어만 변경
  const handleSearch = ({ searchType, query }) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('searchType', String(searchType));
    newParams.set('query', query);
    navigate(`/discussion/search?${newParams.toString()}`);
  };

  // 필터 변경 핸들러
  const handleCategoryChange = (newCategories) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCategories.length > 0) {
      newParams.set('categories', newCategories.join(','));
    } else {
      newParams.delete('categories');
    }
    navigate(`/discussion/search?${newParams.toString()}`);
  };

  const handleStatusChange = (newStatuses) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatuses.length > 0) {
      newParams.set('statuses', newStatuses.join(','));
    } else {
      newParams.delete('statuses');
    }
    navigate(`/discussion/search?${newParams.toString()}`);
  };

  const handleDiscussionTypeChange = (newTypes) => {
    const newParams = new URLSearchParams(searchParams);
    if (newTypes.length > 0) {
      newParams.set('discussionTypes', newTypes.join(','));
    } else {
      newParams.delete('discussionTypes');
    }
    navigate(`/discussion/search?${newParams.toString()}`);
  };

  const getFloatingButtonStyle = () => ({
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#303e4f',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    zIndex: 1000
  });

  // 플로팅 버튼 이벤트 핸들러
  const handleFloatingButtonMouseEnter = (e) => {
    e.target.style.transform = 'scale(1.1)';
    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
  };

  const handleFloatingButtonMouseLeave = (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  };

  return (
    <>
      <Header />
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
      {/* 플로팅 액션 버튼 */}
      <div
        style={getFloatingButtonStyle()}
        onClick={() => navigate('/discussion/new')}
        onMouseEnter={handleFloatingButtonMouseEnter}
        onMouseLeave={handleFloatingButtonMouseLeave}
      >
        +
      </div>
    </>
  );
};

export default SearchResultPage;
