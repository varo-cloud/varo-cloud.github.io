<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatUsd } from '@/utils/currency'
import { formatCountdown, formatTimestamp } from '@/utils/time'
import type { Transaction, TransactionStatus } from '@/types'

const props = defineProps<{
  transaction: Transaction | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()

const isBonus = computed(() => props.transaction?.type === 'bonus')

const status = computed<TransactionStatus>(() => {
  if (props.transaction?.status) return props.transaction.status
  return isBonus.value ? 'active' : 'completed'
})

const paymentDetail = computed(() => {
  if (!props.transaction?.paymentDetail) return '—'
  return props.transaction.paymentDetail
})

const createdLabel = computed(() => {
  if (!props.transaction) return '—'
  return formatTimestamp(props.transaction.createdAt, locale.value, 'compactDatetime')
})

const completedLabel = computed(() => {
  if (!props.transaction?.completedAt) return '—'
  return formatTimestamp(props.transaction.completedAt, locale.value, 'compactDatetime')
})

const amountLabel = computed(() => {
  if (!props.transaction) return '—'
  return formatUsd(props.transaction.amountUsd)
})

const remainingLabel = computed(() => {
  if (!props.transaction || props.transaction.amountRemainingUsd == null) return '—'
  return formatUsd(props.transaction.amountRemainingUsd)
})

const expiresLabel = computed(() => {
  if (!props.transaction?.expiresAt) return '—'
  const countdown = formatCountdown(props.transaction.expiresAt)
  if (!countdown) return formatTimestamp(props.transaction.expiresAt, locale.value, 'compactDatetime')
  if (countdown.expired) return t('pages.billing.bonusExpired')
  return t('pages.billing.bonusExpires', { days: countdown.days, hours: countdown.hours })
})

const feeLabel = computed(() => {
  if (!props.transaction || props.transaction.feeUsd == null) return '—'
  return formatUsd(props.transaction.feeUsd)
})

const providerLabel = computed(() => {
  const provider = props.transaction?.provider
  if (!provider) return '—'
  const key = `pages.billing.providers.${provider}`
  const translated = t(key)
  return translated === key ? provider : translated
})

const paymentMethodLabel = computed(() => {
  const method = props.transaction?.paymentMethod
  if (!method) return '—'
  const key = `pages.billing.paymentMethods.${method}`
  const translated = t(key)
  return translated === key ? method : translated
})

const sourceLabel = computed(() => {
  const source = props.transaction?.source
  if (!source) return t('pages.billing.styles.bonus')
  return t(`pages.billing.bonusSources.${source}`)
})

const statusLabel = computed(() => {
  if (isBonus.value) {
    return t(`pages.billing.bonusLotStatus.${status.value}`)
  }
  return t(`pages.billing.topUpDetail.statuses.${status.value}`)
})

const receiptLabel = computed(() => {
  if (props.transaction?.provider === 'nowpayments') {
    return t('pages.billing.topUpDetail.viewInvoice')
  }
  return t('pages.billing.topUpDetail.viewReceipt')
})

const dialogTitle = computed(() =>
  isBonus.value ? t('pages.billing.topUpDetail.bonusTitle') : t('pages.billing.topUpDetail.title'),
)

const detailRows = computed(() => {
  if (!props.transaction) return []

  if (isBonus.value) {
    return [
      { label: t('pages.billing.topUpDetail.transactionId'), value: props.transaction.id },
      { label: t('pages.billing.topUpDetail.status'), value: statusLabel.value, isStatus: true },
      { label: t('pages.billing.topUpDetail.source'), value: sourceLabel.value },
      { label: t('pages.billing.topUpDetail.amount'), value: amountLabel.value },
      { label: t('pages.billing.topUpDetail.remaining'), value: remainingLabel.value },
      { label: t('pages.billing.topUpDetail.expiresAt'), value: expiresLabel.value },
      { label: t('pages.billing.topUpDetail.createdAt'), value: createdLabel.value },
    ]
  }

  return [
    { label: t('pages.billing.topUpDetail.transactionId'), value: props.transaction.id },
    { label: t('pages.billing.topUpDetail.status'), value: statusLabel.value, isStatus: true },
    { label: t('pages.billing.topUpDetail.provider'), value: providerLabel.value },
    { label: t('pages.billing.topUpDetail.amount'), value: amountLabel.value },
    { label: t('pages.billing.topUpDetail.fee'), value: feeLabel.value },
    { label: t('pages.billing.topUpDetail.paymentMethod'), value: paymentMethodLabel.value },
    { label: t('pages.billing.topUpDetail.paymentDetail'), value: paymentDetail.value },
    { label: t('pages.billing.topUpDetail.createdAt'), value: createdLabel.value },
    { label: t('pages.billing.topUpDetail.completedAt'), value: completedLabel.value },
  ]
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="transaction"
      class="billing-topup-detail-backdrop"
      @click.self="emit('close')"
    >
      <div
        class="billing-topup-detail scrollbar-subtle"
        role="dialog"
        aria-modal="true"
        :aria-label="dialogTitle"
      >
        <div class="billing-topup-detail__header">
          <h3 class="billing-topup-detail__title">{{ dialogTitle }}</h3>
          <button
            type="button"
            class="billing-topup-detail__close"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <p v-if="!isBonus && status === 'pending'" class="billing-topup-detail__hint">
          {{ t('pages.billing.topUpDetail.pendingHint') }}
        </p>
        <p v-else-if="!isBonus && status === 'partial'" class="billing-topup-detail__hint">
          {{ t('pages.billing.topUpDetail.partialHint') }}
        </p>

        <dl class="billing-topup-detail__rows">
          <div
            v-for="row in detailRows"
            :key="row.label"
            class="billing-topup-detail__row"
          >
            <dt>{{ row.label }}</dt>
            <dd>
              <span
                v-if="row.isStatus"
                class="billing-topup-detail__status"
                :class="`billing-topup-detail__status--${status}`"
              >
                {{ row.value }}
              </span>
              <span v-else class="billing-topup-detail__value">{{ row.value }}</span>
            </dd>
          </div>
        </dl>

        <div class="billing-topup-detail__actions">
          <a
            v-if="transaction.receiptUrl && (status === 'completed' || status === 'partial')"
            class="billing-topup-detail__receipt"
            :href="transaction.receiptUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ receiptLabel }}
          </a>
          <button type="button" class="billing-topup-detail__done" @click="emit('close')">
            {{ t('pages.billing.topUpDetail.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.billing-topup-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.6);
}

.billing-topup-detail {
  width: min(100%, 480px);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-card);
}

.billing-topup-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.billing-topup-detail__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.billing-topup-detail__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: -4px -4px 0 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.billing-topup-detail__close:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.billing-topup-detail__hint {
  margin: 0 0 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 152, 0, 0.1);
  font-size: 12px;
  line-height: 1.5;
  color: #ff9800;
}

.billing-topup-detail__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 0 24px;
}

.billing-topup-detail__row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  align-items: start;
}

.billing-topup-detail__row dt {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
}

.billing-topup-detail__row dd {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
  word-break: break-word;
}

.billing-topup-detail__value {
  font-weight: 500;
}

.billing-topup-detail__status {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.billing-topup-detail__status--completed,
.billing-topup-detail__status--active {
  background: rgba(0, 187, 131, 0.12);
  color: #00bb83;
}

.billing-topup-detail__status--pending,
.billing-topup-detail__status--partial,
.billing-topup-detail__status--frozen {
  background: rgba(255, 152, 0, 0.12);
  color: #ff9800;
}

.billing-topup-detail__status--depleted {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.billing-topup-detail__status--failed,
.billing-topup-detail__status--expired {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}

.billing-topup-detail__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.billing-topup-detail__receipt {
  margin-right: auto;
  font-size: 14px;
  color: var(--text-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.billing-topup-detail__receipt:hover {
  opacity: 0.85;
}

.billing-topup-detail__done {
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.billing-topup-detail__done:hover {
  background: rgba(255, 255, 255, 0.14);
}

@media (max-width: 767px) {
  .billing-topup-detail__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .billing-topup-detail__actions {
    flex-wrap: wrap;
  }

  .billing-topup-detail__receipt {
    margin-right: 0;
    width: 100%;
  }
}
</style>
