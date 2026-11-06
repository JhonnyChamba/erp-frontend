<template>
  <div
    id="main-wrapper"
    class="d-flex"
    :class="{ 'mini-sidebar': isMiniSidebar, 'show-sidebar': mobileSidebarOpen }"
  >

    <!-- SIDEBAR -->
    <aside class="left-sidebar with-vertical d-flex flex-column justify-content-between">
      
      <!-- HEADER DEL SIDEBAR (LOGO) -->
      <div>
        <div class="brand-logo d-flex align-items-center justify-content-between p-3 border-bottom border-dark-subtle">
          <router-link to="/dashboard" class="text-nowrap logo-img d-flex align-items-center gap-2 text-decoration-none">
            <img src="/controller/images/logos/favicon.svg" alt="logo" width="34" height="34" class="img-fluid" />
            <span class="fs-5 fw-bold text-white tracking-wide brand-title">Deskounta</span>
          </router-link>
          <button class="btn btn-link text-white p-0 d-xl-none" @click="mobileSidebarOpen = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <!-- LISTA DE NAVEGACIÓN -->
        <div class="scroll-sidebar p-3" style="max-height: calc(100vh - 160px); overflow-y: auto;">
          <nav class="sidebar-nav">
            <ul id="sidebarnav" class="mb-0 list-unstyled">

              <!-- HOME -->
              <li class="nav-small-cap text-uppercase text-secondary fs-1 fw-bold mb-2 ps-2">
                Home
              </li>

              <li class="sidebar-item mb-1">
                <router-link
                  to="/dashboard"
                  class="sidebar-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none"
                  :class="currentRoute === '/dashboard' ? 'active-menu' : 'text-white-50 hover-link'"
                >
                  <iconify-icon icon="solar:screencast-2-line-duotone" class="fs-5 text-primary"></iconify-icon>
                  <span class="hide-menu fw-medium">Dashboard</span>
                </router-link>
              </li>

              <li class="sidebar-item mb-3">
                <a
                  href="javascript:void(0)"
                  @click="go('/companies')"
                  class="sidebar-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none text-white-50 hover-link"
                >
                  <iconify-icon icon="solar:buildings-3-line-duotone" class="fs-5 text-info"></iconify-icon>
                  <span class="hide-menu fw-medium">Empresas / Sucursales</span>
                </a>
              </li>

              <!-- MÓDULOS OPERATIVOS DINÁMICOS (SEGÚN SUSCRIPCIÓN DE LA EMPRESA Y ROL DEL USUARIO) -->
              <template v-if="operationalModules.length > 0">
                <li class="nav-small-cap text-uppercase text-secondary fs-1 fw-bold mb-2 ps-2">
                  Módulos ERP
                </li>

                <li
                  v-for="mod in operationalModules"
                  :key="mod.code"
                  class="sidebar-item mb-1"
                >
                  <a
                    href="javascript:void(0)"
                    class="sidebar-link d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-decoration-none text-white-50 hover-link"
                    @click="toggleModule(mod.code)"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <iconify-icon :icon="mod.icon || 'solar:widget-4-line-duotone'" class="fs-5 text-info"></iconify-icon>
                      <span class="hide-menu fw-medium text-white">{{ mod.description }}</span>
                    </div>
                    <iconify-icon
                      v-if="mod.children && mod.children.length > 0"
                      :icon="isOpen(mod.code) ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
                      class="fs-3 text-secondary arrow-toggle-icon"
                    ></iconify-icon>
                  </a>

                  <ul
                    v-if="mod.children && mod.children.length > 0"
                    v-show="isOpen(mod.code)"
                    class="list-unstyled ps-4 pt-1 mb-2"
                  >
                    <li
                      v-for="sub in mod.children"
                      :key="sub.code"
                      class="sidebar-item mb-1"
                    >
                      <router-link
                        :to="sub.url"
                        class="d-flex align-items-center gap-2 py-1 px-2 rounded text-decoration-none text-white-50 hover-sublink"
                        :class="{ 'text-primary fw-bold': isSubActive(sub.url) }"
                      >
                        <iconify-icon :icon="sub.icon || 'solar:round-alt-arrow-right-line-duotone'" class="fs-3"></iconify-icon>
                        <span class="hide-menu">{{ sub.description }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
              </template>

              <!-- MÓDULOS DE SISTEMA / CONFIGURACIÓN DINÁMICOS -->
              <template v-if="systemModules.length > 0">
                <li class="nav-small-cap text-uppercase text-secondary fs-1 fw-bold mt-3 mb-2 ps-2">
                  Sistema
                </li>

                <li
                  v-for="mod in systemModules"
                  :key="mod.code"
                  class="sidebar-item mb-1"
                >
                  <a
                    href="javascript:void(0)"
                    class="sidebar-link d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-decoration-none text-white-50 hover-link"
                    @click="toggleModule(mod.code)"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <iconify-icon :icon="mod.icon || 'solar:settings-line-duotone'" class="fs-5 text-danger"></iconify-icon>
                      <span class="hide-menu fw-medium text-white">{{ mod.description }}</span>
                    </div>
                    <iconify-icon
                      v-if="mod.children && mod.children.length > 0"
                      :icon="isOpen(mod.code) ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
                      class="fs-3 text-secondary arrow-toggle-icon"
                    ></iconify-icon>
                  </a>

                  <ul
                    v-if="mod.children && mod.children.length > 0"
                    v-show="isOpen(mod.code)"
                    class="list-unstyled ps-4 pt-1 mb-2"
                  >
                    <li
                      v-for="sub in mod.children"
                      :key="sub.code"
                      class="sidebar-item mb-1"
                    >
                      <router-link
                        :to="sub.url"
                        class="d-flex align-items-center gap-2 py-1 px-2 rounded text-decoration-none text-white-50 hover-sublink"
                        :class="{ 'text-primary fw-bold': isSubActive(sub.url) }"
                      >
                        <iconify-icon :icon="sub.icon || 'solar:round-alt-arrow-right-line-duotone'" class="fs-4"></iconify-icon>
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
      <div class="sidebar-profile-widget p-3 border-top border-dark-subtle m-2 rounded-3 bg-dark-subtle d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <img
            src="/controller/images/profile/user-1.jpg"
            alt="profile"
            width="38"
            height="38"
            class="rounded-circle border border-primary border-2"
          />
          <div class="overflow-hidden user-info-text">
            <h6 class="mb-0 text-white fs-2 text-truncate" style="max-width: 115px;">{{ userName }}</h6>
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
      
      <!-- HEADER SUPERIOR CON BOTÓN DE TOGGLE CONECTADO -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- CONTENIDO DE LA VISTA -->
      <div class="body-wrapper flex-grow-1 p-3 p-md-4">
        <div class="container-fluid p-0">
          <router-view />
        </div>
      </div>

      <AppFooter />

    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isMiniSidebar = ref(false)
const mobileSidebarOpen = ref(false)
const userName = ref('Usuario')

const currentRoute = computed(() => route.path)
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
  if (subUrl.includes('?')) {
    return route.fullPath.toLowerCase() === subUrl.toLowerCase()
  }
  return route.path.toLowerCase() === subUrl.toLowerCase()
}

const isOpen = (moduleCode: string) => {
  if (openModules[moduleCode] !== undefined) {
    return openModules[moduleCode]
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

onMounted(async () => {
  const payload = authStore.tokenPayload
  if (payload?.user_name) {
    userName.value = payload.user_name
  }
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

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})

const toggleSidebar = () => {
  isMiniSidebar.value = !isMiniSidebar.value
  document.body.setAttribute('data-sidebartype', isMiniSidebar.value ? 'mini-sidebar' : 'full')
}

const go = (path: string) => {
  if (path === '/companies') {
    router.push({ path: '/companies', query: { cambiar: 'true' } })
  } else {
    router.push(path)
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
/* Resetea el margin-left que Spike Admin aplicaba por defecto */
.page-wrapper {
  margin-left: 0 !important;
  flex: 1;
  min-width: 0;
  transition: all 0.25s ease-in-out;
}

:deep(.body-wrapper > .container-fluid) {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 1rem !important;
}

.left-sidebar {
  width: 270px;
  min-width: 270px;
  max-width: 270px;
  background-color: #0b1426 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 100vh;
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: all 0.25s ease-in-out;
}

.active-menu {
  background-color: #0d6efd !important;
  color: #fff !important;
}

.hover-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff !important;
}

.hover-sublink:hover {
  color: #0d6efd !important;
  background: rgba(255, 255, 255, 0.04);
}

.sidebar-profile-widget {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* ================================================= */
/* COMPORTAMIENTO MINI-SIDEBAR (COLAPSADO)           */
/* ================================================= */
.mini-sidebar .left-sidebar {
  width: 78px !important;
  min-width: 78px !important;
  max-width: 78px !important;
}

.mini-sidebar .hide-menu,
.mini-sidebar .brand-title,
.mini-sidebar .user-info-text,
.mini-sidebar .nav-small-cap,
.mini-sidebar .arrow-toggle-icon {
  display: none !important;
}

.mini-sidebar .sidebar-link {
  justify-content: center !important;
  padding: 10px 0 !important;
}

.mini-sidebar .brand-logo {
  justify-content: center !important;
  padding: 14px 0 !important;
}

.mini-sidebar .sidebar-profile-widget {
  justify-content: center !important;
  padding: 8px 0 !important;
  margin: 4px !important;
}

.mini-sidebar .sidebar-profile-widget button {
  display: none !important;
}

/* Expansión flotante al pasar el mouse sobre el sidebar colapsado */
.mini-sidebar .left-sidebar:hover {
  width: 270px !important;
  min-width: 270px !important;
  max-width: 270px !important;
  position: absolute !important;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1050;
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.6);
}

.mini-sidebar .left-sidebar:hover .hide-menu,
.mini-sidebar .left-sidebar:hover .brand-title,
.mini-sidebar .left-sidebar:hover .user-info-text,
.mini-sidebar .left-sidebar:hover .nav-small-cap,
.mini-sidebar .left-sidebar:hover .arrow-toggle-icon {
  display: inline-block !important;
}

.mini-sidebar .left-sidebar:hover .sidebar-link {
  justify-content: flex-start !important;
  padding: 8px 16px !important;
}

.mini-sidebar .left-sidebar:hover .brand-logo {
  justify-content: space-between !important;
  padding: 16px !important;
}

.mini-sidebar .left-sidebar:hover .sidebar-profile-widget {
  justify-content: space-between !important;
  padding: 12px !important;
  margin: 8px !important;
}

.mini-sidebar .left-sidebar:hover .sidebar-profile-widget button {
  display: block !important;
}
</style>
