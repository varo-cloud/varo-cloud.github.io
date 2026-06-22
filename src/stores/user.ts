import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearToken, getToken, setToken } from '@/api/http'
import { fetchUserProfile } from '@/api/auth'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => Boolean(token.value))
  const balanceUsd = computed(() => profile.value?.balanceUsd ?? null)

  function establishSession(authToken: string, user: UserProfile) {
    token.value = authToken
    setToken(authToken)
    profile.value = user
  }

  async function loadProfile() {
    if (!token.value) {
      profile.value = null
      return
    }
    loading.value = true
    try {
      profile.value = await fetchUserProfile()
    } catch {
      profile.value = null
      token.value = null
      clearToken()
    } finally {
      loading.value = false
    }
  }

  function setProfile(user: UserProfile) {
    profile.value = user
  }

  function logout() {
    token.value = null
    clearToken()
    profile.value = null
  }

  return {
    token,
    profile,
    loading,
    isLoggedIn,
    balanceUsd,
    establishSession,
    loadProfile,
    setProfile,
    logout,
  }
})
