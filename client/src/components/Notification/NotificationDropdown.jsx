import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const NotificationDropdown = ({ notifications, onRead, onReadAll, onClose, onLoadMore, hasMore, isLoading }) => {
    const listRef = useRef(null);
    const navigate = useNavigate();

    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
                onLoadMore();
            }
        }
    };

    const handleNotificationClick = (e, notification) => {
        e.stopPropagation();
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

    const handleReadAll = (e) => {
        e.stopPropagation();
        onReadAll();
    };

    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <span className="notification-title">알림</span>
                {notifications.length > 0 && (
                    <button className="read-all-button" onClick={handleReadAll}>
                        모두 읽음
                    </button>
                )}
            </div>
            <div
                className="notification-list"
                ref={listRef}
                onScroll={handleScroll}
            >
                {notifications.length === 0 && !isLoading ? (
                    <div className="notification-empty">새로운 알림이 없습니다.</div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={(e) => handleNotificationClick(e, notification)}
                        >
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-date">
                                {new Date(notification.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && <div className="notification-loading">로딩 중...</div>}
            </div>
        </div>
    );
};

export default NotificationDropdown;
