import { useNavigate } from 'react-router-dom';
import DiscussionList from '../../../components/Discussion/DiscussionList';
import useScrapDiscussionList from '../../../hooks/useScrapDiscussionList';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import PageBanner from '../../../components/ui/PageBanner/PageBanner';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import styles from './ScrapDiscussionPage.module.css';

const DEFAULT_PAGE_SIZE = 10;

const ScrapDiscussionPage = () => {
  const navigate = useNavigate();
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

  const loaderRef = useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore });

  return (
    <div className={styles.page}>
      <div className={styles.mainContent}>
        <PageBanner
          title="스크랩한 토론"
          onBack={() => navigate(-1)}
        />
        {loading ? (
          <LoadingSpinner message="토론을 불러오는 중..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            message="아직 스크랩한 토론이 없습니다."
            description="관심있는 토론을 스크랩해보세요!"
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

export default ScrapDiscussionPage;
