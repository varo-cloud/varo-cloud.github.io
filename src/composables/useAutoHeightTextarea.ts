import { nextTick, type Ref, ref, watch } from 'vue'

const DEFAULT_EMPTY_ROWS = 3

export function useAutoHeightTextarea(value: Ref<string>, emptyRows = DEFAULT_EMPTY_ROWS) {
  const textareaRef = ref<HTMLTextAreaElement | null>(null)

  function syncHeight() {
    const el = textareaRef.value
    if (!el) return

    el.style.height = 'auto'
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20
    const minRows = value.value.trim() ? 1 : emptyRows
    const minHeight = lineHeight * minRows
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`
  }

  watch(value, () => nextTick(syncHeight))

  return { textareaRef, syncHeight, emptyRows }
}
