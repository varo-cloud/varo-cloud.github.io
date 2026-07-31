<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/common/AppIcon.vue'
import type { BaseModelFacetItem } from '@/types'

const COLLAPSED_ROWS = 2
const TAG_GAP = 12

const props = defineProps<{
  baseModels: BaseModelFacetItem[]
  selectedBaseModel: string | null
}>()

const emit = defineEmits<{
  'update:selectedBaseModel': [value: string | null]
}>()

const { t, te } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const expandMeasureRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
const visibleCount = ref(props.baseModels.length)
const measuring = ref(true)

let resizeObserver: ResizeObserver | undefined

const needsToggle = computed(() => visibleCount.value < props.baseModels.length)

const displayedModels = computed(() => {
  if (expanded.value || measuring.value) return props.baseModels
  return props.baseModels.slice(0, visibleCount.value)
})

function baseModelLabel(slug: string) {
  const key = `pages.models.series.${slug}`
  return te(key) ? t(key) : slug
}

function selectBaseModel(slug: string) {
  emit('update:selectedBaseModel', props.selectedBaseModel === slug ? null : slug)
}

function toggleExpanded() {
  expanded.value = !expanded.value
}

function countFittingTags(
  tagWidths: number[],
  containerWidth: number,
  maxRows: number,
  reservedEndWidth: number,
) {
  let row = 1
  let rowWidth = 0
  let count = 0

  for (let i = 0; i < tagWidths.length; i++) {
    const tagWidth = tagWidths[i]
    const wouldWrap = rowWidth > 0 && rowWidth + TAG_GAP + tagWidth > containerWidth

    if (wouldWrap) {
      row += 1
      rowWidth = 0
      if (row > maxRows) break
    }

    const placedWidth = rowWidth === 0 ? tagWidth : rowWidth + TAG_GAP + tagWidth
    const remainingAfter = tagWidths.length - (i + 1)

    if (reservedEndWidth > 0 && row === maxRows && remainingAfter > 0) {
      if (placedWidth + TAG_GAP + reservedEndWidth > containerWidth) break
    }

    rowWidth = placedWidth
    count = i + 1
  }

  return count
}

function calcVisibleCount() {
  const measureEl = measureRef.value
  const expandEl = expandMeasureRef.value
  if (!measureEl || props.baseModels.length === 0) {
    visibleCount.value = props.baseModels.length
    measuring.value = false
    return
  }

  const containerWidth = measureEl.clientWidth
  if (containerWidth <= 0) {
    measuring.value = false
    return
  }

  const tags = Array.from(measureEl.querySelectorAll<HTMLElement>('[data-measure-tag]'))
  const tagWidths = tags.map((tag) => tag.offsetWidth)
  const expandWidth = expandEl?.offsetWidth ?? 120

  const fittedWithoutToggle = countFittingTags(tagWidths, containerWidth, COLLAPSED_ROWS, 0)
  if (fittedWithoutToggle >= tagWidths.length) {
    visibleCount.value = tagWidths.length
    measuring.value = false
    return
  }

  visibleCount.value = countFittingTags(tagWidths, containerWidth, COLLAPSED_ROWS, expandWidth)
  measuring.value = false
}

async function scheduleCalc(showMeasuring = false) {
  if (showMeasuring) measuring.value = true
  await nextTick()
  requestAnimationFrame(() => {
    calcVisibleCount()
  })
}

watch(
  () => props.baseModels,
  () => {
    expanded.value = false
    void scheduleCalc(true)
  },
)

onMounted(() => {
  void scheduleCalc(true)
  if (typeof ResizeObserver === 'undefined' || !rootRef.value) return
  resizeObserver = new ResizeObserver(() => {
    void scheduleCalc(false)
  })
  resizeObserver.observe(rootRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    v-if="baseModels.length > 0"
    ref="rootRef"
    class="models-base-tags-root"
  >
    <!-- Hidden measurer keeps natural tag widths for row-fit calculation -->
    <div
      ref="measureRef"
      class="models-base-tags models-base-tags--measure"
      aria-hidden="true"
    >
      <span
        v-for="item in baseModels"
        :key="`m-${item.slug}`"
        data-measure-tag
        class="models-base-tag"
      >
        <img
          v-if="item.icon_url"
          :src="item.icon_url"
          alt=""
          class="models-base-tag__icon"
        />
        <span class="models-base-tag__label">{{ baseModelLabel(item.slug) }}</span>
        <AppIcon name="arrow-right" class="models-base-tag__arrow" :size="16" />
      </span>
      <span ref="expandMeasureRef" class="models-base-tag models-base-tag--toggle">
        <span class="models-base-tag__label">
          {{ t('pages.models.expandAll', { count: baseModels.length }) }}
        </span>
        <AppIcon name="chevron-down" class="models-base-tag__chevron" :size="14" />
      </span>
    </div>

    <div
      class="models-base-tags"
      :class="{ 'is-measuring': measuring && !expanded }"
      role="list"
      :aria-label="t('pages.models.sidebar.baseModel')"
    >
      <button
        v-for="item in displayedModels"
        :key="item.slug"
        type="button"
        role="listitem"
        class="models-base-tag"
        :class="{ 'is-active': selectedBaseModel === item.slug }"
        :aria-pressed="selectedBaseModel === item.slug"
        @click="selectBaseModel(item.slug)"
      >
        <img
          v-if="item.icon_url"
          :src="item.icon_url"
          alt=""
          aria-hidden="true"
          class="models-base-tag__icon"
        />
        <span class="models-base-tag__label">{{ baseModelLabel(item.slug) }}</span>
        <AppIcon name="arrow-right" class="models-base-tag__arrow" :size="16" />
      </button>

      <button
        v-if="needsToggle && !measuring"
        type="button"
        class="models-base-tag models-base-tag--toggle"
        :aria-expanded="expanded"
        @click="toggleExpanded"
      >
        <span class="models-base-tag__label">
          {{
            expanded
              ? t('pages.models.collapseAll')
              : t('pages.models.expandAll', { count: baseModels.length })
          }}
        </span>
        <AppIcon
          name="chevron-down"
          class="models-base-tag__chevron"
          :class="{ 'is-expanded': expanded }"
          :size="14"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.models-base-tags-root {
  position: relative;
  width: 100%;
}

.models-base-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.models-base-tags.is-measuring {
  max-height: calc(32px * 2 + 12px);
  overflow: hidden;
}

.models-base-tags--measure {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
}

.models-base-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #ebf4fb;
  border-radius: 8px;
  background: transparent;
  color: #222;
  font-size: 13px;
  font-weight: 500;
  line-height: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.models-base-tag.is-active {
  background: rgba(6, 182, 212, 0.04);
  color: #06b6d4;
}

.models-base-tag:hover {
  border-color: #06b6d4;
}

.models-base-tag--toggle {
  color: #06b6d4;
}

.models-base-tag--toggle:hover {
  background: rgba(6, 182, 212, 0.04);
}

.models-base-tag__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 40px;
  object-fit: cover;
}

.models-base-tag__label {
  min-width: 0;
}

.models-base-tag__arrow {
  flex-shrink: 0;
  color: currentColor;
}

.models-base-tag__chevron {
  flex-shrink: 0;
  color: currentColor;
  transition: transform 0.2s ease;
}

.models-base-tag__chevron.is-expanded {
  transform: rotate(180deg);
}
</style>
