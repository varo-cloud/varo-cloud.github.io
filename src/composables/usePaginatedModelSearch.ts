import { computed, onBeforeUnmount, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { fetchModelDetail, fetchModels } from '@/api/models'
import { isValidModelSlug } from '@/utils/model-slug'
import type { Model } from '@/types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export type ModelSelectorListOption = {
  id: string
  label: string
  capability?: string
  description?: string
  isHot?: boolean
  isNew?: boolean
}

export function modelToSelectorOption(model: Model): ModelSelectorListOption {
  return {
    id: model.id,
    label: model.displayName,
    capability: model.capability,
    description: model.description,
    isHot: model.isHot,
    isNew: model.isNew,
  }
}

function mergeUniqueModels(existing: Model[], incoming: Model[]): Model[] {
  const ids = new Set(existing.map((item) => item.id))
  const merged = [...existing]

  for (const item of incoming) {
    if (ids.has(item.id)) continue
    merged.push(item)
    ids.add(item.id)
  }

  return merged
}

export function usePaginatedModelSearch(options?: {
  selectedId?: MaybeRefOrGetter<string | undefined>
  /** Already-loaded model; skips fetchModelDetail when selectedId matches */
  prefilledModel?: MaybeRefOrGetter<Model | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  validSlugOnly?: boolean
  prefetchTotal?: boolean
}) {
  const items = ref<Model[]>([])
  /** Unfiltered catalog size — not affected by search queries. */
  const catalogTotal = ref(0)
  const total = ref(0)
  const fetchedCount = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const searchQuery = ref('')
  const debouncedQuery = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let requestSeq = 0

  const hasMore = computed(() => fetchedCount.value < total.value)

  const selectorOptions = computed(() => {
    const source = options?.validSlugOnly
      ? items.value.filter((item) => isValidModelSlug(item.id))
      : items.value

    return source.map(modelToSelectorOption)
  })

  function isEnabled() {
    return toValue(options?.enabled) !== false
  }

  function filterIncoming(pageItems: Model[]) {
    if (!options?.validSlugOnly) return pageItems
    return pageItems.filter((item) => isValidModelSlug(item.id))
  }

  function addSelectedToList(model: Model) {
    if (items.value.some((item) => item.id === model.id)) return
    items.value = [model, ...items.value]
  }

  async function ensureSelectedInList() {
    const selectedId = toValue(options?.selectedId)
    if (!selectedId || items.value.some((item) => item.id === selectedId)) return

    const prefilled = toValue(options?.prefilledModel)
    if (prefilled?.id === selectedId) {
      addSelectedToList(prefilled)
      return
    }

    try {
      const detail = await fetchModelDetail(selectedId)
      addSelectedToList(detail)
    } catch {
      // ignore
    }
  }

  async function loadPage(append: boolean) {
    if (!isEnabled()) return

    const seq = ++requestSeq

    if (append) {
      loadingMore.value = true
    } else {
      loading.value = true
      items.value = []
      total.value = 0
      fetchedCount.value = 0
    }

    try {
      const page = await fetchModels({
        offset: fetchedCount.value,
        limit: PAGE_SIZE,
        q: debouncedQuery.value || undefined,
      })

      if (seq !== requestSeq) return

      const incoming = filterIncoming(page.items)
      items.value = append ? mergeUniqueModels(items.value, incoming) : incoming
      total.value = page.total
      fetchedCount.value += page.items.length

      await ensureSelectedInList()
    } catch {
      if (seq !== requestSeq) return
      if (!append) {
        items.value = []
        total.value = 0
        fetchedCount.value = 0
      }
    } finally {
      if (seq === requestSeq) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  async function refresh() {
    await loadPage(false)
  }

  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return
    await loadPage(true)
  }

  function resetSearch() {
    clearTimeout(debounceTimer)
    searchQuery.value = ''
    debouncedQuery.value = ''
  }

  watch(searchQuery, (query) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = query.trim()
    }, SEARCH_DEBOUNCE_MS)
  })

  watch(debouncedQuery, () => {
    if (!isEnabled()) return
    void loadPage(false)
  })

  watch(
    () => [toValue(options?.selectedId), toValue(options?.prefilledModel)] as const,
    () => {
      void ensureSelectedInList()
    },
    { immediate: true },
  )

  if (options?.prefetchTotal) {
    void fetchModels({ limit: 1, offset: 0 })
      .then((page) => {
        catalogTotal.value = page.total
        if (!debouncedQuery.value) {
          total.value = page.total
        }
      })
      .catch(() => {
        // ignore
      })
  }

  onBeforeUnmount(() => {
    clearTimeout(debounceTimer)
    requestSeq += 1
  })

  return {
    items,
    catalogTotal,
    total,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    selectorOptions,
    refresh,
    loadMore,
    resetSearch,
    ensureSelectedInList,
  }
}
