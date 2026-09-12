const GBP_FMT = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
const GBP_WHOLE_FMT = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })

export function formatGBP(pence: number): string {
  return GBP_FMT.format(pence / 100)
}

export function formatGBPWhole(pence: number): string {
  return GBP_WHOLE_FMT.format(pence / 100)
}

export function convertToGBPPence(
  minorUnits: number,
  currency: string,
  fxRates: { EUR: number; USD: number }
): number {
  if (currency === 'GBP') return minorUnits
  if (currency === 'EUR') return Math.round(minorUnits / fxRates.EUR * 100)
  if (currency === 'USD') return Math.round(minorUnits / fxRates.USD * 100)
  return minorUnits
}

const SKIP_CONTEXTS = /klarna|clearpay|paypal|instal|finance|afterpay/i
const SKIP_PRECEDING = /\b(?:was|rrp|from)\b/i
const SKIP_FOLLOWING = /\/mo\b|per\s*month|a\s*month|x\s*\d/i

export function parsePrice(text: string): { priceMinor: number; currency: 'GBP' | 'EUR' | 'USD' } | null {
  const candidates = [
    { re: /£\s*(\d+(?:\.\d{1,2})?)/, currency: 'GBP' as const },
    { re: /GBP\s*(\d+(?:\.\d{1,2})?)/, currency: 'GBP' as const },
    { re: /€\s*(\d+(?:\.\d{1,2})?)/, currency: 'EUR' as const },
    { re: /EUR\s*(\d+(?:\.\d{1,2})?)/, currency: 'EUR' as const },
    { re: /\$\s*(\d+(?:\.\d{1,2})?)/, currency: 'USD' as const },
    { re: /USD\s*(\d+(?:\.\d{1,2})?)/, currency: 'USD' as const },
  ]

  for (const { re, currency } of candidates) {
    const match = re.exec(text)
    if (!match) continue
    const idx = match.index
    const preceding = text.slice(Math.max(0, idx - 40), idx)
    const following = text.slice(idx + match[0].length, idx + match[0].length + 20)
    if (SKIP_PRECEDING.test(preceding)) continue
    if (SKIP_FOLLOWING.test(following)) continue
    const value = parseFloat(match[1])
    if (Number.isNaN(value) || value <= 0) continue
    return { priceMinor: Math.round(value * 100), currency }
  }
  return null
}

export function isPriceContainerSuspect(el: Element): boolean {
  const cls = (el.className ?? '') + ' ' + (el.id ?? '')
  return SKIP_CONTEXTS.test(cls)
}
