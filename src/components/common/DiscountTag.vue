<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Tag display content, e.g. "-10%" */
    content: string | number
    /** `sm` for model cards (12px); default `md` for pricing tables (14px) */
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'md',
  },
)
</script>

<template>
  <span class="discount-tag" :class="`discount-tag--${size}`">{{ content }}</span>
</template>

<style scoped>
.discount-tag {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  background: #ff9800;
  color: #fff;
  font-weight: 400;
  white-space: nowrap;
}

.discount-tag--md {
  padding: 4px 8px;
  font-size: 14px;
  line-height: 14px;
}

.discount-tag--sm {
  padding: 2px 6px;
  font-size: 12px;
  line-height: 12px;
}
</style>
