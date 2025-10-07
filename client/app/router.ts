import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@/shared/lib'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/pages/home/home-page.vue'),
      children: [
        { path: '/search', component: () => import('@/pages/home/search-dialog.vue') },
        { path: '/add/:id', component: () => import('@/pages/home/add-dialog.vue') },
      ],
    },
    { path: '/settings', component: () => import('@/pages/settings/settings-page.vue') },
    {
      path: '/admin',
      beforeEnter: [authGuard],
      component: () => import('@/pages/admin/admin-page.vue'),
      children: [
        { path: 'register', component: () => import('@/pages/admin/register-user-page.vue') },
        { path: 'backup', component: () => import('@/pages/admin/backup-page.vue') },
      ],
    },
  ],
})

export default router
