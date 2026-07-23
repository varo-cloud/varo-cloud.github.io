<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'

export type JsonValueKind = 'array' | 'object'

const model = defineModel<unknown>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  placeholder?: string
  rows?: number
  kind: JsonValueKind
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const draft = ref(props.kind === 'array' ? '[]' : '{}')
const parseError = ref<string | null>(null)

function emptyValue(): unknown {
  return props.kind === 'array' ? [] : null
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return props.kind === 'array' ? '[]' : ''
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return props.kind === 'array' ? '[]' : ''
  }
}

function syncDraftFromModel() {
  draft.value = formatValue(model.value)
  parseError.value = null
}

watch(model, syncDraftFromModel, { immediate: true, deep: true })

function parseDraft(text: string): { ok: true; value: unknown } | { ok: false } {
  const trimmed = text.trim()
  if (!trimmed) {
    parseError.value = null
    return { ok: true, value: emptyValue() }
  }

  try {
    const parsed = JSON.parse(trimmed)

    if (props.kind === 'array') {
      if (!Array.isArray(parsed)) {
        parseError.value = t('pages.modelDetail.fields.jsonValue.mustBeArray')
        return { ok: false }
      }
    } else if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      parseError.value = t('pages.modelDetail.fields.jsonValue.mustBeObject')
      return { ok: false }
    }

    parseError.value = null
    return { ok: true, value: parsed }
  } catch {
    parseError.value = t('pages.modelDetail.fields.jsonValue.invalidJson')
    return { ok: false }
  }
}

function onInput(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value
  const parsed = parseDraft(draft.value)
  if (parsed.ok) {
    model.value = parsed.value
  }
}

function onBlur() {
  const parsed = parseDraft(draft.value)
  if (parsed.ok) {
    model.value = parsed.value
    draft.value = formatValue(parsed.value)
    return
  }
  draft.value = formatValue(model.value)
}
</script>

<template>
  <div class="json-value-field" :class="{ 'json-value-field--invalid': invalid || !!parseError }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid || !!parseError"
    />
    <div class="json-value-field__wrap">
      <textarea
        :value="draft"
        class="json-value-field__input"
        :rows="rows ?? 5"
        :placeholder="placeholder ?? (kind === 'array' ? '[]' : '{}')"
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
.json-value-field__wrap {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.15s ease;
}

.json-value-field--invalid .json-value-field__wrap {
  border-color: #f87171;
}

.json-value-field__input {
  width: 100%;
  min-height: 104px;
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

.json-value-field__input::placeholder {
  color: rgba(235, 244, 251, 0.35);
}
</style>
