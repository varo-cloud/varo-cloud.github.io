<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { exchangeOAuthCode } from '@/api/auth'
import { AnalyticsEvents, setAnalyticsUserId, trackEvent } from '@/analytics'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { setLastAuthMethod } from '@/utils/lastAuthMethod'
import { clearOAuthPending, readOAuthPending } from '@/utils/oauth'

const route = useRoute()
const { replace, localePath } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const status = ref<'loading' | 'error'>('loading')
const error = ref<string | null>(null)

function queryString(key: string): string | null {
  const value = route.query[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

onMounted(async () => {
  const oauthError = queryString('error')
  const errorDescription = queryString('error_description')
  if (oauthError) {
    clearOAuthPending()
    status.value = 'error'
    error.value = errorDescription || t('pages.auth.oauthError')
    return
  }

  const code = queryString('code')
  const state = queryString('state')
  const pending = readOAuthPending()

  if (!code || !state || !pending || pending.state !== state) {
    clearOAuthPending()
    status.value = 'error'
    error.value = t('pages.auth.oauthInvalidCallback')
    return
  }

  try {
    const tokens = await exchangeOAuthCode({ code })
    setLastAuthMethod(pending.provider)
    userStore.establishSession(tokens)
    await userStore.loadProfile()
    if (userStore.profile?.id) {
      setAnalyticsUserId(userStore.profile.id)
    }
    trackEvent(AnalyticsEvents.LOGIN_COMPLETE, { method: pending.provider })

    const returnTo = pending.returnTo
    clearOAuthPending()
    replace(returnTo || { name: 'models' })
  } catch (err) {
    clearOAuthPending()
    status.value = 'error'
    error.value = err instanceof Error && err.message ? err.message : t('pages.auth.oauthError')
  }
})
</script>

<template>
  <div class="auth-callback">
    <AppHeader />

    <main class="auth-callback__main">
      <div class="auth-callback__card">
        <template v-if="status === 'loading'">
          <p class="auth-callback__title">{{ t('pages.auth.oauthCompleting') }}</p>
          <p class="auth-callback__hint">{{ t('pages.auth.oauthCompletingHint') }}</p>
        </template>
        <template v-else>
          <p class="auth-callback__title">{{ t('pages.auth.oauthFailed') }}</p>
          <p class="auth-callback__error">{{ error }}</p>
          <RouterLink class="auth-callback__back" :to="localePath('/auth')">
            {{ t('pages.auth.oauthBackToLogin') }}
          </RouterLink>
        </template>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.auth-callback {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0a0a0e;
  color: #ebf4fb;
}

.auth-callback__main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 16px 64px;
}

.auth-callback__card {
  width: 100%;
  max-width: 420px;
  padding: 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #13131c;
  text-align: center;
}

.auth-callback__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
  color: #ebf4fb;
}

.auth-callback__hint {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #808080;
}

.auth-callback__error {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #f87171;
}

.auth-callback__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  background: #06b6d4;
  color: #ebf4fb;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.auth-callback__back:hover {
  opacity: 0.9;
}
</style>
