import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import NoticeList from './NoticeList';
import './Notice.css';

const NoticeModal = ({ notices, onClose }) => {
  const [selectedNotice, setSelectedNotice] = useState(null);

  const handleNoticeSelect = (notice) => {
    setSelectedNotice(notice);
  };

  const handleBackToList = () => {
    setSelectedNotice(null);
  };

  return (
    <div className="notice-modal-overlay" onClick={onClose}>
      <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notice-modal-header">
          <h2>공지사항</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="notice-modal-content">
          {selectedNotice ? (
            <div className="notice-detail">
              <button className="back-button" onClick={handleBackToList}>
                ← 목록으로
              </button>
              <div className="notice-detail-header">
                <h3>{selectedNotice.title}</h3>
                <div className="notice-meta">
                  <span className="notice-date">{selectedNotice.date}</span>
                  <span className={`notice-priority priority-${selectedNotice.priority}`}>
                    {selectedNotice.priority === 'high' ? '🔴 긴급' : 
                     selectedNotice.priority === 'medium' ? '🟡 중요' : '🟢 일반'}
                  </span>
                </div>
              </div>
              <div className="notice-content">
                <div dangerouslySetInnerHTML={{ __html: selectedNotice.content }} />
              </div>
            </div>
          ) : (
            <NoticeList 
              notices={notices}
              onNoticeSelect={handleNoticeSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;
