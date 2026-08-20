<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { isApiError } from '@/api/http'
import { bindReferralCode, fetchSeedCreatorOverview } from '@/api/activity'
import {
  clearPendingInviteCode,
  savePendingInviteCode,
} from '@/utils/pendingInvite'
import { campaignCopyParams } from '@/utils/campaign'
import { centsToUsd, formatUsd } from '@/utils/currency'
import { formatCountdownClock, parseTimestampMs } from '@/utils/time'
import type {
  BonusGrant,
  InvitationStatus,
  ReferralBindResult,
  SeedCreatorCampaign,
  SeedCreatorMe,
  SeedCreatorMeInvite,
} from '@/types'

type InvitePhase = 'guest' | 'binding' | 'waiting' | 'slot_unavailable' | 'winner' | 'no_reward' | 'error'

const route = useRoute()
const { push, localePath } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const phase = ref<BindPhase>(userStore.isLoggedIn ? 'binding' : 'guest')
const campaign = ref<SeedCreatorCampaign | null>(null)
const loadingCampaign = ref(true)
const errorCode = ref('INVITE_NOT_ELIGIBLE')

const code = computed(() =>
  typeof route.params.code === 'string' ? route.params.code.trim() : '',
)

const displayCode = computed(() => code.value.toUpperCase())
const copy = computed(() => campaignCopyParams(campaign.value, t))

const guestSteps = computed(() => [
  t('pages.invite.steps.register'),
  t('pages.invite.steps.bind'),
  t('pages.invite.steps.topup', copy.value),
  t('pages.invite.steps.reward', copy.value),
])

const errorCodeLabel = computed(() => t('pages.invite.errorCode', { code: errorCode.value }))

const SUPPORT_MAILTO = 'mailto:support@varo.cloud'

function goLogin() {
  const target = code.value
    ? localePath(`/invite/${encodeURIComponent(code.value)}`)
    : localePath('/invite')
  push({ name: 'auth', query: { redirect: target } })
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

async function goInviteStatus() {
  await push({ name: 'invite', replace: true })
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

function applyInvite(invite: SeedCreatorMeInvite) {
  deadline.value = invite.depositDeadline
  inviteStatus.value = invite.status
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

async function enterBoundPhase(result: ReferralBindResult | null, invite?: SeedCreatorMeInvite | null) {
  if (invite) applyInvite(invite)
  else applyBindResult(result)

  if (invite?.isWinner || invite?.status === 'winner' || result?.status === 'winner') {
    await detectWinner()
    stopCountdown()
    phase.value = 'winner'
    return
  }

  const isWinner = await detectWinner()
  if (isWinner) return

  if (result?.status === 'no_reward' || invite?.status === 'no_reward' || inviteStatus.value === 'no_reward') {
    stopCountdown()
    phase.value = 'no_reward'
    return
  }

  // Inviter already has a Winner (or reward otherwise closed) before this user tops up.
  if (invite && !invite.rewardEligible) {
    stopCountdown()
    phase.value = 'slot_unavailable'
    return
  }

  phase.value = 'waiting'
  startCountdown()
}

async function restoreBoundInvitation() {
  const invite = me.value?.invite
  if (invite) {
    await enterBoundPhase(null, invite)
    return
  }

  const isWinner = await detectWinner()
  if (isWinner) return
  phase.value = 'guest'
}

async function refreshInviteAfterBind() {
  await loadCampaign()
  return me.value?.invite ?? null
}

async function bindCode() {
  const inviteCode = code.value
  if (!inviteCode) {
    loadingCampaign.value = false
    setBindError(null, 'INVITE_INVALID')
    return
  }

  savePendingInviteCode(inviteCode)

  if (!userStore.isLoggedIn) {
    phase.value = 'guest'
    await loadCampaign()
    return
  }

  if (userStore.profile?.invitedCode) {
    clearPendingInviteCode()
    await goInviteStatus()
    return
  }

  phase.value = 'binding'
  const campaignPromise = loadCampaign()

  try {
    await bindReferralCode(inviteCode)
    await campaignPromise
    clearPendingInviteCode()
    await userStore.loadProfile()
    await goInviteStatus()
    // Re-fetch so me.invite.reward_eligible is available (bind response does not include it).
    const invite = await refreshInviteAfterBind()
    await enterBoundPhase(result, invite)
  } catch (err) {
    await campaignPromise
    if (isApiError(err) && err.code === 409) {
      clearPendingInviteCode()
      await userStore.loadProfile()
      await goInviteStatus()
      const invite = await refreshInviteAfterBind()
      await enterBoundPhase(null, invite)
      return
    }

    setBindError(err)
  }
}

onMounted(bindCode)
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

      <template v-else-if="phase === 'slot_unavailable'">
        <header class="invite-page__hero">
          <p class="invite-page__eyebrow">{{ t('pages.invite.slotUnavailableEyebrow') }}</p>
          <h1 class="invite-page__title">{{ t('pages.invite.slotUnavailableTitle') }}</h1>
          <p class="invite-page__lead">{{ t('pages.invite.slotUnavailableLead', copy) }}</p>
        </header>

        <section class="invite-missed" aria-label="Invite bonus unavailable">
          <div class="invite-missed__card">
            <div class="invite-missed__icon" aria-hidden="true">
              <span class="invite-missed__dot" />
            </div>
            <div class="invite-missed__copy">
              <h2 class="invite-missed__status">{{ t('pages.invite.slotUnavailableStatus') }}</h2>
              <p class="invite-missed__hint">{{ t('pages.invite.slotUnavailableHint') }}</p>
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

<style src="./invite-page.css"></style>
