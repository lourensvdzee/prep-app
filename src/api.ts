import type { ApiResponse, InventoryItem } from './types'

const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL

const CACHE_KEY = 'prep-inventory-cache'
const CACHE_TIMESTAMP_KEY = 'prep-inventory-cache-timestamp'

interface CachedData {
  items: InventoryItem[]
  lastUpdated: string
}

interface WriteResponse {
  success: boolean
  message: string
  error?: string
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
 * Fetch using JSONP (for Google Apps Script CORS workaround)
 */
function fetchJsonp<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const script = document.createElement('script')

    // Set up the callback
    ;(window as unknown as Record<string, unknown>)[callbackName] = (data: T) => {
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) {
        document.body.removeChild(script)
      }
      resolve(data)
    }

    // Set up error handling
    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) {
        document.body.removeChild(script)
      }
      reject(new Error('JSONP request failed'))
    }

    // Add script to page
    const separator = url.includes('?') ? '&' : '?'
    script.src = `${url}${separator}callback=${callbackName}`
    document.body.appendChild(script)

    // Timeout after 15 seconds
    setTimeout(() => {
      if ((window as unknown as Record<string, unknown>)[callbackName]) {
        delete (window as unknown as Record<string, unknown>)[callbackName]
        if (script.parentNode) {
          document.body.removeChild(script)
        }
        reject(new Error('Request timeout'))
      }
    }, 15000)
  })
}

/**
 * Fetch all inventory items from Google Sheets
 * Returns cached data if offline
 */
export async function fetchInventory(): Promise<ApiResponse> {
  // Try to fetch from API using JSONP (avoids CORS issues with Google Apps Script)
  try {
    const data = await fetchJsonp<ApiResponse>(`${API_URL}?action=getAll`)

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
 * Uses GET with JSONP to bypass CORS (data passed as URL parameter)
 */
export async function addItem(item: Partial<InventoryItem>): Promise<WriteResponse> {
  const payloadObj = { action: 'add', item }
  console.log('addItem payload:', payloadObj)
  const payload = encodeURIComponent(JSON.stringify(payloadObj))
  console.log('addItem encoded:', payload)
  const url = `${API_URL}?action=write&payload=${payload}`
  console.log('addItem URL:', url)
  const data = await fetchJsonp<WriteResponse>(url)
  console.log('addItem response:', data)

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}

/**
 * Update an existing item
 * Uses GET with JSONP to bypass CORS (data passed as URL parameter)
 */
export async function updateItem(
  rowIndex: number,
  item: Partial<InventoryItem>
): Promise<WriteResponse> {
  const payloadObj = { action: 'update', rowIndex, item }
  console.log('updateItem payload:', payloadObj)
  const payload = encodeURIComponent(JSON.stringify(payloadObj))
  const url = `${API_URL}?action=write&payload=${payload}`
  console.log('updateItem URL:', url)
  const data = await fetchJsonp<WriteResponse>(url)
  console.log('updateItem response:', data)

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}

/**
 * Delete an item
 * Uses GET with JSONP to bypass CORS (data passed as URL parameter)
 */
export async function deleteItem(rowIndex: number): Promise<WriteResponse> {
  const payload = encodeURIComponent(JSON.stringify({ action: 'delete', rowIndex }))
  const data = await fetchJsonp<WriteResponse>(`${API_URL}?action=write&payload=${payload}`)

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}
