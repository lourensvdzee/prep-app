import type { InventoryItemWithStatus, ItemStatus } from '../types'
import { ItemCard } from './ItemCard'

interface StatusSectionProps {
  status: ItemStatus
  items: InventoryItemWithStatus[]
  onItemClick: (item: InventoryItemWithStatus) => void
}

const statusConfig: Record<ItemStatus, { title: string }> = {
  inuse: { title: 'In Use' },
  expired: { title: 'Expired' },
  expiring: { title: 'Expiring Soon' },
  ok: { title: 'OK' }
}

export function StatusSection({ status, items, onItemClick }: StatusSectionProps) {
  if (items.length === 0) return null

  const config = statusConfig[status]

  return (
    <div className="status-section">
      <div className="status-header">
        <span className={`status-indicator ${status}`}></span>
        <span className="status-title">{config.title}</span>
        <span className="status-count">({items.length})</span>
      </div>

      {items.map((item) => (
        <ItemCard
          key={`${item.rowIndex}-${item.name}`}
          item={item}
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  )
}
