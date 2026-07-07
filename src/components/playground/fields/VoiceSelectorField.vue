<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_KLING_VOICE_ID, resolveKlingVoiceOptions } from '@/constants/kling-voices'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import SelectDropdown from '../SelectDropdown.vue'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  enumValues?: (string | number)[]
  defaultValue?: string
  invalid?: boolean
  errorMessage?: string
}>()

const options = computed(() => resolveKlingVoiceOptions(props.enumValues))

const effectiveModel = computed({
  get: () => model.value || props.defaultValue || DEFAULT_KLING_VOICE_ID,
  set: (value: string) => {
    model.value = value
  },
})
</script>

<template>
  <div class="voice-selector-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid"
    />
    <SelectDropdown v-model="effectiveModel" :options="options" :invalid="invalid" />
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>
