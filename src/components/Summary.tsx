import type { InventoryItemWithStatus, ItemStatus } from '../types'

interface SummaryProps {
  groups: Record<ItemStatus, InventoryItemWithStatus[]>
}

function scrollToSection(status: ItemStatus) {
  const element = document.getElementById(`section-${status}`)
  if (element) {
    // Get the header height dynamically
    const header = document.querySelector('.header') as HTMLElement
    const headerHeight = header ? header.offsetHeight : 0
    const extraPadding = 16
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.scrollY - headerHeight - extraPadding
    window.scrollTo({ top: offsetPosition, behavior: 'instant' })
  }
}

export function Summary({ groups }: SummaryProps) {
  return (
    <div className="summary">
      <button
        className="summary-card inuse"
        onClick={() => scrollToSection('inuse')}
        disabled={groups.inuse.length === 0}
      >
        <div className="summary-count">{groups.inuse.length}</div>
        <div className="summary-label">In Use</div>
      </button>
      <button
        className="summary-card expired"
        onClick={() => scrollToSection('expired')}
        disabled={groups.expired.length === 0}
      >
        <div className="summary-count">{groups.expired.length}</div>
        <div className="summary-label">Expired</div>
      </button>
      <button
        className="summary-card expiring"
        onClick={() => scrollToSection('expiring')}
        disabled={groups.expiring.length === 0}
      >
        <div className="summary-count">{groups.expiring.length}</div>
        <div className="summary-label">Expiring</div>
      </button>
      <button
        className="summary-card ok"
        onClick={() => scrollToSection('ok')}
        disabled={groups.ok.length === 0}
      >
        <div className="summary-count">{groups.ok.length}</div>
        <div className="summary-label">OK</div>
      </button>
    </div>
  )
}
