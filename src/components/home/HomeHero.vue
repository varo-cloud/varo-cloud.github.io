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
    <div class="home-hero__inner">
      <div class="home-hero__content">
        <div class="home-hero__copy">
          <h1 id="home-hero-title" class="home-hero__title">
            {{ t('pages.home.hero.title') }}
          </h1>
          <p class="home-hero__subtitle">
            {{ t('pages.home.hero.subtitle') }}
          </p>
        </div>
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
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 580px;
  padding: 0 16px 60px;
  overflow: hidden;
  color: #fff;
}

.home-hero__inner {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  pointer-events: none;
}

.home-hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
  max-width: 100%;
  pointer-events: auto;
}

.home-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 100%;
}

.home-hero__title {
  margin: 0;
  max-width: 1242px;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  line-height: 64px;
  color: #fff;
  word-break: break-word;
}

.home-hero__subtitle {
  margin: 0;
  width: 100%;
  max-width: none;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 500;
  line-height: 24px;
  color: #fff;
  opacity: 0.5;
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 0;
}

.home-hero__btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  min-height: 60px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  text-decoration: none;
  white-space: nowrap;
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
  background: #0891b2;
}

.home-hero__btn--ghost {
  background: transparent;
  border-color: #ebf4fb;
  color: #ebf4fb;
}

.home-hero__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}

@media (min-width: 1024px) {
  .home-hero {
    padding-inline: 60px;
  }
}

@media (max-width: 767px) {
  .home-hero {
    min-height: min(70svh, 520px);
    padding: 88px 16px 88px;
  }

  .home-hero__content {
    gap: 24px;
  }

  .home-hero__title {
    line-height: 1.14;
  }

  .home-hero__subtitle {
    line-height: 1.4;
  }

  .home-hero__actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 12px;
  }

  .home-hero__btn {
    width: 100%;
    height: 48px;
    min-height: 48px;
  }
}
</style>
