<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import type { Model } from '@/types'

const props = defineProps<{
  model: Model
}>()

const { push } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()
const isFavourite = ref(props.model.isFavourited)

watch(
  () => props.model.isFavourited,
  (value) => {
    isFavourite.value = value
  },
)

const thumb = computed(() => assetUrl(props.model.thumbnailUrl ?? '/assets/models/card-thumb.jpg'))
const logo = computed(() => {
  const url = props.model.publisherLogoUrl?.trim()
  return url ? assetUrl(url) : null
})

function goDetail() {
  if (userStore.isLoggedIn) {
    modelPrefs.recordVisit(props.model.id)
  }
  push({ name: 'model-detail', params: { slug: props.model.id } })
}

async function toggleFavourite(event: Event) {
  event.stopPropagation()
  if (!userStore.isLoggedIn) {
    push({ name: 'auth' })
    return
  }
  const was = isFavourite.value
  isFavourite.value = !was
  try {
    await modelPrefs.toggleFavourite(props.model.id, was)
  } catch {
    isFavourite.value = was
  }
}
</script>

<template>
  <article class="home-featured-card" @click="goDetail">
    <img class="home-featured-card__img" :src="thumb" :alt="model.displayName" />
    <button
      type="button"
      class="home-featured-card__fav"
      :class="{ 'is-active': isFavourite }"
      :aria-label="t('pages.models.favourite')"
      :aria-pressed="isFavourite"
      @click="toggleFavourite"
    >
      <svg
        class="home-featured-card__heart"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          v-if="isFavourite"
          d="M10 17.1138L16.359 10.7448C17.937 8.97775 17.8787 6.26875 16.1822 4.56775C14.485 2.8675 11.7625 2.815 10 4.39675C8.23375 2.81275 5.5165 2.86975 3.81775 4.56775C2.122 6.26425 2.06275 8.97775 3.64075 10.7448L10 17.1138Z"
          fill="currentColor"
        />
        <path
          v-else
          d="M10.0007 4.39675C11.7625 2.815 14.485 2.8675 16.1822 4.56775C17.8787 6.26875 17.9372 8.97775 16.3592 10.7448L9.99925 17.1138L3.64075 10.7448C2.06275 8.97775 2.122 6.26425 3.81775 4.56775C5.5165 2.86975 8.23375 2.81275 10.0007 4.39675V4.39675ZM15.1202 5.6275C13.9952 4.501 12.1802 4.45525 11.0027 5.51275L10.0015 6.41125L8.9995 5.5135C7.81825 4.4545 6.007 4.501 4.879 5.629C3.7615 6.7465 3.70525 8.53525 4.735 9.71725L10 14.9905L15.265 9.718C16.2955 8.53525 16.2392 6.74875 15.1202 5.6275V5.6275Z"
          fill="currentColor"
        />
      </svg>
    </button>
    <div class="home-featured-card__body">
      <div class="home-featured-card__title-row">
        <p class="home-featured-card__name">{{ model.displayName }}</p>
        <img v-if="logo" class="home-featured-card__logo" :src="logo" alt="" />
      </div>
      <p class="home-featured-card__desc">{{ model.description }}</p>
    </div>
  </article>
</template>

<style scoped>
.home-featured-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  aspect-ratio: 322 / 341;
  background: #111;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.home-featured-card:hover {
  transform: translateY(-2px);
}

.home-featured-card:hover .home-featured-card__img {
  transform: scale(1.04);
}

.home-featured-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.home-featured-card__fav {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;
}

.home-featured-card__fav:hover {
  background: rgba(0, 0, 0, 0.6);
}

.home-featured-card__fav.is-active {
  color: #ff5a7a;
}

.home-featured-card__heart {
  display: block;
}

.home-featured-card__body {
  position: absolute;
  inset: auto 0 0;
  padding: 16px 12px 14px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  color: #fff;
}

.home-featured-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
}

.home-featured-card__name {
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  min-height: 32px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-featured-card__logo {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 0;
  border-radius: 50%;
  object-fit: cover;
}

.home-featured-card__desc {
  display: -webkit-box;
  margin: 10px 0 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 16px;
  min-height: 32px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (max-width: 640px) {
  .home-featured-card {
    aspect-ratio: 3 / 4;
    border-radius: 12px;
  }

  .home-featured-card__fav {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
  }

  .home-featured-card__heart {
    width: 16px;
    height: 16px;
  }

  .home-featured-card__body {
    padding: 12px 10px 10px;
  }

  .home-featured-card__name {
    font-size: 13px;
    line-height: 15px;
    min-height: 30px;
  }

  .home-featured-card__desc {
    margin-top: 6px;
    font-size: 11px;
    line-height: 14px;
    min-height: 28px;
  }
}
</style>
