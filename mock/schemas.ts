import type { InputSchema } from '../src/types/schema'

/** Source: wavespeed.ai model_schema/bytedance/seedance-2.0/text-to-video */
export const seedance20T2vSchema: InputSchema = {
  type: 'object',
  example_url: '',
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
      title: 'Prompt',
      description: 'Describe the scene, action, camera movement, and mood for the video.',
      'x-ui-widget': 'textarea',
    },
    reference_images: {
      type: 'array',
      title: 'Reference Images',
      description: 'Reference image URLs to guide visual style, characters, or scene composition.',
      items: { type: 'string' },
      maxItems: 9,
      'x-ui-widget': 'image-upload',
    },
    reference_videos: {
      type: 'array',
      title: 'Reference Videos',
      description: 'Reference video URLs (total length must not exceed 15 seconds).',
      items: { type: 'string' },
      maxItems: 3,
      'x-ui-widget': 'video-upload',
    },
    reference_audios: {
      type: 'array',
      title: 'Reference Audios',
      description: 'Reference audio URLs (total length must not exceed 15 seconds).',
      items: { type: 'string' },
      maxItems: 3,
      'x-ui-widget': 'audio-upload',
    },
    aspect_ratio: {
      type: 'string',
      title: 'Aspect Ratio',
      description: 'The aspect ratio of the generated video.',
      enum: ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
      default: '16:9',
    },
    resolution: {
      type: 'string',
      title: 'Resolution',
      description: 'The output video resolution.',
      enum: ['480p', '720p', '1080p', '4k'],
      default: '480p',
    },
    duration: {
      type: 'integer',
      title: 'Duration',
      description: 'The duration of the generated video in seconds (4-15s).',
      minimum: 4,
      maximum: 15,
      default: 5,
      'x-ui-widget': 'slider',
    },
    generate_audio: {
      type: 'boolean',
      title: 'Generate Audio',
      description:
        'Whether to generate native audio synchronized with the output video. Defaults to true.',
      default: true,
    },
    enable_web_search: {
      type: 'boolean',
      title: 'Enable Web Search',
      description: 'Enable web search for real-time information.',
      default: false,
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
      title: 'Prompt',
      description: 'The positive prompt for the generation.',
      default:
        'Healing-style hand-drawn poster featuring three puppies playing with a ball on lush green grass, adorned with decorative elements such as birds and stars.',
      'x-ui-widget': 'textarea',
    },
    image: {
      type: 'string',
      title: 'Image',
      description: 'The starting image for image-to-video generation.',
      default: 'https://static.wavespeed.ai/examples/567920',
      'x-ui-widget': 'image-upload',
    },
    last_image: {
      type: 'string',
      title: 'Last Image',
      description: 'Optional tail frame image.',
      'x-ui-widget': 'image-upload',
    },
    reference_images: {
      type: 'array',
      title: 'Reference Images',
      description: 'Reference images for style guidance.',
      minItems: 1,
      maxItems: 3,
      items: { type: 'string' },
      'x-ui-widget': 'image-upload',
    },
    aspect_ratio: {
      type: 'string',
      title: 'Aspect Ratio',
      description: 'The aspect ratio of the generated media.',
      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      default: '16:9',
    },
    duration: {
      type: 'integer',
      title: 'Duration',
      description: 'The duration of the generated media in seconds.',
      minimum: 4,
      maximum: 12,
      step: 1,
      default: 5,
      'x-ui-widget': 'slider',
    },
    resolution: {
      type: 'string',
      title: 'Resolution',
      description: 'Video resolution.',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
    },
    generate_audio: {
      type: 'boolean',
      title: 'Generate Audio',
      description: 'Whether to generate audio.',
      default: false,
    },
    camera_fixed: {
      type: 'boolean',
      title: 'Camera Fixed',
      description: 'Whether to fix the camera position.',
      default: false,
    },
    seed: {
      type: 'integer',
      title: 'Seed',
      description: 'The random seed to use for the generation. -1 means random.',
      default: -1,
    },
    enable_web_search: {
      type: 'boolean',
      title: 'Enable Web Search',
      description: 'Enable web search for real-time information.',
      default: false,
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
      title: 'Prompt',
      description: 'The positive prompt for the generation.',
      'x-ui-widget': 'textarea',
    },
    aspect_ratio: {
      type: 'string',
      title: 'Aspect Ratio',
      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      default: '16:9',
    },
    duration: {
      type: 'integer',
      title: 'Duration',
      minimum: 4,
      maximum: 12,
      step: 1,
      default: 5,
      'x-ui-widget': 'slider',
    },
    resolution: {
      type: 'string',
      title: 'Resolution',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
    },
    generate_audio: {
      type: 'boolean',
      title: 'Generate Audio',
      default: true,
      description: 'Whether to generate audio.',
    },
    camera_fixed: {
      type: 'boolean',
      title: 'Camera Fixed',
      default: false,
      description: 'Whether to fix the camera position.',
    },
    seed: {
      type: 'integer',
      title: 'Seed',
      default: -1,
    },
    enable_web_search: {
      type: 'boolean',
      title: 'Enable Web Search',
      description: 'Enable web search for real-time information.',
      default: false,
    },
  },
}

export const klingI2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'image'],
  'x-order-properties': ['prompt', 'image', 'duration', 'aspect_ratio', 'seed'],
  properties: {
    prompt: {
      type: 'string',
      title: 'Prompt',
      description: 'Text prompt for generation.',
      'x-ui-widget': 'textarea',
    },
    image: {
      type: 'string',
      title: 'Image',
      description: 'Reference image URL.',
      'x-ui-widget': 'image-upload',
    },
    duration: {
      type: 'integer',
      title: 'Duration',
      enum: [5, 10],
      default: 5,
      description: 'Video duration in seconds.',
    },
    aspect_ratio: {
      type: 'string',
      title: 'Aspect Ratio',
      enum: ['16:9', '9:16', '1:1'],
      default: '16:9',
    },
    seed: { type: 'integer', title: 'Seed', default: -1 },
  },
}

/** Source: google/nano-banana-2/edit — Nano Banana 2 Image Editing */
export const nanoBanana2EditSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'images'],
  properties: {
    images: {
      type: 'array',
      items: { type: 'string' },
      title: 'Images',
      examples: [
        'https://ai.google.dev/static/gemini-api/docs/images/man_in_white_glasses.jpg',
      ],
      description:
        'The URLs of the images to use for image-to-image generation or image editing.',
    },
    prompt: {
      type: 'string',
      title: 'Prompt',
      default:
        'Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character in a humurous scene.',
      maxLength: 50000,
      minLength: 3,
      'x-ui-rows': 4,
      description: 'The text prompt to generate an image from.',
      'x-ui-widget': 'textarea',
    },
    resolution: {
      enum: ['0.5K', '1K', '2K', '4K'],
      type: 'string',
      title: 'Resolution',
      default: '1K',
      description: 'The resolution of the image to generate.',
    },
    aspect_ratio: {
      enum: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '4:1', '1:4', '8:1', '1:8'],
      type: 'string',
      title: 'Aspect Ratio',
      description: 'The aspect ratio of the generated image.',
      'x-placeholder': 'Select aspect ratio',
    },
    output_format: {
      enum: ['jpeg', 'png'],
      type: 'string',
      title: 'Output Format',
      default: 'png',
      description: 'The format of the generated image.',
    },
    enable_web_search: {
      type: 'boolean',
      title: 'Web Search',
      default: false,
      description:
        'Enable Google web search grounding to provide background context for image generation.',
    },
    enable_image_search: {
      type: 'boolean',
      title: 'Image Search',
      default: false,
      description:
        'Enable Google image search to retrieve web images as visual background reference for generation.',
    },
  },
  'x-order-properties': [
    'images',
    'prompt',
    'aspect_ratio',
    'output_format',
    'resolution',
    'enable_web_search',
    'enable_image_search',
  ],
}

/** Source: xai/grok-imagine-video/1.5/image-to-video — Grok Imagine Video 1.5 */
export const grokImagineVideo15I2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'image'],
  properties: {
    image: {
      type: 'string',
      title: 'Image URL',
      examples: [
        'https://static.sandbase.ai/examples/xai/grok-imagine-video/1.5/image-to-video/input_image_0.png',
      ],
      description: 'URL of the input image for video generation.',
      'x-ui-widget': 'image-upload',
    },
    prompt: {
      type: 'string',
      title: 'Prompt',
      examples: [
        'Medieval knight in ornate armor walking through a mystical forest, bioluminescent plants pulsing with light, ancient stone ruins overgrown with glowing vines, over-the-shoulder camera, dark fantasy aesthetic, volumetric fog and Lumen lighting',
      ],
      maxLength: 4096,
      description: 'Text description of desired changes or motion in the video.',
      'x-ui-widget': 'textarea',
    },
    duration: {
      type: 'integer',
      title: 'Duration',
      default: 6,
      maximum: 15,
      minimum: 1,
      description: 'Video duration in seconds.',
      'x-ui-widget': 'slider',
    },
    resolution: {
      enum: ['480p', '720p'],
      type: 'string',
      title: 'Resolution',
      default: '720p',
      description: 'Resolution of the output video.',
    },
  },
  'x-order-properties': ['prompt', 'image', 'resolution', 'duration'],
}

/** Source: kwaivgi/kling-video/v3/pro/image-to-video — Kling Video V3 Pro */
export const klingVideoV3ProI2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'image'],
  properties: {
    image: {
      type: 'string',
      title: 'Start Image Url',
      examples: [
        'https://storage.googleapis.com/falserverless/example_inputs/kling-v3/pro-i2v/start_image.png',
      ],
      description: 'URL of the image to be used for the video',
      'x-ui-widget': 'image-upload',
    },
    prompt: {
      type: 'string',
      title: 'Prompt',
      examples: [
        'The craftsman slowly examines the bowl, turning it gently in his weathered hands. His eyes reflect years of wisdom. Subtle smile forms on his face. Dust particles drift in warm light. Breathing motion, blinking eyes.',
      ],
      maxLength: 2500,
      description:
        'Text prompt for video generation. Either prompt or multi_prompt must be provided, but not both.',
      'x-ui-widget': 'textarea',
    },
    duration: {
      enum: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      type: 'integer',
      title: 'Duration',
      default: 5,
      examples: ['12'],
      description: 'The duration of the generated video in seconds',
    },
    end_image: {
      type: 'string',
      title: 'End Image Url',
      description: 'URL of the image to be used for the end of the video',
      'x-ui-widget': 'image-upload',
    },
    shot_type: {
      enum: ['customize', 'intelligent'],
      type: 'string',
      title: 'Shot Type',
      default: 'customize',
      description:
        "The type of multi-shot video generation. 'intelligent' lets the model automatically determine shot structure.",
    },
    multi_prompt: {
      type: 'array',
      items: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            title: 'Prompt',
            description: 'The prompt for this shot.',
          },
          duration: {
            enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
            type: 'string',
            title: 'Duration',
            default: '5',
            description: 'The duration of this shot in seconds',
          },
        },
      },
      title: 'Multi Prompt',
      description:
        'List of prompts for multi-shot video generation. If provided, divides the video into multiple shots.',
    },
    generate_audio: {
      type: 'boolean',
      title: 'Generate Audio',
      default: true,
      description:
        'Whether to generate native audio for the video. Supports Chinese and English voice output. Other languages are automatically translated to English. For English speech, use lowercase letters; for acronyms or proper nouns, use uppercase.',
    },
  },
  'x-order-properties': [
    'prompt',
    'image',
    'end_image',
    'duration',
    'generate_audio',
    'shot_type',
    'multi_prompt',
  ],
}

/** Source: bfl/flux-1/lora — Flux 1 Lora */
export const flux1LoraSchema: InputSchema = {
  type: 'object',
  required: ['prompt'],
  properties: {
    seed: {
      type: 'integer',
      title: 'Seed',
      description:
        'The same seed and the same prompt given to the same version of the model will output the same image every time.',
    },
    loras: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path'],
        properties: {
          path: {
            type: 'string',
            title: 'Path',
            description:
              'URL or the path to the LoRA weights file (e.g. a HuggingFace .safetensors URL).',
          },
          scale: {
            type: 'number',
            title: 'Scale',
            default: 1,
            maximum: 4,
            minimum: 0,
            description: 'The scale of the LoRA weight.',
            'x-ui-widget': 'slider',
          },
        },
      },
      title: 'Loras',
      default: [],
      examples: [
        {
          path: 'https://huggingface.co/alvdansen/frosting_lane_flux/resolve/main/flux_dev_frostinglane_araminta_k.safetensors',
          scale: 1,
        },
      ],
      description:
        'The LoRAs to use for the image generation. You can use any number of LoRAs and they will be merged together to generate the final image.',
    },
    prompt: {
      type: 'string',
      title: 'Prompt',
      examples: [
        'Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word "FLUX" is painted over it in big, white brush strokes with visible texture.',
      ],
      description: 'The prompt to generate an image from.',
      'x-ui-widget': 'textarea',
    },
    aspect_ratio: {
      enum: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
      type: 'string',
      title: 'Aspect Ratio',
      default: '16:9',
      description: 'The aspect ratio of the generated image.',
      'x-placeholder': 'Select aspect ratio',
    },
    output_format: {
      enum: ['jpeg', 'png'],
      type: 'string',
      title: 'Output Format',
      default: 'jpeg',
      description: 'The format of the generated image.',
    },
    guidance_scale: {
      type: 'number',
      title: 'Guidance scale (CFG)',
      default: 3.5,
      maximum: 35,
      minimum: 0,
      description:
        'The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt when looking for a related image to show you.',
      'x-ui-widget': 'slider',
    },
    num_inference_steps: {
      type: 'integer',
      title: 'Num Inference Steps',
      default: 28,
      maximum: 50,
      minimum: 1,
      description: 'The number of inference steps to perform.',
      'x-ui-widget': 'slider',
    },
  },
  'x-order-properties': [
    'prompt',
    'loras',
    'guidance_scale',
    'num_inference_steps',
    'output_format',
    'aspect_ratio',
    'seed',
  ],
}

/** Source: openai/gpt-image-2/edit — GPT Image 2 Editing */
export const gptImage2EditSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'images'],
  properties: {
    images: {
      type: 'array',
      items: { type: 'string' },
      title: 'Images',
      examples: [
        'https://cdn.openai.com/API/docs/images/body-lotion.png',
        'https://cdn.openai.com/API/docs/images/soap.png',
        'https://cdn.openai.com/API/docs/images/incense-kit.png',
        'https://cdn.openai.com/API/docs/images/bath-bomb.png',
      ],
      description:
        'The URLs of the images to use for image-to-image generation or image editing.',
    },
    prompt: {
      type: 'string',
      title: 'Prompt',
      default:
        "Generate a photorealistic image of a gift basket on a white background labeled 'Relax & Unwind' with a ribbon and handwriting-like font, containing all the items in the reference pictures.",
      maxLength: 50000,
      minLength: 3,
      'x-ui-rows': 4,
      description: 'The text prompt to generate an image from.',
      'x-ui-widget': 'textarea',
    },
    quality: {
      enum: ['low', 'medium', 'high'],
      type: 'string',
      title: 'Quality',
      default: 'high',
      description: 'Quality for the generated image',
    },
    aspect_ratio: {
      enum: [
        '1:1', '1:2', '2:1', '1:3', '3:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9',
        '9:21', '21:9',
      ],
      type: 'string',
      title: 'Aspect Ratio',
      description: 'The aspect ratio of the generated image.',
      'x-placeholder': 'Select aspect ratio',
    },
    output_format: {
      enum: ['jpeg', 'png', 'webp'],
      type: 'string',
      title: 'Output Format',
      default: 'png',
      description: 'The format of the generated image.',
    },
  },
  'x-order-properties': ['images', 'prompt', 'quality', 'aspect_ratio', 'output_format'],
}

export const modelInputSchemas: Record<string, InputSchema> = {
  'seedance-2.0/image-to-video': seedanceI2vSchema,
  'seedance-2.0/text-to-video': seedance20T2vSchema,
  'kling-2.6/text-to-video': seedanceT2vSchema,
  'kling-2.6/image-to-video': klingI2vSchema,
  'google/nano-banana-2/edit': nanoBanana2EditSchema,
  'xai/grok-imagine-video/1.5/image-to-video': grokImagineVideo15I2vSchema,
  'kwaivgi/kling-video/v3/pro/image-to-video': klingVideoV3ProI2vSchema,
  'bfl/flux-1/lora': flux1LoraSchema,
  'openai/gpt-image-2/edit': gptImage2EditSchema,
  // Aliases for existing mock catalog slugs
  'flux-1/text-to-image': flux1LoraSchema,
  'flux-1/image-to-image': gptImage2EditSchema,
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
