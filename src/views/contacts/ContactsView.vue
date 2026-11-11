<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getProviders,
  createProvider,
  updateProvider,
  toggleProviderStatus,
  getSellers,
  createSeller,
  updateSeller,
  toggleSellerStatus,
  type CustomerItem,
  type ProviderItem,
  type SellerItem,
} from '@/services/contacts.service'

const route = useRoute()
const router = useRouter()

// Pestaña activa ('clientes' | 'proveedores' | 'vendedores')
const activeTab = ref<'clientes' | 'proveedores' | 'vendedores'>('clientes')

// Estado de carga y mensajes
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// Empresa seleccionada
const selectedCompany = ref<any>(null)
const currentCompanyId = computed(() => selectedCompany.value?.id || 1)

// Listas de datos en memoria
const customers = ref<CustomerItem[]>([])
const providers = ref<ProviderItem[]>([])
const sellers = ref<SellerItem[]>([])

// Filtros y búsquedas
const searchCustomer = ref('')
const statusFilterCustomer = ref<'todos' | 'activo' | 'inactivo'>('todos')

const searchProvider = ref('')
const statusFilterProvider = ref<'todos' | 'activo' | 'inactivo'>('todos')

const searchSeller = ref('')
const statusFilterSeller = ref<'todos' | 'activo' | 'inactivo'>('todos')

// Modales de Crear / Editar
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const showCustomerModal = ref(false)
const showProviderModal = ref(false)
const showSellerModal = ref(false)
// Mientras un formulario de registro/edición está abierto se muestra como página y se oculta el listado
const isFormOpen = computed(() => showCustomerModal.value || showProviderModal.value || showSellerModal.value)
watch(isFormOpen, async (open) => {
  if (open) {
    await nextTick()
    document.getElementById('form-page')?.scrollIntoView({ block: 'start' })
  }
})

// Modales de Ver Detalle
const showViewCustomerModal = ref(false)
const showViewProviderModal = ref(false)
const showViewSellerModal = ref(false)

const viewingCustomer = ref<CustomerItem | null>(null)
const viewingProvider = ref<ProviderItem | null>(null)
const viewingSeller = ref<SellerItem | null>(null)

// Formularios
const formCustomer = ref({
  tipo_documento: '05' as '04' | '05' | '06' | '07',
  num_document: '',
  razon_social: '',
  nombre_comercial: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  estado: 'activo' as 'activo' | 'inactivo',
})

const formProvider = ref({
  tipo_documento: '04' as '04' | '05' | '06',
  num_document: '',
  razon_social: '',
  nombre_comercial: '',
  email: '',
  telefono: '',
  direccion: '',
  forma_pago: 'credito_30' as 'contado' | 'credito_15' | 'credito_30' | 'credito_60' | 'transferencia',
  banco: '',
  num_cuenta: '',
  estado: 'activo' as 'activo' | 'inactivo',
})

const formSeller = ref({
  tipo_documento: '05' as '05' | '04' | '06',
  num_document: '',
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  comision_pct: 5.0,
  estado: 'activo' as 'activo' | 'inactivo',
})

// Carga de datos
const loadData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'clientes') {
      customers.value = await getCustomers(currentCompanyId.value)
    } else if (activeTab.value === 'proveedores') {
      providers.value = await getProviders(currentCompanyId.value)
    } else if (activeTab.value === 'vendedores') {
      sellers.value = await getSellers(currentCompanyId.value)
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: 'clientes' | 'proveedores' | 'vendedores') => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  loadData()
}

// Sincronizar pestaña activa con ruta
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && ['clientes', 'proveedores', 'vendedores'].includes(newTab as string)) {
      activeTab.value = newTab as any
      loadData()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  const comp = localStorage.getItem('selectedCompany')
  if (comp) {
    try {
      selectedCompany.value = JSON.parse(comp)
    } catch (e) {}
  }
  loadData()
})

// ==========================================
// FILTROS COMPUTADOS
// ==========================================
const filteredCustomers = computed(() => {
  const q = searchCustomer.value.toLowerCase().trim()
  return customers.value.filter((item) => {
    const matchText =
      !q ||
      item.num_document.toLowerCase().includes(q) ||
      item.razon_social.toLowerCase().includes(q) ||
      (item.nombre_comercial && item.nombre_comercial.toLowerCase().includes(q)) ||
      item.email.toLowerCase().includes(q) ||
      item.telefono.includes(q)
    const matchStatus =
      statusFilterCustomer.value === 'todos' || item.estado === statusFilterCustomer.value
    return matchText && matchStatus
  })
})

const filteredProviders = computed(() => {
  const q = searchProvider.value.toLowerCase().trim()
  return providers.value.filter((item) => {
    const matchText =
      !q ||
      item.num_document.toLowerCase().includes(q) ||
      item.razon_social.toLowerCase().includes(q) ||
      (item.nombre_comercial && item.nombre_comercial.toLowerCase().includes(q)) ||
      item.email.toLowerCase().includes(q) ||
      item.telefono.includes(q)
    const matchStatus =
      statusFilterProvider.value === 'todos' || item.estado === statusFilterProvider.value
    return matchText && matchStatus
  })
})

const filteredSellers = computed(() => {
  const q = searchSeller.value.toLowerCase().trim()
  return sellers.value.filter((item) => {
    const fullName = `${item.nombres} ${item.apellidos}`.toLowerCase()
    const matchText =
      !q ||
      item.num_document.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.telefono.includes(q)
    const matchStatus =
      statusFilterSeller.value === 'todos' || item.estado === statusFilterSeller.value
    return matchText && matchStatus
  })
})

// ==========================================
// OPERACIONES: CLIENTE
// ==========================================
const openCreateCustomer = () => {
  isEditMode.value = false
  editingId.value = null
  formCustomer.value = {
    tipo_documento: '05',
    num_document: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: 'activo',
  }
  showCustomerModal.value = true
}

const openEditCustomer = (c: CustomerItem) => {
  isEditMode.value = true
  editingId.value = c.id
  formCustomer.value = {
    tipo_documento: c.tipo_documento,
    num_document: c.num_document,
    razon_social: c.razon_social,
    nombre_comercial: c.nombre_comercial || '',
    email: c.email,
    telefono: c.telefono,
    direccion: c.direccion,
    ciudad: c.ciudad || '',
    estado: c.estado,
  }
  showCustomerModal.value = true
}

const openViewCustomer = (c: CustomerItem) => {
  viewingCustomer.value = c
  showViewCustomerModal.value = true
}

const saveCustomer = async () => {
  if (!formCustomer.value.num_document || !formCustomer.value.razon_social) {
    errorMsg.value = 'El número de documento y la razón social son obligatorios.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    if (isEditMode.value && editingId.value) {
      await updateCustomer(editingId.value, formCustomer.value, currentCompanyId.value)
      successMsg.value = 'Cliente actualizado exitosamente.'
    } else {
      await createCustomer(
        {
          ...formCustomer.value,
          company_id: currentCompanyId.value,
        },
        currentCompanyId.value
      )
      successMsg.value = 'Cliente registrado exitosamente.'
    }
    showCustomerModal.value = false
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al guardar cliente'
  } finally {
    loading.value = false
  }
}

const actionProcessingId = ref<number | null>(null)

const handleToggleCustomerStatus = async (c: CustomerItem) => {
  actionProcessingId.value = c.id
  try {
    const updated = await toggleCustomerStatus(c.id, currentCompanyId.value)
    successMsg.value = `Cliente "${updated.razon_social}" ahora está ${updated.estado.toUpperCase()}.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cambiar estado'
  } finally {
    actionProcessingId.value = null
  }
}

// ==========================================
// OPERACIONES: PROVEEDOR
// ==========================================
const openCreateProvider = () => {
  isEditMode.value = false
  editingId.value = null
  formProvider.value = {
    tipo_documento: '04',
    num_document: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
    direccion: '',
    forma_pago: 'credito_30',
    banco: '',
    num_cuenta: '',
    estado: 'activo',
  }
  showProviderModal.value = true
}

const openEditProvider = (p: ProviderItem) => {
  isEditMode.value = true
  editingId.value = p.id
  formProvider.value = {
    tipo_documento: p.tipo_documento,
    num_document: p.num_document,
    razon_social: p.razon_social,
    nombre_comercial: p.nombre_comercial || '',
    email: p.email,
    telefono: p.telefono,
    direccion: p.direccion,
    forma_pago: p.forma_pago,
    banco: p.banco || '',
    num_cuenta: p.num_cuenta || '',
    estado: p.estado,
  }
  showProviderModal.value = true
}

const openViewProvider = (p: ProviderItem) => {
  viewingProvider.value = p
  showViewProviderModal.value = true
}

const saveProvider = async () => {
  if (!formProvider.value.num_document || !formProvider.value.razon_social) {
    errorMsg.value = 'El RUC/Documento y la razón social son obligatorios.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    if (isEditMode.value && editingId.value) {
      await updateProvider(editingId.value, formProvider.value, currentCompanyId.value)
      successMsg.value = 'Proveedor actualizado exitosamente.'
    } else {
      await createProvider(
        {
          ...formProvider.value,
          company_id: currentCompanyId.value,
        },
        currentCompanyId.value
      )
      successMsg.value = 'Proveedor registrado exitosamente.'
    }
    showProviderModal.value = false
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al guardar proveedor'
  } finally {
    loading.value = false
  }
}

const handleToggleProviderStatus = async (p: ProviderItem) => {
  actionProcessingId.value = p.id
  try {
    const updated = await toggleProviderStatus(p.id, currentCompanyId.value)
    successMsg.value = `Proveedor "${updated.razon_social}" ahora está ${updated.estado.toUpperCase()}.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cambiar estado'
  } finally {
    actionProcessingId.value = null
  }
}

// ==========================================
// OPERACIONES: VENDEDOR
// ==========================================
const openCreateSeller = () => {
  isEditMode.value = false
  editingId.value = null
  formSeller.value = {
    tipo_documento: '05',
    num_document: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    comision_pct: 5.0,
    estado: 'activo',
  }
  showSellerModal.value = true
}

const openEditSeller = (s: SellerItem) => {
  isEditMode.value = true
  editingId.value = s.id
  formSeller.value = {
    tipo_documento: s.tipo_documento,
    num_document: s.num_document,
    nombres: s.nombres,
    apellidos: s.apellidos,
    email: s.email,
    telefono: s.telefono,
    direccion: s.direccion || '',
    comision_pct: s.comision_pct,
    estado: s.estado,
  }
  showSellerModal.value = true
}

const openViewSeller = (s: SellerItem) => {
  viewingSeller.value = s
  showViewSellerModal.value = true
}

const saveSeller = async () => {
  if (!formSeller.value.num_document || !formSeller.value.nombres || !formSeller.value.apellidos) {
    errorMsg.value = 'El documento, nombres y apellidos del vendedor son obligatorios.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    if (isEditMode.value && editingId.value) {
      await updateSeller(editingId.value, formSeller.value, currentCompanyId.value)
      successMsg.value = 'Vendedor actualizado exitosamente.'
    } else {
      await createSeller(
        {
          ...formSeller.value,
          company_id: currentCompanyId.value,
        },
        currentCompanyId.value
      )
      successMsg.value = 'Vendedor registrado exitosamente.'
    }
    showSellerModal.value = false
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al guardar vendedor'
  } finally {
    loading.value = false
  }
}

const handleToggleSellerStatus = async (s: SellerItem) => {
  actionProcessingId.value = s.id
  try {
    const updated = await toggleSellerStatus(s.id, currentCompanyId.value)
    successMsg.value = `Vendedor "${updated.nombres} ${updated.apellidos}" ahora está ${updated.estado.toUpperCase()}.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cambiar estado'
  } finally {
    actionProcessingId.value = null
  }
}

// Helpers visuales
const docTypeLabel = (type: string) => {
  switch (type) {
    case '04':
      return 'RUC'
    case '05':
      return 'Cédula'
    case '06':
      return 'Pasaporte'
    case '07':
      return 'Consumidor Final'
    default:
      return type
  }
}

const paymentLabel = (p: string) => {
  switch (p) {
    case 'contado':
      return 'Contado'
    case 'credito_15':
      return 'Crédito 15 días'
    case 'credito_30':
      return 'Crédito 30 días'
    case 'credito_60':
      return 'Crédito 60 días'
    case 'transferencia':
      return 'Transferencia bancaria'
    default:
      return p
  }
}
</script>

<template>
  <div class="contacts-page" :class="{ 'form-open': isFormOpen }">
    <!-- ENCABEZADO DE MÓDULO GENERAL -->
    <div class="card rounded-4 border-0 shadow-sm p-4 mb-4 bg-navy-card keep-in-form">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
              <iconify-icon icon="solar:users-group-two-rounded-line-duotone" class="fs-6"></iconify-icon>
            </span>
            <h4 class="fw-bold text-white mb-0">Gestión de Contactos & Terceros</h4>
          </div>
          <p class="text-secondary fs-3 mb-0">
            Módulo general para administrar Clientes, Proveedores y Vendedores del sistema.
          </p>
        </div>

        <!-- Indicador de contexto de empresa -->
        <div class="d-flex align-items-center gap-2 bg-dark-subtle px-3 py-2 rounded-3 border border-secondary-subtle">
          <iconify-icon icon="solar:buildings-3-line-duotone" class="text-primary fs-5"></iconify-icon>
          <div>
            <small class="text-secondary d-block fs-1">Empresa Activa:</small>
            <span class="text-white fw-bold fs-2">
              {{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'Deskounta' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ALERTS DE RETROALIMENTACIÓN -->
      <div v-if="successMsg" class="alert alert-success mt-3 mb-0 rounded-3 alert-dismissible fade show" role="alert">
        <iconify-icon icon="solar:check-circle-line-duotone" class="me-2 fs-5 align-middle"></iconify-icon>
        {{ successMsg }}
        <button type="button" class="btn-close" @click="successMsg = ''"></button>
      </div>
      <div v-if="errorMsg" class="alert alert-danger mt-3 mb-0 rounded-3 alert-dismissible fade show" role="alert">
        <iconify-icon icon="solar:danger-circle-line-duotone" class="me-2 fs-5 align-middle"></iconify-icon>
        {{ errorMsg }}
        <button type="button" class="btn-close" @click="errorMsg = ''"></button>
      </div>

      <!-- PESTAÑAS TIPO PILLS (SUB-MÓDULOS) -->
      <ul v-show="!isFormOpen" class="nav nav-pills user-profile-tab mt-4 border-top border-dark-subtle pt-3" role="tablist">
        <!-- SUB-MODULO CLIENTES -->
        <li class="nav-item me-2">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'clientes', 'text-white-50 hover-tab': activeTab !== 'clientes' }"
            @click="switchTab('clientes')"
          >
            <iconify-icon icon="solar:user-circle-line-duotone" class="fs-5"></iconify-icon>
            <span>Clientes</span>
            <span class="badge bg-dark-subtle text-info ms-1">{{ customers.length }}</span>
          </button>
        </li>

        <!-- SUB-MODULO PROVEEDORES -->
        <li class="nav-item me-2">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'proveedores', 'text-white-50 hover-tab': activeTab !== 'proveedores' }"
            @click="switchTab('proveedores')"
          >
            <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-5"></iconify-icon>
            <span>Proveedores</span>
            <span class="badge bg-dark-subtle text-warning ms-1">{{ providers.length }}</span>
          </button>
        </li>

        <!-- SUB-MODULO VENDEDORES -->
        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'vendedores', 'text-white-50 hover-tab': activeTab !== 'vendedores' }"
            @click="switchTab('vendedores')"
          >
            <iconify-icon icon="solar:user-id-line-duotone" class="fs-5"></iconify-icon>
            <span>Vendedores</span>
            <span class="badge bg-dark-subtle text-success ms-1">{{ sellers.length }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- ============================================================= -->
    <!-- SUB-MÓDULO: CLIENTES -->
    <!-- ============================================================= -->
    <div v-if="activeTab === 'clientes'">
      <div class="card rounded-4 border-0 shadow-sm bg-navy-card">
        <!-- Barra de herramientas (Búsqueda, filtro y botón Nuevo) -->
        <div class="card-header bg-transparent border-bottom border-dark-subtle p-4">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
              <!-- Buscador -->
              <div class="input-group search-input-box" style="max-width: 320px;">
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">
                  <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
                </span>
                <input
                  v-model="searchCustomer"
                  type="text"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  placeholder="Buscar por documento o nombre..."
                />
              </div>

              <!-- Filtro de Estado -->
              <select
                v-model="statusFilterCustomer"
                class="form-select bg-dark-subtle border-secondary-subtle text-white"
                style="max-width: 160px;"
              >
                <option value="todos">Todos (Estado)</option>
                <option value="activo">Solo Activos</option>
                <option value="inactivo">Solo Inactivos</option>
              </select>
            </div>

            <!-- Botón Crear Nuevo Cliente -->
            <button class="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 rounded-3" @click="openCreateCustomer">
              <iconify-icon icon="solar:user-plus-line-duotone" class="fs-5"></iconify-icon>
              <span class="fw-semibold">Nuevo Cliente</span>
            </button>
          </div>
        </div>

        <!-- Tabla de Clientes -->
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table align-middle text-nowrap mb-0 table-hover">
              <thead class="table-primary fs-2">
                <tr>
                  <th class="ps-4">DOCUMENTO</th>
                  <th>RAZÓN SOCIAL / CLIENTE</th>
                  <th>CONTACTO</th>
                  <th>DIRECCIÓN</th>
                  <th class="text-center">ESTADO</th>
                  <th class="text-end pe-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="6" class="text-center py-5">
                    <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                      <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                      <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                    </div>
                    <span class="text-secondary small">Cargando clientes...</span>
                  </td>
                </tr>

                <tr v-else-if="filteredCustomers.length === 0">
                  <td colspan="6" class="text-center py-5 text-secondary">
                    <iconify-icon icon="solar:ghost-line-duotone" class="fs-8 mb-2 d-block"></iconify-icon>
                    No se encontraron clientes con los filtros seleccionados.
                  </td>
                </tr>

                <tr
                  v-for="c in filteredCustomers"
                  :key="c.id"
                  class="border-bottom border-dark-subtle"
                  :class="{ 'opacity-75': c.estado === 'inactivo' }"
                >
                  <!-- Documento -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-1">
                        {{ docTypeLabel(c.tipo_documento) }}
                      </span>
                      <span class="text-white fw-bold font-monospace">{{ c.num_document }}</span>
                    </div>
                  </td>

                  <!-- Razón Social -->
                  <td>
                    <div class="d-flex flex-column">
                      <span class="text-white fw-semibold">{{ c.razon_social }}</span>
                      <small v-if="c.nombre_comercial" class="text-secondary fs-1">
                        {{ c.nombre_comercial }}
                      </small>
                    </div>
                  </td>

                  <!-- Contacto -->
                  <td>
                    <div class="d-flex flex-column gap-1">
                      <span class="text-white-50 fs-2 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:phone-line-duotone" class="text-info"></iconify-icon>
                        {{ c.telefono || 'Sin teléfono' }}
                      </span>
                      <span class="text-white-50 fs-2 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:letter-line-duotone" class="text-warning"></iconify-icon>
                        {{ c.email || 'Sin correo' }}
                      </span>
                    </div>
                  </td>

                  <!-- Dirección -->
                  <td>
                    <span class="text-secondary fs-2 text-wrap" style="max-width: 220px; display: inline-block;">
                      {{ c.direccion || 'S/N' }} {{ c.ciudad ? `(${c.ciudad})` : '' }}
                    </span>
                  </td>

                  <!-- Estado -->
                  <td class="text-center">
                    <span
                      class="badge px-3 py-1 rounded-pill fs-1 fw-bold"
                      :class="c.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                    >
                      <iconify-icon
                        :icon="c.estado === 'activo' ? 'solar:check-circle-line-duotone' : 'solar:close-circle-line-duotone'"
                        class="me-1 align-middle"
                      ></iconify-icon>
                      {{ c.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group gap-1" role="group">
                      <!-- Ver Detalle -->
                      <button
                        class="btn btn-sm btn-dark-subtle text-info border-0 p-2 rounded-2"
                        title="Ver detalle completo"
                        @click="openViewCustomer(c)"
                      >
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-4"></iconify-icon>
                      </button>

                      <!-- Editar -->
                      <button
                        class="btn btn-sm btn-dark-subtle text-primary border-0 p-2 rounded-2"
                        title="Editar información"
                        @click="openEditCustomer(c)"
                      >
                        <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-4"></iconify-icon>
                      </button>

                      <!-- Habilitar / Deshabilitar -->
                      <button
                        class="btn btn-sm btn-dark-subtle border-0 p-2 rounded-2"
                        :class="c.estado === 'activo' ? 'text-warning' : 'text-success'"
                        :disabled="actionProcessingId === c.id"
                        :title="c.estado === 'activo' ? 'Deshabilitar cliente' : 'Habilitar cliente'"
                        @click="handleToggleCustomerStatus(c)"
                      >
                        <span v-if="actionProcessingId === c.id" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
                        <iconify-icon
                          v-else
                          :icon="c.estado === 'activo' ? 'solar:pause-circle-line-duotone' : 'solar:play-circle-line-duotone'"
                          class="fs-4"
                        ></iconify-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- SUB-MÓDULO: PROVEEDORES -->
    <!-- ============================================================= -->
    <div v-else-if="activeTab === 'proveedores'">
      <div class="card rounded-4 border-0 shadow-sm bg-navy-card">
        <!-- Barra de herramientas -->
        <div class="card-header bg-transparent border-bottom border-dark-subtle p-4">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
              <!-- Buscador -->
              <div class="input-group search-input-box" style="max-width: 320px;">
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">
                  <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
                </span>
                <input
                  v-model="searchProvider"
                  type="text"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  placeholder="Buscar por RUC o empresa..."
                />
              </div>

              <!-- Filtro de Estado -->
              <select
                v-model="statusFilterProvider"
                class="form-select bg-dark-subtle border-secondary-subtle text-white"
                style="max-width: 160px;"
              >
                <option value="todos">Todos (Estado)</option>
                <option value="activo">Solo Activos</option>
                <option value="inactivo">Solo Inactivos</option>
              </select>
            </div>

            <!-- Botón Crear Nuevo Proveedor -->
            <button class="btn btn-warning text-dark d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold" @click="openCreateProvider">
              <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-5"></iconify-icon>
              <span>Nuevo Proveedor</span>
            </button>
          </div>
        </div>

        <!-- Tabla de Proveedores -->
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table align-middle text-nowrap mb-0 table-hover">
              <thead class="table-primary fs-2">
                <tr>
                  <th class="ps-4">RUC / DOCUMENTO</th>
                  <th>RAZÓN SOCIAL / EMPRESA</th>
                  <th>CONTACTO</th>
                  <th>CONDICIÓN PAGO</th>
                  <th>BANCO / CUENTA</th>
                  <th class="text-center">ESTADO</th>
                  <th class="text-end pe-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="7" class="text-center py-5">
                    <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                      <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                      <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                    </div>
                    <span class="text-secondary small">Cargando proveedores...</span>
                  </td>
                </tr>

                <tr v-else-if="filteredProviders.length === 0">
                  <td colspan="7" class="text-center py-5 text-secondary">
                    <iconify-icon icon="solar:ghost-line-duotone" class="fs-8 mb-2 d-block"></iconify-icon>
                    No se encontraron proveedores registrados.
                  </td>
                </tr>

                <tr
                  v-for="p in filteredProviders"
                  :key="p.id"
                  class="border-bottom border-dark-subtle"
                  :class="{ 'opacity-75': p.estado === 'inactivo' }"
                >
                  <!-- Documento -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge bg-warning-subtle text-warning border border-warning-subtle fs-1">
                        {{ docTypeLabel(p.tipo_documento) }}
                      </span>
                      <span class="text-white fw-bold font-monospace">{{ p.num_document }}</span>
                    </div>
                  </td>

                  <!-- Razón Social -->
                  <td>
                    <div class="d-flex flex-column">
                      <span class="text-white fw-semibold">{{ p.razon_social }}</span>
                      <small v-if="p.nombre_comercial" class="text-secondary fs-1">
                        {{ p.nombre_comercial }}
                      </small>
                    </div>
                  </td>

                  <!-- Contacto -->
                  <td>
                    <div class="d-flex flex-column gap-1">
                      <span class="text-white-50 fs-2 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:phone-line-duotone" class="text-info"></iconify-icon>
                        {{ p.telefono || 'Sin teléfono' }}
                      </span>
                      <span class="text-white-50 fs-2 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:letter-line-duotone" class="text-warning"></iconify-icon>
                        {{ p.email || 'Sin correo' }}
                      </span>
                    </div>
                  </td>

                  <!-- Forma de Pago -->
                  <td>
                    <span class="badge bg-dark-subtle text-white-50 border border-secondary-subtle px-2 py-1 fs-1">
                      {{ paymentLabel(p.forma_pago) }}
                    </span>
                  </td>

                  <!-- Banco y Cuenta -->
                  <td>
                    <div v-if="p.banco" class="d-flex flex-column">
                      <span class="text-white fs-2">{{ p.banco }}</span>
                      <small class="text-secondary fs-1 font-monospace">{{ p.num_cuenta || 'N/A' }}</small>
                    </div>
                    <span v-else class="text-secondary fs-2">No especificado</span>
                  </td>

                  <!-- Estado -->
                  <td class="text-center">
                    <span
                      class="badge px-3 py-1 rounded-pill fs-1 fw-bold"
                      :class="p.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                    >
                      <iconify-icon
                        :icon="p.estado === 'activo' ? 'solar:check-circle-line-duotone' : 'solar:close-circle-line-duotone'"
                        class="me-1 align-middle"
                      ></iconify-icon>
                      {{ p.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group gap-1" role="group">
                      <!-- Ver Detalle -->
                      <button
                        class="btn btn-sm btn-dark-subtle text-info border-0 p-2 rounded-2"
                        title="Ver detalle completo"
                        @click="openViewProvider(p)"
                      >
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-4"></iconify-icon>
                      </button>

                      <!-- Editar -->
                      <button
                        class="btn btn-sm btn-dark-subtle text-primary border-0 p-2 rounded-2"
                        title="Editar información"
                        @click="openEditProvider(p)"
                      >
                        <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-4"></iconify-icon>
                      </button>

                      <!-- Habilitar / Deshabilitar -->
                      <button
                        class="btn btn-sm btn-dark-subtle border-0 p-2 rounded-2"
                        :class="p.estado === 'activo' ? 'text-warning' : 'text-success'"
                        :disabled="actionProcessingId === p.id"
                        :title="p.estado === 'activo' ? 'Deshabilitar proveedor' : 'Habilitar proveedor'"
                        @click="handleToggleProviderStatus(p)"
                      >
                        <span v-if="actionProcessingId === p.id" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
                        <iconify-icon
                          v-else
                          :icon="p.estado === 'activo' ? 'solar:pause-circle-line-duotone' : 'solar:play-circle-line-duotone'"
                          class="fs-4"
                        ></iconify-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- SUB-MÓDULO: VENDEDORES -->
    <!-- ============================================================= -->
    <div v-else-if="activeTab === 'vendedores'">
      <div class="card rounded-4 border-0 shadow-sm bg-navy-card">
        <!-- Barra de herramientas -->
        <div class="card-header bg-transparent border-bottom border-dark-subtle p-4">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
              <!-- Buscador -->
              <div class="input-group search-input-box" style="max-width: 320px;">
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">
                  <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
                </span>
                <input
                  v-model="searchSeller"
                  type="text"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  placeholder="Buscar vendedor por cédula o nombre..."
                />
              </div>

              <!-- Filtro de Estado -->
              <select
                v-model="statusFilterSeller"
                class="form-select bg-dark-subtle border-secondary-subtle text-white"
                style="max-width: 160px;"
              >
                <option value="todos">Todos (Estado)</option>
                <option value="activo">Solo Activos</option>
                <option value="inactivo">Solo Inactivos</option>
              </select>
            </div>

            <!-- Botón Crear Nuevo Vendedor -->
            <button class="btn btn-success d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold" @click="openCreateSeller">
              <iconify-icon icon="solar:user-plus-line-duotone" class="fs-5"></iconify-icon>
              <span>Nuevo Vendedor</span>
            </button>
          </div>
        </div>

        <!-- Tabla de Vendedores -->
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table align-middle text-nowrap mb-0 table-hover">
              <thead class="table-primary fs-2">
                <tr>
                  <th class="ps-4">CÉDULA / DOC</th>
                  <th>VENDEDOR</th>
                  <th>CONTACTO</th>
                  <th>DIRECCIÓN</th>
                  <th class="text-center">COMISIÓN</th>
                  <th class="text-center">ESTADO</th>
                  <th class="text-end pe-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="7" class="text-center py-5">
                    <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                      <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                      <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                    </div>
                    <span class="text-secondary small">Cargando vendedores...</span>
                  </td>
                </tr>

                <tr v-else-if="filteredSellers.length === 0">
                  <td colspan="7" class="text-center py-5 text-secondary">
                    <iconify-icon icon="solar:ghost-line-duotone" class="fs-8 mb-2 d-block"></iconify-icon>
                    No se encontraron vendedores registrados.
                  </td>
                </tr>

                <tr
                  v-for="s in filteredSellers"
                  :key="s.id"
                  class="border-bottom border-dark-subtle"
                  :class="{ 'opacity-75': s.estado === 'inactivo' }"
                >
                  <!-- Documento -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge bg-success-subtle text-success border border-success-subtle fs-1">
                        {{ docTypeLabel(s.tipo_documento) }}
                      </span>
                      <span class="text-white fw-bold font-monospace">{{ s.num_document }}</span>
                    </div>
                  </td>

                  <!-- Vendedor -->
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 34px; height: 34px;">
                        {{ s.nombres.charAt(0) }}{{ s.apellidos.charAt(0) }}
                      </div>
                      <div class="d-flex flex-column">
                        <span class="text-white fw-semibold">{{ s.nombres }} {{ s.apellidos }}</span>
                        <small class="text-secondary fs-1">Asesor Comercial</small>
                      </div>
                    </div>
                  </td>

                  <!-- Contacto -->
                  <td>
                    <div class="d-flex flex-column gap-1">
                      <span class="text-white-50 fs-2 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:phone-line-duotone" class="text-info"></iconify-icon>
                        {{ s.telefono || 'Sin teléfono' }}
                      </span>
                      <span class="text-white-50 fs-2 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:letter-line-duotone" class="text-warning"></iconify-icon>
                        {{ s.email || 'Sin correo' }}
                      </span>
                    </div>
                  </td>

                  <!-- Dirección -->
                  <td>
                    <span class="text-secondary fs-2 text-wrap" style="max-width: 200px; display: inline-block;">
                      {{ s.direccion || 'No especificada' }}
                    </span>
                  </td>

                  <!-- Comisión % -->
                  <td class="text-center">
                    <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 fs-2 fw-bold">
                      {{ s.comision_pct }}%
                    </span>
                  </td>

                  <!-- Estado -->
                  <td class="text-center">
                    <span
                      class="badge px-3 py-1 rounded-pill fs-1 fw-bold"
                      :class="s.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                    >
                      <iconify-icon
                        :icon="s.estado === 'activo' ? 'solar:check-circle-line-duotone' : 'solar:close-circle-line-duotone'"
                        class="me-1 align-middle"
                      ></iconify-icon>
                      {{ s.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group gap-1" role="group">
                      <!-- Ver Detalle -->
                      <button
                        class="btn btn-sm btn-dark-subtle text-info border-0 p-2 rounded-2"
                        title="Ver detalle completo"
                        @click="openViewSeller(s)"
                      >
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-4"></iconify-icon>
                      </button>

                      <!-- Editar -->
                      <button
                        class="btn btn-sm btn-dark-subtle text-primary border-0 p-2 rounded-2"
                        title="Editar información"
                        @click="openEditSeller(s)"
                      >
                        <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-4"></iconify-icon>
                      </button>

                      <!-- Habilitar / Deshabilitar -->
                      <button
                        class="btn btn-sm btn-dark-subtle border-0 p-2 rounded-2"
                        :class="s.estado === 'activo' ? 'text-warning' : 'text-success'"
                        :disabled="actionProcessingId === s.id"
                        :title="s.estado === 'activo' ? 'Deshabilitar vendedor' : 'Habilitar vendedor'"
                        @click="handleToggleSellerStatus(s)"
                      >
                        <span v-if="actionProcessingId === s.id" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
                        <iconify-icon
                          v-else
                          :icon="s.estado === 'activo' ? 'solar:pause-circle-line-duotone' : 'solar:play-circle-line-duotone'"
                          class="fs-4"
                        ></iconify-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL CREAR / EDITAR CLIENTE -->
    <!-- ============================================================= -->
    <div v-if="showCustomerModal" id="form-page" class="form-page">
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-primary-subtle text-primary rounded-3">
              <iconify-icon :icon="isEditMode ? 'solar:pen-new-square-line-duotone' : 'solar:user-plus-line-duotone'" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">
              {{ isEditMode ? 'Editar Cliente' : 'Registrar Nuevo Cliente' }}
            </h5>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showCustomerModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="saveCustomer">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Documento</label>
              <select v-model="formCustomer.tipo_documento" class="form-select bg-dark-subtle border-secondary-subtle text-white" required>
                <option value="05">Cédula (05)</option>
                <option value="04">RUC (04)</option>
                <option value="06">Pasaporte (06)</option>
                <option value="07">Consumidor Final (07)</option>
              </select>
            </div>

            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Número Documento *</label>
              <input
                v-model="formCustomer.num_document"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="Ej. 1718293847"
                required
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre / Razón Social *</label>
              <input
                v-model="formCustomer.razon_social"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Nombre completo o Razón Social"
                required
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre Comercial (Opcional)</label>
              <input
                v-model="formCustomer.nombre_comercial"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Ej. Comercial Los Andes"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono / Celular</label>
              <input
                v-model="formCustomer.telefono"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="0991234567"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico</label>
              <input
                v-model="formCustomer.email"
                type="email"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="cliente@correo.com"
              />
            </div>

            <div class="col-md-8">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección</label>
              <input
                v-model="formCustomer.direccion"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Calle principal y secundaria"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">Ciudad</label>
              <input
                v-model="formCustomer.ciudad"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Quito"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Estado</label>
              <select v-model="formCustomer.estado" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
            <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showCustomerModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
              <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
              <span>{{ loading ? (isEditMode ? 'Actualizando Cliente...' : 'Guardando Cliente...') : (isEditMode ? 'Actualizar Cliente' : 'Guardar Cliente') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL CREAR / EDITAR PROVEEDOR -->
    <!-- ============================================================= -->
    <div v-if="showProviderModal" id="form-page" class="form-page">
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-warning-subtle text-warning rounded-3">
              <iconify-icon :icon="isEditMode ? 'solar:pen-new-square-line-duotone' : 'solar:box-minimalistic-line-duotone'" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">
              {{ isEditMode ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor' }}
            </h5>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showProviderModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="saveProvider">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Documento</label>
              <select v-model="formProvider.tipo_documento" class="form-select bg-dark-subtle border-secondary-subtle text-white" required>
                <option value="04">RUC (04)</option>
                <option value="05">Cédula (05)</option>
                <option value="06">Pasaporte (06)</option>
              </select>
            </div>

            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Número Documento / RUC *</label>
              <input
                v-model="formProvider.num_document"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="Ej. 1790013820001"
                required
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Razón Social / Empresa *</label>
              <input
                v-model="formProvider.razon_social"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Nombre legal de la empresa proveedora"
                required
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre Comercial</label>
              <input
                v-model="formProvider.nombre_comercial"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Marca o nombre comercial"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono de Contacto</label>
              <input
                v-model="formProvider.telefono"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="022999888"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo de Pagos / Ventas</label>
              <input
                v-model="formProvider.email"
                type="email"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="pagos@proveedor.com"
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección</label>
              <input
                v-model="formProvider.direccion"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Dirección fiscal o almacén"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">Forma de Pago</label>
              <select v-model="formProvider.forma_pago" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="contado">Contado</option>
                <option value="credito_15">Crédito 15 días</option>
                <option value="credito_30">Crédito 30 días</option>
                <option value="credito_60">Crédito 60 días</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">Banco (Opcional)</label>
              <input
                v-model="formProvider.banco"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Ej. Banco Pichincha"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">N° Cuenta Bancaria</label>
              <input
                v-model="formProvider.num_cuenta"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="2100xxxxxx"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Estado</label>
              <select v-model="formProvider.estado" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
            <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showProviderModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-warning text-dark px-4 rounded-3 fw-bold" :disabled="loading">
              <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
              <span>{{ loading ? (isEditMode ? 'Actualizando Proveedor...' : 'Guardando Proveedor...') : (isEditMode ? 'Actualizar Proveedor' : 'Guardar Proveedor') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL CREAR / EDITAR VENDEDOR -->
    <!-- ============================================================= -->
    <div v-if="showSellerModal" id="form-page" class="form-page">
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-success-subtle text-success rounded-3">
              <iconify-icon :icon="isEditMode ? 'solar:pen-new-square-line-duotone' : 'solar:user-id-line-duotone'" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">
              {{ isEditMode ? 'Editar Vendedor' : 'Registrar Nuevo Vendedor' }}
            </h5>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showSellerModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="saveSeller">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Documento</label>
              <select v-model="formSeller.tipo_documento" class="form-select bg-dark-subtle border-secondary-subtle text-white" required>
                <option value="05">Cédula (05)</option>
                <option value="04">RUC (04)</option>
                <option value="06">Pasaporte (06)</option>
              </select>
            </div>

            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Número Documento *</label>
              <input
                v-model="formSeller.num_document"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="Ej. 1720394857"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombres *</label>
              <input
                v-model="formSeller.nombres"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Nombres completos"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Apellidos *</label>
              <input
                v-model="formSeller.apellidos"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Apellidos completos"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono / Celular</label>
              <input
                v-model="formSeller.telefono"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="0992345678"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico</label>
              <input
                v-model="formSeller.email"
                type="email"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="vendedor@empresa.com"
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección Residencial</label>
              <input
                v-model="formSeller.direccion"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Sector o calles de domicilio"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Porcentaje de Comisión (%)</label>
              <div class="input-group">
                <input
                  v-model.number="formSeller.comision_pct"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  placeholder="5.0"
                />
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">%</span>
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Estado</label>
              <select v-model="formSeller.estado" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
            <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showSellerModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success px-4 rounded-3 fw-bold" :disabled="loading">
              <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
              <span>{{ loading ? (isEditMode ? 'Actualizando Vendedor...' : 'Guardando Vendedor...') : (isEditMode ? 'Actualizar Vendedor' : 'Guardar Vendedor') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: VER DETALLE DE CLIENTE -->
    <!-- ============================================================= -->
    <div v-if="showViewCustomerModal && viewingCustomer" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-lg" style="max-width: 580px; width: 95%;">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-info-subtle text-info rounded-3">
              <iconify-icon icon="solar:eye-line-duotone" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">Detalle del Cliente</h5>
          </div>
          <button class="btn btn-link text-white-50 p-0" @click="showViewCustomerModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <div class="p-3 bg-dark-subtle rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 48px; height: 48px;">
              {{ viewingCustomer.razon_social.charAt(0) }}
            </div>
            <div>
              <h6 class="text-white fw-bold mb-1">{{ viewingCustomer.razon_social }}</h6>
              <span class="text-secondary fs-2 font-monospace">{{ docTypeLabel(viewingCustomer.tipo_documento) }}: {{ viewingCustomer.num_document }}</span>
            </div>
          </div>
          <span
            class="badge px-3 py-2 rounded-pill fs-1 fw-bold"
            :class="viewingCustomer.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
          >
            {{ viewingCustomer.estado === 'activo' ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="row g-3 fs-2">
          <div class="col-6">
            <span class="text-secondary d-block">Nombre Comercial:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.nombre_comercial || 'No especificado' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Ciudad:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.ciudad || 'No especificada' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Teléfono:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.telefono || 'Sin teléfono' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Correo Electrónico:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.email || 'Sin correo' }}</span>
          </div>
          <div class="col-12">
            <span class="text-secondary d-block">Dirección Fiscal:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.direccion || 'S/N' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Fecha de Registro:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.created_at }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">ID Sistema:</span>
            <span class="text-white fw-medium">#{{ viewingCustomer.id }}</span>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
          <button
            class="btn btn-outline-primary px-3 rounded-3 d-flex align-items-center gap-1"
            @click="showViewCustomerModal = false; openEditCustomer(viewingCustomer)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Editar</span>
          </button>
          <button class="btn btn-secondary px-4 rounded-3" @click="showViewCustomerModal = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: VER DETALLE DE PROVEEDOR -->
    <!-- ============================================================= -->
    <div v-if="showViewProviderModal && viewingProvider" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-lg" style="max-width: 580px; width: 95%;">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-warning-subtle text-warning rounded-3">
              <iconify-icon icon="solar:eye-line-duotone" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">Detalle del Proveedor</h5>
          </div>
          <button class="btn btn-link text-white-50 p-0" @click="showViewProviderModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <div class="p-3 bg-dark-subtle rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 48px; height: 48px;">
              {{ viewingProvider.razon_social.charAt(0) }}
            </div>
            <div>
              <h6 class="text-white fw-bold mb-1">{{ viewingProvider.razon_social }}</h6>
              <span class="text-secondary fs-2 font-monospace">{{ docTypeLabel(viewingProvider.tipo_documento) }}: {{ viewingProvider.num_document }}</span>
            </div>
          </div>
          <span
            class="badge px-3 py-2 rounded-pill fs-1 fw-bold"
            :class="viewingProvider.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
          >
            {{ viewingProvider.estado === 'activo' ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="row g-3 fs-2">
          <div class="col-6">
            <span class="text-secondary d-block">Nombre Comercial:</span>
            <span class="text-white fw-medium">{{ viewingProvider.nombre_comercial || 'No especificado' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Condición de Pago:</span>
            <span class="badge bg-dark-subtle text-warning border border-warning-subtle px-2 py-1">
              {{ paymentLabel(viewingProvider.forma_pago) }}
            </span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Teléfono:</span>
            <span class="text-white fw-medium">{{ viewingProvider.telefono || 'Sin teléfono' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Correo Electrónico:</span>
            <span class="text-white fw-medium">{{ viewingProvider.email || 'Sin correo' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Banco:</span>
            <span class="text-white fw-medium">{{ viewingProvider.banco || 'No especificado' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Cuenta Bancaria:</span>
            <span class="text-white fw-medium font-monospace">{{ viewingProvider.num_cuenta || 'No especificada' }}</span>
          </div>
          <div class="col-12">
            <span class="text-secondary d-block">Dirección:</span>
            <span class="text-white fw-medium">{{ viewingProvider.direccion || 'S/N' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Fecha de Registro:</span>
            <span class="text-white fw-medium">{{ viewingProvider.created_at }}</span>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
          <button
            class="btn btn-outline-warning text-warning px-3 rounded-3 d-flex align-items-center gap-1"
            @click="showViewProviderModal = false; openEditProvider(viewingProvider)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Editar</span>
          </button>
          <button class="btn btn-secondary px-4 rounded-3" @click="showViewProviderModal = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: VER DETALLE DE VENDEDOR -->
    <!-- ============================================================= -->
    <div v-if="showViewSellerModal && viewingSeller" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-lg" style="max-width: 580px; width: 95%;">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-success-subtle text-success rounded-3">
              <iconify-icon icon="solar:eye-line-duotone" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">Detalle del Vendedor</h5>
          </div>
          <button class="btn btn-link text-white-50 p-0" @click="showViewSellerModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <div class="p-3 bg-dark-subtle rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 48px; height: 48px;">
              {{ viewingSeller.nombres.charAt(0) }}{{ viewingSeller.apellidos.charAt(0) }}
            </div>
            <div>
              <h6 class="text-white fw-bold mb-1">{{ viewingSeller.nombres }} {{ viewingSeller.apellidos }}</h6>
              <span class="text-secondary fs-2 font-monospace">{{ docTypeLabel(viewingSeller.tipo_documento) }}: {{ viewingSeller.num_document }}</span>
            </div>
          </div>
          <span
            class="badge px-3 py-2 rounded-pill fs-1 fw-bold"
            :class="viewingSeller.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
          >
            {{ viewingSeller.estado === 'activo' ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="row g-3 fs-2">
          <div class="col-6">
            <span class="text-secondary d-block">Porcentaje Comisión:</span>
            <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 fs-2 fw-bold">
              {{ viewingSeller.comision_pct }}%
            </span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Cargo:</span>
            <span class="text-white fw-medium">Asesor Comercial</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Teléfono / Celular:</span>
            <span class="text-white fw-medium">{{ viewingSeller.telefono || 'Sin teléfono' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Correo Electrónico:</span>
            <span class="text-white fw-medium">{{ viewingSeller.email || 'Sin correo' }}</span>
          </div>
          <div class="col-12">
            <span class="text-secondary d-block">Dirección Domiciliaria:</span>
            <span class="text-white fw-medium">{{ viewingSeller.direccion || 'No especificada' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Fecha de Registro:</span>
            <span class="text-white fw-medium">{{ viewingSeller.created_at }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">ID Vendedor:</span>
            <span class="text-white fw-medium">#{{ viewingSeller.id }}</span>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
          <button
            class="btn btn-outline-success text-success px-3 rounded-3 d-flex align-items-center gap-1"
            @click="showViewSellerModal = false; openEditSeller(viewingSeller)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Editar</span>
          </button>
          <button class="btn btn-secondary px-4 rounded-3" @click="showViewSellerModal = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-page {
  animation: fadeIn 0.25s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-navy-card {
  background-color: #1a2234 !important;
}

.hover-tab {
  transition: all 0.2s ease;
}

.hover-tab:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff !important;
}

/* Modales personalizados */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog-custom {
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: scaleUp 0.2s ease-out;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Formularios de registro/edición como página (no modal): al abrirse reemplazan al listado */
.form-open > :not(.form-page):not(.keep-in-form) {
  display: none !important;
}
.form-page {
  width: 100%;
  scroll-margin-top: 110px; /* deja libre la barra superior fija */
}
.form-page-card {
  max-width: none;
  margin: 0 auto;
}
.form-page-card-lg {
  max-width: none;
}
</style>
