// Firebase Cloud Messaging Service Worker
// DEBUG VERSION - logs to localStorage for in-app viewing

// Helper to log to localStorage (readable from main app)
function debugLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = '[' + timestamp + '] SW: ' + message;

  try {
    // We can't access localStorage directly from SW, so we'll use clients to post message
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'DEBUG_LOG', message: entry });
      });
    });
  } catch (e) {
    console.log('SW log error:', e);
  }

  console.log(entry);
}

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  debugLog('Service Worker INSTALLING');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  debugLog('Service Worker ACTIVATED');
  event.waitUntil(self.clients.claim());
});

// Push event - this is what we're debugging!
self.addEventListener('push', (event) => {
  debugLog('PUSH EVENT RECEIVED!');

  let title = 'Prep App';
  let body = 'Notification received!';

  if (event.data) {
    debugLog('Push has data');
    try {
      const data = event.data.json();
      debugLog('Push data: ' + JSON.stringify(data).substring(0, 200));

      if (data.notification) {
        title = data.notification.title || title;
        body = data.notification.body || body;
        debugLog('Title: ' + title + ', Body: ' + body);
      }
    } catch (e) {
      debugLog('Error parsing push data: ' + e.message);
      try {
        debugLog('Raw text: ' + event.data.text().substring(0, 100));
      } catch (e2) {
        debugLog('Could not get raw text either');
      }
    }
  } else {
    debugLog('Push has NO data');
  }

  debugLog('Calling showNotification...');

  event.waitUntil(
    self.registration.showNotification(title, { body: body })
      .then(() => {
        debugLog('showNotification SUCCESS!');
      })
      .catch(error => {
        debugLog('showNotification FAILED: ' + error.message);
      })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  debugLog('Notification CLICKED');
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  debugLog('Push subscription CHANGED');
});

debugLog('Service Worker script loaded');
