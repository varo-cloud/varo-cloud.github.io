<script setup lang="ts">
import { computed } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import VideoUploaderField from './VideoUploaderField.vue'

const model = defineModel<string[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
  invalid?: boolean
  errorMessage?: string
}>()

const maxCount = computed(() => props.maxItems ?? 4)

const filledCount = computed(() => model.value.filter(Boolean).length)

const counter = computed(() => `${filledCount.value}/${maxCount.value}`)

const slots = computed(() => {
  const result: string[] = []
  for (let i = 0; i < model.value.length; i += 1) {
    result.push(model.value[i] ?? '')
  }

  if (result.length === 0) {
    result.push('')
    return result
  }

  if (result.length < maxCount.value && result[result.length - 1]) {
    result.push('')
  }

  return result
})

function updateSlot(index: number, value: string) {
  const next = [...model.value]

  while (next.length <= index) {
    next.push('')
  }

  next[index] = value
  model.value = next.filter((item, i, arr) => item || arr.slice(i + 1).some(Boolean))
}
</script>

<template>
  <div class="multi-video-field" :class="{ 'multi-video-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
      :invalid="invalid"
    />

    <div class="multi-video-field__list">
      <VideoUploaderField
        v-for="(item, index) in slots"
        :key="index"
        :model-value="item"
        :label="label"
        :show-label="false"
        @update:model-value="updateSlot(index, $event)"
      />
    </div>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.multi-video-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
