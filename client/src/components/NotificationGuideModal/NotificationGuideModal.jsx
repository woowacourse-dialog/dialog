import React from 'react';
import './NotificationGuideModal.css';

const NotificationGuideModal = ({ onClose }) => {
  return (
    <div className="notification-guide-modal-overlay">
      <div className="notification-guide-modal">
        <div className="modal-header">
          <h2>브라우저 알림 설정 안내</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <p>Dialog에서 실시간 알림을 받으시려면 브라우저의 알림 설정을 허용해 주세요.</p>
          <p>브라우저 상단에 나타나는 알림 허용 팝업에서 '허용'을 선택해 주세요.</p>
          <div className="info-box">
            <p>💡 알림 설정은 언제든지 마이페이지에서 변경하실 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationGuideModal;
