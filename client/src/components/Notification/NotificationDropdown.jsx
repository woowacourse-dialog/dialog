import React, { useRef, useEffect } from 'react';
import './NotificationDropdown.css';

const NotificationDropdown = ({ notifications, onRead, onReadAll, onClose, onLoadMore, hasMore, isLoading }) => {
    const listRef = useRef(null);

    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
                onLoadMore();
            }
        }
    };

    const handleRead = (e, id) => {
        e.stopPropagation();
        onRead(id);
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
                            onClick={(e) => handleRead(e, notification.id)}
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
