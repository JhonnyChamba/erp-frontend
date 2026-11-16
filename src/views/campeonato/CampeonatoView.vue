<template>
  <div class="crud-page invoices-page campeonato-page" :class="{ 'form-open': isFormOpen }">
    <!-- ========================================== -->
    <!-- 1. ENCABEZADO DEL SUBMÓDULO (ESTILO VENTAS) -->
    <!-- ========================================== -->
    <div class="crud-page-header keep-in-form">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-2">
            MOD-010 · CAMPEONATO
          </span>
          <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1 fs-2">
            {{ activeTabLabel.toUpperCase() }}
          </span>
        </div>
        <h2 class="crud-title">{{ activeTabLabel }}</h2>
        <p class="crud-subtitle">
          Gestión y administración de {{ activeTabLabel.toLowerCase() }} en el torneo deportivo.
        </p>
      </div>

      <div class="crud-header-actions">
        <button class="btn btn-secondary d-flex align-items-center gap-2" @click="loadData" :disabled="loading">
          <iconify-icon icon="solar:refresh-line-duotone" :class="{ 'spin-anim': loading }"></iconify-icon>
          <span>Actualizar</span>
        </button>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateForm">
          <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
          <span>+ Nuevo {{ activeTabLabel }}</span>
        </button>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2. FILTROS Y BÚSQUEDA (ESTILO FACTURAS)    -->
    <!-- ========================================== -->
    <div v-show="!isFormOpen" class="crud-filters-card mt-3">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 420px;">
          <div class="input-group">
            <span class="input-group-text">
              <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              :placeholder="'Buscar en ' + activeTabLabel + '...'"
              @input="loadData()"
            />
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            :disabled="loading"
            @click="loadData"
          >
            <iconify-icon icon="solar:refresh-line-duotone" class="fs-4" :class="{ 'spin-anim': loading }"></iconify-icon>
            <span>Refrescar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3. TABLA PRINCIPAL DE DATOS (ESTILO VENTAS)-->
    <!-- ========================================== -->
    <div v-show="!isFormOpen" class="crud-table-card mt-3">
      <div class="table-responsive">
        <table class="crud-table">
          <thead>
            <tr>
              <th scope="col" style="width: 70px;">#</th>
              <th v-for="col in columns" :key="col.key" scope="col">{{ col.label }}</th>
              <th scope="col" class="text-end" style="width: 140px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="columns.length + 2" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando registros de {{ activeTabLabel }}...</span>
              </td>
            </tr>

            <tr v-else-if="items.length === 0">
              <td :colspan="columns.length + 2" class="text-center py-5 text-secondary">
                <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
                <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron registros en {{ activeTabLabel }}</p>
                <p class="mb-0 fs-2 text-muted">Haz clic en <strong>+ Nuevo {{ activeTabLabel }}</strong> para registrar el primero.</p>
              </td>
            </tr>

            <tr v-for="(item, idx) in items" :key="item.id || idx">
              <td class="text-muted font-monospace">{{ (page - 1) * limit + idx + 1 }}</td>
              <td v-for="col in columns" :key="col.key">
                <span v-if="col.type === 'boolean'">
                  <span
                    class="badge font-monospace"
                    :class="item[col.key] ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  >
                    {{ item[col.key] ? 'Activo' : 'Inactivo' }}
                  </span>
                </span>
                <span v-else-if="col.type === 'date'">
                  <span class="badge bg-secondary-subtle text-secondary font-monospace">
                    {{ item[col.key] ? new Date(item[col.key]).toLocaleDateString() : '-' }}
                  </span>
                </span>
                <span v-else class="text-body-emphasis fw-medium">
                  {{ getNestedValue(item, col.key) || '-' }}
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
                    <!-- Editar -->
                    <li>
                      <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openEditForm(item)">
                        <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar</span>
                      </a>
                    </li>

                    <!-- Separador -->
                    <li><hr class="dropdown-divider"></li>

                    <!-- Eliminar -->
                    <li>
                      <a class="dropdown-item py-2 text-danger d-flex align-items-center gap-2" href="javascript:void(0)" @click="confirmDelete(item.id)">
                        <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5 text-danger"></iconify-icon>
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

      <!-- PAGINACIÓN -->
      <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center p-3 border-top border-dark-subtle">
        <span class="text-muted small">Total: {{ total }} registros (Pág. {{ page }} de {{ totalPages }})</span>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary rounded-start-pill px-3" :disabled="page <= 1" @click="changePage(page - 1)">
            Anterior
          </button>
          <button class="btn btn-sm btn-outline-secondary rounded-end-pill px-3" :disabled="page >= totalPages" @click="changePage(page + 1)">
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- 4. FORMULARIO NORMAL EN PÁGINA (100% ANCHO, ESTILO FACTURACIÓN)-->
    <!-- ============================================================== -->
    <div v-if="isFormOpen" id="form-page" class="form-page">
      <div class="form-page-card">
        <!-- CABECERA DEL FORMULARIO -->
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2 font-monospace">
                MOD-010 · CAMPEONATO
              </span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2 font-monospace">
                {{ isEditing ? 'MODIFICACIÓN' : 'REGISTRO' }}
              </span>
            </div>
            <h3 class="crud-title mb-0">
              {{ isEditing ? `Modificar ${activeTabLabel}` : `Nuevo ${activeTabLabel}` }}
            </h3>
            <p class="crud-subtitle">
              Completa los campos requeridos para {{ isEditing ? 'actualizar' : 'crear' }} el registro en el sistema.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            @click="closeForm"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <!-- CUERPO DEL FORMULARIO -->
        <form @submit.prevent="saveForm">
          <div class="form-page-body">
            <div class="row g-4">
              <div v-for="field in formFields" :key="field.key" :class="field.colClass || 'col-md-6'">
                <label class="form-label text-secondary small fw-semibold">{{ field.label }}</label>
                <input
                  v-if="field.type === 'text' || field.type === 'number' || field.type === 'date'"
                  :type="field.type"
                  v-model="formData[field.key]"
                  class="form-control"
                  :placeholder="field.placeholder || ''"
                />
                <select
                  v-else-if="field.type === 'select'"
                  v-model="formData[field.key]"
                  class="form-select"
                >
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <div v-else-if="field.type === 'boolean'" class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" v-model="formData[field.key]" :id="'field_' + field.key" />
                  <label class="form-check-label text-body-emphasis fw-semibold small ms-2" :for="'field_' + field.key">
                    {{ formData[field.key] ? 'Habilitado / Activo' : 'Deshabilitado / Inactivo' }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- PIE DE ACCIONES DEL FORMULARIO -->
          <div class="form-page-footer">
            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              @click="closeForm"
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
              <span>{{ saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar ' + activeTabLabel) }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CampeonatoApi } from '@/services/campeonato.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/utils/toastr';

interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  api: any;
  columns: { key: string; label: string; type?: string }[];
  fields: { key: string; label: string; type: string; options?: { label: string; value: any }[]; colClass?: string; placeholder?: string }[];
}

const tabs: TabConfig[] = [
  {
    id: 'teams',
    label: 'Equipos',
    icon: 'solar:shield-bold-duotone',
    api: CampeonatoApi.teams,
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'shortName', label: 'Nombre Corto' },
      { key: 'acronyms', label: 'Siglas' },
      { key: 'city', label: 'Ciudad' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombre del Equipo', type: 'text', colClass: 'col-md-6' },
      { key: 'shortName', label: 'Nombre Corto', type: 'text', colClass: 'col-md-6' },
      { key: 'acronyms', label: 'Siglas', type: 'text', colClass: 'col-md-4' },
      { key: 'city', label: 'Ciudad', type: 'text', colClass: 'col-md-4' },
      { key: 'neighborhood', label: 'Barrio / Sector', type: 'text', colClass: 'col-md-4' },
      { key: 'color1', label: 'Color Principal', type: 'text', colClass: 'col-md-4', placeholder: '#FFFFFF' },
      { key: 'color2', label: 'Color Secundario', type: 'text', colClass: 'col-md-4' },
      { key: 'representativePhone', label: 'Teléfono Rep.', type: 'text', colClass: 'col-md-4' },
      { key: 'isActive', label: 'Activo', type: 'boolean', colClass: 'col-md-12' },
    ],
  },
  {
    id: 'players',
    label: 'Jugadores',
    icon: 'solar:users-group-two-rounded-bold-duotone',
    api: CampeonatoApi.players,
    columns: [
      { key: 'name', label: 'Nombres' },
      { key: 'lastName', label: 'Apellidos' },
      { key: 'identification', label: 'Identificación' },
      { key: 'demarcation.name', label: 'Demarcación' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombres', type: 'text', colClass: 'col-md-6' },
      { key: 'lastName', label: 'Apellidos', type: 'text', colClass: 'col-md-6' },
      { key: 'identification', label: 'Cédula / DNI', type: 'text', colClass: 'col-md-6' },
      { key: 'jerseyNumber', label: 'Dorsal habitual', type: 'number', colClass: 'col-md-6' },
      { key: 'phone', label: 'Teléfono', type: 'text', colClass: 'col-md-6' },
      { key: 'email', label: 'Correo', type: 'text', colClass: 'col-md-6' },
      { key: 'isActive', label: 'Activo', type: 'boolean', colClass: 'col-md-12' },
    ],
  },
  {
    id: 'categories',
    label: 'Categorías',
    icon: 'solar:medal-star-bold-duotone',
    api: CampeonatoApi.categories,
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'code', label: 'Código' },
      { key: 'gender', label: 'Género' },
      { key: 'minAge', label: 'Edad Mín.' },
      { key: 'maxAge', label: 'Edad Máx.' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de la Categoría', type: 'text', colClass: 'col-md-6' },
      { key: 'code', label: 'Código', type: 'text', colClass: 'col-md-6' },
      {
        key: 'gender',
        label: 'Género',
        type: 'select',
        options: [
          { label: 'Masculino', value: 'MALE' },
          { label: 'Femenino', value: 'FEMALE' },
          { label: 'Mixto', value: 'MIXED' },
        ],
        colClass: 'col-md-4',
      },
      { key: 'minAge', label: 'Edad Mínima', type: 'number', colClass: 'col-md-4' },
      { key: 'maxAge', label: 'Edad Máxima', type: 'number', colClass: 'col-md-4' },
    ],
  },
  {
    id: 'categoryEditions',
    label: 'Ediciones de Categoría',
    icon: 'solar:calendar-date-bold-duotone',
    api: CampeonatoApi.categoryEditions,
    columns: [
      { key: 'name', label: 'Nombre Edición' },
      { key: 'category.name', label: 'Categoría' },
      { key: 'status', label: 'Estado' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
      { key: 'endDate', label: 'Fecha Fin', type: 'date' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de Edición', type: 'text', colClass: 'col-md-6' },
      { key: 'categoryId', label: 'ID Categoría', type: 'text', colClass: 'col-md-6' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date', colClass: 'col-md-6' },
      { key: 'endDate', label: 'Fecha Fin', type: 'date', colClass: 'col-md-6' },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        options: [
          { label: 'Pendiente', value: 'PENDING' },
          { label: 'En Curso', value: 'IN_PROGRESS' },
          { label: 'Completada', value: 'COMPLETED' },
          { label: 'Cancelada', value: 'CANCELLED' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'registrationFee', label: 'Costo Inscripción', type: 'number', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'stages',
    label: 'Etapas / Fases',
    icon: 'solar:cup-first-bold-duotone',
    api: CampeonatoApi.stages,
    columns: [
      { key: 'name', label: 'Nombre Etapa' },
      { key: 'categoryEdition.name', label: 'Edición' },
      { key: 'stageOrder', label: 'Orden' },
      { key: 'format', label: 'Formato' },
    ],
    fields: [
      { key: 'name', label: 'Nombre Etapa', type: 'text', colClass: 'col-md-6' },
      { key: 'categoryEditionId', label: 'ID Edición Categoría', type: 'text', colClass: 'col-md-6' },
      { key: 'stageOrder', label: 'Orden de Etapa', type: 'number', colClass: 'col-md-4' },
      {
        key: 'format',
        label: 'Formato',
        type: 'select',
        options: [
          { label: 'Todos contra Todos', value: 'EVERYONE_AGAINST_EVERYONE' },
          { label: 'Eliminación Directa', value: 'DIRECT_ELIMINATION' },
          { label: 'Doble Eliminación', value: 'DOUBLE_ELIMINATION' },
        ],
        colClass: 'col-md-8',
      },
    ],
  },
  {
    id: 'scenaries',
    label: 'Escenarios / Canchas',
    icon: 'solar:map-point-wave-bold-duotone',
    api: CampeonatoApi.scenaries,
    columns: [
      { key: 'name', label: 'Nombre Cancha' },
      { key: 'location', label: 'Ubicación' },
      { key: 'surfaceType', label: 'Superficie' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombre del Escenario', type: 'text', colClass: 'col-md-6' },
      { key: 'location', label: 'Ubicación', type: 'text', colClass: 'col-md-6' },
      {
        key: 'surfaceType',
        label: 'Tipo de Superficie',
        type: 'select',
        options: [
          { label: 'Césped Sintético', value: 'SYNTHETIC' },
          { label: 'Césped Natural', value: 'NATURAL_GRASS' },
          { label: 'Tierra', value: 'DIRT' },
          { label: 'Parquet / Cemento', value: 'PARQUET_CONCRETE' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'isActive', label: 'Activo', type: 'boolean', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'positions',
    label: 'Cargos / Roles',
    icon: 'solar:user-id-bold-duotone',
    api: CampeonatoApi.positions,
    columns: [
      { key: 'name', label: 'Cargo' },
      { key: 'code', label: 'Código' },
      { key: 'scope', label: 'Ámbito' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombre del Cargo', type: 'text', colClass: 'col-md-6' },
      { key: 'code', label: 'Código', type: 'text', colClass: 'col-md-6' },
      {
        key: 'scope',
        label: 'Ámbito',
        type: 'select',
        options: [
          { label: 'Campeonato / Torneo', value: 'TOURNAMENT' },
          { label: 'Equipo', value: 'TEAM' },
          { label: 'Arbitral', value: 'ARBITRAL' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'isActive', label: 'Activo', type: 'boolean', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'demarcations',
    label: 'Demarcaciones',
    icon: 'solar:running-bold-duotone',
    api: CampeonatoApi.demarcations,
    columns: [
      { key: 'name', label: 'Posición en Campo' },
      { key: 'code', label: 'Código' },
      { key: 'zone', label: 'Zona' },
      { key: 'order', label: 'Orden' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de la Demarcación', type: 'text', colClass: 'col-md-6' },
      { key: 'code', label: 'Código Único', type: 'text', colClass: 'col-md-6' },
      {
        key: 'zone',
        label: 'Zona',
        type: 'select',
        options: [
          { label: 'Portero', value: 'GOALKEEPER' },
          { label: 'Defensa', value: 'DEFENDER' },
          { label: 'Mediocampista', value: 'MIDFIELDER' },
          { label: 'Delantero', value: 'FORWARD' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'order', label: 'Orden', type: 'number', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'referees',
    label: 'Árbitros',
    icon: 'solar:whistle-bold-duotone',
    api: CampeonatoApi.referees,
    columns: [
      { key: 'name', label: 'Nombres' },
      { key: 'lastName', label: 'Apellidos' },
      { key: 'identification', label: 'Identificación' },
      { key: 'category', label: 'Categoría' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombres', type: 'text', colClass: 'col-md-6' },
      { key: 'lastName', label: 'Apellidos', type: 'text', colClass: 'col-md-6' },
      { key: 'identification', label: 'Identificación', type: 'text', colClass: 'col-md-6' },
      { key: 'category', label: 'Categoría (FIFA, Nacional, Local)', type: 'text', colClass: 'col-md-6' },
      { key: 'phone', label: 'Teléfono', type: 'text', colClass: 'col-md-6' },
      { key: 'isActive', label: 'Activo', type: 'boolean', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'vocals',
    label: 'Vocales',
    icon: 'solar:notes-bold-duotone',
    api: CampeonatoApi.vocals,
    columns: [
      { key: 'name', label: 'Nombres' },
      { key: 'lastName', label: 'Apellidos' },
      { key: 'identification', label: 'Identificación' },
      { key: 'team.name', label: 'Equipo Asignado' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombres', type: 'text', colClass: 'col-md-6' },
      { key: 'lastName', label: 'Apellidos', type: 'text', colClass: 'col-md-6' },
      { key: 'identification', label: 'Identificación', type: 'text', colClass: 'col-md-6' },
      { key: 'teamId', label: 'ID de Equipo (Opcional)', type: 'text', colClass: 'col-md-6' },
      { key: 'isActive', label: 'Activo', type: 'boolean', colClass: 'col-md-12' },
    ],
  },
  {
    id: 'matches',
    label: 'Partidos',
    icon: 'solar:football-bold-duotone',
    api: CampeonatoApi.matches,
    columns: [
      { key: 'localTeam.name', label: 'Local' },
      { key: 'homeGoals', label: 'GL' },
      { key: 'awayGoals', label: 'GV' },
      { key: 'awayTeam.name', label: 'Visita' },
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { key: 'stageId', label: 'ID Etapa', type: 'text', colClass: 'col-md-6' },
      { key: 'scenaryId', label: 'ID Escenario', type: 'text', colClass: 'col-md-6' },
      { key: 'localTeamId', label: 'ID Equipo Local', type: 'text', colClass: 'col-md-6' },
      { key: 'awayTeamId', label: 'ID Equipo Visita', type: 'text', colClass: 'col-md-6' },
      { key: 'date', label: 'Fecha y Hora', type: 'date', colClass: 'col-md-6' },
      { key: 'roundNumber', label: 'Jornada / Fecha #', type: 'number', colClass: 'col-md-6' },
      { key: 'homeGoals', label: 'Goles Local', type: 'number', colClass: 'col-md-6' },
      { key: 'awayGoals', label: 'Goles Visita', type: 'number', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'sanctions',
    label: 'Sanciones',
    icon: 'solar:danger-triangle-bold-duotone',
    api: CampeonatoApi.sanctions,
    columns: [
      { key: 'player.name', label: 'Jugador' },
      { key: 'type', label: 'Tipo Sanción' },
      { key: 'matchesSuspended', label: 'Partidos Susp.' },
      { key: 'fineAmount', label: 'Multa ($)' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { key: 'playerId', label: 'ID Jugador', type: 'text', colClass: 'col-md-6' },
      { key: 'matchId', label: 'ID Partido (Opcional)', type: 'text', colClass: 'col-md-6' },
      {
        key: 'type',
        label: 'Tipo de Sanción',
        type: 'select',
        options: [
          { label: 'Acumulación Amarillas', value: 'YELLOW_CARD_ACCUMULATION' },
          { label: 'Roja Directa', value: 'RED_CARD_DIRECT' },
          { label: 'Doble Amarilla', value: 'DOUBLE_YELLOW' },
          { label: 'Agresión Física', value: 'PHYSICAL_AGGRESSION' },
          { label: 'Agresión Verbal', value: 'VERBAL_AGGRESSION' },
          { label: 'Infracción al Reglamento', value: 'REGULATION_INFRACTION' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'matchesSuspended', label: 'Partidos Suspendido', type: 'number', colClass: 'col-md-6' },
      { key: 'fineAmount', label: 'Valor de Multa ($)', type: 'number', colClass: 'col-md-6' },
      { key: 'description', label: 'Descripción', type: 'text', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'payments',
    label: 'Pagos / Finanzas',
    icon: 'solar:wallet-money-bold-duotone',
    api: CampeonatoApi.payments,
    columns: [
      { key: 'concept', label: 'Concepto' },
      { key: 'amount', label: 'Monto ($)' },
      { key: 'paymentMethod', label: 'Método' },
      { key: 'receiptNumber', label: '# Recibo' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      {
        key: 'concept',
        label: 'Concepto de Pago',
        type: 'select',
        options: [
          { label: 'Inscripción', value: 'REGISTRATION_FEE' },
          { label: 'Garantía', value: 'GUARANTEE_FEE' },
          { label: 'Arbitraje', value: 'MATCH_ARBITRATION' },
          { label: 'Multa / Sanción', value: 'SANCTION_FINE' },
          { label: 'Carnetización', value: 'CARNET_ISSUANCE' },
          { label: 'Otro', value: 'OTHER' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'amount', label: 'Monto ($)', type: 'number', colClass: 'col-md-6' },
      {
        key: 'paymentMethod',
        label: 'Método de Pago',
        type: 'select',
        options: [
          { label: 'Efectivo', value: 'CASH' },
          { label: 'Transferencia Bancaria', value: 'BANK_TRANSFER' },
          { label: 'Tarjeta de Crédito', value: 'CREDIT_CARD' },
          { label: 'Tarjeta de Débito', value: 'DEBIT_CARD' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'receiptNumber', label: 'Número de Recibo', type: 'text', colClass: 'col-md-6' },
      { key: 'notes', label: 'Notas / Observaciones', type: 'text', colClass: 'col-md-12' },
    ],
  },
];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Filtrar las pestañas según los permisos / submódulos activos de la empresa
const allowedTabs = computed(() => {
  const isSuper = Boolean(authStore.tokenPayload?.super_admin || authStore.accessInfo?.isSuperAdmin);
  if (isSuper) return tabs;

  const allowedUrls = (authStore.accessInfo?.allowedUrls || []).map((u) => u.toLowerCase());
  const menu = authStore.accessInfo?.menu || [];
  const campMenu = menu.find((m) => m.code === 'MOD-010' || m.description?.toLowerCase().includes('campeonato'));
  const subUrls = (campMenu?.children || []).map((c) => (c.url || '').toLowerCase());

  // Si no hay restricciones explícitas o tiene el módulo de campeonato completo asignado
  if (allowedUrls.length === 0 && subUrls.length === 0) return tabs;

  return tabs.filter((t) => {
    const tabUrl = `/campeonato?tab=${t.id}`.toLowerCase();
    return (
      allowedUrls.some((u) => u.includes(`tab=${t.id.toLowerCase()}`) || u === tabUrl) ||
      subUrls.some((u) => u.includes(`tab=${t.id.toLowerCase()}`) || u === tabUrl)
    );
  });
});

const activeTab = ref('teams');
const currentTabConfig = computed<TabConfig>(() => {
  const currentList = allowedTabs.value.length > 0 ? allowedTabs.value : tabs;
  return currentList.find((t) => t.id === activeTab.value) ?? currentList[0]!;
});
const activeTabLabel = computed(() => currentTabConfig.value.label);
const columns = computed(() => currentTabConfig.value.columns);
const formFields = computed(() => currentTabConfig.value.fields);

const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const totalPages = ref(1);
const searchQuery = ref('');
const loading = ref(false);

const isFormOpen = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const formData = ref<Record<string, any>>({});
const saving = ref(false);

const selectTab = (id: string) => {
  closeForm();
  activeTab.value = id;
  page.value = 1;
  searchQuery.value = '';
  router.replace({ path: '/campeonato', query: { tab: id } });
  loadData();
};

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const loadData = async () => {
  try {
    loading.value = true;
    const res = await currentTabConfig.value.api.list({
      page: page.value,
      limit: limit.value,
      search: searchQuery.value,
    });
    items.value = res.data.data || [];
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 1;
  } catch (err: any) {
    console.error(err);
    toast.error('Error al cargar datos de ' + activeTabLabel.value);
  } finally {
    loading.value = false;
  }
};

const changePage = (p: number) => {
  page.value = p;
  loadData();
};

const openCreateForm = () => {
  isEditing.value = false;
  editingId.value = null;
  formData.value = {};
  isFormOpen.value = true;
  showModal.value = true;
};

const openEditForm = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  isFormOpen.value = true;
  showModal.value = true;
};

const closeForm = () => {
  isFormOpen.value = false;
  showModal.value = false;
  formData.value = {};
  isEditing.value = false;
  editingId.value = null;
};

const openCreateModal = openCreateForm;
const openEditModal = openEditForm;
const closeModal = closeForm;

const saveForm = async () => {
  try {
    saving.value = true;
    if (isEditing.value && editingId.value) {
      await currentTabConfig.value.api.update(editingId.value, formData.value);
      toast.success('Registro actualizado exitosamente');
    } else {
      await currentTabConfig.value.api.create(formData.value);
      toast.success('Registro creado exitosamente');
    }
    closeForm();
    loadData();
  } catch (err: any) {
    console.error(err);
    toast.error('Error al guardar el registro');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este registro?')) return;
  try {
    await currentTabConfig.value.api.delete(id);
    toast.success('Registro eliminado');
    loadData();
  } catch (err: any) {
    console.error(err);
    toast.error('Error al eliminar el registro');
  }
};

const slugToTab: Record<string, string> = {
  equipos: 'teams',
  teams: 'teams',
  jugadores: 'players',
  players: 'players',
  categorias: 'categories',
  categories: 'categories',
  ediciones: 'categoryEditions',
  categoryEditions: 'categoryEditions',
  etapas: 'stages',
  stages: 'stages',
  escenarios: 'scenaries',
  scenaries: 'scenaries',
  'inscripciones-equipos': 'teamRegistrations',
  teamRegistrations: 'teamRegistrations',
  'inscripciones-jugadores': 'playerRegistrations',
  playerRegistrations: 'playerRegistrations',
  arbitros: 'referees',
  referees: 'referees',
  vocales: 'vocals',
  vocals: 'vocals',
  partidos: 'matches',
  matches: 'matches',
  sanciones: 'sanctions',
  sanctions: 'sanctions',
  pagos: 'payments',
  payments: 'payments',
  cargos: 'positions',
  positions: 'positions',
  demarcaciones: 'demarcations',
  demarcations: 'demarcations',
  comite: 'committees',
  committees: 'committees',
  directivos: 'teamManagements',
  teamManagements: 'teamManagements',
};

const resolveTabFromRoute = (): string => {
  const queryTab = route.query.tab as string;
  if (queryTab && slugToTab[queryTab]) return slugToTab[queryTab];

  const subParam = route.params.sub as string;
  if (subParam && slugToTab[subParam]) return slugToTab[subParam];

  if (allowedTabs.value.length > 0) return allowedTabs.value[0]!.id;
  return 'teams';
};

onMounted(() => {
  activeTab.value = resolveTabFromRoute();
  loadData();
});

watch(
  () => [route.query.tab, route.params.sub],
  () => {
    const targetTab = resolveTabFromRoute();
    if (targetTab !== activeTab.value) {
      activeTab.value = targetTab;
      page.value = 1;
      searchQuery.value = '';
      loadData();
    }
  }
);
</script>

<style scoped>
.campeonato-page {
  padding-bottom: 2.5rem;
  animation: crudFadeIn 0.25s ease-in-out;
}

@keyframes crudFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.crud-tabs-card {
  background: var(--bs-card-bg, #111c2d);
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.form-page {
  animation: crudFadeIn 0.2s ease-in-out;
}
</style>
