import DiscussionCard from './DiscussionCard';
import LoadingSpinner from '../ui/LoadingSpinner/LoadingSpinner';
import EmptyState from '../ui/EmptyState/EmptyState';
import styles from './DiscussionList.module.css';

const DiscussionList = ({
  items,
  loading,
  error,
  hasMore,
  isFetchingMore,
  loaderRef,
  emptyMessage = '게시글이 없습니다.',
  endMessage = '모든 게시물을 불러왔습니다.',
  onDelete,
}) => {
  if (loading) {
    return <LoadingSpinner message="로딩 중..." />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <DiscussionCard
          key={item.id}
          id={item.id}
          discussionType={item.discussionType}
          commonDiscussionInfo={item.commonDiscussionInfo}
          offlineDiscussionInfo={item.offlineDiscussionInfo}
          onlineDiscussionInfo={item.onlineDiscussionInfo}
          onDelete={onDelete}
        />
      ))}

      {hasMore && (
        <div ref={loaderRef} data-testid="scroll-sentinel" className={styles.sentinel}>
          {isFetchingMore && (
            <div data-testid="fetching-more-indicator" className={styles.fetchingMore}>
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className={styles.endMessage}>{endMessage}</div>
      )}
    </div>
  );
};

export default DiscussionList;
