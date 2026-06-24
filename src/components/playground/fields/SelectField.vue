<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import SelectDropdown from '../SelectDropdown.vue'

const model = defineModel<string | number>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  options: { label: string; value: string | number }[]
  invalid?: boolean
  errorMessage?: string
}>()
</script>

<template>
  <div class="select-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid"
    />
    <SelectDropdown v-model="model" :options="options" :invalid="invalid" />
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>
