import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/companies',
    name: 'companies',
    component: () => import('@/views/company/ListCompanyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue')
      },
      {
        path: 'ventas/facturas',
        name: 'facturas',
        component: () => import('@/views/sales/InvoiceView.vue')
      },
      {
        path: 'contactos',
        name: 'contactos',
        component: () => import('@/views/contacts/ContactsView.vue')
      },
      {
        path: 'clientes',
        redirect: '/contactos?tab=clientes'
      },
      {
        path: 'proveedores',
        redirect: '/contactos?tab=proveedores'
      },
      {
        path: 'vendedores',
        redirect: '/contactos?tab=vendedores'
      },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('@/views/settings/SettingsView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guardia de navegación: Redirige a /login si no hay token
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const isPublic = to.meta.public

  if (!token && !isPublic) {
    return { path: '/login' }
  }

  if (token && to.path === '/login') {
    return { path: '/dashboard' }
  }
})

export default router