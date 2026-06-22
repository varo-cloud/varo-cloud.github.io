<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NTooltip } from 'naive-ui'
import GenerationStatusDisplay from './GenerationStatusDisplay.vue'
import type { GenerationStatus, PlaygroundGenerationResult } from '@/types'

const props = defineProps<{
  outputUrls?: string[]
  results?: PlaygroundGenerationResult[]
  status?: GenerationStatus
  progress?: number
  estimatedSeconds?: number
  perRunPriceUsd?: number
  runsPerTenUsd?: number
}>()

const { t } = useI18n()

const viewMode = ref<'preview' | 'json'>('preview')

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

const outputCount = computed(() => props.outputUrls?.length ?? 0)

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

watch(
  () => props.status,
  (status) => {
    if (status !== 'completed') {
      viewMode.value = 'preview'
    }
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
      :class="{ 'output-panel__body--centered': !showOutput }"
    >
      <div
        v-if="showOutput && viewMode === 'preview'"
        class="output-panel__grid"
        :class="gridClass"
      >
        <img
          v-for="(url, index) in outputUrls"
          :key="`${url}-${index}`"
          :src="url"
          alt=""
          class="output-panel__preview"
        />
      </div>
      <pre
        v-else-if="showOutput && viewMode === 'json'"
        class="output-panel__json"
      ><code>{{ formattedJson }}</code></pre>
      <GenerationStatusDisplay
        v-else-if="isGenerating && activeStatus"
        :status="activeStatus"
        :progress="progress"
        :estimated-seconds="estimatedSeconds"
      />
      <div v-else class="output-panel__empty">
        {{ t('pages.modelDetail.noGenerations') }}
      </div>
    </div>

    <p v-if="perRunPriceUsd != null" class="output-panel__meta">
      <span>${{ perRunPriceUsd.toFixed(2) }}</span>
      <span class="output-panel__meta-muted">{{ t('pages.modelDetail.perRun') }}</span>
      <template v-if="runsPerTenUsd != null">
        <span class="output-panel__meta-muted">·</span>
        <span class="output-panel__meta-muted">~{{ runsPerTenUsd }} / $10</span>
      </template>
    </p>
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

.output-panel__grid--3 .output-panel__preview:last-child {
  grid-column: 1 / -1;
  justify-self: center;
  width: calc(50% - 4px);
}

.output-panel__grid--4 {
  grid-template-columns: repeat(2, 1fr);
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
  font-size: 14px;
  color: #9b9dab;
  text-align: center;
}

.output-panel__meta {
  margin: 16px 0 0;
  font-size: 14px;
  color: #ebf4fb;
}

.output-panel__meta-muted {
  color: #9b9dab;
}
</style>
