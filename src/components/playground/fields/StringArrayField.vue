<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'

const model = defineModel<string[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  placeholder?: string
  rows?: number
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const draft = ref('[]')
const parseError = ref<string | null>(null)

function formatValue(value: string[]): string {
  return JSON.stringify(value ?? [])
}

function syncDraftFromModel() {
  draft.value = formatValue(model.value)
  parseError.value = null
}

watch(model, syncDraftFromModel, { immediate: true, deep: true })

function parseDraft(text: string): string[] | null {
  const trimmed = text.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    if (!Array.isArray(parsed)) {
      parseError.value = t('pages.modelDetail.fields.stringArray.mustBeArray')
      return null
    }
    if (!parsed.every((item) => typeof item === 'string')) {
      parseError.value = t('pages.modelDetail.fields.stringArray.mustBeStrings')
      return null
    }
    parseError.value = null
    return parsed
  } catch {
    parseError.value = t('pages.modelDetail.fields.stringArray.invalidJson')
    return null
  }
}

function onInput(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value
  const parsed = parseDraft(draft.value)
  if (parsed !== null) {
    model.value = parsed
  }
}

function onBlur() {
  const parsed = parseDraft(draft.value)
  if (parsed !== null) {
    model.value = parsed
    draft.value = formatValue(parsed)
    return
  }
  draft.value = formatValue(model.value)
}
</script>

<template>
  <div class="string-array-field" :class="{ 'string-array-field--invalid': invalid || !!parseError }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid || !!parseError"
    />
    <div class="string-array-field__wrap">
      <textarea
        :value="draft"
        class="string-array-field__input"
        :rows="rows ?? 4"
        :placeholder="placeholder ?? '[]'"
        :aria-invalid="invalid || parseError ? true : undefined"
        spellcheck="false"
        @input="onInput"
        @blur="onBlur"
      />
    </div>
    <SchemaFieldError v-if="parseError" :message="parseError" />
    <SchemaFieldError v-else-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.string-array-field__wrap {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.15s ease;
}

.string-array-field--invalid .string-array-field__wrap {
  border-color: #f87171;
}

.string-array-field__input {
  width: 100%;
  min-height: 88px;
  border: none;
  background: transparent;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #ebf4fb;
  outline: none;
}

.string-array-field__input::placeholder {
  color: rgba(235, 244, 251, 0.35);
}
</style>
