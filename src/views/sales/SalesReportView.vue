<template>
  <div class="sales-report-page">
    <!-- CABECERA PRINCIPAL CON BREADCRUMB Y ACCIONES -->
    <div class="card shadow-sm border-0 rounded-4 mb-4">
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2 rounded-pill">
                <iconify-icon icon="solar:chart-square-bold-duotone" class="align-middle me-1"></iconify-icon>
                REPORTES TRIBUTARIOS
              </span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2 rounded-pill">
                SRI ECUADOR
              </span>
            </div>
            <h3 class="fw-bold mb-1" style="color: var(--bs-text-title);">
              Reporte de Ventas e Impuestos SRI
            </h3>
            <p class="text-muted fs-3 mb-0">
              Consolidado de facturación electrónica, bases imponibles IVA 15% y 0%, notas de crédito y liquidación fiscal.
            </p>
          </div>

          <!-- BOTONES DE EXPORTACIÓN Y ACCIÓN -->
          <div class="d-flex flex-wrap align-items-center gap-2">
            <button
              class="btn btn-outline-success rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
              @click="exportToExcel"
              :disabled="loading || !hasSearched || filteredRows.length === 0"
              title="Descargar reporte en formato Excel (.xls)"
            >
              <iconify-icon icon="solar:file-spreadsheet-line-duotone" class="fs-5"></iconify-icon>
              <span>Exportar Excel</span>
            </button>

            <button
              class="btn btn-primary rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
              @click="printReport"
              :disabled="loading || !hasSearched || filteredRows.length === 0"
              title="Imprimir informe oficial membretado"
            >
              <iconify-icon icon="solar:printer-line-duotone" class="fs-5"></iconify-icon>
              <span>Imprimir Reporte</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL DE FILTROS -->
    <div class="card shadow-sm border-0 rounded-4 mb-4">
      <div class="card-body p-4">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Fecha Desde</label>
            <input
              type="date"
              v-model="filters.dateFrom"
              class="form-control rounded-3"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Fecha Hasta</label>
            <input
              type="date"
              v-model="filters.dateTo"
              class="form-control rounded-3"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Sucursal / Establecimiento</label>
            <select v-model="filters.branchId" class="form-select rounded-3">
              <option value="ALL">Todas las Sucursales</option>
              <option v-for="b in branchesList" :key="b.id" :value="String(b.id)">
                {{ b.name || 'Sucursal' }} ({{ b.code || '001' }})
              </option>
            </select>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Tipo de Comprobante</label>
            <select v-model="filters.docType" class="form-select rounded-3">
              <option value="ALL">Todos (Facturas y Notas de Crédito)</option>
              <option value="INVOICE">Solo Facturas (01)</option>
              <option value="CREDIT_NOTE">Solo Notas de Crédito (04)</option>
            </select>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Estado SRI</label>
            <select v-model="filters.sriStatus" class="form-select rounded-3">
              <option value="ALL">Todos los Estados</option>
              <option value="AUTHORIZED">Solo Autorizados SRI</option>
              <option value="IN_PROCESS">En Proceso / Enviados</option>
              <option value="RETURNED">Devueltos / Con Error</option>
              <option value="NOT_SENT">No Enviados</option>
              <option value="CANCELED">Anulados Internamente</option>
            </select>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Forma de Pago SRI</label>
            <select v-model="filters.paymentMethod" class="form-select rounded-3">
              <option value="ALL">Todas las Formas de Pago</option>
              <option value="01">01 - Efectivo / Sin Sist. Financiero</option>
              <option value="16">16 - Tarjeta de Débito</option>
              <option value="19">19 - Tarjeta de Crédito</option>
              <option value="20">20 - Transferencia / Otros con Sist. Financiero</option>
              <option value="17">17 - Dinero Electrónico</option>
              <option value="21">21 - Endoso de Títulos</option>
            </select>
          </div>

          <div class="col-12 col-lg-4">
            <label class="form-label fs-2 fw-semibold text-muted mb-1">Búsqueda Rápida</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0">
                <iconify-icon icon="solar:magnifer-line-duotone" class="text-muted fs-4"></iconify-icon>
              </span>
              <input
                type="text"
                v-model="filters.search"
                class="form-control border-start-0 rounded-end-3"
                placeholder="Buscar por cliente, RUC/cédula, N° secuencial..."
              />
              <button
                v-if="filters.search"
                class="btn btn-outline-secondary"
                type="button"
                @click="filters.search = ''"
              >
                Limpiar
              </button>
            </div>
          </div>

          <!-- BOTÓN BUSCAR / PROCESAR -->
          <div class="col-12 col-lg-2">
            <button
              type="button"
              class="btn btn-primary w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
              @click="consultReport"
              :disabled="loading"
            >
              <iconify-icon icon="solar:magnifer-bold-duotone" class="fs-5" :class="{ 'spin-anim': loading }"></iconify-icon>
              <span>{{ loading ? 'Procesando...' : 'Buscar / Procesar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ESTADO INICIAL: ANTES DE DAR CLIC EN BUSCAR -->
    <div v-if="!hasSearched" class="card shadow-sm border-0 rounded-4 p-5 text-center my-4">
      <div class="d-flex justify-content-center mb-3">
        <div class="p-3 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 72px; height: 72px;">
          <iconify-icon icon="solar:magnifer-bold-duotone" class="fs-9"></iconify-icon>
        </div>
      </div>
      <h4 class="fw-bold mb-2" style="color: var(--bs-text-title);">Consulta de Ventas e Impuestos SRI</h4>
      <p class="text-muted fs-3 mb-4 mx-auto" style="max-width: 520px;">
        Selecciona el rango de fechas, sucursal o estado SRI en el panel superior y presiona <strong>Buscar / Procesar</strong> para generar el reporte.
      </p>
      <div>
        <button class="btn btn-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2" @click="consultReport" :disabled="loading">
          <iconify-icon icon="solar:magnifer-bold-duotone" class="fs-5"></iconify-icon>
          <span>Buscar / Procesar Ahora</span>
        </button>
      </div>
    </div>

    <!-- PESTAÑAS Y RESULTADOS (SOLO VISIBLE DESPUÉS DE BUSCAR / PROCESAR) -->
    <div v-else class="card shadow-sm border-0 rounded-4">
      <div class="card-header bg-transparent border-bottom p-3">
        <ul class="nav nav-pills gap-2" role="tablist">
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fs-2 fw-semibold d-flex align-items-center gap-2"
              :class="{ active: currentTab === 'details' }"
              @click="currentTab = 'details'"
            >
              <iconify-icon icon="solar:document-text-bold-duotone" class="fs-4"></iconify-icon>
              <span>Detalle de Comprobantes ({{ filteredRows.length }})</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fs-2 fw-semibold d-flex align-items-center gap-2"
              :class="{ active: currentTab === 'monthly' }"
              @click="currentTab = 'monthly'"
            >
              <iconify-icon icon="solar:chart-2-bold-duotone" class="fs-4"></iconify-icon>
              <span>Resumen Mensual SRI</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fs-2 fw-semibold d-flex align-items-center gap-2"
              :class="{ active: currentTab === 'payments' }"
              @click="currentTab = 'payments'"
            >
              <iconify-icon icon="solar:card-2-bold-duotone" class="fs-4"></iconify-icon>
              <span>Formas de Pago SRI</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fs-2 fw-semibold d-flex align-items-center gap-2"
              :class="{ active: currentTab === 'customers' }"
              @click="currentTab = 'customers'"
            >
              <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-4"></iconify-icon>
              <span>Ranking de Clientes</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="card-body p-0">
        <!-- ========================================== -->
        <!-- TAB 1: DETALLE DE COMPROBANTES             -->
        <!-- ========================================== -->
        <div v-show="currentTab === 'details'">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-nowrap">
              <thead class="table-light fs-2">
                <tr>
                  <th style="min-width: 105px;">Fecha</th>
                  <th>Tipo</th>
                  <th>N° Comprobante</th>
                  <th>Cliente / Razón Social</th>
                  <th>Sucursal</th>
                  <th class="text-end">Base 15%</th>
                  <th class="text-end">Base 0%</th>
                  <th class="text-end">IVA 15%</th>
                  <th class="text-end">Total</th>
                  <th class="text-center">Estado SRI</th>
                  <th class="text-center" style="min-width: 110px;">Acciones</th>
                </tr>
              </thead>
              <tbody class="fs-2">
                <tr v-if="loading">
                  <td colspan="11" class="text-center py-5">
                    <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <div class="spinner-grow text-primary spinner-grow-sm" role="status"></div>
                      <div class="spinner-grow text-info spinner-grow-sm" role="status"></div>
                    </div>
                    <span class="text-muted">Consultando comprobantes y consolidando cálculo fiscal...</span>
                  </td>
                </tr>

                <tr v-else-if="paginatedRows.length === 0">
                  <td colspan="11" class="text-center py-5 text-muted">
                    <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-9 d-block mb-2 text-secondary"></iconify-icon>
                    <span>No se encontraron comprobantes emitidos con los filtros seleccionados.</span>
                  </td>
                </tr>

                <tr v-for="row in paginatedRows" :key="row.uid">
                  <td>
                    <span class="font-mono text-muted">{{ formatDate(row.date) }}</span>
                  </td>
                  <td>
                    <span
                      class="badge px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 fs-1"
                      :class="row.type === 'INVOICE' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                    >
                      <iconify-icon :icon="row.type === 'INVOICE' ? 'solar:document-text-bold' : 'solar:card-recive-bold'"></iconify-icon>
                      {{ row.type === 'INVOICE' ? 'FACTURA' : 'NOTA CRÉDITO' }}
                    </span>
                  </td>
                  <td>
                    <span class="font-mono fw-bold">{{ row.docNumber }}</span>
                  </td>
                  <td>
                    <div class="d-flex flex-column" style="max-width: 250px;">
                      <span class="fw-semibold text-truncate" :title="row.customerName">{{ row.customerName }}</span>
                      <small class="text-muted font-mono">{{ row.customerId }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="text-info fs-1">{{ row.branchName }}</span>
                  </td>
                  <td class="text-end font-mono">
                    {{ formatMoney(row.base15) }}
                  </td>
                  <td class="text-end font-mono">
                    {{ formatMoney(row.base0) }}
                  </td>
                  <td class="text-end font-mono text-warning">
                    {{ formatMoney(row.tax15) }}
                  </td>
                  <td class="text-end font-mono fw-bold" :class="row.isCreditNote ? 'text-danger' : 'text-success'">
                    {{ row.isCreditNote ? '-' : '' }}{{ formatMoney(row.total) }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge px-2 py-1 rounded-pill fs-1 d-inline-flex align-items-center gap-1"
                      :class="getSriBadgeClass(row.sriStatus, row.status)"
                    >
                      <iconify-icon :icon="getSriBadgeIcon(row.sriStatus, row.status)"></iconify-icon>
                      {{ getSriBadgeText(row.sriStatus, row.status) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <button
                        class="btn btn-sm btn-icon btn-light rounded-circle text-primary"
                        @click="printSingleDoc(row)"
                        title="Imprimir RIDE en esta pestaña"
                      >
                        <iconify-icon icon="solar:printer-line-duotone" class="fs-5"></iconify-icon>
                      </button>

                      <button
                        v-if="row.accessKey"
                        class="btn btn-sm btn-icon btn-light rounded-circle text-secondary"
                        @click="copyAccessKey(row.accessKey)"
                        title="Copiar Clave de Acceso (49 dígitos)"
                      >
                        <iconify-icon icon="solar:copy-line-duotone" class="fs-5"></iconify-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINACIÓN -->
          <div class="d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 border-top gap-3">
            <span class="text-muted fs-2">
              Mostrando registros {{ paginationStart }} a {{ paginationEnd }} de un total de {{ filteredRows.length }}
            </span>
            <div class="d-flex align-items-center gap-2">
              <select v-model.number="pageSize" class="form-select form-select-sm" style="width: 80px;">
                <option :value="15">15</option>
                <option :value="30">30</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <div class="btn-group btn-group-sm">
                <button
                  class="btn btn-outline-secondary"
                  :disabled="currentPage <= 1"
                  @click="currentPage--"
                >
                  Anterior
                </button>
                <button class="btn btn-outline-secondary active">
                  {{ currentPage }} / {{ totalPages || 1 }}
                </button>
                <button
                  class="btn btn-outline-secondary"
                  :disabled="currentPage >= totalPages"
                  @click="currentPage++"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: RESUMEN MENSUAL SRI                 -->
        <!-- ========================================== -->
        <div v-show="currentTab === 'monthly'" class="p-4">
          <div class="alert alert-info border-info-subtle d-flex align-items-center gap-2 rounded-3 mb-4">
            <iconify-icon icon="solar:info-circle-line-duotone" class="fs-5 flex-shrink-0"></iconify-icon>
            <span class="fs-2">
              Este resumen mensual agrupa los montos según las casillas del formulario <strong>SRI 104</strong> (Declaración del Impuesto al Valor Agregado).
            </span>
          </div>

          <div class="table-responsive">
            <table class="table table-bordered align-middle text-nowrap">
              <thead class="table-light fs-2 text-center">
                <tr>
                  <th>Mes / Año</th>
                  <th>Cant. Facturas</th>
                  <th>Cant. Notas Crédito</th>
                  <th class="text-end">Ventas Brutas</th>
                  <th class="text-end">Base Imponible 15%</th>
                  <th class="text-end">Base Tarifa 0%</th>
                  <th class="text-end">IVA 15% Generado</th>
                  <th class="text-end">Deducciones (NC)</th>
                  <th class="text-end">Ventas Netas Totales</th>
                </tr>
              </thead>
              <tbody class="fs-2 font-mono">
                <tr v-if="monthlySummary.length === 0">
                  <td colspan="9" class="text-center py-4 text-muted font-sans">
                    No hay datos agrupados para el período seleccionado.
                  </td>
                </tr>
                <tr v-for="m in monthlySummary" :key="m.period">
                  <td class="fw-bold font-sans">{{ m.periodName }}</td>
                  <td class="text-center">{{ m.invoicesCount }}</td>
                  <td class="text-center">{{ m.creditNotesCount }}</td>
                  <td class="text-end">{{ formatMoney(m.grossSales) }}</td>
                  <td class="text-end text-info">{{ formatMoney(m.base15) }}</td>
                  <td class="text-end">{{ formatMoney(m.base0) }}</td>
                  <td class="text-end text-warning">{{ formatMoney(m.tax15) }}</td>
                  <td class="text-end text-danger">-{{ formatMoney(m.creditNotesTotal) }}</td>
                  <td class="text-end fw-bold text-success">{{ formatMoney(m.netSales) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 3: FORMAS DE PAGO SRI                  -->
        <!-- ========================================== -->
        <div v-show="currentTab === 'payments'" class="p-4">
          <div class="row g-4">
            <div class="col-12 col-lg-8">
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead class="table-light fs-2">
                    <tr>
                      <th>Código SRI</th>
                      <th>Descripción Forma de Pago</th>
                      <th class="text-center">Comprobantes</th>
                      <th class="text-end">Monto Total</th>
                      <th class="text-end">% Participación</th>
                    </tr>
                  </thead>
                  <tbody class="fs-2">
                    <tr v-for="pay in paymentsSummary" :key="pay.code">
                      <td><span class="badge bg-dark-subtle text-white font-mono">{{ pay.code }}</span></td>
                      <td class="fw-semibold">{{ pay.name }}</td>
                      <td class="text-center font-mono">{{ pay.count }}</td>
                      <td class="text-end font-mono fw-bold text-success">{{ formatMoney(pay.total) }}</td>
                      <td class="text-end font-mono text-muted">{{ pay.percent }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="p-4 rounded-4 bg-light border border-secondary-subtle">
                <h5 class="fw-bold mb-3" style="color: var(--bs-text-title);">Normativa SRI Formas de Pago</h5>
                <p class="text-muted fs-2 mb-2">
                  Según la Resolución NAC-DGERCGC16-00000455 del SRI, todo comprobante de venta debe identificar el uso o no del sistema financiero ecuatoriano:
                </p>
                <ul class="fs-2 text-muted ps-3 mb-0">
                  <li class="mb-1"><strong>01:</strong> Sin utilización del sistema financiero (efectivo).</li>
                  <li class="mb-1"><strong>16 / 19:</strong> Tarjetas de débito o crédito emitidas por entidades financieras.</li>
                  <li class="mb-1"><strong>20:</strong> Transferencias bancarias, cheques y otros medios bancarizados.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 4: RANKING DE CLIENTES                 -->
        <!-- ========================================== -->
        <div v-show="currentTab === 'customers'" class="p-4">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light fs-2">
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Identificación (RUC / Cédula)</th>
                  <th>Cliente / Razón Social</th>
                  <th class="text-center">Facturas</th>
                  <th class="text-end">Total Facturado</th>
                  <th class="text-end">% del Total</th>
                </tr>
              </thead>
              <tbody class="fs-2">
                <tr v-for="(cust, idx) in topCustomers" :key="cust.idNumber">
                  <td class="font-mono text-muted">{{ idx + 1 }}</td>
                  <td class="font-mono fw-semibold">{{ cust.idNumber }}</td>
                  <td class="fw-bold">{{ cust.name }}</td>
                  <td class="text-center font-mono">{{ cust.count }}</td>
                  <td class="text-end font-mono fw-bold text-success">{{ formatMoney(cust.total) }}</td>
                  <td class="text-end font-mono text-muted">{{ cust.percent }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getInvoices, type InvoiceItem } from '@/services/invoices.service'
import { listCreditNotes, type CreditNoteItem } from '@/services/credit-notes.service'
import { getBranches, type BranchItem } from '@/services/config.service'
import { printRideDoc } from '@/utils/sri-ride'
import { toast } from '@/utils/toastr'

// Tipos unificados para el reporte
interface UnifiedReportRow {
  uid: string
  id: number
  type: 'INVOICE' | 'CREDIT_NOTE'
  isCreditNote: boolean
  date: string
  docNumber: string
  customerName: string
  customerId: string
  branchId?: number | null
  branchName: string
  base15: number
  base0: number
  tax15: number
  discount: number
  total: number
  effectiveTotal: number
  sriStatus: string
  status: string
  accessKey?: string | null
  paymentMethod?: string
  raw: InvoiceItem | CreditNoteItem
}

// Estados reactivos
const loading = ref(false)
const hasSearched = ref(false)
const invoices = ref<InvoiceItem[]>([])
const creditNotes = ref<CreditNoteItem[]>([])
const branchesList = ref<BranchItem[]>([])
const currentTab = ref<'details' | 'monthly' | 'payments' | 'customers'>('details')

// Paginación
const currentPage = ref(1)
const pageSize = ref(30)

// Filtros
const todayStr = new Date().toISOString().slice(0, 10)
const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

const filters = ref({
  dateFrom: firstDayOfMonthStr,
  dateTo: todayStr,
  branchId: 'ALL',
  docType: 'ALL',
  sriStatus: 'ALL',
  paymentMethod: 'ALL',
  search: '',
})

// Empresa activa
const getActiveCompany = () => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { id: 1, razon_social: 'Deskounta', ruc: '1725620247001' }
}

// Cargar sucursales en el montaje
onMounted(async () => {
  const comp = getActiveCompany()
  try {
    const brsRes: any = await getBranches(comp.id, { onlyEnabled: true }).catch(() => ({ data: [] }))
    branchesList.value = Array.isArray(brsRes?.data) ? brsRes.data : Array.isArray(brsRes) ? brsRes : []
  } catch {}
})

// Consultar / Procesar búsqueda al hacer clic en el botón
const consultReport = async () => {
  loading.value = true
  const comp = getActiveCompany()
  try {
    const [invs, cns]: [any, any] = await Promise.all([
      getInvoices(comp.id),
      listCreditNotes(),
    ])

    invoices.value = Array.isArray(invs) ? invs : []
    creditNotes.value = Array.isArray(cns) ? cns : []
    hasSearched.value = true
    currentPage.value = 1
  } catch (err: any) {
    console.error('Error al consultar reporte de ventas:', err)
    toast.error('No se pudieron obtener todos los datos del reporte.', 'Reportes')
  } finally {
    loading.value = false
  }
}

// Mapeo unificado de comprobantes
const unifiedRows = computed<UnifiedReportRow[]>(() => {
  if (!hasSearched.value) return []

  const list: UnifiedReportRow[] = []
  const branchMap = new Map<number, string>()
  for (const b of branchesList.value) {
    branchMap.set(b.id, `${b.name || 'Sucursal'} (${b.code || '001'})`)
  }

  // Facturas
  for (const inv of invoices.value) {
    const bName = inv.branch_id ? branchMap.get(inv.branch_id) || `Sucursal #${inv.branch_id}` : 'Matriz (001)'
    const isCanceled = inv.status === 'CANCELED'
    const totalVal = Number(inv.total || 0)
    const effTotal = isCanceled ? 0 : totalVal

    list.push({
      uid: `INV-${inv.id}`,
      id: inv.id,
      type: 'INVOICE',
      isCreditNote: false,
      date: String(inv.issue_date || inv.created_at || '').slice(0, 10),
      docNumber: inv.invoice_number || `${inv.establishment}-${inv.emission_point}-${inv.sequential}`,
      customerName: inv.customer_name || 'Consumidor Final',
      customerId: inv.customer_id_number || '9999999999999',
      branchId: inv.branch_id,
      branchName: bName,
      base15: isCanceled ? 0 : Number(inv.subtotal_taxable || 0),
      base0: isCanceled ? 0 : Number(inv.subtotal_zero_tax || 0),
      tax15: isCanceled ? 0 : Number(inv.tax_total || 0),
      discount: isCanceled ? 0 : Number(inv.discount_total || 0),
      total: totalVal,
      effectiveTotal: effTotal,
      sriStatus: inv.sri_status || 'NOT_SENT',
      status: inv.status || 'ISSUED',
      accessKey: inv.access_key,
      paymentMethod: inv.payment_method || '01',
      raw: inv,
    })
  }

  // Notas de Crédito
  for (const cn of creditNotes.value) {
    const bName = cn.branch_id ? branchMap.get(cn.branch_id) || `Sucursal #${cn.branch_id}` : 'Matriz (001)'
    const totalVal = Number(cn.total || 0)

    list.push({
      uid: `CN-${cn.id}`,
      id: cn.id,
      type: 'CREDIT_NOTE',
      isCreditNote: true,
      date: String(cn.issue_date || cn.created_at || '').slice(0, 10),
      docNumber: cn.credit_note_number || `${cn.establishment}-${cn.emission_point}-${cn.sequential}`,
      customerName: cn.customer_name || 'Cliente',
      customerId: cn.customer_id_number || '',
      branchId: cn.branch_id,
      branchName: bName,
      base15: Number(cn.subtotal_taxable || 0),
      base0: Number(cn.subtotal_zero_tax || 0),
      tax15: Number(cn.tax_total || 0),
      discount: Number(cn.discount_total || 0),
      total: totalVal,
      effectiveTotal: -totalVal,
      sriStatus: cn.sri_status || 'NOT_SENT',
      status: cn.status || 'ISSUED',
      accessKey: cn.access_key,
      paymentMethod: '01',
      raw: cn,
    })
  }

  // Ordenar por fecha descendente
  return list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id))
})

// Filas filtradas
const filteredRows = computed(() => {
  if (!hasSearched.value) return []

  const f = filters.value
  const searchLower = f.search.toLowerCase().trim()

  return unifiedRows.value.filter((row) => {
    // Rango de fechas
    if (f.dateFrom && row.date < f.dateFrom) return false
    if (f.dateTo && row.date > f.dateTo) return false

    // Sucursal
    if (f.branchId !== 'ALL' && String(row.branchId) !== String(f.branchId)) return false

    // Tipo de comprobante
    if (f.docType === 'INVOICE' && row.type !== 'INVOICE') return false
    if (f.docType === 'CREDIT_NOTE' && row.type !== 'CREDIT_NOTE') return false

    // Estado SRI
    if (f.sriStatus !== 'ALL') {
      if (f.sriStatus === 'CANCELED' && row.status !== 'CANCELED') return false
      if (f.sriStatus !== 'CANCELED' && row.sriStatus !== f.sriStatus) return false
    }

    // Forma de pago
    if (f.paymentMethod !== 'ALL' && row.paymentMethod !== f.paymentMethod) return false

    // Búsqueda
    if (searchLower) {
      const matchDoc = row.docNumber.toLowerCase().includes(searchLower)
      const matchName = row.customerName.toLowerCase().includes(searchLower)
      const matchId = row.customerId.toLowerCase().includes(searchLower)
      const matchKey = (row.accessKey || '').toLowerCase().includes(searchLower)
      if (!matchDoc && !matchName && !matchId && !matchKey) return false
    }

    return true
  })
})

// Paginación
const totalPages = computed(() => Math.ceil(filteredRows.value.length / pageSize.value))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const paginationStart = computed(() => (filteredRows.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1))
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredRows.value.length))

// Resumen Mensual
const monthlySummary = computed(() => {
  const map = new Map<string, any>()
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  for (const row of filteredRows.value) {
    if (row.status === 'CANCELED') continue
    const key = row.date.slice(0, 7) // AAAA-MM
    if (!key) continue

    if (!map.has(key)) {
      const [year, month] = key.split('-')
      map.set(key, {
        period: key,
        periodName: `${monthNames[Number(month) - 1]} ${year}`,
        invoicesCount: 0,
        creditNotesCount: 0,
        grossSales: 0,
        base15: 0,
        base0: 0,
        tax15: 0,
        creditNotesTotal: 0,
        netSales: 0,
      })
    }

    const item = map.get(key)
    if (row.type === 'INVOICE') {
      item.invoicesCount++
      item.grossSales += row.total
      item.base15 += row.base15
      item.base0 += row.base0
      item.tax15 += row.tax15
    } else {
      item.creditNotesCount++
      item.creditNotesTotal += row.total
    }
    item.netSales = item.grossSales - item.creditNotesTotal
  }

  return Array.from(map.values()).sort((a, b) => (b.period > a.period ? 1 : -1))
})

// Resumen de Formas de Pago
const paymentsSummary = computed(() => {
  const paymentNames: Record<string, string> = {
    '01': 'Sin utilización del sistema financiero (Efectivo)',
    '16': 'Tarjeta de Débito',
    '19': 'Tarjeta de Crédito',
    '20': 'Otros con utilización del sistema financiero (Transferencia)',
    '17': 'Dinero Electrónico',
    '21': 'Endoso de Títulos',
  }

  const map = new Map<string, { code: string; name: string; count: number; total: number }>()
  let grandTotal = 0

  for (const row of filteredRows.value) {
    if (row.type !== 'INVOICE' || row.status === 'CANCELED') continue
    const code = row.paymentMethod || '01'
    if (!map.has(code)) {
      map.set(code, {
        code,
        name: paymentNames[code] || 'Otras formas de pago',
        count: 0,
        total: 0,
      })
    }
    const item = map.get(code)!
    item.count++
    item.total += row.total
    grandTotal += row.total
  }

  return Array.from(map.values())
    .map((p) => ({
      ...p,
      percent: grandTotal > 0 ? ((p.total / grandTotal) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.total - a.total)
})

// Ranking de Clientes
const topCustomers = computed(() => {
  const map = new Map<string, { idNumber: string; name: string; count: number; total: number }>()
  let grandTotal = 0

  for (const row of filteredRows.value) {
    if (row.type !== 'INVOICE' || row.status === 'CANCELED') continue
    const key = row.customerId || '9999999999999'
    if (!map.has(key)) {
      map.set(key, {
        idNumber: key,
        name: row.customerName,
        count: 0,
        total: 0,
      })
    }
    const item = map.get(key)!
    item.count++
    item.total += row.total
    grandTotal += row.total
  }

  return Array.from(map.values())
    .map((c) => ({
      ...c,
      percent: grandTotal > 0 ? ((c.total / grandTotal) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)
})

// Formateadores
const formatMoney = (val: number) => {
  return '$' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (val: string) => {
  if (!val) return ''
  const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : val
}

// Badges SRI
const getSriBadgeClass = (sriStatus: string, status: string) => {
  if (status === 'CANCELED') return 'bg-dark-subtle text-danger border border-danger-subtle'
  if (sriStatus === 'AUTHORIZED') return 'bg-success-subtle text-success border border-success-subtle'
  if (sriStatus === 'RETURNED' || sriStatus === 'NOT_AUTHORIZED') return 'bg-danger-subtle text-danger border border-danger-subtle'
  if (sriStatus === 'IN_PROCESS') return 'bg-warning-subtle text-warning border border-warning-subtle'
  return 'bg-secondary-subtle text-secondary border border-secondary-subtle'
}

const getSriBadgeIcon = (sriStatus: string, status: string) => {
  if (status === 'CANCELED') return 'solar:close-circle-bold'
  if (sriStatus === 'AUTHORIZED') return 'solar:shield-check-bold'
  if (sriStatus === 'RETURNED' || sriStatus === 'NOT_AUTHORIZED') return 'solar:danger-triangle-bold'
  if (sriStatus === 'IN_PROCESS') return 'solar:clock-circle-bold'
  return 'solar:document-bold'
}

const getSriBadgeText = (sriStatus: string, status: string) => {
  if (status === 'CANCELED') return 'Anulado'
  if (sriStatus === 'AUTHORIZED') return 'Autorizado'
  if (sriStatus === 'RETURNED') return 'Devuelto'
  if (sriStatus === 'NOT_AUTHORIZED') return 'No Autorizado'
  if (sriStatus === 'IN_PROCESS') return 'En Proceso'
  return 'No Enviado'
}

// Copiar Clave de Acceso
const copyAccessKey = (key?: string | null) => {
  if (!key) return
  navigator.clipboard.writeText(key).then(() => {
    toast.success('Clave de acceso copiada al portapapeles', 'Copiado')
  }).catch(() => {
    toast.info(key, 'Clave de Acceso')
  })
}

// Imprimir RIDE individual
const printSingleDoc = (row: UnifiedReportRow) => {
  const comp = getActiveCompany()
  printRideDoc(row.raw, comp, 'a4')
}

// Helper para escapar caracteres especiales en SpreadsheetML XML
const escapeXml = (unsafe: string | number | null | undefined): string => {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Exportar a Excel nativo (SpreadsheetML .xls)
// Evita notación científica (1E+13 o 1.21E+48), conserva los 49 dígitos de la clave de acceso
// y elimina las alertas de conversión de Excel.
const exportToExcel = () => {
  if (filteredRows.value.length === 0) {
    toast.warning('No hay comprobantes para exportar', 'Exportación')
    return
  }

  const comp = getActiveCompany()
  const companyName = comp.razon_social || comp.nombre_comercial || 'Deskounta ERP'
  const companyRuc = comp.ruc || ''

  let sumBase15 = 0
  let sumBase0 = 0
  let sumTax15 = 0
  let sumDiscount = 0
  let sumNetSales = 0

  for (const r of filteredRows.value) {
    const isNC = r.type === 'CREDIT_NOTE'
    const mult = isNC ? -1 : 1
    sumBase15 += mult * r.base15
    sumBase0 += mult * r.base0
    sumTax15 += mult * r.tax15
    sumDiscount += mult * r.discount
    sumNetSales += isNC ? -Math.abs(r.total) : r.total
  }

  const rowsXml = filteredRows.value
    .map((r) => {
      const isNC = r.type === 'CREDIT_NOTE'
      const netTotal = isNC ? -Math.abs(r.total) : r.total

      return `    <Row>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(isNC ? 'NOTA DE CRÉDITO' : 'FACTURA')}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.docNumber)}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.date)}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.customerId)}</Data></Cell>
      <Cell ss:StyleID="TextLeft"><Data ss:Type="String">${escapeXml(r.customerName)}</Data></Cell>
      <Cell ss:StyleID="TextLeft"><Data ss:Type="String">${escapeXml(r.branchName)}</Data></Cell>
      <Cell ss:StyleID="Money"><Data ss:Type="Number">${r.base15.toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="Money"><Data ss:Type="Number">${r.base0.toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="Money"><Data ss:Type="Number">${r.tax15.toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="Money"><Data ss:Type="Number">${r.discount.toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="Money"><Data ss:Type="Number">${netTotal.toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.sriStatus)}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.status)}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.paymentMethod || '01')}</Data></Cell>
      <Cell ss:StyleID="TextCenter"><Data ss:Type="String">${escapeXml(r.accessKey || '')}</Data></Cell>
    </Row>`
    })
    .join('\n')

  const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Deskounta ERP</Author>
  <Company>${escapeXml(companyName)}</Company>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#0085DB" ss:Bold="1"/>
  </Style>
  <Style ss:ID="MetaStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#64748B" ss:Italic="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0085DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0085DB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TextLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="@"/>
  </Style>
  <Style ss:ID="TextCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="@"/>
  </Style>
  <Style ss:ID="Money">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0085DB"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0085DB"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="TotalMoney">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0085DB"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0085DB"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0085DB" ss:Bold="1"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Reporte Ventas SRI">
  <Table>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="85"/>
   <Column ss:Width="120"/>
   <Column ss:Width="230"/>
   <Column ss:Width="150"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="95"/>
   <Column ss:Width="105"/>
   <Column ss:Width="95"/>
   <Column ss:Width="85"/>
   <Column ss:Width="340"/>

   <!-- ENCABEZADO DE EMPRESA -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="14" ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXml(companyName)}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="14" ss:StyleID="MetaStyle"><Data ss:Type="String">RUC: ${escapeXml(companyRuc)} | Reporte Oficial de Ventas e Impuestos SRI | Período: ${escapeXml(filters.value.dateFrom)} al ${escapeXml(filters.value.dateTo)}</Data></Cell>
   </Row>
   <Row ss:Height="10"></Row>

   <!-- ENCABEZADOS DE COLUMNA -->
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tipo</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Secuencial</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Fecha Emisión</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Identificación Cliente</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Cliente / Razón Social</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Sucursal</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Base 15% (USD)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Base 0% (USD)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">IVA 15% (USD)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Descuento (USD)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total (USD)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Estado SRI</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Estado Interno</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Forma de Pago</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Clave de Acceso</Data></Cell>
   </Row>

   <!-- FILAS DE DATOS -->
${rowsXml}

   <!-- FILA DE TOTALES -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="5" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTALES CONSOLIDADOS:</Data></Cell>
    <Cell ss:StyleID="TotalMoney"><Data ss:Type="Number">${sumBase15.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalMoney"><Data ss:Type="Number">${sumBase0.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalMoney"><Data ss:Type="Number">${sumTax15.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalMoney"><Data ss:Type="Number">${sumDiscount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalMoney"><Data ss:Type="Number">${sumNetSales.toFixed(2)}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="TotalLabel"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Reporte_Ventas_SRI_${filters.value.dateFrom}_al_${filters.value.dateTo}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success('Archivo Excel descargado con éxito.', 'Exportación Excel')
}

// Alias para compatibilidad
const exportToExcelCSV = exportToExcel

// Imprimir informe oficial membretado
const printReport = () => {
  const comp = getActiveCompany()
  const printWindow = document.createElement('iframe')
  printWindow.style.position = 'fixed'
  printWindow.style.right = '0'
  printWindow.style.bottom = '0'
  printWindow.style.width = '1px'
  printWindow.style.height = '1px'
  printWindow.style.opacity = '0.01'
  printWindow.style.pointerEvents = 'none'
  document.body.appendChild(printWindow)

  const doc = printWindow.contentWindow?.document
  if (!doc) return

  const rowsHtml = filteredRows.value.map((r) => `
    <tr>
      <td>${formatDate(r.date)}</td>
      <td>${r.type === 'INVOICE' ? 'FAC' : 'NC'}</td>
      <td style="font-family: monospace;">${r.docNumber}</td>
      <td>${r.customerName} (${r.customerId})</td>
      <td>${r.branchName}</td>
      <td style="text-align: right; font-family: monospace;">${formatMoney(r.base15)}</td>
      <td style="text-align: right; font-family: monospace;">${formatMoney(r.base0)}</td>
      <td style="text-align: right; font-family: monospace;">${formatMoney(r.tax15)}</td>
      <td style="text-align: right; font-family: monospace; font-weight: bold;">${r.isCreditNote ? '-' : ''}${formatMoney(r.total)}</td>
      <td style="text-align: center;">${r.sriStatus}</td>
    </tr>
  `).join('')

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Ventas SRI - ${comp.razon_social || 'Deskounta'}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0085db; padding-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 10px; }
          td { border: 1px solid #e2e8f0; padding: 5px 8px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${comp.razon_social || comp.nombre_comercial || 'Deskounta ERP'}</h1>
          <div class="subtitle">RUC: ${comp.ruc || ''} | Reporte Oficial de Ventas e Impuestos SRI</div>
          <div class="subtitle">Período: ${formatDate(filters.value.dateFrom)} al ${formatDate(filters.value.dateTo)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>N° Comprobante</th>
              <th>Cliente / Razón Social</th>
              <th>Sucursal</th>
              <th class="text-right">Base 15%</th>
              <th class="text-right">Base 0%</th>
              <th class="text-right">IVA 15%</th>
              <th class="text-right">Total</th>
              <th class="text-center">SRI</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    printWindow.contentWindow?.focus()
    printWindow.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(printWindow)
    }, 1500)
  }, 250)
}
</script>

<style scoped>
.font-mono {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
