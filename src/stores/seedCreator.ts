import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSeedCreatorOverview } from '@/api/activity'
import { isApiError } from '@/api/http'
import { useUserStore } from '@/stores/user'

/**
 * Tracks whether the logged-in user is a Seed Creator (`me` present and
 * `me.invite` null). Invitees also get a `me` object with `invite` set, and
 * should not see the Seed Creator avatar-menu entry.
 */
export const useSeedCreatorStore = defineStore('seedCreator', () => {
  const participated = ref(false)
  let refreshPromise: Promise<void> | null = null

  function markParticipated() {
    participated.value = true
  }

  function reset() {
    participated.value = false
    refreshPromise = null
  }

  async function refresh() {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      reset()
      return
    }

    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const data = await fetchSeedCreatorOverview()
        participated.value = data.me != null && data.me.invite == null
      } catch (err) {
        if (isApiError(err) && err.code === 404) {
          participated.value = false
          return
        }
        // Keep last known value on transient errors
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  return {
    participated,
    markParticipated,
    reset,
    refresh,
  }
})
