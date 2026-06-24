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

  const fallbackUnitCostUsd = computed(() => toValue(options.fallbackUnitCostUsd))
  const fallbackStandardUnitCostUsd = computed(() => toValue(options.fallbackStandardUnitCostUsd))

  const unitCostUsd = computed(
    () => quote.value?.unit_cost_usd ?? fallbackUnitCostUsd.value,
  )

  const costUsd = computed(() => {
    if (quote.value) return quote.value.cost_usd
    return roundUsd(fallbackUnitCostUsd.value * options.batchSize.value)
  })

  const standardCostUsd = computed(() => {
    if (quote.value?.standard_cost_usd != null) return quote.value.standard_cost_usd
    const fallbackUnit = fallbackStandardUnitCostUsd.value
    if (fallbackUnit == null) return undefined
    return roundUsd(fallbackUnit * options.batchSize.value)
  })

  const runsPerTenUsd = computed(() => {
    if (quote.value?.runs_per_ten_usd != null) return quote.value.runs_per_ten_usd
    const unit = unitCostUsd.value
    return unit > 0 ? Math.max(1, Math.floor(10 / unit)) : undefined
  })

  async function runQuoteRequest() {
    const modelId = toValue(options.modelId)
    const enabled = toValue(options.enabled ?? true)

    if (!modelId || !enabled) {
      quote.value = null
      loading.value = false
      return
    }

    const serial = ++requestSerial
    loading.value = true
    error.value = null

    try {
      const result = await fetchPlaygroundQuote(modelId, {
        input: { ...options.formValues.value },
        batch_size: options.batchSize.value,
      })

      if (serial === requestSerial) {
        quote.value = result
      }
    } catch (err) {
      if (serial === requestSerial) {
        error.value = err instanceof Error ? err.message : 'Quote failed'
      }
    } finally {
      if (serial === requestSerial) {
        loading.value = false
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
    () => toValue(options.modelId),
    () => {
      quote.value = null
      scheduleQuote(true)
    },
  )

  watch(
    [options.formValues, options.batchSize],
    () => {
      scheduleQuote()
    },
    { deep: true },
  )

  watch(
    () => toValue(options.enabled ?? true),
    (enabled) => {
      if (enabled) {
        scheduleQuote(true)
      } else {
        quote.value = null
        loading.value = false
      }
    },
    { immediate: true },
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
    runsPerTenUsd,
    refresh: () => scheduleQuote(true),
  }
}
