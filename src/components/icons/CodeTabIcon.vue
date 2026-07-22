<script setup lang="ts">
withDefaults(
  defineProps<{
    name: 'http' | 'python' | 'javascript'
    size?: number
  }>(),
  {
    size: 20,
  },
)
</script>

<template>
  <!-- HTTP: chevron brackets -->
  <svg
    v-if="name === 'http'"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M7.5 5.5L3.5 10L7.5 14.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12.5 5.5L16.5 10L12.5 14.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <!-- Python: simplified dual-curve mark -->
  <svg
    v-else-if="name === 'python'"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 3C7.2 3 6.5 4.2 6.5 5.5V8H11.5C13.4 8 14.5 9.1 14.5 11V13C14.5 15.2 13 16.5 10.5 16.5H9.5V18"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M10 17C12.8 17 13.5 15.8 13.5 14.5V12H8.5C6.6 12 5.5 10.9 5.5 9V7C5.5 4.8 7 3.5 9.5 3.5H10.5V2"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="8.75" cy="5.75" r="0.75" fill="currentColor" />
    <circle cx="11.25" cy="14.25" r="0.75" fill="currentColor" />
  </svg>

  <!-- Node.js: hexagon -->
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 2.75L16.25 6.375V13.625L10 17.25L3.75 13.625V6.375L10 2.75Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path
      d="M10 7.25V12.75"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M7.75 8.75L10 7.25L12.25 8.75"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
