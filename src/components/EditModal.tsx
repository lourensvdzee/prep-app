import { useState, useEffect } from 'react'
import type { InventoryItemWithStatus } from '../types'
import { ALERT_WINDOWS } from '../types'
import { formatDateForInput, inputDateToDisplay, calculateAlertDate } from '../utils'
import { ShopLogo } from './ShopLogo'

interface EditModalProps {
  item: InventoryItemWithStatus | null
  isNew?: boolean
  existingShops: string[]
  onSave: (item: Partial<InventoryItemWithStatus>, isNew: boolean) => void
  onDelete?: (rowIndex: number) => void
  onClose: () => void
}

export function EditModal({ item, isNew = false, existingShops, onSave, onDelete, onClose }: EditModalProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [alertDate, setAlertDate] = useState('')
  const [alertWindow, setAlertWindow] = useState<string>('')
  const [inUse, setInUse] = useState(false)
  const [shops, setShops] = useState<Record<string, string>>({})
  const [newShopName, setNewShopName] = useState('')
  const [showAddShop, setShowAddShop] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setAmount(item.amount)
      setExpirationDate(formatDateForInput(item.expirationDate))
      setAlertDate(formatDateForInput(item.alertDate))
      setInUse(item.inUse || false)
      setShops({ ...item.shops })
    } else {
      // New item defaults
      setName('')
      setAmount('')
      setExpirationDate('')
      setAlertDate('')
      setInUse(false)
      // Initialize with existing shop columns (empty values)
      const emptyShops: Record<string, string> = {}
      existingShops.forEach(shop => {
        emptyShops[shop] = ''
      })
      setShops(emptyShops)
    }
  }, [item, existingShops])

  const handleAlertWindowChange = (windowValue: string) => {
    setAlertWindow(windowValue)
    if (windowValue && expirationDate) {
      const window = ALERT_WINDOWS.find(w => w.value === windowValue)
      if (window) {
        const displayDate = inputDateToDisplay(expirationDate)
        const calculatedAlert = calculateAlertDate(displayDate, window.days)
        setAlertDate(formatDateForInput(calculatedAlert))
      }
    }
  }

  const handleExpirationChange = (date: string) => {
    setExpirationDate(date)
    // Recalculate alert date if window is selected
    if (alertWindow && date) {
      const window = ALERT_WINDOWS.find(w => w.value === alertWindow)
      if (window) {
        const displayDate = inputDateToDisplay(date)
        const calculatedAlert = calculateAlertDate(displayDate, window.days)
        setAlertDate(formatDateForInput(calculatedAlert))
      }
    }
  }

  const handleShopChange = (shopName: string, value: string) => {
    setShops(prev => ({ ...prev, [shopName]: value }))
  }

  const handleAddShop = () => {
    if (newShopName.trim()) {
      const shopKey = newShopName.trim().toLowerCase()
      setShops(prev => ({ ...prev, [shopKey]: '' }))
      setNewShopName('')
      setShowAddShop(false)
    }
  }

  const handleSave = () => {
    const updatedItem: Partial<InventoryItemWithStatus> = {
      name,
      amount,
      expirationDate: inputDateToDisplay(expirationDate),
      alertDate: inputDateToDisplay(alertDate),
      inUse,
      shops
    }

    if (!isNew && item) {
      updatedItem.rowIndex = item.rowIndex
    }

    onSave(updatedItem, isNew)
  }

  const handleDelete = () => {
    if (item && onDelete && confirm('Are you sure you want to delete this item?')) {
      onDelete(item.rowIndex)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'Add Item' : 'Edit Item'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Product name"
            />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g., 2 kg, 500g, 3 cans"
            />
          </div>

          <div className="form-group">
            <label>Expiration Date (THT)</label>
            <input
              type="date"
              value={expirationDate}
              onChange={e => handleExpirationChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Alert Window</label>
            <select
              value={alertWindow}
              onChange={e => handleAlertWindowChange(e.target.value)}
            >
              <option value="">Custom / Manual</option>
              {ALERT_WINDOWS.map(w => (
                <option key={w.value} value={w.value}>{w.label} before</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Alert Date</label>
            <input
              type="date"
              value={alertDate}
              onChange={e => setAlertDate(e.target.value)}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={inUse}
                onChange={e => setInUse(e.target.checked)}
              />
              <span>In Use (taken out of storage)</span>
            </label>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <h3>Shop Info</h3>
              <button
                type="button"
                className="btn-small"
                onClick={() => setShowAddShop(true)}
              >
                + Add Shop
              </button>
            </div>

            {showAddShop && (
              <div className="form-group add-shop-row">
                <input
                  type="text"
                  value={newShopName}
                  onChange={e => setNewShopName(e.target.value)}
                  placeholder="Shop name"
                  autoFocus
                />
                <button type="button" className="btn-small" onClick={handleAddShop}>Add</button>
                <button type="button" className="btn-small btn-cancel" onClick={() => setShowAddShop(false)}>Cancel</button>
              </div>
            )}

            {Object.keys(shops).map(shopName => (
              <div key={shopName} className="form-group shop-input">
                <label>
                  <ShopLogo shop={shopName} size={20} />
                  <span>{shopName.charAt(0).toUpperCase() + shopName.slice(1)}</span>
                </label>
                <input
                  type="text"
                  value={shops[shopName]}
                  onChange={e => handleShopChange(shopName, e.target.value)}
                  placeholder="Price, quantity, notes..."
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          {!isNew && onDelete && (
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          )}
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
