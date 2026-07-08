import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { fetchPlaygroundQuote } from '@/api/playground'
import type { PlaygroundQuote } from '@/types'
import type { SchemaFormValues } from '@/types/schema'

const DEBOUNCE_MS = 300

export interface UsePlaygroundQuoteOptions {
  modelId: MaybeRefOrGetter<string>
  formValues: Ref<SchemaFormValues>
  batchSize: Ref<number>
  /** Single-run fallback before the first quote returns */
  fallbackUnitCostUsd: MaybeRefOrGetter<number>
  fallbackStandardUnitCostUsd?: MaybeRefOrGetter<number | undefined>
  enabled?: MaybeRefOrGetter<boolean>
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

export function usePlaygroundQuote(options: UsePlaygroundQuoteOptions) {
  const quote = ref<PlaygroundQuote | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let requestSerial = 0
  let inflightRequestKey: string | null = null
  let lastSuccessfulRequestKey = ''

  function quoteRequestKey(): string {
    return JSON.stringify({
      modelId: toValue(options.modelId),
      batchSize: options.batchSize.value,
      formValues: options.formValues.value,
    })
  }

  const fallbackUnitCostUsd = computed(() => toValue(options.fallbackUnitCostUsd))
  const fallbackStandardUnitCostUsd = computed(() => toValue(options.fallbackStandardUnitCostUsd))

  const unitCostUsd = computed(() => quote.value?.cost_usd ?? fallbackUnitCostUsd.value)

  const costUsd = computed(() =>
    roundUsd(unitCostUsd.value * options.batchSize.value),
  )

  const standardCostUsd = computed(() => {
    const fallbackUnit = fallbackStandardUnitCostUsd.value
    if (fallbackUnit == null) return undefined
    return roundUsd(fallbackUnit * options.batchSize.value)
  })

  async function runQuoteRequest() {
    const modelId = toValue(options.modelId)
    const enabled = toValue(options.enabled ?? true)

    if (!modelId || !enabled) {
      quote.value = null
      loading.value = false
      inflightRequestKey = null
      return
    }

    const requestKey = quoteRequestKey()
    if (requestKey === inflightRequestKey || requestKey === lastSuccessfulRequestKey) {
      return
    }

    const serial = ++requestSerial
    inflightRequestKey = requestKey
    loading.value = true
    error.value = null

    try {
      const result = await fetchPlaygroundQuote(modelId, {
        input: { ...options.formValues.value },
      })

      if (serial === requestSerial) {
        quote.value = result
        lastSuccessfulRequestKey = requestKey
      }
    } catch (err) {
      if (serial === requestSerial) {
        error.value = err instanceof Error ? err.message : 'Quote failed'
      }
    } finally {
      if (serial === requestSerial) {
        loading.value = false
      }
      if (inflightRequestKey === requestKey) {
        inflightRequestKey = null
      }
    }
  }

  function scheduleQuote(immediate = false) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }

    if (immediate) {
      void runQuoteRequest()
      return
    }

    debounceTimer = setTimeout(() => {
      void runQuoteRequest()
    }, DEBOUNCE_MS)
  }

  watch(
    () => ({
      modelId: toValue(options.modelId),
      enabled: toValue(options.enabled ?? true),
      batchSize: options.batchSize.value,
      formValues: options.formValues.value,
    }),
    (state, prev) => {
      if (!state.enabled || !state.modelId) {
        quote.value = null
        loading.value = false
        inflightRequestKey = null
        lastSuccessfulRequestKey = ''
        return
      }

      const modelChanged = Boolean(prev && state.modelId !== prev.modelId)
      if (modelChanged) {
        lastSuccessfulRequestKey = ''
      }

      const enabledTurnedOn = Boolean(prev && !prev.enabled && state.enabled)
      scheduleQuote(modelChanged || enabledTurnedOn)
    },
    { deep: true },
  )

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    requestSerial += 1
  })

  return {
    quote,
    loading,
    error,
    costUsd,
    standardCostUsd,
    unitCostUsd,
    refresh: () => scheduleQuote(true),
  }
}
