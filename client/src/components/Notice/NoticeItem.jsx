import React from 'react';
import { getPriorityStyle, getReadNotices, markNoticeAsRead } from '../../utils/noticeUtils';
import { formatCommentDate } from '../../utils/dateUtils';
import './Notice.css';

const NoticeItem = ({ notice, onClick }) => {
  const priorityStyle = getPriorityStyle(notice.priority);
  const readNotices = getReadNotices();
  const isRead = readNotices.includes(notice.id);

  const handleClick = () => {
    if (!isRead) {
      markNoticeAsRead(notice.id);
    }
    onClick();
  };

  return (
    <div 
      className={`notice-item ${isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notice-item-header">
        <h4 className="notice-title">{notice.title}</h4>
        <div className="notice-badges">
          <span 
            className="priority-badge"
            style={{
              color: priorityStyle.color,
              backgroundColor: priorityStyle.backgroundColor,
              borderColor: priorityStyle.borderColor
            }}
          >
            {priorityStyle.icon} {priorityStyle.label}
          </span>
          {!isRead && <span className="unread-badge">NEW</span>}
        </div>
      </div>
      
      <div className="notice-item-meta">
        <span className="notice-date">{formatCommentDate(notice.date)}</span>
      </div>
      
      <div className="notice-preview">
        {notice.content.substring(0, 100)}...
      </div>
    </div>
  );
};

export default NoticeItem;
