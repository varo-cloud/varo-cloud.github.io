<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchModelFacets } from '@/api/models'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { assetUrl } from '@/utils/assetUrl'
import type { PublisherFacetItem } from '@/types'

const PAGE_SIZE = 10
const PAGINATION_MIN = 10
const SKELETON_COUNT = 10

const DEFAULT_COVERS = [
  '/assets/home/showcase-01.png',
  '/assets/home/showcase-02.jpeg',
  '/assets/home/showcase-03.png',
  '/assets/home/showcase-04.png',
  '/assets/home/showcase-05.png',
  '/assets/home/showcase-06.png',
  '/assets/home/showcase-07.png',
  '/assets/home/showcase-08.png',
  '/assets/home/showcase-09.png',
  '/assets/home/showcase-10.png',
] as const

const { t } = useI18n()
const { push } = useLocaleRouter()

const publishers = ref<PublisherFacetItem[]>([])
const page = ref(0)
const loading = ref(true)
const loadedImages = ref<Record<string, boolean>>({})

const showPagination = computed(() => publishers.value.length > PAGINATION_MIN)
const pageCount = computed(() =>
  showPagination.value ? Math.ceil(publishers.value.length / PAGE_SIZE) : 1,
)

const visiblePublishers = computed(() => {
  if (!showPagination.value) return publishers.value
  const start = page.value * PAGE_SIZE
  return publishers.value.slice(start, start + PAGE_SIZE)
})

const items = computed(() =>
  visiblePublishers.value.map((publisher, index) => ({
    slug: publisher.slug,
    name: publisher.name,
    meta: t('pages.home.showcase.itemMeta', { count: publisher.count }),
    image: resolveCover(publisher, page.value * PAGE_SIZE + index),
  })),
)

function resolveCover(publisher: PublisherFacetItem, index: number) {
  const cover = publisher.cover_url?.trim()
  if (cover) return assetUrl(cover)
  return assetUrl(DEFAULT_COVERS[index % DEFAULT_COVERS.length]!)
}

function goPage(next: number) {
  if (!showPagination.value) return
  page.value = Math.min(Math.max(0, next), pageCount.value - 1)
}

function openPublisher(slug: string) {
  push({ name: 'models', query: { publisher: slug } })
}

function onImageLoad(slug: string) {
  // Avoid reassigning when already loaded — inline :ref rebinds each render.
  if (loadedImages.value[slug]) return
  loadedImages.value = { ...loadedImages.value, [slug]: true }
}

function onImageRef(slug: string, el: unknown) {
  const img = el as HTMLImageElement | null
  if (img?.complete && img.naturalWidth > 0) {
    onImageLoad(slug)
  }
}

async function loadPublishers() {
  loading.value = true
  try {
    const data = await fetchModelFacets()
    publishers.value = data.publishers ?? []
    page.value = 0
  } catch {
    publishers.value = []
  } finally {
    loading.value = false
  }
}

watch(page, () => {
  loadedImages.value = {}
})

onMounted(() => {
  void loadPublishers()
})
</script>

<template>
  <section class="home-showcase" aria-labelledby="home-showcase-title">
    <div class="home-showcase__inner">
      <h2 id="home-showcase-title" class="home-showcase__title">
        {{ t('pages.home.showcase.title') }}
      </h2>
      <p class="home-showcase__subtitle">{{ t('pages.home.showcase.subtitle') }}</p>

      <div
        v-if="loading"
        class="home-showcase__grid"
        aria-busy="true"
        aria-label="Loading"
      >
        <div v-for="n in SKELETON_COUNT" :key="n" class="home-showcase__skeleton-card">
          <div class="home-showcase__skeleton-body">
            <span class="home-showcase__skeleton-line home-showcase__skeleton-line--title" />
            <span class="home-showcase__skeleton-line home-showcase__skeleton-line--meta" />
          </div>
        </div>
      </div>
      <div v-else-if="items.length" class="home-showcase__grid">
        <button
          v-for="item in items"
          :key="item.slug"
          type="button"
          class="home-showcase__card"
          @click="openPublisher(item.slug)"
        >
          <img
            class="home-showcase__img"
            :class="{ 'is-loaded': loadedImages[item.slug] }"
            :src="item.image"
            :alt="item.name"
            loading="lazy"
            :ref="(el) => onImageRef(item.slug, el)"
            @load="onImageLoad(item.slug)"
          />
          <div class="home-showcase__body">
            <p class="home-showcase__name">{{ item.name }}</p>
            <p class="home-showcase__meta">{{ item.meta }}</p>
          </div>
        </button>
      </div>

      <div
        v-if="!loading && showPagination && pageCount > 1"
        class="home-showcase__dots"
        role="tablist"
        :aria-label="t('pages.home.showcase.pagination')"
      >
        <button
          v-for="n in pageCount"
          :key="n"
          type="button"
          class="home-showcase__dot"
          :class="{ 'is-active': page === n - 1 }"
          :aria-label="t('pages.home.showcase.page', { n })"
          @click="goPage(n - 1)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-showcase {
  padding: 80px 16px;
  background: rgba(6, 182, 212, 0.04);
}

.home-showcase__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  text-align: center;
}

.home-showcase__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #222;
}

.home-showcase__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #9b9dab;
}

.home-showcase__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.home-showcase__card {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  padding: 0;
  aspect-ratio: 1;
  border: 0;
  border-radius: 20px;
  background: #eceef2;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease;
}

.home-showcase__card:hover {
  transform: translateY(-2px);
}

.home-showcase__card:hover .home-showcase__img.is-loaded {
  transform: scale(1.04);
}

.home-showcase__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition:
    opacity 0.35s ease,
    transform 0.25s ease;
}

.home-showcase__img.is-loaded {
  opacity: 1;
}

.home-showcase__body {
  position: absolute;
  inset: auto 0 0;
  padding: 14px 16px 16px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  text-align: left;
  border-radius: 0 0 20px 20px;
}

.home-showcase__name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.home-showcase__meta {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.home-showcase__skeleton-card {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 20px;
  background: linear-gradient(90deg, #e8eaee 25%, #dde0e6 37%, #e8eaee 63%);
  background-size: 400% 100%;
  animation: home-showcase-shimmer 1.4s ease infinite;
}

.home-showcase__skeleton-body {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 16px;
  background: rgba(255, 255, 255, 0.35);
}

.home-showcase__skeleton-line {
  display: block;
  height: 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.75);
}

.home-showcase__skeleton-line--title {
  width: 58%;
  height: 14px;
}

.home-showcase__skeleton-line--meta {
  width: 36%;
}

.home-showcase__dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 28px;
}

.home-showcase__dot {
  width: 40px;
  height: 6px;
  border: 0;
  border-radius: 2px;
  background: #eee;
  cursor: pointer;
  transition: background 0.15s ease;
}

.home-showcase__dot:hover:not(.is-active) {
  background: #d0d0d0;
}

.home-showcase__dot.is-active {
  background: #06b6d4;
}

@keyframes home-showcase-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@media (max-width: 1100px) {
  .home-showcase__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .home-showcase {
    padding: 56px 16px;
  }

  .home-showcase__subtitle {
    font-size: 14px;
  }

  .home-showcase__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .home-showcase__body {
    padding: 10px 12px 12px;
  }

  .home-showcase__name {
    font-size: 13px;
  }

  .home-showcase__meta {
    font-size: 11px;
  }
}
</style>
