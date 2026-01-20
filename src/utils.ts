import type { InventoryItem, InventoryItemWithStatus, ItemStatus } from './types'

/**
 * Fix January dates that were incorrectly interpreted.
 * When day looks like a month (e.g., 05.01.2027 or 05/01/2027 meant May 2027, not Jan 5th),
 * swap day and month, setting day to 1st of that month.
 * Only applies to January dates where day > 0 and day <= 12.
 */
function fixJanuaryDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return dateStr
  }

  const trimmed = dateStr.trim()

  // Match DD.MM.YYYY or DD/MM/YYYY format
  const match = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (match) {
    const day = parseInt(match[1])
    const month = parseInt(match[2])

    // Only fix January dates (month = 1) where day could be a month (1-12)
    if (month === 1 && day >= 1 && day <= 12) {
      // Swap: day becomes the new month, set day to 1
      const newDay = '01'
      const newMonth = String(day).padStart(2, '0')
      // Return in DD.MM.YYYY format (normalized)
      return `${newDay}.${newMonth}.${match[3]}`
    }
  }

  return dateStr
}

/**
 * Parse a date string - handles multiple formats including Date objects as strings
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null
  }

  // Apply January date fix before parsing
  const fixed = fixJanuaryDate(dateStr)
  const trimmed = fixed.trim()

  // Try DD.MM.YYYY format (German)
  let match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Try DD/MM/YYYY format
  match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Try YYYY-MM-DD format (ISO)
  match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) {
    const [, year, month, day] = match
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Try to parse full date strings like "Sun Jan 05 2025 00:00:00 GMT+0100"
  // or ISO strings with time
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

/**
 * Calculate days between today and a date
 * Positive = future, Negative = past
 */
export function daysUntil(date: Date | null): number | null {
  if (!date) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Determine item status based on dates and inUse flag
 */
export function getItemStatus(item: InventoryItem): ItemStatus {
  // If item is marked as in use, show it in the "in use" section
  if (item.inUse) {
    return 'inuse'
  }

  const expirationDate = parseDate(item.expirationDate)
  const alertDate = parseDate(item.alertDate)

  const daysToExpiration = daysUntil(expirationDate)
  const daysToAlert = daysUntil(alertDate)

  // Expired: past expiration date
  if (daysToExpiration !== null && daysToExpiration < 0) {
    return 'expired'
  }

  // Expiring: alert date reached (or passed) but not yet expired
  if (daysToAlert !== null && daysToAlert <= 0) {
    return 'expiring'
  }

  // Default: OK
  return 'ok'
}

/**
 * Enrich items with status information
 */
export function enrichItemsWithStatus(items: InventoryItem[]): InventoryItemWithStatus[] {
  return items.map(item => {
    const expirationDate = parseDate(item.expirationDate)
    const alertDate = parseDate(item.alertDate)
    return {
      ...item,
      status: getItemStatus(item),
      daysUntilExpiration: daysUntil(expirationDate),
      daysUntilAlert: daysUntil(alertDate)
    }
  })
}

/**
 * Group items by status
 */
export function groupByStatus(items: InventoryItemWithStatus[]): Record<ItemStatus, InventoryItemWithStatus[]> {
  const groups: Record<ItemStatus, InventoryItemWithStatus[]> = {
    inuse: [],
    expired: [],
    expiring: [],
    ok: []
  }

  for (const item of items) {
    groups[item.status].push(item)
  }

  // Sort each group by days until alert (soonest first)
  for (const status of ['inuse', 'expired', 'expiring', 'ok'] as ItemStatus[]) {
    groups[status].sort((a, b) => {
      if (a.daysUntilAlert === null) return 1
      if (b.daysUntilAlert === null) return -1
      return a.daysUntilAlert - b.daysUntilAlert
    })
  }

  return groups
}

/**
 * Format date for display - always returns DD.MM.YYYY
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—'

  const date = parseDate(dateStr)
  if (!date) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return ''

  const date = parseDate(dateStr)
  if (!date) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${year}-${month}-${day}`
}

/**
 * Convert input date (YYYY-MM-DD) to display format (DD.MM.YYYY)
 */
export function inputDateToDisplay(inputDate: string): string {
  if (!inputDate) return ''
  const [year, month, day] = inputDate.split('-')
  return `${day}.${month}.${year}`
}

/**
 * Format relative time (e.g., "in 5 days", "3 days ago")
 */
export function formatRelativeTime(days: number | null): string {
  if (days === null) return ''

  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 0) return `in ${days} days`
  return `${Math.abs(days)} days ago`
}

/**
 * Calculate alert date from expiration date and alert window
 */
export function calculateAlertDate(expirationDate: string, daysBeforeExpiration: number): string {
  const expDate = parseDate(expirationDate)
  if (!expDate) return ''

  const alertDate = new Date(expDate)
  alertDate.setDate(alertDate.getDate() - daysBeforeExpiration)

  const day = String(alertDate.getDate()).padStart(2, '0')
  const month = String(alertDate.getMonth() + 1).padStart(2, '0')
  const year = alertDate.getFullYear()

  return `${day}.${month}.${year}`
}

/**
 * Filter items by search query
 */
export function filterItems(items: InventoryItemWithStatus[], query: string): InventoryItemWithStatus[] {
  if (!query.trim()) return items

  const lowerQuery = query.toLowerCase().trim()
  return items.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.amount.toLowerCase().includes(lowerQuery) ||
    Object.values(item.shops).some(shop => shop.toLowerCase().includes(lowerQuery))
  )
}
