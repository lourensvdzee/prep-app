// Firebase configuration for push notifications
// You need to set up a Firebase project and add your config to .env

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    VAPID_KEY
  )
}

// Dynamic import of Firebase modules to avoid loading if not configured
let firebaseApp: unknown = null
let messaging: unknown = null

async function initializeFirebase() {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured - push notifications disabled')
    return null
  }

  if (firebaseApp) return firebaseApp

  try {
    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')

    firebaseApp = initializeApp(firebaseConfig)
    messaging = getMessaging(firebaseApp as never)

    return firebaseApp
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    return null
  }
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured')
    return null
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return null
  }

  // Check if service worker is supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported')
    return null
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Initialize Firebase
    await initializeFirebase()
    if (!messaging) {
      return null
    }

    // Register service worker for Firebase messaging
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Get FCM token
    const { getToken } = await import('firebase/messaging')
    const token = await getToken(messaging as never, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    console.log('FCM Token:', token)
    return token
  } catch (error) {
    console.error('Failed to get notification permission:', error)
    return null
  }
}

// Listen for foreground messages
export async function onForegroundMessage(callback: (payload: unknown) => void): Promise<(() => void) | null> {
  if (!isFirebaseConfigured()) return null

  await initializeFirebase()
  if (!messaging) return null

  try {
    const { onMessage } = await import('firebase/messaging')
    return onMessage(messaging as never, callback)
  } catch (error) {
    console.error('Failed to set up foreground message handler:', error)
    return null
  }
}

// Save FCM token to backend (Google Apps Script)
export async function saveTokenToBackend(token: string): Promise<boolean> {
  const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL
  if (!API_URL) return false

  try {
    const payload = encodeURIComponent(JSON.stringify({
      action: 'registerToken',
      token
    }))

    const response = await fetch(`${API_URL}?action=write&payload=${payload}`)
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Failed to save token to backend:', error)
    return false
  }
}
