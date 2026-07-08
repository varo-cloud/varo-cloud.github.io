<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { fetchModelDetail, fetchModels } from '@/api/models'
import PlaygroundInputPanel from '@/components/playground/PlaygroundInputPanel.vue'
import PlaygroundOutputPanel from '@/components/playground/PlaygroundOutputPanel.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { usePlaygroundGeneration } from '@/composables/usePlaygroundGeneration'
import { usePlaygroundQuote } from '@/composables/usePlaygroundQuote'
import { useUserStore } from '@/stores/user'
import { AnalyticsEvents, trackEvent } from '@/analytics'
import { createDefaultFormValues } from '@/utils/schema-form'
import { extractInputSchema } from '@/utils/model-schema'
import { isValidModelSlug, normalizeModelSlug } from '@/utils/model-slug'
import type { ModelDetail } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'

const route = useRoute()
const { replace } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const hasModels = ref(true)
const selectedModelId = ref('')
const model = ref<ModelDetail | null>(null)
const inputSchema = ref<InputSchema | null>(null)
const listLoading = ref(true)
const modelLoading = ref(false)
const listError = ref<string | null>(null)
const modelError = ref<string | null>(null)
const batchSize = ref(1)
const formValues = ref<SchemaFormValues>({})
const estimatedSeconds = 40

const {
  generationStatus,
  generationProgress,
  outputUrls,
  generationResults,
  isGenerating,
  runGeneration,
  resetGeneration,
} = usePlaygroundGeneration()

const balanceUsd = computed(() => userStore.balanceUsd ?? 0)

function selectableModels<T extends { id: string }>(items: T[]): T[] {
  return items.filter((item) => isValidModelSlug(item.id))
}

async function resolveInitialModelId(): Promise<string> {
  const queryModel = route.query.model
  if (typeof queryModel === 'string') {
    const normalizedQuery = normalizeModelSlug(queryModel)
    if (isValidModelSlug(normalizedQuery)) {
      try {
        await fetchModelDetail(normalizedQuery)
        return normalizedQuery
      } catch {
        // fall through to default selection
      }
    }
  }

  const page = await fetchModels({ limit: 20, offset: 0 })
  const selectable = selectableModels(page.items)
  return selectable.find((item) => item.isHot)?.id ?? selectable[0]?.id ?? ''
}

const fallbackUnitCostUsd = computed(() => model.value?.startingPriceUsd ?? 0)

const fallbackStandardUnitCostUsd = computed(() => {
  const current = model.value
  if (!current || current.originalPriceUsd == null || !current.startingPriceUsd) {
    return undefined
  }

  if (current.originalPriceUsd <= current.startingPriceUsd) return undefined
  return current.originalPriceUsd
})

const playgroundQuote = usePlaygroundQuote({
  modelId: computed(() => model.value?.id ?? ''),
  formValues,
  batchSize,
  fallbackUnitCostUsd,
  fallbackStandardUnitCostUsd,
  enabled: computed(
    () => userStore.isLoggedIn && Boolean(model.value?.id && inputSchema.value),
  ),
})

const quoteCostUsd = playgroundQuote.costUsd
const quoteStandardCostUsd = playgroundQuote.standardCostUsd
const quoteLoading = playgroundQuote.loading
const quoteUnitCostUsd = playgroundQuote.unitCostUsd

const selectedModelDisplay = computed(() => {
  if (!model.value) return undefined

  return {
    id: model.value.id,
    label: model.value.displayName,
    capability: model.value.capability,
    description: model.value.description,
    isHot: model.value.isHot,
    isNew: model.value.isNew,
  }
})

async function initializePage() {
  listLoading.value = true
  listError.value = null

  try {
    const page = await fetchModels({ limit: 1, offset: 0 })
    if (page.total === 0) {
      hasModels.value = false
      selectedModelId.value = ''
      return
    }

    hasModels.value = true
    selectedModelId.value = await resolveInitialModelId()
    if (!selectedModelId.value) {
      return
    }
    replace({ name: 'ai-generator', query: { model: selectedModelId.value } })
  } catch {
    listError.value = t('pages.aiGenerator.loadError')
    hasModels.value = false
    selectedModelId.value = ''
  } finally {
    listLoading.value = false
  }
}

async function loadSelectedModel(id: string) {
  if (!id) {
    model.value = null
    inputSchema.value = null
    return
  }

  modelLoading.value = true
  modelError.value = null
  resetGeneration()
  inputSchema.value = null

  try {
    const detail = await fetchModelDetail(id)
    let schema: InputSchema | null = null

    if (detail.inputSchema) {
      try {
        schema = extractInputSchema(detail.inputSchema)
      } catch {
        schema = null
      }
    }

    formValues.value = createDefaultFormValues(schema ?? undefined)
    model.value = detail
    inputSchema.value = schema
  } catch {
    modelError.value = t('pages.aiGenerator.modelLoadError')
    model.value = null
    inputSchema.value = null
  } finally {
    modelLoading.value = false
  }
}

function handleRun(values: SchemaFormValues, count: number) {
  if (!model.value) return

  void runGeneration({
    modelSlug: model.value.id,
    values,
    batchSize: count,
    unitCostUsd: quoteUnitCostUsd.value,
    analyticsSource: 'ai_generator',
    analyticsCapability: model.value.capability,
    onSuccess: () => {
      void userStore.loadProfile()
    },
  })
}

watch(
  selectedModelId,
  (id, previousId) => {
    if (!id) return
    if (previousId && id !== previousId) {
      trackEvent(AnalyticsEvents.MODEL_SELECTOR_CHANGE, {
        model_id: id,
        previous_model_id: previousId,
      })
      replace({ name: 'ai-generator', query: { model: id } })
    }
    void loadSelectedModel(id)
  },
  { immediate: true },
)

watch(
  () => route.query.model,
  (queryModel) => {
    if (typeof queryModel !== 'string') return
    const normalizedQuery = normalizeModelSlug(queryModel)
    if (normalizedQuery === selectedModelId.value) return
    if (isValidModelSlug(normalizedQuery)) {
      selectedModelId.value = normalizedQuery
    }
  },
)

onMounted(() => {
  userStore.loadProfile()
  void initializePage()
})
</script>

<template>
  <div class="ai-generator-page">
    <div v-if="listLoading" class="ai-generator-page__state">
      <NSpin size="large" />
    </div>

    <div v-else-if="listError" class="ai-generator-page__state">
      <p>{{ listError }}</p>
    </div>

    <div v-else-if="!hasModels" class="ai-generator-page__state">
      <p>{{ t('pages.aiGenerator.emptyModels') }}</p>
    </div>

    <div v-else class="ai-generator-page__playground">
      <div v-if="modelLoading && !model" class="ai-generator-page__panel-placeholder">
        <NSpin size="medium" />
      </div>
      <PlaygroundInputPanel
        v-else-if="inputSchema && model"
        v-model:batch-size="batchSize"
        v-model:form-values="formValues"
        v-model:selected-model-id="selectedModelId"
        :selected-model-display="selectedModelDisplay"
        :schema="inputSchema"
        :model-id="model.id"
        :api-model-id="model.id"
        :cost-usd="quoteCostUsd"
        :standard-cost-usd="quoteStandardCostUsd"
        :quote-loading="quoteLoading"
        :balance-usd="balanceUsd"
        :generating="isGenerating || modelLoading"
        analytics-source="ai_generator"
        :analytics-capability="model.capability"
        @run="handleRun"
      />
      <div v-else class="ai-generator-page__panel-placeholder">
        <p>{{ modelError || t('pages.modelDetail.schemaUnavailable') }}</p>
      </div>

      <PlaygroundOutputPanel
        :output-urls="outputUrls"
        :results="generationResults"
        :status="generationStatus"
        :progress="generationProgress"
        :estimated-seconds="estimatedSeconds"
        :example-url="inputSchema?.example_url"
      />
    </div>
  </div>
</template>

<style scoped>
.ai-generator-page {
  background: #0a0a0e;
  color: #ebf4fb;
  min-height: calc(100vh - 60px);
  padding: 101px 24px 48px;
}

.ai-generator-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  color: #9b9dab;
}

.ai-generator-page__playground {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 16px;
  max-width: 1360px;
  margin: 0 auto;
  align-items: start;
}

.ai-generator-page__panel-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 24px;
  background: #13131c;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  color: #9b9dab;
  font-size: 14px;
}

@media (max-width: 1023px) {
  .ai-generator-page {
    padding: 88px 16px 32px;
  }

  .ai-generator-page__playground {
    grid-template-columns: 1fr;
  }
}
</style>
