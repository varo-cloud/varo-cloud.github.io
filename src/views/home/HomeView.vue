<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchModels } from '@/api/models'
import { modelToPricingItem } from '@/utils/pricing'
import type { Model, PricingItem } from '@/types'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeFeatured from '@/components/home/HomeFeatured.vue'
import HomeDevelopers from '@/components/home/HomeDevelopers.vue'
import HomeCreators from '@/components/home/HomeCreators.vue'
import HomeValueProps from '@/components/home/HomeValueProps.vue'
import HomePricing from '@/components/home/HomePricing.vue'
import HomeShowcase from '@/components/home/HomeShowcase.vue'
import HomeCta from '@/components/home/HomeCta.vue'

const FEATURED_LIMIT = 4
const PRICING_LIMIT = 5

const featuredModels = ref<Model[]>([])
const pricingItems = ref<PricingItem[]>([])

async function loadCatalog() {
  try {
    const page = await fetchModels({ offset: 0, limit: 20 })
    featuredModels.value = page.items.slice(0, FEATURED_LIMIT)
    pricingItems.value = page.items.slice(0, PRICING_LIMIT).map(modelToPricingItem)
  } catch {
    featuredModels.value = []
    pricingItems.value = []
  }
}

onMounted(() => {
  void loadCatalog()
})
</script>

<template>
  <div class="home-page" data-home-ready>
    <HomeHero />
    <HomeFeatured :models="featuredModels" />
    <HomeDevelopers />
    <HomeCreators />
    <HomeValueProps />
    <HomePricing :items="pricingItems" />
    <HomeShowcase />
    <HomeCta />
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  background: #fff;
  color: #222;
}
</style>
