<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  cancelPurchase,
  type PurchaseItem,
  type PurchaseDetailItem,
  type CreatePurchasePayload
} from '@/services/purchases.service'
import { getProviders, type ProviderItem } from '@/services/contacts.service'
import {
  getInventoryWarehouses,
  getInventoryItems,
  type InventoryWarehouse,
  type InventoryArticle
} from '@/services/inventory.service'
import { toast } from '@/utils/toastr'

const route = useRoute()
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
  return Number(authStore.accessInfo?.companyId || 1)
}

// Estados de carga
const loading = ref(false)
const saving = ref(false)
const cancelingId = ref<number | null>(null)

const showFeedback = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
  if (type === 'success') {
    toast.success(text, title || 'Compras')
  } else if (type === 'error') {
    toast.error(text, title || 'Error en Compra')
  } else if (type === 'warning') {
    toast.warning(text, title || 'Atención')
  } else {
    toast.info(text, title || 'Información')
  }
}

// Datos principales
const purchasesList = ref<PurchaseItem[]>([])
const providersList = ref<ProviderItem[]>([])
const warehousesList = ref<InventoryWarehouse[]>([])
const articlesList = ref<InventoryArticle[]>([])

const activeWarehouses = computed(() => warehousesList.value.filter((w) => w.status !== false))
const activeProviders = computed(() => providersList.value.filter((p) => p.estado === 'activo'))
const activeArticles = computed(() => articlesList.value.filter((a) => a.status !== false))

// Filtros
const searchTerm = ref('')
const filterWarehouseId = ref<number | null>(null)
const filterStatus = ref<string>('TODOS')

const filteredPurchases = computed(() => {
  let list = purchasesList.value
  if (filterWarehouseId.value) {
    list = list.filter((p) => p.warehouse_id === filterWarehouseId.value)
  }
  if (filterStatus.value !== 'TODOS') {
    list = list.filter((p) => p.status === filterStatus.value)
  }
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.trim().toLowerCase()
    list = list.filter(
      (p) =>
        p.invoice_number?.toLowerCase().includes(term) ||
        p.provider_name?.toLowerCase().includes(term) ||
        p.provider_id_number?.toLowerCase().includes(term)
    )
  }
  return list
})

// KPIs
const totalPurchasesCount = computed(() => purchasesList.value.length)
const totalPurchasesAmount = computed(() =>
  purchasesList.value
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.total || 0), 0)
)
const completedPurchasesCount = computed(() =>
  purchasesList.value.filter((p) => p.status === 'COMPLETED').length
)
const canceledPurchasesCount = computed(() =>
  purchasesList.value.filter((p) => p.status === 'CANCELED').length
)

// Modal de detalle
const showDetailModal = ref(false)
const viewingPurchase = ref<PurchaseItem | null>(null)

const openViewDetail = async (purchase: PurchaseItem) => {
  try {
    viewingPurchase.value = await getPurchaseById(purchase.id, getActiveCompanyId())
  } catch {
    viewingPurchase.value = purchase
  }
  showDetailModal.value = true
}

// ==========================================
// FORMULARIO DE REGISTRO DE COMPRA
// ==========================================
const isFormOpen = ref(false)

interface FormDetailRow {
  item_type: string
  item_id?: number
  code: string
  description: string
  unit: string
  quantity: number
  unit_cost: number
  tax_rate: number
}

const purchaseForm = ref({
  provider_id: null as number | null,
  provider_name: '',
  provider_id_type: '04',
  provider_id_number: '',
  provider_email: '',
  provider_phone: '',
  provider_address: '',
  establishment: '001',
  emission_point: '001',
  sequential: '',
  authorization_number: '',
  issue_date: new Date().toISOString().slice(0, 10),
  warehouse_id: null as number | null,
  payment_method: 'contado',
  notes: '',
  items: [] as FormDetailRow[]
})

// Formateo del número de factura visible
const previewInvoiceNumber = computed(() => {
  const est = (purchaseForm.value.establishment || '001').padStart(3, '0')
  const pto = (purchaseForm.value.emission_point || '001').padStart(3, '0')
  const seq = (purchaseForm.value.sequential || '1').replace(/\D/g, '').padStart(9, '0')
  return `${est}-${pto}-${seq}`
})

// Auto-completado al elegir proveedor existente
const isRegisteredProvider = computed(() => Boolean(purchaseForm.value.provider_id))

const onProviderSelect = () => {
  if (!purchaseForm.value.provider_id) return
  const prov = providersList.value.find((p) => p.id === purchaseForm.value.provider_id)
  if (prov) {
    purchaseForm.value.provider_name = prov.razon_social || prov.nombre_comercial || ''
    purchaseForm.value.provider_id_type = prov.tipo_documento || '04'
    purchaseForm.value.provider_id_number = prov.num_document || ''
    purchaseForm.value.provider_email = prov.email || ''
    purchaseForm.value.provider_phone = prov.telefono || ''
    purchaseForm.value.provider_address = prov.direccion || ''
    if (prov.forma_pago) {
      purchaseForm.value.payment_method = prov.forma_pago
    }
  }
}

// Opciones Select2 para Compras
const providerSelectOptions = computed(() => [
  { value: null, label: '-- Seleccionar de la agenda o ingresar abajo --' },
  ...activeProviders.value.map((prov) => ({
    value: prov.id,
    label: `${prov.razon_social || prov.nombre_comercial} (${prov.num_document})`,
    sublabel: prov.direccion || prov.email || '',
  })),
])

const warehouseSelectOptions = computed(() => [
  ...activeWarehouses.value.map((wh) => ({
    value: wh.id,
    label: `${wh.name}${wh.isDefault ? ' ★ (Predeterminada)' : ''}`,
    sublabel: wh.code ? `Código: ${wh.code}` : '',
  })),
])

const filterWarehouseOptions = computed(() => [
  { value: null, label: 'Todas las bodegas de destino' },
  ...activeWarehouses.value.map((wh) => ({
    value: wh.id,
    label: wh.name,
  })),
])

// Filas de detalle
const addItemRow = () => {
  purchaseForm.value.items.push({
    item_type: 'PRODUCT',
    item_id: undefined,
    code: '',
    description: '',
    unit: 'UND',
    quantity: 1,
    unit_cost: 0,
    tax_rate: 15
  })
}

const removeItemRow = (index: number) => {
  if (purchaseForm.value.items.length <= 1) {
    showFeedback('La compra debe contener al menos un producto', 'error')
    return
  }
  purchaseForm.value.items.splice(index, 1)
}

const onArticleSelect = (index: number) => {
  const row = purchaseForm.value.items[index]
  if (!row || !row.item_id) return
  const art = articlesList.value.find((a) => a.id === row.item_id)
  if (art) {
    row.code = art.code || ''
    row.description = art.name || ''
    row.unit = art.unit || 'UND'
    row.unit_cost = Number(art.costPrice || 0)
    row.tax_rate = Number(art.taxRate ?? 15)
  }
}

// Cálculos de totales
const calcRowSubtotal = (row: FormDetailRow) => {
  const qty = Number(row.quantity || 0)
  const cost = Number(row.unit_cost || 0)
  return Math.round(qty * cost * 100) / 100
}

const calcRowTax = (row: FormDetailRow) => {
  const sub = calcRowSubtotal(row)
  const rate = Number(row.tax_rate || 0)
  return Math.round((sub * (rate / 100)) * 100) / 100
}

const calcRowTotal = (row: FormDetailRow) => {
  return Math.round((calcRowSubtotal(row) + calcRowTax(row)) * 100) / 100
}

const formSubtotal15 = computed(() =>
  purchaseForm.value.items
    .filter((r) => Number(r.tax_rate) > 0)
    .reduce((sum, r) => sum + calcRowSubtotal(r), 0)
)

const formSubtotal0 = computed(() =>
  purchaseForm.value.items
    .filter((r) => Number(r.tax_rate) === 0)
    .reduce((sum, r) => sum + calcRowSubtotal(r), 0)
)

const formTaxTotal = computed(() =>
  purchaseForm.value.items.reduce((sum, r) => sum + calcRowTax(r), 0)
)

const formTotal = computed(() => formSubtotal15.value + formSubtotal0.value + formTaxTotal.value)

// Abrir formulario de compra
const openCreatePurchase = () => {
  const defWh = warehousesList.value.find((w) => w.isDefault && w.status) || activeWarehouses.value[0] || null
  purchaseForm.value = {
    provider_id: null,
    provider_name: '',
    provider_id_type: '04',
    provider_id_number: '',
    provider_email: '',
    provider_phone: '',
    provider_address: '',
    establishment: '001',
    emission_point: '001',
    sequential: '',
    authorization_number: '',
    issue_date: new Date().toISOString().slice(0, 10),
    warehouse_id: defWh ? defWh.id : null,
    payment_method: 'contado',
    notes: '',
    items: [
      {
        item_type: 'PRODUCT',
        item_id: undefined,
        code: '',
        description: '',
        unit: 'UND',
        quantity: 1,
        unit_cost: 0,
        tax_rate: 15
      }
    ]
  }
  isFormOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
}

watch(isFormOpen, async (open) => {
  if (open) {
    await nextTick()
    document.querySelector('.form-page')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
})

// Guardar compra
const savePurchase = async () => {
  if (!purchaseForm.value.provider_name.trim()) {
    showFeedback('Debe ingresar el nombre o razón social del proveedor', 'error')
    return
  }
  if (!purchaseForm.value.provider_id_number.trim()) {
    showFeedback('Debe ingresar el RUC o Cédula del proveedor', 'error')
    return
  }
  if (!purchaseForm.value.warehouse_id) {
    showFeedback('Debe seleccionar obligatoriamente la bodega de destino de la mercadería', 'error')
    return
  }
  if (!purchaseForm.value.sequential.trim()) {
    showFeedback('Debe ingresar el secuencial del comprobante del proveedor', 'error')
    return
  }
  if (purchaseForm.value.items.length === 0) {
    showFeedback('Debe agregar al menos un producto a la compra', 'error')
    return
  }
  for (let i = 0; i < purchaseForm.value.items.length; i++) {
    const item = purchaseForm.value.items[i]
    if (!item) continue
    if (!item.description.trim()) {
      showFeedback(`La fila #${i + 1} no tiene descripción de producto`, 'error')
      return
    }
    if (Number(item.quantity) <= 0) {
      showFeedback(`La fila #${i + 1} debe tener una cantidad mayor a 0`, 'error')
      return
    }
    if (Number(item.unit_cost) < 0) {
      showFeedback(`La fila #${i + 1} tiene un costo negativo`, 'error')
      return
    }
  }

  saving.value = true
  const companyId = getActiveCompanyId()

  try {
    const payload: any = {
      companyId,
      company_id: companyId,
      provider_id: purchaseForm.value.provider_id ? Number(purchaseForm.value.provider_id) : undefined,
      provider_name: purchaseForm.value.provider_name.trim(),
      provider_id_type: purchaseForm.value.provider_id_type,
      provider_id_number: purchaseForm.value.provider_id_number.trim(),
      provider_email: purchaseForm.value.provider_email.trim() || undefined,
      provider_phone: purchaseForm.value.provider_phone.trim() || undefined,
      provider_address: purchaseForm.value.provider_address.trim() || undefined,
      establishment: purchaseForm.value.establishment.trim(),
      emission_point: purchaseForm.value.emission_point.trim(),
      sequential: purchaseForm.value.sequential.trim(),
      authorization_number: purchaseForm.value.authorization_number.trim() || undefined,
      issue_date: purchaseForm.value.issue_date,
      warehouse_id: Number(purchaseForm.value.warehouse_id),
      payment_method: purchaseForm.value.payment_method,
      notes: purchaseForm.value.notes.trim() || undefined,
      items: purchaseForm.value.items.map((row) => ({
        item_type: row.item_type || 'PRODUCT',
        item_id: row.item_id ? Number(row.item_id) : undefined,
        code: row.code?.trim() || undefined,
        description: row.description.trim(),
        unit: row.unit?.trim() || 'UND',
        quantity: Number(row.quantity),
        unit_cost: Number(row.unit_cost),
        tax_rate: Number(row.tax_rate ?? 15)
      }))
    }

    await createPurchase(payload, companyId)
    showFeedback(`¡Compra e ingreso de inventario registrados con éxito en la bodega seleccionada!`)
    isFormOpen.value = false
    await loadPurchasesData()
  } catch (err: any) {
    const msg = Array.isArray(err?.response?.data?.message)
      ? err.response.data.message.join(', ')
      : err?.response?.data?.message || err?.message || 'Error al registrar la compra'
    showFeedback(msg, 'error')
  } finally {
    saving.value = false
  }
}

// Anular compra
const handleCancelPurchase = async (purchase: PurchaseItem) => {
  if (purchase.status === 'CANCELED') return
  const ok = window.confirm(
    `¿Está seguro de anular la compra "${purchase.invoice_number}" de ${purchase.provider_name}?\n\nEsta acción revertirá automáticamente las existencias ingresadas en la bodega "${purchase.warehouse_name}".`
  )
  if (!ok) return

  cancelingId.value = purchase.id
  try {
    await cancelPurchase(purchase.id, getActiveCompanyId())
    showFeedback(`Compra "${purchase.invoice_number}" anulada y existencias revertidas en inventario.`)
    await loadPurchasesData()
  } catch (err: any) {
    const msg = Array.isArray(err?.response?.data?.message)
      ? err.response.data.message.join(', ')
      : err?.response?.data?.message || 'Error al anular la compra'
    showFeedback(msg, 'error')
  } finally {
    cancelingId.value = null
  }
}

// Carga inicial
const loadPurchasesData = async () => {
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const [purchases, providers, warehouses, articles] = await Promise.all([
      getPurchases(companyId),
      getProviders(companyId).catch(() => []),
      getInventoryWarehouses(companyId).catch(() => []),
      getInventoryItems(companyId).catch(() => [])
    ])
    purchasesList.value = purchases || []
    providersList.value = providers || []
    warehousesList.value = warehouses || []
    articlesList.value = articles || []
  } catch (err: any) {
    showFeedback('Error al cargar la información del módulo de compras', 'error')
  } finally {
    loading.value = false
  }
}

const formatNumber = (val: number | string | undefined | null) => {
  const num = Number(val || 0)
  return num.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => {
  loadPurchasesData()
})
</script>

<template>
  <div class="purchases-page" :class="{ 'form-open': isFormOpen }">
    <!-- Top Header -->
    <div class="page-header">
      <div>
        <div class="header-badge-row">
          <span class="mod-code-badge pur">MOD-002</span>
          <span class="mod-sub-badge">COMPRAS & INGRESOS</span>
        </div>
        <h2 class="page-title">Módulo de Compras y Recepción de Inventario</h2>
        <p class="page-subtitle">
          Registro de facturas de proveedores, ingreso físico a bodegas y actualización automática del costo promedio ponderado
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="loadPurchasesData" :disabled="loading">
          <iconify-icon icon="solar:refresh-line-duotone" width="18" :class="{ 'spin-anim': loading }"></iconify-icon>
          <span>Actualizar</span>
        </button>
        <button class="btn-primary" @click="openCreatePurchase">
          <iconify-icon icon="solar:add-circle-line-duotone" width="18"></iconify-icon>
          <span>Nueva Compra</span>
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <iconify-icon icon="solar:cart-large-minimalistic-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Total Compras Registradas</span>
          <h4 class="kpi-val">{{ totalPurchasesCount }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <iconify-icon icon="solar:dollar-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Total Comprado (Efectivo / Recibido)</span>
          <h4 class="kpi-val">${{ formatNumber(totalPurchasesAmount) }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple">
          <iconify-icon icon="solar:box-minimalistic-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Ingresos Confirmados a Bodega</span>
          <h4 class="kpi-val">{{ completedPurchasesCount }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber">
          <iconify-icon icon="solar:danger-circle-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Compras Anuladas</span>
          <h4 class="kpi-val">{{ canceledPurchasesCount }}</h4>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <iconify-icon icon="solar:magnifer-line-duotone" class="search-ic"></iconify-icon>
        <input v-model="searchTerm" type="text" placeholder="Buscar por factura, proveedor o RUC..." />
      </div>

      <div style="min-width: 260px;">
        <AppSelect2
          v-model="filterWarehouseId"
          :options="filterWarehouseOptions"
          placeholder="Todas las bodegas de destino"
          search-placeholder="Buscar bodega..."
        />
      </div>

      <select v-model="filterStatus" class="filter-select">
        <option value="TODOS">Todos los estados</option>
        <option value="COMPLETED">Completadas (Ingresadas)</option>
        <option value="CANCELED">Anuladas (Revertidas)</option>
      </select>
    </div>

    <!-- Purchases Table Card -->
    <div class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th>No. Factura Proveedor</th>
              <th>Proveedor</th>
              <th>Fecha Emisión</th>
              <th>Bodega de Destino</th>
              <th>Forma Pago</th>
              <th class="text-right">Subtotal</th>
              <th class="text-right">IVA</th>
              <th class="text-right">Total ($)</th>
              <th class="text-center">Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando compras registradas...</span>
              </td>
            </tr>
            <tr v-else-if="filteredPurchases.length === 0">
              <td colspan="10" class="empty-cell">
                No se encontraron compras registradas. Haga clic en <strong>+ Nueva Compra</strong> para ingresar inventario.
              </td>
            </tr>
            <tr v-for="pur in filteredPurchases" :key="pur.id">
              <td>
                <span class="code-chip">{{ pur.invoice_number }}</span>
              </td>
              <td>
                <div class="item-main">
                  <span class="item-title">{{ pur.provider_name }}</span>
                  <span class="item-desc font-mono">RUC/CI: {{ pur.provider_id_number }}</span>
                </div>
              </td>
              <td>{{ pur.issue_date }}</td>
              <td>
                <span class="wh-badge">
                  <iconify-icon icon="solar:home-smile-line-duotone" width="14"></iconify-icon>
                  <span>{{ pur.warehouse_name }}</span>
                </span>
              </td>
              <td class="text-capitalize">{{ pur.payment_method?.replace('_', ' ') }}</td>
              <td class="text-right font-mono">${{ formatNumber(Number(pur.subtotal_zero_tax || 0) + Number(pur.subtotal_taxed || 0)) }}</td>
              <td class="text-right font-mono">${{ formatNumber(pur.tax_value) }}</td>
              <td class="text-right font-mono price-highlight">${{ formatNumber(pur.total) }}</td>
              <td class="text-center">
                <span class="status-badge" :class="pur.status === 'COMPLETED' ? 'completed' : 'canceled'">
                  {{ pur.status === 'COMPLETED' ? 'Ingresada' : 'Anulada' }}
                </span>
              </td>
              <td class="text-right">
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
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" @click="openViewDetail(pur)">
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Detalle de Compra</span>
                      </a>
                    </li>
                    <li v-if="pur.status === 'COMPLETED'">
                      <hr class="dropdown-divider">
                      <a
                        class="dropdown-item py-2 text-danger"
                        href="javascript:void(0)"
                        :class="{ disabled: cancelingId === pur.id }"
                        @click="handleCancelPurchase(pur)"
                      >
                        <span v-if="cancelingId === pur.id" class="spinner-grow spinner-grow-sm text-danger" role="status"></span>
                        <iconify-icon v-else icon="solar:close-circle-line-duotone" class="fs-5 text-danger"></iconify-icon>
                        <span>Anular Compra</span>
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

    <!-- ========================================================== -->
    <!-- FORMULARIO DE REGISTRO DE COMPRA (COMO PÁGINA COMPLETA)    -->
    <!-- ========================================================== -->
    <div v-if="isFormOpen" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge pur">REGISTRO DE COMPRAS & ENTRADA DE INVENTARIO</span>
            <h3>Nueva Factura de Proveedor</h3>
          </div>
          <button type="button" class="btn-secondary" @click="closeForm">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="savePurchase">
          <!-- Banner Informativo -->
          <div class="info-alert-box mb-4">
            <iconify-icon icon="solar:shield-check-bold-duotone" width="24" class="text-info"></iconify-icon>
            <div>
              <strong>Afectación Automática de Inventario:</strong> Al confirmar la compra, las cantidades ingresarán de inmediato a la bodega seleccionada y el <strong>costo promedio ponderado</strong> de cada producto se recalculará según la fórmula contable oficial.
            </div>
          </div>

          <!-- SECCIÓN 1: DATOS DEL PROVEEDOR Y FACTURA -->
          <div class="section-divider">
            <iconify-icon icon="solar:user-id-line-duotone" width="18"></iconify-icon>
            <span>1. Datos del Proveedor y Comprobante</span>
          </div>

          <div class="form-grid mb-4">
            <div class="form-group span-2">
              <label>Seleccionar Proveedor Registrado (Opcional si es nuevo)</label>
              <AppSelect2
                v-model="purchaseForm.provider_id"
                :options="providerSelectOptions"
                placeholder="-- Seleccionar de la agenda de proveedores --"
                search-placeholder="Buscar proveedor por razón social o RUC..."
                @change="onProviderSelect"
                allow-clear
              />
            </div>

            <div class="form-group span-2">
              <label>Nombre / Razón Social del Proveedor *</label>
              <input
                v-model="purchaseForm.provider_name"
                type="text"
                required
                :readonly="isRegisteredProvider"
                :class="{ 'bg-dark-subtle text-secondary': isRegisteredProvider }"
                placeholder="Ej: IMPORTADORA TECNOLOGICA S.A."
              />
              <small v-if="isRegisteredProvider" class="text-info d-block fs-1 mt-1">Dato protegido cargado del proveedor seleccionado</small>
            </div>

            <div class="form-group">
              <label>Tipo Documento *</label>
              <select
                v-model="purchaseForm.provider_id_type"
                :disabled="isRegisteredProvider"
                :class="{ 'bg-dark-subtle text-secondary': isRegisteredProvider }"
              >
                <option value="04">RUC (04)</option>
                <option value="05">Cédula (05)</option>
                <option value="06">Pasaporte (06)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Número de Identificación (RUC / CI) *</label>
              <input
                v-model="purchaseForm.provider_id_number"
                type="text"
                required
                :readonly="isRegisteredProvider"
                :class="{ 'bg-dark-subtle text-secondary': isRegisteredProvider }"
                placeholder="Ej: 1792003456001"
                class="font-mono"
              />
            </div>

            <div class="form-group">
              <label>Teléfono de Contacto</label>
              <input
                v-model="purchaseForm.provider_phone"
                type="text"
                :readonly="isRegisteredProvider"
                :class="{ 'bg-dark-subtle text-secondary': isRegisteredProvider }"
                placeholder="Ej: 0991234567"
              />
            </div>

            <div class="form-group">
              <label>Correo Electrónico</label>
              <input
                v-model="purchaseForm.provider_email"
                type="email"
                :readonly="isRegisteredProvider"
                :class="{ 'bg-dark-subtle text-secondary': isRegisteredProvider }"
                placeholder="proveedor@empresa.com"
              />
            </div>

            <div class="form-group span-2">
              <label>Dirección del Proveedor</label>
              <input
                v-model="purchaseForm.provider_address"
                type="text"
                :readonly="isRegisteredProvider"
                :class="{ 'bg-dark-subtle text-secondary': isRegisteredProvider }"
                placeholder="Ej: Av. Amazonas y República, Edificio Torre Azul"
              />
            </div>

            <!-- Datos Comprobante Proveedor -->
            <div class="form-group">
              <label>Establecimiento *</label>
              <input v-model="purchaseForm.establishment" type="text" maxlength="3" required placeholder="001" class="font-mono text-center" />
            </div>

            <div class="form-group">
              <label>Punto de Emisión *</label>
              <input v-model="purchaseForm.emission_point" type="text" maxlength="3" required placeholder="001" class="font-mono text-center" />
            </div>

            <div class="form-group">
              <label>Secuencial de la Factura *</label>
              <input v-model="purchaseForm.sequential" type="text" maxlength="9" required placeholder="Ej: 12450" class="font-mono text-center" />
            </div>

            <div class="form-group">
              <label>Vista previa comprobante</label>
              <div class="preview-badge font-mono">{{ previewInvoiceNumber }}</div>
            </div>

            <div class="form-group">
              <label>Fecha de Emisión de la Factura *</label>
              <input v-model="purchaseForm.issue_date" type="date" required />
            </div>

            <div class="form-group">
              <label>Forma de Pago</label>
              <select v-model="purchaseForm.payment_method">
                <option value="contado">Contado / Efectivo</option>
                <option value="credito_15">Crédito 15 días</option>
                <option value="credito_30">Crédito 30 días</option>
                <option value="credito_60">Crédito 60 días</option>
                <option value="transferencia">Transferencia Bancaria</option>
              </select>
            </div>

            <div class="form-group span-2">
              <label>Autorización / Clave de Acceso SRI del Proveedor (Opcional)</label>
              <input
                v-model="purchaseForm.authorization_number"
                @input="purchaseForm.authorization_number = (purchaseForm.authorization_number || '').replace(/\D/g, '').slice(0, 49)"
                type="text"
                maxlength="49"
                inputmode="numeric"
                pattern="[0-9]*"
                placeholder="Solo números (49 dígitos para electrónico o 10 para físico)"
                class="font-mono"
              />
              <small class="text-muted fs-1 mt-1 d-block">Solo números permitidos (hasta 49 dígitos para comprobante electrónico o 10 para físico)</small>
            </div>

            <!-- Bodega Destino Obligatoria -->
            <div class="form-group span-2 highlight-group">
              <label class="fw-bold text-primary">Bodega de Destino para Ingreso de Mercadería *</label>
              <AppSelect2
                v-model="purchaseForm.warehouse_id"
                :options="warehouseSelectOptions"
                placeholder="-- Seleccione la bodega que recibe los productos --"
                search-placeholder="Buscar bodega..."
                required
              />
              <small class="text-muted">Todos los productos físicos ingresarán directamente al saldo de esta bodega.</small>
            </div>
          </div>

          <!-- SECCIÓN 2: PRODUCTOS Y ARTÍCULOS A INGRESAR -->
          <div class="section-divider">
            <iconify-icon icon="solar:box-minimalistic-line-duotone" width="18"></iconify-icon>
            <span>2. Detalle de Artículos y Costos de Compra</span>
          </div>

          <div class="table-card mb-4">
            <div class="table-scroll">
              <table class="erp-table items-table">
                <thead>
                  <tr>
                    <th style="width: 32%;">Producto / Catálogo</th>
                    <th style="width: 14%;">Código</th>
                    <th style="width: 10%;">Unidad</th>
                    <th style="width: 12%;" class="text-right">Cantidad</th>
                    <th style="width: 12%;" class="text-right">Costo Unit. ($)</th>
                    <th style="width: 10%;" class="text-center">IVA</th>
                    <th style="width: 14%;" class="text-right">Total ($)</th>
                    <th style="width: 6%;" class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in purchaseForm.items" :key="idx">
                    <td>
                      <select v-model="row.item_id" @change="onArticleSelect(idx)" class="table-input" required>
                        <option :value="undefined" disabled>-- Seleccionar del catálogo --</option>
                        <option v-for="art in activeArticles" :key="art.id" :value="art.id">
                          {{ art.code ? `[${art.code}] ` : '' }}{{ art.name }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input v-model="row.code" type="text" placeholder="Código" class="table-input font-mono" />
                    </td>
                    <td>
                      <input v-model="row.unit" type="text" placeholder="UND" class="table-input text-center" />
                    </td>
                    <td>
                      <input v-model.number="row.quantity" type="number" step="0.01" min="0.01" required class="table-input text-right font-mono" />
                    </td>
                    <td>
                      <input v-model.number="row.unit_cost" type="number" step="0.0001" min="0" required class="table-input text-right font-mono" />
                    </td>
                    <td>
                      <select v-model.number="row.tax_rate" class="table-input text-center">
                        <option :value="15">15%</option>
                        <option :value="0">0%</option>
                        <option :value="5">5%</option>
                      </select>
                    </td>
                    <td class="text-right font-mono fw-bold">
                      ${{ formatNumber(calcRowTotal(row)) }}
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn-icon-del" @click="removeItemRow(idx)" title="Eliminar fila">
                        <iconify-icon icon="solar:trash-bin-minimalistic-line-duotone" width="18"></iconify-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="table-actions-bar p-3 border-top border-dark-subtle">
              <button type="button" class="btn-secondary" @click="addItemRow">
                <iconify-icon icon="solar:add-circle-bold-duotone" width="18"></iconify-icon>
                <span>Agregar Producto</span>
              </button>
            </div>
          </div>

          <!-- SECCIÓN 3: TOTALES Y NOTAS -->
          <div class="row g-4 mb-4">
            <div class="col-md-7">
              <div class="form-group">
                <label>Notas / Observaciones de la Compra</label>
                <textarea v-model="purchaseForm.notes" rows="4" placeholder="Ej: Compra de lote según orden de compra #OC-1024 con descuento comercial..."></textarea>
              </div>
            </div>
            <div class="col-md-5">
              <div class="totals-card">
                <div class="tot-row">
                  <span>Subtotal 15% (Gravado):</span>
                  <span class="font-mono">${{ formatNumber(formSubtotal15) }}</span>
                </div>
                <div class="tot-row">
                  <span>Subtotal 0% (Tarifa cero):</span>
                  <span class="font-mono">${{ formatNumber(formSubtotal0) }}</span>
                </div>
                <div class="tot-row">
                  <span>IVA 15%:</span>
                  <span class="font-mono">${{ formatNumber(formTaxTotal) }}</span>
                </div>
                <div class="tot-divider"></div>
                <div class="tot-row grand-total">
                  <span>TOTAL COMPRA:</span>
                  <span class="font-mono">${{ formatNumber(formTotal) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:box-minimalistic-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Registrando e Ingresando...' : 'Confirmar e Ingresar a Inventario' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL DE DETALLE DE COMPRA                                 -->
    <!-- ========================================================== -->
    <div v-if="showDetailModal && viewingPurchase" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge pur">DETALLE DE COMPRA #{{ viewingPurchase.id }}</span>
            <h3>Factura {{ viewingPurchase.invoice_number }}</h3>
          </div>
          <button type="button" class="close-btn" @click="showDetailModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" width="22"></iconify-icon>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-summary-grid mb-3">
            <div>
              <span class="text-muted small d-block">Proveedor</span>
              <strong>{{ viewingPurchase.provider_name }}</strong>
              <div class="font-mono small text-secondary">RUC/CI: {{ viewingPurchase.provider_id_number }}</div>
            </div>
            <div>
              <span class="text-muted small d-block">Bodega Receptora</span>
              <strong class="text-info">{{ viewingPurchase.warehouse_name }}</strong>
            </div>
            <div>
              <span class="text-muted small d-block">Fecha de Emisión</span>
              <div>{{ viewingPurchase.issue_date }}</div>
            </div>
            <div>
              <span class="text-muted small d-block">Estado</span>
              <span class="status-badge" :class="viewingPurchase.status === 'COMPLETED' ? 'completed' : 'canceled'">
                {{ viewingPurchase.status === 'COMPLETED' ? 'Completada / Ingresada' : 'Anulada' }}
              </span>
            </div>
          </div>

          <div class="table-card mb-3">
            <div class="table-scroll">
              <table class="erp-table">
                <thead>
                  <tr>
                    <th>Ítem</th>
                    <th>Unidad</th>
                    <th class="text-right">Cantidad</th>
                    <th class="text-right">Costo Unit.</th>
                    <th class="text-center">IVA</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in viewingPurchase.details" :key="d.id">
                    <td>
                      <div class="fw-semibold">{{ d.description }}</div>
                      <small class="font-mono text-muted" v-if="d.code">Código: {{ d.code }}</small>
                    </td>
                    <td>{{ d.unit }}</td>
                    <td class="text-right font-mono">{{ formatNumber(d.quantity) }}</td>
                    <td class="text-right font-mono">${{ formatNumber(d.unit_cost) }}</td>
                    <td class="text-center">{{ d.tax_rate }}%</td>
                    <td class="text-right font-mono">${{ formatNumber(d.total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="totals-card">
            <div class="tot-row">
              <span>Subtotal:</span>
              <span class="font-mono">${{ formatNumber(Number(viewingPurchase.subtotal_zero_tax || 0) + Number(viewingPurchase.subtotal_taxed || 0)) }}</span>
            </div>
            <div class="tot-row">
              <span>IVA:</span>
              <span class="font-mono">${{ formatNumber(viewingPurchase.tax_value) }}</span>
            </div>
            <div class="tot-divider"></div>
            <div class="tot-row grand-total">
              <span>TOTAL COMPRA:</span>
              <span class="font-mono">${{ formatNumber(viewingPurchase.total) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showDetailModal = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.purchases-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #f1f5f9;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.mod-code-badge {
  background: rgba(0, 133, 219, 0.18);
  color: #38bdf8;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.mod-code-badge.pur {
  background: rgba(139, 92, 246, 0.18);
  color: #c4b5fd;
}

.mod-sub-badge {
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #0085db, #006bb3);
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 133, 219, 0.28);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 133, 219, 0.38);
}

.btn-secondary {
  background: #17233b;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover:not(:disabled) {
  background: #1e2d4a;
  color: #fff;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 18px;
}

.kpi-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon.blue {
  background: rgba(0, 133, 219, 0.16);
  color: #38bdf8;
}
.kpi-icon.green {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}
.kpi-icon.purple {
  background: rgba(139, 92, 246, 0.16);
  color: #a78bfa;
}
.kpi-icon.amber {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.kpi-label {
  font-size: 12px;
  color: #94a3b8;
}

.kpi-val {
  margin: 3px 0 0;
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
}

.feedback-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
}

.feedback-banner.success {
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feedback-banner.error {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 280px;
  flex: 1;
}

.search-ic {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-box input {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b1426;
  color: #f1f5f9;
  font-size: 13px;
}

.filter-select {
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b1426;
  color: #f1f5f9;
  font-size: 13px;
}

.table-card {
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  position: relative;
  overflow: visible;
}

.table-scroll {
  min-height: 400px;
  max-height: calc(100vh - 290px);
  overflow-y: auto !important;
  overflow-x: auto !important;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: rgba(189, 200, 240, 0.25) transparent;
  padding-bottom: 6rem;
}

.erp-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13.5px;
}

.erp-table thead {
  position: sticky;
  top: 0;
  z-index: 15;
}

.erp-table th {
  position: sticky;
  top: 0;
  z-index: 15;
  text-align: left;
  padding: 13px 16px;
  background: #111c2d !important;
  color: #94a3b8;
  font-weight: 600;
  font-size: 12.5px;
  letter-spacing: 0.3px;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.erp-table td {
  padding: 13px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.code-chip {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
}

.wh-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0, 133, 219, 0.12);
  color: #38bdf8;
  font-size: 12px;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.canceled {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.act-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.act-btn:hover {
  background: rgba(0, 133, 219, 0.2);
  color: #38bdf8;
}

.act-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.price-highlight {
  font-weight: 700;
  color: #34d399;
}

.empty-cell {
  text-align: center;
  padding: 45px 16px;
  color: #64748b;
  font-size: 14px;
}

/* Modales y Formularios */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 760px;
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.form-open > :not(.form-page) {
  display: none !important;
}

.form-page {
  width: 100%;
  animation: fadeIn 0.2s ease-in-out;
}

.form-page-card {
  width: 100%;
  max-width: none;
  margin: 0 auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.modal-header h3 {
  margin: 6px 0 0;
  font-size: 19px;
  color: #f8fafc;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 22px 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.span-2 {
  grid-column: span 2;
}

.form-group label {
  font-size: 12.5px;
  font-weight: 600;
  color: #cbd5e1;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0b1426;
  color: #f8fafc;
  font-size: 13.5px;
}

.highlight-group {
  background: rgba(0, 133, 219, 0.08);
  border: 1px solid rgba(0, 133, 219, 0.3);
  padding: 14px 16px;
  border-radius: 12px;
}

.preview-badge {
  padding: 9px 12px;
  border-radius: 9px;
  background: rgba(0, 133, 219, 0.14);
  color: #38bdf8;
  font-weight: 700;
  text-align: center;
  border: 1px dashed rgba(56, 189, 248, 0.4);
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #38bdf8;
  font-weight: 700;
  font-size: 14px;
}

.items-table th,
.items-table td {
  padding: 8px 10px;
}

.table-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0b1426;
  color: #f8fafc;
  font-size: 13px;
}

.btn-icon-del {
  background: transparent;
  border: none;
  color: #f87171;
  cursor: pointer;
  padding: 4px;
}

.btn-icon-del:hover {
  color: #ef4444;
}

.totals-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
}

.tot-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 13.5px;
  color: #94a3b8;
}

.tot-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
}

.grand-total {
  font-size: 17px;
  font-weight: 800;
  color: #34d399;
}

.info-alert-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(0, 133, 219, 0.1);
  border: 1px solid rgba(0, 133, 219, 0.25);
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.5;
}

.info-alert-box strong {
  color: #38bdf8;
}

.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  background: rgba(255, 255, 255, 0.03);
  padding: 14px 16px;
  border-radius: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.text-right {
  text-align: right !important;
}
.text-center {
  text-align: center !important;
}
.font-mono {
  font-family: monospace;
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

/* ==========================================================================
   ESTILOS ADAPTATIVOS PARA MODO CLARO (Spike Light Theme)
   ========================================================================== */
[data-bs-theme='light'] .purchases-page {
  color: #2a3547;
}

[data-bs-theme='light'] .page-title {
  color: #111c2d;
}

[data-bs-theme='light'] .page-subtitle {
  color: #5a6a85;
}

[data-bs-theme='light'] .kpi-card {
  background: #ffffff;
  border-color: #ebf1f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

[data-bs-theme='light'] .kpi-label {
  color: #5a6a85;
}

[data-bs-theme='light'] .kpi-val {
  color: #111c2d;
}

[data-bs-theme='light'] .search-box input,
[data-bs-theme='light'] .filter-select {
  background: #ffffff;
  border-color: #dfe5ef;
  color: #111c2d;
}

[data-bs-theme='light'] .table-card {
  background: #ffffff;
  border-color: #ebf1f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

[data-bs-theme='light'] .erp-table th {
  background: #e8f2fc !important;
  color: #0b4e8c !important;
  border-color: #bcd7ef !important;
  box-shadow: inset 0 -1px 0 #bcd7ef !important;
}

[data-bs-theme='light'] .erp-table td {
  border-color: #ebf1f6;
  color: #2a3547;
}

[data-bs-theme='light'] .code-chip {
  background: #ebf1f6;
  color: #0085db;
}

[data-bs-theme='light'] .btn-secondary {
  background: #f6f9fc;
  border-color: #dfe5ef;
  color: #5a6a85;
}

[data-bs-theme='light'] .btn-secondary:hover:not(:disabled) {
  background: #ebf1f6;
  color: #111c2d;
}

[data-bs-theme='light'] .act-btn {
  background: #f6f9fc;
  border-color: #dfe5ef;
  color: #5a6a85;
}

[data-bs-theme='light'] .act-btn:hover {
  background: #ebf1f6;
  color: #111c2d;
}

[data-bs-theme='light'] .modal-card {
  background: #ffffff;
  border-color: #ebf1f6;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

[data-bs-theme='light'] .modal-header {
  border-color: #ebf1f6;
}

[data-bs-theme='light'] .modal-header h3 {
  color: #111c2d;
}

[data-bs-theme='light'] .form-group label {
  color: #2a3547;
}

[data-bs-theme='light'] .form-group input,
[data-bs-theme='light'] .form-group select,
[data-bs-theme='light'] .form-group textarea,
[data-bs-theme='light'] .table-input {
  background: #ffffff;
  border-color: #dfe5ef;
  color: #111c2d;
}

[data-bs-theme='light'] .highlight-group {
  background: rgba(0, 133, 219, 0.05);
  border-color: rgba(0, 133, 219, 0.2);
}

[data-bs-theme='light'] .totals-card {
  background: #f6f9fc;
  border-color: #ebf1f6;
}

[data-bs-theme='light'] .tot-row {
  color: #5a6a85;
}

[data-bs-theme='light'] .tot-divider {
  background: #ebf1f6;
}

[data-bs-theme='light'] .grand-total {
  color: #10b981;
}

[data-bs-theme='light'] .info-alert-box {
  background: rgba(0, 133, 219, 0.07);
  border-color: rgba(0, 133, 219, 0.22);
  color: #5a6a85;
}

[data-bs-theme='light'] .info-alert-box strong {
  color: #0085db;
}

[data-bs-theme='light'] .detail-summary-grid {
  background: #f6f9fc;
  border: 1px solid #ebf1f6;
}

[data-bs-theme='light'] .modal-footer {
  border-color: #ebf1f6;
}

[data-bs-theme='light'] .close-btn {
  color: #7c8fac;
}
</style>
