<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NEmpty, NSpin } from 'naive-ui'
import { fetchModelFacets, fetchModels } from '@/api/models'
import ModelsFilterSidebar from '@/components/models/ModelsFilterSidebar.vue'
import PricingTableRow from '@/components/pricing/PricingTableRow.vue'
import { assetUrl } from '@/utils/assetUrl'
import { modelToPricingItem } from '@/utils/pricing'
import type { FacetItem, Model, ModelCategory, PricingItem, PublisherFacetItem } from '@/types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const route = useRoute()
const { push, replace } = useLocaleRouter()
const { t } = useI18n()

const models = ref<Model[]>([])
const total = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
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

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

const items = computed<PricingItem[]>(() => models.value.map(modelToPricingItem))

const hasMore = computed(() => models.value.length < total.value)

const hasActiveFilters = computed(
  () => Boolean(selectedPublisher.value || selectedCategory.value || selectedCapability.value),
)

const unfilteredTotal = computed(() =>
  facets.value.categories.reduce((sum, item) => sum + item.count, 0),
)

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
  replace({ name: 'pricing', query: buildListQuery() })
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

async function loadModels(append = false) {
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
    error.value = t('pages.pricing.loadError')
    if (!append) {
      models.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
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

function goToModel(slug: string) {
  push({ name: 'model-detail', params: { slug } })
}

watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    syncRouteQuery()
    loadModels()
  }, SEARCH_DEBOUNCE_MS)
})

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
  <div class="pricing-page">
    <section class="pricing-hero" aria-labelledby="pricing-hero-title">
      <img
        class="pricing-hero__bg"
        :src="assetUrl('/assets/pricing/hero-bg.jpg')"
        alt=""
        aria-hidden="true"
      />
      <div class="pricing-hero__overlay" aria-hidden="true" />

      <div class="pricing-hero__content">
        <h1 id="pricing-hero-title" class="pricing-hero__title">
          {{ t('pages.pricing.heroTitle') }}
        </h1>
        <p class="pricing-hero__subtitle">
          {{ t('pages.pricing.heroSubtitle') }}
        </p>
      </div>
    </section>

    <section class="pricing-content">
      <div class="pricing-content__inner">
        <div class="pricing-layout-header">
          <div class="pricing-sidebar-header">
            <span class="pricing-sidebar-header__title">{{ t('pages.models.sidebar.title') }}</span>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="pricing-sidebar-header__clear"
              @click="clearFilters"
            >
              {{ t('pages.models.sidebar.clear') }}
            </button>
          </div>

          <div class="pricing-main-header">
            <label class="pricing-search">
              <img :src="assetUrl('/assets/models/search.svg')" alt="" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                :placeholder="t('pages.models.searchPlaceholder')"
              />
            </label>
          </div>
        </div>

        <div class="pricing-layout-body">
          <ModelsFilterSidebar
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

          <div class="pricing-main">
            <div class="pricing-table">
              <div class="pricing-table__header">
                <span>{{ t('pages.pricing.columns.model') }}</span>
                <span>{{ t('pages.pricing.columns.useCase') }}</span>
                <span class="pricing-table__header-price">{{ t('pages.pricing.columns.standardPrice') }}</span>
                <span class="pricing-table__header-price">{{ t('pages.pricing.columns.price') }}</span>
                <span class="pricing-table__header-price">{{ t('pages.pricing.columns.discount') }}</span>
                <span class="pricing-table__header-action" aria-hidden="true" />
              </div>

              <div v-if="loading" class="pricing-state">
                <NSpin size="large" />
              </div>

              <div v-else-if="error" class="pricing-state">
                <NEmpty :description="error">
                  <template #extra>
                    <button type="button" class="pricing-retry" @click="loadModels()">
                      {{ t('pages.pricing.retry') }}
                    </button>
                  </template>
                </NEmpty>
              </div>

              <div v-else-if="items.length === 0" class="pricing-state">
                <NEmpty :description="t('pages.pricing.empty')" />
              </div>

              <div v-else class="pricing-table__body">
                <PricingTableRow
                  v-for="item in items"
                  :key="item.id"
                  :item="item"
                  @view="goToModel"
                />
              </div>
            </div>

            <div v-if="hasMore && !loading" class="pricing-more">
              <button
                type="button"
                class="pricing-more__btn"
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
.pricing-page {
  background: #fff;
}

.pricing-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  overflow: hidden;
}

.pricing-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.pricing-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.pricing-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  max-width: 738px;
  padding: 120px 24px 64px;
  text-align: center;
}

.pricing-hero__title {
  margin: 0;
  font-size: clamp(32px, 4.5vw, 50px);
  font-weight: 800;
  line-height: 1.16;
  color: #fff;
}

.pricing-hero__subtitle {
  margin: 0;
  max-width: 640px;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
}

.pricing-content {
  background: #fff;
}

.pricing-content__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 20px 16px 64px;
}

.pricing-layout-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 21px;
}

.pricing-sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  width: 224px;
}

.pricing-sidebar-header__title {
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
}

.pricing-sidebar-header__clear {
  padding: 0;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
}

.pricing-sidebar-header__clear:hover {
  color: #222;
}

.pricing-main-header {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  min-width: 0;
}

.pricing-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(100%, 308px);
  height: 36px;
  padding: 0 16px;
  border-radius: 30px;
  background: #f5f5f5;
}

.pricing-search img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.6;
}

.pricing-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #222;
  font-size: 14px;
  line-height: 14px;
  outline: none;
}

.pricing-search input::placeholder {
  color: #9b9dab;
}

.pricing-layout-body {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.pricing-main {
  flex: 1;
  min-width: 0;
}

.pricing-table {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.pricing-table__header {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.7fr) 71px;
  align-items: center;
  min-height: 50px;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
  background: #fff;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
}

.pricing-table__header-price {
  text-align: left;
}

.pricing-table__header-action {
  visibility: hidden;
}

.pricing-table__body {
  background: #fff;
}

.pricing-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.pricing-retry {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  cursor: pointer;
}

.pricing-more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.pricing-more__btn {
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

.pricing-more__btn:hover:not(:disabled) {
  background: #ebebeb;
}

.pricing-more__btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

@media (min-width: 1024px) {
  .pricing-content__inner {
    padding-inline: 24px;
  }
}

@media (max-width: 1023px) {
  .pricing-table__header {
    display: none;
  }
}

@media (max-width: 767px) {
  .pricing-hero {
    min-height: 360px;
  }

  .pricing-hero__content {
    gap: 20px;
    padding-top: 96px;
    padding-bottom: 48px;
  }

  .pricing-layout-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .pricing-sidebar-header {
    width: 100%;
  }

  .pricing-main-header {
    width: 100%;
  }

  .pricing-search {
    width: 100%;
  }

  .pricing-layout-body {
    flex-direction: column;
    gap: 24px;
  }
}
</style>
