# Guía de Estilos y Estándar de CRUDs en Deskounta ERP (Frontend)

Este documento define la **regla de diseño y arquitectura de estilos para todos los módulos CRUD actuales y futuros de Deskounta ERP**. Al seguir esta regla, cualquier CRUD se adapta automáticamente al **Modo Oscuro** y al **Modo Claro** sin duplicar código ni requerir ajustes manuales. Si en el futuro se modifica la apariencia global, solo se edita `src/assets/crud-theme.css` y el cambio se propagará a todo el sistema.

---

## ⭐️ REGLA FUNDAMENTAL DE ARQUITECTURA: FORMULARIOS EN PÁGINA (NO MODALES)

> [!IMPORTANT]
> **En todos los nuevos módulos de registro o edición:**
> 1. El formulario **DEBE ser un formulario normal en página** (`.form-page` / `.form-page-card`).
> 2. **NO debe ser un modal emergente flotante con fondo oscuro (`modal-backdrop`)**.
> 3. Debe incluir siempre en su cabecera superior derecha el botón **`Volver al Listado`** con el icono `solar:alt-arrow-left-line-duotone`.
> 4. La transición entre la lista y el formulario se gestiona con una variable reactiva (ej. `const currentView = ref<'list' | 'form'>('list')` o `const isFormOpen = ref(false)`).

---

## 1. Archivo Central de Estilos
Todos los estilos compartidos residen en:
📁 `src/assets/crud-theme.css` (importado globalmente en `src/main.ts`).

### Variables Semánticas Utilizadas
Los componentes nunca deben usar colores hexadecimales fijos (`#0b1426`, `#ffffff`, `#171c23`, etc.). En su lugar, se utilizan las variables del tema de Spike Admin:
* `--bs-body-bg`: Fondo general de la página.
* `--bs-card-bg`: Fondo de las tarjetas, formularios en página y tablas.
* `--bs-heading-color`: Títulos y encabezados principales.
* `--bs-body-color`: Color de lectura de textos principales.
* `--bs-border-color`: Bordes de tarjetas, tablas e inputs.
* `--bs-text-muted`: Etiquetas, leyendas y subtítulos.
* `--bs-hover-bg`: Resaltado de filas en hover.

---

## 2. Estructura Estándar de una Vista CRUD (.vue)

Cada vista CRUD debe seguir este esquema semántico con alternancia entre Listado y Formulario en página:

```html
<script setup lang="ts">
import { ref } from 'vue'
import { toast } from '@/utils/toastr'

// Control de vista: 'list' (tabla) o 'form' (formulario normal en página)
const currentView = ref<'list' | 'form'>('list')
const loading = ref(false)
const saving = ref(false)
const editingItem = ref<any | null>(null)

const openCreateForm = () => {
  editingItem.value = null
  currentView.value = 'form'
}

const openEditForm = (item: any) => {
  editingItem.value = item
  currentView.value = 'form'
}

const backToList = () => {
  currentView.value = 'list'
  editingItem.value = null
}
</script>

<template>
  <div class="crud-page mi-modulo-page">
    
    <!-- ========================================================== -->
    <!-- 1. VISTA DE LISTADO (TABLA, KPIS Y FILTROS)               -->
    <!-- ========================================================== -->
    <template v-if="currentView === 'list'">
      <!-- Encabezado de la Página -->
      <div class="crud-page-header">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
              MOD-XXX SECCIÓN
            </span>
          </div>
          <h3 class="crud-title">Nombre del Módulo</h3>
          <p class="crud-subtitle">Descripción corta de la funcionalidad del módulo.</p>
        </div>

        <div class="crud-header-actions">
          <button class="btn btn-outline-secondary rounded-pill px-3" :disabled="loading" @click="loadData">
            <span v-if="loading" class="spinner-grow spinner-grow-sm text-secondary" role="status"></span>
            <iconify-icon v-else icon="solar:refresh-line-duotone" class="fs-4"></iconify-icon>
            <span>Actualizar</span>
          </button>
          <button class="btn btn-primary rounded-pill px-3 fw-semibold shadow-sm" @click="openCreateForm">
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      <!-- Indicadores (KPI Cards) -->
      <div class="crud-kpi-grid">
        <div class="crud-kpi-card">
          <div class="crud-kpi-icon primary">
            <iconify-icon icon="solar:chart-2-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Total Registros</span>
            <h4 class="crud-kpi-val">{{ totalCount }}</h4>
          </div>
        </div>
      </div>

      <!-- Tarjeta de Filtros y Búsqueda -->
      <div class="crud-filters-card">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-4">
            <label class="form-label">Filtrar por Estado</label>
            <select v-model="filterStatus" class="form-select">
              <option value="TODOS">Todos los estados</option>
            </select>
          </div>
          <div class="col-12 col-md-8">
            <label class="form-label">Buscar</label>
            <div class="input-group">
              <span class="input-group-text">
                <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
              </span>
              <input v-model="searchTerm" type="text" class="form-control" placeholder="Buscar..." />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla Principal -->
      <div class="crud-table-card">
        <div class="table-responsive">
          <table class="crud-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th class="text-center">Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td><span class="fw-semibold text-body-emphasis">{{ item.name }}</span></td>
                <td><span class="crud-chip">{{ item.code }}</span></td>
                <td class="text-center">
                  <span :class="item.enabled ? 'badge bg-success-subtle text-success border border-success-subtle' : 'badge bg-danger-subtle text-danger border border-danger-subtle'">
                    {{ item.enabled ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1 align-items-center">
                    <button class="btn btn-sm btn-outline-warning rounded-pill px-2" @click="openEditForm(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-4"></iconify-icon>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-2" @click="onDelete(item)">
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

    <!-- ========================================================== -->
    <!-- 2. FORMULARIO NORMAL EN PÁGINA (NO MODAL FLOTANTE)        -->
    <!-- ========================================================== -->
    <div v-else-if="currentView === 'form'" class="form-page">
      <div class="form-page-card">
        <!-- Cabecera del formulario con botón volver -->
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
                MOD-XXX SECCIÓN
              </span>
            </div>
            <h3 class="crud-title mb-0">
              {{ editingItem ? 'Editar Registro' : 'Nuevo Registro' }}
            </h3>
            <p class="crud-subtitle">Completa los campos obligatorios del registro.</p>
          </div>

          <button type="button" class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3" @click="backToList">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <!-- Cuerpo del formulario -->
        <form @submit.prevent="submitForm">
          <div class="form-page-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Nombre *</label>
                <input v-model="form.name" type="text" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Código *</label>
                <input v-model="form.code" type="text" class="form-control" required />
              </div>
            </div>
          </div>

          <!-- Pie del formulario con acciones -->
          <div class="form-page-footer">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="backToList">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
              <span>{{ editingItem ? 'Guardar Cambios' : 'Registrar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
```

---

## 3. Resumen de Reglas de Oro

1. **Formularios en Página:** NUNCA crear formularios en modales flotantes (`modal-backdrop`). Siempre usar la vista de página completa (`.form-page` / `.form-page-card`) con el botón **"Volver al Listado"**.
2. **Select2 Dinámico:** Usar siempre `<AppSelect2>` para desplegables de búsqueda (sucursales, clientes, proveedores, bodegas, puntos de emisión, etc.) con buscador integrado y navegación por teclado.
3. **No usar colores fijos oscuros:** NUNCA colocar clases como `table-dark`, `bg-dark`, `bg-dark-subtle`, `text-white` en textos o fondos generales. Utilizar `crud-table`, `text-body-emphasis`, `text-muted`, `form-control`.
4. **Notificaciones:** Usar exclusivamente Spike Toastr (`toast.success`, `toast.error`, etc.). No colocar banners horizontales en el template.
5. **Spinners:** Colocar `<span v-if="loading" class="spinner-grow spinner-grow-sm" role="status"></span>` en botones de acción mientras se ejecuta la petición.

---

## 4. Componente Select2 Dinámico (Estilo Spike Admin)

Todos los selectores de búsqueda en Deskounta ERP deben usar el componente global `<AppSelect2>` (o `<Select2>`), el cual replica fielmente el diseño y funcionamiento de Spike Bootstrap Admin (`form-select2.html`):

### Uso Básico:
```html
<AppSelect2
  v-model="form.branch_id"
  :options="branchOptions"
  placeholder="-- Seleccione una sucursal --"
  search-placeholder="Buscar por código o nombre..."
  allow-clear
  required
/>
```

### Formato de las Opciones (`options`):
```ts
const branchOptions = computed(() =>
  branches.value.map((b) => ({
    value: b.id,
    label: `${b.code} - ${b.name}`,
    sublabel: b.address || '', // Opcional: texto secundario aclaratorio
    disabled: b.status === 'INACTIVO' // Opcional
  }))
)
```

### Características Principales:
* **Buscador en tiempo real:** Filtra instantáneamente por label, sublabel y valor con autofocus automático al desplegar.
* **Navegación con teclado:** Flecha abajo/arriba para resaltar opciones y tecla Enter para seleccionar. Escape para cerrar.
* **Cierre Inteligente:** Detección de clic fuera del contenedor para cerrar el dropdown.
* **Compatibilidad Temas:** `src/assets/select2-theme.css` provee variables automáticas para modo oscuro y modo claro con foco en color primario (`--bs-primary: #0085db`).

