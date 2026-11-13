<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { useRouter } from 'vue-router'
import { api } from '@/services/axios'
import { resolveAvatarUrl, handleAvatarError } from '@/utils/avatar'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const emit = defineEmits(['toggle-sidebar', 'open-customizer'])

const selectedCompany = ref<any>(null)
const selectedBranch = ref<any>(null)
const userName = ref('Usuario')
const userPhoto = computed(() => {
  return resolveAvatarUrl(
    authStore.tokenPayload?.photo_url ||
    localStorage.getItem('userPhoto')
  )
})

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

  // Si la empresa guardada dice 'Deskounta' o falta razón social real, consultar al backend
  const compId = selectedCompany.value?.id || payload?.company_id
  if (compId && (!selectedCompany.value?.razon_social || selectedCompany.value?.razon_social === 'Deskounta')) {
    api.get(`/company/${compId}`).then(({ data }: any) => {
      if (data) {
        selectedCompany.value = {
          ...selectedCompany.value,
          id: data.id,
          ruc: data.ruc,
          razon_social: data.business_name || data.trade_name || data.description || 'Deskounta',
          nombre_comercial: data.trade_name || data.business_name || 'Deskounta',
        }
        localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany.value))
      }
    }).catch(() => {})
  }

  // Sincronizar foto de perfil si no está en localStorage o para refrescar
  if (!localStorage.getItem('userPhoto') || localStorage.getItem('userPhoto')?.includes('localhost')) {
    api.get('/auth/me').then(({ data }: any) => {
      if (data?.photo_url) {
        localStorage.setItem('userPhoto', data.photo_url)
      }
    }).catch(() => {})
  }
})

const logout = () => {
  authStore.logout()
  localStorage.removeItem('selectedCompany')
  localStorage.removeItem('selectedBranch')
  router.replace('/login')
}

const companyLabel = computed(() => {
  const comp = selectedCompany.value
  if (comp?.razon_social && comp.razon_social !== 'Deskounta') return comp.razon_social
  if (comp?.nombre_comercial && comp.nombre_comercial !== 'Deskounta') return comp.nombre_comercial
  if (comp?.business_name) return comp.business_name
  if (comp?.trade_name) return comp.trade_name
  if (comp?.description && comp.description !== 'Deskounta') return comp.description
  return comp?.razon_social || comp?.nombre_comercial || 'Deskounta'
})
const branchLabel = computed(() => (selectedBranch.value?.name ? `${selectedBranch.value.name} (${selectedBranch.value.code})` : 'Sucursal General'))
const isProduction = computed(() => selectedCompany.value?.fiscal?.sri_environment === '2' || selectedCompany.value?.sri_environment === '2')

const changeCompany = () => {
  router.push({ path: '/companies', query: { cambiar: 'true' } })
}
</script>

<template>
  <header class="topbar sticky-top">
    <div class="with-vertical">
      <nav class="navbar navbar-expand-lg p-0 d-flex align-items-center justify-content-between">
        
        <!-- LADO IZQUIERDO: TOGGLER + EMPRESA / SUCURSAL ACTIVA -->
        <div class="d-flex align-items-center gap-2 flex-shrink-1" style="min-width: 0;">
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

          <!-- Empresa / sucursal activa y ambiente SRI.
               Si el usuario es super admin o multiempresa, al hacer clic se despliega la opción de cambiar de empresa -->
          <div class="dropdown d-none d-md-block" style="min-width: 0;">
            <div
              id="dropContext"
              class="context-pill d-flex align-items-center flex-nowrap gap-2 px-3 py-1 rounded-pill border"
              :class="{ 'cursor-pointer context-pill-action': authStore.canSwitchCompany }"
              :role="authStore.canSwitchCompany ? 'button' : undefined"
              :data-bs-toggle="authStore.canSwitchCompany ? 'dropdown' : undefined"
              :aria-expanded="authStore.canSwitchCompany ? 'false' : undefined"
              :title="authStore.canSwitchCompany ? 'Clic para cambiar de empresa' : undefined"
              style="background-color: var(--bs-subtle-bg); border-color: var(--bs-border-color) !important;"
            >
              <iconify-icon icon="solar:buildings-3-line-duotone" class="text-primary fs-5"></iconify-icon>
              <span class="company-name fw-semibold fs-3" style="color: var(--bs-text-title);">{{ companyLabel }}</span>
              <span
                v-if="isProduction"
                class="env-badge badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0 fs-1 d-inline-flex align-items-center gap-1"
                title="Ambiente SRI: Producción"
              >
                <iconify-icon icon="solar:shield-check-bold"></iconify-icon>
                PRODUCCIÓN
              </span>
              <span
                v-else
                class="env-badge badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-0 fs-1 d-inline-flex align-items-center gap-1"
                title="Ambiente SRI: Pruebas"
              >
                <iconify-icon icon="solar:test-tube-minimalistic-bold-duotone"></iconify-icon>
                PRUEBAS
              </span>
              <span class="text-muted mx-1">|</span>
              <iconify-icon icon="solar:shop-2-line-duotone" class="text-info fs-5"></iconify-icon>
              <span class="branch-name text-info fs-2">{{ branchLabel }}</span>
              <iconify-icon v-if="authStore.canSwitchCompany" icon="solar:alt-arrow-down-line-duotone" class="text-muted fs-4 flex-shrink-0"></iconify-icon>
            </div>

            <div
              v-if="authStore.canSwitchCompany"
              class="dropdown-menu shadow-lg rounded-3 py-2 border-0 app-dropdown-menu"
              aria-labelledby="dropContext"
              style="min-width: 270px;"
            >
              <div class="px-3 py-2 border-bottom" style="border-color: var(--bs-border-color) !important;">
                <small class="text-muted d-block">Empresa activa</small>
                <span class="d-block fw-bold fs-3" style="color: var(--bs-text-title);">{{ companyLabel }}</span>
                <small class="text-info d-block">{{ branchLabel }}</small>
                <small class="text-muted">Ambiente: {{ isProduction ? 'Producción' : 'Pruebas' }}</small>
              </div>
              <a class="dropdown-item py-2" href="javascript:void(0)" @click="changeCompany">
                <iconify-icon icon="solar:buildings-3-line-duotone" class="fs-5 text-primary"></iconify-icon>
                <span>Cambiar de empresa / sucursal</span>
              </a>
            </div>
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
                    :src="userPhoto"
                    @error="handleAvatarError"
                    width="38"
                    height="38"
                    class="rounded-circle border border-primary border-2"
                    style="object-fit: cover;"
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
              <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="logout">
                <iconify-icon icon="solar:logout-2-line-duotone" class="fs-5"></iconify-icon>
                <span>Cerrar Sesión</span>
              </a>
            </div>
          </li>

        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* El estilo base del tema fuerza .badge a 40x40 px (círculo): en la barra se ajusta al contenido */
.env-badge {
  width: auto !important;
  height: auto !important;
  display: inline-flex !important;
  align-items: center;
  flex-shrink: 0;
  padding: 0.2rem 0.55rem !important;
  line-height: 1.2;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
/* Textos largos (razón social, sucursal) no ensanchan la barra: se recortan con puntos suspensivos */
.context-pill {
  min-width: 0;
  max-width: 100%;
}
.context-pill-action:hover {
  border-color: var(--bs-primary) !important;
}
.company-name,
.branch-name {
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cursor-pointer {
  cursor: pointer;
}
.btn-xs {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}
</style>
