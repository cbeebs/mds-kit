import { buildSeedItems, DEFAULT_SETTINGS } from './seed'

export interface KitItem {
  id: string
  name: string
  category: string
  qty: number
  mandatory?: boolean
  consumable?: boolean

  productTitle?: string
  retailer?: string
  url?: string

  weightGramsPerUnit?: number
  weightSource?: 'auto' | 'manual'

  priceMinorPerUnit?: number
  currency?: 'GBP' | 'EUR' | 'USD'
  priceSource?: 'auto' | 'manual'

  purchased: boolean
  extractionStatus?: 'complete' | 'partial' | 'manual' | 'needs-capture' | 'error'
  lastRefreshed?: string
  lastRefreshStatus?: 'updated' | 'unchanged' | 'needs-capture' | 'failed'
  isCustom?: boolean
  sortIndex: number
}

export interface Settings {
  budgetPence: number
  minPackWeightGrams: number
  fxRates: { EUR: number; USD: number }
}

export interface StoredState {
  schemaVersion: 1
  settings: Settings
  items: KitItem[]
}

export const STORAGE_KEY = 'mdsKit:v1'

export function buildDefaultState(): StoredState {
  return {
    schemaVersion: 1,
    settings: DEFAULT_SETTINGS,
    items: buildSeedItems(),
  }
}

export async function loadState(): Promise<StoredState> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const stored = result[STORAGE_KEY] as StoredState | undefined
  if (stored?.schemaVersion === 1) return stored
  const defaultState = buildDefaultState()
  await chrome.storage.local.set({ [STORAGE_KEY]: defaultState })
  return defaultState
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function saveState(state: StoredState): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void chrome.storage.local.set({ [STORAGE_KEY]: state })
    debounceTimer = null
  }, 300)
}

export function subscribeToChanges(callback: (state: StoredState) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string
  ) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      const next = changes[STORAGE_KEY].newValue as StoredState | undefined
      if (next) callback(next)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
