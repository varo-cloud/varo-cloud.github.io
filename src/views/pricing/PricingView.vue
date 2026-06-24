<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NEmpty, NSpin } from 'naive-ui'
import { fetchPricing } from '@/api/pricing'
import PricingTableRow from '@/components/pricing/PricingTableRow.vue'
import { assetUrl } from '@/utils/assetUrl'
import type { PricingItem } from '@/types'

const { push } = useLocaleRouter()
const { t } = useI18n()

const items = ref<PricingItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadPricing() {
  loading.value = true
  error.value = null

  try {
    items.value = await fetchPricing()
  } catch {
    error.value = t('pages.pricing.loadError')
  } finally {
    loading.value = false
  }
}

function goToModel(id: string) {
  push({ name: 'model-detail', params: { id } })
}

onMounted(() => {
  loadPricing()
})
</script>

<template>
  <div class="pricing-page">
    <section class="pricing-hero" aria-labelledby="pricing-hero-title">
      <img
        class="pricing-hero__bg"
        :src="assetUrl('/assets/pricing/hero-bg.jpg')"
        alt=""
        aria-hidden="true"
      />
      <div class="pricing-hero__overlay" aria-hidden="true" />

      <div class="pricing-hero__content">
        <h1 id="pricing-hero-title" class="pricing-hero__title">
          {{ t('pages.pricing.heroTitle') }}
        </h1>
        <p class="pricing-hero__subtitle">
          {{ t('pages.pricing.heroSubtitle') }}
        </p>
      </div>
    </section>

    <section class="pricing-content">
      <div class="pricing-content__inner">
        <div class="pricing-table">
          <div class="pricing-table__header">
            <span>{{ t('pages.pricing.columns.model') }}</span>
            <span>{{ t('pages.pricing.columns.standardPrice') }}</span>
            <span>{{ t('pages.pricing.columns.price') }}</span>
            <span>{{ t('pages.pricing.columns.discount') }}</span>
            <span class="pricing-table__header-action" aria-hidden="true" />
          </div>

          <div v-if="loading" class="pricing-state">
            <NSpin size="large" />
          </div>

          <div v-else-if="error" class="pricing-state">
            <NEmpty :description="error">
              <template #extra>
                <button type="button" class="pricing-retry" @click="loadPricing">
                  {{ t('pages.pricing.retry') }}
                </button>
              </template>
            </NEmpty>
          </div>

          <div v-else-if="items.length === 0" class="pricing-state">
            <NEmpty :description="t('pages.pricing.empty')" />
          </div>

          <div v-else class="pricing-table__body">
            <PricingTableRow
              v-for="item in items"
              :key="item.id"
              :item="item"
              @view="goToModel"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pricing-page {
  background: #fff;
}

.pricing-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  overflow: hidden;
}

.pricing-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.pricing-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.pricing-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  max-width: 738px;
  padding: 120px 24px 64px;
  text-align: center;
}

.pricing-hero__title {
  margin: 0;
  font-size: clamp(32px, 4.5vw, 50px);
  font-weight: 800;
  line-height: 1.16;
  color: #fff;
}

.pricing-hero__subtitle {
  margin: 0;
  max-width: 640px;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
}

.pricing-content {
  background: #fff;
}

.pricing-content__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 20px 16px 64px;
}

.pricing-table {
  border: 1px solid #d7d7d7;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  background: #fff;
}

.pricing-table__header {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 0.7fr) 71px;
  align-items: center;
  min-height: 50px;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
  background: #fff;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
}

.pricing-table__header-action {
  visibility: hidden;
}

.pricing-table__body {
  background: #fff;
}

.pricing-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.pricing-retry {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  cursor: pointer;
}

@media (min-width: 1024px) {
  .pricing-content__inner {
    padding-inline: 24px;
  }
}

@media (max-width: 1023px) {
  .pricing-table__header {
    display: none;
  }
}

@media (max-width: 767px) {
  .pricing-hero {
    min-height: 360px;
  }

  .pricing-hero__content {
    gap: 20px;
    padding-top: 96px;
    padding-bottom: 48px;
  }
}
</style>
