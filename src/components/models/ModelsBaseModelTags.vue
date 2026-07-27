<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/common/AppIcon.vue'
import type { BaseModelFacetItem } from '@/types'

const props = defineProps<{
  baseModels: BaseModelFacetItem[]
  selectedBaseModel: string | null
}>()

const emit = defineEmits<{
  'update:selectedBaseModel': [value: string | null]
}>()

const { t, te } = useI18n()

function baseModelLabel(slug: string) {
  const key = `pages.models.series.${slug}`
  return te(key) ? t(key) : slug
}

function selectBaseModel(slug: string) {
  emit('update:selectedBaseModel', props.selectedBaseModel === slug ? null : slug)
}
</script>

<template>
  <div
    v-if="baseModels.length > 0"
    class="models-base-tags"
    role="list"
    :aria-label="t('pages.models.sidebar.baseModel')"
  >
    <button
      v-for="item in baseModels"
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
  </div>
</template>

<style scoped>
.models-base-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
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
</style>
