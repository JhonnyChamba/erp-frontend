<template>
  <div class="campeonato-page">
    <!-- HEADER DE PÁGINA -->
    <div class="card bg-info-subtle shadow-none position-relative overflow-hidden mb-4 border-0">
      <div class="card-body px-4 py-3">
        <div class="row align-items-center">
          <div class="col-8">
            <h4 class="fw-semibold mb-8 text-dark">Gestión de Campeonato</h4>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><router-link to="/" class="text-muted text-decoration-none">Inicio</router-link></li>
                <li class="breadcrumb-item text-muted">Campeonato</li>
                <li class="breadcrumb-item active text-primary" aria-current="page">{{ activeTabLabel }}</li>
              </ol>
            </nav>
          </div>
          <div class="col-4 text-end">
            <button class="btn btn-primary d-inline-flex align-items-center gap-2" @click="openCreateModal">
              <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑAS DE NAVEGACIÓN DE RECURSOS -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body p-2">
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="tab in allowedTabs"
            :key="tab.id"
            class="btn btn-sm"
            :class="activeTab === tab.id ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- FILTROS Y BÚSQUEDA -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0">
                <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5 text-muted"></iconify-icon>
              </span>
              <input
                type="text"
                v-model="searchQuery"
                class="form-control border-start-0"
                placeholder="Buscar registros..."
                @input="loadData()"
              />
            </div>
          </div>
          <div class="col-md-8 text-end">
            <button class="btn btn-light-secondary d-inline-flex align-items-center gap-1" @click="loadData">
              <iconify-icon icon="solar:restart-bold" class="fs-5"></iconify-icon>
              <span>Refrescar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA DE DATOS -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">Cargando datos...</p>
        </div>

        <div v-else-if="items.length === 0" class="text-center py-5">
          <iconify-icon icon="solar:box-minimalistic-broken" class="display-5 text-muted mb-2"></iconify-icon>
          <p class="text-muted mb-0">No se encontraron registros en {{ activeTabLabel }}</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col" style="width: 80px;">#</th>
                <th v-for="col in columns" :key="col.key" scope="col">{{ col.label }}</th>
                <th scope="col" class="text-end" style="width: 120px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in items" :key="item.id || idx">
                <td>{{ (page - 1) * limit + idx + 1 }}</td>
                <td v-for="col in columns" :key="col.key">
                  <span v-if="col.type === 'boolean'">
                    <span class="badge" :class="item[col.key] ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                      {{ item[col.key] ? 'Activo' : 'Inactivo' }}
                    </span>
                  </span>
                  <span v-else-if="col.type === 'date'">
                    {{ item[col.key] ? new Date(item[col.key]).toLocaleDateString() : '-' }}
                  </span>
                  <span v-else>
                    {{ getNestedValue(item, col.key) || '-' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button class="btn btn-sm btn-light-primary p-1" title="Editar" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-bold" class="fs-5"></iconify-icon>
                    </button>
                    <button class="btn btn-sm btn-light-danger p-1" title="Eliminar" @click="confirmDelete(item.id)">
                      <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN -->
        <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center p-3 border-top">
          <span class="text-muted small">Total: {{ total }} registros (Pág. {{ page }} de {{ totalPages }})</span>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="changePage(page - 1)">
              Anterior
            </button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="page >= totalPages" @click="changePage(page + 1)">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORMULARIO (GENÉRICO PARA CRUD) -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Editar ' + activeTabLabel : 'Nuevo ' + activeTabLabel }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div v-for="field in formFields" :key="field.key" :class="field.colClass || 'col-md-6'">
                <label class="form-label fw-semibold">{{ field.label }}</label>
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
                  <input class="form-check-input" type="checkbox" v-model="formData[field.key]" />
                  <label class="form-check-label">{{ formData[field.key] ? 'Activo' : 'Inactivo' }}</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="saveForm">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
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
  api: any;
  columns: { key: string; label: string; type?: string }[];
  fields: { key: string; label: string; type: string; options?: { label: string; value: any }[]; colClass?: string; placeholder?: string }[];
}

const tabs: TabConfig[] = [
  {
    id: 'teams',
    label: 'Equipos',
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

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const formData = ref<Record<string, any>>({});
const saving = ref(false);

const selectTab = (id: string) => {
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

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  formData.value = {};
  showModal.value = true;
};

const openEditModal = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  formData.value = {};
  isEditing.value = false;
  editingId.value = null;
};

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
    closeModal();
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
  padding-bottom: 2rem;
}
</style>
