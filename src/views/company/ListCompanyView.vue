<script setup lang="ts">
import { useBranchStore, useListCompanyUserStore } from '@/stores/ListCompanyUser.store'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

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

const logout = () => {
  authStore.logout()
  router.replace('/login')
}


// ===============================
// EMPRESAS
// ===============================
const fetchError = ref<string | null>(null)
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

    // Si tiene sucursales disponibles, abrir modal para seleccionar
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

<template>
  <div id="main-wrapper" class="d-flex">
    <!-- Sidebar Start -->
    <aside class="left-sidebar with-vertical d-flex flex-column justify-content-between">
      <div>
        <div class="brand-logo d-flex align-items-center justify-content-between p-3 border-bottom border-translucent">
          <a class="text-nowrap logo-img d-flex align-items-center text-decoration-none">
            <img src="/controller/images/logos/logo-dark.svg" class="dark-logo" alt="Logo-Dark" height="34" />
            <img src="/controller/images/logos/logo-light.svg" class="light-logo" alt="Logo-Light" height="34" />
          </a>
          <a href="javascript:void(0)" class="sidebartoggler ms-auto text-decoration-none fs-5 d-block d-xl-none">
            <i class="ti ti-x"></i>
          </a>
        </div>

        <div class="scroll-sidebar p-3" style="max-height: calc(100vh - 160px); overflow-y: auto;">
          <!-- Sidebar navigation-->
          <nav class="sidebar-nav">
            <ul id="sidebarnav" class="mb-0 list-unstyled">
              <!-- Home -->
              <li class="nav-small-cap">
                <iconify-icon icon="solar:menu-dots-bold-duotone" class="nav-small-cap-icon fs-5"></iconify-icon>
                <span class="hide-menu">Home</span>
              </li>
              <li class="sidebar-item mb-1">
                <a class="sidebar-link primary-hover-bg cursor-pointer" href="javascript:void(0)" @click="router.push('/dashboard')">
                  <span class="aside-icon p-2 bg-primary-subtle text-primary rounded-1">
                    <iconify-icon icon="solar:screencast-2-line-duotone" class="fs-6"></iconify-icon>
                  </span>
                  <span class="hide-menu ps-1">Dashboard</span>
                </a>
              </li>
              <li class="sidebar-item mb-1">
                <a class="sidebar-link primary-hover-bg cursor-pointer" href="javascript:void(0)" @click="router.push('/configuracion')">
                  <span class="aside-icon p-2 bg-info-subtle text-info rounded-1">
                    <iconify-icon icon="solar:settings-line-duotone" class="fs-6"></iconify-icon>
                  </span>
                  <span class="hide-menu ps-1">Configuración</span>
                </a>
              </li>
              <li class="sidebar-item mt-3 pt-3 border-top border-dark-subtle">
                <a class="sidebar-link text-danger d-flex align-items-center gap-2 cursor-pointer" href="javascript:void(0)" @click="logout">
                  <span class="aside-icon p-2 bg-danger-subtle text-danger rounded-1">
                    <iconify-icon icon="solar:logout-2-line-duotone" class="fs-6"></iconify-icon>
                  </span>
                  <span class="hide-menu ps-1 fw-semibold">Cerrar Sesión</span>
                </a>
              </li>
            </ul>
          </nav>
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
                <div class="spinner-border text-primary" role="status"></div>
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
                    <h4 class="text-white mb-2">No se encontraron empresas</h4>
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
                          <div v-if="loadingCompanyId === company.id" class="spinner-border text-info" role="status">
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
              <div class="spinner-border text-primary" role="status"></div>
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
