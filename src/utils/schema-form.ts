import { DEFAULT_KLING_VOICE_ID } from '@/constants/kling-voices'
import type {
  InputSchema,
  ResolvedSchemaField,
  SchemaFormValues,
  SchemaProperty,
  SchemaWidget,
} from '@/types/schema'

const IMAGE_FIELD_KEYS = new Set(['image', 'last_image', 'end_image', 'mask'])

const VIDEO_FIELD_KEYS = new Set(['video'])

const AUDIO_FIELD_KEYS = new Set(['audio'])

const TEXTAREA_FIELD_KEYS = new Set([
  'prompt',
  'negative_prompt',
  'text',
  'sound_effect_prompt',
  'bgm_prompt',
])

const SWITCH_FIELD_KEYS = new Set([
  'generate_audio',
  'enable_web_search',
  'camera_fixed',
  'sound',
  'keep_original_sound',
])

const MULTI_IMAGE_ARRAY_KEYS = new Set(['images', 'reference_images'])

const MULTI_VIDEO_ARRAY_KEYS = new Set(['reference_videos'])

const MULTI_AUDIO_ARRAY_KEYS = new Set(['reference_audios'])

const ARRAY_EDITOR_FIELD_KEYS: Record<string, SchemaWidget> = {
  multi_prompt: 'multi-prompt',
  element_list: 'element-list',
  voice_list: 'voice-list',
}

function isArrayOfObjects(property: SchemaProperty): boolean {
  return property.type === 'array' && property.items?.type === 'object'
}

function resolveWidgetFromUiWidget(
  widget: string | undefined,
  property: SchemaProperty,
): SchemaWidget | null {
  if (!widget) return null

  switch (widget) {
    case 'textarea':
      return 'textarea'
    case 'slider':
      return 'slider'
    case 'image-upload':
      return property.type === 'array' ? 'multi-image-uploader' : 'image-uploader'
    case 'video-upload':
      return property.type === 'array' ? 'multi-video-uploader' : 'video-uploader'
    case 'audio-upload':
      return property.type === 'array' ? 'multi-audio-uploader' : 'audio-uploader'
    default:
      return null
  }
}

export function getFieldLabel(key: string, property: SchemaProperty): string {
  const title = property.title?.trim()
  return title || key
}

export function resolveWidget(key: string, property: SchemaProperty): SchemaWidget {
  const arrayEditor = ARRAY_EDITOR_FIELD_KEYS[key]
  if (arrayEditor && property.type === 'array') return arrayEditor

  if (key === 'voice_id' && property.type === 'string') return 'voice-select'

  const fromWidget = resolveWidgetFromUiWidget(property['x-ui-widget'], property)
  if (fromWidget) return fromWidget

  if (isArrayOfObjects(property)) {
    return 'placeholder'
  }

  if (property.type === 'array') {
    if (MULTI_IMAGE_ARRAY_KEYS.has(key)) return 'multi-image-uploader'
    if (MULTI_VIDEO_ARRAY_KEYS.has(key)) return 'multi-video-uploader'
    if (MULTI_AUDIO_ARRAY_KEYS.has(key)) return 'multi-audio-uploader'
    return 'placeholder'
  }

  if (property.type === 'string') {
    if (IMAGE_FIELD_KEYS.has(key)) return 'image-uploader'
    if (VIDEO_FIELD_KEYS.has(key)) return 'video-uploader'
    if (AUDIO_FIELD_KEYS.has(key)) return 'audio-uploader'
    if (property.enum?.length) return 'select'
    if (TEXTAREA_FIELD_KEYS.has(key)) return 'textarea'
    return 'textarea'
  }

  if (property.type === 'boolean' || SWITCH_FIELD_KEYS.has(key)) return 'switch'

  if (property.type === 'integer' || property.type === 'number') {
    if (key === 'seed') return 'number'
    if (property.enum?.length) return 'select'
    if (property.minimum !== undefined && property.maximum !== undefined) return 'slider'
    return 'number'
  }

  return 'placeholder'
}

export function resolveSchemaFields(schema: InputSchema | undefined): ResolvedSchemaField[] {
  if (!schema?.properties) return []

  const requiredSet = new Set(schema.required ?? [])
  const order = schema['x-order-properties'] ?? Object.keys(schema.properties)
  const seen = new Set<string>()

  const fields: ResolvedSchemaField[] = []

  for (const key of order) {
    const property = schema.properties[key]
    if (!property || seen.has(key)) continue
    seen.add(key)
    fields.push({
      key,
      property,
      widget: resolveWidget(key, property),
      required: requiredSet.has(key),
    })
  }

  for (const [key, property] of Object.entries(schema.properties)) {
    if (seen.has(key)) continue
    fields.push({
      key,
      property,
      widget: resolveWidget(key, property),
      required: requiredSet.has(key),
    })
  }

  return fields
}

function defaultForProperty(key: string, property: SchemaProperty, widget: SchemaWidget): unknown {
  if (property.default !== undefined) return property.default

  switch (widget) {
    case 'textarea':
    case 'text':
      return ''
    case 'switch':
      return false
    case 'number':
      return key === 'seed' ? -1 : 0
    case 'slider':
      return property.minimum ?? 0
    case 'select':
      return property.enum?.[0] ?? ''
    case 'image-uploader':
    case 'video-uploader':
    case 'audio-uploader':
      return ''
    case 'multi-image-uploader':
    case 'multi-audio-uploader':
    case 'multi-video-uploader':
      return []
    case 'multi-prompt':
    case 'element-list':
    case 'voice-list':
      return []
    case 'voice-select':
      return property.default ?? property.enum?.[0] ?? DEFAULT_KLING_VOICE_ID
    case 'placeholder':
      return null
    default:
      return ''
  }
}

export function createDefaultFormValues(schema: InputSchema | undefined): SchemaFormValues {
  if (!schema) return {}

  const values: SchemaFormValues = {}

  for (const field of resolveSchemaFields(schema)) {
    values[field.key] = defaultForProperty(field.key, field.property, field.widget)
  }

  return values
}

export function getSelectOptions(property: SchemaProperty): { label: string; value: string | number }[] {
  return (property.enum ?? []).map((value) => ({
    label: String(value),
    value,
  }))
}

export function getArrayItemProperty(
  property: SchemaProperty,
  itemKey: string,
): SchemaProperty | undefined {
  const items = property.items
  if (!items || items.type !== 'object') return undefined
  return items.properties?.[itemKey]
}

function isStringValueInvalid(value: string, property: SchemaProperty): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  const length = trimmed.length
  if (property.minLength !== undefined && length < property.minLength) return true
  if (property.maxLength !== undefined && length > property.maxLength) return true
  return false
}

function isArrayValueInvalid(value: unknown[], property: SchemaProperty): boolean {
  if (property.minItems !== undefined && value.length < property.minItems) return true
  if (property.maxItems !== undefined && value.length > property.maxItems) return true
  return false
}

export function validateSchemaForm(
  schema: InputSchema | undefined,
  values: SchemaFormValues,
): string[] {
  if (!schema) return []

  const invalid = new Set<string>()

  for (const field of resolveSchemaFields(schema)) {
    const value = values[field.key]

    if (field.required) {
      if (value === undefined || value === null) {
        invalid.add(field.key)
        continue
      }

      if (typeof value === 'string' && !value.trim()) {
        invalid.add(field.key)
        continue
      }

      if (Array.isArray(value) && value.length === 0) {
        invalid.add(field.key)
        continue
      }
    }

    if (typeof value === 'string') {
      if (isStringValueInvalid(value, field.property)) {
        invalid.add(field.key)
        continue
      }
    }

    if (Array.isArray(value) && field.property.type === 'array' && isArrayValueInvalid(value, field.property)) {
      invalid.add(field.key)
    }
  }

  return [...invalid]
}
