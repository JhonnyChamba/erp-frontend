# Estándares de Diseño y Arquitectura Frontend - Deskounta ERP (`erp-frontend`)

Este archivo define las reglas obligatorias de diseño visual, componentes y desarrollo frontend para todos los desarrolladores y agentes de IA en este repositorio.

Para la guía de diseño visual detallada, consulta: [`STYLE_GUIDE.md`](./STYLE_GUIDE.md).

---

## 1. Subagente Especializado: `crud-architect`
Para la generación, mantenimiento o refactorización de cualquier vista CRUD en este frontend, invoca al agente **`crud-architect`**.

---

## 2. Estructura Estándar de una Vista CRUD
Toda vista de gestión (ej. Facturación, Clientes, Inventario, Categorías, Configuración) debe seguir estrictamente este esqueleto visual:

```html
<template>
  <div class="crud-page" :class="{ 'form-open': isFormOpen }">
    <!-- 1. Encabezado de Página -->
    <div class="card rounded-4 border-0 shadow-sm p-4 mb-4 bg-navy-card keep-in-form">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">MÓDULO</span>
          </div>
          <h4 class="crud-title text-white fw-bold mb-0">Título del Módulo</h4>
          <p class="crud-subtitle text-secondary fs-3 mb-0">Descripción concisa de la funcionalidad.</p>
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
      <div class="crud-kpi-card">...</div>
    </div>

    <!-- 3. Tarjeta de Filtros -->
    <div v-show="!isFormOpen" class="card rounded-4 border-0 shadow-sm p-3 mb-4 bg-navy-card">
      <div class="input-group">...</div>
    </div>

    <!-- 4. Tabla Principal con Sticky Header y Spike UI Dropdown -->
    <div v-show="!isFormOpen" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="table-responsive" style="min-height: 400px; padding-bottom: 6rem; overflow-y: auto;">
        <table class="table table-hover align-middle mb-0 crud-table">
          <thead class="table-primary" style="position: sticky; top: 0; z-index: 15;">...</thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <!-- Columnas -->
              <td class="text-end">
                <div class="dropdown">
                  <button class="btn bg-secondary-subtle text-secondary btn-sm dropdown-toggle d-inline-flex align-items-center gap-1 fw-semibold"
                          type="button" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}' aria-expanded="false">
                    <iconify-icon icon="solar:menu-dots-bold" class="fs-4"></iconify-icon>
                    <span>Acciones</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">...</ul>
                </div>
              </td>
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
            <h5 class="fw-bold text-white mb-0">{{ isEditing ? 'Editar Registro' : 'Nuevo Registro' }}</h5>
            <!-- Botón obligatorio Volver al Listado -->
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="closeForm">
              <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
              <span>Volver al Listado</span>
            </button>
          </div>
          <form @submit.prevent="submitForm">...</form>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 3. Reglas Críticas de Diseño y Componentes

1. **Formularios en Página (Sin Modales Flotantes con Fondo Negro)**:
   - Toda creación o edición principal debe abrirse en página con `.form-page` / `.form-page-card` reemplazando la tabla (`v-show="!isFormOpen"`).
   - Siempre debe incluir el botón **"Volver al Listado"** en la esquina superior derecha.
2. **Spike UI Dropdown de Acciones**:
   - Usar un único botón desplegable `... Acciones ▾`.
   - **Obligatorio**: `data-bs-popper-config='{"strategy":"fixed"}'` para que el menú flote libremente sin ser recortado por scrolls.
3. **Sticky Header y Holgura de Tabla**:
   - `thead th` con `position: sticky; top: 0; z-index: 15;` y fondo opaco idéntico al card.
   - Contenedor con `min-height: 400px; padding-bottom: 6rem; overflow-y: auto;`.
4. **Selectores Relacionales**:
   - Usar exclusivamente el componente global `<AppSelect2>` para búsquedas con autocompletado en tiempo real.
5. **Doble Tema (Modo Oscuro / Modo Claro)**:
   - Prohibido el uso de clases fijas como `bg-dark`, `table-dark` o `text-white` sin selector condicional.
   - Utilizar clases semánticas de `crud-theme.css` y variables de Bootstrap.
6. **Notificaciones**:
   - Exclusivamente el servicio `toast` de `@/utils/toastr`. Prohibido crear carteles o banners fijos en el template.
7. **Tipado Estricto**:
   - Todo cambio debe pasar `npm run type-check` (`vue-tsc --build`) con 0 errores.
