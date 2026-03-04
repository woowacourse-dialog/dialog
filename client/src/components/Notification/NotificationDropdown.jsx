import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import styles from './NotificationDropdown.module.css';

const NotificationDropdown = ({
  notifications,
  onRead,
  onReadAll,
  onClose,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
        onLoadMore();
      }
    }
  };

  const handleNotificationClick = (notification) => {
    onRead(notification.id);

    const { routeParams } = notification;
    if (routeParams) {
      const { type, discussionId, discussionCommentId, replyId } = routeParams;
      if ((type === 'DISCUSSION_COMMENT' || type === 'COMMENT_REPLY') && discussionId) {
        let path = `/discussion/${discussionId}`;
        const targetCommentId = type === 'COMMENT_REPLY' ? replyId : discussionCommentId;
        if (targetCommentId) {
          path += `#comment-${targetCommentId}`;
        }
        navigate(path);
        onClose();
      }
    }
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <div className={styles.header}>
        <span className={styles.title}>알림</span>
        {notifications.length > 0 && (
          <button className={styles.readAllButton} onClick={onReadAll}>
            모두 읽음
          </button>
        )}
      </div>

      <div
        className={styles.list}
        ref={listRef}
        onScroll={handleScroll}
      >
        {notifications.length === 0 && !isLoading ? (
          <div className={styles.empty}>새로운 알림이 없습니다.</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={clsx(
                styles.item,
                notification.isRead ? styles.read : styles.unread,
              )}
              onClick={() => handleNotificationClick(notification)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNotificationClick(notification);
              }}
            >
              <div
                className={clsx(
                  styles.dot,
                  notification.isRead ? styles.dotRead : styles.dotUnread,
                )}
              />
              <div className={styles.content}>
                <div className={styles.message}>{notification.message}</div>
                <div className={styles.date}>
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && <div className={styles.loading}>로딩 중...</div>}
      </div>
    </div>
  );
};

export default NotificationDropdown;
