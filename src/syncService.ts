import type { InventoryItem } from './types'
import { addItem as apiAddItem, updateItem as apiUpdateItem, deleteItem as apiDeleteItem } from './api'

// Types for pending changes
interface PendingChange {
  id: string
  type: 'add' | 'update' | 'delete'
  item?: Partial<InventoryItem>
  rowIndex?: number
  timestamp: number
  retries: number
}

const STORAGE_KEY = 'prep-app-pending-changes'
const MAX_RETRIES = 3

// Get pending changes from localStorage
export function getPendingChanges(): PendingChange[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save pending changes to localStorage
function savePendingChanges(changes: PendingChange[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(changes))
}

// Generate a unique ID for pending changes
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Add a pending change
export function addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retries'>): string {
  const pending = getPendingChanges()
  const id = generateId()
  pending.push({
    ...change,
    id,
    timestamp: Date.now(),
    retries: 0
  })
  savePendingChanges(pending)
  return id
}

// Remove a pending change by ID
export function removePendingChange(id: string): void {
  const pending = getPendingChanges()
  const filtered = pending.filter(c => c.id !== id)
  savePendingChanges(filtered)
}

// Check if there are pending changes
export function hasPendingChanges(): boolean {
  return getPendingChanges().length > 0
}

// Process a single pending change
async function processChange(change: PendingChange): Promise<boolean> {
  try {
    switch (change.type) {
      case 'add':
        if (change.item) {
          await apiAddItem(change.item)
        }
        break
      case 'update':
        if (change.rowIndex && change.item) {
          await apiUpdateItem(change.rowIndex, change.item)
        }
        break
      case 'delete':
        if (change.rowIndex) {
          await apiDeleteItem(change.rowIndex)
        }
        break
    }
    return true
  } catch (err) {
    console.error('Failed to sync change:', change, err)
    return false
  }
}

// Sync all pending changes
export async function syncPendingChanges(
  onProgress?: (synced: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const pending = getPendingChanges()
  if (pending.length === 0) {
    return { success: 0, failed: 0 }
  }

  let success = 0
  let failed = 0
  const remaining: PendingChange[] = []

  for (let i = 0; i < pending.length; i++) {
    const change = pending[i]
    const result = await processChange(change)

    if (result) {
      success++
    } else {
      // Increment retry count
      change.retries++
      if (change.retries < MAX_RETRIES) {
        remaining.push(change)
      } else {
        failed++
        console.error('Change exceeded max retries, dropping:', change)
      }
    }

    onProgress?.(i + 1, pending.length)
  }

  savePendingChanges(remaining)
  return { success, failed }
}

// Queue an add operation
export function queueAdd(item: Partial<InventoryItem>): string {
  return addPendingChange({ type: 'add', item })
}

// Queue an update operation
export function queueUpdate(rowIndex: number, item: Partial<InventoryItem>): string {
  return addPendingChange({ type: 'update', rowIndex, item })
}

// Queue a delete operation
export function queueDelete(rowIndex: number): string {
  return addPendingChange({ type: 'delete', rowIndex })
}
