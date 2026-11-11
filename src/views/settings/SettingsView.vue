<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/utils/toastr'
import {
  getCompanies,
  createCompany,
  updateCompany,
  getUsers,
  createUser,
  updateUser,
  getRoles,
  createRole,
  updateRole,
  getPlans,
  createPlan,
  getSubscriptions,
  createSubscription,
  updateSubscription,
  getModules,
  createModule,
  updateModule,
  getSubModules,
  createSubModule,
  updateSubModule,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  setMainBranch,
  type BranchItem,
  type CompanyItem,
  type UserItem,
  type RoleItem,
  type RoleAccessDetail,
  type PlanItem,
  type SubscriptionItem,
  type ModuleItem,
  type SubModuleItem,
} from '@/services/config.service'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

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

// Pestaña activa ('companies' | 'users' | 'roles' | 'modules' | 'subscriptions')
const activeTab = ref<'companies' | 'branches' | 'users' | 'roles' | 'modules' | 'subscriptions'>('companies')

// Estado de carga y mensajes
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

watch(successMsg, (msg) => {
  if (msg) toast.success(msg, 'Configuración')
})
watch(errorMsg, (msg) => {
  if (msg) toast.error(msg, 'Error en Configuración')
})

// Contexto de empresa seleccionada
const selectedCompany = ref<any>(null)
const currentCompanyId = computed(() => selectedCompany.value?.id || 1)
const isCurrentUserSuperAdmin = computed(() =>
  Boolean(authStore.tokenPayload?.super_admin || authStore.tokenPayload?.developer)
)

// Listas de datos
const companies = ref<CompanyItem[]>([])
const users = ref<UserItem[]>([])
const roles = ref<RoleItem[]>([])
const modulesList = ref<ModuleItem[]>([])
const subModulesList = ref<SubModuleItem[]>([])
const filterModuleId = ref<number | undefined>(undefined)
const plans = ref<PlanItem[]>([])
const subscriptions = ref<SubscriptionItem[]>([])

// Modales
const showCompanyModal = ref(false)
const showUserModal = ref(false)
const showRoleModal = ref(false)
const showModuleModal = ref(false)
const showSubModuleModal = ref(false)
const showPlanModal = ref(false)
const showSubscriptionModal = ref(false)
const showBranchModal = ref(false)
// Mientras un formulario de registro/edición está abierto se muestra como página y se oculta el listado
const isFormOpen = computed(
  () => showCompanyModal.value || showUserModal.value || showRoleModal.value || showModuleModal.value || showSubModuleModal.value || showPlanModal.value || showSubscriptionModal.value || showBranchModal.value,
)
watch(isFormOpen, async (open) => {
  if (open) {
    await nextTick()
    document.getElementById('form-page')?.scrollIntoView({ block: 'start' })
  }
})

// Estado de edición de usuario y rol
const isEditingUser = ref(false)
const editingUserId = ref<number | null>(null)
const isEditingRole = ref(false)
const editingRoleId = ref<number | null>(null)
const rolesByCompany = ref<Record<number, RoleItem[]>>({})

// Estado de edición de módulo y submódulo
const isEditingModule = ref(false)
const editingModuleId = ref<number | null>(null)
const isEditingSubModule = ref(false)
const editingSubModuleId = ref<number | null>(null)
const isEditingSubscription = ref(false)
const editingSubscriptionId = ref<number | null>(null)
const allSubModulesList = ref<SubModuleItem[]>([])

// Iconos sugeridos para módulos y submódulos (Solar Iconify)
const suggestedIcons = [
  { icon: 'solar:widget-4-line-duotone', label: 'Módulo' },
  { icon: 'solar:cart-large-2-line-duotone', label: 'Ventas' },
  { icon: 'solar:bag-4-line-duotone', label: 'Compras' },
  { icon: 'solar:box-minimalistic-line-duotone', label: 'Inventario' },
  { icon: 'solar:calculator-line-duotone', label: 'Contabilidad' },
  { icon: 'solar:wallet-money-line-duotone', label: 'Tesorería' },
  { icon: 'solar:users-group-rounded-line-duotone', label: 'RRHH / Clientes' },
  { icon: 'solar:document-text-line-duotone', label: 'Facturación' },
  { icon: 'solar:chart-2-line-duotone', label: 'Reportes' },
  { icon: 'solar:settings-line-duotone', label: 'Configuración' },
]

// Formularios
const initialFormCompany = () => ({
  ruc: '',
  business_name: '',
  trade_name: '',
  description: '',
  address_matriz: '',
  phone: '',
  email: '',
  obligated_accounting: false,
  special_taxpayer: '',
  tax_regime: 'GENERAL',
  sri_environment: '1',
  default_establishment: '001',
  default_emission_point: '001',
  // Firma electrónica
  cert_p12_base64: '',
  cert_file_name: '',
  cert_password: '',
  cert_expires_at: '',
  has_certificate: false,
  remove_certificate: false,
  // SMTP
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: true,
  smtp_user: '',
  smtp_password: '',
  has_smtp_password: false,
  smtp_from_name: '',
  smtp_from_email: '',
})
const formCompany = ref(initialFormCompany())
const isEditingCompany = ref(false)
const editingCompanyId = ref<number | null>(null)
const companyFormTab = ref<'general' | 'fiscal' | 'firma' | 'correo'>('general')

const openCreateCompany = () => {
  isEditingCompany.value = false
  editingCompanyId.value = null
  formCompany.value = initialFormCompany()
  companyFormTab.value = 'general'
  showCompanyModal.value = true
}

const openEditCompany = (comp: CompanyItem) => {
  const f = comp.fiscal || {}
  isEditingCompany.value = true
  editingCompanyId.value = comp.id
  formCompany.value = {
    ...initialFormCompany(),
    ruc: comp.ruc,
    business_name: comp.business_name,
    trade_name: comp.trade_name,
    description: comp.description || '',
    address_matriz: f.address_matriz || '',
    phone: f.phone || '',
    email: f.email || '',
    obligated_accounting: Boolean(f.obligated_accounting),
    special_taxpayer: f.special_taxpayer || '',
    tax_regime: f.tax_regime || 'GENERAL',
    sri_environment: f.sri_environment || '1',
    default_establishment: f.default_establishment || '001',
    default_emission_point: f.default_emission_point || '001',
    cert_file_name: f.cert_file_name || '',
    cert_expires_at: f.cert_expires_at || '',
    has_certificate: Boolean(f.has_certificate),
    smtp_host: f.smtp_host || '',
    smtp_port: f.smtp_port || 587,
    smtp_secure: f.smtp_secure !== false,
    smtp_user: f.smtp_user || '',
    has_smtp_password: Boolean(f.has_smtp_password),
    smtp_from_name: f.smtp_from_name || '',
    smtp_from_email: f.smtp_from_email || '',
  }
  companyFormTab.value = 'general'
  showCompanyModal.value = true
}

// Lee el archivo .p12 y lo convierte a base64 (se envía al backend, que lo guarda)
const onP12Selected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!/\.(p12|pfx)$/i.test(file.name)) {
    errorMsg.value = 'El archivo de firma debe ser .p12 o .pfx'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = String(reader.result || '')
    formCompany.value.cert_p12_base64 = result.split(',')[1] || ''
    formCompany.value.cert_file_name = file.name
    formCompany.value.remove_certificate = false
  }
  reader.readAsDataURL(file)
}

const removeP12 = () => {
  formCompany.value.cert_p12_base64 = ''
  formCompany.value.cert_file_name = ''
  formCompany.value.cert_password = ''
  formCompany.value.cert_expires_at = ''
  formCompany.value.has_certificate = false
  formCompany.value.remove_certificate = true
}

const formUser = ref({
  companyId: 1,
  num_document: '',
  birth_date: '',
  name_user: '',
  last_name_user: '',
  email: '',
  password: '',
  super_admin: false,
  multi_company: false,
  companyIds: [] as number[],
  roleId: null as number | null,
  companyRolesMap: {} as Record<number, number | null>,
  theme_color: 'Blue_Theme',
})

const ensureRolesForCompany = async (compId: number) => {
  if (!compId) return
  try {
    const res = await getRoles(compId, { page: 1, limit: 100 })
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    rolesByCompany.value = {
      ...rolesByCompany.value,
      [compId]: list,
    }
  } catch (e) {
    rolesByCompany.value = {
      ...rolesByCompany.value,
      [compId]: [],
    }
  }
}

const getCompanyNameById = (compId: number) => {
  const found = companies.value.find((c) => Number(c.id) === Number(compId))
  return found ? found.trade_name || found.business_name : `Empresa #${compId}`
}

const onSuperAdminChange = () => {
  if (formUser.value.super_admin) {
    formUser.value.multi_company = false
    formUser.value.roleId = null
    formUser.value.companyIds = []
    formUser.value.companyRolesMap = {}
  } else {
    formUser.value.companyIds = [currentCompanyId.value]
  }
}

const onMultiCompanyChange = async () => {
  if (formUser.value.multi_company) {
    formUser.value.super_admin = false
    if (formUser.value.companyIds.length === 0) {
      formUser.value.companyIds = [currentCompanyId.value]
    }
    for (const cId of formUser.value.companyIds) {
      await ensureRolesForCompany(cId)
      if (formUser.value.companyRolesMap[cId] === undefined) {
        const firstRole = rolesByCompany.value[cId]?.[0]?.id ?? null
        formUser.value.companyRolesMap[cId] = firstRole
      }
    }
  }
}

const onToggleUserCompany = async (compId: number) => {
  const isSelected = formUser.value.companyIds.includes(compId)
  if (isSelected) {
    await ensureRolesForCompany(compId)
    if (formUser.value.companyRolesMap[compId] === undefined) {
      formUser.value.companyRolesMap[compId] = rolesByCompany.value[compId]?.[0]?.id ?? null
    }
  } else {
    delete formUser.value.companyRolesMap[compId]
  }
}

const openCreateUser = async () => {
  isEditingUser.value = false
  editingUserId.value = null
  await Promise.all([
    companies.value.length === 0
      ? getCompanies({ page: 1, limit: 100 }).then((res) => {
          companies.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
        }).catch(() => {})
      : Promise.resolve(),
    ensureRolesForCompany(currentCompanyId.value),
  ])
  const defaultRole = rolesByCompany.value[currentCompanyId.value]?.[0]?.id ?? null
  formUser.value = {
    companyId: currentCompanyId.value,
    num_document: '',
    birth_date: '',
    name_user: '',
    last_name_user: '',
    email: '',
    password: '',
    super_admin: false,
    multi_company: false,
    companyIds: [currentCompanyId.value],
    roleId: defaultRole,
    companyRolesMap: { [currentCompanyId.value]: defaultRole },
    theme_color: 'Blue_Theme',
  }
  showUserModal.value = true
}

const openEditUser = async (user: UserItem) => {
  isEditingUser.value = true
  editingUserId.value = user.id
  if (companies.value.length === 0) {
    try {
      const res = await getCompanies({ page: 1, limit: 100 })
      companies.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } catch (e) {}
  }

  const targetCompanyIds =
    user.companyIds && user.companyIds.length > 0
      ? user.companyIds.map(Number)
      : [currentCompanyId.value]

  const allCompToLoad = Array.from(new Set([currentCompanyId.value, ...targetCompanyIds]))
  await Promise.all(allCompToLoad.map((cId) => ensureRolesForCompany(cId)))

  const roleMap: Record<number, number | null> = {}
  if (Array.isArray(user.companyRoles)) {
    for (const cr of user.companyRoles) {
      roleMap[Number(cr.companyId)] = cr.roleId ? Number(cr.roleId) : null
    }
  }
  for (const cId of targetCompanyIds) {
    if (roleMap[cId] === undefined) {
      roleMap[cId] =
        cId === currentCompanyId.value && user.roleId
          ? Number(user.roleId)
          : rolesByCompany.value[cId]?.[0]?.id ?? null
    }
  }

  const isSuper = isCurrentUserSuperAdmin.value ? Boolean(user.super_admin || user.developer) : false
  formUser.value = {
    companyId: currentCompanyId.value,
    num_document: user.num_document || '',
    birth_date: user.birth_date ? String(user.birth_date).slice(0, 10) : '',
    name_user: user.name_user || '',
    last_name_user: user.last_name_user || '',
    email: user.email || '',
    password: '',
    super_admin: isSuper,
    multi_company: isSuper ? false : Boolean(user.multi_company),
    companyIds: isSuper ? [] : targetCompanyIds,
    roleId: isSuper
      ? null
      : user.roleId ?? roleMap[currentCompanyId.value] ?? rolesByCompany.value[currentCompanyId.value]?.[0]?.id ?? null,
    companyRolesMap: isSuper ? {} : roleMap,
    theme_color: user.theme_color || 'Blue_Theme',
  }
  showUserModal.value = true
}

const formRole = ref({
  companyId: 1,
  code: '',
  description: '',
  enabled: true,
  moduleAccess: {} as Record<number, boolean>,
  subModuleAccess: {} as Record<number, boolean>,
})

const formModule = ref({
  code: '',
  desc_icon: 'solar:widget-4-line-duotone',
  description: '',
  enabled: true,
})

const formSubModule = ref({
  moduleId: 0,
  code: '',
  desc_icon: 'solar:round-alt-arrow-right-line-duotone',
  description: '',
  url_desc: '',
  enabled: true,
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
  enabled: true,
  moduleIds: [] as number[],
  subModuleIds: [] as number[],
})

const loadCurrentTabData = async () => {
  successMsg.value = ''
  errorMsg.value = ''
  loading.value = true
  try {
    if (activeTab.value === 'companies') {
      const res = await getCompanies({ page: 1, limit: 50 })
      companies.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } else if (activeTab.value === 'branches') {
      const res = await getBranches(currentCompanyId.value)
      branches.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } else if (activeTab.value === 'users') {
      const [usersRes, compsRes] = await Promise.all([
        getUsers(currentCompanyId.value, { page: 1, limit: 50 }),
        getCompanies({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
        ensureRolesForCompany(currentCompanyId.value),
      ])
      users.value = Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []
      companies.value = Array.isArray(compsRes?.data) ? compsRes.data : Array.isArray(compsRes) ? compsRes : []
    } else if (activeTab.value === 'roles') {
      const [rolesRes, subsRes, modsRes, allSubModsRes] = await Promise.all([
        getRoles(currentCompanyId.value, { page: 1, limit: 50 }),
        getSubscriptions(currentCompanyId.value, { page: 1, limit: 50 }).catch(() => ({ data: [] })),
        getModules({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
        getSubModules({ page: 1, limit: 200 }).catch(() => ({ data: [] })),
      ])
      roles.value = Array.isArray(rolesRes?.data) ? rolesRes.data : Array.isArray(rolesRes) ? rolesRes : []
      rolesByCompany.value = {
        ...rolesByCompany.value,
        [currentCompanyId.value]: roles.value,
      }
      subscriptions.value = Array.isArray(subsRes?.data) ? subsRes.data : Array.isArray(subsRes) ? subsRes : []
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      allSubModulesList.value = Array.isArray(allSubModsRes?.data) ? allSubModsRes.data : Array.isArray(allSubModsRes) ? allSubModsRes : []
    } else if (activeTab.value === 'modules') {
      const [modsRes, subModsRes, allSubModsRes] = await Promise.all([
        getModules({ page: 1, limit: 100 }),
        getSubModules({ moduleId: filterModuleId.value, page: 1, limit: 100 }).catch(() => ({ data: [] })),
        getSubModules({ page: 1, limit: 200 }).catch(() => ({ data: [] })),
      ])
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      subModulesList.value = Array.isArray(subModsRes?.data) ? subModsRes.data : Array.isArray(subModsRes) ? subModsRes : []
      allSubModulesList.value = Array.isArray(allSubModsRes?.data) ? allSubModsRes.data : Array.isArray(allSubModsRes) ? allSubModsRes : []
    } else if (activeTab.value === 'subscriptions') {
      const [plansRes, subsRes, modsRes, allSubModsRes] = await Promise.all([
        getPlans({ page: 1, limit: 50 }),
        getSubscriptions(currentCompanyId.value, { page: 1, limit: 50 }).catch(() => ({ data: [] })),
        getModules({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
        getSubModules({ page: 1, limit: 200 }).catch(() => ({ data: [] })),
      ])
      plans.value = Array.isArray(plansRes?.data) ? plansRes.data : Array.isArray(plansRes) ? plansRes : []
      subscriptions.value = Array.isArray(subsRes?.data) ? subsRes.data : Array.isArray(subsRes) ? subsRes : []
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      allSubModulesList.value = Array.isArray(allSubModsRes?.data) ? allSubModsRes.data : Array.isArray(allSubModsRes) ? allSubModsRes : []
    }
  } catch (err: any) {
    console.error('Error cargando datos de configuración:', err)
    errorMsg.value = err.response?.data?.message || err.message || 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: 'companies' | 'branches' | 'users' | 'roles' | 'modules' | 'subscriptions') => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  loadCurrentTabData()
}

// Sincronizar pestaña con query params
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && ['companies', 'branches', 'users', 'roles', 'modules', 'subscriptions'].includes(newTab as string)) {
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
    const f = formCompany.value
    if (f.cert_p12_base64 && !f.cert_password) {
      errorMsg.value = 'Ingresa la contraseña de la firma electrónica (.p12).'
      companyFormTab.value = 'firma'
      return
    }
    const { has_certificate, has_smtp_password, ...rest } = f
    const payload: any = { ...rest }
    // No enviar vacíos de secretos para no sobrescribir los ya guardados
    if (!payload.cert_p12_base64) { delete payload.cert_p12_base64; delete payload.cert_password }
    if (!payload.smtp_password) delete payload.smtp_password
    if (!payload.cert_file_name) delete payload.cert_file_name
    if (!payload.remove_certificate) delete payload.remove_certificate

    if (isEditingCompany.value && editingCompanyId.value) {
      await updateCompany(editingCompanyId.value, payload)
      successMsg.value = 'Empresa actualizada exitosamente.'
    } else {
      await createCompany(payload)
      successMsg.value = 'Empresa y rol Administrador creados exitosamente.'
    }
    showCompanyModal.value = false
    formCompany.value = initialFormCompany()
    await loadCurrentTabData()
  } catch (err: any) {
    const m = err.response?.data?.message
    errorMsg.value = (Array.isArray(m) ? m.join(', ') : m) || 'Error al guardar la empresa'
  } finally {
    loading.value = false
  }
}

// =================== SUCURSALES (ESTABLECIMIENTOS) ===================
const branches = ref<BranchItem[]>([])
const isEditingBranch = ref(false)
const editingBranchId = ref<number | null>(null)
const emptyBranchForm = () => ({
  code: '',
  emission_point: '001',
  name: '',
  address: '',
  phone: '',
  email: '',
  is_matrix: false,
  enabled: true,
})
const formBranch = ref(emptyBranchForm())
// Ya existe una matriz en la empresa: no se puede marcar otra desde el formulario (se usa "Marcar como matriz")
const hasMatrix = computed(() => branches.value.some((b) => b.isMatrix))
const matrixSwitchLocked = computed(() => isEditingBranch.value || hasMatrix.value || branches.value.length === 0)

const onlyDigits3 = (value: string) => String(value || '').replace(/\D/g, '').slice(0, 3)

// Propone el siguiente número de establecimiento libre (001, 002, ...)
const nextBranchCode = () => {
  const used = new Set(branches.value.map((b) => Number(b.code)))
  let n = 1
  while (used.has(n)) n++
  return String(n).padStart(3, '0')
}

const openCreateBranch = () => {
  isEditingBranch.value = false
  editingBranchId.value = null
  errorMsg.value = ''
  // La primera sucursal es la matriz; si ya hay una, las nuevas son sucursales normales
  formBranch.value = { ...emptyBranchForm(), code: nextBranchCode(), is_matrix: branches.value.length === 0 }
  showBranchModal.value = true
}

const openEditBranch = (b: BranchItem) => {
  isEditingBranch.value = true
  editingBranchId.value = b.id
  errorMsg.value = ''
  formBranch.value = {
    code: b.code,
    emission_point: b.emissionPoint || '001',
    name: b.name,
    address: b.address,
    phone: b.phone || '',
    email: b.email || '',
    is_matrix: b.isMatrix,
    enabled: b.enabled,
  }
  showBranchModal.value = true
}

const branchErrorMessage = (err: any, fallback: string) => {
  const m = err?.response?.data?.message
  return (Array.isArray(m) ? m.join('. ') : m) || fallback
}

const submitBranch = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const f = formBranch.value
    const payload = {
      code: f.code,
      emission_point: f.emission_point,
      name: f.name.trim(),
      address: f.address.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
    }
    if (isEditingBranch.value && editingBranchId.value) {
      // La matriz no se cambia desde aquí: se usa la acción "Marcar como matriz"
      await updateBranch(currentCompanyId.value, editingBranchId.value, { ...payload, enabled: f.enabled })
      successMsg.value = 'Sucursal actualizada exitosamente.'
    } else {
      await createBranch(currentCompanyId.value, { ...payload, is_matrix: f.is_matrix && !hasMatrix.value })
      successMsg.value = 'Sucursal registrada exitosamente.'
    }
    showBranchModal.value = false
    await loadCurrentTabData()
    if (!errorMsg.value) successMsg.value = isEditingBranch.value ? 'Sucursal actualizada exitosamente.' : 'Sucursal registrada exitosamente.'
  } catch (err: any) {
    errorMsg.value = branchErrorMessage(err, 'Error al guardar la sucursal')
  } finally {
    loading.value = false
  }
}

const markAsMatrix = async (b: BranchItem) => {
  const actual = branches.value.find((x) => x.isMatrix)
  const msg = actual
    ? `¿Marcar ${b.code} - ${b.name} como matriz? La matriz actual (${actual.code} - ${actual.name}) pasará a ser una sucursal normal. Una empresa solo puede tener una matriz.`
    : `¿Marcar ${b.code} - ${b.name} como la matriz de la empresa?`
  if (!window.confirm(msg)) return
  errorMsg.value = ''
  try {
    await setMainBranch(currentCompanyId.value, b.id)
    await loadCurrentTabData()
    successMsg.value = `La sucursal ${b.code} - ${b.name} es ahora la matriz.`
  } catch (err: any) {
    errorMsg.value = branchErrorMessage(err, 'No se pudo cambiar la matriz')
  }
}

const toggleBranch = async (b: BranchItem) => {
  errorMsg.value = ''
  try {
    await updateBranch(currentCompanyId.value, b.id, { enabled: !b.enabled })
    await loadCurrentTabData()
    successMsg.value = `Sucursal ${b.code} ${b.enabled ? 'deshabilitada' : 'habilitada'}.`
  } catch (err: any) {
    errorMsg.value = branchErrorMessage(err, 'No se pudo cambiar el estado de la sucursal')
  }
}

const removeBranch = async (b: BranchItem) => {
  if (!window.confirm(`¿Eliminar la sucursal ${b.code} - ${b.name}? Las facturas ya emitidas conservan sus datos.`)) return
  errorMsg.value = ''
  try {
    await deleteBranch(currentCompanyId.value, b.id)
    await loadCurrentTabData()
    successMsg.value = `Sucursal ${b.code} eliminada.`
  } catch (err: any) {
    errorMsg.value = branchErrorMessage(err, 'No se pudo eliminar la sucursal')
  }
}

// =================== GUARDAR USUARIO ===================
const submitUser = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    formUser.value.companyId = currentCompanyId.value
    const isSuper = isCurrentUserSuperAdmin.value ? Boolean(formUser.value.super_admin) : false
    const isMulti = isSuper ? false : Boolean(formUser.value.multi_company)

    const companyRolesPayload = isSuper
      ? []
      : isMulti
      ? formUser.value.companyIds.map((cId) => ({
          companyId: Number(cId),
          roleId: formUser.value.companyRolesMap[Number(cId)]
            ? Number(formUser.value.companyRolesMap[Number(cId)])
            : null,
        }))
      : [
          {
            companyId: currentCompanyId.value,
            roleId: formUser.value.roleId ? Number(formUser.value.roleId) : null,
          },
        ]

    const effectiveRoleId = isSuper
      ? null
      : isMulti
      ? formUser.value.companyRolesMap[currentCompanyId.value] ?? null
      : formUser.value.roleId ?? null

    if (isEditingUser.value && editingUserId.value) {
      const payload: any = {
        companyId: currentCompanyId.value,
        num_document: formUser.value.num_document,
        birth_date: formUser.value.birth_date || null,
        name_user: formUser.value.name_user,
        last_name_user: formUser.value.last_name_user,
        email: formUser.value.email,
        super_admin: isSuper,
        developer: isSuper,
        multi_company: isMulti,
        companyIds: isSuper ? [] : isMulti ? formUser.value.companyIds.map(Number) : [currentCompanyId.value],
        roleId: effectiveRoleId,
        companyRoles: companyRolesPayload,
        theme_color: formUser.value.theme_color || 'Blue_Theme',
      }
      if (formUser.value.password) {
        payload.password = formUser.value.password
      }
      await updateUser(editingUserId.value, payload)
      successMsg.value = 'Usuario y configuración actualizados exitosamente.'

      // Si el usuario editado es el actual logueado, aplicar y persistir el tema inmediatamente
      if (authStore.tokenPayload?.user_id === editingUserId.value) {
        authStore.applyTheme(formUser.value.theme_color)
      }
    } else {
      await createUser({
        companyId: currentCompanyId.value,
        num_document: formUser.value.num_document,
        birth_date: formUser.value.birth_date || null,
        name_user: formUser.value.name_user,
        last_name_user: formUser.value.last_name_user,
        email: formUser.value.email,
        password: formUser.value.password,
        super_admin: isSuper,
        developer: isSuper,
        multi_company: isMulti,
        companyIds: isSuper ? [] : isMulti ? formUser.value.companyIds.map(Number) : [currentCompanyId.value],
        roleId: effectiveRoleId,
        companyRoles: companyRolesPayload,
        theme_color: formUser.value.theme_color || 'Blue_Theme',
      })
      successMsg.value = 'Usuario registrado exitosamente.'
    }
    showUserModal.value = false
    await Promise.all([loadCurrentTabData(), authStore.fetchCompanyAccess(currentCompanyId.value)])
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar el usuario'
  } finally {
    loading.value = false
  }
}

// =================== GESTIÓN DE ROLES (CABECERA Y DETALLE DE MÓDULOS) ===================
// Módulos Madre a los que tiene acceso la empresa activa según su suscripción vigente
const companyAccessibleModules = computed(() => {
  const activeSubs = subscriptions.value.filter((s) => s.enabled !== false)
  const subscribedModIds = new Set<number>()
  for (const s of activeSubs) {
    for (const mId of s.moduleIds || []) {
      subscribedModIds.add(Number(mId))
    }
  }
  const activeSystemMods = modulesList.value.filter((m) => m.enabled !== false)
  if (subscribedModIds.size > 0) {
    return activeSystemMods.filter((m) => subscribedModIds.has(Number(m.id)))
  }
  return activeSystemMods
})

// Submódulos Hijas a los que tiene acceso la empresa activa para un módulo padre dado
const getCompanyAccessibleSubModules = (modId: number) => {
  const activeSubs = subscriptions.value.filter((s) => s.enabled !== false)
  const subscribedSubModIds = new Set<number>()
  for (const s of activeSubs) {
    for (const smId of s.subModuleIds || []) {
      subscribedSubModIds.add(Number(smId))
    }
  }
  const childSubMods = allSubModulesList.value.filter(
    (sm) => Number(sm.moduleId) === Number(modId) && sm.enabled !== false
  )
  if (subscribedSubModIds.size > 0) {
    return childSubMods.filter((sm) => subscribedSubModIds.has(Number(sm.id)))
  }
  return childSubMods
}

const toggleRoleModuleAccess = (modId: number, val: boolean) => {
  formRole.value.moduleAccess[modId] = val
  const children = getCompanyAccessibleSubModules(modId)
  for (const sm of children) {
    formRole.value.subModuleAccess[sm.id] = val
  }
}

const toggleRoleSubModuleAccess = (subMod: SubModuleItem, val: boolean) => {
  formRole.value.subModuleAccess[subMod.id] = val
  if (val && subMod.moduleId) {
    formRole.value.moduleAccess[subMod.moduleId] = true
  }
}

const setAllRoleAccess = (val: boolean) => {
  for (const mod of companyAccessibleModules.value) {
    formRole.value.moduleAccess[mod.id] = val
    for (const sm of getCompanyAccessibleSubModules(mod.id)) {
      formRole.value.subModuleAccess[sm.id] = val
    }
  }
}

const openCreateRole = async () => {
  isEditingRole.value = false
  editingRoleId.value = null
  if (modulesList.value.length === 0 || allSubModulesList.value.length === 0) {
    try {
      const [subsRes, modsRes, subModsRes] = await Promise.all([
        getSubscriptions(currentCompanyId.value, { page: 1, limit: 50 }).catch(() => ({ data: [] })),
        getModules({ page: 1, limit: 100 }),
        getSubModules({ page: 1, limit: 200 }),
      ])
      subscriptions.value = Array.isArray(subsRes?.data) ? subsRes.data : Array.isArray(subsRes) ? subsRes : []
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      allSubModulesList.value = Array.isArray(subModsRes?.data) ? subModsRes.data : Array.isArray(subModsRes) ? subModsRes : []
    } catch (e) {}
  }

  const modMap: Record<number, boolean> = {}
  const subModMap: Record<number, boolean> = {}
  for (const mod of companyAccessibleModules.value) {
    modMap[mod.id] = true
    for (const sm of getCompanyAccessibleSubModules(mod.id)) {
      subModMap[sm.id] = true
    }
  }

  formRole.value = {
    companyId: currentCompanyId.value,
    code: computeNextSequentialCode(roles.value, 'ROL-'),
    description: '',
    enabled: true,
    moduleAccess: modMap,
    subModuleAccess: subModMap,
  }
  showRoleModal.value = true
}

const openEditRole = async (role: RoleItem) => {
  isEditingRole.value = true
  editingRoleId.value = role.id
  if (modulesList.value.length === 0 || allSubModulesList.value.length === 0) {
    try {
      const [subsRes, modsRes, subModsRes] = await Promise.all([
        getSubscriptions(currentCompanyId.value, { page: 1, limit: 50 }).catch(() => ({ data: [] })),
        getModules({ page: 1, limit: 100 }),
        getSubModules({ page: 1, limit: 200 }),
      ])
      subscriptions.value = Array.isArray(subsRes?.data) ? subsRes.data : Array.isArray(subsRes) ? subsRes : []
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      allSubModulesList.value = Array.isArray(subModsRes?.data) ? subModsRes.data : Array.isArray(subModsRes) ? subModsRes : []
    } catch (e) {}
  }

  const modSet = new Set((role.moduleIds || []).map(Number))
  const subModSet = new Set((role.subModuleIds || []).map(Number))

  const modMap: Record<number, boolean> = {}
  const subModMap: Record<number, boolean> = {}

  for (const mod of companyAccessibleModules.value) {
    modMap[mod.id] = modSet.has(Number(mod.id))
    for (const sm of getCompanyAccessibleSubModules(mod.id)) {
      subModMap[sm.id] = subModSet.has(Number(sm.id))
    }
  }

  // Si existen detalles explícitos con hasAccess boolean, respetarlos
  if (Array.isArray(role.details) && role.details.length > 0) {
    for (const d of role.details) {
      if (d.moduleId) {
        modMap[Number(d.moduleId)] = Boolean(d.hasAccess)
      }
      if (d.subModuleId) {
        subModMap[Number(d.subModuleId)] = Boolean(d.hasAccess)
      }
    }
  }

  formRole.value = {
    companyId: currentCompanyId.value,
    code: role.code || '',
    description: role.description || '',
    enabled: role.enabled !== false,
    moduleAccess: modMap,
    subModuleAccess: subModMap,
  }
  showRoleModal.value = true
}

const submitRole = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    formRole.value.companyId = currentCompanyId.value

    const selectedModIds: number[] = []
    const selectedSubModIds: number[] = []
    const detailsPayload: RoleAccessDetail[] = []

    for (const mod of companyAccessibleModules.value) {
      const hasModAccess = Boolean(formRole.value.moduleAccess[mod.id])
      if (hasModAccess) {
        selectedModIds.push(Number(mod.id))
      }
      detailsPayload.push({
        moduleId: Number(mod.id),
        subModuleId: null,
        hasAccess: hasModAccess,
      })

      for (const sm of getCompanyAccessibleSubModules(mod.id)) {
        const hasSubAccess = Boolean(formRole.value.subModuleAccess[sm.id])
        if (hasSubAccess) {
          selectedSubModIds.push(Number(sm.id))
        }
        detailsPayload.push({
          moduleId: null,
          subModuleId: Number(sm.id),
          hasAccess: hasSubAccess,
        })
      }
    }

    if (isEditingRole.value && editingRoleId.value) {
      await updateRole(editingRoleId.value, {
        companyId: currentCompanyId.value,
        code: formRole.value.code,
        description: formRole.value.description,
        enabled: formRole.value.enabled,
        moduleIds: selectedModIds,
        subModuleIds: selectedSubModIds,
        details: detailsPayload,
      })
      successMsg.value = 'Rol y detalle de accesos actualizados exitosamente.'
    } else {
      await createRole({
        companyId: currentCompanyId.value,
        code: formRole.value.code,
        description: formRole.value.description,
        moduleIds: selectedModIds,
        subModuleIds: selectedSubModIds,
        details: detailsPayload,
      })
      successMsg.value = 'Rol y detalle de accesos creados exitosamente.'
    }
    showRoleModal.value = false
    await Promise.all([loadCurrentTabData(), authStore.fetchCompanyAccess(currentCompanyId.value)])
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar el rol'
  } finally {
    loading.value = false
  }
}

// =================== GESTIÓN DE MÓDULOS Y SUBMÓDULOS ===================
const getModuleNameById = (modId?: number) => {
  if (!modId) return 'Sin Módulo'
  const found = modulesList.value.find((m) => m.id === modId)
  return found ? `${found.code} - ${found.description}` : `Módulo #${modId}`
}

const onFilterModuleChange = async () => {
  loading.value = true
  try {
    const subModsRes = await getSubModules({
      moduleId: filterModuleId.value,
      page: 1,
      limit: 100,
    })
    subModulesList.value = Array.isArray(subModsRes?.data)
      ? subModsRes.data
      : Array.isArray(subModsRes)
      ? subModsRes
      : []
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al filtrar submódulos'
  } finally {
    loading.value = false
  }
}

// Calcula el siguiente código secuencial tomando el último registrado y sumando 1
const computeNextSequentialCode = (
  items: { id: number; code: string }[],
  defaultPrefix: string
): string => {
  if (!items || items.length === 0) {
    return `${defaultPrefix}001`
  }
  const sorted = [...items].sort((a, b) => (b.id || 0) - (a.id || 0))
  const last = sorted[0]
  const match = String(last?.code || '').trim().match(/^(.*?)(\d+)$/)

  let prefix = defaultPrefix
  let padLen = 3
  let nextNum = (last?.id || items.length) + 1

  if (match && match[2]) {
    prefix = match[1] ?? defaultPrefix
    padLen = match[2].length
    nextNum = parseInt(match[2], 10) + 1
  }

  const existingCodes = new Set(items.map((i) => String(i.code || '').toUpperCase()))
  let candidate = `${prefix}${String(nextNum).padStart(padLen, '0')}`
  while (existingCodes.has(candidate.toUpperCase())) {
    nextNum++
    candidate = `${prefix}${String(nextNum).padStart(padLen, '0')}`
  }

  return candidate
}

const openCreateModule = () => {
  isEditingModule.value = false
  editingModuleId.value = null
  formModule.value = {
    code: computeNextSequentialCode(modulesList.value, 'MOD-'),
    desc_icon: 'solar:widget-4-line-duotone',
    description: '',
    enabled: true,
  }
  showModuleModal.value = true
}

const openEditModule = (mod: ModuleItem) => {
  isEditingModule.value = true
  editingModuleId.value = mod.id
  formModule.value = {
    code: mod.code || '',
    desc_icon: mod.desc_icon || 'solar:widget-4-line-duotone',
    description: mod.description || '',
    enabled: mod.enabled !== false,
  }
  showModuleModal.value = true
}

const submitModule = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    if (isEditingModule.value && editingModuleId.value) {
      await updateModule(editingModuleId.value, {
        code: formModule.value.code,
        desc_icon: formModule.value.desc_icon,
        description: formModule.value.description,
        enabled: formModule.value.enabled,
      })
      successMsg.value = 'Módulo actualizado exitosamente.'
    } else {
      await createModule({
        code: formModule.value.code,
        desc_icon: formModule.value.desc_icon,
        description: formModule.value.description,
      })
      successMsg.value = 'Módulo creado exitosamente.'
    }
    showModuleModal.value = false
    await Promise.all([loadCurrentTabData(), authStore.fetchCompanyAccess(currentCompanyId.value)])
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar el módulo'
  } finally {
    loading.value = false
  }
}

const openCreateSubModule = (preselectedModuleId?: number) => {
  isEditingSubModule.value = false
  editingSubModuleId.value = null
  const defaultModId =
    preselectedModuleId || filterModuleId.value || modulesList.value[0]?.id || 0
  const sourceList =
    allSubModulesList.value.length > 0 ? allSubModulesList.value : subModulesList.value
  formSubModule.value = {
    moduleId: defaultModId,
    code: computeNextSequentialCode(sourceList, 'SUB-'),
    desc_icon: 'solar:round-alt-arrow-right-line-duotone',
    description: '',
    url_desc: '/',
    enabled: true,
  }
  showSubModuleModal.value = true
}

const openEditSubModule = (subMod: SubModuleItem) => {
  isEditingSubModule.value = true
  editingSubModuleId.value = subMod.id
  formSubModule.value = {
    moduleId: subMod.moduleId || modulesList.value[0]?.id || 0,
    code: subMod.code || '',
    desc_icon: subMod.desc_icon || 'solar:round-alt-arrow-right-line-duotone',
    description: subMod.description || '',
    url_desc: subMod.url_desc || '/',
    enabled: subMod.enabled !== false,
  }
  showSubModuleModal.value = true
}

const submitSubModule = async () => {
  if (!formSubModule.value.moduleId) {
    errorMsg.value = 'Debes seleccionar un módulo principal para el submódulo.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    if (isEditingSubModule.value && editingSubModuleId.value) {
      await updateSubModule(editingSubModuleId.value, {
        moduleId: Number(formSubModule.value.moduleId),
        code: formSubModule.value.code,
        desc_icon: formSubModule.value.desc_icon,
        description: formSubModule.value.description,
        url_desc: formSubModule.value.url_desc,
        enabled: formSubModule.value.enabled,
      })
      successMsg.value = 'Submódulo actualizado exitosamente.'
    } else {
      await createSubModule({
        moduleId: Number(formSubModule.value.moduleId),
        code: formSubModule.value.code,
        desc_icon: formSubModule.value.desc_icon,
        description: formSubModule.value.description,
        url_desc: formSubModule.value.url_desc,
      })
      successMsg.value = 'Submódulo creado exitosamente.'
    }
    showSubModuleModal.value = false
    await Promise.all([loadCurrentTabData(), authStore.fetchCompanyAccess(currentCompanyId.value)])
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar el submódulo'
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

// =================== GUARDAR SUSCRIPCIÓN Y ACCESO A MÓDULOS ===================
const getPlanNameById = (planId?: number) => {
  if (!planId) return 'Sin Plan'
  const found = plans.value.find((p) => p.id === planId)
  return found ? `${found.description} ($${found.price})` : `Plan #${planId}`
}

const getSubModulesForModule = (modId: number) => {
  return allSubModulesList.value.filter((sm) => sm.moduleId === modId && sm.enabled !== false)
}

const getSubModuleNameById = (subModId: number) => {
  const found = allSubModulesList.value.find((sm) => sm.id === subModId)
  return found ? found.description : `Submódulo #${subModId}`
}

const toggleSubscriptionModule = (modId: number) => {
  const idx = formSubscription.value.moduleIds.indexOf(modId)
  const childSubModIds = getSubModulesForModule(modId).map((sm) => sm.id)

  if (idx >= 0) {
    // Desmarcar módulo y sus submódulos hijos
    formSubscription.value.moduleIds.splice(idx, 1)
    formSubscription.value.subModuleIds = formSubscription.value.subModuleIds.filter(
      (id) => !childSubModIds.includes(id)
    )
  } else {
    // Marcar módulo y todos sus submódulos hijos por defecto
    formSubscription.value.moduleIds.push(modId)
    for (const smId of childSubModIds) {
      if (!formSubscription.value.subModuleIds.includes(smId)) {
        formSubscription.value.subModuleIds.push(smId)
      }
    }
  }
}

const toggleSubscriptionSubModule = (subMod: SubModuleItem) => {
  const idx = formSubscription.value.subModuleIds.indexOf(subMod.id)
  if (idx >= 0) {
    formSubscription.value.subModuleIds.splice(idx, 1)
  } else {
    formSubscription.value.subModuleIds.push(subMod.id)
    // Asegurar que el módulo padre quede habilitado si se marca un submódulo hijo
    if (subMod.moduleId && !formSubscription.value.moduleIds.includes(subMod.moduleId)) {
      formSubscription.value.moduleIds.push(subMod.moduleId)
    }
  }
}

const selectAllSubscriptionAccess = () => {
  formSubscription.value.moduleIds = modulesList.value
    .filter((m) => m.enabled !== false)
    .map((m) => m.id)
  formSubscription.value.subModuleIds = allSubModulesList.value
    .filter((sm) => sm.enabled !== false)
    .map((sm) => sm.id)
}

const clearAllSubscriptionAccess = () => {
  formSubscription.value.moduleIds = []
  formSubscription.value.subModuleIds = []
}

const openCreateSubscription = async () => {
  isEditingSubscription.value = false
  editingSubscriptionId.value = null
  if (modulesList.value.length === 0 || allSubModulesList.value.length === 0) {
    try {
      const [modsRes, subModsRes] = await Promise.all([
        getModules({ page: 1, limit: 100 }),
        getSubModules({ page: 1, limit: 200 }),
      ])
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      allSubModulesList.value = Array.isArray(subModsRes?.data) ? subModsRes.data : Array.isArray(subModsRes) ? subModsRes : []
    } catch (e) {}
  }
  formSubscription.value = {
    companyId: currentCompanyId.value,
    planId: plans.value[0]?.id || 1,
    begin_date: todayStr,
    end_date: nextYearStr,
    enabled: true,
    moduleIds: modulesList.value.filter((m) => m.enabled !== false).map((m) => m.id),
    subModuleIds: allSubModulesList.value.filter((sm) => sm.enabled !== false).map((sm) => sm.id),
  }
  showSubscriptionModal.value = true
}

const openEditSubscription = async (sub: SubscriptionItem) => {
  isEditingSubscription.value = true
  editingSubscriptionId.value = sub.id
  if (modulesList.value.length === 0 || allSubModulesList.value.length === 0) {
    try {
      const [modsRes, subModsRes] = await Promise.all([
        getModules({ page: 1, limit: 100 }),
        getSubModules({ page: 1, limit: 200 }),
      ])
      modulesList.value = Array.isArray(modsRes?.data) ? modsRes.data : Array.isArray(modsRes) ? modsRes : []
      allSubModulesList.value = Array.isArray(subModsRes?.data) ? subModsRes.data : Array.isArray(subModsRes) ? subModsRes : []
    } catch (e) {}
  }
  formSubscription.value = {
    companyId: currentCompanyId.value,
    planId: sub.planId || plans.value[0]?.id || 1,
    begin_date: sub.begin_date ? String(sub.begin_date).slice(0, 10) : todayStr,
    end_date: sub.end_date ? String(sub.end_date).slice(0, 10) : nextYearStr,
    enabled: sub.enabled !== false,
    moduleIds: Array.isArray(sub.moduleIds) ? sub.moduleIds.map(Number) : [],
    subModuleIds: Array.isArray(sub.subModuleIds) ? sub.subModuleIds.map(Number) : [],
  }
  showSubscriptionModal.value = true
}

const submitSubscription = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    formSubscription.value.companyId = currentCompanyId.value
    if (isEditingSubscription.value && editingSubscriptionId.value) {
      await updateSubscription(editingSubscriptionId.value, {
        companyId: currentCompanyId.value,
        planId: formSubscription.value.planId,
        begin_date: formSubscription.value.begin_date,
        end_date: formSubscription.value.end_date,
        enabled: formSubscription.value.enabled,
        moduleIds: formSubscription.value.moduleIds.map(Number),
        subModuleIds: formSubscription.value.subModuleIds.map(Number),
      })
      successMsg.value = 'Suscripción actualizada y accesos sincronizados con el rol Administrador.'
    } else {
      await createSubscription({
        companyId: currentCompanyId.value,
        planId: formSubscription.value.planId,
        begin_date: formSubscription.value.begin_date,
        end_date: formSubscription.value.end_date,
        moduleIds: formSubscription.value.moduleIds.map(Number),
        subModuleIds: formSubscription.value.subModuleIds.map(Number),
      })
      successMsg.value = 'Suscripción creada y accesos asignados automáticamente al rol Administrador.'
    }
    delete rolesByCompany.value[currentCompanyId.value]
    showSubscriptionModal.value = false
    await Promise.all([loadCurrentTabData(), authStore.fetchCompanyAccess(currentCompanyId.value)])
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar la suscripción'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="settings-page" :class="{ 'form-open': isFormOpen }">
    
    <!-- ENCABEZADO DE MÓDULO -->
    <div class="card rounded-4 border-0 shadow-sm p-4 mb-4 bg-navy-card keep-in-form">
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

      <!-- PESTAÑAS TIPO PILLS (ESTILO SPIKE / PHP ORIGINAL) -->
      <ul v-show="!isFormOpen" class="nav nav-pills user-profile-tab mt-4 border-top border-dark-subtle pt-3" role="tablist">
        
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
            :class="{ 'active bg-primary text-white': activeTab === 'branches', 'text-white-50 hover-tab': activeTab !== 'branches' }"
            @click="switchTab('branches')"
          >
            <iconify-icon icon="solar:shop-2-line-duotone" class="fs-5"></iconify-icon>
            <span>Sucursales</span>
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

        <li class="nav-item me-2">
          <button
            class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fs-3 text-decoration-none"
            :class="{ 'active bg-primary text-white': activeTab === 'modules', 'text-white-50 hover-tab': activeTab !== 'modules' }"
            @click="switchTab('modules')"
          >
            <iconify-icon icon="solar:widget-4-line-duotone" class="fs-5"></iconify-icon>
            <span>Módulos & Submódulos</span>
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
        <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreateCompany">
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nueva Empresa</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
          <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
        </div>
        <p class="text-muted mt-2">Cargando empresas...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-primary">
            <tr>
              <th width="5%">#</th>
              <th width="15%">RUC</th>
              <th width="30%">Razón Social</th>
              <th width="20%">Nombre Comercial</th>
              <th width="12%">Ambiente SRI</th>
              <th width="8%">Estado</th>
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
                <span
                  class="badge d-inline-flex align-items-center gap-1 px-2 py-1"
                  :class="comp.fiscal?.sri_environment === '2' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'"
                >
                  <iconify-icon :icon="comp.fiscal?.sri_environment === '2' ? 'solar:shield-check-bold' : 'solar:test-tube-minimalistic-bold-duotone'"></iconify-icon>
                  {{ comp.fiscal?.sri_environment === '2' ? 'Producción' : 'Pruebas' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="comp.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ comp.enabled !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-info rounded-circle p-1" title="Editar" @click="openEditCompany(comp)">
                  <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr v-if="companies.length === 0">
              <td colspan="7" class="text-center text-muted py-5">No hay empresas registradas aún.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: SUCURSALES (ESTABLECIMIENTOS)                       -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'branches'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1">Sucursales de {{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'la Empresa Activa' }}</h5>
          <small class="text-secondary">Establecimientos y puntos de emisión con los que se factura (número de factura: establecimiento-punto de emisión-secuencial)</small>
        </div>
        <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreateBranch">
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nueva Sucursal</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
          <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
        </div>
        <p class="text-muted mt-2">Cargando sucursales...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-primary">
            <tr>
              <th width="9%">Estab.</th>
              <th width="9%">Pto. Emisión</th>
              <th width="20%">Nombre</th>
              <th width="26%">Dirección del establecimiento</th>
              <th width="16%">Contacto</th>
              <th width="8%">Tipo</th>
              <th width="8%">Estado</th>
              <th width="14%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in branches" :key="b.id">
              <td><span class="badge bg-primary text-white fw-bold font-monospace">{{ b.code }}</span></td>
              <td><span class="badge bg-dark-subtle text-white font-monospace">{{ b.emissionPoint }}</span></td>
              <td class="text-white fw-semibold">{{ b.name }}</td>
              <td class="text-white">{{ b.address }}</td>
              <td class="text-white">
                <div v-if="b.phone">{{ b.phone }}</div>
                <div v-if="b.email" class="fs-2 text-secondary">{{ b.email }}</div>
                <span v-if="!b.phone && !b.email" class="text-secondary fst-italic fs-2">Sin datos</span>
              </td>
              <td>
                <span class="badge" :class="b.isMatrix ? 'bg-info-subtle text-info border border-info-subtle' : 'bg-secondary-subtle text-secondary'">
                  {{ b.isMatrix ? 'Matriz' : 'Sucursal' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="b.enabled ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ b.enabled ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-info rounded-circle p-1 me-1" title="Editar sucursal" @click="openEditBranch(b)">
                  <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                </button>
                <button v-if="!b.isMatrix && b.enabled" class="btn btn-sm btn-outline-success rounded-circle p-1 me-1" title="Marcar como matriz" @click="markAsMatrix(b)">
                  <iconify-icon icon="solar:crown-line-duotone" class="fs-4"></iconify-icon>
                </button>
                <button v-if="!b.isMatrix" class="btn btn-sm btn-outline-warning rounded-circle p-1 me-1" :title="b.enabled ? 'Deshabilitar' : 'Habilitar'" @click="toggleBranch(b)">
                  <iconify-icon :icon="b.enabled ? 'solar:eye-closed-line-duotone' : 'solar:eye-line-duotone'" class="fs-4"></iconify-icon>
                </button>
                <button v-if="!b.isMatrix" class="btn btn-sm btn-outline-danger rounded-circle p-1" title="Eliminar sucursal" @click="removeBranch(b)">
                  <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr v-if="branches.length === 0">
              <td colspan="8" class="text-center text-muted py-5">
                Esta empresa aún no tiene sucursales. Registra la primera (será la matriz) para poder facturar por establecimiento.
              </td>
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
        <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
          <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
        </div>
        <p class="text-muted mt-2">Cargando usuarios...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-primary">
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
                <span v-if="user.super_admin || user.developer" class="badge bg-danger-subtle text-danger border border-danger-subtle me-1">
                  <iconify-icon icon="solar:shield-star-bold" class="me-1"></iconify-icon>Super Admin (Acceso Total)
                </span>
                <template v-else-if="user.multi_company">
                  <span class="badge bg-warning-subtle text-warning border border-warning-subtle me-1">
                    <iconify-icon icon="solar:buildings-bold" class="me-1"></iconify-icon>Multi-Empresa
                  </span>
                  <div v-if="user.companyRoles && user.companyRoles.length > 0" class="d-flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="cr in user.companyRoles"
                      :key="cr.companyId"
                      class="badge bg-dark-subtle text-info border border-info-subtle fs-1"
                    >
                      {{ getCompanyNameById(cr.companyId) }}: <strong>{{ cr.roleName || 'Sin rol' }}</strong>
                    </span>
                  </div>
                </template>
                <span v-else-if="user.roleName" class="badge bg-primary-subtle text-primary border border-primary-subtle">
                  <iconify-icon icon="solar:shield-check-bold" class="me-1"></iconify-icon>{{ user.roleName }}
                </span>
                <span v-else class="badge bg-secondary-subtle text-secondary">
                  Sin rol asignado
                </span>
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
    <!-- TAB 3: ROLES (CABECERA Y DETALLE POR EMPRESA)            -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'roles'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1">Roles de Usuario ({{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'Empresa Activa' }})</h5>
          <small class="text-secondary">Definición de roles (cabecera) y matriz booleana de acceso a módulos madre e hijas (detalle)</small>
        </div>
        <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreateRole">
          <iconify-icon icon="solar:shield-plus-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo Rol</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
          <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
        </div>
        <p class="text-muted mt-2">Cargando roles de la empresa...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-primary">
            <tr>
              <th width="6%">#</th>
              <th width="14%">Código</th>
              <th width="26%">Descripción del Rol</th>
              <th width="36%">Detalle de Accesos (Módulos Madre e Hijas = true)</th>
              <th width="9%">Estado</th>
              <th width="9%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id">
              <td><span class="badge bg-dark-subtle text-white">{{ role.id }}</span></td>
              <td><span class="badge bg-primary text-white fw-bold font-monospace">{{ role.code }}</span></td>
              <td class="text-white fw-semibold">{{ role.description }}</td>
              <td>
                <div v-if="(role.moduleIds && role.moduleIds.length > 0) || (role.subModuleIds && role.subModuleIds.length > 0)" class="d-flex flex-wrap gap-1">
                  <span
                    v-for="modId in role.moduleIds"
                    :key="'rm-' + modId"
                    class="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1"
                  >
                    <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                    {{ getModuleNameById(modId) }}
                  </span>
                  <span
                    v-if="role.subModuleIds && role.subModuleIds.length > 0"
                    class="badge bg-info-subtle text-info border border-info-subtle"
                  >
                    +{{ role.subModuleIds.length }} submódulo(s) activos
                  </span>
                </div>
                <span v-else class="text-secondary fs-2 fst-italic">Sin módulos en true</span>
              </td>
              <td>
                <span class="badge" :class="role.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ role.enabled !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <button
                  class="btn btn-sm btn-outline-info rounded-circle p-1"
                  title="Editar Cabecera y Detalle de Permisos del Rol"
                  @click="openEditRole(role)"
                >
                  <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr v-if="roles.length === 0">
              <td colspan="6" class="text-center text-muted py-5">No hay roles creados para esta empresa.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 3.5: MÓDULOS & SUBMÓDULOS                            -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'modules'" class="d-flex flex-column gap-4">
      
      <!-- SUBSECTION 1: MÓDULOS PRINCIPALES (tab_module) -->
      <div class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h5 class="fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <iconify-icon icon="solar:widget-4-line-duotone" class="text-primary fs-5"></iconify-icon>
              <span>Módulos Principales del Sistema</span>
            </h5>
            <small class="text-secondary">Agrupadores principales del menú lateral (Ej. Ventas, Compras, Contabilidad, Inventario)</small>
          </div>
          <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreateModule">
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
            <span>Nuevo Módulo</span>
          </button>
        </div>

        <div v-if="loading" class="text-center py-4">
          <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
            <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
            <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
          </div>
          <p class="text-muted mt-2">Cargando módulos...</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-primary">
              <tr>
                <th width="8%">#</th>
                <th width="12%">Icono</th>
                <th width="18%">Código</th>
                <th width="34%">Nombre / Descripción</th>
                <th width="12%">Estado</th>
                <th width="16%" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mod in modulesList" :key="mod.id">
                <td><span class="badge bg-dark-subtle text-white">{{ mod.id }}</span></td>
                <td>
                  <div class="d-inline-flex align-items-center gap-2 bg-dark-subtle px-2 py-1 rounded border border-secondary-subtle">
                    <iconify-icon :icon="mod.desc_icon || 'solar:widget-4-line-duotone'" class="fs-5 text-primary"></iconify-icon>
                    <small class="text-secondary font-monospace d-none d-lg-inline">{{ mod.desc_icon }}</small>
                  </div>
                </td>
                <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">{{ mod.code }}</span></td>
                <td class="text-white fw-semibold">{{ mod.description }}</td>
                <td>
                  <span class="badge" :class="mod.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                    {{ mod.enabled !== false ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button
                      class="btn btn-sm btn-outline-primary rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1"
                      title="Agregar Submódulo a este Módulo"
                      @click="openCreateSubModule(mod.id)"
                    >
                      <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
                      <span class="d-none d-md-inline fs-1">Submódulo</span>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-info rounded-circle p-1"
                      title="Editar Módulo"
                      @click="openEditModule(mod)"
                    >
                      <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="modulesList.length === 0">
                <td colspan="6" class="text-center text-muted py-4">
                  No hay módulos registrados aún. Haz clic en <strong>"Nuevo Módulo"</strong> para crear el primero.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUBSECTION 2: SUBMÓDULOS Y RUTAS (tab_sub_module) -->
      <div class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h5 class="fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <iconify-icon icon="solar:layers-minimalistic-line-duotone" class="text-info fs-5"></iconify-icon>
              <span>Submódulos (Vistas y Rutas Hijas)</span>
            </h5>
            <small class="text-secondary">Opciones internas asociadas a cada módulo principal y su ruta URL</small>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-2">
            <!-- Filtro por Módulo Padre -->
            <div class="d-flex align-items-center gap-2">
              <small class="text-secondary text-nowrap">Filtrar por módulo:</small>
              <select
                v-model="filterModuleId"
                class="form-select form-select-sm bg-dark-subtle border-secondary text-white rounded-pill px-3"
                style="min-width: 200px;"
                @change="onFilterModuleChange"
              >
                <option :value="undefined">Todos los módulos</option>
                <option v-for="mod in modulesList" :key="mod.id" :value="mod.id">
                  {{ mod.code }} - {{ mod.description }}
                </option>
              </select>
            </div>

            <button
              class="btn btn-info text-dark fw-semibold rounded-pill px-4 d-flex align-items-center gap-2"
              :disabled="modulesList.length === 0"
              @click="openCreateSubModule()"
            >
              <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
              <span>Nuevo Submódulo</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-primary">
              <tr>
                <th width="6%">#</th>
                <th width="20%">Módulo Padre</th>
                <th width="10%">Icono</th>
                <th width="14%">Código</th>
                <th width="22%">Descripción</th>
                <th width="14%">Ruta (URL)</th>
                <th width="7%">Estado</th>
                <th width="7%" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="subMod in subModulesList" :key="subMod.id">
                <td><span class="badge bg-dark-subtle text-white">{{ subMod.id }}</span></td>
                <td>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {{ getModuleNameById(subMod.moduleId) }}
                  </span>
                </td>
                <td>
                  <span class="d-inline-flex align-items-center justify-content-center p-1 bg-dark-subtle rounded border border-secondary-subtle">
                    <iconify-icon :icon="subMod.desc_icon || 'solar:round-alt-arrow-right-line-duotone'" class="fs-5 text-info"></iconify-icon>
                  </span>
                </td>
                <td><span class="badge bg-info-subtle text-info border border-info-subtle fw-bold">{{ subMod.code }}</span></td>
                <td class="text-white fw-semibold">{{ subMod.description }}</td>
                <td><code class="text-warning bg-dark-subtle px-2 py-1 rounded">{{ subMod.url_desc }}</code></td>
                <td>
                  <span class="badge" :class="subMod.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                    {{ subMod.enabled !== false ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end">
                  <button
                    class="btn btn-sm btn-outline-info rounded-circle p-1"
                    title="Editar Submódulo"
                    @click="openEditSubModule(subMod)"
                  >
                    <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                  </button>
                </td>
              </tr>
              <tr v-if="subModulesList.length === 0">
                <td colspan="8" class="text-center text-muted py-4">
                  No hay submódulos registrados{{ filterModuleId ? ' para el módulo seleccionado' : '' }}.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
            <small class="text-secondary">Vigencia, plan contratado y acceso a módulos/submódulos de la empresa activa</small>
          </div>
          <button class="btn btn-outline-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreateSubscription">
            <iconify-icon icon="solar:card-recive-line-duotone" class="fs-5"></iconify-icon>
            <span>Asignar Suscripción</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-primary">
              <tr>
                <th width="5%">#</th>
                <th width="16%">Plan Contratado</th>
                <th width="12%">Fecha Inicio</th>
                <th width="12%">Fecha Fin</th>
                <th width="37%">Módulos & Submódulos con Acceso</th>
                <th width="10%">Estado</th>
                <th width="8%" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in subscriptions" :key="sub.id">
                <td><span class="badge bg-dark-subtle text-white">{{ sub.id }}</span></td>
                <td><span class="badge bg-info text-dark fw-bold">{{ getPlanNameById(sub.planId) }}</span></td>
                <td class="text-white">{{ new Date(sub.begin_date).toLocaleDateString() }}</td>
                <td class="text-white">{{ new Date(sub.end_date).toLocaleDateString() }}</td>
                <td>
                  <div v-if="(sub.moduleIds && sub.moduleIds.length > 0) || (sub.subModuleIds && sub.subModuleIds.length > 0)" class="d-flex flex-wrap gap-1">
                    <span
                      v-for="modId in sub.moduleIds"
                      :key="'m-' + modId"
                      class="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1"
                    >
                      <iconify-icon icon="solar:widget-4-line-duotone"></iconify-icon>
                      {{ getModuleNameById(modId) }}
                    </span>
                    <span
                      v-if="sub.subModuleIds && sub.subModuleIds.length > 0"
                      class="badge bg-info-subtle text-info border border-info-subtle"
                      :title="sub.subModuleIds.map(getSubModuleNameById).join(', ')"
                    >
                      +{{ sub.subModuleIds.length }} submódulo(s)
                    </span>
                  </div>
                  <span v-else class="text-secondary fs-2 fst-italic">Sin módulos asignados</span>
                </td>
                <td>
                  <span class="badge" :class="sub.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                    {{ sub.enabled !== false ? 'Vigente' : 'Expirada' }}
                  </span>
                </td>
                <td class="text-end">
                  <button
                    class="btn btn-sm btn-outline-info rounded-circle p-1"
                    title="Editar Suscripción y Módulos Habilitados"
                    @click="openEditSubscription(sub)"
                  >
                    <iconify-icon icon="solar:pen-2-line-duotone" class="fs-4"></iconify-icon>
                  </button>
                </td>
              </tr>
              <tr v-if="subscriptions.length === 0">
                <td colspan="7" class="text-center text-muted py-4">Esta empresa no tiene suscripciones registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ======================================================== -->
    <!-- MODALES DE CREACIÓN                                      -->
    <!-- ======================================================== -->

    <!-- 0. FORMULARIO NUEVA / EDITAR SUCURSAL -->
      <div v-if="showBranchModal" id="form-page" class="form-page">
        <div class="form-page-card">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:shop-2-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingBranch ? 'Editar Sucursal' : 'Registrar Nueva Sucursal' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showBranchModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitBranch">
              <div class="modal-body p-4">
                <div class="alert alert-info d-flex align-items-start gap-2 py-2 mb-4">
                  <iconify-icon icon="solar:info-circle-line-duotone" class="fs-5 mt-1"></iconify-icon>
                  <span class="fs-2">
                    El número de factura se forma con el <b>establecimiento</b>, el <b>punto de emisión</b> y un secuencial:
                    <span class="font-monospace">{{ formBranch.code || '001' }}-{{ formBranch.emission_point || '001' }}-000000001</span>.
                    Cada combinación lleva su propia numeración. La dirección se envía al SRI como dirección del establecimiento.
                  </span>
                </div>

                <div class="row">
                  <div class="col-md-3 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Establecimiento (3 dígitos) *</label>
                    <input v-model="formBranch.code" @input="formBranch.code = onlyDigits3(formBranch.code)" type="text" inputmode="numeric" maxlength="3" minlength="3" pattern="[0-9]{3}" class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace" placeholder="001" required />
                  </div>
                  <div class="col-md-3 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Punto de emisión (3 dígitos) *</label>
                    <input v-model="formBranch.emission_point" @input="formBranch.emission_point = onlyDigits3(formBranch.emission_point)" type="text" inputmode="numeric" maxlength="3" minlength="3" pattern="[0-9]{3}" class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace" placeholder="001" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Nombre de la sucursal *</label>
                    <input v-model="formBranch.name" type="text" maxlength="150" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Ej. Sucursal Norte" required />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Dirección del establecimiento *</label>
                  <input v-model="formBranch.address" type="text" maxlength="300" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Calle principal, número y secundaria, ciudad" required />
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Teléfono</label>
                    <input v-model="formBranch.phone" type="text" maxlength="30" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Ej. 022998800" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Correo electrónico</label>
                    <input v-model="formBranch.email" type="email" maxlength="150" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="sucursal@empresa.com" />
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-2">
                    <div class="form-check form-switch">
                      <input id="branchMatrix" v-model="formBranch.is_matrix" class="form-check-input" type="checkbox" role="switch" :disabled="matrixSwitchLocked" />
                      <label class="form-check-label text-secondary fs-2 fw-semibold" for="branchMatrix">Es la matriz de la empresa</label>
                    </div>
                    <small class="text-secondary d-block mt-1">
                      Una empresa solo puede tener una matriz.
                      <template v-if="branches.length === 0 && !isEditingBranch">La primera sucursal es la matriz.</template>
                      <template v-else-if="isEditingBranch && formBranch.is_matrix">Esta es la matriz actual; para cambiarla usa "Marcar como matriz" en otra sucursal.</template>
                      <template v-else-if="hasMatrix">Ya existe una matriz; para cambiarla usa "Marcar como matriz" en el listado.</template>
                    </small>
                  </div>
                  <div v-if="isEditingBranch" class="col-md-6 mb-2">
                    <div class="form-check form-switch">
                      <input id="branchEnabled" v-model="formBranch.enabled" class="form-check-input" type="checkbox" role="switch" />
                      <label class="form-check-label text-secondary fs-2 fw-semibold" for="branchEnabled">Sucursal activa (se puede facturar con ella)</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showBranchModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingBranch ? 'Guardar Cambios' : 'Guardar Sucursal') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 1. MODAL NUEVA / EDITAR EMPRESA -->
      <div v-if="showCompanyModal" id="form-page" class="form-page">
        <div class="form-page-card form-page-card-lg">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:buildings-3-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showCompanyModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitCompany">
              <ul class="nav nav-pills gap-2 px-4 pt-3">
                <li class="nav-item" v-for="t in [{k:'general',l:'General'},{k:'fiscal',l:'Datos SRI'},{k:'firma',l:'Firma electrónica'},{k:'correo',l:'Correo (SMTP)'}]" :key="t.k">
                  <button type="button" class="nav-link rounded-pill px-4 py-2 fs-3 text-decoration-none" :class="companyFormTab === t.k ? 'active bg-primary text-white' : 'text-white-50'" @click="companyFormTab = t.k as any">{{ t.l }}</button>
                </li>
              </ul>
              <div class="modal-body p-4">
                <!-- GENERAL -->
                <div v-show="companyFormTab === 'general'" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">RUC *</label>
                    <input v-model="formCompany.ruc" type="text" maxlength="13" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="1725620247001" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Nombre Comercial *</label>
                    <input v-model="formCompany.trade_name" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary fs-2 fw-semibold">Razón Social *</label>
                    <input v-model="formCompany.business_name" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary fs-2 fw-semibold">Dirección de Matriz</label>
                    <input v-model="formCompany.address_matriz" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Teléfono</label>
                    <input v-model="formCompany.phone" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Correo de la empresa</label>
                    <input v-model="formCompany.email" type="email" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary fs-2 fw-semibold">Descripción / Actividad económica *</label>
                    <textarea v-model="formCompany.description" class="form-control bg-dark-subtle border-secondary-subtle text-white" rows="2" required></textarea>
                  </div>

                  <!-- Selector de Ambiente SRI en pestaña General -->
                  <div class="col-12 mt-2 pt-2 border-top border-dark-subtle">
                    <label class="form-label text-secondary fs-2 fw-semibold fw-bold d-flex align-items-center gap-2 mb-2">
                      <iconify-icon icon="solar:server-square-bold-duotone" class="text-primary fs-5"></iconify-icon>
                      Ambiente de Emisión SRI *
                    </label>
                    <div class="row g-2">
                      <div class="col-md-6">
                        <div
                          class="p-3 rounded-3 border transition-all d-flex align-items-center gap-3"
                          :class="formCompany.sri_environment === '1' ? 'border-warning bg-warning-subtle text-warning' : 'border-secondary-subtle bg-dark-subtle text-secondary'"
                          @click="formCompany.sri_environment = '1'"
                          style="cursor: pointer;"
                        >
                          <div class="rounded-circle p-2 bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                            <iconify-icon icon="solar:test-tube-minimalistic-bold-duotone" class="fs-5"></iconify-icon>
                          </div>
                          <div>
                            <div class="fw-bold fs-3 text-white">1 - Ambiente de Pruebas</div>
                            <small class="text-white-50 d-block fs-1">Comprobantes de prueba e integración SRI sin validez fiscal.</small>
                          </div>
                          <iconify-icon v-if="formCompany.sri_environment === '1'" icon="solar:check-circle-bold" class="fs-5 text-warning ms-auto flex-shrink-0"></iconify-icon>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div
                          class="p-3 rounded-3 border transition-all d-flex align-items-center gap-3"
                          :class="formCompany.sri_environment === '2' ? 'border-success bg-success-subtle text-success' : 'border-secondary-subtle bg-dark-subtle text-secondary'"
                          @click="formCompany.sri_environment = '2'"
                          style="cursor: pointer;"
                        >
                          <div class="rounded-circle p-2 bg-success-subtle text-success border border-success-subtle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                            <iconify-icon icon="solar:shield-check-bold" class="fs-5"></iconify-icon>
                          </div>
                          <div>
                            <div class="fw-bold fs-3 text-white">2 - Ambiente de Producción</div>
                            <small class="text-white-50 d-block fs-1">Facturas reales con autorización formal del SRI.</small>
                          </div>
                          <iconify-icon v-if="formCompany.sri_environment === '2'" icon="solar:check-circle-bold" class="fs-5 text-success ms-auto flex-shrink-0"></iconify-icon>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SRI -->
                <div v-show="companyFormTab === 'fiscal'" class="row g-3">
                  <div class="col-12">
                    <label class="form-label text-secondary fs-2 fw-semibold fw-bold d-flex align-items-center gap-2 mb-2">
                      <iconify-icon icon="solar:server-square-bold-duotone" class="text-primary fs-5"></iconify-icon>
                      Ambiente SRI *
                    </label>
                    <div class="row g-2">
                      <div class="col-md-6">
                        <div
                          class="p-3 rounded-3 border transition-all d-flex align-items-center gap-3"
                          :class="formCompany.sri_environment === '1' ? 'border-warning bg-warning-subtle text-warning' : 'border-secondary-subtle bg-dark-subtle text-secondary'"
                          @click="formCompany.sri_environment = '1'"
                          style="cursor: pointer;"
                        >
                          <div class="rounded-circle p-2 bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                            <iconify-icon icon="solar:test-tube-minimalistic-bold-duotone" class="fs-5"></iconify-icon>
                          </div>
                          <div>
                            <div class="fw-bold fs-3 text-white">1 - Pruebas</div>
                            <small class="text-white-50 d-block fs-1">Sin validez fiscal real.</small>
                          </div>
                          <iconify-icon v-if="formCompany.sri_environment === '1'" icon="solar:check-circle-bold" class="fs-5 text-warning ms-auto flex-shrink-0"></iconify-icon>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div
                          class="p-3 rounded-3 border transition-all d-flex align-items-center gap-3"
                          :class="formCompany.sri_environment === '2' ? 'border-success bg-success-subtle text-success' : 'border-secondary-subtle bg-dark-subtle text-secondary'"
                          @click="formCompany.sri_environment = '2'"
                          style="cursor: pointer;"
                        >
                          <div class="rounded-circle p-2 bg-success-subtle text-success border border-success-subtle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                            <iconify-icon icon="solar:shield-check-bold" class="fs-5"></iconify-icon>
                          </div>
                          <div>
                            <div class="fw-bold fs-3 text-white">2 - Producción</div>
                            <small class="text-white-50 d-block fs-1">Facturas autorizadas formalmente.</small>
                          </div>
                          <iconify-icon v-if="formCompany.sri_environment === '2'" icon="solar:check-circle-bold" class="fs-5 text-success ms-auto flex-shrink-0"></iconify-icon>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Régimen tributario</label>
                    <select v-model="formCompany.tax_regime" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                      <option value="GENERAL">General</option>
                      <option value="RIMPE_EMPRENDEDOR">RIMPE - Emprendedor</option>
                      <option value="RIMPE_NEGOCIO_POPULAR">RIMPE - Negocio Popular</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Establecimiento por defecto</label>
                    <input v-model="formCompany.default_establishment" type="text" maxlength="3" class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Punto de emisión por defecto</label>
                    <input v-model="formCompany.default_emission_point" type="text" maxlength="3" class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Nº Resolución Contribuyente Especial</label>
                    <input v-model="formCompany.special_taxpayer" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Dejar vacío si no aplica" />
                  </div>
                  <div class="col-md-6 d-flex align-items-end">
                    <div class="form-check form-switch">
                      <input v-model="formCompany.obligated_accounting" class="form-check-input" type="checkbox" id="chkContab" />
                      <label class="form-check-label text-white-50" for="chkContab">Obligado a llevar contabilidad</label>
                    </div>
                  </div>
                </div>

                <!-- FIRMA -->
                <div v-show="companyFormTab === 'firma'" class="row g-3">
                  <div class="col-12">
                    <div v-if="formCompany.has_certificate || formCompany.cert_file_name" class="alert alert-success py-2 d-flex justify-content-between align-items-center">
                      <span>Firma cargada: <strong>{{ formCompany.cert_file_name || 'certificado.p12' }}</strong></span>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="removeP12">Quitar</button>
                    </div>
                    <div v-else class="alert alert-secondary py-2 mb-0">No hay firma electrónica cargada.</div>
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary fs-2 fw-semibold">Archivo de firma (.p12 / .pfx)</label>
                    <input type="file" accept=".p12,.pfx" class="form-control bg-dark-subtle border-secondary-subtle text-white" @change="onP12Selected" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Contraseña de la firma</label>
                    <input v-model="formCompany.cert_password" type="password" autocomplete="new-password" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Solo al cargar un archivo nuevo" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Fecha de caducidad</label>
                    <input v-model="formCompany.cert_expires_at" type="date" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <small class="text-secondary">El archivo y su contraseña se guardan cifrados (AES-256) y nunca se devuelven al navegador.</small>
                </div>

                <!-- SMTP -->
                <div v-show="companyFormTab === 'correo'" class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label text-secondary fs-2 fw-semibold">Servidor SMTP</label>
                    <input v-model="formCompany.smtp_host" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="smtp.gmail.com" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary fs-2 fw-semibold">Puerto</label>
                    <input v-model.number="formCompany.smtp_port" type="number" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Usuario</label>
                    <input v-model="formCompany.smtp_user" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Contraseña {{ formCompany.has_smtp_password ? '(guardada, vacío = no cambiar)' : '' }}</label>
                    <input v-model="formCompany.smtp_password" type="password" autocomplete="new-password" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Nombre del remitente</label>
                    <input v-model="formCompany.smtp_from_name" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary fs-2 fw-semibold">Correo del remitente</label>
                    <input v-model="formCompany.smtp_from_email" type="email" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                  <div class="col-12">
                    <div class="form-check form-switch">
                      <input v-model="formCompany.smtp_secure" class="form-check-input" type="checkbox" id="chkSsl" />
                      <label class="form-check-label text-white-50" for="chkSsl">Usar SSL/TLS</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showCompanyModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingCompany ? 'Guardar Cambios' : 'Guardar Empresa') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 2. MODAL NUEVO / EDITAR USUARIO -->
      <div v-if="showUserModal" id="form-page" class="form-page">
        <div class="form-page-card form-page-card-lg">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon :icon="isEditingUser ? 'solar:user-bold' : 'solar:user-plus-line-duotone'" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingUser ? 'Editar Usuario del Sistema' : 'Crear Usuario del Sistema' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="closeUserModal">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitUser">
              <div class="modal-body p-4">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Número de Cédula / Documento</label>
                    <input v-model="formUser.num_document" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Ej. 1725620247" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Fecha de Nacimiento</label>
                    <input v-model="formUser.birth_date" type="date" :max="new Date().toISOString().slice(0, 10)" class="form-control bg-dark-subtle border-secondary-subtle text-white" />
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Nombres</label>
                    <input v-model="formUser.name_user" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Nombre" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Apellidos</label>
                    <input v-model="formUser.last_name_user" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Apellido" required />
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico (Login)</label>
                  <input v-model="formUser.email" type="email" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="usuario@correo.com" required />
                </div>
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center">
                    <span>Contraseña</span>
                    <span v-if="isEditingUser" class="text-secondary fs-2">(Dejar en blanco para mantener la actual)</span>
                  </label>
                  <input
                    v-model="formUser.password"
                    type="password"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    :placeholder="isEditingUser ? '•••••••• (Sin cambios)' : 'Contraseña segura'"
                    :required="!isEditingUser"
                  />
                </div>

                <!-- PRIVILEGIOS: SUPER ADMIN, MULTI-EMPRESA Y ROL POR EMPRESA -->
                <div class="mb-3 pt-3 border-top border-dark-subtle">
                  <label class="form-label text-white fw-semibold mb-2">Permisos, Empresas y Asignación de Rol</label>
                  <div class="row g-2 mb-3">
                    <!-- Switch Super Admin (Visible solo cuando el usuario logueado es Super Admin; deshabilitado si Multi-Empresa está activo) -->
                    <div v-if="isCurrentUserSuperAdmin" :class="formUser.super_admin ? 'col-12' : 'col-md-6'">
                      <div
                        class="form-check form-switch bg-dark-subtle p-3 rounded border d-flex align-items-center justify-content-between"
                        :class="[
                          formUser.super_admin ? 'border-danger' : 'border-secondary-subtle',
                          formUser.multi_company ? 'opacity-50' : ''
                        ]"
                      >
                        <label class="form-check-label text-white ms-0 cursor-pointer" for="switchSuperAdmin">
                          <div class="fw-bold d-flex align-items-center gap-1 text-danger">
                            <iconify-icon icon="solar:shield-star-bold"></iconify-icon> Super Admin
                          </div>
                          <small class="text-secondary d-block fs-1">
                            {{
                              formUser.multi_company
                                ? 'Desactivado porque el usuario es Multi-Empresa'
                                : 'Acceso total a todas las empresas y módulos del sistema (no requiere rol)'
                            }}
                          </small>
                        </label>
                        <input
                          v-model="formUser.super_admin"
                          class="form-check-input fs-5 m-0 cursor-pointer"
                          type="checkbox"
                          id="switchSuperAdmin"
                          :disabled="formUser.multi_company"
                          @change="onSuperAdminChange"
                        />
                      </div>
                    </div>

                    <!-- Switch Multi Empresa (Desaparece si es Super Admin) -->
                    <div v-if="!formUser.super_admin" :class="isCurrentUserSuperAdmin ? 'col-md-6' : 'col-12'">
                      <div
                        class="form-check form-switch bg-dark-subtle p-3 rounded border d-flex align-items-center justify-content-between"
                        :class="formUser.multi_company ? 'border-warning' : 'border-secondary-subtle'"
                      >
                        <label class="form-check-label text-white ms-0 cursor-pointer" for="switchMultiCompany">
                          <div class="fw-bold d-flex align-items-center gap-1 text-warning">
                            <iconify-icon icon="solar:buildings-bold"></iconify-icon> Multi-Empresa
                          </div>
                          <small class="text-secondary d-block fs-1">Asignar varias empresas y un rol distinto en cada una</small>
                        </label>
                        <input
                          v-model="formUser.multi_company"
                          class="form-check-input fs-5 m-0 cursor-pointer"
                          type="checkbox"
                          id="switchMultiCompany"
                          @change="onMultiCompanyChange"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- CASO 1: SI ES SUPER ADMIN -> AVISO DE ACCESO TOTAL -->
                  <div v-if="formUser.super_admin" class="p-3 bg-danger-subtle text-danger rounded border border-danger-subtle mb-2 d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:shield-star-bold" class="fs-5 flex-shrink-0"></iconify-icon>
                    <span class="fs-2">
                      Al ser <strong>Super Admin</strong>, este usuario tiene acceso absoluto a todas las empresas, módulos y submódulos sin restricción de rol.
                    </span>
                  </div>

                  <!-- CASO 2: SI NO ES SUPER ADMIN Y NO ES MULTI-EMPRESA -> SELECTOR DE ROL EN LA EMPRESA ACTIVA -->
                  <div v-else-if="!formUser.multi_company" class="p-3 bg-dark-subtle rounded border border-primary-subtle mb-3">
                    <label class="form-label text-white fw-semibold d-flex align-items-center justify-content-between mb-2">
                      <span class="d-flex align-items-center gap-2">
                        <iconify-icon icon="solar:shield-user-line-duotone" class="text-primary fs-5"></iconify-icon>
                        <span>Rol del Usuario en {{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'la Empresa Activa' }}</span>
                      </span>
                      <span class="badge bg-primary-subtle text-primary">Empresa #{{ currentCompanyId }}</span>
                    </label>
                    <select
                      v-model="formUser.roleId"
                      class="form-select bg-dark border-secondary-subtle text-white"
                      required
                    >
                      <option :value="null" disabled>Selecciona un rol para esta empresa...</option>
                      <option
                        v-for="r in rolesByCompany[currentCompanyId] || []"
                        :key="r.id"
                        :value="r.id"
                      >
                        {{ r.code }} - {{ r.description }}
                      </option>
                    </select>
                    <small
                      v-if="(rolesByCompany[currentCompanyId] || []).length === 0"
                      class="text-warning d-block mt-1 fs-1"
                    >
                      No hay roles registrados en esta empresa aún. Crea uno en la pestaña "Roles".
                    </small>
                  </div>

                  <!-- CASO 3: SI ES MULTI-EMPRESA -> SELECCIÓN DE EMPRESAS Y ROL ESPECÍFICO POR CADA EMPRESA -->
                  <div v-else class="p-3 bg-dark-subtle rounded border border-warning-subtle mb-3">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label text-warning fw-semibold d-flex align-items-center gap-2 mb-0">
                        <iconify-icon icon="solar:checklist-minimalistic-bold" class="fs-4"></iconify-icon>
                        <span>Empresas Habilitadas y Rol por Empresa</span>
                      </label>
                      <span class="badge bg-warning-subtle text-warning border border-warning-subtle">
                        {{ formUser.companyIds.length }} empresa(s) seleccionada(s)
                      </span>
                    </div>
                    <p class="text-secondary fs-2 mb-2">
                      Marca las empresas a las que tendrá acceso el usuario y elige qué rol desempeñará en cada una (Ej. Contable en una, Ventas en otra):
                    </p>

                    <div class="d-flex flex-column gap-2 overflow-y-auto pe-1" style="max-height: 240px;">
                      <div
                        v-for="company in companies"
                        :key="company.id"
                        class="p-2 rounded border transition-all"
                        :class="
                          formUser.companyIds.includes(company.id)
                            ? 'bg-primary-subtle border-primary text-white'
                            : 'bg-dark border-secondary-subtle text-secondary'
                        "
                      >
                        <div class="row align-items-center g-2">
                          <div class="col-md-6">
                            <label class="d-flex align-items-center gap-2 cursor-pointer mb-0">
                              <input
                                type="checkbox"
                                class="form-check-input m-0 cursor-pointer"
                                :value="company.id"
                                v-model="formUser.companyIds"
                                @change="onToggleUserCompany(company.id)"
                              />
                              <div class="text-truncate">
                                <span class="d-block fw-semibold text-truncate fs-2">
                                  {{ company.business_name || company.trade_name }}
                                </span>
                                <small class="text-secondary font-monospace fs-1">RUC: {{ company.ruc }}</small>
                              </div>
                            </label>
                          </div>

                          <!-- Selector de Rol para esta empresa específica -->
                          <div v-if="formUser.companyIds.includes(company.id)" class="col-md-6">
                            <select
                              v-model="formUser.companyRolesMap[company.id]"
                              class="form-select form-select-sm bg-dark border-primary text-white"
                              required
                            >
                              <option :value="null" disabled>Selecciona rol en {{ company.trade_name || company.business_name }}...</option>
                              <option
                                v-for="r in rolesByCompany[company.id] || []"
                                :key="r.id"
                                :value="r.id"
                              >
                                {{ r.code }} - {{ r.description }}
                              </option>
                            </select>
                            <small
                              v-if="(rolesByCompany[company.id] || []).length === 0"
                              class="text-warning d-block fs-1 mt-1"
                            >
                              Esta empresa aún no tiene roles creados.
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SELECTOR DE MODO OSCURO / CLARO (SPIKE ADMIN THEME MODE) -->
                <div class="mb-3 pt-2 border-top border-dark-subtle">
                  <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold text-adaptive-light">Modo de Apariencia</span>
                    <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-1">
                      {{ themeStore.isDark ? 'Oscuro activo' : 'Claro activo' }}
                    </span>
                  </label>
                  <div class="d-flex gap-2">
                    <button
                      type="button"
                      class="btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 rounded-3 border"
                      :class="!themeStore.isDark ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary text-secondary'"
                      @click="themeStore.applyThemeMode('light')"
                    >
                      <iconify-icon icon="solar:sun-2-line-duotone" class="fs-5"></iconify-icon>
                      <span class="fw-semibold">Modo Claro</span>
                    </button>
                    <button
                      type="button"
                      class="btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 rounded-3 border"
                      :class="themeStore.isDark ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary text-secondary'"
                      @click="themeStore.applyThemeMode('dark')"
                    >
                      <iconify-icon icon="solar:moon-line-duotone" class="fs-5"></iconify-icon>
                      <span class="fw-semibold">Modo Oscuro</span>
                    </button>
                  </div>
                </div>

                <!-- SELECTOR DE COLOR DE TEMA (SPIKE ADMIN THEME COLORS) -->
                <div class="mb-2 pt-2 border-top border-dark-subtle">
                  <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center mb-2">
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
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="closeUserModal">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingUser ? 'Actualizar Usuario' : 'Guardar Usuario') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 3. MODAL NUEVO / EDITAR ROL (CABECERA Y DETALLE DE ACCESOS) -->
      <div v-if="showRoleModal" id="form-page" class="form-page">
        <div class="form-page-card form-page-card-lg">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:shield-check-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingRole ? 'Editar Rol (Cabecera y Detalle de Accesos)' : 'Registrar Nuevo Rol (Cabecera y Detalle)' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showRoleModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitRole">
              <div class="modal-body p-4">
                <!-- CABECERA DEL ROL -->
                <div class="p-3 rounded-3 bg-dark-subtle border border-secondary-subtle mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-primary mb-0 d-flex align-items-center gap-1">
                      <iconify-icon icon="solar:document-text-line-duotone"></iconify-icon>
                      <span>1. Cabecera del Rol</span>
                    </h6>
                    <span class="badge bg-dark text-white border border-secondary-subtle">
                      Empresa: {{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'Activa' }}
                    </span>
                  </div>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center">
                        <span>Código del Rol</span>
                        <span class="badge bg-primary-subtle text-primary fs-1">Auto (+1)</span>
                      </label>
                      <input
                        v-model="formRole.code"
                        type="text"
                        class="form-control bg-dark border-secondary-subtle text-info fw-bold font-monospace text-uppercase"
                        readonly
                      />
                    </div>
                    <div class="col-md-8">
                      <label class="form-label text-secondary fs-2 fw-semibold">Nombre / Descripción del Rol</label>
                      <input
                        v-model="formRole.description"
                        type="text"
                        class="form-control bg-dark border-secondary-subtle text-white"
                        placeholder="Ej. Contador General, Vendedor, Administrador de Bodega"
                        required
                      />
                    </div>
                  </div>
                </div>

                <!-- DETALLE DEL ROL: MÓDULOS MADRE E HIJAS DE LA EMPRESA CON BOOLEAN TRUE / FALSE -->
                <div class="p-3 rounded-3 bg-dark-subtle border border-secondary-subtle">
                  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <div>
                      <h6 class="fw-bold text-info mb-0 d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:widget-4-line-duotone"></iconify-icon>
                        <span>2. Detalle del Rol — Módulos Madre y Submódulos Hijas de la Empresa</span>
                      </h6>
                      <small class="text-secondary fs-1">
                        Activa (<code>true</code>) o desactiva (<code>false</code>) los módulos y submódulos a los que tendrá acceso este rol:
                      </small>
                    </div>
                    <div class="d-flex gap-1">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-success rounded-pill px-2 py-1 fs-1"
                        @click="setAllRoleAccess(true)"
                      >
                        Todos en true
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger rounded-pill px-2 py-1 fs-1"
                        @click="setAllRoleAccess(false)"
                      >
                        Todos en false
                      </button>
                    </div>
                  </div>

                  <div
                    v-if="companyAccessibleModules.length > 0"
                    class="d-flex flex-column gap-2 overflow-y-auto pe-1 mt-2"
                    style="max-height: 310px;"
                  >
                    <div
                      v-for="mod in companyAccessibleModules"
                      :key="mod.id"
                      class="p-3 rounded-3 border"
                      :class="
                        formRole.moduleAccess[mod.id]
                          ? 'bg-dark border-primary'
                          : 'bg-dark border-secondary-subtle opacity-75'
                      "
                    >
                      <!-- Fila Módulo Madre -->
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                          <iconify-icon
                            :icon="mod.desc_icon || 'solar:widget-4-line-duotone'"
                            class="fs-5 text-primary"
                          ></iconify-icon>
                          <div>
                            <span class="fw-bold text-white">{{ mod.description }}</span>
                            <span class="badge bg-dark-subtle text-secondary font-monospace ms-2 fs-1">
                              Madre · {{ mod.code }}
                            </span>
                          </div>
                        </div>

                        <!-- Switch Boolean True / False para Módulo Madre -->
                        <div class="d-flex align-items-center gap-2">
                          <span
                            class="badge font-monospace"
                            :class="
                              formRole.moduleAccess[mod.id]
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-danger-subtle text-danger border border-danger-subtle'
                            "
                          >
                            {{ formRole.moduleAccess[mod.id] ? 'true' : 'false' }}
                          </span>
                          <div class="form-check form-switch m-0">
                            <input
                              type="checkbox"
                              class="form-check-input fs-5 m-0 cursor-pointer"
                              :checked="Boolean(formRole.moduleAccess[mod.id])"
                              @change="toggleRoleModuleAccess(mod.id, ($event.target as HTMLInputElement).checked)"
                            />
                          </div>
                        </div>
                      </div>

                      <!-- Submódulos Hijas de este Módulo Madre -->
                      <div
                        v-if="getCompanyAccessibleSubModules(mod.id).length > 0"
                        class="mt-2 ps-4 pt-2 border-top border-secondary-subtle d-flex flex-column gap-1"
                      >
                        <div
                          v-for="subMod in getCompanyAccessibleSubModules(mod.id)"
                          :key="subMod.id"
                          class="d-flex justify-content-between align-items-center p-2 rounded border"
                          :class="
                            formRole.subModuleAccess[subMod.id]
                              ? 'bg-dark-subtle border-info-subtle text-white'
                              : 'bg-dark border-secondary-subtle text-secondary'
                          "
                        >
                          <div class="d-flex align-items-center gap-2 text-truncate">
                            <iconify-icon
                              :icon="subMod.desc_icon || 'solar:round-alt-arrow-right-line-duotone'"
                              class="fs-4 text-info"
                            ></iconify-icon>
                            <div class="text-truncate">
                              <span class="fw-semibold fs-2">{{ subMod.description }}</span>
                              <small class="text-secondary font-monospace ms-2 fs-1">
                                Hija · {{ subMod.code }} ({{ subMod.url_desc }})
                              </small>
                            </div>
                          </div>

                          <!-- Switch Boolean True / False para Submódulo Hija -->
                          <div class="d-flex align-items-center gap-2 flex-shrink-0">
                            <span
                              class="badge font-monospace"
                              :class="
                                formRole.subModuleAccess[subMod.id]
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : 'bg-danger-subtle text-danger border border-danger-subtle'
                              "
                            >
                              {{ formRole.subModuleAccess[subMod.id] ? 'true' : 'false' }}
                            </span>
                            <div class="form-check form-switch m-0">
                              <input
                                type="checkbox"
                                class="form-check-input m-0 cursor-pointer"
                                :checked="Boolean(formRole.subModuleAccess[subMod.id])"
                                @change="toggleRoleSubModuleAccess(subMod, ($event.target as HTMLInputElement).checked)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="ps-4 mt-1">
                        <small class="text-secondary fst-italic fs-1">Sin submódulos hijas asociados.</small>
                      </div>
                    </div>
                  </div>

                  <div v-else class="alert alert-warning mt-2 mb-0 py-2 fs-2">
                    <iconify-icon icon="solar:info-circle-line-duotone" class="me-1 align-middle fs-4"></iconify-icon>
                    Esta empresa aún no tiene módulos habilitados en su suscripción o en el sistema.
                  </div>
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showRoleModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingRole ? 'Actualizar Rol y Detalle' : 'Guardar Rol y Detalle') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 3.5 MODAL NUEVO / EDITAR MÓDULO -->
      <div v-if="showModuleModal" id="form-page" class="form-page">
        <div class="form-page-card">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:widget-4-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingModule ? 'Editar Módulo Principal' : 'Crear Nuevo Módulo' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showModuleModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitModule">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center">
                    <span>Código Único del Módulo</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-1">
                      Autogenerado (+1)
                    </span>
                  </label>
                  <input
                    v-model="formModule.code"
                    type="text"
                    maxlength="20"
                    class="form-control bg-dark border-secondary-subtle text-info fw-bold font-monospace text-uppercase"
                    readonly
                  />
                  <small class="text-secondary fs-1">
                    Se calcula automáticamente tomando el último módulo registrado + 1 para validaciones de acceso.
                  </small>
                </div>
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Nombre / Descripción del Módulo</label>
                  <input
                    v-model="formModule.description"
                    type="text"
                    maxlength="150"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="Ej. Ventas y Facturación"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center">
                    <span>Icono del Módulo (Iconify Solar)</span>
                    <span class="d-inline-flex align-items-center gap-1 badge bg-primary-subtle text-primary">
                      <iconify-icon :icon="formModule.desc_icon || 'solar:widget-4-line-duotone'" class="fs-4"></iconify-icon>
                      Vista previa
                    </span>
                  </label>
                  <input
                    v-model="formModule.desc_icon"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace mb-2"
                    placeholder="Ej. solar:cart-large-2-line-duotone"
                    required
                  />
                  <!-- Selector rápido de iconos -->
                  <div class="d-flex flex-wrap gap-1 mt-1">
                    <button
                      v-for="item in suggestedIcons"
                      :key="item.icon"
                      type="button"
                      class="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1"
                      :class="formModule.desc_icon === item.icon ? 'btn-primary text-white' : 'btn-outline-secondary text-white-50'"
                      @click="formModule.desc_icon = item.icon"
                    >
                      <iconify-icon :icon="item.icon" class="fs-4"></iconify-icon>
                      <span class="fs-1">{{ item.label }}</span>
                    </button>
                  </div>
                </div>

                <div v-if="isEditingModule" class="form-check form-switch bg-dark-subtle p-3 rounded border border-secondary-subtle d-flex align-items-center justify-content-between">
                  <label class="form-check-label text-white ms-0" for="switchModuleEnabled">
                    <div class="fw-bold">Estado del Módulo</div>
                    <small class="text-secondary d-block fs-1">Habilitar o deshabilitar este módulo en el sistema</small>
                  </label>
                  <input
                    v-model="formModule.enabled"
                    class="form-check-input fs-5 m-0"
                    type="checkbox"
                    id="switchModuleEnabled"
                  />
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showModuleModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingModule ? 'Actualizar Módulo' : 'Guardar Módulo') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 3.6 MODAL NUEVO / EDITAR SUBMÓDULO -->
      <div v-if="showSubModuleModal" id="form-page" class="form-page">
        <div class="form-page-card">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:layers-minimalistic-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingSubModule ? 'Editar Submódulo' : 'Crear Nuevo Submódulo' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showSubModuleModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitSubModule">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Módulo Principal (Padre)</label>
                  <select
                    v-model.number="formSubModule.moduleId"
                    class="form-select bg-dark-subtle border-secondary-subtle text-white"
                    required
                  >
                    <option :value="0" disabled>Selecciona un módulo principal...</option>
                    <option v-for="mod in modulesList" :key="mod.id" :value="mod.id">
                      {{ mod.code }} - {{ mod.description }}
                    </option>
                  </select>
                </div>

                <div class="row">
                  <div class="col-md-5 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center">
                      <span>Código Único</span>
                      <span class="badge bg-info-subtle text-info border border-info-subtle fs-1">Auto (+1)</span>
                    </label>
                    <input
                      v-model="formSubModule.code"
                      type="text"
                      maxlength="20"
                      class="form-control bg-dark border-secondary-subtle text-info fw-bold font-monospace text-uppercase"
                      readonly
                    />
                  </div>
                  <div class="col-md-7 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Ruta / URL del Submódulo</label>
                    <input
                      v-model="formSubModule.url_desc"
                      type="text"
                      class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                      placeholder="Ej. /ventas/facturas"
                      required
                    />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Nombre / Descripción del Submódulo</label>
                  <input
                    v-model="formSubModule.description"
                    type="text"
                    maxlength="150"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white"
                    placeholder="Ej. Emisión de Facturas Electrónicas"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold d-flex justify-content-between align-items-center">
                    <span>Icono del Submódulo</span>
                    <span class="d-inline-flex align-items-center gap-1 badge bg-info-subtle text-info">
                      <iconify-icon :icon="formSubModule.desc_icon || 'solar:round-alt-arrow-right-line-duotone'" class="fs-4"></iconify-icon>
                      Vista previa
                    </span>
                  </label>
                  <input
                    v-model="formSubModule.desc_icon"
                    type="text"
                    class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace mb-2"
                    placeholder="Ej. solar:document-text-line-duotone"
                    required
                  />
                  <div class="d-flex flex-wrap gap-1 mt-1">
                    <button
                      v-for="item in suggestedIcons"
                      :key="item.icon"
                      type="button"
                      class="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1"
                      :class="formSubModule.desc_icon === item.icon ? 'btn-info text-dark fw-semibold' : 'btn-outline-secondary text-white-50'"
                      @click="formSubModule.desc_icon = item.icon"
                    >
                      <iconify-icon :icon="item.icon" class="fs-4"></iconify-icon>
                      <span class="fs-1">{{ item.label }}</span>
                    </button>
                  </div>
                </div>

                <div v-if="isEditingSubModule" class="form-check form-switch bg-dark-subtle p-3 rounded border border-secondary-subtle d-flex align-items-center justify-content-between">
                  <label class="form-check-label text-white ms-0" for="switchSubModuleEnabled">
                    <div class="fw-bold">Estado del Submódulo</div>
                    <small class="text-secondary d-block fs-1">Habilitar o deshabilitar este submódulo</small>
                  </label>
                  <input
                    v-model="formSubModule.enabled"
                    class="form-check-input fs-5 m-0"
                    type="checkbox"
                    id="switchSubModuleEnabled"
                  />
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showSubModuleModal = false">Cancelar</button>
                <button type="submit" class="btn btn-info text-dark fw-semibold px-4" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingSubModule ? 'Actualizar Submódulo' : 'Guardar Submódulo') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 4. MODAL NUEVO PLAN -->
      <div v-if="showPlanModal" id="form-page" class="form-page">
        <div class="form-page-card">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:tag-price-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">Crear Plan SaaS</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showPlanModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitPlan">
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Nombre / Descripción del Plan</label>
                  <input v-model="formPlan.description" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Ej. Plan Emprendedor" required />
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Precio ($)</label>
                    <input v-model="formPlan.price" type="number" step="0.01" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Ciclo de Facturación</label>
                    <select v-model="formPlan.billing_cycle" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Máx. Usuarios</label>
                    <input v-model.number="formPlan.max_users" type="number" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Máx. Sucursales</label>
                    <input v-model.number="formPlan.max_branches" type="number" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showPlanModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : 'Guardar Plan' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- 5. MODAL ASIGNAR / EDITAR SUSCRIPCIÓN Y ACCESO A MÓDULOS -->
      <div v-if="showSubscriptionModal" id="form-page" class="form-page">
        <div class="form-page-card form-page-card-lg">
          <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
            <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex"><iconify-icon icon="solar:card-recive-line-duotone" class="fs-5"></iconify-icon></span>
                <h5 class="fw-bold text-white mb-0">{{ isEditingSubscription ? 'Editar Suscripción y Módulos de Acceso' : 'Asignar Suscripción y Módulos a la Empresa' }}</h5>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showSubscriptionModal = false">
                <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
                <span>Volver</span>
              </button>
            </div>
            <form @submit.prevent="submitSubscription">
              <div class="modal-body p-4">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Plan a Contratar</label>
                    <select v-model.number="formSubscription.planId" class="form-select bg-dark-subtle border-secondary-subtle text-white" required>
                      <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                        {{ plan.description }} - ${{ plan.price }} ({{ plan.billing_cycle }})
                      </option>
                    </select>
                  </div>
                  <div class="col-md-3 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Fecha de Inicio</label>
                    <input v-model="formSubscription.begin_date" type="date" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                  <div class="col-md-3 mb-3">
                    <label class="form-label text-secondary fs-2 fw-semibold">Fecha de Fin</label>
                    <input v-model="formSubscription.end_date" type="date" class="form-control bg-dark-subtle border-secondary-subtle text-white" required />
                  </div>
                </div>

                <!-- SELECCIÓN DE MÓDULOS Y SUBMÓDULOS CON ACCESO -->
                <div class="mt-2 pt-3 border-top border-dark-subtle">
                  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <div>
                      <label class="form-label text-white fw-semibold d-flex align-items-center gap-2 mb-0">
                        <iconify-icon icon="solar:widget-4-line-duotone" class="text-primary fs-5"></iconify-icon>
                        <span>Módulos y Submódulos con Acceso Habilitado</span>
                      </label>
                      <small class="text-secondary d-block fs-2">
                        Marca los módulos principales y submódulos específicos a los que tendrá acceso esta empresa:
                      </small>
                    </div>

                    <div class="d-flex align-items-center gap-2">
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {{ formSubscription.moduleIds.length }} módulo(s) · {{ formSubscription.subModuleIds.length }} submódulo(s)
                      </span>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-info rounded-pill px-2 py-1 fs-1"
                        @click="selectAllSubscriptionAccess"
                      >
                        Marcar todo
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 fs-1"
                        @click="clearAllSubscriptionAccess"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <!-- Árbol de Módulos y Submódulos -->
                  <div
                    v-if="modulesList.length > 0"
                    class="d-flex flex-column gap-2 overflow-y-auto pe-1 mt-2"
                    style="max-height: 300px;"
                  >
                    <div
                      v-for="mod in modulesList.filter((m) => m.enabled !== false)"
                      :key="mod.id"
                      class="p-3 rounded-3 border transition-all"
                      :class="
                        formSubscription.moduleIds.includes(mod.id)
                          ? 'bg-dark-subtle border-primary'
                          : 'bg-dark border-secondary-subtle opacity-75'
                      "
                    >
                      <!-- Cabecera del Módulo Principal -->
                      <div class="d-flex justify-content-between align-items-center">
                        <label class="d-flex align-items-center gap-2 cursor-pointer mb-0">
                          <input
                            type="checkbox"
                            class="form-check-input m-0 fs-5 cursor-pointer"
                            :checked="formSubscription.moduleIds.includes(mod.id)"
                            @change="toggleSubscriptionModule(mod.id)"
                          />
                          <iconify-icon
                            :icon="mod.desc_icon || 'solar:widget-4-line-duotone'"
                            class="fs-5 text-primary ms-1"
                          ></iconify-icon>
                          <span class="fw-bold text-white">{{ mod.description }}</span>
                          <span class="badge bg-dark text-secondary font-monospace fs-1">{{ mod.code }}</span>
                        </label>

                        <span class="badge bg-dark-subtle text-secondary fs-1">
                          {{
                            getSubModulesForModule(mod.id).filter((sm) =>
                              formSubscription.subModuleIds.includes(sm.id)
                            ).length
                          }}
                          / {{ getSubModulesForModule(mod.id).length }} submódulos
                        </span>
                      </div>

                      <!-- Submódulos hijos del Módulo Principal -->
                      <div
                        v-if="getSubModulesForModule(mod.id).length > 0"
                        class="row g-2 mt-2 ps-4 pt-2 border-top border-secondary-subtle"
                      >
                        <div
                          v-for="subMod in getSubModulesForModule(mod.id)"
                          :key="subMod.id"
                          class="col-md-6"
                        >
                          <label
                            class="d-flex align-items-center gap-2 p-2 rounded border cursor-pointer w-100 h-100"
                            :class="
                              formSubscription.subModuleIds.includes(subMod.id)
                                ? 'bg-info-subtle border-info text-white'
                                : 'bg-dark border-secondary-subtle text-secondary'
                            "
                          >
                            <input
                              type="checkbox"
                              class="form-check-input m-0 cursor-pointer"
                              :checked="formSubscription.subModuleIds.includes(subMod.id)"
                              @change="toggleSubscriptionSubModule(subMod)"
                            />
                            <iconify-icon
                              :icon="subMod.desc_icon || 'solar:round-alt-arrow-right-line-duotone'"
                              class="fs-4 text-info"
                            ></iconify-icon>
                            <div class="text-truncate">
                              <span class="d-block fw-semibold text-truncate fs-2">{{ subMod.description }}</span>
                              <small class="text-secondary font-monospace fs-1">{{ subMod.url_desc }}</small>
                            </div>
                          </label>
                        </div>
                      </div>
                      <div v-else class="ps-4 mt-1">
                        <small class="text-secondary fst-italic fs-1">
                          Este módulo aún no tiene submódulos registrados.
                        </small>
                      </div>
                    </div>
                  </div>

                  <div v-else class="alert alert-warning mt-2 mb-0 py-2 fs-2">
                    <iconify-icon icon="solar:info-circle-line-duotone" class="me-1 align-middle fs-4"></iconify-icon>
                    No hay módulos registrados aún. Ve a la pestaña <strong>"Módulos & Submódulos"</strong> para crearlos primero.
                  </div>
                </div>

                <!-- Switch Vigencia (Solo en edición) -->
                <div
                  v-if="isEditingSubscription"
                  class="form-check form-switch bg-dark-subtle p-3 rounded border border-secondary-subtle d-flex align-items-center justify-content-between mt-3"
                >
                  <label class="form-check-label text-white ms-0" for="switchSubscriptionEnabled">
                    <div class="fw-bold">Estado de la Suscripción</div>
                    <small class="text-secondary d-block fs-1">Marcar suscripción como vigente o expirada</small>
                  </label>
                  <input
                    v-model="formSubscription.enabled"
                    class="form-check-input fs-5 m-0"
                    type="checkbox"
                    id="switchSubscriptionEnabled"
                  />
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="showSubscriptionModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ loading ? 'Guardando...' : (isEditingSubscription ? 'Guardar Cambios de Suscripción' : 'Activar Suscripción y Accesos') }}</span>
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
