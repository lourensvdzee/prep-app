import { useState } from 'react'
import type { InventoryItemWithStatus } from '../types'
import { formatDateDisplay, formatRelativeTime } from '../utils'

interface ItemCardProps {
  item: InventoryItemWithStatus
}

export function ItemCard({ item }: ItemCardProps) {
  const [showShops, setShowShops] = useState(false)

  const hasShopInfo = item.shops.edeka || item.shops.denns || item.shops.rewe

  return (
    <div className={`item-card ${item.status}`}>
      <div className="item-name">{item.name}</div>
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
            onClick={() => setShowShops(!showShops)}
          >
            {showShops ? '▼' : '▶'} Shop info
          </button>

          {showShops && (
            <div className="item-shops-content">
              {item.shops.edeka && (
                <div className="shop-row">
                  <span className="shop-name">Edeka</span>
                  <span>{item.shops.edeka}</span>
                </div>
              )}
              {item.shops.denns && (
                <div className="shop-row">
                  <span className="shop-name">Denn's</span>
                  <span>{item.shops.denns}</span>
                </div>
              )}
              {item.shops.rewe && (
                <div className="shop-row">
                  <span className="shop-name">Rewe</span>
                  <span>{item.shops.rewe}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
