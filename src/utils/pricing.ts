import type { PricingPriceUnit } from '@/types'

export function isLlmPricingUnit(unit: PricingPriceUnit): boolean {
  return unit === 'per_million_tokens'
}

/** Format USD for pricing table — precision varies by billing unit. */
export function formatPricingUsd(value: number, unit: PricingPriceUnit): string {
  if (unit === 'per_million_tokens') {
    const fixed = value.toFixed(2)
    return `$${fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')}`
  }

  const fixed = value.toFixed(3)
  return `$${fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')}`
}

export function pricingUnitI18nKey(unit: PricingPriceUnit): string {
  return `pages.pricing.priceUnits.${unit}`
}

export function pricingLabelI18nKey(unit: PricingPriceUnit): 'inputPrice' | 'startFrom' {
  return isLlmPricingUnit(unit) ? 'inputPrice' : 'startFrom'
}
