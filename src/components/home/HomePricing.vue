<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import DiscountTag from '@/components/common/DiscountTag.vue'
import {
  discountToPercent,
  formatDiscountLabel,
  formatPricingUsd,
  pricingUnitI18nKey,
} from '@/utils/pricing'
import { formatCapabilityLabel } from '@/utils/capability'
import type { PricingItem } from '@/types'

const props = withDefaults(
  defineProps<{
    items: PricingItem[]
    loading?: boolean
  }>(),
  { loading: false },
)

const { t } = useI18n()
const { push } = useLocaleRouter()

const SKELETON_ROW_COUNT = 5

const rows = computed(() =>
  props.items.map((item) => {
    const discount = discountToPercent(item.discount)
    return {
      ...item,
      useCase: formatCapabilityLabel(item.capability),
      standardLabel: formatPricingUsd(item.standardPriceUsd ?? item.startingPriceUsd, item.priceUnit),
      priceLabel: formatPricingUsd(item.startingPriceUsd, item.priceUnit),
      unitLabel: t(pricingUnitI18nKey(item.priceUnit)),
      discountLabel: discount == null ? '' : formatDiscountLabel(discount),
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
            <template v-if="loading">
              <tr v-for="n in SKELETON_ROW_COUNT" :key="`sk-${n}`" class="home-pricing__skeleton-row">
                <td>
                  <div class="home-pricing__model">
                    <span class="home-pricing__skel home-pricing__skel--name" />
                    <span class="home-pricing__skel home-pricing__skel--use" />
                  </div>
                </td>
                <td><span class="home-pricing__skel home-pricing__skel--price" /></td>
                <td><span class="home-pricing__skel home-pricing__skel--price" /></td>
                <td><span class="home-pricing__skel home-pricing__skel--tag" /></td>
                <td><span class="home-pricing__skel home-pricing__skel--btn" /></td>
              </tr>
            </template>
            <tr v-else-if="!rows.length">
              <td colspan="5" class="home-pricing__empty">
                {{ t('pages.home.pricing.empty') }}
              </td>
            </tr>
            <template v-else>
              <tr v-for="row in rows" :key="row.id">
                <td>
                  <div class="home-pricing__model">
                    <span class="home-pricing__model-name">{{ row.name }}</span>
                    <span class="home-pricing__model-use">{{ row.useCase }}</span>
                  </div>
                </td>
                <td>{{ row.standardLabel }}</td>
                <td>
                  <span class="home-pricing__price">
                    <strong class="home-pricing__price-value">{{ row.priceLabel }}</strong>
                    <span class="home-pricing__unit">{{ row.unitLabel }}</span>
                  </span>
                </td>
                <td>
                  <DiscountTag v-if="row.discountLabel" :content="row.discountLabel" />
                </td>
                <td>
                  <button type="button" class="home-pricing__view" @click="viewModel(row.modelId)">
                    {{ t('pages.pricing.view') }}
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="home-pricing__cards" aria-label="Pricing" :aria-busy="loading || undefined">
        <template v-if="loading">
          <article
            v-for="n in SKELETON_ROW_COUNT"
            :key="`card-sk-${n}`"
            class="home-pricing__card home-pricing__card--skeleton"
          >
            <div class="home-pricing__card-head">
              <div class="home-pricing__model">
                <span class="home-pricing__skel home-pricing__skel--name" />
                <span class="home-pricing__skel home-pricing__skel--use" />
              </div>
              <span class="home-pricing__skel home-pricing__skel--tag" />
            </div>
            <div class="home-pricing__card-prices home-pricing__card-prices--skeleton">
              <span class="home-pricing__skel home-pricing__skel--block" />
              <span class="home-pricing__skel home-pricing__skel--block" />
            </div>
            <span class="home-pricing__skel home-pricing__skel--btn-full" />
          </article>
        </template>
        <p v-else-if="!rows.length" class="home-pricing__empty home-pricing__empty--card">
          {{ t('pages.home.pricing.empty') }}
        </p>
        <template v-else>
          <article v-for="row in rows" :key="`card-${row.id}`" class="home-pricing__card">
            <div class="home-pricing__card-head">
              <div class="home-pricing__model">
                <span class="home-pricing__model-name">{{ row.name }}</span>
                <span class="home-pricing__model-use">{{ row.useCase }}</span>
              </div>
              <DiscountTag v-if="row.discountLabel" :content="row.discountLabel" />
            </div>
            <dl class="home-pricing__card-prices">
              <div>
                <dt>{{ t('pages.pricing.columns.standardPrice') }}</dt>
                <dd>
                  {{ row.standardLabel }}<span class="home-pricing__unit">{{ row.unitLabel }}</span>
                </dd>
              </div>
              <div>
                <dt>{{ t('pages.pricing.columns.price') }}</dt>
                <dd>
                  <span class="home-pricing__price">
                    <strong class="home-pricing__price-value">{{ row.priceLabel }}</strong>
                    <span class="home-pricing__unit">{{ row.unitLabel }}</span>
                  </span>
                </dd>
              </div>
            </dl>
            <button type="button" class="home-pricing__view" @click="viewModel(row.modelId)">
              {{ t('pages.pricing.view') }}
            </button>
          </article>
        </template>
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
  min-width: 0;
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
  color: #222;
}

.home-pricing__table-wrap {
  margin-top: 40px;
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  -webkit-overflow-scrolling: touch;
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
  background: transparent;
}

.home-pricing__table tr:last-child td {
  border-bottom: 0;
}

.home-pricing__empty {
  text-align: center;
  color: #9b9dab !important;
}

.home-pricing__empty--card {
  margin: 0;
  padding: 24px 16px;
}

.home-pricing__model {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.home-pricing__model-name {
  word-break: break-word;
}

.home-pricing__model-use {
  color: #9b9dab;
  font-size: 12px;
  font-weight: 400;
}

.home-pricing__price {
  white-space: nowrap;
}

.home-pricing__price-value {
  color: #06b6d4;
  font-weight: 600;
}

.home-pricing__unit {
  margin-left: 2px;
  color: #9b9dab;
  font-weight: 400;
}

.home-pricing__skel {
  display: inline-block;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f1f3 25%, #e6e7eb 37%, #f0f1f3 63%);
  background-size: 400% 100%;
  animation: home-pricing-shimmer 1.4s ease infinite;
}

.home-pricing__skel--name {
  width: 140px;
  height: 14px;
}

.home-pricing__skel--use {
  width: 96px;
  height: 12px;
}

.home-pricing__skel--price {
  width: 72px;
  height: 14px;
}

.home-pricing__skel--tag {
  width: 48px;
  height: 22px;
  border-radius: 30px;
}

.home-pricing__skel--btn {
  width: 64px;
  height: 36px;
  border-radius: 8px;
}

.home-pricing__skel--block {
  width: 100%;
  height: 40px;
}

.home-pricing__skel--btn-full {
  width: 100%;
  height: 36px;
  border-radius: 8px;
}

.home-pricing__card-prices--skeleton {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
  transition: background 0.15s ease;
}

.home-pricing__view:hover {
  background: rgba(6, 182, 212, 0.18);
}

.home-pricing__cards {
  display: none;
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
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.home-pricing__more:hover {
  background: #f8f8f8;
  border-color: #d8dee6;
}

@keyframes home-pricing-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@media (max-width: 767px) {
  .home-pricing {
    padding: 56px 16px;
  }

  .home-pricing__subtitle {
    font-size: 14px;
  }

  .home-pricing__table-wrap {
    display: none;
  }

  .home-pricing__cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 28px;
    text-align: left;
  }

  .home-pricing__card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border: 1px solid #eee;
    border-radius: 16px;
    background: #fff;
  }

  .home-pricing__card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .home-pricing__card-prices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 0;
  }

  .home-pricing__card-prices dt {
    margin: 0 0 4px;
    color: #9b9dab;
    font-size: 12px;
    font-weight: 500;
  }

  .home-pricing__card-prices dd {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #222;
  }

  .home-pricing__card .home-pricing__view {
    width: 100%;
  }

  .home-pricing__more {
    width: 100%;
  }
}
</style>
