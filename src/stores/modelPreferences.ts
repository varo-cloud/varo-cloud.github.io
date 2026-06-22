import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  addModelFavourite,
  fetchModelPreferences,
  recordModelVisit,
  removeModelFavourite,
} from '@/api/modelPreferences'
import type { ModelRecentEntry } from '@/types'
import { useUserStore } from './user'

export const useModelPreferencesStore = defineStore('modelPreferences', () => {
  const userStore = useUserStore()
  const favourites = ref<string[]>([])
  const recent = ref<ModelRecentEntry[]>([])
  const syncing = ref(false)

  const favouriteIds = computed(() => favourites.value)
  const recentIds = computed(() => recent.value.map((entry) => entry.id))

  function applyPreferences(prefs: { favourites: string[]; recent: ModelRecentEntry[] }) {
    favourites.value = prefs.favourites
    recent.value = prefs.recent
  }

  function clear() {
    favourites.value = []
    recent.value = []
  }

  async function syncFromApi() {
    if (!userStore.isLoggedIn) {
      clear()
      return
    }

    syncing.value = true
    try {
      const prefs = await fetchModelPreferences()
      applyPreferences(prefs)
    } catch {
      clear()
    } finally {
      syncing.value = false
    }
  }

  function isFavourite(modelId: string) {
    return favourites.value.includes(modelId)
  }

  async function toggleFavourite(modelId: string) {
    if (!userStore.isLoggedIn) return

    const wasFavourite = isFavourite(modelId)
    const previousFavourites = [...favourites.value]

    if (wasFavourite) {
      favourites.value = favourites.value.filter((id) => id !== modelId)
    } else {
      favourites.value = [...favourites.value, modelId]
    }

    try {
      const prefs = wasFavourite
        ? await removeModelFavourite(modelId)
        : await addModelFavourite(modelId)
      applyPreferences(prefs)
    } catch {
      favourites.value = previousFavourites
      throw new Error('Failed to update favourite')
    }
  }

  async function recordVisit(modelId: string) {
    if (!userStore.isLoggedIn) return

    const previousRecent = [...recent.value]
    const filtered = recent.value.filter((entry) => entry.id !== modelId)
    recent.value = [{ id: modelId, visitedAt: Date.now() }, ...filtered]

    try {
      const prefs = await recordModelVisit(modelId)
      applyPreferences(prefs)
    } catch {
      recent.value = previousRecent
    }
  }

  watch(
    () => userStore.isLoggedIn,
    (loggedIn) => {
      if (loggedIn) {
        syncFromApi()
      } else {
        clear()
      }
    },
    { immediate: true },
  )

  return {
    favourites,
    recent,
    favouriteIds,
    recentIds,
    syncing,
    isFavourite,
    toggleFavourite,
    recordVisit,
    syncFromApi,
  }
})
