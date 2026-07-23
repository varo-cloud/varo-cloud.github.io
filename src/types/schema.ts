export type SchemaFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object'

export type SchemaUiWidget =
  | 'textarea'
  | 'slider'
  | 'image-upload'
  | 'video-upload'
  | 'audio-upload'

export type SchemaWidget =
  | 'textarea'
  | 'text'
  | 'select'
  | 'slider'
  | 'switch'
  | 'number'
  | 'image-uploader'
  | 'video-uploader'
  | 'audio-uploader'
  | 'multi-image-uploader'
  | 'multi-audio-uploader'
  | 'multi-video-uploader'
  | 'multi-prompt'
  | 'messages'
  | 'element-list'
  | 'voice-select'
  | 'voice-list'
  | 'string-array'
  | 'json'
  | 'placeholder'

export interface SchemaProperty {
  type: SchemaFieldType
  title?: string
  description?: string
  default?: unknown
  enum?: (string | number)[]
  minimum?: number
  maximum?: number
  step?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  examples?: unknown[]
  items?: SchemaProperty & {
    properties?: Record<string, SchemaProperty>
    required?: string[]
  }
  properties?: Record<string, SchemaProperty>
  required?: string[]
  'x-ui-widget'?: SchemaUiWidget | string
  'x-ui-rows'?: number
  'x-placeholder'?: string
}

export interface InputSchema {
  type: 'object'
  properties: Record<string, SchemaProperty>
  required?: string[]
  'x-order-properties'?: string[]
  /** Example output URL shown in Playground before the user runs the model */
  example_url?: string
}

export interface ResolvedSchemaField {
  key: string
  property: SchemaProperty
  widget: SchemaWidget
  required: boolean
}

export type SchemaFormValues = Record<string, unknown>
