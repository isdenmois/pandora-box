import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@/shared/lib'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/pages/home').then((m) => m.HomePage),
      children: [
        { path: '/search', component: () => import('@/pages/home').then((m) => m.SearchDialog) },
        { path: '/add/manual', component: () => import('@/pages/home').then((m) => m.AddManualDialog) },
        { path: '/add/:id', component: () => import('@/pages/home').then((m) => m.AddDialog) },
        { path: '/details/:type/:id', component: () => import('@/pages/home').then((m) => m.DetailsDialog) },
        { path: '/edit/:type/:id', component: () => import('@/pages/home').then((m) => m.EditDialog) },
        { path: '/seen/:type/:id', component: () => import('@/pages/home').then((m) => m.MarkAsViewedDialog) },
      ],
    },
    { path: '/settings', component: () => import('@/pages/settings').then((m) => m.SettingsPage) },
    {
      path: '/admin',
      beforeEnter: [authGuard],
      component: () => import('@/pages/admin/panel').then((m) => m.AdminPage),
      children: [
        { path: 'register', component: () => import('@/pages/admin/register').then((m) => m.RegisterUserPage) },
        { path: 'backup', component: () => import('@/pages/admin/backup').then((m) => m.BackupPage) },
        { path: 'import', component: () => import('@/pages/admin/import').then((m) => m.ImportPage) },
        { path: 'attribution', component: () => import('@/pages/admin/attribution').then((m) => m.AttributionPage) },
        { path: 'images', component: () => import('@/pages/admin/images').then((m) => m.ImagesPage) },
      ],
    },
  ],
})

export default router
