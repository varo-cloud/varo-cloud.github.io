import type { SeedCreatorCampaign } from '@/types'
import { centsToUsd, formatUsd } from '@/utils/currency'

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_HOUR = 60

type TranslateFn = (key: string, values?: Record<string, string | number>) => string

export function formatCentsAmount(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return '—'
  return formatUsd(centsToUsd(cents))
}

export function formatMinutesDuration(
  minutes: number | null | undefined,
  t: TranslateFn,
): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return '—'
  const days = Math.floor(minutes / MINUTES_PER_DAY)
  const remainder = minutes % MINUTES_PER_DAY
  const hours = Math.floor(remainder / MINUTES_PER_HOUR)
  if (days > 0 && hours > 0) return t('common.duration.daysHours', { days, hours })
  if (days > 0) return t('common.duration.days', { n: days })
  if (hours > 0) return t('common.duration.hours', { n: hours })
  return t('common.duration.minutes', { n: Math.round(minutes) })
}

export function campaignCopyParams(
  campaign: SeedCreatorCampaign | null | undefined,
  t: TranslateFn,
) {
  return {
    seedCap: campaign?.seedCap ?? '—',
    seedBonus: formatCentsAmount(campaign?.seedBonusCents),
    inviterReward: formatCentsAmount(campaign?.rewardInviterCents),
    inviteeReward: formatCentsAmount(campaign?.rewardInviteeCents),
    minDeposit: formatCentsAmount(campaign?.minDepositCents),
    depositWindow: formatMinutesDuration(campaign?.depositWindowMinutes, t),
    bonusTtl: formatMinutesDuration(campaign?.bonusTtlMinutes, t),
  }
}
