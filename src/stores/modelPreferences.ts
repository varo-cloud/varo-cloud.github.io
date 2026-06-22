import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useUserStore } from './user'

const MAX_RECENT = 50
const STORAGE_PREFIX = 'model-preferences'

interface RecentEntry {
  id: string
  visitedAt: number
}

interface ModelPreferencesData {
  favourites: string[]
  recent: RecentEntry[]
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

function loadPreferences(userId: string): ModelPreferencesData {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { favourites: [], recent: [] }
    return JSON.parse(raw) as ModelPreferencesData
  } catch {
    return { favourites: [], recent: [] }
  }
}

function savePreferences(userId: string, prefs: ModelPreferencesData) {
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs))
}

export const useModelPreferencesStore = defineStore('modelPreferences', () => {
  const userStore = useUserStore()
  const favourites = ref<string[]>([])
  const recent = ref<RecentEntry[]>([])

  const favouriteIds = computed(() => favourites.value)
  const recentIds = computed(() => recent.value.map((entry) => entry.id))

  function syncFromStorage(userId: string) {
    const prefs = loadPreferences(userId)
    favourites.value = prefs.favourites
    recent.value = prefs.recent
  }

  function clear() {
    favourites.value = []
    recent.value = []
  }

  function persist() {
    const userId = userStore.profile?.id
    if (!userId) return
    savePreferences(userId, {
      favourites: favourites.value,
      recent: recent.value,
    })
  }

  function isFavourite(modelId: string) {
    return favourites.value.includes(modelId)
  }

  function toggleFavourite(modelId: string) {
    if (!userStore.profile?.id) return
    if (isFavourite(modelId)) {
      favourites.value = favourites.value.filter((id) => id !== modelId)
    } else {
      favourites.value = [...favourites.value, modelId]
    }
    persist()
  }

  function recordVisit(modelId: string) {
    if (!userStore.profile?.id) return
    const filtered = recent.value.filter((entry) => entry.id !== modelId)
    recent.value = [{ id: modelId, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
    persist()
  }

  watch(
    () => userStore.profile?.id,
    (userId) => {
      if (userId) {
        syncFromStorage(userId)
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
    isFavourite,
    toggleFavourite,
    recordVisit,
  }
})
