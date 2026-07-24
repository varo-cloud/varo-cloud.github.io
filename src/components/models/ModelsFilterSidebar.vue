<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'
import type { BaseModelFacetItem, FacetItem, PublisherFacetItem } from '@/types'

const props = defineProps<{
  publishers: PublisherFacetItem[]
  baseModels: BaseModelFacetItem[]
  categories: FacetItem[]
  capabilities: FacetItem[]
  selectedPublisher: string | null
  selectedBaseModel: string | null
  selectedCategory: string | null
  selectedCapability: string | null
  totalCount: number
}>()

const emit = defineEmits<{
  'update:selectedPublisher': [value: string | null]
  'update:selectedBaseModel': [value: string | null]
  'update:selectedCategory': [value: string | null]
  'update:selectedCapability': [value: string | null]
}>()

const { t, te } = useI18n()

function selectPublisher(value: string | null) {
  if (props.selectedPublisher === value) return
  emit('update:selectedPublisher', value)
}

function selectBaseModel(value: string | null) {
  if (props.selectedBaseModel === value) return
  emit('update:selectedBaseModel', value)
}

function selectCategory(value: string | null) {
  if (props.selectedCategory === value) return
  emit('update:selectedCategory', value)
}

function selectCapability(value: string | null) {
  if (props.selectedCapability === value) return
  emit('update:selectedCapability', value)
}

function baseModelLabel(slug: string) {
  const key = `pages.models.series.${slug}`
  return te(key) ? t(key) : slug
}
</script>

<template>
  <aside class="models-filter-sidebar" :aria-label="t('pages.models.sidebar.title')">
    <div class="models-filter-sidebar__sections">
      <section v-if="publishers.length > 0" class="models-filter-section">
        <h3 class="models-filter-section__title">{{ t('pages.models.sidebar.publisher') }}</h3>
        <ul class="models-filter-list">
          <li>
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': !selectedPublisher }"
              @click="selectPublisher(null)"
            >
              <img
                :src="
                  assetUrl(
                    !selectedPublisher
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
          <li v-for="item in publishers" :key="item.slug">
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': selectedPublisher === item.slug }"
              @click="selectPublisher(item.slug)"
            >
              <img
                :src="
                  assetUrl(
                    selectedPublisher === item.slug
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <img
                v-if="item.logo_url"
                :src="item.logo_url"
                alt=""
                aria-hidden="true"
                class="models-filter-item__logo"
              />
              <span class="models-filter-item__label">{{ item.name }}</span>
              <span class="models-filter-item__count">{{ item.count }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="baseModels.length > 0" class="models-filter-section">
        <h3 class="models-filter-section__title">{{ t('pages.models.sidebar.baseModel') }}</h3>
        <ul class="models-filter-list">
          <li>
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': !selectedBaseModel }"
              @click="selectBaseModel(null)"
            >
              <img
                :src="
                  assetUrl(
                    !selectedBaseModel
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
          <li v-for="item in baseModels" :key="item.slug">
            <button
              type="button"
              class="models-filter-item"
              :class="{ 'is-active': selectedBaseModel === item.slug }"
              @click="selectBaseModel(item.slug)"
            >
              <img
                :src="
                  assetUrl(
                    selectedBaseModel === item.slug
                      ? '/assets/models/filter-checked.svg'
                      : '/assets/models/filter-unchecked.svg',
                  )
                "
                alt=""
                aria-hidden="true"
                class="models-filter-item__icon"
              />
              <img
                v-if="item.icon_url"
                :src="item.icon_url"
                alt=""
                aria-hidden="true"
                class="models-filter-item__logo"
              />
              <span class="models-filter-item__label">{{ baseModelLabel(item.slug) }}</span>
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
          <li v-for="item in categories" :key="`cat-${item.value}`">
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
              <span class="models-filter-item__label">{{ item.value }}</span>
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
          <li v-for="item in capabilities" :key="`cap-${item.value}`">
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
              <span class="models-filter-item__label">{{ item.value }}</span>
              <span class="models-filter-item__count">{{ item.count }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
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
  margin: 0 0 8px;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
}

.models-filter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.models-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.models-filter-item.is-active {
  background: rgba(6, 182, 212, 0.04);
}

.models-filter-item__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.models-filter-item__logo {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 2px;
  object-fit: contain;
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

@media (max-width: 1023px) {
  .models-filter-sidebar {
    width: 100%;
  }
}
</style>
