<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  getEmployeeCategories,
  type EmployeeItem,
  type EmployeeCategoryItem,
} from '@/services/hr.service'
import { getBranches, getUsers, getRoles, type BranchItem, type UserItem, type RoleItem } from '@/services/config.service'
import { getDocumentTypes, type DocumentTypeItem } from '@/services/document-types.service'
import AppSelect2 from '@/components/common/AppSelect2.vue'
import { toast } from '@/utils/toastr'

const authStore = useAuthStore()

const getActiveCompanyId = (): number => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) {
      const parsed = JSON.parse(raw)
      const id = Number(parsed?.companyId || parsed?.company?.id || parsed?.id)
      if (!Number.isNaN(id) && id > 0) return id
    }
  } catch {}
  return Number(authStore.accessInfo?.companyId || authStore.tokenPayload?.company_id || 1)
}

// Estados generales
const loading = ref(false)
const saving = ref(false)

// Listados
const employeesList = ref<EmployeeItem[]>([])
const categoriesList = ref<EmployeeCategoryItem[]>([])
const branchesList = ref<BranchItem[]>([])
const docTypesList = ref<DocumentTypeItem[]>([])
const usersList = ref<UserItem[]>([])
const rolesList = ref<RoleItem[]>([])

// Filtros
const search = ref('')
const filterCategory = ref<number | null>(null)
const filterBranch = ref<number | null>(null)
const filterOnlySpa = ref(false)
const filterStatus = ref<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS')

// Paleta de colores para agenda de citas / Spa
const CALENDAR_COLORS = [
  '#0085db', // Azul primario
  '#ec4899', // Rosa / Fucsia (Uñas / Estética)
  '#8b5cf6', // Púrpura / Lavanda
  '#10b981', // Verde esmeralda
  '#06b6d4', // Cyan
  '#f59e0b', // Ámbar / Dorado
  '#ef4444', // Coral / Rojo
  '#6366f1', // Índigo
]

// Modal / Formulario de Empleado
const isEmployeeFormOpen = ref(false)
const isEditingEmployee = ref(false)
const editingEmployeeId = ref<number | null>(null)

const employeeForm = ref({
  first_name: '',
  last_name: '',
  id_type: '05',
  id_number: '',
  birth_date: '',
  gender: 'Femenino',
  phone: '',
  email: '',
  address: '',
  branch_id: null as number | null,
  category_id: null as number | null,
  hire_date: new Date().toISOString().split('T')[0],
  contract_type: 'INDEFINIDO',
  base_salary: 460.0,
  payment_frequency: 'MENSUAL',
  bank_name: '',
  bank_account_type: 'AHORROS',
  bank_account_number: '',
  iess_affiliation_code: '',
  accepts_appointments: true,
  calendar_color: '#ec4899',
  commission_rate: 40.0,
  status: 'ACTIVO',
  // Acceso y Usuario ERP
  enable_system_user: false,
  user_mode: 'create' as 'create' | 'link',
  user_id: null as number | null,
  user_email: '',
  user_password: '',
  user_role_id: null as number | null,
})

// Cargar Datos
const loadData = async () => {
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const [emp, cats, brs, dts, usrs, rls] = await Promise.all([
      getEmployees(companyId).catch(() => []),
      getEmployeeCategories(companyId).catch(() => []),
      getBranches(companyId).catch(() => []),
      getDocumentTypes({ active: true }).catch(() => []),
      getUsers(companyId).catch(() => []),
      getRoles(companyId).catch(() => []),
    ])
    employeesList.value = emp
    categoriesList.value = cats
    branchesList.value = Array.isArray(brs) ? brs : (brs as any)?.data || []
    docTypesList.value = dts
    usersList.value = Array.isArray(usrs?.data) ? usrs.data : Array.isArray(usrs) ? usrs : []
    rolesList.value = Array.isArray(rls?.data) ? rls.data : Array.isArray(rls) ? rls : []
  } catch (err: any) {
    toast.error('Error al cargar datos de Talento Humano', 'Error')
  } finally {
    loading.value = false
  }
}

// Opciones Select2
const categoryOptions = computed(() => [
  { value: null, label: '-- Seleccionar Cargo / Especialidad --' },
  ...categoriesList.value.filter((c) => c.active).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.default_commission_rate}% com.)`,
  })),
])

const filterCategoryOptions = computed(() => [
  { value: null, label: 'Todos los cargos' },
  ...categoriesList.value.map((c) => ({
    value: c.id,
    label: c.name,
  })),
])

const branchOptions = computed(() => [
  { value: null, label: '-- Sucursal Principal (Matriz) --' },
  ...branchesList.value.map((b) => ({
    value: b.id,
    label: `${b.code} - ${b.name}`,
  })),
])

const filterBranchOptions = computed(() => [
  { value: null, label: 'Todas las sucursales' },
  ...branchesList.value.map((b) => ({
    value: b.id,
    label: `${b.code} - ${b.name}`,
  })),
])

const docTypeOptions = computed(() => {
  if (docTypesList.value.length === 0) {
    return [
      { value: '05', label: 'Cédula de Identidad (05)' },
      { value: '04', label: 'RUC (04)' },
      { value: '06', label: 'Pasaporte (06)' },
    ]
  }
  return docTypesList.value.map((dt) => ({
    value: dt.code,
    label: `${dt.name} (${dt.code})`,
  }))
})

// Al seleccionar cargo en formulario, sugerir su comisión por defecto si está en 0
watch(
  () => employeeForm.value.category_id,
  (newId) => {
    if (newId && !isEditingEmployee.value) {
      const cat = categoriesList.value.find((c) => c.id === newId)
      if (cat && cat.default_commission_rate > 0) {
        employeeForm.value.commission_rate = cat.default_commission_rate
      }
    }
  }
)

// Filtrado de Empleados
const filteredEmployees = computed(() => {
  return employeesList.value.filter((e) => {
    if (filterOnlySpa.value && !e.accepts_appointments) return false
    if (filterCategory.value && e.category_id !== filterCategory.value) return false
    if (filterBranch.value && e.branch_id !== filterBranch.value) return false
    if (filterStatus.value !== 'TODOS' && e.status !== filterStatus.value) return false

    if (search.value.trim()) {
      const term = search.value.toLowerCase().trim()
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase()
      const doc = (e.id_number || '').toLowerCase()
      const catName = (e.category?.name || '').toLowerCase()
      return fullName.includes(term) || doc.includes(term) || catName.includes(term)
    }
    return true
  })
})

// Acciones de Empleado
const openCreateEmployee = () => {
  isEditingEmployee.value = false
  editingEmployeeId.value = null
  employeeForm.value = {
    first_name: '',
    last_name: '',
    id_type: '05',
    id_number: '',
    birth_date: '',
    gender: 'Femenino',
    phone: '',
    email: '',
    address: '',
    branch_id: branchesList.value[0]?.id || null,
    category_id: categoriesList.value[0]?.id || null,
    hire_date: new Date().toISOString().split('T')[0]!,
    contract_type: 'INDEFINIDO',
    base_salary: 460.0,
    payment_frequency: 'MENSUAL',
    bank_name: '',
    bank_account_type: 'AHORROS',
    bank_account_number: '',
    iess_affiliation_code: '',
    accepts_appointments: true,
    calendar_color: '#ec4899',
    commission_rate: categoriesList.value[0]?.default_commission_rate || 40.0,
    status: 'ACTIVO',
    // Acceso y Usuario ERP
    enable_system_user: false,
    user_mode: 'create',
    user_id: null,
    user_email: '',
    user_password: '',
    user_role_id: rolesList.value[0]?.id || null,
  }
  isEmployeeFormOpen.value = true
}

const openEditEmployee = (emp: EmployeeItem) => {
  isEditingEmployee.value = true
  editingEmployeeId.value = emp.id
  employeeForm.value = {
    first_name: emp.first_name,
    last_name: emp.last_name,
    id_type: emp.id_type || '05',
    id_number: emp.id_number,
    birth_date: emp.birth_date ? String(emp.birth_date).split('T')[0]! : '',
    gender: emp.gender || 'Femenino',
    phone: emp.phone || '',
    email: emp.email || '',
    address: emp.address || '',
    branch_id: emp.branch_id || null,
    category_id: emp.category_id || null,
    hire_date: emp.hire_date ? String(emp.hire_date).split('T')[0]! : new Date().toISOString().split('T')[0]!,
    contract_type: emp.contract_type || 'INDEFINIDO',
    base_salary: Number(emp.base_salary || 0),
    payment_frequency: emp.payment_frequency || 'MENSUAL',
    bank_name: emp.bank_name || '',
    bank_account_type: emp.bank_account_type || 'AHORROS',
    bank_account_number: emp.bank_account_number || '',
    iess_affiliation_code: emp.iess_affiliation_code || '',
    accepts_appointments: emp.accepts_appointments,
    calendar_color: emp.calendar_color || '#ec4899',
    commission_rate: Number(emp.commission_rate || 0),
    status: emp.status || 'ACTIVO',
    // Acceso y Usuario ERP
    enable_system_user: Boolean(emp.user_id || emp.user),
    user_mode: emp.user_id ? 'link' : 'create',
    user_id: emp.user_id || emp.user?.id || null,
    user_email: emp.user?.email || emp.email || '',
    user_password: '',
    user_role_id: emp.user?.role?.id || rolesList.value[0]?.id || null,
  }
  isEmployeeFormOpen.value = true
}

const saveEmployee = async () => {
  if (!employeeForm.value.first_name || !employeeForm.value.last_name || !employeeForm.value.id_number) {
    toast.warning('Por favor completa los nombres, apellidos y número de identificación.', 'Campos Requeridos')
    return
  }
  if (!employeeForm.value.category_id) {
    toast.warning('Debes seleccionar un cargo o especialidad para el colaborador.', 'Cargo Requerido')
    return
  }

  // Validaciones de usuario si está activo el switch
  if (employeeForm.value.enable_system_user) {
    if (employeeForm.value.user_mode === 'create') {
      if (!employeeForm.value.user_email || !employeeForm.value.user_email.includes('@')) {
        toast.warning('Debes ingresar un correo electrónico válido para crear el usuario de acceso.', 'Usuario ERP Requerido')
        return
      }
      if (!isEditingEmployee.value && (!employeeForm.value.user_password || employeeForm.value.user_password.length < 4)) {
        toast.warning('Debes asignar una contraseña de acceso de al menos 4 caracteres.', 'Contraseña Requerida')
        return
      }
    } else if (employeeForm.value.user_mode === 'link') {
      if (!employeeForm.value.user_id) {
        toast.warning('Debes seleccionar un usuario del sistema existente para homologar.', 'Usuario Requerido')
        return
      }
    }
  }

  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    const payload: any = {
      ...employeeForm.value,
      base_salary: Number(employeeForm.value.base_salary || 0),
      commission_rate: Number(employeeForm.value.commission_rate || 0),
    }

    if (employeeForm.value.enable_system_user) {
      if (employeeForm.value.user_mode === 'create') {
        payload.create_user_account = true
        payload.user_email = employeeForm.value.user_email.trim()
        payload.user_password = employeeForm.value.user_password
        payload.user_role_id = employeeForm.value.user_role_id || undefined
        payload.user_id = undefined
      } else {
        payload.create_user_account = false
        payload.user_id = Number(employeeForm.value.user_id)
      }
    } else {
      payload.create_user_account = false
      payload.user_id = null
    }

    if (isEditingEmployee.value && editingEmployeeId.value) {
      await updateEmployee(editingEmployeeId.value, payload, companyId)
      toast.success('Colaborador actualizado exitosamente.', 'Talento Humano')
    } else {
      await createEmployee(payload, companyId)
      toast.success('Colaborador registrado exitosamente.', 'Talento Humano')
    }

    isEmployeeFormOpen.value = false
    await loadData()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar el colaborador', 'Error')
  } finally {
    saving.value = false
  }
}

const onToggleEmployeeStatus = async (emp: EmployeeItem) => {
  const companyId = getActiveCompanyId()
  try {
    await toggleEmployeeStatus(emp.id, companyId)
    emp.status = emp.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    toast.success(`Estado de ${emp.first_name} ${emp.last_name} actualizado a ${emp.status}.`)
  } catch (err: any) {
    toast.error('Error al cambiar estado del colaborador.')
  }
}

const onDeleteEmployee = async (emp: EmployeeItem) => {
  if (!confirm(`¿Estás seguro de eliminar a ${emp.first_name} ${emp.last_name}?`)) return
  const companyId = getActiveCompanyId()
  try {
    await deleteEmployee(emp.id, companyId)
    toast.success('Colaborador eliminado del registro.')
    await loadData()
  } catch (err: any) {
    toast.error('Error al eliminar colaborador.')
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="crud-page hr-page" :class="{ 'form-open': isEmployeeFormOpen }">
    <!-- Top Header -->
    <div class="crud-page-header keep-in-form">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
            MOD-007 · TALENTO HUMANO
          </span>
          <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace">
            REGISTRO DE PERSONAL
          </span>
        </div>
        <h2 class="crud-title">Registro de Empleados y Colaboradores</h2>
        <p class="crud-subtitle">
          Administración de colaboradores, especialistas de belleza, asignación de sucursal y comisiones por servicio.
        </p>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- LISTADO DE COLABORADORES / EMPLEADOS                     -->
    <!-- ======================================================== -->
    <template v-if="!isEmployeeFormOpen">
      <!-- Barra de Filtros y Acciones -->
      <div class="card rounded-4 border border-secondary-subtle bg-navy-card p-3 mb-4 shadow-sm">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <!-- Buscador -->
            <div class="input-group" style="width: 250px;">
              <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary" style="height: 40px;">
                <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
              </span>
              <input
                v-model="search"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                style="height: 40px;"
                placeholder="Buscar colaborador..."
              />
            </div>

            <!-- Filtro Cargo -->
            <div style="width: 200px;">
              <AppSelect2
                v-model="filterCategory"
                :options="filterCategoryOptions"
                placeholder="Todos los cargos"
              />
            </div>

            <!-- Filtro Sucursal -->
            <div style="width: 200px;">
              <AppSelect2
                v-model="filterBranch"
                :options="filterBranchOptions"
                placeholder="Todas las sucursales"
              />
            </div>

            <!-- Switch Solo Especialistas Spa -->
            <button
              class="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
              :class="filterOnlySpa ? 'btn-pink text-white' : 'btn-outline-secondary'"
              style="height: 40px;"
              @click="filterOnlySpa = !filterOnlySpa"
            >
              <iconify-icon icon="solar:scissors-square-bold-duotone" class="fs-4"></iconify-icon>
              <span>{{ filterOnlySpa ? '★ Solo Spa / Citas' : 'Filtrar Spa / Citas' }}</span>
            </button>
          </div>

          <!-- Botón Nuevo Colaborador -->
          <button
            class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2 fw-semibold text-nowrap"
            style="height: 40px;"
            @click="openCreateEmployee"
          >
            <iconify-icon icon="solar:user-plus-line-duotone" class="fs-4"></iconify-icon>
            <span>Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Colaboradores -->
      <div class="card rounded-4 border border-secondary-subtle bg-navy-card p-3 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
                <th>Colaborador</th>
                <th>Cargo / Especialidad</th>
                <th>Sucursal</th>
                <th class="text-center">Agenda / Spa</th>
                <th class="text-center">Comisión (%)</th>
                <th class="text-end">Sueldo Base</th>
                <th class="text-center">Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="text-center py-5">
                  <div class="spinner-grow text-primary" role="status"></div>
                </td>
              </tr>
              <tr v-else-if="filteredEmployees.length === 0">
                <td colspan="8" class="text-center py-5 text-secondary">
                  <iconify-icon icon="solar:user-block-line-duotone" class="fs-9 mb-2 d-block"></iconify-icon>
                  <span>No se encontraron colaboradores registrados o coincidentes.</span>
                </td>
              </tr>
              <tr v-for="emp in filteredEmployees" :key="emp.id" class="border-bottom border-dark-subtle">
                <!-- Colaborador -->
                <td>
                  <div class="d-flex align-items-center gap-2.5">
                    <div
                      class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                      :style="{
                        width: '38px',
                        height: '38px',
                        backgroundColor: emp.calendar_color || '#0085db',
                      }"
                    >
                      {{ emp.first_name.charAt(0) }}{{ emp.last_name.charAt(0) }}
                    </div>
                    <div>
                      <span class="text-white fw-bold d-block">{{ emp.first_name }} {{ emp.last_name }}</span>
                      <small class="text-secondary font-monospace">{{ emp.id_number }} · {{ emp.phone || 'Sin WhatsApp' }}</small>
                      <div class="mt-1">
                        <span v-if="emp.user" class="badge bg-success-subtle text-success fs-1 d-inline-flex align-items-center gap-1 font-monospace">
                          <iconify-icon icon="solar:user-check-bold"></iconify-icon>
                          {{ emp.user.email }} ({{ emp.user.role?.description || 'Usuario' }})
                        </span>
                        <span v-else class="badge bg-secondary-subtle text-muted fs-1 font-monospace">
                          Sin usuario ERP
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Cargo -->
                <td>
                  <span class="badge bg-dark-subtle text-white border border-secondary-subtle px-2 py-1 fs-2">
                    {{ emp.category?.name || 'Sin Cargo' }}
                  </span>
                </td>

                <!-- Sucursal -->
                <td>
                  <small class="text-secondary">{{ emp.branch ? `${emp.branch.code} - ${emp.branch.name}` : 'Matriz' }}</small>
                </td>

                <!-- Spa / Citas -->
                <td class="text-center">
                  <span
                    v-if="emp.accepts_appointments"
                    class="badge rounded-pill px-2.5 py-1 fs-1 d-inline-flex align-items-center gap-1"
                    :style="{
                      backgroundColor: `${emp.calendar_color}25`,
                      color: emp.calendar_color,
                      border: `1px solid ${emp.calendar_color}60`,
                    }"
                  >
                    <span class="badge-dot" :style="{ backgroundColor: emp.calendar_color }"></span>
                    Atiende Citas
                  </span>
                  <span v-else class="text-secondary fs-1">No</span>
                </td>

                <!-- Comisión -->
                <td class="text-center">
                  <span class="fw-bold text-info font-monospace">{{ emp.commission_rate }}%</span>
                </td>

                <!-- Sueldo Base -->
                <td class="text-end font-monospace text-white fw-semibold">
                  ${{ Number(emp.base_salary || 0).toFixed(2) }}
                </td>

                <!-- Estado -->
                <td class="text-center">
                  <span
                    class="badge rounded-pill px-2.5 py-1 fs-1 cursor-pointer"
                    :class="emp.status === 'ACTIVO' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                    @click="onToggleEmployeeStatus(emp)"
                    title="Clic para cambiar estado"
                  >
                    {{ emp.status }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="text-end">
                  <div class="d-inline-flex align-items-center gap-1">
                    <button
                      class="btn btn-sm btn-outline-info rounded-3 p-1.5"
                      title="Editar Colaborador"
                      @click="openEditEmployee(emp)"
                    >
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-4"></iconify-icon>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger rounded-3 p-1.5"
                      title="Eliminar Colaborador"
                      @click="onDeleteEmployee(emp)"
                    >
                      <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-4"></iconify-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ======================================================== -->
    <!-- FORMULARIO EN PÁGINA: REGISTRAR / EDITAR COLABORADOR     -->
    <!-- ======================================================== -->
    <div v-if="isEmployeeFormOpen" class="form-page">
      <div class="form-page-card">
        <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
          <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
            <div class="d-flex align-items-center gap-2">
              <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
                <iconify-icon icon="solar:user-id-bold-duotone" class="fs-4"></iconify-icon>
              </span>
              <div>
                <h5 class="fw-bold text-white mb-0">{{ isEditingEmployee ? 'Editar Ficha del Colaborador' : 'Registrar Nuevo Colaborador' }}</h5>
                <small class="text-secondary">Información personal, contrato, nómina y configuración de citas</small>
              </div>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="isEmployeeFormOpen = false">
              <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
              <span>Volver</span>
            </button>
          </div>

          <form @submit.prevent="saveEmployee" class="p-4">
            <!-- SECCIÓN 1: DATOS PERSONALES -->
            <div class="mb-4">
              <h6 class="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                <iconify-icon icon="solar:user-check-bold" class="fs-4"></iconify-icon>
                <span>1. Información Personal y Contacto</span>
              </h6>
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Tipo Identificación *</label>
                  <AppSelect2
                    v-model="employeeForm.id_type"
                    :options="docTypeOptions"
                    placeholder="Tipo Doc."
                    required
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Número de Identificación *</label>
                  <input
                    v-model="employeeForm.id_number"
                    type="text"
                    required
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                    placeholder="Ej. 1723064117"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Nombres *</label>
                  <input
                    v-model="employeeForm.first_name"
                    type="text"
                    required
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="Ej. Andrea Nicole"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Apellidos *</label>
                  <input
                    v-model="employeeForm.last_name"
                    type="text"
                    required
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="Ej. Mendoza Morales"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Teléfono / WhatsApp</label>
                  <input
                    v-model="employeeForm.phone"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                    placeholder="Ej. 0998765432"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico</label>
                  <input
                    v-model="employeeForm.email"
                    type="email"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="andrea@gmail.com"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Fecha de Nacimiento</label>
                  <input
                    v-model="employeeForm.birth_date"
                    type="date"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Género</label>
                  <select v-model="employeeForm.gender" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label text-secondary fs-2 fw-semibold">Dirección Domiciliaria</label>
                  <input
                    v-model="employeeForm.address"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="Calle principal, número y sector"
                  />
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: DATOS LABORALES Y CARGO -->
            <div class="mb-4 pt-3 border-top border-dark-subtle">
              <h6 class="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                <iconify-icon icon="solar:briefcase-bold" class="fs-4"></iconify-icon>
                <span>2. Cargo, Sucursal y Condiciones Laborales</span>
              </h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-secondary fs-2 fw-semibold">Cargo / Especialidad *</label>
                  <AppSelect2
                    v-model="employeeForm.category_id"
                    :options="categoryOptions"
                    placeholder="Seleccionar Cargo..."
                    required
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary fs-2 fw-semibold">Sucursal Asignada</label>
                  <AppSelect2
                    v-model="employeeForm.branch_id"
                    :options="branchOptions"
                    placeholder="Sucursal Asignada"
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary fs-2 fw-semibold">Fecha de Ingreso</label>
                  <input
                    v-model="employeeForm.hire_date"
                    type="date"
                    required
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Tipo de Contrato</label>
                  <select v-model="employeeForm.contract_type" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                    <option value="INDEFINIDO">Indefinido</option>
                    <option value="PLAZO_FIJO">Plazo Fijo (1 año)</option>
                    <option value="SERVICIOS_PRESTADOS">Servicios Prestados / Honorarios</option>
                    <option value="EVENTUAL">Eventual / Prueba</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Sueldo Base Mensual ($)</label>
                  <input
                    v-model.number="employeeForm.base_salary"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                    placeholder="460.00"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Frecuencia de Pago</label>
                  <select v-model="employeeForm.payment_frequency" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                    <option value="MENSUAL">Mensual</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="SEMANAL">Semanal</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Código Afiliación IESS</label>
                  <input
                    v-model="employeeForm.iess_affiliation_code"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                    placeholder="Ej. 1723064117001"
                  />
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: CONFIGURACIÓN PARA SPA / AGENDAMIENTO -->
            <div class="mb-4 pt-3 border-top border-dark-subtle">
              <div class="p-3 rounded-4 bg-dark-subtle border border-pink-subtle">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="p-2 bg-pink-subtle text-pink rounded-3 d-inline-flex">
                      <iconify-icon icon="solar:scissors-square-bold-duotone" class="fs-4"></iconify-icon>
                    </span>
                    <div>
                      <h6 class="text-white fw-bold mb-0">3. Configuración para Agenda de Citas / Spa</h6>
                      <small class="text-secondary">Permite que esta persona atienda clientes y reciba citas en el calendario</small>
                    </div>
                  </div>

                  <div class="form-check form-switch fs-4">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="employeeForm.accepts_appointments"
                      id="switchSpa"
                    />
                    <label class="form-check-label fs-2 text-white ms-2" for="switchSpa">
                      {{ employeeForm.accepts_appointments ? 'Habilitada en Calendario' : 'No atiende citas' }}
                    </label>
                  </div>
                </div>

                <div v-if="employeeForm.accepts_appointments" class="row g-3">
                  <!-- Color en el Calendario -->
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Color Identificativo en Calendario</label>
                    <div class="d-flex align-items-center gap-2">
                      <div
                        v-for="color in CALENDAR_COLORS"
                        :key="color"
                        class="rounded-circle cursor-pointer border"
                        :style="{
                          backgroundColor: color,
                          width: '32px',
                          height: '32px',
                          borderColor: employeeForm.calendar_color === color ? '#ffffff' : 'transparent',
                          transform: employeeForm.calendar_color === color ? 'scale(1.2)' : 'scale(1)',
                        }"
                        @click="employeeForm.calendar_color = color"
                      ></div>
                    </div>
                  </div>

                  <!-- % de Comisión -->
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Porcentaje de Comisión por Servicio (%)</label>
                    <div class="input-group">
                      <input
                        v-model.number="employeeForm.commission_rate"
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        class="form-control bg-dark border-secondary-subtle text-white font-monospace"
                        placeholder="Ej. 40"
                      />
                      <span class="input-group-text bg-dark border-secondary-subtle text-secondary">%</span>
                    </div>
                    <small class="text-secondary fs-1 mt-1 d-block">Porcentaje acumulable en reportes de liquidación por servicios realizados</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 4: DATOS BANCARIOS (NÓMINA) -->
            <div class="mb-4 pt-3 border-top border-dark-subtle">
              <h6 class="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                <iconify-icon icon="solar:card-2-bold" class="fs-4"></iconify-icon>
                <span>4. Datos Bancarios para Transferencias de Sueldo</span>
              </h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-secondary fs-2 fw-semibold">Institución Bancaria</label>
                  <input
                    v-model="employeeForm.bank_name"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="Banco Pichincha, Guayaquil, Produbanco..."
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary fs-2 fw-semibold">Tipo de Cuenta</label>
                  <select v-model="employeeForm.bank_account_type" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                    <option value="AHORROS">Cuenta de Ahorros</option>
                    <option value="CORRIENTE">Cuenta Corriente</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary fs-2 fw-semibold">Número de Cuenta</label>
                  <input
                    v-model="employeeForm.bank_account_number"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                    placeholder="2200123456"
                  />
                </div>
              </div>
            </div>

            <!-- SECCIÓN 5: ACCESO AL SISTEMA ERP (USUARIOS Y ROLES) -->
            <div class="mb-4 pt-3 border-top border-dark-subtle">
              <div class="p-3 rounded-4 bg-dark-subtle border border-primary-subtle">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
                      <iconify-icon icon="solar:shield-keyhole-bold-duotone" class="fs-4"></iconify-icon>
                    </span>
                    <div>
                      <h6 class="text-white fw-bold mb-0">5. Acceso al Sistema ERP (Usuario & Roles)</h6>
                      <small class="text-secondary">Permite que el colaborador inicie sesión en el ERP con sus propias credenciales</small>
                    </div>
                  </div>

                  <div class="form-check form-switch fs-4">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="employeeForm.enable_system_user"
                      id="switchUserAccess"
                    />
                    <label class="form-check-label fs-2 text-white ms-2" for="switchUserAccess">
                      {{ employeeForm.enable_system_user ? 'Acceso Habilitado' : 'Sin Acceso al Sistema' }}
                    </label>
                  </div>
                </div>

                <div v-if="employeeForm.enable_system_user" class="mt-3">
                  <!-- Modo: Crear nuevo o Homologar/Vincular -->
                  <div class="d-flex align-items-center gap-4 mb-3 pb-3 border-bottom border-secondary-subtle">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        id="userModeCreate"
                        value="create"
                        v-model="employeeForm.user_mode"
                      />
                      <label class="form-check-label text-white fw-semibold" for="userModeCreate">
                        Crear nuevo usuario de acceso
                      </label>
                    </div>
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        id="userModeLink"
                        value="link"
                        v-model="employeeForm.user_mode"
                      />
                      <label class="form-check-label text-white fw-semibold" for="userModeLink">
                        Homologar / Vincular usuario existente
                      </label>
                    </div>
                  </div>

                  <!-- Campos Modo CREAR -->
                  <div v-if="employeeForm.user_mode === 'create'" class="row g-3">
                    <div class="col-md-5">
                      <label class="form-label text-secondary fs-2 fw-semibold">
                        Correo Electrónico (Login) <span class="text-danger">*</span>
                      </label>
                      <div class="input-group">
                        <span class="input-group-text bg-dark border-secondary-subtle text-secondary">
                          <iconify-icon icon="solar:letter-linear"></iconify-icon>
                        </span>
                        <input
                          v-model="employeeForm.user_email"
                          type="email"
                          class="form-control bg-dark border-secondary-subtle text-white font-monospace"
                          placeholder="usuario@empresa.com"
                        />
                      </div>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label text-secondary fs-2 fw-semibold">
                        Contraseña de Acceso <span v-if="!isEditingEmployee" class="text-danger">*</span>
                      </label>
                      <div class="input-group">
                        <span class="input-group-text bg-dark border-secondary-subtle text-secondary">
                          <iconify-icon icon="solar:lock-password-linear"></iconify-icon>
                        </span>
                        <input
                          v-model="employeeForm.user_password"
                          type="password"
                          class="form-control bg-dark border-secondary-subtle text-white"
                          :placeholder="isEditingEmployee ? 'En blanco para no cambiar' : 'Mín. 4 caracteres'"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label text-secondary fs-2 fw-semibold">
                        Rol de Permisos Asignado <span class="text-danger">*</span>
                      </label>
                      <select
                        v-model="employeeForm.user_role_id"
                        class="form-select bg-dark border-secondary-subtle text-white"
                      >
                        <option :value="undefined" disabled>Selecciona un rol...</option>
                        <option v-for="r in rolesList" :key="r.id" :value="r.id">
                          {{ r.description }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Campos Modo HOMOLOGAR / VINCULAR -->
                  <div v-else class="row g-3">
                    <div class="col-md-8">
                      <label class="form-label text-secondary fs-2 fw-semibold">
                        Seleccionar Usuario del Sistema Existente <span class="text-danger">*</span>
                      </label>
                      <select
                        v-model="employeeForm.user_id"
                        class="form-select bg-dark border-secondary-subtle text-white"
                      >
                        <option :value="undefined" disabled>Selecciona un usuario registrado...</option>
                        <option v-for="u in usersList" :key="u.id" :value="u.id">
                          {{ u.name_user }} {{ u.last_name_user }} ({{ u.email }})
                        </option>
                      </select>
                      <small class="text-secondary fs-1 mt-1 d-block">
                        El colaborador quedará enlazado a esta cuenta y podrá identificarse con sus credenciales actuales.
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="modal-footer px-0 pt-3 border-top border-dark-subtle d-flex justify-content-between">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="isEmployeeFormOpen = false">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" :disabled="saving">
                <span v-if="saving" class="spinner-grow spinner-grow-sm text-white"></span>
                <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
                <span>{{ isEditingEmployee ? 'Guardar Cambios' : 'Registrar Colaborador' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-navy-card {
  background-color: #0d182e !important;
}

.text-pink {
  color: #ec4899 !important;
}
.bg-pink-subtle {
  background-color: rgba(236, 72, 153, 0.15) !important;
}
.border-pink-subtle {
  border-color: rgba(236, 72, 153, 0.3) !important;
}
.btn-pink {
  background-color: #ec4899;
  border-color: #ec4899;
}
.btn-pink:hover {
  background-color: #db2777;
  border-color: #db2777;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.form-page-card {
  width: 100%;
  margin: 0 auto;
}
</style>
