import { useState, useEffect } from 'react'

// Debug log stored in localStorage so service worker can write to it
const DEBUG_LOG_KEY = 'prep_app_debug_log'

export function addDebugLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const entry = `[${timestamp}] ${message}`

  try {
    const existing = localStorage.getItem(DEBUG_LOG_KEY) || ''
    const logs = existing ? existing.split('\n') : []
    logs.push(entry)
    // Keep last 50 entries
    while (logs.length > 50) logs.shift()
    localStorage.setItem(DEBUG_LOG_KEY, logs.join('\n'))
  } catch (e) {
    console.error('Failed to write debug log:', e)
  }
}

export function clearDebugLog() {
  localStorage.removeItem(DEBUG_LOG_KEY)
}

export function getDebugLog(): string {
  return localStorage.getItem(DEBUG_LOG_KEY) || '(no logs yet)'
}

interface DebugLogProps {
  onClose: () => void
}

export function DebugLog({ onClose }: DebugLogProps) {
  const [logs, setLogs] = useState(getDebugLog())

  // Refresh logs every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(getDebugLog())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleClear = () => {
    clearDebugLog()
    setLogs('(cleared)')
  }

  const handleRefresh = () => {
    setLogs(getDebugLog())
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal debug-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Debug Log</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="debug-log-content">
          <pre>{logs}</pre>
        </div>
        <div className="debug-log-actions">
          <button className="btn" onClick={handleRefresh}>Refresh</button>
          <button className="btn" onClick={handleClear}>Clear</button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
