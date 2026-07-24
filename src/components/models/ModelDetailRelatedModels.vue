<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchModels } from '@/api/models'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { assetUrl } from '@/utils/assetUrl'
import type { Model } from '@/types'

const RELATED_LIMIT = 10

const props = defineProps<{
  /** Current model slug, e.g. `seedance-2.0/text-to-video` */
  modelId: string
  /** Base model slug used for `/models?base_model=` */
  baseModelSlug: string
}>()

const { t } = useI18n()
const { push } = useLocaleRouter()

const relatedModels = ref<Model[]>([])

const visibleModels = computed(() =>
  relatedModels.value.filter((item) => item.id !== props.modelId),
)

function thumbnailSrc(model: Model): string {
  return assetUrl(model.thumbnailUrl ?? '/assets/models/card-thumb.jpg')
}

function goToModel(slug: string) {
  if (slug === props.modelId) return
  void push({ name: 'model-detail', params: { slug } })
}

async function loadRelatedModels(baseModelSlug: string, currentId: string) {
  if (!baseModelSlug) {
    relatedModels.value = []
    return
  }

  relatedModels.value = []
  try {
    const page = await fetchModels({
      base_model: baseModelSlug,
      offset: 0,
      limit: RELATED_LIMIT,
    })
    relatedModels.value = page.items.filter((item) => item.id !== currentId)
  } catch {
    relatedModels.value = []
  }
}

watch(
  () => [props.baseModelSlug, props.modelId] as const,
  ([baseModelSlug, modelId]) => {
    void loadRelatedModels(baseModelSlug, modelId)
  },
  { immediate: true },
)
</script>

<template>
  <section
    v-if="visibleModels.length > 0"
    class="related-models"
    aria-labelledby="related-models-heading"
  >
    <h2 id="related-models-heading" class="related-models__heading">
      {{ t('pages.modelDetail.relatedModels') }}
    </h2>

    <div class="related-models__list scrollbar-subtle">
      <button
        v-for="model in visibleModels"
        :key="model.id"
        type="button"
        class="related-models__card"
        @click="goToModel(model.id)"
      >
        <div class="related-models__thumb-wrap">
          <img
            class="related-models__thumb"
            :src="thumbnailSrc(model)"
            :alt="model.displayName"
            loading="lazy"
          />
        </div>
        <div class="related-models__glow" aria-hidden="true" />
        <div class="related-models__text">
          <span class="related-models__name">{{ model.displayName }}</span>
          <span class="related-models__slug">{{ model.id }}</span>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.related-models {
  max-width: 1360px;
  margin: 40px auto 0;
}

.related-models__heading {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
}

.related-models__list {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.related-models__card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 0 0 252px;
  width: 252px;
  height: 96px;
  padding: 8px;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #1a1f29;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.related-models__card:hover {
  border-color: rgba(6, 182, 212, 0.45);
  box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.15);
}

.related-models__thumb-wrap {
  position: relative;
  z-index: 1;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
}

.related-models__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-models__glow {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0) 70%);
  pointer-events: none;
  z-index: 0;
}

.related-models__text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding-top: 4px;
  padding-right: 4px;
}

.related-models__name {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-models__slug {
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
