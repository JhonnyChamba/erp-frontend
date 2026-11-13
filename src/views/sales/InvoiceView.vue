<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/utils/toastr'
import {
  getInvoices,
  createInvoice,
  cancelInvoice,
  signInvoice,
  getInvoiceXml,
  sendInvoiceToSri,
  checkInvoiceSri,
  type InvoiceItem,
  type SriSendResult,
  type CreateInvoicePayload,
} from '@/services/invoices.service'
import {
  getInventoryItems,
  getInventoryServices,
  getInventorySubcontracts,
  getInventoryWarehouses,
  type InventoryArticle,
  type InventoryServiceItem,
  type InventorySubcontractItem,
  type InventoryWarehouse,
} from '@/services/inventory.service'
import { getCustomers, createCustomer, type CustomerItem } from '@/services/contacts.service'
import { getBranches, type BranchItem } from '@/services/config.service'
import {
  getEmissionPoints,
  getNextSequential,
  type EmissionPointItem,
} from '@/services/emission-points.service'
import SriResponseModal from '@/components/common/SriResponseModal.vue'
import { printRideDoc } from '@/utils/sri-ride'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const goToCreditNote = (inv: InvoiceItem) => {
  router.push({
    path: '/ventas/notas-credito',
    query: { invoiceId: String(inv.id) }
  })
}

// Submódulo dinámico
const isInvoiceSubmodule = computed(() => {
  const path = route.path.toLowerCase()
  const sub = String(route.params.sub || '').toLowerCase()
  return path.includes('factura') || sub.includes('factura')
})

const currentSubModule = computed(() => {
  const menu = authStore.accessInfo?.menu || []
  for (const mod of menu) {
    for (const sub of mod.children || []) {
      if (sub.url === route.fullPath || sub.url === route.path) {
        return {
          moduleCode: mod.code,
          moduleName: mod.description,
          ...sub,
        }
      }
    }
  }
  return {
    moduleCode: 'MOD-001',
    moduleName: 'Ventas',
    code: 'SUB-001',
    description: 'Facturas',
    icon: 'solar:document-text-line-duotone',
    url: route.fullPath,
  }
})

// Estados principales
const loading = ref(false)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const modalAlert = ref<{ text: string; type: 'success' | 'warning' | 'error' | '' }>({ text: '', type: '' })

const dismissAlert = () => {
  successMsg.value = ''
  errorMsg.value = ''
}

watch(successMsg, (v) => {
  if (v) {
    toast.success(v, 'Facturación')
  }
})

watch(errorMsg, (v) => {
  if (v) {
    toast.error(v, 'Facturación')
  }
})

watch(() => modalAlert.value.text, (text) => {
  if (!text) return
  const type = modalAlert.value.type || 'info'
  if (type === 'success') toast.success(text, 'Éxito SRI')
  else if (type === 'error') toast.error(text, 'Respuesta SRI')
  else if (type === 'warning') toast.warning(text, 'SRI en proceso')
  else toast.info(text, 'Información SRI')
})

const invoices = ref<InvoiceItem[]>([])
const searchInvoice = ref('')
const statusFilter = ref<string>('TODOS')
const selectedCustomerId = ref<number | null>(null)
const isRegisteredCustomer = computed(() => Boolean(selectedCustomerId.value !== null))

// Modales
const showCreateModal = ref(false)
// Mientras el formulario de factura está abierto se muestra como página y se oculta el listado
const isFormOpen = computed(() => showCreateModal.value)
watch(isFormOpen, async (open) => {
  if (open) {
    await nextTick()
    document.getElementById('form-page')?.scrollIntoView({ block: 'start' })
  }
})
const showDetailModal = ref(false)
const viewingInvoice = ref<InvoiceItem | null>(null)

// Catálogos auxiliares para la emisión
const customersList = ref<CustomerItem[]>([])
const articlesList = ref<InventoryArticle[]>([])
const servicesList = ref<InventoryServiceItem[]>([])
const subcontractsList = ref<InventorySubcontractItem[]>([])
const branchesList = ref<BranchItem[]>([])
const warehousesList = ref<InventoryWarehouse[]>([])
// Solo las sucursales activas pueden emitir
const activeBranches = computed(() => branchesList.value.filter((b) => b.enabled))
const activeWarehouses = computed(() => warehousesList.value.filter((w) => w.status))
// Sucursales en las que se puede emitir: únicamente la seleccionada al ingresar (si hay una)
const issuableBranches = computed(() =>
  branchFilter.value === 'TODAS' ? activeBranches.value : activeBranches.value.filter((b) => b.id === Number(branchFilter.value)),
)
// Sucursal seleccionada ('TODAS' solo si no hay una sucursal válida seleccionada)
const branchFilter = ref<'TODAS' | number>('TODAS')
const branchName = (id?: number | null) => {
  const b = branchesList.value.find((x) => x.id === id)
  return b ? `${b.code} - ${b.name}` : '—'
}

// Formulario de emisión de factura
let detailUidSeq = 1
const createDetailRow = (type: 'ITEM' | 'SERVICE' | 'SUBCONTRACT' = 'ITEM') => ({
  _uid: detailUidSeq++,
  item_type: type,
  item_id: undefined as number | undefined,
  warehouse_id: type === 'ITEM' ? (form.value?.warehouseId || undefined) : undefined,
  code: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  tax_rate: 15,
})

const initialInvoiceForm = () => ({
  branchId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  establishment: '001',
  emission_point: '001',
  issue_date: new Date().toISOString().slice(0, 10),
  customer_id_type: '05' as string, // 04: RUC, 05: Cédula, 07: Consumidor Final
  customer_id_number: '',
  customer_name: '',
  customer_address: '',
  customer_email: '',
  customer_phone: '',
  payment_method: '01', // 01: Sin utilización del sistema financiero (Efectivo)
  notes: '',
  details: [
    {
      _uid: detailUidSeq++,
      item_type: 'ITEM',
      item_id: undefined as number | undefined,
      warehouse_id: undefined as number | undefined,
      code: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 15,
    },
  ],
})

const form = ref(initialInvoiceForm())

// Obtener ID de la empresa activa
const getActiveCompanyId = (): number => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) {
      const parsed = JSON.parse(raw)
      const id = Number(parsed?.id || parsed?.companyId)
      if (!isNaN(id) && id > 0) return id
    }
  } catch {}
  return authStore.tokenPayload?.company_id || 1
}

const activeCompanyEnvironment = computed(() => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.sri_environment || parsed.fiscal?.sri_environment || '1'
    }
  } catch {}
  return '1'
})

const formatCurrency = (val: number) => {
  return '$' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalInvoicesCount = computed(() => invoices.value.length)
const totalInvoicedAmount = computed(() =>
  invoices.value
    .filter((inv) => inv.status === 'ISSUED')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0)
)
const issuedInvoicesCount = computed(() =>
  invoices.value.filter((inv) => inv.status === 'ISSUED').length
)
const canceledInvoicesCount = computed(() =>
  invoices.value.filter((inv) => inv.status === 'CANCELED').length
)

let branchFilterInitialized = false
const getActiveBranchId = (): number => {
  try {
    return Number(JSON.parse(localStorage.getItem('selectedBranch') || 'null')?.id) || 0
  } catch {
    return 0
  }
}
const selectedBranchFilterId = () => (branchFilter.value === 'TODAS' ? undefined : Number(branchFilter.value))

// Al cambiar la sucursal del filtro se vuelven a pedir solo las facturas
const reloadInvoices = async () => {
  loading.value = true
  try {
    invoices.value = await getInvoices(getActiveCompanyId(), selectedBranchFilterId()).catch(() => [])
  } finally {
    loading.value = false
  }
}

// Cargar facturas y catálogos
const loadData = async () => {
  loading.value = true
  errorMsg.value = ''
  const companyId = getActiveCompanyId()

  try {
    const brs: any = await getBranches(companyId).catch(() => ({ data: [] }))
    branchesList.value = Array.isArray(brs?.data) ? brs.data : Array.isArray(brs) ? brs : []

    // Primera carga: se muestran las facturas de la sucursal activa (la elegida al entrar), si existe
    if (!branchFilterInitialized) {
      branchFilterInitialized = true
      const activeId = getActiveBranchId()
      if (branchesList.value.some((b) => b.id === activeId)) branchFilter.value = activeId
    }

    const [invs, custs, arts, srvs, subs, whs] = await Promise.all([
      getInvoices(companyId, selectedBranchFilterId()).catch(() => []),
      getCustomers(companyId).catch(() => []),
      getInventoryItems(companyId).catch(() => []),
      getInventoryServices(companyId).catch(() => []),
      getInventorySubcontracts(companyId).catch(() => []),
      getInventoryWarehouses(companyId).catch(() => []),
    ])

    invoices.value = invs
    customersList.value = custs
    articlesList.value = arts
    servicesList.value = srvs
    subcontractsList.value = subs
    warehousesList.value = Array.isArray(whs) ? whs : []
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error al cargar datos de facturación'
  } finally {
    loading.value = false
  }
}

// Filtrar facturas
const filteredInvoices = computed(() => {
  const q = searchInvoice.value.trim().toLowerCase()
  return invoices.value.filter((inv) => {
    // Filtro por Sucursal
    if (branchFilter.value !== 'TODAS' && inv.branch_id && Number(inv.branch_id) !== Number(branchFilter.value)) {
      return false
    }

    // Filtro por Estado
    if (statusFilter.value !== 'TODOS') {
      if (statusFilter.value === 'AUTHORIZED') {
        if (inv.sri_status !== 'AUTHORIZED' || inv.status === 'CANCELED') return false
      } else if (statusFilter.value === 'ISSUED') {
        if (inv.status !== 'ISSUED') return false
      } else if (statusFilter.value === 'CANCELED') {
        if (inv.status !== 'CANCELED') return false
      } else if (statusFilter.value === 'RETURNED') {
        const s = String(inv.sri_status || '')
        if (s !== 'RETURNED' && s !== 'NOT_AUTHORIZED' && s !== 'DEVUELTA') return false
      } else if (statusFilter.value === 'NOT_SENT') {
        if (inv.sri_status !== 'NOT_SENT' && inv.sri_status) return false
      }
    }

    if (!q) return true
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.customer_id_number?.toLowerCase().includes(q)
    )
  })
})

// Cálculos dinámicos en tiempo real del formulario SRI
const calculatedTotals = computed(() => {
  let subtotal15 = 0
  let subtotal0 = 0
  let discountTotal = 0

  for (const d of form.value.details) {
    const qty = Number(d.quantity || 0)
    const price = Number(d.unit_price || 0)
    const disc = Number(d.discount || 0)
    const lineSubtotal = Math.max(0, qty * price - disc)
    discountTotal += disc

    if (Number(d.tax_rate) > 0) {
      subtotal15 += lineSubtotal
    } else {
      subtotal0 += lineSubtotal
    }
  }

  const subtotalTotal = subtotal15 + subtotal0
  const taxTotal = subtotal15 * 0.15
  const grandTotal = subtotalTotal + taxTotal

  return {
    subtotal15: Number(subtotal15.toFixed(2)),
    subtotal0: Number(subtotal0.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    subtotalTotal: Number(subtotalTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  }
})

// Estado del nav de ítems de la factura: 'ITEM' (Artículos) | 'SERVICE' (Servicios) | 'SUBCONTRACT' (Subcontratos) | 'ALL' (Todos)
const activeDetailTab = ref<'ITEM' | 'SERVICE' | 'SUBCONTRACT' | 'ALL'>('ITEM')

const countArticles = computed(() => form.value.details.filter((d: any) => d.item_type === 'ITEM').length)
const countServices = computed(() => form.value.details.filter((d: any) => d.item_type === 'SERVICE').length)
const countSubcontracts = computed(() => form.value.details.filter((d: any) => d.item_type === 'SUBCONTRACT').length)

const addRowButtonLabel = computed(() => {
  if (activeDetailTab.value === 'ITEM') return 'Agregar Artículo'
  if (activeDetailTab.value === 'SERVICE') return 'Agregar Servicio'
  if (activeDetailTab.value === 'SUBCONTRACT') return 'Agregar Subcontrato'
  return 'Agregar Línea'
})

const addDetailRow = (type?: 'ITEM' | 'SERVICE' | 'SUBCONTRACT' | 'ALL') => {
  const targetType = (!type || type === 'ALL') ? 'ITEM' : type
  form.value.details.push(createDetailRow(targetType))
}

const removeDetailRow = (index: number) => {
  if (form.value.details.length === 1) return
  form.value.details.splice(index, 1)
}

const removeDetailRowByUid = (uid: number) => {
  if (form.value.details.length <= 1) {
    const targetType = activeDetailTab.value === 'ALL' ? 'ITEM' : activeDetailTab.value
    form.value.details = [createDetailRow(targetType)]
    return
  }
  const idx = form.value.details.findIndex((d: any) => d._uid === uid)
  if (idx !== -1) {
    form.value.details.splice(idx, 1)
  }
}

// Opciones de Select2 separadas por cada tipo
const articleSelectOptions = computed(() =>
  articlesList.value.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name} ($${formatNumber(a.salePrice)})`,
    sublabel: `Stock disponible: ${Number(a.stockCurrent ?? 0)} ${a.unit || 'UND'}`,
  }))
)

const serviceSelectOptions = computed(() =>
  servicesList.value.map((s) => ({
    value: s.id,
    label: `${s.code} - ${s.name} ($${formatNumber(s.salePrice)})`,
    sublabel: s.category || 'Servicio Propio',
  }))
)

const subcontractSelectOptions = computed(() =>
  subcontractsList.value.map((m) => ({
    value: m.id,
    label: `${m.code} - ${m.name} ($${formatNumber(m.suggestedPrice)})`,
    sublabel: m.specialty ? `Especialidad: ${m.specialty}` : 'Mano de Obra / Subcontrato',
  }))
)

// Obtener info de stock y unidad de un artículo seleccionado
const getArticleStockInfo = (itemId?: number) => {
  if (!itemId) return null
  const item = articlesList.value.find((a) => a.id === Number(itemId))
  if (!item) return null
  return {
    stock: Number(item.stockCurrent ?? 0),
    unit: item.unit || 'UND',
  }
}

// Handlers de selección por Select2
const onSelectArticle = (row: any, itemId: any) => {
  if (!itemId) {
    row.item_id = undefined
    return
  }
  const item = articlesList.value.find((a) => a.id === Number(itemId))
  if (item) {
    row.item_type = 'ITEM'
    row.item_id = item.id
    row.warehouse_id = row.warehouse_id || item.warehouseId || form.value.warehouseId || undefined
    row.code = item.code
    row.description = item.name
    row.unit_price = Number(item.salePrice || 0)
    row.tax_rate = Number(item.taxRate ?? 15)
  }
}

const onSelectService = (row: any, srvId: any) => {
  if (!srvId) {
    row.item_id = undefined
    return
  }
  const srv = servicesList.value.find((s) => s.id === Number(srvId))
  if (srv) {
    row.item_type = 'SERVICE'
    row.item_id = srv.id
    row.warehouse_id = undefined
    row.code = srv.code
    row.description = srv.name
    row.unit_price = Number(srv.salePrice || 0)
    row.tax_rate = Number(srv.taxRate ?? 15)
  }
}

const onSelectSubcontract = (row: any, subId: any) => {
  if (!subId) {
    row.item_id = undefined
    return
  }
  const sub = subcontractsList.value.find((m) => m.id === Number(subId))
  if (sub) {
    row.item_type = 'SUBCONTRACT'
    row.item_id = sub.id
    row.warehouse_id = undefined
    row.code = sub.code
    row.description = sub.name
    row.unit_price = Number(sub.suggestedPrice || 0)
    row.tax_rate = Number(sub.taxRate ?? 15)
  }
}

// Filtro de presentación para la tabla (todos van al mismo array form.details)
const visibleDetails = computed(() => {
  if (activeDetailTab.value === 'ALL') return form.value.details
  return form.value.details.filter((d: any) => d.item_type === activeDetailTab.value)
})

// Al seleccionar un cliente guardado
const onSelectCustomer = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const id = Number(target.value)
  if (!id) return

  const cust = customersList.value.find((c) => c.id === id)
  if (cust) {
    form.value.customer_id_type = cust.tipo_documento
    form.value.customer_id_number = cust.num_document
    form.value.customer_name = cust.razon_social
    form.value.customer_address = cust.direccion || ''
    form.value.customer_email = cust.email || ''
    form.value.customer_phone = cust.telefono || ''
  }
}

// Modo Consumidor Final rápido
const setFinalConsumer = () => {
  selectedCustomerId.value = -1
  form.value.customer_id_type = '07'
  form.value.customer_id_number = '9999999999999'
  form.value.customer_name = 'CONSUMIDOR FINAL'
  form.value.customer_address = 'S/N'
  form.value.customer_email = ''
  form.value.customer_phone = ''
}

// Puntos de emisión de la sucursal seleccionada y secuencial dinámico
const branchEmissionPoints = ref<EmissionPointItem[]>([])
const nextSequentialPreview = ref<string>('')
const loadingSequential = ref(false)

const loadEmissionPointsForBranch = async (branchId?: number) => {
  if (!branchId) {
    branchEmissionPoints.value = []
    nextSequentialPreview.value = ''
    return
  }
  const companyId = getActiveCompanyId()
  try {
    const points = await getEmissionPoints(companyId, branchId).catch(() => [])
    branchEmissionPoints.value = points.filter((p) => p.enabled)

    // Si la serie actual no está en la lista de puntos de la sucursal, seleccionar el primero
    if (branchEmissionPoints.value.length > 0) {
      const match = branchEmissionPoints.value.find((p) => p.serie === form.value.emission_point)
      if (!match && branchEmissionPoints.value[0]) {
        form.value.emission_point = branchEmissionPoints.value[0].serie
      }
    }
    await updateSequentialPreview()
  } catch (e) {
    console.error('Error al cargar puntos de emisión:', e)
  }
}

const updateSequentialPreview = async () => {
  if (!form.value.branchId) {
    nextSequentialPreview.value = ''
    return
  }
  loadingSequential.value = true
  const companyId = getActiveCompanyId()
  try {
    const res = await getNextSequential({
      branchId: form.value.branchId,
      serie: form.value.emission_point,
      documentType: 'FACTURAS',
      companyId,
    })
    nextSequentialPreview.value = res.sequential
  } catch (e) {
    console.error('Error al consultar siguiente secuencial:', e)
  } finally {
    loadingSequential.value = false
  }
}

const onEmissionPointChange = async () => {
  await updateSequentialPreview()
}

// Opciones de Select2 para Facturación
const branchSelectOptions = computed(() =>
  issuableBranches.value.map((b) => ({
    value: b.id,
    label: `${b.code} - ${b.name}${b.isMatrix ? ' (Matriz)' : ''}`,
    sublabel: b.address,
  }))
)

const warehouseSelectOptions = computed(() => [
  { value: null, label: '-- Predeterminada / Automática --' },
  ...activeWarehouses.value.map((w) => ({
    value: w.id,
    label: `${w.code ? `[${w.code}] ` : ''}${w.name}${w.isDefault ? ' ★ (Predeterminada)' : ''}`,
  })),
])

const emissionPointSelectOptions = computed(() => {
  if (branchEmissionPoints.value.length === 0) {
    return [
      {
        value: form.value.emission_point || '001',
        label: `${form.value.emission_point || '001'} - Serie Predeterminada`,
      },
    ]
  }
  return branchEmissionPoints.value.map((pt) => ({
    value: pt.serie,
    label: `${pt.serie} - ${pt.description}`,
  }))
})

const customerSelectOptions = computed(() =>
  customersList.value.map((c) => ({
    value: c.id,
    label: `${c.razon_social} (${c.num_document})`,
    sublabel: c.email || c.direccion || '',
  }))
)

const onSelectCustomerSelect2 = (custId: number | null) => {
  if (!custId) {
    selectedCustomerId.value = null
    return
  }
  selectedCustomerId.value = Number(custId)
  const cust = customersList.value.find((c) => c.id === Number(custId))
  if (cust) {
    form.value.customer_id_type = cust.tipo_documento
    form.value.customer_id_number = cust.num_document || ''
    form.value.customer_name = cust.razon_social || ''
    form.value.customer_address = cust.direccion || ''
    form.value.customer_email = cust.email || ''
    form.value.customer_phone = cust.telefono || ''
  }
}

// Aplica los datos de la sucursal elegida: establecimiento y punto de emisión por defecto
const applyBranch = async (branchId?: number) => {
  const b = issuableBranches.value.find((x) => x.id === branchId)
  form.value.branchId = b?.id
  if (b) {
    form.value.establishment = b.code
    form.value.emission_point = b.emissionPoint || '001'
    await loadEmissionPointsForBranch(b.id)
  }
}

const preselectBranch = async () => {
  if (issuableBranches.value.length === 0) return
  // Sucursal seleccionada; si no hay una, la matriz
  const preferred =
    issuableBranches.value.find((b) => b.id === getActiveBranchId()) ||
    issuableBranches.value.find((b) => b.isMatrix) ||
    issuableBranches.value[0]
  await applyBranch(preferred?.id)
}

const preselectWarehouse = () => {
  if (activeWarehouses.value.length === 0) return
  const def = activeWarehouses.value.find((w) => w.isDefault) || activeWarehouses.value[0]
  if (def) {
    form.value.warehouseId = def.id
    if (form.value.details[0]) {
      form.value.details[0].warehouse_id = def.id
    }
  }
}

const openCreateModal = async () => {
  successMsg.value = ''
  selectedCustomerId.value = null
  // Toda factura pertenece a una empresa y a una sucursal: sin sucursales activas no se puede emitir
  if (issuableBranches.value.length === 0) {
    errorMsg.value = 'Para emitir facturas primero registra y activa al menos una sucursal en Configuración > Sucursales.'
    return
  }
  form.value = initialInvoiceForm()
  cashReceived.value = null
  preselectWarehouse()
  await preselectBranch()
  successMsg.value = ''
  errorMsg.value = ''
  showCreateModal.value = true
}

const openDetailModal = (inv: InvoiceItem) => {
  modalAlert.value = { text: '', type: '' }
  viewingInvoice.value = inv
  showDetailModal.value = true
}

// Guardar / Emitir Factura
const submitInvoice = async () => {
  if (!form.value.branchId) {
    errorMsg.value = 'Debes seleccionar la sucursal (establecimiento) con la que se emite la factura.'
    return
  }
  if (!form.value.customer_id_number || !form.value.customer_name) {
    errorMsg.value = 'Debes ingresar el número de identificación y nombre del cliente.'
    return
  }

  const firstDetail = form.value.details[0]
  if (form.value.details.length === 0 || !firstDetail?.description) {
    errorMsg.value = 'Debes agregar al menos un ítem o servicio a la factura.'
    return
  }

  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const payload: CreateInvoicePayload = {
      companyId: getActiveCompanyId(),
      branchId: form.value.branchId as number,
      warehouseId: form.value.warehouseId || undefined,
      warehouse_id: form.value.warehouseId || undefined,
      emission_point: form.value.emission_point,
      issue_date: form.value.issue_date,
      customer_id_type: form.value.customer_id_type,
      customer_id_number: form.value.customer_id_number,
      customer_name: form.value.customer_name,
      customer_address: form.value.customer_address,
      customer_email: form.value.customer_email,
      customer_phone: form.value.customer_phone,
      payment_method: form.value.payment_method,
      notes: form.value.notes,
      details: form.value.details.map((d) => ({
        item_type: d.item_type,
        item_id: d.item_id,
        warehouse_id: d.warehouse_id || form.value.warehouseId || undefined,
        warehouseId: d.warehouse_id || form.value.warehouseId || undefined,
        code: d.code,
        description: d.description,
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
        discount: Number(d.discount || 0),
        tax_rate: Number(d.tax_rate ?? 15),
      })),
    }

    const created = await createInvoice(payload)
    showCreateModal.value = false
    await loadData()

    if ((created as any)?.sri_result) {
      openSriModalForInvoice(created, (created as any).sri_result)
    } else {
      successMsg.value = `Factura ${created.invoice_number} emitida exitosamente con clave SRI.`
      toast.success(`Factura ${created.invoice_number} emitida exitosamente.`, 'Emisión Exitosa')
    }
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error al emitir la factura'
  } finally {
    saving.value = false
  }
}

// Modal de Respuesta SRI
const showSriModal = ref(false)
const sriModalData = ref<{
  documentType: string
  documentNumber: string
  accessKey: string
  result: any
}>({
  documentType: 'Factura Electrónica',
  documentNumber: '',
  accessKey: '',
  result: null,
})

const openSriModalForInvoice = (inv: InvoiceItem, customResult?: any) => {
  sriModalData.value = {
    documentType: 'Factura Electrónica',
    documentNumber: inv.invoice_number,
    accessKey: inv.access_key || '',
    result: customResult || {
      status: inv.sri_status,
      sri_status: inv.sri_status,
      authorizationNumber: inv.sri_authorization_number,
      sri_authorization_number: inv.sri_authorization_number,
      authorizationDate: inv.sri_authorization_date,
      sri_authorization_date: inv.sri_authorization_date,
      sri_messages: inv.sri_messages,
      sriMessages: inv.sri_messages,
    },
  }
  showSriModal.value = true
}

// Firmar con el .p12 de la empresa y descargar el XML firmado
const signingInvoiceId = ref<number | null>(null)
const sendingSriInvoiceId = ref<number | null>(null)
const cancelingInvoiceId = ref<number | null>(null)
const downloadingXmlId = ref<number | null>(null)

const onSignInvoice = async (inv: InvoiceItem) => {
  errorMsg.value = ''
  modalAlert.value = { text: '', type: '' }
  signingInvoiceId.value = inv.id
  try {
    await signInvoice(inv.id, getActiveCompanyId())
    const okMsg = `Factura ${inv.invoice_number} firmada electrónicamente.`
    successMsg.value = okMsg
    modalAlert.value = { text: okMsg, type: 'success' }
    await loadData()
    if (viewingInvoice.value?.id === inv.id) {
      viewingInvoice.value = invoices.value.find((i) => i.id === inv.id) || viewingInvoice.value
    }
  } catch (err: any) {
    const m = err?.response?.data?.message
    const failMsg = (Array.isArray(m) ? m.join(', ') : m) || 'No se pudo firmar la factura'
    errorMsg.value = failMsg
    modalAlert.value = { text: failMsg, type: 'error' }
  } finally {
    signingInvoiceId.value = null
  }
}

// Envío al SRI (recepción + autorización) y consulta posterior cuando quedó "en proceso"
const sendingSri = ref(false)

const sriStatusLabel = (status?: string) => {
  switch (status) {
    case 'AUTHORIZED':
      return 'Autorizada SRI'
    case 'NOT_AUTHORIZED':
      return 'No autorizada SRI'
    case 'RETURNED':
      return 'Devuelta SRI'
    case 'IN_PROCESS':
      return 'En proceso SRI'
    default:
      return 'Sin enviar al SRI'
  }
}

const sriStatusClass = (status?: string) => {
  switch (status) {
    case 'AUTHORIZED':
      return 'bg-success-subtle text-success border border-success-subtle'
    case 'NOT_AUTHORIZED':
    case 'RETURNED':
      return 'bg-danger-subtle text-danger border border-danger-subtle'
    case 'IN_PROCESS':
      return 'bg-warning-subtle text-warning border border-warning-subtle'
    default:
      return 'bg-secondary-subtle text-secondary border border-secondary-subtle'
  }
}

const describeSriResult = (inv: InvoiceItem, result: SriSendResult) => {
  const reasons = (result.sri_messages || []).map((m) => `${m.identificador ? `[${m.identificador}] ` : ''}${m.mensaje}${m.informacionAdicional ? ` — ${m.informacionAdicional}` : ''}`)
  if (result.sri_status === 'AUTHORIZED') {
    const msg = `Factura ${inv.invoice_number} autorizada por el SRI. No. ${result.sri_authorization_number}`
    successMsg.value = msg
    modalAlert.value = { text: msg, type: 'success' }
  } else if (result.sri_status === 'IN_PROCESS') {
    const msg = `Factura ${inv.invoice_number} recibida por el SRI; la autorización aún está en proceso. Consulta de nuevo en unos minutos.`
    successMsg.value = msg
    modalAlert.value = { text: msg, type: 'warning' }
  } else {
    const title = result.sri_status === 'RETURNED' ? 'devuelta' : 'no autorizada'
    const msg = `Factura ${inv.invoice_number} ${title} por el SRI. ${reasons.join(' | ') || 'Sin detalle del motivo.'}`
    errorMsg.value = msg
    modalAlert.value = { text: msg, type: 'error' }
  }
}

const refreshAfterSri = async (inv: InvoiceItem) => {
  await loadData()
  if (viewingInvoice.value?.id === inv.id) {
    viewingInvoice.value = invoices.value.find((i) => i.id === inv.id) || viewingInvoice.value
  }
}

const onSendToSri = async (inv: InvoiceItem) => {
  errorMsg.value = ''
  successMsg.value = ''
  modalAlert.value = { text: '', type: '' }
  sendingSri.value = true
  sendingSriInvoiceId.value = inv.id
  try {
    const result = await sendInvoiceToSri(inv.id, getActiveCompanyId())
    describeSriResult(inv, result)
    await refreshAfterSri(inv)
    openSriModalForInvoice(inv, result)
  } catch (err: any) {
    const m = err?.response?.data?.message
    const failMsg = (Array.isArray(m) ? m.join(', ') : m) || 'No se pudo enviar la factura al SRI'
    errorMsg.value = failMsg
    modalAlert.value = { text: failMsg, type: 'error' }
  } finally {
    sendingSri.value = false
    sendingSriInvoiceId.value = null
  }
}

const onCheckSri = async (inv: InvoiceItem) => {
  errorMsg.value = ''
  successMsg.value = ''
  modalAlert.value = { text: '', type: '' }
  sendingSri.value = true
  sendingSriInvoiceId.value = inv.id
  try {
    const result = await checkInvoiceSri(inv.id, getActiveCompanyId())
    describeSriResult(inv, result)
    await refreshAfterSri(inv)
    openSriModalForInvoice(inv, result)
  } catch (err: any) {
    const m = err?.response?.data?.message
    const failMsg = (Array.isArray(m) ? m.join(', ') : m) || 'No se pudo consultar la autorización en el SRI'
    errorMsg.value = failMsg
    modalAlert.value = { text: failMsg, type: 'error' }
  } finally {
    sendingSri.value = false
    sendingSriInvoiceId.value = null
  }
}

const downloadXml = async (inv: InvoiceItem) => {
  errorMsg.value = ''
  downloadingXmlId.value = inv.id
  try {
    const { file_name, xml } = await getInvoiceXml(inv.id, getActiveCompanyId())
    const url = URL.createObjectURL(new Blob([xml], { type: 'text/xml;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = file_name
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'No se pudo descargar el XML'
  } finally {
    downloadingXmlId.value = null
  }
}

// Anular factura
const onCancelInvoice = async (inv: InvoiceItem) => {
  if (!confirm(`¿Estás seguro de anular la factura ${inv.invoice_number}?`)) return
  cancelingInvoiceId.value = inv.id
  try {
    await cancelInvoice(inv.id, getActiveCompanyId())
    successMsg.value = `Factura ${inv.invoice_number} anulada correctamente.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error al anular la factura'
  } finally {
    cancelingInvoiceId.value = null
  }
}

// RIDE (Representación Impresa del Documento Electrónico): formato oficial A4 y ticket térmico 80mm
const getActiveCompany = (): any => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const printRide = (inv: InvoiceItem, format: 'a4' | 'ticket' = 'a4') => {
  const comp: any = { ...getActiveCompany() }
  // Obtener la sucursal emisora para tomar su logo_url prioritario
  let branch: any = branchesList.value.find(
    (b: any) => b.id === (inv as any).branch_id || b.code === (inv as any).branch_code
  )
  if (!branch) {
    try {
      const rawBranch = localStorage.getItem('selectedBranch')
      if (rawBranch) branch = JSON.parse(rawBranch)
    } catch {}
  }
  if (branch?.logo_url) {
    comp.branch_logo_url = branch.logo_url
  }
  printRideDoc(inv, comp, format, {
    received: cashReceived.value || undefined,
    change: cashChange.value || undefined,
  })
}

const onPrintA4 = (inv: InvoiceItem) => {
  printRide(inv, 'a4')
}

const onPrintTicket = (inv: InvoiceItem) => {
  printRide(inv, 'ticket')
}

// Modal de Cliente Rápido para POS / Mostrador
const showQuickCustomerModal = ref(false)
const quickCustomerLoading = ref(false)
const quickCustomerForm = ref({
  tipo_documento: '05',
  num_document: '',
  razon_social: '',
  email: '',
  telefono: '',
  direccion: '',
})

const openQuickCustomerModal = () => {
  quickCustomerForm.value = {
    tipo_documento: '05',
    num_document: '',
    razon_social: '',
    email: '',
    telefono: '',
    direccion: '',
  }
  showQuickCustomerModal.value = true
}

const saveQuickCustomer = async () => {
  if (!quickCustomerForm.value.num_document || !quickCustomerForm.value.razon_social) {
    toast.warning('Ingresa el número de documento y el nombre o razón social.', 'Datos Incompletos')
    return
  }
  quickCustomerLoading.value = true
  try {
    const companyId = getActiveCompanyId()
    const newCust = await createCustomer(quickCustomerForm.value, companyId)
    customersList.value.unshift(newCust)
    form.value.customer_id_type = newCust.tipo_documento
    form.value.customer_id_number = newCust.num_document
    form.value.customer_name = newCust.razon_social
    form.value.customer_address = newCust.direccion || ''
    form.value.customer_email = newCust.email || ''
    form.value.customer_phone = newCust.telefono || ''
    toast.success(`Cliente ${newCust.razon_social} registrado y seleccionado para facturar.`, 'Cliente Creado')
    showQuickCustomerModal.value = false
  } catch (err: any) {
    toast.error(err?.response?.data?.message || err?.message || 'Error al registrar el cliente rápido.')
  } finally {
    quickCustomerLoading.value = false
  }
}

// Control de Efectivo y Vuelto en Vivo (POS)
const cashReceived = ref<number | null>(null)
const cashChange = computed(() => {
  const rec = Number(cashReceived.value || 0)
  const total = Number(calculatedTotals.value.grandTotal || 0)
  return rec >= total ? Number((rec - total).toFixed(2)) : 0
})
const cashMissing = computed(() => {
  const rec = Number(cashReceived.value || 0)
  const total = Number(calculatedTotals.value.grandTotal || 0)
  return rec > 0 && rec < total ? Number((total - rec).toFixed(2)) : 0
})
const setExactCash = () => {
  cashReceived.value = Number(calculatedTotals.value.grandTotal.toFixed(2))
}
const setQuickCash = (amount: number) => {
  cashReceived.value = amount
}

// Cuadre de Caja Diario
const showDailyCashModal = ref(false)
const dailyCashSummary = computed(() => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayInvoices = invoices.value.filter(
    (inv) =>
      (inv.issue_date && inv.issue_date.slice(0, 10) === todayStr) ||
      (inv.created_at && inv.created_at.slice(0, 10) === todayStr)
  )
  const issued = todayInvoices.filter((i) => i.status === 'ISSUED')
  const canceled = todayInvoices.filter((i) => i.status === 'CANCELED')

  let totalCash = 0
  let totalCards = 0
  let totalTransfer = 0
  let totalOther = 0
  let grandTotal = 0

  for (const inv of issued) {
    const val = Number(inv.total || 0)
    grandTotal += val
    if (inv.payment_method === '01') totalCash += val
    else if (inv.payment_method === '16' || inv.payment_method === '19') totalCards += val
    else if (inv.payment_method === '20') totalTransfer += val
    else totalOther += val
  }

  return {
    date: todayStr,
    countTotal: todayInvoices.length,
    countIssued: issued.length,
    countCanceled: canceled.length,
    totalCash,
    totalCards,
    totalTransfer,
    totalOther,
    grandTotal,
  }
})

const printDailyClosure = () => {
  const sum = dailyCashSummary.value
  const comp = getActiveCompany()
  const esc = (s: any) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cierre de Caja ${sum.date}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    body { font-family: monospace; font-size: 11px; width: 72mm; margin: 0 auto; padding: 4px; }
    .c { text-align: center; } .r { text-align: right; } .b { font-weight: bold; }
    .hr { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style></head><body>
  <div class="c b" style="font-size:13px">${esc(comp.trade_name || comp.business_name || 'DESKOUNTA')}</div>
  <div class="c">CIERRE DE CAJA DIARIO</div>
  <div class="c">Fecha: ${sum.date}</div>
  <div class="hr"></div>
  <div class="row"><span>Facturas Emitidas:</span><span class="b">${sum.countIssued}</span></div>
  <div class="row"><span>Facturas Anuladas:</span><span class="b">${sum.countCanceled}</span></div>
  <div class="row"><span>Total Documentos:</span><span class="b">${sum.countTotal}</span></div>
  <div class="hr"></div>
  <div class="b" style="margin:4px 0">VENTAS POR FORMA DE PAGO:</div>
  <div class="row"><span>Efectivo (01):</span><span class="b">$${fmt(sum.totalCash)}</span></div>
  <div class="row"><span>Tarjetas (16/19):</span><span class="b">$${fmt(sum.totalCards)}</span></div>
  <div class="row"><span>Transferencias (20):</span><span class="b">$${fmt(sum.totalTransfer)}</span></div>
  ${sum.totalOther > 0 ? `<div class="row"><span>Otros:</span><span class="b">$${fmt(sum.totalOther)}</span></div>` : ''}
  <div class="hr"></div>
  <div class="row" style="font-size:13px; font-weight:bold">
    <span>TOTAL RECAUDADO:</span><span>$${fmt(sum.grandTotal)}</span>
  </div>
  <div class="hr"></div>
  <div class="c" style="margin-top:10px">Usuario: ${esc(authStore.tokenPayload?.user_name || 'Caja')}</div>
  <div class="c" style="font-size:9px">${new Date().toLocaleString('es-EC')}</div>
  <script>window.onload=function(){window.print()}<\/script></body></html>`

  const w = window.open('', '_blank', 'width=400,height=600')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}

const formatNumber = (val: any) => {
  const num = Number(val || 0)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => {
  loadData()
})

watch(() => route.path, () => {
  loadData()
})
</script>

<template>
  <div class="crud-page invoices-page" :class="{ 'form-open': isFormOpen }">
    <!-- Encabezado del Submódulo -->
    <div class="crud-page-header keep-in-form">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
            {{ currentSubModule.moduleCode }} · {{ currentSubModule.moduleName }}
          </span>
          <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace">
            {{ currentSubModule.code }}
          </span>
          <span
            class="badge font-monospace d-inline-flex align-items-center gap-1"
            :class="activeCompanyEnvironment === '2' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'"
          >
            <iconify-icon :icon="activeCompanyEnvironment === '2' ? 'solar:shield-check-bold' : 'solar:test-tube-minimalistic-bold-duotone'"></iconify-icon>
            SRI: {{ activeCompanyEnvironment === '2' ? 'Producción' : 'Pruebas' }}
          </span>
        </div>
        <h2 class="crud-title">{{ currentSubModule.description }}</h2>
        <p class="crud-subtitle">
          Emisión, firma electrónica XAdES-BES y autorización de facturas electrónicas SRI Ecuador.
        </p>
      </div>

      <div class="crud-header-actions">
        <button class="btn btn-outline-info d-flex align-items-center gap-2" @click="showDailyCashModal = true" title="Cuadre y Cierre de Caja del Día">
          <iconify-icon icon="solar:calculator-minimalistic-bold-duotone" class="fs-5"></iconify-icon>
          <span>Cuadre de Caja</span>
        </button>
        <button class="btn btn-secondary d-flex align-items-center gap-2" @click="loadData" :disabled="loading">
          <iconify-icon icon="solar:refresh-line-duotone" :class="{ 'spin-anim': loading }"></iconify-icon>
          <span>Actualizar</span>
        </button>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateModal">
          <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
          <span>+ Nueva Factura</span>
        </button>
      </div>
    </div>

    <!-- PESTAÑAS DE NAVEGACIÓN MÓDULO VENTAS (FACTURAS, NOTAS DE CRÉDITO, PUNTOS DE EMISIÓN) -->
    <div class="d-flex align-items-center gap-2 mt-3 mb-1 flex-wrap">
      <router-link
        to="/ventas/facturas"
        class="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2"
        :class="route.path.includes('factura') ? 'btn-primary' : 'btn-outline-secondary'"
      >
        <iconify-icon icon="solar:document-text-line-duotone" class="fs-4"></iconify-icon>
        <span>Facturas</span>
      </router-link>

      <router-link
        to="/ventas/notas-credito"
        class="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2"
        :class="route.path.includes('notas-credito') ? 'btn-primary' : 'btn-outline-secondary'"
      >
        <iconify-icon icon="solar:bill-cross-line-duotone" class="fs-4"></iconify-icon>
        <span>Notas de Crédito (SRI 04)</span>
      </router-link>

      <router-link
        to="/ventas/puntos-emision"
        class="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2"
        :class="route.path.includes('puntos-emision') ? 'btn-primary' : 'btn-outline-secondary'"
      >
        <iconify-icon icon="solar:printer-minimalistic-line-duotone" class="fs-4"></iconify-icon>
        <span>Puntos de Emisión</span>
      </router-link>
    </div>

    <!-- Indicadores KPIs de Facturación -->
    <div v-if="isInvoiceSubmodule && !isFormOpen" class="crud-kpi-grid mt-3">
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon primary">
          <iconify-icon icon="solar:document-text-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Total Facturas</span>
          <h4 class="crud-kpi-val">{{ totalInvoicesCount }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon success">
          <iconify-icon icon="solar:wallet-money-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Monto Facturado</span>
          <h4 class="crud-kpi-val">{{ formatCurrency(totalInvoicedAmount) }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon info">
          <iconify-icon icon="solar:check-circle-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Emitidas / Válidas</span>
          <h4 class="crud-kpi-val">{{ issuedInvoicesCount }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon warning">
          <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Anuladas</span>
          <h4 class="crud-kpi-val">{{ canceledInvoicesCount }}</h4>
        </div>
      </div>
    </div>

    <!-- Si no es el submódulo de facturas, mostrar aviso normal -->
    <div v-if="!isInvoiceSubmodule" class="card rounded-4 border-0 shadow-sm p-4 bg-dark text-white mt-4">
      <p class="text-secondary mb-0">
        Vista operativa del submódulo <strong>{{ currentSubModule.description }}</strong> (<code class="text-info">{{ currentSubModule.url }}</code>).
      </p>
    </div>

    <!-- VISTA PRINCIPAL DE FACTURACIÓN ECUADOR -->
    <template v-else>
      <!-- Barra de Filtros y Búsqueda -->
      <div v-show="!isFormOpen" class="crud-filters-card mt-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 400px;">
            <div class="input-group">
              <span class="input-group-text">
                <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
              </span>
              <input
                v-model="searchInvoice"
                type="text"
                class="form-control"
                placeholder="Buscar por # factura, cliente o RUC..."
              />
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <label class="small fw-semibold text-muted">Sucursal:</label>
            <select v-model="branchFilter" class="form-select w-auto">
              <option value="TODAS">Todas las sucursales</option>
              <option v-for="b in branchesList" :key="b.id" :value="b.id">
                {{ b.code }} - {{ b.name }}
              </option>
            </select>

            <label class="small fw-semibold ms-2 text-muted">Estado:</label>
            <select v-model="statusFilter" class="form-select w-auto">
              <option value="TODOS">Todos</option>
              <option value="AUTHORIZED">Autorizadas SRI</option>
              <option value="ISSUED">Emitidas / Válidas</option>
              <option value="RETURNED">Devueltas / Rechazadas SRI</option>
              <option value="NOT_SENT">Pendientes de envío SRI</option>
              <option value="CANCELED">Anuladas</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla de Facturas Emitidas -->
      <div v-show="!isFormOpen" class="crud-table-card mt-3">
        <div class="table-responsive">
          <table class="crud-table">
            <thead>
              <tr>
                <th>No. Factura (SRI)</th>
                <th>Fecha Emisión</th>
                <th>Cliente / Razón Social</th>
                <th>Identificación</th>
                <th class="text-end">Subtotal</th>
                <th class="text-end">IVA (15%)</th>
                <th class="text-end">Total</th>
                <th class="text-center">Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="9" class="text-center py-5">
                  <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                    <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                    <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  </div>
                  <span class="text-secondary small">Cargando facturas...</span>
                </td>
              </tr>
              <tr v-else-if="filteredInvoices.length === 0">
                <td colspan="9" class="text-center py-5 text-secondary">
                  <iconify-icon icon="solar:bill-cross-bold" class="display-5 mb-2 d-block"></iconify-icon>
                  No se encontraron facturas registradas. Haz clic en <strong>+ Nueva Factura</strong> para emitir la primera.
                </td>
              </tr>
              <tr v-for="inv in filteredInvoices" :key="inv.id">
                <td>
                  <span class="font-monospace fw-bold text-info">{{ inv.invoice_number }}</span>
                  <div class="text-secondary small" title="Sucursal">{{ branchName(inv.branch_id) }}</div>
                  <div v-if="inv.access_key" class="text-secondary small text-truncate" style="max-width: 180px;" :title="inv.access_key">
                    Clave: {{ inv.access_key }}
                  </div>
                </td>
                <td>{{ inv.issue_date }}</td>
                <td>
                  <div class="fw-semibold text-white">{{ inv.customer_name }}</div>
                  <small class="text-secondary">{{ inv.customer_address || 'Sin dirección' }}</small>
                </td>
                <td>
                  <span class="badge bg-secondary-subtle text-light font-monospace">
                    {{ inv.customer_id_number }}
                  </span>
                </td>
                <td class="text-end font-monospace">${{ formatNumber(inv.subtotal) }}</td>
                <td class="text-end font-monospace">${{ formatNumber(inv.tax_total) }}</td>
                <td class="text-end font-monospace fw-bold text-success fs-3">${{ formatNumber(inv.total) }}</td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="inv.status === 'CANCELED' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'"
                  >
                    {{ inv.status === 'CANCELED' ? 'Anulada' : inv.status === 'AUTHORIZED' ? 'Autorizada' : 'Emitida / Válida' }}
                  </span>
                  <span
                    v-if="inv.sign_status === 'SIGNED' && inv.status !== 'CANCELED'"
                    class="badge d-block mt-1"
                    :class="sriStatusClass(inv.sri_status)"
                    :title="(inv.sri_messages || []).map((m) => m.mensaje).join(' | ')"
                    style="cursor: pointer;"
                    @click="openSriModalForInvoice(inv)"
                  >
                    <iconify-icon icon="solar:info-circle-line-duotone" class="me-1"></iconify-icon>
                    {{ sriStatusLabel(inv.sri_status) }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button
                      class="btn bg-secondary-subtle text-secondary btn-sm dropdown-toggle d-inline-flex align-items-center gap-1 fw-semibold"
                      type="button"
                      data-bs-toggle="dropdown"
                      data-bs-popper-config='{"strategy":"fixed"}'
                      aria-expanded="false"
                    >
                      <iconify-icon icon="solar:menu-dots-bold" class="fs-4"></iconify-icon>
                      <span>Acciones</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                      <!-- Ver Detalle -->
                      <li>
                        <a class="dropdown-item py-2" href="javascript:void(0)" @click="openDetailModal(inv)">
                          <iconify-icon icon="solar:eye-line-duotone" class="fs-5 text-info"></iconify-icon>
                          <span>Ver Detalle Factura</span>
                        </a>
                      </li>

                      <!-- Firmar XML -->
                      <li v-if="inv.status === 'ISSUED' && inv.sign_status !== 'SIGNED'">
                        <a
                          class="dropdown-item py-2 text-warning"
                          href="javascript:void(0)"
                          :class="{ disabled: signingInvoiceId === inv.id }"
                          @click="onSignInvoice(inv)"
                        >
                          <span v-if="signingInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                          <iconify-icon v-else icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                          <span>Firmar XML</span>
                        </a>
                      </li>

                      <!-- Enviar al SRI -->
                      <li v-if="inv.sign_status === 'SIGNED' && inv.status !== 'CANCELED' && (!inv.sri_status || inv.sri_status === 'NOT_SENT' || inv.sri_status === 'RETURNED' || inv.sri_status === 'NOT_AUTHORIZED')">
                        <a
                          class="dropdown-item py-2 text-primary"
                          href="javascript:void(0)"
                          :class="{ disabled: sendingSriInvoiceId === inv.id || sendingSri }"
                          @click="onSendToSri(inv)"
                        >
                          <span v-if="sendingSriInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                          <iconify-icon v-else icon="solar:plain-2-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                          <span>Enviar al SRI</span>
                        </a>
                      </li>

                      <!-- Consultar SRI -->
                      <li v-if="inv.sri_status === 'IN_PROCESS'">
                        <a
                          class="dropdown-item py-2 text-warning"
                          href="javascript:void(0)"
                          :class="{ disabled: sendingSriInvoiceId === inv.id || sendingSri }"
                          @click="onCheckSri(inv)"
                        >
                          <span v-if="sendingSriInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                          <iconify-icon v-else icon="solar:refresh-circle-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                          <span>Consultar SRI</span>
                        </a>
                      </li>

                      <!-- Descargar XML Firmado -->
                      <li v-if="inv.sign_status === 'SIGNED'">
                        <a
                          class="dropdown-item py-2 text-success"
                          href="javascript:void(0)"
                          :class="{ disabled: downloadingXmlId === inv.id }"
                          @click="downloadXml(inv)"
                        >
                          <span v-if="downloadingXmlId === inv.id" class="spinner-grow spinner-grow-sm text-success" role="status"></span>
                          <iconify-icon v-else icon="solar:download-minimalistic-bold" class="fs-5 text-success"></iconify-icon>
                          <span>Descargar XML Firmado</span>
                        </a>
                      </li>

                      <li><hr class="dropdown-divider"></li>

                      <!-- Imprimir RIDE A4 -->
                      <li>
                        <a class="dropdown-item py-2" href="javascript:void(0)" @click="onPrintA4(inv)">
                          <iconify-icon icon="solar:printer-bold-duotone" class="fs-5 text-info"></iconify-icon>
                          <span>Imprimir RIDE (A4)</span>
                        </a>
                      </li>

                      <!-- Imprimir Ticket 80mm -->
                      <li>
                        <a class="dropdown-item py-2" href="javascript:void(0)" @click="onPrintTicket(inv)">
                          <iconify-icon icon="solar:ticket-bold-duotone" class="fs-5 text-secondary"></iconify-icon>
                          <span>Ticket Térmico (80mm)</span>
                        </a>
                      </li>

                      <!-- Emitir Nota de Crédito -->
                      <li v-if="inv.sign_status === 'SIGNED' && inv.status !== 'CANCELED'">
                        <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="goToCreditNote(inv)">
                          <iconify-icon icon="solar:bill-cross-line-duotone" class="fs-5 text-warning"></iconify-icon>
                          <span>Emitir Nota de Crédito</span>
                        </a>
                      </li>

                      <!-- Anular Factura -->
                      <li v-if="inv.status === 'ISSUED'">
                        <hr class="dropdown-divider">
                        <a
                          class="dropdown-item py-2 text-danger"
                          href="javascript:void(0)"
                          :class="{ disabled: cancelingInvoiceId === inv.id }"
                          @click="onCancelInvoice(inv)"
                        >
                          <span v-if="cancelingInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-danger" role="status"></span>
                          <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" class="fs-5 text-danger"></iconify-icon>
                          <span>Anular Factura</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- MODAL 1: EMITIR NUEVA FACTURA (REGLAS SRI ECUADOR) -->
    <div v-if="showCreateModal" id="form-page" class="form-page">
      <div class="modal-card-custom modal-lg-custom form-page-card form-page-card-lg">
        <div class="modal-header-custom d-flex justify-content-between align-items-center">
          <div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">SRI ECUADOR</span>
            <h4 class="text-white fw-bold mb-0 mt-1">Emitir Factura Electrónica Normal</h4>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="showCreateModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="submitInvoice" class="p-3">
          <!-- Datos de Cabecera SRI -->
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label text-secondary small fw-semibold">Sucursal / Establecimiento emisor *</label>
              <AppSelect2
                :model-value="form.branchId"
                :options="branchSelectOptions"
                placeholder="Seleccionar Sucursal..."
                search-placeholder="Buscar sucursal por código o nombre..."
                @update:model-value="applyBranch(Number($event) || undefined)"
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label text-secondary small fw-semibold">Bodega de Despacho (Inventario)</label>
              <AppSelect2
                v-model="form.warehouseId"
                :options="warehouseSelectOptions"
                placeholder="-- Predeterminada / Automática --"
                search-placeholder="Buscar bodega..."
                allow-clear
              />
            </div>
            <div class="col-md-3">
              <label class="form-label text-secondary small fw-semibold">Establecimiento (Sucursal)</label>
              <input
                :value="form.establishment"
                type="text"
                maxlength="3"
                class="form-control bg-dark-subtle border-secondary text-white font-monospace text-center opacity-75"
                disabled
                readonly
                title="El código del establecimiento viene definido por la sucursal seleccionada"
              />
              <small class="text-muted d-block mt-1 fs-1">Bloqueado según sucursal</small>
            </div>
            <div class="col-md-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label text-secondary small fw-semibold mb-0">Punto de Emisión *</label>
                <span v-if="loadingSequential" class="spinner-grow spinner-grow-sm text-info" role="status"></span>
              </div>
              <AppSelect2
                v-model="form.emission_point"
                :options="emissionPointSelectOptions"
                placeholder="Seleccionar Punto..."
                search-placeholder="Buscar punto de emisión..."
                @change="onEmissionPointChange"
                required
              />
              <small v-if="nextSequentialPreview" class="text-info font-monospace d-block mt-1 fs-1 fw-semibold">
                Secuencial: #{{ nextSequentialPreview }}
              </small>
            </div>
            <div class="col-md-3">
              <label class="form-label text-secondary small fw-semibold">Fecha de Emisión *</label>
              <input
                v-model="form.issue_date"
                type="date"
                class="form-control bg-dark-subtle border-secondary text-white opacity-75"
                readonly
                disabled
                :title="'Por normativa SRI, la fecha de emisión siempre corresponde a la fecha actual'"
                required
              />
              <small class="text-secondary d-block mt-0.5 fs-1">Fijada a la fecha actual por normativa SRI</small>
            </div>
            <div class="col-md-3">
              <label class="form-label text-secondary small fw-semibold">Forma de Pago SRI</label>
              <select v-model="form.payment_method" class="form-select bg-dark-subtle border-secondary text-white">
                <option value="01">01 - Efectivo / Sin Sist. Financiero</option>
                <option value="20">20 - Transferencia / Cheque</option>
                <option value="16">16 - Tarjeta de Débito</option>
                <option value="19">19 - Tarjeta de Crédito</option>
              </select>
            </div>
          </div>

          <!-- Datos del Cliente / Comprador -->
          <div class="card rounded-3 border-secondary p-3 bg-dark-subtle mt-3">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              <span class="text-info small fw-bold text-uppercase">Datos del Cliente (Comprador)</span>
              <div class="d-flex flex-wrap align-items-center gap-2">
                <button
                  type="button"
                  class="btn btn-xs rounded-pill d-inline-flex align-items-center gap-1"
                  :class="form.customer_id_type === '07' ? 'btn-info text-dark fw-bold' : 'btn-outline-info'"
                  @click="setFinalConsumer"
                  title="Facturar a Consumidor Final (9999999999999)"
                >
                  <iconify-icon icon="solar:user-bold"></iconify-icon>
                  <span>Consumidor Final</span>
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-outline-success rounded-pill d-inline-flex align-items-center gap-1"
                  @click="openQuickCustomerModal"
                  title="Registrar nuevo cliente al instante"
                >
                  <iconify-icon icon="solar:user-plus-bold"></iconify-icon>
                  <span>+ Nuevo Cliente</span>
                </button>
                <div style="min-width: 260px;">
                  <AppSelect2
                    :options="customerSelectOptions"
                    placeholder="Seleccionar de Contactos..."
                    search-placeholder="Buscar cliente por nombre o RUC..."
                    allow-clear
                    @change="onSelectCustomerSelect2"
                  />
                </div>
              </div>
            </div>

            <div class="row g-2">
              <div class="col-md-3">
                <label class="form-label text-secondary small">Tipo Identificación *</label>
                <select
                  v-model="form.customer_id_type"
                  :disabled="isRegisteredCustomer"
                  class="form-select form-select-sm bg-dark border-secondary text-white"
                  :class="{ 'opacity-75': isRegisteredCustomer }"
                >
                  <option value="04">04 - RUC</option>
                  <option value="05">05 - Cédula</option>
                  <option value="06">06 - Pasaporte</option>
                  <option value="07">07 - Consumidor Final</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label text-secondary small">RUC / Cédula *</label>
                <input
                  v-model="form.customer_id_number"
                  type="text"
                  class="form-control form-control-sm bg-dark border-secondary text-white font-mono"
                  :readonly="isRegisteredCustomer"
                  :class="{ 'opacity-75': isRegisteredCustomer }"
                  placeholder="Ej: 1718293847"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small">Razón Social / Nombre Completo *</label>
                <input
                  v-model="form.customer_name"
                  type="text"
                  class="form-control form-control-sm bg-dark border-secondary text-white"
                  :readonly="isRegisteredCustomer"
                  :class="{ 'opacity-75': isRegisteredCustomer }"
                  placeholder="Ej: Juan Pérez"
                  required
                />
                <small v-if="isRegisteredCustomer" class="text-info d-block fs-1 mt-1">Dato protegido cargado del cliente seleccionado</small>
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small">Dirección</label>
                <input v-model="form.customer_address" type="text" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Av. Principal y Secundaria" />
              </div>
              <div class="col-md-3">
                <label class="form-label text-secondary small">Correo Electrónico</label>
                <input v-model="form.customer_email" type="email" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="cliente@correo.com" />
              </div>
              <div class="col-md-3">
                <label class="form-label text-secondary small">Teléfono</label>
                <input v-model="form.customer_phone" type="text" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="0991234567" />
              </div>
            </div>
          </div>

          <!-- Detalle de Productos, Servicios y Subcontratos -->
          <div class="mt-3">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
              <!-- Nav Tabs por tipo: Artículos / Servicios / Subcontratos -->
              <ul class="nav nav-pills gap-1" role="tablist">
                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link btn-sm rounded-pill px-3 py-1 fs-2 d-flex align-items-center gap-2"
                    :class="{
                      'active bg-primary text-white': activeDetailTab === 'ITEM',
                      'bg-dark-subtle text-secondary border border-secondary-subtle': activeDetailTab !== 'ITEM'
                    }"
                    @click="activeDetailTab = 'ITEM'"
                  >
                    <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-4"></iconify-icon>
                    <span>Artículos Físicos</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">{{ countArticles }}</span>
                  </button>
                </li>

                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link btn-sm rounded-pill px-3 py-1 fs-2 d-flex align-items-center gap-2"
                    :class="{
                      'active bg-primary text-white': activeDetailTab === 'SERVICE',
                      'bg-dark-subtle text-secondary border border-secondary-subtle': activeDetailTab !== 'SERVICE'
                    }"
                    @click="activeDetailTab = 'SERVICE'"
                  >
                    <iconify-icon icon="solar:wrench-line-duotone" class="fs-4"></iconify-icon>
                    <span>Servicios Propios</span>
                    <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill">{{ countServices }}</span>
                  </button>
                </li>

                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link btn-sm rounded-pill px-3 py-1 fs-2 d-flex align-items-center gap-2"
                    :class="{
                      'active bg-primary text-white': activeDetailTab === 'SUBCONTRACT',
                      'bg-dark-subtle text-secondary border border-secondary-subtle': activeDetailTab !== 'SUBCONTRACT'
                    }"
                    @click="activeDetailTab = 'SUBCONTRACT'"
                  >
                    <iconify-icon icon="solar:users-group-two-rounded-line-duotone" class="fs-4"></iconify-icon>
                    <span>Subcontratos / Mano de Obra</span>
                    <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill">{{ countSubcontracts }}</span>
                  </button>
                </li>

                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link btn-sm rounded-pill px-3 py-1 fs-2 d-flex align-items-center gap-2"
                    :class="{
                      'active bg-info text-white': activeDetailTab === 'ALL',
                      'bg-dark-subtle text-secondary border border-secondary-subtle': activeDetailTab !== 'ALL'
                    }"
                    @click="activeDetailTab = 'ALL'"
                  >
                    <iconify-icon icon="solar:list-check-bold" class="fs-4"></iconify-icon>
                    <span>Todos ({{ form.details.length }})</span>
                  </button>
                </li>
              </ul>

              <!-- Botón Agregar Línea según el tipo actual -->
              <button
                type="button"
                class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 rounded-pill px-3 py-1 fw-semibold"
                @click="addDetailRow(activeDetailTab)"
              >
                <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
                <span>{{ addRowButtonLabel }}</span>
              </button>
            </div>

            <div class="table-responsive border rounded-3 invoice-details-table-wrapper">
              <table class="table table-hover table-sm align-middle mb-0 invoice-items-table">
                <thead class="table-primary fs-1 text-uppercase">
                  <tr>
                    <th class="col-item-catalog">
                      {{ activeDetailTab === 'ITEM' ? 'Artículo Físico del Catálogo' : (activeDetailTab === 'SERVICE' ? 'Servicio Propio' : (activeDetailTab === 'SUBCONTRACT' ? 'Mano de Obra / Subcontrato' : 'Producto / Servicio / Subcontrato')) }}
                    </th>
                    <th class="col-warehouse">Bodega Despacho</th>
                    <th class="col-qty text-center">Cant.</th>
                    <th class="col-price text-end">Precio ($)</th>
                    <th class="col-desc text-end">Desc. ($)</th>
                    <th class="col-iva text-center">IVA</th>
                    <th class="col-subtotal text-end">Subtotal</th>
                    <th class="col-actions text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in visibleDetails" :key="row._uid || idx">
                    <td>
                      <!-- SELECT2 SEGÚN EL TIPO -->
                      <div class="d-flex flex-column gap-1">
                        <!-- Identificador si está en la pestaña TODOS -->
                        <div v-if="activeDetailTab === 'ALL'" class="d-flex align-items-center gap-1 mb-1">
                          <span
                            class="badge px-2 py-1 fs-1 fw-bold"
                            :class="{
                              'bg-primary-subtle text-primary border border-primary-subtle': row.item_type === 'ITEM',
                              'bg-info-subtle text-info border border-info-subtle': row.item_type === 'SERVICE',
                              'bg-warning-subtle text-warning border border-warning-subtle': row.item_type === 'SUBCONTRACT'
                            }"
                          >
                            {{ row.item_type === 'ITEM' ? '📦 Artículo' : (row.item_type === 'SERVICE' ? '🛠️ Servicio' : '🤝 Subcontrato') }}
                          </span>
                        </div>

                        <!-- 1. Caso ARTÍCULO FÍSICO -->
                        <template v-if="row.item_type === 'ITEM'">
                          <AppSelect2
                            :model-value="row.item_id"
                            :options="articleSelectOptions"
                            placeholder="-- Seleccionar Artículo Físico --"
                            search-placeholder="Buscar artículo por código o nombre..."
                            @update:model-value="onSelectArticle(row, $event)"
                          />
                          <!-- Muestra el STOCK del producto seleccionado -->
                          <div v-if="getArticleStockInfo(row.item_id)" class="d-flex flex-wrap align-items-center gap-2 mt-1">
                            <span
                              class="badge px-2 py-1 fs-1 d-inline-flex align-items-center gap-1"
                              :class="getArticleStockInfo(row.item_id)!.stock > 0
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-danger-subtle text-danger border border-danger-subtle'"
                            >
                              <iconify-icon icon="solar:box-minimalistic-bold"></iconify-icon>
                              Stock disponible: <b>{{ getArticleStockInfo(row.item_id)!.stock }} {{ getArticleStockInfo(row.item_id)!.unit }}</b>
                            </span>
                            <span
                              v-if="Number(row.quantity || 0) > getArticleStockInfo(row.item_id)!.stock"
                              class="badge bg-warning-subtle text-warning border border-warning-subtle fs-1 d-inline-flex align-items-center gap-1"
                            >
                              <iconify-icon icon="solar:danger-triangle-bold"></iconify-icon>
                              ⚠️ Cantidad ingresada supera el stock disponible
                            </span>
                          </div>
                        </template>

                        <!-- 2. Caso SERVICIO PROPIO -->
                        <template v-else-if="row.item_type === 'SERVICE'">
                          <AppSelect2
                            :model-value="row.item_id"
                            :options="serviceSelectOptions"
                            placeholder="-- Seleccionar Servicio Propio --"
                            search-placeholder="Buscar servicio por código o nombre..."
                            @update:model-value="onSelectService(row, $event)"
                          />
                        </template>

                        <!-- 3. Caso SUBCONTRATO / MANO DE OBRA -->
                        <template v-else-if="row.item_type === 'SUBCONTRACT'">
                          <AppSelect2
                            :model-value="row.item_id"
                            :options="subcontractSelectOptions"
                            placeholder="-- Seleccionar Subcontrato / Mano de Obra --"
                            search-placeholder="Buscar subcontrato..."
                            @update:model-value="onSelectSubcontract(row, $event)"
                          />
                        </template>

                        <!-- Input para descripción detallada editable -->
                        <input
                          v-model="row.description"
                          type="text"
                          class="form-control form-control-sm bg-dark border-secondary text-white mt-1"
                          :placeholder="row.item_type === 'ITEM' ? 'Descripción del artículo *' : (row.item_type === 'SERVICE' ? 'Descripción del servicio *' : 'Descripción del subcontrato *')"
                          required
                        />
                      </div>
                    </td>

                    <td>
                      <select v-if="row.item_type === 'ITEM'" v-model="row.warehouse_id" class="form-select form-select-sm bg-dark border-secondary text-white">
                        <option :value="undefined">Por Defecto</option>
                        <option v-for="w in activeWarehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                      </select>
                      <span v-else class="text-secondary small fst-italic">No aplica (Intangible)</span>
                    </td>

                    <td>
                      <input v-model.number="row.quantity" type="number" step="0.01" min="0.01" class="form-control form-control-sm bg-dark border-secondary text-white text-center" required />
                    </td>

                    <td>
                      <input v-model.number="row.unit_price" type="number" step="0.01" min="0" class="form-control form-control-sm bg-dark border-secondary text-white text-end" required />
                    </td>

                    <td>
                      <input v-model.number="row.discount" type="number" step="0.01" min="0" class="form-control form-control-sm bg-dark border-secondary text-white text-end" />
                    </td>

                    <td>
                      <select v-model.number="row.tax_rate" class="form-select form-select-sm bg-dark border-secondary text-white text-center">
                        <option :value="15">15%</option>
                        <option :value="0">0%</option>
                        <option :value="5">5%</option>
                      </select>
                    </td>

                    <td class="text-end font-monospace fw-semibold text-white">
                      ${{ formatNumber(Math.max(0, Number(row.quantity || 0) * Number(row.unit_price || 0) - Number(row.discount || 0))) }}
                    </td>

                    <td class="text-center">
                      <button type="button" class="btn btn-link text-danger p-0" @click="removeDetailRowByUid(row._uid)" title="Eliminar ítem">
                        <iconify-icon icon="solar:trash-bin-minimalistic-bold" class="fs-5"></iconify-icon>
                      </button>
                    </td>
                  </tr>

                  <!-- Mensaje si la pestaña no tiene ítems -->
                  <tr v-if="visibleDetails.length === 0">
                    <td colspan="8" class="text-center py-4 text-muted">
                      <div class="d-flex flex-column align-items-center gap-2">
                        <iconify-icon
                          :icon="activeDetailTab === 'ITEM' ? 'solar:box-minimalistic-line-duotone' : (activeDetailTab === 'SERVICE' ? 'solar:wrench-line-duotone' : 'solar:users-group-two-rounded-line-duotone')"
                          class="fs-1 text-secondary"
                        ></iconify-icon>
                        <span>
                          No hay {{ activeDetailTab === 'ITEM' ? 'artículos físicos' : (activeDetailTab === 'SERVICE' ? 'servicios propios' : (activeDetailTab === 'SUBCONTRACT' ? 'subcontratos' : 'ítems')) }} en la factura.
                        </span>
                        <button type="button" class="btn btn-xs btn-outline-primary rounded-pill mt-1" @click="addDetailRow(activeDetailTab)">
                          + {{ addRowButtonLabel }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Observaciones y Totales -->
          <div class="row g-3 mt-2">
            <div class="col-md-7">
              <label class="form-label text-secondary small fw-semibold">Notas / Observaciones</label>
              <textarea v-model="form.notes" rows="3" class="form-control bg-dark-subtle border-secondary text-white" placeholder="Condiciones de entrega, garantía, etc..."></textarea>
            </div>
            <div class="col-md-5">
              <div class="card rounded-3 border-secondary p-3 bg-dark-subtle">
                <div class="d-flex justify-content-between text-secondary mb-1">
                  <span>Subtotal 15%:</span>
                  <span class="font-monospace text-white">${{ formatNumber(calculatedTotals.subtotal15) }}</span>
                </div>
                <div class="d-flex justify-content-between text-secondary mb-1">
                  <span>Subtotal 0%:</span>
                  <span class="font-monospace text-white">${{ formatNumber(calculatedTotals.subtotal0) }}</span>
                </div>
                <div v-if="calculatedTotals.discountTotal > 0" class="d-flex justify-content-between text-secondary mb-1">
                  <span>Descuento:</span>
                  <span class="font-monospace text-danger">-${{ formatNumber(calculatedTotals.discountTotal) }}</span>
                </div>
                <div class="d-flex justify-content-between text-secondary mb-1">
                  <span>IVA (15%):</span>
                  <span class="font-monospace text-white">${{ formatNumber(calculatedTotals.taxTotal) }}</span>
                </div>
                <hr class="border-secondary my-2" />
                <div class="d-flex justify-content-between align-items-center">
                  <span class="fw-bold text-white fs-4">VALOR TOTAL:</span>
                  <span class="font-monospace fw-bold text-success fs-5">${{ formatNumber(calculatedTotals.grandTotal) }}</span>
                </div>

                <!-- Pago en Efectivo y Cálculo de Vuelto (POS) -->
                <div v-if="form.payment_method === '01'" class="mt-3 pt-2 border-top border-secondary">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label text-warning small fw-bold mb-0">Efectivo Recibido ($)</label>
                    <div class="d-flex gap-1">
                      <button type="button" class="btn btn-xs btn-outline-success py-0 px-1" @click="setExactCash" title="Cobro exacto">Exacto</button>
                      <button type="button" class="btn btn-xs btn-outline-secondary py-0 px-1" @click="setQuickCash(10)">$10</button>
                      <button type="button" class="btn btn-xs btn-outline-secondary py-0 px-1" @click="setQuickCash(20)">$20</button>
                      <button type="button" class="btn btn-xs btn-outline-secondary py-0 px-1" @click="setQuickCash(50)">$50</button>
                      <button type="button" class="btn btn-xs btn-outline-secondary py-0 px-1" @click="setQuickCash(100)">$100</button>
                    </div>
                  </div>
                  <input
                    v-model.number="cashReceived"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control form-control-sm bg-dark border-secondary text-white font-monospace text-end fs-4"
                    placeholder="0.00"
                  />
                  <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="small fw-semibold text-secondary">Cambio / Vuelto:</span>
                    <span
                      v-if="cashMissing > 0"
                      class="badge bg-danger-subtle text-danger border border-danger-subtle fs-2 font-monospace"
                    >
                      Faltan ${{ formatNumber(cashMissing) }}
                    </span>
                    <span
                      v-else-if="cashReceived != null && cashReceived >= calculatedTotals.grandTotal"
                      class="badge bg-success-subtle text-success border border-success-subtle fs-4 font-monospace fw-bold px-2 py-1"
                    >
                      ${{ formatNumber(cashChange) }}
                    </span>
                    <span v-else class="text-secondary font-monospace">$0.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer del Modal -->
          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:diskette-bold-duotone"></iconify-icon>
              <span>{{ saving ? 'Emitiendo Factura...' : 'Emitir Factura' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: VER DETALLE / RIDE DE FACTURA -->
    <Teleport to="body">
      <div v-if="showDetailModal && viewingInvoice" class="modal-backdrop-custom keep-in-form" @click.self="showDetailModal = false">
      <div class="modal-card-custom modal-lg-custom">
        <div class="modal-header-custom d-flex justify-content-between align-items-center">
          <div>
            <span class="badge bg-success-subtle text-success border border-success-subtle">FACTURA ELECTRÓNICA</span>
            <h4 class="fw-bold mb-0 mt-1 modal-title-custom">{{ viewingInvoice.invoice_number }}</h4>
          </div>
          <button class="btn btn-link text-secondary p-0 fs-5" @click="showDetailModal = false">
            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
          </button>
        </div>

        <div class="p-4 modal-body-custom">
          <div class="row g-3 pb-3 border-bottom">
            <div class="col-md-6">
              <span class="text-secondary small d-block">Cliente:</span>
              <div class="fw-bold fs-4">{{ viewingInvoice.customer_name }}</div>
              <div class="text-secondary">RUC/CI: {{ viewingInvoice.customer_id_number }}</div>
              <div class="text-secondary">Dirección: {{ viewingInvoice.customer_address || 'S/N' }}</div>
            </div>
            <div class="col-md-6 text-md-end">
              <span class="text-secondary small d-block">Fecha de Emisión:</span>
              <div class="fw-bold">{{ viewingInvoice.issue_date }}</div>
              <span class="text-secondary small d-block mt-2">Clave de Acceso SRI (49 dígitos):</span>
              <div class="font-monospace small text-info text-break">{{ viewingInvoice.access_key || 'No generada' }}</div>
            </div>
          </div>

          <!-- Detalle de Ítems -->
          <div class="table-responsive mt-3">
            <table class="table table-hover table-sm align-middle">
              <thead class="table-primary text-uppercase fs-1">
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-end">P. Unitario</th>
                  <th class="text-end">IVA</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in viewingInvoice.details" :key="d.id">
                  <td class="font-monospace text-info">{{ d.code || 'S/C' }}</td>
                  <td>{{ d.description }}</td>
                  <td class="text-center font-monospace">{{ d.quantity }}</td>
                  <td class="text-end font-monospace">${{ formatNumber(d.unit_price) }}</td>
                  <td class="text-end font-monospace">{{ d.tax_rate }}%</td>
                  <td class="text-end font-monospace fw-bold text-success">${{ formatNumber(d.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen de Totales -->
          <div class="d-flex justify-content-end mt-3">
            <div class="p-3 bg-body-tertiary rounded-3 border" style="min-width: 250px;">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-secondary">Subtotal 15%:</span>
                <span class="font-monospace">${{ formatNumber(viewingInvoice.subtotal_taxable) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-secondary">Subtotal 0%:</span>
                <span class="font-monospace">${{ formatNumber(viewingInvoice.subtotal_zero_tax) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-secondary">IVA (15%):</span>
                <span class="font-monospace">${{ formatNumber(viewingInvoice.tax_total) }}</span>
              </div>
              <hr class="my-2" />
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold">TOTAL:</span>
                <span class="font-monospace fw-bold text-success fs-4">${{ formatNumber(viewingInvoice.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="viewingInvoice.sign_status === 'SIGNED' && viewingInvoice.status !== 'CANCELED'" class="px-3 pb-3">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="fw-bold">Estado SRI:</span>
            <span class="badge" :class="sriStatusClass(viewingInvoice.sri_status)">{{ sriStatusLabel(viewingInvoice.sri_status) }}</span>
            <span v-if="viewingInvoice.sri_authorization_number" class="font-monospace small">
              No. autorización: {{ viewingInvoice.sri_authorization_number }}
            </span>
            <span v-if="viewingInvoice.sri_authorization_date" class="small text-secondary">
              ({{ new Date(viewingInvoice.sri_authorization_date).toLocaleString() }})
            </span>
          </div>
          <ul v-if="(viewingInvoice.sri_messages || []).length" class="small mb-0 mt-2 ps-3">
            <li v-for="(m, idx) in viewingInvoice.sri_messages" :key="idx" :class="m.tipo === 'ADVERTENCIA' ? 'text-warning' : 'text-danger'">
              <span v-if="m.identificador" class="font-monospace">[{{ m.identificador }}]</span>
              {{ m.mensaje }}
              <span v-if="m.informacionAdicional" class="text-secondary"> — {{ m.informacionAdicional }}</span>
            </li>
          </ul>
        </div>

        <div class="modal-footer d-flex justify-content-end gap-2 p-3 border-top">
          <button
            v-if="viewingInvoice.sign_status === 'SIGNED' && viewingInvoice.status !== 'CANCELED' && (!viewingInvoice.sri_status || viewingInvoice.sri_status === 'NOT_SENT' || viewingInvoice.sri_status === 'RETURNED' || viewingInvoice.sri_status === 'NOT_AUTHORIZED')"
            class="btn btn-outline-primary d-flex align-items-center gap-2"
            :disabled="sendingSri"
            @click="onSendToSri(viewingInvoice)"
          >
            <span v-if="sendingSri" class="spinner-grow spinner-grow-sm text-primary" role="status" aria-hidden="true"></span>
            <iconify-icon v-else icon="solar:plain-2-bold-duotone"></iconify-icon>
            <span>{{ sendingSri ? 'Enviando al SRI…' : 'Enviar al SRI' }}</span>
          </button>
          <button
            v-if="viewingInvoice.sri_status === 'IN_PROCESS'"
            class="btn btn-outline-warning d-flex align-items-center gap-2"
            :disabled="sendingSri"
            @click="onCheckSri(viewingInvoice)"
          >
            <span v-if="sendingSri" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
            <iconify-icon v-else icon="solar:refresh-circle-bold-duotone"></iconify-icon>
            <span>{{ sendingSri ? 'Consultando SRI…' : 'Consultar autorización SRI' }}</span>
          </button>
          <button
            v-if="viewingInvoice.status === 'ISSUED' && viewingInvoice.sign_status !== 'SIGNED'"
            class="btn btn-outline-warning d-flex align-items-center gap-2"
            :disabled="signingInvoiceId === viewingInvoice.id"
            @click="onSignInvoice(viewingInvoice)"
          >
            <span v-if="signingInvoiceId === viewingInvoice.id" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
            <iconify-icon v-else icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>{{ signingInvoiceId === viewingInvoice.id ? 'Firmando XML...' : 'Firmar XML' }}</span>
          </button>
          <button
            v-if="viewingInvoice.sign_status === 'SIGNED'"
            class="btn btn-outline-success d-flex align-items-center gap-2"
            :disabled="downloadingXmlId === viewingInvoice.id"
            @click="downloadXml(viewingInvoice)"
          >
            <span v-if="downloadingXmlId === viewingInvoice.id" class="spinner-grow spinner-grow-sm text-success" role="status" aria-hidden="true"></span>
            <iconify-icon v-else icon="solar:download-minimalistic-bold"></iconify-icon>
            <span>Descargar XML firmado</span>
          </button>
          <button class="btn btn-outline-info d-flex align-items-center gap-2" @click="onPrintA4(viewingInvoice)">
            <iconify-icon icon="solar:printer-bold-duotone"></iconify-icon>
            <span>Imprimir RIDE (A4)</span>
          </button>
          <button class="btn btn-outline-light d-flex align-items-center gap-2" @click="onPrintTicket(viewingInvoice)">
            <iconify-icon icon="solar:ticket-bold-duotone"></iconify-icon>
            <span>Ticket (80mm)</span>
          </button>
          <button
            v-if="viewingInvoice.sign_status === 'SIGNED' && viewingInvoice.status !== 'CANCELED'"
            class="btn btn-outline-danger d-flex align-items-center gap-2"
            @click="showDetailModal = false; goToCreditNote(viewingInvoice)"
            title="Emitir Nota de Crédito para esta factura"
          >
            <iconify-icon icon="solar:bill-cross-line-duotone"></iconify-icon>
            <span>Emitir Nota de Crédito</span>
          </button>
          <button class="btn btn-secondary" @click="showDetailModal = false">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- MODAL: + NUEVO CLIENTE RÁPIDO (VENTA MOSTRADOR POS) -->
  <Teleport to="body">
    <div v-if="showQuickCustomerModal" class="modal-backdrop-custom keep-in-form" @click.self="showQuickCustomerModal = false">
      <div class="modal-card-custom" style="max-width: 520px;">
        <div class="modal-header-custom d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <div class="crud-kpi-icon primary" style="width: 34px; height: 34px;">
              <iconify-icon icon="solar:user-plus-bold" class="fs-5"></iconify-icon>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-white">Nuevo Cliente Rápido</h5>
              <small class="text-secondary">Registro ágil para venta en mostrador</small>
            </div>
          </div>
          <button type="button" class="btn btn-link text-secondary p-0 fs-5" @click="showQuickCustomerModal = false">
            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
          </button>
        </div>

        <form @submit.prevent="saveQuickCustomer" class="p-4 modal-body-custom">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Identificación *</label>
              <select v-model="quickCustomerForm.tipo_documento" class="form-select bg-dark border-secondary text-white" required>
                <option value="05">Cédula (05)</option>
                <option value="04">RUC (04)</option>
                <option value="06">Pasaporte (06)</option>
              </select>
            </div>
            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Cédula / RUC *</label>
              <input
                v-model="quickCustomerForm.num_document"
                type="text"
                class="form-control bg-dark border-secondary text-white font-monospace"
                placeholder="Ej: 1723064117"
                required
              />
            </div>
            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Razón Social / Nombre Completo *</label>
              <input
                v-model="quickCustomerForm.razon_social"
                type="text"
                class="form-control bg-dark border-secondary text-white"
                placeholder="Ej: Juan Carlos Pérez"
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico</label>
              <input
                v-model="quickCustomerForm.email"
                type="email"
                class="form-control bg-dark border-secondary text-white"
                placeholder="cliente@correo.com"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono</label>
              <input
                v-model="quickCustomerForm.telefono"
                type="text"
                class="form-control bg-dark border-secondary text-white"
                placeholder="0991234567"
              />
            </div>
            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección</label>
              <input
                v-model="quickCustomerForm.direccion"
                type="text"
                class="form-control bg-dark border-secondary text-white"
                placeholder="Calle principal y número"
              />
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
            <button type="button" class="btn btn-secondary" @click="showQuickCustomerModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="quickCustomerLoading">
              <span v-if="quickCustomerLoading" class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:check-circle-bold"></iconify-icon>
              <span>{{ quickCustomerLoading ? 'Guardando...' : 'Crear y Usar Cliente' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- MODAL: CUADRE DE CAJA DIARIO (POS) -->
  <Teleport to="body">
    <div v-if="showDailyCashModal" class="modal-backdrop-custom keep-in-form" @click.self="showDailyCashModal = false">
      <div class="modal-card-custom" style="max-width: 580px;">
        <div class="modal-header-custom d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <div class="crud-kpi-icon success" style="width: 34px; height: 34px;">
              <iconify-icon icon="solar:calculator-minimalistic-bold-duotone" class="fs-5"></iconify-icon>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-white">Cuadre de Caja Diario</h5>
              <small class="text-secondary">Fecha: {{ dailyCashSummary.date }}</small>
            </div>
          </div>
          <button type="button" class="btn btn-link text-secondary p-0 fs-5" @click="showDailyCashModal = false">
            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
          </button>
        </div>

        <div class="p-4 modal-body-custom">
          <!-- Totales por Forma de Pago -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="p-3 rounded-3 bg-dark-subtle border border-secondary text-center">
                <span class="text-secondary fs-1 d-block mb-1">💵 Efectivo (01)</span>
                <span class="font-monospace fs-4 fw-bold text-success">${{ formatNumber(dailyCashSummary.totalCash) }}</span>
              </div>
            </div>
            <div class="col-6">
              <div class="p-3 rounded-3 bg-dark-subtle border border-secondary text-center">
                <span class="text-secondary fs-1 d-block mb-1">💳 Tarjetas (16 / 19)</span>
                <span class="font-monospace fs-4 fw-bold text-info">${{ formatNumber(dailyCashSummary.totalCards) }}</span>
              </div>
            </div>
            <div class="col-6">
              <div class="p-3 rounded-3 bg-dark-subtle border border-secondary text-center">
                <span class="text-secondary fs-1 d-block mb-1">🏦 Transferencias (20)</span>
                <span class="font-monospace fs-4 fw-bold text-warning">${{ formatNumber(dailyCashSummary.totalTransfer) }}</span>
              </div>
            </div>
            <div class="col-6">
              <div class="p-3 rounded-3 bg-dark-subtle border border-secondary text-center">
                <span class="text-secondary fs-1 d-block mb-1">🧾 Total Facturado</span>
                <span class="font-monospace fs-4 fw-bold text-white">${{ formatNumber(dailyCashSummary.grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Resumen de Comprobantes -->
          <div class="d-flex justify-content-between p-2 rounded-2 bg-dark mb-2 text-secondary fs-2">
            <span>Facturas Emitidas Hoy:</span>
            <span class="font-monospace text-white fw-bold">{{ dailyCashSummary.countIssued }}</span>
          </div>
          <div class="d-flex justify-content-between p-2 rounded-2 bg-dark mb-2 text-secondary fs-2">
            <span>Facturas Anuladas Hoy:</span>
            <span class="font-monospace text-danger fw-bold">{{ dailyCashSummary.countCanceled }}</span>
          </div>
          <div class="d-flex justify-content-between p-2 rounded-2 bg-dark text-secondary fs-2">
            <span>Total Comprobantes Procesados:</span>
            <span class="font-monospace text-info fw-bold">{{ dailyCashSummary.countTotal }}</span>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
            <button type="button" class="btn btn-secondary" @click="showDailyCashModal = false">Cerrar</button>
            <button type="button" class="btn btn-info d-flex align-items-center gap-1" @click="printDailyClosure">
              <iconify-icon icon="solar:printer-bold-duotone"></iconify-icon>
              <span>Imprimir Cierre de Caja</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

    <!-- MODAL 3: RESPUESTA DETALLADA DEL SRI -->
    <SriResponseModal
      v-model="showSriModal"
      :document-type="sriModalData.documentType"
      :document-number="sriModalData.documentNumber"
      :access-key="sriModalData.accessKey"
      :result="sriModalData.result"
    />
  </div>
</template>

<style scoped>
.alertbox-wrap {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: min(680px, calc(100vw - 32px));
  z-index: 3000; /* por encima de los modales */
}
.alertbox-text {
  white-space: pre-line;
  word-break: break-word;
}
.alertbox-enter-active,
.alertbox-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.alertbox-enter-from,
.alertbox-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}
.invoices-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 20, 0.78);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10050 !important;
  padding: 16px;
}

.modal-card-custom {
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-lg-custom {
  max-width: 860px;
}

.modal-header-custom {
  padding: 16px 20px;
  border-bottom: 1px solid var(--bs-border-color);
}

/* Títulos y valores del modal de detalle siguen el color de énfasis del tema (claro u oscuro) */
.modal-title-custom,
.modal-body-custom .fw-bold {
  color: var(--bs-heading-color);
}

.modal-body-custom {
  color: var(--bs-body-color);
}

.modal-body-custom .text-secondary {
  color: var(--bs-body-color) !important;
  opacity: 0.8;
}

[data-bs-theme='light'] .modal-backdrop-custom {
  background: rgba(17, 28, 45, 0.45);
}

.btn-xs {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
}

/* Formularios de registro/edición como página (no modal): al abrirse reemplazan al listado */
.form-open > :not(.form-page):not(.keep-in-form):not(.modal-backdrop-custom):not(.crud-modal-backdrop) {
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
.modal-card-custom.form-page-card {
  max-height: none;
  overflow: visible;
  box-shadow: none;
  margin: 0 auto;
}
.modal-card-custom.form-page-card-lg {
  max-width: none;
}

/* Contenedor responsivo del detalle de ítems de la factura */
.invoice-details-table-wrapper {
  min-height: 220px;
  overflow: visible;
  position: relative;
  background-color: var(--bs-card-bg, #111c2d);
  border-color: var(--bs-border-color, rgba(189, 200, 240, 0.15)) !important;
  padding-bottom: 20px;
}

@media (max-width: 991px) {
  .invoice-details-table-wrapper {
    overflow-x: auto;
    min-height: 300px;
  }
}

.invoice-items-table {
  min-width: 960px;
  width: 100%;
}

.invoice-items-table th {
  padding: 0.75rem 0.85rem;
  white-space: nowrap;
}

.invoice-items-table td {
  padding: 0.75rem 0.85rem;
  vertical-align: top;
}

.col-item-catalog {
  min-width: 330px;
  width: 35%;
}

.col-warehouse {
  min-width: 150px;
  width: 16%;
}

.col-qty {
  min-width: 85px;
  width: 8%;
}

.col-price {
  min-width: 110px;
  width: 11%;
}

.col-desc {
  min-width: 95px;
  width: 10%;
}

.col-iva {
  min-width: 95px;
  width: 9%;
}

.col-subtotal {
  min-width: 110px;
  width: 10%;
}

.col-actions {
  min-width: 45px;
  width: 2%;
}
</style>
