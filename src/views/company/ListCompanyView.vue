<script setup lang="ts">
import { useBranchStore, useListCompanyUserStore } from '@/stores/ListCompanyUser.store'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { getMyProfile, type MyProfile } from '@/services/auth.service'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/utils/toastr'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

interface Company {
  id: number
  razon_social: string
  ruc: string
  nombre_comercial: string
}

const companies = ref<Company[]>([])
const companyStore = useListCompanyUserStore()
const branchStore = useBranchStore()

const showBranchesModal = ref(false)
const selectedCompany = ref<Company | null>(null)
const selectedCompanyId = ref<number | null>(null)

// ✅ Usamos el estado del store (NO refs duplicadas)
const branches = computed(() => branchStore.branches)
const page = computed(() => branchStore.page)
const total = computed(() => branchStore.total)
const limit = computed(() => branchStore.limit)
const userName = computed(() => authStore.tokenPayload?.user_name || 'Usuario')

// ===============================
// PERFIL DEL USUARIO (panel izquierdo)
// ===============================
const profile = ref<MyProfile | null>(null)
const profileLoading = ref(true)
const profileError = ref(false)

const fetchProfile = async () => {
  profileLoading.value = true
  profileError.value = false
  try {
    profile.value = await getMyProfile()
  } catch (error) {
    console.error('Error al obtener el perfil', error)
    profileError.value = true
  } finally {
    profileLoading.value = false
  }
}

const profileFullName = computed(() => profile.value?.full_name || userName.value)
const profilePhoto = computed(() => {
  return (
    profile.value?.photo_url ||
    authStore.tokenPayload?.photo_url ||
    localStorage.getItem('userPhoto') ||
    '/controller/images/profile/user-1.jpg'
  )
})

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target && !target.src.includes('/controller/images/profile/user-1.jpg')) {
    target.src = '/controller/images/profile/user-1.jpg'
  }
}

const profileRole = computed(() => profile.value?.role_name || (authStore.tokenPayload?.super_admin ? 'Super Admin' : 'Usuario'))
const profileType = computed(() => {
  const p = profile.value
  const superAdmin = p ? p.super_admin : Boolean(authStore.tokenPayload?.super_admin)
  const multi = p ? p.multi_company : Boolean(authStore.tokenPayload?.multi_company)
  return superAdmin ? 'Super administrador' : multi ? 'Multiempresa' : 'Usuario de empresa'
})

// Las fechas AAAA-MM-DD se muestran sin convertir zona horaria (evita el desfase de un día)
const formatDateOnly = (value?: string | null) => {
  const m = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null
}
const birthDateLabel = computed(() => formatDateOnly(profile.value?.birth_date))
const ageLabel = computed(() => {
  const m = String(profile.value?.birth_date ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  const today = new Date()
  let age = today.getFullYear() - Number(m[1])
  if (today.getMonth() + 1 < Number(m[2]) || (today.getMonth() + 1 === Number(m[2]) && today.getDate() < Number(m[3]))) age--
  return age >= 0 ? ` (${age} años)` : ''
})
const memberSinceLabel = computed(() => {
  const d = profile.value?.created_at ? new Date(profile.value.created_at) : null
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
})

const profileRows = computed(() => [
  { icon: 'solar:letter-line-duotone', label: 'Correo electrónico', value: profile.value?.email || null },
  { icon: 'solar:card-2-line-duotone', label: 'Cédula / Documento', value: profile.value?.num_document || null },
  { icon: 'solar:calendar-date-line-duotone', label: 'Fecha de nacimiento', value: birthDateLabel.value ? birthDateLabel.value + ageLabel.value : null },
  { icon: 'solar:shield-user-line-duotone', label: 'Tipo de usuario', value: profileType.value },
  { icon: 'solar:buildings-3-line-duotone', label: 'Empresa principal', value: profile.value?.company_name || null },
  { icon: 'solar:clock-circle-line-duotone', label: 'Miembro desde', value: memberSinceLabel.value },
])

const logout = () => {
  authStore.logout()
  router.replace('/login')
}


// ===============================
// EMPRESAS
// ===============================
const fetchError = ref<string | null>(null)
watch(fetchError, (err) => {
  if (err) toast.error(err, 'Empresas')
})
const fetchCompanies = async () => {
  fetchError.value = null
  try {
    await companyStore.fetchCompanies({ page: 1, limit: 100 })
    companies.value = companyStore.companies
  } catch (error: any) {
    console.error('Error al obtener empresas', error)
    fetchError.value = error.response?.data?.message || error.message || 'Error al conectar con el servidor'
  }
}


// ===============================
// SUCURSALES
// ===============================
const loadingCompanyId = ref<number | null>(null)

const selectCompany = async (company: Company) => {
  selectedCompany.value = company
  selectedCompanyId.value = company.id
  loadingCompanyId.value = company.id

  try {
    const response = await branchStore.fetchBranches({
      companyId: company.id,
      page: 1,
      limit: 10
    })

    const branchList = response?.data || branchStore.branches || []

    if (branchList.length === 0) {
      // Si no tiene sucursales, pasar directo al Dashboard
      selectBranch(null)
      return
    }

    // Si solo tiene una sucursal, se ingresa directo con ella sin pedir selección
    const total = response?.meta?.total ?? branchList.length
    if (branchList.length === 1 && total <= 1) {
      await selectBranch(branchList[0])
      return
    }

    // Si tiene varias sucursales, abrir modal para seleccionar
    showBranchesModal.value = true
  } catch (error) {
    console.error('Error al obtener sucursales', error)
    // En caso de error, permitir el acceso directo para no bloquear
    selectBranch(null)
  } finally {
    loadingCompanyId.value = null
  }
}

const selectBranch = async (branch: any) => {
  if (selectedCompany.value) {
    localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany.value))
    await authStore.fetchCompanyAccess(selectedCompany.value.id)
  }
  if (branch) {
    localStorage.setItem('selectedBranch', JSON.stringify(branch))
  } else {
    localStorage.setItem(
      'selectedBranch',
      JSON.stringify({
        id: 0,
        code: '001',
        name: 'Matriz / Principal',
        address: ''
      })
    )
  }
  showBranchesModal.value = false
  router.replace('/dashboard')
}

// Paginación
const nextPage = async () => {
  if (!selectedCompanyId.value) return

  await branchStore.fetchBranches({
    companyId: selectedCompanyId.value,
    page: branchStore.page + 1
  })
}

const prevPage = async () => {
  if (!selectedCompanyId.value) return
  if (branchStore.page > 1)
    await branchStore.fetchBranches({
      companyId: selectedCompanyId.value,
      page: branchStore.page - 1
    })
}

onMounted(async () => {
  fetchProfile()
  await fetchCompanies()
})
</script>

<style>
.custom-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.custom-modal {
  background: var(--bs-card-bg, #fff);
  color: var(--bs-body-color, #2a3547);
  width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
  border: 1px solid var(--bs-border-color, #e6ecf1);
}
</style>

<style scoped>
.profile-title {
  color: var(--bs-text-title);
  word-break: break-word;
}
.profile-role {
  background: rgba(var(--bs-primary-rgb), 0.12);
  color: var(--bs-primary);
  border: 1px solid rgba(var(--bs-primary-rgb), 0.3);
  border-radius: 999px;
  padding: 0.2rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
}
.profile-muted {
  color: var(--bs-text-muted);
}
.profile-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.profile-row {
  background: var(--bs-subtle-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
}
.profile-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(var(--bs-primary-rgb), 0.12);
  color: var(--bs-primary);
}
.profile-value {
  color: var(--bs-text-title);
  font-weight: 600;
  font-size: 0.85rem;
  word-break: break-word;
}
.profile-empty {
  color: var(--bs-text-muted);
  font-weight: 400;
  font-style: italic;
}
.profile-note {
  background: rgba(255, 193, 7, 0.12);
  color: var(--bs-text-title);
  border: 1px solid rgba(255, 193, 7, 0.35);
}
.min-w-0 {
  min-width: 0;
}
</style>

<template>
  <div id="main-wrapper" class="d-flex">
    <!-- Sidebar Start -->
    <aside class="left-sidebar with-vertical d-flex flex-column justify-content-between">
      <div class="d-flex flex-column flex-grow-1" style="min-height: 0;">
        <div class="brand-logo flex-shrink-0 d-flex align-items-center p-3 border-bottom border-translucent">
          <span class="text-nowrap logo-img d-flex align-items-center">
            <img src="/controller/images/logos/logo-dark.svg" class="dark-logo" alt="Logo-Dark" height="34" />
            <img src="/controller/images/logos/logo-light.svg" class="light-logo" alt="Logo-Light" height="34" />
          </span>
        </div>

        <!-- Datos básicos del usuario (sin accesos a otras pantallas) -->
        <div class="scroll-sidebar p-3 flex-grow-1" style="min-height: 0; overflow-y: auto;">
          <div v-if="profileLoading" class="text-center py-5">
            <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
              <div class="spinner-grow text-primary spinner-grow-sm" role="status"><span class="visually-hidden">Cargando...</span></div>
              <div class="spinner-grow text-info spinner-grow-sm" role="status"><span class="visually-hidden">Cargando...</span></div>
            </div>
            <p class="profile-muted fs-2 mt-2 mb-0">Cargando datos del usuario...</p>
          </div>

          <template v-else>
            <div class="text-center mb-3">
              <img
                :src="profilePhoto"
                @error="handleImageError"
                alt="Foto de perfil"
                width="84"
                height="84"
                class="rounded-circle border border-primary border-3 mb-3"
                style="object-fit: cover;"
              />
              <h5 class="profile-title fw-bold mb-2">{{ profileFullName }}</h5>
              <span class="profile-role d-inline-flex align-items-center gap-1">
                <iconify-icon icon="solar:shield-check-bold" class="fs-4"></iconify-icon>
                {{ profileRole }}
              </span>
            </div>

            <div v-if="profileError" class="profile-note rounded-3 p-2 mb-3 fs-2">
              No se pudieron cargar todos los datos del perfil.
              <a href="javascript:void(0)" class="d-block mt-1" @click="fetchProfile">Reintentar</a>
            </div>

            <ul class="list-unstyled mb-0 profile-list">
              <li v-for="row in profileRows" :key="row.label" class="profile-row d-flex align-items-start gap-2">
                <span class="profile-icon flex-shrink-0">
                  <iconify-icon :icon="row.icon" class="fs-5"></iconify-icon>
                </span>
                <div class="min-w-0">
                  <small class="profile-muted d-block">{{ row.label }}</small>
                  <span class="profile-value d-block" :class="{ 'profile-empty': !row.value }">{{ row.value || 'No registrado' }}</span>
                </div>
              </li>
            </ul>
          </template>
        </div>
      </div>
    </aside>
    <!--  Sidebar End -->

    <div class="page-wrapper flex-grow-1" style="min-width: 0; min-height: 100vh;">
      <div class="body-wrapper p-3 p-md-4">
        <div class="container-fluid p-0">
          <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div class="card-header text-bg-primary d-flex align-items-center justify-content-between py-3 px-4">
              <div class="d-flex align-items-center gap-2">
                <iconify-icon icon="solar:buildings-bold" class="fs-5 text-white"></iconify-icon>
                <h5 class="mb-0 text-white fw-bold">Empresas Asignadas</h5>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center border-0"
                  @click="themeStore.toggleTheme"
                  :title="themeStore.themeMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                  style="width: 36px; height: 36px;"
                >
                  <iconify-icon :icon="themeStore.themeMode === 'dark' ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'" class="fs-5 text-white"></iconify-icon>
                </button>
                <button
                  class="btn btn-sm btn-danger d-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
                  @click="logout"
                  title="Cerrar sesión"
                >
                  <iconify-icon icon="solar:logout-2-line-duotone" class="fs-5"></iconify-icon>
                  <span class="fw-semibold">Cerrar Sesión</span>
                </button>
              </div>
            </div>
            <div class="card-body p-4">
              <!-- Estado de Carga -->
              <div v-if="companyStore.loading" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <p class="text-muted mt-2">Cargando empresas disponibles...</p>
              </div>

              <!-- Estado de Error de Conexión -->
              <div v-else-if="fetchError" class="alert alert-danger p-4 rounded-4 text-center">
                <iconify-icon icon="solar:danger-triangle-bold-duotone" class="display-5 text-danger mb-2"></iconify-icon>
                <h5 class="text-danger fw-bold">No se pudieron cargar las empresas</h5>
                <p class="mb-3">{{ fetchError }}</p>
                <button class="btn btn-outline-danger rounded-pill px-4" @click="fetchCompanies">
                  <iconify-icon icon="solar:refresh-line-duotone" class="me-1"></iconify-icon>
                  Reintentar conexión
                </button>
              </div>

              <!-- Lista de Empresas -->
              <div v-else class="row g-3">
                <div v-if="companies.length === 0" class="col-12 text-center py-5">
                  <div class="p-4 bg-dark-subtle rounded-4 border border-secondary-subtle d-inline-block">
                    <iconify-icon icon="solar:buildings-2-linear" class="display-3 text-secondary mb-3"></iconify-icon>
                    <h4 class="mb-2" style="color: var(--bs-text-title);">No se encontraron empresas</h4>
                    <p class="text-secondary fs-3 mb-3">Aún no hay empresas registradas o asociadas a tu cuenta.</p>
                    <div class="d-flex justify-content-center gap-2">
                      <button class="btn btn-primary rounded-pill px-4" @click="router.push('/configuracion')">
                        Ir a Configuración para crear empresa
                      </button>
                      <button class="btn btn-outline-secondary rounded-pill px-4" @click="router.push('/dashboard')">
                        Ir al Dashboard
                      </button>
                    </div>
                  </div>
                </div>

                <div class="col-lg-4 col-md-6" v-for="company in companies" :key="company.id">
                  <div
                    class="card border-top border-info alert-dismissible fade show alert p-0 card-hover rounded-4"
                    :style="{
                      cursor: loadingCompanyId === company.id ? 'wait' : 'pointer',
                      opacity: loadingCompanyId && loadingCompanyId !== company.id ? '0.6' : '1'
                    }"
                    @click="loadingCompanyId ? null : selectCompany(company)"
                  >
                    <div class="card-body">
                      <div class="d-flex align-items-center justify-content-between">
                        <div>
                          <div class="d-flex align-items-center gap-2 mb-1">
                            <h4 class="card-title fs-4 mb-0">{{ company.razon_social }}</h4>
                            <span
                              class="badge rounded-pill px-2 py-0 fs-1 d-inline-flex align-items-center gap-1"
                              :class="(company as any).sri_environment === '2' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'"
                            >
                              <iconify-icon :icon="(company as any).sri_environment === '2' ? 'solar:shield-check-bold' : 'solar:test-tube-minimalistic-bold-duotone'"></iconify-icon>
                              {{ (company as any).sri_environment === '2' ? 'Producción' : 'Pruebas' }}
                            </span>
                          </div>
                          <p class="card-subtitle">{{ company.ruc }}</p>
                          <p class="card-subtitle text-muted">{{ company.nombre_comercial }}</p>
                        </div>
                        <span class="text-primary display-6">
                          <div v-if="loadingCompanyId === company.id" class="spinner-grow text-info" role="status">
                            <span class="visually-hidden">Cargando...</span>
                          </div>
                          <iconify-icon v-else icon="solar:buildings-3-line-duotone" class="text-primary fs-8"></iconify-icon>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="dark-transparent sidebartoggler"></div>
  </div>

  <Teleport to="body">
    <div
      v-if="showBranchesModal"
      class="modal fade show d-block"
      style="background: rgba(0, 0, 0, 0.65); z-index: 1055;"
      tabindex="-1"
      @click.self="showBranchesModal = false"
    >
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div class="modal-content rounded-4 shadow-lg border-0">

          <!-- HEADER -->
          <div class="modal-header bg-primary text-white">
            <div>
              <h5 class="modal-title text-white mb-0">Sucursales Disponibles</h5>
              <small class="text-white-50" v-if="selectedCompany">
                {{ selectedCompany.razon_social }} (RUC: {{ selectedCompany.ruc }})
              </small>
            </div>
            <button type="button" class="btn-close btn-close-white" @click="showBranchesModal = false"></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4">
            <div v-if="branchStore.loading" class="text-center py-5">
              <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
              </div>
              <p class="text-muted mt-2 mb-0">Cargando sucursales...</p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-primary">
                  <tr>
                    <th width="15%">Código</th>
                    <th width="40%">Nombre</th>
                    <th width="30%">Dirección</th>
                    <th width="15%" class="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="branch in branches"
                    :key="branch.id"
                    style="cursor: pointer;"
                    @click="selectBranch(branch)"
                  >
                    <td>
                      <span class="badge bg-primary-subtle text-primary fw-bold">{{ branch.code }}</span>
                    </td>
                    <td class="fw-semibold">{{ branch.name }}</td>
                    <td class="text-muted">{{ branch.address }}</td>
                    <td class="text-end">
                      <button
                        class="btn btn-sm btn-primary rounded-pill px-3"
                        @click.stop="selectBranch(branch)"
                      >
                        Ingresar
                      </button>
                    </td>
                  </tr>
                  <tr v-if="branches.length === 0">
                    <td colspan="4" class="text-center text-muted py-4">
                      No hay sucursales registradas para esta empresa.
                      <div class="mt-2">
                        <button class="btn btn-sm btn-outline-primary" @click="selectBranch(null)">
                          Continuar al Dashboard
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- FOOTER PAGINADO -->
          <div class="modal-footer d-flex justify-content-between">
            <button class="btn btn-outline-secondary" :disabled="page === 1" @click="prevPage">
              Anterior
            </button>
            <span class="fw-semibold text-muted">
              Página {{ page }}
            </span>
            <button class="btn btn-outline-primary" :disabled="page * limit >= total" @click="nextPage">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
