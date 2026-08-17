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
import { fetchWalletBonus } from '@/api/billing'
import { centsToUsd, formatUsd } from '@/utils/currency'
import { formatCountdown, formatTimestamp, parseTimestampMs } from '@/utils/time'
import type {
  BonusGrant,
  InvitationStatus,
  ReferralInvitation,
  ReferralOverview,
  SeedCreatorMe,
  SeedCreatorOverview,
} from '@/types'

const { t, locale, tm } = useI18n()
const { push, localePath } = useLocaleRouter()
const message = useAppMessage()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const noCampaign = ref(false)
const showRules = ref(false)

const overview = ref<SeedCreatorOverview | null>(null)
const referral = ref<ReferralOverview | null>(null)
const invitations = ref<ReferralInvitation[]>([])
const bonusGrants = ref<BonusGrant[]>([])
const totalBonusCents = ref(0)

const twitterUsername = ref('')
const twitterUrl = ref('')
const discordUsername = ref('')
const discordUserId = ref('')

const campaign = computed(() => overview.value?.campaign ?? null)
const me = computed<SeedCreatorMe | null>(() => overview.value?.me ?? null)
const isEnded = computed(() => campaign.value?.state === 'ended')
const isApproved = computed(() => me.value?.status === 'approved')
const isPending = computed(
  () => me.value?.status === 'submitted' || me.value?.status === 'under_review',
)
const isRejected = computed(() => me.value?.status === 'rejected')
const canSubmit = computed(() => {
  if (!userStore.isLoggedIn || isEnded.value || isApproved.value) return false
  return !me.value || me.value.status === 'rejected' || isPending.value
})

const remainingSpots = computed(() => {
  if (!campaign.value) return null
  return Math.max(0, campaign.value.seedCap - campaign.value.seedApproved)
})

const endsAtLabel = computed(() => {
  const ms = parseTimestampMs(campaign.value?.endsAt)
  if (ms == null) return null
  return formatTimestamp(ms, locale.value, 'datetime')
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

const steps = computed(() => [
  t('pages.seedCreator.steps.register'),
  t('pages.seedCreator.steps.social'),
  t('pages.seedCreator.steps.review'),
  t('pages.seedCreator.steps.bonus'),
  t('pages.seedCreator.steps.invite'),
  t('pages.seedCreator.steps.winner'),
])

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

function invitationStatusLabel(status: InvitationStatus) {
  return t(`pages.seedCreator.inviteStatus.${status}`)
}

function bonusSourceLabel(source: BonusGrant['source']) {
  return t(`pages.seedCreator.bonus.source.${source}`)
}

function bonusStatusLabel(status: BonusGrant['status']) {
  return t(`pages.seedCreator.bonus.lotStatus.${status}`)
}

function deadlineLabel(deadline: string | null) {
  const countdown = formatCountdown(deadline)
  if (!countdown) return '—'
  if (countdown.expired) return t('pages.seedCreator.invitations.deadlinePassed')
  return t('pages.seedCreator.invitations.deadlineLeft', {
    days: countdown.days,
    hours: countdown.hours,
  })
}

function grantExpiryLabel(expiresAt: string | null) {
  const countdown = formatCountdown(expiresAt)
  if (!countdown) return '—'
  if (countdown.expired) return t('pages.seedCreator.bonus.expired')
  return t('pages.seedCreator.bonus.expiresIn', {
    days: countdown.days,
    hours: countdown.hours,
  })
}

function goLogin() {
  push({ name: 'auth', query: { redirect: localePath('/activity/seed-creator') } })
}

function goBilling() {
  push({ name: 'billing' })
}

function toggleRules() {
  showRules.value = !showRules.value
}

async function loadApprovedExtras() {
  const [referralResult, invitationResult, bonusResult] = await Promise.allSettled([
    fetchReferralOverview(),
    fetchReferralInvitations(),
    fetchWalletBonus(),
  ])

  referral.value = referralResult.status === 'fulfilled' ? referralResult.value : null
  invitations.value = invitationResult.status === 'fulfilled' ? invitationResult.value : []

  if (bonusResult.status === 'fulfilled') {
    bonusGrants.value = bonusResult.value.grants
    totalBonusCents.value = bonusResult.value.totalBonusCents
  }
}

async function loadPage() {
  loading.value = true
  error.value = null
  noCampaign.value = false

  if (!userStore.isLoggedIn) {
    overview.value = null
    loading.value = false
    return
  }

  try {
    const data = await fetchSeedCreatorOverview()
    overview.value = data
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
  if (!canSubmit.value || submitting.value || !formFilled.value) return

  submitting.value = true
  try {
    await submitSeedCreatorApplication({
      twitterUsername: twitterUsername.value.trim() || undefined,
      twitterUrl: twitterUrl.value.trim() || undefined,
      discordUsername: discordUsername.value.trim() || undefined,
      discordUserId: discordUserId.value.trim() || undefined,
    })
    message.success(t('pages.seedCreator.submitSuccess'))
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
      <header class="seed-page__hero">
        <p class="seed-page__eyebrow">{{ t('pages.seedCreator.eyebrow') }}</p>
        <h1 class="seed-page__title">{{ t('pages.seedCreator.title') }}</h1>
        <p class="seed-page__lead">{{ t('pages.seedCreator.lead') }}</p>
      </header>

      <div v-if="loading" class="seed-page__state">
        <NSpin size="large" />
      </div>

      <template v-else-if="!userStore.isLoggedIn">
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

      <div v-else-if="noCampaign" class="seed-card seed-card--center">
        <h2>{{ t('pages.seedCreator.status.noCampaign') }}</h2>
        <p>{{ t('pages.seedCreator.status.noCampaignHint') }}</p>
      </div>

      <template v-else>
        <section v-if="campaign" class="seed-meta" aria-label="Campaign stats">
          <article class="seed-meta__item">
            <p class="seed-meta__label">{{ t('pages.seedCreator.campaign.spots') }}</p>
            <p class="seed-meta__value">{{ campaign.seedApproved }} / {{ campaign.seedCap }}</p>
          </article>
          <article class="seed-meta__item">
            <p class="seed-meta__label">{{ t('pages.seedCreator.campaign.remaining') }}</p>
            <p class="seed-meta__value">{{ remainingSpots }}</p>
          </article>
          <article class="seed-meta__item">
            <p class="seed-meta__label">{{ t('pages.seedCreator.campaign.endsAt') }}</p>
            <p class="seed-meta__value">{{ endsAtLabel || '—' }}</p>
          </article>
        </section>

        <ol class="seed-steps">
          <li v-for="(step, index) in steps" :key="step">
            <span class="seed-steps__index">{{ index + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>

        <div v-if="isEnded" class="seed-banner">
          {{ t('pages.seedCreator.status.ended') }}
        </div>

        <section v-if="isApproved && referral" class="seed-card">
          <h2 class="seed-card__title">{{ t('pages.seedCreator.approved.title') }}</h2>
          <p v-if="me?.seedRank" class="seed-card__rank">
            {{ t('pages.seedCreator.approved.rank', { rank: me.seedRank }) }}
          </p>
          <p class="seed-card__bonus">{{ t('pages.seedCreator.approved.seedBonus') }}</p>
          <p class="seed-card__reward">
            {{
              me?.referralRewardStatus === 'rewarded'
                ? t('pages.seedCreator.approved.rewardClaimed')
                : me?.referralRewardStatus === 'expired'
                  ? t('pages.seedCreator.approved.rewardExpired')
                  : t('pages.seedCreator.approved.rewardWaiting')
            }}
          </p>

          <div class="seed-invite">
            <p class="seed-invite__label">{{ t('pages.seedCreator.approved.inviteLink') }}</p>
            <div class="seed-invite__row">
              <code class="seed-invite__url">{{ referral.inviteUrl }}</code>
              <button type="button" class="seed-btn" @click="copyInviteLink">
                {{ t('pages.seedCreator.approved.copy') }}
              </button>
            </div>
            <p class="seed-invite__count">
              {{ t('pages.seedCreator.approved.inviteCount', { count: referral.invitedCount }) }}
            </p>
          </div>
        </section>

        <section v-if="isApproved" class="seed-card">
          <h2 class="seed-card__title">{{ t('pages.seedCreator.invitations.title') }}</h2>
          <p v-if="invitations.length === 0" class="seed-card__empty">
            {{ t('pages.seedCreator.invitations.empty') }}
          </p>
          <div v-else class="seed-table" role="table">
            <div class="seed-table__header" role="row">
              <span role="columnheader">{{ t('pages.seedCreator.invitations.user') }}</span>
              <span role="columnheader">{{ t('pages.seedCreator.invitations.registered') }}</span>
              <span role="columnheader">{{ t('pages.seedCreator.invitations.toppedUp') }}</span>
              <span role="columnheader">{{ t('pages.seedCreator.invitations.status') }}</span>
              <span role="columnheader">{{ t('pages.seedCreator.invitations.deadline') }}</span>
            </div>
            <div
              v-for="item in invitations"
              :key="`${item.inviteeMasked}-${item.deadline}`"
              class="seed-table__row"
              role="row"
            >
              <span role="cell">{{ item.inviteeMasked }}</span>
              <span role="cell">{{
                item.registered
                  ? t('pages.seedCreator.invitations.yes')
                  : t('pages.seedCreator.invitations.no')
              }}</span>
              <span role="cell">{{
                item.toppedUp
                  ? t('pages.seedCreator.invitations.yes')
                  : t('pages.seedCreator.invitations.no')
              }}</span>
              <span role="cell">{{ invitationStatusLabel(item.status) }}</span>
              <span role="cell">{{ deadlineLabel(item.deadline) }}</span>
            </div>
          </div>
        </section>

        <section v-if="isApproved" class="seed-card">
          <div class="seed-card__header-row">
            <h2 class="seed-card__title">{{ t('pages.seedCreator.bonus.title') }}</h2>
            <p class="seed-card__bonus">{{ formatUsd(centsToUsd(totalBonusCents)) }}</p>
          </div>
          <p class="seed-card__hint">{{ t('pages.seedCreator.bonus.hint') }}</p>
          <p v-if="bonusGrants.length === 0" class="seed-card__empty">
            {{ t('pages.seedCreator.bonus.empty') }}
          </p>
          <ul v-else class="seed-grants">
            <li v-for="(grant, index) in bonusGrants" :key="`${grant.source}-${index}`">
              <div>
                <p class="seed-grants__amount">{{ formatUsd(centsToUsd(grant.remainingCents)) }}</p>
                <p class="seed-grants__source">{{ bonusSourceLabel(grant.source) }}</p>
              </div>
              <div class="seed-grants__meta">
                <span>{{ bonusStatusLabel(grant.status) }}</span>
                <span>{{ grantExpiryLabel(grant.expiresAt) }}</span>
              </div>
            </li>
          </ul>
          <button type="button" class="seed-btn seed-btn--ghost" @click="goBilling">
            {{ t('pages.seedCreator.bonus.goBilling') }}
          </button>
        </section>

        <div v-if="isPending" class="seed-banner">{{ t('pages.seedCreator.status.submitted') }}</div>
        <div v-else-if="isRejected" class="seed-banner seed-banner--warn">
          {{ t('pages.seedCreator.status.rejected') }}
        </div>

        <section v-if="canSubmit && !isEnded" class="seed-card">
          <h2 class="seed-card__title">
            {{
              isPending
                ? t('pages.seedCreator.form.updateTitle')
                : t('pages.seedCreator.form.title')
            }}
          </h2>
          <p class="seed-card__hint">{{ t('pages.seedCreator.form.hint') }}</p>
          <form class="seed-form" @submit.prevent="handleSubmit">
            <label>
              <span>{{ t('pages.seedCreator.form.twitterUsername') }}</span>
              <input v-model="twitterUsername" type="text" maxlength="100" autocomplete="off" />
            </label>
            <label>
              <span>{{ t('pages.seedCreator.form.twitterUrl') }}</span>
              <input v-model="twitterUrl" type="text" maxlength="500" autocomplete="off" />
            </label>
            <label>
              <span>{{ t('pages.seedCreator.form.discordUsername') }}</span>
              <input v-model="discordUsername" type="text" maxlength="100" autocomplete="off" />
            </label>
            <label>
              <span>{{ t('pages.seedCreator.form.discordUserId') }}</span>
              <input v-model="discordUserId" type="text" maxlength="64" autocomplete="off" />
            </label>
            <button type="submit" class="seed-btn" :disabled="submitting || !formFilled">
              {{
                isPending
                  ? t('pages.seedCreator.form.update')
                  : t('pages.seedCreator.form.submit')
              }}
            </button>
          </form>
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

.seed-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.seed-meta__item,
.seed-card {
  padding: 20px 24px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-card);
}

.seed-meta__label {
  margin: 0 0 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.seed-meta__value {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.seed-steps {
  display: grid;
  gap: 10px;
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
}

.seed-steps li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.seed-steps__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-hover);
  color: var(--text-primary);
  font-size: 12px;
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

.seed-card {
  margin-bottom: 20px;
}

.seed-card--center {
  text-align: center;
}

.seed-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 500;
}

.seed-card__rank,
.seed-card__reward,
.seed-card__hint,
.seed-card__empty {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.seed-card__bonus {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.seed-card__header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.seed-invite__label {
  margin: 16px 0 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.seed-invite__row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.seed-invite__url {
  flex: 1;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-hover);
  font-size: 13px;
}

.seed-invite__count {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.seed-table {
  overflow-x: auto;
}

.seed-table__header,
.seed-table__row {
  display: grid;
  grid-template-columns: 1.2fr 0.7fr 0.7fr 1fr 1.2fr;
  gap: 12px;
  padding: 12px 0;
  font-size: 13px;
}

.seed-table__header {
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.seed-table__row {
  border-bottom: 1px solid var(--border-color);
}

.seed-grants {
  display: grid;
  gap: 12px;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.seed-grants li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.seed-grants__amount {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.seed-grants__source,
.seed-grants__meta {
  color: var(--text-secondary);
  font-size: 13px;
}

.seed-grants__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.seed-form {
  display: grid;
  gap: 14px;
}

.seed-form label {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.seed-form input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
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

.seed-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.seed-btn--ghost {
  border: 1px solid #262933;
  background: #13141a;
  color: #ebf2fa;
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

  .seed-meta,
  .seed-table__header,
  .seed-table__row,
  .seed-invite__row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .seed-invite__row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
