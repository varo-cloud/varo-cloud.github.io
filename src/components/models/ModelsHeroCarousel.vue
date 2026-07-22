<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { assetUrl } from '@/utils/assetUrl'

const SLIDE_DURATION_MS = 5000

const slides = [
  {
    poster: assetUrl('/assets/cover/2.jpg'),
    video: assetUrl('/assets/cover/2.mp4'),
  },
  {
    poster: assetUrl('/assets/cover/3.jpg'),
    video: assetUrl('/assets/cover/3.mp4'),
  },
  {
    poster: assetUrl('/assets/cover/4.jpg'),
    video: assetUrl('/assets/cover/4.mp4'),
  },
] as const

type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
}

const activeIndex = defineModel<number>('activeIndex', { default: 0 })
const progressKey = ref(0)
/** Only show the progress bar after the current slide is ready to display. */
const progressVisible = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
/** Mobile / save-data / slow network / reduced-motion: poster only, no video decode. */
const posterOnly = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
let loadToken = 0

function shouldPreferPosterOnly(): boolean {
  if (typeof window === 'undefined') return true

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  if (window.matchMedia('(max-width: 767px)').matches) return true

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  if (connection?.saveData) return true

  const effectiveType = connection?.effectiveType
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return true

  return false
}

function clearTimer() {
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
}

function startTimer() {
  clearTimer()
  timer = setTimeout(() => {
    activeIndex.value = (activeIndex.value + 1) % slides.length
  }, SLIDE_DURATION_MS)
}

function beginProgress() {
  progressVisible.value = true
  progressKey.value += 1
}

function releaseVideo(video: HTMLVideoElement) {
  video.pause()
  video.removeAttribute('src')
  // Detach buffered media data from the element.
  video.load()
}

const PLAYBACK_WAIT_MS = 12_000

/** Wait until the active video can play (or fail / time out), then resolve. */
function waitUntilPlayable(video: HTMLVideoElement, token: number): Promise<boolean> {
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA && !video.paused) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    let settled = false

    const settle = (ok: boolean) => {
      if (settled) return
      settled = true
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('playing', onReady)
      video.removeEventListener('error', onError)
      window.clearTimeout(timeoutId)
      resolve(ok && token === loadToken)
    }

    const onReady = () => settle(true)
    const onError = () => settle(false)
    const timeoutId = window.setTimeout(() => settle(false), PLAYBACK_WAIT_MS)

    video.addEventListener('canplay', onReady)
    video.addEventListener('playing', onReady)
    video.addEventListener('error', onError)

    // play() starts buffering beyond metadata-only preload.
    void video.play().then(
      () => {
        if (!video.paused) settle(true)
      },
      () => {
        // Autoplay may be blocked; keep waiting for canplay/timeout.
      },
    )
  })
}

async function activateSlide(index: number) {
  const token = ++loadToken
  clearTimer()
  progressVisible.value = false

  if (posterOnly.value) {
    beginProgress()
    startTimer()
    return
  }

  await nextTick()
  const video = videoRef.value
  if (!video || token !== loadToken) return

  releaseVideo(video)
  if (token !== loadToken) return

  video.poster = slides[index].poster
  video.preload = 'metadata'
  video.src = slides[index].video
  video.load()

  await waitUntilPlayable(video, token)
  if (token !== loadToken) return

  beginProgress()
  startTimer()
}

function goToSlide(index: number) {
  if (index === activeIndex.value) {
    void activateSlide(index)
    return
  }

  activeIndex.value = index
}

watch(activeIndex, (index) => {
  void activateSlide(index)
})

onMounted(() => {
  posterOnly.value = shouldPreferPosterOnly()
  void activateSlide(activeIndex.value)
})

onBeforeUnmount(() => {
  loadToken += 1
  clearTimer()
  const video = videoRef.value
  if (video) releaseVideo(video)
})
</script>

<template>
  <div class="hero-carousel" aria-hidden="true">
    <img
      v-if="posterOnly"
      class="hero-carousel__poster"
      :src="slides[activeIndex].poster"
      alt=""
    />
    <video
      v-else
      ref="videoRef"
      class="hero-carousel__video"
      :poster="slides[activeIndex].poster"
      muted
      loop
      playsinline
      preload="metadata"
    />
  </div>

  <div class="hero-carousel__nav-wrap">
    <div class="hero-carousel__nav" role="tablist" aria-label="Hero carousel">
      <button
        v-for="(slide, index) in slides"
        :key="slide.poster"
        type="button"
        role="tab"
        class="hero-carousel__thumb"
        :class="{ 'is-active': index === activeIndex }"
        :aria-selected="index === activeIndex"
        :aria-label="`Slide ${index + 1}`"
        @click="goToSlide(index)"
      >
        <span class="hero-carousel__thumb-image">
          <img :src="slide.poster" alt="" />
        </span>
        <span v-if="index === activeIndex && progressVisible" class="hero-carousel__progress">
          <span
            :key="progressKey"
            class="hero-carousel__progress-fill"
            :style="{ animationDuration: `${SLIDE_DURATION_MS}ms` }"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hero-carousel {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.hero-carousel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.hero-carousel__video,
.hero-carousel__poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

.hero-carousel__nav-wrap {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 16px 49px;
  pointer-events: none;
}

.hero-carousel__nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  pointer-events: none;
}

.hero-carousel__thumb {
  position: relative;
  flex-shrink: 0;
  width: 66px;
  height: 42px;
  padding: 1px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  cursor: pointer;
  opacity: 0.4;
  pointer-events: auto;
  transition: opacity 0.2s ease;
}

.hero-carousel__thumb.is-active {
  opacity: 1;
}

.hero-carousel__thumb-image {
  display: block;
  width: 64px;
  height: 40px;
  overflow: hidden;
}

.hero-carousel__thumb-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.hero-carousel__progress {
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.hero-carousel__progress-fill {
  display: block;
  width: 0;
  height: 100%;
  background: #fff;
  animation: hero-carousel-progress linear forwards;
}

@keyframes hero-carousel-progress {
  from {
    width: 0;
  }

  to {
    width: 100%;
  }
}

@media (min-width: 1024px) {
  .hero-carousel__nav-wrap {
    padding-inline: 24px;
  }
}

@media (max-width: 767px) {
  .hero-carousel__video,
  .hero-carousel__poster {
    object-position: center 35%;
  }

  .hero-carousel__nav-wrap {
    padding: 0 16px 16px;
  }

  .hero-carousel__nav {
    justify-content: center;
    gap: 8px;
  }

  .hero-carousel__thumb {
    width: 56px;
    height: 36px;
  }

  .hero-carousel__thumb-image {
    width: 54px;
    height: 34px;
  }
}
</style>
