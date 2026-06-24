import type { SchemaFormValues } from '@/types/schema'

export type PlaygroundInputViewMode = 'form' | 'json' | 'http' | 'python' | 'javascript'

export const PLAYGROUND_INPUT_VIEW_MODES: PlaygroundInputViewMode[] = [
  'form',
  'json',
  'http',
  'python',
  'javascript',
]

export function buildRequestBody(modelPath: string, values: SchemaFormValues) {
  return {
    model: modelPath,
    input: values,
  }
}

export function parseJsonInputDraft(
  json: string,
): { values: SchemaFormValues; batchSize?: number } | null {
  try {
    const parsed = JSON.parse(json) as {
      input?: SchemaFormValues
      batch_size?: number
      batchSize?: number
    } & SchemaFormValues

    if (!parsed || typeof parsed !== 'object') return null

    const values =
      'input' in parsed && parsed.input && typeof parsed.input === 'object'
        ? parsed.input
        : (parsed as SchemaFormValues)

    if (!values || typeof values !== 'object' || Array.isArray(values)) return null

    const rawBatch = parsed.batch_size ?? parsed.batchSize
    const batchSize =
      typeof rawBatch === 'number' && Number.isFinite(rawBatch) && rawBatch >= 1
        ? Math.min(4, Math.floor(rawBatch))
        : undefined

    return { values: { ...values }, batchSize }
  } catch {
    return null
  }
}

export function resolvePredictionsEndpoint(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const apiPath = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    return `${origin}${apiPath}/v1/predictions`
  }

  return 'https://<your-host>/api/v1/predictions'
}

export function buildJsonSnippet(modelPath: string, values: SchemaFormValues): string {
  return JSON.stringify(buildRequestBody(modelPath, values), null, 2)
}

export function buildHttpSnippet(modelPath: string, values: SchemaFormValues): string {
  const url = resolvePredictionsEndpoint()
  const body = JSON.stringify(buildRequestBody(modelPath, values), null, 2)

  return `POST ${url}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

${body}`
}

function toPythonLiteral(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  const childPad = '  '.repeat(indent + 1)

  if (value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => `${childPad}${toPythonLiteral(item, indent + 1)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const lines = entries.map(
      ([key, item]) => `${childPad}${JSON.stringify(key)}: ${toPythonLiteral(item, indent + 1)}`,
    )
    return `{\n${lines.join(',\n')}\n${pad}}`
  }

  return JSON.stringify(value)
}

export function buildPythonSnippet(modelPath: string, values: SchemaFormValues): string {
  const url = resolvePredictionsEndpoint()
  const payload = toPythonLiteral(buildRequestBody(modelPath, values))

  return `import httpx

API_KEY = "YOUR_API_KEY"
url = "${url}"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

payload = ${payload}

with httpx.Client(timeout=60) as client:
    response = client.post(url, headers=headers, json=payload)
    response.raise_for_status()
    print(response.json())`
}

export function buildJavaScriptSnippet(modelPath: string, values: SchemaFormValues): string {
  const url = resolvePredictionsEndpoint()
  const body = JSON.stringify(buildRequestBody(modelPath, values), null, 2)

  return `const API_KEY = "YOUR_API_KEY";

const response = await fetch("${url}", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${body}),
});

if (!response.ok) {
  throw new Error(\`Request failed: \${response.status}\`);
}

const result = await response.json();
console.log(result);`
}

export function buildInputViewSnippet(
  mode: Exclude<PlaygroundInputViewMode, 'form'>,
  modelPath: string,
  values: SchemaFormValues,
): string {
  switch (mode) {
    case 'json':
      return buildJsonSnippet(modelPath, values)
    case 'http':
      return buildHttpSnippet(modelPath, values)
    case 'python':
      return buildPythonSnippet(modelPath, values)
    case 'javascript':
      return buildJavaScriptSnippet(modelPath, values)
  }
}
