<script setup lang="ts">
import { computed } from 'vue'
import { highlightCode, type CodeHighlightLanguage } from '@/utils/code-highlight'

const props = defineProps<{
  code: string
  language: CodeHighlightLanguage
}>()

const highlighted = computed(() => highlightCode(props.code, props.language))
</script>

<template>
  <pre class="highlighted-code-block scrollbar-subtle"><code class="hljs" v-html="highlighted" /></pre>
</template>

<style scoped>
.highlighted-code-block {
  width: 100%;
  min-height: 120px;
  max-height: 520px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border: 0.5px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.highlighted-code-block code {
  display: block;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: inherit;
  word-break: inherit;
}
</style>
