<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const emit = defineEmits(['toggle-sidebar', 'open-customizer'])

const selectedCompany = ref<any>(null)
const selectedBranch = ref<any>(null)
const userName = ref('Usuario')

const activeRoleLabel = computed(() => {
  return authStore.accessInfo?.roleName || (authStore.tokenPayload?.super_admin ? 'Super Admin' : 'Admin')
})

onMounted(() => {
  themeStore.initTheme()
  const comp = localStorage.getItem('selectedCompany')
  if (comp) {
    try { selectedCompany.value = JSON.parse(comp) } catch (e) {}
  }
  const branch = localStorage.getItem('selectedBranch')
  if (branch) {
    try { selectedBranch.value = JSON.parse(branch) } catch (e) {}
  }
  const payload = authStore.tokenPayload
  if (payload?.user_name) {
    userName.value = payload.user_name
  }
})

const logout = () => {
  authStore.logout()
  localStorage.removeItem('selectedCompany')
  localStorage.removeItem('selectedBranch')
  router.replace('/login')
}

const changeCompany = () => {
  router.push({ path: '/companies', query: { cambiar: 'true' } })
}
</script>

<template>
  <header class="topbar sticky-top">
    <div class="with-vertical">
      <nav class="navbar navbar-expand-lg p-0 d-flex align-items-center justify-content-between">
        
        <!-- LADO IZQUIERDO: TOGGLER + EMPRESA / SUCURSAL ACTIVA -->
        <div class="d-flex align-items-center gap-2">
          <ul class="navbar-nav me-2">
            <li class="nav-item nav-icon-hover-bg rounded-circle">
              <a
                class="nav-link sidebartoggler cursor-pointer"
                id="headerCollapse"
                href="javascript:void(0)"
                @click="emit('toggle-sidebar')"
                title="Colapsar / Expandir menú"
              >
                <iconify-icon icon="solar:list-bold-duotone" class="fs-7"></iconify-icon>
              </a>
            </li>
          </ul>

          <!-- Badge Context: Empresa y Sucursal -->
          <div class="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded-pill border" style="background-color: var(--bs-subtle-bg); border-color: var(--bs-border-color) !important;">
            <iconify-icon icon="solar:buildings-3-line-duotone" class="text-primary fs-5"></iconify-icon>
            <span class="fw-semibold fs-3" style="color: var(--bs-text-title);">
              {{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'Deskounta' }}
            </span>
            <span
              v-if="selectedCompany?.fiscal?.sri_environment === '2' || (selectedCompany as any)?.sri_environment === '2'"
              class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0 fs-1 d-inline-flex align-items-center gap-1"
              title="Ambiente SRI: Producción"
            >
              <iconify-icon icon="solar:shield-check-bold"></iconify-icon>
              PRODUCCIÓN
            </span>
            <span
              v-else
              class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-0 fs-1 d-inline-flex align-items-center gap-1"
              title="Ambiente SRI: Pruebas"
            >
              <iconify-icon icon="solar:test-tube-minimalistic-bold-duotone"></iconify-icon>
              PRUEBAS
            </span>
            <span class="text-muted mx-1">|</span>
            <iconify-icon icon="solar:shop-2-line-duotone" class="text-info fs-5"></iconify-icon>
            <span class="text-info fs-2">
              {{ selectedBranch?.name ? `${selectedBranch.name} (${selectedBranch.code})` : 'Sucursal General' }}
            </span>
            <button
              v-if="authStore.canSwitchCompany"
              class="btn btn-xs btn-outline-primary ms-2 rounded-pill px-2 py-0 fs-1"
              @click="changeCompany"
              title="Cambiar Empresa / Sucursal"
            >
              Cambiar
            </button>
          </div>
        </div>

        <!-- LADO DERECHO: ACCIONES + MODO OSCURO + PERFIL DE USUARIO + SALIR -->
        <ul class="navbar-nav flex-row ms-auto align-items-center justify-content-end gap-1 mb-0">
          
          <!-- MODO OSCURO / CLARO (SPIKE MODEL) -->
          <li class="nav-item nav-icon-hover-bg rounded-circle">
            <a
              class="nav-link moon dark-layout cursor-pointer"
              href="javascript:void(0)"
              v-if="!themeStore.isDark"
              @click="themeStore.toggleTheme"
              title="Cambiar a Modo Oscuro"
            >
              <iconify-icon icon="solar:moon-line-duotone" class="moon fs-6"></iconify-icon>
            </a>
            <a
              class="nav-link sun light-layout cursor-pointer text-warning"
              href="javascript:void(0)"
              v-else
              @click="themeStore.toggleTheme"
              title="Cambiar a Modo Claro"
            >
              <iconify-icon icon="solar:sun-2-line-duotone" class="sun fs-6"></iconify-icon>
            </a>
          </li>

          <!-- PERSONALIZAR APARIENCIA / SETTINGS CUSTOMIZER (CONTAINER FULL/BOXED, ETC) -->
          <li class="nav-item nav-icon-hover-bg rounded-circle">
            <a
              class="nav-link cursor-pointer text-primary"
              href="javascript:void(0)"
              @click="emit('open-customizer')"
              title="Personalizar Apariencia (Ancho de Pantalla Full/Boxed, Colores)"
            >
              <iconify-icon icon="solar:settings-minimalistic-line-duotone" class="fs-6"></iconify-icon>
            </a>
          </li>

          <!-- NOTIFICACIONES -->
          <li class="nav-item nav-icon-hover-bg rounded-circle">
            <a class="nav-link position-relative cursor-pointer" href="javascript:void(0)">
              <iconify-icon icon="solar:bell-bing-line-duotone" class="fs-6"></iconify-icon>
            </a>
          </li>

          <!-- PERFIL DE USUARIO (SPIKE PROFILE ITEM) -->
          <li class="nav-item dropdown">
            <a
              class="nav-link position-relative ms-2 cursor-pointer p-0"
              href="javascript:void(0)"
              id="dropProfile"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="d-flex align-items-center flex-shrink-0">
                <div class="user-profile me-sm-2 me-1">
                  <img
                    src="/controller/images/profile/user-1.jpg"
                    width="38"
                    height="38"
                    class="rounded-circle border border-primary border-2"
                    alt="user"
                  />
                </div>
                <div class="d-none d-sm-block text-start">
                  <h6 class="fs-3 mb-0 profile-name">{{ userName }}</h6>
                  <p class="fs-2 lh-base mb-0 profile-subtext">{{ activeRoleLabel }}</p>
                </div>
                <span class="ms-1 text-muted d-none d-sm-inline">
                  <iconify-icon icon="solar:alt-arrow-down-line-duotone" class="fs-4"></iconify-icon>
                </span>
              </div>
            </a>

            <!-- MENÚ DESPLEGABLE DE PERFIL -->
            <div
              class="dropdown-menu dropdown-menu-end shadow-lg rounded-3 py-2 border-0 app-dropdown-menu"
              aria-labelledby="dropProfile"
              style="min-width: 210px;"
            >
              <div class="px-3 py-2 border-bottom" style="border-color: var(--bs-border-color) !important;">
                <span class="d-block fw-bold fs-3" style="color: var(--bs-text-title);">{{ userName }}</span>
                <small class="text-muted">{{ activeRoleLabel }}</small>
              </div>
              <template v-if="authStore.canSwitchCompany">
                <a class="dropdown-item py-2" href="javascript:void(0)" @click="changeCompany">
                  <iconify-icon icon="solar:buildings-3-line-duotone" class="fs-5 text-primary"></iconify-icon>
                  <span>Cambiar Sucursal</span>
                </a>
                <div class="dropdown-divider"></div>
              </template>
              <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="logout">
                <iconify-icon icon="solar:logout-2-line-duotone" class="fs-5"></iconify-icon>
                <span>Cerrar Sesión</span>
              </a>
            </div>
          </li>

          <!-- BOTÓN SALIR RÁPIDO -->
          <li class="nav-item ms-2">
            <button
              class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 rounded-pill px-3 py-1"
              @click="logout"
              title="Cerrar Sesión"
            >
              <iconify-icon icon="solar:logout-2-line-duotone" class="fs-4"></iconify-icon>
              <span class="d-none d-md-inline fw-semibold">Salir</span>
            </button>
          </li>

        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.btn-xs {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}
</style>
