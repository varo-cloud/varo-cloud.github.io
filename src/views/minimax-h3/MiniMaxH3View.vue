<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { fetchModelFacets, fetchModels } from '@/api/models'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import { docsUrl, openDocs } from '@/utils/docsUrl'
import { absoluteUrl, SITE_NAME } from '@/seo/config'
import AppIcon from '@/components/common/AppIcon.vue'
import type { BaseModelFacetItem, Model } from '@/types'

/** Card order matches `pages.minimaxH3.api.cards` */
const API_CARD_CAPABILITIES = [
  'text-to-video',
  'image-to-video',
  'reference-to-video',
] as const

const CODE_TAB_IDS = ['image', 'video', 'speech', 'chat'] as const
type CodeTabId = (typeof CODE_TAB_IDS)[number]

const { t, tm } = useI18n()
const { push, localePath } = useLocaleRouter()
const userStore = useUserStore()

const openFaqId = ref('what')
const activeCodeTab = ref<CodeTabId>('image')
const activeModeRef = ref(0)
const h3BaseModel = ref<string | null>(null)
const apiCardModels = ref<(Model | null)[]>(API_CARD_CAPABILITIES.map(() => null))
const apiCardsLoading = ref(true)

const faqItems = computed(() => {
  const items = tm('pages.minimaxH3.faq.items') as Array<{
    id: string
    question: string
    answer: string
  }>
  return Array.isArray(items) ? items : []
})

const apiCards = computed(() => {
  const items = tm('pages.minimaxH3.api.cards') as Array<{
    tag: string
    title: string
    body: string
    alt: string
  }>
  if (!Array.isArray(items)) return []
  return items.map((card, index) => {
    const model = apiCardModels.value[index]
    const thumbnail = model?.thumbnailUrl?.trim() || null
    return {
      ...card,
      // Never fall back to a default placeholder image — keep skeleton until real media exists
      image: thumbnail,
    }
  })
})

const codeTabs = computed(() => {
  const items = tm('pages.minimaxH3.api.codeTabs') as Array<{
    id: string
    label: string
    icon: string
  }>
  return Array.isArray(items) ? items : []
})

const modes = computed(() => {
  const items = tm('pages.minimaxH3.modes.items') as Array<{
    title: string
    body: string
    icon: string
  }>
  return Array.isArray(items) ? items : []
})

const whyItems = computed(() => {
  const items = tm('pages.minimaxH3.why.items') as Array<{
    title: string
    body: string
    icon: string
  }>
  return Array.isArray(items) ? items : []
})

const useCases = computed(() => {
  const items = tm('pages.minimaxH3.production.useCases') as string[]
  return Array.isArray(items) ? items : []
})

const galleryItems = computed(() => {
  const items = tm('pages.minimaxH3.production.gallery') as Array<{
    image: string
    alt: string
  }>
  return Array.isArray(items) ? items : []
})

const modeRefs = computed(() => [
  {
    src: 'https://assets.varo.cloud/uploads/9098c7b60d7349bd8cdbba240f46954a.mp4',
    label: t('pages.minimaxH3.modes.refVideo'),
    icon: '/assets/minimax-h3/icon-vidicon-sm.svg',
    kind: 'video' as const,
  },
  {
    src: 'https://assets.varo.cloud/uploads/08f01984434c4510af84a8d854518838.png',
    label: t('pages.minimaxH3.modes.refImage'),
    icon: '/assets/minimax-h3/icon-image-sm.svg',
    kind: 'image' as const,
  },
  {
    src: 'https://assets.varo.cloud/uploads/e92db47ce6904bb49d509c73fc2c6d55.mp4',
    label: t('pages.minimaxH3.modes.refVideo'),
    icon: '/assets/minimax-h3/icon-vidicon-sm.svg',
    kind: 'video' as const,
  },
])

const activeModeRefItem = computed(() => modeRefs.value[activeModeRef.value] ?? modeRefs.value[0])

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
          name: t('pages.minimaxH3.seo.title'),
          description: t('pages.minimaxH3.seo.description'),
          url: absoluteUrl(localePath('/minimax-h3')),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          about: {
            '@type': 'SoftwareApplication',
            name: 'MiniMax H3',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              url: absoluteUrl(localePath('/pricing')),
            },
          },
        }),
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: t('nav.models'),
              item: absoluteUrl(localePath('/models')),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: t('nav.minimaxH3'),
              item: absoluteUrl(localePath('/minimax-h3')),
            },
          ],
        }),
      },
    ],
  })),
)

function toggleFaq(id: string) {
  openFaqId.value = openFaqId.value === id ? '' : id
}

function goToModels() {
  if (h3BaseModel.value) {
    push({ name: 'models', query: { base_model: h3BaseModel.value } })
    return
  }
  push({ name: 'models' })
}

function goToApiKey() {
  if (userStore.isLoggedIn) {
    push({ name: 'api-keys' })
    return
  }
  push({ name: 'auth', query: { redirect: localePath('/minimax-h3') } })
}

function goToDocs() {
  openDocs(() => push({ name: 'docs' }))
}

function goToModel(slug: string) {
  push({ name: 'model-detail', params: { slug } })
}

function resolveH3BaseModel(baseModels: BaseModelFacetItem[]): string | null {
  const matches = baseModels.filter((m) => /minimax|hailuo|h[-_]?3/i.test(m.slug))
  if (matches.length === 0) return null
  const preferred = matches.find((m) => /h[-_]?3/i.test(m.slug))
  return (preferred ?? matches[0])?.slug ?? null
}

function resolveModelForCapability(capability: string, models: Model[]): Model | null {
  const target = capability.toLowerCase()
  const byCapability = models.find((m) => m.capability.trim().toLowerCase() === target)
  if (byCapability) return byCapability

  const byName = models.find((m) => {
    const id = m.id.toLowerCase()
    const name = m.displayName.toLowerCase()
    return id.includes(target) || name.includes(target.replace(/-/g, ' '))
  })
  return byName ?? null
}

async function resolveH3ModelSlugs() {
  apiCardsLoading.value = true
  try {
    const facets = await fetchModelFacets()
    const baseModel = resolveH3BaseModel(facets.base_models)
    h3BaseModel.value = baseModel
    if (!baseModel) return

    const page = await fetchModels({
      base_model: baseModel,
      offset: 0,
      limit: 50,
    })
    apiCardModels.value = API_CARD_CAPABILITIES.map((capability) =>
      resolveModelForCapability(capability, page.items),
    )
  } catch {
    h3BaseModel.value = null
    apiCardModels.value = API_CARD_CAPABILITIES.map(() => null)
  } finally {
    apiCardsLoading.value = false
  }
}

function onApiCardClick(index: number) {
  const slug = apiCardModels.value[index]?.id
  if (!slug) {
    goToModels()
    return
  }
  goToModel(slug)
}

function setCodeTab(id: string) {
  if ((CODE_TAB_IDS as readonly string[]).includes(id)) {
    activeCodeTab.value = id as CodeTabId
  }
}

function hideBrokenImage(event: Event) {
  const el = event.target
  if (el instanceof HTMLImageElement) el.style.display = 'none'
}

onMounted(() => {
  void resolveH3ModelSlugs()
})
</script>

<template>
  <div class="h3-page" data-seo-ready="minimax-h3">
    <section class="h3-hero" aria-labelledby="minimax-h3-hero-title">
      <video
        class="h3-hero__bg"
        src="https://assets.varo.cloud/uploads/34b5c74f44e94b70884a9e9de4e96a62.mp4"
        poster="https://assets.varo.cloud/uploads/0b740e42f6034f39a2cf8cf5443216a7.jpg"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-hidden="true"
      />
      <div class="h3-hero__overlay" aria-hidden="true" />
      <div class="h3-hero__inner">
        <h1 id="minimax-h3-hero-title" class="h3-hero__title">
          {{ t('pages.minimaxH3.hero.title') }}
        </h1>
        <p class="h3-hero__subtitle">
          {{ t('pages.minimaxH3.hero.subtitle') }}
        </p>
        <div class="h3-hero__actions">
          <button type="button" class="h3-btn h3-btn--primary" @click="goToApiKey">
            {{ t('pages.minimaxH3.hero.ctaPrimary') }}
          </button>
          <button type="button" class="h3-btn h3-btn--ghost" @click="goToDocs">
            {{ t('pages.minimaxH3.hero.ctaSecondary') }}
          </button>
        </div>
      </div>
    </section>

    <section
      class="h3-api"
      aria-labelledby="minimax-h3-api-title"
      :data-seo-content-ready="apiCardsLoading ? undefined : 'minimax-h3'"
    >
      <div class="h3-section-inner">
        <h2 id="minimax-h3-api-title" class="h3-section-title">
          {{ t('pages.minimaxH3.api.title') }}
        </h2>
        <p class="h3-section-subtitle">
          {{ t('pages.minimaxH3.api.subtitle') }}
        </p>

        <div
          v-if="apiCardsLoading"
          class="h3-api__grid"
          aria-busy="true"
          aria-label="Loading"
        >
          <article
            v-for="n in API_CARD_CAPABILITIES.length"
            :key="`api-sk-${n}`"
            class="h3-api__card"
          >
            <div class="h3-api__media media-skeleton" aria-hidden="true" />
            <span class="h3-api__skeleton-line h3-api__skeleton-line--tag media-skeleton" />
            <span class="h3-api__skeleton-line h3-api__skeleton-line--title media-skeleton" />
            <span class="h3-api__skeleton-line h3-api__skeleton-line--body media-skeleton" />
            <span
              class="h3-api__skeleton-line h3-api__skeleton-line--body-short media-skeleton"
            />
          </article>
        </div>
        <div v-else class="h3-api__grid">
          <article
            v-for="(card, index) in apiCards"
            :key="card.title"
            class="h3-api__card"
          >
            <button
              type="button"
              class="h3-api__media"
              :class="{ 'media-skeleton': !card.image }"
              @click="onApiCardClick(index)"
            >
              <img
                v-if="card.image"
                :src="assetUrl(card.image)"
                :alt="card.alt"
                width="437"
                height="270"
              />
            </button>
            <p class="h3-api__card-tag">{{ card.tag }}</p>
            <h3 class="h3-api__card-title">{{ card.title }}</h3>
            <p class="h3-api__card-body">{{ card.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="h3-modes" aria-labelledby="minimax-h3-modes-title">
      <div class="h3-section-inner">
        <h2 id="minimax-h3-modes-title" class="h3-section-title">
          {{ t('pages.minimaxH3.modes.title') }}
        </h2>
        <p class="h3-section-subtitle">
          {{ t('pages.minimaxH3.modes.subtitle') }}
        </p>

        <div class="h3-modes__layout">
          <div class="h3-modes__list">
            <article
              v-for="item in modes"
              :key="item.title"
              class="h3-modes__item"
            >
              <span class="h3-modes__icon" aria-hidden="true">
                <img :src="assetUrl(item.icon)" alt="" width="24" height="24" />
              </span>
              <div class="h3-modes__copy">
                <h3 class="h3-modes__item-title">{{ item.title }}</h3>
                <p class="h3-modes__item-body">{{ item.body }}</p>
              </div>
            </article>
          </div>

          <div class="h3-modes__visual">
            <div class="h3-modes__refs">
              <button
                v-for="(refItem, index) in modeRefs"
                :key="`${refItem.kind}-${index}`"
                type="button"
                class="h3-modes__ref"
                :class="{ 'is-dim': activeModeRef !== index }"
                :aria-pressed="activeModeRef === index"
                :aria-label="refItem.label"
                @click="activeModeRef = index"
              >
                <div class="h3-modes__ref-media media-skeleton">
                  <video
                    v-if="refItem.kind === 'video'"
                    :src="refItem.src"
                    muted
                    playsinline
                    preload="metadata"
                    aria-hidden="true"
                  />
                  <img
                    v-else
                    :src="assetUrl(refItem.src)"
                    alt=""
                    width="107"
                    height="60"
                    @error="hideBrokenImage"
                  />
                </div>
                <span class="h3-modes__ref-badge">
                  <img :src="assetUrl(refItem.icon)" alt="" width="12" height="12" />
                  {{ refItem.label }}
                </span>
              </button>
            </div>
            <div
              class="h3-modes__main media-skeleton"
              :aria-label="t('pages.minimaxH3.modes.visualAlt')"
            >
              <video
                v-if="activeModeRefItem?.kind === 'video'"
                :key="activeModeRefItem.src"
                :src="activeModeRefItem.src"
                autoplay
                muted
                loop
                playsinline
                preload="metadata"
              />
              <img
                v-else-if="activeModeRefItem"
                :key="activeModeRefItem.src"
                :src="assetUrl(activeModeRefItem.src)"
                :alt="t('pages.minimaxH3.modes.visualAlt')"
                width="668"
                height="376"
                @error="hideBrokenImage"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="h3-why" aria-labelledby="minimax-h3-why-title">
      <div class="h3-section-inner">
        <h2 id="minimax-h3-why-title" class="h3-section-title">
          {{ t('pages.minimaxH3.why.title') }}
        </h2>
        <p class="h3-section-subtitle">
          {{ t('pages.minimaxH3.why.subtitle') }}
        </p>

        <div class="h3-why__grid">
          <article v-for="item in whyItems" :key="item.title" class="h3-why__card">
            <div class="h3-why__icon" aria-hidden="true">
              <img :src="assetUrl(item.icon)" alt="" width="24" height="24" />
            </div>
            <h3 class="h3-why__card-title">{{ item.title }}</h3>
            <p class="h3-why__card-body">{{ item.body }}</p>
          </article>
        </div>

        <a
          class="h3-btn h3-btn--outline h3-why__cta"
          :href="docsUrl() ?? localePath('/docs')"
          :target="docsUrl() ? '_blank' : undefined"
          :rel="docsUrl() ? 'noopener noreferrer' : undefined"
        >
          {{ t('pages.minimaxH3.why.cta') }}
        </a>
      </div>
    </section>

    <section class="h3-production" aria-labelledby="minimax-h3-production-title">
      <div class="h3-section-inner">
        <h2 id="minimax-h3-production-title" class="h3-section-title">
          {{ t('pages.minimaxH3.production.title') }}
        </h2>
        <p class="h3-section-subtitle h3-section-subtitle--wide">
          {{ t('pages.minimaxH3.production.subtitle') }}
        </p>

        <div class="h3-production__tags">
          <span v-for="label in useCases" :key="label" class="h3-production__tag">
            <img
              class="h3-production__tag-icon"
              :src="assetUrl('/assets/minimax-h3/icon-sparkling-line.svg')"
              alt=""
              width="13"
              height="13"
              aria-hidden="true"
            />
            {{ label }}
          </span>
        </div>

        <div class="h3-production__gallery">
          <article
            v-for="item in galleryItems"
            :key="item.image"
            class="h3-production__card"
          >
            <div class="h3-production__card-media media-skeleton">
              <img
                :src="assetUrl(item.image)"
                :alt="item.alt"
                width="322"
                height="212"
                loading="lazy"
                @error="hideBrokenImage"
              />
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="h3-faq" aria-labelledby="minimax-h3-faq-title">
      <div class="h3-section-inner">
        <h2 id="minimax-h3-faq-title" class="h3-section-title">
          {{ t('pages.minimaxH3.faq.title') }}
        </h2>

        <div class="h3-faq__list">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="h3-faq__item"
            :class="{ 'is-open': openFaqId === item.id }"
          >
            <button
              type="button"
              class="h3-faq__trigger"
              :aria-expanded="openFaqId === item.id"
              :aria-controls="`minimax-h3-faq-panel-${item.id}`"
              @click="toggleFaq(item.id)"
            >
              <span class="h3-faq__question">{{ item.question }}</span>
              <AppIcon
                :name="openFaqId === item.id ? 'close-line' : 'add-line'"
                :size="24"
                color="#06b6d4"
              />
            </button>
            <div
              v-show="openFaqId === item.id"
              :id="`minimax-h3-faq-panel-${item.id}`"
              class="h3-faq__answer"
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
.h3-page {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: #fff;
  color: #222;
}

.h3-section-inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px;
}

.h3-section-title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
  text-align: center;
}

.h3-section-subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #222;
  text-align: center;
}

.h3-section-subtitle--wide {
  max-width: 942px;
}

.h3-btn {
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
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.h3-btn--primary {
  border: none;
  background: #06b6d4;
  color: #fff;
}

.h3-btn--primary:hover {
  background: #0891b2;
}

.h3-btn--ghost {
  border: 1px solid #ebf4fb;
  background: transparent;
  color: #ebf4fb;
}

.h3-btn--ghost:hover {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.h3-btn--outline {
  border: 1px solid #ebf4fb;
  background: transparent;
  color: #222;
  font-size: 14px;
}

.h3-btn--outline:hover {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
}

.h3-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 460px;
  padding: 120px 16px 80px;
  overflow: hidden;
  background: #000;
  color: #ebf4fb;
}

.h3-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

.h3-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.h3-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.h3-hero__title {
  margin: 0;
  max-width: 1242px;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 900;
  line-height: 1.6;
  color: #fff;
  word-break: break-word;
}

.h3-hero__subtitle {
  margin: 0;
  max-width: 1242px;
  font-size: clamp(16px, 2.2vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
}

.h3-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.h3-api {
  padding: 160px 0 0;
}

.h3-api__tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  margin: 50px auto 0;
  padding: 2px;
  border: 1px solid #ebf4fb;
  border-radius: 30px;
}

.h3-api__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 40px;
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: #f8f8f8;
  color: #929ca5;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
}

.h3-api__tab.is-active {
  background: #222;
  color: #ebf4fb;
}

.h3-api__tab-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  overflow: clip;
}

.h3-api__tab-icon img {
  display: block;
  width: 100%;
  height: 100%;
}

.h3-api__tab.is-active .h3-api__tab-icon {
  filter: brightness(0) invert(1);
}

.h3-api__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 50px;
}

.h3-api__card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 450px;
  border: 1px solid #eee;
  border-radius: 24px;
  overflow: hidden;
}

.h3-api__media {
  display: block;
  width: 100%;
  aspect-ratio: 437 / 270;
  padding: 0;
  border: none;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  background: #f4f7f7;
  cursor: pointer;
}

.h3-api__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h3-api__card-tag {
  margin: 16px 16px 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #06b6d4;
}

.h3-api__card-title {
  margin: 8px 16px 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 40px;
  color: #222;
}

.h3-api__card-body {
  margin: 8px 16px 24px;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.h3-api__skeleton-line {
  display: block;
  margin: 12px 16px 0;
  height: 14px;
  border-radius: 6px;
}

.h3-api__skeleton-line--tag {
  width: 30%;
  margin-top: 16px;
}

.h3-api__skeleton-line--title {
  width: 62%;
  height: 24px;
}

.h3-api__skeleton-line--body {
  width: 88%;
}

.h3-api__skeleton-line--body-short {
  width: 70%;
  margin-bottom: 24px;
}

.h3-modes {
  padding: 160px 0 0;
}

.h3-modes__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-top: 58px;
}

.h3-modes__list {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.h3-modes__item {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  min-height: 124px;
  padding: 36px 24px;
  border: 1px solid #eee;
  border-radius: 24px;
  background: #fff;
}

.h3-modes__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #222;
  transition: background-color 0.2s ease;
}

.h3-modes__item:hover .h3-modes__icon {
  background: #06b6d4;
}

.h3-modes__icon img {
  display: block;
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.h3-modes__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-top: 2px;
}

.h3-modes__item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: #222;
}

.h3-modes__item-body {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.h3-modes__visual {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.h3-modes__refs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.h3-modes__ref {
  position: relative;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.h3-modes__ref.is-dim {
  opacity: 0.5;
}

.h3-modes__ref:hover,
.h3-modes__ref:not(.is-dim) {
  opacity: 1;
}

.h3-modes__ref-media {
  width: 100%;
  aspect-ratio: 107 / 60;
  border-radius: 8px;
  overflow: hidden;
  background: #f4f7f7;
}

.h3-modes__ref-media img,
.h3-modes__ref-media video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h3-modes__ref-badge {
  position: absolute;
  left: 4px;
  bottom: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 4px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
}

.h3-modes__ref-badge img {
  display: block;
  width: 12px;
  height: 12px;
  filter: brightness(0) invert(1);
}

.h3-modes__main {
  width: 100%;
  aspect-ratio: 668 / 376;
  border-radius: 24px;
  overflow: hidden;
  background: #f4f7f7;
}

.h3-modes__main img,
.h3-modes__main video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h3-why {
  padding: 160px 0 0;
}

.h3-why__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-top: 80px;
}

.h3-why__card {
  min-height: 212px;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 24px;
}

.h3-why__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #222;
  transition: background-color 0.2s ease;
}

.h3-why__card:hover .h3-why__icon {
  background: #06b6d4;
}

.h3-why__icon img {
  display: block;
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.h3-why__card-title {
  margin: 16px 0 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: #222;
}

.h3-why__card-body {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.h3-why__cta {
  display: flex;
  width: fit-content;
  min-height: 36px;
  margin: 40px auto 0;
}

.h3-production {
  padding: 160px 0 0;
}

.h3-production__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 60px;
}

.h3-production__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 14px 24px;
  border-radius: 8px;
  background: #f8f8f8;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
}

.h3-production__tag-icon {
  display: block;
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.h3-production__gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-top: 56px;
}

.h3-production__card {
  position: relative;
  min-width: 0;
  border-radius: 24px;
  overflow: hidden;
}

.h3-production__card-media {
  width: 100%;
  aspect-ratio: 322 / 212;
  background: #f4f7f7;
}

.h3-production__card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h3-faq {
  padding: 160px 0 120px;
}

.h3-faq__list {
  margin-top: 40px;
  border-top: 0.5px solid rgba(6, 182, 212, 0.3);
}

.h3-faq__item {
  border-bottom: 0.5px solid rgba(6, 182, 212, 0.3);
}

.h3-faq__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 28px 24px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.h3-faq__question {
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
  color: #222;
}

.h3-faq__item.is-open .h3-faq__question {
  color: #06b6d4;
}

.h3-faq__answer {
  padding: 0 24px 28px;
}

.h3-faq__answer p {
  margin: 0;
  max-width: 1048px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #929ca5;
}

@media (max-width: 1100px) {
  .h3-api__grid,
  .h3-why__grid,
  .h3-production__gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .h3-modes__layout {
    grid-template-columns: 1fr;
  }

  .h3-modes__refs {
    grid-template-columns: repeat(3, minmax(0, 96px));
    gap: 8px;
    justify-content: center;
  }

  .h3-modes__ref-badge {
    height: 20px;
    padding: 2px 4px;
    font-size: 10px;
    line-height: 14px;
  }
}

@media (max-width: 720px) {
  .h3-api,
  .h3-modes,
  .h3-why,
  .h3-production {
    padding-top: 80px;
  }

  .h3-faq {
    padding: 80px 0 64px;
  }

  .h3-hero {
    align-items: center;
    padding: 100px 16px 56px;
  }

  .h3-hero__inner {
    align-items: center;
    text-align: center;
  }

  .h3-hero__actions {
    justify-content: center;
  }

  .h3-api__grid,
  .h3-why__grid,
  .h3-production__gallery {
    grid-template-columns: 1fr;
  }

  .h3-modes__refs {
    grid-template-columns: repeat(3, minmax(0, 80px));
    gap: 6px;
    justify-content: center;
  }

  .h3-api__tabs {
    border-radius: 16px;
  }

  .h3-faq__question {
    font-size: 16px;
    line-height: 1.3;
  }

  .h3-modes__item {
    padding: 24px 16px;
  }
}
</style>
