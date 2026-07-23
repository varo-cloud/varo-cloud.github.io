import type { SchemaFormValues } from '@/types/schema'
import { inferenceApiBaseUrl } from '@/utils/inferenceApiBaseUrl'

export type PlaygroundInputViewMode = 'form' | 'json' | 'http' | 'python' | 'javascript'
export type ApiCodeViewMode = Exclude<PlaygroundInputViewMode, 'form' | 'json'>

export const PLAYGROUND_INPUT_VIEW_MODES: PlaygroundInputViewMode[] = [
  'form',
  'json',
  'http',
  'python',
  'javascript',
]

export const API_CODE_VIEW_MODES: ApiCodeViewMode[] = ['http', 'python', 'javascript']

function pruneApiValues(values: SchemaFormValues): SchemaFormValues {
  const result: SchemaFormValues = {}

  for (const [key, value] of Object.entries(values)) {
    if (value === '' || value === null || value === undefined) continue
    if (Array.isArray(value) && value.length === 0) continue
    result[key] = value
  }

  return result
}

export function resolveV1BaseUrl(): string {
  return inferenceApiBaseUrl()
}

export function resolveCreateGenerationUrl(): string {
  return `${resolveV1BaseUrl()}/generations`
}

export function resolveGetGenerationUrl(taskId: string): string {
  return `${resolveV1BaseUrl()}/generations/${taskId}`
}

/** OpenAI-compatible chat completions endpoint for LLM models. */
export function resolveChatCompletionsUrl(): string {
  return `${resolveV1BaseUrl()}/chat/completions`
}

export type ApiSnippetCategory = 'video' | 'image' | 'llm'

/** External API Key calls — flat body with `model` (catalog slug). */
export function buildExternalApiBody(modelSlug: string, values: SchemaFormValues) {
  return {
    model: modelSlug,
    ...pruneApiValues(values),
  }
}

/** LLM request body — prefer stream:true for docs/examples that consume SSE. */
export function buildLlmApiBody(
  modelSlug: string,
  values: SchemaFormValues,
  options?: { stream?: boolean },
) {
  return {
    ...buildExternalApiBody(modelSlug, values),
    stream: options?.stream ?? true,
  }
}

const PLAYGROUND_RUN_META_KEYS = new Set(['model_id', 'model', 'batch_size', 'batchSize', 'input'])

function prunePlaygroundInputValues(values: SchemaFormValues): SchemaFormValues {
  const result: SchemaFormValues = {}

  for (const [key, value] of Object.entries(values)) {
    if (PLAYGROUND_RUN_META_KEYS.has(key)) continue
    if (value === '' || value === null || value === undefined) continue
    result[key] = value
  }

  return result
}

function stripPlaygroundRunMetaKeys(values: SchemaFormValues): SchemaFormValues {
  const result: SchemaFormValues = {}

  for (const [key, value] of Object.entries(values)) {
    if (PLAYGROUND_RUN_META_KEYS.has(key)) continue
    result[key] = value
  }

  return result
}

/** Playground JWT run — flat body with catalog `model` slug and input fields. */
export function buildPlaygroundRunBody(
  modelSlug: string,
  values: SchemaFormValues,
  batchSize = 1,
) {
  return {
    model: modelSlug,
    batch_size: batchSize,
    ...prunePlaygroundInputValues(values),
  }
}

function extractPlaygroundInputValues(
  parsed: Record<string, unknown> & { input?: SchemaFormValues },
): SchemaFormValues | null {
  if (parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input)) {
    return prunePlaygroundInputValues(parsed.input)
  }

  return prunePlaygroundInputValues(parsed as SchemaFormValues)
}

export function parseJsonInputDraft(
  json: string,
): { values: SchemaFormValues; batchSize?: number } | null {
  try {
    const parsed = JSON.parse(json) as {
      input?: SchemaFormValues
      batch_size?: number
      batchSize?: number
      model_id?: string
      model?: string
    } & SchemaFormValues

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

    const values = extractPlaygroundInputValues(parsed)
    if (!values) return null

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

export function buildPlaygroundJsonSnippet(
  modelId: string,
  values: SchemaFormValues,
  batchSize = 1,
): string {
  return JSON.stringify(
    {
      model: modelId,
      batch_size: batchSize,
      ...stripPlaygroundRunMetaKeys(values),
    },
    null,
    2,
  )
}

export function buildHttpSubmitSnippet(apiModelId: string, values: SchemaFormValues): string {
  const url = resolveCreateGenerationUrl()
  const body = JSON.stringify(buildExternalApiBody(apiModelId, values), null, 2)
  const escapedBody = body.replace(/'/g, "'\\''")

  return `curl -X POST "${url}" \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '${escapedBody}'`
}

export function buildHttpLlmSubmitSnippet(apiModelId: string, values: SchemaFormValues): string {
  const url = resolveChatCompletionsUrl()
  const body = JSON.stringify(buildLlmApiBody(apiModelId, values, { stream: true }), null, 2)
  const escapedBody = body.replace(/'/g, "'\\''")

  return `# stream: true — SSE token stream on the same response
curl -N -X POST "${url}" \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/event-stream" \\
  -d '${escapedBody}'`
}

export function buildHttpLlmNonStreamSnippet(apiModelId: string, values: SchemaFormValues): string {
  const url = resolveChatCompletionsUrl()
  const body = JSON.stringify(buildLlmApiBody(apiModelId, values, { stream: false }), null, 2)
  const escapedBody = body.replace(/'/g, "'\\''")

  return `# stream: false — wait for the full JSON response
response=$(curl -s -X POST "${url}" \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '${escapedBody}')

# Read the assistant message from choices[0].message.content
echo "$response" | jq -r '.choices[0].message.content'`
}

export function buildHttpPollSnippet(taskId = '{id}'): string {
  const url = resolveGetGenerationUrl(taskId)

  return `# Poll until status is completed or succeeded
while true; do
  response=$(curl -s "${url}" \\
    -H "Authorization: Bearer sk_live_...")
  status=$(echo "$response" | jq -r '.status')
  if [ "$status" = "completed" ] || [ "$status" = "succeeded" ]; then
    echo "$response" | jq -r '.url // .output.url'
    break
  fi
  if [ "$status" = "failed" ]; then
    echo "$response" | jq -r '.error.message // "Generation failed"' >&2
    exit 1
  fi
  sleep 5
done`
}

export function buildHttpLlmStreamSnippet(): string {
  return `# How to read stream:true results (SSE)
# Each line: data: <chat.completion.chunk JSON>
# Terminal: data: [DONE]
#
# Pipe the curl -N response to print tokens:
#   ... | while IFS= read -r line; do
#     [[ "$line" == data:\\ [DONE]* ]] && break
#     [[ "$line" == data:* ]] || continue
#     echo "\${line#data: }" | jq -rj '.choices[0].delta.content // empty'
#   done
#   echo`
}

export function buildHttpSnippet(
  apiModelId: string,
  values: SchemaFormValues,
  category: ApiSnippetCategory = 'video',
): string {
  if (category === 'llm') {
    return `${buildHttpLlmSubmitSnippet(apiModelId, values)}

${buildHttpLlmStreamSnippet()}

${buildHttpLlmNonStreamSnippet(apiModelId, values)}`
  }

  return `${buildHttpSubmitSnippet(apiModelId, values)}

# Replace {id} with the task id from the creation response
TASK_ID="{id}"

${buildHttpPollSnippet('$TASK_ID')}`
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

function buildPythonLlmCreateCall(
  apiModelId: string,
  values: SchemaFormValues,
  stream: boolean,
): { clientSetup: string; createCall: string; resultVar: string } {
  const baseUrl = resolveV1BaseUrl()
  const body = buildLlmApiBody(apiModelId, values, { stream })
  const messages = body.messages ?? []
  const kwargs: string[] = [
    `    model=${JSON.stringify(body.model)},`,
    `    messages=${toPythonLiteral(messages, 1)},`,
    `    stream=${stream ? 'True' : 'False'},`,
  ]

  for (const [key, value] of Object.entries(body)) {
    if (key === 'model' || key === 'messages' || key === 'stream') continue
    kwargs.push(`    ${key}=${toPythonLiteral(value, 1)},`)
  }

  const resultVar = stream ? 'stream' : 'completion'
  return {
    clientSetup: `from openai import OpenAI

API_KEY = "sk_live_..."
client = OpenAI(api_key=API_KEY, base_url="${baseUrl}")`,
    createCall: `${resultVar} = client.chat.completions.create(
${kwargs.join('\n')}
)`,
    resultVar,
  }
}

export function buildPythonSubmitSnippet(apiModelId: string, values: SchemaFormValues): string {
  const baseUrl = resolveV1BaseUrl()
  const body = toPythonLiteral(buildExternalApiBody(apiModelId, values))

  return `import time
from openai import OpenAI

API_KEY = "sk_live_..."
client = OpenAI(api_key=API_KEY, base_url="${baseUrl}")

body = ${body}

generation = client.post("/generations", body=body, cast_to=dict)
task_id = generation["id"]`
}

export function buildPythonLlmSubmitSnippet(apiModelId: string, values: SchemaFormValues): string {
  const { clientSetup, createCall } = buildPythonLlmCreateCall(apiModelId, values, true)
  return `${clientSetup}

# stream=True — iterate chunks as they arrive
${createCall}`
}

export function buildPythonLlmNonStreamSnippet(apiModelId: string, values: SchemaFormValues): string {
  const { clientSetup, createCall } = buildPythonLlmCreateCall(apiModelId, values, false)
  return `${clientSetup}

# stream=False — one shot JSON response
${createCall}

# Read the assistant message
print(completion.choices[0].message.content)`
}

export function buildPythonPollSnippet(): string {
  return `# Poll until the task completes
while True:
    status = client.get(f"/generations/{task_id}", cast_to=dict)
    if status["status"] in ("completed", "succeeded"):
        print(status.get("url") or status.get("output", {}).get("url"))
        break
    if status["status"] == "failed":
        raise RuntimeError(status.get("error", {}).get("message", "Generation failed"))
    time.sleep(5)`
}

export function buildPythonLlmStreamSnippet(): string {
  return `# How to read stream=True results
for event in stream:
    delta = event.choices[0].delta.content if event.choices else None
    if delta:
        print(delta, end="", flush=True)
print()`
}

export function buildPythonSnippet(
  apiModelId: string,
  values: SchemaFormValues,
  category: ApiSnippetCategory = 'video',
): string {
  if (category === 'llm') {
    return `${buildPythonLlmSubmitSnippet(apiModelId, values)}

${buildPythonLlmStreamSnippet()}

${buildPythonLlmNonStreamSnippet(apiModelId, values)}`
  }

  return `${buildPythonSubmitSnippet(apiModelId, values)}

${buildPythonPollSnippet()}`
}

function buildJavaScriptLlmCreateCall(
  apiModelId: string,
  values: SchemaFormValues,
  stream: boolean,
): { clientSetup: string; createCall: string; resultVar: string } {
  const baseUrl = resolveV1BaseUrl()
  const body = JSON.stringify(buildLlmApiBody(apiModelId, values, { stream }), null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n')

  const resultVar = stream ? 'stream' : 'completion'
  return {
    clientSetup: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk_live_...",
  baseURL: "${baseUrl}",
});`,
    createCall: `const ${resultVar} = await client.chat.completions.create(${body});`,
    resultVar,
  }
}

export function buildJavaScriptSubmitSnippet(apiModelId: string, values: SchemaFormValues): string {
  const baseUrl = resolveV1BaseUrl()
  const body = JSON.stringify(buildExternalApiBody(apiModelId, values), null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `    ${line}`))
    .join('\n')

  return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk_live_...",
  baseURL: "${baseUrl}",
});

const generation = await client.post("/generations", {
  body: ${body},
});`
}

export function buildJavaScriptLlmSubmitSnippet(
  apiModelId: string,
  values: SchemaFormValues,
): string {
  const { clientSetup, createCall } = buildJavaScriptLlmCreateCall(apiModelId, values, true)
  return `${clientSetup}

// stream: true — iterate chunks as they arrive
${createCall}`
}

export function buildJavaScriptLlmNonStreamSnippet(
  apiModelId: string,
  values: SchemaFormValues,
): string {
  const { clientSetup, createCall } = buildJavaScriptLlmCreateCall(apiModelId, values, false)
  return `${clientSetup}

// stream: false — one shot JSON response
${createCall}

// Read the assistant message
console.log(completion.choices[0]?.message?.content ?? "");`
}

export function buildJavaScriptPollSnippet(): string {
  return `// Poll until the task completes
let status = generation;
while (status.status === "queued" || status.status === "processing" || status.status === "running") {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  status = await client.get(\`/generations/\${generation.id}\`);
}

if (status.status === "completed" || status.status === "succeeded") {
  console.log(status.url ?? status.output?.url);
}`
}

export function buildJavaScriptLlmStreamSnippet(): string {
  return `// How to read stream:true results
for await (const event of stream) {
  const delta = event.choices?.[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}
process.stdout.write("\\n");`
}

export function buildJavaScriptSnippet(
  apiModelId: string,
  values: SchemaFormValues,
  category: ApiSnippetCategory = 'video',
): string {
  if (category === 'llm') {
    return `${buildJavaScriptLlmSubmitSnippet(apiModelId, values)}

${buildJavaScriptLlmStreamSnippet()}

${buildJavaScriptLlmNonStreamSnippet(apiModelId, values)}`
  }

  return `${buildJavaScriptSubmitSnippet(apiModelId, values)}

${buildJavaScriptPollSnippet()}`
}

function buildApiSubmitSnippetForMode(
  mode: ApiCodeViewMode,
  apiModelId: string,
  values: SchemaFormValues,
  category: ApiSnippetCategory = 'video',
): string {
  if (category === 'llm') {
    switch (mode) {
      case 'http':
        return `${buildHttpLlmSubmitSnippet(apiModelId, values)}

${buildHttpLlmStreamSnippet()}`
      case 'python':
        return `${buildPythonLlmSubmitSnippet(apiModelId, values)}

${buildPythonLlmStreamSnippet()}`
      case 'javascript':
        return `${buildJavaScriptLlmSubmitSnippet(apiModelId, values)}

${buildJavaScriptLlmStreamSnippet()}`
    }
  }

  switch (mode) {
    case 'http':
      return buildHttpSubmitSnippet(apiModelId, values)
    case 'python':
      return buildPythonSubmitSnippet(apiModelId, values)
    case 'javascript':
      return buildJavaScriptSubmitSnippet(apiModelId, values)
  }
}

function buildApiPollSnippetForMode(
  mode: ApiCodeViewMode,
  category: ApiSnippetCategory = 'video',
  apiModelId = '',
  values: SchemaFormValues = {},
): string {
  if (category === 'llm') {
    switch (mode) {
      case 'http':
        return buildHttpLlmNonStreamSnippet(apiModelId, values)
      case 'python':
        return buildPythonLlmNonStreamSnippet(apiModelId, values)
      case 'javascript':
        return buildJavaScriptLlmNonStreamSnippet(apiModelId, values)
    }
  }

  switch (mode) {
    case 'http':
      return buildHttpPollSnippet()
    case 'python':
      return buildPythonPollSnippet()
    case 'javascript':
      return buildJavaScriptPollSnippet()
  }
}

export function buildApiSubmitSnippet(
  mode: ApiCodeViewMode,
  apiModelId: string,
  values: SchemaFormValues,
  category: ApiSnippetCategory = 'video',
): string {
  return buildApiSubmitSnippetForMode(mode, apiModelId, values, category)
}

export function buildApiPollSnippet(
  mode: ApiCodeViewMode,
  category: ApiSnippetCategory = 'video',
  apiModelId = '',
  values: SchemaFormValues = {},
): string {
  return buildApiPollSnippetForMode(mode, category, apiModelId, values)
}

export function buildInputViewSnippet(
  mode: Exclude<PlaygroundInputViewMode, 'form'>,
  modelId: string,
  apiModelId: string,
  values: SchemaFormValues,
  batchSize = 1,
  category: ApiSnippetCategory = 'video',
): string {
  switch (mode) {
    case 'json':
      return buildPlaygroundJsonSnippet(modelId, values, batchSize)
    case 'http':
      return buildHttpSnippet(apiModelId, values, category)
    case 'python':
      return buildPythonSnippet(apiModelId, values, category)
    case 'javascript':
      return buildJavaScriptSnippet(apiModelId, values, category)
  }
}

/** @deprecated Use buildApiSubmitSnippet + buildApiPollSnippet */
export function buildApiCodeSnippet(
  mode: ApiCodeViewMode,
  apiModelId: string,
  values: SchemaFormValues,
  category: ApiSnippetCategory = 'video',
): string {
  return buildInputViewSnippet(mode, '', apiModelId, values, 1, category)
}
