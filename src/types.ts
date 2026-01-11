export interface InventoryItem {
  rowIndex: number
  name: string
  amount: string
  shops: Record<string, string>
  expirationDate: string
  alertDate: string
  inUse?: boolean
}

export type ItemStatus = 'ok' | 'expiring' | 'expired' | 'inuse'

export interface InventoryItemWithStatus extends InventoryItem {
  status: ItemStatus
  daysUntilExpiration: number | null
}

export interface ApiResponse {
  items: InventoryItem[]
  headers?: string[]
  shopColumns?: string[]
  lastUpdated: string
  error?: string
}

export type AlertWindow = '1day' | '1week' | '1month' | '3months' | '6months'

export const ALERT_WINDOWS: { value: AlertWindow; label: string; days: number }[] = [
  { value: '1day', label: '1 day', days: 1 },
  { value: '1week', label: '1 week', days: 7 },
  { value: '1month', label: '1 month', days: 30 },
  { value: '3months', label: '3 months', days: 90 },
  { value: '6months', label: '6 months', days: 180 },
]

export const KNOWN_SHOPS = ['edeka', 'denns', 'rewe', 'aldi', 'lidl', 'dm', 'rossmann'] as const
export type KnownShop = typeof KNOWN_SHOPS[number]
