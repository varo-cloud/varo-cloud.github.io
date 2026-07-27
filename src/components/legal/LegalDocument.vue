<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import '@/styles/legal-document.css'

const props = defineProps<{
  content: string
}>()

const renderer = new marked.Renderer()

renderer.link = ({ href, title, text }) => {
  const safeHref = href ?? '#'
  const isExternal =
    safeHref.startsWith('http') ||
    safeHref.startsWith('mailto:') ||
    safeHref.startsWith('//')
  const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
  const titleAttr = title ? ` title="${title}"` : ''
  const classAttr = safeHref.startsWith('http') ? ' class="url"' : ''
  return `<a href="${safeHref}"${classAttr}${titleAttr}${target}>${text}</a>`
}

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
})

const html = computed(() => {
  if (!props.content.trim()) return ''
  return marked.parse(props.content) as string
})
</script>

<template>
  <article class="legal-document">
    <div v-if="html" class="legal-document__write" v-html="html" />
  </article>
</template>
