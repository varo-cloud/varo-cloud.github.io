<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NTooltip } from 'naive-ui'
import { useAppMessage } from '@/composables/useAppMessage'
import GenerationStatusDisplay from './GenerationStatusDisplay.vue'
import GenerationPreviewLightbox from './GenerationPreviewLightbox.vue'
import PlaygroundExamplesBar from './PlaygroundExamplesBar.vue'
import type { GenerationStatus, ModelExample, PlaygroundGenerationResult } from '@/types'
import { downloadMediaFile, guessDownloadFilename } from '@/utils/downloadMedia'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'
import { assetUrl } from '@/utils/assetUrl'

const emptyStateIconSrc = assetUrl('/assets/playground/no-generations.svg')

const props = defineProps<{
  outputUrls?: string[]
  results?: PlaygroundGenerationResult[]
  status?: GenerationStatus
  progress?: number
  estimatedSeconds?: number
  examples?: ModelExample[]
  selectedExampleId?: string | null
}>()

const emit = defineEmits<{
  'select-example': [exampleId: string]
}>()

const { t } = useI18n()
const message = useAppMessage()

const viewMode = ref<'preview' | 'json'>('preview')
const lightboxIndex = ref<number | null>(null)
const downloadingIndex = ref<number | null>(null)

const activeStatus = computed(() => {
  if (
    props.status === 'queued' ||
    props.status === 'processing' ||
    props.status === 'completed' ||
    props.status === 'failed'
  ) {
    return props.status
  }
  return null
})

const isGenerating = computed(
  () =>
    activeStatus.value === 'queued' ||
    activeStatus.value === 'processing' ||
    activeStatus.value === 'failed',
)

const showOutput = computed(
  () => props.status === 'completed' && (props.results?.length ?? 0) > 0,
)

const selectedExample = computed(
  () => props.examples?.find((item) => item.id === props.selectedExampleId) ?? null,
)

const showExample = computed(
  () =>
    !showOutput.value &&
    !isGenerating.value &&
    Boolean(selectedExample.value?.outputUrl ?? selectedExample.value?.thumbnailUrl),
)

const showExamplesBar = computed(
  () => !isGenerating.value && (props.examples?.length ?? 0) > 0,
)

const previewUrls = computed(() => {
  if (showOutput.value) return props.outputUrls ?? []
  if (showExample.value && selectedExample.value) {
    const url = selectedExample.value.outputUrl ?? selectedExample.value.thumbnailUrl
    return url ? [url] : []
  }
  return []
})

const outputCount = computed(() => previewUrls.value.length)

const gridClass = computed(() => {
  const count = outputCount.value
  if (count <= 1) return 'output-panel__grid--1'
  if (count === 2) return 'output-panel__grid--2'
  if (count === 3) return 'output-panel__grid--3'
  return 'output-panel__grid--4'
})

const formattedJson = computed(() => {
  if (!props.results?.length) return ''
  if (props.results.length === 1) {
    return JSON.stringify(props.results[0], null, 2)
  }
  return JSON.stringify(
    {
      object: 'list',
      data: props.results,
    },
    null,
    2,
  )
})

function toggleCodeView() {
  if (!showOutput.value) return
  viewMode.value = viewMode.value === 'json' ? 'preview' : 'json'
}

function openLightbox(index: number) {
  lightboxIndex.value = index
}

function closeLightbox() {
  lightboxIndex.value = null
}

async function downloadResult(url: string, index: number) {
  if (downloadingIndex.value != null) return

  downloadingIndex.value = index
  try {
    await downloadMediaFile(url, guessDownloadFilename(url, index))
  } catch {
    message.error(t('pages.modelDetail.downloadFailed'))
  } finally {
    downloadingIndex.value = null
  }
}

watch(
  () => props.status,
  (status) => {
    if (status !== 'completed') {
      viewMode.value = 'preview'
      lightboxIndex.value = null
    }
  },
)

watch(
  () => props.selectedExampleId,
  () => {
    viewMode.value = 'preview'
    lightboxIndex.value = null
  },
)
</script>

<template>
  <section class="output-panel">
    <div class="output-panel__header">
      <h2 class="output-panel__title">{{ t('pages.modelDetail.myGenerations') }}</h2>
      <div class="output-panel__tools">
        <NTooltip trigger="hover" placement="top" :disabled="showOutput">
          <template #trigger>
            <span class="output-panel__tool-wrap">
              <button
                type="button"
                class="output-panel__tool"
                :class="{ 'output-panel__tool--active': viewMode === 'json' }"
                :disabled="!showOutput"
                @click="toggleCodeView"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M5 4l6 4-6 4V4z" stroke="currentColor" stroke-width="1.2" />
                  <path d="M11 3h2v10h-2" stroke="currentColor" stroke-width="1.2" />
                </svg>
                {{ t('pages.modelDetail.code') }}
              </button>
            </span>
          </template>
          {{ t('pages.modelDetail.codeNoResult') }}
        </NTooltip>
      </div>
    </div>

    <div
      class="output-panel__body"
      :class="{
        'output-panel__body--centered': !showOutput && !showExample && !showExamplesBar,
        'output-panel__body--with-examples': showExamplesBar,
      }"
    >
      <div
        v-if="previewUrls.length > 0 && viewMode === 'preview'"
        class="output-panel__grid"
        :class="gridClass"
      >
        <template v-for="(url, index) in previewUrls" :key="`${selectedExampleId ?? 'output'}-${url}-${index}`">
          <div
            class="output-panel__item"
            :class="{ 'output-panel__item--interactive': showOutput }"
          >
            <video
              v-if="resolveMediaPreviewKind(url) === 'video'"
              :src="url"
              class="output-panel__preview output-panel__preview--video"
              controls
              playsinline
              loop
              muted
            />
            <audio
              v-else-if="resolveMediaPreviewKind(url) === 'audio'"
              :src="url"
              class="output-panel__preview output-panel__preview--audio"
              controls
            />
            <img
              v-else
              :src="url"
              alt=""
              class="output-panel__preview"
            />

            <div v-if="showOutput" class="output-panel__item-actions">
              <NTooltip trigger="hover" placement="top">
                <template #trigger>
                  <button
                    type="button"
                    class="output-panel__item-action"
                    :aria-label="t('pages.modelDetail.viewFullscreen')"
                    @click="openLightbox(index)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M2.5 5.5V2.5h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </template>
                {{ t('pages.modelDetail.viewFullscreen') }}
              </NTooltip>
              <NTooltip trigger="hover" placement="top">
                <template #trigger>
                  <button
                    type="button"
                    class="output-panel__item-action"
                    :aria-label="t('pages.modelDetail.download')"
                    :disabled="downloadingIndex === index"
                    @click.stop="downloadResult(url, index)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M8 2.5v7M5.5 7 8 9.5 10.5 7M3 12.5h10"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </template>
                {{ t('pages.modelDetail.download') }}
              </NTooltip>
            </div>
          </div>
        </template>
      </div>
      <pre
        v-else-if="showOutput && viewMode === 'json'"
        class="output-panel__json scrollbar-subtle"
      ><code>{{ formattedJson }}</code></pre>
      <GenerationStatusDisplay
        v-else-if="isGenerating && activeStatus"
        :status="activeStatus"
        :progress="progress"
        :estimated-seconds="estimatedSeconds"
      />
      <div v-else class="output-panel__empty">
        <img
          :src="emptyStateIconSrc"
          alt=""
          class="output-panel__empty-icon"
        />
        <p class="output-panel__empty-text">{{ t('pages.modelDetail.noGenerations') }}</p>
      </div>

      <div v-if="showExamplesBar" class="output-panel__examples">
        <p class="output-panel__examples-label">{{ t('pages.modelDetail.examples') }}</p>
        <PlaygroundExamplesBar
          v-if="examples"
          :examples="examples"
          :selected-example-id="selectedExampleId"
          @select="emit('select-example', $event)"
        />
      </div>
    </div>

    <GenerationPreviewLightbox
      v-if="lightboxIndex != null"
      :urls="previewUrls"
      :initial-index="lightboxIndex"
      @close="closeLightbox"
    />
  </section>
</template>

<style scoped>
.output-panel {
  display: flex;
  flex-direction: column;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  min-height: 600px;
}

.output-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.output-panel__title {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.output-panel__tools {
  display: flex;
  gap: 16px;
}

.output-panel__tool-wrap {
  display: inline-flex;
}

.output-panel__tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  color: #ebf4fb;
  cursor: pointer;
  font-family: inherit;
}

.output-panel__tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.output-panel__tool--active {
  color: #06b6d4;
}

.output-panel__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
}

.output-panel__body--centered {
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.output-panel__body--with-examples {
  justify-content: flex-start;
}

.output-panel__grid {
  display: grid;
  gap: 8px;
  width: 100%;
}

.output-panel__grid--1 {
  grid-template-columns: 1fr;
}

.output-panel__grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

.output-panel__grid--3 {
  grid-template-columns: repeat(2, 1fr);
}

.output-panel__grid--3 .output-panel__item:last-child {
  grid-column: 1 / -1;
  justify-self: center;
  width: calc(50% - 4px);
}

.output-panel__grid--4 {
  grid-template-columns: repeat(2, 1fr);
}

.output-panel__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border-radius: 8px;
  overflow: hidden;
}

.output-panel__item--interactive:hover .output-panel__item-actions {
  opacity: 1;
}

.output-panel__item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.output-panel__item-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(10, 10, 14, 0.72);
  color: #ebf4fb;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.15s ease;
}

.output-panel__item-action:hover:not(:disabled) {
  background: rgba(10, 10, 14, 0.9);
}

.output-panel__item-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (hover: none) {
  .output-panel__item-actions {
    opacity: 1;
  }
}

.output-panel__preview--video {
  width: 100%;
  max-height: 500px;
  border-radius: 8px;
  background: #000;
}

.output-panel__preview--audio {
  width: 100%;
  margin-top: auto;
  margin-bottom: auto;
}

.output-panel__preview {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
}

.output-panel__grid--2 .output-panel__preview,
.output-panel__grid--3 .output-panel__preview,
.output-panel__grid--4 .output-panel__preview {
  max-height: 320px;
}

.output-panel__grid--2 .output-panel__preview--video,
.output-panel__grid--3 .output-panel__preview--video,
.output-panel__grid--4 .output-panel__preview--video {
  max-height: 320px;
}

.output-panel__json {
  width: 100%;
  max-height: 500px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  border: 0.5px solid rgba(255, 255, 255, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #c8d6e5;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-panel__json code {
  font-family: inherit;
}

.output-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.output-panel__empty-icon {
  width: 96px;
  height: 96px;
  object-fit: contain;
}

.output-panel__empty-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: #9b9dab;
}

.output-panel__examples {
  width: 100%;
  margin-top: auto;
  padding-top: 16px;
  border-top: 0.5px solid rgba(255, 255, 255, 0.08);
}

.output-panel__examples-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #9b9dab;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

</style>
