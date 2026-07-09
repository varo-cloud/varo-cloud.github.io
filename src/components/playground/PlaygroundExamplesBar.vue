<script setup lang="ts">
import { computed } from 'vue'
import type { ModelExample } from '@/types'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'

const props = defineProps<{
  examples: ModelExample[]
  selectedExampleId?: string | null
}>()

const emit = defineEmits<{
  select: [exampleId: string]
}>()

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
  <div class="examples-bar" role="listbox" :aria-activedescendant="selectedExampleId ?? undefined">
    <button
      v-for="example in sortedExamples"
      :id="`example-${example.id}`"
      :key="example.id"
      type="button"
      role="option"
      class="examples-bar__item"
      :aria-selected="example.id === selectedExampleId"
      @click="handleSelect(example.id)"
    >
      <div class="examples-bar__thumb-wrap">
        <video
          v-if="isVideoPreview(example) && previewUrl(example)"
          :src="previewUrl(example)"
          class="examples-bar__thumb examples-bar__thumb--video"
          muted
          playsinline
          loop
          preload="metadata"
        />
        <img
          v-else-if="previewUrl(example)"
          :src="previewUrl(example)"
          alt=""
          class="examples-bar__thumb"
        />
        <div v-else class="examples-bar__thumb examples-bar__thumb--empty" />
      </div>
      <span class="examples-bar__title">{{ example.title }}</span>
      <span v-if="example.description" class="examples-bar__description">
        {{ example.description }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.examples-bar {
  display: flex;
  gap: 12px;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.examples-bar__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  flex: 0 0 140px;
  width: 140px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.examples-bar__thumb-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.examples-bar__item:hover .examples-bar__thumb-wrap {
  border-color: rgba(255, 255, 255, 0.28);
}

.examples-bar__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.examples-bar__thumb--video {
  background: #000;
}

.examples-bar__thumb--empty {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}

.examples-bar__title {
  width: 100%;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: #ebf4fb;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.examples-bar__description {
  width: 100%;
  font-size: 11px;
  line-height: 1.35;
  color: #9b9dab;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
