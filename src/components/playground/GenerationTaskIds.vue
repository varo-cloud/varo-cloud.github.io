<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/common/AppIcon.vue'
import { useAppMessage } from '@/composables/useAppMessage'

const props = defineProps<{
  taskIds?: string[]
}>()

const { t } = useI18n()
const message = useAppMessage()

const visibleTaskIds = computed(() =>
  (props.taskIds ?? []).filter((id) => Boolean(id.trim())),
)

async function copyTaskId(taskId: string) {
  try {
    await navigator.clipboard.writeText(taskId)
    message.success(t('pages.modelDetail.codeCopied'))
  } catch {
    message.error(t('pages.modelDetail.copyFailed'))
  }
}
</script>

<template>
  <div v-if="visibleTaskIds.length > 0" class="generation-task-ids">
    <div
      v-for="taskId in visibleTaskIds"
      :key="taskId"
      class="generation-task-ids__row"
    >
      <span class="generation-task-ids__label">
        {{ t('pages.modelDetail.history.columns.taskId') }}
      </span>
      <code class="generation-task-ids__value" :title="taskId">{{ taskId }}</code>
      <button
        type="button"
        class="generation-task-ids__copy"
        :aria-label="t('pages.modelDetail.copyTaskId')"
        @click="copyTaskId(taskId)"
      >
        <AppIcon name="copy" :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.generation-task-ids {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 100%;
}

.generation-task-ids__row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 0.5px solid rgba(255, 255, 255, 0.08);
}

.generation-task-ids__label {
  flex-shrink: 0;
  font-size: 12px;
  color: #9b9dab;
}

.generation-task-ids__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #ebf4fb;
}

.generation-task-ids__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9b9dab;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.generation-task-ids__copy:hover {
  color: #ebf4fb;
  background: rgba(255, 255, 255, 0.08);
}
</style>
