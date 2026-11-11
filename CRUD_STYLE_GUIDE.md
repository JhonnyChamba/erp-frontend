# Guía de Estilos y Estándar de CRUDs en Deskounta ERP (Frontend)

Este documento define la regla de diseño y arquitectura de estilos para todos los módulos CRUD actuales y futuros de **Deskounta ERP**. Al seguir esta regla, cualquier CRUD se adapta automáticamente al **Modo Oscuro** y al **Modo Claro** sin duplicar código ni requerir ajustes manuales. Si en el futuro se modifica la apariencia global, solo se edita `src/assets/crud-theme.css` y el cambio se propagará a todo el sistema.

---

## 1. Archivo Central de Estilos
Todos los estilos compartidos residen en:
📁 `src/assets/crud-theme.css` (importado globalmente en `src/main.ts`).

### Variables Semánticas Utilizadas
Los componentes nunca deben usar colores hexadecimales fijos (`#0b1426`, `#ffffff`, `#171c23`, etc.). En su lugar, se utilizan las variables del tema de Spike Admin:
* `--bs-body-bg`: Fondo general de la página.
* `--bs-card-bg`: Fondo de las tarjetas, modales y tablas.
* `--bs-heading-color`: Títulos y encabezados principales.
* `--bs-body-color`: Color de lectura de textos principales.
* `--bs-border-color`: Bordes de tarjetas, tablas e inputs.
* `--bs-text-muted`: Etiquetas, leyendas y subtítulos.
* `--bs-hover-bg`: Resaltado de filas en hover.

---

## 2. Estructura Estándar de una Vista CRUD (.vue)

Cada vista CRUD debe seguir este esquema semántico:

```html
<template>
  <!-- Contenedor principal: siempre incluir .crud-page y la clase específica del módulo -->
  <div class="crud-page mi-modulo-page">
    
    <!-- 1. Encabezado de la Página -->
    <div class="crud-page-header">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
            MOD-XXX SECCIÓN
          </span>
          <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
            SUBTÍTULO / ETIQUETA
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
        <button class="btn btn-primary rounded-pill px-3 fw-semibold shadow-sm" @click="openCreateModal">
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
          <span>Nuevo Registro</span>
        </button>
      </div>
    </div>

    <!-- 2. Indicadores (KPI Cards) -->
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
      <!-- Otras tarjetas KPI (success, info, warning) -->
    </div>

    <!-- 3. Tarjeta de Filtros y Búsqueda -->
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

    <!-- 4. Tabla Principal -->
    <div class="crud-table-card">
      <div class="table-responsive">
        <table class="crud-table">
          <thead>
            <tr>
              <th>Columna 1</th>
              <th>Columna 2</th>
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
                  <button class="btn btn-sm btn-outline-warning rounded-pill px-2" @click="openEdit(item)">
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

    <!-- 5. Modal Estándar -->
    <div v-if="showModal" class="crud-modal-backdrop">
      <div class="crud-modal-card modal-md">
        <div class="crud-modal-header">
          <h4>Título del Modal</h4>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill" @click="showModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
          </button>
        </div>
        <form @submit.prevent="submitForm" class="crud-modal-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label small fw-semibold">Nombre *</label>
              <input v-model="form.name" type="text" class="form-control" required />
            </div>
          </div>
          <div class="crud-modal-footer px-0 pb-0 mt-4">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-3" @click="showModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary rounded-pill px-4 fw-semibold" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              <span v-else>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
```

---

## 3. Reglas Obligatorias para Nuevos CRUDs

1. **No usar clases que fuercen color oscuro permanente**:
   * ❌ No usar: `table-dark`, `bg-dark`, `bg-dark-subtle`, `text-white` en párrafos o títulos de tablas.
   * ✅ Usar: `crud-table`, `text-body-emphasis`, `text-muted`, `form-control`, `form-select`.
2. **Notificaciones**:
   * ❌ No usar carteles/banners horizontales dentro de la vista.
   * ✅ Usar únicamente Spike Toastr: `toast.success('Mensaje', 'Título')`, `toast.error(...)`, `toast.warning(...)`.
3. **Spinners en Acciones Asíncronas**:
   * En botones de guardar, anular, eliminar o actualizar, colocar:
     `<span v-if="loading" class="spinner-grow spinner-grow-sm" role="status"></span>`
4. **Modales**:
   * Utilizar siempre `.crud-modal-backdrop` y `.crud-modal-card` (`.modal-md` o `.modal-lg`).
   * No declarar estilos fijos `<style scoped>` con fondos oscuros para los modales; el archivo `crud-theme.css` ya maneja las sombras, fondo, desenfoque y animación para modo claro y modo oscuro.
