<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import SelectDropdown from '../SelectDropdown.vue'

export type ChatMessageRole = 'system' | 'user' | 'assistant'

export type ChatMessageItem = {
  role: ChatMessageRole
  content: string
}

const DEFAULT_ROLES: ChatMessageRole[] = ['system', 'user', 'assistant']

const model = defineModel<ChatMessageItem[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
  roleOptions?: string[]
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const maxCount = computed(() => props.maxItems ?? 32)
const minCount = computed(() => props.minItems ?? 1)

const roles = computed(() => {
  const fromSchema = (props.roleOptions ?? []).filter((role): role is ChatMessageRole =>
    DEFAULT_ROLES.includes(role as ChatMessageRole),
  )
  return fromSchema.length > 0 ? fromSchema : DEFAULT_ROLES
})

const roleSelectOptions = computed(() =>
  roles.value.map((role) => ({
    label: t(`pages.modelDetail.fields.messages.roles.${role}`),
    value: role,
  })),
)

const counter = computed(() => `${model.value.length}/${maxCount.value}`)

const canAdd = computed(() => model.value.length < maxCount.value)

const canRemove = computed(() => model.value.length > minCount.value)

function createItem(role: ChatMessageRole = 'user'): ChatMessageItem {
  return { role, content: '' }
}

function addItem() {
  if (!canAdd.value) return
  model.value = [...model.value, createItem('user')]
}

function removeItem(index: number) {
  if (!canRemove.value) return
  model.value = model.value.filter((_, i) => i !== index)
}

function updateRole(index: number, role: string | number) {
  const nextRole = String(role) as ChatMessageRole
  if (!roles.value.includes(nextRole)) return
  const next = [...model.value]
  next[index] = { ...next[index], role: nextRole }
  model.value = next
}

function updateContent(index: number, content: string) {
  const next = [...model.value]
  next[index] = { ...next[index], content }
  model.value = next
}
</script>

<template>
  <div class="messages-field" :class="{ 'messages-field--invalid': invalid }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
      :invalid="invalid"
    />

    <div v-if="model.length === 0" class="messages-field__empty">
      {{ t('pages.modelDetail.fields.messages.empty') }}
    </div>

    <div v-else class="messages-field__list">
      <div
        v-for="(item, index) in model"
        :key="index"
        class="messages-field__item"
      >
        <div class="messages-field__item-head">
          <div class="messages-field__role">
            <SelectDropdown
              :model-value="item.role"
              :options="roleSelectOptions"
              @update:model-value="updateRole(index, $event)"
            />
          </div>
          <button
            v-if="canRemove"
            type="button"
            class="messages-field__remove"
            :aria-label="t('pages.modelDetail.fields.messages.removeMessage')"
            @click="removeItem(index)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="messages-field__content-wrap">
          <textarea
            :value="item.content"
            class="messages-field__content"
            rows="4"
            :placeholder="t('pages.modelDetail.fields.messages.contentPlaceholder')"
            @input="updateContent(index, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>

    <button
      v-if="canAdd"
      type="button"
      class="messages-field__add"
      @click="addItem"
    >
      {{ t('pages.modelDetail.fields.messages.addMessage') }}
    </button>

    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.messages-field__empty {
  padding: 16px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
  color: #9b9dab;
  text-align: center;
}

.messages-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages-field__item {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  padding: 12px;
}

.messages-field--invalid .messages-field__item {
  border-color: rgba(248, 113, 113, 0.5);
}

.messages-field__item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.messages-field__role {
  flex: 1;
  min-width: 0;
}

.messages-field__remove {
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

.messages-field__remove:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
}

.messages-field__content-wrap {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 10px;
}

.messages-field__content {
  width: 100%;
  min-height: 88px;
  border: none;
  background: transparent;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  color: #ebf4fb;
  outline: none;
}

.messages-field__content::placeholder {
  color: rgba(235, 244, 251, 0.35);
}

.messages-field__add {
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

.messages-field__add:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
