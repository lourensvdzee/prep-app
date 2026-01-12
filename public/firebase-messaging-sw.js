// Firebase Cloud Messaging Service Worker
// Production version with debug logging

// Helper to log to main app via postMessage
function debugLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = '[' + timestamp + '] SW: ' + message;

  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'DEBUG_LOG', message: entry });
    });
  });

  console.log(entry);
}

// Service worker lifecycle
self.addEventListener('install', (event) => {
  debugLog('Service Worker INSTALLING');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  debugLog('Service Worker ACTIVATED');
  event.waitUntil(self.clients.claim());
});

// Push notification handler
self.addEventListener('push', (event) => {
  debugLog('PUSH EVENT RECEIVED!');

  let title = 'Prep App';
  let body = 'You have items expiring soon!';
  let itemId = null;

  if (event.data) {
    debugLog('Push has data');
    try {
      const data = event.data.json();
      debugLog('Push data: ' + JSON.stringify(data).substring(0, 200));

      if (data.notification) {
        title = data.notification.title || title;
        body = data.notification.body || body;
      }
      if (data.data && data.data.itemId) {
        itemId = data.data.itemId;
      }
    } catch (e) {
      debugLog('Error parsing push data: ' + e.message);
    }
  }

  const options = {
    body: body,
    icon: '/apple-touch-icon.jpg',
    badge: '/apple-touch-icon.jpg',
    tag: itemId ? 'prep-item-' + itemId : 'prep-notification',
    data: { itemId: itemId },
    requireInteraction: false
  };

  debugLog('Showing notification: ' + title);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => debugLog('showNotification SUCCESS!'))
      .catch(error => debugLog('showNotification FAILED: ' + error.message))
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  debugLog('Notification CLICKED');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          debugLog('Focusing existing window');
          return client.focus();
        }
      }
      // Open new window
      debugLog('Opening new window');
      return clients.openWindow('/');
    })
  );
});

// Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  debugLog('Push subscription CHANGED');
});

debugLog('Service Worker script loaded');
