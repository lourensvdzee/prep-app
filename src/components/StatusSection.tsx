import type { InventoryItemWithStatus, ItemStatus } from '../types'
import { ItemCard } from './ItemCard'

interface StatusSectionProps {
  status: ItemStatus
  items: InventoryItemWithStatus[]
}

const statusConfig: Record<ItemStatus, { emoji: string; title: string }> = {
  expired: { emoji: '🔴', title: 'Expired' },
  expiring: { emoji: '🟠', title: 'Expiring Soon' },
  ok: { emoji: '🟢', title: 'OK' }
}

export function StatusSection({ status, items }: StatusSectionProps) {
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
        <ItemCard key={`${item.rowIndex}-${item.name}`} item={item} />
      ))}
    </div>
  )
}
