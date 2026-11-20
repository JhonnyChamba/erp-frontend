<template>
  <div class="crud-page-wrapper">
    <!-- VISTA 1: LISTADO (TABLAS Y FILTROS) -->
    <div v-if="!showModal" class="card rounded-4 border shadow-sm p-4 bg-navy-card">
      <!-- Encabezado con Botón de Acción -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h5 class="fw-bold text-body-emphasis mb-1 d-flex align-items-center gap-2">
            <iconify-icon :icon="currentMeta.icon" class="fs-4 text-primary"></iconify-icon>
            <span>{{ currentMeta.title }}</span>
          </h5>
          <small class="text-secondary">{{ currentMeta.subtitle }}</small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button
            v-if="tab !== 'global_players'"
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
            class="btn btn-primary d-flex align-items-center gap-1 rounded-pill px-3 fw-semibold shadow-sm text-nowrap"
            @click="openCreateModal"
          >
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
            <span>{{ tab === 'global_players' ? 'Nuevo' : `+ Nuevo ${currentMeta.entityName}` }}</span>
          </button>
        </div>
      </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-body-tertiary border border-secondary-subtle">
      <div v-if="tab !== 'global_players'" class="input-group flex-grow-1" style="max-width: 380px;">
        <span class="input-group-text bg-body border-secondary-subtle text-secondary" style="height: 40px;">
          <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control bg-body border-secondary-subtle text-body"
          style="height: 40px;"
          :placeholder="`Buscar en ${currentMeta.title.toLowerCase()}...`"
          @input="onSearchInput"
        />
      </div>
      <!-- Filtros de Futbolistas: se aplican con el botón Buscar -->
      <template v-if="tab === 'global_players'">
        <select
          v-model="filterStatus"
          class="form-select bg-body border-secondary-subtle text-body"
          style="height: 40px; width: 160px;"
          @keyup.enter="loadData"
        >
          <option value="">Estado: Todos</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        <input
          v-model="filterIdentification"
          type="text"
          class="form-control bg-body border-secondary-subtle text-body"
          style="height: 40px; width: 190px;"
          placeholder="Número de documento"
          @keyup.enter="loadData"
        />
        <input
          v-model="filterName"
          type="text"
          class="form-control bg-body border-secondary-subtle text-body"
          style="height: 40px; width: 190px;"
          placeholder="Nombre"
          @keyup.enter="loadData"
        />
        <input
          v-model="filterLastName"
          type="text"
          class="form-control bg-body border-secondary-subtle text-body"
          style="height: 40px; width: 190px;"
          placeholder="Apellido"
          @keyup.enter="loadData"
        />
      </template>
      <button
        v-if="tab === 'global_players'"
        type="button"
        class="btn btn-outline-primary bg-body d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="loadData"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
      <div v-if="tab !== 'global_players'" class="pe-2 text-secondary fs-2 d-none d-sm-block ms-auto">
        Total: <span class="text-body fw-bold">{{ items.length }}</span> registro(s)
      </div>
    </div>

    <!-- TABLA 0: PADRÓN GLOBAL DE FUTBOLISTAS -->
    <div v-if="tab === 'global_players'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Foto</th>
            <th>Código</th>
            <th>Cédula / DNI</th>
            <th>Nombres y Apellidos</th>
            <th>Edad</th>
            <th>Demarcación</th>
            <th>Clasificación</th>
            <th>Contacto</th>
            <th class="text-center">Estado</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="10" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando padrón global de futbolistas...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="10" class="py-4 text-secondary">No hay futbolistas registrados en el padrón global.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td>
              <img
                v-if="item.photo"
                :src="item.photo"
                alt="Foto"
                class="rounded-circle border border-primary"
                style="width: 38px; height: 38px; object-fit: cover;"
              />
              <div
                v-else
                class="rounded-circle bg-dark-subtle text-secondary d-flex align-items-center justify-content-center"
                style="width: 38px; height: 38px;"
              >
                <iconify-icon icon="solar:user-bold" class="fs-5"></iconify-icon>
              </div>
            </td>
            <td>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                {{ item.code || '-' }}
              </span>
            </td>
            <td class="font-monospace fw-medium text-white-50">{{ item.identification }}</td>
            <td class="fw-bold text-white">{{ item.name }} {{ item.lastName }}</td>
            <td>
              <span v-if="item.ageYears" class="badge bg-info-subtle text-info font-monospace px-2 py-1">
                {{ item.ageYears }} años
              </span>
              <span v-else class="text-muted small">-</span>
            </td>
            <td>
              <span v-if="item.demarcation?.name" class="badge bg-secondary-subtle text-secondary px-2 py-1">
                🏃 {{ item.demarcation.name }}
              </span>
              <span v-else class="text-muted small">-</span>
            </td>
            <td>
              <span v-if="item.playerClassification?.description" class="badge bg-secondary-subtle text-secondary px-2 py-1">
                🏷️ {{ item.playerClassification.description }}
              </span>
              <span v-else class="text-muted small">-</span>
            </td>
            <td>
              <div class="small">
                <span v-if="item.phone" class="d-block text-secondary">📞 {{ item.phone }}</span>
                <span v-if="item.email" class="d-block text-secondary">✉️ {{ item.email }}</span>
                <span v-if="!item.phone && !item.email" class="text-muted">-</span>
              </div>
            </td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar Futbolista</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id, true)">
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

    <!-- TABLA 1: GREMIOS ARBITRALES -->
    <div v-else-if="tab === 'referee_guilds'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>#</th>
            <th>Descripción / Nombre</th>
            <th>Siglas</th>
            <th class="text-center">Estado</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="5" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando gremios arbitrales...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="5" class="py-4 text-secondary">No hay gremios arbitrales registrados.</td>
          </tr>
          <tr v-for="(item, idx) in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="text-secondary">{{ idx + 1 }}</td>
            <td>
              <span class="fw-bold text-white">{{ item.description }}</span>
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.acronyms || '-' }}
              </span>
            </td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id)">
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

    <!-- TABLA 2: PADRÓN GLOBAL DE ÁRBITROS -->
    <div v-else-if="tab === 'global_referees'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Documento / Cédula</th>
            <th>Nombre Completo</th>
            <th>Gremio / Núcleo</th>
            <th>Contacto</th>
            <th class="text-center">Estado</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="6" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando padrón global de árbitros...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="6" class="py-4 text-secondary">No hay árbitros registrados en el padrón global.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                {{ item.identification }}
              </span>
            </td>
            <td class="fw-bold text-white">
              {{ item.name }} {{ item.lastName }}
            </td>
            <td>
              <span v-if="item.guild?.description" class="badge bg-secondary-subtle text-secondary px-2 py-1">
                🏛️ {{ item.guild.description }} <span v-if="item.guild.acronyms">({{ item.guild.acronyms }})</span>
              </span>
              <span v-else class="text-muted small">Independiente</span>
            </td>
            <td>
              <div class="small">
                <span v-if="item.phone" class="d-block text-secondary">📞 {{ item.phone }}</span>
                <span v-if="item.email" class="d-block text-secondary">✉️ {{ item.email }}</span>
                <span v-if="!item.phone && !item.email" class="text-muted">-</span>
              </div>
            </td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar Futbolista</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id, true)">
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

    <!-- TABLA 3: CLASIFICACIÓN DE FUTBOLISTAS -->
    <div v-else-if="tab === 'player_classifications'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Descripción / Nombre</th>
            <th>Código</th>
            <th>Observación</th>
            <th class="text-center">Estado</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="5" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando clasificaciones...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="5" class="py-4 text-secondary">No hay clasificaciones de futbolistas registradas.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="fw-bold text-white">
              🏷️ {{ item.description }}
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.code || '-' }}
              </span>
            </td>
            <td class="text-secondary small">{{ item.observation || '-' }}</td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id)">
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

    <!-- TABLA 4: DEMARCACIONES -->
    <div v-else-if="tab === 'demarcations'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Posición en Campo</th>
            <th>Código</th>
            <th>Zona de Juego</th>
            <th>Límite Máx. x Equipo</th>
            <th class="text-center">Orden</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="6" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando demarcaciones...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="6" class="py-4 text-secondary">No hay demarcaciones registradas.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="fw-bold text-white">
              🏃 {{ item.name }}
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.code }}
              </span>
            </td>
            <td>
              <span class="badge bg-info-subtle text-info px-2 py-1">
                {{ getZoneLabel(item.zone) }}
              </span>
            </td>
            <td>
              <span v-if="item.maxPlayers && Number(item.maxPlayers) > 0" class="badge bg-warning-subtle text-warning font-monospace px-2 py-1">
                Máx. {{ item.maxPlayers }}
              </span>
              <span v-else class="text-muted small">Sin límite</span>
            </td>
            <td class="text-center font-monospace">{{ item.order ?? '-' }}</td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id)">
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

    <!-- TABLA 5: FORMATOS DE DISPUTA -->
    <div v-if="tab === 'stage_formats'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Código</th>
            <th>Nombre del Formato</th>
            <th>Tipo Principal</th>
            <th>Vueltas / Modalidad</th>
            <th>Desempate Play-offs</th>
            <th>Grupos</th>
            <th class="text-center">Estado</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="8" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando formatos de disputa...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="8" class="py-4 text-secondary">No hay formatos de disputa registrados.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.code || '-' }}
              </span>
            </td>
            <td>
              <div class="fw-bold text-white">{{ item.name }}</div>
              <small v-if="item.description" class="text-secondary d-block">{{ item.description }}</small>
            </td>
            <td>
              <span
                v-if="item.formatType === 'EVERYONE_AGAINST_EVERYONE'"
                class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"
              >
                ⚽ Todos contra Todos
              </span>
              <span
                v-else-if="item.formatType === 'DIRECT_ELIMINATION'"
                class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1"
              >
                🏆 Eliminación Directa
              </span>
              <span
                v-else-if="item.formatType === 'DOUBLE_ELIMINATION'"
                class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1"
              >
                🔄 Doble Eliminación
              </span>
              <span v-else class="badge bg-dark-subtle text-secondary">{{ item.formatType }}</span>
            </td>
            <td>
              <span v-if="item.defaultLaps === 2" class="badge bg-info-subtle text-info font-monospace">2 Vueltas (Ida y Vuelta)</span>
              <span v-else class="badge bg-secondary-subtle text-secondary font-monospace">1 Sola Vuelta (Partido Único)</span>
            </td>
            <td>
              <span v-if="item.defaultTieBreaker === 'PENALTIES'" class="badge bg-success-subtle text-success">Penales Directos</span>
              <span v-else-if="item.defaultTieBreaker === 'SPORTING_ADVANTAGE'" class="badge bg-warning-subtle text-warning">Ventaja Deportiva</span>
              <span v-else-if="item.defaultTieBreaker === 'EXTRA_TIME_PENALTIES'" class="badge bg-info-subtle text-info">Tiempo Extra + Penales</span>
              <span v-else class="text-muted small">N/A (Puntos regulares)</span>
            </td>
            <td>
              <span v-if="item.requiresGroups" class="badge bg-primary-subtle text-primary font-monospace">Sí (Series / Grupos)</span>
              <span v-else class="text-muted small">No (Grupo único)</span>
            </td>
            <td class="text-center">
              <span
                class="badge font-monospace px-2 py-1"
                :class="item.isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
              >
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id)">
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

    <!-- TABLAS: TIPOS DE COMPETENCIA, VUELTAS Y CRITERIOS DE DESEMPATE -->
    <div v-else-if="['competition_types', 'competition_laps', 'tie_breaker_criteria'].includes(tab)" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th style="width: 50px;">#</th>
            <th>Descripción / Nombre</th>
            <th>Código / Siglas</th>
            <th v-if="tab === 'competition_laps'" class="text-center">N° Vueltas</th>
            <th>Observación / Regla</th>
            <th class="text-center">Estado</th>
            <th class="text-end" style="width: 70px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td :colspan="tab === 'competition_laps' ? 7 : 6" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando registros...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td :colspan="tab === 'competition_laps' ? 7 : 6" class="py-4 text-secondary">
              No se encontraron registros de {{ currentMeta.title.toLowerCase() }}.
            </td>
          </tr>
          <tr v-for="(item, idx) in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="text-secondary small font-monospace">{{ idx + 1 }}</td>
            <td class="fw-bold text-white">
              <span v-if="tab === 'competition_types'">🏆</span>
              <span v-else-if="tab === 'competition_laps'">🔄</span>
              <span v-else>⚖️</span>
              {{ item.description }}
            </td>
            <td>
              <span v-if="item.code" class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.code }}
              </span>
              <span v-else class="text-muted small">-</span>
            </td>
            <td v-if="tab === 'competition_laps'" class="text-center">
              <span class="badge bg-info-subtle text-info font-monospace px-2 py-1">
                {{ item.numberOfLaps || 1 }} Vuelta(s)
              </span>
            </td>
            <td class="text-secondary small">{{ item.observation || '-' }}</td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <li>
                    <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditModal(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar</span>
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" @click="deleteItem(item.id)">
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
  </div>

    <!-- VISTA 2: FORMULARIO EN PÁGINA (100% ANCHO, NO MODAL) -->
    <div v-else id="form-page" class="form-page">
      <div class="form-page-card">
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
                MOD-010 · CONFIGURACIÓN GLOBAL
              </span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
                {{ isEditing ? 'MODIFICACIÓN' : 'REGISTRO' }}
              </span>
            </div>
            <h3 class="crud-title mb-0">
              {{ isEditing ? `Editar ${currentMeta.entityName}` : `Nuevo ${currentMeta.entityName}` }}
            </h3>
            <p class="crud-subtitle mb-0">
              Completa los campos requeridos para guardar el registro en el sistema.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            @click="closeModal"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <form @submit.prevent="submitForm">
          <div class="form-page-body">
                <!-- FORMULARIO 0: PADRÓN GLOBAL DE FUTBOLISTAS -->
                <div v-if="tab === 'global_players'" class="row g-3">
                  <!-- Foto carnet y vista previa -->
                  <div class="col-12">
                    <div class="d-flex align-items-center gap-3 p-3 bg-dark rounded-3 border border-secondary-subtle">
                      <div class="position-relative">
                        <img
                          v-if="formData.photo"
                          :src="formData.photo"
                          alt="Foto del Jugador"
                          class="rounded-3 border border-2 border-primary"
                          style="width: 70px; height: 85px; object-fit: cover;"
                        />
                        <div
                          v-else
                          class="rounded-3 bg-dark-subtle text-secondary d-flex flex-column align-items-center justify-content-center border border-2 border-dashed border-secondary"
                          style="width: 70px; height: 85px;"
                        >
                          <iconify-icon icon="solar:user-bold" class="fs-2 text-secondary"></iconify-icon>
                          <span style="font-size: 10px;">Foto</span>
                        </div>
                      </div>
                      <div>
                        <h6 class="fw-bold mb-1 text-white">Foto Oficial del Futbolista</h6>
                        <small class="text-secondary d-block mb-2">Para carnetización y validación QR en campeonatos.</small>
                        <div class="d-flex gap-2">
                          <label class="btn btn-sm btn-primary rounded-pill px-3 cursor-pointer d-inline-flex align-items-center gap-1 mb-0">
                            <iconify-icon icon="solar:camera-add-bold" class="fs-5"></iconify-icon>
                            <span>{{ uploadingPhoto ? 'Procesando...' : (formData.photo ? 'Cambiar Foto' : 'Cargar Foto') }}</span>
                            <input type="file" accept="image/*" class="d-none" @change="onPhotoSelected" :disabled="uploadingPhoto" />
                          </label>
                          <button
                            v-if="formData.photo"
                            type="button"
                            class="btn btn-sm btn-outline-danger rounded-pill px-3"
                            @click="formData.photo = ''"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Tipo de Documento *</label>
                    <AppSelect2
                      v-model="formData.documentType"
                      :options="playerDocumentTypeOptions"
                      placeholder="Seleccionar tipo de documento..."
                      search-placeholder="Buscar..."
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Cédula / DNI / Pasaporte *</label>
                    <div class="input-group">
                      <input
                        v-model="formData.identification"
                        type="text"
                        class="form-control bg-dark border-secondary-subtle text-white font-monospace"
                        :placeholder="identificationPlaceholder"
                        :maxlength="isCedulaType ? 10 : undefined"
                        :inputmode="isCedulaType ? 'numeric' : 'text'"
                        required
                        @input="onIdentificationInput"
                        @keyup.enter="consultarCedulaRegistroCivil"
                      />
                      <button
                        type="button"
                        class="btn btn-primary d-inline-flex align-items-center gap-1 px-3"
                        :disabled="consultandoCedula || !formData.identification"
                        @click="consultarCedulaRegistroCivil"
                        title="Consultar por Cédula"
                      >
                        <span v-if="consultandoCedula" class="spinner-border spinner-border-sm" role="status"></span>
                        <iconify-icon v-else icon="solar:magnifer-bold" class="fs-5"></iconify-icon>
                        <span class="d-none d-sm-inline">Consultar</span>
                      </button>
                    </div>
                  </div>

                  <!-- El código secuencial JUG-XXXXX se genera automáticamente en el backend al registrar -->
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Fecha de Nacimiento *</label>
                    <input
                      v-model="formData.birthDate"
                      type="date"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      required
                      @change="onBirthDateChange"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Nombres *</label>
                    <input
                      v-model="formData.name"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Nombres completos"
                      required
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Apellidos *</label>
                    <input
                      v-model="formData.lastName"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Apellidos completos"
                      required
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Teléfono Personal</label>
                    <input
                      v-model="formData.phone"
                      type="text"
                      inputmode="numeric"
                      maxlength="12"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. 0991234567"
                      @input="onlyDigitsInput($event, 'phone')"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Correo Electrónico</label>
                    <input
                      v-model="formData.email"
                      type="email"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      :class="{ 'is-invalid': isPlayerEmailInvalid }"
                      placeholder="futbolista@ejemplo.com"
                    />
                    <div v-if="isPlayerEmailInvalid" class="invalid-feedback d-block">Correo electrónico no válido</div>
                  </div>

                  <div class="col-md-8">
                    <label class="form-label text-secondary small fw-semibold">Dirección</label>
                    <input
                      v-model="formData.address"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Dirección domiciliaria (calle principal, secundaria, sector)"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Contacto de Emergencia</label>
                    <input
                      v-model="formData.emergencyContactName"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Nombre del familiar o contacto"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Teléfono de Emergencia</label>
                    <input
                      v-model="formData.emergencyContactPhone"
                      type="text"
                      inputmode="numeric"
                      maxlength="12"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Teléfono del contacto de emergencia"
                      @input="onlyDigitsInput($event, 'emergencyContactPhone')"
                    />
                  </div>

                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Tipo de Sangre</label>
                    <select v-model="formData.bloodType" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="">-- Seleccionar --</option>
                      <option value="O+">O Positivo (O+)</option>
                      <option value="O-">O Negativo (O-)</option>
                      <option value="A+">A Positivo (A+)</option>
                      <option value="A-">A Negativo (A-)</option>
                      <option value="B+">B Positivo (B+)</option>
                      <option value="B-">B Negativo (B-)</option>
                      <option value="AB+">AB Positivo (AB+)</option>
                      <option value="AB-">AB Negativo (AB-)</option>
                    </select>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Clasificación de Futbolista</label>
                    <select v-model="formData.playerClassificationId" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="">-- Seleccionar Clasificación --</option>
                      <option v-for="c in classificationsList" :key="c.id" :value="c.id">
                        {{ c.description }} {{ c.code ? '(' + c.code + ')' : '' }}
                      </option>
                    </select>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Posición / Demarcación en Campo</label>
                    <select v-model="formData.demarcationId" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="">-- Seleccionar Demarcación --</option>
                      <option v-for="d in demarcationsList" :key="d.id" :value="d.id">
                        {{ d.name }} ({{ d.code }})
                      </option>
                    </select>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Pie Dominante</label>
                    <select v-model="formData.dominantFoot" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="RIGHT">Diestro (Derecho)</option>
                      <option value="LEFT">Zurdo (Izquierdo)</option>
                      <option value="BOTH">Ambidiestro</option>
                    </select>
                  </div>

                  <div v-if="computedPlayerAge" class="col-12">
                    <div class="alert alert-info py-2 px-3 mb-0 rounded-3 border-0 bg-info-subtle text-info-emphasis d-flex align-items-center gap-2">
                      <iconify-icon icon="solar:cake-bold-duotone" class="fs-4 text-info"></iconify-icon>
                      <span class="small">
                        Edad calculada: <strong>{{ computedPlayerAge.years }} años</strong> (en meses: <strong>{{ computedPlayerAge.months }} meses</strong> acumulados)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- FORMULARIO 1: GREMIOS ARBITRALES -->
                <div v-else-if="tab === 'referee_guilds'" class="row g-3">
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Descripción o Nombre del Gremio / Núcleo *</label>
                    <input
                      v-model="formData.description"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Asociación de Árbitros de Pichincha"
                      required
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Siglas o Abreviatura</label>
                    <input
                      v-model="formData.acronyms"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white text-uppercase font-monospace"
                      placeholder="Ej. AAP, NAC"
                    />
                  </div>
                </div>

                <!-- FORMULARIO 2: PADRÓN GLOBAL DE ÁRBITROS -->
                <div v-else-if="tab === 'global_referees'" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Número de Documento / Cédula *</label>
                    <input
                      v-model="formData.identification"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white font-monospace"
                      placeholder="Cédula o pasaporte"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Gremio o Núcleo Arbitral</label>
                    <select v-model="formData.guildId" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="">-- Sin gremio (Independiente) --</option>
                      <option v-for="g in guildsList" :key="g.id" :value="g.id">
                        {{ g.description }} {{ g.acronyms ? '(' + g.acronyms + ')' : '' }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Nombres *</label>
                    <input
                      v-model="formData.name"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Nombres del árbitro"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Apellidos *</label>
                    <input
                      v-model="formData.lastName"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Apellidos del árbitro"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Teléfono Personal</label>
                    <input
                      v-model="formData.phone"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. 0991234567"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Correo Electrónico</label>
                    <input
                      v-model="formData.email"
                      type="email"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="arbitro@ejemplo.com"
                    />
                  </div>
                </div>

                <!-- FORMULARIO 3: CLASIFICACIÓN DE FUTBOLISTAS -->
                <div v-else-if="tab === 'player_classifications'" class="row g-3">
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Descripción / Nombre de Clasificación *</label>
                    <input
                      v-model="formData.description"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Juvenil, Nativo, Foráneo, Extranjero"
                      required
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Código Abreviado</label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white text-uppercase font-monospace"
                      placeholder="Ej. JUV, NAT, FOR"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Observaciones / Reglamento</label>
                    <textarea
                      v-model="formData.observation"
                      rows="2"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Notas o condiciones de esta clasificación..."
                    ></textarea>
                  </div>
                </div>

                <!-- FORMULARIO 4: DEMARCACIONES -->
                <div v-else-if="tab === 'demarcations'" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Nombre de la Demarcación *</label>
                    <input
                      v-model="formData.name"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Delantero Centro"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Código Único *</label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white text-uppercase font-monospace"
                      placeholder="Ej. DEL, ARQ, DEF"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Zona de Juego *</label>
                    <select v-model="formData.zone" class="form-select bg-dark border-secondary-subtle text-white" required>
                      <option value="GOALKEEPER">Portero / Arquero</option>
                      <option value="DEFENDER">Defensa</option>
                      <option value="MIDFIELDER">Mediocampista / Volante</option>
                      <option value="FORWARD">Delantero / Atacante</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Límite Máx. x Equipo</label>
                    <input
                      v-model.number="formData.maxPlayers"
                      type="number"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="0 = Sin límite"
                      min="0"
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Orden</label>
                    <input
                      v-model.number="formData.order"
                      type="number"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                <!-- FORMULARIO 5: FORMATOS DE DISPUTA -->
                <div v-else-if="tab === 'stage_formats'" class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label text-secondary small fw-semibold">Nombre del Formato de Disputa *</label>
                    <input
                      v-model="formData.name"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Todos contra Todos (1 Sola Vuelta), Cuartos y Semis Ida y Vuelta..."
                      required
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Código Único</label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white font-monospace text-uppercase"
                      placeholder="Autogenerado ej. FMT-001"
                      :readonly="isEditing"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Tipo Principal de Competencia *</label>
                    <select v-model="formData.formatType" class="form-select bg-dark border-secondary-subtle text-white" required>
                      <option value="EVERYONE_AGAINST_EVERYONE">⚽ Todos contra Todos (Liga Regular)</option>
                      <option value="DIRECT_ELIMINATION">🏆 Eliminación Directa (Play-offs / Llaves)</option>
                      <option value="DOUBLE_ELIMINATION">🔄 Doble Eliminación</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Vueltas / Modalidad *</label>
                    <select v-model.number="formData.defaultLaps" class="form-select bg-dark border-secondary-subtle text-white" required>
                      <option :value="1">1 Sola Vuelta (Partido Único)</option>
                      <option :value="2">2 Vueltas (Ida y Vuelta)</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Criterio de Desempate</label>
                    <select v-model="formData.defaultTieBreaker" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="PENALTIES">Tiros Penales Directos (Ecuador)</option>
                      <option value="SPORTING_ADVANTAGE">Ventaja Deportiva (Mejor en Tabla)</option>
                      <option value="EXTRA_TIME_PENALTIES">Tiempo Extra + Penales</option>
                      <option value="NONE">Ninguno (Regular por puntos)</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check form-switch mt-2">
                      <input class="form-check-input" type="checkbox" v-model="formData.requiresGroups" id="fmt_requires_groups" />
                      <label class="form-check-label text-white fw-semibold small ms-2" for="fmt_requires_groups">
                        Requiere división por Grupos / Series (Serie A, Serie B...)
                      </label>
                    </div>
                  </div>
                  <div v-if="isEditing" class="col-md-6">
                    <div class="form-check form-switch mt-2">
                      <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="fmt_is_active" />
                      <label class="form-check-label text-white fw-semibold small ms-2" for="fmt_is_active">
                        {{ formData.isActive ? 'Formato Habilitado / Activo' : 'Formato Deshabilitado / Inactivo' }}
                      </label>
                    </div>
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Descripción / Observaciones</label>
                    <textarea
                      v-model="formData.description"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      rows="2"
                      placeholder="Reglas o detalles de cómo se disputa este formato en el torneo..."
                    ></textarea>
                  </div>
                </div>

                <!-- FORMULARIO 6: TIPOS DE COMPETENCIA, VUELTAS Y CRITERIOS DE DESEMPATE -->
                <div v-else-if="['competition_types', 'competition_laps', 'tie_breaker_criteria'].includes(tab)" class="row g-3">
                  <div :class="tab === 'competition_laps' ? 'col-md-6' : 'col-md-8'">
                    <label class="form-label text-secondary small fw-semibold">Descripción / Nombre *</label>
                    <input
                      v-model="formData.description"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      :placeholder="tab === 'competition_types' ? 'Ej. Todos contra Todos (Liga)' : tab === 'competition_laps' ? 'Ej. Ida y Vuelta (2 Vueltas)' : 'Ej. Gol Diferencia (GD)'"
                      required
                    />
                  </div>
                  <div class="col-md-3" v-if="tab === 'competition_laps'">
                    <label class="form-label text-secondary small fw-semibold">Número de Vueltas *</label>
                    <input
                      v-model.number="formData.numberOfLaps"
                      type="number"
                      min="1"
                      class="form-control bg-dark border-secondary-subtle text-white font-monospace text-center"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div :class="tab === 'competition_laps' ? 'col-md-3' : 'col-md-4'">
                    <label class="form-label text-secondary small fw-semibold">Código / Siglas</label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white font-monospace text-uppercase"
                      placeholder="Ej. TODOS_VS_TODOS, GOL_DIF"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Observación / Regla Reglamentaria</label>
                    <textarea
                      v-model="formData.observation"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      rows="3"
                      placeholder="Detalle o descripción explicativa de esta opción reglamentaria..."
                    ></textarea>
                  </div>
                  <div v-if="isEditing" class="col-12">
                    <div class="form-check form-switch mt-1">
                      <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="cat_is_active" />
                      <label class="form-check-label text-white fw-semibold small ms-2" for="cat_is_active">
                        {{ formData.isActive ? 'Registro Habilitado / Activo' : 'Registro Deshabilitado / Inactivo' }}
                      </label>
                    </div>
                  </div>
                </div>
          </div>

          <!-- Estilo de botones de plantilla (solo Futbolistas, para probar) -->
          <div v-if="tab === 'global_players'" class="border-top pt-3 mt-3 pb-4 px-4 d-flex align-items-center justify-content-end gap-3">
            <button type="button" class="btn bg-danger-subtle text-danger" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="saving || uploadingPhoto">
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              {{ isEditing ? 'Guardar Cambios' : 'Registrar' }}
            </button>
          </div>

          <div v-else class="form-page-footer">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" :disabled="saving || uploadingPhoto">
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
              <span>{{ isEditing ? 'Guardar Cambios' : `Registrar ${currentMeta.entityName}` }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CampeonatoApi, uploadPlayerPhoto } from '@/services/campeonato.service';
import { compressImageToWebP } from '@/utils/image-processor';
import { toast } from '@/utils/toastr';
import AppSelect2 from '@/components/common/AppSelect2.vue';

const playerDocumentTypeOptions = [
  { value: '05', label: 'Cédula de Identidad (05)' },
  { value: '06', label: 'Pasaporte (06)' },
  { value: '08', label: 'Identificación del Exterior / DNI (08)' },
];

const props = defineProps<{
  tab:
    | 'referee_guilds'
    | 'global_referees'
    | 'player_classifications'
    | 'demarcations'
    | 'global_players'
    | 'stage_formats'
    | 'competition_types'
    | 'competition_laps'
    | 'tie_breaker_criteria';
}>();

const emit = defineEmits<{
  (e: 'update:formOpen', val: boolean): void;
}>();

const items = ref<any[]>([]);
const guildsList = ref<any[]>([]);
const demarcationsList = ref<any[]>([]);
const classificationsList = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const uploadingPhoto = ref(false);
const searchQuery = ref('');
const filterStatus = ref('');
const filterIdentification = ref('');
const filterName = ref('');
const filterLastName = ref('');
const showModal = ref(false);

watch(showModal, (val) => {
  emit('update:formOpen', val);
});
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formData = ref<Record<string, any>>({});

// Correo: formato usuario@dominio.ext
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPlayerEmailInvalid = computed(() => {
  const email = String(formData.value?.email || '').trim();
  return Boolean(email) && !EMAIL_REGEX.test(email);
});

// Teléfonos: solo dígitos (se eliminan letras y símbolos al escribir o pegar)
const onlyDigitsInput = (e: Event, field: string) => {
  const target = e.target as HTMLInputElement;
  const clean = target.value.replace(/\D/g, '').slice(0, 12);
  if (clean !== target.value) target.value = clean;
  formData.value[field] = clean;
};

const isCedulaType = computed(() => !formData.value?.documentType || formData.value.documentType === '05');

// Cédula: solo dígitos y máximo 10. Pasaporte / DNI extranjero: sin límite y admite letras.
const sanitizeCedula = (value: string) => String(value ?? '').replace(/\D/g, '').slice(0, 10);

const onIdentificationInput = (e: Event) => {
  if (!isCedulaType.value) return;
  const target = e.target as HTMLInputElement;
  const clean = sanitizeCedula(target.value);
  if (clean !== target.value) target.value = clean;
  formData.value.identification = clean;
};

watch(
  () => formData.value?.documentType,
  () => {
    if (isCedulaType.value && formData.value?.identification) {
      formData.value.identification = sanitizeCedula(formData.value.identification);
    }
  },
);

const identificationPlaceholder = computed(() => {
  if (formData.value?.documentType === '06') return 'Número de Pasaporte...';
  if (formData.value?.documentType === '08') return 'DNI / Identificación Extranjera...';
  return 'Número de Cédula de Identidad (10 dígitos)...';
});

const metaMap = {
  global_players: {
    title: 'Futbolistas',
    subtitle: 'Registro centralizado de futbolistas del sistema. Cada jugador cuenta con una identidad única e histórica.',
    entityName: 'Futbolista',
    icon: 'solar:users-group-two-rounded-bold-duotone',
  },
  referee_guilds: {
    title: 'Gremios y Núcleos Arbitrales',
    subtitle: 'Catálogo global de asociaciones, colegios y núcleos arbitrales registrados en el sistema.',
    entityName: 'Gremio Arbitral',
    icon: 'solar:shield-star-bold-duotone',
  },
  global_referees: {
    title: 'Árbitros',
    subtitle: 'Registro centralizado de jueces y colegiados deportivos para su asignación a campeonatos.',
    entityName: 'Árbitro',
    icon: 'solar:whistle-bold-duotone',
  },
  player_classifications: {
    title: 'Clasificación Global de Futbolistas',
    subtitle: 'Catálogo maestro de clasificaciones deportivas (Juvenil, Nativo, Foráneo, Extranjero, etc.).',
    entityName: 'Clasificación',
    icon: 'solar:user-check-bold-duotone',
  },
  demarcations: {
    title: 'Demarcaciones y Posiciones en Campo',
    subtitle: 'Catálogo global de zonas y demarcaciones tácticas de juego (Portero, Defensa, etc.).',
    entityName: 'Demarcación',
    icon: 'solar:running-bold-duotone',
  },
  stage_formats: {
    title: 'Formatos de Disputa del Campeonato',
    subtitle: 'Catálogo global de modalidades de juego (Todos contra Todos, Eliminación Directa, Grupos, Doble Eliminación).',
    entityName: 'Formato de Disputa',
    icon: 'solar:cup-first-bold-duotone',
  },
  competition_types: {
    title: 'Tipos Principales de Competencia',
    subtitle: 'Catálogo global de modalidades y sistemas de disputa deportiva (Todos contra Todos, Eliminación Directa, Grupos, Suizo).',
    entityName: 'Tipo de Competencia',
    icon: 'solar:cup-first-bold-duotone',
  },
  competition_laps: {
    title: 'Vueltas y Modalidades de Juego',
    subtitle: 'Catálogo global de ruedas y vueltas reglamentarias (Solo Ida, Ida y Vuelta, 3 Vueltas, etc.).',
    entityName: 'Modalidad de Vueltas',
    icon: 'solar:refresh-circle-bold-duotone',
  },
  tie_breaker_criteria: {
    title: 'Criterios de Desempate del Campeonato',
    subtitle: 'Catálogo global de criterios para dirimir empates en tablas y fases (Gol Diferencia, Penales, Sorteo, etc.).',
    entityName: 'Criterio de Desempate',
    icon: 'solar:scale-bold-duotone',
  },
};

const currentMeta = computed(() => metaMap[props.tab] || metaMap.global_players);

const getZoneLabel = (zone: string) => {
  const map: Record<string, string> = {
    GOALKEEPER: '🧤 Portero',
    DEFENDER: '🛡️ Defensa',
    MIDFIELDER: '⚙️ Mediocampo',
    FORWARD: '⚡ Delantero',
  };
  return map[zone] || zone || 'General';
};

const calculateAge = (birthDateStr: string | null | undefined) => {
  if (!birthDateStr) return null;
  const bDate = new Date(birthDateStr);
  if (isNaN(bDate.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - bDate.getFullYear();
  let months = (now.getFullYear() - bDate.getFullYear()) * 12 + (now.getMonth() - bDate.getMonth());
  const mDiff = now.getMonth() - bDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < bDate.getDate())) {
    years--;
  }
  if (now.getDate() < bDate.getDate()) {
    months--;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
};

const computedPlayerAge = computed(() => {
  if (!formData.value.birthDate) return null;
  return calculateAge(formData.value.birthDate);
});

const onBirthDateChange = () => {
  const calc = calculateAge(formData.value.birthDate);
  if (calc) {
    formData.value.ageYears = calc.years;
    formData.value.ageMonths = calc.months;
  }
};

const consultandoCedula = ref(false);

const validarCedulaEcuadorLocal = (cedula: string): boolean => {
  if (!cedula || !/^\d{10}$/.test(cedula.trim())) return false;
  const prov = parseInt(cedula.substring(0, 2), 10);
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false;
  if (parseInt(cedula.charAt(2), 10) >= 6) return false;

  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = parseInt(cedula.charAt(i), 10) * (coef[i] ?? 1);
    if (p >= 10) p -= 9;
    sum += p;
  }
  const digitoVerificador = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return digitoVerificador === parseInt(cedula.charAt(9), 10);
};

const consultarCedulaRegistroCivil = async () => {
  if (formData.value?.documentType && formData.value?.documentType !== '05') {
    toast.info('La consulta oficial aplica únicamente para Cédula de Identidad (Ecuador).');
    return;
  }

  const ident = (formData.value?.identification || '').trim();
  if (!ident) {
    toast.warning('Ingresa el número de cédula para consultar');
    return;
  }

  if (!validarCedulaEcuadorLocal(ident)) {
    toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.');
    return;
  }

  try {
    consultandoCedula.value = true;
    const res = await CampeonatoApi.players.consultaRegistroCivil(ident);
    const data = res.data;

    if (data?.exists && data?.player) {
      const p = data.player;
      formData.value.name = p.name || formData.value.name;
      formData.value.lastName = p.lastName || formData.value.lastName;
      formData.value.code = p.code || formData.value.code;
      if (p.birthDate) {
        formData.value.birthDate = String(p.birthDate).slice(0, 10);
        const calc = calculateAge(formData.value.birthDate);
        if (calc) {
          formData.value.ageYears = calc.years;
          formData.value.ageMonths = calc.months;
        }
      }
      if (p.photo) formData.value.photo = p.photo;
      if (p.gender) formData.value.gender = p.gender;
      if (p.demarcationId) formData.value.demarcationId = p.demarcationId;
      if (p.playerClassificationId) formData.value.playerClassificationId = p.playerClassificationId;
      if (p.dominantFoot) formData.value.dominantFoot = p.dominantFoot;
      if (p.bloodType) formData.value.bloodType = p.bloodType;
      if (p.phone) formData.value.phone = p.phone;
      if (p.email) formData.value.email = p.email;
      if (p.address || p.direccion || p.domicilio) {
        formData.value.address = p.address || p.direccion || p.domicilio;
      }

      if (data.source === 'REGISTRO_CIVIL') {
        toast.success(`Datos extraídos del Registro Civil: ${p.name} ${p.lastName}`);
      } else {
        toast.success(`Datos cargados del padrón de futbolistas: ${p.name} ${p.lastName}`);
      }
      return;
    }

    toast.info('Cédula verificada con éxito. Puedes ingresar los datos del futbolista.');
  } catch (err: any) {
    console.error('Error al consultar cédula:', err);
    toast.error('Error al realizar la consulta de la cédula');
  } finally {
    consultandoCedula.value = false;
  }
};

const onPhotoSelected = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    uploadingPhoto.value = true;
    const { file: compressed } = await compressImageToWebP(file, { maxWidth: 800, maxHeight: 1000, quality: 0.85 });
    const url = await uploadPlayerPhoto(compressed);
    formData.value.photo = url;
    toast.success('Foto optimizada a WebP y cargada exitosamente');
  } catch (err) {
    console.error('Error al subir foto:', err);
    toast.error('Error al procesar la fotografía');
  } finally {
    uploadingPhoto.value = false;
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    const query: any = { limit: 100, search: searchQuery.value.trim() || undefined };

    if (props.tab === 'global_players') {
      query.global = 'true';
      query.status = filterStatus.value || undefined;
      query.identification = filterIdentification.value.trim() || undefined;
      query.name = filterName.value.trim() || undefined;
      query.lastName = filterLastName.value.trim() || undefined;
      const [plRes, dmRes, pcRes] = await Promise.all([
        CampeonatoApi.players.list(query),
        CampeonatoApi.demarcations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        CampeonatoApi.playerClassifications.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      ]);
      items.value = plRes.data?.data || [];
      demarcationsList.value = dmRes.data?.data || [];
      classificationsList.value = pcRes.data?.data || [];
    } else if (props.tab === 'referee_guilds') {
      const res = await CampeonatoApi.refereeGuilds.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'global_referees') {
      query.global = 'true';
      const [refRes, gRes] = await Promise.all([
        CampeonatoApi.referees.list(query),
        CampeonatoApi.refereeGuilds.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      ]);
      items.value = refRes.data?.data || [];
      guildsList.value = gRes.data?.data || [];
    } else if (props.tab === 'player_classifications') {
      const res = await CampeonatoApi.playerClassifications.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'demarcations') {
      const res = await CampeonatoApi.demarcations.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'stage_formats') {
      const res = await CampeonatoApi.stageFormats.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'competition_types') {
      const res = await CampeonatoApi.competitionTypes.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'competition_laps') {
      const res = await CampeonatoApi.competitionLaps.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'tie_breaker_criteria') {
      const res = await CampeonatoApi.tieBreakerCriteria.list(query);
      items.value = res.data?.data || [];
    }
  } catch (err) {
    console.error('Error al cargar datos globales:', err);
    toast.error('Error al cargar información del catálogo');
  } finally {
    loading.value = false;
  }
};

let searchTimer: any = null;
const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadData();
  }, 350);
};

const openCreateModal = async () => {
  isEditing.value = false;
  editingId.value = null;

  if (props.tab === 'global_players') {
    if (demarcationsList.value.length === 0 || classificationsList.value.length === 0) {
      try {
        const [dmRes, pcRes] = await Promise.all([
          CampeonatoApi.demarcations.list({ limit: 100 }),
          CampeonatoApi.playerClassifications.list({ limit: 100 }),
        ]);
        demarcationsList.value = dmRes.data?.data || [];
        classificationsList.value = pcRes.data?.data || [];
      } catch {}
    }
    formData.value = {
      documentType: '05',
      isActive: true,
      dominantFoot: 'RIGHT',
      demarcationId: '',
      playerClassificationId: '',
      passOwnerType: 'PLAYER',
    };
  } else if (props.tab === 'global_referees') {
    if (guildsList.value.length === 0) {
      try {
        const gRes = await CampeonatoApi.refereeGuilds.list({ limit: 100 });
        guildsList.value = gRes.data?.data || [];
      } catch {}
    }
    formData.value = { isActive: true, guildId: '' };
  } else if (props.tab === 'demarcations') {
    formData.value = { zone: 'DEFENDER', maxPlayers: 0, order: (items.value.length || 0) + 1 };
  } else if (props.tab === 'stage_formats') {
    formData.value = {
      name: '',
      formatType: 'EVERYONE_AGAINST_EVERYONE',
      defaultLaps: 1,
      defaultTieBreaker: 'PENALTIES',
      requiresGroups: false,
      isActive: true,
      description: '',
    };
  } else if (props.tab === 'competition_laps') {
    formData.value = {
      description: '',
      code: '',
      numberOfLaps: 1,
      observation: '',
      isActive: true,
    };
  } else if (props.tab === 'competition_types' || props.tab === 'tie_breaker_criteria') {
    formData.value = {
      description: '',
      code: '',
      observation: '',
      isActive: true,
    };
  } else {
    formData.value = { isActive: true };
  }
  showModal.value = true;
};

const openEditModal = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  if (props.tab === 'global_players') {
    if (!formData.value.documentType) {
      formData.value.documentType = item.isForeigner ? '06' : '05';
    }
    if (item.birthDate) {
      formData.value.birthDate = String(item.birthDate).slice(0, 10);
      const calc = calculateAge(formData.value.birthDate);
      if (calc) {
        formData.value.ageYears = calc.years;
        formData.value.ageMonths = calc.months;
      }
    }
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  formData.value = {};
  isEditing.value = false;
  editingId.value = null;
};

// Campos aceptados por el DTO (create/update) de cada catálogo
const catalogDtoFields = ['description', 'code', 'observation', 'isActive'];
const dtoFieldsByTab: Record<string, string[]> = {
  global_players: [
    'code', 'ageYears', 'ageMonths', 'demarcationId', 'playerClassificationId', 'name', 'lastName', 'identification',
    'isForeigner', 'birthDate', 'gender', 'jerseyNumber', 'address', 'phone', 'email', 'photo', 'bloodType', 'dominantFoot',
    'emergencyContactName', 'emergencyContactPhone', 'medicalClearanceExpiry', 'isActive', 'currentTeamId', 'passOwnerType',
    'passOwnerTeamId',
  ],
  referee_guilds: ['description', 'acronyms', 'isActive'],
  global_referees: ['name', 'lastName', 'identification', 'guildId', 'phone', 'email', 'category', 'isActive'],
  player_classifications: catalogDtoFields,
  demarcations: ['name', 'code', 'zone', 'order', 'maxPlayers'],
  stage_formats: ['name', 'code', 'description', 'formatType', 'defaultLaps', 'defaultTieBreaker', 'requiresGroups', 'isActive'],
  competition_types: catalogDtoFields,
  competition_laps: [...catalogDtoFields, 'numberOfLaps'],
  tie_breaker_criteria: catalogDtoFields,
};
const emptyAsNullFields = ['email', 'birthDate', 'medicalClearanceExpiry'];

const submitForm = async () => {
  try {
    saving.value = true;
    // El backend rechaza (400) cualquier campo no declarado en el DTO (companyId, createdBy, relaciones...):
    // se envían únicamente los campos del DTO de cada catálogo.
    const allowed = dtoFieldsByTab[props.tab] || [];
    const payload: Record<string, any> = {};
    for (const key of allowed) {
      const value = formData.value[key];
      if (value === undefined) continue;
      if (value === '') {
        // Campo vacío: al crear no se envía; al editar se limpia (null en ids, fechas y correo)
        if (isEditing.value) payload[key] = key.endsWith('Id') || emptyAsNullFields.includes(key) ? null : '';
        continue;
      }
      payload[key] = value;
    }

    if (!isEditing.value && allowed.includes('isActive')) {
      payload.isActive = true;
    }

    if (props.tab === 'global_players') {
      if (!formData.value.birthDate) {
        toast.error('La fecha de nacimiento es obligatoria');
        return;
      }
      const email = String(formData.value.email || '').trim();
      if (email && !EMAIL_REGEX.test(email)) {
        toast.error('Ingresa un correo electrónico válido (ej. futbolista@ejemplo.com)');
        return;
      }
      if (email) payload.email = email;
      if (formData.value.documentType === '06' || formData.value.documentType === '08') {
        payload.isForeigner = true;
      } else if (formData.value.documentType === '05') {
        payload.isForeigner = false;
      }
      if (payload.birthDate) {
        const calc = calculateAge(payload.birthDate);
        if (calc) {
          payload.ageYears = calc.years;
          payload.ageMonths = calc.months;
        }
      }
      if (!payload.code) delete payload.code;

      if (isEditing.value && editingId.value) {
        await CampeonatoApi.players.update(editingId.value, payload);
        toast.success('Futbolista actualizado exitosamente');
      } else {
        await CampeonatoApi.players.create(payload);
        toast.success('Futbolista registrado exitosamente');
      }
    } else if (props.tab === 'referee_guilds') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.refereeGuilds.update(editingId.value, payload);
        toast.success('Gremio arbitral actualizado exitosamente');
      } else {
        await CampeonatoApi.refereeGuilds.create(payload);
        toast.success('Gremio arbitral creado exitosamente');
      }
    } else if (props.tab === 'global_referees') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.referees.update(editingId.value, payload);
        toast.success('Árbitro actualizado exitosamente');
      } else {
        await CampeonatoApi.referees.create(payload);
        toast.success('Árbitro registrado exitosamente');
      }
    } else if (props.tab === 'player_classifications') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.playerClassifications.update(editingId.value, payload);
        toast.success('Clasificación de futbolista actualizada exitosamente');
      } else {
        await CampeonatoApi.playerClassifications.create(payload);
        toast.success('Clasificación de futbolista creada exitosamente');
      }
    } else if (props.tab === 'demarcations') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.demarcations.update(editingId.value, payload);
        toast.success('Demarcación actualizada exitosamente');
      } else {
        await CampeonatoApi.demarcations.create(payload);
        toast.success('Demarcación creada exitosamente');
      }
    } else if (props.tab === 'stage_formats') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.stageFormats.update(editingId.value, payload);
        toast.success('Formato de disputa actualizado exitosamente');
      } else {
        await CampeonatoApi.stageFormats.create(payload);
        toast.success('Formato de disputa creado exitosamente');
      }
    } else if (props.tab === 'competition_types') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.competitionTypes.update(editingId.value, payload);
        toast.success('Tipo de competencia actualizado exitosamente');
      } else {
        await CampeonatoApi.competitionTypes.create(payload);
        toast.success('Tipo de competencia creado exitosamente');
      }
    } else if (props.tab === 'competition_laps') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.competitionLaps.update(editingId.value, payload);
        toast.success('Modalidad de vueltas actualizada exitosamente');
      } else {
        await CampeonatoApi.competitionLaps.create(payload);
        toast.success('Modalidad de vueltas creada exitosamente');
      }
    } else if (props.tab === 'tie_breaker_criteria') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.tieBreakerCriteria.update(editingId.value, payload);
        toast.success('Criterio de desempate actualizado exitosamente');
      } else {
        await CampeonatoApi.tieBreakerCriteria.create(payload);
        toast.success('Criterio de desempate creado exitosamente');
      }
    }

    closeModal();
    loadData();
  } catch (err: any) {
    console.error('Error al guardar registro:', err);
    toast.error(err?.response?.data?.message || err?.message || 'Error al guardar el registro');
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: number, isGlobal = false) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este registro del catálogo global?')) return;
  try {
    if (props.tab === 'global_players') {
      // Padrón global: borrado físico solo para super admin y solo si el jugador no tiene historial
      await CampeonatoApi.players.delete(id, undefined, isGlobal ? { global: true } : undefined);
    } else if (props.tab === 'referee_guilds') {
      await CampeonatoApi.refereeGuilds.delete(id);
    } else if (props.tab === 'global_referees') {
      await CampeonatoApi.referees.delete(id, undefined, isGlobal ? { global: true } : undefined);
    } else if (props.tab === 'player_classifications') {
      await CampeonatoApi.playerClassifications.delete(id);
    } else if (props.tab === 'demarcations') {
      await CampeonatoApi.demarcations.delete(id);
    } else if (props.tab === 'stage_formats') {
      await CampeonatoApi.stageFormats.delete(id);
    } else if (props.tab === 'competition_types') {
      await CampeonatoApi.competitionTypes.delete(id);
    } else if (props.tab === 'competition_laps') {
      await CampeonatoApi.competitionLaps.delete(id);
    } else if (props.tab === 'tie_breaker_criteria') {
      await CampeonatoApi.tieBreakerCriteria.delete(id);
    }
    toast.success('Registro eliminado exitosamente');
    loadData();
  } catch (err: any) {
    console.error('Error al eliminar registro:', err);
    toast.error(err?.response?.data?.message || 'Error al eliminar el registro');
  }
};

watch(() => props.tab, () => {
  closeModal();
  searchQuery.value = '';
  filterStatus.value = '';
  filterIdentification.value = '';
  filterName.value = '';
  filterLastName.value = '';
  loadData();
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.bg-navy-card {
  background: var(--bs-card-bg, #111c2d);
  color: var(--bs-body-color);
}

[data-bs-theme="dark"] .bg-navy-card {
  background-color: #111c2d !important;
}

[data-bs-theme="light"] .bg-navy-card {
  background-color: #ffffff !important;
  border: 1px solid #e6ecf1 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
  color: #2a3547 !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
