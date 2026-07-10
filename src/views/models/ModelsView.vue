<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NEmpty, NSpin } from 'naive-ui'
import { fetchModels, fetchFavouriteModels, fetchModelFacets, fetchRecentModels } from '@/api/models'
import ModelCard from '@/components/models/ModelCard.vue'
import ModelsFilterSidebar from '@/components/models/ModelsFilterSidebar.vue'
import ModelsHeroCarousel from '@/components/models/ModelsHeroCarousel.vue'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import type { FacetItem, Model, ModelCategory, PublisherFacetItem } from '@/types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const route = useRoute()
const { push, replace } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()

const models = ref<Model[]>([])
const total = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'latest' | 'favourite' | 'recent'>('latest')
const searchQuery = ref('')
const selectedPublisher = ref<string | null>(null)
const selectedCategory = ref<ModelCategory | null>(null)
const selectedCapability = ref<string | null>(null)
const facets = ref<{
  categories: FacetItem[]
  capabilities: FacetItem[]
  publishers: PublisherFacetItem[]
}>({
  categories: [],
  capabilities: [],
  publishers: [],
})
const heroActiveIndex = ref(0)

const heroSlideContent = computed(() => {
  if (heroActiveIndex.value === 1) {
    return {
      title: t('pages.models.heroSlides.seedance.title'),
      subtitle: t('pages.models.heroSlides.seedance.subtitle'),
    }
  }

  return {
    title: t('common.slogan'),
    subtitle: t('pages.models.heroSubtitle'),
  }
})

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

const tabOptions = computed(() => {
  const options = [{ key: 'latest' as const, label: t('pages.models.tabs.latest') }]
  if (!userStore.isLoggedIn) return options

  return [
    ...options,
    { key: 'favourite' as const, label: t('pages.models.tabs.favourite') },
    { key: 'recent' as const, label: t('pages.models.tabs.recent') },
  ]
})

const hasMore = computed(() => activeTab.value === 'latest' && models.value.length < total.value)

const showFilterSidebar = computed(() => activeTab.value === 'latest')

const hasActiveFilters = computed(
  () => Boolean(selectedPublisher.value || selectedCategory.value || selectedCapability.value),
)

const unfilteredTotal = computed(() =>
  facets.value.categories.reduce((sum, item) => sum + item.count, 0),
)

const emptyDescription = computed(() => {
  if (activeTab.value === 'favourite') return t('pages.models.emptyFavourite')
  if (activeTab.value === 'recent') return t('pages.models.emptyRecent')
  return t('pages.models.empty')
})

function buildListQuery() {
  const query: Record<string, string> = {}
  const q = searchQuery.value.trim()
  if (q) query.q = q
  if (selectedPublisher.value) query.publisher = selectedPublisher.value
  if (selectedCategory.value) query.category = selectedCategory.value
  if (selectedCapability.value) query.capability = selectedCapability.value
  return query
}

function syncRouteQuery() {
  if (activeTab.value !== 'latest') return
  replace({ name: 'models', query: buildListQuery() })
}

async function loadFacets() {
  try {
    const data = await fetchModelFacets()
    facets.value = {
      categories: data.categories ?? [],
      capabilities: data.capabilities ?? [],
      publishers: data.publishers ?? [],
    }
  } catch {
    facets.value = { categories: [], capabilities: [], publishers: [] }
  }
}

async function loadFavouriteModels() {
  if (!userStore.isLoggedIn) {
    models.value = []
    total.value = 0
    loading.value = false
    return
  }

  loading.value = true
  loadingMore.value = false
  error.value = null
  models.value = []
  total.value = 0

  try {
    const page = await fetchFavouriteModels({ limit: PAGE_SIZE, offset: 0 })
    models.value = page.items
    total.value = page.total
  } catch {
    error.value = t('pages.models.loadError')
  } finally {
    loading.value = false
  }
}

async function loadRecentModels() {
  if (!userStore.isLoggedIn) {
    models.value = []
    total.value = 0
    loading.value = false
    return
  }

  loading.value = true
  loadingMore.value = false
  error.value = null
  models.value = []
  total.value = 0

  try {
    const page = await fetchRecentModels({ limit: PAGE_SIZE, offset: 0 })
    models.value = page.items
    total.value = page.total
  } catch {
    error.value = t('pages.models.loadError')
  } finally {
    loading.value = false
  }
}

async function loadModels(append = false) {
  if (activeTab.value !== 'latest') return

  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    models.value = []
    total.value = 0
  }
  error.value = null

  try {
    const page = await fetchModels({
      offset: append ? models.value.length : 0,
      limit: PAGE_SIZE,
      q: searchQuery.value.trim() || undefined,
      publisher: selectedPublisher.value ?? undefined,
      category: selectedCategory.value ?? undefined,
      capability: selectedCapability.value ?? undefined,
    })

    models.value = append ? [...models.value, ...page.items] : page.items
    total.value = page.total
  } catch {
    error.value = t('pages.models.loadError')
    if (!append) {
      models.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function switchTab(key: 'latest' | 'favourite' | 'recent') {
  activeTab.value = key

  if (key === 'favourite') {
    loadFavouriteModels()
    return
  }

  if (key === 'recent') {
    loadRecentModels()
    return
  }

  loadModels()
}

function selectPublisher(publisher: string | null) {
  if (selectedPublisher.value === publisher) return
  selectedPublisher.value = publisher
  syncRouteQuery()
  loadModels()
}

function selectCategory(category: string | null) {
  const next: ModelCategory | null =
    category === 'video' || category === 'image' || category === 'llm' ? category : null
  if (selectedCategory.value === next) return
  selectedCategory.value = next
  syncRouteQuery()
  loadModels()
}

function selectCapability(capability: string | null) {
  if (selectedCapability.value === capability) return
  selectedCapability.value = capability
  syncRouteQuery()
  loadModels()
}

function clearFilters() {
  selectedPublisher.value = null
  selectedCategory.value = null
  selectedCapability.value = null
  syncRouteQuery()
  loadModels()
}

function loadMore() {
  if (!hasMore.value || loadingMore.value || loading.value) return
  loadModels(true)
}

function retryLoad() {
  if (activeTab.value === 'latest') {
    loadModels()
    return
  }
  if (activeTab.value === 'favourite') {
    loadFavouriteModels()
    return
  }
  loadRecentModels()
}

function goToAuth() {
  push({ name: 'auth' })
}

function goToDocs() {
  push({ name: 'docs' })
}

function handleFavouriteChange({
  modelId,
  isFavourited,
}: {
  modelId: string
  isFavourited: boolean
}) {
  if (activeTab.value === 'favourite' && !isFavourited) {
    models.value = models.value.filter((model) => model.id !== modelId)
    total.value = Math.max(0, total.value - 1)
    return
  }

  const index = models.value.findIndex((model) => model.id === modelId)
  if (index >= 0) {
    models.value[index] = { ...models.value[index], isFavourited }
  }
}

watch(searchQuery, () => {
  if (activeTab.value !== 'latest') return

  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    syncRouteQuery()
    loadModels()
  }, SEARCH_DEBOUNCE_MS)
})

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn && activeTab.value !== 'latest') {
      activeTab.value = 'latest'
      loadModels()
    }
  },
)

watch(
  () => modelPrefs.recentIds,
  () => {
    if (activeTab.value === 'recent') {
      loadRecentModels()
    }
  },
)

onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q) {
    searchQuery.value = q
  }

  const publisher = route.query.publisher
  if (typeof publisher === 'string' && publisher) {
    selectedPublisher.value = publisher
  }

  const category = route.query.category
  if (category === 'video' || category === 'image' || category === 'llm') {
    selectedCategory.value = category
  }

  const capability = route.query.capability
  if (typeof capability === 'string' && capability) {
    selectedCapability.value = capability
  }

  void loadFacets()
  loadModels()
})
</script>

<template>
  <div class="models-page">
    <section class="models-hero" aria-labelledby="models-hero-title">
      <ModelsHeroCarousel v-model:active-index="heroActiveIndex" />

      <div class="models-hero__inner">
        <div class="models-hero__content">
          <h1 id="models-hero-title" class="models-hero__title">
            {{ heroSlideContent.title }}
          </h1>
          <p class="models-hero__subtitle">
            {{ heroSlideContent.subtitle }}
          </p>
          <div class="models-hero__actions">
            <button type="button" class="models-hero__btn models-hero__btn--primary" @click="goToAuth">
              {{ t('pages.models.heroCtaPrimary') }}
            </button>
            <button type="button" class="models-hero__btn models-hero__btn--secondary" @click="goToDocs">
              {{ t('pages.models.heroCtaSecondary') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="models-list">
      <div class="models-list__inner">
        <div class="models-layout-header" :class="{ 'has-sidebar': showFilterSidebar }">
          <div v-if="showFilterSidebar" class="models-sidebar-header">
            <span class="models-sidebar-header__title">{{ t('pages.models.sidebar.title') }}</span>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="models-sidebar-header__clear"
              @click="clearFilters"
            >
              {{ t('pages.models.sidebar.clear') }}
            </button>
          </div>

          <div class="models-main-header">
            <div class="models-tabs" role="tablist" :aria-label="t('pages.models.filterLabel')">
              <button
                v-for="tab in tabOptions"
                :key="tab.key"
                type="button"
                role="tab"
                class="models-tab"
                :class="{ 'is-active': activeTab === tab.key }"
                :aria-selected="activeTab === tab.key"
                @click="switchTab(tab.key)"
              >
                {{ tab.label }}
                <span v-if="activeTab === tab.key" class="models-tab__indicator" />
              </button>
            </div>

            <label v-if="activeTab === 'latest'" class="models-search">
              <img :src="assetUrl('/assets/models/search.svg')" alt="" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                :placeholder="t('pages.models.searchPlaceholder')"
              />
            </label>
          </div>
        </div>

        <div class="models-layout-body" :class="{ 'has-sidebar': showFilterSidebar }">
          <ModelsFilterSidebar
            v-if="showFilterSidebar"
            :publishers="facets.publishers"
            :categories="facets.categories"
            :capabilities="facets.capabilities"
            :selected-publisher="selectedPublisher"
            :selected-category="selectedCategory"
            :selected-capability="selectedCapability"
            :total-count="unfilteredTotal"
            @update:selected-publisher="selectPublisher"
            @update:selected-category="selectCategory"
            @update:selected-capability="selectCapability"
          />

          <div class="models-main">
            <div v-if="loading" class="models-state">
              <NSpin size="large" />
            </div>

            <div v-else-if="error" class="models-state">
              <NEmpty :description="error">
                <template #extra>
                  <button type="button" class="models-retry" @click="retryLoad">
                    {{ t('pages.models.retry') }}
                  </button>
                </template>
              </NEmpty>
            </div>

            <div v-else-if="models.length === 0" class="models-state">
              <NEmpty :description="emptyDescription" />
            </div>

            <div v-else class="models-grid">
              <ModelCard
                v-for="model in models"
                :key="model.id"
                :model="model"
                @favourite-change="handleFavouriteChange"
              />
            </div>

            <div v-if="hasMore && !loading" class="models-more">
              <button
                type="button"
                class="models-more__btn"
                :disabled="loadingMore"
                @click="loadMore"
              >
                {{ t('pages.models.viewMore') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.models-page {
  background: #fff;
}

.models-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 724px;
  padding: 0 16px 49px;
  overflow: hidden;
}

.models-hero__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.models-hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  text-align: left;
}

.models-hero__title {
  margin: 0;
  max-width: 964px;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.14;
  color: #fff;
  word-break: break-word;
}

.models-hero__subtitle {
  margin: 0;
  max-width: 738px;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
  word-break: break-word;
}

.models-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.models-hero__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.models-hero__btn--primary {
  background: #06b6d4;
  color: #fff;
}

.models-hero__btn--primary:hover {
  background: #0891b2;
}

.models-hero__btn--secondary {
  background: #fff;
  color: #222;
}

.models-hero__btn--secondary:hover {
  background: #f5f5f5;
}

.models-list {
  background: #fff;
}

.models-list__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 10px 16px 64px;
}

.models-layout-header {
  display: flex;
  align-items: center;
  margin-bottom: 21px;
}

.models-layout-header.has-sidebar {
  gap: 24px;
}

.models-sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  width: 224px;
}

.models-sidebar-header__title {
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
}

.models-sidebar-header__clear {
  padding: 0;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
}

.models-sidebar-header__clear:hover {
  color: #222;
}

.models-main-header {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.models-layout-body {
  display: flex;
  align-items: flex-start;
}

.models-layout-body.has-sidebar {
  gap: 24px;
}

.models-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.models-tab {
  position: relative;
  padding: 10px 0 14px;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
}

.models-tab.is-active {
  color: #222;
}

.models-tab__indicator {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: #06b6d4;
}

.models-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(100%, 308px);
  height: 36px;
  padding: 0 16px;
  border-radius: 30px;
  background: #f5f5f5;
}

.models-search img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.6;
}

.models-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #222;
  font-size: 14px;
  line-height: 14px;
  outline: none;
}

.models-search input::placeholder {
  color: #9b9dab;
}

.models-main {
  flex: 1;
  min-width: 0;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 24px;
}

.models-layout-body.has-sidebar .models-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.models-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.models-retry {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  cursor: pointer;
}

.models-more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.models-more__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 36px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
}

.models-more__btn:hover:not(:disabled) {
  background: #ebebeb;
}

.models-more__btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

@media (min-width: 640px) {
  .models-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .models-layout-body.has-sidebar .models-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .models-list__inner {
    padding-inline: 24px;
  }

  .models-hero {
    padding-inline: 24px;
  }

  .models-hero__title {
    font-size: 56px;
    line-height: 64px;
  }

  .models-hero__subtitle {
    font-size: 20px;
    line-height: 24px;
  }
}

@media (min-width: 1280px) {
  .models-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .models-layout-body.has-sidebar .models-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    max-width: 1112px;
  }
}

@media (max-width: 767px) {
  .models-hero {
    align-items: flex-end;
    min-height: min(calc(100svh - var(--app-header-height)), 640px);
    padding: 72px 16px 16px;
  }

  .models-hero__inner {
    padding-bottom: 52px;
  }

  .models-hero__content {
    gap: 16px;
  }

  .models-hero__title {
    font-size: clamp(28px, 8vw, 36px);
    line-height: 1.15;
  }

  .models-hero__subtitle {
    font-size: 15px;
    line-height: 1.35;
  }

  .models-hero__actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: 100%;
  }

  .models-hero__btn {
    width: 100%;
    justify-content: center;
  }

  .models-main-header {
    width: 100%;
  }

  .models-search {
    width: 100%;
  }

  .models-layout-header.has-sidebar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .models-sidebar-header {
    width: 100%;
  }

  .models-layout-body.has-sidebar {
    flex-direction: column;
    gap: 24px;
  }
}
</style>
