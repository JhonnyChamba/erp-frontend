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
import { getCustomers, type CustomerItem } from '@/services/contacts.service'
import { getBranches, type BranchItem } from '@/services/config.service'
import {
  getEmissionPoints,
  getNextSequential,
  type EmissionPointItem,
} from '@/services/emission-points.service'
import SriResponseModal from '@/components/common/SriResponseModal.vue'

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
const statusFilter = ref<'TODOS' | 'ISSUED' | 'CANCELED'>('TODOS')

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
    if (statusFilter.value !== 'TODOS' && inv.status !== statusFilter.value) {
      return false
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
  if (!custId) return
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
  // Toda factura pertenece a una empresa y a una sucursal: sin sucursales activas no se puede emitir
  if (issuableBranches.value.length === 0) {
    errorMsg.value = 'Para emitir facturas primero registra y activa al menos una sucursal en Configuración > Sucursales.'
    return
  }
  form.value = initialInvoiceForm()
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

// RIDE (Representación Impresa del Documento Electrónico): imprime o guarda como PDF desde el navegador
const printRide = (inv: InvoiceItem) => {
  let company: any = {}
  try {
    company = JSON.parse(localStorage.getItem('selectedCompany') || '{}')
  } catch {}
  const esc = (s: any) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
  const payNames: Record<string, string> = {
    '01': 'SIN UTILIZACION DEL SISTEMA FINANCIERO',
    '16': 'TARJETA DE DEBITO',
    '19': 'TARJETA DE CREDITO',
    '20': 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
  }
  const rows = (inv.details || [])
    .map(
      (d) => `<tr><td>${esc(d.code)}</td><td>${esc(d.description)}</td>
      <td class="r">${esc(d.quantity)}</td><td class="r">${formatNumber(d.unit_price)}</td>
      <td class="r">${formatNumber(d.discount)}</td><td class="r">${formatNumber(d.total)}</td></tr>`
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Factura ${esc(inv.invoice_number)}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#000;margin:20px}
    .box{border:1px solid #000;border-radius:6px;padding:8px;margin-bottom:8px}
    .head{display:flex;gap:10px}.head>div{flex:1}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:4px}
    .r{text-align:right}.k{word-break:break-all;font-family:monospace;font-size:11px}
    .tot{width:280px;margin-left:auto;margin-top:8px}
  </style></head><body>
  <div class="head">
    <div class="box"><h2>${esc(company.razon_social || company.nombre_comercial || 'EMPRESA')}</h2>
      <div>${esc(company.nombre_comercial || '')}</div></div>
    <div class="box"><b>R.U.C.:</b> ${esc(company.ruc || '')}<br><b>FACTURA</b><br>
      <b>No.</b> ${esc(inv.invoice_number)}<br><b>CLAVE DE ACCESO</b><div class="k">${esc(inv.access_key || '')}</div></div>
  </div>
  <div class="box"><b>Razón Social / Nombres:</b> ${esc(inv.customer_name)}<br>
    <b>Identificación:</b> ${esc(inv.customer_id_number)}<br>
    <b>Fecha de Emisión:</b> ${esc(inv.issue_date)}<br>
    <b>Dirección:</b> ${esc(inv.customer_address || '')}</div>
  <table><thead><tr><th>Cód.</th><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Desc.</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
  <table class="tot">
    <tr><td>SUBTOTAL IVA</td><td class="r">${formatNumber(inv.subtotal_taxable)}</td></tr>
    <tr><td>SUBTOTAL 0%</td><td class="r">${formatNumber(inv.subtotal_zero_tax)}</td></tr>
    <tr><td>DESCUENTO</td><td class="r">${formatNumber(inv.discount_total)}</td></tr>
    <tr><td>IVA</td><td class="r">${formatNumber(inv.tax_total)}</td></tr>
    <tr><td><b>VALOR TOTAL</b></td><td class="r"><b>${formatNumber(inv.total)}</b></td></tr>
  </table>
  <div class="box" style="margin-top:8px"><b>Forma de pago:</b> ${esc(payNames[inv.payment_method] || inv.payment_method)}
    <br><b>Observaciones:</b> ${esc(inv.notes || '')}</div>
  <script>window.onload=function(){window.print()}<\/script></body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    errorMsg.value = 'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.'
    return
  }
  w.document.write(html)
  w.document.close()
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
  <div class="invoices-page" :class="{ 'form-open': isFormOpen }">
    <!-- Encabezado del Submódulo -->
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div class="d-flex align-items-center gap-3">
        <span class="p-3 bg-primary-subtle text-primary rounded-3 d-inline-flex">
          <iconify-icon :icon="currentSubModule.icon" class="fs-6"></iconify-icon>
        </span>
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
          <h3 class="fw-bold text-white mb-0">{{ currentSubModule.description }}</h3>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
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

    <!-- Si no es el submódulo de facturas, mostrar aviso normal -->
    <div v-if="!isInvoiceSubmodule" class="card rounded-4 border-0 shadow-sm p-4 bg-dark text-white mt-4">
      <p class="text-secondary mb-0">
        Vista operativa del submódulo <strong>{{ currentSubModule.description }}</strong> (<code class="text-info">{{ currentSubModule.url }}</code>).
      </p>
    </div>

    <!-- VISTA PRINCIPAL DE FACTURACIÓN ECUADOR -->
    <template v-else>
      <!-- Las alertas se muestran en un aviso flotante (ver AlertBox al final), visible incluso sobre los modales -->

      <!-- Barra de Filtros y Búsqueda -->
      <div class="card rounded-4 border-0 shadow-sm p-3 bg-dark text-white mt-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 400px;">
            <div class="input-group">
              <span class="input-group-text bg-dark-subtle border-secondary text-secondary">
                <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
              </span>
              <input
                v-model="searchInvoice"
                type="text"
                class="form-control bg-dark-subtle border-secondary text-white"
                placeholder="Buscar por # factura, cliente o RUC..."
              />
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <label class="text-secondary small fw-semibold">Sucursal:</label>
            <!-- El listado y la emisión quedan fijos a la empresa y sucursal seleccionadas al ingresar (se cambian con "Cambiar") -->
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2" title="Sucursal seleccionada">
              {{ branchFilter === 'TODAS' ? 'Todas las sucursales de la empresa' : branchName(Number(branchFilter)) }}
            </span>
            <label class="text-secondary small fw-semibold ms-2">Estado:</label>
            <select v-model="statusFilter" class="form-select bg-dark-subtle border-secondary text-white w-auto">
              <option value="TODOS">Todos</option>
              <option value="ISSUED">Emitidas</option>
              <option value="CANCELED">Anuladas</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla de Facturas Emitidas -->
      <div class="card rounded-4 overflow-hidden mt-3">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-primary text-uppercase fs-1">
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
                  <div class="d-inline-flex gap-1 align-items-center">
                    <button
                      v-if="inv.status === 'ISSUED' && inv.sign_status !== 'SIGNED'"
                      class="btn btn-sm btn-outline-warning rounded-pill px-2"
                      :disabled="signingInvoiceId === inv.id"
                      @click="onSignInvoice(inv)"
                      title="Firmar electrónicamente"
                    >
                      <span v-if="signingInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
                      <iconify-icon v-else icon="solar:pen-new-square-line-duotone"></iconify-icon>
                    </button>
                    <button
                      v-if="inv.sign_status === 'SIGNED'"
                      class="btn btn-sm btn-outline-success rounded-pill px-2"
                      :disabled="downloadingXmlId === inv.id"
                      @click="downloadXml(inv)"
                      title="Descargar XML firmado"
                    >
                      <span v-if="downloadingXmlId === inv.id" class="spinner-grow spinner-grow-sm text-success" role="status" aria-hidden="true"></span>
                      <iconify-icon v-else icon="solar:download-minimalistic-bold"></iconify-icon>
                    </button>
                    <button
                      v-if="inv.sign_status === 'SIGNED' && inv.status !== 'CANCELED' && (!inv.sri_status || inv.sri_status === 'NOT_SENT' || inv.sri_status === 'RETURNED' || inv.sri_status === 'NOT_AUTHORIZED')"
                      class="btn btn-sm btn-outline-primary rounded-pill px-2"
                      :disabled="sendingSriInvoiceId === inv.id || sendingSri"
                      @click="onSendToSri(inv)"
                      title="Enviar al SRI"
                    >
                      <span v-if="sendingSriInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-primary" role="status" aria-hidden="true"></span>
                      <iconify-icon v-else icon="solar:plain-2-bold-duotone"></iconify-icon>
                    </button>
                    <button
                      v-if="inv.sri_status === 'IN_PROCESS'"
                      class="btn btn-sm btn-outline-warning rounded-pill px-2"
                      :disabled="sendingSriInvoiceId === inv.id || sendingSri"
                      @click="onCheckSri(inv)"
                      title="Consultar autorización SRI"
                    >
                      <span v-if="sendingSriInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-warning" role="status" aria-hidden="true"></span>
                      <iconify-icon v-else icon="solar:refresh-circle-bold-duotone"></iconify-icon>
                    </button>
                    <button class="btn btn-sm btn-outline-info rounded-pill px-2" @click="openDetailModal(inv)" title="Ver Detalle y RIDE">
                      <iconify-icon icon="solar:eye-line-duotone"></iconify-icon>
                    </button>
                    <button
                      v-if="inv.sign_status === 'SIGNED' && inv.status !== 'CANCELED'"
                      class="btn btn-sm btn-outline-danger rounded-pill px-2 d-inline-flex align-items-center gap-1"
                      @click="goToCreditNote(inv)"
                      title="Emitir Nota de Crédito para esta Factura"
                    >
                      <iconify-icon icon="solar:bill-cross-line-duotone"></iconify-icon>
                      <span class="fs-1 d-none d-xxl-inline">Nota de Crédito</span>
                    </button>
                    <button
                      v-if="inv.status === 'ISSUED'"
                      class="btn btn-sm btn-outline-danger rounded-pill px-2"
                      :disabled="cancelingInvoiceId === inv.id"
                      @click="onCancelInvoice(inv)"
                      title="Anular Factura"
                    >
                      <span v-if="cancelingInvoiceId === inv.id" class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span>
                      <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone"></iconify-icon>
                    </button>
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
              <input v-model="form.issue_date" type="date" class="form-control bg-dark-subtle border-secondary text-white" required />
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
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-info small fw-bold text-uppercase">Datos del Cliente (Comprador)</span>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-xs btn-outline-info rounded-pill" @click="setFinalConsumer">
                  Consumidor Final
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
                <select v-model="form.customer_id_type" class="form-select form-select-sm bg-dark border-secondary text-white">
                  <option value="04">04 - RUC</option>
                  <option value="05">05 - Cédula</option>
                  <option value="06">06 - Pasaporte</option>
                  <option value="07">07 - Consumidor Final</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label text-secondary small">RUC / Cédula *</label>
                <input v-model="form.customer_id_number" type="text" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Ej: 1718293847" required />
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small">Razón Social / Nombre Completo *</label>
                <input v-model="form.customer_name" type="text" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Ej: Juan Pérez" required />
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
    <div v-if="showDetailModal && viewingInvoice" class="modal-backdrop-custom" @click.self="showDetailModal = false">
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
          <button class="btn btn-outline-info d-flex align-items-center gap-2" @click="printRide(viewingInvoice)">
            <iconify-icon icon="solar:printer-bold-duotone"></iconify-icon>
            <span>Imprimir / PDF (RIDE)</span>
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
  z-index: 1050;
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
  min-height: 450px;
  overflow-x: auto;
  position: relative;
  background-color: var(--bs-card-bg, #111c2d);
  border-color: var(--bs-border-color, rgba(189, 200, 240, 0.15)) !important;
  padding-bottom: 30px;
}

@media (min-width: 992px) {
  .invoice-details-table-wrapper {
    overflow: visible;
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
