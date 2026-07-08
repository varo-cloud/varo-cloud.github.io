<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InputSchema, SchemaFormValues, SchemaProperty } from '@/types/schema'
import {
  createDefaultFormValues,
  getArrayItemProperty,
  getSelectOptions,
  resolveSchemaFields,
} from '@/utils/schema-form'
import PromptField from './fields/PromptField.vue'
import ImageUploaderField from './fields/ImageUploaderField.vue'
import MultiImageUploaderField from './fields/MultiImageUploaderField.vue'
import MultiVideoUploaderField from './fields/MultiVideoUploaderField.vue'
import MultiAudioUploaderField from './fields/MultiAudioUploaderField.vue'
import MultiPromptField, { type MultiPromptItem } from './fields/MultiPromptField.vue'
import ElementListField, { type ElementListItem } from './fields/ElementListField.vue'
import VoiceListField, { type VoiceListItem } from './fields/VoiceListField.vue'
import VoiceSelectorField from './fields/VoiceSelectorField.vue'
import VideoUploaderField from './fields/VideoUploaderField.vue'
import AudioUploaderField from './fields/AudioUploaderField.vue'
import SelectField from './fields/SelectField.vue'
import SliderField from './fields/SliderField.vue'
import SwitchField from './fields/SwitchField.vue'
import NumberField from './fields/NumberField.vue'
import SchemaFieldPlaceholder from './fields/SchemaFieldPlaceholder.vue'

const props = defineProps<{
  schema?: InputSchema
  invalidFields?: string[]
}>()

const model = defineModel<SchemaFormValues>({ required: true })
const { t } = useI18n()

const fields = computed(() => resolveSchemaFields(props.schema))
const fieldErrorMessage = computed(() => t('pages.modelDetail.fieldRequired'))

const hasPromptField = computed(() => fields.value.some((field) => field.key === 'prompt'))
const hasMultiPromptField = computed(() => fields.value.some((field) => field.key === 'multi_prompt'))
const showPromptModeToggle = computed(() => hasPromptField.value && hasMultiPromptField.value)
const promptInputMode = ref<'single' | 'multi'>('single')

function isFieldInvalid(key: string): boolean {
  return props.invalidFields?.includes(key) ?? false
}

function shouldShowPromptField(key: string): boolean {
  if (key !== 'prompt') return true
  return !hasMultiPromptField.value || promptInputMode.value === 'single'
}

function shouldShowMultiPromptField(): boolean {
  return !hasPromptField.value || promptInputMode.value === 'multi'
}

function setPromptInputMode(mode: 'single' | 'multi') {
  promptInputMode.value = mode
}

watch(
  () => props.schema,
  (schema) => {
    model.value = createDefaultFormValues(schema)
    promptInputMode.value = 'single'
  },
)

watch(promptInputMode, (mode) => {
  if (!showPromptModeToggle.value) return

  if (mode === 'single') {
    model.value = { ...model.value, multi_prompt: [] }
    return
  }

  model.value = { ...model.value, prompt: '' }
  const shots = model.value.multi_prompt
  if (!Array.isArray(shots) || shots.length === 0) {
    model.value = {
      ...model.value,
      multi_prompt: [{ prompt: '', duration: 5 }],
    }
  }
})

function lastImageHint(key: string): string | undefined {
  if (key !== 'last_image' && key !== 'end_image') return undefined
  return 'Optional — animates the image into a video (switches to image-to-video)'
}

function multiPromptDurationOptions(fieldProperty: SchemaProperty) {
  const durationProp = getArrayItemProperty(fieldProperty, 'duration')
  return durationProp?.enum?.map((value) => Number(value))
}

function multiPromptDurationMinimum(fieldProperty: SchemaProperty) {
  return getArrayItemProperty(fieldProperty, 'duration')?.minimum
}

function multiPromptDurationMaximum(fieldProperty: SchemaProperty) {
  return getArrayItemProperty(fieldProperty, 'duration')?.maximum
}
</script>

<template>
  <div class="schema-form">
    <div
      v-for="field in fields"
      :key="field.key"
      class="schema-form__field"
      :data-invalid-field="isFieldInvalid(field.key) || undefined"
    >
      <div
        v-if="field.key === 'prompt' && showPromptModeToggle"
        class="schema-form__prompt-mode"
      >
        <button
          type="button"
          class="schema-form__prompt-mode-btn"
          :class="{ 'schema-form__prompt-mode-btn--active': promptInputMode === 'single' }"
          @click="setPromptInputMode('single')"
        >
          {{ t('pages.modelDetail.fields.promptMode.single') }}
        </button>
        <button
          type="button"
          class="schema-form__prompt-mode-btn"
          :class="{ 'schema-form__prompt-mode-btn--active': promptInputMode === 'multi' }"
          @click="setPromptInputMode('multi')"
        >
          {{ t('pages.modelDetail.fields.promptMode.multi') }}
        </button>
      </div>

      <PromptField
        v-if="field.widget === 'textarea' && shouldShowPromptField(field.key)"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <ImageUploaderField
        v-else-if="field.widget === 'image-uploader'"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :hint="lastImageHint(field.key)"
        :compact="field.key === 'last_image' || field.key === 'end_image'"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
        :show-label="true"
      />

      <VideoUploaderField
        v-else-if="field.widget === 'video-uploader'"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <AudioUploaderField
        v-else-if="field.widget === 'audio-uploader'"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <MultiImageUploaderField
        v-else-if="field.widget === 'multi-image-uploader'"
        v-model="model[field.key] as string[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <MultiPromptField
        v-else-if="field.widget === 'multi-prompt' && shouldShowMultiPromptField()"
        v-model="model[field.key] as MultiPromptItem[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :duration-options="multiPromptDurationOptions(field.property)"
        :duration-minimum="multiPromptDurationMinimum(field.property)"
        :duration-maximum="multiPromptDurationMaximum(field.property)"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <ElementListField
        v-else-if="field.widget === 'element-list'"
        v-model="model[field.key] as ElementListItem[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <VoiceListField
        v-else-if="field.widget === 'voice-list'"
        v-model="model[field.key] as VoiceListItem[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :enum-values="getArrayItemProperty(field.property, 'voice_id')?.enum"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <VoiceSelectorField
        v-else-if="field.widget === 'voice-select'"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :enum-values="field.property.enum"
        :default-value="field.property.default as string | undefined"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SelectField
        v-else-if="field.widget === 'select'"
        v-model="model[field.key] as string | number"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :options="getSelectOptions(field.property)"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SliderField
        v-else-if="field.widget === 'slider'"
        v-model="model[field.key] as number"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :minimum="field.property.minimum"
        :maximum="field.property.maximum"
        :step="field.property.step"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SwitchField
        v-else-if="field.widget === 'switch'"
        v-model="model[field.key] as boolean"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <NumberField
        v-else-if="field.widget === 'number'"
        v-model="model[field.key] as number"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :minimum="field.property.minimum"
        :maximum="field.property.maximum"
        :step="field.property.step"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <MultiAudioUploaderField
        v-else-if="field.widget === 'multi-audio-uploader'"
        v-model="model[field.key] as string[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <MultiVideoUploaderField
        v-else-if="field.widget === 'multi-video-uploader'"
        v-model="model[field.key] as string[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SchemaFieldPlaceholder
        v-else-if="field.widget === 'placeholder'"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        widget-name="UnknownWidget"
        :hint="$t('pages.modelDetail.placeholder.unknownWidget')"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />
    </div>
  </div>
</template>

<style scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.schema-form__field:last-child {
  margin-bottom: 0;
}

.schema-form__prompt-mode {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.schema-form__prompt-mode-btn {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #9b9dab;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.schema-form__prompt-mode-btn--active {
  background: rgba(255, 255, 255, 0.12);
  color: #ebf4fb;
}
</style>
