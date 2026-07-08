<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const canGoPrev = computed(() => props.page > 1)
const canGoNext = computed(() => props.page < pageCount.value)

const visiblePages = computed(() => {
  const totalPages = pageCount.value
  const current = props.page

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (current < totalPages - 2) pages.push('ellipsis')

  pages.push(totalPages)
  return pages
})

function goToPage(page: number) {
  if (props.disabled || page < 1 || page > pageCount.value || page === props.page) return
  emit('update:page', page)
}

function goPrev() {
  if (!canGoPrev.value) return
  goToPage(props.page - 1)
}

function goNext() {
  if (!canGoNext.value) return
  goToPage(props.page + 1)
}
</script>

<template>
  <nav
    class="app-pagination"
    :aria-label="t('common.pagination.label')"
  >
    <button
      type="button"
      class="app-pagination__nav"
      :disabled="disabled || !canGoPrev"
      @click="goPrev"
    >
      {{ t('common.pagination.prev') }}
    </button>

    <div class="app-pagination__pages">
      <template v-for="(item, index) in visiblePages" :key="`${item}-${index}`">
        <span v-if="item === 'ellipsis'" class="app-pagination__ellipsis" aria-hidden="true">
          …
        </span>
        <button
          v-else
          type="button"
          class="app-pagination__page"
          :class="{ 'app-pagination__page--active': item === page }"
          :disabled="disabled"
          :aria-current="item === page ? 'page' : undefined"
          @click="goToPage(item)"
        >
          {{ item }}
        </button>
      </template>
    </div>

    <button
      type="button"
      class="app-pagination__nav"
      :disabled="disabled || !canGoNext"
      @click="goNext"
    >
      {{ t('common.pagination.next') }}
    </button>
  </nav>
</template>

<style scoped>
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.app-pagination__nav,
.app-pagination__page {
  min-height: 36px;
  min-width: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-pagination__nav:hover:not(:disabled),
.app-pagination__page:hover:not(:disabled):not(.app-pagination__page--active) {
  background: rgba(255, 255, 255, 0.1);
}

.app-pagination__page--active {
  background: rgba(6, 182, 212, 0.12);
  color: #06b6d4;
}

.app-pagination__nav:disabled,
.app-pagination__page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.app-pagination__pages {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-pagination__ellipsis {
  min-width: 24px;
  text-align: center;
  color: #9b9dab;
  font-size: 14px;
  user-select: none;
}
</style>
