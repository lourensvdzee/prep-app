import type { ApiResponse, InventoryItem } from './types'

const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL

const CACHE_KEY = 'prep-inventory-cache'
const CACHE_TIMESTAMP_KEY = 'prep-inventory-cache-timestamp'

interface CachedData {
  items: InventoryItem[]
  lastUpdated: string
}

/**
 * Get cached data from localStorage
 */
function getCachedData(): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

/**
 * Save data to localStorage cache
 */
function setCachedData(data: CachedData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString())
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Get cache timestamp
 */
export function getCacheTimestamp(): string | null {
  return localStorage.getItem(CACHE_TIMESTAMP_KEY)
}

/**
 * Fetch all inventory items from Google Sheets
 * Returns cached data if offline
 */
export async function fetchInventory(): Promise<ApiResponse> {
  // Try to fetch from API
  try {
    const response = await fetch(`${API_URL}?action=getAll`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const data: ApiResponse = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Cache the successful response
    setCachedData({
      items: data.items,
      lastUpdated: data.lastUpdated
    })

    return data
  } catch (error) {
    // If offline or error, try to return cached data
    const cached = getCachedData()
    if (cached) {
      return {
        ...cached,
        error: `Using cached data (${error instanceof Error ? error.message : 'offline'})`
      }
    }

    throw error
  }
}

/**
 * Add a new item to the inventory
 */
export async function addItem(item: Partial<InventoryItem>): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'add',
      item
    }),
  })

  return response.json()
}

/**
 * Update an existing item
 */
export async function updateItem(
  rowIndex: number,
  item: Partial<InventoryItem>
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      rowIndex,
      item
    }),
  })

  return response.json()
}

/**
 * Delete an item
 */
export async function deleteItem(rowIndex: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'delete',
      rowIndex
    }),
  })

  return response.json()
}
