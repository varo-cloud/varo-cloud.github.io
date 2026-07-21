import type { Model, PricingItem, PricingPriceUnit } from '@/types'

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

/** Map a catalog model card into the pricing table row shape. */
export function modelToPricingItem(model: Model): PricingItem {
  return {
    id: model.id,
    modelId: model.id,
    name: model.displayName,
    capability: model.capability,
    discount: model.discount,
    standardPriceUsd: model.originalPriceUsd ?? model.startingPriceUsd,
    startingPriceUsd: model.startingPriceUsd,
    priceUnit: model.priceUnit,
  }
}

/**
 * Convert API `discount` multiplier to a display percent.
 * e.g. `0.9` → `10` (10% off). Returns null when there is no meaningful discount.
 */
export function discountToPercent(discount: number | null | undefined): number | null {
  if (discount == null || !Number.isFinite(discount)) return null
  if (discount <= 0 || discount >= 1) return null
  const percent = Math.round((1 - discount) * 100)
  return percent > 0 ? percent : null
}

export function formatDiscountLabel(percent: number): string {
  return `-${percent}%`
}
