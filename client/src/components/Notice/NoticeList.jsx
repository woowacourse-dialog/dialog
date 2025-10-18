import React from 'react';
import NoticeItem from './NoticeItem';
import './Notice.css';

const NoticeList = ({ notices, onNoticeSelect }) => {
  if (notices.length === 0) {
    return (
      <div className="notice-empty">
        <p>공지사항이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="notice-list">
      {notices.map((notice) => (
        <NoticeItem
          key={notice.id}
          notice={notice}
          onClick={() => onNoticeSelect(notice)}
        />
      ))}
    </div>
  );
};

export default NoticeList;
