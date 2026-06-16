<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <nav class="app-footer__links">
        <RouterLink to="/terms">{{ t('footer.terms') }}</RouterLink>
        <RouterLink to="/privacy">{{ t('footer.privacy') }}</RouterLink>
        <a href="mailto:support@example.com">{{ t('footer.contact') }}</a>
      </nav>
      <p class="app-footer__copy">© {{ new Date().getFullYear() }} AI Video Platform</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  background: var(--bg-footer);
}

.app-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.app-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-bottom: 12px;
}

.app-footer__links a {
  color: var(--text-secondary);
  font-size: 14px;
  text-decoration: none;
}

.app-footer__links a:hover {
  color: var(--text-primary);
}

.app-footer__copy {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 767px) {
  .app-footer__links {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
