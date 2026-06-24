<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'

const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  placeholder?: string
  rows?: number
  invalid?: boolean
  errorMessage?: string
}>()
</script>

<template>
  <div class="prompt-field" :class="{ 'prompt-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid"
    />
    <div class="prompt-field__wrap">
      <textarea
        v-model="model"
        class="prompt-field__input"
        :rows="rows ?? 8"
        :placeholder="placeholder"
        :aria-invalid="invalid || undefined"
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
  min-height: 120px;
  border: none;
  background: transparent;
  resize: vertical;
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
