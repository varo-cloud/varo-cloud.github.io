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
        :src="assetUrl('https://assets.varo.cloud/uploads/808e1f97c89a48b9986a86f1a7e5cb0d.jpg')"
        alt=""
        aria-hidden="true"
      />
      <div class="home-cta__content">
        <div class="home-cta__copy">
          <h2 id="home-cta-title" class="home-cta__title">
            {{ t('pages.home.cta.title') }}
          </h2>
          <p class="home-cta__subtitle">{{ t('pages.home.cta.subtitle') }}</p>
        </div>
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
  padding: 0;
  background: #fff;
}

.home-cta__inner {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 376px;
  margin: 0;
  border-radius: 0;
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
  gap: 40px;
  min-height: 376px;
  padding: 98px 24px;
  text-align: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
}

.home-cta__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.home-cta__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
}

.home-cta__subtitle {
  margin: 0 auto;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
  color: #ebf4fb;
}

.home-cta__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.home-cta__btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  min-height: 56px;
  padding: 0 24px;
  border-radius: 8px;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  appearance: none;
  -webkit-appearance: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.home-cta__btn--primary {
  background: #101010;
  color: #fff;
}

.home-cta__btn--primary:hover {
  background: #333;
}

.home-cta__btn--ghost {
  background: #fff;
  border-color: #ebf4fb;
  color: #222;
}

.home-cta__btn--ghost:hover {
  background: #f8f8f8;
}

@media (max-width: 767px) {
  .home-cta__inner,
  .home-cta__content {
    min-height: 320px;
  }

  .home-cta__content {
    gap: 28px;
    padding: 48px 16px;
  }

  .home-cta__subtitle {
    font-size: 14px;
  }

  .home-cta__actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 320px;
  }

  .home-cta__btn {
    width: 100%;
    height: 48px;
    min-height: 48px;
  }
}
</style>
