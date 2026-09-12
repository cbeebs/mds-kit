const OZ_TO_GRAMS = 28.3495

const WEIGHT_PATTERNS: RegExp[] = [
  /(?:approx(?:imate(?:ly)?)?\.?\s*weight|item\s*weight|weight)[:\s]+(\d+(?:\.\d+)?)\s*(kg|g|grams?|oz)/i,
  /(\d+(?:\.\d+)?)\s*(kg|g|grams?|oz)\b/i,
]

export function parseWeight(text: string): number | null {
  for (const pattern of WEIGHT_PATTERNS) {
    const match = pattern.exec(text)
    if (!match) continue
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    if (Number.isNaN(value) || value <= 0) continue
    if (unit === 'kg') return Math.round(value * 1000)
    if (unit === 'oz') return Math.round(value * OZ_TO_GRAMS)
    return Math.round(value)
  }
  return null
}

export function formatWeight(grams: number): string {
  if (grams < 1000) return `${grams} g`
  return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
}
