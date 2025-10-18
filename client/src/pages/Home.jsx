import React, { useRef, useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar';
import DiscussionList from '../components/DiscussionList';
import NoticeButton from '../components/Notice/NoticeButton';
import useDiscussionList from '../hooks/useDiscussionList';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NotificationGuideModal from '../components/NotificationGuideModal/NotificationGuideModal';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DiscussionFilterBar from '../components/DiscussionFilterBar';
import pageStyles from './discussion/search/SearchResultPage.module.css';
import useMe from '../hooks/useMe';

const DEFAULT_PAGE_SIZE = 10;

const Home = () => {
  const { isLoggedIn, checkLoginStatus } = useAuth();
  const { showGuideModal, setShowGuideModal } = useNotification(isLoggedIn);
  const navigate = useNavigate();
  const loaderRef = useRef(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkLoginStatus();
    // eslint-disable-next-line
  }, []);

  // URL에서 필터 파라미터 추출
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
  const discussionTypes = searchParams.get('discussionTypes')?.split(',').filter(Boolean) || [];

  // useDiscussionList 훅 사용 - URL 파라미터를 직접 전달
  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useDiscussionList({
    searchParams: { categories, statuses, discussionTypes }, // query, searchType은 홈에서 사용 안 함
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

  // 필터 변경 핸들러
  const handleCategoryChange = (newCategories) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCategories.length > 0) {
      newParams.set('categories', newCategories.join(','));
    } else {
      newParams.delete('categories');
    }
    navigate(`/discussion?${newParams.toString()}`);
  };

  const handleStatusChange = (newStatuses) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatuses.length > 0) {
      newParams.set('statuses', newStatuses.join(','));
    } else {
      newParams.delete('statuses');
    }
    navigate(`/discussion?${newParams.toString()}`);
  };

  const handleDiscussionTypeChange = (newTypes) => {
    const newParams = new URLSearchParams(searchParams);
    if (newTypes.length > 0) {
      newParams.set('discussionTypes', newTypes.join(','));
    } else {
      newParams.delete('discussionTypes');
    }
    navigate(`/discussion?${newParams.toString()}`);
  };

  // 플로팅 액션 버튼 스타일
  const getFloatingButtonStyle = () => {
    const isMobile = window.innerWidth <= 768;
    return {
      position: 'fixed',
      bottom: isMobile ? '20px' : '30px',
      right: isMobile ? '20px' : '30px',
      width: isMobile ? '50px' : '60px',
      height: isMobile ? '50px' : '60px',
      borderRadius: '50%',
      backgroundColor: '#303e4f',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '20px' : '24px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      zIndex: 1000
    };
  };

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
        <SearchBar onSearch={handleSearch} />
        <DiscussionFilterBar
          selectedCategories={categories}
          selectedStatuses={statuses}
          selectedDiscussionTypes={discussionTypes}
          onCategoryChange={handleCategoryChange}
          onStatusChange={handleStatusChange}
          onDiscussionTypeChange={handleDiscussionTypeChange}
        />
        <h2 style={{ textAlign: 'center', padding: '16px' }}>토론 목록</h2>
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
        {showGuideModal && (
          <NotificationGuideModal onClose={() => setShowGuideModal(false)} />
        )}
      </div>
      
      {/* 공지사항 버튼 */}
      <NoticeButton />
      
      {/* 플로팅 액션 버튼 */}
      {isLoggedIn && (
        <div
          style={getFloatingButtonStyle()}
          onClick={() => navigate('/discussion/new')}
          onMouseEnter={handleFloatingButtonMouseEnter}
          onMouseLeave={handleFloatingButtonMouseLeave}
        >
          +
        </div>
      )}
    </>
  );
};

export default Home;
