<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LegalDocument from '@/components/legal/LegalDocument.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { getLegalContent } from '@/content/legal'

const { t } = useI18n()
const { currentLocale } = useLocaleRouter()

const content = computed(() => getLegalContent('terms', currentLocale.value))
const pageTitle = computed(() => t('pages.terms.documentTitle'))
</script>

<template>
  <LegalDocument :content="content" :page-title="pageTitle" />
</template>
