<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import {
  computeDiscountPercent,
  formatDiscountLabel,
  formatPricingUsd,
  pricingUnitI18nKey,
} from '@/utils/pricing'
import { formatCapabilityLabel } from '@/utils/capability'
import type { PricingItem } from '@/types'

const props = defineProps<{
  items: PricingItem[]
}>()

const { t } = useI18n()
const { push } = useLocaleRouter()

const rows = computed(() =>
  props.items.map((item) => {
    const discount = computeDiscountPercent(item.standardPriceUsd, item.startingPriceUsd)
    return {
      ...item,
      useCase: formatCapabilityLabel(item.capability),
      standardLabel: formatPricingUsd(item.standardPriceUsd ?? item.startingPriceUsd, item.priceUnit),
      priceLabel: formatPricingUsd(item.startingPriceUsd, item.priceUnit),
      unitLabel: t(pricingUnitI18nKey(item.priceUnit)),
      discountLabel: discount == null ? '—' : formatDiscountLabel(discount),
    }
  }),
)

function viewModel(modelId: string) {
  push({ name: 'model-detail', params: { slug: modelId } })
}

function viewMore() {
  push({ name: 'pricing' })
}
</script>

<template>
  <section class="home-pricing" aria-labelledby="home-pricing-title">
    <div class="home-pricing__inner">
      <h2 id="home-pricing-title" class="home-pricing__title">
        {{ t('pages.home.pricing.title') }}
      </h2>
      <p class="home-pricing__subtitle">{{ t('pages.home.pricing.subtitle') }}</p>

      <div class="home-pricing__table-wrap">
        <table class="home-pricing__table">
          <thead>
            <tr>
              <th>{{ t('pages.pricing.columns.model') }}</th>
              <th>{{ t('pages.pricing.columns.standardPrice') }}</th>
              <th>{{ t('pages.pricing.columns.price') }}</th>
              <th>{{ t('pages.pricing.columns.discount') }}</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="!rows.length">
              <td colspan="5" class="home-pricing__empty">
                {{ t('pages.home.pricing.empty') }}
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="home-pricing__model">
                  <span class="home-pricing__model-name">{{ row.name }}</span>
                  <span class="home-pricing__model-use">{{ row.useCase }}</span>
                </div>
              </td>
              <td>{{ row.standardLabel }}</td>
              <td>
                <div class="home-pricing__price">
                  <span class="home-pricing__price-label">{{ t('pages.pricing.startFrom') }}</span>
                  <span>
                    <strong>{{ row.priceLabel }}</strong>{{ row.unitLabel }}
                  </span>
                </div>
              </td>
              <td>
                <span
                  class="home-pricing__discount"
                  :class="{ 'is-active': row.discountLabel !== '—' }"
                >
                  {{ row.discountLabel }}
                </span>
              </td>
              <td>
                <button type="button" class="home-pricing__view" @click="viewModel(row.modelId)">
                  {{ t('pages.pricing.view') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button type="button" class="home-pricing__more" @click="viewMore">
        {{ t('pages.home.pricing.viewMore') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.home-pricing {
  padding: 80px 16px;
  background: #fff;
}

.home-pricing__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  text-align: center;
}

.home-pricing__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #222;
}

.home-pricing__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #9b9dab;
}

.home-pricing__table-wrap {
  margin-top: 40px;
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 16px;
  background: #fff;
  text-align: left;
}

.home-pricing__table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.home-pricing__table th,
.home-pricing__table td {
  padding: 22px 24px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  font-size: 14px;
  font-weight: 500;
  color: #222;
}

.home-pricing__table th {
  color: #9b9dab;
  font-weight: 500;
  background: #fafafa;
}

.home-pricing__table tr:last-child td {
  border-bottom: 0;
}

.home-pricing__empty {
  text-align: center;
  color: #9b9dab !important;
}

.home-pricing__model {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.home-pricing__model-use {
  color: #9b9dab;
  font-size: 12px;
}

.home-pricing__price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.home-pricing__price-label {
  color: #9b9dab;
}

.home-pricing__price strong {
  color: #06b6d4;
  font-weight: 600;
}

.home-pricing__discount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.home-pricing__discount.is-active {
  padding: 4px 8px;
  border-radius: 30px;
  background: #ff9800;
  color: #fff;
}

.home-pricing__view {
  min-height: 36px;
  padding: 8px 18px;
  border: 0;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.home-pricing__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  margin-top: 32px;
  padding: 12px 24px;
  border: 1px solid #ebf4fb;
  border-radius: 8px;
  background: transparent;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
</style>
