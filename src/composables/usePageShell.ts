import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

/** Runtime overrides — Vue Router meta is not deeply reactive when mutated. */
const transparentHeaderOverride = ref<boolean | null>(null)
const lightPageOverride = ref<boolean | null>(null)

export function usePageShell() {
  const route = useRoute()

  const transparentHeader = computed(() => {
    if (transparentHeaderOverride.value !== null) return transparentHeaderOverride.value
    return route.meta.transparentHeader === true
  })

  const lightPage = computed(() => {
    if (lightPageOverride.value !== null) return lightPageOverride.value
    return route.meta.lightPage === true
  })

  function setPageShell(options: { transparentHeader?: boolean; lightPage?: boolean }) {
    if (options.transparentHeader !== undefined) {
      transparentHeaderOverride.value = options.transparentHeader
    }
    if (options.lightPage !== undefined) {
      lightPageOverride.value = options.lightPage
    }
  }

  function clearPageShell() {
    transparentHeaderOverride.value = null
    lightPageOverride.value = null
  }

  return {
    transparentHeader,
    lightPage,
    setPageShell,
    clearPageShell,
  }
}
