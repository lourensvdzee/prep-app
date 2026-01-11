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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Prep App';
  const notificationOptions = {
    body: payload.notification?.body || 'You have items expiring soon!',
    icon: '/apple-touch-icon.jpg',
    badge: '/apple-touch-icon.jpg',
    tag: payload.data?.itemId || 'prep-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'View Item'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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
