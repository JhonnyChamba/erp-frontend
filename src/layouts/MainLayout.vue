<template>
  <div
    id="main-wrapper"
    :class="{ 'mini-sidebar': isMiniSidebar, 'show-sidebar': mobileSidebarOpen }"
  >
    <!-- TELÓN OSCURO DE FONDO EN MÓVIL (BACKDROP) -->
    <div
      v-if="mobileSidebarOpen"
      class="dark-transparent"
      @click="mobileSidebarOpen = false"
    ></div>

    <!-- SIDEBAR -->
    <aside class="left-sidebar with-vertical d-flex flex-column justify-content-between">
      
      <!-- HEADER DEL SIDEBAR (LOGO) -->
      <div class="d-flex flex-column flex-grow-1" style="min-height: 0;">
        <div class="brand-logo flex-shrink-0 d-flex align-items-center justify-content-between p-3 border-bottom border-translucent">
          <router-link to="/dashboard" class="text-nowrap logo-img d-flex align-items-center text-decoration-none" title="Ir al Dashboard" @click="mobileSidebarOpen = false">
            <img src="/controller/images/logos/logo-dark.svg" class="dark-logo" alt="Deskounta Logo" height="34" />
            <img src="/controller/images/logos/logo-light.svg" class="light-logo" alt="Deskounta Logo" height="34" />
          </router-link>
          <button class="btn btn-link text-body p-0 d-xl-none" @click="mobileSidebarOpen = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <!-- LISTA DE NAVEGACIÓN -->
        <div class="scroll-sidebar p-3 flex-grow-1" style="min-height: 0; overflow-y: auto;">
          <nav class="sidebar-nav">
            <ul id="sidebarnav" class="mb-0 list-unstyled">

              <!-- MÓDULOS OPERATIVOS DINÁMICOS -->
              <template v-if="operationalModules.length > 0">
                <li class="nav-small-cap mt-2">
                  <iconify-icon icon="solar:menu-dots-bold-duotone" class="nav-small-cap-icon fs-5"></iconify-icon>
                  <span class="hide-menu">Módulos ERP</span>
                </li>

                <li
                  v-for="mod in operationalModules"
                  :key="mod.code"
                  class="sidebar-item mb-1"
                >
                  <a
                    href="javascript:void(0)"
                    class="sidebar-link has-arrow info-hover-bg"
                    @click="toggleModule(mod.code)"
                  >
                    <span class="aside-icon p-2 bg-info-subtle rounded-1 text-info">
                      <iconify-icon :icon="mod.icon || 'solar:widget-4-line-duotone'" class="fs-6"></iconify-icon>
                    </span>
                    <span class="hide-menu ps-1">{{ mod.description }}</span>
                    <iconify-icon
                      v-if="mod.children && mod.children.length > 0"
                      :icon="isOpen(mod.code) ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
                      class="fs-3 ms-auto text-muted arrow-toggle-icon"
                    ></iconify-icon>
                  </a>

                  <ul
                    v-if="mod.children && mod.children.length > 0"
                    v-show="isOpen(mod.code)"
                    class="list-unstyled ps-3 pt-1 mb-2 first-level"
                  >
                    <li
                      v-for="sub in (isInventoryMod(mod) ? getInventorySubItems(mod) : (isPurchasesMod(mod) ? getPurchasesSubItems(mod) : (isSalesMod(mod) ? getSalesSubItems(mod) : mod.children)))"
                      :key="sub.code"
                      class="sidebar-item mb-1"
                    >
                      <router-link
                        :to="sub.url"
                        class="sidebar-sublink"
                        :class="{ active: isSubActive(sub.url) }"
                      >
                        <span class="sidebar-icon"></span>
                        <span class="hide-menu">{{ sub.description }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
              </template>

              <!-- MÓDULOS DE SISTEMA / CONFIGURACIÓN DINÁMICOS -->
              <template v-if="systemModules.length > 0">
                <li class="nav-small-cap mt-3">
                  <iconify-icon icon="solar:menu-dots-bold-duotone" class="nav-small-cap-icon fs-5"></iconify-icon>
                  <span class="hide-menu">Sistema</span>
                </li>

                <li
                  v-for="mod in systemModules"
                  :key="mod.code"
                  class="sidebar-item mb-1"
                >
                  <a
                    href="javascript:void(0)"
                    class="sidebar-link has-arrow danger-hover-bg"
                    @click="toggleModule(mod.code)"
                  >
                    <span class="aside-icon p-2 bg-danger-subtle rounded-1 text-danger">
                      <iconify-icon :icon="mod.icon || 'solar:settings-line-duotone'" class="fs-6"></iconify-icon>
                    </span>
                    <span class="hide-menu ps-1">{{ mod.description }}</span>
                    <iconify-icon
                      v-if="getConfigSubItems(mod).length > 0"
                      :icon="isOpen(mod.code) ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
                      class="fs-3 ms-auto text-muted arrow-toggle-icon"
                    ></iconify-icon>
                  </a>

                  <ul
                    v-if="getConfigSubItems(mod).length > 0"
                    v-show="isOpen(mod.code)"
                    class="list-unstyled ps-3 pt-1 mb-2 first-level"
                  >
                    <li
                      v-for="sub in getConfigSubItems(mod)"
                      :key="sub.code"
                      class="sidebar-item mb-1"
                    >
                      <router-link
                        :to="sub.url"
                        class="sidebar-sublink"
                        :class="{ active: isSubActive(sub.url) }"
                      >
                        <span class="sidebar-icon"></span>
                        <span class="hide-menu">{{ sub.description }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
              </template>

            </ul>
          </nav>
        </div>
      </div>

      <!-- WIDGET DE USUARIO EN EL PIE DEL SIDEBAR -->
      <div class="sidebar-profile-widget flex-shrink-0 p-3 border-top border-translucent m-2 rounded-3 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <img
            src="/controller/images/profile/user-1.jpg"
            alt="profile"
            width="38"
            height="38"
            class="rounded-circle border border-primary border-2"
          />
          <div class="overflow-hidden user-info-text">
            <h6 class="mb-0 user-name-text fs-2 text-truncate" style="max-width: 115px;">{{ userName }}</h6>
            <small class="text-info fs-1 d-block text-truncate" style="max-width: 115px;">
              {{ activeRoleLabel }}
            </small>
          </div>
        </div>
        <button class="btn btn-link text-danger p-1" @click="logout" title="Cerrar sesión">
          <iconify-icon icon="solar:logout-2-line-duotone" class="fs-5"></iconify-icon>
        </button>
      </div>

    </aside>

    <!-- ÁREA PRINCIPAL: HEADER + CONTENIDO -->
    <div class="page-wrapper flex-grow-1 d-flex flex-column" style="min-height: 100vh;">
      
      <!-- CONTENIDO DE LA VISTA CON HEADER SPIKE FLOTANTE -->
      <div class="body-wrapper flex-grow-1 p-3 p-md-4">
        
        <!-- HEADER SUPERIOR CONECTADO -->
        <AppHeader
          @toggle-sidebar="toggleSidebar"
          @open-customizer="customizerRef?.openDrawer()"
        />

        <div class="container-fluid p-0">
          <router-view />
        </div>

        <AppFooter />
      </div>

    </div>

    <!-- PANEL LATERAL DE APARIENCIA (CUSTOMIZER ESTILO SPIKE ADMIN) -->
    <AppCustomizer
      ref="customizerRef"
      :is-mini-sidebar="isMiniSidebar"
      @toggle-sidebar="toggleSidebar"
    />

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppCustomizer from '@/components/AppCustomizer.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const customizerRef = ref<InstanceType<typeof AppCustomizer> | null>(null)
const isMiniSidebar = ref(false)
const mobileSidebarOpen = ref(false)
const userName = ref('Usuario')

const openModules = reactive<Record<string, boolean>>({})

const activeRoleLabel = computed(() => {
  if (authStore.accessInfo?.roleName) {
    return authStore.accessInfo.roleName
  }
  if (authStore.tokenPayload?.super_admin || authStore.tokenPayload?.developer) {
    return 'Super Admin'
  }
  return 'Usuario'
})

const operationalModules = computed(() => {
  const menu = authStore.accessInfo?.menu || []
  return menu.filter(
    (m) =>
      m.code !== 'MOD-006' &&
      !m.description.toLowerCase().includes('configuraci')
  )
})

const systemModules = computed(() => {
  const menu = authStore.accessInfo?.menu || []
  return menu.filter(
    (m) =>
      m.code === 'MOD-006' ||
      m.description.toLowerCase().includes('configuraci')
  )
})

const isSubActive = (subUrl: string) => {
  if (!subUrl) return false
  const parts = subUrl.split('?')
  const subPath = (parts[0] || '').toLowerCase()
  const subQuery = parts[1]
  const currentPath = route.path.toLowerCase()

  if (currentPath !== subPath) {
    return false
  }

  if (subQuery) {
    const searchParams = new URLSearchParams(subQuery)
    const expectedTab = searchParams.get('tab')
    const currentTab = (route.query.tab as string) || (currentPath === '/configuracion' ? 'companies' : '')
    if (expectedTab && currentTab) {
      return expectedTab.toLowerCase() === currentTab.toLowerCase()
    }
    for (const [key, val] of searchParams.entries()) {
      if (String(route.query[key] || '').toLowerCase() !== val.toLowerCase()) {
        return false
      }
    }
    return true
  }

  // Si subUrl no tiene query pero la ruta actual sí tiene tab distinta de companies en configuración
  if (currentPath === '/configuracion' && route.query.tab && route.query.tab !== 'companies') {
    return false
  }

  return true
}

const getConfigSubItems = (mod: any) => {
  const children = [...(mod?.children || [])]

  // Lista canónica de los 8 submódulos en el orden exacto de los tabs de Configuración
  const canonicalItems = [
    { id: 17, code: 'SUB-017', description: 'Empresas', url: '/configuracion?tab=companies' },
    { id: 26, code: 'SUB-026', description: 'Sucursales', url: '/configuracion?tab=branches' },
    { id: 18, code: 'SUB-018', description: 'Usuarios', url: '/configuracion?tab=users' },
    { id: 19, code: 'SUB-019', description: 'Roles', url: '/configuracion?tab=roles' },
    { id: 20, code: 'SUB-020', description: 'Módulos & Submódulos', url: '/configuracion?tab=modules' },
    { id: 21, code: 'SUB-021', description: 'Planes & Suscripciones', url: '/configuracion?tab=subscriptions' },
    { id: 27, code: 'SUB-027', description: 'Impuestos', url: '/configuracion?tab=taxes' },
    { id: 28, code: 'SUB-028', description: 'Tipos de Documentos', url: '/configuracion?tab=document_types' },
  ]

  return canonicalItems.map((item) => {
    const existing = children.find(
      (c: any) =>
        c.code === item.code ||
        c.description?.toLowerCase().trim() === item.description.toLowerCase().trim() ||
        (c.url && item.url && c.url.toLowerCase().includes(item.url.split('?')[1]?.toLowerCase()))
    )
    if (existing) {
      return {
        ...existing,
        description: item.description,
        url: item.url,
      }
    }
    return item
  })
}

// Submódulos independientes de Inventario: Categorías y Bodegas primero en el menú (sin sub-módulos ni anidamientos)
const getInventorySubItems = (mod: any) => {
  const children = (mod.children || []).filter(
    (s: any) => !s.description?.toLowerCase().includes('configuraci') && !s.url?.toLowerCase().includes('configuracion')
  )
  const hasCat = children.some((s: any) => s.url?.toLowerCase().includes('tab=categorias'))
  const hasBod = children.some((s: any) => s.url?.toLowerCase().includes('tab=bodegas'))
  const hasKar = children.some((s: any) => s.url?.toLowerCase().includes('tab=kardex'))

  if (!hasCat) {
    children.push({ id: 23, code: 'SUB-023', description: 'Categorías', url: '/inventario?tab=categorias' })
  }
  if (!hasBod) {
    children.push({ id: 24, code: 'SUB-024', description: 'Bodegas', url: '/inventario?tab=bodegas' })
  }
  if (!hasKar) {
    children.push({ id: 22, code: 'SUB-022', description: 'Kardex / Movimientos', url: '/inventario?tab=kardex' })
  }

  // Categorías y Bodegas primero, seguidos de Artículos, Servicios, Subcontratación y Kardex
  const priority = ['tab=categorias', 'tab=bodegas', 'tab=articulos', 'tab=servicios', 'tab=subcontratacion', 'tab=kardex']
  children.sort((a: any, b: any) => {
    const aUrl = (a.url || '').toLowerCase()
    const bUrl = (b.url || '').toLowerCase()
    const aIdx = priority.findIndex((p) => aUrl.includes(p))
    const bIdx = priority.findIndex((p) => bUrl.includes(p))
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  return children
}

const getPurchasesSubItems = (mod: any) => {
  const children = [...(mod.children || [])]
  if (children.length === 0) {
    children.push({ id: 201, code: 'SUB-201', description: 'Facturas de Compra / Ingresos', url: '/compras' })
  } else {
    // Si los submódulos apuntan a /compras/..., asegurarse de que tengan URL válida
    for (const sub of children) {
      if (!sub.url || sub.url === '#' || sub.url === '/compras') {
        sub.url = '/compras'
      }
    }
  }
  return children
}

const isInventoryMod = (mod: any) =>
  mod.code === 'MOD-003' || mod.description?.toLowerCase().includes('inventario')

const isPurchasesMod = (mod: any) =>
  mod.code === 'MOD-002' || mod.description?.toLowerCase().includes('compra')

const isSalesMod = (mod: any) =>
  mod.code === 'MOD-001' ||
  mod.description?.toLowerCase().includes('venta') ||
  mod.children?.some((s: any) => s.url?.toLowerCase().includes('venta'))

const getSalesSubItems = (mod: any) => {
  const children = [...(mod.children || [])]
  const hasFacturas = children.some((s: any) => s.url?.toLowerCase().includes('factura'))
  if (!hasFacturas) {
    children.unshift({
      id: 1,
      code: 'SUB-001',
      description: 'Facturas',
      url: '/ventas/facturas'
    })
  }
  const hasCreditNotes = children.some((s: any) => s.url?.toLowerCase().includes('notas-credito'))
  if (!hasCreditNotes) {
    children.push({
      id: 2,
      code: 'SUB-002',
      description: 'Notas de Crédito',
      url: '/ventas/notas-credito'
    })
  }
  const hasPoints = children.some((s: any) => s.url?.toLowerCase().includes('puntos-emision'))
  if (!hasPoints) {
    children.push({
      id: 25,
      code: 'SUB-025',
      description: 'Puntos de Emisión',
      url: '/ventas/puntos-emision'
    })
  }

  // Ordenar: Facturas primero, Notas de Crédito segundo, Puntos de Emisión tercero, luego el resto
  const order = ['factura', 'notas-credito', 'puntos-emision', 'notas-venta', 'cotizaciones']
  children.sort((a: any, b: any) => {
    const aUrl = (a.url || '').toLowerCase()
    const bUrl = (b.url || '').toLowerCase()
    const aIdx = order.findIndex((k) => aUrl.includes(k))
    const bIdx = order.findIndex((k) => bUrl.includes(k))
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  return children
}

const isOpen = (moduleCode: string) => {
  if (openModules[moduleCode] !== undefined) {
    return openModules[moduleCode]
  }
  if ((moduleCode === 'MOD-001' || moduleCode?.toLowerCase().includes('venta')) && route.path.toLowerCase().startsWith('/ventas')) {
    return true
  }
  if ((moduleCode === 'MOD-003' || moduleCode?.toLowerCase().includes('inventario')) && route.path.toLowerCase().startsWith('/inventario')) {
    return true
  }
  if ((moduleCode === 'MOD-002' || moduleCode?.toLowerCase().includes('compra')) && route.path.toLowerCase().startsWith('/compras')) {
    return true
  }
  if ((moduleCode === 'MOD-006' || moduleCode?.toLowerCase().includes('configura')) && route.path.toLowerCase().startsWith('/configuracion')) {
    return true
  }
  const found = (authStore.accessInfo?.menu || []).find((m) => m.code === moduleCode)
  if (found?.children?.some((sub) => isSubActive(sub.url))) {
    return true
  }
  return moduleCode === 'MOD-006'
}

const toggleModule = (moduleCode: string) => {
  openModules[moduleCode] = !isOpen(moduleCode)
}

const handlePopState = () => {
  window.history.pushState(null, '', window.location.href)
}

const handleResize = () => {
  if (typeof window === 'undefined') return
  if (window.innerWidth >= 1200) {
    mobileSidebarOpen.value = false
    document.body.setAttribute('data-sidebartype', isMiniSidebar.value ? 'mini-sidebar' : 'full')
  } else {
    document.body.setAttribute('data-sidebartype', 'full')
  }
}

onMounted(async () => {
  const payload = authStore.tokenPayload
  if (payload?.user_name) {
    userName.value = payload.user_name
  }
  handleResize()
  window.addEventListener('resize', handleResize)
  await authStore.fetchCompanyAccess()
  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', handlePopState)
})

watch(
  () => route.fullPath,
  () => {
    const menu = authStore.accessInfo?.menu || []
    for (const mod of menu) {
      if (mod.children?.some((sub) => isSubActive(sub.url))) {
        openModules[mod.code] = true
      }
    }
  }
)

// Cerrar automáticamente el menú móvil al navegar
watch(
  () => route.path,
  () => {
    mobileSidebarOpen.value = false
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('popstate', handlePopState)
})

const toggleSidebar = () => {
  if (window.innerWidth < 1200) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  } else {
    isMiniSidebar.value = !isMiniSidebar.value
    document.body.setAttribute('data-sidebartype', isMiniSidebar.value ? 'mini-sidebar' : 'full')
  }
}


const logout = () => {
  authStore.logout()
  localStorage.removeItem('selectedCompany')
  localStorage.removeItem('selectedBranch')
  router.replace('/login')
}
</script>

<style scoped>
:deep(.body-wrapper > .container-fluid) {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.active-menu {
  background-color: var(--bs-primary) !important;
  color: #fff !important;
}

.hover-link:hover {
  background: var(--bs-hover-bg);
  color: var(--bs-primary) !important;
}

.hover-sublink:hover {
  color: var(--bs-primary) !important;
  background: var(--bs-hover-bg);
}
</style>
