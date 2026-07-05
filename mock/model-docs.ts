export interface ModelDocContent {
  readme_md: string
  faq: Array<{ question: string; answer: string }>
}

const seedanceT2vReadme = `## Seedance 2.0 Text-to-Video

**Seedance 2.0** generates production-grade cinematic videos from text prompts with native audio-visual synchronization and director-level camera control.

## Key Features

- **Unified multimodal architecture** — accepts text, image, audio, and video references
- **Native audio-visual sync** — synchronized audio in a single pass
- **Director-level control** — camera movement, lighting, and mood via natural language
- **Production-grade quality** — Hollywood-grade visual fidelity and smooth motion

## Pricing

Billed per second of output duration, anchored at **$0.60 per 5 seconds at 480p**.

## Best Use Cases

- Film & production previews
- Commercials and ads
- Music videos with native audio sync
- Premium social short-form content
`

const seedanceT2vFaq = [
  {
    question: 'What is the Seedance 2.0 Text-to-Video API?',
    answer:
      'A REST API that generates cinematic videos from text prompts with native audio sync. Call POST /v1/generations with your API key and poll GET /v1/generations/{id} until completed.',
  },
  {
    question: 'How do I call the API?',
    answer:
      'POST your input parameters to POST /v1/generations with Authorization: Bearer sk_live_.... Use model slug `seedance-2.0/text-to-video`. Poll GET /v1/generations/{id} until status is completed.',
  },
]

const modelDocs: Record<string, ModelDocContent> = {
  'seedance-2.0/text-to-video': {
    readme_md: seedanceT2vReadme,
    faq: seedanceT2vFaq,
  },
  'seedance-2.0/image-to-video': {
    readme_md: `## Seedance 2.0 Image-to-Video

Animate a starting frame with natural-language motion prompts. Supports optional end frame, reference images, and native audio generation.`,
    faq: [
      {
        question: 'What is required to run image-to-video?',
        answer: 'Both `image` (starting frame URL) and `prompt` are required.',
      },
    ],
  },
  'kling-2.6/text-to-video': {
    readme_md: `## Kling 2.6 Text-to-Video

High-quality text-to-video generation with cinematic motion control.`,
    faq: [
      {
        question: 'How do I authenticate API requests?',
        answer: 'Include Authorization: Bearer sk_live_... in every request to /v1/generations.',
      },
    ],
  },
  'kling-2.6/image-to-video': {
    readme_md: `## Kling 2.6 Image-to-Video

Transform reference images into smooth video clips with Kling image-to-video.`,
    faq: [],
  },
}

const defaultDoc: ModelDocContent = {
  readme_md: '',
  faq: [],
}

export function resolveModelDoc(slug: string): ModelDocContent {
  return modelDocs[slug] ?? defaultDoc
}
