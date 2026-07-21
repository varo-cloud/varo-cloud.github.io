<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { docsUrl } from '@/utils/docsUrl'
import ModelsHeroCarousel from '@/components/models/ModelsHeroCarousel.vue'

const { t } = useI18n()
const { push } = useLocaleRouter()
const userStore = useUserStore()
const heroActiveIndex = ref(0)

const externalDocsUrl = computed(() => docsUrl() ?? '#')

const primaryLabel = computed(() =>
  userStore.isLoggedIn ? t('pages.home.hero.ctaPrimaryLoggedIn') : t('pages.home.hero.ctaPrimary'),
)

function onPrimaryCta() {
  if (userStore.isLoggedIn) {
    push({ name: 'models' })
    return
  }
  push({ name: 'auth' })
}
</script>

<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <ModelsHeroCarousel v-model:active-index="heroActiveIndex" />
    <div class="home-hero__content">
      <h1 id="home-hero-title" class="home-hero__title">
        {{ t('pages.home.hero.title') }}
      </h1>
      <p class="home-hero__subtitle">
        {{ t('pages.home.hero.subtitle') }}
      </p>
      <div class="home-hero__actions">
        <button type="button" class="home-hero__btn home-hero__btn--primary" @click="onPrimaryCta">
          {{ primaryLabel }}
        </button>
        <a
          class="home-hero__btn home-hero__btn--ghost"
          :href="externalDocsUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('pages.home.hero.ctaSecondary') }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 724px;
  padding: 0 16px 72px;
  overflow: hidden;
  color: #fff;
}

.home-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.home-hero__title {
  margin: 0;
  max-width: 1242px;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.14;
  letter-spacing: -0.02em;
}

.home-hero__subtitle {
  margin: 24px 0 0;
  max-width: 900px;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 600;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.7);
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}

.home-hero__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.home-hero__btn--primary {
  background: #06b6d4;
  color: #fff;
}

.home-hero__btn--primary:hover {
  opacity: 0.92;
}

.home-hero__btn--ghost {
  background: transparent;
  border-color: #ebf4fb;
  color: #ebf4fb;
}

.home-hero__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 767px) {
  .home-hero {
    min-height: 560px;
    padding-bottom: 48px;
  }

  .home-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
