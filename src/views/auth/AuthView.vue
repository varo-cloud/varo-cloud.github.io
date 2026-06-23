<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useMessage } from 'naive-ui'
import { requestOtp, verifyOtp } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { assetUrl } from '@/utils/assetUrl'

const route = useRoute()
const { push, replace, localePath } = useLocaleRouter()
const { t } = useI18n()
const message = useMessage()
const userStore = useUserStore()

const email = ref('')
const otpCode = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const resendCooldown = ref(0)

let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCooldown(seconds = 60) {
  resendCooldown.value = seconds
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldown.value -= 1
    if (resendCooldown.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

function closeAuth() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  push({ name: 'models' })
}

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

async function handleRequestOtp() {
  const value = email.value.trim()
  if (!value) {
    error.value = t('pages.auth.emailRequired')
    return
  }

  loading.value = true
  error.value = null

  try {
    await requestOtp({ email: value })
    otpCode.value = ''
    startResendCooldown()
    message.success(t('pages.auth.otpSent'))
  } catch (err) {
    error.value = resolveErrorMessage(err, t('pages.auth.otpRequestError'))
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  const value = email.value.trim()
  const code = otpCode.value.trim()

  if (!value) {
    error.value = t('pages.auth.emailRequired')
    return
  }

  if (!code) {
    error.value = t('pages.auth.codeRequired')
    return
  }

  if (code.length !== 6) {
    error.value = t('pages.auth.codeInvalid')
    return
  }

  loading.value = true
  error.value = null

  try {
    const tokens = await verifyOtp({ email: value, code })
    userStore.establishSession(tokens)
    await userStore.loadProfile()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    push(redirect || { name: 'models' })
  } catch (err) {
    error.value = resolveErrorMessage(err, t('pages.auth.verifyError'))
  } finally {
    loading.value = false
  }
}

function handleGoogleLogin() {
  message.info(t('pages.auth.googleComingSoon'))
}

function handleGithubLogin() {
  message.info(t('pages.auth.githubComingSoon'))
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    replace(redirect || { name: 'models' })
  }
})

onUnmounted(() => {
  if (resendTimer) clearInterval(resendTimer)
})
</script>

<template>
  <div class="auth-page">
    <AppHeader />

    <main class="auth-page__main">
      <div class="auth-card">
        <div class="auth-card__header">
          <h1 class="auth-card__title">{{ t('pages.auth.welcome') }}</h1>
          <button
            type="button"
            class="auth-card__close"
            :aria-label="t('common.close')"
            @click="closeAuth"
          >
            <AppIcon name="close" :size="20" />
          </button>
        </div>

        <form class="auth-card__form" @submit.prevent="handleLogin">
          <label class="auth-field" :class="{ 'auth-field--error': error }">
            <span class="auth-field__label">{{ t('pages.auth.emailLabel') }}</span>
            <input
              v-model="email"
              type="email"
              class="auth-field__input auth-field__input--email"
              :placeholder="t('pages.auth.emailPlaceholder')"
              autocomplete="email"
              :disabled="loading"
              @input="error = null"
            />
          </label>

          <label class="auth-field" :class="{ 'auth-field--error': error }">
            <span class="auth-field__label">{{ t('pages.auth.codeLabel') }}</span>
            <div class="auth-field__input-wrap">
              <input
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                class="auth-field__input auth-field__input--code"
                :placeholder="t('pages.auth.codePlaceholder')"
                autocomplete="one-time-code"
                :disabled="loading"
                @input="error = null"
              />
              <button
                type="button"
                class="auth-field__get-code"
                :disabled="loading || resendCooldown > 0"
                @click="handleRequestOtp"
              >
                {{
                  resendCooldown > 0
                    ? t('pages.auth.resendIn', { seconds: resendCooldown })
                    : t('pages.auth.getCodeButton')
                }}
              </button>
            </div>
          </label>

          <p v-if="error" class="auth-field__error auth-field__error--standalone">{{ error }}</p>

          <button type="submit" class="auth-card__submit" :disabled="loading">
            {{ t('pages.auth.loginButton') }}
          </button>

          <div class="auth-card__divider" aria-hidden="true">
            <span class="auth-card__divider-line" />
            <span class="auth-card__divider-text">{{ t('pages.auth.or') }}</span>
            <span class="auth-card__divider-line" />
          </div>

          <div class="auth-card__social-wrap">
            <span class="auth-card__last-used">{{ t('pages.auth.lastUsed') }}</span>
            <button
              type="button"
              class="auth-card__social auth-card__social--google"
              :disabled="loading"
              @click="handleGoogleLogin"
            >
              <img
                :src="assetUrl('/assets/icons/google.svg')"
                alt=""
                aria-hidden="true"
                class="auth-card__social-icon"
              />
              <span>{{ t('pages.auth.googleLogin') }}</span>
            </button>
          </div>

          <button
            type="button"
            class="auth-card__social auth-card__social--github"
            :disabled="loading"
            @click="handleGithubLogin"
          >
            <img
              :src="assetUrl('/assets/icons/github.svg')"
              alt=""
              aria-hidden="true"
              class="auth-card__social-icon"
            />
            <span>{{ t('pages.auth.githubLogin') }}</span>
          </button>

          <p class="auth-card__terms">
            {{ t('pages.auth.termsPrefix') }}
            <RouterLink :to="localePath('/terms')">{{ t('footer.terms') }}</RouterLink>
            {{ t('pages.auth.termsAnd') }}
            <RouterLink :to="localePath('/privacy')">{{ t('footer.privacy') }}</RouterLink>.
          </p>
        </form>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0a0a0e;
  color: #ebf4fb;
}

.auth-page__main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 16px 64px;
}

.auth-card {
  width: 100%;
  max-width: 510px;
  padding: 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #13131c;
}

.auth-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.auth-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.408px;
  color: #ebf4fb;
}

.auth-card__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin: -4px -4px 0 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #9b9dab;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.auth-card__close:hover {
  color: #ebf4fb;
  background: rgba(255, 255, 255, 0.06);
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-field__label {
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: -0.408px;
  color: #ebf4fb;
}

.auth-field__input-wrap {
  position: relative;
}

.auth-field__input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
  font-size: 14px;
  line-height: 1;
  letter-spacing: -0.408px;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.auth-field__input--email {
  border-color: #06b6d4;
}

.auth-field__input--code {
  padding-right: 108px;
}

.auth-field__input::placeholder {
  color: #808080;
}

.auth-field__input:focus {
  border-color: #06b6d4;
}

.auth-field__input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-field--error .auth-field__input {
  border-color: #f87171;
}

.auth-field__get-code {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  padding: 0;
  border: none;
  background: transparent;
  color: #06b6d4;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.auth-field__get-code:hover:not(:disabled) {
  opacity: 0.85;
}

.auth-field__get-code:disabled {
  color: #808080;
  cursor: not-allowed;
}

.auth-field__error {
  margin: 0;
  font-size: 12px;
  line-height: 1.2;
  color: #f87171;
}

.auth-field__error--standalone {
  margin-top: -12px;
}

.auth-card__submit {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #06b6d4;
  color: #ebf4fb;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.auth-card__submit:hover:not(:disabled) {
  opacity: 0.9;
}

.auth-card__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-card__divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-card__divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.auth-card__divider-text {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1;
  color: #808080;
}

.auth-card__social-wrap {
  position: relative;
}

.auth-card__last-used {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px 0 8px 0;
  background: #06b6d4;
  color: #ebf4fb;
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.auth-card__social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.auth-card__social--google {
  border: 1px solid #06b6d4;
  background: rgba(22, 218, 235, 0.1);
  color: #e0e0e0;
}

.auth-card__social--google:hover:not(:disabled) {
  background: rgba(22, 218, 235, 0.16);
}

.auth-card__social--github {
  border: 1px solid #9b9dab;
  background: transparent;
  color: #e0e0e0;
}

.auth-card__social--github:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
}

.auth-card__social:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-card__social-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.auth-card__terms {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: #808080;
}

.auth-card__terms a {
  color: #ebf4fb;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.auth-card__terms a:hover {
  opacity: 0.85;
}

@media (max-width: 767px) {
  .auth-page__main {
    padding: 24px 12px 48px;
  }

  .auth-card {
    padding: 24px 20px;
  }

  .auth-card__title {
    font-size: 20px;
  }

  .auth-field__input--code {
    padding-right: 96px;
  }

  .auth-field__get-code {
    font-size: 13px;
  }
}
</style>
