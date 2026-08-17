import { http, unwrap } from './http'
import type {
  InvitationStatus,
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
}

interface ApiSeedCreatorMe {
  status: string
  seed_rank?: number | null
  invite_code?: string | null
  referral_reward_status?: string | null
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

function mapMe(raw: ApiSeedCreatorMe | null): SeedCreatorMe | null {
  if (!raw) return null
  return {
    status: mapSeedStatus(raw.status),
    seedRank: raw.seed_rank ?? null,
    inviteCode: raw.invite_code ?? null,
    referralRewardStatus: mapReferralRewardStatus(raw.referral_reward_status),
  }
}

export function fetchSeedCreatorOverview() {
  return unwrap<ApiSeedCreatorOverview>(http.get('/activity/seed-creator')).then(
    (raw): SeedCreatorOverview => ({
      campaign: {
        id: raw.campaign.id,
        state: raw.campaign.state === 'ended' ? 'ended' : raw.campaign.state === 'draft' ? 'draft' : 'active',
        seedCap: raw.campaign.seed_cap,
        seedApproved: raw.campaign.seed_approved,
        endsAt: raw.campaign.ends_at ?? null,
      },
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

export function bindReferralCode(code: string) {
  return unwrap<{ bound: boolean }>(http.post('/activity/referral/bind', { code })).then(
    (raw) => ({ bound: Boolean(raw.bound) }),
  )
}
