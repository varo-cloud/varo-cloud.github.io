<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { isApiError } from '@/api/http'
import { bindReferralCode } from '@/api/activity'
import { fetchWalletBonus } from '@/api/billing'
import {
  clearPendingInviteCode,
  readPendingInviteCode,
  savePendingInviteCode,
} from '@/utils/pendingInvite'
import { centsToUsd, formatUsd } from '@/utils/currency'
import type { BonusGrant } from '@/types'

type InvitePhase = 'guest' | 'binding' | 'waiting' | 'winner' | 'error'

const route = useRoute()
const { push, localePath } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const phase = ref<InvitePhase>('binding')
const errorMessage = ref('')
const inviteeBonus = ref<BonusGrant | null>(null)

const code = computed(() => {
  const fromRoute = typeof route.params.code === 'string' ? route.params.code.trim() : ''
  return fromRoute || readPendingInviteCode() || ''
})

const steps = computed(() => [
  t('pages.invite.steps.register'),
  t('pages.invite.steps.requirements'),
  t('pages.invite.steps.topup'),
])

function goLogin() {
  const target = code.value
    ? localePath(`/invite/${encodeURIComponent(code.value)}`)
    : localePath('/activity/seed-creator')
  push({ name: 'auth', query: { redirect: target } })
}

function goActivity() {
  push({ name: 'seed-creator' })
}

function goBilling() {
  push({ name: 'billing' })
}

async function detectWinner() {
  try {
    const wallet = await fetchWalletBonus()
    const grant =
      wallet.grants.find((item) => item.source === 'invitee_reward' && item.status === 'active') ??
      wallet.grants.find((item) => item.source === 'invitee_reward') ??
      null
    inviteeBonus.value = grant
    if (grant) phase.value = 'winner'
  } catch {
    // Wallet is optional for the waiting state.
  }
}

async function bindCode() {
  const inviteCode = code.value
  if (!inviteCode) {
    phase.value = 'error'
    errorMessage.value = t('pages.invite.invalid')
    return
  }

  savePendingInviteCode(inviteCode)

  if (!userStore.isLoggedIn) {
    phase.value = 'guest'
    return
  }

  phase.value = 'binding'
  errorMessage.value = ''

  try {
    await bindReferralCode(inviteCode)
    clearPendingInviteCode()
    phase.value = 'waiting'
    await detectWinner()
  } catch (err) {
    if (isApiError(err) && err.code === 409) {
      clearPendingInviteCode()
      phase.value = 'waiting'
      await detectWinner()
      return
    }

    errorMessage.value =
      err instanceof Error && err.message ? err.message : t('pages.invite.bindError')
    phase.value = 'error'
  }
}

onMounted(bindCode)
</script>

<template>
  <div class="invite-page">
    <div class="invite-page__inner">
      <p class="invite-page__eyebrow">{{ t('pages.invite.eyebrow') }}</p>
      <h1 class="invite-page__title">{{ t('pages.invite.title') }}</h1>
      <p class="invite-page__lead">{{ t('pages.invite.lead') }}</p>

      <ol class="invite-steps">
        <li v-for="(step, index) in steps" :key="step">
          <span>{{ index + 1 }}</span>
          {{ step }}
        </li>
      </ol>

      <section class="invite-card">
        <div v-if="phase === 'binding'" class="invite-card__state">
          <NSpin size="large" />
          <p>{{ t('pages.invite.binding') }}</p>
        </div>

        <template v-else-if="phase === 'guest'">
          <p>{{ t('pages.invite.loginToJoin') }}</p>
          <button type="button" class="invite-btn" @click="goLogin">
            {{ t('pages.invite.login') }}
          </button>
        </template>

        <template v-else-if="phase === 'winner'">
          <h2>{{ t('pages.invite.winnerTitle') }}</h2>
          <p>{{ t('pages.invite.winnerBody') }}</p>
          <p class="invite-card__bonus">
            {{
              t('pages.invite.winnerBonus', {
                amount: formatUsd(centsToUsd(inviteeBonus?.amountCents ?? 1000)),
              })
            }}
          </p>
          <p class="invite-card__hint">{{ t('pages.invite.inviterAlso') }}</p>
          <button type="button" class="invite-btn" @click="goBilling">
            {{ t('pages.invite.viewBonus') }}
          </button>
        </template>

        <template v-else-if="phase === 'waiting'">
          <h2>{{ t('pages.invite.waitingTitle') }}</h2>
          <p>{{ t('pages.invite.waitingBody') }}</p>
          <p class="invite-card__hint">{{ t('pages.invite.waitingHint') }}</p>
          <div class="invite-card__actions">
            <button type="button" class="invite-btn" @click="goBilling">
              {{ t('pages.invite.goTopup') }}
            </button>
            <button type="button" class="invite-btn invite-btn--ghost" @click="goActivity">
              {{ t('pages.invite.goActivity') }}
            </button>
          </div>
        </template>

        <template v-else>
          <h2>{{ t('pages.invite.errorTitle') }}</h2>
          <p>{{ errorMessage || t('pages.invite.bindError') }}</p>
          <button type="button" class="invite-btn invite-btn--ghost" @click="goActivity">
            {{ t('pages.invite.goActivity') }}
          </button>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: calc(100vh - 140px);
}

.invite-page__inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 105px 24px 64px;
}

.invite-page__eyebrow {
  margin: 0 0 12px;
  color: var(--text-accent);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.invite-page__title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 600;
}

.invite-page__lead {
  margin: 0 0 24px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.invite-steps {
  display: grid;
  gap: 10px;
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
  color: var(--text-secondary);
  font-size: 14px;
}

.invite-steps li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.invite-steps span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-hover);
  color: var(--text-primary);
  font-size: 12px;
}

.invite-card {
  padding: 28px 24px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-card);
}

.invite-card h2 {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 500;
}

.invite-card p {
  margin: 0 0 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.invite-card__bonus {
  color: var(--text-primary) !important;
  font-size: 28px;
  font-weight: 600;
}

.invite-card__hint {
  font-size: 13px;
}

.invite-card__state,
.invite-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.invite-card__state {
  align-items: center;
}

.invite-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--text-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.invite-btn--ghost {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
}
</style>
