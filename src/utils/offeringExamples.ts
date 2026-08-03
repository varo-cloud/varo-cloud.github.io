export type ContentLocale = 'en-US' | 'zh-CN'

export type LocalizedString = Partial<Record<ContentLocale, string>>

export const CONTENT_LOCALES: ContentLocale[] = ['en-US', 'zh-CN']

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

export interface OfferingExampleForm {
  id: string
  title: LocalizedString
  description: LocalizedString
  inputJson: string
  outputUrl: string
  thumbnailUrl: string
  sortOrder: number | null
}

function emptyLocalizedString(): LocalizedString {
  return { 'en-US': '', 'zh-CN': '' }
}

function normalizeLocalizedString(
  value: LocalizedString | string | undefined | null,
): LocalizedString {
  if (!value) return emptyLocalizedString()
  if (typeof value === 'string') return { 'en-US': value, 'zh-CN': '' }
  return {
    'en-US': value['en-US'] ?? '',
    'zh-CN': value['zh-CN'] ?? '',
  }
}

function localizedStringToPayload(value: LocalizedString | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  const normalized = normalizeLocalizedString(value)
  if (normalized['en-US']?.trim()) result['en-US'] = normalized['en-US'].trim()
  if (normalized['zh-CN']?.trim()) result['zh-CN'] = normalized['zh-CN'].trim()
  return result
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

export function formToExample(form: OfferingExampleForm): OfferingExample {
  const titleEn = form.title['en-US']?.trim() ?? ''
  const titleI18nPayload = localizedStringToPayload(form.title)
  delete titleI18nPayload['en-US']
  const titleI18n = Object.keys(titleI18nPayload).length > 0 ? titleI18nPayload : null

  const descEn = form.description['en-US']?.trim() ?? ''
  const descI18nPayload = localizedStringToPayload(form.description)
  delete descI18nPayload['en-US']
  const descriptionI18n = Object.keys(descI18nPayload).length > 0 ? descI18nPayload : null

  const descZh = form.description['zh-CN']?.trim()
  const description = descEn || descZh ? descEn || null : null

  return {
    id: form.id.trim(),
    title: titleEn,
    titleI18n,
    description,
    descriptionI18n,
    input: JSON.parse(form.inputJson || '{}'),
    outputUrl: form.outputUrl.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    sortOrder: form.sortOrder,
  }
}

export function validateExampleForm(
  form: OfferingExampleForm,
  existingIds: string[],
  editingId?: string,
): string | null {
  const id = form.id.trim()
  if (!id) return 'missingId'
  if (!ID_PATTERN.test(id)) return 'invalidId'
  if (existingIds.includes(id) && id !== editingId) return 'duplicateId'

  if (!form.title['en-US']?.trim()) return 'missingTitleEn'

  try {
    const input = JSON.parse(form.inputJson || '{}')
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return 'invalidInputObject'
    }
  } catch {
    return 'invalidInputJson'
  }

  for (const urlField of [
    { key: 'outputUrl' as const, value: form.outputUrl },
    { key: 'thumbnailUrl' as const, value: form.thumbnailUrl },
  ]) {
    const v = urlField.value.trim()
    if (v && !/^https?:\/\/.+/i.test(v)) return urlField.key === 'outputUrl' ? 'invalidOutputUrl' : 'invalidThumbnailUrl'
  }

  return null
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

export function exampleFormFromGeneration(
  input: Record<string, unknown>,
  outputUrl: string,
  taskId: string,
  sortOrder = 0,
): OfferingExampleForm {
  const title = suggestExampleTitle(input)
  return {
    id: suggestExampleId(input, taskId),
    title: { 'en-US': title, 'zh-CN': '' },
    description: { 'en-US': '', 'zh-CN': '' },
    inputJson: JSON.stringify(input ?? {}, null, 2),
    outputUrl,
    thumbnailUrl: '',
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
