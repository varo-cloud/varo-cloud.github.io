<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DiscountTag from '@/components/common/DiscountTag.vue'
import type { PricingItem } from '@/types'
import { formatCapabilityLabel } from '@/utils/capability'
import {
  discountToPercent,
  formatDiscountLabel,
  formatPricingUsd,
  pricingUnitI18nKey,
} from '@/utils/pricing'

const props = defineProps<{
  item: PricingItem
}>()

const emit = defineEmits<{
  view: [slug: string]
}>()

const { t } = useI18n()

const unitLabel = computed(() => t(pricingUnitI18nKey(props.item.priceUnit)))
const useCaseLabel = computed(() => formatCapabilityLabel(props.item.capability))
const standardPrice = computed(() => formatPricingUsd(props.item.standardPriceUsd, props.item.priceUnit))
const startingPrice = computed(() => formatPricingUsd(props.item.startingPriceUsd, props.item.priceUnit))
const discountLabel = computed(() => {
  const percent = discountToPercent(props.item.discount)
  return percent == null ? '' : formatDiscountLabel(percent)
})

function handleView() {
  emit('view', props.item.modelId)
}
</script>

<template>
  <div class="pricing-row">
    <div class="pricing-row__cell pricing-row__cell--model">
      {{ item.name }}
    </div>
    <div class="pricing-row__cell pricing-row__cell--use-case">
      {{ useCaseLabel }}
    </div>
    <div class="pricing-row__cell pricing-row__cell--standard">
      {{ standardPrice }}<span class="pricing-row__unit">{{ unitLabel }}</span>
    </div>
    <div class="pricing-row__cell pricing-row__cell--price">
      <span class="pricing-row__price-value">
        <strong>{{ startingPrice }}</strong><span class="pricing-row__unit">{{ unitLabel }}</span>
      </span>
    </div>
    <div class="pricing-row__cell pricing-row__cell--discount">
      <DiscountTag v-if="discountLabel" :content="discountLabel" />
    </div>
    <div class="pricing-row__cell pricing-row__cell--action">
      <button type="button" class="pricing-row__view-btn" @click="handleView">
        {{ t('pages.pricing.view') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pricing-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.7fr) 71px;
  align-items: center;
  min-height: 80px;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
}

.pricing-row:last-child {
  border-bottom: none;
}

.pricing-row:hover {
  background: rgba(236, 236, 236, 0.2);
}

.pricing-row__cell {
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: #222;
}

.pricing-row__cell--model {
  padding-right: 16px;
  word-break: break-word;
}

.pricing-row__cell--use-case {
  padding-right: 16px;
  color: #9b9dab;
  font-weight: 400;
  white-space: nowrap;
}

.pricing-row__cell--standard {
  text-align: left;
  white-space: nowrap;
}

.pricing-row__unit {
  margin-left: 2px;
  color: #9b9dab;
  font-weight: 400;
}

.pricing-row__cell--price {
  text-align: left;
  white-space: nowrap;
}

.pricing-row__price-value {
  font-size: 14px;
  line-height: 14px;
  color: #9b9dab;
}

.pricing-row__price-value :deep(strong) {
  font-weight: 500;
  color: #06b6d4;
}

.pricing-row__cell--discount {
  display: flex;
  justify-content: flex-start;
}

.pricing-row__cell--action {
  display: flex;
  justify-content: flex-end;
}

.pricing-row__view-btn {
  height: 36px;
  min-width: 71px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #f6f6f6;
  color: #06b6d4;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.pricing-row__view-btn:hover {
  background: #efefef;
}

@media (max-width: 1023px) {
  .pricing-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px 24px;
  }

  .pricing-row__cell--discount {
    justify-content: flex-start;
  }

  .pricing-row__cell--action {
    justify-content: flex-start;
  }
}
</style>
