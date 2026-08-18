import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMyInvitation } from '@/api/activity'
import { fetchWalletBonus } from '@/api/billing'
import { isApiError } from '@/api/http'
import { useUserStore } from '@/stores/user'

/**
 * Gates the avatar-menu "Friend invite" entry. Shown only when this user
 * is bound as an invitee (or already has an invitee_reward grant).
 */
export const useInviteeStore = defineStore('invitee', () => {
  const invited = ref(false)
  let refreshPromise: Promise<void> | null = null

  function markInvited() {
    invited.value = true
  }

  function reset() {
    invited.value = false
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
        const invitation = await fetchMyInvitation()
        if (invitation) {
          invited.value = true
          return
        }

        const wallet = await fetchWalletBonus()
        invited.value = wallet.grants.some((item) => item.source === 'invitee_reward')
      } catch (err) {
        if (isApiError(err) && (err.code === 404 || err.code === 400)) {
          invited.value = false
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
    invited,
    markInvited,
    reset,
    refresh,
  }
})
