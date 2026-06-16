<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="page-placeholder">
    <h1 class="page-placeholder__title">{{ title }}</h1>
    <p v-if="description" class="page-placeholder__desc">{{ description }}</p>
    <p class="page-placeholder__hint">{{ $t('common.designPending') }}</p>
  </section>
</template>

<style scoped>
.page-placeholder {
  padding: 48px 0;
  text-align: center;
}

.page-placeholder__title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 600;
}

.page-placeholder__desc {
  margin: 0 0 8px;
  color: var(--text-secondary);
}

.page-placeholder__hint {
  margin: 24px 0 0;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
