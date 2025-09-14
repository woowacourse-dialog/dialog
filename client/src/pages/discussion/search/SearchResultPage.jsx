import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useDiscussionList from '../../../hooks/useDiscussionList';
import DiscussionList from '../../../components/DiscussionList';
import Header from '../../../components/Header/Header';
import SearchBar from '../../../components/SearchBar';
import DiscussionFilter from '../../../components/DiscussionFilter';
import pageStyles from './SearchResultPage.module.css';

const DEFAULT_PAGE_SIZE = 10;

const SearchResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loaderRef = useRef(null);
  // 데스크톱에서는 필터가 기본적으로 열려있고, 모바일에서는 닫혀있음
  const [showFilter, setShowFilter] = useState(window.innerWidth > 768);

  // 화면 크기 변경 시 필터 상태 조정
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768;
      setShowFilter(isDesktop);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // URL에서 검색 및 필터 파라미터 추출
  const searchType = Number(searchParams.get('searchType')) || 0;
  const query = searchParams.get('query') || '';
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];

  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useDiscussionList({
    searchParams: { searchType, query, categories, statuses },
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

  // 필터 적용 핸들러: 기존 검색어는 유지하면서 필터만 변경
  const handleApplyFilters = ({ categories, statuses }) => {
    const newParams = new URLSearchParams(searchParams);
    if (categories.length > 0) {
      newParams.set('categories', categories.join(','));
    } else {
      newParams.delete('categories');
    }
    if (statuses.length > 0) {
      newParams.set('statuses', statuses.join(','));
    } else {
      newParams.delete('statuses');
    }
    navigate(`/discussion/search?${newParams.toString()}`);
  };

  const handleToggleFilter = () => {
    setShowFilter(prev => !prev);
  };

  const getPageContainerClassName = () => {
    const baseClass = pageStyles.pageContainer;
    const centeredClass = showFilter ? '' : pageStyles.centered;
    return `${baseClass} ${centeredClass}`.trim();
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
      <div
        className={getPageContainerClassName()}
        style={{ marginTop: 64, position: 'relative' }}
      >
        {showFilter && (
          <aside className={pageStyles.sidebar}>
            <DiscussionFilter
              initialCategories={categories}
              initialStatuses={statuses}
              onApply={handleApplyFilters}
              showFilter={showFilter}
              onToggleFilter={handleToggleFilter}
            />
          </aside>
        )}
        <main className={pageStyles.mainContent} style={{ position: 'relative' }}>
          {!showFilter && (
            <DiscussionFilter
              showFilter={showFilter}
              onToggleFilter={handleToggleFilter}
            />
          )}
          <SearchBar
            onSearch={handleSearch}
            initialType={searchType}
            initialQuery={query}
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
        </main>
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
