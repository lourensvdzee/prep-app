import { useState, useEffect } from 'react'
import { isFirebaseConfigured, requestNotificationPermission, saveTokenToBackend } from '../firebase'

interface NotificationSettingsProps {
  onClose: () => void
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')
  const [isEnabling, setIsEnabling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported')
      return
    }

    setPermissionStatus(Notification.permission)
    setIsConfigured(isFirebaseConfigured())
  }, [])

  const handleEnableNotifications = async () => {
    setIsEnabling(true)
    setError(null)

    try {
      const token = await requestNotificationPermission()

      if (token) {
        // Save token to backend
        await saveTokenToBackend(token)
        setPermissionStatus('granted')
      } else {
        setError('Could not enable notifications. Please check your browser settings.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications')
    } finally {
      setIsEnabling(false)
    }
  }

  const getStatusText = () => {
    if (permissionStatus === 'unsupported') {
      return 'Your browser does not support notifications'
    }
    if (permissionStatus === 'granted') {
      return 'Notifications are enabled'
    }
    if (permissionStatus === 'denied') {
      return 'Notifications are blocked. Please enable them in your browser/device settings.'
    }
    return 'Enable notifications to get reminders about expiring items'
  }

  const getStatusIcon = () => {
    if (permissionStatus === 'granted') return '✓'
    if (permissionStatus === 'denied') return '✕'
    return '🔔'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal notification-settings" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Notifications</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="notification-status">
            <span className="notification-icon">{getStatusIcon()}</span>
            <p>{getStatusText()}</p>
          </div>

          {!isConfigured && (
            <div className="notification-warning">
              <p>Push notifications are not yet configured.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.7 }}>
                Debug: API_KEY={import.meta.env.VITE_FIREBASE_API_KEY ? 'set' : 'missing'},
                PROJECT_ID={import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'set' : 'missing'},
                SENDER_ID={import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'set' : 'missing'},
                VAPID={import.meta.env.VITE_FIREBASE_VAPID_KEY ? 'set' : 'missing'}
              </p>
            </div>
          )}

          {error && (
            <div className="notification-error">
              <p>{error}</p>
            </div>
          )}

          {permissionStatus === 'default' && isConfigured && (
            <div className="notification-info">
              <h4>You will receive notifications:</h4>
              <ul>
                <li>On alert date at 8:00 AM</li>
                <li>1 month before expiration</li>
                <li>1 week before expiration</li>
                <li>On expiration day</li>
              </ul>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="notification-help">
              <h4>To enable notifications:</h4>
              <p><strong>iOS:</strong> Settings → Prep App → Notifications → Allow</p>
              <p><strong>Android/Desktop:</strong> Click the lock icon in your browser's address bar</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {permissionStatus === 'default' && isConfigured && (
            <button
              className="btn btn-primary"
              onClick={handleEnableNotifications}
              disabled={isEnabling}
            >
              {isEnabling ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            {permissionStatus === 'granted' ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
