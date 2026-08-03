<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  darkTheme,
  enUS,
  NButton,
  NConfigProvider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpin,
  NTabPane,
  NTabs,
  zhCN,
  type GlobalThemeOverrides,
} from 'naive-ui'
import {
  fetchAdminBaseModel,
  fetchAdminOfferings,
  offeringExamplesToPayload,
  updateAdminOffering,
  type AdminOffering,
} from '@/api/adminOfferings'
import { useAppMessage } from '@/composables/useAppMessage'
import {
  CONTENT_LOCALES,
  exampleFormFromGeneration,
  formToExample,
  parseOfferingModelId,
  suggestExampleId,
  upsertExample,
  validateExampleForm,
  type ContentLocale,
  type OfferingExampleForm,
} from '@/utils/offeringExamples'

const props = defineProps<{
  show: boolean
  model: string
  taskId: string
  input: Record<string, unknown>
  outputUrl: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: []
}>()

const { t, locale } = useI18n()
const message = useAppMessage()

const loading = ref(false)
const saving = ref(false)
const exampleLocale = ref<ContentLocale>('en-US')
const offering = ref<AdminOffering | null>(null)
const form = ref<OfferingExampleForm | null>(null)

const naiveLocale = computed(() => (locale.value === 'zh-CN' ? zhCN : enUS))

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#06b6d4',
    primaryColorHover: '#22d3ee',
    primaryColorPressed: '#0891b2',
    primaryColorSuppl: '#0891b2',
  },
}

function validationMessage(code: string, id?: string): string {
  const key = `pages.modelDetail.history.setExample.validation.${code}`
  return id ? t(key, { id }) : t(key)
}

async function loadOffering() {
  const parsed = parseOfferingModelId(props.model)
  if (!parsed) {
    message.error(t('pages.modelDetail.history.setExample.invalidModel'))
    emit('update:show', false)
    return
  }

  loading.value = true
  offering.value = null
  form.value = null
  try {
    const baseModel = await fetchAdminBaseModel(parsed.slug)
    const offerings = await fetchAdminOfferings(baseModel.seqId)
    const match = offerings.find((o) => o.capability === parsed.capability)
    if (!match) {
      message.error(t('pages.modelDetail.history.setExample.offeringNotFound', { model: props.model }))
      emit('update:show', false)
      return
    }
    offering.value = match
    const suggestedId = suggestExampleId(props.input, props.taskId)
    const existing = match.examples.find((e) => e.id === suggestedId)
    form.value = exampleFormFromGeneration(
      props.input,
      props.outputUrl,
      props.taskId,
      existing?.sortOrder ?? match.examples.length,
    )
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : t('pages.modelDetail.history.setExample.loadError'),
    )
    emit('update:show', false)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      exampleLocale.value = 'en-US'
      void loadOffering()
    }
  },
)

function formatInputJson() {
  if (!form.value) return
  try {
    const parsed = JSON.parse(form.value.inputJson || '{}')
    form.value.inputJson = JSON.stringify(parsed, null, 2)
  } catch {
    message.error(t('pages.modelDetail.history.setExample.validation.invalidInputJson'))
  }
}

async function save() {
  if (!offering.value || !form.value) return
  const id = form.value.id.trim()
  const replacing = offering.value.examples.some((e) => e.id === id)
  const err = validateExampleForm(
    form.value,
    offering.value.examples.map((e) => e.id),
    replacing ? id : undefined,
  )
  if (err) {
    message.warning(validationMessage(err, id))
    return
  }

  let example
  try {
    example = formToExample(form.value)
  } catch {
    message.error(t('pages.modelDetail.history.setExample.validation.invalidInputJson'))
    return
  }

  saving.value = true
  try {
    const { list: nextExamples, replaced } = upsertExample(offering.value.examples, example)
    await updateAdminOffering(offering.value.seqId, offeringExamplesToPayload(nextExamples))
    message.success(
      replaced
        ? t('pages.modelDetail.history.setExample.updated', { id: example.id })
        : t('pages.modelDetail.history.setExample.added', { model: props.model }),
    )
    emit('saved')
    emit('update:show', false)
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : t('pages.modelDetail.history.setExample.saveError'),
    )
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NConfigProvider :theme="darkTheme" :locale="naiveLocale" :theme-overrides="themeOverrides">
    <NDrawer
      :show="show"
      :width="600"
      placement="right"
      @update:show="emit('update:show', $event)"
    >
      <NDrawerContent :title="t('pages.modelDetail.history.setExample.title')" closable>
        <NSpin :show="loading">
          <template v-if="offering && form">
            <p class="set-example-hint">
              {{ t('pages.modelDetail.history.setExample.hintPrefix') }}
              <span class="set-example-mono">{{ model }}</span>
              {{ t('pages.modelDetail.history.setExample.hintSuffix') }}
            </p>
            <NForm label-placement="top">
              <NFormItem :label="t('pages.modelDetail.history.setExample.fields.id')">
                <NInput
                  v-model:value="form.id"
                  :placeholder="t('pages.modelDetail.history.setExample.placeholders.id')"
                />
              </NFormItem>
              <div class="set-example-locale-tabs">
                <NTabs v-model:value="exampleLocale" type="segment" size="small">
                  <NTabPane
                    v-for="loc in CONTENT_LOCALES"
                    :key="loc"
                    :name="loc"
                    :tab="loc === 'en-US' ? 'English (en-US)' : '简体中文 (zh-CN)'"
                  />
                </NTabs>
                <NFormItem :label="t('pages.modelDetail.history.setExample.fields.title')">
                  <NInput v-model:value="form.title[exampleLocale]" />
                </NFormItem>
                <NFormItem :label="t('pages.modelDetail.history.setExample.fields.description')">
                  <NInput
                    v-model:value="form.description[exampleLocale]"
                    type="textarea"
                    :rows="2"
                  />
                </NFormItem>
              </div>
              <NFormItem :label="t('pages.modelDetail.history.setExample.fields.input')">
                <div class="set-example-json">
                  <NButton size="small" @click="formatInputJson">
                    {{ t('pages.modelDetail.history.setExample.formatJson') }}
                  </NButton>
                  <NInput
                    v-model:value="form.inputJson"
                    type="textarea"
                    :rows="10"
                    class="set-example-mono-input"
                  />
                </div>
              </NFormItem>
              <NFormItem :label="t('pages.modelDetail.history.setExample.fields.outputUrl')">
                <NInput
                  v-model:value="form.outputUrl"
                  :placeholder="t('pages.modelDetail.history.setExample.placeholders.outputUrl')"
                />
              </NFormItem>
              <NFormItem :label="t('pages.modelDetail.history.setExample.fields.thumbnailUrl')">
                <NInput
                  v-model:value="form.thumbnailUrl"
                  :placeholder="t('pages.modelDetail.history.setExample.placeholders.thumbnailUrl')"
                />
              </NFormItem>
              <NFormItem :label="t('pages.modelDetail.history.setExample.fields.sortOrder')">
                <NInputNumber v-model:value="form.sortOrder" :min="0" style="width: 100%" />
              </NFormItem>
            </NForm>
            <div class="set-example-actions">
              <NButton @click="emit('update:show', false)">
                {{ t('common.cancel') }}
              </NButton>
              <NButton type="primary" :loading="saving" @click="save">
                {{ t('pages.modelDetail.history.setExample.save') }}
              </NButton>
            </div>
          </template>
        </NSpin>
      </NDrawerContent>
    </NDrawer>
  </NConfigProvider>
</template>

<style scoped>
.set-example-hint {
  margin: 0 0 16px;
  color: #9b9dab;
  font-size: 13px;
  line-height: 1.5;
}

.set-example-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #ebf4fb;
}

.set-example-locale-tabs {
  margin-bottom: 8px;
}

.set-example-json {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.set-example-mono-input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.set-example-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
