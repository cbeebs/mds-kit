import { parseWeight } from './weight'
import { parsePrice } from './currency'

export interface ExtractedData {
  title?: string
  priceMinor?: number
  currency?: 'GBP' | 'EUR' | 'USD'
  weightGrams?: number
}

function extractFromJsonLd(doc: Document): ExtractedData {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
  for (const script of scripts) {
    try {
      const data: unknown = JSON.parse(script.textContent ?? '')
      const nodes: unknown[] = Array.isArray(data) ? data : [data]
      for (const node of nodes) {
        if (typeof node !== 'object' || node === null) continue
        const obj = node as Record<string, unknown>
        if (obj['@type'] !== 'Product') continue
        const result: ExtractedData = {}
        if (typeof obj['name'] === 'string') result.title = obj['name']
        const offers = obj['offers']
        if (typeof offers === 'object' && offers !== null) {
          const o = offers as Record<string, unknown>
          const price = parseFloat(String(o['price'] ?? ''))
          if (!Number.isNaN(price) && price > 0) {
            result.priceMinor = Math.round(price * 100)
            const curr = String(o['priceCurrency'] ?? '').toUpperCase()
            if (curr === 'GBP' || curr === 'EUR' || curr === 'USD') result.currency = curr
            else result.currency = 'GBP'
          }
        }
        const weightRaw = obj['weight']
        if (typeof weightRaw === 'string') {
          const g = parseWeight(weightRaw)
          if (g !== null) result.weightGrams = g
        }
        if (result.title || result.priceMinor !== undefined) return result
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return {}
}

function extractFromMeta(doc: Document): ExtractedData {
  const result: ExtractedData = {}
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
  if (ogTitle) result.title = ogTitle
  const ogPrice = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content')
  const ogCurrency = doc.querySelector('meta[property="product:price:currency"]')?.getAttribute('content')
  if (ogPrice) {
    const price = parseFloat(ogPrice)
    if (!Number.isNaN(price) && price > 0) {
      result.priceMinor = Math.round(price * 100)
      const curr = (ogCurrency ?? '').toUpperCase()
      if (curr === 'GBP' || curr === 'EUR' || curr === 'USD') result.currency = curr
      else result.currency = 'GBP'
    }
  }
  return result
}

function extractFromSelectors(doc: Document): ExtractedData {
  const result: ExtractedData = {}
  const titleSelectors = ['h1[itemprop="name"]', '[itemprop="name"]', 'h1.product-title', 'h1.product__title', 'h1']
  for (const sel of titleSelectors) {
    const el = doc.querySelector(sel)
    if (el?.textContent?.trim()) {
      result.title = el.textContent.trim()
      break
    }
  }
  return result
}

function extractFromVisibleText(doc: Document): ExtractedData {
  const result: ExtractedData = {}
  const bodyText = doc.body?.innerText ?? doc.body?.textContent ?? ''
  if (!result.title) {
    const h1 = doc.querySelector('h1')
    if (h1?.textContent?.trim()) result.title = h1.textContent.trim()
  }
  const priceResult = parsePrice(bodyText)
  if (priceResult) {
    result.priceMinor = priceResult.priceMinor
    result.currency = priceResult.currency
  }
  const weightResult = parseWeight(bodyText)
  if (weightResult !== null) result.weightGrams = weightResult
  return result
}

// Path A — live capture: runs against the real DOM with full fallback chain
export function extractProductData(doc: Document): ExtractedData {
  const jsonLd = extractFromJsonLd(doc)
  const meta = extractFromMeta(doc)
  const selectors = extractFromSelectors(doc)
  const visible = extractFromVisibleText(doc)

  return {
    title: jsonLd.title ?? meta.title ?? selectors.title ?? visible.title,
    priceMinor: jsonLd.priceMinor ?? meta.priceMinor ?? visible.priceMinor,
    currency: jsonLd.currency ?? meta.currency ?? visible.currency,
    weightGrams: jsonLd.weightGrams ?? visible.weightGrams,
  }
}

// Path B — background fetch: JSON-LD only (fetched HTML lacks JS-rendered pricing)
export function extractFromFetchedHtml(html: string): ExtractedData {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return extractFromJsonLd(doc)
}
