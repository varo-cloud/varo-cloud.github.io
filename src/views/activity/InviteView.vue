<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { isApiError } from '@/api/http'
import { bindReferralCode, fetchSeedCreatorOverview } from '@/api/activity'
import { fetchWalletBonus } from '@/api/billing'
import {
  clearPendingInviteCode,
  readPendingInviteCode,
  savePendingInviteCode,
} from '@/utils/pendingInvite'
import { campaignCopyParams } from '@/utils/campaign'
import { centsToUsd, formatUsd } from '@/utils/currency'
import { formatCountdownClock, parseTimestampMs } from '@/utils/time'
import type { BonusGrant, InvitationStatus, ReferralBindResult, SeedCreatorCampaign } from '@/types'

type InvitePhase = 'guest' | 'binding' | 'waiting' | 'winner' | 'no_reward' | 'error'

const route = useRoute()
const { push, localePath } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const phase = ref<InvitePhase>(userStore.isLoggedIn ? 'binding' : 'guest')
const campaign = ref<SeedCreatorCampaign | null>(null)
const loadingCampaign = ref(true)
const errorCode = ref('INVITE_NOT_ELIGIBLE')
const inviteeBonus = ref<BonusGrant | null>(null)
const inviterMasked = ref<string | null>(null)
const boundAt = ref<string | null>(null)
const deadline = ref<string | null>(null)
const inviteStatus = ref<InvitationStatus | null>(null)
const showRules = ref(false)
const nowMs = ref(Date.now())

let countdownTimer: ReturnType<typeof setInterval> | null = null

const code = computed(() => {
  const fromRoute = typeof route.params.code === 'string' ? route.params.code.trim() : ''
  return fromRoute || readPendingInviteCode() || ''
})

const displayCode = computed(() => code.value.toUpperCase())

const copy = computed(() => campaignCopyParams(campaign.value, t))

const guestSteps = computed(() => [
  t('pages.invite.steps.register'),
  t('pages.invite.steps.bind'),
  t('pages.invite.steps.topup', copy.value),
  t('pages.invite.steps.reward', copy.value),
])

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

const boundAtLabel = computed(() => {
  const ms = parseTimestampMs(boundAt.value)
  if (ms == null) return null
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
})

const waitingMetaLabel = computed(() => {
  const inviter = inviterMasked.value
  const at = boundAtLabel.value
  if (inviter && at) {
    return t('pages.invite.waitingMeta', { inviter, time: at })
  }
  if (inviter) return t('pages.invite.waitingMetaInviterOnly', { inviter })
  if (at) return t('pages.invite.waitingMetaBoundOnly', { time: at })
  return null
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

const errorCodeLabel = computed(() => t('pages.invite.errorCode', { code: errorCode.value }))

const SUPPORT_MAILTO = 'mailto:support@varo.cloud'

function goLogin() {
  const target = code.value
    ? localePath(`/invite/${encodeURIComponent(code.value)}`)
    : localePath('/activity/seed-creator')
  push({ name: 'auth', query: { redirect: target } })
}

function goBilling() {
  push({ name: 'billing' })
}

function goCreate() {
  push({ name: 'seedance' })
}

function goHome() {
  push({ name: 'home' })
}

function contactSupport() {
  window.location.href = SUPPORT_MAILTO
}

function resolveInviteErrorCode(err: unknown): string {
  if (isApiError(err)) {
    const match = err.message.match(/\b([A-Z][A-Z0-9_]{2,})\b/)
    if (match?.[1]) return match[1]
    if (err.code === 400) return 'INVITE_NOT_ELIGIBLE'
    if (err.code === 404) return 'INVITE_INVALID'
  }
  return 'INVITE_NOT_ELIGIBLE'
}

function setBindError(err: unknown, fallbackCode = 'INVITE_NOT_ELIGIBLE') {
  errorCode.value = err == null ? fallbackCode : resolveInviteErrorCode(err)
  phase.value = 'error'
}

function toggleRules() {
  showRules.value = !showRules.value
}

function padDeadlineFallback(fromIso: string | null) {
  const minutes = campaign.value?.depositWindowMinutes
  if (minutes == null || minutes <= 0) return fromIso
  const baseMs = parseTimestampMs(fromIso) ?? Date.now()
  return new Date(baseMs + minutes * 60 * 1000).toISOString()
}

async function loadCampaign() {
  try {
    const data = await fetchSeedCreatorOverview()
    campaign.value = data.campaign
  } catch {
    campaign.value = null
  } finally {
    loadingCampaign.value = false
  }
}

function applyBindResult(result: ReferralBindResult | null) {
  const nextBoundAt = result?.boundAt ?? new Date().toISOString()
  inviterMasked.value = result?.inviterMasked ?? null
  boundAt.value = nextBoundAt
  deadline.value = result?.deadline ?? padDeadlineFallback(nextBoundAt)
  inviteStatus.value = result?.status ?? inviteStatus.value
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

async function enterBoundPhase(result: ReferralBindResult | null) {
  applyBindResult(result)
  const isWinner = await detectWinner()
  if (isWinner) return

  if (result?.status === 'no_reward' || inviteStatus.value === 'no_reward') {
    stopCountdown()
    phase.value = 'no_reward'
    return
  }

  phase.value = 'waiting'
  startCountdown()
}

async function bindCode() {
  const inviteCode = code.value
  if (!inviteCode) {
    loadingCampaign.value = false
    setBindError(null, 'INVITE_INVALID')
    return
  }

  savePendingInviteCode(inviteCode)
  const campaignPromise = loadCampaign()

  if (!userStore.isLoggedIn) {
    phase.value = 'guest'
    await campaignPromise
    return
  }

  phase.value = 'binding'

  try {
    const result = await bindReferralCode(inviteCode)
    await campaignPromise
    clearPendingInviteCode()
    await enterBoundPhase(result)
  } catch (err) {
    await campaignPromise
    if (isApiError(err) && err.code === 409) {
      clearPendingInviteCode()
      await enterBoundPhase(null)
      return
    }

    setBindError(err)
  }
}

onMounted(bindCode)
onUnmounted(stopCountdown)
</script>

<template>
  <div class="invite-page">
    <div class="invite-page__inner">
      <div v-if="loadingCampaign && phase === 'guest'" class="invite-page__state">
        <NSpin size="large" />
      </div>

      <template v-else-if="phase === 'guest'">
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.eyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.title') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.lead', copy) }}</p>
        </header>

        <section class="invite-guest" aria-label="Friend invitation">
          <ol class="invite-guest__steps">
            <li v-for="(step, index) in guestSteps" :key="step">
              <span class="invite-guest__step-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="invite-guest__step-text">{{ step }}</span>
            </li>
          </ol>

          <div class="invite-guest__actions">
            <button type="button" class="invite-btn" @click="goLogin">
              {{ t('pages.invite.login') }}
            </button>
            <p v-if="displayCode" class="invite-guest__hint">
              {{ t('pages.invite.loginHint', { code: displayCode }) }}
            </p>
          </div>
        </section>
      </template>

      <template v-else-if="phase === 'binding'">
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.bindingEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.bindingTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.bindingLead') }}</p>
        </header>

        <section class="invite-binding" aria-busy="true" aria-live="polite">
          <div class="invite-binding__card">
            <div class="invite-binding__icon" aria-hidden="true">
              <span class="invite-binding__dot" />
            </div>
            <div class="invite-binding__copy">
              <h2 class="invite-binding__status">{{ t('pages.invite.bindingStatus') }}</h2>
              <p class="invite-binding__hint">{{ t('pages.invite.bindingHint') }}</p>
              <div class="invite-binding__track" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div class="invite-binding__bar" />
              </div>
            </div>
          </div>
        </section>
      </template>

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

          <p v-if="waitingMetaLabel" class="invite-waiting__meta">{{ waitingMetaLabel }}</p>

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
          <p class="invite-page__eyebrow">{{ t('pages.invite.errorEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.errorTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.errorLead') }}</p>
        </header>

        <section class="invite-error" aria-label="Invitation bind error">
          <div class="invite-error__card">
            <div class="invite-error__icon" aria-hidden="true">
              <span class="invite-error__dot" />
            </div>
            <div class="invite-error__copy">
              <h2 class="invite-error__status">{{ t('pages.invite.errorStatus') }}</h2>
              <p class="invite-error__hint">{{ t('pages.invite.errorHint') }}</p>
              <p class="invite-error__code">{{ errorCodeLabel }}</p>
              <div class="invite-error__actions">
                <button type="button" class="invite-btn invite-btn--ghost invite-btn--home" @click="goHome">
                  {{ t('pages.invite.backHome') }}
                </button>
                <button type="button" class="invite-btn invite-btn--support" @click="contactSupport">
                  {{ t('pages.invite.contactSupport') }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: calc(100vh - 140px);
}

.invite-page__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--app-header-height) + 32px) 24px 64px;
}

.invite-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 240px;
}

.invite-page__hero {
  margin-bottom: 46px;
}

.invite-page__eyebrow {
  margin: 0 0 8px;
  color: var(--text-accent);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.invite-page__title {
  margin: 0 0 8px;
  color: #ebf2fa;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
}

.invite-page__lead {
  margin: 0;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.invite-guest {
  display: flex;
  flex-direction: column;
  gap: 50px;
}

.invite-guest__steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 36px;
  margin: 0;
  padding: 44px 32px;
  list-style: none;
  border-radius: 16px;
  background: #0e0e13;
}

.invite-guest__steps li {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 128px;
  padding: 20px 24px;
  border-radius: 12px;
  background: #13141a;
}

.invite-guest__step-index {
  color: var(--text-accent);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.invite-guest__step-text {
  color: #ebf2fa;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}

.invite-guest__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.invite-guest__hint {
  margin: 0;
  color: #858f9e;
  font-size: 13px;
  line-height: 1.5;
}

.invite-binding {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.invite-binding__card {
  display: flex;
  gap: 40px;
  box-sizing: border-box;
  width: 100%;
  max-width: 840px;
  min-height: 410px;
  padding: 68px 90px 80px 68px;
  border-radius: 18px;
  background: #0e0e13;
}

.invite-binding__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: #012126;
}

.invite-binding__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-accent);
  box-shadow: 0 0 18px rgba(6, 182, 212, 0.55);
  animation: invite-binding-pulse 1.4s ease-in-out infinite;
}

.invite-binding__copy {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.invite-binding__status {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
}

.invite-binding__hint {
  margin: 0 0 56px;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.invite-binding__track {
  overflow: hidden;
  width: 100%;
  max-width: 500px;
  height: 8px;
  border-radius: 4px;
  background: #13141a;
}

.invite-binding__bar {
  width: 56%;
  height: 100%;
  border-radius: 4px;
  background: var(--text-accent);
  animation: invite-binding-progress 1.8s ease-in-out infinite;
}

@keyframes invite-binding-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(0.85);
  }
}

@keyframes invite-binding-progress {
  0% {
    width: 18%;
  }
  50% {
    width: 72%;
  }
  100% {
    width: 18%;
  }
}

.invite-winner {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.invite-winner__card {
  display: flex;
  gap: 40px;
  box-sizing: border-box;
  width: 100%;
  max-width: 840px;
  min-height: 410px;
  padding: 68px 90px 80px 68px;
  border-radius: 18px;
  background: #0e0e13;
}

.invite-winner__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: #002217;
}

.invite-winner__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00ba82;
  box-shadow: 0 0 18px rgba(0, 186, 130, 0.45);
}

.invite-winner__copy {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.invite-winner__status {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
}

.invite-winner__hint {
  margin: 0 0 48px;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.invite-winner__amount {
  margin: 0 0 40px;
  color: #00ba82;
  font-size: 46px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.invite-winner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.invite-missed {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.invite-missed__card {
  display: flex;
  gap: 40px;
  box-sizing: border-box;
  width: 100%;
  max-width: 840px;
  min-height: 410px;
  padding: 68px 90px 80px 68px;
  border-radius: 18px;
  background: #0e0e13;
}

.invite-missed__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: #2e1b00;
}

.invite-missed__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff9800;
  box-shadow: 0 0 18px rgba(255, 152, 0, 0.45);
}

.invite-missed__copy {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.invite-missed__status {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
}

.invite-missed__hint {
  margin: 0 0 120px;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.invite-missed__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.invite-waiting {
  display: flex;
  flex-direction: column;
  gap: 56px;
  padding-top: 44px;
}

.invite-waiting__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  min-height: 180px;
  padding: 42px 48px;
  border-radius: 16px;
  background: #0e0e13;
}

.invite-waiting__metric {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
}

.invite-waiting__label {
  margin: 0;
  color: #858f9e;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.invite-waiting__value {
  margin: 0;
  color: #ebf2fa;
  font-size: 44px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.invite-waiting__value--accent {
  color: var(--text-accent);
}

.invite-waiting__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.invite-waiting__meta {
  margin: -36px 0 0;
  color: #858f9e;
  font-size: 13px;
  line-height: 1.5;
}

.invite-waiting__rules {
  padding: 24px;
  border: 1px solid #262933;
  border-radius: 12px;
  background: #13141a;
}

.invite-waiting__rules-title {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 16px;
  font-weight: 600;
}

.invite-waiting__rules ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0 0 0 18px;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.6;
}

.invite-error {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.invite-error__card {
  display: flex;
  gap: 40px;
  box-sizing: border-box;
  width: 100%;
  max-width: 840px;
  min-height: 410px;
  padding: 68px 90px 80px 68px;
  border-radius: 18px;
  background: #0e0e13;
}

.invite-error__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: #2e0810;
}

.invite-error__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff2e58;
  box-shadow: 0 0 18px rgba(255, 46, 88, 0.45);
}

.invite-error__copy {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.invite-error__status {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
}

.invite-error__hint {
  margin: 0 0 56px;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.invite-error__code {
  box-sizing: border-box;
  width: 100%;
  max-width: 500px;
  margin: 0 0 28px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #13141a;
  color: #ff2e58;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.invite-error__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.invite-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 240px;
  height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--text-accent);
  color: #050d0f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.invite-btn--topup {
  min-width: 220px;
}

.invite-btn--balance,
.invite-btn--create,
.invite-btn--billing,
.invite-btn--home,
.invite-btn--support {
  min-width: 190px;
}

.invite-btn--ghost {
  border: 1px solid #262933;
  background: #13141a;
  color: #ebf2fa;
}

.invite-btn--rules {
  min-width: 180px;
}

@media (max-width: 960px) {
  .invite-page__title {
    font-size: 28px;
  }

  .invite-guest__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 24px 20px;
  }

  .invite-guest__steps li {
    min-height: 100px;
  }

  .invite-waiting {
    gap: 36px;
    padding-top: 12px;
  }

  .invite-waiting__metrics {
    grid-template-columns: 1fr;
    min-height: 0;
    padding: 28px 24px;
  }

  .invite-waiting__value {
    font-size: 32px;
  }

  .invite-waiting__meta {
    margin-top: -16px;
  }
}

@media (max-width: 640px) {
  .invite-guest__steps {
    grid-template-columns: 1fr;
  }

  .invite-guest__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .invite-binding {
    padding-top: 12px;
  }

  .invite-binding__card {
    flex-direction: column;
    gap: 24px;
    min-height: 0;
    padding: 32px 24px;
  }

  .invite-binding__status {
    font-size: 22px;
  }

  .invite-binding__hint {
    margin-bottom: 32px;
  }

  .invite-winner {
    padding-top: 12px;
  }

  .invite-winner__card {
    flex-direction: column;
    gap: 24px;
    min-height: 0;
    padding: 32px 24px;
  }

  .invite-winner__status {
    font-size: 22px;
  }

  .invite-winner__hint {
    margin-bottom: 28px;
  }

  .invite-winner__amount {
    margin-bottom: 28px;
    font-size: 36px;
  }

  .invite-missed {
    padding-top: 12px;
  }

  .invite-missed__card {
    flex-direction: column;
    gap: 24px;
    min-height: 0;
    padding: 32px 24px;
  }

  .invite-missed__status {
    font-size: 22px;
  }

  .invite-missed__hint {
    margin-bottom: 32px;
  }

  .invite-error {
    padding-top: 12px;
  }

  .invite-error__card {
    flex-direction: column;
    gap: 24px;
    min-height: 0;
    padding: 32px 24px;
  }

  .invite-error__status {
    font-size: 22px;
  }

  .invite-error__hint {
    margin-bottom: 32px;
  }

  .invite-waiting__actions,
  .invite-winner__actions,
  .invite-missed__actions,
  .invite-error__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .invite-btn,
  .invite-btn--topup,
  .invite-btn--rules,
  .invite-btn--balance,
  .invite-btn--create,
  .invite-btn--billing,
  .invite-btn--home,
  .invite-btn--support {
    width: 100%;
    min-width: 0;
  }
}
</style>
