import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import DiscussionList from '../../../components/DiscussionList';
import useScrapDiscussionList from '../../../hooks/useScrapDiscussionList';
import { FaBookmark } from 'react-icons/fa';
import '../my/MyDiscussionPage.css';

const DEFAULT_PAGE_SIZE = 10;

const ScrapDiscussionPage = () => {
  const navigate = useNavigate();
  const loaderRef = useRef(null);

  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useScrapDiscussionList({
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

  return (
    <>
      <Header />
      <div className="my-discussion-page-fancy" style={{ minHeight: '100vh', background: '#fff', paddingTop: 64 }}>
        {/* 상단 배너 */}
        <div className="my-discussion-banner">
          <div className="banner-icon"><FaBookmark size={36} /></div>
          <div className="banner-title">내가 스크랩한 토론</div>
          <div className="banner-desc">관심있는 토론을 한눈에 모아보세요!</div>
        </div>
        {/* 카드 그리드 컨테이너 */}
        <div className="my-discussion-list-container">
          {loading ? (
            <div className="my-discussion-loading">
              <div className="loading-spinner"></div>
              <div style={{ marginTop: 16, color: '#303e4f', fontWeight: 600 }}>토론을 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="my-discussion-error">{error}</div>
          ) : items.length === 0 ? (
            <div className="my-discussion-empty">
              <img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/bookmark.svg" alt="empty" style={{ width: 80, marginBottom: 16 }} />
              <div style={{ color: '#888', fontWeight: 500, fontSize: '1.1rem' }}>아직 스크랩한 토론이 없습니다.<br/>관심있는 토론을 스크랩해보세요!</div>
            </div>
          ) : (
            <DiscussionList
              items={items}
              loading={false}
              error={null}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
              loaderRef={loaderRef}
              emptyMessage=""
              endMessage=""
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ScrapDiscussionPage; 