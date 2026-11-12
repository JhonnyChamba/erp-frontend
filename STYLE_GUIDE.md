# Guía de Estilos y Estándares de Diseño - Deskounta ERP Frontend

Este documento define las reglas oficiales y universales de estilos, arquitectura visual y componentes para todo el desarrollo frontend en **Deskounta Enterprise ERP**. Todo nuevo módulo, CRUD o ajuste visual DEBE adherirse estrictamente a esta guía.

---

## 1. Archivos Centrales de Estilos

Todos los estilos globales están organizados en `src/assets/` y se importan en `src/main.ts`:
- **`src/assets/theme.css`**: Variables globales de tema Bootstrap, colores primarios Spike Admin y tipografías.
- **`src/assets/crud-theme.css`**: Sistema universal para todos los CRUDs (KPIs, filtros, tablas, formularios en página, modo claro y oscuro).
- **`src/assets/select2-theme.css`**: Estilos del componente `<AppSelect2>` con búsqueda en tiempo real.
- **`src/assets/toastr-theme.css`**: Notificaciones Toast elegantes (éxito, error, advertencia, info).

> **REGLA DE ORO**: Si se requiere ajustar colores, bordes o espaciados de tablas, formularios o selectores, se modifica el archivo central en `src/assets/` para que impacte en todo el ERP de manera coherente, en lugar de crear estilos ad-hoc en `<style scoped>`.

---

## 2. Estructura Estándar de una Vista CRUD

Toda vista de gestión (ej. Facturas, Notas de Crédito, Puntos de Emisión, Clientes, Inventario, Compras) debe seguir esta estructura:

```html
<template>
  <div class="crud-page mi-modulo-page">
    <!-- 1. Encabezado de Página -->
    <div class="crud-page-header">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle">CÓDIGO-MOD</span>
          <span class="text-muted small">Módulo / Submódulo</span>
        </div>
        <h2 class="crud-title">Título del Módulo</h2>
        <p class="crud-subtitle">Descripción concisa de la funcionalidad de la vista.</p>
      </div>
      <div class="crud-header-actions">
        <!-- Pestañas de sub-navegación si aplica -->
        <!-- Botón de acción principal -->
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateForm">
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo Registro</span>
        </button>
      </div>
    </div>

    <!-- 2. Tarjetas de Indicadores (KPIs) -->
    <div v-show="!isFormOpen" class="crud-kpi-grid">
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon primary">
          <iconify-icon icon="solar:document-text-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Total Registros</span>
          <h4 class="crud-kpi-val">{{ totalCount }}</h4>
        </div>
      </div>
      <!-- Más KPIs... -->
    </div>

    <!-- 3. Tarjeta de Filtros y Búsqueda -->
    <div v-show="!isFormOpen" class="crud-filters-card">
      <div class="row g-3 align-items-center">
        <div class="col-md-5">
          <div class="input-group">
            <span class="input-group-text"><iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon></span>
            <input v-model="searchQuery" type="text" class="form-control" placeholder="Buscar..." />
          </div>
        </div>
        <!-- Filtros adicionales con AppSelect2 o form-select -->
      </div>
    </div>

    <!-- 4. Tabla Principal -->
    <div v-show="!isFormOpen" class="crud-table-card">
      <div class="table-responsive">
        <table class="crud-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th class="text-center">Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td><span class="crud-chip">{{ item.code }}</span></td>
              <td>{{ item.name }}</td>
              <td class="text-center">
                <span :class="['badge', item.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                  {{ item.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group gap-1">
                  <button class="btn-action-icon edit" @click="openEditForm(item)" title="Editar">
                    <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
                  </button>
                  <button class="btn-action-icon delete" @click="confirmDelete(item)" title="Eliminar">
                    <iconify-icon icon="solar:trash-bin-trash-line-duotone"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. Formulario Normal en Página (NUNCA MODAL FLOTANTE OSCURO) -->
    <div v-if="isFormOpen" id="form-page" class="form-page">
      <div class="form-page-card">
        <div class="modal-header-custom d-flex justify-content-between align-items-center p-3 border-bottom border-dark-subtle">
          <div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">REGISTRO</span>
            <h4 class="text-body-emphasis fw-bold mb-0 mt-1">{{ isEditing ? 'Editar Registro' : 'Nuevo Registro' }}</h4>
          </div>
          <!-- Botón estándar Volver al Listado -->
          <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="closeForm">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>
        <form @submit.prevent="submitForm" class="p-4">
          <!-- Campos en rejilla con .form-label, .form-control y <AppSelect2> -->
          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
            <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn btn-primary px-4 rounded-3 fw-bold" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-2" role="status"></span>
              {{ isEditing ? 'Guardar Cambios' : 'Registrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
```

---

## 3. Reglas Específicas de Diseño y Componentes

### 3.1. Formularios Normales en Página (No Modales Flotantes)
- Todo formulario de creación o edición de un recurso debe renderizarse como página dentro del flujo de la vista (`.form-page` / `.form-page-card`), ocultando el listado principal (`v-show="!isFormOpen"`).
- **Prohibido** usar diálogos emergentes oscuros con backdrop (`.modal-backdrop`) para crear/editar entidades principales.
- Debe incluir siempre en su cabecera superior derecha el botón **`Volver al Listado`** con el icono `solar:alt-arrow-left-line-duotone`.
- Los modales emergentes quedan **exclusivamente reservados** para:
  1. Modales de confirmación de eliminación o anulación.
  2. Modales de vista rápida de detalle/auditoría.
  3. `<SriResponseModal>` para autorizaciones, mensajes y errores del SRI.

### 3.2. Selectores Desplegables con Búsqueda (`<AppSelect2>`)
- Para selectores relacionales (sucursales, clientes, proveedores, artículos, bodegas, puntos de emisión, roles, etc.), usar siempre el componente global `<AppSelect2>`.
- Características obligatorias:
  - Búsqueda en tiempo real interna.
  - Navegación con teclado (Flechas ↑/↓, Enter para seleccionar, Escape para cerrar).
  - Soporte de etiquetas secundarias (`sublabel` o `badge`).
  - Compatible con modo claro y oscuro gracias a `src/assets/select2-theme.css`.

### 3.3. Notificaciones y Alertas
- Usar **exclusivamente** el servicio de Toastr centralizado (`toast` de `@/utils/toastr`):
  - `toast.success('Mensaje', 'Título')`
  - `toast.error('Mensaje', 'Título')`
  - `toast.warning('Mensaje', 'Título')`
  - `toast.info('Mensaje', 'Título')`
- **Prohibido** renderizar banners o carteles horizontales flotantes fijos en el template (como `.feedback-banner` o `<div class="alert alert-danger">`).

### 3.4. Soporte para Modo Oscuro y Modo Claro (Dual Theme)
- **NUNCA** usar clases fijas que rompen el modo claro, tales como `bg-dark`, `table-dark`, `text-white` sin selector condicional.
- Utilizar variables CSS o clases semánticas:
  - Fondos: `var(--bs-card-bg)`, `var(--bs-body-bg)`, `crud-table-card`, `crud-kpi-card`.
  - Textos: `text-body-emphasis`, `text-muted`, `crud-title`, `crud-subtitle`.
  - Bordes: `var(--bs-border-color)`, `border-dark-subtle`.
- Todas las clases del sistema CRUD están mapeadas con reglas en `src/assets/crud-theme.css` para `[data-bs-theme="dark"]` y `[data-bs-theme="light"]`.

### 3.5. Respuesta del SRI y Errores Comunes
- Al emitir comprobantes electrónicos hacia el SRI (Facturas, Notas de Crédito, etc.), los resultados deben desplegarse a través de `<SriResponseModal>`.
- `<SriResponseModal>` cuenta con:
  - Diseño responsivo con altura máxima (`max-height: 88vh`) y cuerpo desplazable (`overflow-y: auto`).
  - Detección automática del catálogo de errores SRI (`src/utils/sri-errors.ts`) con causas comunes y soluciones recomendadas.
  - Botón de copiado de clave de acceso y número de autorización.

---

## 4. Checklist para Nuevas Vistas o Refactorizaciones

Antes de dar por completado un módulo:
1. [ ] ¿Usa las clases de contenedor `.crud-page`, `.crud-page-header`, `.crud-title`?
2. [ ] ¿Las tarjetas superiores usan `.crud-kpi-grid` y `.crud-kpi-card`?
3. [ ] ¿La tabla principal usa `.crud-table-card` y `<table class="crud-table">`?
4. [ ] ¿Los botones de acciones en filas usan `.btn-action-icon` (`edit`, `delete`, `sri`, `view`)?
5. [ ] ¿El formulario se abre en página (`.form-page`) con botón "Volver al Listado"?
6. [ ] ¿Los selectores de entidades usan `<AppSelect2>`?
7. [ ] ¿Las notificaciones usan `toast` de `@/utils/toastr` sin alertas fijas en el DOM?
8. [ ] ¿Se verificó que los colores y contrastes se ven nítidos tanto en **Modo Oscuro** como en **Modo Claro**?
9. [ ] ¿El chequeo de tipos (`npm run type-check`) compila con 0 errores?

