import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Heart, Bookmark } from 'lucide-react';
import { likeDiscussion, deleteLikeDiscussion } from '../../api/like';
import { scrapDiscussion, deleteScrapDiscussion } from '../../api/scrap';
import styles from './ActionBar.module.css';

const ActionBar = ({
  discussionId,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
  isLoggedIn,
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const handleLike = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      if (isLiked) {
        await deleteLikeDiscussion(discussionId);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await likeDiscussion(discussionId);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(prev => !prev);
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  }, [isLoggedIn, isLiked, discussionId]);

  const handleBookmark = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      if (isBookmarked) {
        await deleteScrapDiscussion(discussionId);
      } else {
        await scrapDiscussion(discussionId);
      }
      setIsBookmarked(prev => !prev);
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  }, [isLoggedIn, isBookmarked, discussionId]);

  return (
    <div className={styles.bar}>
      <button
        className={clsx(styles.action, isLiked && styles.liked)}
        onClick={handleLike}
        aria-label={isLiked ? '좋아요 취소' : '좋아요'}
      >
        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        <span>{likeCount}</span>
      </button>

      <button
        className={clsx(styles.action, isBookmarked && styles.bookmarked)}
        onClick={handleBookmark}
        aria-label={isBookmarked ? '스크랩 취소' : '스크랩'}
      >
        <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        <span>{isBookmarked ? '스크랩됨' : '스크랩'}</span>
      </button>
    </div>
  );
};

export default ActionBar;
