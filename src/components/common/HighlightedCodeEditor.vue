<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { highlightCode, type CodeHighlightLanguage } from '@/utils/code-highlight'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    language?: CodeHighlightLanguage
    invalid?: boolean
    emptyRows?: number
  }>(),
  {
    language: 'json',
    invalid: false,
    emptyRows: 3,
  },
)

const emit = defineEmits<{
  input: []
}>()

const preRef = ref<HTMLPreElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const highlighted = computed(() => highlightCode(model.value, props.language))

function syncEditorHeight() {
  const textarea = textareaRef.value
  const pre = preRef.value
  if (!textarea) return

  textarea.style.height = 'auto'
  const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 21
  const minRows = model.value.trim() ? 1 : props.emptyRows
  const minHeight = lineHeight * minRows
  const height = Math.max(textarea.scrollHeight, minHeight)

  textarea.style.height = `${height}px`
  if (pre) pre.style.height = `${height}px`
}

function onInput() {
  emit('input')
  syncEditorHeight()
}

watch(model, () => nextTick(syncEditorHeight))
watch(highlighted, () => nextTick(syncEditorHeight))
onMounted(() => nextTick(syncEditorHeight))

defineExpose({ syncHeight: syncEditorHeight })
</script>

<template>
  <div class="highlighted-code-editor" :class="{ 'highlighted-code-editor--invalid': invalid }">
    <div class="highlighted-code-editor__wrap">
      <!-- Keep <pre> content on one line — whitespace text nodes cause a leading blank line. -->
      <pre ref="preRef" class="highlighted-code-editor__highlight" aria-hidden="true"><code class="hljs" v-html="highlighted"></code></pre>
      <textarea
        ref="textareaRef"
        v-model="model"
        class="highlighted-code-editor__input"
        spellcheck="false"
        :aria-invalid="invalid || undefined"
        @input="onInput"
      />
    </div>
  </div>
</template>

<style scoped>
.highlighted-code-editor__wrap {
  position: relative;
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid transparent;
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.highlighted-code-editor--invalid .highlighted-code-editor__wrap {
  border-color: #f87171;
}

.highlighted-code-editor__highlight,
.highlighted-code-editor__input {
  box-sizing: border-box;
  grid-area: 1 / 1;
  width: 100%;
  margin: 0;
  padding: 12px;
  border: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  overflow: hidden;
}

.highlighted-code-editor__wrap {
  display: grid;
}

.highlighted-code-editor__highlight {
  pointer-events: none;
  background: transparent;
}

.highlighted-code-editor__highlight code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: inherit;
  tab-size: inherit;
}

.highlighted-code-editor__input {
  resize: none;
  color: transparent;
  -webkit-text-fill-color: transparent;
  background: transparent;
  caret-color: #ebf4fb;
  outline: none;
}

.highlighted-code-editor__input::selection {
  background: rgba(6, 182, 212, 0.35);
  color: transparent;
}
</style>
