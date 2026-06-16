import type { Router } from 'vue-router'
import { getToken } from '@/api/http'

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !getToken()) {
      return {
        path: '/auth',
        query: { redirect: to.fullPath },
      }
    }
    return true
  })
}
