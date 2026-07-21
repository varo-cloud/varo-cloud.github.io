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
  push({ name: userStore.isLoggedIn ? 'ai-generator' : 'auth' })
}
</script>

<template>
  <section class="home-creators" aria-labelledby="home-creators-title">
    <div class="home-creators__inner">
      <div class="home-creators__media">
        <img
          :src="assetUrl('/assets/home/creators.png')"
          :alt="t('pages.home.creators.imageAlt')"
        />
      </div>
      <div class="home-creators__content">
        <p class="home-creators__eyebrow">{{ t('pages.home.creators.eyebrow') }}</p>
        <h2 id="home-creators-title" class="home-creators__title">
          {{ t('pages.home.creators.title') }}
        </h2>
        <p class="home-creators__subtitle">{{ t('pages.home.creators.subtitle') }}</p>
        <div class="home-creators__actions">
          <button type="button" class="home-creators__btn home-creators__btn--primary" @click="getStarted">
            {{ t('pages.home.creators.ctaPrimary') }}
          </button>
          <a class="home-creators__btn home-creators__btn--ghost" :href="SUPPORT_MAILTO">
            {{ t('pages.home.creators.ctaSecondary') }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-creators {
  padding: 80px 16px;
  background: #fff;
}

.home-creators__inner {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 48px;
  align-items: center;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.home-creators__media {
  overflow: hidden;
  border-radius: 16px;
  min-height: 360px;
  background: #f4f4f4;
}

.home-creators__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-creators__eyebrow {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 500;
  color: #06b6d4;
}

.home-creators__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
}

.home-creators__subtitle {
  margin: 20px 0 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
}

.home-creators__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 28px;
}

.home-creators__btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  min-height: 40px;
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

.home-creators__btn--primary {
  background: #06b6d4;
  color: #fff;
}

.home-creators__btn--primary:hover {
  opacity: 0.92;
}

.home-creators__btn--ghost {
  background: transparent;
  border-color: #d8dee6;
  color: #222;
}

.home-creators__btn--ghost:hover {
  background: #f8f8f8;
}

@media (max-width: 900px) {
  .home-creators {
    padding: 56px 16px;
  }

  .home-creators__inner {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .home-creators__media {
    min-height: 220px;
  }

  .home-creators__subtitle {
    font-size: 15px;
  }

  .home-creators__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .home-creators__btn {
    width: 100%;
  }
}
</style>
