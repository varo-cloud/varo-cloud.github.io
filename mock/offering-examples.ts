import type { ModelExample } from '../src/types'

/** Mirrors `data/offering_examples/{slug}/{capability}.json` (DB `examples` column). */
const offeringExamplesBySlug: Record<string, ModelExample[]> = {
  'seedance-2.0/text-to-video': [
    {
      id: 'cinematic-ocean',
      title: 'Ocean waves at golden hour',
      description: 'Cinematic aerial shot with native audio.',
      input: {
        prompt: 'Slow aerial drone shot over ocean waves at golden hour, cinematic lighting',
        aspect_ratio: '16:9',
        resolution: '1080p',
        duration: 5,
        generate_audio: true,
      },
      outputUrl: 'https://cdn.genflow.ai/examples/seedance-2.0/t2v-cinematic-ocean.mp4',
      thumbnailUrl: 'https://cdn.genflow.ai/examples/seedance-2.0/t2v-cinematic-ocean.jpg',
      sortOrder: 0,
    },
    {
      id: 'reference-style',
      title: 'Reference image guided',
      description: 'Style guidance from a reference image.',
      input: {
        prompt: 'A character walking through a neon-lit alley at night',
        reference_images: ['https://cdn.genflow.ai/examples/seedance-2.0/ref-style.jpg'],
        resolution: '720p',
        duration: 5,
      },
      outputUrl: 'https://cdn.genflow.ai/examples/seedance-2.0/t2v-reference-style.mp4',
      sortOrder: 1,
    },
  ],
  'seedance-2.0/image-to-video': [
    {
      id: 'portrait-motion',
      title: 'Portrait with subtle motion',
      description: 'Animate a portrait with gentle camera push-in.',
      input: {
        prompt: 'Subtle breathing motion, soft wind in hair, cinematic shallow depth of field',
        image: 'https://example.com/sample.mp4',
        duration: 5,
        resolution: '720p',
      },
      outputUrl: 'https://example.com/sample.mp4',
      sortOrder: 0,
    },
  ],
}

function toApiExample(example: ModelExample) {
  return {
    id: example.id,
    title: example.title,
    description: example.description ?? null,
    input: example.input,
    output_url: example.outputUrl ?? null,
    thumbnail_url: example.thumbnailUrl ?? null,
    sort_order: example.sortOrder ?? null,
  }
}

export function resolveOfferingExamples(slug: string): ModelExample[] {
  return offeringExamplesBySlug[slug] ?? []
}

export function resolveOfferingExamplesApi(slug: string) {
  return resolveOfferingExamples(slug).map(toApiExample)
}
