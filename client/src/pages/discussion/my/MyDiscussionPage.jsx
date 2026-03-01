import React from 'react';
import { useNavigate } from 'react-router-dom';

import DiscussionList from '../../../components/DiscussionList';
import useMyDiscussionList from '../../../hooks/useMyDiscussionList';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import { FaCrown, FaRegSmileBeam } from 'react-icons/fa';
import './MyDiscussionPage.css';

const DEFAULT_PAGE_SIZE = 10;

const MyDiscussionPage = () => {
  const navigate = useNavigate();

  // useMyDiscussionList 훅 사용
  const {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
  } = useMyDiscussionList({
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const loaderRef = useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore });

  return (
    <>
      
      <div className="my-discussion-page-fancy" style={{ minHeight: '100vh', background: '#fff', paddingTop: 64 }}>
        {/* 상단 배너 */}
        <div className="my-discussion-banner">
          <div className="banner-icon"><FaCrown size={36} /></div>
          <div className="banner-title">내가 개설한 토론</div>
          <div className="banner-desc">내가 만든 토론을 한눈에 관리해보세요!</div>
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
              <FaRegSmileBeam size={80} color="#cbd5e1" style={{ marginBottom: 16 }} />
              <div style={{ color: '#888', fontWeight: 500, fontSize: '1.1rem' }}>아직 개설한 토론이 없습니다.<br/>첫 토론을 만들어보세요!</div>
              <button className="my-discussion-create-btn" onClick={() => navigate('/discussion/new')}>+ 새 토론 만들기</button>
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

export default MyDiscussionPage; 