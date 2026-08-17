<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { useAppMessage } from '@/composables/useAppMessage'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { isApiError } from '@/api/http'
import {
  fetchReferralInvitations,
  fetchReferralOverview,
  fetchSeedCreatorOverview,
  submitSeedCreatorApplication,
} from '@/api/activity'
import { parseTimestampMs } from '@/utils/time'
import type {
  ReferralInvitation,
  ReferralOverview,
  ReferralRewardStatus,
  SeedCreatorMe,
  SeedCreatorOverview,
} from '@/types'

const { t, tm } = useI18n()
const { push, localePath } = useLocaleRouter()
const message = useAppMessage()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const noCampaign = ref(false)
const showRules = ref(false)
const editingApplication = ref(false)

const overview = ref<SeedCreatorOverview | null>(null)
const referral = ref<ReferralOverview | null>(null)
const invitations = ref<ReferralInvitation[]>([])

const twitterUsername = ref('')
const twitterUrl = ref('')
const discordUsername = ref('')
const discordUserId = ref('')
const formConfirmed = ref(false)

const campaign = computed(() => overview.value?.campaign ?? null)
const me = computed<SeedCreatorMe | null>(() => overview.value?.me ?? null)
const isEnded = computed(() => campaign.value?.state === 'ended')
const isApproved = computed(() => me.value?.status === 'approved')
const isPending = computed(
  () => me.value?.status === 'submitted' || me.value?.status === 'under_review',
)
const isRejected = computed(() => me.value?.status === 'rejected')
const showPendingStatus = computed(() => isPending.value && !editingApplication.value)
const showRejectedStatus = computed(() => isRejected.value && !editingApplication.value)
const showEndedStatus = computed(() => isEnded.value)
const canSubmit = computed(() => {
  if (!userStore.isLoggedIn || isEnded.value || isApproved.value) return false
  if (isPending.value) return editingApplication.value
  return !me.value
})

const formFilled = computed(
  () =>
    Boolean(
      twitterUsername.value.trim() ||
        twitterUrl.value.trim() ||
        discordUsername.value.trim() ||
        discordUserId.value.trim(),
    ),
)

const canSubmitForm = computed(
  () => canSubmit.value && formFilled.value && formConfirmed.value && !submitting.value,
)

const canResubmitRejected = computed(
  () => isRejected.value && !isEnded.value && formFilled.value && !submitting.value,
)

const rejectReasonLabel = computed(() => {
  const reason = me.value?.rejectReason?.trim()
  if (reason) return t('pages.seedCreator.rejected.reason', { reason })
  return t('pages.seedCreator.rejected.reasonFallback')
})

const landingSteps = computed(() => [
  t('pages.seedCreator.landing.steps.social'),
  t('pages.seedCreator.landing.steps.review'),
  t('pages.seedCreator.landing.steps.invite'),
  t('pages.seedCreator.landing.steps.reward'),
])

const landingRules = computed(() => {
  const items = tm('pages.seedCreator.landing.rules')
  return Array.isArray(items) ? (items as string[]) : []
})

const formTips = computed(() => {
  const items = tm('pages.seedCreator.form.tips')
  return Array.isArray(items) ? (items as string[]) : []
})

const submittedAtLabel = computed(() => {
  const ms = parseTimestampMs(me.value?.submittedAt)
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

const submittedProfileLabel = computed(() => {
  const parts: string[] = []
  const twitter = me.value?.twitterUsername?.trim()
  const discord = me.value?.discordUsername?.trim()
  if (twitter) {
    parts.push(`X: ${twitter.startsWith('@') ? twitter : `@${twitter}`}`)
  }
  if (discord) {
    parts.push(`Discord: ${discord}`)
  }
  return parts.length > 0 ? parts.join('   ·   ') : t('pages.seedCreator.pending.profileEmpty')
})

const approvedTitle = computed(() => {
  const rank = me.value?.seedRank
  if (rank == null) return t('pages.seedCreator.approved.titleFallback')
  return t('pages.seedCreator.approved.title', { rank })
})

const displayInviteUrl = computed(() => {
  const url = referral.value?.inviteUrl
  if (!url) return ''
  return url.replace(/^https?:\/\//, '')
})

const invitedCount = computed(() => referral.value?.invitedCount ?? 0)

const registeredCount = computed(() => invitations.value.filter((item) => item.registered).length)

const toppedUpCount = computed(() => invitations.value.filter((item) => item.toppedUp).length)

const rewardStatus = computed<ReferralRewardStatus | null>(
  () => me.value?.referralRewardStatus ?? referral.value?.referralRewardStatus ?? null,
)

const winnerRewardLabel = computed(() => {
  if (rewardStatus.value === 'rewarded') return t('pages.seedCreator.approved.rewardClaimed')
  if (rewardStatus.value === 'expired') return t('pages.seedCreator.approved.rewardExpired')
  return t('pages.seedCreator.approved.rewardWaiting')
})

const winnerRewardTone = computed(() => {
  if (rewardStatus.value === 'rewarded') return 'success'
  if (rewardStatus.value === 'expired') return 'muted'
  return 'warning'
})

const endedSummaryLabel = computed(() => {
  if (!isApproved.value) return null
  const parts: string[] = []
  const rank = me.value?.seedRank
  if (rank != null) {
    parts.push(t('pages.seedCreator.ended.finalRank', { rank }))
  }
  parts.push(t('pages.seedCreator.ended.creatorBonusClaimed'))
  if (rewardStatus.value === 'rewarded') {
    parts.push(t('pages.seedCreator.ended.inviteRewardClaimed'))
  } else if (rewardStatus.value === 'expired') {
    parts.push(t('pages.seedCreator.ended.inviteRewardExpired'))
  } else {
    parts.push(t('pages.seedCreator.ended.inviteRewardWaiting'))
  }
  return parts.join(' · ')
})

const progressStatusLabel = computed(() => {
  if (rewardStatus.value === 'rewarded') return t('pages.seedCreator.approved.rewardClaimed')
  if (rewardStatus.value === 'expired') return t('pages.seedCreator.approved.rewardExpired')
  if (invitations.value.some((item) => item.status === 'qualified' || item.status === 'winner')) {
    return t('pages.seedCreator.approved.progressReviewing')
  }
  return t('pages.seedCreator.approved.rewardWaiting')
})

const progressPercent = computed(() => {
  if (rewardStatus.value === 'rewarded' || invitations.value.some((item) => item.status === 'winner')) {
    return 100
  }
  if (rewardStatus.value === 'expired') return 100
  if (invitations.value.some((item) => item.status === 'qualified')) return 55
  if (registeredCount.value === 0) return 0
  const ratio = toppedUpCount.value / Math.max(registeredCount.value, 1)
  return Math.min(70, Math.round(20 + ratio * 50))
})

function goLogin() {
  push({ name: 'auth', query: { redirect: localePath('/activity/seed-creator') } })
}

function goInvitations() {
  push({ name: 'seed-creator-invitations' })
}

function goHome() {
  push({ name: 'home' })
}

function toggleRules() {
  showRules.value = !showRules.value
}

function fillFormFromMe() {
  twitterUsername.value = me.value?.twitterUsername ?? ''
  twitterUrl.value = me.value?.twitterUrl ?? ''
  discordUsername.value = me.value?.discordUsername ?? ''
  discordUserId.value = me.value?.discordUserId ?? ''
  formConfirmed.value = false
}

function startEditingApplication() {
  fillFormFromMe()
  editingApplication.value = true
}

function cancelEditingApplication() {
  editingApplication.value = false
  formConfirmed.value = false
}

function deferRejection() {
  push({ name: 'home' })
}

async function loadApprovedExtras() {
  const [referralResult, invitationResult] = await Promise.allSettled([
    fetchReferralOverview(),
    fetchReferralInvitations(),
  ])

  referral.value = referralResult.status === 'fulfilled' ? referralResult.value : null
  invitations.value = invitationResult.status === 'fulfilled' ? invitationResult.value : []
}

async function loadPage() {
  loading.value = true
  error.value = null
  noCampaign.value = false
  editingApplication.value = false

  if (!userStore.isLoggedIn) {
    overview.value = null
    loading.value = false
    return
  }

  try {
    const data = await fetchSeedCreatorOverview()
    overview.value = data
    if (data.me?.status === 'rejected' || data.me?.status === 'submitted' || data.me?.status === 'under_review') {
      fillFormFromMe()
    }
    if (data.me?.status === 'approved') {
      await loadApprovedExtras()
    }
  } catch (err) {
    if (isApiError(err) && err.code === 404) {
      noCampaign.value = true
      overview.value = null
    } else {
      error.value = err instanceof Error && err.message ? err.message : t('pages.seedCreator.loadError')
    }
  } finally {
    loading.value = false
  }
}

async function copyInviteLink() {
  const url = referral.value?.inviteUrl
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    message.success(t('pages.seedCreator.approved.copied'))
  } catch {
    message.error(t('pages.seedCreator.approved.copyFailed'))
  }
}

async function handleSubmit() {
  if (isRejected.value) {
    if (!canResubmitRejected.value) return
  } else if (!canSubmitForm.value) {
    return
  }

  submitting.value = true
  try {
    await submitSeedCreatorApplication({
      twitterUsername: twitterUsername.value.trim() || undefined,
      twitterUrl: twitterUrl.value.trim() || undefined,
      discordUsername: discordUsername.value.trim() || undefined,
      discordUserId: discordUserId.value.trim() || undefined,
    })
    message.success(t('pages.seedCreator.submitSuccess'))
    editingApplication.value = false
    await loadPage()
  } catch (err) {
    message.error(
      err instanceof Error && err.message ? err.message : t('pages.seedCreator.submitError'),
    )
  } finally {
    submitting.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <div class="seed-page">
    <div class="seed-page__inner">
      <div v-if="loading" class="seed-page__state">
        <NSpin size="large" />
      </div>

      <template v-else-if="!userStore.isLoggedIn">
        <header class="seed-page__hero">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ t('pages.seedCreator.title') }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.lead') }}</p>
        </header>

        <section class="seed-landing" aria-label="Seed Creator program">
          <div class="seed-landing__panel">
            <div class="seed-landing__bonus">
              <p class="seed-landing__amount">{{ t('pages.seedCreator.landing.bonusAmount') }}</p>
              <p class="seed-landing__label">{{ t('pages.seedCreator.landing.bonusLabel') }}</p>
              <p class="seed-landing__rule">{{ t('pages.seedCreator.landing.bonusRule') }}</p>
            </div>
            <ol class="seed-landing__steps">
              <li v-for="(step, index) in landingSteps" :key="step">
                <span class="seed-landing__step-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="seed-landing__step-text">{{ step }}</span>
              </li>
            </ol>
          </div>

          <div class="seed-landing__actions">
            <button type="button" class="seed-btn" @click="goLogin">
              {{ t('pages.seedCreator.join') }}
            </button>
            <button
              type="button"
              class="seed-btn seed-btn--ghost"
              :aria-expanded="showRules"
              @click="toggleRules"
            >
              {{ t('pages.seedCreator.viewRules') }}
            </button>
          </div>

          <p class="seed-landing__fineprint">{{ t('pages.seedCreator.landing.finePrint') }}</p>

          <section v-if="showRules" class="seed-landing__rules" :aria-label="t('pages.seedCreator.landing.rulesTitle')">
            <h2 class="seed-landing__rules-title">{{ t('pages.seedCreator.landing.rulesTitle') }}</h2>
            <ul>
              <li v-for="rule in landingRules" :key="rule">{{ rule }}</li>
            </ul>
          </section>
        </section>
      </template>

      <div v-else-if="error" class="seed-page__state">
        <p class="seed-page__error">{{ error }}</p>
        <button type="button" class="seed-btn seed-btn--ghost" @click="loadPage">
          {{ t('pages.seedCreator.retry') }}
        </button>
      </div>

      <template v-else-if="noCampaign">
        <header class="seed-page__hero">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.empty.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ t('pages.seedCreator.empty.title') }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.empty.lead') }}</p>
        </header>

        <section class="seed-empty" aria-label="No active campaign">
          <div class="seed-empty__card">
            <div class="seed-empty__icon" aria-hidden="true">—</div>
            <h2 class="seed-empty__title">{{ t('pages.seedCreator.empty.cardTitle') }}</h2>
            <p class="seed-empty__body">{{ t('pages.seedCreator.empty.cardBody') }}</p>
            <button type="button" class="seed-btn seed-btn--ghost seed-btn--empty" @click="goHome">
              {{ t('pages.seedCreator.empty.backHome') }}
            </button>
          </div>
        </section>
      </template>

      <template v-else-if="showEndedStatus">
        <header class="seed-page__hero">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.ended.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ t('pages.seedCreator.ended.title') }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.ended.lead') }}</p>
        </header>

        <section class="seed-ended" aria-label="Campaign ended">
          <div class="seed-ended__card">
            <h2 class="seed-ended__title">{{ t('pages.seedCreator.ended.cardTitle') }}</h2>
            <p v-if="endedSummaryLabel" class="seed-ended__summary">{{ endedSummaryLabel }}</p>

            <div class="seed-ended__divider" />

            <p class="seed-ended__note">{{ t('pages.seedCreator.ended.note') }}</p>
            <button
              v-if="isApproved"
              type="button"
              class="seed-btn seed-btn--ghost seed-btn--ended"
              @click="goInvitations"
            >
              {{ t('pages.seedCreator.ended.viewInvitations') }}
            </button>
          </div>
        </section>
      </template>

      <template v-else-if="isApproved">
        <header class="seed-page__hero seed-page__hero--dashboard">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.approved.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ approvedTitle }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.approved.lead') }}</p>
        </header>

        <section class="seed-dash" aria-label="Seed Creator dashboard">
          <div class="seed-dash__metrics">
            <article class="seed-metric">
              <p class="seed-metric__label">{{ t('pages.seedCreator.approved.rankLabel') }}</p>
              <p class="seed-metric__value seed-metric__value--accent">
                {{
                  me?.seedRank != null
                    ? t('pages.seedCreator.approved.rankValue', { rank: me.seedRank })
                    : '—'
                }}
              </p>
            </article>
            <article class="seed-metric">
              <p class="seed-metric__label">{{ t('pages.seedCreator.approved.bonusLabel') }}</p>
              <p class="seed-metric__value seed-metric__value--success">
                {{ t('pages.seedCreator.approved.bonusClaimed') }}
              </p>
            </article>
            <article class="seed-metric">
              <p class="seed-metric__label">{{ t('pages.seedCreator.approved.invitedLabel') }}</p>
              <p class="seed-metric__value">
                {{ t('pages.seedCreator.approved.invitedCount', { count: invitedCount }) }}
              </p>
            </article>
            <article class="seed-metric">
              <p class="seed-metric__label">{{ t('pages.seedCreator.approved.winnerLabel') }}</p>
              <p class="seed-metric__value" :class="`seed-metric__value--${winnerRewardTone}`">
                {{ winnerRewardLabel }}
              </p>
            </article>
          </div>

          <div v-if="referral" class="seed-invite-bar">
            <div class="seed-invite-bar__text">
              <p class="seed-invite-bar__label">{{ t('pages.seedCreator.approved.inviteLink') }}</p>
              <p class="seed-invite-bar__url">{{ displayInviteUrl }}</p>
            </div>
            <button type="button" class="seed-btn seed-btn--compact" @click="copyInviteLink">
              {{ t('pages.seedCreator.approved.copy') }}
            </button>
          </div>

          <section class="seed-progress" aria-label="Invite progress">
            <h2 class="seed-progress__title">{{ t('pages.seedCreator.approved.progressTitle') }}</h2>
            <div class="seed-progress__track" aria-hidden="true">
              <div class="seed-progress__fill" :style="{ width: `${progressPercent}%` }" />
            </div>
            <p class="seed-progress__summary">
              {{
                t('pages.seedCreator.approved.progressSummary', {
                  registered: registeredCount,
                  toppedUp: toppedUpCount,
                  status: progressStatusLabel,
                })
              }}
            </p>
          </section>

          <button type="button" class="seed-list-btn" @click="goInvitations">
            {{ t('pages.seedCreator.approved.viewInvitations') }}
          </button>
        </section>
      </template>

      <template v-else-if="showPendingStatus">
        <header class="seed-page__hero">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.pending.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ t('pages.seedCreator.pending.title') }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.pending.lead') }}</p>
        </header>

        <section class="seed-pending" aria-label="Application status">
          <div class="seed-pending__card">
            <div class="seed-pending__header">
              <div class="seed-pending__icon" aria-hidden="true">···</div>
              <div class="seed-pending__status">
                <p class="seed-pending__status-label">{{ t('pages.seedCreator.pending.statusLabel') }}</p>
                <p class="seed-pending__submitted">
                  {{
                    submittedAtLabel
                      ? t('pages.seedCreator.pending.submittedAt', { time: submittedAtLabel })
                      : t('pages.seedCreator.pending.submittedAtUnknown')
                  }}
                </p>
              </div>
            </div>

            <div class="seed-pending__divider" />

            <div class="seed-pending__profile">
              <p class="seed-pending__profile-label">{{ t('pages.seedCreator.pending.profileLabel') }}</p>
              <p class="seed-pending__profile-value">{{ submittedProfileLabel }}</p>
            </div>

            <div class="seed-pending__actions">
              <button
                type="button"
                class="seed-btn seed-btn--ghost seed-btn--pending"
                :disabled="isEnded"
                @click="startEditingApplication"
              >
                {{ t('pages.seedCreator.pending.update') }}
              </button>
              <p class="seed-pending__hint">{{ t('pages.seedCreator.pending.updateHint') }}</p>
            </div>
          </div>
        </section>
      </template>

      <template v-else-if="showRejectedStatus">
        <header class="seed-page__hero">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.rejected.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ t('pages.seedCreator.rejected.title') }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.rejected.lead') }}</p>
        </header>

        <section class="seed-rejected" aria-label="Application rejected">
          <div class="seed-rejected__card">
            <h2 class="seed-rejected__title">{{ t('pages.seedCreator.rejected.cardTitle') }}</h2>
            <p class="seed-rejected__reason">{{ rejectReasonLabel }}</p>

            <form class="seed-rejected__form" @submit.prevent="handleSubmit">
              <label class="seed-apply__field">
                <span>{{ t('pages.seedCreator.form.twitterUsername') }}</span>
                <input
                  v-model="twitterUsername"
                  type="text"
                  maxlength="100"
                  autocomplete="off"
                  :disabled="isEnded"
                  :placeholder="t('pages.seedCreator.form.placeholderTwitterUsername')"
                />
              </label>
              <label class="seed-apply__field">
                <span>{{ t('pages.seedCreator.form.twitterUrl') }}</span>
                <input
                  v-model="twitterUrl"
                  type="text"
                  maxlength="500"
                  autocomplete="off"
                  :disabled="isEnded"
                  :placeholder="t('pages.seedCreator.form.placeholderTwitterUrl')"
                />
              </label>
              <div class="seed-apply__row">
                <label class="seed-apply__field">
                  <span>{{ t('pages.seedCreator.form.discordUsername') }}</span>
                  <input
                    v-model="discordUsername"
                    type="text"
                    maxlength="100"
                    autocomplete="off"
                    :disabled="isEnded"
                    :placeholder="t('pages.seedCreator.form.placeholderDiscordUsername')"
                  />
                </label>
                <label class="seed-apply__field">
                  <span>{{ t('pages.seedCreator.form.discordUserId') }}</span>
                  <input
                    v-model="discordUserId"
                    type="text"
                    maxlength="64"
                    autocomplete="off"
                    :disabled="isEnded"
                    :placeholder="t('pages.seedCreator.form.placeholderDiscordUserId')"
                  />
                </label>
              </div>
              <div class="seed-rejected__actions">
                <button type="submit" class="seed-btn seed-btn--reject-primary" :disabled="!canResubmitRejected">
                  {{ t('pages.seedCreator.rejected.resubmit') }}
                </button>
                <button type="button" class="seed-btn seed-btn--ghost seed-btn--reject-secondary" @click="deferRejection">
                  {{ t('pages.seedCreator.rejected.later') }}
                </button>
              </div>
            </form>
          </div>
        </section>
      </template>

      <template v-else>
        <header class="seed-page__hero">
          <p class="seed-page__eyebrow">{{ t('pages.seedCreator.form.eyebrow') }}</p>
          <h1 class="seed-page__title">{{ t('pages.seedCreator.form.title') }}</h1>
          <p class="seed-page__lead">{{ t('pages.seedCreator.form.lead') }}</p>
        </header>

        <section v-if="canSubmit" class="seed-apply" aria-label="Seed Creator application">
          <form class="seed-apply__form" @submit.prevent="handleSubmit">
            <label class="seed-apply__field">
              <span>{{ t('pages.seedCreator.form.twitterUsername') }}</span>
              <input
                v-model="twitterUsername"
                type="text"
                maxlength="100"
                autocomplete="off"
                :placeholder="t('pages.seedCreator.form.placeholderTwitterUsername')"
              />
            </label>
            <label class="seed-apply__field">
              <span>{{ t('pages.seedCreator.form.twitterUrl') }}</span>
              <input
                v-model="twitterUrl"
                type="text"
                maxlength="500"
                autocomplete="off"
                :placeholder="t('pages.seedCreator.form.placeholderTwitterUrl')"
              />
            </label>
            <div class="seed-apply__row">
              <label class="seed-apply__field">
                <span>{{ t('pages.seedCreator.form.discordUsername') }}</span>
                <input
                  v-model="discordUsername"
                  type="text"
                  maxlength="100"
                  autocomplete="off"
                  :placeholder="t('pages.seedCreator.form.placeholderDiscordUsername')"
                />
              </label>
              <label class="seed-apply__field">
                <span>{{ t('pages.seedCreator.form.discordUserId') }}</span>
                <input
                  v-model="discordUserId"
                  type="text"
                  maxlength="64"
                  autocomplete="off"
                  :placeholder="t('pages.seedCreator.form.placeholderDiscordUserId')"
                />
              </label>
            </div>
            <label class="seed-apply__confirm">
              <input v-model="formConfirmed" type="checkbox" />
              <span>{{ t('pages.seedCreator.form.confirm') }}</span>
            </label>
            <button type="submit" class="seed-btn seed-btn--block" :disabled="!canSubmitForm">
              {{
                isPending
                  ? t('pages.seedCreator.form.update')
                  : t('pages.seedCreator.form.submit')
              }}
            </button>
            <button
              v-if="isPending"
              type="button"
              class="seed-btn seed-btn--ghost seed-btn--block"
              @click="cancelEditingApplication"
            >
              {{ t('common.cancel') }}
            </button>
          </form>

          <aside class="seed-apply__aside" :aria-label="t('pages.seedCreator.form.tipsTitle')">
            <h2 class="seed-apply__tips-title">{{ t('pages.seedCreator.form.tipsTitle') }}</h2>
            <ul class="seed-apply__tips">
              <li v-for="tip in formTips" :key="tip">{{ tip }}</li>
            </ul>
          </aside>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.seed-page {
  min-height: calc(100vh - 140px);
}

.seed-page__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--app-header-height) + 32px) 24px 64px;
}

.seed-page__hero {
  margin-bottom: 20px;
}

.seed-page__hero--dashboard {
  margin-bottom: 18px;
  padding-bottom: 20px;
}

.seed-page__eyebrow {
  margin: 0 0 8px;
  color: var(--text-accent);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.seed-page__title {
  margin: 0 0 8px;
  color: #ebf2fa;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.2;
}

.seed-page__lead {
  margin: 0;
  color: #858f9e;
  font-size: 16px;
  line-height: 1.5;
}

.seed-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 240px;
}

.seed-page__error {
  margin: 0;
  color: var(--text-secondary);
}

.seed-landing {
  display: flex;
  flex-direction: column;
  gap: 34px;
  padding-top: 20px;
}

.seed-landing__panel {
  display: grid;
  grid-template-columns: minmax(240px, 348px) minmax(0, 1fr);
  gap: 48px;
  align-items: center;
  min-height: 280px;
  padding: 48px 52px;
  border-radius: 16px;
  background: #0e0e13;
}

.seed-landing__bonus {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seed-landing__amount {
  margin: 0;
  color: #ebf2fa;
  font-size: 64px;
  font-weight: 700;
  line-height: 1.2;
}

.seed-landing__label {
  margin: 0;
  color: var(--text-accent);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.seed-landing__rule {
  margin: 16px 0 0;
  color: #ebf2fa;
  font-size: 15px;
  font-weight: 500;
}

.seed-landing__steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 40px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.seed-landing__steps li {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 70px;
  padding: 0 20px;
  border-radius: 10px;
  background: #13141a;
}

.seed-landing__step-index {
  flex-shrink: 0;
  color: var(--text-accent);
  font-size: 13px;
  font-weight: 600;
}

.seed-landing__step-text {
  color: #ebf2fa;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.seed-landing__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.seed-landing__fineprint {
  margin: -18px 0 0;
  color: #858f9e;
  font-size: 13px;
  line-height: 1.5;
}

.seed-landing__rules {
  padding: 24px;
  border: 1px solid #262933;
  border-radius: 12px;
  background: #13141a;
}

.seed-landing__rules-title {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 16px;
  font-weight: 600;
}

.seed-landing__rules ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0 0 0 18px;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.6;
}

.seed-dash {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.seed-dash__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.seed-metric {
  min-height: 120px;
  padding: 26px 24px;
  border-radius: 14px;
  background: #0e0e13;
}

.seed-metric__label {
  margin: 0 0 18px;
  color: #858f9e;
  font-size: 13px;
  font-weight: 500;
}

.seed-metric__value {
  margin: 0;
  color: #ebf2fa;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

.seed-metric__value--accent {
  color: #06b6d4;
}

.seed-metric__value--success {
  color: #00ba82;
}

.seed-metric__value--warning {
  color: #ff9800;
}

.seed-metric__value--muted {
  color: #858f9e;
}

.seed-invite-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 108px;
  padding: 24px;
  border-radius: 14px;
  background: #0e0e13;
}

.seed-invite-bar__text {
  min-width: 0;
  flex: 1;
}

.seed-invite-bar__label {
  margin: 0 0 10px;
  color: #858f9e;
  font-size: 13px;
  font-weight: 500;
}

.seed-invite-bar__url {
  margin: 0;
  overflow: hidden;
  color: #ebf2fa;
  font-size: 16px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seed-progress__title {
  margin: 0 0 24px;
  color: #ebf2fa;
  font-size: 18px;
  font-weight: 600;
}

.seed-progress__track {
  height: 10px;
  overflow: hidden;
  border-radius: 5px;
  background: #13141a;
}

.seed-progress__fill {
  height: 100%;
  border-radius: 5px;
  background: #06b6d4;
  transition: width 0.3s ease;
}

.seed-progress__summary {
  margin: 18px 0 0;
  color: #858f9e;
  font-size: 13px;
  line-height: 1.5;
}

.seed-banner {
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(6, 182, 212, 0.12);
  color: var(--text-primary);
  font-size: 14px;
}

.seed-banner--warn {
  background: rgba(255, 152, 0, 0.12);
}

.seed-empty {
  display: flex;
  justify-content: center;
  padding-top: 46px;
}

.seed-empty__card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 700px;
  padding: 52px 48px 48px;
  border-radius: 18px;
  background: #0e0e13;
  text-align: center;
}

.seed-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 90px;
  margin-bottom: 38px;
  border-radius: 24px;
  background: #13141a;
  color: #858f9e;
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
}

.seed-empty__title {
  margin: 0 0 12px;
  color: #ebf2fa;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
}

.seed-empty__body {
  margin: 0;
  max-width: 440px;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.5;
}

.seed-btn--empty {
  width: 200px;
  min-width: 200px;
  height: 42px;
  margin-top: 28px;
  font-size: 13px;
}

.seed-ended {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.seed-ended__card {
  box-sizing: border-box;
  width: 100%;
  max-width: 820px;
  padding: 66px 72px 52px;
  border-radius: 18px;
  background: #0e0e13;
}

.seed-ended__title {
  margin: 0;
  color: #ebf2fa;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
}

.seed-ended__summary {
  margin: 12px 0 0;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.seed-ended__divider {
  width: 100%;
  height: 1px;
  margin: 36px 0 32px;
  background: #1f2129;
}

.seed-ended__note {
  margin: 0;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.5;
}

.seed-btn--ended {
  width: 190px;
  min-width: 190px;
  height: 42px;
  margin-top: 28px;
  font-size: 13px;
}

.seed-pending {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.seed-pending__card {
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  padding: 66px 68px 52px;
  border-radius: 18px;
  background: #0e0e13;
}

.seed-pending__header {
  display: flex;
  align-items: center;
  gap: 32px;
}

.seed-pending__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #0a2e33;
  color: #06b6d4;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
}

.seed-pending__status-label {
  margin: 0 0 8px;
  color: #ebf2fa;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}

.seed-pending__submitted {
  margin: 0;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.4;
}

.seed-pending__divider {
  height: 1px;
  margin: 32px 0 28px;
  background: #1f2129;
}

.seed-pending__profile-label {
  margin: 0 0 12px;
  color: #858f9e;
  font-size: 13px;
  font-weight: 500;
}

.seed-pending__profile-value {
  margin: 0;
  color: #ebf2fa;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
}

.seed-pending__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 36px;
}

.seed-pending__hint {
  margin: 0;
  color: #858f9e;
  font-size: 12px;
  line-height: 1.5;
}

.seed-btn--pending {
  width: 180px;
  min-width: 180px;
}

.seed-rejected {
  display: flex;
  justify-content: center;
  padding-top: 26px;
}

.seed-rejected__card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 940px;
  padding: 52px 60px 52px;
  overflow: hidden;
  border-radius: 18px;
  background: #0e0e13;
}

.seed-rejected__card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 8px;
  border-radius: 8px 0 0 8px;
  background: #ff2e58;
}

.seed-rejected__title {
  margin: 0 0 16px;
  color: #ebf2fa;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.seed-rejected__reason {
  margin: 0 0 40px;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.5;
}

.seed-rejected__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.seed-rejected__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}

.seed-btn--reject-primary {
  width: 220px;
  min-width: 220px;
}

.seed-btn--reject-secondary {
  width: 180px;
  min-width: 180px;
}

.seed-apply {
  display: grid;
  grid-template-columns: minmax(0, 760px) minmax(240px, 400px);
  gap: 40px;
  align-items: start;
}

.seed-apply__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 42px 40px 36px;
  border-radius: 16px;
  background: #0e0e13;
}

.seed-apply__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.seed-apply__field {
  display: grid;
  gap: 6px;
  color: #858f9e;
  font-size: 13px;
  font-weight: 500;
}

.seed-apply__field input {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #242630;
  border-radius: 8px;
  background: #13141a;
  color: #ebf2fa;
  font: inherit;
  font-size: 14px;
  outline: none;
}

.seed-apply__field input::placeholder {
  color: #858f9e;
}

.seed-apply__field input:focus {
  border-color: #06b6d4;
}

.seed-apply__confirm {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 6px;
  color: #858f9e;
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
}

.seed-apply__confirm input {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin: 0;
  appearance: none;
  border: 1px solid #333847;
  border-radius: 4px;
  background: #13141a;
  cursor: pointer;
}

.seed-apply__confirm input:checked {
  border-color: #06b6d4;
  background: #06b6d4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%23050d0f' d='M10.1 2.4 4.5 8 1.9 5.4 0.8 6.5 4.5 10.2 11.2 3.5z'/%3E%3C/svg%3E");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 12px;
}

.seed-apply__fineprint {
  margin: -2px 0 0;
  color: #858f9e;
  font-size: 12px;
  line-height: 1.5;
}

.seed-apply__aside {
  padding: 36px 32px;
  border-radius: 16px;
  background: #13141a;
}

.seed-apply__tips-title {
  margin: 0 0 28px;
  color: #ebf2fa;
  font-size: 18px;
  font-weight: 600;
}

.seed-apply__tips {
  display: grid;
  gap: 30px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.seed-apply__tips li {
  position: relative;
  padding-left: 24px;
  color: #858f9e;
  font-size: 14px;
  line-height: 1.4;
}

.seed-apply__tips li::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: #06b6d4;
}

.seed-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
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

.seed-btn--block {
  width: 100%;
  min-width: 0;
  margin-top: 8px;
}

.seed-btn--compact {
  flex-shrink: 0;
  width: 180px;
  min-width: 180px;
  height: 42px;
  font-size: 13px;
}

.seed-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.seed-btn--ghost {
  border: 1px solid #262933;
  background: #13141a;
  color: #ebf2fa;
}

.seed-list-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  box-sizing: border-box;
  width: 200px;
  height: 42px;
  padding: 0 16px;
  border: 1px solid #262933;
  border-radius: 8px;
  background: #13141a;
  color: #ebf2fa;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 1023px) {
  .seed-landing__panel {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 32px 24px;
  }

  .seed-landing__steps {
    gap: 12px;
  }

  .seed-dash__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .seed-apply {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .seed-page__title {
    font-size: 28px;
  }

  .seed-landing__amount {
    font-size: 48px;
  }

  .seed-landing__steps {
    grid-template-columns: 1fr;
  }

  .seed-landing__actions {
    flex-direction: column;
  }

  .seed-btn {
    width: 100%;
    min-width: 0;
  }

  .seed-btn--pending {
    width: 100%;
  }

  .seed-dash__metrics {
    grid-template-columns: 1fr;
  }

  .seed-apply__form {
    padding: 28px 20px 24px;
  }

  .seed-apply__row {
    grid-template-columns: 1fr;
  }

  .seed-apply__aside {
    padding: 28px 24px;
  }

  .seed-pending {
    padding-top: 24px;
  }

  .seed-ended {
    padding-top: 24px;
  }

  .seed-empty {
    padding-top: 24px;
  }

  .seed-empty__card {
    padding: 36px 24px 28px;
  }

  .seed-empty__icon {
    width: 96px;
    height: 72px;
    margin-bottom: 28px;
    font-size: 32px;
  }

  .seed-empty__title {
    font-size: 20px;
  }

  .seed-btn--empty {
    width: 100%;
  }

  .seed-ended__card {
    padding: 36px 24px 28px;
  }

  .seed-ended__title {
    font-size: 22px;
  }

  .seed-ended__divider {
    margin: 28px 0 24px;
  }

  .seed-btn--ended {
    width: 100%;
  }

  .seed-pending__card {
    padding: 36px 24px 28px;
  }

  .seed-pending__header {
    gap: 16px;
  }

  .seed-pending__status-label {
    font-size: 22px;
  }

  .seed-pending__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .seed-rejected {
    padding-top: 16px;
  }

  .seed-rejected__card {
    padding: 36px 24px 28px;
  }

  .seed-rejected__title {
    font-size: 20px;
  }

  .seed-rejected__reason {
    margin-bottom: 28px;
  }

  .seed-rejected__actions {
    flex-direction: column;
  }

  .seed-btn--reject-primary,
  .seed-btn--reject-secondary {
    width: 100%;
    min-width: 0;
  }

  .seed-invite-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .seed-invite-bar__url {
    white-space: normal;
    word-break: break-all;
  }
}
</style>
