<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NSpin } from 'naive-ui'
import { fetchModelDetail } from '@/api/models'
import { loadModelInputSchema } from '@/api/modelSchema'
import { fetchGenerationDetail } from '@/api/generations'
import ModelDetailHeader from '@/components/models/ModelDetailHeader.vue'
import ModelApiTab from '@/components/models/ModelApiTab.vue'
import ModelHistoryTab from '@/components/models/ModelHistoryTab.vue'
import ModelDetailExamplesSection from '@/components/models/ModelDetailExamplesSection.vue'
import ModelDetailRelatedModels from '@/components/models/ModelDetailRelatedModels.vue'
import PlaygroundInputPanel from '@/components/playground/PlaygroundInputPanel.vue'
import PlaygroundOutputPanel from '@/components/playground/PlaygroundOutputPanel.vue'
import { useUserStore } from '@/stores/user'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { createDefaultFormValues } from '@/utils/schema-form'
import { extractBaseModelSlug } from '@/utils/model-slug'
import { usePlaygroundQuote } from '@/composables/usePlaygroundQuote'
import { usePlaygroundGeneration } from '@/composables/usePlaygroundGeneration'
import { usePlaygroundExamples } from '@/composables/usePlaygroundExamples'
import { useAppMessage } from '@/composables/useAppMessage'
import { requestToFormValues, resolveBatchSizeFromRequest } from '@/utils/restore-playground-form'
import type { ModelDetail } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'

const route = useRoute()
const { localePath, push, replace } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()
const message = useAppMessage()

const model = ref<ModelDetail | null>(null)
const inputSchema = ref<InputSchema | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'playground' | 'api' | 'history'>('playground')
const batchSize = ref(1)
const formValues = ref<SchemaFormValues>({})
const restoringHistory = ref(false)

const {
  generationStatus,
  generationProgress,
  generationError,
  outputUrls,
  generationResults,
  isGenerating,
  runGeneration,
  resetGeneration,
  restoreFromDetail,
} = usePlaygroundGeneration()

const balanceUsd = computed(() => userStore.balanceUsd ?? 0)

const fallbackUnitCostUsd = computed(() => model.value?.startingPriceUsd ?? 0)

const playgroundQuote = usePlaygroundQuote({
  modelId: computed(() => model.value?.id ?? ''),
  formValues,
  batchSize,
  fallbackUnitCostUsd,
  enabled: computed(
    () => userStore.isLoggedIn && Boolean(model.value?.id && inputSchema.value),
  ),
})

const quoteCostUsd = playgroundQuote.costUsd
const quoteLoading = playgroundQuote.loading
const quoteUnitCostUsd = playgroundQuote.unitCostUsd

const displayTitle = computed(() => model.value?.displayName ?? '')
const modelExamples = computed(() => model.value?.examples ?? [])
const baseModelSlug = computed(() =>
  model.value?.id ? extractBaseModelSlug(model.value.id) : '',
)

const slugParam = computed(() =>
  typeof route.params.slug === 'string' ? route.params.slug : '',
)

useHead(
  computed(() => {
    const name = model.value?.displayName || slugParam.value || 'Model'
    const description =
      model.value?.description?.trim() || t('pages.models.seo.description')
    return {
      title: t('pages.models.seo.detailTitle', { name }),
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: t('pages.models.seo.detailTitle', { name }) },
        { property: 'og:description', content: description },
        { name: 'twitter:title', content: t('pages.models.seo.detailTitle', { name }) },
        { name: 'twitter:description', content: description },
      ],
    }
  }),
)

const {
  selectedExampleId,
  selectExample,
} = usePlaygroundExamples({
  examples: modelExamples,
  inputSchema,
  formValues,
  resetGeneration,
})

function handleModelSelect(slug: string) {
  if (slug === model.value?.id) return
  void push({ name: 'model-detail', params: { slug } })
}

function handleSelectExample(exampleId: string) {
  selectExample(exampleId)
  activeTab.value = 'playground'
}

async function loadModel(slug: string) {
  loading.value = true
  error.value = null
  resetGeneration()
  inputSchema.value = null

  try {
    const detail = await fetchModelDetail(slug)
    const schema = await loadModelInputSchema(slug, detail.inputSchema)

    model.value = detail
    inputSchema.value = schema
    if (!detail.examples?.length) {
      formValues.value = createDefaultFormValues(schema ?? undefined)
    }
    if (userStore.isLoggedIn) {
      modelPrefs.recordVisit(detail.id)
    }

    const taskId = route.query.task_id
    if (typeof taskId === 'string' && taskId) {
      await handleViewHistoryDetail(taskId)
      const nextQuery = { ...route.query }
      delete nextQuery.task_id
      void replace({ query: nextQuery })
    }
  } catch {
    error.value = t('pages.modelDetail.loadError')
    model.value = null
    inputSchema.value = null
  } finally {
    loading.value = false
  }
}

function handleRun(values: SchemaFormValues, count: number) {
  if (!model.value) return

  void runGeneration({
    modelSlug: model.value.id,
    values,
    batchSize: count,
    unitCostUsd: quoteUnitCostUsd.value,
    analyticsSource: 'model_detail',
    analyticsCapability: model.value.capability,
    onSuccess: () => {
      void userStore.loadProfile()
    },
  })
}

async function handleViewHistoryDetail(taskId: string) {
  if (restoringHistory.value || !model.value) return

  restoringHistory.value = true
  try {
    const detail = await fetchGenerationDetail(taskId)

    if (detail.requestPartial) {
      message.warning(t('pages.modelDetail.history.partialParams'))
    }

    if (inputSchema.value) {
      formValues.value = requestToFormValues(detail.request, inputSchema.value)
    }

    batchSize.value = resolveBatchSizeFromRequest(detail.request)
    activeTab.value = 'playground'
    restoreFromDetail(detail)
  } catch {
    message.error(t('pages.modelDetail.history.detailLoadError'))
  } finally {
    restoringHistory.value = false
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    if (typeof slug === 'string') loadModel(slug)
  },
  { immediate: true },
)
</script>

<template>
  <div class="model-detail-page" data-seo-ready="model-detail">
    <div v-if="loading" class="model-detail-page__state">
      <NSpin size="large" />
    </div>

    <div v-else-if="error || !model" class="model-detail-page__state">
      <p>{{ error || t('pages.modelDetail.notFound') }}</p>
      <RouterLink :to="localePath('/models')" class="model-detail-page__back">
        {{ t('pages.modelDetail.backToModels') }}
      </RouterLink>
    </div>

    <template v-else>
      <div class="model-detail-page__inner">
        <ModelDetailHeader
          :title="displayTitle"
          :model-id="model.id"
          :slug="model.id"
          :description="model.description"
          :thumbnail-url="model.thumbnailUrl"
          @select="handleModelSelect"
        />
      </div>

      <div class="model-detail-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="model-detail-page__tab"
          :class="{ 'model-detail-page__tab--active': activeTab === 'playground' }"
          :aria-selected="activeTab === 'playground'"
          @click="activeTab = 'playground'"
        >
          {{ t('pages.modelDetail.tabs.playground') }}
        </button>
        <button
          type="button"
          role="tab"
          class="model-detail-page__tab"
          :class="{ 'model-detail-page__tab--active': activeTab === 'api' }"
          :aria-selected="activeTab === 'api'"
          @click="activeTab = 'api'"
        >
          {{ t('pages.modelDetail.tabs.api') }}
        </button>
        <button
          type="button"
          role="tab"
          class="model-detail-page__tab"
          :class="{ 'model-detail-page__tab--active': activeTab === 'history' }"
          :aria-selected="activeTab === 'history'"
          @click="activeTab = 'history'"
        >
          {{ t('pages.modelDetail.tabs.history') }}
        </button>
      </div>

      <div v-if="activeTab === 'playground'" class="model-detail-page__playground">
        <PlaygroundInputPanel
          v-if="inputSchema"
          v-model:batch-size="batchSize"
          v-model:form-values="formValues"
          :schema="inputSchema"
          :model-id="model.id"
          :api-model-id="model.id"
          :cost-usd="quoteCostUsd"
          :quote-loading="quoteLoading"
          :balance-usd="balanceUsd"
          :generating="isGenerating"
          :form-sync-key="selectedExampleId"
          analytics-source="model_detail"
          :analytics-capability="model.capability"
          @run="handleRun"
        />
        <div v-else class="model-detail-page__schema-empty">
          {{ t('pages.modelDetail.schemaUnavailable') }}
        </div>
        <PlaygroundOutputPanel
          :output-urls="outputUrls"
          :results="generationResults"
          :status="generationStatus"
          :progress="generationProgress"
          :error-message="generationError"
          :examples="modelExamples"
          :selected-example-id="selectedExampleId"
          :api-model-id="model.id"
          :show-examples-bar="false"
          @select-example="selectExample"
        />
      </div>

      <ModelApiTab
        v-else-if="activeTab === 'api' && inputSchema"
        :schema="inputSchema"
        :api-model-id="model.id"
        :model-name="model.displayName"
        :form-values="formValues"
        :readme-md="model.readmeMd"
        :faq="model.faq"
      />

      <div v-else-if="activeTab === 'api'" class="model-detail-page__api">
        <p class="model-detail-page__api-placeholder">
          {{ t('pages.modelDetail.schemaUnavailable') }}
        </p>
      </div>

      <ModelHistoryTab
        v-else-if="activeTab === 'history'"
        :model-slug="model.id"
        @view-detail="handleViewHistoryDetail"
      />

      <ModelDetailExamplesSection
        v-if="modelExamples.length > 0"
        :examples="modelExamples"
        :selected-example-id="selectedExampleId"
        @select="handleSelectExample"
      />

      <ModelDetailRelatedModels
        v-if="baseModelSlug"
        :model-id="model.id"
        :base-model-slug="baseModelSlug"
      />
    </template>
  </div>
</template>

<style scoped>
.model-detail-page {
  background: #0a0a0e;
  color: #ebf4fb;
  min-height: calc(100vh - 60px);
  padding: 101px 24px 48px;
}

.model-detail-page__inner {
  max-width: 1360px;
  margin: 0 auto 0;
}

.model-detail-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  color: #9b9dab;
}

.model-detail-page__back {
  color: #06b6d4;
  text-decoration: none;
}

.model-detail-page__tabs {
  display: flex;
  gap: 24px;
  margin: 24px auto 16px;
  max-width: 1360px;
}

.model-detail-page__tab {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #9b9dab;
  cursor: pointer;
}

.model-detail-page__tab--active {
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
  font-weight: 500;
}

.model-detail-page__playground {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 16px;
  max-width: 1360px;
  margin: 0 auto;
  align-items: start;
}

.model-detail-page__schema-empty {
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

.model-detail-page__api {
  max-width: 1360px;
  margin: 0 auto;
}

.model-detail-page__api-placeholder {
  margin: 0;
  padding: 48px 24px;
  text-align: center;
  color: #9b9dab;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

@media (max-width: 1023px) {
  .model-detail-page {
    padding: 88px 16px 32px;
  }

  .model-detail-page__playground {
    grid-template-columns: 1fr;
  }
}
</style>
