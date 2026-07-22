<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchModelFacets, fetchModels } from '@/api/models'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { formatCapabilityLabel } from '@/utils/capability'
import type { FacetItem, Model, PublisherFacetItem } from '@/types'
import HomeFeaturedCard from '@/components/home/HomeFeaturedCard.vue'
import ArrowRightIcon from '@/components/icons/ArrowRightIcon.vue'

const FEATURED_LIMIT = 4
/** Avoid flooding the chip row when many publishers exist. */
const PUBLISHER_CHIP_LIMIT = 12
const SKELETON_CARD_COUNT = 4
const SKELETON_CHIP_COUNT = 8

type ChipKind = 'capability' | 'category' | 'publisher'

interface FeaturedChip {
  id: string
  kind: ChipKind
  value: string
  label: string
  count: number
}

const { t, te } = useI18n()
const { push } = useLocaleRouter()

const categories = ref<FacetItem[]>([])
const capabilities = ref<FacetItem[]>([])
const publishers = ref<PublisherFacetItem[]>([])
const models = ref<Model[]>([])
const modelsLoading = ref(true)
const facetsLoading = ref(true)

const chips = computed(() => {
  const items: FeaturedChip[] = []

  for (const item of capabilities.value) {
    items.push({
      id: `capability:${item.value}`,
      kind: 'capability',
      value: item.value,
      label: capabilityLabel(item.value),
      count: item.count,
    })
  }

  for (const item of categories.value) {
    items.push({
      id: `category:${item.value}`,
      kind: 'category',
      value: item.value,
      label: categoryLabel(item.value),
      count: item.count,
    })
  }

  const topPublishers = [...publishers.value]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, PUBLISHER_CHIP_LIMIT)

  for (const item of topPublishers) {
    items.push({
      id: `publisher:${item.slug}`,
      kind: 'publisher',
      value: item.slug,
      label: item.name,
      count: item.count,
    })
  }

  return items
})

const displayModels = computed(() => models.value)

function capabilityLabel(value: string) {
  const key = `pages.models.capabilities.${value}`
  return te(key) ? t(key) : formatCapabilityLabel(value)
}

function categoryLabel(value: string) {
  const key = `pages.models.categories.${value}`
  return te(key) ? t(key) : formatCapabilityLabel(value)
}

async function loadFacets() {
  facetsLoading.value = true
  try {
    const data = await fetchModelFacets()
    categories.value = data.categories ?? []
    capabilities.value = data.capabilities ?? []
    publishers.value = data.publishers ?? []
  } catch {
    categories.value = []
    capabilities.value = []
    publishers.value = []
  } finally {
    facetsLoading.value = false
  }
}

async function loadModels() {
  modelsLoading.value = true
  try {
    const page = await fetchModels({ offset: 0, limit: FEATURED_LIMIT })
    models.value = page.items
  } catch {
    models.value = []
  } finally {
    modelsLoading.value = false
  }
}

function openChip(chip: FeaturedChip) {
  const query: Record<string, string> = {}
  if (chip.kind === 'capability') query.capability = chip.value
  if (chip.kind === 'category') query.category = chip.value
  if (chip.kind === 'publisher') query.publisher = chip.value
  push({ name: 'models', query })
}

function goModels() {
  push({ name: 'models' })
}

onMounted(() => {
  void loadFacets()
  void loadModels()
})
</script>

<template>
  <section class="home-featured" aria-labelledby="home-featured-title">
    <div class="home-featured__inner">
      <p class="home-featured__eyebrow">{{ t('pages.home.featured.eyebrow') }}</p>
      <h2 id="home-featured-title" class="home-featured__title">
        {{ t('pages.home.featured.title') }}
      </h2>
      <p class="home-featured__subtitle">{{ t('pages.home.featured.subtitle') }}</p>

      <div
        v-if="facetsLoading"
        class="home-featured__chips home-featured__chips--skeleton"
        aria-hidden="true"
      >
        <span
          v-for="n in SKELETON_CHIP_COUNT"
          :key="n"
          class="home-featured__chip-skeleton"
          :style="{ width: `${72 + (n % 4) * 18}px` }"
        />
      </div>
      <div v-else-if="chips.length" class="home-featured__chips" role="list">
        <button
          v-for="chip in chips"
          :key="chip.id"
          type="button"
          role="listitem"
          class="home-featured__chip"
          @click="openChip(chip)"
        >
          <span>{{ chip.label }}</span>
          <ArrowRightIcon class="home-featured__chip-arrow" :size="16" />
        </button>
      </div>

      <div
        v-if="modelsLoading"
        class="home-featured__grid"
        aria-busy="true"
        aria-label="Loading"
      >
        <div
          v-for="n in SKELETON_CARD_COUNT"
          :key="n"
          class="home-featured__skeleton-card"
        >
          <span class="home-featured__skeleton-fav" />
          <div class="home-featured__skeleton-body">
            <span class="home-featured__skeleton-line home-featured__skeleton-line--title" />
            <span class="home-featured__skeleton-line home-featured__skeleton-line--desc" />
            <span class="home-featured__skeleton-line home-featured__skeleton-line--desc-short" />
          </div>
        </div>
      </div>
      <div v-else-if="displayModels.length" class="home-featured__grid">
        <HomeFeaturedCard v-for="model in displayModels" :key="model.id" :model="model" />
      </div>

      <button type="button" class="home-featured__more" @click="goModels">
        {{ t('pages.home.featured.viewMore') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.home-featured {
  padding: 80px 16px 64px;
  background: #fff;
}

.home-featured__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  text-align: center;
  min-width: 0;
}

.home-featured__eyebrow {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  color: #ff9800;
}

.home-featured__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
}

.home-featured__subtitle {
  margin: 20px auto 0;
  max-width: 100%;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
  white-space: nowrap;
}

.home-featured__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 40px;
  max-width: 100%;
}

.home-featured__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 10px 14px 10px 10px;
  border: 0;
  border-radius: 30px;
  background: #f8f8f8;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.home-featured__chip-arrow {
  flex-shrink: 0;
  color: currentColor;
}

.home-featured__chip:hover {
  background: #101010;
  color: #fff;
}

.home-featured__chip-skeleton {
  display: inline-block;
  height: 44px;
  border-radius: 30px;
  background: linear-gradient(90deg, #f0f1f3 25%, #e6e7eb 37%, #f0f1f3 63%);
  background-size: 400% 100%;
  animation: home-featured-shimmer 1.4s ease infinite;
}

.home-featured__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
  text-align: left;
}

.home-featured__skeleton-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  aspect-ratio: 322 / 341;
  background: linear-gradient(90deg, #eceef2 25%, #e2e4e9 37%, #eceef2 63%);
  background-size: 400% 100%;
  animation: home-featured-shimmer 1.4s ease infinite;
}

.home-featured__skeleton-fav {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.55);
}

.home-featured__skeleton-body {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 12px 14px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.08));
}

.home-featured__skeleton-line {
  display: block;
  height: 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.72);
}

.home-featured__skeleton-line--title {
  width: 78%;
  height: 14px;
}

.home-featured__skeleton-line--desc {
  width: 92%;
  margin-top: 2px;
}

.home-featured__skeleton-line--desc-short {
  width: 64%;
}

.home-featured__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  margin-top: 40px;
  padding: 8px 36px;
  border: 1px solid #ebf4fb;
  border-radius: 8px;
  background: transparent;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.home-featured__more:hover {
  background: #f8f8f8;
  border-color: #d8dee6;
}

@keyframes home-featured-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@media (max-width: 1100px) {
  .home-featured__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .home-featured {
    padding: 56px 16px;
  }

  .home-featured__eyebrow {
    font-size: 16px;
    line-height: 22px;
  }

  .home-featured__subtitle {
    font-size: 15px;
    white-space: normal;
  }

  .home-featured__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 28px;
  }

  .home-featured__skeleton-card {
    aspect-ratio: 3 / 4;
    border-radius: 12px;
  }

  .home-featured__skeleton-fav {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
  }

  .home-featured__chips {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 28px;
  }

  .home-featured__chip {
    min-height: 36px;
    padding: 8px 12px;
    font-size: 13px;
  }

  .home-featured__chip-skeleton {
    height: 36px;
  }
}
</style>
