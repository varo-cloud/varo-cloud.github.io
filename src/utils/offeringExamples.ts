const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export interface OfferingExample {
  id: string
  title: string
  titleI18n?: Record<string, string> | null
  description?: string | null
  descriptionI18n?: Record<string, string> | null
  input: Record<string, unknown>
  outputUrl?: string | null
  thumbnailUrl?: string | null
  sortOrder?: number | null
}

export function mapApiExample(raw: Record<string, unknown>): OfferingExample {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    titleI18n: (raw.title_i18n as Record<string, string> | null) ?? null,
    description: raw.description != null ? String(raw.description) : null,
    descriptionI18n: (raw.description_i18n as Record<string, string> | null) ?? null,
    input: (raw.input as Record<string, unknown>) ?? {},
    outputUrl: raw.output_url != null ? String(raw.output_url) : null,
    thumbnailUrl: raw.thumbnail_url != null ? String(raw.thumbnail_url) : null,
    sortOrder: raw.sort_order != null ? Number(raw.sort_order) : null,
  }
}

/** Matches admin-web `exampleToApiPayload` for PUT `/admin/model-offerings/:id`. */
export function exampleToApiPayload(example: OfferingExample): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: example.id,
    title: example.title,
    input: example.input,
  }
  if (example.titleI18n && Object.keys(example.titleI18n).length > 0) {
    payload.title_i18n = example.titleI18n
  }
  if (example.description?.trim()) payload.description = example.description.trim()
  if (example.descriptionI18n && Object.keys(example.descriptionI18n).length > 0) {
    payload.description_i18n = example.descriptionI18n
  }
  if (example.outputUrl?.trim()) payload.output_url = example.outputUrl.trim()
  if (example.thumbnailUrl?.trim()) payload.thumbnail_url = example.thumbnailUrl.trim()
  if (example.sortOrder != null) payload.sort_order = example.sortOrder
  return payload
}

export function parseOfferingModelId(model: string): { slug: string; capability: string } | null {
  const trimmed = model.trim()
  const slash = trimmed.indexOf('/')
  if (slash <= 0 || slash >= trimmed.length - 1) return null
  return {
    slug: trimmed.slice(0, slash),
    capability: trimmed.slice(slash + 1),
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function suggestExampleId(input: Record<string, unknown>, taskId: string): string {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : ''
  const fromPrompt = slugify(prompt)
  if (fromPrompt && ID_PATTERN.test(fromPrompt)) return fromPrompt
  const short = taskId.replace(/-/g, '').slice(0, 8)
  return `gen-${short}`
}

export function suggestExampleTitle(input: Record<string, unknown>): string {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : ''
  if (!prompt) return 'Generation example'
  return prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt
}

/** Build an offering example from a generation, matching admin-web defaults. */
export function exampleFromGeneration(
  input: Record<string, unknown>,
  outputUrl: string,
  taskId: string,
  sortOrder = 0,
): OfferingExample {
  return {
    id: suggestExampleId(input, taskId),
    title: suggestExampleTitle(input),
    titleI18n: null,
    description: null,
    descriptionI18n: null,
    input,
    outputUrl,
    thumbnailUrl: null,
    sortOrder,
  }
}

export function upsertExample(
  examples: OfferingExample[],
  example: OfferingExample,
): { list: OfferingExample[]; replaced: boolean } {
  const idx = examples.findIndex((e) => e.id === example.id)
  if (idx >= 0) {
    const list = [...examples]
    list[idx] = example
    return { list, replaced: true }
  }
  return { list: [...examples, example], replaced: false }
}
