<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NDropdown } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import VaroCloudLogo from '@/components/common/VaroCloudLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { setStoredLocale, type LocaleType } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const userStore = useUserStore()

const headerSearch = ref('')

const navItems = computed(() => [
  { label: t('nav.models'), name: 'models' },
  { label: t('nav.pricing'), name: 'pricing' },
  ...(userStore.isLoggedIn
    ? [
        { label: t('nav.apiKeys'), name: 'api-keys' },
        { label: t('nav.billing'), name: 'billing' },
      ]
    : []),
  { label: t('nav.docs'), name: 'docs' },
])

const userMenuOptions = computed(() => [
  {
    label: t('common.logout'),
    key: 'logout',
  },
])

const languageMenuOptions = computed(() => [
  { label: 'English', key: 'en-US' },
  { label: '简体中文', key: 'zh-CN' },
])

const balanceLabel = computed(() => {
  if (!userStore.isLoggedIn) return null
  const value = userStore.balanceUsd
  if (value === null) return '—'
  return `$${value.toFixed(2)}`
})

const userInitial = computed(() => {
  const name = userStore.profile?.name ?? userStore.profile?.email ?? ''
  return name.charAt(0).toUpperCase() || '?'
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

function handleLanguageSelect(key: string) {
  const nextLocale = key as LocaleType
  locale.value = nextLocale
  setStoredLocale(nextLocale)
}

function submitHeaderSearch() {
  const q = headerSearch.value.trim()
  router.push({
    name: 'models',
    query: q ? { q } : {},
  })
}

watch(
  () => route.query.q,
  (q) => {
    headerSearch.value = typeof q === 'string' ? q : ''
  },
  { immediate: true },
)

onMounted(() => {
  userStore.loadProfile()
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__left">
        <RouterLink to="/" class="app-header__logo" :aria-label="t('common.appName')">
          <VaroCloudLogo variant="dark" />
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

      <div
        v-if="userStore.isLoggedIn"
        class="app-header__center hidden lg:block"
      >
        <label class="app-header__search">
          <AppIcon name="search" class="app-header__search-icon" />
          <input
            v-model="headerSearch"
            type="search"
            class="app-header__search-input"
            :placeholder="t('header.searchModels')"
            @keydown.enter.prevent="submitHeaderSearch"
          />
        </label>
      </div>

      <div class="app-header__right">
        <NDropdown
          trigger="click"
          :options="languageMenuOptions"
          @select="handleLanguageSelect"
        >
          <button
            type="button"
            class="app-header__icon-btn"
            :aria-label="t('common.language')"
          >
            <AppIcon name="globe" />
          </button>
        </NDropdown>

        <template v-if="userStore.isLoggedIn">
          <div class="app-header__wallet-group">
            <div class="app-header__wallet-balance" :title="t('common.balance')">
              <AppIcon name="wallet" />
              <span>{{ balanceLabel }}</span>
            </div>
            <button
              type="button"
              class="app-header__wallet-deposit"
              @click="goTo('billing')"
            >
              <AppIcon name="deposit" />
              <span>{{ t('common.deposit') }}</span>
            </button>
          </div>

          <NDropdown
            trigger="click"
            :options="userMenuOptions"
            @select="handleUserMenuSelect"
          >
            <button type="button" class="app-header__user-trigger">
              <span class="app-header__avatar">{{ userInitial }}</span>
              <AppIcon name="chevron-down" />
            </button>
          </NDropdown>
        </template>

        <button
          v-else
          type="button"
          class="app-header__login-link"
          @click="router.push({ name: 'auth' })"
        >
          {{ t('common.login') }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 80px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(10, 10, 14, 0.3);
  backdrop-filter: blur(8px);
  color: #ebf4fb;
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-shrink: 0;
}

.app-header__center {
  flex: 1;
  min-width: 0;
  max-width: 360px;
  margin: 0 24px;
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
  color: #9b9dab;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.app-header__nav-item.is-active {
  color: #ebf4fb;
}

.app-header__nav-item:hover {
  color: #ebf4fb;
  background: transparent;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.app-header__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: #13131c;
  cursor: text;
}

.app-header__search-icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.app-header__search-input {
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  color: #ebf4fb;
  font-size: 14px;
  line-height: 1;
  outline: none;
}

.app-header__search-input::placeholder {
  color: #fff;
  opacity: 0.2;
}

.app-header__icon-btn,
.app-header__user-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: #13131c;
  color: #ebf4fb;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.app-header__icon-btn {
  width: 36px;
  padding: 0;
}

.app-header__icon-btn:hover,
.app-header__user-trigger:hover,
.app-header__wallet-deposit:hover {
  opacity: 0.85;
}

.app-header__wallet-group {
  display: flex;
  gap: 1px;
}

.app-header__wallet-balance,
.app-header__wallet-deposit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 8px;
  border: none;
  background: #13131c;
  color: #ebf4fb;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.app-header__wallet-balance {
  border-radius: 8px 0 0 8px;
}

.app-header__wallet-deposit {
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.app-header__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #ff9c39;
  color: #13131c;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
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

.app-header__login-link:hover {
  opacity: 0.85;
}

@media (max-width: 767px) {
  .app-header__inner {
    padding: 0 12px;
  }

  .app-header__logo {
    transform: scale(0.9);
    transform-origin: left center;
  }

  .app-header__wallet-deposit span {
    display: none;
  }

  .app-header__wallet-deposit {
    padding: 0 8px;
  }
}
</style>
