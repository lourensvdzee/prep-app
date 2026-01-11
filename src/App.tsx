import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { fetchInventory, getCacheTimestamp, updateItem, addItem, deleteItem } from './api'
import { enrichItemsWithStatus, groupByStatus, filterItems } from './utils'
import { StatusSection } from './components/StatusSection'
import { Summary } from './components/Summary'
import { EditModal } from './components/EditModal'
import { Toast } from './components/Toast'
import { LoadingOverlay } from './components/LoadingOverlay'
import { NotificationSettings } from './components/NotificationSettings'
import { hasPendingChanges, syncPendingChanges } from './syncService'
import type { InventoryItemWithStatus, ItemStatus, InventoryItem } from './types'

function App() {
  const [items, setItems] = useState<InventoryItemWithStatus[]>([])
  const [groups, setGroups] = useState<Record<ItemStatus, InventoryItemWithStatus[]>>({
    inuse: [],
    expired: [],
    expiring: [],
    ok: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingMessage, setSavingMessage] = useState('Saving...')
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<InventoryItemWithStatus | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [shopColumns, setShopColumns] = useState<string[]>(['edeka', 'denns', 'rewe'])
  const [toast, setToast] = useState<string | null>(null)
  const [isAtTop, setIsAtTop] = useState(true)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const scrollTimeoutRef = useRef<number | null>(null)

  // Track scroll position to show/hide up button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsAtTop(window.scrollY < 100)
      }, 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

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

      // Extract shop columns from items
      if (response.items.length > 0) {
        const shops = new Set<string>()
        response.items.forEach(item => {
          Object.keys(item.shops).forEach(shop => shops.add(shop))
        })
        if (shops.size > 0) {
          setShopColumns(Array.from(shops))
        }
      }

      if (response.error) {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  // Sync pending changes when coming online
  const syncChanges = useCallback(async () => {
    if (!hasPendingChanges() || !navigator.onLine) return

    setIsSyncing(true)
    try {
      const result = await syncPendingChanges()
      if (result.success > 0) {
        showToast(`Synced ${result.success} change${result.success > 1 ? 's' : ''}`)
        loadData()
      }
      if (result.failed > 0) {
        showToast(`${result.failed} change${result.failed > 1 ? 's' : ''} failed to sync`)
      }
    } finally {
      setIsSyncing(false)
    }
  }, [loadData])

  useEffect(() => {
    loadData()

    const handleOnline = () => {
      setIsOffline(false)
      syncChanges()
      loadData()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Try to sync on initial load
    syncChanges()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [loadData, syncChanges])

  // Filter items based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups

    const filtered = filterItems(items, searchQuery)
    return groupByStatus(filtered)
  }, [items, groups, searchQuery])

  const formatLastUpdated = () => {
    const timestamp = lastUpdated || getCacheTimestamp()
    if (!timestamp) return null

    const date = new Date(timestamp)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleItemClick = (item: InventoryItemWithStatus) => {
    setEditingItem(item)
    setIsAddingNew(false)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setIsAddingNew(true)
  }

  const handleSave = async (itemData: Partial<InventoryItem>, isNew: boolean) => {
    // Close modal immediately so user sees loading overlay on the feed
    setEditingItem(null)
    setIsAddingNew(false)

    setSaving(true)
    setSavingMessage(isNew ? 'Adding...' : 'Saving...')

    try {
      if (isNew) {
        await addItem(itemData)
        showToast('Item added!')
      } else if (itemData.rowIndex) {
        await updateItem(itemData.rowIndex, itemData)
        showToast('Saved!')
      }
      loadData()
    } catch (err) {
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rowIndex: number) => {
    // Close modal immediately so user sees loading overlay on the feed
    setEditingItem(null)
    setIsAddingNew(false)

    setSaving(true)
    setSavingMessage('Deleting...')

    try {
      await deleteItem(rowIndex)
      showToast('Item deleted')
      loadData()
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleCloseModal = () => {
    setEditingItem(null)
    setIsAddingNew(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const totalFiltered = filteredGroups.inuse.length + filteredGroups.expired.length +
    filteredGroups.expiring.length + filteredGroups.ok.length

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Prep App</h1>
          <div className="header-right">
            {formatLastUpdated() && (
              <span className="header-updated">{formatLastUpdated()}</span>
            )}
            <button
              className="settings-btn"
              onClick={() => setShowNotificationSettings(true)}
              aria-label="Notification settings"
            >
              🔔
            </button>
            <button
              className="refresh-btn"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? '...' : '↻'}
            </button>
          </div>
        </div>
        <div className="header-meta">
          <span>{items.length} items</span>
          {isOffline && <span className="offline-badge">Offline</span>}
          {isSyncing && <span className="syncing-badge">Syncing</span>}
        </div>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

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
          <Summary groups={filteredGroups} />

          {searchQuery && totalFiltered === 0 && (
            <div className="empty">
              <p>No items match "{searchQuery}"</p>
            </div>
          )}

          <StatusSection status="inuse" items={filteredGroups.inuse} onItemClick={handleItemClick} onScrollTop={scrollToTop} showUpButton={!isAtTop} />
          <StatusSection status="expired" items={filteredGroups.expired} onItemClick={handleItemClick} onScrollTop={scrollToTop} showUpButton={!isAtTop} />
          <StatusSection status="expiring" items={filteredGroups.expiring} onItemClick={handleItemClick} onScrollTop={scrollToTop} showUpButton={!isAtTop} />
          <StatusSection status="ok" items={filteredGroups.ok} onItemClick={handleItemClick} onScrollTop={scrollToTop} showUpButton={!isAtTop} />
        </>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="empty">
          <p>No items in inventory</p>
          <button className="btn btn-primary" onClick={handleAddNew}>Add your first item</button>
        </div>
      )}

      <button className="fab" onClick={handleAddNew} aria-label="Add item">
        +
      </button>

      {(editingItem || isAddingNew) && (
        <EditModal
          item={editingItem}
          isNew={isAddingNew}
          existingShops={shopColumns}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleCloseModal}
        />
      )}

      {saving && <LoadingOverlay message={savingMessage} />}
      {toast && <Toast message={toast} />}

      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}
    </div>
  )
}

export default App
