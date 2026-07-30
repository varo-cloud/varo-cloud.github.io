<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import { absoluteUrl, SITE_NAME } from '@/seo/config'
import HighlightedCodeBlock from '@/components/common/HighlightedCodeBlock.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { buildApiSubmitSnippet } from '@/utils/playground-request-snippets'

const DEMO_MODEL_SLUG = 'seedance-2.0/image-to-video'
const DEMO_FORM_VALUES = {
  prompt: 'A cinematic shot of a futuristic city at sunset',
  image_url: 'https://example.com/input.jpg',
  duration: 8,
  resolution: '720p',
}

const { t, tm } = useI18n()
const { push, localePath } = useLocaleRouter()
const userStore = useUserStore()

const openFaqId = ref('fast')
const activeCapability = ref(0)

const faqItems = computed(() => {
  const items = tm('pages.seedance.faq.items') as Array<{
    id: string
    question: string
    answer: string
  }>
  return Array.isArray(items) ? items : []
})

const apiCards = computed(() => {
  const items = tm('pages.seedance.api.cards') as Array<{
    title: string
    body: string
    image: string
    alt: string
  }>
  return Array.isArray(items) ? items : []
})

const capabilities = computed(() => {
  const items = tm('pages.seedance.capabilities.items') as Array<{
    title: string
    body: string
    image: string
    alt: string
  }>
  return Array.isArray(items) ? items : []
})

const productionPillars = computed(() => {
  const items = tm('pages.seedance.production.pillars') as Array<{
    title: string
    body: string
  }>
  return Array.isArray(items) ? items : []
})

const radarCharts = computed(() => [
  {
    src: '/assets/seedance/radar-t2v.png',
    alt: t('pages.seedance.compare.radarT2vAlt'),
  },
  {
    src: '/assets/seedance/radar-multimodal.png',
    alt: t('pages.seedance.compare.radarMultimodalAlt'),
  },
  {
    src: '/assets/seedance/radar-i2v.png',
    alt: t('pages.seedance.compare.radarI2vAlt'),
  },
])

const showcaseVideos = computed(() => [
  {
    src: 'https://assets.varo.cloud/uploads/06bdbd37070e4399a852d1c8541558fd.mp4',
    poster: '/assets/seedance/showcase-left.jpg',
    alt: t('pages.seedance.showcase.leftAlt'),
  },
  {
    src: 'https://assets.varo.cloud/uploads/8ff67138af824c82a40d74d421dee9cf.mp4',
    poster: '/assets/seedance/showcase-center.jpg',
    alt: t('pages.seedance.showcase.centerAlt'),
  },
  {
    src: 'https://assets.varo.cloud/uploads/06abd5159b5846ffad0116011586dd12.mp4',
    poster: '/assets/seedance/showcase-right.jpg',
    alt: t('pages.seedance.showcase.rightAlt'),
  },
])

/** [lastClone, ...items, firstClone] — enables infinite loop peeks */
const showcaseLoopItems = computed(() => {
  const items = showcaseVideos.value
  const n = items.length
  if (n === 0) return []
  return [
    { ...items[n - 1], key: 'clone-start' },
    ...items.map((item, i) => ({ ...item, key: `real-${i}` })),
    { ...items[0], key: 'clone-end' },
  ]
})

const showcaseGalleryRef = ref<HTMLElement | null>(null)
const showcaseVideoEls = ref<(HTMLVideoElement | null)[]>([])
/** DOM index into showcaseLoopItems (real items are 1..n) */
const activeShowcaseIndex = ref(2)
let showcaseScrollRaf = 0
let showcaseSettleTimer = 0
let showcaseJumping = false
let showcasePlayingIndex = -1

function setShowcaseVideoEl(el: unknown, index: number) {
  showcaseVideoEls.value[index] = el instanceof HTMLVideoElement ? el : null
}

function findClosestShowcaseIndex() {
  const gallery = showcaseGalleryRef.value
  if (!gallery) return -1

  const centerX = gallery.scrollLeft + gallery.clientWidth / 2
  let best = 0
  let bestDist = Number.POSITIVE_INFINITY
  const frames = gallery.querySelectorAll<HTMLElement>('.seedance-showcase__frame')
  frames.forEach((frame, index) => {
    const mid = frame.offsetLeft + frame.offsetWidth / 2
    const dist = Math.abs(mid - centerX)
    if (dist < bestDist) {
      bestDist = dist
      best = index
    }
  })
  return best
}

function updateShowcasePlayback(activeDomIndex: number) {
  if (showcasePlayingIndex === activeDomIndex) return
  showcasePlayingIndex = activeDomIndex
  showcaseVideoEls.value.forEach((video, index) => {
    if (!video) return
    if (index === activeDomIndex) {
      void video.play().catch(() => {})
      return
    }
    video.pause()
  })
}

function scrollShowcaseTo(index: number, behavior: ScrollBehavior = 'smooth') {
  const gallery = showcaseGalleryRef.value
  const frame = gallery?.querySelectorAll<HTMLElement>('.seedance-showcase__frame')[index]
  if (!gallery || !frame) return
  const left = frame.offsetLeft - (gallery.clientWidth - frame.offsetWidth) / 2
  gallery.scrollTo({ left, behavior })
}

function syncVideoTime(fromIndex: number, toIndex: number) {
  const from = showcaseVideoEls.value[fromIndex]
  const to = showcaseVideoEls.value[toIndex]
  if (!from || !to) return
  try {
    if (Number.isFinite(from.currentTime)) to.currentTime = from.currentTime
  } catch {
    // Ignore seek errors while metadata is still loading.
  }
}

function jumpShowcaseTo(index: number, fromIndex?: number) {
  const gallery = showcaseGalleryRef.value
  if (!gallery) return
  showcaseJumping = true
  if (showcaseSettleTimer) {
    window.clearTimeout(showcaseSettleTimer)
    showcaseSettleTimer = 0
  }
  if (fromIndex != null) syncVideoTime(fromIndex, index)
  gallery.style.scrollSnapType = 'none'
  scrollShowcaseTo(index, 'auto')
  activeShowcaseIndex.value = index
  updateShowcasePlayback(index)
  // Double rAF so layout settles before re-enabling snap (avoids snap bounce flash)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gallery.style.scrollSnapType = ''
      showcaseJumping = false
    })
  })
}

function settleShowcase() {
  if (showcaseJumping) return
  const n = showcaseVideos.value.length
  if (n === 0) return

  const best = findClosestShowcaseIndex()
  if (best < 0) return

  // Landed on clones → teleport to the matching real slide
  if (best === 0) {
    jumpShowcaseTo(n, 0)
    return
  }
  if (best === n + 1) {
    jumpShowcaseTo(1, n + 1)
    return
  }

  activeShowcaseIndex.value = best
  updateShowcasePlayback(best)
}

function onShowcaseScroll() {
  if (showcaseJumping) return
  if (showcaseScrollRaf) cancelAnimationFrame(showcaseScrollRaf)
  showcaseScrollRaf = requestAnimationFrame(() => {
    const n = showcaseVideos.value.length
    const best = findClosestShowcaseIndex()
    // Only update dimming during scroll — never play/pause mid-swipe
    if (best > 0 && best < n + 1) {
      activeShowcaseIndex.value = best
    }
    if (showcaseSettleTimer) window.clearTimeout(showcaseSettleTimer)
    showcaseSettleTimer = window.setTimeout(settleShowcase, 140)
  })
}

function onShowcaseFrameClick(domIndex: number) {
  if (domIndex === activeShowcaseIndex.value) return
  scrollShowcaseTo(domIndex, 'smooth')
}

function centerShowcaseOnMount() {
  // Real center item is at DOM index 2 (after start clone)
  jumpShowcaseTo(2)
}

function onShowcaseResize() {
  jumpShowcaseTo(activeShowcaseIndex.value)
}

const codeSnippet = computed(() =>
  buildApiSubmitSnippet('http', DEMO_MODEL_SLUG, DEMO_FORM_VALUES),
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
          name: t('pages.seedance.seo.title'),
          description: t('pages.seedance.seo.description'),
          url: absoluteUrl(localePath('/seedance')),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          about: {
            '@type': 'SoftwareApplication',
            name: 'Seedance 2.0',
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
              name: t('nav.seedance'),
              item: absoluteUrl(localePath('/seedance')),
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
  push({ name: 'models' })
}

function goToApiKey() {
  if (userStore.isLoggedIn) {
    push({ name: 'api-keys' })
    return
  }
  push({ name: 'auth', query: { redirect: localePath('/seedance') } })
}

function goToModel(slug: string) {
  push({ name: 'model-detail', params: { slug } })
}

onMounted(() => {
  void nextTick(() => {
    centerShowcaseOnMount()
  })
  window.addEventListener('resize', onShowcaseResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onShowcaseResize)
  if (showcaseScrollRaf) cancelAnimationFrame(showcaseScrollRaf)
  if (showcaseSettleTimer) window.clearTimeout(showcaseSettleTimer)
  showcaseVideoEls.value.forEach((video) => video?.pause())
})
</script>

<template>
  <div class="seedance-page" data-seo-ready="seedance">
    <section class="seedance-hero" aria-labelledby="seedance-hero-title">
      <video
        class="seedance-hero__bg"
        src="https://assets.varo.cloud/uploads/43a6c0c41a9743c38467752da30d97c9.mp4"
        poster="https://assets.varo.cloud/uploads/a8f463d3aad5488e9a3ddc645014d0bd.jpg"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-hidden="true"
      />
      <div class="seedance-hero__overlay" aria-hidden="true" />
      <div class="seedance-hero__inner">
        <h1 id="seedance-hero-title" class="seedance-hero__title">
          {{ t('pages.seedance.hero.title') }}
        </h1>
        <p class="seedance-hero__subtitle">
          {{ t('pages.seedance.hero.subtitle') }}
        </p>
      </div>
    </section>

    <section class="seedance-intro" aria-labelledby="seedance-intro-title">
      <div class="seedance-intro__inner">
        <h2 id="seedance-intro-title" class="visually-hidden">
          {{ t('pages.seedance.intro.hiddenTitle') }}
        </h2>
        <p class="seedance-intro__lead">
          {{ t('pages.seedance.intro.lead') }}
        </p>
        <div class="seedance-intro__media">
          <video
            src="https://assets.varo.cloud/uploads/022c851efc694a38bc0f6d00e51e6e00.mp4"
            :poster="assetUrl('/assets/seedance/intro-left.jpg')"
            :aria-label="t('pages.seedance.intro.leftAlt')"
            width="672"
            height="378"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
          />
          <video
            src="https://assets.varo.cloud/uploads/e6be9ec1198440689cbf72f1196077e4.mp4"
            :poster="assetUrl('/assets/seedance/intro-right.jpg')"
            :aria-label="t('pages.seedance.intro.rightAlt')"
            width="672"
            height="378"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
          />
        </div>
      </div>
    </section>

    <section class="seedance-api" aria-labelledby="seedance-api-title">
      <div class="seedance-section-inner">
        <h2 id="seedance-api-title" class="seedance-section-title">
          {{ t('pages.seedance.api.title') }}
        </h2>
        <p class="seedance-section-subtitle">
          {{ t('pages.seedance.api.subtitle') }}
        </p>

        <div class="seedance-api__grid">
          <article
            v-for="(card, index) in apiCards"
            :key="card.title"
            class="seedance-api__card"
          >
            <button
              type="button"
              class="seedance-api__media"
              @click="
                goToModel(
                  index === 0
                    ? 'seedance-2.0/text-to-video'
                    : index === 1
                      ? 'seedance-2.0/image-to-video'
                      : 'seedance-2.0/image-to-video',
                )
              "
            >
              <img
                :src="assetUrl(card.image)"
                :alt="card.alt"
                width="437"
                height="270"
              />
            </button>
            <h3 class="seedance-api__card-title">{{ card.title }}</h3>
            <p class="seedance-api__card-body">{{ card.body }}</p>
          </article>
        </div>

        <button type="button" class="seedance-api__cta" @click="goToModels">
          {{ t('pages.seedance.api.cta') }}
        </button>
      </div>
    </section>

    <section class="seedance-capabilities" aria-labelledby="seedance-capabilities-title">
      <div class="seedance-section-inner">
        <h2 id="seedance-capabilities-title" class="seedance-section-title">
          {{ t('pages.seedance.capabilities.title') }}
        </h2>
        <p class="seedance-section-subtitle">
          {{ t('pages.seedance.capabilities.subtitle') }}
        </p>

        <div class="seedance-capabilities__list">
          <article
            v-for="(item, index) in capabilities"
            :key="item.title"
            class="seedance-capabilities__row"
            :class="{ 'is-active': activeCapability === index }"
            @mouseenter="activeCapability = index"
            @focusin="activeCapability = index"
          >
            <div class="seedance-capabilities__copy">
              <span class="seedance-capabilities__bar" aria-hidden="true" />
              <div class="seedance-capabilities__text">
                <h3>{{ item.title }}</h3>
                <p>{{ item.body }}</p>
              </div>
            </div>
            <div class="seedance-capabilities__media">
              <img
                :src="assetUrl(item.image)"
                :alt="item.alt"
                width="437"
                height="270"
              />
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="seedance-compare" aria-labelledby="seedance-compare-title">
      <div class="seedance-section-inner">
        <h2 id="seedance-compare-title" class="seedance-section-title">
          {{ t('pages.seedance.compare.title') }}
        </h2>
        <p class="seedance-section-subtitle">
          {{ t('pages.seedance.compare.subtitle') }}
        </p>
        <div class="seedance-compare__charts">
          <img
            v-for="chart in radarCharts"
            :key="chart.src"
            class="seedance-compare__chart"
            :src="assetUrl(chart.src)"
            :alt="chart.alt"
            width="560"
            height="472"
            loading="lazy"
          />
        </div>
      </div>
    </section>

    <section class="seedance-production" aria-labelledby="seedance-production-title">
      <div class="seedance-section-inner">
        <h2 id="seedance-production-title" class="seedance-section-title">
          {{ t('pages.seedance.production.title') }}
        </h2>
        <p class="seedance-section-subtitle seedance-section-subtitle--wide">
          {{ t('pages.seedance.production.subtitle') }}
        </p>

        <div class="seedance-production__pillars">
          <div
            v-for="pillar in productionPillars"
            :key="pillar.title"
            class="seedance-production__pillar"
          >
            <div class="seedance-production__icon" aria-hidden="true">
              <img
                :src="assetUrl('/assets/seedance/lock-icon.svg')"
                alt=""
                width="24"
                height="24"
              />
            </div>
            <p class="seedance-production__pillar-title">{{ pillar.title }}</p>
            <p class="seedance-production__pillar-body">{{ pillar.body }}</p>
          </div>
        </div>

        <div class="seedance-production__panel">
          <div class="seedance-production__code">
            <HighlightedCodeBlock :code="codeSnippet" language="http" />
            <button type="button" class="seedance-production__cta" @click="goToApiKey">
              {{ t('pages.seedance.production.cta') }}
            </button>
          </div>
          <div class="seedance-production__visual">
            <video
              src="https://assets.varo.cloud/uploads/67ae104a1d7d4f50b76052a0f6d3f329.mp4"
              :poster="assetUrl('/assets/seedance/production-visual.jpg')"
              :aria-label="t('pages.seedance.production.visualAlt')"
              width="767"
              height="430"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="seedance-showcase" aria-labelledby="seedance-showcase-title">
      <div class="seedance-section-inner">
        <h2 id="seedance-showcase-title" class="seedance-section-title">
          {{ t('pages.seedance.showcase.title') }}
        </h2>
        <p class="seedance-section-subtitle seedance-section-subtitle--wide">
          {{ t('pages.seedance.showcase.subtitle') }}
        </p>
      </div>
      <div
        ref="showcaseGalleryRef"
        class="seedance-showcase__gallery"
        role="list"
        tabindex="0"
        @scroll.passive="onShowcaseScroll"
      >
        <button
          v-for="(item, index) in showcaseLoopItems"
          :key="item.key"
          type="button"
          class="seedance-showcase__frame"
          :class="{ 'is-active': activeShowcaseIndex === index }"
          role="listitem"
          :aria-current="activeShowcaseIndex === index ? 'true' : undefined"
          :aria-label="item.alt"
          @click="onShowcaseFrameClick(index)"
        >
          <video
            :ref="(el) => setShowcaseVideoEl(el, index)"
            :src="item.src"
            :poster="assetUrl(item.poster)"
            muted
            loop
            playsinline
            preload="auto"
            tabindex="-1"
          />
        </button>
      </div>
    </section>

    <section class="seedance-faq" aria-labelledby="seedance-faq-title">
      <div class="seedance-section-inner">
        <h2 id="seedance-faq-title" class="seedance-section-title">
          {{ t('pages.seedance.faq.title') }}
        </h2>

        <div class="seedance-faq__list">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="seedance-faq__item"
            :class="{ 'is-open': openFaqId === item.id }"
          >
            <button
              type="button"
              class="seedance-faq__trigger"
              :aria-expanded="openFaqId === item.id"
              :aria-controls="`seedance-faq-panel-${item.id}`"
              @click="toggleFaq(item.id)"
            >
              <span class="seedance-faq__question">{{ item.question }}</span>
              <AppIcon
                :name="openFaqId === item.id ? 'close-line' : 'add-line'"
                :size="24"
                color="#06b6d4"
              />
            </button>
            <div
              v-show="openFaqId === item.id"
              :id="`seedance-faq-panel-${item.id}`"
              class="seedance-faq__answer"
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
.seedance-page {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: #fff;
  color: #222;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.seedance-section-inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px;
}

.seedance-section-title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
  text-align: center;
}

.seedance-section-subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #222;
  text-align: center;
}

.seedance-section-subtitle--wide {
  max-width: 1144px;
}

.seedance-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 724px;
  padding: 120px 16px 80px;
  overflow: hidden;
  background: #0a0a0e;
  color: #ebf4fb;
}

.seedance-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

.seedance-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.seedance-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1242px;
  text-align: center;
}

.seedance-hero__title {
  margin: 0;
  width: 100%;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.14;
  color: #ebf4fb;
  word-break: break-word;
}

.seedance-hero__subtitle {
  margin: 0;
  max-width: 1040px;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 400;
  line-height: 1.2;
  color: rgba(235, 244, 251, 0.5);
}

.seedance-intro {
  padding: 80px 16px 0;
}

.seedance-intro__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.seedance-intro__lead {
  margin: 0 auto;
  max-width: 1044px;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 500;
  line-height: 1.4;
  color: #222;
  text-align: center;
}

.seedance-intro__media {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 60px;
}

.seedance-intro__media img,
.seedance-intro__media video {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 672 / 378;
  object-fit: cover;
  border-radius: 16px;
}

.seedance-api {
  padding: 120px 0 0;
}

.seedance-api__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 60px;
}

.seedance-api__card {
  min-width: 0;
}

.seedance-api__media {
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  background: #f4f7f7;
  cursor: pointer;
}

.seedance-api__media img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 437 / 270;
  object-fit: cover;
}

.seedance-api__card-title {
  margin: 20px 0 0;
  padding: 0 16px 0 16px;
  font-size: 24px;
  font-weight: 700;
  line-height: 40px;
  color: #222;
}

.seedance-api__card-body {
  margin: 8px 0 0;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.seedance-api__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 36px;
  margin: 40px auto 0;
  padding: 12px 24px;
  border: 1px solid #ebf4fb;
  border-radius: 8px;
  background: transparent;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.seedance-api__cta:hover {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
}

.seedance-capabilities {
  padding: 120px 0 0;
}

.seedance-capabilities__list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 60px;
}

.seedance-capabilities__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 437px;
  gap: 40px;
  align-items: stretch;
  min-height: 270px;
}

.seedance-capabilities__copy {
  display: flex;
  gap: 20px;
  align-items: center;
  min-width: 0;
}

.seedance-capabilities__bar {
  flex-shrink: 0;
  width: 4px;
  align-self: stretch;
  background: #eee;
  transition: background 0.2s ease;
}

.seedance-capabilities__row.is-active .seedance-capabilities__bar {
  background: #06b6d4;
}

.seedance-capabilities__text h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 40px;
  color: #222;
}

.seedance-capabilities__text p {
  margin: 8px 0 0;
  max-width: 433px;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #222;
}

.seedance-capabilities__media {
  overflow: hidden;
  width: 100%;
  aspect-ratio: 437 / 270;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: #f4f7f7;
}

.seedance-capabilities__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seedance-compare {
  padding: 120px 0 0;
}

.seedance-compare__charts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 40px;
}

.seedance-compare__chart {
  display: block;
  width: 100%;
  height: auto;
}

.seedance-production {
  padding: 120px 0 0;
}

.seedance-production__pillars {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 60px;
  padding: 44px 24px;
  border: 1px solid #eee;
  border-radius: 24px;
}

.seedance-production__pillar {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.seedance-production__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  overflow: clip;
}

.seedance-production__icon img {
  display: block;
  width: 24px;
  height: 24px;
}

.seedance-production__pillar-title {
  margin: 12px 0 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #000;
}

.seedance-production__pillar-body {
  margin: 8px 0 0;
  max-width: 224px;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #929ca5;
}

.seedance-production__panel {
  display: grid;
  grid-template-columns: minmax(0, 577px) minmax(0, 1fr);
  gap: 16px;
  margin-top: 40px;
}

.seedance-production__code {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  min-height: 430px;
  padding: 40px;
  box-sizing: border-box;
  background: #f4f7f7;
}

.seedance-production__code :deep(.highlighted-code-block) {
  flex: 1;
  height: auto;
  min-height: 0;
  overflow: auto;
  border: 0;
  background: transparent;
  color: #222;
  padding: 0;
}

.seedance-production__code :deep(.hljs) {
  color: #222;
  background: transparent;
  padding: 0;
}

.seedance-production__code :deep(.hljs-comment),
.seedance-production__code :deep(.hljs-quote) {
  color: #6a9955;
}

.seedance-production__code :deep(.hljs-keyword),
.seedance-production__code :deep(.hljs-selector-tag),
.seedance-production__code :deep(.hljs-meta) {
  color: #dcdcaa;
}

.seedance-production__code :deep(.hljs-string),
.seedance-production__code :deep(.hljs-regexp),
.seedance-production__code :deep(.hljs-symbol),
.seedance-production__code :deep(.hljs-template-tag),
.seedance-production__code :deep(.hljs-template-variable) {
  color: #ce9178;
}

.seedance-production__code :deep(.hljs-number),
.seedance-production__code :deep(.hljs-literal),
.seedance-production__code :deep(.hljs-built_in),
.seedance-production__code :deep(.hljs-type) {
  color: #b45309;
}

.seedance-production__code :deep(.hljs-title),
.seedance-production__code :deep(.hljs-title.class_),
.seedance-production__code :deep(.hljs-title.function_),
.seedance-production__code :deep(.hljs-name),
.seedance-production__code :deep(.hljs-attr),
.seedance-production__code :deep(.hljs-attribute),
.seedance-production__code :deep(.hljs-property) {
  color: #61afef;
}

.seedance-production__code :deep(.hljs-variable),
.seedance-production__code :deep(.hljs-params),
.seedance-production__code :deep(.hljs-subst) {
  color: #222;
}

.seedance-production__code :deep(.hljs-punctuation),
.seedance-production__code :deep(.hljs-operator) {
  color: #64748b;
}

.seedance-production__code :deep(.hljs-section),
.seedance-production__code :deep(.hljs-bullet) {
  color: #06b6d4;
}

.seedance-production__cta {
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

.seedance-production__cta:hover {
  background: rgba(6, 182, 212, 0.18);
}

.seedance-production__visual {
  overflow: hidden;
  border-radius: 0;
  background: #0a0f13;
}

.seedance-production__visual img,
.seedance-production__visual video {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 430px;
  object-fit: cover;
}

.seedance-showcase {
  padding: 120px 0 0;
  overflow: hidden;
}

.seedance-showcase__gallery {
  display: flex;
  gap: 12px;
  margin-top: 60px;
  padding-inline: max(16px, calc((100% - min(72vw, 1360px)) / 2));
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: max(16px, calc((100% - min(72vw, 1360px)) / 2));
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  outline: none;
}

.seedance-showcase__gallery::-webkit-scrollbar {
  display: none;
}

.seedance-showcase__frame {
  position: relative;
  flex: 0 0 min(72vw, 1360px);
  height: min(62vw, 765px);
  padding: 0;
  border: 0;
  overflow: hidden;
  background: #111;
  scroll-snap-align: center;
  cursor: pointer;
  opacity: 0.72;
}

.seedance-showcase__frame.is-active {
  opacity: 1;
  cursor: default;
}

.seedance-showcase__frame video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  background: #111;
}

.seedance-faq {
  padding: 120px 0 120px;
}

.seedance-faq__list {
  margin-top: 60px;
  border-top: 0.5px solid rgba(6, 182, 212, 0.3);
}

.seedance-faq__item {
  border-bottom: 0.5px solid rgba(6, 182, 212, 0.3);
}

.seedance-faq__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  padding: 28px 24px;
  border: 0;
  background: transparent;
  color: #222;
  text-align: left;
  cursor: pointer;
}

.seedance-faq__item.is-open .seedance-faq__question {
  color: #06b6d4;
}

.seedance-faq__question {
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 500;
  line-height: 1.3;
}

.seedance-faq__answer {
  padding: 0 24px 28px;
}

.seedance-faq__answer p {
  margin: 0;
  max-width: 1048px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #929ca5;
}

@media (max-width: 1200px) {
  .seedance-capabilities__row {
    grid-template-columns: 1fr;
  }

  .seedance-capabilities__media {
    max-width: 560px;
  }

  .seedance-production__panel {
    grid-template-columns: 1fr;
  }

  .seedance-showcase__frame {
    flex-basis: min(86vw, 900px);
    height: min(110vw, 560px);
    border-radius: 16px;
  }

  .seedance-showcase__gallery {
    padding-inline: max(16px, calc((100% - min(86vw, 900px)) / 2));
    scroll-padding-inline: max(16px, calc((100% - min(86vw, 900px)) / 2));
  }
}

@media (max-width: 900px) {
  .seedance-hero {
    min-height: 520px;
    padding: 120px 16px 64px;
  }

  .seedance-intro__media,
  .seedance-api__grid,
  .seedance-compare__charts,
  .seedance-production__pillars {
    grid-template-columns: 1fr;
  }

  .seedance-api,
  .seedance-capabilities,
  .seedance-compare,
  .seedance-production,
  .seedance-showcase {
    padding-top: 80px;
  }

  .seedance-faq {
    padding: 80px 0;
  }

  .seedance-api__card-title,
  .seedance-capabilities__text h3 {
    line-height: 1.3;
  }

  .seedance-faq__trigger {
    padding: 20px 8px;
  }

  .seedance-faq__answer {
    padding: 0 8px 20px;
  }
}
</style>
