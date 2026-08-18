<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { fetchSeedCreatorOverview } from '@/api/activity'
import { fetchWalletBonus } from '@/api/billing'
import { campaignCopyParams } from '@/utils/campaign'
import { centsToUsd, formatUsd } from '@/utils/currency'
import { formatCountdownClock, parseTimestampMs } from '@/utils/time'
import type { BonusGrant, InvitationStatus, SeedCreatorCampaign, SeedCreatorMeInvite } from '@/types'

type StatusPhase = 'loading' | 'waiting' | 'winner' | 'no_reward' | 'empty'

const { push } = useLocaleRouter()
const { t } = useI18n()

const phase = ref<StatusPhase>('loading')
const campaign = ref<SeedCreatorCampaign | null>(null)
const inviteeBonus = ref<BonusGrant | null>(null)
const deadline = ref<string | number | null>(null)
const inviteStatus = ref<InvitationStatus | null>(null)
const showRules = ref(false)
const nowMs = ref(Date.now())

let countdownTimer: ReturnType<typeof setInterval> | null = null

const copy = computed(() => campaignCopyParams(campaign.value, t))

const waitingRules = computed(() => [
  t('pages.invite.waitingRules.window', copy.value),
  t('pages.invite.waitingRules.singlePayment'),
  t('pages.invite.waitingRules.winnerSlot'),
  t('pages.invite.waitingRules.reward', copy.value),
  t('pages.invite.waitingRules.bonus', copy.value),
])

const countdownParts = computed(() => formatCountdownClock(deadline.value, nowMs.value))

const countdownLabel = computed(() => {
  const parts = countdownParts.value
  if (!parts) return t('pages.invite.countdownUnavailable')
  if (parts.expired) return t('pages.invite.countdownExpired')
  const clock = [parts.hours, parts.minutes, parts.seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
  return t('pages.invite.countdownValue', { days: parts.days, clock })
})

const winnerAmountUsd = computed(() =>
  centsToUsd(inviteeBonus.value?.amountCents ?? campaign.value?.rewardInviteeCents ?? 0),
)

const winnerAmountLabel = computed(() => `+${formatUsd(winnerAmountUsd.value)}`)

const winnerExpireDays = computed(() => {
  const ms = parseTimestampMs(inviteeBonus.value?.expiresAt)
  if (ms != null) {
    const diffMs = ms - nowMs.value
    if (diffMs <= 0) return 0
    return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
  }
  const ttlMinutes = campaign.value?.bonusTtlMinutes
  if (ttlMinutes == null || ttlMinutes <= 0) return 0
  return Math.max(1, Math.round(ttlMinutes / (24 * 60)))
})

const winnerHintLabel = computed(() =>
  t('pages.invite.winnerHint', {
    amount: formatUsd(winnerAmountUsd.value),
    days: winnerExpireDays.value,
  }),
)

function goBilling() {
  push({ name: 'billing' })
}

function goCreate() {
  push({ name: 'models' })
}

function goHome() {
  push({ name: 'home' })
}

function toggleRules() {
  showRules.value = !showRules.value
}

function startCountdown() {
  stopCountdown()
  nowMs.value = Date.now()
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer != null) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

async function detectWinner(): Promise<boolean> {
  try {
    const wallet = await fetchWalletBonus()
    const grant =
      wallet.grants.find((item) => item.source === 'invitee_reward' && item.status === 'active') ??
      wallet.grants.find((item) => item.source === 'invitee_reward') ??
      null
    inviteeBonus.value = grant
    if (grant) {
      stopCountdown()
      phase.value = 'winner'
      return true
    }
  } catch {
    // Wallet is optional for the waiting state.
  }
  return false
}

function applyInvite(invite: SeedCreatorMeInvite) {
  deadline.value = invite.depositDeadline
  inviteStatus.value = invite.status
}

async function resolveStatus(invite: SeedCreatorMeInvite | null) {
  if (invite) applyInvite(invite)

  if (invite?.isWinner || invite?.status === 'winner') {
    await detectWinner()
    stopCountdown()
    phase.value = 'winner'
    return
  }

  const isWinner = await detectWinner()
  if (isWinner) return

  if (invite?.status === 'no_reward' || inviteStatus.value === 'no_reward') {
    stopCountdown()
    phase.value = 'no_reward'
    return
  }

  if (!invite) {
    stopCountdown()
    phase.value = 'empty'
    return
  }

  phase.value = 'waiting'
  startCountdown()
}

async function loadStatus() {
  phase.value = 'loading'
  try {
    const data = await fetchSeedCreatorOverview()
    campaign.value = data.campaign
    await resolveStatus(data.me?.invite ?? null)
  } catch {
    campaign.value = null
    await resolveStatus(null)
  }
}

onMounted(loadStatus)
onUnmounted(stopCountdown)
</script>

<template>
  <div class="invite-page">
    <div class="invite-page__inner">
      <div v-if="phase === 'loading'" class="invite-page__state">
        <NSpin size="large" />
      </div>

      <template v-else-if="phase === 'waiting'">
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.waitingEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.waitingTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.waitingLead') }}</p>
        </header>

        <section class="invite-waiting" aria-label="Waiting for first top-up">
          <div class="invite-waiting__metrics">
            <div class="invite-waiting__metric">
              <p class="invite-waiting__label">{{ t('pages.invite.countdownLabel') }}</p>
              <p class="invite-waiting__value">{{ countdownLabel }}</p>
            </div>
            <div class="invite-waiting__metric">
              <p class="invite-waiting__label">{{ t('pages.invite.topupLabel') }}</p>
              <p class="invite-waiting__value invite-waiting__value--accent">
                {{ t('pages.invite.topupAmount', copy) }}
              </p>
            </div>
          </div>

          <div class="invite-waiting__actions">
            <button type="button" class="invite-btn invite-btn--topup" @click="goBilling">
              {{ t('pages.invite.goTopup') }}
            </button>
            <button
              type="button"
              class="invite-btn invite-btn--ghost invite-btn--rules"
              :aria-expanded="showRules"
              @click="toggleRules"
            >
              {{ t('pages.invite.viewRules') }}
            </button>
          </div>

          <section
            v-if="showRules"
            class="invite-waiting__rules"
            :aria-label="t('pages.invite.rulesTitle')"
          >
            <h2 class="invite-waiting__rules-title">{{ t('pages.invite.rulesTitle') }}</h2>
            <ul>
              <li v-for="rule in waitingRules" :key="rule">{{ rule }}</li>
            </ul>
          </section>
        </section>
      </template>

      <template v-else-if="phase === 'winner'">
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.winnerEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.winnerTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.winnerLead') }}</p>
        </header>

        <section class="invite-winner" aria-label="Winner reward">
          <div class="invite-winner__card">
            <div class="invite-winner__icon" aria-hidden="true">
              <span class="invite-winner__dot" />
            </div>
            <div class="invite-winner__copy">
              <h2 class="invite-winner__status">
                {{ t('pages.invite.winnerStatus', { amount: formatUsd(winnerAmountUsd) }) }}
              </h2>
              <p class="invite-winner__hint">{{ winnerHintLabel }}</p>
              <p class="invite-winner__amount">{{ winnerAmountLabel }}</p>
              <div class="invite-winner__actions">
                <button type="button" class="invite-btn invite-btn--balance" @click="goBilling">
                  {{ t('pages.invite.viewBalance') }}
                </button>
                <button type="button" class="invite-btn invite-btn--ghost invite-btn--create" @click="goCreate">
                  {{ t('pages.invite.startCreate') }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template v-else-if="phase === 'no_reward'">
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.noRewardEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.noRewardTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.noRewardLead', copy) }}</p>
        </header>

        <section class="invite-missed" aria-label="Condition completed without reward">
          <div class="invite-missed__card">
            <div class="invite-missed__icon" aria-hidden="true">
              <span class="invite-missed__dot" />
            </div>
            <div class="invite-missed__copy">
              <h2 class="invite-missed__status">{{ t('pages.invite.noRewardStatus') }}</h2>
              <p class="invite-missed__hint">{{ t('pages.invite.noRewardHint') }}</p>
              <div class="invite-missed__actions">
                <button type="button" class="invite-btn invite-btn--ghost invite-btn--billing" @click="goBilling">
                  {{ t('pages.invite.viewBilling') }}
                </button>
                <button type="button" class="invite-btn invite-btn--create" @click="goCreate">
                  {{ t('pages.invite.startCreate') }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.statusEmptyEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.statusEmptyTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.statusEmptyLead') }}</p>
        </header>

        <section class="invite-guest__actions">
          <button type="button" class="invite-btn invite-btn--ghost invite-btn--home" @click="goHome">
            {{ t('pages.invite.backHome') }}
          </button>
        </section>
      </template>
    </div>
  </div>
</template>

<style src="./invite-page.css"></style>
