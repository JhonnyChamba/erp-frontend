<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  getEmployeeCategories,
  createEmployeeCategory,
  updateEmployeeCategory,
  toggleEmployeeCategoryStatus,
  deleteEmployeeCategory,
  type EmployeeCategoryItem,
} from '@/services/hr.service'
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

const loading = ref(false)
const saving = ref(false)
const search = ref('')
const categoriesList = ref<EmployeeCategoryItem[]>([])

// Modal / Formulario
const isFormOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  name: '',
  description: '',
  default_commission_rate: 0.0,
  active: true,
})

const loadData = async () => {
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const cats = await getEmployeeCategories(companyId).catch(() => [])
    categoriesList.value = cats
  } catch (err: any) {
    toast.error('Error al cargar cargos y categorías', 'Error')
  } finally {
    loading.value = false
  }
}

const filteredCategories = computed(() => {
  if (!search.value.trim()) return categoriesList.value
  const term = search.value.toLowerCase().trim()
  return categoriesList.value.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
  )
})

const openCreate = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    name: '',
    description: '',
    default_commission_rate: 0.0,
    active: true,
  }
  isFormOpen.value = true
}

const openEdit = (cat: EmployeeCategoryItem) => {
  isEditing.value = true
  editingId.value = cat.id
  form.value = {
    name: cat.name,
    description: cat.description || '',
    default_commission_rate: Number(cat.default_commission_rate || 0),
    active: cat.active,
  }
  isFormOpen.value = true
}

const saveCategory = async () => {
  if (!form.value.name.trim()) {
    toast.warning('Ingresa el nombre del cargo o categoría.', 'Requerido')
    return
  }

  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    const payload = {
      ...form.value,
      default_commission_rate: Number(form.value.default_commission_rate || 0),
    }

    if (isEditing.value && editingId.value) {
      await updateEmployeeCategory(editingId.value, payload, companyId)
      toast.success('Cargo actualizado exitosamente.', 'Configuración')
    } else {
      await createEmployeeCategory(payload, companyId)
      toast.success('Cargo registrado exitosamente.', 'Configuración')
    }

    isFormOpen.value = false
    await loadData()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar el cargo.', 'Error')
  } finally {
    saving.value = false
  }
}

const onToggleStatus = async (cat: EmployeeCategoryItem) => {
  const companyId = getActiveCompanyId()
  try {
    await toggleEmployeeCategoryStatus(cat.id, companyId)
    cat.active = !cat.active
    toast.success(`Estado de "${cat.name}" actualizado.`)
  } catch (err) {
    toast.error('Error al cambiar estado del cargo.')
  }
}

const onDelete = async (cat: EmployeeCategoryItem) => {
  if (!confirm(`¿Estás seguro de eliminar el cargo "${cat.name}"?`)) return
  const companyId = getActiveCompanyId()
  try {
    await deleteEmployeeCategory(cat.id, companyId)
    toast.success('Cargo eliminado.')
    await loadData()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'No se puede eliminar el cargo si tiene empleados asignados.')
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="crud-page categories-page" :class="{ 'form-open': isFormOpen }">
    <!-- Top Header -->
    <div class="crud-page-header keep-in-form">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
            MOD-007 · TALENTO HUMANO
          </span>
          <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace">
            CONFIGURACIÓN
          </span>
        </div>
        <h2 class="crud-title">Configuración de Categorías y Cargos</h2>
        <p class="crud-subtitle">
          Definición de puestos de trabajo, especialidades operativas y porcentaje de comisión sugerido por servicio.
        </p>
      </div>
    </div>

    <!-- Lista de Categorías -->
    <template v-if="!isFormOpen">
      <div class="card rounded-4 border border-secondary-subtle bg-navy-card p-4 shadow-sm">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <!-- Buscador -->
          <div class="input-group" style="width: 280px;">
            <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary" style="height: 40px;">
              <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
            </span>
            <input
              v-model="search"
              type="text"
              class="form-control bg-dark-subtle border-secondary-subtle text-white"
              style="height: 40px;"
              placeholder="Buscar categoría o cargo..."
            />
          </div>

          <!-- Botón Nuevo Cargo -->
          <button
            class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2 fw-semibold text-nowrap"
            style="height: 40px;"
            @click="openCreate"
          >
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
            <span>Nuevo Cargo</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
                <th>Nombre del Cargo</th>
                <th>Descripción</th>
                <th class="text-center">Comisión Sugerida (%)</th>
                <th class="text-center">Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center py-5">
                  <div class="spinner-grow text-primary" role="status"></div>
                </td>
              </tr>
              <tr v-else-if="filteredCategories.length === 0">
                <td colspan="5" class="text-center py-5 text-secondary">
                  <span>No hay cargos registrados coincidentes.</span>
                </td>
              </tr>
              <tr v-for="cat in filteredCategories" :key="cat.id" class="border-bottom border-dark-subtle">
                <td>
                  <span class="text-white fw-bold">{{ cat.name }}</span>
                </td>
                <td>
                  <small class="text-secondary">{{ cat.description || 'Sin descripción' }}</small>
                </td>
                <td class="text-center font-monospace fw-bold text-info">
                  {{ cat.default_commission_rate }}%
                </td>
                <td class="text-center">
                  <span
                    class="badge rounded-pill px-2.5 py-1 fs-1 cursor-pointer"
                    :class="cat.active ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'"
                    @click="onToggleStatus(cat)"
                    title="Clic para cambiar estado"
                  >
                    {{ cat.active ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex align-items-center gap-1">
                    <button
                      class="btn btn-sm btn-outline-info rounded-3 p-1.5"
                      title="Editar Cargo"
                      @click="openEdit(cat)"
                    >
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-4"></iconify-icon>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger rounded-3 p-1.5"
                      title="Eliminar Cargo"
                      @click="onDelete(cat)"
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

    <!-- Formulario en Página / Modal -->
    <div v-if="isFormOpen" class="form-page">
      <div class="form-page-card" style="max-width: 650px;">
        <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
          <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
            <div class="d-flex align-items-center gap-2">
              <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
                <iconify-icon icon="solar:diploma-bold-duotone" class="fs-4"></iconify-icon>
              </span>
              <h5 class="fw-bold text-white mb-0">{{ isEditing ? 'Editar Cargo' : 'Nuevo Cargo / Especialidad' }}</h5>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="isFormOpen = false">
              <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
              <span>Volver</span>
            </button>
          </div>

          <form @submit.prevent="saveCategory" class="p-4">
            <div class="mb-3">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre del Cargo / Especialidad *</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Ej. Manicurista / Pedicurista, Esteticista, Cajera..."
              />
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary fs-2 fw-semibold">Descripción</label>
              <textarea
                v-model="form.description"
                rows="2"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Breve descripción de funciones y responsabilidades..."
              ></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary fs-2 fw-semibold">% Comisión Sugerida por Servicio</label>
              <div class="input-group">
                <input
                  v-model.number="form.default_commission_rate"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                  placeholder="40"
                />
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">%</span>
              </div>
              <small class="text-secondary fs-1 mt-1 d-block">Porcentaje sugerido automáticamente al crear empleados con este cargo.</small>
            </div>

            <div class="modal-footer px-0 pt-3 border-top border-dark-subtle d-flex justify-content-between">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="isFormOpen = false">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" :disabled="saving">
                <span v-if="saving" class="spinner-grow spinner-grow-sm text-white"></span>
                <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
                <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Cargo' }}</span>
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
.form-page-card {
  width: 100%;
  margin: 0 auto;
}
</style>

