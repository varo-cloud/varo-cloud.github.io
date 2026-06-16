<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const { t } = useI18n()
</script>

<template>
  <PagePlaceholder
    :title="t('pages.models.title')"
    :description="t('pages.models.placeholder')"
  />
</template>
