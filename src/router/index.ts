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
        path: 'ventas/:sub',
        name: 'ventas-submodule',
        component: () => import('@/views/sales/InvoiceView.vue')
      },
      {
        path: 'compras/:sub',
        name: 'compras-submodule',
        component: () => import('@/views/sales/InvoiceView.vue')
      },
      {
        path: 'inventario/:sub',
        name: 'inventario-submodule',
        component: () => import('@/views/sales/InvoiceView.vue')
      },
      {
        path: 'contabilidad/:sub',
        name: 'contabilidad-submodule',
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
      },
      {
        path: ':moduleSlug/:subSlug',
        name: 'dynamic-submodule',
        component: () => import('@/views/sales/InvoiceView.vue')
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

// Guardia de navegación: Protección de rutas y control de retroceso
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const selectedCompany = localStorage.getItem('selectedCompany')
  const isPublic = to.meta.public

  if (!token && !isPublic) {
    return { path: '/login' }
  }

  if (token && to.path === '/login') {
    return { path: '/dashboard' }
  }

  // Si ya tiene empresa seleccionada y está en el ERP, bloquear volver a /companies con el botón atrás del navegador
  if (token && selectedCompany && to.path === '/companies' && to.query.cambiar !== 'true') {
    return { path: '/dashboard' }
  }
})

export default router
