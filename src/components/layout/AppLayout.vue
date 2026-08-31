<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import { usePageShell } from '@/composables/usePageShell'

const route = useRoute()
const { lightPage: shellLightPage } = usePageShell()

const isFullBleed = computed(() => route.meta.fullBleed === true)
const usesScrollHeader = computed(() => route.meta.scrollHeader === true)
const isLightPage = shellLightPage
</script>

<template>
  <div
    class="app-layout"
    :class="{
      'app-layout--full-bleed': isFullBleed && !usesScrollHeader,
      'app-layout--light': isLightPage,
    }"
  >
    <AppHeader />
    <main class="app-layout__main">
      <div
        :class="[
          isFullBleed ? 'app-layout__full' : 'app-layout__content',
          { 'app-layout__content--light': isLightPage && !isFullBleed },
        ]"
      >
        <RouterView />
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

.app-layout__main {
  flex: 1;
  width: 100%;
}

.app-layout__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.app-layout__full {
  width: 100%;
}

.app-layout--full-bleed .app-layout__main {
  margin-top: calc(-1 * var(--app-header-height));
}

.app-layout--light {
  background: #fff;
  color: #333;
}

.app-layout__content--light {
  max-width: none;
  padding: 0;
}

@media (max-width: 767px) {
  .app-layout__content {
    padding: 16px 12px 32px;
  }
}
</style>
