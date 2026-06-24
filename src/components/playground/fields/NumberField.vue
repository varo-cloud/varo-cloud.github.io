<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import NumberStepperInput from '@/components/common/NumberStepperInput.vue'

const model = defineModel<number>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  minimum?: number
  maximum?: number
  step?: number
  invalid?: boolean
  errorMessage?: string
}>()
</script>

<template>
  <div class="number-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid"
    />
    <NumberStepperInput
      v-model="model"
      :min="minimum"
      :max="maximum"
      :step="step ?? 1"
      :invalid="invalid"
    />
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>
