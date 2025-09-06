import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// FCM 토큰을 서버에 저장
const saveTokenToServer = async (token) => {
  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/fcm-tokens`, { token }, { withCredentials: true });
    // 토큰 저장 성공 시 로컬 스토리지에 저장
    localStorage.setItem('fcmToken', token);
    return token;
  } catch (error) {
    console.error('Failed to save FCM token to server:', error);
    throw error;
  }
};

// FCM 토큰 발급 및 저장
const getTokenAndSave = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    if (!currentToken) {
      throw new Error('No registration token available');
    }

    // 이전에 저장된 토큰과 비교
    const savedToken = localStorage.getItem('fcmToken');
    if (savedToken !== currentToken) {
      // 토큰이 변경된 경우에만 서버에 저장
      return await saveTokenToServer(currentToken);
    }
    
    return currentToken;
  } catch (error) {
    console.error('FCM token error:', error);
    throw error;
  }
};

// Service Worker 등록 및 초기화
const initializeServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    registration.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: firebaseConfig
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration error:', error);
    throw error;
  }
};

// 알림 권한 요청 및 토큰 발급
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support desktop notification');
  }

  try {
    if (Notification.permission === 'granted') {
      return getTokenAndSave();
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted' ? getTokenAndSave() : null;
  } catch (error) {
    console.error('Notification permission error:', error);
    throw error;
  }
};

// Foreground 메시지 핸들러
export const onMessageListener = () =>
  new Promise(resolve => onMessage(messaging, resolve));

// Service Worker 초기화 실행
initializeServiceWorker(); 
