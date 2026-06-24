<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    size?: 'md' | 'sm'
    invalid?: boolean
  }>(),
  {
    step: 1,
    size: 'md',
  },
)

function clamp(value: number) {
  if (!Number.isFinite(value)) return props.min ?? 0

  let next = value
  if (props.min !== undefined) next = Math.max(props.min, next)
  if (props.max !== undefined) next = Math.min(props.max, next)
  return next
}

const canIncrement = computed(
  () => props.max === undefined || model.value < props.max,
)

const canDecrement = computed(
  () => props.min === undefined || model.value > props.min,
)

function increment() {
  if (!canIncrement.value) return
  model.value = clamp(model.value + props.step)
}

function decrement() {
  if (!canDecrement.value) return
  model.value = clamp(model.value - props.step)
}

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  model.value = clamp(value)
}
</script>

<template>
  <div
    class="number-stepper"
    :class="[`number-stepper--${size}`, { 'number-stepper--invalid': invalid }]"
  >
    <input
      :value="model"
      type="number"
      class="number-stepper__input"
      :min="min"
      :max="max"
      :step="step"
      @input="onInput"
    />
    <div class="number-stepper__controls">
      <button
        type="button"
        class="number-stepper__btn"
        :disabled="!canIncrement"
        aria-label="Increase"
        @click="increment"
      >
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
          <path
            d="M7.88653 3.9302C8.00923 4.05713 7.91927 4.26922 7.74271 4.26922H0.14377C-0.032785 4.26922 -0.122745 4.05716 0 3.93022L3.79904 0C3.87765 -0.0813254 4.00801 -0.081334 4.08663 0L7.88653 3.9302Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        class="number-stepper__btn"
        :disabled="!canDecrement"
        aria-label="Decrease"
        @click="decrement"
      >
        <svg width="8" height="5" viewBox="0 0 9 5" fill="none" aria-hidden="true">
          <path d="M0 0H8.542L4.271 4.418L0 0Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.number-stepper {
  display: flex;
  align-items: stretch;
  width: 100%;
  border: 0.5px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.number-stepper--invalid {
  border-color: #f87171;
}

.number-stepper--md {
  height: 36px;
}

.number-stepper--sm {
  height: 32px;
}

.number-stepper__input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0 8px 0 12px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: #ebf4fb;
  outline: none;
  appearance: textfield;
}

.number-stepper__input::-webkit-outer-spin-button,
.number-stepper__input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.number-stepper__controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex-shrink: 0;
  width: 32px;
  padding-right: 10px;
  color: #9b9dab;
}

.number-stepper__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 7px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.number-stepper__btn:hover:not(:disabled) {
  color: #ebf4fb;
}

.number-stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.number-stepper__btn svg {
  display: block;
}
</style>
