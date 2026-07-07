<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_KLING_VOICE_ID, resolveKlingVoiceOptions } from '@/constants/kling-voices'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import SelectDropdown from '../SelectDropdown.vue'

export type VoiceListItem = {
  voice_id: string
}

const model = defineModel<VoiceListItem[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
  enumValues?: (string | number)[]
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const maxCount = computed(() => props.maxItems ?? 2)
const voiceOptions = computed(() => resolveKlingVoiceOptions(props.enumValues))
const defaultVoiceId = computed(() => voiceOptions.value[0]?.value ?? DEFAULT_KLING_VOICE_ID)
const counter = computed(() => `${model.value.length}/${maxCount.value}`)
const canAdd = computed(() => model.value.length < maxCount.value)

function createItem(): VoiceListItem {
  return { voice_id: defaultVoiceId.value }
}

function addItem() {
  if (!canAdd.value) return
  model.value = [...model.value, createItem()]
}

function removeItem(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function updateVoiceId(index: number, voiceId: string) {
  const next = [...model.value]
  next[index] = { voice_id: voiceId }
  model.value = next
}
</script>

<template>
  <div class="voice-list-field" :class="{ 'voice-list-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
      :invalid="invalid"
    />

    <div v-if="model.length === 0" class="voice-list-field__empty">
      {{ t('pages.modelDetail.fields.voiceList.empty') }}
    </div>

    <div v-else class="voice-list-field__list">
      <div
        v-for="(item, index) in model"
        :key="index"
        class="voice-list-field__item"
      >
        <div class="voice-list-field__item-head">
          <span class="voice-list-field__item-title">
            {{ t('pages.modelDetail.fields.voiceList.itemLabel', { index: index + 1 }) }}
          </span>
          <button
            type="button"
            class="voice-list-field__remove"
            :aria-label="t('pages.modelDetail.fields.voiceList.removeItem')"
            @click="removeItem(index)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <SelectDropdown
          :model-value="item.voice_id || defaultVoiceId"
          :options="voiceOptions"
          :invalid="invalid"
          @update:model-value="updateVoiceId(index, $event as string)"
        />
      </div>
    </div>

    <button
      v-if="canAdd"
      type="button"
      class="voice-list-field__add"
      @click="addItem"
    >
      {{ t('pages.modelDetail.fields.voiceList.addItem') }}
    </button>

    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.voice-list-field__empty {
  padding: 16px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
  color: #9b9dab;
  text-align: center;
}

.voice-list-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voice-list-field__item {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
}

.voice-list-field--invalid .voice-list-field__item {
  border-color: rgba(248, 113, 113, 0.5);
}

.voice-list-field__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.voice-list-field__item-title {
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
}

.voice-list-field__remove {
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

.voice-list-field__remove:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
}

.voice-list-field__add {
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

.voice-list-field__add:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
