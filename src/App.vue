<script setup lang="ts">
import { NConfigProvider, NDialogProvider } from 'naive-ui'
import AppMessageProvider from '@/components/common/AppMessageProvider.vue'
import { useRouteSeo } from '@/seo/useRouteSeo'

useRouteSeo()
</script>

<template>
  <NConfigProvider>
    <AppMessageProvider>
      <NDialogProvider>
        <RouterView />
      </NDialogProvider>
    </AppMessageProvider>
  </NConfigProvider>
</template>
