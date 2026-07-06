<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { fetchModelDetail, fetchModels } from '@/api/models'
import { fetchModelInputSchema } from '@/api/modelSchema'
import PlaygroundInputPanel from '@/components/playground/PlaygroundInputPanel.vue'
import PlaygroundOutputPanel from '@/components/playground/PlaygroundOutputPanel.vue'
import type { ModelSelectorOption } from '@/components/playground/fields/ModelSelectorField.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { usePlaygroundGeneration } from '@/composables/usePlaygroundGeneration'
import { usePlaygroundQuote } from '@/composables/usePlaygroundQuote'
import { useUserStore } from '@/stores/user'
import { AnalyticsEvents, trackEvent } from '@/analytics'
import { createDefaultFormValues } from '@/utils/schema-form'
import type { Model, ModelDetail } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'

const route = useRoute()
const { replace } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const models = ref<Model[]>([])
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

const modelOptions = computed<ModelSelectorOption[]>(() =>
  models.value.map((item) => ({
    id: item.id,
    label: item.displayName,
    capability: item.capability,
    description: item.description,
    isHot: item.isHot,
    isNew: item.isNew,
  })),
)

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

function resolveInitialModelId(items: Model[]): string {
  const queryModel = route.query.model
  if (typeof queryModel === 'string' && items.some((item) => item.id === queryModel)) {
    return queryModel
  }
  return items.find((item) => item.isHot)?.id ?? items[0]?.id ?? ''
}

async function loadModels() {
  listLoading.value = true
  listError.value = null

  try {
    const page = await fetchModels({ limit: 100 })
    models.value = page.items
    if (page.items.length === 0) {
      selectedModelId.value = ''
      return
    }
    selectedModelId.value = resolveInitialModelId(page.items)
    if (selectedModelId.value) {
      replace({ name: 'ai-generator', query: { model: selectedModelId.value } })
    }
  } catch {
    listError.value = t('pages.aiGenerator.loadError')
    models.value = []
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
    const [detail, schema] = await Promise.all([
      fetchModelDetail(id),
      fetchModelInputSchema(id).catch(() => null),
    ])
    model.value = detail
    inputSchema.value = schema
    formValues.value = createDefaultFormValues(schema ?? undefined)
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

watch(selectedModelId, (id, previousId) => {
  if (!id) return
  if (previousId && id !== previousId) {
    trackEvent(AnalyticsEvents.MODEL_SELECTOR_CHANGE, {
      model_id: id,
      previous_model_id: previousId,
    })
    replace({ name: 'ai-generator', query: { model: id } })
  }
  void loadSelectedModel(id)
})

watch(
  () => route.query.model,
  (queryModel) => {
    if (typeof queryModel !== 'string' || !models.value.length) return
    if (queryModel === selectedModelId.value) return
    if (models.value.some((item) => item.id === queryModel)) {
      selectedModelId.value = queryModel
    }
  },
)

onMounted(() => {
  userStore.loadProfile()
  void loadModels()
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

    <div v-else-if="models.length === 0" class="ai-generator-page__state">
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
        :schema="inputSchema"
        :model-id="model.id"
        :model-options="modelOptions"
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
