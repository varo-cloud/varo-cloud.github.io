<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { fetchGenerations } from '@/api/generations'
import AppPagination from '@/components/common/AppPagination.vue'
import SchemaFieldLabel from '@/components/playground/SchemaFieldLabel.vue'
import SelectDropdown from '@/components/playground/SelectDropdown.vue'
import FilterDatePicker from '@/components/playground/FilterDatePicker.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { formatUsd } from '@/utils/currency'
import { formatTimestamp } from '@/utils/time'
import type { GenerationListItem, GenerationTaskStatus } from '@/types'

const PAGE_SIZE = 20

type CategoryFilter = '' | 'video' | 'image'
type StatusFilter = '' | GenerationTaskStatus

const { t, locale } = useI18n()
const { push } = useLocaleRouter()

const items = ref<GenerationListItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const total = ref(0)

const categoryFilter = ref<CategoryFilter>('')
const statusFilter = ref<StatusFilter>('')
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)

const pageOffset = computed(() => (currentPage.value - 1) * PAGE_SIZE)

const categoryOptions = computed(() => [
  { value: '' as CategoryFilter, label: t('pages.generations.filters.allCategories') },
  { value: 'video' as CategoryFilter, label: t('pages.generations.filters.video') },
  { value: 'image' as CategoryFilter, label: t('pages.generations.filters.image') },
])

const statusOptions = computed(() => [
  { value: '' as StatusFilter, label: t('pages.generations.filters.allStatuses') },
  { value: 'succeeded' as StatusFilter, label: t('pages.modelDetail.generation.completed') },
  { value: 'failed' as StatusFilter, label: t('pages.modelDetail.generation.failed') },
  { value: 'processing' as StatusFilter, label: t('pages.modelDetail.generation.processing') },
  { value: 'queued' as StatusFilter, label: t('pages.modelDetail.generation.queued') },
])

function dateToStartMs(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed) ? parsed : undefined
}

function dateToEndMs(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Date.parse(`${value}T23:59:59.999Z`)
  return Number.isFinite(parsed) ? parsed : undefined
}

function channelLabel(channel: string | null) {
  if (!channel) return '—'
  const key = `pages.billing.styles.${channel}`
  const translated = t(key)
  return translated === key ? channel : translated
}

function categoryLabel(category: string) {
  const key = `pages.generations.filters.${category}`
  const translated = t(key)
  return translated === key ? category : translated
}

function statusLabel(status: string) {
  const normalized = normalizeStatus(status)
  const key = `pages.modelDetail.generation.${normalized}`
  const translated = t(key)
  return translated === key ? status : translated
}

function normalizeStatus(status: string) {
  if (status === 'succeeded' || status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'queued') return 'queued'
  if (status === 'running' || status === 'processing') return 'processing'
  return status
}

function statusClass(status: string) {
  return `generations-history__status--${normalizeStatus(status)}`
}

function truncateCell(value: string | null, max = 48) {
  if (!value) return '—'
  if (value.length <= max) return value
  return `${value.slice(0, max)}…`
}

function buildFetchParams() {
  return {
    offset: pageOffset.value,
    limit: PAGE_SIZE,
    createdFrom: dateToStartMs(dateFrom.value),
    createdTo: dateToEndMs(dateTo.value),
    status: statusFilter.value || undefined,
    category: categoryFilter.value || undefined,
  }
}

async function loadGenerations() {
  loading.value = true
  error.value = null

  try {
    const page = await fetchGenerations(buildFetchParams())
    items.value = page.items
    total.value = page.total

    const maxPage = Math.max(1, Math.ceil(page.total / PAGE_SIZE))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  } catch {
    error.value = t('pages.generations.loadError')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  if (page === currentPage.value || loading.value) return
  currentPage.value = page
  void loadGenerations()
}

function applyFilters() {
  currentPage.value = 1
  void loadGenerations()
}

function resetFilters() {
  categoryFilter.value = ''
  statusFilter.value = ''
  dateFrom.value = null
  dateTo.value = null
  currentPage.value = 1
  void loadGenerations()
}

function handleViewDetail(item: GenerationListItem) {
  void push({
    name: 'model-detail',
    params: { slug: item.model },
    query: { task_id: item.taskId },
  })
}

watch([categoryFilter, statusFilter], () => {
  applyFilters()
})

onMounted(() => {
  void loadGenerations()
})
</script>

<template>
  <div class="generations-history-page">
    <div class="generations-history-page__inner">
      <header class="generations-history-page__header">
        <h1 class="generations-history-page__title">{{ t('pages.generations.title') }}</h1>
        <p class="generations-history-page__description">{{ t('pages.generations.description') }}</p>
      </header>

      <div class="generations-history__filters">
        <div class="generations-history__filter">
          <SchemaFieldLabel :label="t('pages.generations.filters.category')" />
          <SelectDropdown v-model="categoryFilter" :options="categoryOptions" />
        </div>

        <div class="generations-history__filter">
          <SchemaFieldLabel :label="t('pages.generations.filters.status')" />
          <SelectDropdown v-model="statusFilter" :options="statusOptions" />
        </div>

        <div class="generations-history__filter">
          <SchemaFieldLabel :label="t('pages.generations.filters.dateFrom')" />
          <FilterDatePicker v-model="dateFrom" />
        </div>

        <div class="generations-history__filter">
          <SchemaFieldLabel :label="t('pages.generations.filters.dateTo')" />
          <FilterDatePicker v-model="dateTo" />
        </div>

        <div class="generations-history__filter-actions">
          <button type="button" class="generations-history__filter-btn" @click="applyFilters">
            {{ t('pages.generations.filters.apply') }}
          </button>
          <button
            type="button"
            class="generations-history__filter-btn generations-history__filter-btn--ghost"
            @click="resetFilters"
          >
            {{ t('pages.generations.filters.reset') }}
          </button>
        </div>
      </div>

      <div v-if="loading && items.length === 0" class="generations-history__state">
        <NSpin size="large" />
      </div>

      <div v-else-if="error" class="generations-history__state">
        <p>{{ error }}</p>
        <button type="button" class="generations-history__retry" @click="() => loadGenerations()">
          {{ t('pages.generations.retry') }}
        </button>
      </div>

      <template v-else>
        <div class="generations-history__table scrollbar-subtle" role="table">
          <div class="generations-history__header" role="row">
            <span role="columnheader">{{ t('pages.generations.columns.taskId') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.model') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.category') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.status') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.channel') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.prompt') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.cost') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.time') }}</span>
            <span role="columnheader">{{ t('pages.generations.columns.actions') }}</span>
          </div>

          <div v-if="items.length === 0" class="generations-history__empty">
            {{ t('pages.generations.empty') }}
          </div>

          <div v-else class="generations-history__body" role="rowgroup">
            <div
              v-for="item in items"
              :key="item.taskId"
              class="generations-history__row"
              role="row"
            >
              <span class="generations-history__task-id" role="cell" :title="item.taskId">
                {{ truncateCell(item.taskId) }}
              </span>
              <span class="generations-history__model" role="cell" :title="item.model">
                {{ item.model }}
              </span>
              <span role="cell">{{ categoryLabel(item.category) }}</span>
              <span role="cell">
                <span class="generations-history__status" :class="statusClass(item.status)">
                  {{ statusLabel(item.status) }}
                </span>
              </span>
              <span role="cell">
                <span class="generations-history__channel">{{ channelLabel(item.invocationChannel) }}</span>
              </span>
              <span class="generations-history__prompt" role="cell" :title="item.prompt ?? undefined">
                {{ truncateCell(item.prompt) }}
              </span>
              <span class="generations-history__cost" role="cell">{{ formatUsd(item.costUsd) }}</span>
              <span class="generations-history__time" role="cell">
                {{ formatTimestamp(item.createdAt, locale, 'compactDatetime') }}
              </span>
              <span role="cell">
                <button
                  type="button"
                  class="generations-history__view-btn"
                  @click="handleViewDetail(item)"
                >
                  {{ t('pages.generations.viewDetail') }}
                </button>
              </span>
            </div>
          </div>
        </div>

        <div v-if="total > 0" class="generations-history__footer">
          <AppPagination
            :page="currentPage"
            :page-size="PAGE_SIZE"
            :total="total"
            :disabled="loading"
            @update:page="handlePageChange"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.generations-history-page {
  min-height: calc(100vh - 140px);
}

.generations-history-page__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 105px 24px 48px;
}

.generations-history-page__header {
  margin-bottom: 32px;
}

.generations-history-page__title {
  margin: 0 0 14px;
  font-size: 24px;
  font-weight: 500;
  line-height: 24px;
  color: var(--text-primary);
}

.generations-history-page__description {
  margin: 0;
  max-width: 640px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--text-secondary);
}

.generations-history__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: #13131c;
}

.generations-history__filter {
  min-width: 180px;
  flex: 0 1 200px;
}

.generations-history__filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.generations-history__filter-btn {
  min-height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #06b6d4;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.generations-history__filter-btn--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
}

.generations-history__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 320px;
  padding: 48px 24px;
  background: #13131c;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  color: #9b9dab;
  font-size: 14px;
}

.generations-history__retry {
  min-height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.generations-history__table {
  overflow-x: auto;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: #13131c;
}

.generations-history__header,
.generations-history__row {
  display: grid;
  grid-template-columns:
    minmax(160px, 1.2fr)
    minmax(140px, 1.1fr)
    minmax(64px, 0.5fr)
    minmax(88px, 0.65fr)
    minmax(72px, 0.55fr)
    minmax(120px, 1fr)
    minmax(64px, 0.45fr)
    minmax(120px, 0.85fr)
    minmax(72px, 0.5fr);
  gap: 12px;
  align-items: center;
  min-width: 1100px;
  padding: 0 24px;
}

.generations-history__header {
  min-height: 50px;
  border-bottom: 0.5px solid #2d2d38;
  background: #1b1b28;
  font-size: 14px;
  font-weight: 500;
  color: #9b9dab;
}

.generations-history__row {
  min-height: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
}

.generations-history__row:last-child {
  border-bottom: 0;
}

.generations-history__empty {
  padding: 32px;
  text-align: center;
  font-size: 14px;
  color: #9b9dab;
}

.generations-history__task-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.generations-history__model {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #9b9dab;
}

.generations-history__prompt {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #9b9dab;
}

.generations-history__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 400;
}

.generations-history__status--completed {
  background: rgba(0, 216, 141, 0.08);
  color: #00bb83;
}

.generations-history__status--failed {
  background: rgba(255, 87, 87, 0.08);
  color: #ff5757;
}

.generations-history__status--queued {
  background: rgba(255, 255, 255, 0.06);
  color: #9b9dab;
}

.generations-history__status--processing {
  background: rgba(6, 182, 212, 0.08);
  color: #06b6d4;
}

.generations-history__channel {
  color: #9b9dab;
}

.generations-history__cost {
  color: #ebf4fb;
}

.generations-history__time {
  color: #9b9dab;
}

.generations-history__footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.generations-history__view-btn {
  min-height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: rgba(6, 182, 212, 0.12);
  color: #06b6d4;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.generations-history__view-btn:hover {
  background: rgba(6, 182, 212, 0.2);
}

@media (max-width: 1023px) {
  .generations-history-page__inner {
    padding: 96px 12px 32px;
  }

  .generations-history__filter-actions {
    width: 100%;
    margin-left: 0;
  }

  .generations-history__filter-btn {
    flex: 1;
  }
}
</style>
