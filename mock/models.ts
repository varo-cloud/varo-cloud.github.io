import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

const models = [
  {
    id: 'seedance-t2v',
    name: 'Seedance 2.0 Text-to-Video',
    provider: 'ByteDance',
    capabilities: ['text-to-video'],
    startingPriceUsd: 0.6,
    description: 'Hollywood-grade cinematic text-to-video generation with native audio sync.',
  },
  {
    id: 'seedance-i2v',
    name: 'Seedance 2.0 Image-to-Video',
    provider: 'ByteDance',
    capabilities: ['image-to-video'],
    startingPriceUsd: 0.6,
    description: 'Transform reference images into dynamic videos with Seedance 2.0.',
  },
  {
    id: 'kling-t2v',
    name: 'Kling Text-to-Video',
    provider: 'Kuaishou',
    capabilities: ['text-to-video'],
    startingPriceUsd: 0.55,
    description: 'High-quality text-to-video generation powered by Kling.',
  },
  {
    id: 'kling-i2v',
    name: 'Kling Image-to-Video',
    provider: 'Kuaishou',
    capabilities: ['image-to-video'],
    startingPriceUsd: 0.55,
    description: 'Animate still images into smooth video clips with Kling.',
  },
]

const parameterSchema = [
  { name: 'prompt', type: 'string', required: true, description: 'Text prompt for generation' },
  { name: 'aspect_ratio', type: 'enum', required: false, description: '16:9, 9:16, 1:1' },
  { name: 'resolution', type: 'enum', required: false, description: '480p, 720p, 1080p' },
  { name: 'duration', type: 'number', required: false, description: 'Video duration in seconds (4-15)' },
]

export default [
  {
    url: '/api/models',
    method: 'get',
    response: () => success(models),
  },
  {
    url: '/api/models/:id',
    method: 'get',
    response: ({ params }: { params: { id: string } }) => {
      const model = models.find((item) => item.id === params.id)
      if (!model) {
        return { code: 404, message: 'Model not found', data: null }
      }
      return success({ ...model, parameters: parameterSchema })
    },
  },
] as MockMethod[]
