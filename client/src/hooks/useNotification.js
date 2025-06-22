import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../firebase';

export const useNotification = (isLoggedIn) => {
  const [notificationStatus, setNotificationStatus] = useState('pending');
  const [showGuideModal, setShowGuideModal] = useState(false);

  const initializeNotifications = async () => {
    if (!isLoggedIn || !('Notification' in window)) {
      return;
    }

    try {
      // 현재 알림 권한 상태 확인
      if (Notification.permission === 'default') {
        setShowGuideModal(true);
      }

      const token = await requestNotificationPermission();
      if (token) {
        setNotificationStatus('granted');
        console.log('Successfully enabled notifications with token:', token);
        return token;
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setNotificationStatus('denied');
      throw new Error('알림 권한 설정에 실패했습니다. 브라우저 설정에서 알림을 허용해주세요.');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      initializeNotifications();
    }
  }, [isLoggedIn]);

  return {
    notificationStatus,
    showGuideModal,
    setShowGuideModal,
    initializeNotifications
  };
};
