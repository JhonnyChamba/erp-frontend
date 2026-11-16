---
name: crud-frontend-generator
description: >-
  Guía paso a paso y plantillas estándar para generar o refactorizar vistas CRUD en erp-frontend
  siguiendo el estándar Spike Admin UI, doble tema y STYLE_GUIDE.md.
---

# Generador de Vistas CRUD Frontend - Deskounta ERP

Usa esta guía siempre que se requiera crear o refactorizar una vista de gestión o catálogo en `erp-frontend`.

---

## 1. Servicio API (`src/services/<modulo>.service.ts`)

```ts
import { api } from './axios'

export interface ModuloItem {
  id: number
  company_id: number
  code?: string
  name: string
  description?: string
  enabled: boolean
  created_at?: string
}

export const getModulos = (params?: any) => api.get('/<modulo>', { params }).then(r => r.data)
export const getModuloById = (id: number) => api.get(`/<modulo>/${id}`).then(r => r.data)
export const createModulo = (data: any) => api.post('/<modulo>', data).then(r => r.data)
export const updateModulo = (id: number, data: any) => api.patch(`/<modulo>/${id}`, data).then(r => r.data)
export const deleteModulo = (id: number) => api.delete(`/<modulo>/${id}`).then(r => r.data)
```

---

## 2. Vista Estandarizada (`src/views/<modulo>/<Modulo>View.vue`)

Toda vista debe seguir la plantilla oficial de `STYLE_GUIDE.md`:

```html
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from '@/utils/toastr'
import { getModulos, createModulo, updateModulo, deleteModulo, type ModuloItem } from '@/services/<modulo>.service'

const loading = ref(false)
const saving = ref(false)
const isFormOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const items = ref<ModuloItem[]>([])
const searchQuery = ref('')

const initialForm = () => ({
  code: '',
  name: '',
  description: '',
  enabled: true,
})
const form = ref(initialForm())

// KPIs
const totalCount = computed(() => items.value.length)
const activeCount = computed(() => items.value.filter(i => i.enabled !== false).length)
const inactiveCount = computed(() => items.value.filter(i => i.enabled === false).length)

// Filtro
const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(i => 
    i.name.toLowerCase().includes(q) || 
    (i.code && i.code.toLowerCase().includes(q))
  )
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getModulos()
    items.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al cargar registros', 'Error')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  isEditing.value = false
  editingId.value = null
  form.value = initialForm()
  isFormOpen.value = true
}

const openEdit = (item: ModuloItem) => {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    code: item.code || '',
    name: item.name,
    description: item.description || '',
    enabled: item.enabled !== false,
  }
  isFormOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
  form.value = initialForm()
}

const submitForm = async () => {
  if (!form.value.name.trim()) {
    toast.warning('El nombre es obligatorio', 'Validación')
    return
  }
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await updateModulo(editingId.value, form.value)
      toast.success('Registro actualizado exitosamente', 'Éxito')
    } else {
      await createModulo(form.value)
      toast.success('Registro creado exitosamente', 'Éxito')
    }
    closeForm()
    await loadData()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar', 'Error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: ModuloItem) => {
  if (!window.confirm(`¿Está seguro de eliminar "${item.name}"?`)) return
  try {
    await deleteModulo(item.id)
    toast.success('Registro eliminado exitosamente', 'Éxito')
    await loadData()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al eliminar', 'Error')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="crud-page" :class="{ 'form-open': isFormOpen }">
    <!-- 1. Encabezado de Página -->
    <div class="card rounded-4 border-0 shadow-sm p-4 mb-4 bg-navy-card keep-in-form">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
              <iconify-icon icon="solar:widget-4-line-duotone" class="fs-6"></iconify-icon>
            </span>
            <h4 class="fw-bold text-white mb-0">Gestión de Registros</h4>
          </div>
          <p class="text-secondary fs-3 mb-0">Administración general del catálogo y configuración</p>
        </div>
        <div v-show="!isFormOpen">
          <button class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" @click="openCreate">
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Tarjetas KPI -->
    <div v-show="!isFormOpen" class="crud-kpi-grid mb-4">
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon primary">
          <iconify-icon icon="solar:document-text-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Total</span>
          <h4 class="crud-kpi-val">{{ totalCount }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon success">
          <iconify-icon icon="solar:check-circle-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Activos</span>
          <h4 class="crud-kpi-val">{{ activeCount }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon warning">
          <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Inactivos</span>
          <h4 class="crud-kpi-val">{{ inactiveCount }}</h4>
        </div>
      </div>
    </div>

    <!-- 3. Filtros y Búsqueda -->
    <div v-show="!isFormOpen" class="card rounded-4 border-0 shadow-sm p-3 mb-4 bg-navy-card">
      <div class="row g-3 align-items-center">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">
              <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
            </span>
            <input v-model="searchQuery" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Buscar por nombre o código..." />
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Tabla Principal con Sticky Header y Spike UI Dropdown -->
    <div v-show="!isFormOpen" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
        <p class="text-muted mt-2">Cargando registros...</p>
      </div>

      <div v-else class="table-responsive" style="min-height: 400px; padding-bottom: 6rem; overflow-y: auto;">
        <table class="table table-hover align-middle mb-0 crud-table">
          <thead class="table-primary" style="position: sticky; top: 0; z-index: 15;">
            <tr>
              <th width="10%">Código</th>
              <th width="40%">Nombre</th>
              <th width="30%">Descripción</th>
              <th width="10%" class="text-center">Estado</th>
              <th width="10%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td><span class="badge bg-dark-subtle text-white">{{ item.code || item.id }}</span></td>
              <td class="fw-semibold text-white">{{ item.name }}</td>
              <td class="text-secondary">{{ item.description || '-' }}</td>
              <td class="text-center">
                <span class="badge" :class="item.enabled !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                  {{ item.enabled !== false ? 'Activo' : 'Inactivo' }}
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
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" @click="openEdit(item)">
                        <iconify-icon icon="solar:pen-2-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar</span>
                      </a>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                      <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="confirmDelete(item)">
                        <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5 text-danger"></iconify-icon>
                        <span>Eliminar</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="5" class="text-center text-muted py-5">No hay registros disponibles.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. Formulario en Página (NUNCA MODAL FLOTANTE OSCURO) -->
    <div v-if="isFormOpen" id="form-page" class="form-page">
      <div class="form-page-card">
        <div class="card bg-navy-card border border-secondary-subtle rounded-4 shadow-sm">
          <div class="modal-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-dark-subtle">
            <div class="d-flex align-items-center gap-2">
              <span class="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex">
                <iconify-icon :icon="isEditing ? 'solar:pen-bold' : 'solar:add-circle-line-duotone'" class="fs-5"></iconify-icon>
              </span>
              <h5 class="fw-bold text-white mb-0">{{ isEditing ? 'Editar Registro' : 'Nuevo Registro' }}</h5>
            </div>
            <!-- Botón obligatorio Volver al Listado -->
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="closeForm">
              <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
              <span>Volver al Listado</span>
            </button>
          </div>

          <form @submit.prevent="submitForm">
            <div class="modal-body p-4">
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Código</label>
                  <input v-model="form.code" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Ej. CAT-001" />
                </div>
                <div class="col-md-8 mb-3">
                  <label class="form-label text-secondary fs-2 fw-semibold">Nombre *</label>
                  <input v-model="form.name" type="text" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Nombre descriptivo" required />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary fs-2 fw-semibold">Descripción</label>
                <textarea v-model="form.description" rows="3" class="form-control bg-dark-subtle border-secondary-subtle text-white" placeholder="Detalles u observaciones"></textarea>
              </div>

              <div class="mb-3">
                <div class="form-check form-switch">
                  <input id="itemEnabled" v-model="form.enabled" class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label text-secondary fs-2 fw-semibold" for="itemEnabled">Registro activo</label>
                </div>
              </div>
            </div>

            <div class="modal-footer d-flex justify-content-end gap-2 px-4 py-3 border-top border-dark-subtle">
              <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="closeForm">Cancelar</button>
              <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="saving">
                <span v-if="saving" class="spinner-grow spinner-grow-sm me-2" role="status"></span>
                <span>{{ saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 3. Verificación
Verificar que compile sin errores de tipos:
```bash
npm run type-check
```
