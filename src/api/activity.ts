import { http, unwrap } from './http'
import type {
  InvitationStatus,
  ReferralBindResult,
  ReferralInvitation,
  ReferralOverview,
  ReferralRewardStatus,
  SeedCreatorMe,
  SeedCreatorMeInvite,
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

interface ApiSeedCreatorMeInvite {
  status?: string | null
  deposit_deadline?: number | string | null
  first_topup_at?: number | string | null
  is_winner?: boolean | null
  reward_eligible?: boolean | null
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
  invite?: ApiSeedCreatorMeInvite | null
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

interface ApiReferralBind {
  bound?: boolean
  inviter_masked?: string | null
  deadline?: string | null
  bound_at?: string | null
  status?: string | null
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

function mapMeInvite(raw: ApiSeedCreatorMeInvite | null | undefined): SeedCreatorMeInvite | null {
  if (!raw) return null
  const status = mapInvitationStatus(raw.status ?? '')
  const isWinner = Boolean(raw.is_winner)
  const rewardEligible =
    typeof raw.reward_eligible === 'boolean'
      ? raw.reward_eligible
      : status === 'waiting_for_topup' && !isWinner
  return {
    status,
    depositDeadline: raw.deposit_deadline ?? null,
    firstTopupAt: raw.first_topup_at ?? null,
    isWinner,
    rewardEligible,
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
    invite: mapMeInvite(raw.invite),
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

function mapReferralBindResult(raw: ApiReferralBind | null | undefined, defaultBound: boolean): ReferralBindResult {
  if (!raw) {
    return {
      bound: false,
      inviterMasked: null,
      deadline: null,
      boundAt: null,
      status: null,
    }
  }

  return {
    bound: Boolean(raw.bound ?? defaultBound),
    inviterMasked:
      typeof raw.inviter_masked === 'string' && raw.inviter_masked.trim()
        ? raw.inviter_masked.trim()
        : null,
    deadline: raw.deadline ?? null,
    boundAt: raw.bound_at ?? null,
    status: raw.status ? mapInvitationStatus(raw.status) : null,
  }
}

export function bindReferralCode(code: string): Promise<ReferralBindResult> {
  return unwrap<ApiReferralBind>(http.post('/activity/referral/bind', { code })).then((raw) =>
    mapReferralBindResult(raw, true),
  )
}
