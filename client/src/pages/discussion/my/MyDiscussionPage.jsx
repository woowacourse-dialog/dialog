import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import DiscussionList from '../../../components/Discussion/DiscussionList';
import useMyDiscussionList from '../../../hooks/useMyDiscussionList';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import PageBanner from '../../../components/ui/PageBanner/PageBanner';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import styles from './MyDiscussionPage.module.css';

const DEFAULT_PAGE_SIZE = 10;

const MyDiscussionPage = () => {
  const navigate = useNavigate();

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
    <div className={styles.page}>
      <PageBanner
        icon={<Crown size={28} />}
        title="내가 개설한 토론"
        subtitle="내가 만든 토론을 한눈에 관리해보세요!"
      />
      <div className={styles.listContainer}>
        {loading ? (
          <LoadingSpinner message="토론을 불러오는 중..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            message="아직 개설한 토론이 없습니다."
            description="첫 토론을 만들어보세요!"
            actionLabel="새 토론 만들기"
            onAction={() => navigate('/discussion/new')}
          />
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
  );
};

export default MyDiscussionPage;
