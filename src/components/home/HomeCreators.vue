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
  padding: 80px 0;
  background: #fff;
}

.home-creators__inner {
  display: grid;
  grid-template-columns: minmax(0, 720px) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 40px;
  box-sizing: border-box;
}

.home-creators__media {
  overflow: hidden;
  width: 100%;
  aspect-ratio: 720 / 480;
  background: #f4f4f4;
}

.home-creators__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-creators__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 609px;
  margin: 0 auto;
  text-align: center;
}

.home-creators__eyebrow {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  color: #06b6d4;
}

.home-creators__title {
  margin: 20px 0 0;
  font-size: clamp(28px, 3.2vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
}

.home-creators__subtitle {
  margin: 20px 0 0;
  max-width: 507px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
}

.home-creators__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
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
  background: #0891b2;
}

.home-creators__btn--ghost {
  background: transparent;
  border-color: #ebf4fb;
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
    padding: 0;
  }

  .home-creators__media {
    border-radius: 16px;
  }

  .home-creators__content {
    max-width: none;
  }

  .home-creators__subtitle {
    font-size: 15px;
  }

  .home-creators__actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    margin-top: 28px;
  }

  .home-creators__btn {
    width: 100%;
  }
}
</style>
