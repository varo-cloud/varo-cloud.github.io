<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import MobileNavDrawer from './MobileNavDrawer.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <MobileNavDrawer />
    <main class="app-layout__main">
      <div class="app-layout__content">
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

@media (max-width: 767px) {
  .app-layout__content {
    padding: 16px 12px 32px;
  }
}
</style>
