<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import SelectDropdown from '../SelectDropdown.vue'

export type MultiPromptItem = {
  prompt: string
  duration: number
}

const model = defineModel<MultiPromptItem[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
  durationMinimum?: number
  durationMaximum?: number
  durationOptions?: number[]
  totalDurationMaximum?: number
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const maxCount = computed(() => props.maxItems ?? 6)
const totalCap = computed(() => props.totalDurationMaximum ?? 15)

const durationSelectOptions = computed(() => {
  if (props.durationOptions?.length) {
    return props.durationOptions.map((value) => ({ label: `${value}s`, value }))
  }

  const min = props.durationMinimum ?? 3
  const max = props.durationMaximum ?? 15
  const options: { label: string; value: number }[] = []
  for (let value = min; value <= max; value += 1) {
    options.push({ label: `${value}s`, value })
  }
  return options
})

const defaultDuration = computed(() => durationSelectOptions.value[2]?.value ?? 5)

const totalDuration = computed(() =>
  model.value.reduce((sum, item) => sum + (item.duration || 0), 0),
)

const counter = computed(() => `${model.value.length}/${maxCount.value}`)

const canAdd = computed(() => model.value.length < maxCount.value)

const durationExceeded = computed(() => totalDuration.value > totalCap.value)

function createItem(): MultiPromptItem {
  return { prompt: '', duration: defaultDuration.value }
}

function addItem() {
  if (!canAdd.value) return
  model.value = [...model.value, createItem()]
}

function removeItem(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function updatePrompt(index: number, prompt: string) {
  const next = [...model.value]
  next[index] = { ...next[index], prompt }
  model.value = next
}

function updateDuration(index: number, duration: number) {
  const next = [...model.value]
  next[index] = { ...next[index], duration: Number(duration) }
  model.value = next
}
</script>

<template>
  <div class="multi-prompt-field" :class="{ 'multi-prompt-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
      :invalid="invalid"
    />

    <p
      v-if="model.length > 0"
      class="multi-prompt-field__duration-hint"
      :class="{ 'multi-prompt-field__duration-hint--warn': durationExceeded }"
    >
      {{ t('pages.modelDetail.fields.multiPrompt.totalDuration', { current: totalDuration, max: totalCap }) }}
    </p>

    <div v-if="model.length === 0" class="multi-prompt-field__empty">
      {{ t('pages.modelDetail.fields.multiPrompt.empty') }}
    </div>

    <div v-else class="multi-prompt-field__list">
      <div
        v-for="(item, index) in model"
        :key="index"
        class="multi-prompt-field__item"
      >
        <div class="multi-prompt-field__item-head">
          <span class="multi-prompt-field__item-title">
            {{ t('pages.modelDetail.fields.multiPrompt.shotLabel', { index: index + 1 }) }}
          </span>
          <button
            type="button"
            class="multi-prompt-field__remove"
            :aria-label="t('pages.modelDetail.fields.multiPrompt.removeShot')"
            @click="removeItem(index)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="multi-prompt-field__prompt-wrap">
          <textarea
            :value="item.prompt"
            class="multi-prompt-field__prompt"
            rows="3"
            :placeholder="t('pages.modelDetail.fields.multiPrompt.promptPlaceholder')"
            @input="updatePrompt(index, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>

        <div class="multi-prompt-field__duration-row">
          <span class="multi-prompt-field__duration-label">
            {{ t('pages.modelDetail.fields.multiPrompt.durationLabel') }}
          </span>
          <div class="multi-prompt-field__duration-select">
            <SelectDropdown
              :model-value="item.duration"
              :options="durationSelectOptions"
              @update:model-value="updateDuration(index, $event as number)"
            />
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="canAdd"
      type="button"
      class="multi-prompt-field__add"
      @click="addItem"
    >
      {{ t('pages.modelDetail.fields.multiPrompt.addShot') }}
    </button>

    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
    <SchemaFieldError
      v-else-if="durationExceeded"
      :message="t('pages.modelDetail.fields.multiPrompt.durationExceeded', { max: totalCap })"
    />
  </div>
</template>

<style scoped>
.multi-prompt-field__duration-hint {
  margin: -4px 0 12px;
  font-size: 12px;
  color: #9b9dab;
}

.multi-prompt-field__duration-hint--warn {
  color: #fbbf24;
}

.multi-prompt-field__empty {
  padding: 16px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
  color: #9b9dab;
  text-align: center;
}

.multi-prompt-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.multi-prompt-field__item {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
}

.multi-prompt-field--invalid .multi-prompt-field__item {
  border-color: rgba(248, 113, 113, 0.5);
}

.multi-prompt-field__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.multi-prompt-field__item-title {
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
}

.multi-prompt-field__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #9b9dab;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.multi-prompt-field__remove:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
}

.multi-prompt-field__prompt-wrap {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}

.multi-prompt-field__prompt {
  width: 100%;
  min-height: 72px;
  border: none;
  background: transparent;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  color: #ebf4fb;
  outline: none;
}

.multi-prompt-field__prompt::placeholder {
  color: rgba(235, 244, 251, 0.35);
}

.multi-prompt-field__duration-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.multi-prompt-field__duration-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #9b9dab;
}

.multi-prompt-field__duration-select {
  flex: 1;
  min-width: 0;
}

.multi-prompt-field__add {
  width: 100%;
  margin-top: 12px;
  height: 36px;
  border: 0.5px dashed rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.multi-prompt-field__add:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
