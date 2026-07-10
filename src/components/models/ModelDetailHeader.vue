<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import PlaygroundSelectPanelSearch from '@/components/playground/PlaygroundSelectPanelSearch.vue'
import { usePaginatedModelSearch } from '@/composables/usePaginatedModelSearch'
import { assetUrl } from '@/utils/assetUrl'
import type { Model } from '@/types'

const props = defineProps<{
  title: string
  modelId: string
  slug: string
  description: string
  thumbnailUrl?: string
  prefilledModel?: Model
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { t } = useI18n()

const open = ref(false)
const searchRef = ref<InstanceType<typeof PlaygroundSelectPanelSearch> | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ top: '0px', left: '0px', width: '0px' })
const panelId = useId()
const SCROLL_LOAD_THRESHOLD = 48

let closeTimer: ReturnType<typeof setTimeout> | null = null

const {
  total,
  loading,
  loadingMore,
  searchQuery,
  selectorOptions,
  refresh,
  loadMore,
  resetSearch,
} = usePaginatedModelSearch({
  selectedId: () => props.modelId,
  prefilledModel: () => props.prefilledModel,
  enabled: () => open.value,
  prefetchTotal: true,
})

const thumbnailSrc = computed(() =>
  assetUrl(props.thumbnailUrl || '/assets/model-detail/model-thumb.jpg'),
)

const hasSwitcher = computed(() => total.value === 0 || total.value > 1)

function capabilityLabel(capability?: string): string {
  if (!capability) return ''
  const key = `pages.models.capabilityBadge.${capability}`
  const translated = t(key)
  return translated === key ? capability : translated
}

function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 280)}px`,
  }
}

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function openDropdown() {
  if (!hasSwitcher.value) return
  clearCloseTimer()
  open.value = true
}

function scheduleClose() {
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    open.value = false
  }, 120)
}

function selectOption(id: string) {
  if (id !== props.modelId) {
    emit('select', id)
  }
  open.value = false
}

function onListScroll(event: Event) {
  const el = event.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight > SCROLL_LOAD_THRESHOLD) return
  void loadMore()
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen) {
    resetSearch()
    window.removeEventListener('resize', updatePanelPosition)
    window.removeEventListener('scroll', updatePanelPosition, true)
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    return
  }

  void refresh()

  nextTick(() => {
    updatePanelPosition()
    searchRef.value?.focus()
  })
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  clearCloseTimer()
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <header class="model-header">
    <img
      class="model-header__thumb"
      :src="thumbnailSrc"
      alt=""
    />
    <div class="model-header__content">
      <h1 class="model-header__title">{{ title }}</h1>
      <div
        ref="triggerRef"
        class="model-header__path"
        :class="{
          'model-header__path--interactive': hasSwitcher,
          'model-header__path--open': open,
        }"
        :aria-expanded="hasSwitcher ? open : undefined"
        :aria-controls="hasSwitcher ? panelId : undefined"
        @mouseenter="openDropdown"
        @mouseleave="scheduleClose"
      >
        <code class="model-header__path-text">{{ slug }}</code>
        <AppIcon
          v-if="hasSwitcher"
          name="chevron-down"
          :size="12"
          :class="['model-header__chevron', { 'model-header__chevron--open': open }]"
        />
      </div>
      <p class="model-header__desc">{{ description }}</p>
    </div>

    <Teleport to="body">
      <div
        v-if="open && hasSwitcher"
        :id="panelId"
        ref="panelRef"
        class="playground-select-panel model-header__panel"
        :style="panelStyle"
        role="listbox"
        @mouseenter="openDropdown"
        @mouseleave="scheduleClose"
      >
        <PlaygroundSelectPanelSearch ref="searchRef" v-model="searchQuery" />
        <div
          class="playground-select-panel__scroll scrollbar-subtle"
          @scroll="onListScroll"
        >
          <div v-if="loading" class="playground-select-panel__loading">
            <NSpin size="small" />
          </div>
          <template v-else>
            <button
              v-for="opt in selectorOptions"
              :key="opt.id"
              type="button"
              class="playground-select-panel__option"
              :class="{ 'playground-select-panel__option--selected': opt.id === modelId }"
              role="option"
              :aria-selected="opt.id === modelId"
              @click.stop="selectOption(opt.id)"
            >
              <span class="model-header__option-label">
                <span class="model-header__option-name">{{ opt.label }}</span>
                <span v-if="capabilityLabel(opt.capability)" class="model-header__capability">
                  {{ capabilityLabel(opt.capability) }}
                </span>
                <span v-if="opt.isHot" class="model-header__hot">{{ t('pages.aiGenerator.hot') }}</span>
                <span v-else-if="opt.isNew" class="model-header__new">{{ t('pages.aiGenerator.new') }}</span>
              </span>
              <svg
                v-if="opt.id === modelId"
                class="playground-select-panel__check"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.5 7l3 3 6-6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <p v-if="selectorOptions.length === 0" class="playground-select-panel__empty">
              {{ t('common.noSearchResults') }}
            </p>
            <div v-if="loadingMore" class="playground-select-panel__loading">
              <NSpin size="small" />
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<style scoped>
.model-header {
  display: flex;
  gap: 12px;
  padding: 24px;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.model-header__thumb {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  object-fit: cover;
}

.model-header__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-header__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #ebf4fb;
  line-height: 1.2;
}

.model-header__path {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  height: 24px;
  padding: 0 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
}

.model-header__path--interactive {
  cursor: pointer;
  transition: background 0.15s ease;
}

.model-header__path--interactive:hover,
.model-header__path--open {
  background: rgba(255, 255, 255, 0.1);
}

.model-header__path-text {
  font-family: inherit;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-header__chevron {
  flex-shrink: 0;
  color: #9b9dab;
  transition: transform 0.15s ease;
}

.model-header__chevron--open {
  transform: rotate(180deg);
}

.model-header__panel {
  overflow: hidden;
}

.model-header__panel .playground-select-panel__scroll {
  max-height: min(280px, calc(100vh - 160px));
}

.model-header__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #9b9dab;
}

.model-header__option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.model-header__option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-header__capability {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  color: #9b9dab;
  white-space: nowrap;
}

.model-header__hot {
  flex-shrink: 0;
  padding: 1px 4px;
  border-radius: 4px;
  background: #ff9800;
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  color: #fff;
}

.model-header__new {
  flex-shrink: 0;
  padding: 1px 4px;
  border-radius: 4px;
  background: #06b6d4;
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  color: #fff;
}
</style>
