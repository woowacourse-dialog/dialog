import React, { useRef, useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar';
import DiscussionList from '../components/DiscussionList';
import useDiscussionList from '../hooks/useDiscussionList';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NotificationGuideModal from '../components/NotificationGuideModal/NotificationGuideModal';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DiscussionFilter from '../components/DiscussionFilter';
import pageStyles from './discussion/search/SearchResultPage.module.css';
import useMe from '../hooks/useMe';

const DEFAULT_PAGE_SIZE = 10;

const Home = () => {
  const { isLoggedIn, checkLoginStatus } = useAuth();
  const { showGuideModal, setShowGuideModal } = useNotification(isLoggedIn);
  const navigate = useNavigate();
  const loaderRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(true);

  useEffect(() => {
    checkLoginStatus();
    // eslint-disable-next-line
  }, []);

  // URL에서 필터 파라미터 추출
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];

  // useDiscussionList 훅 사용 - URL 파라미터를 직접 전달
  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useDiscussionList({
    searchParams: { categories, statuses }, // query, searchType은 홈에서 사용 안 함
    pageSize: DEFAULT_PAGE_SIZE,
  });

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

  // 검색 핸들러: 검색 시 검색 페이지로 이동
  const handleSearch = ({ searchType, query }) => {
    const params = new URLSearchParams();
    params.set('searchType', String(searchType));
    params.set('query', query);
    // 홈에서 검색 시 필터는 유지하지 않음 (선택적)
    // 만약 유지하고 싶다면 아래 주석을 해제
    // if (categories.length > 0) params.set('categories', categories.join(','));
    // if (statuses.length > 0) params.set('statuses', statuses.join(','));
    navigate(`/discussion/search?${params.toString()}`);
  };

  // 필터 적용 핸들러: URL 파라미터 변경
  const handleApplyFilters = ({ categories, statuses }) => {
    const newParams = new URLSearchParams();
    if (categories.length > 0) {
      newParams.set('categories', categories.join(','));
    }
    if (statuses.length > 0) {
      newParams.set('statuses', statuses.join(','));
    }
    const queryString = newParams.toString();
    // 필터 적용 시 항상 /discussion 경로로 이동
    navigate(`/discussion${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <>
      <Header />
      <div
        className={
          pageStyles.pageContainer + (showFilter ? '' : ' ' + pageStyles.centered)
        }
        style={{ marginTop: 64, position: 'relative' }}
      >
        {showFilter && (
          <aside className={pageStyles.sidebar}>
            <DiscussionFilter
              initialCategories={categories}
              initialStatuses={statuses}
              onApply={handleApplyFilters}
              showFilter={showFilter}
              onToggleFilter={() => setShowFilter((prev) => !prev)}
            />
          </aside>
        )}
        <main className={pageStyles.mainContent} style={{ position: 'relative' }}>
          {!showFilter && (
            <DiscussionFilter
              showFilter={showFilter}
              onToggleFilter={() => setShowFilter((prev) => !prev)}
            />
          )}
          <SearchBar onSearch={handleSearch} />
          <h2 style={{ marginTop: 24, textAlign: 'center', padding: '16px' }}>토론 목록</h2>
          <DiscussionList
            items={items}
            loading={loading}
            error={error}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            loaderRef={loaderRef}
            emptyMessage={'게시글이 없습니다.'}
            endMessage={'모든 게시물을 불러왔습니다.'}
          />
        </main>
        {showGuideModal && (
          <NotificationGuideModal onClose={() => setShowGuideModal(false)} />
        )}
      </div>
      {/* 플로팅 액션 버튼 */}
      {isLoggedIn && <div
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
      </div>}
    </>
  );
};

export default Home;
