<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useUserStore } from '@/stores/user'

const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    description?: string
    showLabel?: boolean
    invalid?: boolean
    errorMessage?: string
  }>(),
  { showLabel: true },
)

const { t } = useI18n()
const { push } = useLocaleRouter()
const userStore = useUserStore()

const fileInput = ref<HTMLInputElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)
const isDragging = ref(false)
const dragDepth = ref(0)
const isPlaying = ref(false)
const isMuted = ref(false)
const isRecording = ref(false)
const currentTime = ref(0)
const duration = ref(0)

let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

const { previewUrl, uploading, uploadError, applyFile, clearMedia, onUrlInput } = useMediaUpload({
  model,
  kind: 'audio',
  mimePrefix: 'audio/',
})

const hasAudio = computed(() => Boolean(previewUrl.value || model.value))

const dropHint = computed(() => {
  if (uploading.value) return t('pages.modelDetail.upload.uploading')
  if (isRecording.value) return t('pages.modelDetail.upload.recording')
  return 'Drag & drop or click to upload'
})

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, (currentTime.value / duration.value) * 100)
})

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function resolveAudioMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

function resolveFileExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

function cleanupStream() {
  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = null
}

function cleanupRecordingResources() {
  if (mediaRecorder) {
    mediaRecorder.onstop = null
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }
  mediaRecorder = null
  recordedChunks = []
  isRecording.value = false
  cleanupStream()
}

async function finalizeRecording() {
  const mimeType = mediaRecorder?.mimeType || 'audio/webm'
  const blob = new Blob(recordedChunks, { type: mimeType })
  recordedChunks = []
  mediaRecorder = null
  cleanupStream()

  if (!blob.size) return

  const file = new File([blob], `recording-${Date.now()}.${resolveFileExtension(mimeType)}`, {
    type: mimeType,
  })
  resetPlayback()
  await applyFile(file)
}

function stopRecording() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop()
  } else {
    cleanupRecordingResources()
    return
  }
  isRecording.value = false
}

async function toggleRecording() {
  if (uploading.value) return

  if (isRecording.value) {
    stopRecording()
    return
  }

  if (!userStore.isLoggedIn) {
    push({ name: 'auth' })
    return
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    uploadError.value = t('pages.modelDetail.upload.recordUnsupported')
    return
  }

  try {
    uploadError.value = null
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = resolveAudioMimeType()
    recordedChunks = []

    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      void finalizeRecording()
    }

    mediaRecorder.start()
    isRecording.value = true
  } catch {
    cleanupRecordingResources()
    uploadError.value = t('pages.modelDetail.upload.recordFailed')
  }
}

function openPicker() {
  if (uploading.value || isRecording.value) return
  fileInput.value?.click()
}

function resetPlayback() {
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
}

async function handleFile(file: File) {
  resetPlayback()
  await applyFile(file)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  void handleFile(file)
  input.value = ''
}

function onDragEnter() {
  dragDepth.value += 1
  isDragging.value = true
}

function onDragLeave() {
  dragDepth.value -= 1
  if (dragDepth.value <= 0) {
    dragDepth.value = 0
    isDragging.value = false
  }
}

function onDrop(event: DragEvent) {
  dragDepth.value = 0
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  void handleFile(file)
}

function clearAudio() {
  if (audioEl.value) {
    audioEl.value.pause()
  }
  cleanupRecordingResources()
  clearMedia()
  resetPlayback()
  if (fileInput.value) fileInput.value.value = ''
}

function onUrlInputWithReset() {
  resetPlayback()
  onUrlInput()
}

function onLoadedMetadata() {
  duration.value = audioEl.value?.duration ?? 0
}

function onTimeUpdate() {
  currentTime.value = audioEl.value?.currentTime ?? 0
}

async function togglePlay() {
  if (!audioEl.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
    return
  }
  try {
    await audioEl.value.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
  }
}

function toggleMute() {
  if (!audioEl.value) return
  isMuted.value = !isMuted.value
  audioEl.value.muted = isMuted.value
}

function onProgressClick(event: MouseEvent) {
  if (!audioEl.value || !duration.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  audioEl.value.currentTime = ratio * duration.value
  currentTime.value = audioEl.value.currentTime
}

onBeforeUnmount(() => {
  cleanupRecordingResources()
})
</script>

<template>
  <div class="audio-field" :class="{ 'audio-field--invalid': invalid }">
    <SchemaFieldLabel
      v-if="showLabel !== false && label"
      :label="label"
      :required="required"
      :description="description"
      :counter="model ? '1' : '0'"
      :invalid="invalid"
    />

    <div
      class="audio-field__box"
      :class="{
        'audio-field__box--dragging': isDragging,
        'audio-field__box--uploading': uploading,
        'audio-field__box--recording': isRecording,
        'audio-field__box--invalid': invalid,
      }"
      @dragenter.capture.prevent="onDragEnter"
      @dragleave.capture.prevent="onDragLeave"
      @dragover.capture.prevent
      @drop.capture.prevent="onDrop"
      @click.self="openPicker"
    >
      <div class="audio-field__url-row">
        <input
          v-model="model"
          type="text"
          class="audio-field__url"
          placeholder="https://static.wavespeed.ai/examples/5679"
          :disabled="uploading || isRecording"
          @input="onUrlInputWithReset"
          @click.stop
        />
        <button
          type="button"
          class="audio-field__icon-btn"
          aria-label="Upload audio"
          :disabled="uploading || isRecording"
          @click.stop="openPicker"
        >
          <AppIcon name="image-add-line" :size="20" />
        </button>
        <button
          type="button"
          class="audio-field__icon-btn"
          :class="{ 'audio-field__icon-btn--recording': isRecording }"
          :aria-label="isRecording ? t('pages.modelDetail.upload.stopRecording') : t('pages.modelDetail.upload.recordAudio')"
          :disabled="uploading"
          @click.stop="toggleRecording"
        >
          <AppIcon name="microphone" :size="20" />
        </button>
        <input ref="fileInput" type="file" accept="audio/*" hidden @change="onFileChange" />
      </div>

      <p class="audio-field__drop-hint">
        {{ dropHint }}
      </p>

      <p v-if="uploadError" class="audio-field__error">{{ uploadError }}</p>

      <div v-if="hasAudio" class="audio-field__player-row">
        <div class="audio-field__player">
          <audio
            ref="audioEl"
            :src="previewUrl || model"
            preload="metadata"
            @loadedmetadata="onLoadedMetadata"
            @timeupdate="onTimeUpdate"
            @ended="isPlaying = false"
          />

          <button type="button" class="audio-field__play" aria-label="Play audio" @click.stop="togglePlay">
            <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 3.5v9l8-4.5-8-4.5z" fill="currentColor" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z" fill="currentColor" />
            </svg>
          </button>

          <span class="audio-field__time">
            {{ formatTime(currentTime) }}/{{ formatTime(duration) }}
          </span>

          <div class="audio-field__progress" @click.stop="onProgressClick">
            <div class="audio-field__progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>

          <button
            type="button"
            class="audio-field__icon-btn audio-field__icon-btn--player"
            :aria-label="isMuted ? 'Unmute' : 'Mute'"
            @click.stop="toggleMute"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 6.5h2l2.5-2v9l-2.5-2H3v-5zm6.5 1a2.5 2.5 0 0 1 0 3M11 4.5a5 5 0 0 1 0 7"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <button type="button" class="audio-field__icon-btn audio-field__icon-btn--player" aria-label="More options" @click.stop>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="4" r="1.2" fill="currentColor" />
              <circle cx="8" cy="8" r="1.2" fill="currentColor" />
              <circle cx="8" cy="12" r="1.2" fill="currentColor" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="audio-field__clear"
          aria-label="Remove audio"
          :disabled="uploading || isRecording"
          @click.stop="clearAudio"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.audio-field__box {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: #0a0a0e;
  padding: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.audio-field__box--invalid {
  border: 1px solid #f87171;
}

.audio-field__box--dragging {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.04);
}

.audio-field__box--uploading {
  opacity: 0.75;
  cursor: wait;
}

.audio-field__box--recording {
  border-color: #f87171;
}

.audio-field__url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #21212a;
  border-radius: 8px;
  padding: 0 8px;
  height: 40px;
}

.audio-field__url {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #ebf4fb;
  outline: none;
  min-width: 0;
  line-height: 14px;
}

.audio-field__url:disabled {
  opacity: 0.6;
}

.audio-field__url::placeholder {
  opacity: 0.2;
  color: #fff;
}

.audio-field__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #ebf4fb;
  cursor: pointer;
  flex-shrink: 0;
}

.audio-field__icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.audio-field__icon-btn--recording {
  color: #f87171;
}

.audio-field__drop-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9b9dab;
  line-height: 14px;
}

.audio-field__error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #f87171;
  line-height: 14px;
}

.audio-field__player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.audio-field__player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.2);
}

.audio-field__play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.audio-field__time {
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
}

.audio-field__progress {
  flex: 1;
  height: 4px;
  min-width: 40px;
  border-radius: 4px;
  background: rgba(217, 217, 217, 0.2);
  cursor: pointer;
  overflow: hidden;
}

.audio-field__progress-fill {
  height: 100%;
  border-radius: 4px;
  background: #fff;
  transition: width 0.1s linear;
}

.audio-field__icon-btn--player {
  color: #fff;
}

.audio-field__clear {
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: #9b9dab;
  cursor: pointer;
  flex-shrink: 0;
}

.audio-field__clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
