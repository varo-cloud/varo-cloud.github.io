<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTimestamp } from '@/utils/time'
import type { BillingRecord } from '@/types'

const props = defineProps<{
  item: BillingRecord
}>()

const { t, locale } = useI18n()

const timeLabel = computed(() =>
  formatTimestamp(props.item.createdAt, locale.value, 'compactDatetime'),
)

const styleLabel = computed(() => t(`pages.billing.styles.${props.item.style}`))

const isPositive = computed(() => props.item.amountUsd > 0)

const valueLabel = computed(() => {
  const prefix = isPositive.value ? '+' : '-'
  return `${prefix}$${Math.abs(props.item.amountUsd).toFixed(2)}`
})
</script>

<template>
  <div class="billing-record-row" role="row">
    <span class="billing-record-row__time" role="cell">{{ timeLabel }}</span>
    <span class="billing-record-row__style" role="cell">
      <span
        class="billing-record-row__badge"
        :class="`billing-record-row__badge--${item.style}`"
      >
        {{ styleLabel }}
      </span>
    </span>
    <span class="billing-record-row__key" role="cell">{{ item.key }}</span>
    <span
      class="billing-record-row__value"
      :class="{ 'billing-record-row__value--positive': isPositive }"
      role="cell"
    >
      {{ valueLabel }}
    </span>
  </div>
</template>

<style scoped>
.billing-record-row {
  display: grid;
  grid-template-columns: minmax(110px, 0.9fr) minmax(72px, 0.55fr) minmax(180px, 2.2fr) minmax(80px, 0.65fr);
  gap: 12px;
  align-items: center;
  min-height: 41px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.billing-record-row__time {
  color: var(--text-secondary);
}

.billing-record-row__badge {
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

.billing-record-row__badge--api {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.billing-record-row__badge--topup,
.billing-record-row__badge--bonus {
  background: rgba(0, 216, 141, 0.06);
  color: #00bb83;
}

.billing-record-row__key {
  color: var(--text-primary);
}

.billing-record-row__value {
  text-align: right;
  color: var(--text-primary);
}

.billing-record-row__value--positive {
  color: #00bb83;
}

@media (max-width: 767px) {
  .billing-record-row {
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px;
  }

  .billing-record-row__key {
    grid-column: 1 / -1;
  }

  .billing-record-row__value {
    justify-self: end;
  }
}
</style>
