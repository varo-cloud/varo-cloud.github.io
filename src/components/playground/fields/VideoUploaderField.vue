<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import GenerationPreviewLightbox from '../GenerationPreviewLightbox.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useMediaUpload } from '@/composables/useMediaUpload'

const model = defineModel<string>({ required: true })

defineProps<{
  label?: string
  required?: boolean
  description?: string
  showLabel?: boolean
  invalid?: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const dragDepth = ref(0)
const showLightbox = ref(false)

const { previewUrl, uploading, uploadError, applyFile, clearMedia, onUrlInput } = useMediaUpload({
  model,
  kind: 'video',
  mimePrefix: 'video/',
})

const videoSrc = computed(() => previewUrl.value || model.value)

function openPreview() {
  if (!videoSrc.value) return
  showLightbox.value = true
}

function closePreview() {
  showLightbox.value = false
}

function openPicker() {
  if (uploading.value) return
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  void applyFile(file)
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
  void applyFile(file)
}

function clearVideo() {
  clearMedia()
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="video-field" :class="{ 'video-field--invalid': invalid }">
    <SchemaFieldLabel
      v-if="showLabel !== false && label"
      :label="label"
      :required="required"
      :description="description"
      :counter="model ? '1' : '0'"
      :invalid="invalid"
    />

    <div
      class="video-field__box"
      :class="{
        'video-field__box--dragging': isDragging,
        'video-field__box--uploading': uploading,
        'video-field__box--invalid': invalid,
      }"
      @dragenter.capture.prevent="onDragEnter"
      @dragleave.capture.prevent="onDragLeave"
      @dragover.capture.prevent
      @drop.capture.prevent="onDrop"
      @click.self="openPicker"
    >
      <div class="video-field__url-row">
        <input
          v-model="model"
          type="text"
          class="video-field__url"
          placeholder="https://static.wavespeed.ai/examples/567920"
          :disabled="uploading"
          @input="onUrlInput"
          @click.stop
        />
        <button
          type="button"
          class="video-field__upload-btn"
          aria-label="Upload video"
          :disabled="uploading"
          @click.stop="openPicker"
        >
          <AppIcon name="image-add-line" :size="20" />
        </button>
        <input ref="fileInput" type="file" accept="video/*" hidden @change="onFileChange" />
      </div>

      <p class="video-field__drop-hint">
        {{ uploading ? $t('pages.modelDetail.upload.uploading') : 'Drag & drop or click to upload' }}
      </p>

      <p v-if="uploadError" class="video-field__error">{{ uploadError }}</p>

      <div v-if="videoSrc" class="video-field__preview-row">
        <button
          type="button"
          class="video-field__preview-wrap"
          :aria-label="t('pages.modelDetail.viewFullscreen')"
          @click.stop="openPreview"
        >
          <video
            :src="videoSrc"
            class="video-field__preview"
            muted
            playsinline
            preload="metadata"
          />
          <span class="video-field__preview-overlay" aria-hidden="true">
            <span class="video-field__preview-play">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3.5v9l8-4.5-8-4.5z" fill="currentColor" />
              </svg>
            </span>
          </span>
        </button>
        <button
          type="button"
          class="video-field__clear"
          aria-label="Remove video"
          :disabled="uploading"
          @click.stop="clearVideo"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />

    <GenerationPreviewLightbox
      v-if="showLightbox && videoSrc"
      :urls="[videoSrc]"
      @close="closePreview"
    />
  </div>
</template>

<style scoped>
.video-field__box {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: #0a0a0e;
  padding: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.video-field__box--invalid {
  border: 1px solid #f87171;
}

.video-field__box--dragging {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.04);
}

.video-field__box--uploading {
  opacity: 0.75;
  cursor: wait;
}

.video-field__url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #21212a;
  border-radius: 8px;
  padding: 0 8px;
  height: 40px;
}

.video-field__url {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #ebf4fb;
  outline: none;
  min-width: 0;
  line-height: 14px;
}

.video-field__url:disabled {
  opacity: 0.6;
}

.video-field__url::placeholder {
  opacity: 0.2;
  color: #fff;
}

.video-field__upload-btn {
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

.video-field__upload-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.video-field__drop-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9b9dab;
  line-height: 14px;
}

.video-field__error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #f87171;
  line-height: 14px;
}

.video-field__preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.video-field__preview-wrap {
  position: relative;
  width: 100px;
  height: 65px;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  background: #21212a;
  padding: 0;
  cursor: pointer;
}

.video-field__preview-wrap:hover .video-field__preview-overlay,
.video-field__preview-wrap:focus-visible .video-field__preview-overlay {
  background: rgba(0, 0, 0, 0.45);
}

.video-field__preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.video-field__preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
  transition: background 0.15s ease;
}

.video-field__preview-play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #0a0a0e;
}

.video-field__clear {
  display: inline-flex;
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  color: #9b9dab;
  cursor: pointer;
}

.video-field__clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
