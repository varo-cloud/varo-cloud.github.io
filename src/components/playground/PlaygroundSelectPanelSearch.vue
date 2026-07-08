<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'

const model = defineModel<string>({ required: true })

const { t } = useI18n()
const inputRef = ref<HTMLInputElement | null>(null)

function focus() {
  nextTick(() => inputRef.value?.focus())
}

defineExpose({ focus })
</script>

<template>
  <label class="playground-select-panel__search" @click.stop @pointerdown.stop>
    <img :src="assetUrl('/assets/models/search.svg')" alt="" aria-hidden="true" />
    <input
      ref="inputRef"
      v-model="model"
      type="search"
      :placeholder="t('pages.models.searchPlaceholder')"
      autocomplete="off"
      @keydown.stop
    />
  </label>
</template>
