<script setup lang="ts">
import { computed, nextTick, onMounted, type ComponentPublicInstance } from 'vue'
import { useAutoHeightTextarea } from '@/composables/useAutoHeightTextarea'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  invalid?: boolean
  errorMessage?: string
}>()

const autoHeight = useAutoHeightTextarea(model, props.rows)
const { syncHeight, emptyRows } = autoHeight

const charCounter = computed(() => {
  if (props.maxLength === undefined) return undefined
  return `${model.value.length}/${props.maxLength}`
})

const overMaxLength = computed(
  () => props.maxLength !== undefined && model.value.length > props.maxLength,
)

function bindTextareaRef(el: Element | ComponentPublicInstance | null) {
  autoHeight.textareaRef.value = el instanceof HTMLTextAreaElement ? el : null
  if (el instanceof HTMLTextAreaElement) nextTick(syncHeight)
}

onMounted(() => nextTick(syncHeight))
</script>

<template>
  <div class="prompt-field" :class="{ 'prompt-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="charCounter"
      :counter-warn="overMaxLength"
      :invalid="invalid"
    />
    <div class="prompt-field__wrap">
      <textarea
        :ref="bindTextareaRef"
        v-model="model"
        class="prompt-field__input scrollbar-subtle"
        :rows="emptyRows"
        :placeholder="placeholder"
        :aria-invalid="invalid || undefined"
        @input="syncHeight"
      />
    </div>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.prompt-field__wrap {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.15s ease;
}

.prompt-field--invalid .prompt-field__wrap {
  border-color: #f87171;
}

.prompt-field__input {
  width: 100%;
  max-height: calc(1.4em * 12);
  overflow-x: hidden;
  overflow-y: auto;
  border: none;
  background: transparent;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  color: #ebf4fb;
  outline: none;
}

.prompt-field__input::placeholder {
  color: rgba(235, 244, 251, 0.35);
}
</style>
