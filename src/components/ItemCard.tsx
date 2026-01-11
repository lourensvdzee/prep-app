import { useState } from 'react'
import type { InventoryItemWithStatus } from '../types'
import { formatDateDisplay, formatRelativeTime } from '../utils'
import { ShopLogo } from './ShopLogo'

interface ItemCardProps {
  item: InventoryItemWithStatus
  onClick: () => void
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const [showShops, setShowShops] = useState(false)

  const hasShopInfo = Object.values(item.shops).some(v => v && v.trim())

  const handleShopToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowShops(!showShops)
  }

  return (
    <div className={`item-card ${item.status}`} onClick={onClick}>
      <div className="item-header">
        <div className="item-name">{item.name}</div>
        {item.inUse && <span className="item-badge inuse">In Use</span>}
      </div>
      <div className="item-amount">{item.amount}</div>

      <div className="item-dates">
        <div className="item-date">
          <span className="item-date-label">Expires</span>
          <span className={`item-date-value ${item.status}`}>
            {formatDateDisplay(item.expirationDate)}
          </span>
          {item.daysUntilExpiration !== null && (
            <span className={`item-relative ${item.status}`}>
              {formatRelativeTime(item.daysUntilExpiration)}
            </span>
          )}
        </div>

        {item.alertDate && (
          <div className="item-date">
            <span className="item-date-label">Alert</span>
            <span className="item-date-value">
              {formatDateDisplay(item.alertDate)}
            </span>
          </div>
        )}
      </div>

      {hasShopInfo && (
        <div className="item-shops">
          <button
            className="item-shops-toggle"
            onClick={handleShopToggle}
          >
            {showShops ? '▼' : '▶'} Shop info
          </button>

          {showShops && (
            <div className="item-shops-content">
              {Object.entries(item.shops).map(([shopName, shopValue]) => {
                if (!shopValue || !shopValue.trim()) return null
                return (
                  <div key={shopName} className="shop-row">
                    <span className="shop-name">
                      <ShopLogo shop={shopName} size={18} />
                    </span>
                    <span>{shopValue}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
