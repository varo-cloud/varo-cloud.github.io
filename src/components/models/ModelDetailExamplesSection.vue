<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ModelExample } from '@/types'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'

const props = defineProps<{
  examples: ModelExample[]
  selectedExampleId?: string | null
}>()

const emit = defineEmits<{
  select: [exampleId: string]
}>()

const { t } = useI18n()

const sortedExamples = computed(() => {
  return [...props.examples].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return a.id.localeCompare(b.id)
  })
})

function previewUrl(example: ModelExample): string | undefined {
  return example.thumbnailUrl ?? example.outputUrl
}

function isVideoPreview(example: ModelExample): boolean {
  const url = previewUrl(example)
  if (!url) return false
  return resolveMediaPreviewKind(url) === 'video'
}

function handleSelect(exampleId: string) {
  emit('select', exampleId)
}
</script>

<template>
  <section
    v-if="sortedExamples.length > 0"
    class="model-examples"
    aria-labelledby="model-examples-heading"
  >
    <h2 id="model-examples-heading" class="model-examples__heading">
      {{ t('pages.modelDetail.examples') }}
    </h2>

    <div
      class="model-examples__list scrollbar-subtle"
      role="listbox"
      :aria-activedescendant="selectedExampleId ? `model-example-${selectedExampleId}` : undefined"
    >
      <button
        v-for="example in sortedExamples"
        :id="`model-example-${example.id}`"
        :key="example.id"
        type="button"
        role="option"
        class="model-examples__card"
        :class="{ 'model-examples__card--selected': example.id === selectedExampleId }"
        :aria-selected="example.id === selectedExampleId"
        @click="handleSelect(example.id)"
      >
        <div class="model-examples__media">
          <video
            v-if="isVideoPreview(example) && previewUrl(example)"
            :src="previewUrl(example)"
            class="model-examples__thumb model-examples__thumb--video"
            muted
            playsinline
            loop
            preload="metadata"
          />
          <img
            v-else-if="previewUrl(example)"
            :src="previewUrl(example)"
            :alt="example.title"
            class="model-examples__thumb"
            loading="lazy"
          />
          <div v-else class="model-examples__thumb model-examples__thumb--empty" />
        </div>
        <div class="model-examples__meta">
          <span
            class="model-examples__title"
            :class="{ 'model-examples__title--single': Boolean(example.description) }"
          >
            {{ example.title }}
          </span>
          <span v-if="example.description" class="model-examples__desc">
            {{ example.description }}
          </span>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.model-examples {
  max-width: 1360px;
  margin: 40px auto 0;
}

.model-examples__heading {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
}

.model-examples__list {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.model-examples__card {
  display: flex;
  flex-direction: column;
  flex: 0 0 252px;
  width: 252px;
  padding: 8px 8px 12px;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #1a1f29;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.model-examples__card:hover,
.model-examples__card--selected {
  border-color: rgba(6, 182, 212, 0.55);
  box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.2);
}

.model-examples__media {
  width: 100%;
  height: 145px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

.model-examples__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-examples__thumb--video {
  background: #000;
}

.model-examples__thumb--empty {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}

.model-examples__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
  padding: 0 4px;
  min-width: 0;
  min-height: 38px;
}

.model-examples__title {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.model-examples__title--single {
  -webkit-line-clamp: 1;
}

.model-examples__desc {
  font-size: 12px;
  font-weight: 500;
  line-height: 14px;
  color: #ebf4fb;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
</style>
