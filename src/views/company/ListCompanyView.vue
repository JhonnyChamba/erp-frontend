<script setup lang="ts">
import { useBranchStore, useListCompanyUserStore } from '@/stores/ListCompanyUser.store'
import { useAuthStore } from '@/stores/auth.store'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

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
const fetchCompanies = async () => {
  try {
    await companyStore.fetchCompanies({ page: 1, limit: 100 })
    companies.value = companyStore.companies
  } catch (error) {
    console.error('Error al obtener empresas', error)
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

const selectBranch = (branch: any) => {
  if (selectedCompany.value) {
    localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany.value))
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
  background: white;
  width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
}
</style>

<template>
  <div id="main-wrapper">
    <!-- Sidebar Start -->
    <aside class="left-sidebar with-vertical">
      <!-- ---------------------------------- -->
      <!-- Start Vertical Layout Sidebar -->
      <!-- ---------------------------------- -->
      <div class="brand-logo d-flex align-items-center justify-content-between">
        <a class="text-nowrap logo-img">
          <img src="/controller/images/logos/logo-light.svg" class="dark-logo" alt="Logo-Dark" />
          <!-- <img src="/controller/images/logos/logo-dark.svg" class="light-logo" alt="Logo-light" /> -->
        </a>
        <a href="javascript:void(0)" class="sidebartoggler ms-auto text-decoration-none fs-5 d-block d-xl-none">
          <i class="ti ti-x"></i>
        </a>
      </div>

      <div class="scroll-sidebar" data-simplebar>
        <!-- Sidebar navigation-->
        <nav class="sidebar-nav">
          <ul id="sidebarnav" class="mb-0">
            <!-- ============================= -->
            <!-- Home -->
            <!-- ============================= -->
            <li class="nav-small-cap">
              <iconify-icon icon="solar:menu-dots-bold-duotone" class="nav-small-cap-icon fs-5"></iconify-icon>
              <span class="hide-menu">Home</span>
            </li>
            <li class="sidebar-item">
              <a class="sidebar-link primary-hover-bg cursor-pointer" href="javascript:void(0)" @click="router.push('/dashboard')" id="get-url" aria-expanded="false">
                <span class="aside-icon p-2 bg-primary-subtle rounded-1">
                  <iconify-icon icon="solar:screencast-2-line-duotone" class="fs-6"></iconify-icon>
                </span>
                <span class="hide-menu ps-1">Dashboard</span>
              </a>
            </li>
            <li class="sidebar-item">
              <a class="sidebar-link primary-hover-bg cursor-pointer" href="javascript:void(0)" @click="router.push('/configuracion')" aria-expanded="false">
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
        <!-- End Sidebar navigation -->
      </div>

      <!-- ---------------------------------- -->
      <!-- Start Vertical Layout Sidebar -->
      <!-- ---------------------------------- -->
    </aside>
    <!--  Sidebar End -->
    <div class="page-wrapper">
      <div class="body-wrapper">
        <div class="container-fluid">
          <div class="card">
            <div class="card-header text-bg-primary d-flex align-items-center justify-content-between py-3 px-4">
              <div class="d-flex align-items-center gap-2">
                <iconify-icon icon="solar:buildings-bold" class="fs-5 text-white"></iconify-icon>
                <h5 class="mb-0 text-white fw-bold">Empresas Asignadas</h5>
              </div>
              <button
                class="btn btn-sm btn-danger d-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
                @click="logout"
                title="Cerrar sesión"
              >
                <iconify-icon icon="solar:logout-2-line-duotone" class="fs-5"></iconify-icon>
                <span class="fw-semibold">Cerrar Sesión</span>
              </button>
            </div>
            <div class="card-body">
              <div class="row">
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

                <div class="col-lg-4 mb-3" v-for="company in companies" :key="company.id">
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
                          <h4 class="card-title fs-4">{{ company.razon_social }}</h4>
                          <p class="card-subtitle">{{ company.ruc }}</p>
                          <p class="card-subtitle text-muted">{{ company.nombre_comercial }}</p>
                        </div>
                        <span class="text-primary display-6">
                          <div v-if="loadingCompanyId === company.id" class="spinner-border text-info" role="status">
                            <span class="visually-hidden">Cargando...</span>
                          </div>
                          <i v-else class="fas fa-building text-dark"></i>
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
                <thead class="table-dark">
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
                    <td class="fw-semibold text-dark">{{ branch.name }}</td>
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
