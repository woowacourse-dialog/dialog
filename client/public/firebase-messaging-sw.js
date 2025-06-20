// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let firebaseApp;

// 알림 옵션 생성 함수
const createNotificationOptions = (payload) => ({
  body: payload.notification.body,
  icon: '/dialog_icon.png',
  badge: '/dialog_icon.png',
  tag: 'notification-' + Date.now(),
  requireInteraction: true,
  data: payload.data
});

// 알림 표시 함수
const showNotification = (title, options) => 
  self.registration.showNotification(title, options);

// Push 이벤트 핸들러
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    event.waitUntil(
      showNotification(
        payload.notification.title,
        createNotificationOptions(payload)
      )
    );
  } catch (error) {
    // 에러는 콘솔에만 남김
    console.error('Push notification error:', error);
  }
});

// Subscription 변경 이벤트 핸들러
self.addEventListener('pushsubscriptionchange', event => {
  if (firebaseApp) {
    event.waitUntil(firebase.messaging(firebaseApp).getToken());
  }
});

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', event => {
  event.notification.close();
  let targetPath = event.notification.data?.path || '/';
  if (targetPath.startsWith('/api/discussions/')) {
    targetPath = targetPath.replace('/api/discussions/', '/discussion/');
  }
  const targetUrl = self.location.origin + targetPath;
  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
self.addEventListener('message', event => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    try {
      firebaseApp = firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage(payload => 
        showNotification(
          payload.notification.title,
          createNotificationOptions(payload)
        )
      );
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
});
