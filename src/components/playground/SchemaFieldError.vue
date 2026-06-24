<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <p class="schema-field-error" role="alert">{{ message }}</p>
</template>

<style scoped>
.schema-field-error {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: #f87171;
}
</style>
