import type { InputSchema } from '../src/types/schema'

/** Source: wavespeed.ai model_schema/bytedance/seedance-2.0/text-to-video */
export const seedance20T2vSchema: InputSchema = {
  type: 'object',
  example_url:'',
  required: ['prompt'],
  'x-order-properties': [
    'prompt',
    'reference_images',
    'reference_videos',
    'reference_audios',
    'aspect_ratio',
    'resolution',
    'duration',
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
      default: '480p',
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
  'seedance-2.0/image-to-video': seedanceI2vSchema,
  'seedance-2.0/text-to-video': seedance20T2vSchema,
  'kling-2.6/text-to-video': seedanceT2vSchema,
  'kling-2.6/image-to-video': klingI2vSchema,
}

export function resolveInputSchema(slug: string): InputSchema | undefined {
  if (modelInputSchemas[slug]) {
    return modelInputSchemas[slug]
  }

  const variantMatch = slug.match(/-v(\d+)\//)
  if (variantMatch) {
    const baseSlug = slug.replace(/-v\d+\//, '/')
    if (modelInputSchemas[baseSlug]) {
      return modelInputSchemas[baseSlug]
    }
  }

  return slug.includes('image-to-video') ? seedanceI2vSchema : seedance20T2vSchema
}
