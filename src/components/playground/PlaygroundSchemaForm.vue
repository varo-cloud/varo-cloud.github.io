<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InputSchema, SchemaFormValues, SchemaProperty } from '@/types/schema'
import {
  createDefaultFormValues,
  getArrayItemProperty,
  getFieldLabel,
  getSelectOptions,
  hasUsableMultiPrompt,
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
import StringArrayField from './fields/StringArrayField.vue'
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

const hasPromptMultiConflict = computed(() => {
  const prompt = model.value.prompt
  return (
    typeof prompt === 'string' &&
    prompt.trim().length > 0 &&
    hasUsableMultiPrompt(model.value)
  )
})

function isFieldInvalid(key: string): boolean {
  return props.invalidFields?.includes(key) ?? false
}

function errorMessageForField(key: string): string {
  if (
    (key === 'prompt' || key === 'multi_prompt') &&
    hasPromptMultiConflict.value &&
    isFieldInvalid(key)
  ) {
    return t('pages.modelDetail.fields.multiPrompt.exclusiveWithPrompt')
  }
  return fieldErrorMessage.value
}

watch(
  () => props.schema,
  (schema) => {
    model.value = createDefaultFormValues(schema)
  },
)

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

function fieldLabel(key: string, property: SchemaProperty) {
  return getFieldLabel(key, property)
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
      <PromptField
        v-if="field.widget === 'textarea'"
        v-model="model[field.key] as string"
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :placeholder="field.property['x-placeholder']"
        :rows="field.property['x-ui-rows']"
        :invalid="isFieldInvalid(field.key)"
        :error-message="errorMessageForField(field.key)"
      />

      <ImageUploaderField
        v-else-if="field.widget === 'image-uploader'"
        v-model="model[field.key] as string"
        :label="fieldLabel(field.key, field.property)"
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
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
        :show-label="true"
      />

      <AudioUploaderField
        v-else-if="field.widget === 'audio-uploader'"
        v-model="model[field.key] as string"
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
        :show-label="true"
      />

      <MultiImageUploaderField
        v-else-if="field.widget === 'multi-image-uploader'"
        v-model="model[field.key] as string[]"
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <MultiPromptField
        v-else-if="field.widget === 'multi-prompt'"
        v-model="model[field.key] as MultiPromptItem[]"
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :duration-options="multiPromptDurationOptions(field.property)"
        :duration-minimum="multiPromptDurationMinimum(field.property)"
        :duration-maximum="multiPromptDurationMaximum(field.property)"
        :invalid="isFieldInvalid(field.key)"
        :error-message="errorMessageForField(field.key)"
      />

      <ElementListField
        v-else-if="field.widget === 'element-list'"
        v-model="model[field.key] as ElementListItem[]"
        :label="fieldLabel(field.key, field.property)"
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
        :label="fieldLabel(field.key, field.property)"
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
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :enum-values="field.property.enum"
        :default-value="field.property.default as string | undefined"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <StringArrayField
        v-else-if="field.widget === 'string-array'"
        v-model="model[field.key] as string[]"
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :placeholder="field.property['x-placeholder']"
        :rows="field.property['x-ui-rows']"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SelectField
        v-else-if="field.widget === 'select'"
        v-model="model[field.key] as string | number"
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :options="getSelectOptions(field.property)"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SliderField
        v-else-if="field.widget === 'slider'"
        v-model="model[field.key] as number"
        :label="fieldLabel(field.key, field.property)"
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
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <NumberField
        v-else-if="field.widget === 'number'"
        v-model="model[field.key] as number"
        :label="fieldLabel(field.key, field.property)"
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
        :label="fieldLabel(field.key, field.property)"
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
        :label="fieldLabel(field.key, field.property)"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
        :invalid="isFieldInvalid(field.key)"
        :error-message="fieldErrorMessage"
      />

      <SchemaFieldPlaceholder
        v-else-if="field.widget === 'placeholder'"
        :label="fieldLabel(field.key, field.property)"
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
</style>
