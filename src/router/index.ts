import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/utils/toastr'

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
    path: '/configuracion-global',
    name: 'configuracion-global',
    component: () => import('@/views/settings/GlobalSettingsView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/global-settings',
    redirect: '/configuracion-global'
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
        path: 'reportes',
        name: 'reportes-hub',
        component: () => import('@/views/reports/ReportsHubView.vue')
      },
      {
        path: 'ventas/puntos-emision',
        name: 'ventas-puntos-emision',
        component: () => import('@/views/sales/EmissionPointsView.vue')
      },
      {
        path: 'ventas/notas-credito',
        name: 'ventas-notas-credito',
        component: () => import('@/views/sales/CreditNotesView.vue')
      },
      {
        path: 'ventas/reportes',
        name: 'ventas-reportes',
        component: () => import('@/views/sales/SalesReportView.vue')
      },
      {
        path: 'ventas/:sub',
        name: 'ventas-submodule',
        component: () => import('@/views/sales/InvoiceView.vue')
      },
      {
        path: 'compras',
        name: 'compras',
        component: () => import('@/views/purchases/PurchasesView.vue')
      },
      {
        path: 'compras/:sub',
        name: 'compras-submodule',
        component: () => import('@/views/purchases/PurchasesView.vue')
      },
      {
        path: 'inventario',
        name: 'inventario',
        component: () => import('@/views/inventory/InventoryView.vue')
      },
      {
        path: 'inventario/:sub',
        name: 'inventario-submodule',
        component: () => import('@/views/inventory/InventoryView.vue')
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
        path: 'talento-humano/empleados',
        name: 'talento-humano-empleados',
        component: () => import('@/views/hr/EmployeesView.vue')
      },
      {
        path: 'talento-humano/categorias',
        name: 'talento-humano-categorias',
        component: () => import('@/views/hr/EmployeeCategoriesView.vue')
      },
      {
        path: 'citas/calendario',
        name: 'citas-calendario',
        component: () => import('@/views/appointments/AppointmentsCalendarView.vue')
      },
      {
        path: 'citas/ordenes',
        name: 'citas-ordenes',
        component: () => import('@/views/appointments/AppointmentOrdersView.vue')
      },
      {
        path: 'citas/horarios',
        name: 'citas-horarios',
        component: () => import('@/views/appointments/AppointmentSchedulesView.vue')
      },
      {
        path: 'citas',
        redirect: '/citas/calendario'
      },
      {
        path: 'talento-humano',
        redirect: '/talento-humano/empleados'
      },
      {
        path: 'rrhh/empleados',
        redirect: '/talento-humano/empleados'
      },
      {
        path: 'rrhh/categorias',
        redirect: '/talento-humano/categorias'
      },
      {
        path: 'rrhh',
        redirect: '/talento-humano/empleados'
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

// Guardia de navegación: Protección de rutas, verificación de expiración (15h) y control de retroceso
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  const isPublic = to.meta.public

  // Si hay token pero ya expiró (15 horas): forzar inicio de sesión inmediato
  if (authStore.token && authStore.isTokenExpired) {
    authStore.logout()
    try {
      toast.warning('Tu sesión ha expirado (15 horas). Por favor, inicia sesión nuevamente.')
    } catch (_) {}
    return { path: '/login' }
  }

  const token = localStorage.getItem('token')
  const selectedCompany = localStorage.getItem('selectedCompany')

  if (!token && !isPublic) {
    return { path: '/login' }
  }

  if (token && to.path === '/login') {
    return { path: '/dashboard' }
  }

  // Si ya tiene empresa seleccionada y está en el ERP, bloquear volver a /companies con el botón atrás del navegador a menos que sea explícito, venga de configuración global o sea Super Admin
  if (token && selectedCompany && to.path === '/companies' && to.query.cambiar !== 'true' && from.path !== '/configuracion-global') {
    const isSuper = Boolean(
      authStore.tokenPayload?.super_admin ||
      authStore.tokenPayload?.developer ||
      authStore.accessInfo?.isSuperAdmin
    )
    if (!isSuper) {
      return { path: '/dashboard' }
    }
  }

  // Protección de acceso exclusivo para Super Admin
  if (to.meta.requiresSuperAdmin) {
    const isSuper = Boolean(
      authStore.tokenPayload?.super_admin ||
      authStore.tokenPayload?.developer ||
      authStore.accessInfo?.isSuperAdmin
    )
    if (!isSuper) {
      toast.warning('Esta sección es de acceso exclusivo para Super Administradores.')
      return { path: '/dashboard' }
    }
  }

  // Protección de permisos por URL según el rol en la empresa activa (no aplica a rutas del sistema global)
  if (token && !isPublic && to.path !== '/dashboard' && to.path !== '/companies' && to.path !== '/configuracion-global') {
    if (!authStore.accessInfo && !authStore.loadingAccess) {
      try {
        await authStore.fetchCompanyAccess()
      } catch (err) {
        console.error('Error cargando permisos en guardia de navegación:', err)
      }
    }
    if (authStore.accessInfo && !authStore.canAccessUrl(to.fullPath)) {
      console.warn(`[Guardia de Navegación] Acceso denegado a la ruta: ${to.fullPath}`)
      return { path: '/dashboard' }
    }
  }
})

export default router
