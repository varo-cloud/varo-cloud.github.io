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
import type { SeedCreatorCampaign } from '@/types'

type BindPhase = 'guest' | 'binding' | 'error'

const route = useRoute()
const { push, localePath } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const phase = ref<BindPhase>(userStore.isLoggedIn ? 'binding' : 'guest')
const campaign = ref<SeedCreatorCampaign | null>(null)
const loadingCampaign = ref(true)
const errorMessage = ref('')

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

function setBindError(err: unknown, fallbackCode = 'INVITE_NOT_ELIGIBLE') {
  if (isApiError(err) && err.message.trim()) {
    errorMessage.value = err.message.trim()
  } else {
    errorMessage.value = t('pages.invite.errorCode', { code: fallbackCode })
  }
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
  } catch (err) {
    await campaignPromise
    if (isApiError(err) && err.code === 409) {
      clearPendingInviteCode()
      await userStore.loadProfile()
      await goInviteStatus()
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
              <p class="invite-error__code">{{ errorMessage }}</p>
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
