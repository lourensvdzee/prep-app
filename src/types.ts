export interface InventoryItem {
  rowIndex: number
  name: string
  amount: string
  shops: {
    edeka: string
    denns: string
    rewe: string
  }
  expirationDate: string
  alertDate: string
}

export type ItemStatus = 'ok' | 'expiring' | 'expired'

export interface InventoryItemWithStatus extends InventoryItem {
  status: ItemStatus
  daysUntilExpiration: number | null
}

export interface ApiResponse {
  items: InventoryItem[]
  lastUpdated: string
  error?: string
}
