<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/common/AppIcon.vue'
import { assetUrl } from '@/utils/assetUrl'
import type { BaseModelFacetItem, FacetItem, PublisherFacetItem } from '@/types'

type MobileFilterKey = 'publisher' | 'baseModel' | 'category' | 'capability'

type MobileFilterOption = {
  value: string
  label: string
}

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

const openFilter = ref<MobileFilterKey | null>(null)
const mobileRootRef = ref<HTMLElement | null>(null)

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

const allLabel = computed(() => t('pages.models.filters.all'))

const publisherLabel = computed(() => {
  if (!props.selectedPublisher) return allLabel.value
  return props.publishers.find((item) => item.slug === props.selectedPublisher)?.name ?? props.selectedPublisher
})

const baseModelSelectedLabel = computed(() => {
  if (!props.selectedBaseModel) return allLabel.value
  return baseModelLabel(props.selectedBaseModel)
})

const categoryLabel = computed(() => props.selectedCategory ?? allLabel.value)

const capabilityLabel = computed(() => props.selectedCapability ?? allLabel.value)

const publisherOptions = computed<MobileFilterOption[]>(() => [
  { value: '', label: allLabel.value },
  ...props.publishers.map((item) => ({ value: item.slug, label: item.name })),
])

const baseModelOptions = computed<MobileFilterOption[]>(() => [
  { value: '', label: allLabel.value },
  ...props.baseModels.map((item) => ({ value: item.slug, label: baseModelLabel(item.slug) })),
])

const categoryOptions = computed<MobileFilterOption[]>(() => [
  { value: '', label: allLabel.value },
  ...props.categories.map((item) => ({ value: item.value, label: item.value })),
])

const capabilityOptions = computed<MobileFilterOption[]>(() => [
  { value: '', label: allLabel.value },
  ...props.capabilities.map((item) => ({ value: item.value, label: item.value })),
])

function toggleFilter(key: MobileFilterKey) {
  openFilter.value = openFilter.value === key ? null : key
}

function pickFilter(key: MobileFilterKey, value: string) {
  const next = value || null
  if (key === 'publisher') selectPublisher(next)
  else if (key === 'baseModel') selectBaseModel(next)
  else if (key === 'category') selectCategory(next)
  else selectCapability(next)
  openFilter.value = null
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (mobileRootRef.value?.contains(target)) return
  openFilter.value = null
}

watch(openFilter, (key) => {
  if (!key) {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    return
  }
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <aside class="models-filter-sidebar" :aria-label="t('pages.models.sidebar.title')">
    <div class="models-filter-sidebar__desktop">
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
    </div>

    <div ref="mobileRootRef" class="models-filter-sidebar__mobile">
      <div v-if="publishers.length > 0" class="models-filter-select">
        <span class="models-filter-select__label">{{ t('pages.models.sidebar.publisher') }}</span>
        <div class="models-filter-select__menu">
          <button
            type="button"
            class="models-filter-select__trigger"
            :class="{ 'is-open': openFilter === 'publisher' }"
            :aria-expanded="openFilter === 'publisher'"
            aria-haspopup="menu"
            @click.stop="toggleFilter('publisher')"
          >
            <span class="models-filter-select__value">{{ publisherLabel }}</span>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="models-filter-select__chevron"
              :class="{ 'is-open': openFilter === 'publisher' }"
            />
          </button>
          <div
            v-show="openFilter === 'publisher'"
            class="models-filter-select__dropdown scrollbar-subtle"
            role="menu"
          >
            <button
              v-for="opt in publisherOptions"
              :key="`pub-${opt.value || 'all'}`"
              type="button"
              class="models-filter-select__option"
              :class="{ 'is-active': (selectedPublisher ?? '') === opt.value }"
              role="menuitem"
              @click.stop="pickFilter('publisher', opt.value)"
            >
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="baseModels.length > 0" class="models-filter-select">
        <span class="models-filter-select__label">{{ t('pages.models.sidebar.baseModel') }}</span>
        <div class="models-filter-select__menu">
          <button
            type="button"
            class="models-filter-select__trigger"
            :class="{ 'is-open': openFilter === 'baseModel' }"
            :aria-expanded="openFilter === 'baseModel'"
            aria-haspopup="menu"
            @click.stop="toggleFilter('baseModel')"
          >
            <span class="models-filter-select__value">{{ baseModelSelectedLabel }}</span>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="models-filter-select__chevron"
              :class="{ 'is-open': openFilter === 'baseModel' }"
            />
          </button>
          <div
            v-show="openFilter === 'baseModel'"
            class="models-filter-select__dropdown scrollbar-subtle"
            role="menu"
          >
            <button
              v-for="opt in baseModelOptions"
              :key="`base-${opt.value || 'all'}`"
              type="button"
              class="models-filter-select__option"
              :class="{ 'is-active': (selectedBaseModel ?? '') === opt.value }"
              role="menuitem"
              @click.stop="pickFilter('baseModel', opt.value)"
            >
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="categories.length > 0" class="models-filter-select">
        <span class="models-filter-select__label">{{ t('pages.models.sidebar.type') }}</span>
        <div class="models-filter-select__menu">
          <button
            type="button"
            class="models-filter-select__trigger"
            :class="{ 'is-open': openFilter === 'category' }"
            :aria-expanded="openFilter === 'category'"
            aria-haspopup="menu"
            @click.stop="toggleFilter('category')"
          >
            <span class="models-filter-select__value">{{ categoryLabel }}</span>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="models-filter-select__chevron"
              :class="{ 'is-open': openFilter === 'category' }"
            />
          </button>
          <div
            v-show="openFilter === 'category'"
            class="models-filter-select__dropdown scrollbar-subtle"
            role="menu"
          >
            <button
              v-for="opt in categoryOptions"
              :key="`cat-${opt.value || 'all'}`"
              type="button"
              class="models-filter-select__option"
              :class="{ 'is-active': (selectedCategory ?? '') === opt.value }"
              role="menuitem"
              @click.stop="pickFilter('category', opt.value)"
            >
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="capabilities.length > 0" class="models-filter-select">
        <span class="models-filter-select__label">{{ t('pages.models.sidebar.capability') }}</span>
        <div class="models-filter-select__menu">
          <button
            type="button"
            class="models-filter-select__trigger"
            :class="{ 'is-open': openFilter === 'capability' }"
            :aria-expanded="openFilter === 'capability'"
            aria-haspopup="menu"
            @click.stop="toggleFilter('capability')"
          >
            <span class="models-filter-select__value">{{ capabilityLabel }}</span>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="models-filter-select__chevron"
              :class="{ 'is-open': openFilter === 'capability' }"
            />
          </button>
          <div
            v-show="openFilter === 'capability'"
            class="models-filter-select__dropdown scrollbar-subtle"
            role="menu"
          >
            <button
              v-for="opt in capabilityOptions"
              :key="`cap-${opt.value || 'all'}`"
              type="button"
              class="models-filter-select__option"
              :class="{ 'is-active': (selectedCapability ?? '') === opt.value }"
              role="menuitem"
              @click.stop="pickFilter('capability', opt.value)"
            >
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>
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

.models-filter-sidebar__mobile {
  display: none;
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

.models-filter-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.models-filter-select__label {
  color: #9b9dab;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
}

.models-filter-select__menu {
  position: relative;
}

.models-filter-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  text-align: left;
  outline: none;
}

.models-filter-select__trigger.is-open,
.models-filter-select__trigger:focus-visible {
  border-color: #06b6d4;
}

.models-filter-select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.models-filter-select__chevron {
  flex-shrink: 0;
  color: #9b9dab;
  transition: transform 0.15s ease;
}

.models-filter-select__chevron.is-open {
  transform: rotate(180deg);
}

.models-filter-select__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  min-width: 100%;
  max-height: min(320px, 50vh);
  overflow-y: auto;
  padding: 12px 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.models-filter-select__option {
  display: flex;
  align-items: center;
  width: calc(100% + 40px);
  height: 40px;
  margin: 0 -20px;
  padding: 0 20px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #222;
  font: inherit;
  font-size: 14px;
  line-height: 1;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.models-filter-select__option:hover,
.models-filter-select__option.is-active {
  background: rgba(0, 0, 0, 0.04);
}

@media (max-width: 1023px) {
  .models-filter-sidebar {
    width: 100%;
  }

  .models-filter-sidebar__desktop {
    display: none;
  }

  .models-filter-sidebar__mobile {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
    gap: 12px;
    width: 100%;
  }
}
</style>
