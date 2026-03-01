import React from 'react';
import SearchBar from '../components/SearchBar';
import DiscussionList from '../components/DiscussionList';
import NoticeButton from '../components/Notice/NoticeButton';
import useDiscussionList from '../hooks/useDiscussionList';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NotificationGuideModal from '../components/NotificationGuideModal/NotificationGuideModal';
import { useNavigate } from 'react-router-dom';
import DiscussionFilterBar from '../components/DiscussionFilterBar';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import useFilterParams from '../hooks/useFilterParams';
import FloatingActionButton from '../components/FloatingActionButton/FloatingActionButton';


const DEFAULT_PAGE_SIZE = 10;

const Home = () => {
  const { isLoggedIn } = useAuth();
  const { showGuideModal, setShowGuideModal } = useNotification(isLoggedIn);
  const navigate = useNavigate();
  const {
    categories,
    statuses,
    discussionTypes,
    handleCategoryChange,
    handleStatusChange,
    handleDiscussionTypeChange,
  } = useFilterParams('/discussion');

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

  const loaderRef = useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore });

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

  return (
    <>
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
        <FloatingActionButton onClick={() => navigate('/discussion/new')} />
      )}
    </>
  );
};

export default Home;
