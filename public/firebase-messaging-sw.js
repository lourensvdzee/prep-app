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
  console.log('SW: Push event received.');

  let data = {};
  let title = 'Prep App Notification';
  let body = 'You have items expiring soon!';

  if (event.data) {
    try {
      data = event.data.json();
      console.log('SW: Push data parsed:', data);

      // FCM sends notification data in different formats
      if (data.notification) {
        title = data.notification.title || title;
        body = data.notification.body || body;
      } else if (data.title) {
        title = data.title;
        body = data.body || body;
      }
    } catch (e) {
      console.log('SW: Error parsing push data as JSON. Push data text:', event.data.text(), 'Error:', e);
    }
  }

  // TEMPORARILY SIMPLIFIED OPTIONS for iOS debugging
  const options = {
    body: body,
    // Temporarily removing other options to isolate the issue
    // icon: '/apple-touch-icon.jpg',
    // badge: '/apple-touch-icon.jpg',
    // tag: data.data?.itemId || 'prep-notification',
    // data: data.data || {},
    // requireInteraction: true
  };

  console.log('SW: Attempting to show notification with title:', title, 'body:', body);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('SW: Notification shown successfully!'))
      .catch(e => console.error('SW: Error showing notification:', e))
  );
});

// TEMPORARILY DISABLED - onBackgroundMessage may conflict with push event on iOS
// messaging.onBackgroundMessage((payload) => {
//   console.log('Received background message (Firebase SDK):', payload);
// });

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
