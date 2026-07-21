<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchModelFacets, fetchModels } from '@/api/models'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { assetUrl } from '@/utils/assetUrl'
import { formatCapabilityLabel } from '@/utils/capability'
import type { FacetItem, Model } from '@/types'
import HomeFeaturedCard from '@/components/home/HomeFeaturedCard.vue'

const FEATURED_LIMIT = 4

const { t, te } = useI18n()
const { push } = useLocaleRouter()

const capabilities = ref<FacetItem[]>([])
const models = ref<Model[]>([])
const activeCapability = ref<string | null>(null)

const chips = computed(() =>
  capabilities.value.map((item) => ({
    key: item.value,
    label: capabilityLabel(item.value),
  })),
)

const displayModels = computed(() => models.value)

function capabilityLabel(value: string) {
  const key = `pages.models.capabilities.${value}`
  return te(key) ? t(key) : formatCapabilityLabel(value)
}

async function loadFacets() {
  try {
    const data = await fetchModelFacets()
    capabilities.value = data.capabilities ?? []
  } catch {
    capabilities.value = []
  }
}

async function loadModels() {
  try {
    const page = await fetchModels({
      offset: 0,
      limit: FEATURED_LIMIT,
      ...(activeCapability.value ? { capability: activeCapability.value } : {}),
    })
    models.value = page.items
  } catch {
    models.value = []
  }
}

function selectChip(value: string) {
  activeCapability.value = activeCapability.value === value ? null : value
}

function goModels() {
  push({
    name: 'models',
    query: activeCapability.value ? { capability: activeCapability.value } : {},
  })
}

watch(activeCapability, () => {
  void loadModels()
})

onMounted(async () => {
  await loadFacets()
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

      <div v-if="chips.length" class="home-featured__chips" role="list">
        <button
          v-for="chip in chips"
          :key="chip.key"
          type="button"
          role="listitem"
          class="home-featured__chip"
          :class="{ 'is-active': activeCapability === chip.key }"
          @click="selectChip(chip.key)"
        >
          {{ chip.label }}
        </button>
      </div>

      <div v-if="displayModels.length" class="home-featured__grid">
        <HomeFeaturedCard v-for="model in displayModels" :key="model.id" :model="model" />
      </div>
      <div v-else class="home-featured__grid home-featured__grid--fallback">
        <article v-for="n in 4" :key="n" class="home-featured__fallback-card">
          <img
            class="home-featured__fallback-img"
            :src="assetUrl(`/assets/cover/${(n % 4) + 1}.jpg`)"
            alt=""
          />
          <div class="home-featured__fallback-body">
            <p class="home-featured__fallback-name">{{ t('pages.home.featured.fallbackName') }}</p>
            <p class="home-featured__fallback-desc">{{ t('pages.home.featured.fallbackDesc') }}</p>
          </div>
        </article>
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
  max-width: 720px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
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
  min-height: 44px;
  padding: 10px 14px;
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

.home-featured__chip:hover:not(.is-active) {
  background: #ececec;
}

.home-featured__chip.is-active {
  background: #101010;
  color: #fff;
}

.home-featured__chip.is-active:hover {
  background: #333;
}

.home-featured__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
  text-align: left;
}

.home-featured__fallback-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  aspect-ratio: 322 / 341;
  background: #111;
}

.home-featured__fallback-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-featured__fallback-body {
  position: absolute;
  inset: auto 0 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
  color: #fff;
}

.home-featured__fallback-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.home-featured__fallback-desc {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 16px;
  opacity: 0.9;
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
  }

  .home-featured__grid {
    grid-template-columns: 1fr;
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
}
</style>
