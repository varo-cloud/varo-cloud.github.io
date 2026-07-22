<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 16,
  },
)
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9.703 7.4H3v1.2h6.703l-2.718 2.718.849.849L13 8l-5.166-5.167-.849.849L9.703 7.4Z"
      fill="currentColor"
    />
  </svg>
</template>
