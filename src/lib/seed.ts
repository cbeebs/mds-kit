import type { KitItem, Settings } from './storage'

export const DEFAULT_SETTINGS: Settings = {
  budgetPence: 140000,
  minPackWeightGrams: 6500,
  fxRates: { EUR: 118, USD: 126 },
}

type SeedItem = Omit<KitItem, 'purchased' | 'extractionStatus' | 'lastRefreshed' | 'lastRefreshStatus'>

const seed: SeedItem[] = [
  // ── Clothing ─────────────────────────────────────────────────────────────
  { id: 'clothing-shoes',           name: 'Running shoes',    category: 'Clothing', qty: 1, sortIndex:  0 },
  { id: 'clothing-gaiters',         name: 'Sand gaiters',     category: 'Clothing', qty: 1, sortIndex:  1 },
  { id: 'clothing-shorts',          name: 'Running shorts',   category: 'Clothing', qty: 1, sortIndex:  2 },
  { id: 'clothing-shirt',           name: 'Running shirt',    category: 'Clothing', qty: 1, sortIndex:  3 },
  { id: 'clothing-base-layer',      name: 'Base layer',       category: 'Clothing', qty: 1, sortIndex:  4 },
  { id: 'clothing-warm-layer',      name: 'Warm layer',       category: 'Clothing', qty: 1, sortIndex:  5 },
  { id: 'clothing-shell',           name: 'Waterproof shell', category: 'Clothing', qty: 1, sortIndex:  6 },
  { id: 'clothing-socks',           name: 'Socks',            category: 'Clothing', qty: 3, sortIndex:  7 },
  { id: 'clothing-spare-socks',     name: 'Spare socks',      category: 'Clothing', qty: 2, sortIndex:  8 },
  { id: 'clothing-cap',             name: 'Cap',              category: 'Clothing', qty: 1, sortIndex:  9 },
  { id: 'clothing-sunglasses',      name: 'Sunglasses',       category: 'Clothing', qty: 1, sortIndex: 10 },

  // ── Carry system ─────────────────────────────────────────────────────────
  { id: 'carry-backpack',           name: 'Backpack',         category: 'Carry system', qty: 1, sortIndex:  0 },
  { id: 'carry-front-pouch',        name: 'Front pouch',      category: 'Carry system', qty: 1, sortIndex:  1 },
  { id: 'carry-water-bottles',      name: 'Water bottles',    category: 'Carry system', qty: 1, sortIndex:  2 },
  { id: 'carry-soft-flasks',        name: 'Soft flasks',      category: 'Carry system', qty: 1, sortIndex:  3 },

  // ── Sleeping ─────────────────────────────────────────────────────────────
  { id: 'sleeping-bag',             name: 'Sleeping bag',     category: 'Sleeping', qty: 1, sortIndex:  0 },
  { id: 'sleeping-mat',             name: 'Sleeping mat',     category: 'Sleeping', qty: 1, sortIndex:  1 },

  // ── Food and cooking ─────────────────────────────────────────────────────
  { id: 'food-stove',               name: 'Stove',            category: 'Food and cooking', qty: 1, sortIndex:  0 },
  { id: 'food-fuel',                name: 'Fuel',             category: 'Food and cooking', qty: 2, consumable: true, sortIndex:  1 },
  { id: 'food-cooking-pot',         name: 'Cooking pot',      category: 'Food and cooking', qty: 1, sortIndex:  2 },
  { id: 'food-spoon',               name: 'Spoon',            category: 'Food and cooking', qty: 1, sortIndex:  3 },
  { id: 'food-food',                name: 'Food',             category: 'Food and cooking', qty: 7, consumable: true, sortIndex:  4 },
  { id: 'food-electrolytes',        name: 'Electrolytes',     category: 'Food and cooking', qty: 1, consumable: true, sortIndex:  5 },
  { id: 'food-salt-tablets',        name: 'Salt tablets',     category: 'Food and cooking', qty: 1, consumable: true, sortIndex:  6 },

  // ── Safety and mandatory ─────────────────────────────────────────────────
  { id: 'safety-compass',           name: 'Compass',          category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  0 },
  { id: 'safety-whistle',           name: 'Whistle',          category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  1 },
  { id: 'safety-knife',             name: 'Knife',            category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  2 },
  { id: 'safety-head-torch',        name: 'Head torch',       category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  3 },
  { id: 'safety-spare-batteries',   name: 'Spare batteries',  category: 'Safety and mandatory', qty: 4, mandatory: true, sortIndex:  4 },
  { id: 'safety-emergency-blanket', name: 'Emergency blanket',category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  5 },
  { id: 'safety-venom-pump',        name: 'Venom pump',       category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  6 },
  { id: 'safety-signal-mirror',     name: 'Signal mirror',    category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  7 },
  { id: 'safety-lighter',           name: 'Lighter',          category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  8 },
  { id: 'safety-antiseptic',        name: 'Antiseptic',       category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex:  9 },
  { id: 'safety-pins',              name: 'Safety pins',      category: 'Safety and mandatory', qty: 10, mandatory: true, sortIndex: 10 },
  { id: 'safety-luminous-sticks',   name: 'Luminous sticks',  category: 'Safety and mandatory', qty: 2, mandatory: true, sortIndex: 11 },
  { id: 'safety-cash',              name: 'Cash (€)',         category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex: 12 },
  { id: 'safety-passport',          name: 'Passport',         category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex: 13 },
  { id: 'safety-medical-cert',      name: 'Medical certificate', category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex: 14 },
  { id: 'safety-ecg',               name: 'ECG',              category: 'Safety and mandatory', qty: 1, mandatory: true, sortIndex: 15 },

  // ── Medical and foot care ────────────────────────────────────────────────
  { id: 'medical-blister-kit',      name: 'Blister kit',      category: 'Medical and foot care', qty: 1, sortIndex:  0 },
  { id: 'medical-tape',             name: 'Tape',             category: 'Medical and foot care', qty: 1, sortIndex:  1 },
  { id: 'medical-painkillers',      name: 'Painkillers',      category: 'Medical and foot care', qty: 1, sortIndex:  2 },
  { id: 'medical-sunscreen',        name: 'Sunscreen',        category: 'Medical and foot care', qty: 1, sortIndex:  3 },
  { id: 'medical-lip-balm',         name: 'Lip balm',         category: 'Medical and foot care', qty: 1, sortIndex:  4 },
  { id: 'medical-hand-sanitiser',   name: 'Hand sanitiser',   category: 'Medical and foot care', qty: 1, sortIndex:  5 },
  { id: 'medical-anti-chafe',       name: 'Anti-chafe balm',  category: 'Medical and foot care', qty: 1, sortIndex:  6 },

  // ── Electronics ──────────────────────────────────────────────────────────
  { id: 'electronics-gps-watch',    name: 'GPS watch',        category: 'Electronics', qty: 1, sortIndex:  0 },
  { id: 'electronics-power-bank',   name: 'Power bank',       category: 'Electronics', qty: 1, sortIndex:  1 },
  { id: 'electronics-cable',        name: 'Charging cable',   category: 'Electronics', qty: 1, sortIndex:  2 },

  // ── Camp and comfort ─────────────────────────────────────────────────────
  { id: 'camp-footwear',            name: 'Camp footwear',    category: 'Camp and comfort', qty: 1, sortIndex:  0 },
  { id: 'camp-towel',               name: 'Pack towel',       category: 'Camp and comfort', qty: 1, sortIndex:  1 },
  { id: 'camp-wet-wipes',           name: 'Wet wipes',        category: 'Camp and comfort', qty: 1, sortIndex:  2 },
  { id: 'camp-toilet-paper',        name: 'Toilet paper',     category: 'Camp and comfort', qty: 1, sortIndex:  3 },
  { id: 'camp-earplugs',            name: 'Earplugs',         category: 'Camp and comfort', qty: 1, sortIndex:  4 },
  { id: 'camp-repair-kit',          name: 'Repair kit',       category: 'Camp and comfort', qty: 1, sortIndex:  5 },
  { id: 'camp-trekking-poles',      name: 'Trekking poles',   category: 'Camp and comfort', qty: 1, sortIndex:  6 },
]

export const CATEGORY_ORDER = [
  'Clothing',
  'Carry system',
  'Sleeping',
  'Food and cooking',
  'Safety and mandatory',
  'Medical and foot care',
  'Electronics',
  'Camp and comfort',
]

export function buildSeedItems(): KitItem[] {
  return seed.map((item) => ({
    ...item,
    purchased: false,
    extractionStatus: 'manual' as const,
  }))
}
