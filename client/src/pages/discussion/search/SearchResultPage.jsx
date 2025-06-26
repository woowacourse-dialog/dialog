import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useDiscussionList from '../../../hooks/useDiscussionList';
import DiscussionList from '../../../components/DiscussionList';
import Header from '../../../components/Header/Header';
import SearchBar from '../../../components/SearchBar';

const DEFAULT_PAGE_SIZE = 10;

const SearchResultPage = () => {
  const [searchParams] = useSearchParams();
  const searchType = Number(searchParams.get('searchType'));
  const query = searchParams.get('query') || '';
  const loaderRef = useRef(null);
  const navigate = useNavigate();

  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useDiscussionList({
    searchParams: { searchType, query },
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

  // 검색 핸들러: 검색 시 /discussion/search로 이동
  const handleSearch = ({ searchType, query }) => {
    navigate(`/discussion/search?searchType=${searchType}&query=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <Header />
      <div className="home" style={{ marginTop: 64 }}>
        <SearchBar
          onSearch={handleSearch}
          initialType={searchType}
          initialQuery={query}
        />
        <h2>검색 결과</h2>
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
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#4bd1cc',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onClick={() => navigate('/discussion/new')}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        +
      </div>
    </>
  );
};

export default SearchResultPage;
