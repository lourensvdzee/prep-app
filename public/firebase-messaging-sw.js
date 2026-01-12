// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: 'AIzaSyCYbH8ZpeXCts1_ma_ADkqCLDPaHbv3wnQ',
  authDomain: 'prep-app-93f35.firebaseapp.com',
  projectId: 'prep-app-93f35',
  storageBucket: 'prep-app-93f35.firebasestorage.app',
  messagingSenderId: '970268525390',
  appId: '1:970268525390:web:48baf7b26250bbb55dd41f',
});

const messaging = firebase.messaging();

// Standard Push API event listener (required for iOS Safari)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let data = {};
  let title = 'Prep App';
  let body = 'You have items expiring soon!';

  if (event.data) {
    try {
      data = event.data.json();
      console.log('Push data:', data);

      // FCM sends notification data in different formats
      if (data.notification) {
        title = data.notification.title || title;
        body = data.notification.body || body;
      } else if (data.title) {
        title = data.title;
        body = data.body || body;
      }
    } catch (e) {
      console.log('Push data text:', event.data.text());
    }
  }

  const options = {
    body: body,
    icon: '/apple-touch-icon.jpg',
    badge: '/apple-touch-icon.jpg',
    tag: data.data?.itemId || 'prep-notification',
    data: data.data || {},
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Also keep Firebase onBackgroundMessage for Android/Desktop Chrome
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  // Note: On iOS, the push event above handles this
  // This is mainly for Android/Desktop browsers
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Open the app when notification is clicked
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
