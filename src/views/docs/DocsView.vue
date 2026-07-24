<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'
import { docsUrl } from '@/utils/docsUrl'

const { t } = useI18n()

onMounted(() => {
  // Skip external redirect during Playwright prerender so meta stays on this host.
  if (navigator.webdriver) return
  const url = docsUrl()
  if (url) {
    window.location.replace(url)
  }
})
</script>

<template>
  <div data-seo-ready="docs">
    <PagePlaceholder
      :title="t('pages.docs.title')"
      :description="t('pages.docs.placeholder')"
    />
  </div>
</template>
