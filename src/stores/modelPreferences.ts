import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  addModelFavourite,
  recordModelVisit,
  removeModelFavourite,
} from '@/api/modelPreferences'
import type { ModelRecentEntry } from '@/types'
import { useUserStore } from './user'

export const useModelPreferencesStore = defineStore('modelPreferences', () => {
  const userStore = useUserStore()
  const recent = ref<ModelRecentEntry[]>([])

  const recentIds = computed(() => recent.value.map((entry) => entry.id))

  function applyRecent(nextRecent: ModelRecentEntry[]) {
    recent.value = nextRecent
  }

  function clear() {
    recent.value = []
  }

  async function toggleFavourite(modelId: string, wasFavourite: boolean) {
    if (!userStore.isLoggedIn) return

    if (wasFavourite) {
      await removeModelFavourite(modelId)
    } else {
      await addModelFavourite(modelId)
    }
  }

  async function recordVisit(modelId: string) {
    if (!userStore.isLoggedIn) return

    const previousRecent = [...recent.value]
    const filtered = recent.value.filter((entry) => entry.id !== modelId)
    recent.value = [{ id: modelId, visitedAt: Date.now() }, ...filtered]

    try {
      const prefs = await recordModelVisit(modelId)
      applyRecent(prefs.recent)
    } catch {
      recent.value = previousRecent
    }
  }

  watch(
    () => userStore.isLoggedIn,
    (loggedIn) => {
      if (!loggedIn) {
        clear()
      }
    },
  )

  return {
    recent,
    recentIds,
    toggleFavourite,
    recordVisit,
  }
})
