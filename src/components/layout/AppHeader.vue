<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NDropdown,
  NSpace,
  NTag,
} from 'naive-ui'
import { useUserStore } from '@/stores/user'
import VaroCloudLogo from '@/components/common/VaroCloudLogo.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const isTransparent = computed(() => route.meta.transparentHeader === true)

const navItems = computed(() => [
  { label: t('nav.models'), name: 'models' },
  { label: t('nav.pricing'), name: 'pricing' },
  { label: t('nav.apiKeys'), name: 'api-keys' },
  { label: t('nav.billing'), name: 'billing' },
  { label: t('nav.docs'), name: 'docs' },
])

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
  <header
    class="app-header"
    :class="{ 'app-header--transparent': isTransparent }"
  >
    <div class="app-header__inner">
      <div class="app-header__left">
        <RouterLink to="/" class="app-header__logo" :aria-label="t('common.appName')">
          <VaroCloudLogo :variant="isTransparent ? 'dark' : 'light'" />
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

        <template v-if="userStore.isLoggedIn">
          <NDropdown
            :options="userMenuOptions"
            @select="handleUserMenuSelect"
          >
            <NButton quaternary :class="{ 'app-header__user-btn--light': isTransparent }">
              {{ userStore.profile?.name ?? userStore.profile?.email }}
            </NButton>
          </NDropdown>
        </template>
        <template v-else-if="isTransparent">
          <button
            type="button"
            class="app-header__login-link"
            @click="router.push({ name: 'auth' })"
          >
            {{ t('common.login') }}
          </button>
          <button
            type="button"
            class="app-header__signup-btn"
            @click="router.push({ name: 'auth' })"
          >
            {{ t('pages.models.heroSignup') }}
          </button>
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
  height: 80px;
  border-bottom: none;
  background: var(--bg-header);
  backdrop-filter: blur(8px);
}

.app-header--transparent {
  position: relative;
  border-bottom: none;
  background: transparent;
  backdrop-filter: none;
  color: #ebf4fb;
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.app-header--transparent .app-header__inner {
  max-width: 1360px;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.app-header__logo {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
  line-height: 0;
}

.app-header__nav {
  gap: 24px;
  margin-left: 8px;
}

.app-header__nav-item {
  padding: 6px 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.app-header--transparent .app-header__nav-item {
  color: #9b9dab;
}

.app-header--transparent .app-header__nav-item.is-active {
  color: #ebf4fb;
}

.app-header__nav-item.is-active,
.app-header__nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.app-header--transparent .app-header__nav-item:hover {
  color: #ebf4fb;
  background: transparent;
}

.app-header__right {
  flex-shrink: 0;
}

.app-header__login-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #ebf4fb;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.app-header__signup-btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.app-header__signup-btn:hover {
  background: #f5f5f5;
}

@media (max-width: 767px) {
  .app-header__inner {
    padding: 0 12px;
  }

  .app-header__logo {
    transform: scale(0.9);
    transform-origin: left center;
  }

  .app-header__signup-btn {
    padding: 0 12px;
    font-size: 13px;
  }
}
</style>
