<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'
import type { FacetItem } from '@/types'

const COLLAPSED_LIMIT = 6

const props = defineProps<{
  series: FacetItem[]
  categories: FacetItem[]
  capabilities: FacetItem[]
  selectedSeries: string | null
  selectedCategory: string | null
  selectedCapability: string | null
  totalCount: number
}>()

const emit = defineEmits<{
  'update:selectedSeries': [value: string | null]
  'update:selectedCategory': [value: string | null]
  'update:selectedCapability': [value: string | null]
}>()

const { t } = useI18n()

const expanded = ref(false)

function seriesLabel(value: string): string {
  const key = `pages.models.series.${value}`
  const translated = t(key)
  return translated === key ? formatSeriesFallback(value) : translated
}

function formatSeriesFallback(value: string): string {
  const base = value.split('-')[0] ?? value
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function categoryLabel(value: string): string {
  const key = `pages.models.categories.${value}`
  const translated = t(key)
  return translated === key ? value : translated
}

function capabilityLabel(value: string): string {
  const key = `pages.models.capabilities.${value}`
  const translated = t(key)
  return translated === key ? value : translated
}

function visibleItems(items: FacetItem[]) {
  if (expanded.value || items.length <= COLLAPSED_LIMIT) {
    return items
  }
  return items.slice(0, COLLAPSED_LIMIT)
}

const showMoreButton = computed(() => {
  const totalItems =
    props.series.length +
    props.categories.length +
    (props.categories.length > 0 ? 1 : 0) +
    props.capabilities.length +
    (props.capabilities.length > 0 ? 1 : 0)
  return !expanded.value && totalItems > COLLAPSED_LIMIT * 2
})

function selectSeries(value: string | null) {
  if (props.selectedSeries === value) return
  emit('update:selectedSeries', value)
}

function selectCategory(value: string | null) {
  if (props.selectedCategory === value) return
  emit('update:selectedCategory', value)
}

function selectCapability(value: string | null) {
  if (props.selectedCapability === value) return
  emit('update:selectedCapability', value)
}
</script>

<template>
  <aside class="models-filter-sidebar" :aria-label="t('pages.models.sidebar.title')">
    <div class="models-filter-sidebar__sections">
      <section v-if="series.length > 0" class="models-filter-section">
        <h3 class="models-filter-section__title">{{ t('pages.models.sidebar.series') }}</h3>
        <ul class="models-filter-list">
          <li v-for="item in visibleItems(series)" :key="item.value">
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': selectedSeries === item.value }"
              @click="selectSeries(item.value)"
            >
              <img
                :src="
                  assetUrl(
                    selectedSeries === item.value
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <span class="models-filter-item__label">{{ seriesLabel(item.value) }}</span>
              <span class="models-filter-item__count">{{ item.count }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="categories.length > 0" class="models-filter-section">
        <h3 class="models-filter-section__title">{{ t('pages.models.sidebar.type') }}</h3>
        <ul class="models-filter-list">
          <li>
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': !selectedCategory }"
              @click="selectCategory(null)"
            >
              <img
                :src="
                  assetUrl(
                    !selectedCategory
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <span class="models-filter-item__label">{{ t('pages.models.filters.all') }}</span>
              <span class="models-filter-item__count">{{ totalCount }}</span>
            </button>
          </li>
          <li v-for="item in visibleItems(categories)" :key="`cat-${item.value}`">
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': selectedCategory === item.value }"
              @click="selectCategory(item.value)"
            >
              <img
                :src="
                  assetUrl(
                    selectedCategory === item.value
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <span class="models-filter-item__label">{{ categoryLabel(item.value) }}</span>
              <span class="models-filter-item__count">{{ item.count }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="capabilities.length > 0" class="models-filter-section">
        <h3 class="models-filter-section__title">{{ t('pages.models.sidebar.capability') }}</h3>
        <ul class="models-filter-list">
          <li>
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': !selectedCapability }"
              @click="selectCapability(null)"
            >
              <img
                :src="
                  assetUrl(
                    !selectedCapability
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <span class="models-filter-item__label">{{ t('pages.models.filters.all') }}</span>
              <span class="models-filter-item__count">{{ totalCount }}</span>
            </button>
          </li>
          <li v-for="item in visibleItems(capabilities)" :key="`cap-${item.value}`">
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': selectedCapability === item.value }"
              @click="selectCapability(item.value)"
            >
              <img
                :src="
                  assetUrl(
                    selectedCapability === item.value
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <span class="models-filter-item__label">{{ capabilityLabel(item.value) }}</span>
              <span class="models-filter-item__count">{{ item.count }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <button v-if="showMoreButton" type="button" class="models-filter-more" @click="expanded = true">
      <span>{{ t('pages.models.sidebar.more') }}</span>
      <img :src="assetUrl('/assets/models/chevron-down.svg')" alt="" aria-hidden="true" />
    </button>
  </aside>
</template>

<style scoped>
.models-filter-sidebar {
  flex-shrink: 0;
  width: 224px;
}

.models-filter-sidebar__sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.models-filter-section__title {
  margin: 0 0 20px;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
}

.models-filter-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.models-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.models-filter-item__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.models-filter-item__label {
  flex: 1;
  min-width: 0;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.models-filter-item__count {
  flex-shrink: 0;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  text-align: right;
}

.models-filter-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
}

.models-filter-more img {
  width: 16px;
  height: 16px;
}

.models-filter-more:hover {
  color: #222;
}

@media (max-width: 1023px) {
  .models-filter-sidebar {
    width: 100%;
  }
}
</style>
