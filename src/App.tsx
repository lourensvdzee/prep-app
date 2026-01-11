import { useEffect, useState, useCallback, useMemo } from 'react'
import { fetchInventory, getCacheTimestamp, updateItem, addItem, deleteItem } from './api'
import { enrichItemsWithStatus, groupByStatus, filterItems } from './utils'
import { StatusSection } from './components/StatusSection'
import { Summary } from './components/Summary'
import { EditModal } from './components/EditModal'
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
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<InventoryItemWithStatus | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [shopColumns, setShopColumns] = useState<string[]>(['edeka', 'denns', 'rewe'])

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

  useEffect(() => {
    loadData()

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
    try {
      if (isNew) {
        await addItem(itemData)
      } else if (itemData.rowIndex) {
        await updateItem(itemData.rowIndex, itemData)
      }
      setEditingItem(null)
      setIsAddingNew(false)
      loadData()
    } catch (err) {
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDelete = async (rowIndex: number) => {
    try {
      await deleteItem(rowIndex)
      setEditingItem(null)
      loadData()
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCloseModal = () => {
    setEditingItem(null)
    setIsAddingNew(false)
  }

  const totalFiltered = filteredGroups.inuse.length + filteredGroups.expired.length +
    filteredGroups.expiring.length + filteredGroups.ok.length

  return (
    <div className="app">
      <header className="header">
        <h1>Prep App</h1>
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
            {loading ? '...' : '↻'}
          </button>
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

      <button className="add-btn" onClick={handleAddNew}>
        + Add Item
      </button>

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

          <StatusSection status="inuse" items={filteredGroups.inuse} onItemClick={handleItemClick} />
          <StatusSection status="expired" items={filteredGroups.expired} onItemClick={handleItemClick} />
          <StatusSection status="expiring" items={filteredGroups.expiring} onItemClick={handleItemClick} />
          <StatusSection status="ok" items={filteredGroups.ok} onItemClick={handleItemClick} />
        </>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="empty">
          <p>No items in inventory</p>
          <button className="btn btn-primary" onClick={handleAddNew}>Add your first item</button>
        </div>
      )}

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
    </div>
  )
}

export default App
