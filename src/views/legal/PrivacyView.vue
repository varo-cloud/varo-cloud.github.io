<script setup lang="ts">
import { computed } from 'vue'
import LegalDocument from '@/components/legal/LegalDocument.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { getLegalContent } from '@/content/legal'

const { currentLocale } = useLocaleRouter()
const content = computed(() => getLegalContent('privacy', currentLocale.value))
</script>

<template>
  <div data-seo-ready="privacy">
    <LegalDocument :content="content" />
  </div>
</template>
