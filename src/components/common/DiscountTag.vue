<script setup lang="ts">
defineProps<{
  /** Tag display content, e.g. "-10%" */
  content: string | number
}>()
</script>

<template>
  <span class="discount-tag">{{ content }}</span>
</template>

<style scoped>
.discount-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 30px;
  background: #ff9800;
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  white-space: nowrap;
}
</style>
