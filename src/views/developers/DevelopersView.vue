<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { assetUrl } from '@/utils/assetUrl'
import { docsUrl, openDocs } from '@/utils/docsUrl'
import { absoluteUrl, SITE_NAME } from '@/seo/config'
import HighlightedCodeBlock from '@/components/common/HighlightedCodeBlock.vue'
import AppIcon, { type AppIconName } from '@/components/common/AppIcon.vue'
import ModelsHeroCarousel, {
  type HeroCarouselSlide,
} from '@/components/models/ModelsHeroCarousel.vue'
import type { CodeHighlightLanguage } from '@/utils/code-highlight'
import {
  API_CODE_VIEW_MODES,
  buildApiSubmitSnippet,
  type ApiCodeViewMode,
} from '@/utils/playground-request-snippets'

/** Demo sample aligned with home developers section. */
const DEMO_MODEL_SLUG = 'seedance-2.0/image-to-video'
const DEMO_FORM_VALUES = {
  prompt: 'A cinematic shot of a futuristic city at sunset',
  image_url: 'https://example.com/input.jpg',
  duration: 8,
  resolution: '720p',
}

const HERO_SLIDES: HeroCarouselSlide[] = [
  {
    poster: assetUrl('https://assets.varo.cloud/uploads/406c1cf7c14641028a11ad1ffeb82e33.jpg'),
    video: assetUrl('https://assets.varo.cloud/uploads/897c202933174afca759de90f5f6b589.mov'),
  },
  {
    poster: assetUrl('https://assets.varo.cloud/uploads/d788ff5fe8d046998e092c91649d3283.jpg'),
    video: assetUrl('https://assets.varo.cloud/uploads/2b773bd7f7494f4daba95384c14db5ce.mp4'),
  },
]

const TAB_LABELS: Record<ApiCodeViewMode, string> = {
  http: 'HTTP',
  python: 'Python',
  javascript: 'Node.js',
}

const TAB_ICONS: Record<ApiCodeViewMode, AppIconName> = {
  http: 'code-http',
  python: 'code-python',
  javascript: 'code-javascript',
}

const { t, tm } = useI18n()
const { push, localePath } = useLocaleRouter()

const codeViewMode = ref<ApiCodeViewMode>('http')
const openFaqId = ref('test')
const heroActiveIndex = ref(0)

const codeModeOptions = computed(() =>
  API_CODE_VIEW_MODES.map((mode) => ({
    value: mode,
    label: TAB_LABELS[mode],
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

const externalDocsUrl = computed(() => docsUrl() ?? localePath('/docs'))

const isHeroSlide2 = computed(() => heroActiveIndex.value === 1)

const heroTitle = computed(() =>
  isHeroSlide2.value ? t('pages.developers.hero.slide2Title') : t('pages.developers.hero.title'),
)

const heroSubtitle = computed(() =>
  isHeroSlide2.value
    ? t('pages.developers.hero.slide2Subtitle')
    : t('pages.developers.hero.subtitle'),
)

const faqItems = computed(() => {
  const items = tm('pages.developers.faq.items') as Array<{
    id: string
    question: string
    answer: string
  }>
  return Array.isArray(items) ? items : []
})

const steps = computed(() => {
  const items = tm('pages.developers.howItWorks.steps') as Array<{
    label: string
    title: string
    bodyBefore?: string
    linkText?: string
    linkHref?: string
    bodyMid?: string
    linkText2?: string
    linkHref2?: string
    bodyAfter?: string
    body?: string
  }>
  return Array.isArray(items) ? items : []
})

useHead(
  computed(() => ({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.value.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }),
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: t('pages.developers.seo.title'),
          description: t('pages.developers.seo.description'),
          url: absoluteUrl(localePath('/developers')),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
        }),
      },
    ],
  })),
)

function toggleFaq(id: string) {
  openFaqId.value = openFaqId.value === id ? '' : id
}

function onApiReference() {
  openDocs(() => push({ name: 'docs' }))
}

function onExploreModels() {
  push({ name: 'models' })
}

function resolveStepHref(href?: string) {
  if (!href) return '#'
  if (href === 'auth') {
    const path = localePath('/auth')
    const redirect = encodeURIComponent(localePath('/developers'))
    return `${path}?redirect=${redirect}`
  }
  if (href === 'docs') return externalDocsUrl.value
  if (href.startsWith('http')) return href
  return localePath(href)
}

function isExternalHref(href?: string) {
  return href === 'docs' || Boolean(href?.startsWith('http'))
}
</script>

<template>
  <div class="developers-page" data-seo-ready="developers">
    <section class="developers-hero" aria-labelledby="developers-hero-title">
      <ModelsHeroCarousel v-model:active-index="heroActiveIndex" :slides="HERO_SLIDES" />
      <div class="developers-hero__inner">
        <div class="developers-hero__content">
          <h1 id="developers-hero-title" class="developers-hero__title">
            {{ heroTitle }}
          </h1>
          <p class="developers-hero__subtitle">
            {{ heroSubtitle }}
          </p>
          <div class="developers-hero__actions">
            <template v-if="!isHeroSlide2">
              <button type="button" class="developers-hero__cta" @click="onApiReference">
                {{ t('pages.developers.hero.cta') }}
              </button>
            </template>
            <template v-else>
              <button type="button" class="developers-hero__cta" @click="onExploreModels">
                {{ t('pages.developers.hero.slide2CtaModels') }}
              </button>
              <a
                class="developers-hero__cta developers-hero__cta--outline"
                :href="externalDocsUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('pages.developers.hero.slide2CtaDocs') }}
              </a>
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="developers-showcase" aria-label="API code examples">
      <div class="developers-showcase__inner">
        <div class="developers-showcase__card">
          <div class="developers-showcase__tabs-wrap">
            <div class="developers-showcase__tabs" role="tablist">
              <button
                v-for="opt in codeModeOptions"
                :key="opt.value"
                type="button"
                role="tab"
                class="developers-showcase__tab"
                :class="{ 'is-active': codeViewMode === opt.value }"
                :aria-selected="codeViewMode === opt.value"
                @click="codeViewMode = opt.value"
              >
                <AppIcon
                  class="developers-showcase__tab-icon"
                  :name="TAB_ICONS[opt.value]"
                  :size="20"
                />
                <span>{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <div class="developers-showcase__body">
            <div class="developers-showcase__code">
              <HighlightedCodeBlock :code="activeCode" :language="activeLanguage" />
            </div>
            <div class="developers-showcase__preview">
              <img
                :src="assetUrl('https://assets.varo.cloud/uploads/49aa4462bb824ac98284c2ad2f2efb19.jpg')"
                :alt="t('pages.developers.showcase.previewAlt')"
                width="644"
                height="295"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="developers-how" aria-labelledby="developers-how-title">
      <div class="developers-how__inner">
        <h2 id="developers-how-title" class="developers-section-title">
          {{ t('pages.developers.howItWorks.title') }}
        </h2>
        <p class="developers-section-subtitle">
          {{ t('pages.developers.howItWorks.subtitle') }}
        </p>

        <ol class="developers-how__steps">
          <li v-for="(step, index) in steps" :key="index" class="developers-how__step">
            <p class="developers-how__step-label">
              {{ t('pages.developers.howItWorks.stepLabel', { n: index + 1 }) }}
            </p>
            <h3 class="developers-how__step-title">{{ step.title }}</h3>
            <p v-if="step.body" class="developers-how__step-body">{{ step.body }}</p>
            <p v-else class="developers-how__step-body">
              <template v-if="step.bodyBefore">{{ step.bodyBefore }}</template>
              <a
                v-if="step.linkText"
                class="developers-how__link"
                :href="resolveStepHref(step.linkHref)"
                :target="isExternalHref(step.linkHref) ? '_blank' : undefined"
                :rel="isExternalHref(step.linkHref) ? 'noopener noreferrer' : undefined"
              >{{ step.linkText }}</a>
              <template v-if="step.bodyMid">{{ step.bodyMid }}</template>
              <a
                v-if="step.linkText2"
                class="developers-how__link"
                :href="resolveStepHref(step.linkHref2)"
                :target="isExternalHref(step.linkHref2) ? '_blank' : undefined"
                :rel="isExternalHref(step.linkHref2) ? 'noopener noreferrer' : undefined"
              >{{ step.linkText2 }}</a>
              <template v-if="step.bodyAfter">{{ step.bodyAfter }}</template>
            </p>
          </li>
        </ol>
      </div>
    </section>

    <section class="developers-faq" aria-labelledby="developers-faq-title">
      <div class="developers-faq__inner">
        <h2 id="developers-faq-title" class="developers-section-title">
          {{ t('pages.developers.faq.title') }}
        </h2>
        <p class="developers-section-subtitle">
          {{ t('pages.developers.faq.subtitle') }}
        </p>

        <div class="developers-faq__list">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="developers-faq__item"
            :class="{ 'is-open': openFaqId === item.id }"
          >
            <button
              type="button"
              class="developers-faq__trigger"
              :aria-expanded="openFaqId === item.id"
              :aria-controls="`faq-panel-${item.id}`"
              @click="toggleFaq(item.id)"
            >
              <span class="developers-faq__question">{{ item.question }}</span>
              <AppIcon
                :name="openFaqId === item.id ? 'close-line' : 'add-line'"
                :size="24"
                color="#06b6d4"
              />
            </button>
            <div
              v-show="openFaqId === item.id"
              :id="`faq-panel-${item.id}`"
              class="developers-faq__answer"
              role="region"
            >
              <p>{{ item.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.developers-page {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: rgba(6, 182, 212, 0.04);
  color: #222;
}

.developers-hero {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 460px;
  /* Figma Developers hero: content block at y=230 within 460px frame */
  padding: 230px 16px 80px;
  overflow: hidden;
  background: #0a0a0e;
  color: #fff;
}

.developers-hero__inner {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  pointer-events: none;
}

.developers-hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  max-width: 1242px;
  text-align: left;
  pointer-events: auto;
}

.developers-hero__title {
  margin: 0;
  width: 100%;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.14;
  color: #fff;
  word-break: break-word;
}

.developers-hero__subtitle {
  margin: 0;
  width: 100%;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
  word-break: break-word;
}

.developers-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 12px 24px;
  border: 0;
  border-radius: 8px;
  background: #06b6d4;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  text-decoration: none;
  cursor: pointer;
  pointer-events: auto;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.developers-hero__cta:hover {
  background: #0891b2;
}

.developers-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.developers-hero__cta--outline {
  background: #fff;
  border: 1px solid #d0d5dd;
  color: #222;
}

.developers-hero__cta--outline:hover {
  background: #f8fafc;
  border-color: #98a2b3;
  color: #111;
}

.developers-showcase {
  position: relative;
  z-index: 2;
  padding: 80px 16px 80px;
}

.developers-showcase__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.developers-showcase__card {
  display: flex;
  flex-direction: column;
  height: 411px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  box-sizing: border-box;
}

.developers-showcase__tabs-wrap {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
}

.developers-showcase__tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  max-width: 100%;
}

.developers-showcase__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 40px;
  min-height: 40px;
  padding: 8px 24px;
  border: 0;
  border-radius: 8px;
  background: #f8f8f8;
  color: #929ca5;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.developers-showcase__tab-icon {
  flex-shrink: 0;
  color: currentColor;
}

.developers-showcase__tab:hover:not(.is-active) {
  color: #222;
  background: #ececec;
}

.developers-showcase__tab.is-active {
  background: #222;
  color: #ebf4fb;
}

.developers-showcase__tab.is-active:hover {
  background: #333;
}

.developers-showcase__body {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 40px;
  margin-top: 24px;
  min-height: 0;
  min-width: 0;
}

.developers-showcase__code {
  flex: 1 1 607px;
  min-width: 0;
  max-width: 607px;
  height: 295px;
}

.developers-showcase__code :deep(.highlighted-code-block) {
  height: 100%;
  min-height: 0;
  max-height: none;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 24px;
  background: #fff;
  color: #222;
  font-size: 14px;
  line-height: 20px;
  overflow: auto;
}

.developers-showcase__code :deep(.hljs) {
  background: transparent;
  color: #222;
}

.developers-showcase__code :deep(.hljs-comment),
.developers-showcase__code :deep(.hljs-quote) {
  color: #6a9955;
}

.developers-showcase__code :deep(.hljs-keyword),
.developers-showcase__code :deep(.hljs-selector-tag),
.developers-showcase__code :deep(.hljs-meta) {
  color: #7c3aed;
}

.developers-showcase__code :deep(.hljs-string),
.developers-showcase__code :deep(.hljs-regexp),
.developers-showcase__code :deep(.hljs-symbol),
.developers-showcase__code :deep(.hljs-template-tag),
.developers-showcase__code :deep(.hljs-template-variable) {
  color: #ce9178;
}

.developers-showcase__code :deep(.hljs-number),
.developers-showcase__code :deep(.hljs-literal),
.developers-showcase__code :deep(.hljs-built_in),
.developers-showcase__code :deep(.hljs-type) {
  color: #b45309;
}

.developers-showcase__code :deep(.hljs-title),
.developers-showcase__code :deep(.hljs-title.class_),
.developers-showcase__code :deep(.hljs-title.function_),
.developers-showcase__code :deep(.hljs-name),
.developers-showcase__code :deep(.hljs-attr),
.developers-showcase__code :deep(.hljs-attribute),
.developers-showcase__code :deep(.hljs-property) {
  color: #0284c7;
}

.developers-showcase__code :deep(.hljs-variable),
.developers-showcase__code :deep(.hljs-params),
.developers-showcase__code :deep(.hljs-subst) {
  color: #222;
}

.developers-showcase__code :deep(.hljs-punctuation),
.developers-showcase__code :deep(.hljs-operator) {
  color: #64748b;
}

.developers-showcase__code :deep(.hljs-section),
.developers-showcase__code :deep(.hljs-bullet) {
  color: #06b6d4;
}

.developers-showcase__preview {
  flex: 0 1 644px;
  width: 644px;
  max-width: 100%;
  height: 295px;
  overflow: hidden;
  border-radius: 24px;
  background: #f5f5f5;
}

.developers-showcase__preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.developers-section-title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
  text-align: center;
}

.developers-section-subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #222;
  text-align: center;
}

.developers-how {
  padding: 80px 16px;
  background: #fff;
}

.developers-how__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.developers-how__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin: 60px 0 0;
  padding: 0;
  list-style: none;
}

.developers-how__step {
  padding: 24px;
}

.developers-how__step-label {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: #06b6d4;
}

.developers-how__step-title {
  margin: 16px 0 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
  color: #222;
}

.developers-how__step-body {
  margin: 16px 0 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #222;
}

.developers-how__link {
  color: #06b6d4;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
}

.developers-how__link:hover {
  color: #0891b2;
}

.developers-faq {
  padding: 80px 16px 100px;
  background: transparent;
}

.developers-faq__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.developers-faq__list {
  margin-top: 60px;
}

.developers-faq__item {
  border-top: 0.5px solid rgba(6, 182, 212, 0.3);
}

.developers-faq__item:last-child {
  border-bottom: 0.5px solid rgba(6, 182, 212, 0.3);
}

.developers-faq__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  padding: 24px;
  border: 0;
  background: transparent;
  color: #222;
  text-align: left;
  cursor: pointer;
}

.developers-faq__question {
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
}

.developers-faq__item.is-open .developers-faq__question {
  color: #06b6d4;
}

.developers-faq__answer {
  padding: 0 24px 24px;
}

.developers-faq__answer p {
  margin: 0;
  max-width: 1048px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #929ca5;
}

@media (min-width: 1024px) {
  .developers-hero,
  .developers-showcase,
  .developers-how,
  .developers-faq {
    padding-inline: 24px;
  }

  .developers-hero__title {
    font-size: 56px;
    line-height: 64px;
  }

  .developers-hero__subtitle {
    font-size: 20px;
    line-height: 24px;
  }
}

@media (max-width: 1023px) {
  .developers-showcase__card {
    height: auto;
    min-height: 0;
  }

  .developers-showcase__body {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
  }

  .developers-showcase__code {
    flex: none;
    max-width: none;
    width: 100%;
    height: 280px;
  }

  .developers-showcase__preview {
    flex: none;
    width: 100%;
    height: 220px;
  }

  .developers-how__steps {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 40px;
  }
}

@media (max-width: 767px) {
  .developers-hero {
    height: auto;
    min-height: 0;
    padding: 88px 16px 40px;
  }

  .developers-hero__content {
    gap: 16px;
  }

  .developers-hero__title {
    font-size: clamp(28px, 8vw, 36px);
    line-height: 1.15;
  }

  .developers-hero__subtitle {
    font-size: clamp(14px, 4vw, 16px);
    line-height: 1.3;
  }

  .developers-hero__actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .developers-hero__cta {
    width: 100%;
  }

  .developers-showcase {
    padding: 40px 16px 48px;
  }

  .developers-showcase__card {
    padding: 16px;
  }

  .developers-showcase__tabs {
    gap: 8px;
  }

  .developers-showcase__tab {
    padding: 8px 14px;
  }

  .developers-how {
    padding: 48px 16px;
  }

  .developers-faq {
    padding: 48px 16px 64px;
  }

  .developers-faq__list {
    margin-top: 40px;
  }

  .developers-faq__trigger {
    padding: 20px 8px;
  }

  .developers-faq__question {
    font-size: 16px;
    line-height: 1.3;
  }

  .developers-faq__answer {
    padding: 0 8px 20px;
  }

  .developers-how__step {
    padding: 16px 8px;
  }
}
</style>
