<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { fetchReferralInvitations } from '@/api/activity'
import { isApiError } from '@/api/http'
import { centsToUsd, formatUsd } from '@/utils/currency'
import { formatCountdown } from '@/utils/time'
import type { InvitationStatus, ReferralInvitation } from '@/types'

const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const invitations = ref<ReferralInvitation[]>([])

function statusBadgeClass(status: InvitationStatus) {
  switch (status) {
    case 'winner':
      return 'invite-badge--winner'
    case 'no_reward':
      return 'invite-badge--muted'
    case 'expired':
      return 'invite-badge--expired'
    case 'qualified':
      return 'invite-badge--qualified'
    default:
      return 'invite-badge--waiting'
  }
}

function invitationStatusLabel(status: InvitationStatus) {
  return t(`pages.seedCreator.inviteStatus.${status}`)
}

function registeredLabel(registered: boolean) {
  return registered
    ? t('pages.seedCreator.invitations.yes')
    : t('pages.seedCreator.invitations.no')
}

function topUpLabel(item: ReferralInvitation) {
  if (item.topUpAmountCents != null && item.topUpAmountCents > 0) {
    return formatUsd(centsToUsd(item.topUpAmountCents))
  }
  if (item.toppedUp) return t('pages.seedCreator.invitations.yes')
  return t('pages.seedCreator.invitations.deadlineNone')
}

function deadlineLabel(item: ReferralInvitation) {
  if (item.status === 'winner') return t('pages.seedCreator.invitations.deadlineCompleted')
  if (item.status === 'no_reward') return t('pages.seedCreator.invitations.deadlineNone')
  if (item.status === 'expired') return t('pages.seedCreator.invitations.deadlineEnded')

  const countdown = formatCountdown(item.deadline)
  if (!countdown) return t('pages.seedCreator.invitations.deadlineNone')
  if (countdown.expired) return t('pages.seedCreator.invitations.deadlineEnded')
  if (countdown.days <= 0) {
    return t('pages.seedCreator.invitations.deadlineHoursOnly', { hours: countdown.hours })
  }
  return t('pages.seedCreator.invitations.deadlineLeft', {
    days: countdown.days,
    hours: countdown.hours,
  })
}

async function loadPage() {
  loading.value = true
  error.value = null

  try {
    invitations.value = await fetchReferralInvitations()
  } catch (err) {
    invitations.value = []
    if (isApiError(err) && err.code === 404) {
      invitations.value = []
    } else {
      error.value =
        err instanceof Error && err.message ? err.message : t('pages.seedCreator.invitations.loadError')
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <div class="invite-list-page">
    <div class="invite-list-page__inner">
      <header class="invite-list-page__hero">
        <p class="invite-list-page__eyebrow">{{ t('pages.seedCreator.invitations.eyebrow') }}</p>
        <h1 class="invite-list-page__title">{{ t('pages.seedCreator.invitations.pageTitle') }}</h1>
        <p class="invite-list-page__lead">{{ t('pages.seedCreator.invitations.lead') }}</p>
      </header>

      <div v-if="loading" class="invite-list-page__state">
        <NSpin size="large" />
      </div>

      <div v-else-if="error" class="invite-list-page__state">
        <p class="invite-list-page__error">{{ error }}</p>
        <button type="button" class="invite-list-page__retry" @click="loadPage">
          {{ t('pages.seedCreator.invitations.retry') }}
        </button>
      </div>

      <section v-else class="invite-table" aria-label="Invited users">
        <div class="invite-table__head" role="row">
          <span role="columnheader">{{ t('pages.seedCreator.invitations.user') }}</span>
          <span role="columnheader">{{ t('pages.seedCreator.invitations.registered') }}</span>
          <span role="columnheader">{{ t('pages.seedCreator.invitations.toppedUp') }}</span>
          <span role="columnheader">{{ t('pages.seedCreator.invitations.status') }}</span>
          <span role="columnheader">{{ t('pages.seedCreator.invitations.deadline') }}</span>
        </div>

        <p v-if="invitations.length === 0" class="invite-table__empty">
          {{ t('pages.seedCreator.invitations.empty') }}
        </p>

        <div
          v-for="item in invitations"
          :key="`${item.inviteeMasked}-${item.deadline}-${item.status}`"
          class="invite-table__row"
          role="row"
        >
          <span class="invite-table__user" role="cell">{{ item.inviteeMasked }}</span>
          <span
            class="invite-table__registered"
            :class="{ 'invite-table__registered--yes': item.registered }"
            role="cell"
          >
            {{ registeredLabel(item.registered) }}
          </span>
          <span class="invite-table__topup" role="cell">{{ topUpLabel(item) }}</span>
          <span class="invite-table__status" role="cell">
            <span class="invite-badge" :class="statusBadgeClass(item.status)">
              {{ invitationStatusLabel(item.status) }}
            </span>
          </span>
          <span class="invite-table__deadline" role="cell">{{ deadlineLabel(item) }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.invite-list-page {
  min-height: calc(100vh - 140px);
}

.invite-list-page__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--app-header-height) + 32px) 24px 64px;
}

.invite-list-page__hero {
  margin-bottom: 20px;
  padding-bottom: 20px;
}

.invite-list-page__eyebrow {
  margin: 0 0 8px;
  color: #06b6d4;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.invite-list-page__title {
  margin: 0 0 8px;
  color: #ebf2fa;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
}

.invite-list-page__lead {
  margin: 0;
  color: #858f9e;
  font-size: 15px;
  line-height: 1.5;
}

.invite-list-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 280px;
}

.invite-list-page__error {
  margin: 0;
  color: #858f9e;
}

.invite-list-page__retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 42px;
  border: 1px solid #262933;
  border-radius: 8px;
  background: #13141a;
  color: #ebf2fa;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.invite-table {
  overflow: hidden;
  border-radius: 14px;
  background: #0e0e13;
}

.invite-table__head,
.invite-table__row {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) 0.55fr 0.55fr 1fr 0.9fr;
  gap: 16px;
  align-items: center;
  padding: 0 30px;
}

.invite-table__head {
  height: 54px;
  background: #13141a;
  color: #858f9e;
  font-size: 13px;
  font-weight: 500;
}

.invite-table__row {
  min-height: 76px;
  border-top: 1px solid #1f2129;
  color: #ebf2fa;
  font-size: 14px;
}

.invite-table__empty {
  margin: 0;
  padding: 48px 30px;
  color: #858f9e;
  font-size: 14px;
  text-align: center;
}

.invite-table__user {
  font-weight: 500;
}

.invite-table__registered {
  color: #858f9e;
}

.invite-table__registered--yes {
  color: #00ba82;
}

.invite-table__topup {
  color: #ebf2fa;
}

.invite-table__deadline {
  color: #858f9e;
}

.invite-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 116px;
  height: 32px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.invite-badge--waiting {
  background: #261700;
  color: #ff9800;
}

.invite-badge--qualified {
  background: #001a1f;
  color: #06b6d4;
}

.invite-badge--winner {
  background: #001c14;
  color: #00ba82;
}

.invite-badge--muted {
  background: #141518;
  color: #858f9e;
}

.invite-badge--expired {
  background: #26070d;
  color: #ff2e58;
}

@media (max-width: 767px) {
  .invite-list-page__title {
    font-size: 28px;
  }

  .invite-table {
    overflow-x: auto;
  }

  .invite-table__head,
  .invite-table__row {
    min-width: 720px;
  }
}
</style>
