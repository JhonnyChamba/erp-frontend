<script setup lang="ts">
import { useBranchStore, useListCompanyUserStore } from '@/stores/ListCompanyUser.store'
import { ref, onMounted, computed } from 'vue'

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
const selectedCompanyId = ref<number | null>(null)

// ✅ Usamos el estado del store (NO refs duplicadas)
const branches = computed(() => branchStore.branches)
const page = computed(() => branchStore.page)
const total = computed(() => branchStore.total)
const limit = computed(() => branchStore.limit)


// ===============================
// EMPRESAS
// ===============================
const fetchCompanies = async () => {
  try {
    const response = await companyStore.fetchCompanies({ page: 1, limit: 100 })
    console.log(response);
    console.log(response.data);

    companies.value = response.data.map((item: any) => ({
      id: item.company.id,
      razon_social: item.company.business_name,
      ruc: item.company.ruc,
      nombre_comercial: item.company.trade_name
    }))

  } catch (error) {
    console.error('Error al obtener empresas', error)
  }
}


// ===============================
// SUCURSALES
// ===============================
const selectCompany = async (companyId: number) => {
  selectedCompanyId.value = companyId
  showBranchesModal.value = true // 🔥 primero abrimos

  try {
    await branchStore.fetchBranches({
      companyId,
      page: 1,
      limit: 10
    })
  } catch (error) {
    console.error(error)
  }
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


const selectModule = async (companyId: number) => {
  selectedCompanyId.value = companyId
  showBranchesModal.value = true // 🔥 primero abrimos

  try {
    await branchStore.fetchBranches({
      companyId,
      page: 1,
      limit: 10
    })
  } catch (error) {
    console.error(error)
  }
}
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
              <a class="sidebar-link sidebar-link primary-hover-bg" href="" id="get-url" aria-expanded="false">
                <span class="aside-icon p-2 bg-primary-subtle rounded-1">
                  <iconify-icon icon="solar:screencast-2-line-duotone" class="fs-6"></iconify-icon>
                </span>
                <span class="hide-menu ps-1">Dashboard</span>
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
            <div class="card-header text-bg-primary">
              <h5 class="mb-0 text-white">Empresas</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-lg-4 mb-3" v-for="company in companies" :key="company.id">
                  <div class="card border-top border-info alert-dismissible fade show alert p-0 card-hover rounded-4"
                    @click="selectCompany(company.id)">
                    <div class="card-body">
                      <div class="d-flex align-items-center justify-content-between">
                        <div>
                          <h4 class="card-title fs-4">{{ company.razon_social }}</h4>
                          <p class="card-subtitle">{{ company.ruc }}</p>
                          <p class="card-subtitle">{{ company.nombre_comercial }}</p>
                        </div>
                        <span class="text-dark display-6">
                          <i class="fas fa-building"></i>
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
    <div v-if="showBranchesModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.6);">
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
        <div class="modal-content rounded-4 shadow-lg">

          <!-- HEADER -->
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Sucursales</h5>
            <button type="button" class="btn-close btn-close-white" @click="showBranchesModal = false"></button>
          </div>

          <!-- BODY -->
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-dark">
                  <tr>
                    <th width="20%">Código</th>
                    <th width="40%">Nombre</th>
                    <th width="40%">Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="branch in branches" :key="branch.id" style="cursor:pointer"
                    @click="selectModule(1)">
                    <td>{{ branch.code }}</td>
                    <td>{{ branch.name }}</td>
                    <td>{{ branch.address }}</td>
                  </tr>
                  <tr v-if="branches.length === 0">
                    <td colspan="3" class="text-center text-muted">
                      No hay sucursales registradas
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
            <span class="fw-semibold">
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
