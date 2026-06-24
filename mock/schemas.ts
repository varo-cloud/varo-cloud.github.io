import type { InputSchema } from '../src/types/schema'

/** Source: wavespeed.ai model_schema/bytedance/seedance-2.0/text-to-video */
export const seedance20T2vSchema: InputSchema = {
  type: 'object',
  example_url:
    'https://static.wavespeed.ai/examples/dfdcb9026c2f476ca9bf742f80e19fb0/d40dccd0-a2c9-4d00-ac2b-a43712128da8.mp4#t=0.001',
  required: ['prompt'],
  'x-order-properties': [
    'prompt',
    'reference_images',
    'reference_videos',
    'reference_audios',
    'aspect_ratio',
    'resolution',
    'duration',
    'enable_web_search',
    'generate_audio',
  ],
  properties: {
    prompt: {
      type: 'string',
      description: 'Describe the scene, action, camera movement, and mood for the video.',
    },
    reference_images: {
      type: 'array',
      description: 'Reference image URLs to guide visual style, characters, or scene composition.',
      items: { type: 'string' },
      maxItems: 9,
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'image/*' },
    },
    reference_videos: {
      type: 'array',
      description: 'Reference video URLs (total length must not exceed 15 seconds).',
      items: { type: 'string' },
      maxItems: 3,
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'video/*' },
    },
    reference_audios: {
      type: 'array',
      description: 'Reference audio URLs (total length must not exceed 15 seconds).',
      items: { type: 'string' },
      maxItems: 3,
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'audio/*' },
    },
    aspect_ratio: {
      type: 'string',
      description: 'The aspect ratio of the generated video.',
      enum: ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
      default: '16:9',
      'x-ui-component': 'select',
    },
    resolution: {
      type: 'string',
      description: 'The output video resolution.',
      enum: ['480p', '720p', '1080p', '4k'],
      default: '720p',
      'x-ui-component': 'select',
    },
    duration: {
      type: 'integer',
      description: 'The duration of the generated video in seconds (4-15s).',
      minimum: 4,
      maximum: 15,
      default: 5,
      'x-ui-component': 'slider',
    },
    enable_web_search: {
      type: 'boolean',
      description: 'Enable web search for real-time information.',
      default: false,
    },
    generate_audio: {
      type: 'boolean',
      description:
        'Whether to generate native audio synchronized with the output video. Defaults to true.',
      default: true,
    },
  },
}

export const seedanceI2vSchema: InputSchema = {
  type: 'object',
  required: ['image', 'prompt'],
  'x-order-properties': [
    'prompt',
    'image',
    'last_image',
    'reference_images',
    'aspect_ratio',
    'duration',
    'resolution',
    'generate_audio',
    'camera_fixed',
    'seed',
  ],
  properties: {
    prompt: {
      type: 'string',
      description: 'The positive prompt for the generation.',
      default:
        'Healing-style hand-drawn poster featuring three puppies playing with a ball on lush green grass, adorned with decorative elements such as birds and stars.',
    },
    image: {
      type: 'string',
      description: 'The starting image for image-to-video generation.',
      default: 'https://static.wavespeed.ai/examples/567920',
    },
    last_image: {
      type: 'string',
      description: 'Optional tail frame image.',
      'x-ui-component': 'uploader',
    },
    reference_images: {
      type: 'array',
      description: 'Reference images for style guidance.',
      minItems: 1,
      maxItems: 3,
      items: { type: 'string' },
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'image/*' },
    },
    aspect_ratio: {
      type: 'string',
      description: 'The aspect ratio of the generated media.',
      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      default: '16:9',
      'x-ui-component': 'select',
    },
    duration: {
      type: 'integer',
      description: 'The duration of the generated media in seconds.',
      minimum: 4,
      maximum: 12,
      step: 1,
      default: 5,
      'x-ui-component': 'slider',
    },
    resolution: {
      type: 'string',
      description: 'Video resolution.',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
      'x-ui-component': 'select',
    },
    generate_audio: {
      type: 'boolean',
      description: 'Whether to generate audio.',
      default: false,
    },
    camera_fixed: {
      type: 'boolean',
      description: 'Whether to fix the camera position.',
      default: false,
    },
    seed: {
      type: 'integer',
      description: 'The random seed to use for the generation. -1 means random.',
      default: -1,
    },
  },
}

export const seedanceT2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt'],
  'x-order-properties': [
    'prompt',
    'aspect_ratio',
    'duration',
    'resolution',
    'generate_audio',
    'camera_fixed',
    'seed',
  ],
  properties: {
    prompt: {
      type: 'string',
      description: 'The positive prompt for the generation.',
    },
    aspect_ratio: {
      type: 'string',
      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      default: '16:9',
      'x-ui-component': 'select',
    },
    duration: {
      type: 'integer',
      minimum: 4,
      maximum: 12,
      step: 1,
      default: 5,
      'x-ui-component': 'slider',
    },
    resolution: {
      type: 'string',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
      'x-ui-component': 'select',
    },
    generate_audio: {
      type: 'boolean',
      default: true,
      description: 'Whether to generate audio.',
    },
    camera_fixed: {
      type: 'boolean',
      default: false,
      description: 'Whether to fix the camera position.',
    },
    seed: {
      type: 'integer',
      default: -1,
    },
  },
}

export const klingI2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'image'],
  'x-order-properties': ['prompt', 'image', 'duration', 'aspect_ratio', 'seed'],
  properties: {
    prompt: { type: 'string', description: 'Text prompt for generation.' },
    image: { type: 'string', description: 'Reference image URL.' },
    duration: {
      type: 'integer',
      enum: [5, 10],
      default: 5,
      description: 'Video duration in seconds.',
      'x-ui-component': 'select',
    },
    aspect_ratio: {
      type: 'string',
      enum: ['16:9', '9:16', '1:1'],
      default: '16:9',
      'x-ui-component': 'select',
    },
    seed: { type: 'integer', default: -1 },
  },
}

export const modelInputSchemas: Record<string, InputSchema> = {
  'seedance-i2v': seedanceI2vSchema,
  'seedance-t2v': seedance20T2vSchema,
  'kling-t2v': seedanceT2vSchema,
  'kling-i2v': klingI2vSchema,
}

export function resolveInputSchema(modelId: string): InputSchema | undefined {
  if (modelInputSchemas[modelId]) {
    return modelInputSchemas[modelId]
  }

  const index = Number(modelId.replace('model-', ''))
  if (!Number.isFinite(index) || index <= 0) return undefined

  return index % 2 === 0 ? seedanceI2vSchema : seedance20T2vSchema
}
