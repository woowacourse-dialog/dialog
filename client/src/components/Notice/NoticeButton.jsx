import React, { useState, useEffect } from 'react';
import { FaBullhorn, FaTimes } from 'react-icons/fa';
import NoticeModal from './NoticeModal';
import { fetchNotices, hasUnreadNotices } from '../../utils/noticeUtils';
import './Notice.css';

const NoticeButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const fetchedNotices = await fetchNotices();
      setNotices(fetchedNotices);
      setHasUnread(hasUnreadNotices(fetchedNotices));
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // 모달이 닫힐 때 읽지 않은 공지사항 상태 업데이트
    setHasUnread(hasUnreadNotices(notices));
  };

  if (isLoading) {
    return null; // 로딩 중에는 버튼을 표시하지 않음
  }

  return (
    <>
      <button 
        className={`notice-button ${hasUnread ? 'has-unread' : ''}`}
        onClick={handleButtonClick}
        title="공지사항"
      >
        <FaBullhorn className="notice-icon" />
        {hasUnread && <span className="unread-indicator" />}
      </button>
      
      {isModalOpen && (
        <NoticeModal 
          notices={notices}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default NoticeButton;
