<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCompanies,
  createCompany,
  getUsers,
  createUser,
  updateUser,
  getRoles,
  createRole,
  getPlans,
  createPlan,
  getSubscriptions,
  createSubscription,
  type CompanyItem,
  type UserItem,
  type RoleItem,
  type PlanItem,
  type SubscriptionItem,
} from '@/services/config.service'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Paleta de colores de temas (Spike Admin)
const themeColorsList = [
  { id: 'Blue_Theme', name: 'Azul Clásico', color: '#0085db' },
  { id: 'Aqua_Theme', name: 'Aqua Profundo', color: '#0074ba' },
  { id: 'Purple_Theme', name: 'Púrpura Spike', color: '#763ebd' },
  { id: 'Green_Theme', name: 'Teal Verde', color: '#0a7ea4' },
  { id: 'Cyan_Theme', name: 'Turquesa Cyan', color: '#01c0c8' },
  { id: 'Orange_Theme', name: 'Naranja Coral', color: '#fa896b' },
]

const getThemeColorHex = (themeId?: string) => {
  const found = themeColorsList.find((t) => t.id === themeId)
  return found?.color || '#0085db'
}

const getThemeName = (themeId?: string) => {
  const found = themeColorsList.find((t) => t.id === themeId)
  return found?.name || 'Azul Clásico'
}

const getThemeBadgeStyle = (themeId?: string) => {
  const hex = getThemeColorHex(themeId)
  return {
    backgroundColor: `${hex}25`,
    border: `1px solid ${hex}70`,
    color: '#ffffff',
  }
}

const selectTheme = (themeId: string) => {
  formUser.value.theme_color = themeId
  // Vista previa en vivo del tema en toda la interfaz
  document.documentElement.setAttribute('data-color-theme', themeId)
}

const closeUserModal = () => {
  showUserModal.value = false
  // Restaurar el tema guardado en caso de cancelar
  const currentTheme = localStorage.getItem('userTheme') || 'Blue_Theme'
  document.documentElement.setAttribute('data-color-theme', currentTheme)
}

// Pestaña activa ('companies' | 'users' | 'roles' | 'subscriptions')
const activeTab = ref<'companies' | 'users' | 'roles' | 'subscriptions'>('companies')

// Estado de carga y mensajes
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// Contexto de empresa seleccionada
const selectedCompany = ref<any>(null)
const currentCompanyId = computed(() => selectedCompany.value?.id || 1)

// Listas de datos
const companies = ref<CompanyItem[]>([])
const users = ref<UserItem[]>([])
const roles = ref<RoleItem[]>([])
const plans = ref<PlanItem[]>([])
const subscriptions = ref<SubscriptionItem[]>([])

// Modales
const showCompanyModal = ref(false)
const showUserModal = ref(false)
const showRoleModal = ref(false)
const showPlanModal = ref(false)
const showSubscriptionModal = ref(false)

// Estado de edición de usuario
const isEditingUser = ref(false)
const editingUserId = ref<number | null>(null)

// Formularios
const formCompany = ref({
  ruc: '',
  business_name: '',
  trade_name: '',
  description: '',
})

const formUser = ref({
  companyId: 1,
  num_document: '',
  name_user: '',
  last_name_user: '',
  email: '',
  password: '',
  theme_color: 'Blue_Theme',
})

const openCreateUser = () => {
  isEditingUser.value = false
  editingUserId.value = null
  formUser.value = {
    companyId: currentCompanyId.value,
    num_document: '',
    name_user: '',
    last_name_user: '',
    email: '',
    password: '',
    theme_color: 'Blue_Theme',
  }
  showUserModal.value = true
}

const openEditUser = (user: UserItem) => {
  isEditingUser.value = true
  editingUserId.value = user.id
  formUser.value = {
    companyId: currentCompanyId.value,
    num_document: user.num_document || '',
    name_user: user.name_user || '',
    last_name_user: user.last_name_user || '',
    email: user.email || '',
    password: '',
    theme_color: user.theme_color || 'Blue_Theme',
  }
  showUserModal.value = true
}

const formRole = ref({
  companyId: 1,
  code: '',
  description: '',
})

const formPlan = ref({
  price: '29.99',
  billing_cycle: 'monthly',
  description: '',
  max_users: 5,
  max_branches: 2,
})

const todayStr = new Date().toISOString().slice(0, 10)
const nextYearStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const formSubscription = ref({
  companyId: 1,
  planId: 1,
  begin_date: todayStr,
  end_date: nextYearStr,
})

const loadCurrentTabData = async () => {
  successMsg.value = ''
  errorMsg.value = ''
  loading.value = true
  try {
    if (activeTab.value === 'companies') {
      const res = await getCompanies({ page: 1, limit: 50 })
      companies.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } else if (activeTab.value === 'users') {
      const res = await getUsers(currentCompanyId.value, { page: 1, limit: 50 })
      users.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } else if (activeTab.value === 'roles') {
      const res = await getRoles(currentCompanyId.value, { page: 1, limit: 50 })
      roles.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } else if (activeTab.value === 'subscriptions') {
      const [plansRes, subsRes] = await Promise.all([
        getPlans({ page: 1, limit: 50 }),
        getSubscriptions(currentCompanyId.value, { page: 1, limit: 50 }).catch(() => ({ data: [] })),
      ])
      plans.value = Array.isArray(plansRes?.data) ? plansRes.data : Array.isArray(plansRes) ? plansRes : []
      subscriptions.value = Array.isArray(subsRes?.data) ? subsRes.data : Array.isArray(subsRes) ? subsRes : []
    }
  } catch (err: any) {
    console.error('Error cargando datos de configuración:', err)
    errorMsg.value = err.response?.data?.message || err.message || 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: 'companies' | 'users' | 'roles' | 'subscriptions') => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  loadCurrentTabData()
}

// Sincronizar pestaña con query params
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && ['companies', 'users', 'roles', 'subscriptions'].includes(newTab as string)) {
      activeTab.value = newTab as any
      loadCurrentTabData()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  const comp = localStorage.getItem('selectedCompany')
  if (comp) {
    try {
      selectedCompany.value = JSON.parse(comp)
      formUser.value.companyId = selectedCompany.value.id
      formRole.value.companyId = selectedCompany.value.id
      formSubscription.value.companyId = selectedCompany.value.id
    } catch (e) {}
  }
  loadCurrentTabData()
})

// =================== GUARDAR EMPRESA ===================
const submitCompany = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await createCompany(formCompany.value)
    successMsg.value = 'Empresa creada exitosamente.'
    showCompanyModal.value = false
    formCompany.value = { ruc: '', business_name: '', trade_name: '', description: '' }
    await loadCurrentTabData()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al crear la empresa'
  } finally {
    loading.value = false
  }
}

// =================== GUARDAR USUARIO ===================
const submitUser = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    formUser.value.companyId = currentCompanyId.value
    if (isEditingUser.value && editingUserId.value) {
      const payload: any = {
        companyId: currentCompanyId.value,
        num_document: formUser.value.num_document,
        name_user: formUser.value.name_user,
        last_name_user: formUser.value.last_name_user,
        email: formUser.value.email,
        theme_color: formUser.value.theme_color || 'Blue_Theme',
      }
      if (formUser.value.password) {
        payload.password = formUser.value.password
      }
      await updateUser(editingUserId.value, payload)
      successMsg.value = 'Usuario y configuración de tema actualizados exitosamente.'

      // Si el usuario editado es el actual logueado, aplicar y persistir el tema inmediatamente
      if (authStore.tokenPayload?.user_id === editingUserId.value) {
        authStore.applyTheme(formUser.value.theme_color)
      }
    } else {
      await createUser(formUser.value)
      successMsg.value = 'Usuario registrado exitosamente.'
    }
    showUserModal.value = false
    formUser.value = {
      companyId: currentCompanyId.value,
      num_document: '',
      name_user: '',
      last_name_user: '',
      email: '',
      password: '',
      theme_color: 'Blue_Theme',
    }
    await loadCurrentTabData()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar el usuario'
  } finally {
    loading.value = false
  }
}

// =================== GUARDAR ROL ===================
const submitRole = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    formRole.value.companyId = currentCompanyId.value
    await createRole(formRole.value)
    successMsg.value = 'Rol creado exitosamente.'
    showRoleModal.value = false
    formRole.value = { companyId: currentCompanyId.value, code: '', description: '' }
    await loadCurrentTabData()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al crear el rol'
  } finally {
    loading.value = false
  }
}

// =================== GUARDAR PLAN ===================
const submitPlan = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await createPlan(formPlan.value)
    successMsg.value = 'Plan SaaS registrado exitosamente.'
    showPlanModal.value = false
    formPlan.value = { price: '29.99', billing_cycle: 'monthly', description: '', max_users: 5, max_branches: 2 }
    await loadCurrentTabData()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al crear el plan'
  } finally {
    loading.value = false
  }
}

// =================== GUARDAR SUSCRIPCIÓN ===================
const submitSubscription = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    formSubscription.value.companyId = currentCompanyId.value
    await createSubscription(formSubscription.value)
    successMsg.value = 'Suscripción activada con éxito.'
    showSubscriptionModal.value = false
    await loadCurrentTabData()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al asignar suscripción'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="settings-page">
    
    <!-- ENCABEZADO DE MÓDULO -->
    <div class="card rounded-4 border-0 shadow-sm p-4 mb-4 bg-navy-card">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
              <iconify-icon icon="solar:settings-line-duotone" class="fs-6"></iconify-icon>
            </span>
            <h4 class="fw-bold text-white mb-0">Módulo de Configuración</h4>
          </div>
          <p class="text-secondary fs-3 mb-0">
            Administración de empresas, usuarios del sistema, roles de permisos y suscripciones SaaS.
          </p>
        </div>

        <!-- Indicador de contexto -->
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

      <!-- ALERTS -->
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

      <!-- PESTAÑAS TIPO PILLS (ESTILO SPIKE / PHP ORIGINAL) -->
      <ul class="nav nav-pills user-profile-tab mt-4 border-top border-dark-subtle pt-3" role="tablist">
        
        <li class="nav-item me-2">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'companies', 'text-white-50 hover-tab': activeTab !== 'companies' }"
            @click="switchTab('companies')"
          >
            <iconify-icon icon="solar:buildings-3-line-duotone" class="fs-5"></iconify-icon>
            <span>Empresas</span>
          </button>
        </li>

        <li class="nav-item me-2">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'users', 'text-white-50 hover-tab': activeTab !== 'users' }"
            @click="switchTab('users')"
          >
            <iconify-icon icon="solar:users-group-two-rounded-line-duotone" class="fs-5"></iconify-icon>
            <span>Usuarios</span>
          </button>
        </li>

        <li class="nav-item me-2">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'roles', 'text-white-50 hover-tab': activeTab !== 'roles' }"
            @click="switchTab('roles')"
          >
            <iconify-icon icon="solar:shield-check-line-duotone" class="fs-5"></iconify-icon>
            <span>Roles</span>
          </button>
        </li>

        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'subscriptions', 'text-white-50 hover-tab': activeTab !== 'subscriptions' }"
            @click="switchTab('subscriptions')"
          >
            <iconify-icon icon="solar:card-line-duotone" class="fs-5"></iconify-icon>
            <span>Planes & Suscripciones</span>
          </button>
        </li>

      </ul>
    </div>

    <!-- CONTENIDO DE LA PESTAÑA ACTIVA -->

    <!-- ======================================================== -->
    <!-- TAB 1: EMPRESAS                                          -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'companies'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1">Listado de Empresas</h5>
          <small class="text-secondary">Empresas registradas en la plataforma</small>
        </div>
        <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="showCompanyModal = true">
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nueva Empresa</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Cargando empresas...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th width="5%">#</th>
              <th width="15%">RUC</th>
              <th width="35%">Razón Social</th>
              <th width="25%">Nombre Comercial</th>
              <th width="10%">Estado</th>
              <th width="10%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comp in companies" :key="comp.id">
              <td><span class="badge bg-dark-subtle text-white">{{ comp.id }}</span></td>
              <td class="fw-semibold text-white">{{ comp.ruc }}</td>
              <td class="text-white">{{ comp.business_name }}</td>
              <td class="text-secondary">{{ comp.trade_name }}</td>
              <td>
                <span class="badge" :class="comp.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ comp.enabled !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-info rounded-circle p-1" title="Editar">
                  <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr v-if="companies.length === 0">
              <td colspan="6" class="text-center text-muted py-5">No hay empresas registradas aún.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 2: USUARIOS                                          -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'users'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1">Usuarios del Sistema</h5>
          <small class="text-secondary">Gestión de usuarios y credenciales de acceso</small>
        </div>
        <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreateUser">
          <iconify-icon icon="solar:user-plus-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Cargando usuarios...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th width="5%">#</th>
              <th width="12%">Documento</th>
              <th width="22%">Nombre Completo</th>
              <th width="20%">Correo Electrónico</th>
              <th width="13%">Rol / Permiso</th>
              <th width="14%">Tema de Color</th>
              <th width="7%">Estado</th>
              <th width="7%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td><span class="badge bg-dark-subtle text-white">{{ user.id }}</span></td>
              <td class="fw-semibold text-white">{{ user.num_document || 'S/D' }}</td>
              <td class="text-white">{{ user.name_user }} {{ user.last_name_user }}</td>
              <td class="text-info">{{ user.email }}</td>
              <td>
                <span v-if="user.developer" class="badge bg-primary-subtle text-primary me-1">Developer</span>
                <span v-if="user.multi_company" class="badge bg-warning-subtle text-warning">Multi-Empresa</span>
                <span v-if="!user.developer && !user.multi_company" class="badge bg-secondary-subtle text-secondary">Usuario</span>
              </td>
              <td>
                <span class="badge d-inline-flex align-items-center gap-2 px-2 py-1 rounded-pill" :style="getThemeBadgeStyle(user.theme_color)">
                  <span class="theme-mini-dot" :style="{ backgroundColor: getThemeColorHex(user.theme_color) }"></span>
                  <span>{{ getThemeName(user.theme_color) }}</span>
                </span>
              </td>
              <td>
                <span class="badge" :class="user.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ user.enabled !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <button
                  class="btn btn-sm btn-outline-info rounded-circle p-1"
                  title="Editar Usuario y Color de Tema"
                  @click="openEditUser(user)"
                >
                  <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="8" class="text-center text-muted py-5">No hay usuarios registrados para esta empresa.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 3: ROLES                                             -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'roles'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1">Roles de Usuario</h5>
          <small class="text-secondary">Definición de roles y perfiles de acceso</small>
        </div>
        <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="showRoleModal = true">
          <iconify-icon icon="solar:shield-plus-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo Rol</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Cargando roles...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th width="10%">#</th>
              <th width="20%">Código</th>
              <th width="50%">Descripción</th>
              <th width="10%">Estado</th>
              <th width="10%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id">
              <td><span class="badge bg-dark-subtle text-white">{{ role.id }}</span></td>
              <td><span class="badge bg-primary text-white fw-bold">{{ role.code }}</span></td>
              <td class="text-white">{{ role.description }}</td>
              <td>
                <span class="badge" :class="role.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ role.enabled !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-info rounded-circle p-1" title="Ver Permisos">
                  <iconify-icon icon="solar:eye-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr v-if="roles.length === 0">
              <td colspan="5" class="text-center text-muted py-5">No hay roles creados para esta empresa.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 4: PLANES & SUSCRIPCIONES                            -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'subscriptions'" class="d-flex flex-column gap-4">
      
      <!-- SUBSECTION 1: PLANES SAAS -->
      <div class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 class="fw-bold text-white mb-1">Catálogo de Planes SaaS</h5>
            <small class="text-secondary">Planes configurados con límites de usuarios y sucursales</small>
          </div>
          <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="showPlanModal = true">
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
            <span>Crear Plan</span>
          </button>
        </div>

        <div class="row g-3">
          <div v-for="plan in plans" :key="plan.id" class="col-md-4">
            <div class="card border border-dark-subtle p-3 rounded-4 bg-dark-subtle h-100">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="text-white fw-bold mb-0">{{ plan.description }}</h5>
                <span class="badge bg-primary-subtle text-primary text-uppercase">{{ plan.billing_cycle }}</span>
              </div>
              <h3 class="fw-bold text-white mb-3">${{ plan.price }} <span class="fs-2 text-secondary fw-normal">/ ciclo</span></h3>
              <ul class="list-unstyled text-secondary fs-2 mb-3">
                <li class="mb-1"><iconify-icon icon="solar:check-circle-line-duotone" class="text-success me-1"></iconify-icon> Hasta {{ plan.max_users }} usuarios</li>
                <li class="mb-1"><iconify-icon icon="solar:check-circle-line-duotone" class="text-success me-1"></iconify-icon> Hasta {{ plan.max_branches }} sucursales</li>
                <li><iconify-icon icon="solar:check-circle-line-duotone" class="text-success me-1"></iconify-icon> Facturación y compras</li>
              </ul>
            </div>
          </div>
          <div v-if="plans.length === 0" class="col-12 text-center text-muted py-4">
            No hay planes registrados aún.
          </div>
        </div>
      </div>

      <!-- SUBSECTION 2: SUSCRIPCIÓN ACTIVA DE LA EMPRESA -->
      <div class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 class="fw-bold text-white mb-1">Suscripciones Activas</h5>
            <small class="text-secondary">Vigencia y plan contratado por la empresa activa</small>
          </div>
          <button class="btn btn-outline-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="showSubscriptionModal = true">
            <iconify-icon icon="solar:card-recive-line-duotone" class="fs-5"></iconify-icon>
            <span>Asignar Suscripción</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-dark">
              <tr>
                <th>#</th>
                <th>Plan ID</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in subscriptions" :key="sub.id">
                <td><span class="badge bg-dark-subtle text-white">{{ sub.id }}</span></td>
                <td><span class="badge bg-info text-dark fw-bold">Plan #{{ sub.planId }}</span></td>
                <td class="text-white">{{ new Date(sub.begin_date).toLocaleDateString() }}</td>
                <td class="text-white">{{ new Date(sub.end_date).toLocaleDateString() }}</td>
                <td>
                  <span class="badge" :class="sub.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                    {{ sub.enabled !== false ? 'Vigente' : 'Expirada' }}
                  </span>
                </td>
              </tr>
              <tr v-if="subscriptions.length === 0">
                <td colspan="5" class="text-center text-muted py-4">Esta empresa no tiene suscripciones registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ======================================================== -->
    <!-- MODALES DE CREACIÓN                                      -->
    <!-- ======================================================== -->

    <!-- 1. MODAL NUEVA EMPRESA -->
    <Teleport to="body">
      <div v-if="showCompanyModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.65); z-index: 1060;" @click.self="showCompanyModal = false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 shadow-lg border-0 bg-dark text-white">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title text-white">Registrar Nueva Empresa</h5>
              <button type="button" class="btn-close btn-close-white" @click="showCompanyModal = false"></button>
            </div>
            <form @submit.prevent="submitCompany">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-white-50">RUC / Identificación Fiscal</label>
                  <input v-model="formCompany.ruc" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Ej. 1725620247001" required />
                </div>
                <div class="mb-3">
                  <label class="form-label text-white-50">Razón Social</label>
                  <input v-model="formCompany.business_name" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Ej. Corporación Deskounta S.A." required />
                </div>
                <div class="mb-3">
                  <label class="form-label text-white-50">Nombre Comercial</label>
                  <input v-model="formCompany.trade_name" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Ej. Deskounta" required />
                </div>
                <div class="mb-3">
                  <label class="form-label text-white-50">Descripción / Dirección</label>
                  <textarea v-model="formCompany.description" class="form-control bg-dark-subtle border-secondary text-white" rows="2" placeholder="Dirección o actividad comercial"></textarea>
                </div>
              </div>
              <div class="modal-footer border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary" @click="showCompanyModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">Guardar Empresa</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 2. MODAL NUEVO / EDITAR USUARIO -->
    <Teleport to="body">
      <div v-if="showUserModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.65); z-index: 1060;" @click.self="closeUserModal">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content rounded-4 shadow-lg border-0 bg-dark text-white">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title text-white d-flex align-items-center gap-2">
                <iconify-icon :icon="isEditingUser ? 'solar:user-bold' : 'solar:user-plus-line-duotone'" class="fs-5"></iconify-icon>
                <span>{{ isEditingUser ? 'Editar Usuario del Sistema' : 'Crear Usuario del Sistema' }}</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="closeUserModal"></button>
            </div>
            <form @submit.prevent="submitUser">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-white-50">Número de Cédula / Documento</label>
                  <input v-model="formUser.num_document" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Ej. 1725620247" required />
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Nombres</label>
                    <input v-model="formUser.name_user" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Nombre" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Apellidos</label>
                    <input v-model="formUser.last_name_user" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Apellido" required />
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label text-white-50">Correo Electrónico (Login)</label>
                  <input v-model="formUser.email" type="email" class="form-control bg-dark-subtle border-secondary text-white" placeholder="usuario@correo.com" required />
                </div>
                <div class="mb-3">
                  <label class="form-label text-white-50 d-flex justify-content-between align-items-center">
                    <span>Contraseña</span>
                    <span v-if="isEditingUser" class="text-secondary fs-2">(Dejar en blanco para mantener la actual)</span>
                  </label>
                  <input
                    v-model="formUser.password"
                    type="password"
                    class="form-control bg-dark-subtle border-secondary text-white"
                    :placeholder="isEditingUser ? '•••••••• (Sin cambios)' : 'Contraseña segura'"
                    :required="!isEditingUser"
                  />
                </div>

                <!-- SELECTOR DE COLOR DE TEMA (SPIKE ADMIN THEME COLORS) -->
                <div class="mb-2 pt-2 border-top border-dark-subtle">
                  <label class="form-label text-white-50 d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold text-white">Color de Tema de la Interfaz</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-1">
                      Se aplicará al iniciar sesión
                    </span>
                  </label>
                  
                  <div class="theme-colors-grid">
                    <div
                      v-for="theme in themeColorsList"
                      :key="theme.id"
                      class="theme-color-card"
                      :class="{ active: formUser.theme_color === theme.id }"
                      @click="selectTheme(theme.id)"
                      :title="theme.name"
                    >
                      <div class="theme-circle" :style="{ backgroundColor: theme.color }">
                        <iconify-icon
                          v-if="formUser.theme_color === theme.id"
                          icon="solar:check-read-outline"
                          class="check-icon"
                        ></iconify-icon>
                      </div>
                      <span class="theme-label">{{ theme.name }}</span>
                    </div>
                  </div>

                  <small class="text-secondary fs-2 mt-2 d-flex align-items-center gap-1">
                    <iconify-icon icon="solar:info-circle-line-duotone" class="text-info fs-4"></iconify-icon>
                    <span>Haz clic en un color para previsualizarlo en tiempo real en todo el sistema ERP.</span>
                  </small>
                </div>
              </div>
              <div class="modal-footer border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary" @click="closeUserModal">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4" :disabled="loading">
                  {{ isEditingUser ? 'Actualizar Usuario' : 'Guardar Usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 3. MODAL NUEVO ROL -->
    <Teleport to="body">
      <div v-if="showRoleModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.65); z-index: 1060;" @click.self="showRoleModal = false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 shadow-lg border-0 bg-dark text-white">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title text-white">Crear Rol de Usuario</h5>
              <button type="button" class="btn-close btn-close-white" @click="showRoleModal = false"></button>
            </div>
            <form @submit.prevent="submitRole">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-white-50">Código del Rol</label>
                  <input v-model="formRole.code" type="text" class="form-control bg-dark-subtle border-secondary text-white text-uppercase" placeholder="Ej. ADMIN, VENDEDOR, CONTADOR" required />
                </div>
                <div class="mb-3">
                  <label class="form-label text-white-50">Descripción del Rol</label>
                  <input v-model="formRole.description" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Ej. Acceso a ventas y facturación" required />
                </div>
              </div>
              <div class="modal-footer border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary" @click="showRoleModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">Guardar Rol</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 4. MODAL NUEVO PLAN -->
    <Teleport to="body">
      <div v-if="showPlanModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.65); z-index: 1060;" @click.self="showPlanModal = false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 shadow-lg border-0 bg-dark text-white">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title text-white">Crear Plan SaaS</h5>
              <button type="button" class="btn-close btn-close-white" @click="showPlanModal = false"></button>
            </div>
            <form @submit.prevent="submitPlan">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-white-50">Nombre / Descripción del Plan</label>
                  <input v-model="formPlan.description" type="text" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Ej. Plan Emprendedor" required />
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Precio ($)</label>
                    <input v-model="formPlan.price" type="number" step="0.01" class="form-control bg-dark-subtle border-secondary text-white" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Ciclo de Facturación</label>
                    <select v-model="formPlan.billing_cycle" class="form-select bg-dark-subtle border-secondary text-white">
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Máx. Usuarios</label>
                    <input v-model.number="formPlan.max_users" type="number" class="form-control bg-dark-subtle border-secondary text-white" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Máx. Sucursales</label>
                    <input v-model.number="formPlan.max_branches" type="number" class="form-control bg-dark-subtle border-secondary text-white" required />
                  </div>
                </div>
              </div>
              <div class="modal-footer border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary" @click="showPlanModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">Guardar Plan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 5. MODAL ASIGNAR SUSCRIPCIÓN -->
    <Teleport to="body">
      <div v-if="showSubscriptionModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.65); z-index: 1060;" @click.self="showSubscriptionModal = false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 shadow-lg border-0 bg-dark text-white">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title text-white">Asignar Suscripción a la Empresa</h5>
              <button type="button" class="btn-close btn-close-white" @click="showSubscriptionModal = false"></button>
            </div>
            <form @submit.prevent="submitSubscription">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-white-50">Plan a Contratar</label>
                  <select v-model.number="formSubscription.planId" class="form-select bg-dark-subtle border-secondary text-white" required>
                    <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                      {{ plan.description }} - ${{ plan.price }} ({{ plan.billing_cycle }})
                    </option>
                  </select>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Fecha de Inicio</label>
                    <input v-model="formSubscription.begin_date" type="date" class="form-control bg-dark-subtle border-secondary text-white" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-white-50">Fecha de Fin</label>
                    <input v-model="formSubscription.end_date" type="date" class="form-control bg-dark-subtle border-secondary text-white" required />
                  </div>
                </div>
              </div>
              <div class="modal-footer border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary" @click="showSubscriptionModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">Activar Suscripción</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.bg-navy-card {
  background-color: #0d182e !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.hover-tab:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #fff !important;
}

/* PALETA DE TEMAS (SPIKE ADMIN THEME COLORS) */
.theme-colors-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-color-card {
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-color-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.theme-color-card.active {
  border-color: var(--bs-primary, #0085db);
  background: rgba(0, 133, 219, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.theme-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.check-icon {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}

.theme-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  white-space: nowrap;
}

.theme-color-card.active .theme-label {
  color: #ffffff;
  font-weight: 600;
}

.theme-mini-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}
</style>
