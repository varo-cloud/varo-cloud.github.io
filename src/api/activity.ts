import { http, unwrap } from './http'
import type {
  InvitationStatus,
  ReferralBindResult,
  ReferralInvitation,
  ReferralOverview,
  ReferralRewardStatus,
  SeedCreatorMe,
  SeedCreatorOverview,
  SeedCreatorSubmitPayload,
  SeedStatus,
} from '@/types'

interface ApiSeedCreatorCampaign {
  id: string
  state: string
  seed_cap: number
  seed_approved: number
  ends_at?: string | null
  name?: string | null
  seed_bonus_cents?: number | null
  reward_inviter_cents?: number | null
  reward_invitee_cents?: number | null
  bonus_ttl_minutes?: number | null
  deposit_window_minutes?: number | null
  min_deposit_cents?: number | null
  budget_cap_cents?: number | null
  starts_at?: string | null
}

interface ApiSeedCreatorMe {
  status: string
  seed_rank?: number | null
  invite_code?: string | null
  referral_reward_status?: string | null
  twitter_username?: string | null
  twitter_url?: string | null
  twitter_profile_url?: string | null
  discord_username?: string | null
  discord_user_id?: string | null
  submitted_at?: string | null
  reject_reason?: string | null
}

interface ApiSeedCreatorOverview {
  campaign: ApiSeedCreatorCampaign
  me: ApiSeedCreatorMe | null
}

interface ApiReferralOverview {
  invite_code: string
  invite_url: string
  invited_count: number
  referral_reward_status: string
}

interface ApiReferralInvitation {
  invitee_masked: string
  registered: boolean
  topped_up: boolean
  top_up_amount_cents?: number | null
  status: string
  deadline?: string | null
}

function mapSeedStatus(value: string): SeedStatus {
  if (
    value === 'submitted' ||
    value === 'under_review' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'cancelled'
  ) {
    return value
  }
  return 'submitted'
}

function mapReferralRewardStatus(value: string | null | undefined): ReferralRewardStatus | null {
  if (value === 'waiting_for_winner' || value === 'rewarded' || value === 'expired') {
    return value
  }
  return null
}

function mapInvitationStatus(value: string): InvitationStatus {
  if (
    value === 'waiting_for_topup' ||
    value === 'qualified' ||
    value === 'winner' ||
    value === 'no_reward' ||
    value === 'expired'
  ) {
    return value
  }
  return 'waiting_for_topup'
}

function optionalFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function mapCampaign(raw: ApiSeedCreatorCampaign): SeedCreatorOverview['campaign'] {
  return {
    id: raw.id,
    state: raw.state === 'ended' ? 'ended' : raw.state === 'draft' ? 'draft' : 'active',
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : null,
    seedCap: raw.seed_cap,
    seedApproved: raw.seed_approved,
    seedBonusCents: optionalFiniteNumber(raw.seed_bonus_cents),
    rewardInviterCents: optionalFiniteNumber(raw.reward_inviter_cents),
    rewardInviteeCents: optionalFiniteNumber(raw.reward_invitee_cents),
    bonusTtlMinutes: optionalFiniteNumber(raw.bonus_ttl_minutes),
    depositWindowMinutes: optionalFiniteNumber(raw.deposit_window_minutes),
    minDepositCents: optionalFiniteNumber(raw.min_deposit_cents),
    budgetCapCents: optionalFiniteNumber(raw.budget_cap_cents),
    startsAt: raw.starts_at ?? null,
    endsAt: raw.ends_at ?? null,
  }
}

function mapMe(raw: ApiSeedCreatorMe | null): SeedCreatorMe | null {
  if (!raw) return null
  return {
    status: mapSeedStatus(raw.status),
    seedRank: raw.seed_rank ?? null,
    inviteCode: raw.invite_code ?? null,
    referralRewardStatus: mapReferralRewardStatus(raw.referral_reward_status),
    twitterUsername: raw.twitter_username?.trim() || null,
    twitterUrl: (raw.twitter_url ?? raw.twitter_profile_url)?.trim() || null,
    discordUsername: raw.discord_username?.trim() || null,
    discordUserId: raw.discord_user_id?.trim() || null,
    submittedAt: raw.submitted_at ?? null,
    rejectReason: raw.reject_reason?.trim() || null,
  }
}

export function fetchSeedCreatorOverview() {
  return unwrap<ApiSeedCreatorOverview>(http.get('/activity/seed-creator')).then(
    (raw): SeedCreatorOverview => ({
      campaign: mapCampaign(raw.campaign),
      me: mapMe(raw.me),
    }),
  )
}

export function submitSeedCreatorApplication(payload: SeedCreatorSubmitPayload) {
  return unwrap<{ status: string }>(
    http.post('/activity/seed-creator/submit', {
      twitter_username: payload.twitterUsername || undefined,
      twitter_url: payload.twitterUrl || undefined,
      discord_username: payload.discordUsername || undefined,
      discord_user_id: payload.discordUserId || undefined,
    }),
  ).then((raw) => ({ status: mapSeedStatus(raw.status) }))
}

export function fetchReferralOverview() {
  return unwrap<ApiReferralOverview>(http.get('/activity/referral')).then(
    (raw): ReferralOverview => ({
      inviteCode: raw.invite_code,
      inviteUrl: raw.invite_url,
      invitedCount: raw.invited_count,
      referralRewardStatus: mapReferralRewardStatus(raw.referral_reward_status) ?? 'waiting_for_winner',
    }),
  )
}

export function fetchReferralInvitations() {
  return unwrap<ApiReferralInvitation[]>(http.get('/activity/referral/invitations')).then(
    (items): ReferralInvitation[] =>
      items.map((raw) => ({
        inviteeMasked: raw.invitee_masked,
        registered: raw.registered,
        toppedUp: raw.topped_up,
        topUpAmountCents:
          typeof raw.top_up_amount_cents === 'number' && Number.isFinite(raw.top_up_amount_cents)
            ? raw.top_up_amount_cents
            : null,
        status: mapInvitationStatus(raw.status),
        deadline: raw.deadline ?? null,
      })),
  )
}

export function bindReferralCode(code: string): Promise<ReferralBindResult> {
  return unwrap<{
    bound?: boolean
    inviter_masked?: string | null
    deadline?: string | null
    bound_at?: string | null
    status?: string | null
  }>(http.post('/activity/referral/bind', { code })).then((raw): ReferralBindResult => ({
    bound: Boolean(raw.bound ?? true),
    inviterMasked:
      typeof raw.inviter_masked === 'string' && raw.inviter_masked.trim()
        ? raw.inviter_masked.trim()
        : null,
    deadline: raw.deadline ?? null,
    boundAt: raw.bound_at ?? null,
    status: raw.status ? mapInvitationStatus(raw.status) : null,
  }))
}
