const SECOND_MS = 1000

/** Convert API timestamp (seconds or milliseconds) to milliseconds. */
export function toMillis(timestamp: number): number {
  if (!Number.isFinite(timestamp)) return Number.NaN
  return timestamp < 1e12 ? timestamp * SECOND_MS : timestamp
}

export type TimestampFormatStyle = 'date' | 'datetime' | 'compactDatetime' | 'time'

const FORMAT_PRESETS: Record<TimestampFormatStyle, Intl.DateTimeFormatOptions> = {
  date: { month: 'short', day: 'numeric', year: 'numeric' },
  datetime: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  compactDatetime: {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  time: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
}

export function formatTimestamp(
  timestamp: number,
  locale: string,
  style: TimestampFormatStyle = 'date',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(toMillis(timestamp))
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, { ...FORMAT_PRESETS[style], ...options }).format(date)
}

export function formatRelativeTimestamp(timestamp: number, locale: string): string {
  const diffSec = Math.round((toMillis(timestamp) - Date.now()) / SECOND_MS)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diffSec)

  if (abs < 60) return rtf.format(diffSec, 'second')

  const diffMin = Math.round(diffSec / 60)
  if (abs < 3600) return rtf.format(diffMin, 'minute')

  const diffHour = Math.round(diffSec / 3600)
  if (abs < 86400) return rtf.format(diffHour, 'hour')

  return rtf.format(Math.round(diffSec / 86400), 'day')
}
