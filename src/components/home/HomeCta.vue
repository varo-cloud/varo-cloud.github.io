<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'

const SUPPORT_MAILTO = 'mailto:support@varo.cloud'

const { t } = useI18n()
const { push } = useLocaleRouter()
const userStore = useUserStore()

function getStarted() {
  push({ name: userStore.isLoggedIn ? 'models' : 'auth' })
}
</script>

<template>
  <section class="home-cta" aria-labelledby="home-cta-title">
    <div class="home-cta__inner">
      <img
        class="home-cta__bg"
        :src="assetUrl('/assets/home/cta-bg.png')"
        alt=""
        aria-hidden="true"
      />
      <div class="home-cta__content">
        <h2 id="home-cta-title" class="home-cta__title">
          {{ t('pages.home.cta.title') }}
        </h2>
        <p class="home-cta__subtitle">{{ t('pages.home.cta.subtitle') }}</p>
        <div class="home-cta__actions">
          <button type="button" class="home-cta__btn home-cta__btn--primary" @click="getStarted">
            {{ t('pages.home.cta.ctaPrimary') }}
          </button>
          <a class="home-cta__btn home-cta__btn--ghost" :href="SUPPORT_MAILTO">
            {{ t('pages.home.cta.ctaSecondary') }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-cta {
  padding: 40px 16px 80px;
  background: #fff;
}

.home-cta__inner {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 1360px;
  min-height: 376px;
  margin: 0 auto;
  border-radius: 16px;
}

.home-cta__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-cta__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 376px;
  padding: 48px 24px;
  text-align: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
}

.home-cta__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
}

.home-cta__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #ebf4fb;
}

.home-cta__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
}

.home-cta__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
}

.home-cta__btn--primary {
  background: #101010;
  color: #fff;
}

.home-cta__btn--ghost {
  background: #fff;
  border-color: #ebf4fb;
  color: #222;
}
</style>
