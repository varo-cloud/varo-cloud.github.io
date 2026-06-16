<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NDropdown,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui'
import type { LocaleType } from '@/i18n'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()
const userStore = useUserStore()

const navItems = computed(() => [
  { label: t('nav.models'), name: 'models' },
  { label: t('nav.apiKeys'), name: 'api-keys' },
  { label: t('nav.billing'), name: 'billing' },
  { label: t('nav.docs'), name: 'docs' },
])

const localeOptions = [
  { label: 'English', value: 'en-US' },
  { label: '中文', value: 'zh-CN' },
]

const userMenuOptions = computed(() => [
  {
    label: t('common.logout'),
    key: 'logout',
  },
])

const balanceLabel = computed(() => {
  if (!userStore.isLoggedIn) return null
  const value = userStore.balanceUsd
  if (value === null) return '—'
  return `$${value.toFixed(2)}`
})

function isActive(name: string) {
  if (name === 'models') {
    return route.name === 'models' || route.name === 'model-detail'
  }
  return route.name === name
}

function goTo(name: string) {
  router.push({ name })
}

function handleLocaleChange(value: string) {
  appStore.setLocale(value as LocaleType)
}

function handleUserMenuSelect(key: string) {
  if (key === 'logout') {
    userStore.logout()
    router.push({ name: 'models' })
  }
}

onMounted(() => {
  userStore.loadProfile()
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__left">
        <button
          class="app-header__menu-btn md:hidden"
          type="button"
          aria-label="Open menu"
          @click="appStore.openMobileNav()"
        >
          <span class="app-header__menu-icon" aria-hidden="true" />
        </button>
        <RouterLink to="/" class="app-header__logo">
          {{ t('common.appName') }}
        </RouterLink>
        <nav class="app-header__nav hidden md:flex">
          <button
            v-for="item in navItems"
            :key="item.name"
            type="button"
            class="app-header__nav-item"
            :class="{ 'is-active': isActive(item.name) }"
            @click="goTo(item.name)"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>

      <NSpace align="center" :size="12" class="app-header__right">
        <NTag v-if="userStore.isLoggedIn && balanceLabel" type="info" round>
          {{ t('common.balance') }}: {{ balanceLabel }}
        </NTag>

        <NSelect
          :value="appStore.locale"
          :options="localeOptions"
          size="small"
          class="app-header__locale"
          @update:value="handleLocaleChange"
        />

        <template v-if="userStore.isLoggedIn">
          <NDropdown
            :options="userMenuOptions"
            @select="handleUserMenuSelect"
          >
            <NButton quaternary>
              {{ userStore.profile?.name ?? userStore.profile?.email }}
            </NButton>
          </NDropdown>
        </template>
        <NButton v-else type="primary" @click="router.push({ name: 'auth' })">
          {{ t('common.login') }}
        </NButton>
      </NSpace>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-header);
  backdrop-filter: blur(8px);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.app-header__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.app-header__menu-icon {
  display: block;
  width: 20px;
  height: 2px;
  background: currentColor;
  box-shadow: 0 -6px 0 currentColor, 0 6px 0 currentColor;
}

.app-header__logo {
  font-size: 16px;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.app-header__nav {
  gap: 4px;
  margin-left: 8px;
}

.app-header__nav-item {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.app-header__nav-item.is-active,
.app-header__nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.app-header__right {
  flex-shrink: 0;
}

.app-header__locale {
  width: 110px;
}

@media (max-width: 767px) {
  .app-header__inner {
    padding: 10px 12px;
  }

  .app-header__logo {
    font-size: 14px;
  }

  .app-header__locale {
    width: 96px;
  }
}
</style>
