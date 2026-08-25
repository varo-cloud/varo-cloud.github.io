import { nextTick, type Ref, ref, watch } from 'vue'

const DEFAULT_EMPTY_ROWS = 3
/** 自动增高上限，超出后内部滚动 */
const DEFAULT_MAX_ROWS = 12

export function useAutoHeightTextarea(
  value: Ref<string>,
  emptyRows = DEFAULT_EMPTY_ROWS,
  maxRows = DEFAULT_MAX_ROWS,
) {
  const textareaRef = ref<HTMLTextAreaElement | null>(null)

  function syncHeight() {
    const el = textareaRef.value
    if (!el) return

    el.style.height = 'auto'
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20
    const minRows = value.value.trim() ? 1 : emptyRows
    const minHeight = lineHeight * minRows
    const maxHeight = lineHeight * maxRows
    const contentHeight = el.scrollHeight
    const nextHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight)
    el.style.height = `${nextHeight}px`
    el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'
  }

  watch(value, () => nextTick(syncHeight))

  return { textareaRef, syncHeight, emptyRows }
}
