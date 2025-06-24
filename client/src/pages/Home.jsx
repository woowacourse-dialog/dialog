import React, { useRef, useEffect, useState, useCallback } from 'react';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar';
import DiscussionList from '../components/DiscussionList';
import useDiscussionList from '../hooks/useDiscussionList';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NotificationGuideModal from '../components/NotificationGuideModal/NotificationGuideModal';
import { useSearchParams, useNavigate } from 'react-router-dom';

const DEFAULT_PAGE_SIZE = 10;

const Home = () => {
  const { isLoggedIn } = useAuth();
  const { showGuideModal, setShowGuideModal } = useNotification(isLoggedIn);
  const loaderRef = useRef(null);
  const navigate = useNavigate();
  const [searchParamsObj, setSearchParamsObj] = useState(null); // { searchType, query } or null
  const [searchParams, setSearchParams] = useSearchParams();

  // 쿼리스트링에서 검색 상태 초기화
  useEffect(() => {
    const searchBy = searchParams.get('searchBy');
    const query = searchParams.get('query');
    const size = searchParams.get('size');
    if (searchBy !== null && query) {
      setSearchParamsObj({
        searchType: Number(searchBy),
        query,
        size: size ? Number(size) : DEFAULT_PAGE_SIZE,
      });
    } else {
      setSearchParamsObj(null);
    }
  }, [searchParams]);

  // 검색 시 쿼리스트링 업데이트
  const handleSearch = useCallback(({ searchType, query }) => {
    setSearchParams({
      searchBy: searchType,
      query,
      size: DEFAULT_PAGE_SIZE,
    });
  }, [setSearchParams]);

  // 검색 취소 시 쿼리스트링 초기화
  const handleCancelSearch = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // 커스텀 훅으로 목록/검색/무한스크롤 관리
  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
    reset,
  } = useDiscussionList({ searchParams: searchParamsObj, pageSize: searchParamsObj?.size || DEFAULT_PAGE_SIZE });

  // Intersection Observer로 무한 스크롤 트리거
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

  return (
    <>
      <Header />
      <div className="home" style={{ marginTop: 64 }}>
        <SearchBar
          onSearch={handleSearch}
          initialType={searchParamsObj?.searchType || 0}
          initialQuery={searchParamsObj?.query || ''}
        />
        {searchParamsObj && (
          <button onClick={handleCancelSearch} style={{ marginBottom: 16 }}>검색 취소</button>
        )}
        <DiscussionList
          items={items}
          loading={loading}
          error={error}
          hasMore={hasMore}
          isFetchingMore={isFetchingMore}
          loaderRef={loaderRef}
          emptyMessage={searchParamsObj ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
          endMessage={searchParamsObj ? '모든 검색 결과를 불러왔습니다.' : '모든 게시물을 불러왔습니다.'}
        />
        {showGuideModal && (
          <NotificationGuideModal onClose={() => setShowGuideModal(false)} />
        )}
      </div>
    </>
  );
};

export default Home;
