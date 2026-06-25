import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'

export type CodeHighlightLanguage = 'json' | 'python' | 'javascript' | 'http'

hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)

const HIGHLIGHT_LANGUAGE_MAP: Record<CodeHighlightLanguage, string> = {
  json: 'json',
  python: 'python',
  javascript: 'javascript',
  http: 'bash',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function highlightCode(code: string, language: CodeHighlightLanguage): string {
  if (!code) return ''

  try {
    const languageId = HIGHLIGHT_LANGUAGE_MAP[language]
    return hljs.highlight(code, { language: languageId, ignoreIllegals: true }).value
  } catch {
    return escapeHtml(code)
  }
}
