<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchModels } from '@/api/models'
import { modelToPricingItem } from '@/utils/pricing'
import type { PricingItem } from '@/types'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeFeatured from '@/components/home/HomeFeatured.vue'
import HomeDevelopers from '@/components/home/HomeDevelopers.vue'
import HomeCreators from '@/components/home/HomeCreators.vue'
import HomeValueProps from '@/components/home/HomeValueProps.vue'
import HomePricing from '@/components/home/HomePricing.vue'
import HomeShowcase from '@/components/home/HomeShowcase.vue'
import HomeCta from '@/components/home/HomeCta.vue'

const PRICING_LIMIT = 5

const pricingItems = ref<PricingItem[]>([])
const pricingLoading = ref(true)

async function loadPricing() {
  pricingLoading.value = true
  try {
    const page = await fetchModels({ offset: 0, limit: PRICING_LIMIT })
    pricingItems.value = page.items.map(modelToPricingItem)
  } catch {
    pricingItems.value = []
  } finally {
    pricingLoading.value = false
  }
}

onMounted(() => {
  void loadPricing()
})
</script>

<template>
  <div class="home-page" data-home-ready data-seo-ready="home">
    <HomeHero />
    <HomeFeatured />
    <HomeDevelopers />
    <HomeCreators />
    <HomeValueProps />
    <HomePricing :items="pricingItems" :loading="pricingLoading" />
    <HomeShowcase />
    <HomeCta />
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: #fff;
  color: #222;
}
</style>
