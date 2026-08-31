<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/utils/assetUrl'

const ICONS = {
  globe: '/assets/icons/globe.svg',
  wallet: '/assets/icons/wallet.svg',
  deposit: '/assets/icons/deposit.svg',
  'chevron-down': '/assets/icons/chevron-down.svg',
  search: '/assets/icons/search.svg',
  close: '/assets/icons/close.svg',
  'close-line': '/assets/icons/close-line.svg',
  key: '/assets/icons/key.svg',
  add: '/assets/icons/add.svg',
  'add-line': '/assets/icons/add-line.svg',
  'arrow-right': '/assets/icons/arrow-right.svg',
  brush: '/assets/icons/brush.svg',
  check: '/assets/icons/check.svg',
  'code-http': '/assets/icons/code-http.svg',
  'code-python': '/assets/icons/code-python.svg',
  'code-javascript': '/assets/icons/code-javascript.svg',
  'image-add-line': '/assets/icons/image-add-line.svg',
  'file-history-line': '/assets/icons/file-history-line.svg',
  microphone: '/assets/icons/microphone.svg',
  delete: '/assets/icons/delete.svg',
  edit: '/assets/icons/edit.svg',
  copy: '/assets/icons/copy.svg',
  'code-box': '/assets/icons/code-box.svg',
  'file-paper': '/assets/icons/file-paper.svg',
  logout: '/assets/icons/logout.svg',
  discord: '/assets/icons/discord.svg',
  email: '/assets/icons/email.svg',
  x: '/assets/icons/x.svg',
  youtube: '/assets/icons/youtube.svg',
  linkedin: '/assets/icons/linedin.svg',
  reddit: '/assets/icons/reddit.svg',
  'check-circle': '/assets/icons/check-circle.svg',
  'toast-success': '/assets/icons/toast-success.svg',
  'toast-error': '/assets/icons/toast-error.svg',
  'toast-warning': '/assets/icons/toast-warning.svg',
  'toast-info': '/assets/icons/toast-info.svg',
  'waveform-active': '/assets/icons/waveform-active.svg',
  'mod-text-on': '/assets/icons/mod-text-on.svg',
  'mod-image-on': '/assets/icons/mod-image-on.svg',
  'mod-video-on': '/assets/icons/mod-video-on.svg',
  'mod-audio-on': '/assets/icons/mod-audio-on.svg',
  hd: '/assets/icons/hd.svg',
  'stack-fill': '/assets/icons/stack-fill.svg',
  'gift-fill': '/assets/icons/gift-fill.svg',
  'message-3-fill': '/assets/icons/message-3-fill.svg',
  'thumb-up-fill': '/assets/icons/thumb-up-fill.svg',
  'star-smile-fill': '/assets/icons/star-smile-fill.svg',
  'team-fill': '/assets/icons/team-fill.svg',
  '15s': '/assets/icons/15s.svg',
  twitter: '/assets/footer/twitter.svg',
  telegram: '/assets/footer/telegram.svg',
} as const

export type AppIconName = keyof typeof ICONS

const props = withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
    /** Override width; falls back to `size`. */
    width?: number
    /** Override height; falls back to `size`. */
    height?: number
    /** Icon color. Defaults to currentColor from parent CSS. */
    color?: string
    /** 保留 SVG 原始配色（用于 Toast 等多色图标） */
    colored?: boolean
  }>(),
  {
    size: 16,
    width: undefined,
    height: undefined,
    color: undefined,
    colored: false,
  },
)

const iconUrl = computed(() => assetUrl(ICONS[props.name]))

const iconWidth = computed(() => props.width ?? props.size)
const iconHeight = computed(() => props.height ?? props.size)

const iconStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${iconWidth.value}px`,
    height: `${iconHeight.value}px`,
    WebkitMaskImage: `url(${iconUrl.value})`,
    maskImage: `url(${iconUrl.value})`,
  }
  if (props.color) {
    style.color = props.color
    style.backgroundColor = props.color
  }
  return style
})
</script>

<template>
  <img
    v-if="colored"
    class="app-icon app-icon--colored"
    :src="iconUrl"
    :width="iconWidth"
    :height="iconHeight"
    alt=""
    aria-hidden="true"
  />
  <span
    v-else
    class="app-icon"
    :style="iconStyle"
    aria-hidden="true"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  background-color: currentColor;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

.app-icon--colored {
  display: block;
  background-color: transparent;
}
</style>
