<script setup lang="ts">
import { NTooltip } from 'naive-ui'

defineProps<{
  label: string
  required?: boolean
  description?: string
  counter?: string
  invalid?: boolean
}>()
</script>

<template>
  <div class="schema-field-label" :class="{ 'schema-field-label--invalid': invalid }">
    <div class="schema-field-label__row">
      <span class="schema-field-label__text">
        {{ label }}<span v-if="required" class="schema-field-label__req">*</span>
      </span>
      <NTooltip v-if="description" trigger="hover" placement="top">
        <template #trigger>
          <button
            type="button"
            class="schema-field-label__info"
            :aria-label="description"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1" />
              <path d="M6 5.2V8.4M6 3.6V3.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
        </template>
        {{ description }}
      </NTooltip>
      <span v-if="counter" class="schema-field-label__counter">{{ counter }}</span>
    </div>
  </div>
</template>

<style scoped>
.schema-field-label__row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.schema-field-label__text {
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
  line-height: 12px;
}

.schema-field-label__req {
  color: #ebf4fb;
}

.schema-field-label--invalid .schema-field-label__text,
.schema-field-label--invalid .schema-field-label__req {
  color: #f87171;
}

.schema-field-label__info {
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: #9b9dab;
  cursor: help;
}

.schema-field-label__counter {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: #9b9dab;
}
</style>
