<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import {
  getInvoices,
  createInvoice,
  cancelInvoice,
  signInvoice,
  getInvoiceXml,
  type InvoiceItem,
  type CreateInvoicePayload,
} from '@/services/invoices.service'
import {
  getInventoryItems,
  getInventoryServices,
  getInventorySubcontracts,
  type InventoryArticle,
  type InventoryServiceItem,
  type InventorySubcontractItem,
} from '@/services/inventory.service'
import { getCustomers, type CustomerItem } from '@/services/contacts.service'

const route = useRoute()
const authStore = useAuthStore()

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

const invoices = ref<InvoiceItem[]>([])
const searchInvoice = ref('')
const statusFilter = ref<'TODOS' | 'ISSUED' | 'CANCELED'>('TODOS')

// Modales
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const viewingInvoice = ref<InvoiceItem | null>(null)

// Catálogos auxiliares para la emisión
const customersList = ref<CustomerItem[]>([])
const articlesList = ref<InventoryArticle[]>([])
const servicesList = ref<InventoryServiceItem[]>([])
const subcontractsList = ref<InventorySubcontractItem[]>([])

// Formulario de emisión de factura
const initialInvoiceForm = () => ({
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
      item_type: 'ITEM',
      item_id: undefined as number | undefined,
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

// Cargar facturas y catálogos
const loadData = async () => {
  loading.value = true
  errorMsg.value = ''
  const companyId = getActiveCompanyId()

  try {
    const [invs, custs, arts, srvs, subs] = await Promise.all([
      getInvoices(companyId).catch(() => []),
      getCustomers(companyId).catch(() => []),
      getInventoryItems(companyId).catch(() => []),
      getInventoryServices(companyId).catch(() => []),
      getInventorySubcontracts(companyId).catch(() => []),
    ])

    invoices.value = invs
    customersList.value = custs
    articlesList.value = arts
    servicesList.value = srvs
    subcontractsList.value = subs
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

// Acciones sobre los ítems del detalle
const addDetailRow = () => {
  form.value.details.push({
    item_type: 'ITEM',
    item_id: undefined,
    code: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 15,
  })
}

const removeDetailRow = (index: number) => {
  if (form.value.details.length === 1) return
  form.value.details.splice(index, 1)
}

// Al seleccionar un ítem del catálogo pre-llenar precio, código y tarifa IVA
const onSelectItem = (index: number, e: Event) => {
  const target = e.target as HTMLSelectElement
  const val = target.value
  if (!val) return

  const [type, idStr] = val.split(':')
  const id = Number(idStr)
  const row = form.value.details[index]
  if (!row) return

  if (type === 'ITEM') {
    const item = articlesList.value.find((a) => a.id === id)
    if (item) {
      row.item_type = 'ITEM'
      row.item_id = item.id
      row.code = item.code
      row.description = item.name
      row.unit_price = Number(item.salePrice || 0)
      row.tax_rate = Number(item.taxRate ?? 15)
    }
  } else if (type === 'SERVICE') {
    const srv = servicesList.value.find((s) => s.id === id)
    if (srv) {
      row.item_type = 'SERVICE'
      row.item_id = srv.id
      row.code = srv.code
      row.description = srv.name
      row.unit_price = Number(srv.salePrice || 0)
      row.tax_rate = Number(srv.taxRate ?? 15)
    }
  } else if (type === 'SUBCONTRACT') {
    const sub = subcontractsList.value.find((m) => m.id === id)
    if (sub) {
      row.item_type = 'SUBCONTRACT'
      row.item_id = sub.id
      row.code = sub.code
      row.description = sub.name
      row.unit_price = Number(sub.suggestedPrice || 0)
      row.tax_rate = Number(sub.taxRate ?? 15)
    }
  }
}

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

const openCreateModal = () => {
  form.value = initialInvoiceForm()
  successMsg.value = ''
  errorMsg.value = ''
  showCreateModal.value = true
}

const openDetailModal = (inv: InvoiceItem) => {
  viewingInvoice.value = inv
  showDetailModal.value = true
}

// Guardar / Emitir Factura
const submitInvoice = async () => {
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
      establishment: form.value.establishment,
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
        code: d.code,
        description: d.description,
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
        discount: Number(d.discount || 0),
        tax_rate: Number(d.tax_rate ?? 15),
      })),
    }

    const created = await createInvoice(payload)
    successMsg.value = `Factura ${created.invoice_number} emitida exitosamente con clave SRI.`
    showCreateModal.value = false
    await loadData()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error al emitir la factura'
  } finally {
    saving.value = false
  }
}

// Firmar con el .p12 de la empresa y descargar el XML firmado
const onSignInvoice = async (inv: InvoiceItem) => {
  errorMsg.value = ''
  try {
    await signInvoice(inv.id, getActiveCompanyId())
    successMsg.value = `Factura ${inv.invoice_number} firmada electrónicamente.`
    await loadData()
    if (viewingInvoice.value?.id === inv.id) {
      viewingInvoice.value = invoices.value.find((i) => i.id === inv.id) || viewingInvoice.value
    }
  } catch (err: any) {
    const m = err?.response?.data?.message
    errorMsg.value = (Array.isArray(m) ? m.join(', ') : m) || 'No se pudo firmar la factura'
  }
}

const downloadXml = async (inv: InvoiceItem) => {
  errorMsg.value = ''
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
  }
}

// Anular factura
const onCancelInvoice = async (inv: InvoiceItem) => {
  if (!confirm(`¿Estás seguro de anular la factura ${inv.invoice_number}?`)) return
  try {
    await cancelInvoice(inv.id, getActiveCompanyId())
    successMsg.value = `Factura ${inv.invoice_number} anulada correctamente.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error al anular la factura'
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
  <div class="invoices-page">
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

    <!-- Si no es el submódulo de facturas, mostrar aviso normal -->
    <div v-if="!isInvoiceSubmodule" class="card rounded-4 border-0 shadow-sm p-4 bg-dark text-white mt-4">
      <p class="text-secondary mb-0">
        Vista operativa del submódulo <strong>{{ currentSubModule.description }}</strong> (<code class="text-info">{{ currentSubModule.url }}</code>).
      </p>
    </div>

    <!-- VISTA PRINCIPAL DE FACTURACIÓN ECUADOR -->
    <template v-else>
      <!-- Alertas -->
      <div v-if="successMsg" class="alert alert-success d-flex align-items-center gap-2 mt-3 mb-0 py-2">
        <iconify-icon icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
        <span>{{ successMsg }}</span>
      </div>
      <div v-if="errorMsg" class="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0 py-2">
        <iconify-icon icon="solar:danger-triangle-bold" class="fs-5"></iconify-icon>
        <span>{{ errorMsg }}</span>
      </div>

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
            <label class="text-secondary small fw-semibold">Estado:</label>
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
                <td colspan="9" class="text-center py-4 text-secondary">Cargando facturas...</td>
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
                    :class="inv.status === 'ISSUED' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  >
                    {{ inv.status === 'ISSUED' ? 'Emitida / Válida' : 'Anulada' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button
                      v-if="inv.status === 'ISSUED' && inv.sign_status !== 'SIGNED'"
                      class="btn btn-sm btn-outline-warning rounded-pill px-2"
                      @click="onSignInvoice(inv)"
                      title="Firmar electrónicamente"
                    >
                      <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
                    </button>
                    <button
                      v-if="inv.sign_status === 'SIGNED'"
                      class="btn btn-sm btn-outline-success rounded-pill px-2"
                      @click="downloadXml(inv)"
                      title="Descargar XML firmado"
                    >
                      <iconify-icon icon="solar:download-minimalistic-bold"></iconify-icon>
                    </button>
                    <button class="btn btn-sm btn-outline-info rounded-pill px-2" @click="openDetailModal(inv)" title="Ver Detalle y RIDE">
                      <iconify-icon icon="solar:eye-line-duotone"></iconify-icon>
                    </button>
                    <button
                      v-if="inv.status === 'ISSUED'"
                      class="btn btn-sm btn-outline-danger rounded-pill px-2"
                      @click="onCancelInvoice(inv)"
                      title="Anular Factura"
                    >
                      <iconify-icon icon="solar:trash-bin-trash-line-duotone"></iconify-icon>
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
    <div v-if="showCreateModal" class="modal-backdrop-custom" @click.self="showCreateModal = false">
      <div class="modal-card-custom modal-lg-custom">
        <div class="modal-header-custom d-flex justify-content-between align-items-center">
          <div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">SRI ECUADOR</span>
            <h4 class="text-white fw-bold mb-0 mt-1">Emitir Factura Electrónica Normal</h4>
          </div>
          <button class="btn btn-link text-secondary p-0 fs-5" @click="showCreateModal = false">
            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
          </button>
        </div>

        <form @submit.prevent="submitInvoice" class="p-3">
          <!-- Datos de Cabecera SRI -->
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label text-secondary small fw-semibold">Establecimiento</label>
              <input v-model="form.establishment" type="text" maxlength="3" class="form-control bg-dark-subtle border-secondary text-white font-monospace text-center" required />
            </div>
            <div class="col-md-3">
              <label class="form-label text-secondary small fw-semibold">Punto de Emisión</label>
              <input v-model="form.emission_point" type="text" maxlength="3" class="form-control bg-dark-subtle border-secondary text-white font-monospace text-center" required />
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
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-xs btn-outline-info rounded-pill" @click="setFinalConsumer">
                  Consumidor Final
                </button>
                <select @change="onSelectCustomer" class="form-select form-select-sm bg-dark text-white border-secondary w-auto">
                  <option value="">Seleccionar de Contactos...</option>
                  <option v-for="c in customersList" :key="c.id" :value="c.id">
                    {{ c.razon_social }} ({{ c.num_document }})
                  </option>
                </select>
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

          <!-- Detalle de Productos y Servicios -->
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-white fw-bold">Ítems / Detalle de la Factura</span>
              <button type="button" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 rounded-pill" @click="addDetailRow">
                <iconify-icon icon="solar:add-circle-line-duotone"></iconify-icon>
                <span>Agregar Línea</span>
              </button>
            </div>

            <div class="table-responsive border rounded-3">
              <table class="table table-hover table-sm align-middle mb-0">
                <thead class="table-primary fs-1 text-uppercase">
                  <tr>
                    <th width="32%">Producto / Servicio del Catálogo</th>
                    <th width="10%" class="text-center">Cant.</th>
                    <th width="14%" class="text-end">Precio ($)</th>
                    <th width="12%" class="text-end">Desc. ($)</th>
                    <th width="12%" class="text-center">IVA</th>
                    <th width="14%" class="text-end">Subtotal</th>
                    <th width="6%" class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in form.details" :key="idx">
                    <td>
                      <select @change="onSelectItem(idx, $event)" class="form-select form-select-sm bg-dark-subtle border-secondary text-white mb-1">
                        <option value="">-- Cargar de Inventario --</option>
                        <optgroup label="Artículos Físicos">
                          <option v-for="a in articlesList" :key="'art-'+a.id" :value="'ITEM:'+a.id">
                            {{ a.code }} - {{ a.name }} (${{ a.salePrice }})
                          </option>
                        </optgroup>
                        <optgroup label="Servicios Propios">
                          <option v-for="s in servicesList" :key="'srv-'+s.id" :value="'SERVICE:'+s.id">
                            {{ s.code }} - {{ s.name }} (${{ s.salePrice }})
                          </option>
                        </optgroup>
                        <optgroup label="Subcontratos / Mano de Obra">
                          <option v-for="m in subcontractsList" :key="'mo-'+m.id" :value="'SUBCONTRACT:'+m.id">
                            {{ m.code }} - {{ m.name }} (${{ m.suggestedPrice }})
                          </option>
                        </optgroup>
                      </select>
                      <input v-model="row.description" type="text" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Descripción detallada del ítem o servicio *" required />
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
                      <button type="button" class="btn btn-link text-danger p-0" @click="removeDetailRow(idx)" :disabled="form.details.length === 1">
                        <iconify-icon icon="solar:trash-bin-minimalistic-bold"></iconify-icon>
                      </button>
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
              <iconify-icon icon="solar:diskette-bold-duotone"></iconify-icon>
              <span>{{ saving ? 'Emitiendo...' : 'Emitir Factura' }}</span>
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
            <h4 class="text-white fw-bold mb-0 mt-1">{{ viewingInvoice.invoice_number }}</h4>
          </div>
          <button class="btn btn-link text-secondary p-0 fs-5" @click="showDetailModal = false">
            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
          </button>
        </div>

        <div class="p-4 text-white">
          <div class="row g-3 pb-3 border-bottom border-secondary">
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
            <div class="p-3 bg-dark-subtle rounded-3 border border-secondary" style="min-width: 250px;">
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
              <hr class="border-secondary my-2" />
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold">TOTAL:</span>
                <span class="font-monospace fw-bold text-success fs-4">${{ formatNumber(viewingInvoice.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer d-flex justify-content-end gap-2 p-3 border-top border-secondary">
          <button
            v-if="viewingInvoice.status === 'ISSUED' && viewingInvoice.sign_status !== 'SIGNED'"
            class="btn btn-outline-warning d-flex align-items-center gap-2"
            @click="onSignInvoice(viewingInvoice)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Firmar XML</span>
          </button>
          <button
            v-if="viewingInvoice.sign_status === 'SIGNED'"
            class="btn btn-outline-success d-flex align-items-center gap-2"
            @click="downloadXml(viewingInvoice)"
          >
            <iconify-icon icon="solar:download-minimalistic-bold"></iconify-icon>
            <span>Descargar XML firmado</span>
          </button>
          <button class="btn btn-outline-info d-flex align-items-center gap-2" @click="printRide(viewingInvoice)">
            <iconify-icon icon="solar:printer-bold-duotone"></iconify-icon>
            <span>Imprimir / PDF (RIDE)</span>
          </button>
          <button class="btn btn-secondary" @click="showDetailModal = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-xs {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
}
</style>
