<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { fetchModelFacets, fetchModels } from '@/api/models'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { assetUrl } from '@/utils/assetUrl'
import { docsUrl, openDocs } from '@/utils/docsUrl'
import { absoluteUrl, SITE_NAME } from '@/seo/config'
import AppIcon from '@/components/common/AppIcon.vue'
import type { BaseModelFacetItem, Model } from '@/types'

/** Card order matches `pages.seedance25.api.cards` */
const API_CARD_CAPABILITIES = [
  'text-to-video',
  'image-to-video',
  'reference-to-video',
] as const

const USE_CASE_IMAGES = [
  'https://assets.varo.cloud/uploads/0c2b949e399546c8b97f05abc71644c8.png',
  'https://assets.varo.cloud/uploads/957423026f224c0dabc2c4cf8dcc28b3.png',
  'https://assets.varo.cloud/uploads/871725660f8d498cace436c6587b100c.png',
  'https://assets.varo.cloud/uploads/bcf21a9d7b8e4497b8e25078a7e03592.png',
] as const

const { t, tm } = useI18n()
const { push, localePath } = useLocaleRouter()

const openFaqId = ref('what')
/** Base model slug from `/models/facets` (e.g. `bytedance-seedance-2-5`) */
const seedance25BaseModel = ref<string | null>(null)
/** Catalog models resolved from `/models?base_model=…`, aligned with API cards */
const apiCardModels = ref<(Model | null)[]>(API_CARD_CAPABILITIES.map(() => null))
const apiCardsLoading = ref(true)

const faqItems = computed(() => {
  const items = tm('pages.seedance25.faq.items') as Array<{
    id: string
    question: string
    answer: string
  }>
  return Array.isArray(items) ? items : []
})

const apiCards = computed(() => {
  const items = tm('pages.seedance25.api.cards') as Array<{
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

const exploreFeatures = computed(() => {
  const items = tm('pages.seedance25.explore.features') as Array<{
    title: string
    body: string
    icon: string
  }>
  return Array.isArray(items) ? items : []
})

const productionPillars = computed(() => {
  const items = tm('pages.seedance25.production.pillars') as Array<{
    title: string
    body: string
    icon: string
  }>
  return Array.isArray(items) ? items : []
})

const compareRows = computed(() => {
  const items = tm('pages.seedance25.compare.rows') as Array<{
    name: string
    recommended?: boolean
    qualityBadge: string
    qualityLabel: string
    durationBadge: string
    durationLabel: string
    audioLabel: string
    inputsLabel: string
    modalities: Array<'text' | 'image' | 'video' | 'audio'>
    active?: boolean
  }>
  return Array.isArray(items) ? items : []
})

const useCaseAlts = computed(() => {
  const items = tm('pages.seedance25.useCases.alts') as string[]
  return Array.isArray(items) ? items : []
})

const useCaseItems = computed(() =>
  USE_CASE_IMAGES.map((src, index) => ({
    src,
    alt: useCaseAlts.value[index] || t('pages.seedance25.useCases.title'),
  })),
)

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
          name: t('pages.seedance25.seo.title'),
          description: t('pages.seedance25.seo.description'),
          url: absoluteUrl(localePath('/seedance-2.5')),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          about: {
            '@type': 'SoftwareApplication',
            name: 'Seedance 2.5',
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
              name: t('nav.seedance25'),
              item: absoluteUrl(localePath('/seedance-2.5')),
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
  if (seedance25BaseModel.value) {
    push({ name: 'models', query: { base_model: seedance25BaseModel.value } })
    return
  }
  push({ name: 'models' })
}

function goToDocs() {
  openDocs(() => push({ name: 'docs' }))
}

function goToModel(slug: string) {
  push({ name: 'model-detail', params: { slug } })
}

function resolveSeedance25BaseModel(baseModels: BaseModelFacetItem[]): string | null {
  const matches = baseModels.filter((m) => /seedance/i.test(m.slug))
  if (matches.length === 0) return null
  const preferred = matches.find((m) => /2[._-]?5/.test(m.slug))
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

async function resolveSeedance25ModelSlugs() {
  apiCardsLoading.value = true
  try {
    const facets = await fetchModelFacets()
    const baseModel = resolveSeedance25BaseModel(facets.base_models)
    seedance25BaseModel.value = baseModel
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
    seedance25BaseModel.value = null
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

const COMPARE_ACTIVE_COLOR = '#06B6D4'
const COMPARE_MUTED_COLOR = '#929CA5'

const MODALITY_ICON_NAMES = {
  text: 'mod-text-on',
  image: 'mod-image-on',
  video: 'mod-video-on',
  audio: 'mod-audio-on',
} as const

onMounted(() => {
  void resolveSeedance25ModelSlugs()
})
</script>

<template>
  <div class="s25-page" data-seo-ready="seedance-2.5">
    <section class="s25-hero" aria-labelledby="seedance-25-hero-title">
      <video
        class="s25-hero__bg"
        src="https://assets.varo.cloud/uploads/39ab792682ba462ca06a984694bd151b.mp4"
        poster="https://assets.varo.cloud/uploads/9314f4a7351e4c57bce5553d16d86e74.jpg"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-hidden="true"
      />
      <div class="s25-hero__overlay" aria-hidden="true" />
      <div class="s25-hero__inner">
        <h1 id="seedance-25-hero-title" class="s25-hero__title">
          {{ t('pages.seedance25.hero.title') }}
        </h1>
        <p class="s25-hero__subtitle">
          {{ t('pages.seedance25.hero.subtitle') }}
        </p>
      </div>
    </section>

    <section
      class="s25-api"
      aria-label="Seedance 2.5 APIs"
      :data-seo-content-ready="apiCardsLoading ? undefined : 'seedance-2.5'"
    >
      <div class="s25-section-inner">
        <div
          v-if="apiCardsLoading"
          class="s25-api__grid"
          aria-busy="true"
          aria-label="Loading"
        >
          <article
            v-for="n in API_CARD_CAPABILITIES.length"
            :key="`api-sk-${n}`"
            class="s25-api__card"
          >
            <div class="s25-api__media media-skeleton" aria-hidden="true" />
            <span class="s25-api__skeleton-line s25-api__skeleton-line--tag media-skeleton" />
            <span class="s25-api__skeleton-line s25-api__skeleton-line--title media-skeleton" />
            <span class="s25-api__skeleton-line s25-api__skeleton-line--body media-skeleton" />
            <span
              class="s25-api__skeleton-line s25-api__skeleton-line--body-short media-skeleton"
            />
          </article>
        </div>
        <div v-else class="s25-api__grid">
          <article
            v-for="(card, index) in apiCards"
            :key="card.title"
            class="s25-api__card"
          >
            <button
              type="button"
              class="s25-api__media"
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
            <p class="s25-api__card-tag">{{ card.tag }}</p>
            <h3 class="s25-api__card-title">{{ card.title }}</h3>
            <p class="s25-api__card-body">{{ card.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="s25-explore" aria-labelledby="seedance-25-explore-title">
      <div class="s25-section-inner">
        <h2 id="seedance-25-explore-title" class="s25-section-title s25-section-title--left">
          {{ t('pages.seedance25.explore.title') }}
        </h2>

        <div class="s25-explore__layout">
          <div class="s25-explore__left">
            <p class="s25-section-subtitle s25-section-subtitle--left">
              {{ t('pages.seedance25.explore.subtitle') }}
            </p>

            <div class="s25-explore__list">
              <article
                v-for="item in exploreFeatures"
                :key="item.title"
                class="s25-explore__item"
              >
                <span
                  class="s25-explore__icon"
                  aria-hidden="true"
                >
                  <img :src="assetUrl(item.icon)" alt="" width="24" height="24" />
                </span>
                <div class="s25-explore__copy">
                  <h3 class="s25-explore__item-title">{{ item.title }}</h3>
                  <p class="s25-explore__item-body">{{ item.body }}</p>
                </div>
              </article>
            </div>
          </div>

          <div
            class="s25-explore__collage"
            :aria-label="t('pages.seedance25.explore.visualAlt')"
          >
            <div class="s25-explore__collage-top">
              <div class="s25-explore__tile s25-explore__tile--large">
                <video
                  src="https://assets.varo.cloud/uploads/218dc7d378d94f9893953c175c8d768f.mp4"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="metadata"
                  aria-hidden="true"
                />
              </div>
              <div class="s25-explore__collage-side">
                <div class="s25-explore__tile">
                  <img
                    src="https://assets.varo.cloud/uploads/bf1770bfb64d4b149a72b62ccfa989ad.jpg"
                    alt=""
                    width="232"
                    height="131"
                  />
                </div>
                <div class="s25-explore__tile">
                  <img
                    src="https://assets.varo.cloud/uploads/a1592ab9456b4d5baa1badbfa3e0d600.jpg"
                    alt=""
                    width="232"
                    height="131"
                  />
                </div>
              </div>
            </div>
            <div class="s25-explore__collage-bottom">
              <div class="s25-explore__tile">
                <img
                  src="https://assets.varo.cloud/uploads/cf8e9d974ecc457c9a4e87ab92bc2a79.jpg"
                  alt=""
                  width="322"
                  height="181"
                />
              </div>
              <div class="s25-explore__tile">
                <img
                  src="https://assets.varo.cloud/uploads/3351dcc7704b4ed088da3996cbe3865d.jpg"
                  alt=""
                  width="322"
                  height="181"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="s25-compare" aria-labelledby="seedance-25-compare-title">
      <div class="s25-section-inner">
        <h2 id="seedance-25-compare-title" class="s25-section-title s25-section-title--left">
          {{ t('pages.seedance25.compare.titleBefore') }}
          <span class="s25-compare__accent">{{ t('pages.seedance25.compare.titleAccent') }}</span>
          {{ t('pages.seedance25.compare.titleAfter') }}
        </h2>
        <p class="s25-section-subtitle s25-section-subtitle--left">
          {{ t('pages.seedance25.compare.subtitle') }}
        </p>

        <div class="s25-compare__table" role="table">
          <div class="s25-compare__head" role="row">
            <div class="s25-compare__cell" role="columnheader">
              {{ t('pages.seedance25.compare.headers.model') }}
            </div>
            <div class="s25-compare__cell" role="columnheader">
              {{ t('pages.seedance25.compare.headers.quality') }}
            </div>
            <div class="s25-compare__cell" role="columnheader">
              {{ t('pages.seedance25.compare.headers.duration') }}
            </div>
            <div class="s25-compare__cell" role="columnheader">
              {{ t('pages.seedance25.compare.headers.audio') }}
            </div>
            <div class="s25-compare__cell" role="columnheader">
              {{ t('pages.seedance25.compare.headers.inputs') }}
            </div>
          </div>

          <div
            v-for="row in compareRows"
            :key="row.name"
            class="s25-compare__row"
            :class="{ 'is-active': row.active }"
            role="row"
          >
            <div class="s25-compare__cell s25-compare__cell--model" role="cell">
              <img
                v-if="row.recommended"
                class="s25-compare__badge-img"
                :src="assetUrl('/assets/icons/recommend.svg')"
                :alt="t('pages.seedance25.compare.recommended')"
                width="132"
                height="29"
              />
              <span class="s25-compare__model-name">{{ row.name }}</span>
            </div>

            <div
              class="s25-compare__cell"
              role="cell"
              :data-label="t('pages.seedance25.compare.headers.quality')"
            >
              <div class="s25-compare__media">
                <img
                  v-if="row.active"
                  class="s25-compare__quality-img"
                  :src="assetUrl('/assets/icons/4k.svg')"
                  :alt="row.qualityBadge"
                  width="62"
                  height="36"
                />
                <AppIcon
                  v-else
                  class="s25-compare__quality-img"
                  name="hd"
                  :width="62"
                  :height="36"
                  colored
                />
              </div>
              <p class="s25-compare__desc">{{ row.qualityLabel }}</p>
            </div>

            <div
              class="s25-compare__cell"
              role="cell"
              :data-label="t('pages.seedance25.compare.headers.duration')"
            >
              <div class="s25-compare__media">
                <img
                  v-if="row.active"
                  class="s25-compare__duration-img"
                  :src="assetUrl('/assets/icons/30s.svg')"
                  :alt="row.durationBadge"
                  width="60"
                  height="60"
                />
                <AppIcon
                  v-else
                  class="s25-compare__duration-img"
                  name="15s"
                  :width="60"
                  :height="60"
                  colored
                />
              </div>
              <p class="s25-compare__desc">{{ row.durationLabel }}</p>
            </div>

            <div
              class="s25-compare__cell"
              role="cell"
              :data-label="t('pages.seedance25.compare.headers.audio')"
            >
              <div class="s25-compare__media">
                <AppIcon
                  class="s25-compare__wave-img"
                  name="waveform-active"
                  :width="70"
                  :height="34"
                  :color="row.active ? COMPARE_ACTIVE_COLOR : COMPARE_MUTED_COLOR"
                />
              </div>
              <p class="s25-compare__desc">{{ row.audioLabel }}</p>
            </div>

            <div
              class="s25-compare__cell"
              role="cell"
              :data-label="t('pages.seedance25.compare.headers.inputs')"
            >
              <div class="s25-compare__media">
                <div class="s25-compare__mods">
                  <span
                    v-for="mod in row.modalities"
                    :key="`${row.name}-${mod}`"
                    class="s25-compare__mod"
                    :class="row.active ? 'is-active' : 'is-muted'"
                  >
                    <AppIcon
                      :name="MODALITY_ICON_NAMES[mod]"
                      :size="24"
                      :color="row.active ? COMPARE_ACTIVE_COLOR : COMPARE_MUTED_COLOR"
                    />
                  </span>
                </div>
              </div>
              <p class="s25-compare__desc">{{ row.inputsLabel }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="s25-why" aria-labelledby="seedance-25-why-title">
      <div class="s25-section-inner">
        <h2 id="seedance-25-why-title" class="s25-section-title">
          {{ t('pages.seedance25.production.title') }}
        </h2>
        <p class="s25-section-subtitle">
          {{ t('pages.seedance25.production.subtitle') }}
        </p>

        <div class="s25-why__grid">
          <article
            v-for="item in productionPillars"
            :key="item.title"
            class="s25-why__card"
          >
            <div class="s25-why__icon" aria-hidden="true">
              <img :src="assetUrl(item.icon)" alt="" width="24" height="24" />
            </div>
            <h3 class="s25-why__card-title">{{ item.title }}</h3>
            <p class="s25-why__card-body">{{ item.body }}</p>
          </article>
        </div>

        <a
          class="s25-btn s25-btn--outline s25-why__cta"
          :href="docsUrl() ?? localePath('/docs')"
          :target="docsUrl() ? '_blank' : undefined"
          :rel="docsUrl() ? 'noopener noreferrer' : undefined"
          @click="
            (event) => {
              if (docsUrl()) return
              event.preventDefault()
              goToDocs()
            }
          "
        >
          {{ t('pages.seedance25.production.cta') }}
        </a>
      </div>
    </section>

    <section class="s25-usecases" aria-labelledby="seedance-25-usecases-title">
      <div class="s25-section-inner">
        <h2 id="seedance-25-usecases-title" class="s25-section-title">
          {{ t('pages.seedance25.useCases.title') }}
        </h2>
        <p class="s25-section-subtitle s25-section-subtitle--wide">
          {{ t('pages.seedance25.useCases.subtitle') }}
        </p>
      </div>

      <div class="s25-usecases__rail" aria-label="Seedance 2.5 use case examples">
        <div class="s25-usecases__track">
          <div
            v-for="copy in 2"
            :key="`use-copy-${copy}`"
            class="s25-usecases__set"
            :aria-hidden="copy === 2"
          >
            <article
              v-for="(item, index) in useCaseItems"
              :key="`use-${copy}-${index}`"
              class="s25-usecases__card"
            >
              <img
                class="s25-usecases__media"
                :src="item.src"
                :alt="copy === 1 ? item.alt : ''"
                width="668"
                height="440"
                loading="lazy"
                decoding="async"
              />
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="s25-faq" aria-labelledby="seedance-25-faq-title">
      <div class="s25-section-inner">
        <h2 id="seedance-25-faq-title" class="s25-section-title">
          {{ t('pages.seedance25.faq.title') }}
        </h2>
        <p class="s25-section-subtitle">
          {{ t('pages.seedance25.faq.subtitle') }}
        </p>

        <div class="s25-faq__list">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="s25-faq__item"
            :class="{ 'is-open': openFaqId === item.id }"
          >
            <button
              type="button"
              class="s25-faq__trigger"
              :aria-expanded="openFaqId === item.id"
              :aria-controls="`seedance-25-faq-panel-${item.id}`"
              @click="toggleFaq(item.id)"
            >
              <span class="s25-faq__question">{{ item.question }}</span>
              <AppIcon
                :name="openFaqId === item.id ? 'close-line' : 'add-line'"
                :size="24"
                color="#06b6d4"
              />
            </button>
            <div
              v-show="openFaqId === item.id"
              :id="`seedance-25-faq-panel-${item.id}`"
              class="s25-faq__answer"
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
.s25-page {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: #fff;
  color: #222;
}

.s25-section-inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px;
}

.s25-section-title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
  text-align: center;
}

.s25-section-title--left {
  text-align: left;
}

.s25-section-subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
  color: #222;
  text-align: center;
}

.s25-section-subtitle--left {
  margin-left: 0;
  margin-right: 0;
  max-width: 637px;
  text-align: left;
}

.s25-section-subtitle--wide {
  max-width: 942px;
}

.s25-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.s25-btn--outline {
  border: 1px solid #ebf4fb;
  background: transparent;
  color: #222;
}

.s25-btn--outline:hover {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
}

.s25-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  padding: 120px 16px 80px;
  overflow: hidden;
  background: #000;
  color: #ebf4fb;
}

.s25-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  background: #1a1a1a;
}

.s25-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.s25-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1242px;
  margin: 0 auto;
  text-align: center;
}

.s25-hero__title {
  margin: 0;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.15;
  color: #ebf4fb;
  word-break: break-word;
}

.s25-hero__subtitle {
  margin: 0;
  max-width: 1242px;
  font-size: clamp(16px, 2.2vw, 20px);
  font-weight: 400;
  line-height: 1.2;
  color: rgba(235, 244, 251, 0.5);
}

.s25-api {
  padding: 80px 0 0;
}

.s25-api__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.s25-api__card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 450px;
  border: 1px solid #eee;
  border-radius: 24px;
  overflow: hidden;
}

.s25-api__media {
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

.s25-api__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.s25-api__card-tag {
  margin: 16px 16px 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #06b6d4;
}

.s25-api__card-title {
  margin: 8px 16px 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 40px;
  color: #222;
}

.s25-api__card-body {
  margin: 8px 16px 24px;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.s25-api__skeleton-line {
  display: block;
  margin: 12px 16px 0;
  height: 14px;
  border-radius: 6px;
}

.s25-api__skeleton-line--tag {
  width: 30%;
  margin-top: 16px;
}

.s25-api__skeleton-line--title {
  width: 62%;
  height: 24px;
}

.s25-api__skeleton-line--body {
  width: 88%;
}

.s25-api__skeleton-line--body-short {
  width: 70%;
  margin-bottom: 24px;
}

.s25-explore {
  padding: 160px 0 0;
}

.s25-explore .s25-section-title--left {
  margin-bottom: 20px;
}

.s25-explore__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}

.s25-explore__left {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  min-height: 0;
}

.s25-explore__left .s25-section-subtitle--left {
  margin-top: 0;
  max-width: none;
}

.s25-explore__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.s25-explore__item {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: flex-start;
  min-height: 124px;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 24px;
  background: #fff;
}

.s25-explore__icon {
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

.s25-explore__item:hover .s25-explore__icon {
  background: #06b6d4;
}

.s25-explore__icon img {
  display: block;
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.s25-explore__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-top: 2px;
}

.s25-explore__item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: #222;
}

.s25-explore__item-body {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.s25-explore__collage {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  height: 100%;
}

.s25-explore__collage-top {
  display: grid;
  flex: 1.58;
  grid-template-columns: 1.77fr 1fr;
  gap: 24px;
  min-height: 0;
}

.s25-explore__collage-side {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
  min-width: 0;
  min-height: 0;
}

.s25-explore__collage-bottom {
  display: grid;
  flex: 1;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 0;
}

.s25-explore__tile {
  min-height: 0;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: #f4f7f7;
}

.s25-explore__tile video,
.s25-explore__tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.s25-explore__tile--large {
  min-height: 0;
}

.s25-compare {
  padding: 160px 0 0;
}

.s25-compare__accent {
  color: #06b6d4;
}

.s25-compare__table {
  margin-top: 40px;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 24px;
}

.s25-compare__head,
.s25-compare__row {
  display: grid;
  grid-template-columns: minmax(180px, 1.15fr) repeat(4, minmax(140px, 1fr));
}

.s25-compare__head {
  border-bottom: 1px solid #eee;
}

.s25-compare__cell {
  padding: 18px 24px;
  border-right: 1px solid #eee;
}

.s25-compare__row .s25-compare__cell:not(.s25-compare__cell--model) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.s25-compare__cell:last-child {
  border-right: none;
}

.s25-compare__head .s25-compare__cell {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #222;
}

.s25-compare__row {
  position: relative;
  min-height: 140px;
  align-items: stretch;
}

.s25-compare__row.is-active {
  background: rgba(6, 182, 212, 0.06);
}

.s25-compare__row.is-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #06b6d4;
}

.s25-compare__row + .s25-compare__row {
  border-top: 1px solid #eee;
}

.s25-compare__cell--model {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.s25-compare__badge-img {
  display: block;
  width: 132px;
  height: 29px;
}

.s25-compare__model-name {
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
  color: #222;
}

.s25-compare__media {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  width: 100%;
  min-height: 60px;
}

.s25-compare__quality-img {
  display: block;
  width: 62px;
  height: 36px;
}

.s25-compare__duration-img {
  display: block;
  width: 60px;
  height: 60px;
}

.s25-compare__mods {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.s25-compare__mod {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid;
  border-radius: 8px;
}

.s25-compare__mod.is-active {
  border-color: rgba(6, 182, 212, 0.4);
  background: #e6fafd;
  color: #06b6d4;
}

.s25-compare__mod.is-muted {
  border-color: rgba(146, 156, 165, 0.4);
  background: rgba(146, 156, 165, 0.1);
  color: #929ca5;
}

.s25-compare__desc {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: #222;
}

.s25-why {
  padding: 160px 0 0;
}

.s25-why__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-top: 60px;
}

.s25-why__card {
  min-height: 188px;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 24px;
}

.s25-why__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #222;
  transition: background-color 0.2s ease;
}

.s25-why__card:hover .s25-why__icon {
  background: #06b6d4;
}

.s25-why__icon img {
  display: block;
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.s25-why__card-title {
  margin: 16px 0 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: #222;
}

.s25-why__card-body {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.s25-why__cta {
  display: flex;
  width: fit-content;
  margin: 40px auto 0;
}

.s25-usecases {
  padding: 160px 0 0;
}

.s25-usecases__rail {
  margin-top: 60px;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
}

.s25-usecases__track {
  display: flex;
  width: max-content;
  animation: s25-usecases-marquee 48s linear infinite;
}

.s25-usecases__rail:hover .s25-usecases__track {
  animation-play-state: paused;
}

.s25-usecases__set {
  display: flex;
  gap: 24px;
  padding-right: 24px;
}

.s25-usecases__card {
  flex: 0 0 668px;
  width: 668px;
  height: 440px;
  border-radius: 24px;
  overflow: hidden;
}

.s25-usecases__media {
  display: block;
  width: 668px;
  height: 440px;
  object-fit: cover;
}

@keyframes s25-usecases-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .s25-usecases__rail {
    overflow-x: auto;
    mask-image: none;
    scrollbar-width: thin;
  }

  .s25-usecases__track {
    animation: none;
  }
}

.s25-faq {
  padding: 160px 0 120px;
}

.s25-faq__list {
  margin-top: 40px;
  border-top: 0.5px solid rgba(6, 182, 212, 0.3);
}

.s25-faq__item {
  border-bottom: 0.5px solid rgba(6, 182, 212, 0.3);
}

.s25-faq__trigger {
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

.s25-faq__question {
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
  color: #222;
}

.s25-faq__item.is-open .s25-faq__question {
  color: #06b6d4;
}

.s25-faq__answer {
  padding: 0 24px 28px;
}

.s25-faq__answer p {
  margin: 0;
  max-width: 1048px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #929ca5;
}

@media (max-width: 1100px) {
  .s25-api__grid,
  .s25-why__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .s25-explore__layout {
    grid-template-columns: 1fr;
  }

  .s25-explore__collage {
    min-height: 420px;
  }

  .s25-explore__collage-top {
    flex: 1.58;
  }

  .s25-explore__collage-bottom {
    flex: 1;
  }

  .s25-compare__head,
  .s25-compare__row {
    grid-template-columns: minmax(140px, 1fr) repeat(4, minmax(0, 1fr));
  }

  .s25-compare__cell {
    padding: 16px;
  }

  .s25-compare__model-name {
    font-size: 18px;
  }

  .s25-compare__desc {
    font-size: 13px;
    line-height: 20px;
  }

  .s25-compare__media {
    min-height: 52px;
  }

  .s25-compare__duration-img {
    width: 52px !important;
    height: 52px !important;
  }

  .s25-compare__wave-img {
    width: 56px !important;
    height: 27px !important;
  }
}

@media (max-width: 900px) {
  .s25-compare__table {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: visible;
    border: none;
    border-radius: 0;
  }

  .s25-compare__head {
    display: none;
  }

  .s25-compare__row {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid #eee;
    border-radius: 24px;
  }

  .s25-compare__row + .s25-compare__row {
    border-top: 1px solid #eee;
  }

  .s25-compare__cell {
    padding: 16px 20px;
    border-right: none;
    border-bottom: 1px solid #eee;
  }

  .s25-compare__cell:last-child {
    border-bottom: none;
  }

  .s25-compare__cell--model {
    gap: 8px;
    padding: 20px;
  }

  .s25-compare__row .s25-compare__cell:not(.s25-compare__cell--model) {
    gap: 8px;
  }

  .s25-compare__cell:not(.s25-compare__cell--model)::before {
    content: attr(data-label);
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
    color: #929ca5;
  }

  .s25-compare__media {
    min-height: 0;
  }

  .s25-compare__badge-img {
    width: min(132px, 70vw);
    height: auto;
  }
}

@media (max-width: 720px) {
  .s25-section-inner {
    padding: 0 16px;
  }

  .s25-api,
  .s25-explore,
  .s25-compare,
  .s25-why,
  .s25-usecases {
    padding-top: 80px;
  }

  .s25-faq {
    padding: 80px 0 64px;
  }

  .s25-hero {
    min-height: 360px;
    padding: 100px 16px 56px;
  }

  .s25-hero__subtitle {
    max-width: 36em;
  }

  .s25-api__grid,
  .s25-why__grid {
    grid-template-columns: 1fr;
  }

  .s25-api__card {
    min-height: 0;
  }

  .s25-api__card-title {
    font-size: 20px;
    line-height: 1.3;
  }

  .s25-section-title--left,
  .s25-section-subtitle--left {
    text-align: center;
  }

  .s25-section-subtitle--left {
    margin-left: auto;
    margin-right: auto;
  }

  .s25-explore__list {
    gap: 16px;
  }

  .s25-explore__item {
    gap: 16px;
    padding: 20px 16px;
  }

  .s25-explore__collage {
    min-height: 280px;
  }

  .s25-explore__collage-top,
  .s25-explore__collage-bottom {
    gap: 12px;
  }

  .s25-explore__collage-side {
    gap: 12px;
  }

  .s25-explore__tile {
    border-radius: 16px;
  }

  .s25-compare__cell {
    padding: 14px 16px;
  }

  .s25-compare__cell--model {
    padding: 16px;
  }

  .s25-compare__model-name {
    font-size: 18px;
  }

  .s25-compare__mods {
    gap: 8px;
  }

  .s25-why__grid {
    gap: 16px;
    margin-top: 40px;
  }

  .s25-why__card {
    min-height: 0;
  }

  .s25-faq__trigger {
    gap: 12px;
    padding: 20px 16px;
  }

  .s25-faq__question {
    font-size: 16px;
    line-height: 1.35;
  }

  .s25-faq__answer {
    padding: 0 16px 20px;
  }

  .s25-faq__answer p {
    font-size: 14px;
    line-height: 1.45;
  }

  .s25-usecases__card {
    flex-basis: min(668px, 85vw);
    width: min(668px, 85vw);
    height: auto;
    aspect-ratio: 668 / 440;
  }

  .s25-usecases__media {
    width: 100%;
    height: 100%;
  }

  .s25-usecases__track {
    animation-duration: 36s;
  }
}
</style>
