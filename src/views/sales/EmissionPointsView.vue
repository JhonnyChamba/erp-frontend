<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  getEmissionPoints,
  createEmissionPoint,
  updateEmissionPoint,
  deleteEmissionPoint,
  updateSequenceCorrelative,
  type EmissionPointItem,
  type EmissionPointSequence,
  type CreateEmissionPointPayload
} from '@/services/emission-points.service'
import { getBranches, type BranchItem } from '@/services/config.service'
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

// Estados
const loading = ref(false)
const saving = ref(false)
const savingSequenceId = ref<number | null>(null)
const deletingId = ref<number | null>(null)

// Vista actual: 'list' (tabla y KPIs), 'form' (formulario de registro/edición), 'sequences' (detalle de secuencias)
const currentView = ref<'list' | 'form' | 'sequences'>('list')

// Datos
const emissionPointsList = ref<EmissionPointItem[]>([])
const branchesList = ref<BranchItem[]>([])

// Filtros
const searchTerm = ref('')
const filterBranchId = ref<string>('TODAS')

// Selección
const editingPoint = ref<EmissionPointItem | null>(null)
const selectedPointForSequences = ref<EmissionPointItem | null>(null)

// Formulario Punto de Emisión
const form = ref<{
  branch_id: number | null
  description: string
  serie: string
  initial_correlative: number
  enabled: boolean
}>({
  branch_id: null,
  description: '',
  serie: '',
  initial_correlative: 0,
  enabled: true
})

// Edición de correlativo en vista de secuencias
const editingCorrelative = ref<Record<number, number>>({})

const showFeedback = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
  if (type === 'success') {
    toast.success(text, title || 'Puntos de Emisión')
  } else if (type === 'error') {
    toast.error(text, title || 'Error en Punto de Emisión')
  } else if (type === 'warning') {
    toast.warning(text, title || 'Atención')
  } else {
    toast.info(text, title || 'Información')
  }
}

// Cargar datos
const loadData = async () => {
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const [pts, brs] = await Promise.all([
      getEmissionPoints(companyId),
      getBranches(companyId).catch(() => ({ data: [] }))
    ])
    emissionPointsList.value = Array.isArray(pts) ? pts : []
    const branchesData = (brs as any)?.data || brs || []
    branchesList.value = Array.isArray(branchesData) ? branchesData : []
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al cargar los puntos de emisión', 'error')
  } finally {
    loading.value = false
  }
}

// Sucursales activas para emitir
const activeBranches = computed(() =>
  branchesList.value.filter((b: BranchItem) => b.enabled !== false)
)

// Opciones Select2
const branchFilterOptions = computed(() => [
  { value: 'TODAS', label: '-- Todas las Sucursales --' },
  ...branchesList.value.map((b) => ({
    value: String(b.id),
    label: `${b.code} - ${b.name}${b.isMatrix ? ' (Matriz)' : ''}`,
  })),
])

const branchSelectOptions = computed(() =>
  activeBranches.value.map((b) => ({
    value: b.id,
    label: `${b.code} - ${b.name}${b.isMatrix ? ' (Matriz)' : ''}`,
    sublabel: b.address || '',
  }))
)

// Puntos filtrados
const filteredPoints = computed(() => {
  let list = emissionPointsList.value
  if (filterBranchId.value !== 'TODAS') {
    const bId = Number(filterBranchId.value)
    list = list.filter((p) => p.branch?.id === bId)
  }
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.trim().toLowerCase()
    list = list.filter(
      (p) =>
        p.description?.toLowerCase().includes(term) ||
        p.serie?.toLowerCase().includes(term) ||
        p.branch?.name?.toLowerCase().includes(term) ||
        p.branch?.code?.toLowerCase().includes(term)
    )
  }
  return list
})

// KPIs
const totalPointsCount = computed(() => emissionPointsList.value.length)
const activePointsCount = computed(
  () => emissionPointsList.value.filter((p) => p.enabled).length
)
const branchesWithPointsCount = computed(() => {
  const branchIds = new Set(
    emissionPointsList.value
      .map((p) => p.branch?.id)
      .filter((id): id is number => typeof id === 'number')
  )
  return branchIds.size
})

// Navegar a formulario de creación
const openCreateForm = () => {
  editingPoint.value = null
  const defaultBranch = activeBranches.value[0]
  form.value = {
    branch_id: defaultBranch?.id || null,
    description: '',
    serie: '',
    initial_correlative: 0,
    enabled: true
  }
  currentView.value = 'form'
}

// Navegar a formulario de edición
const openEditForm = (point: EmissionPointItem) => {
  editingPoint.value = point
  form.value = {
    branch_id: point.branch?.id || null,
    description: point.description,
    serie: point.serie,
    initial_correlative: 0,
    enabled: point.enabled
  }
  currentView.value = 'form'
}

// Volver al listado
const backToList = () => {
  currentView.value = 'list'
  editingPoint.value = null
  selectedPointForSequences.value = null
}

// Guardar punto de emisión (crear o editar)
const submitPoint = async () => {
  if (!form.value.description.trim()) {
    showFeedback('Ingresa una descripción para el punto de emisión.', 'warning')
    return
  }
  if (!form.value.serie.trim()) {
    showFeedback('Ingresa la serie de 3 dígitos (ej: 001, 856).', 'warning')
    return
  }
  if (!editingPoint.value && !form.value.branch_id) {
    showFeedback('Selecciona una sucursal para el punto de emisión.', 'warning')
    return
  }

  saving.value = true
  const companyId = getActiveCompanyId()

  try {
    if (editingPoint.value) {
      await updateEmissionPoint(
        editingPoint.value.id,
        {
          description: form.value.description.trim(),
          serie: form.value.serie.trim(),
          enabled: form.value.enabled
        },
        companyId
      )
      showFeedback('Punto de emisión actualizado con éxito.', 'success')
    } else {
      const payload: CreateEmissionPointPayload = {
        branch_id: Number(form.value.branch_id),
        description: form.value.description.trim(),
        serie: form.value.serie.trim(),
        initial_correlative: Number(form.value.initial_correlative || 0)
      }
      await createEmissionPoint(payload, companyId)
      showFeedback('Punto de emisión y secuencias registradas con éxito.', 'success')
    }

    backToList()
    await loadData()
  } catch (err: any) {
    showFeedback(
      err?.response?.data?.message || 'Error al guardar el punto de emisión',
      'error'
    )
  } finally {
    saving.value = false
  }
}

// Abrir vista de secuencias
const openSequencesView = (point: EmissionPointItem) => {
  selectedPointForSequences.value = point
  editingCorrelative.value = {}
  if (point.sequences) {
    for (const seq of point.sequences) {
      editingCorrelative.value[seq.id] = seq.correlative
    }
  }
  currentView.value = 'sequences'
}

// Guardar correlativo de una secuencia específica
const saveSequenceCorrelative = async (seq: EmissionPointSequence) => {
  const newCorrelative = Number(editingCorrelative.value[seq.id])
  if (isNaN(newCorrelative) || newCorrelative < 0) {
    showFeedback('El correlativo debe ser un número igual o mayor a 0.', 'warning')
    return
  }

  savingSequenceId.value = seq.id
  const companyId = getActiveCompanyId()

  try {
    const updated = await updateSequenceCorrelative(seq.id, newCorrelative, companyId)
    seq.correlative = updated.correlative
    showFeedback(`Correlativo de ${seq.document_type} actualizado a ${updated.correlative}.`, 'success')
    await loadData()
    // Actualizar referencia en la vista
    if (selectedPointForSequences.value) {
      const refreshed = emissionPointsList.value.find((p) => p.id === selectedPointForSequences.value?.id)
      if (refreshed) selectedPointForSequences.value = refreshed
    }
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al actualizar el correlativo', 'error')
  } finally {
    savingSequenceId.value = null
  }
}

// Eliminar punto de emisión
const onDeletePoint = async (point: EmissionPointItem) => {
  if (
    !confirm(
      `¿Estás seguro de eliminar el punto de emisión "${point.serie} - ${point.description}"?`
    )
  ) {
    return
  }

  deletingId.value = point.id
  const companyId = getActiveCompanyId()

  try {
    await deleteEmissionPoint(point.id, companyId)
    showFeedback('Punto de emisión eliminado correctamente.', 'success')
    await loadData()
  } catch (err: any) {
    showFeedback(
      err?.response?.data?.message || 'Error al eliminar el punto de emisión',
      'error'
    )
  } finally {
    deletingId.value = null
  }
}

// Obtener formato con ceros a la izquierda
const padSequential = (num: number, digits = 9) => {
  return String(num).padStart(digits, '0')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="crud-page emission-points-page">

    <!-- PESTAÑAS DE NAVEGACIÓN MÓDULO VENTAS (FACTURAS, NOTAS DE CRÉDITO, PUNTOS DE EMISIÓN) -->
    <div class="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <router-link
        to="/ventas/facturas"
        class="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2 btn-outline-secondary"
      >
        <iconify-icon icon="solar:document-text-line-duotone" class="fs-4"></iconify-icon>
        <span>Facturas</span>
      </router-link>

      <router-link
        to="/ventas/notas-credito"
        class="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2 btn-outline-secondary"
      >
        <iconify-icon icon="solar:bill-cross-line-duotone" class="fs-4"></iconify-icon>
        <span>Notas de Crédito (SRI 04)</span>
      </router-link>

      <router-link
        to="/ventas/puntos-emision"
        class="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2 btn-primary"
      >
        <iconify-icon icon="solar:printer-minimalistic-line-duotone" class="fs-4"></iconify-icon>
        <span>Puntos de Emisión</span>
      </router-link>
    </div>
    
    <!-- ============================================================== -->
    <!-- VISTA 1: LISTADO PRINCIPAL (TABLA, KPIS Y FILTROS)             -->
    <!-- ============================================================== -->
    <template v-if="currentView === 'list'">
      <!-- CABECERA PRINCIPAL -->
      <div class="crud-page-header">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
              MOD-001 CONFIG · VENTAS
            </span>
            <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
              SRI ECUADOR
            </span>
          </div>
          <h3 class="crud-title">Puntos de Emisión</h3>
          <p class="crud-subtitle">
            Gestión de series y correlativos de emisión para Facturas, Notas de Crédito, Guías de Remisión y Notas de Débito.
          </p>
        </div>

        <div class="crud-header-actions">
          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            :disabled="loading"
            @click="loadData"
          >
            <span v-if="loading" class="spinner-grow spinner-grow-sm text-secondary" role="status" aria-hidden="true"></span>
            <iconify-icon v-else icon="solar:refresh-line-duotone" class="fs-4"></iconify-icon>
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            class="btn btn-primary d-flex align-items-center gap-1 rounded-pill px-3 fw-semibold shadow-sm"
            @click="openCreateForm"
          >
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
            <span>Nuevo Punto de Emisión</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES (KPIs) -->
      <div class="crud-kpi-grid">
        <div class="crud-kpi-card">
          <div class="crud-kpi-icon primary">
            <iconify-icon icon="solar:printer-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Total Puntos de Emisión</span>
            <h4 class="crud-kpi-val">{{ totalPointsCount }}</h4>
          </div>
        </div>

        <div class="crud-kpi-card">
          <div class="crud-kpi-icon success">
            <iconify-icon icon="solar:check-circle-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Puntos Activos</span>
            <h4 class="crud-kpi-val">{{ activePointsCount }}</h4>
          </div>
        </div>

        <div class="crud-kpi-card">
          <div class="crud-kpi-icon info">
            <iconify-icon icon="solar:shop-2-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Sucursales con Emisión</span>
            <h4 class="crud-kpi-val">{{ branchesWithPointsCount }}</h4>
          </div>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTRO -->
      <div class="crud-filters-card">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-4">
            <label class="form-label">Filtrar por Sucursal</label>
            <AppSelect2
              v-model="filterBranchId"
              :options="branchFilterOptions"
              placeholder="Todas las Sucursales"
              search-placeholder="Buscar sucursal..."
            />
          </div>

          <div class="col-12 col-md-8">
            <label class="form-label">Buscar Punto de Emisión</label>
            <div class="input-group">
              <span class="input-group-text">
                <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
              </span>
              <input
                v-model="searchTerm"
                type="text"
                class="form-control"
                placeholder="Buscar por descripción, número de serie o código de sucursal..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE PUNTOS DE EMISIÓN -->
      <div class="crud-table-card">
        <div class="table-responsive">
          <table class="crud-table">
            <thead>
              <tr>
                <th scope="col" style="min-width: 180px;">Sucursal / Establecimiento</th>
                <th scope="col" style="min-width: 180px;">Descripción</th>
                <th scope="col" class="text-center" style="width: 110px;">Serie</th>
                <th scope="col" style="min-width: 220px;">Secuencias de Documentos</th>
                <th scope="col" class="text-center" style="width: 110px;">Estado</th>
                <th scope="col" class="text-end" style="min-width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-5 text-muted">
                  <div class="spinner-grow spinner-grow-sm text-primary mb-2" role="status"></div>
                  <p class="mb-0 fs-2">Cargando puntos de emisión...</p>
                </td>
              </tr>
              <tr v-else-if="filteredPoints.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
                  <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron puntos de emisión</p>
                  <p class="mb-0 fs-2 text-muted">Haz clic en "Nuevo Punto de Emisión" para habilitar series de facturación.</p>
                </td>
              </tr>
              <tr v-for="point in filteredPoints" :key="point.id">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                      {{ point.branch?.code || '001' }}
                    </span>
                    <div>
                      <span class="fw-semibold d-block text-body-emphasis">
                        {{ point.branch?.name || 'Sucursal' }}
                      </span>
                      <small class="text-muted d-block fs-1">
                        {{ point.branch?.address || 'Sin dirección' }}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="fw-semibold text-body-emphasis">{{ point.description }}</span>
                </td>
                <td class="text-center">
                  <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace fs-3 px-3 py-1">
                    {{ point.serie }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-1 align-items-center">
                    <span
                      v-for="seq in point.sequences"
                      :key="seq.id"
                      class="crud-chip"
                      :title="`${seq.document_type}: Último correlativo ${seq.correlative}`"
                    >
                      <span class="text-muted me-1">{{ seq.document_type === 'FACTURAS' ? 'FAC' : seq.document_type === 'NOTAS DE CRÉDITO' ? 'NC' : seq.document_type === 'GUÍAS DE REMISIÓN' ? 'GR' : 'ND' }}:</span>
                      <span class="text-info">#{{ seq.correlative }}</span>
                    </span>
                  </div>
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="point.enabled ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  >
                    {{ point.enabled ? 'Activo' : 'Inactivo' }}
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
                      <!-- Configurar Secuencias -->
                      <li>
                        <a class="dropdown-item py-2" href="javascript:void(0)" @click="openSequencesView(point)">
                          <iconify-icon icon="solar:document-text-line-duotone" class="fs-5 text-info"></iconify-icon>
                          <span>Secuencias de Emisión</span>
                        </a>
                      </li>

                      <!-- Editar Punto de Emisión -->
                      <li>
                        <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditForm(point)">
                          <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                          <span>Editar Serie</span>
                        </a>
                      </li>

                      <!-- Eliminar Punto de Emisión -->
                      <li>
                        <hr class="dropdown-divider">
                        <a
                          class="dropdown-item py-2 text-danger"
                          href="javascript:void(0)"
                          :class="{ disabled: deletingId === point.id }"
                          @click="onDeletePoint(point)"
                        >
                          <span v-if="deletingId === point.id" class="spinner-grow spinner-grow-sm text-danger" role="status"></span>
                          <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" class="fs-5 text-danger"></iconify-icon>
                          <span>Eliminar</span>
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

    <!-- ============================================================== -->
    <!-- VISTA 2: FORMULARIO NORMAL EN PÁGINA (CREAR / EDITAR)         -->
    <!-- REGLA DEL SISTEMA: FORMULARIO NORMAL, NO MODAL FLOTANTE        -->
    <!-- ============================================================== -->
    <div v-else-if="currentView === 'form'" class="form-page">
      <div class="form-page-card">
        <!-- CABECERA DEL FORMULARIO CON BOTÓN VOLVER -->
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
                VENTAS · CONFIGURACIÓN
              </span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
                {{ editingPoint ? 'MODIFICACIÓN' : 'REGISTRO' }}
              </span>
            </div>
            <h3 class="crud-title mb-0">
              {{ editingPoint ? `Editar Punto de Emisión (${editingPoint.serie})` : 'Nuevo Punto de Emisión' }}
            </h3>
            <p class="crud-subtitle">
              Configura los datos del punto de emisión y sus secuencias autorizadas por el SRI.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            @click="backToList"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <!-- CUERPO DEL FORMULARIO -->
        <form @submit.prevent="submitPoint">
          <div class="form-page-body">
            <div class="row g-4">
              <!-- Sucursal -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Sucursal / Establecimiento *</label>
                <AppSelect2
                  v-model="form.branch_id"
                  :options="branchSelectOptions"
                  placeholder="-- Selecciona la Sucursal --"
                  search-placeholder="Buscar sucursal..."
                  :disabled="!!editingPoint"
                  required
                />
                <small v-if="editingPoint" class="text-muted fs-1 d-block mt-1">
                  La sucursal está vinculada a este punto y no se modifica para mantener coherencia fiscal.
                </small>
              </div>

              <!-- Serie -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">N° de Serie (3 dígitos SRI) *</label>
                <input
                  v-model="form.serie"
                  type="text"
                  maxlength="3"
                  class="form-control font-monospace text-center fs-4 fw-bold"
                  placeholder="001"
                  required
                />
                <small class="text-muted fs-1 d-block mt-1">Ej: 001, 002, 856</small>
              </div>

              <!-- Descripción -->
              <div class="col-12">
                <label class="form-label fw-semibold">Descripción del Punto de Emisión *</label>
                <input
                  v-model="form.description"
                  type="text"
                  class="form-control"
                  placeholder="Ej: Facturación Mostrador, Caja Principal 1, Punto Norte"
                  required
                />
              </div>

              <!-- Correlativo Inicial de Facturas (Solo en creación) -->
              <div v-if="!editingPoint" class="col-12 col-md-6">
                <label class="form-label fw-semibold">Correlativo Inicial (Facturas)</label>
                <input
                  v-model.number="form.initial_correlative"
                  type="number"
                  min="0"
                  class="form-control font-monospace text-center fs-4"
                  placeholder="0"
                />
                <small class="text-muted fs-1 d-block mt-1">
                  El próximo secuencial será: <strong class="text-info">{{ padSequential((form.initial_correlative || 0) + 1) }}</strong>
                </small>
              </div>

              <!-- Estado Activo (En edición) -->
              <div v-if="editingPoint" class="col-12 col-md-6 d-flex align-items-center">
                <div class="form-check form-switch mt-2">
                  <input
                    v-model="form.enabled"
                    class="form-check-input"
                    type="checkbox"
                    id="pointStatusSwitch"
                  />
                  <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="pointStatusSwitch">
                    {{ form.enabled ? 'Punto Habilitado para Facturación' : 'Punto Deshabilitado' }}
                  </label>
                </div>
              </div>

              <!-- Nota informativa sobre secuencias -->
              <div v-if="!editingPoint" class="col-12">
                <div class="p-3 rounded-3 bg-body-secondary border border-secondary-subtle small text-muted">
                  <iconify-icon icon="solar:info-circle-line-duotone" class="text-info me-1 fs-4 align-middle"></iconify-icon>
                  <span>
                    Al registrar este punto de emisión, el sistema insertará automáticamente el detalle de 4 secuencias:
                    <strong class="text-body-emphasis">FACTURAS</strong>, 
                    <strong class="text-body-emphasis">NOTAS DE CRÉDITO</strong>, 
                    <strong class="text-body-emphasis">GUÍAS DE REMISIÓN</strong> y 
                    <strong class="text-body-emphasis">NOTAS DE DÉBITO</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- PIE DE ACCIONES DEL FORMULARIO -->
          <div class="form-page-footer">
            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              @click="backToList"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
              <span>{{ editingPoint ? 'Guardar Cambios' : 'Registrar Punto de Emisión' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- VISTA 3: SECUENCIAS DEL PUNTO DE EMISIÓN EN PÁGINA (NO MODAL)  -->
    <!-- REPLICA EXACTA DE LA IMAGEN DE REFERENCIA                      -->
    <!-- ============================================================== -->
    <div v-else-if="currentView === 'sequences' && selectedPointForSequences" class="form-page">
      <div class="form-page-card">
        <!-- CABECERA DE SECUENCIAS -->
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
                {{ selectedPointForSequences.branch?.code }} - {{ selectedPointForSequences.branch?.name }}
              </span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
                SERIE: {{ selectedPointForSequences.serie }}
              </span>
            </div>
            <h3 class="crud-title mb-0">
              Punto de Emisión: {{ selectedPointForSequences.description }}
            </h3>
            <p class="crud-subtitle">
              Secuencias activas y correlativos para emisión de documentos electrónicos SRI.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            @click="backToList"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <div class="form-page-body">
          <!-- TÍTULO DE LA SECCIÓN IGUAL QUE EN LA IMAGEN DE REFERENCIA -->
          <div class="d-flex align-items-center gap-2 mb-3">
            <span class="text-primary fs-4">•</span>
            <h5 class="text-info fw-bold mb-0">Secuencias</h5>
          </div>

          <!-- TABLA DE SECUENCIAS -->
          <div class="crud-table-card">
            <div class="table-responsive">
              <table class="crud-table">
                <thead>
                  <tr>
                    <th scope="col" style="width: 60px;">N°</th>
                    <th scope="col" style="min-width: 200px;">Comprobante</th>
                    <th scope="col" class="text-center" style="width: 140px;">N° de Serie</th>
                    <th scope="col" class="text-center" style="width: 160px;">Correlativo</th>
                    <th scope="col" class="text-center" style="min-width: 180px;">Próximo a Emitir</th>
                    <th scope="col" class="text-end" style="width: 120px;">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(seq, index) in selectedPointForSequences.sequences" :key="seq.id">
                    <td class="text-muted fw-bold">{{ index + 1 }}</td>
                    <td>
                      <span class="fw-bold text-body-emphasis">{{ seq.document_type }}</span>
                    </td>
                    <td class="text-center font-monospace text-muted fs-4">
                      {{ seq.serie }}
                    </td>
                    <td class="text-center">
                      <input
                        v-model.number="editingCorrelative[seq.id]"
                        type="number"
                        min="0"
                        class="form-control form-control-sm font-monospace text-center mx-auto"
                        style="max-width: 110px;"
                      />
                    </td>
                    <td class="text-center">
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-2 px-2 py-1">
                        {{ selectedPointForSequences.branch?.code || '001' }}-{{ seq.serie }}-{{ padSequential(Number(editingCorrelative[seq.id] ?? seq.correlative) + 1) }}
                      </span>
                    </td>
                    <td class="text-end">
                      <button
                        class="btn btn-sm btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                        :disabled="savingSequenceId === seq.id || editingCorrelative[seq.id] === seq.correlative"
                        @click="saveSequenceCorrelative(seq)"
                        title="Guardar nuevo correlativo"
                      >
                        <span v-if="savingSequenceId === seq.id" class="spinner-grow spinner-grow-sm text-white" role="status" aria-hidden="true"></span>
                        <iconify-icon v-else icon="solar:check-circle-bold" class="fs-4"></iconify-icon>
                        <span class="small">Guardar</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary-subtle">
            <small class="text-muted">
              El correlativo se actualiza automáticamente al emitir comprobantes en el sistema.
            </small>
            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              @click="backToList"
            >
              Volver al Listado
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
