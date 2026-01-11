import type { InventoryItemWithStatus, ItemStatus } from '../types'

interface SummaryProps {
  groups: Record<ItemStatus, InventoryItemWithStatus[]>
}

export function Summary({ groups }: SummaryProps) {
  return (
    <div className="summary">
      <div className="summary-card inuse">
        <div className="summary-count">{groups.inuse.length}</div>
        <div className="summary-label">In Use</div>
      </div>
      <div className="summary-card expired">
        <div className="summary-count">{groups.expired.length}</div>
        <div className="summary-label">Expired</div>
      </div>
      <div className="summary-card expiring">
        <div className="summary-count">{groups.expiring.length}</div>
        <div className="summary-label">Expiring</div>
      </div>
      <div className="summary-card ok">
        <div className="summary-count">{groups.ok.length}</div>
        <div className="summary-label">OK</div>
      </div>
    </div>
  )
}
