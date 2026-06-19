import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LocaleType } from '@/i18n'
import { getStoredLocale, setStoredLocale } from '@/i18n'
import i18n from '@/i18n'

export const useAppStore = defineStore('app', () => {
  const locale = ref<LocaleType>(getStoredLocale())

  function setLocale(next: LocaleType) {
    locale.value = next
    setStoredLocale(next)
    i18n.global.locale.value = next
  }

  return {
    locale,
    setLocale,
  }
})
