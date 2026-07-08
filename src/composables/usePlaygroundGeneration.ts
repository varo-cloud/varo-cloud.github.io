import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import {
  createPlaygroundGeneration,
  fetchPlaygroundGeneration,
  mapPlaygroundGenerationResult,
  type PlaygroundGenerationSnapshot,
} from '@/api/playground'
import { useAppMessage } from '@/composables/useAppMessage'
import { AnalyticsEvents, trackEvent } from '@/analytics'
import type { GenerationDetail, GenerationStatus, PlaygroundGenerationResult } from '@/types'
import type { SchemaFormValues } from '@/types/schema'

const POLL_INTERVAL_MS = 3000

export interface RunPlaygroundGenerationOptions {
  /** Catalog slug, e.g. `seedance-2.0/text-to-video` */
  modelSlug: string
  values: SchemaFormValues
  batchSize: number
  unitCostUsd: number
  analyticsSource?: 'model_detail' | 'ai_generator'
  analyticsCapability?: string
  onSuccess?: () => void
}

function normalizeCreatedAt(value: number): number {
  return value > 1_000_000_000_000 ? Math.floor(value / 1000) : value
}

function mapDetailToResult(detail: GenerationDetail, unitCostUsd: number): PlaygroundGenerationResult {
  return {
    id: detail.taskId,
    object: 'generation',
    status: detail.status === 'failed' ? 'failed' : 'completed',
    model: detail.model,
    created_at: normalizeCreatedAt(detail.createdAt),
    output: {
      type: detail.result.type,
      url: detail.result.output_url ?? '',
    },
    usage: { cost_usd: unitCostUsd },
  }
}

function mapDetailStatus(status: GenerationDetail['status']): GenerationStatus {
  if (status === 'queued') return 'queued'
  if (status === 'processing') return 'processing'
  if (status === 'succeeded') return 'completed'
  if (status === 'failed') return 'failed'
  return 'idle'
}

function sleep(ms: number, signal: { aborted: boolean }) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const timer = setTimeout(() => {
      clearTimeout(timer)
      resolve()
    }, ms)
  })
}

function isInsufficientBalanceError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  return error.response?.status === 402 || error.response?.data?.code === 402
}

function averageProgress(snapshots: PlaygroundGenerationSnapshot[]): number {
  const values = snapshots
    .map((item) => item.progress)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function resolveHttpStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined
  return error.response?.status ?? (typeof error.response?.data?.code === 'number'
    ? error.response.data.code
    : undefined)
}

function resolveRunErrorMessage(
  error: unknown,
  insufficientBalanceMessage: string,
  upstreamFailedMessage: string,
  fallbackMessage: string,
): string {
  if (isInsufficientBalanceError(error)) return insufficientBalanceMessage

  const status = resolveHttpStatus(error)
  if (status === 502 || status === 404) {
    if (error instanceof Error && error.message) return error.message
    return upstreamFailedMessage
  }

  if (error instanceof Error && error.message) return error.message
  return fallbackMessage
}

export function usePlaygroundGeneration() {
  const { t } = useI18n()
  const message = useAppMessage()

  const generationStatus = ref<GenerationStatus>('idle')
  const generationProgress = ref(0)
  const outputUrls = ref<string[]>([])
  const generationResults = ref<PlaygroundGenerationResult[]>([])

  let pollAbort = { aborted: false }
  let progressInterval: ReturnType<typeof setInterval> | null = null

  const isGenerating = computed(
    () => generationStatus.value === 'queued' || generationStatus.value === 'processing',
  )

  function clearProgressInterval() {
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
  }

  function resetGeneration() {
    pollAbort.aborted = true
    clearProgressInterval()
    generationStatus.value = 'idle'
    generationProgress.value = 0
    outputUrls.value = []
    generationResults.value = []
  }

  function startIndeterminateProgress() {
    clearProgressInterval()
    generationProgress.value = 0

    progressInterval = setInterval(() => {
      if (generationStatus.value !== 'processing') return
      if (generationProgress.value >= 90) return
      generationProgress.value = Math.min(90, generationProgress.value + 1)
    }, 400)
  }

  function applySnapshots(snapshots: PlaygroundGenerationSnapshot[]) {
    const hasProcessing = snapshots.some((item) => item.status === 'processing')
    generationStatus.value = hasProcessing ? 'processing' : 'queued'

    const progress = averageProgress(snapshots)
    if (progress > 0) {
      generationProgress.value = progress
    } else if (generationStatus.value === 'processing' && !progressInterval) {
      startIndeterminateProgress()
    }
  }

  function applyCompletedSnapshots(
    snapshots: PlaygroundGenerationSnapshot[],
    unitCostUsd: number,
    options: RunPlaygroundGenerationOptions,
  ) {
    clearProgressInterval()
    generationStatus.value = 'completed'
    generationProgress.value = 100
    generationResults.value = snapshots.map((snapshot) =>
      mapPlaygroundGenerationResult(snapshot, unitCostUsd),
    )
    outputUrls.value = generationResults.value
      .map((item) => item.output.url)
      .filter((url) => Boolean(url))

    if (options.analyticsSource) {
      trackEvent(AnalyticsEvents.PLAYGROUND_RUN_SUCCESS, {
        source: options.analyticsSource,
        model_id: options.modelSlug,
        capability: options.analyticsCapability,
        batch_size: options.batchSize,
      })
    }

    options.onSuccess?.()
  }

  async function pollGenerations(taskIds: string[], options: RunPlaygroundGenerationOptions) {
    const signal = pollAbort

    while (!signal.aborted) {
      const snapshots = await Promise.all(taskIds.map((id) => fetchPlaygroundGeneration(id)))

      if (signal.aborted) return

      const hasFailed = snapshots.some((item) => item.status === 'failed')
      const allTerminal = snapshots.every(
        (item) => item.status === 'completed' || item.status === 'failed',
      )

      if (allTerminal) {
        if (hasFailed) {
          clearProgressInterval()
          generationStatus.value = 'failed'
          generationProgress.value = 0
          const failedMessage =
            snapshots.find((item) => item.errorMessage)?.errorMessage
            ?? t('pages.modelDetail.generationFailed')
          message.error(failedMessage)
          return
        }

        applyCompletedSnapshots(snapshots, options.unitCostUsd, options)
        return
      }

      applySnapshots(snapshots)
      await sleep(POLL_INTERVAL_MS, signal)
    }
  }

  async function runGeneration(options: RunPlaygroundGenerationOptions) {
    pollAbort.aborted = true
    clearProgressInterval()
    pollAbort = { aborted: false }

    generationStatus.value = 'queued'
    generationProgress.value = 0
    outputUrls.value = []
    generationResults.value = []

    try {
      const created = await createPlaygroundGeneration(
        options.modelSlug,
        options.values,
        options.batchSize,
      )

      if (pollAbort.aborted) return

      const hasProcessing = created.some((item) => item.status === 'processing')
      generationStatus.value = hasProcessing ? 'processing' : 'queued'

      const allTerminal = created.every(
        (item) => item.status === 'completed' || item.status === 'failed',
      )

      if (allTerminal) {
        const hasFailed = created.some((item) => item.status === 'failed')
        if (hasFailed) {
          generationStatus.value = 'failed'
          message.error(t('pages.modelDetail.generationFailed'))
          return
        }

        applyCompletedSnapshots(created, options.unitCostUsd, options)
        return
      }

      if (generationStatus.value === 'processing') {
        startIndeterminateProgress()
      }

      await pollGenerations(
        created.map((item) => item.id),
        options,
      )
    } catch (error) {
      if (pollAbort.aborted) return

      generationStatus.value = 'failed'
      generationProgress.value = 0
      message.error(
        resolveRunErrorMessage(
          error,
          t('pages.modelDetail.insufficientBalance'),
          t('pages.modelDetail.upstreamFailed'),
          t('pages.modelDetail.generationFailed'),
        ),
      )
    }
  }

  async function pollRestoredGeneration(taskId: string, unitCostUsd: number) {
    const signal = pollAbort

    while (!signal.aborted) {
      const snapshot = await fetchPlaygroundGeneration(taskId)

      if (signal.aborted) return

      if (snapshot.status === 'completed') {
        clearProgressInterval()
        generationStatus.value = 'completed'
        generationProgress.value = 100
        generationResults.value = [mapPlaygroundGenerationResult(snapshot, unitCostUsd)]
        outputUrls.value = generationResults.value
          .map((item) => item.output.url)
          .filter((url) => Boolean(url))
        return
      }

      if (snapshot.status === 'failed') {
        clearProgressInterval()
        generationStatus.value = 'failed'
        generationProgress.value = 0
        outputUrls.value = []
        generationResults.value = []
        message.error(snapshot.errorMessage ?? t('pages.modelDetail.generationFailed'))
        return
      }

      applySnapshots([snapshot])
      await sleep(POLL_INTERVAL_MS, signal)
    }
  }

  function restoreFromDetail(detail: GenerationDetail, options?: { pollInProgress?: boolean }) {
    pollAbort.aborted = true
    clearProgressInterval()
    pollAbort = { aborted: false }

    const unitCostUsd = detail.costUsd ?? 0
    const status = mapDetailStatus(detail.status)

    if (status === 'completed') {
      generationStatus.value = 'completed'
      generationProgress.value = 100

      if (detail.result.output_url) {
        generationResults.value = [mapDetailToResult(detail, unitCostUsd)]
        outputUrls.value = [detail.result.output_url]
      } else {
        generationResults.value = []
        outputUrls.value = []
      }
      return
    }

    if (status === 'failed') {
      generationStatus.value = 'failed'
      generationProgress.value = 0
      outputUrls.value = []
      generationResults.value = []
      if (detail.result.error?.message) {
        message.error(detail.result.error.message)
      }
      return
    }

    generationStatus.value = status
    generationProgress.value = 0
    outputUrls.value = []
    generationResults.value = []

    if (status === 'processing') {
      startIndeterminateProgress()
    }

    if (options?.pollInProgress !== false) {
      void pollRestoredGeneration(detail.taskId, unitCostUsd)
    }
  }

  onBeforeUnmount(() => {
    pollAbort.aborted = true
    clearProgressInterval()
  })

  return {
    generationStatus,
    generationProgress,
    outputUrls,
    generationResults,
    isGenerating,
    runGeneration,
    resetGeneration,
    restoreFromDetail,
  }
}
