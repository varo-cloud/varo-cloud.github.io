<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/common/AppIcon.vue'
import { formatTimestamp } from '@/utils/time'
import type { ApiKey } from '@/types'

const props = defineProps<{
  item: ApiKey
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const { t, locale } = useI18n()

const createdLabel = computed(() =>
  formatTimestamp(props.item.createdAt, locale.value, 'compactDatetime'),
)

const lastUsedLabel = computed(() => {
  if (props.item.lastUsedAt == null) return t('pages.apiKeys.neverUsed')
  return formatTimestamp(props.item.lastUsedAt, locale.value, 'compactDatetime')
})

const callsSpendLabel = computed(() => {
  const calls = props.item.totalCalls.toLocaleString(locale.value)
  const spend = props.item.totalSpendUsd.toLocaleString(locale.value, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return { calls, spend }
})
</script>

<template>
  <div class="api-key-row" role="row">
    <div class="api-key-row__cell api-key-row__cell--name" role="cell">
      {{ item.name }}
    </div>
    <div class="api-key-row__cell api-key-row__cell--key" role="cell">
      {{ item.keyMasked }}
    </div>
    <div class="api-key-row__cell api-key-row__cell--created" role="cell">
      {{ createdLabel }}
    </div>
    <div class="api-key-row__cell api-key-row__cell--status" role="cell">
      <span
        class="api-key-row__status"
        :class="item.status === 'active' ? 'is-active' : 'is-revoked'"
      >
        {{ t(`pages.apiKeys.status.${item.status}`) }}
      </span>
    </div>
    <div class="api-key-row__cell api-key-row__cell--usage" role="cell">
      <span class="api-key-row__calls">{{ callsSpendLabel.calls }}</span>
      <span class="api-key-row__sep"> · </span>
      <span>{{ callsSpendLabel.spend }}</span>
    </div>
    <div class="api-key-row__cell api-key-row__cell--last-used" role="cell">
      {{ lastUsedLabel }}
    </div>
    <div class="api-key-row__cell api-key-row__cell--action" role="cell">
      <button
        type="button"
        class="api-key-row__delete"
        :aria-label="t('pages.apiKeys.deleteKey')"
        @click="emit('delete', item.id)"
      >
        <AppIcon name="delete" :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.api-key-row {
  display: grid;
  grid-template-columns: minmax(90px, 1.1fr) minmax(120px, 2fr) minmax(100px, 1fr) minmax(72px, 0.8fr) minmax(120px, 1.2fr) minmax(90px, 1fr) 32px;
  gap: 12px;
  align-items: center;
  min-height: 41px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.api-key-row__cell {
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.api-key-row__cell--name {
  color: var(--text-primary);
}

.api-key-row__cell--key,
.api-key-row__cell--created,
.api-key-row__cell--usage,
.api-key-row__cell--last-used {
  color: var(--text-secondary);
}

.api-key-row__calls {
  color: var(--text-primary);
}

.api-key-row__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.api-key-row__status.is-active {
  background: rgba(0, 216, 141, 0.06);
  color: #00bb83;
}

.api-key-row__status.is-revoked {
  background: rgba(255, 46, 88, 0.06);
  color: #ff2e58;
}

.api-key-row__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.api-key-row__delete:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 1023px) {
  .api-key-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    padding: 16px;
  }

  .api-key-row__cell--action {
    grid-column: 2;
    justify-self: end;
  }

  .api-key-row__cell--key {
    grid-column: 1 / -1;
  }
}
</style>
