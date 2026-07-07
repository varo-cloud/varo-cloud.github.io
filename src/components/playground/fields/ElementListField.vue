<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'

export type ElementListItem = {
  element_id: string
}

const model = defineModel<ElementListItem[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const maxCount = computed(() => props.maxItems ?? 3)

const counter = computed(() => `${model.value.length}/${maxCount.value}`)

const canAdd = computed(() => model.value.length < maxCount.value)

function createItem(): ElementListItem {
  return { element_id: '' }
}

function addItem() {
  if (!canAdd.value) return
  model.value = [...model.value, createItem()]
}

function removeItem(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function updateElementId(index: number, elementId: string) {
  const next = [...model.value]
  next[index] = { element_id: elementId }
  model.value = next
}
</script>

<template>
  <div class="element-list-field" :class="{ 'element-list-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
      :invalid="invalid"
    />

    <div v-if="model.length === 0" class="element-list-field__empty">
      {{ t('pages.modelDetail.fields.elementList.empty') }}
    </div>

    <div v-else class="element-list-field__list">
      <div
        v-for="(item, index) in model"
        :key="index"
        class="element-list-field__item"
      >
        <div class="element-list-field__item-head">
          <span class="element-list-field__item-title">
            {{ t('pages.modelDetail.fields.elementList.itemLabel', { index: index + 1 }) }}
          </span>
          <button
            type="button"
            class="element-list-field__remove"
            :aria-label="t('pages.modelDetail.fields.elementList.removeItem')"
            @click="removeItem(index)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <input
          :value="item.element_id"
          type="text"
          class="element-list-field__input"
          :placeholder="t('pages.modelDetail.fields.elementList.placeholder')"
          @input="updateElementId(index, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <button
      v-if="canAdd"
      type="button"
      class="element-list-field__add"
      @click="addItem"
    >
      {{ t('pages.modelDetail.fields.elementList.addItem') }}
    </button>

    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.element-list-field__empty {
  padding: 16px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
  color: #9b9dab;
  text-align: center;
}

.element-list-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.element-list-field__item {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
}

.element-list-field--invalid .element-list-field__item {
  border-color: rgba(248, 113, 113, 0.5);
}

.element-list-field__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.element-list-field__item-title {
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
}

.element-list-field__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #9b9dab;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.element-list-field__remove:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
}

.element-list-field__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 0.5px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-family: inherit;
  font-size: 14px;
  color: #ebf4fb;
  outline: none;
  transition: border-color 0.15s ease;
}

.element-list-field__input::placeholder {
  color: rgba(235, 244, 251, 0.35);
}

.element-list-field__input:focus {
  border-color: rgba(255, 255, 255, 0.18);
}

.element-list-field__add {
  width: 100%;
  margin-top: 12px;
  height: 36px;
  border: 0.5px dashed rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.element-list-field__add:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
