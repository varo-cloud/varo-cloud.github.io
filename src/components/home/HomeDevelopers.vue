<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import HighlightedCodeBlock from '@/components/common/HighlightedCodeBlock.vue'
import type { CodeHighlightLanguage } from '@/utils/code-highlight'
import {
  API_CODE_VIEW_MODES,
  buildApiSubmitSnippet,
  type ApiCodeViewMode,
} from '@/utils/playground-request-snippets'

/** Demo sample aligned with model detail API examples. */
const DEMO_MODEL_SLUG = 'seedance-2.0/image-to-video'
const DEMO_FORM_VALUES = {
  prompt: 'A cinematic shot of a futuristic city at sunset',
  image_url: 'https://example.com/input.jpg',
  duration: 8,
  resolution: '720p',
}

const { t } = useI18n()
const { push } = useLocaleRouter()
const userStore = useUserStore()

const codeViewMode = ref<ApiCodeViewMode>('http')

const codeModeOptions = computed(() =>
  API_CODE_VIEW_MODES.map((mode) => ({
    value: mode,
    label: t(`pages.modelDetail.inputViewModes.${mode}`),
  })),
)

const activeCode = computed(() =>
  buildApiSubmitSnippet(codeViewMode.value, DEMO_MODEL_SLUG, DEMO_FORM_VALUES),
)

const activeLanguage = computed<CodeHighlightLanguage>(() => {
  if (codeViewMode.value === 'http') return 'http'
  if (codeViewMode.value === 'python') return 'python'
  return 'javascript'
})

function getApiKey() {
  push({ name: userStore.isLoggedIn ? 'api-keys' : 'auth' })
}
</script>

<template>
  <section class="home-developers" aria-labelledby="home-developers-title">
    <div class="home-developers__inner">
      <p class="home-developers__eyebrow">{{ t('pages.home.developers.eyebrow') }}</p>
      <h2 id="home-developers-title" class="home-developers__title">
        {{ t('pages.home.developers.title') }}
      </h2>
      <p class="home-developers__subtitle">{{ t('pages.home.developers.subtitle') }}</p>

      <div class="home-developers__panel">
        <div class="home-developers__tabs" role="tablist">
          <button
            v-for="opt in codeModeOptions"
            :key="opt.value"
            type="button"
            role="tab"
            class="home-developers__tab"
            :class="{ 'is-active': codeViewMode === opt.value }"
            :aria-selected="codeViewMode === opt.value"
            @click="codeViewMode = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="home-developers__body">
          <div class="home-developers__code">
            <HighlightedCodeBlock :code="activeCode" :language="activeLanguage" />
            <button type="button" class="home-developers__api-btn" @click="getApiKey">
              {{ t('pages.home.developers.getApiKey') }}
            </button>
          </div>
          <div class="home-developers__preview">
            <img
              :src="assetUrl('/assets/home/developers-preview.png')"
              :alt="t('pages.home.developers.previewAlt')"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-developers {
  padding: 80px 16px;
  background: rgba(6, 182, 212, 0.04);
}

.home-developers__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  text-align: center;
}

.home-developers__eyebrow {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 500;
  color: #06b6d4;
}

.home-developers__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #222;
}

.home-developers__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
}

.home-developers__panel {
  margin-top: 40px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  background: #fff;
  text-align: left;
  min-width: 0;
}

.home-developers__tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
  padding: 4px;
  border: 1px solid #ebf4fb;
  border-radius: 30px;
}

.home-developers__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 12px;
  border: 0;
  border-radius: 30px;
  background: transparent;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.home-developers__tab:hover:not(.is-active) {
  color: #222;
  background: rgba(0, 0, 0, 0.04);
}

.home-developers__tab.is-active {
  background: #06b6d4;
  color: #ebf4fb;
}

.home-developers__tab.is-active:hover {
  background: #0891b2;
}

.home-developers__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  align-items: stretch;
}

.home-developers__code {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.home-developers__code :deep(.highlighted-code-block) {
  min-height: 240px;
  background: #0f1115;
}

.home-developers__api-btn {
  align-self: flex-start;
  min-height: 36px;
  padding: 8px 36px;
  border: 0;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.home-developers__api-btn:hover {
  background: rgba(6, 182, 212, 0.18);
}

.home-developers__preview {
  overflow: hidden;
  border-radius: 12px;
  min-height: 240px;
  background: #111;
}

.home-developers__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 900px) {
  .home-developers {
    padding: 56px 16px;
  }

  .home-developers__subtitle {
    font-size: 15px;
  }

  .home-developers__panel {
    padding: 16px;
  }

  .home-developers__body {
    grid-template-columns: 1fr;
  }

  .home-developers__preview {
    min-height: 200px;
  }
}
</style>
