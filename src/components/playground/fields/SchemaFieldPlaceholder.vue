<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'

defineProps<{
  label: string
  required?: boolean
  description?: string
  widgetName: string
  hint?: string
  invalid?: boolean
  errorMessage?: string
}>()
</script>

<template>
  <div class="schema-placeholder" :class="{ 'schema-placeholder--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :invalid="invalid"
    />

    <div class="schema-placeholder__box" :class="{ 'schema-placeholder__box--invalid': invalid }">
      <p class="schema-placeholder__title">{{ widgetName }}</p>
      <p v-if="hint" class="schema-placeholder__hint">{{ hint }}</p>
    </div>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.schema-placeholder__box {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 16px;
  border: 1px dashed rgba(155, 157, 171, 0.45);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 0.15s ease;
}

.schema-placeholder__box--invalid {
  border: 1px solid #f87171;
}

.schema-placeholder__title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #9b9dab;
}

.schema-placeholder__hint {
  margin: 0;
  font-size: 12px;
  color: rgba(155, 157, 171, 0.75);
  text-align: center;
  line-height: 1.5;
}
</style>
