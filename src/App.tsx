import { useEffect, useState, useCallback } from 'react'
import { fetchInventory, getCacheTimestamp } from './api'
import { enrichItemsWithStatus, groupByStatus } from './utils'
import { StatusSection } from './components/StatusSection'
import { Summary } from './components/Summary'
import type { InventoryItemWithStatus, ItemStatus } from './types'

function App() {
  const [items, setItems] = useState<InventoryItemWithStatus[]>([])
  const [groups, setGroups] = useState<Record<ItemStatus, InventoryItemWithStatus[]>>({
    expired: [],
    expiring: [],
    ok: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchInventory()

      if (response.error && response.items.length === 0) {
        throw new Error(response.error)
      }

      const enrichedItems = enrichItemsWithStatus(response.items)
      const grouped = groupByStatus(enrichedItems)

      setItems(enrichedItems)
      setGroups(grouped)
      setLastUpdated(response.lastUpdated)

      if (response.error) {
        // Partial error (showing cached data)
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false)
      loadData()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [loadData])

  const formatLastUpdated = () => {
    const timestamp = lastUpdated || getCacheTimestamp()
    if (!timestamp) return null

    const date = new Date(timestamp)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Prep Inventory</h1>
        <div className="header-meta">
          <span>{items.length} items</span>
          {formatLastUpdated() && (
            <span>Updated: {formatLastUpdated()}</span>
          )}
          {isOffline && <span className="offline-badge">Offline</span>}
          <button
            className="refresh-btn"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? '...' : '↻'} Refresh
          </button>
        </div>
      </header>

      {loading && items.length === 0 && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading inventory...</span>
        </div>
      )}

      {error && items.length === 0 && (
        <div className="error">
          <div className="error-title">Error</div>
          <div>{error}</div>
        </div>
      )}

      {items.length > 0 && (
        <>
          <Summary groups={groups} />

          <StatusSection status="expired" items={groups.expired} />
          <StatusSection status="expiring" items={groups.expiring} />
          <StatusSection status="ok" items={groups.ok} />
        </>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="empty">
          <p>No items in inventory</p>
        </div>
      )}
    </div>
  )
}

export default App
