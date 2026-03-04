import { Bookmark } from 'lucide-react';
import DiscussionList from '../../../components/Discussion/DiscussionList';
import useScrapDiscussionList from '../../../hooks/useScrapDiscussionList';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import PageBanner from '../../../components/ui/PageBanner/PageBanner';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import styles from './ScrapDiscussionPage.module.css';

const DEFAULT_PAGE_SIZE = 10;

const ScrapDiscussionPage = () => {
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
      <PageBanner
        icon={<Bookmark size={28} />}
        title="내가 스크랩한 토론"
        subtitle="관심있는 토론을 한눈에 모아보세요!"
      />
      <div className={styles.listContainer}>
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
