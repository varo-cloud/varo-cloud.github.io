<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  NConfigProvider,
  NDatePicker,
  zhCN,
  type GlobalThemeOverrides,
} from 'naive-ui'

const model = defineModel<string | null>({ default: null })

defineProps<{
  placeholder?: string
}>()

const { locale } = useI18n()

const naiveLocale = computed(() => (locale.value === 'zh-CN' ? zhCN : enUS))
const naiveDateLocale = computed(() => (locale.value === 'zh-CN' ? dateZhCN : dateEnUS))

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#06b6d4',
    primaryColorHover: '#22d3ee',
    primaryColorPressed: '#0891b2',
    primaryColorSuppl: '#0891b2',
  },
  Input: {
    color: 'rgba(255, 255, 255, 0.06)',
    colorFocus: 'rgba(255, 255, 255, 0.06)',
    colorDisabled: 'rgba(255, 255, 255, 0.06)',
    border: '0.5px solid transparent',
    borderHover: '0.5px solid transparent',
    borderFocus: '0.5px solid transparent',
    boxShadowFocus: 'none',
    textColor: '#ebf4fb',
    textColorDisabled: '#9b9dab',
    placeholderColor: '#9b9dab',
    heightMedium: '40px',
    fontSizeMedium: '14px',
    borderRadius: '8px',
    iconColor: '#9b9dab',
    iconColorDisabled: '#9b9dab',
  },
  DatePicker: {
    panelColor: '#1b1b28',
    panelTextColor: '#ebf4fb',
    panelHeaderDividerColor: '#2d2d38',
    calendarDaysDividerColor: '#2d2d38',
    calendarTitleTextColor: '#ebf4fb',
    itemTextColor: '#ebf4fb',
    itemTextColorActive: '#ffffff',
    itemColorIncluded: 'rgba(6, 182, 212, 0.12)',
    itemColorHover: 'rgba(255, 255, 255, 0.06)',
    itemColorActive: '#06b6d4',
    arrowColor: '#9b9dab',
  },
  Button: {
    textColor: '#06b6d4',
    textColorHover: '#22d3ee',
    textColorPressed: '#0891b2',
  },
}
</script>

<template>
  <NConfigProvider
    :theme="darkTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme-overrides="themeOverrides"
  >
    <NDatePicker
      v-model:formatted-value="model"
      class="filter-date-picker"
      type="date"
      value-format="yyyy-MM-dd"
      clearable
      :placeholder="placeholder"
    />
  </NConfigProvider>
</template>

<style scoped>
.filter-date-picker {
  width: 100%;
}

.filter-date-picker :deep(.n-input__border),
.filter-date-picker :deep(.n-input__state-border) {
  border: none !important;
  box-shadow: none !important;
}
</style>
