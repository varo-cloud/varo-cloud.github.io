const SECOND_MS = 1000

/** Convert API timestamp (seconds or milliseconds) to milliseconds. */
export function toMillis(timestamp: number): number {
  if (!Number.isFinite(timestamp)) return Number.NaN
  return timestamp < 1e12 ? timestamp * SECOND_MS : timestamp
}

export type TimestampFormatStyle = 'date' | 'datetime' | 'compactDatetime' | 'time'

const FORMAT_PRESETS: Record<Exclude<TimestampFormatStyle, 'compactDatetime'>, Intl.DateTimeFormatOptions> = {
  date: { month: 'short', day: 'numeric', year: 'numeric' },
  datetime: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  time: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
}

/** e.g. 2026/6/13 16:51:37 */
function formatCompactDatetime(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}

export function formatTimestamp(
  timestamp: number,
  locale: string,
  style: TimestampFormatStyle = 'date',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(toMillis(timestamp))
  if (Number.isNaN(date.getTime())) return ''

  if (style === 'compactDatetime') {
    return formatCompactDatetime(date)
  }

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

/** Remaining calendar-style countdown until an ISO / timestamp deadline. */
export function formatCountdown(deadline: string | number | null | undefined): {
  expired: boolean
  days: number
  hours: number
} | null {
  if (deadline == null || deadline === '') return null
  const ms = typeof deadline === 'number' ? toMillis(deadline) : Date.parse(deadline)
  if (!Number.isFinite(ms)) return null

  const diffMs = ms - Date.now()
  if (diffMs <= 0) return { expired: true, days: 0, hours: 0 }

  const totalHours = Math.floor(diffMs / (60 * 60 * 1000))
  return {
    expired: false,
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  }
}

/** Remaining countdown with day + clock parts until an ISO / timestamp deadline. */
export function formatCountdownClock(
  deadline: string | number | null | undefined,
  nowMs = Date.now(),
): {
  expired: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
} | null {
  if (deadline == null || deadline === '') return null
  const ms = typeof deadline === 'number' ? toMillis(deadline) : Date.parse(deadline)
  if (!Number.isFinite(ms)) return null

  const diffMs = ms - nowMs
  if (diffMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const totalSec = Math.floor(diffMs / SECOND_MS)
  return {
    expired: false,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  }
}

export function parseTimestampMs(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const ms = typeof value === 'number' ? toMillis(value) : Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}
