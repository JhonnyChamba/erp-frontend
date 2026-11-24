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
          <router-link to="/dashboard" class="text-nowrap logo-img d-flex align-items-center text-decoration-none" title="Ir al Dashboard" @click="handleSidebarNavClick('/dashboard')">
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
                  <!-- CASO A: MÓDULO CON SUBMÓDULOS (ACORDEÓN) -->
                  <template v-if="mod.children && mod.children.length > 0">
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
                        :icon="isOpen(mod.code) ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
                        class="fs-3 ms-auto text-muted arrow-toggle-icon"
                      ></iconify-icon>
                    </a>

                    <ul
                      v-show="isOpen(mod.code)"
                      class="list-unstyled ps-3 pt-1 mb-2 first-level"
                    >
                      <li
                        v-for="sub in getModuleChildren(mod)"
                        :key="sub.code"
                        class="sidebar-item mb-1"
                      >
                        <router-link
                          :to="sub.url"
                          class="sidebar-sublink"
                          :class="{ active: isSubActive(sub.url) }"
                          @click="handleSidebarNavClick(sub.url)"
                        >
                          <span class="sidebar-icon"></span>
                          <span class="hide-menu">{{ sub.description }}</span>
                        </router-link>
                      </li>
                    </ul>
                  </template>

                  <!-- CASO B: MÓDULO DIRECTO SIN SUBMÓDULOS (EJ. REPORTES) -->
                  <template v-else>
                    <router-link
                      :to="getDirectModuleUrl(mod)"
                      class="sidebar-link info-hover-bg"
                      :class="{ active: route.path === getDirectModuleUrl(mod) || route.path.startsWith(getDirectModuleUrl(mod) + '/') }"
                      @click="handleSidebarNavClick(getDirectModuleUrl(mod))"
                    >
                      <span class="aside-icon p-2 bg-info-subtle rounded-1 text-info">
                        <iconify-icon :icon="mod.icon || 'solar:chart-square-bold-duotone'" class="fs-6"></iconify-icon>
                      </span>
                      <span class="hide-menu ps-1">{{ mod.description }}</span>
                    </router-link>
                  </template>
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
                      v-if="mod.children && mod.children.length > 0"
                      :icon="isOpen(mod.code) ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
                      class="fs-3 ms-auto text-muted arrow-toggle-icon"
                    ></iconify-icon>
                  </a>

                  <ul
                    v-if="getModuleChildren(mod).length > 0"
                    v-show="isOpen(mod.code)"
                    class="list-unstyled ps-3 pt-1 mb-2 first-level"
                  >
                    <li
                      v-for="sub in getModuleChildren(mod)"
                      :key="sub.code"
                      class="sidebar-item mb-1"
                    >
                      <router-link
                        :to="sub.url"
                        class="sidebar-sublink"
                        :class="{ active: isSubActive(sub.url) }"
                        @click="handleSidebarNavClick(sub.url)"
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

    </aside>

    <!-- ÁREA PRINCIPAL: HEADER + CONTENIDO -->
    <div class="page-wrapper flex-grow-1 d-flex flex-column" style="min-height: 100vh;">
      
      <!-- CONTENIDO DE LA VISTA CON HEADER SPIKE FLOTANTE -->
      <div class="body-wrapper flex-grow-1 p-2 p-md-3">
        
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

import { resolveAvatarUrl } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const customizerRef = ref<InstanceType<typeof AppCustomizer> | null>(null)
const isMiniSidebar = ref(false)
const mobileSidebarOpen = ref(false)

const handleSidebarNavClick = (url?: string) => {
  mobileSidebarOpen.value = false
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('deskounta:reset-view', { detail: { url } }))
  }
}
const userName = ref('Usuario')
const userPhoto = computed(() => resolveAvatarUrl(authStore.tokenPayload?.photo_url || localStorage.getItem('userPhoto')))

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
  return menu.filter((m) => {
    // MOD-006 (Configuración) pertenece a la sección Sistema
    if (m.code === 'MOD-006' || m.description?.toLowerCase().includes('configuraci')) {
      return false
    }
    // Módulos con submódulos
    if (m.children && m.children.length > 0) {
      if (isCampeonatoMod(m)) return getCampeonatoSubItems(m).length > 0
      if (isInventoryMod(m)) return getInventorySubItems(m).length > 0
      if (isPurchasesMod(m)) return getPurchasesSubItems(m).length > 0
      if (isSalesMod(m)) return getSalesSubItems(m).length > 0
      return true
    }
    // Módulo directo sin submódulos en BD (ej. MOD-007 Reportes)
    return m.code === 'MOD-007' || Boolean((m as any).url)
  })
})

const getDirectModuleUrl = (mod: any): string => {
  if (mod.code === 'MOD-007' || mod.description?.toLowerCase().includes('reporte')) {
    return '/reportes'
  }
  return mod.url || (mod.children && mod.children[0]?.url) || '/dashboard'
}

const systemModules = computed(() => {
  const menu = authStore.accessInfo?.menu || []
  return menu.filter(
    (m) =>
      (m.code === 'MOD-006' || m.description?.toLowerCase().includes('configuraci')) &&
      m.children &&
      m.children.length > 0
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
      if (expectedTab.toLowerCase() === 'configuracion') {
        const configTabs = [
          'configuracion',
          'teams',
          'players',
          'categories',
          'categoryeditions',
          'stages',
          'scenaries',
          'schedules',
          'referees',
          'vocals',
          'demarcations',
        ]
        if (configTabs.includes(currentTab.toLowerCase())) {
          return true
        }
      }
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



// Submódulos independientes de Inventario: formatear y ordenar únicamente los autorizados para el rol
const getInventorySubItems = (mod: any) => {
  const children = (mod.children || [])
    .filter(
      (s: any) => !s.description?.toLowerCase().includes('configuraci') && !s.url?.toLowerCase().includes('configuracion')
    )
    .map((s: any) => {
      const item = { ...s }
      const low = (item.url || item.description || '').toLowerCase()
      if (low.includes('categor')) {
        item.url = '/inventario?tab=categorias'
      } else if (low.includes('bodega')) {
        item.url = '/inventario?tab=bodegas'
      } else if (low.includes('kardex')) {
        item.url = '/inventario?tab=kardex'
      } else if (low.includes('art')) {
        item.url = '/inventario?tab=articulos'
      } else if (low.includes('serv')) {
        item.url = '/inventario?tab=servicios'
      } else if (low.includes('subcon')) {
        item.url = '/inventario?tab=subcontratacion'
      }
      return item
    })

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
  const children = (mod.children || []).map((s: any) => {
    const item = { ...s }
    if (!item.url || item.url === '#' || item.url === '/compras') {
      item.url = '/compras'
    }
    return item
  })
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
  const children = (mod.children || [])
    .filter((s: any) => !s.description?.toLowerCase().includes('reporte') && !s.url?.toLowerCase().includes('reporte'))
    .map((s: any) => {
      const item = { ...s }
      const low = (item.url || item.description || '').toLowerCase()
      if (low.includes('puntos-emision') || low.includes('punto de emisi')) {
        item.url = '/ventas/puntos-emision'
      } else if (low.includes('notas-credito') || low.includes('nota de cr')) {
        item.url = '/ventas/notas-credito'
      } else if (low.includes('factura')) {
        item.url = '/ventas/facturas'
      }
      return item
    })

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

const isCampeonatoMod = (mod: any) =>
  mod.code === 'MOD-010' || mod.description?.toLowerCase().includes('campeonato')

const getCampeonatoSubItems = (mod: any) => {
  const children = mod.children || []
  const isSuper = Boolean(authStore.tokenPayload?.super_admin || authStore.accessInfo?.isSuperAdmin)

  // Submódulos operativos que van en el menú lateral (Equipos, Jugadores y configuraciones técnicas van en "Configuraciones")
  const operationalSubItems = [
    { code: 'SUB-CAMP-007', description: 'Inscripción de Equipos', url: '/campeonato?tab=teamRegistrations', tab: 'teamRegistrations' },
    { code: 'SUB-CAMP-008', description: 'Inscripción y Carnets', url: '/campeonato?tab=playerRegistrations', tab: 'playerRegistrations' },
    { code: 'SUB-CAMP-020', description: 'Transferencias de Jugadores', url: '/campeonato?tab=playerTransfers', tab: 'playerTransfers' },
    { code: 'SUB-CAMP-011', description: 'Partidos y Encuentros', url: '/campeonato?tab=matches', tab: 'matches' },
    { code: 'SUB-CAMP-017', description: 'Tabla de Posiciones & Goleadores', url: '/campeonato?tab=standings', tab: 'standings' },
    { code: 'SUB-CAMP-012', description: 'Sanciones y Disciplina', url: '/campeonato?tab=sanctions', tab: 'sanctions' },
    { code: 'SUB-CAMP-013', description: 'Pagos y Finanzas', url: '/campeonato?tab=payments', tab: 'payments' },
    { code: 'SUB-CAMP-018', description: 'Configuraciones', url: '/campeonato?tab=configuracion', tab: 'configuracion' },
  ]

  if (isSuper || children.length === 0) {
    return operationalSubItems.map(({ tab, ...rest }) => rest)
  }

  const allowedCodes = children.map((c: any) => c.code)
  const allowedUrls = (authStore.accessInfo?.allowedUrls || []).concat(children.map((c: any) => c.url_desc || c.url || '')).map((u: string) => u.toLowerCase())

  return operationalSubItems
    .filter((item) => {
      if (item.tab === 'configuracion') {
        const configCodes = [
          'SUB-CAMP-001',
          'SUB-CAMP-002',
          'SUB-CAMP-003',
          'SUB-CAMP-004',
          'SUB-CAMP-005',
          'SUB-CAMP-006',
          'SUB-CAMP-009',
          'SUB-CAMP-010',
          'SUB-CAMP-015',
          'SUB-CAMP-016',
          'SUB-CAMP-018',
        ]
        return (
          configCodes.some((code) => allowedCodes.includes(code)) ||
          allowedUrls.some((u) => u.includes('configuracion') || u.includes('campeonato')) ||
          allowedCodes.some((code: string) => code.startsWith('SUB-CAMP-'))
        )
      }
      return (
        allowedCodes.includes(item.code) ||
        allowedUrls.some((u) => u.includes(item.tab.toLowerCase()) || (item.code && u.includes(item.code.toLowerCase())))
      )
    })
    .map(({ tab, ...rest }) => rest)
}

const isConfigMod = (mod: any) =>
  mod.code === 'MOD-006' || mod.description?.toLowerCase().includes('configura')

const getConfigSubItems = (mod: any) => {
  const children = (mod.children || []).map((s: any) => {
    const item = { ...s }
    const low = (item.url || item.description || '').toLowerCase()
    if (low.includes('empresa')) {
      item.url = '/configuracion?tab=companies'
    } else if (low.includes('usuario')) {
      item.url = '/configuracion?tab=users'
    } else if (low.includes('rol')) {
      item.url = '/configuracion?tab=roles'
    } else if (low.includes('sucursal') || low.includes('establecimiento')) {
      item.url = '/configuracion?tab=branches'
    }
    return item
  })
  return children
}

const getModuleChildren = (mod: any) => {
  if (isConfigMod(mod)) return getConfigSubItems(mod)
  if (isCampeonatoMod(mod)) return getCampeonatoSubItems(mod)
  if (isInventoryMod(mod)) return getInventorySubItems(mod)
  if (isSalesMod(mod)) return getSalesSubItems(mod)
  if (isPurchasesMod(mod)) return getPurchasesSubItems(mod)
  return mod.children || []
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
  if ((moduleCode === 'MOD-HR' || moduleCode?.toLowerCase().includes('talento') || moduleCode?.toLowerCase().includes('rrhh')) && (route.path.toLowerCase().startsWith('/talento-humano') || route.path.toLowerCase().startsWith('/rrhh'))) {
    return true
  }
  if ((moduleCode === 'MOD-CITAS' || moduleCode === 'MOD-009' || moduleCode?.toLowerCase().includes('cita') || moduleCode?.toLowerCase().includes('agenda')) && route.path.toLowerCase().startsWith('/citas')) {
    return true
  }
  if ((moduleCode === 'MOD-010' || moduleCode?.toLowerCase().includes('campeonato')) && route.path.toLowerCase().startsWith('/campeonato')) {
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
  if (mobileSidebarOpen.value) {
    mobileSidebarOpen.value = false
  }
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
  window.addEventListener('popstate', handlePopState)
})

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
    const menu = authStore.accessInfo?.menu || []
    for (const mod of menu) {
      if (mod.children?.some((sub) => isSubActive(sub.url))) {
        openModules[mod.code] = true
      }
    }
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
