/**
 * Format a numeric amount for display without forcing decimal places.
 * Keeps the precision of the JS number (as returned by the API),
 * only stripping trailing zeros (e.g. 0.00050 → "0.0005").
 */
export function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

/** Format a USD amount for display (e.g. `$0.0005`, `$17.5`). */
export function formatUsd(value: number): string {
  return `$${formatDecimal(value)}`
}
