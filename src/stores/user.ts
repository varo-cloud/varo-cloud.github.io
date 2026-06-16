import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearToken, getToken } from '@/api/http'
import { fetchUserProfile } from '@/api/auth'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => Boolean(getToken()))
  const balanceUsd = computed(() => profile.value?.balanceUsd ?? null)

  async function loadProfile() {
    if (!getToken()) {
      profile.value = null
      return
    }
    loading.value = true
    try {
      profile.value = await fetchUserProfile()
    } catch {
      profile.value = null
      clearToken()
    } finally {
      loading.value = false
    }
  }

  function setProfile(user: UserProfile) {
    profile.value = user
  }

  function logout() {
    clearToken()
    profile.value = null
  }

  return {
    profile,
    loading,
    isLoggedIn,
    balanceUsd,
    loadProfile,
    setProfile,
    logout,
  }
})
