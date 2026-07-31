<script setup lang="ts">
import { computed } from 'vue'
import AppIcon, { type AppIconName } from '@/components/common/AppIcon.vue'
import type { AppMessageTheme, AppMessageType } from '@/composables/useAppMessage'

const props = withDefaults(
  defineProps<{
    type: AppMessageType
    content: string
    closable?: boolean
    theme?: AppMessageTheme
  }>(),
  {
    closable: true,
    theme: 'dark',
  },
)

const emit = defineEmits<{
  close: []
}>()

const variantClass = computed(() => [
  `app-toast--${props.type}`,
  `app-toast--theme-${props.theme}`,
])

const iconByType: Record<Exclude<AppMessageType, 'loading'>, AppIconName> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
}
</script>

<template>
  <div class="app-toast" :class="variantClass" role="alert">
    <span class="app-toast__icon" aria-hidden="true">
      <AppIcon v-if="type !== 'loading'" colored :name="iconByType[type]" :size="16" />
      <span v-else class="app-toast__spinner" />
    </span>

    <p class="app-toast__content">{{ content }}</p>

    <button
      v-if="closable !== false"
      type="button"
      class="app-toast__close"
      aria-label="Close"
      @click="emit('close')"
    >
      <AppIcon name="close" :size="12" />
    </button>
  </div>
</template>

<style scoped>
.app-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(390px, calc(100vw - 32px));
  min-height: 32px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 16px;
}

.app-toast__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.app-toast__content {
  flex: 1;
  margin: 0;
  word-break: break-word;
}

.app-toast__close {
  display: inline-flex;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  opacity: 0.72;
  cursor: pointer;
}

.app-toast__close:hover {
  opacity: 1;
}

.app-toast__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: app-toast-spin 0.8s linear infinite;
}

/* Dark theme (default) — for dark app pages */
.app-toast--theme-dark {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  color: var(--text-primary);
}

.app-toast--theme-dark .app-toast__close {
  color: var(--text-secondary);
}

.app-toast--theme-dark.app-toast--success {
  background: rgba(0, 187, 131, 0.1);
}

.app-toast--theme-dark.app-toast--error {
  background: rgba(223, 28, 65, 0.1);
}

.app-toast--theme-dark.app-toast--warning {
  background: rgba(242, 123, 44, 0.1);
}

.app-toast--theme-dark.app-toast--info {
  background: rgba(55, 93, 251, 0.1);
}

.app-toast--theme-dark.app-toast--loading {
  background: rgba(255, 255, 255, 0.06);
}

/* Light theme — for light backgrounds (e.g. auth) */
.app-toast--theme-light {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid transparent;
}

.app-toast--theme-light .app-toast__close {
  color: #808080;
}

.app-toast--theme-light.app-toast--success {
  background: #e8faf3;
  border-color: rgba(0, 187, 131, 0.28);
  color: #0a7a55;
}

.app-toast--theme-light.app-toast--error {
  background: #fdecef;
  border-color: rgba(223, 28, 65, 0.28);
  color: #b3122f;
}

.app-toast--theme-light.app-toast--warning {
  background: #fff4eb;
  border-color: rgba(242, 123, 44, 0.28);
  color: #b35a14;
}

.app-toast--theme-light.app-toast--info {
  background: #eef2ff;
  border-color: rgba(55, 93, 251, 0.28);
  color: #2a47c7;
}

.app-toast--theme-light.app-toast--loading {
  background: #f6f6f6;
  border-color: rgba(0, 0, 0, 0.08);
  color: #222;
}

@keyframes app-toast-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
