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
        { path: '/add/manual', component: () => import('@/pages/home/add-manual-dialog.vue') },
        { path: '/add/:id', component: () => import('@/pages/home/add-dialog.vue') },
        { path: '/details/:type/:id', component: () => import('@/pages/home/details-dialog.vue') },
        { path: '/edit/:type/:id', component: () => import('@/pages/home/edit-dialog.vue') },
        { path: '/seen/:type/:id', component: () => import('@/pages/home/mark-as-viewed-dialog.vue') },
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
        { path: 'import', component: () => import('@/pages/admin/import-page.vue') },
      ],
    },
  ],
})

export default router
