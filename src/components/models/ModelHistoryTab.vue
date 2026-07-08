<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { fetchModelHistory } from '@/api/models'
import AppPagination from '@/components/common/AppPagination.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useUserStore } from '@/stores/user'
import { formatUsd } from '@/utils/currency'
import { formatTimestamp } from '@/utils/time'
import type { ModelHistoryEntry } from '@/types'

const HISTORY_PAGE_SIZE = 20

const props = defineProps<{
  modelSlug: string
}>()

const emit = defineEmits<{
  viewDetail: [taskId: string]
}>()

const { t, locale } = useI18n()
const { push } = useLocaleRouter()
const userStore = useUserStore()

const items = ref<ModelHistoryEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const total = ref(0)

const pageOffset = computed(() => (currentPage.value - 1) * HISTORY_PAGE_SIZE)

function resetState() {
  items.value = []
  currentPage.value = 1
  total.value = 0
  error.value = null
}

function channelLabel(channel: string) {
  const key = `pages.billing.styles.${channel}`
  const translated = t(key)
  return translated === key ? channel : translated
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
  return `model-history__status--${normalizeStatus(status)}`
}

async function loadHistory() {
  if (!userStore.isLoggedIn) return

  loading.value = true
  error.value = null

  try {
    const page = await fetchModelHistory(props.modelSlug, {
      offset: pageOffset.value,
      limit: HISTORY_PAGE_SIZE,
    })

    items.value = page.items
    total.value = page.total

    const maxPage = Math.max(1, Math.ceil(page.total / HISTORY_PAGE_SIZE))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  } catch {
    error.value = t('pages.modelDetail.history.loadError')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  if (page === currentPage.value || loading.value) return
  currentPage.value = page
  void loadHistory()
}

function goToAuth() {
  void push({ name: 'auth' })
}

function handleViewDetail(taskId: string) {
  emit('viewDetail', taskId)
}

watch(
  () => props.modelSlug,
  () => {
    resetState()
    void loadHistory()
  },
)

onMounted(() => {
  void loadHistory()
})
</script>

<template>
  <div class="model-history">
    <div v-if="!userStore.isLoggedIn" class="model-history__state">
      <p>{{ t('pages.modelDetail.history.loginRequired') }}</p>
      <button type="button" class="model-history__auth-btn" @click="goToAuth">
        {{ t('common.login') }}
      </button>
    </div>

    <div v-else-if="loading" class="model-history__state">
      <NSpin size="large" />
    </div>

    <div v-else-if="error" class="model-history__state">
      <p>{{ error }}</p>
      <button type="button" class="model-history__retry" @click="() => loadHistory()">
        {{ t('pages.modelDetail.history.retry') }}
      </button>
    </div>

    <template v-else>
      <div class="model-history__table" role="table">
        <div class="model-history__header" role="row">
          <span role="columnheader">{{ t('pages.modelDetail.history.columns.taskId') }}</span>
          <span role="columnheader">{{ t('pages.modelDetail.history.columns.status') }}</span>
          <span role="columnheader">{{ t('pages.modelDetail.history.columns.channel') }}</span>
          <span role="columnheader">{{ t('pages.modelDetail.history.columns.cost') }}</span>
          <span role="columnheader">{{ t('pages.modelDetail.history.columns.time') }}</span>
          <span role="columnheader">{{ t('pages.modelDetail.history.columns.actions') }}</span>
        </div>

        <div v-if="items.length === 0" class="model-history__empty">
          {{ t('pages.modelDetail.history.empty') }}
        </div>

        <div v-else class="model-history__body" role="rowgroup">
          <div
            v-for="item in items"
            :key="item.taskId"
            class="model-history__row"
            role="row"
          >
            <span class="model-history__task-id" role="cell">{{ item.taskId }}</span>
            <span role="cell">
              <span class="model-history__status" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </span>
            <span role="cell">
              <span class="model-history__channel">{{ channelLabel(item.invocationChannel) }}</span>
            </span>
            <span class="model-history__cost" role="cell">{{ formatUsd(item.costUsd) }}</span>
            <span class="model-history__time" role="cell">
              {{ formatTimestamp(item.createdAt, locale, 'compactDatetime') }}
            </span>
            <span role="cell">
              <button
                type="button"
                class="model-history__view-btn"
                @click="handleViewDetail(item.taskId)"
              >
                {{ t('pages.modelDetail.history.viewDetail') }}
              </button>
            </span>
          </div>
        </div>
      </div>

      <div v-if="total > 0" class="model-history__footer">
        <AppPagination
          :page="currentPage"
          :page-size="HISTORY_PAGE_SIZE"
          :total="total"
          :disabled="loading"
          @update:page="handlePageChange"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.model-history {
  max-width: 1360px;
  margin: 0 auto;
}

.model-history__state {
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

.model-history__auth-btn,
.model-history__retry {
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

.model-history__auth-btn {
  background: #06b6d4;
  color: #fff;
}

.model-history__table {
  overflow: hidden;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: #13131c;
}

.model-history__header,
.model-history__row {
  display: grid;
  grid-template-columns:
    minmax(180px, 1.6fr)
    minmax(88px, 0.7fr)
    minmax(88px, 0.7fr)
    minmax(72px, 0.55fr)
    minmax(120px, 0.9fr)
    minmax(72px, 0.55fr);
  gap: 12px;
  align-items: center;
  padding: 0 32px;
}

.model-history__header {
  min-height: 50px;
  border-bottom: 0.5px solid #2d2d38;
  background: #1b1b28;
  font-size: 14px;
  font-weight: 500;
  color: #9b9dab;
}

.model-history__row {
  min-height: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
}

.model-history__row:last-child {
  border-bottom: 0;
}

.model-history__empty {
  padding: 32px;
  text-align: center;
  font-size: 14px;
  color: #9b9dab;
}

.model-history__task-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  word-break: break-all;
}

.model-history__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 400;
}

.model-history__status--completed {
  background: rgba(0, 216, 141, 0.08);
  color: #00bb83;
}

.model-history__status--failed {
  background: rgba(255, 87, 87, 0.08);
  color: #ff5757;
}

.model-history__status--queued {
  background: rgba(255, 255, 255, 0.06);
  color: #9b9dab;
}

.model-history__status--processing {
  background: rgba(6, 182, 212, 0.08);
  color: #06b6d4;
}

.model-history__channel {
  color: #9b9dab;
}

.model-history__cost {
  color: #ebf4fb;
}

.model-history__time {
  color: #9b9dab;
}

.model-history__footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.model-history__view-btn {
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

.model-history__view-btn:hover {
  background: rgba(6, 182, 212, 0.2);
}

@media (max-width: 1023px) {
  .model-history__header {
    display: none;
  }

  .model-history__row {
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px;
  }

  .model-history__task-id {
    grid-column: 1 / -1;
  }

  .model-history__view-btn {
    width: 100%;
  }
}
</style>
