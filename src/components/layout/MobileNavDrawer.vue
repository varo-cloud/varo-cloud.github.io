<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NDrawer, NDrawerContent, NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

const activeKey = computed(() => {
  if (route.name === 'model-detail') return 'models'
  return String(route.name ?? 'models')
})

const menuOptions = computed<MenuOption[]>(() => [
  { label: t('nav.models'), key: 'models' },
  { label: t('nav.pricing'), key: 'pricing' },
  { label: t('nav.apiKeys'), key: 'api-keys' },
  { label: t('nav.billing'), key: 'billing' },
  { label: t('nav.docs'), key: 'docs' },
])

function handleSelect(key: string) {
  appStore.closeMobileNav()
  router.push({ name: key })
}
</script>

<template>
  <NDrawer
    :show="appStore.mobileNavOpen"
    placement="left"
    :width="280"
    @update:show="(value) => !value && appStore.closeMobileNav()"
  >
    <NDrawerContent :title="t('common.appName')">
      <NMenu
        :value="activeKey"
        :options="menuOptions"
        @update:value="handleSelect"
      />
    </NDrawerContent>
  </NDrawer>
</template>
