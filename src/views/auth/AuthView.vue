<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NTabs, NTabPane } from 'naive-ui'
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const { t } = useI18n()
const activeTab = ref('login')
</script>

<template>
  <div class="auth-view">
    <NCard class="auth-view__card">
      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="login" :tab="t('pages.auth.loginTab')">
          <PagePlaceholder
            :title="t('pages.auth.loginTab')"
            :description="t('pages.auth.placeholder')"
          />
        </NTabPane>
        <NTabPane name="signup" :tab="t('pages.auth.signupTab')">
          <PagePlaceholder
            :title="t('pages.auth.signupTab')"
            :description="t('pages.auth.placeholder')"
          />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px);
  padding: 24px 16px;
}

.auth-view__card {
  width: 100%;
  max-width: 480px;
}
</style>
