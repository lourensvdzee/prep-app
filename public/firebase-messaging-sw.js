// Firebase Cloud Messaging Service Worker
// MINIMAL VERSION FOR iOS DEBUGGING

// Skip Firebase SDK entirely - use pure Push API
self.addEventListener('push', (event) => {
  console.log('SW: Push event received!');

  // Default notification
  let title = 'Prep App';
  let body = 'Notification received!';

  // Try to parse FCM data
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('SW: Push data:', JSON.stringify(data));

      if (data.notification) {
        title = data.notification.title || title;
        body = data.notification.body || body;
      }
    } catch (e) {
      console.log('SW: Could not parse push data');
    }
  }

  // Absolute minimal options - no icon, no badge, nothing extra
  event.waitUntil(
    self.registration.showNotification(title, { body: body })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
