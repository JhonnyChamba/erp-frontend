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
            {{ isConfigSection ? 'CONFIGURACIÓN GENERAL' : activeTabLabel.toUpperCase() }}
          </span>
        </div>
        <h2 class="crud-title">{{ isConfigSection ? 'Configuraciones del Torneo' : activeTabLabel }}</h2>
        <p class="crud-subtitle">
          {{ isConfigSection ? 'Parametrización general del torneo: categorías, canchas, días y horarios de juego, árbitros y vocales.' : `Gestión y administración de ${activeTabLabel.toLowerCase()} en el torneo deportivo.` }}
        </p>
      </div>

      <div class="crud-header-actions">
        <!-- Generar Fixture si está en partidos -->
        <button
          v-if="activeTab === 'matches'"
          class="btn btn-outline-info d-flex align-items-center gap-2"
          @click="openFixtureModal"
          title="Generar calendario de partidos automático"
        >
          <iconify-icon icon="solar:calendar-add-bold" class="fs-5"></iconify-icon>
          <span>Generar Fixture</span>
        </button>

        <!-- Ir a Tabla de Posiciones si está en partidos -->
        <button
          v-if="activeTab === 'matches'"
          class="btn btn-outline-primary d-flex align-items-center gap-2"
          @click="selectTab('standings')"
          title="Ver tabla de posiciones del torneo"
        >
          <iconify-icon icon="solar:ranking-bold-duotone" class="fs-5"></iconify-icon>
          <span>Tabla de Posiciones</span>
        </button>

        <button class="btn btn-secondary d-flex align-items-center gap-2" @click="activeTab === 'schedules' ? loadScheduleConfig() : loadData()" :disabled="loading">
          <iconify-icon icon="solar:refresh-line-duotone" :class="{ 'spin-anim': loading }"></iconify-icon>
          <span>Actualizar</span>
        </button>
        <button v-if="activeTab !== 'standings'" class="btn btn-primary d-flex align-items-center gap-2" @click="activeTab === 'schedules' ? openCreateSchedule() : openCreateForm()">
          <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
          <span>+ Nuevo {{ activeTabLabel }}</span>
        </button>
      </div>
    </div>

    <!-- PESTAÑAS NAV-PILLS DE CONFIGURACIÓN (TIPO GLOBAL SETTINGS) -->
    <div v-if="isConfigSection && !isFormOpen" class="card p-2 mb-3 border rounded-4 bg-body-tertiary">
      <ul class="nav nav-pills gap-2 flex-wrap" role="tablist">
        <li v-for="st in visibleConfigSubTabs" :key="st.id" class="nav-item">
          <button
            type="button"
            class="nav-link rounded-pill px-3 py-1-5 d-flex align-items-center gap-2 fs-2 text-decoration-none fw-semibold"
            :class="configSubTab === st.id ? 'active bg-primary text-white shadow-sm' : 'text-body-secondary hover-pill'"
            @click="switchConfigSubTab(st.id)"
          >
            <iconify-icon :icon="st.icon" class="fs-4"></iconify-icon>
            <span>{{ st.label }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- ========================================== -->
    <!-- 2. FILTROS Y BÚSQUEDA (ESTILO FACTURAS)    -->
    <!-- ========================================== -->
    <div v-show="!isFormOpen && activeTab !== 'standings'" class="crud-filters-card">
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
              @input="activeTab === 'schedules' ? null : loadData()"
            />
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            :disabled="loading"
            @click="activeTab === 'schedules' ? loadScheduleConfig() : loadData()"
          >
            <iconify-icon icon="solar:refresh-line-duotone" class="fs-4" :class="{ 'spin-anim': loading }"></iconify-icon>
            <span>Refrescar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- 2.5 LISTADO DE REGLAMENTOS DE DÍAS Y HORARIOS (ESTILO VENTAS)   -->
    <!-- ============================================================== -->
    <div v-if="!isFormOpen && activeTab === 'schedules'" class="crud-table-card">
      <div class="table-responsive">
        <table class="crud-table">
          <thead>
            <tr>
              <th scope="col" style="width: 70px;">#</th>
              <th scope="col">Edición del Campeonato</th>
              <th scope="col">Canchas Asignadas</th>
              <th scope="col">Días Habilitados</th>
              <th scope="col">Tiempos Oficiales</th>
              <th scope="col">Capacidad Semanal</th>
              <th scope="col" class="text-center">Estado</th>
              <th scope="col" class="text-end" style="width: 70px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="schedulesListFiltered.length === 0">
              <td colspan="8" class="text-center py-5 text-secondary">
                <iconify-icon icon="solar:clock-circle-bold-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
                <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron reglamentos de días y horarios configurados</p>
                <p class="mb-0 fs-2 text-muted">Haz clic en <strong>+ Nuevo {{ activeTabLabel }}</strong> para registrar la programación de una edición.</p>
              </td>
            </tr>

            <tr v-for="(item, idx) in schedulesListFiltered" :key="item.editionId || idx">
              <td class="text-muted font-monospace cell-index" data-label="#">{{ idx + 1 }}</td>
              <td data-label="Edición del Campeonato">
                <div class="d-flex align-items-center gap-2">
                  <div class="p-2 rounded-3 bg-primary-subtle text-primary">
                    <iconify-icon icon="solar:cup-first-bold" class="fs-4"></iconify-icon>
                  </div>
                  <div>
                    <span class="fw-bold text-body-emphasis d-block">{{ item.editionName }}</span>
                    <small class="text-muted">{{ item.categoryName }}</small>
                  </div>
                </div>
              </td>
              <td>
                <div class="d-flex flex-wrap gap-1">
                  <span
                    v-for="cName in item.courtNames"
                    :key="cName"
                    class="badge bg-secondary-subtle text-secondary small"
                  >
                    📍 {{ cName }}
                  </span>
                  <span v-if="item.courtNames.length === 0" class="text-muted small">Sin canchas activas</span>
                </div>
              </td>
              <td>
                <div class="d-flex flex-wrap gap-1">
                  <span
                    v-for="d in item.activeDayLabels"
                    :key="d"
                    class="badge bg-success-subtle text-success small font-monospace"
                  >
                    {{ d }}
                  </span>
                  <span v-if="item.activeDayLabels.length === 0" class="text-muted small">Sin días activos</span>
                </div>
              </td>
              <td>
                <span class="badge bg-info-subtle text-info font-monospace">
                  ⏱️ {{ item.slotMinutes }} min ({{ item.matchDuration }}m + {{ item.intervalMinutes }}m)
                </span>
              </td>
              <td>
                <span class="badge bg-primary text-white font-monospace px-2 py-1">
                  ⚽ {{ item.totalMatchesWeek }} part. / sem
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  Activo
                </span>
              </td>
              <td class="text-end cell-actions" data-label="Acciones">
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
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li>
                      <button
                        class="dropdown-item d-flex align-items-center gap-2"
                        type="button"
                        @click="openEditSchedule(item)"
                      >
                        <iconify-icon icon="solar:pen-bold" class="text-primary fs-5"></iconify-icon>
                        <span>Editar Horarios</span>
                      </button>
                    </li>
                    <li>
                      <button
                        class="dropdown-item d-flex align-items-center gap-2"
                        type="button"
                        @click="applyScheduleFromItem(item)"
                      >
                        <iconify-icon icon="solar:calendar-add-bold" class="text-info fs-5"></iconify-icon>
                        <span>Aplicar al Fixture</span>
                      </button>
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li>
                      <button
                        class="dropdown-item d-flex align-items-center gap-2 text-danger"
                        type="button"
                        @click="deleteSchedule(item)"
                      >
                        <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                        <span>Eliminar Horarios</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3. TABLA DE POSICIONES Y GOLEADORES        -->
    <!-- ========================================== -->
    <div v-else-if="!isFormOpen && activeTab === 'standings'" class="row g-3">
      <!-- Tabla de Clasificación -->
      <div class="col-lg-8">
        <div class="crud-table-card p-3">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:ranking-bold-duotone" class="fs-4 text-warning"></iconify-icon>
              <h5 class="mb-0 fw-bold text-body-emphasis">Tabla General de Clasificación</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
              <label class="small text-muted fw-semibold">Etapa:</label>
              <select v-model="selectedStageId" class="form-select form-select-sm w-auto" @change="loadStandings">
                <option value="">Todas las etapas</option>
                <option v-for="s in stagesList" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="crud-table">
              <thead>
                <tr>
                  <th style="width: 50px;">POS</th>
                  <th>CLUB / EQUIPO</th>
                  <th class="text-center" title="Partidos Jugados">PJ</th>
                  <th class="text-center text-success" title="Partidos Ganados">PG</th>
                  <th class="text-center text-secondary" title="Partidos Empatados">PE</th>
                  <th class="text-center text-danger" title="Partidos Perdidos">PP</th>
                  <th class="text-center" title="Goles a Favor">GF</th>
                  <th class="text-center" title="Goles en Contra">GC</th>
                  <th class="text-center" title="Diferencia de Gol">GD</th>
                  <th class="text-center fw-bold text-primary" title="Puntos">PTS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingStandings">
                  <td colspan="10" class="text-center py-4 text-secondary">
                    <span class="spinner-border spinner-border-sm me-2"></span> Calculando posiciones del campeonato...
                  </td>
                </tr>
                <tr v-else-if="standingsList.length === 0">
                  <td colspan="10" class="text-center py-4 text-secondary">
                    No hay partidos finalizados para calcular la tabla de posiciones de esta etapa.
                  </td>
                </tr>
                <tr v-for="(row, idx) in standingsList" :key="row.teamId">
                  <td class="fw-bold font-monospace">
                    <span v-if="idx === 0" class="badge bg-warning text-dark">1° 🏆</span>
                    <span v-else-if="idx === 1" class="badge bg-secondary text-white">2° 🥈</span>
                    <span v-else-if="idx === 2" class="badge bg-warning-subtle text-warning border">3° 🥉</span>
                    <span v-else-if="idx < 4" class="badge bg-info-subtle text-info border">{{ idx + 1 }}°</span>
                    <span v-else class="text-muted">{{ idx + 1 }}°</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img v-if="row.logoUrl" :src="row.logoUrl" class="rounded-circle" style="width: 26px; height: 26px; object-fit: cover;" />
                      <iconify-icon v-else icon="solar:shield-bold-duotone" class="fs-4 text-secondary"></iconify-icon>
                      <span class="fw-semibold text-body-emphasis">{{ row.teamName }}</span>
                    </div>
                  </td>
                  <td class="text-center">{{ row.pj }}</td>
                  <td class="text-center text-success fw-semibold">{{ row.pg }}</td>
                  <td class="text-center text-secondary">{{ row.pe }}</td>
                  <td class="text-center text-danger">{{ row.pp }}</td>
                  <td class="text-center">{{ row.gf }}</td>
                  <td class="text-center">{{ row.gc }}</td>
                  <td class="text-center font-monospace" :class="row.gd > 0 ? 'text-success' : row.gd < 0 ? 'text-danger' : 'text-secondary'">
                    {{ row.gd > 0 ? '+' + row.gd : row.gd }}
                  </td>
                  <td class="text-center fw-bold fs-3 text-primary font-monospace">{{ row.pts }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tabla de Goleadores -->
      <div class="col-lg-4">
        <div class="crud-table-card p-3">
          <div class="d-flex align-items-center gap-2 mb-3">
            <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-4 text-warning"></iconify-icon>
            <h5 class="mb-0 fw-bold text-body-emphasis">Máximos Goleadores</h5>
          </div>

          <div class="table-responsive">
            <table class="crud-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>JUGADOR</th>
                  <th class="text-end">GOLES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="topScorersList.length === 0">
                  <td colspan="3" class="text-center py-4 text-secondary small">
                    Aún no hay goles registrados en los partidos jugados.
                  </td>
                </tr>
                <tr v-for="(sc, sIdx) in topScorersList" :key="sc.playerId">
                  <td class="font-monospace fw-bold text-muted">{{ sIdx + 1 }}</td>
                  <td>
                    <div class="fw-semibold text-body-emphasis fs-2">{{ sc.playerName }}</div>
                    <small class="text-muted fs-1">{{ sc.teamName }}</small>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace fs-3 px-2 py-1">
                      ⚽ {{ sc.goals }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 4. TABLA PRINCIPAL DE DATOS (ESTILO VENTAS)-->
    <!-- ========================================== -->
    <div v-else-if="!isFormOpen" class="crud-table-card">
      <!-- 4.A VISTA ESCRITORIO Y TABLET: TABLA DE DATOS (PANTALLAS >= 768px) -->
      <div class="table-responsive d-none d-md-block">
        <table class="crud-table">
          <thead>
            <tr>
              <th scope="col" style="width: 70px;">#</th>
              <th v-for="col in columns" :key="col.key" scope="col">{{ col.label }}</th>
              <th scope="col" class="text-end" style="width: 70px;">Acciones</th>
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
              <td class="text-muted font-monospace cell-index" data-label="#">{{ (page - 1) * limit + idx + 1 }}</td>
              <td v-for="col in columns" :key="col.key" :data-label="col.label" :class="'col-' + col.key">
                <!-- Nombre de Equipo con Escudo / Logo -->
                <div v-if="activeTab === 'teams' && col.key === 'name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.logo"
                    :src="item.logo"
                    class="rounded-circle shadow-sm border border-secondary-subtle"
                    style="width: 28px; height: 28px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center"
                    style="width: 28px; height: 28px;"
                  >
                    <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-secondary"></iconify-icon>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="text-body-emphasis fw-bold">{{ item.name }}</span>
                    <div v-if="item.color1 || item.color2 || item.colorAlternate" class="d-inline-flex align-items-center gap-1" title="Colores del club">
                      <span
                        v-if="item.color1"
                        class="rounded-circle border shadow-xs"
                        :style="{ backgroundColor: item.color1, width: '12px', height: '12px', display: 'inline-block' }"
                      ></span>
                      <span
                        v-if="item.color2"
                        class="rounded-circle border shadow-xs"
                        :style="{ backgroundColor: item.color2, width: '12px', height: '12px', display: 'inline-block' }"
                      ></span>
                      <span
                        v-if="item.colorAlternate"
                        class="rounded-circle border shadow-xs"
                        :style="{ backgroundColor: item.colorAlternate, width: '12px', height: '12px', display: 'inline-block' }"
                      ></span>
                    </div>
                  </div>
                </div>

                <!-- Código Secuencial de Jugador o Categoría -->
                <span v-else-if="(activeTab === 'players' || activeTab === 'categories') && col.key === 'code'">
                  <span class="badge bg-secondary-subtle text-body-emphasis font-monospace border px-2 py-1">
                    🏷️ {{ item.code || '-' }}
                  </span>
                </span>

                <!-- Siglas en Categorías -->
                <span v-else-if="activeTab === 'categories' && col.key === 'acronyms'">
                  <span v-if="item.acronyms" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    {{ item.acronyms }}
                  </span>
                  <span v-else class="text-muted small">-</span>
                </span>

                <!-- Edad de Jugador (Años y Meses) -->
                <span v-else-if="activeTab === 'players' && col.key === 'ageDisplay'">
                  <span
                    v-if="item.ageYears !== undefined && item.ageYears !== null"
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                    :title="'Edad calculada: ' + item.ageYears + ' años (' + item.ageMonths + ' meses)'"
                  >
                    🎂 {{ item.ageYears }} años <span class="opacity-75">({{ item.ageMonths }}m)</span>
                  </span>
                  <span
                    v-else-if="item.birthDate && calculatePlayerAgeDirect(item.birthDate)"
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                  >
                    🎂 {{ calculatePlayerAgeDirect(item.birthDate)?.years }} años <span class="opacity-75">({{ calculatePlayerAgeDirect(item.birthDate)?.months }}m)</span>
                  </span>
                  <span v-else class="text-muted small">-</span>
                </span>

                <!-- Nombre de Jugador con Foto Oficial -->
                <div v-else-if="activeTab === 'players' && col.key === 'name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.photo"
                    :src="item.photo"
                    class="rounded-circle shadow-sm border border-info-subtle"
                    style="width: 28px; height: 28px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center"
                    style="width: 28px; height: 28px;"
                  >
                    <iconify-icon icon="solar:user-bold-duotone" class="fs-5 text-info"></iconify-icon>
                  </div>
                  <span class="text-body-emphasis fw-medium">{{ item.name }}</span>
                </div>

                <!-- Inscripción de Equipos: Equipo con Logo -->
                <div v-else-if="activeTab === 'teamRegistrations' && col.key === 'team.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.team?.logo"
                    :src="item.team.logo"
                    class="rounded-circle shadow-sm border"
                    style="width: 26px; height: 26px; object-fit: cover;"
                  />
                  <iconify-icon v-else icon="solar:shield-bold-duotone" class="fs-5 text-secondary"></iconify-icon>
                  <span class="text-body-emphasis fw-bold">{{ item.team?.name || item.team?.shortName || '-' }}</span>
                </div>

                <!-- Inscripción y Carnets: Jugador con Foto -->
                <div v-else-if="activeTab === 'playerRegistrations' && col.key === 'player.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.player?.photo"
                    :src="item.player.photo"
                    class="rounded-circle shadow-sm border border-info-subtle"
                    style="width: 28px; height: 28px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center"
                    style="width: 28px; height: 28px;"
                  >
                    <iconify-icon icon="solar:user-bold-duotone" class="fs-5 text-info"></iconify-icon>
                  </div>
                  <div>
                    <span class="text-body-emphasis fw-semibold d-block">{{ item.player?.name }} {{ item.player?.lastName }}</span>
                    <small class="text-muted font-monospace fs-1">{{ item.player?.identification }}</small>
                  </div>
                </div>

                <!-- Inscripción y Carnets: Equipo con Logo -->
                <div v-else-if="activeTab === 'playerRegistrations' && col.key === 'teamRegistration.team.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.teamRegistration?.team?.logo"
                    :src="item.teamRegistration.team.logo"
                    class="rounded-circle shadow-sm border"
                    style="width: 24px; height: 24px; object-fit: cover;"
                  />
                  <iconify-icon v-else icon="solar:shield-bold-duotone" class="fs-5 text-secondary"></iconify-icon>
                  <span class="text-body-emphasis fw-medium">{{ item.teamRegistration?.team?.name || item.teamRegistration?.team?.shortName || '-' }}</span>
                </div>

                <!-- Transferencias de Jugadores: Futbolista con Foto -->
                <div v-else-if="activeTab === 'playerTransfers' && col.key === 'player.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.player?.photo"
                    :src="item.player.photo"
                    class="rounded-circle shadow-sm border border-warning-subtle"
                    style="width: 28px; height: 28px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center"
                    style="width: 28px; height: 28px;"
                  >
                    <iconify-icon icon="solar:user-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                  </div>
                  <div>
                    <span class="text-body-emphasis fw-semibold d-block">{{ item.player?.first_name || item.player?.name }} {{ item.player?.last_name || item.player?.lastName }}</span>
                    <small class="text-muted font-monospace fs-1">{{ item.player?.id_card || item.player?.identification || item.player?.code }}</small>
                  </div>
                </div>

                <!-- Transferencias: Club Origen -->
                <div v-else-if="activeTab === 'playerTransfers' && col.key === 'originTeam.name'" class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-secondary"></iconify-icon>
                  <span class="text-body-emphasis fw-medium">{{ item.originTeam?.name || item.origin_team?.name || item.originTeam?.shortName || 'Pase Propio / Libre' }}</span>
                </div>

                <!-- Transferencias: Club Destino -->
                <div v-else-if="activeTab === 'playerTransfers' && col.key === 'destinationTeam.name'" class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-success"></iconify-icon>
                  <span class="text-success fw-bold">{{ item.destinationTeam?.name || item.destination_team?.name || item.destinationTeam?.shortName || '-' }}</span>
                </div>

                <!-- Transferencias: Edición -->
                <span v-else-if="activeTab === 'playerTransfers' && col.key === 'edition.name'">
                  <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                    🏆 {{ item.edition?.name || '-' }}
                  </span>
                </span>

                <!-- Transferencias: Estado -->
                <span v-else-if="activeTab === 'playerTransfers' && col.key === 'status'">
                  <span v-if="item.status === 'PENDING_APPROVAL'" class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1">
                    ⏳ Pendiente Firmas
                  </span>
                  <span v-else-if="item.status === 'APPROVED'" class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                    ✅ Aprobada (Lista)
                  </span>
                  <span v-else-if="item.status === 'EXECUTED'" class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">
                    🟢 Pase Ejecutado
                  </span>
                  <span v-else-if="item.status === 'REJECTED'" class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace px-2 py-1">
                    ❌ Rechazada
                  </span>
                  <span v-else class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                    {{ item.status }}
                  </span>
                </span>

                <!-- Transferencias: Resumen de Aprobaciones -->
                <div v-else-if="activeTab === 'playerTransfers' && col.key === 'approvalsSummary'" class="d-flex flex-wrap gap-1">
                  <span 
                    v-for="app in (item.approvals || [])" 
                    :key="app.id || app.role"
                    class="badge px-2 py-1"
                    :class="app.status === 'APPROVED' ? 'bg-success-subtle text-success border border-success-subtle' : (app.status === 'REJECTED' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle')"
                    :title="`${app.role}: ${app.status} ${app.notes ? '(' + app.notes + ')' : ''}`"
                  >
                    {{ app.role === 'ORIGIN_TEAM' ? 'Origen' : (app.role === 'DESTINATION_TEAM' ? 'Destino' : 'Liga') }}: 
                    {{ app.status === 'APPROVED' ? '✓' : (app.status === 'REJECTED' ? '✗' : '...') }}
                  </span>
                  <span v-if="!item.approvals || item.approvals.length === 0" class="text-muted small">
                    Sin firmas requeridas
                  </span>
                </div>

                <!-- Categoría Actual en Equipos -->
                <span v-else-if="activeTab === 'teams' && col.key === 'currentCategory.name'">
                  <span v-if="item.currentCategory?.name" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    🏆 {{ item.currentCategory.name }}
                  </span>
                  <span v-else class="text-muted small">Sin asignar</span>
                </span>

                <!-- Temporada / Año en Equipos -->
                <span v-else-if="activeTab === 'teams' && col.key === 'currentSeasonYear'">
                  <span v-if="item.currentSeasonYear" class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                    📅 {{ item.currentSeasonYear }}
                  </span>
                  <span v-else class="text-muted small">-</span>
                </span>

                <!-- Dueño del Pase en Jugadores -->
                <span v-else-if="activeTab === 'players' && col.key === 'passOwnerType'">
                  <span
                    v-if="item.passOwnerType === 'TEAM' && item.passOwnerTeam"
                    class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 font-monospace"
                    :title="'Dueño del Pase: ' + item.passOwnerTeam.name"
                  >
                    🛡️ Club: {{ item.passOwnerTeam.shortName || item.passOwnerTeam.name }}
                  </span>
                  <span
                    v-else
                    class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 font-monospace"
                    title="El jugador es dueño de su propio pase (Pase Libre)"
                  >
                    👤 Pase Propio (Libre)
                  </span>
                </span>

                <!-- Club Actual en Jugadores -->
                <span v-else-if="activeTab === 'players' && col.key === 'currentTeam.name'">
                  <span v-if="item.currentTeam?.name" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    ⚽ {{ item.currentTeam.name }}
                  </span>
                  <span v-else class="text-muted small">Sin club</span>
                </span>

                <!-- Ficha Médica en Jugadores -->
                <span v-else-if="activeTab === 'players' && col.key === 'medicalClearanceExpiry'">
                  <span
                    v-if="item.medicalClearanceExpiry"
                    class="badge font-monospace px-2 py-1"
                    :class="new Date(item.medicalClearanceExpiry) < new Date() ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'"
                  >
                    {{ new Date(item.medicalClearanceExpiry) < new Date() ? '⚠️ Vencida: ' : '🩺 Vigente: ' }}
                    {{ new Date(item.medicalClearanceExpiry).toLocaleDateString() }}
                  </span>
                  <span v-else class="text-muted small">Sin chequeo</span>
                </span>

                <!-- Límite Máximo en Demarcaciones -->
                <span v-else-if="activeTab === 'demarcations' && col.key === 'maxPlayers'">
                  <span
                    v-if="item.maxPlayers && Number(item.maxPlayers) > 0"
                    class="badge bg-warning-subtle text-warning border border-warning-subtle fw-semibold font-monospace px-2 py-1"
                  >
                    Máx. {{ item.maxPlayers }} por equipo
                  </span>
                  <span v-else class="badge bg-secondary-subtle text-secondary font-monospace">
                    Sin límite
                  </span>
                </span>

                <!-- Detalle de Categorías en Ediciones de Torneo -->
                <span v-else-if="activeTab === 'categoryEditions' && col.key === 'categoriesDetail'">
                  <div v-if="item.categoriesDetail && item.categoriesDetail.length" class="d-flex flex-wrap gap-1">
                    <span
                      v-for="det in item.categoriesDetail"
                      :key="det.id || det.categoryId"
                      class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"
                      :title="'Inicio: ' + (det.startDate ? new Date(det.startDate).toLocaleDateString() : 'N/A') + ' | Fin: ' + (det.endDate ? new Date(det.endDate).toLocaleDateString() : 'N/A')"
                    >
                      ⚽ {{ det.categoryDescription || det.category?.name || 'Categoría' }}
                      <span v-if="det.registrationFee" class="text-success ms-1 fw-bold">(${{ Number(det.registrationFee).toFixed(2) }})</span>
                    </span>
                  </div>
                  <span v-else-if="item.category?.name" class="badge bg-secondary-subtle text-secondary px-2 py-1">
                    {{ item.category.name }}
                  </span>
                  <span v-else class="text-muted small">Sin categorías en detalle</span>
                </span>

                <!-- Modalidad de Identificación en Ediciones de Torneo -->
                <span v-else-if="activeTab === 'categoryEditions' && col.key === 'identifyByPlayerCode'">
                  <span
                    v-if="item.identifyByPlayerCode"
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1 d-inline-flex align-items-center gap-1"
                  >
                    <iconify-icon icon="solar:user-id-bold-duotone" class="fs-6"></iconify-icon>
                    <span>Por Código (JUG-XXXXX)</span>
                  </span>
                  <span
                    v-else
                    class="badge bg-secondary-subtle text-body-secondary font-monospace border px-2 py-1 d-inline-flex align-items-center gap-1"
                  >
                    <iconify-icon icon="solar:t-shirt-bold-duotone" class="fs-6"></iconify-icon>
                    <span>Por Dorsal (Camiseta)</span>
                  </span>
                </span>

                <!-- Total de Etapas en Plantillas de Etapas y Fases -->
                <span v-else-if="activeTab === 'stages' && col.key === 'detailsCount'">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    {{ (item.details || []).length }} Etapa(s)
                  </span>
                </span>

                <!-- Resumen de Etapas y Fases Configuradas -->
                <span v-else-if="activeTab === 'stages' && col.key === 'stagesSummary'">
                  <div v-if="item.details && item.details.length" class="d-flex flex-wrap gap-1">
                    <span
                      v-for="det in item.details"
                      :key="det.id || det.stageOrder"
                      class="badge bg-secondary-subtle text-body border px-2 py-1"
                      :title="'Tipo: ' + (det.competitionType?.description || getCompetitionTypeDescById(det.competitionTypeId) || 'N/A') + ' | Vueltas: ' + (det.competitionLap?.description || getCompetitionLapDescById(det.competitionLapId) || 'N/A')"
                    >
                      <span class="text-primary fw-bold">#{{ det.stageOrder }}</span> {{ det.name }}
                    </span>
                  </div>
                  <span v-else class="text-muted small">Sin etapas configuradas</span>
                </span>

                <!-- Estado Activo/Inactivo en Plantillas de Etapas -->
                <span v-else-if="activeTab === 'stages' && col.key === 'isActive'">
                  <span
                    class="badge font-monospace px-2 py-1"
                    :class="item.isActive !== false ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  >
                    {{ item.isActive !== false ? '🟢 Activo' : '🔴 Inactivo' }}
                  </span>
                </span>

                <!-- Gremio / Núcleo en Árbitros -->
                <span v-else-if="activeTab === 'referees' && col.key === 'guild.description'">
                  <span v-if="item.guild?.description" class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                    🏛️ {{ item.guild.description }} <span v-if="item.guild.acronyms">({{ item.guild.acronyms }})</span>
                  </span>
                  <span v-else class="text-muted small">Independiente</span>
                </span>

                <!-- Estado en Ediciones de Torneo -->
                <span v-else-if="activeTab === 'categoryEditions' && col.key === 'status'">
                  <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">
                    🟢 {{ item.status === 'IN_PROGRESS' || !item.status ? 'Activo / En Curso' : item.status }}
                  </span>
                </span>

                <!-- Clasificación de Futbolistas -->
                <span v-else-if="col.key === 'playerClassification.description'">
                  <span
                    v-if="item.playerClassification?.description"
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                  >
                    🏷️ {{ item.playerClassification.description }}
                  </span>
                  <span v-else class="text-muted small">Sin clasificar</span>
                </span>

                <!-- Badge para Código de Carnet -->
                <span v-else-if="col.key === 'carnetCode'">
                  <span class="badge bg-secondary-subtle text-body-emphasis font-monospace border">
                    🪪 {{ item.carnetCode || '-' }}
                  </span>
                </span>

                <!-- Badge para Estado Booleano -->
                <span v-else-if="col.type === 'boolean'">
                  <span
                    class="badge font-monospace"
                    :class="item[col.key] ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  >
                    {{ item[col.key] ? 'Activo' : 'Inactivo' }}
                  </span>
                </span>

                <!-- Badge para Fechas -->
                <span v-else-if="col.type === 'date'">
                  <span class="badge bg-secondary-subtle text-secondary font-monospace">
                    {{ item[col.key] ? new Date(item[col.key]).toLocaleDateString() : '-' }}
                  </span>
                </span>

                <!-- Valor Genérico Anidado -->
                <span v-else class="text-body-emphasis fw-medium">
                  {{ getNestedValue(item, col.key) || '-' }}
                </span>
              </td>
              <td class="text-end cell-actions" data-label="Acciones">
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
                    <!-- Acciones para Transferencias de Jugadores -->
                    <li v-if="activeTab === 'playerTransfers'">
                      <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTransferDetail(item)">
                        <iconify-icon icon="solar:document-text-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Ver Expediente / Firmas</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerTransfers'">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openSportsHistory(item.playerId || item.player?.id)">
                        <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Historial Deportivo</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerTransfers'"><hr class="dropdown-divider"></li>

                    <!-- Ver Carnet QR y Ficha si es inscripción de jugador -->
                    <li v-if="activeTab === 'playerRegistrations'">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openCarnetModal(item)">
                        <iconify-icon icon="solar:card-2-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Carnet (QR)</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerRegistrations'">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openRosterForTeamReg(item.teamRegistrationId)">
                        <iconify-icon icon="solar:clipboard-list-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Plantilla del Club</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerRegistrations'">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openSportsHistory(item.playerId || item.player?.id)">
                        <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Historial Deportivo</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerRegistrations'"><hr class="dropdown-divider"></li>

                    <!-- Reglas de Pases en Ediciones de Torneo -->
                    <li v-if="activeTab === 'categoryEditions'">
                      <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTransferConfig(item)">
                        <iconify-icon icon="solar:settings-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Reglas de Inscripción y Pases</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'categoryEditions'"><hr class="dropdown-divider"></li>

                    <!-- Acciones directas desde la fila de Equipos -->
                    <li v-if="activeTab === 'teams'">
                      <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamManagementModal(item)">
                        <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Directorio del Club</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'teams'">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamCategoryHistory(item)">
                        <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Historial de Categorías</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'teams'">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="inscribeTeamToTorneo(item)">
                        <iconify-icon icon="solar:diploma-verified-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Inscribir en Torneo</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'teams'">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="viewTeamPlayers(item)">
                        <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Nómina y Carnets</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'teams'"><hr class="dropdown-divider"></li>

                    <!-- Acciones directas desde la fila de Jugadores -->
                    <li v-if="activeTab === 'players'">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTransferModal(item)">
                        <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Transferir Jugador</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'players'">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openPlayerTransfersModal(item)">
                        <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Historial de Pases</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'players'"><hr class="dropdown-divider"></li>

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

      <!-- 4.B VISTA MÓVIL EN TARJETAS (ESTILO SOCCERADMINEC - PANTALLAS < 768px) -->
      <div class="d-block d-md-none p-2">
        <div v-if="loading" class="text-center py-5">
          <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
            <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
            <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
          </div>
          <span class="text-secondary small">Cargando registros de {{ activeTabLabel }}...</span>
        </div>

        <div v-else-if="items.length === 0" class="text-center py-5 text-secondary card border rounded-4 p-4 bg-body-tertiary">
          <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
          <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron registros en {{ activeTabLabel }}</p>
          <p class="mb-0 fs-2 text-muted">Haz clic en <strong>+ Nuevo {{ activeTabLabel }}</strong> para registrar el primero.</p>
        </div>

        <div v-else class="crud-mobile-cards-view">
          <div
            v-for="(item, idx) in items"
            :key="item.id || idx"
            class="crud-mobile-card"
          >
            <!-- Cabecera de la tarjeta: Identificador + Entidad principal + Menú Acciones -->
            <div class="crud-mobile-card-header">
              <div class="d-flex align-items-center gap-2.5 min-w-0 flex-grow-1">
                <!-- Escudo de equipo o foto de jugador -->
                <img
                  v-if="activeTab === 'teams' && item.logo"
                  :src="item.logo"
                  alt="Escudo"
                  class="rounded-3 shadow-sm border border-secondary-subtle flex-shrink-0"
                  style="width: 44px; height: 44px; object-fit: cover;"
                />
                <img
                  v-else-if="activeTab === 'players' && item.photo"
                  :src="item.photo"
                  alt="Foto"
                  class="rounded-circle shadow-sm border border-primary flex-shrink-0"
                  style="width: 44px; height: 44px; object-fit: cover;"
                />
                <div
                  v-else-if="activeTab === 'teams'"
                  class="rounded-3 bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 44px; height: 44px;"
                >
                  <iconify-icon icon="solar:shield-bold-duotone" class="fs-2 text-secondary"></iconify-icon>
                </div>
                <div
                  v-else-if="activeTab === 'players'"
                  class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 44px; height: 44px;"
                >
                  <iconify-icon icon="solar:user-bold-duotone" class="fs-2 text-secondary"></iconify-icon>
                </div>

                <div class="min-w-0 flex-grow-1">
                  <div class="d-flex align-items-center gap-1.5 mb-0.5">
                    <span class="badge bg-secondary-subtle text-body-secondary font-monospace fw-bold" style="font-size: 0.65rem;">
                      #{{ (page - 1) * limit + idx + 1 }}
                    </span>
                    <span class="text-uppercase fw-bold text-secondary font-monospace" style="font-size: 0.62rem; letter-spacing: 0.05em;">
                      {{ activeTabLabel }}
                    </span>
                  </div>

                  <!-- Título principal -->
                  <div class="fw-bold text-body-emphasis fs-3 text-truncate">
                    {{ item.name || item.fullName || (item.player ? item.player.name : '') || getNestedValue(item, columns[0]?.key) || '-' }}
                  </div>

                  <!-- Subtítulo complementario -->
                  <div v-if="activeTab === 'teams' && item.shortName" class="text-muted fs-1 text-truncate">
                    {{ item.shortName }}
                  </div>
                  <div v-else-if="activeTab === 'players' && (item.documentNumber || item.idCard)" class="text-muted fs-1 font-monospace">
                    CI: {{ item.documentNumber || item.idCard }}
                  </div>
                </div>
              </div>

              <!-- Menú de Acciones ⋮ estilo SoccerAdmin -->
              <div class="dropdown flex-shrink-0">
                <button
                  class="btn btn-action-kebab"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                  aria-expanded="false"
                  title="Acciones"
                >
                  <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4 text-body-emphasis"></iconify-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                  <!-- Acciones para Transferencias de Jugadores -->
                  <li v-if="activeTab === 'playerTransfers'">
                    <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTransferDetail(item)">
                      <iconify-icon icon="solar:document-text-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Ver Expediente / Firmas</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'playerTransfers'">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openSportsHistory(item.playerId || item.player?.id)">
                      <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Historial Deportivo</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'playerTransfers'"><hr class="dropdown-divider"></li>

                  <!-- Ver Carnet QR y Ficha si es inscripción de jugador -->
                  <li v-if="activeTab === 'playerRegistrations'">
                    <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openCarnetModal(item)">
                      <iconify-icon icon="solar:card-2-bold-duotone" class="fs-5 text-info"></iconify-icon>
                      <span>Ver Carnet (QR)</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'playerRegistrations'">
                    <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openRosterForTeamReg(item.teamRegistrationId)">
                      <iconify-icon icon="solar:clipboard-list-bold-duotone" class="fs-5 text-info"></iconify-icon>
                      <span>Ver Plantilla del Club</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'playerRegistrations'">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openSportsHistory(item.playerId || item.player?.id)">
                      <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Historial Deportivo</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'playerRegistrations'"><hr class="dropdown-divider"></li>

                  <!-- Reglas de Pases en Ediciones de Torneo -->
                  <li v-if="activeTab === 'categoryEditions'">
                    <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTransferConfig(item)">
                      <iconify-icon icon="solar:settings-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Reglas de Inscripción y Pases</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'categoryEditions'"><hr class="dropdown-divider"></li>

                  <!-- Acciones directas desde la fila de Equipos -->
                  <li v-if="activeTab === 'teams'">
                    <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamManagementModal(item)">
                      <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Directorio del Club</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'teams'">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamCategoryHistory(item)">
                      <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Historial de Categorías</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'teams'">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="inscribeTeamToTorneo(item)">
                      <iconify-icon icon="solar:diploma-verified-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Inscribir en Torneo</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'teams'">
                    <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="viewTeamPlayers(item)">
                      <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-5 text-info"></iconify-icon>
                      <span>Ver Nómina y Carnets</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'teams'"><hr class="dropdown-divider"></li>

                  <!-- Acciones directas desde la fila de Jugadores -->
                  <li v-if="activeTab === 'players'">
                    <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTransferModal(item)">
                      <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-5 text-info"></iconify-icon>
                      <span>Transferir Jugador</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'players'">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openPlayerTransfersModal(item)">
                      <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Historial de Pases</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'players'"><hr class="dropdown-divider"></li>

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
            </div>

            <!-- Rejilla de atributos clave (2 columnas responsivas estilo SoccerAdmin) -->
            <div class="crud-mobile-card-grid">
              <template v-for="col in columns" :key="col.key">
                <div v-if="col.key !== 'name' && col.key !== 'fullName'" class="crud-mobile-field">
                  <span class="crud-mobile-field-label">{{ col.label }}</span>
                  <div class="crud-mobile-field-value">
                    <!-- Estado Booleano -->
                    <span v-if="col.type === 'boolean'" class="badge" :class="item[col.key] !== false ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                      {{ item[col.key] !== false ? 'Activo' : 'Inactivo' }}
                    </span>
                    <!-- Siglas con badge -->
                    <span v-else-if="col.key === 'siglas' || col.key === 'acronym'" class="badge bg-secondary-subtle text-body-secondary font-monospace">
                      {{ item[col.key] || '-' }}
                    </span>
                    <!-- Temporada / Año con badge -->
                    <span v-else-if="col.key === 'season' || col.key === 'year'" class="badge bg-primary-subtle text-primary font-monospace">
                      📅 {{ item[col.key] || '-' }}
                    </span>
                    <!-- Colores de club si aplica en nombre corto -->
                    <div v-else-if="activeTab === 'teams' && col.key === 'shortName'" class="d-flex align-items-center gap-1.5">
                      <span>{{ item.shortName || '-' }}</span>
                      <div v-if="item.color1 || item.color2 || item.colorAlternate" class="d-inline-flex align-items-center gap-1" title="Colores">
                        <span v-if="item.color1" class="rounded-circle border" :style="{ backgroundColor: item.color1, width: '10px', height: '10px' }"></span>
                        <span v-if="item.color2" class="rounded-circle border" :style="{ backgroundColor: item.color2, width: '10px', height: '10px' }"></span>
                        <span v-if="item.colorAlternate" class="rounded-circle border" :style="{ backgroundColor: item.colorAlternate, width: '10px', height: '10px' }"></span>
                      </div>
                    </div>
                    <!-- Valor Genérico -->
                    <span v-else>
                      {{ getNestedValue(item, col.key) || '-' }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
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
            <!-- SECCIÓN ESPECIAL: CARGA DE LOGO / ESCUDO PARA EQUIPOS ESTILO SOCCERADMIN -->
            <div v-if="activeTab === 'teams'" class="mb-4">
              <ImageUpload
                v-model="formData.logo"
                label="Escudo / Logo Oficial del Equipo"
                helpText="PNG, JPG o WEBP (con fondo transparente o sólido, recorte 1:1 automático)"
                :aspect-ratio="1"
                crop-shape="round"
                :upload-fn="handleUploadTeamLogo"
              />
            </div>

            

            <!-- TARJETA DE ACCESO RÁPIDO AL DIRECTORIO DEL CLUB -->
            <div v-if="activeTab === 'teams' && isEditing && formData.id" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="fs-2"></iconify-icon>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-1 text-body-emphasis">Directorio y Representantes del Club</h6>
                    <p class="text-muted small mb-0">Administra a los directivos registrados para {{ formData.name }}: Presidente, Vicepresidente, Vocales, etc.</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-warning text-dark rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                  @click="openTeamManagementModal(formData)"
                >
                  <iconify-icon icon="solar:users-group-two-rounded-bold" class="fs-5"></iconify-icon>
                  <span>Directorio del Club</span>
                </button>
              </div>
            </div>

            

            <!-- SECCIÓN ESPECIAL: CARGA DE FOTO PARA JUGADORES ESTILO SOCCERADMIN -->
            <div v-if="activeTab === 'players'" class="mb-4">
              <div v-if="globalPlayerFound" class="alert alert-secondary d-flex align-items-center gap-2 mb-2 py-2">
                <iconify-icon icon="solar:lock-keyhole-bold" class="fs-5 text-secondary"></iconify-icon>
                <span>Foto oficial vinculada al padrón global de futbolistas.</span>
              </div>
              <ImageUpload
                v-model="formData.photo"
                label="Foto Oficial del Jugador (Carnet Deportivo)"
                helpText="Fotografía tamaño carnet con rostro visible (recorte 1:1 o carnet)"
                :aspect-ratio="0.8"
                crop-shape="rect"
                :upload-fn="handleUploadPlayerPhoto"
              />
            </div>

            

            <!-- SECCIÓN: CONSULTA EN PADRÓN GLOBAL DE FUTBOLISTAS -->
            <div v-if="activeTab === 'players'" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:user-id-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                  <h6 class="fw-bold mb-0 text-body-emphasis">Consulta y Vinculación de Futbolistas</h6>
                </div>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                  PADRÓN GLOBAL
                </span>
              </div>
              <p class="text-muted small mb-3">
                Ingresa la cédula o identificación del futbolista. Si ya existe en la base general, sus datos se cargarán automáticamente para asociarlo a tu liga.
              </p>
              <div class="row g-2 align-items-center">
                <div class="col-md-5">
                  <div class="input-group">
                    <span class="input-group-text bg-body-secondary">
                      <iconify-icon icon="solar:card-2-bold-duotone" class="text-secondary"></iconify-icon>
                    </span>
                    <input
                      type="text"
                      v-model="formData.identification"
                      class="form-control font-monospace"
                      placeholder="Cédula / DNI del futbolista..."
                      @keyup.enter="searchGlobalPlayer"
                    />
                    <button
                      type="button"
                      class="btn btn-primary d-inline-flex align-items-center gap-1 px-3"
                      @click="searchGlobalPlayer"
                      :disabled="searchingGlobalPlayer || !formData.identification"
                    >
                      <span v-if="searchingGlobalPlayer" class="spinner-border spinner-border-sm me-1" role="status"></span>
                      <iconify-icon v-else icon="solar:magnifer-bold" class="fs-5"></iconify-icon>
                      <span>Consultar</span>
                    </button>
                  </div>
                </div>

                <div class="col-md-7">
                  <!-- Banner cuando fue encontrado en el padrón global -->
                  <div v-if="globalPlayerFound" class="alert alert-success py-2 px-3 mb-0 rounded-3 border-0 bg-success-subtle text-success-emphasis d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:check-circle-bold" class="fs-4 text-success"></iconify-icon>
                    <span class="small">
                      <strong>✓ Futbolista encontrado:</strong> {{ formData.name }} {{ formData.lastName }} (Código: <code>{{ formData.code || 'JUG-GLOBAL' }}</code>). Al guardar se vinculará a tu liga.
                    </span>
                  </div>

                  <!-- Banner cuando no existe (nuevo futbolista) -->
                  <div v-else-if="globalPlayerSearched && !globalPlayerFound" class="alert alert-info py-2 px-3 mb-0 rounded-3 border-0 bg-info-subtle text-info-emphasis d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:info-circle-bold" class="fs-4 text-info"></iconify-icon>
                    <span class="small">
                      <strong>Nuevo futbolista:</strong> El número ingresado no registra en el padrón global. Completa sus datos; se creará con código secuencial automático.
                    </span>
                  </div>

                  <!-- Mensaje inicial -->
                  <div v-else class="text-muted small">
                    Digita la cédula y presiona <strong>Consultar</strong> o Enter para verificar coincidencias.
                  </div>
                </div>
              </div>
            </div>

            

            <!-- SECCIÓN: CONSULTA EN PADRÓN GLOBAL DE ÁRBITROS -->
            <div v-if="activeTab === 'referees'" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:whistle-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                  <h6 class="fw-bold mb-0 text-body-emphasis">Consulta y Vinculación de Árbitros</h6>
                </div>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                  PADRÓN GLOBAL
                </span>
              </div>
              <p class="text-muted small mb-3">
                Ingresa el número de documento del árbitro. Si ya existe en la base general, sus datos se cargarán automáticamente para asociarlo a tu liga.
              </p>
              <div class="row g-2 align-items-center">
                <div class="col-md-5">
                  <div class="input-group">
                    <span class="input-group-text bg-body-secondary">
                      <iconify-icon icon="solar:card-2-bold-duotone" class="text-secondary"></iconify-icon>
                    </span>
                    <input
                      type="text"
                      v-model="formData.identification"
                      class="form-control font-monospace"
                      placeholder="Cédula / Documento del árbitro..."
                      @keyup.enter="searchGlobalReferee"
                    />
                    <button
                      type="button"
                      class="btn btn-primary d-inline-flex align-items-center gap-1 px-3"
                      @click="searchGlobalReferee"
                      :disabled="searchingGlobalReferee || !formData.identification"
                    >
                      <span v-if="searchingGlobalReferee" class="spinner-border spinner-border-sm me-1" role="status"></span>
                      <iconify-icon v-else icon="solar:magnifer-bold" class="fs-5"></iconify-icon>
                      <span>Consultar</span>
                    </button>
                  </div>
                </div>

                <div class="col-md-7">
                  <!-- Banner cuando fue localizado en el padrón global -->
                  <div v-if="globalRefereeFound" class="alert alert-success py-2 px-3 mb-0 rounded-3 border-0 bg-success-subtle text-success-emphasis d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:check-circle-bold" class="fs-4 text-success"></iconify-icon>
                    <span class="small">
                      <strong>✓ Árbitro localizado:</strong> {{ formData.name }} {{ formData.lastName }}. Al guardar se vinculará a tu liga.
                    </span>
                  </div>

                  <!-- Banner cuando no existe (nuevo árbitro) -->
                  <div v-else-if="globalRefereeSearched && !globalRefereeFound" class="alert alert-info py-2 px-3 mb-0 rounded-3 border-0 bg-info-subtle text-info-emphasis d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:info-circle-bold" class="fs-4 text-info"></iconify-icon>
                    <span class="small">
                      <strong>Nuevo árbitro:</strong> No figura en el padrón global. Completa sus datos; se registrará globalmente y se vinculará a tu liga.
                    </span>
                  </div>

                  <!-- Mensaje inicial -->
                  <div v-else class="text-muted small">
                    Digita el número de documento y presiona <strong>Consultar</strong> o Enter para verificar coincidencias.
                  </div>
                </div>
              </div>
            </div>

            

            <!-- ======================================================== -->
            <!-- FORMULARIO DE DÍAS Y HORARIOS DE JUEGO (PANTALLA COMPLETA)-->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'schedules'" class="row g-3">
              <!-- Formulario de Configuración de Horarios (Columna 7) -->
              <div class="col-lg-7">
                <div class="card p-4 border rounded-3 bg-body-tertiary">
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <iconify-icon icon="solar:clock-circle-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                    <div>
                      <h5 class="fw-bold mb-0 text-body-emphasis">Reglamento de Días y Horarios de Juego</h5>
                      <p class="text-muted small mb-0">Define los días de la semana y los horarios habilitados para la disputa de partidos por cancha.</p>
                    </div>
                  </div>

                  <div class="row g-3">
                    <!-- Selección de Edición -->
                    <div class="col-12">
                      <label class="form-label fw-semibold small text-secondary">Edición del Campeonato *</label>
                      <select v-model="scheduleConfig.editionId" class="form-select" @change="syncEditionTimes" required>
                        <option value="" disabled>Seleccione una edición...</option>
                        <option v-for="ed in categoryEditionsList" :key="ed.id" :value="ed.id">
                          {{ ed.name }} ({{ ed.category?.name || 'Categoría' }})
                        </option>
                      </select>
                    </div>

                    <!-- Tiempos Oficiales Automáticos de la Edición -->
                    <div class="col-12" v-if="scheduleConfig.editionId">
                      <div class="alert alert-info py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2 mb-0 border-0 bg-info-subtle text-info-emphasis rounded-3">
                        <div class="d-flex align-items-center gap-2">
                          <iconify-icon icon="solar:stopwatch-play-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                          <span class="small">
                            Tiempos oficiales de la edición: <strong>{{ scheduleConfig.matchDurationMinutes }} min</strong> de juego + <strong>{{ scheduleConfig.intervalMinutes }} min</strong> de descanso/espera
                          </span>
                        </div>
                        <span class="badge bg-primary text-white font-monospace">
                          Franja: {{ scheduleConfig.matchDurationMinutes + scheduleConfig.intervalMinutes }} min / partido
                        </span>
                      </div>
                    </div>

                    <!-- Selector de Canchas para Configurar por Cancha -->
                    <div class="col-12">
                      <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <label class="form-label fw-bold small text-body-emphasis mb-0 d-flex align-items-center gap-1">
                          <iconify-icon icon="solar:map-point-wave-bold-duotone" class="text-primary fs-5"></iconify-icon>
                          <span>Canchas Habilitadas (Selecciona para configurar sus días)</span>
                        </label>
                        <span class="text-muted small">Cada cancha tiene su propia programación independiente</span>
                      </div>

                      <div v-if="availableScenariesForEdition.length === 0" class="alert alert-warning small p-2 mb-0">
                        No hay canchas registradas o asignadas a esta edición. Puedes agregarlas en la pestaña de <strong>Canchas (Escenarios)</strong>.
                      </div>

                      <div v-else class="d-flex align-items-center gap-2 flex-wrap p-2 border rounded-3 bg-body">
                        <button
                          v-for="sc in availableScenariesForEdition"
                          :key="sc.id"
                          type="button"
                          class="btn btn-sm rounded-pill d-flex align-items-center gap-2 transition-all"
                          :class="selectedCourtId === sc.id ? 'btn-primary shadow-sm text-white' : 'btn-outline-secondary'"
                          @click="selectCourtToConfigure(sc.id)"
                        >
                          <iconify-icon icon="solar:shield-check-bold-duotone" class="fs-5"></iconify-icon>
                          <span class="fw-semibold">{{ sc.name }}</span>
                          <span
                            class="badge rounded-pill font-monospace"
                            :class="selectedCourtId === sc.id ? 'bg-white text-primary' : (getCourtActiveDaysCount(sc.id) > 0 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary')"
                          >
                            {{ getCourtActiveDaysCount(sc.id) }} día(s) activo(s)
                          </span>
                        </button>
                      </div>
                    </div>

                    <!-- Días de Juego y Horarios por Día para la Cancha Seleccionada -->
                    <div class="col-12" v-if="selectedCourtId">
                      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                        <div>
                          <label class="form-label fw-bold small text-body-emphasis mb-0">
                            Días y Horarios para: <span class="text-primary">{{ currentCourtName }}</span>
                          </label>
                          <p class="text-muted small mb-0">Define la hora del primer y último partido para esta cancha específica.</p>
                        </div>
                        <div class="btn-group btn-group-sm">
                          <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('sunday_only')">Solo Domingo</button>
                          <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekend_std')">Sáb y Dom</button>
                          <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekend_fri')">Vie, Sáb y Dom</button>
                          <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekdays')">Entre Semana</button>
                          <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('all')">Todos</button>
                          <button type="button" class="btn btn-outline-secondary text-danger" @click="setQuickDays('none')">Desactivar</button>
                        </div>
                      </div>

                      <!-- Lista de Días con Horario Individual -->
                      <div class="d-flex flex-column gap-2 mb-3">
                        <div
                          v-for="day in weekDaysList"
                          :key="day.key"
                          class="card p-3 border rounded-3 transition-all"
                          :class="activeCourtDailySchedules[day.key]?.enabled ? 'bg-body border-primary-subtle shadow-sm' : 'bg-body-tertiary opacity-75'"
                        >
                          <div v-if="activeCourtDailySchedules[day.key]" class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <!-- Switch y Nombre del Día -->
                            <div class="d-flex align-items-center gap-2" style="min-width: 170px;">
                              <div class="form-check form-switch mb-0">
                                <input
                                  class="form-check-input cursor-pointer"
                                  type="checkbox"
                                  :id="'switch_day_form_' + day.key"
                                  v-model="activeCourtDailySchedules[day.key]!.enabled"
                                />
                              </div>
                              <label :for="'switch_day_form_' + day.key" class="form-check-label fw-bold mb-0 cursor-pointer text-body-emphasis">
                                {{ day.label }}
                              </label>
                              <span
                                class="badge ms-1 font-monospace"
                                :class="activeCourtDailySchedules[day.key]!.enabled ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'"
                              >
                                {{ activeCourtDailySchedules[day.key]!.enabled ? 'Activo' : 'Inactivo' }}
                              </span>
                            </div>

                            <!-- Inputs de Horas (Solo si el día está habilitado) -->
                            <div v-if="activeCourtDailySchedules[day.key]!.enabled" class="d-flex align-items-center gap-3 flex-wrap flex-grow-1 justify-content-md-end">
                              <div class="d-flex align-items-center gap-1">
                                <span class="small text-muted fw-semibold" style="white-space: nowrap;">1er Partido:</span>
                                <div class="input-group input-group-sm" style="width: 135px;">
                                  <span class="input-group-text"><iconify-icon icon="solar:sunrise-bold-duotone"></iconify-icon></span>
                                  <input
                                    type="time"
                                    v-model="activeCourtDailySchedules[day.key]!.startTime"
                                    class="form-control"
                                    required
                                  />
                                </div>
                              </div>

                              <div class="d-flex align-items-center gap-1">
                                <span class="small text-muted fw-semibold" style="white-space: nowrap;">Último Partido:</span>
                                <div class="input-group input-group-sm" style="width: 135px;">
                                  <span class="input-group-text"><iconify-icon icon="solar:sunset-bold-duotone"></iconify-icon></span>
                                  <input
                                    type="time"
                                    v-model="activeCourtDailySchedules[day.key]!.endTime"
                                    class="form-control"
                                    required
                                  />
                                </div>
                              </div>

                              <div class="badge bg-primary-subtle text-primary border border-primary-subtle py-1-5 px-2 font-monospace">
                                {{ getDayCalculation(day.key).hours }}h disp. · {{ getDayCalculation(day.key).matchesPerCourt }} partidos / cancha
                              </div>
                            </div>

                            <!-- Mensaje de Día Desactivado -->
                            <div v-else class="text-muted small fst-italic">
                              Sin partidos programados para esta cancha el día {{ day.label }}.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tarjeta Resumen y Capacidad Deportiva (Columna 5) -->
              <div class="col-lg-5">
                <div class="card p-4 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <iconify-icon icon="solar:calculator-minimalistic-bold-duotone" class="fs-3 text-info"></iconify-icon>
                      <h5 class="fw-bold mb-0 text-body-emphasis">Capacidad y Simulación Semanal</h5>
                    </div>

                    <div class="card p-3 mb-3 border-0 bg-primary-subtle text-primary rounded-3">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="small fw-semibold">Horas Disponibles Semanales</span>
                        <span class="fw-bold font-monospace">{{ scheduleCalculation.totalHoursWeek }} horas / sem</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="small fw-semibold">Franja x Partido (Reglamento)</span>
                        <span class="fw-bold font-monospace">{{ scheduleCalculation.slotMinutes }} min ({{ scheduleConfig.matchDurationMinutes }}m + {{ scheduleConfig.intervalMinutes }}m)</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="small fw-semibold">Días con Jornada Activa</span>
                        <span class="badge bg-primary text-white font-monospace">{{ scheduleCalculation.activeDaysCount }} de 7 días</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="small fw-semibold">Canchas Programadas</span>
                        <span class="badge bg-info text-white font-monospace">{{ scheduleCalculation.courtsCount }} cancha(s)</span>
                      </div>
                    </div>

                    <div class="row g-2 text-center mb-3">
                      <div class="col-12">
                        <div class="p-3 border rounded-3 bg-body">
                          <span class="text-muted small d-block mb-1">Capacidad Total de Partidos x Semana</span>
                          <h2 class="fw-bold text-primary mb-0 font-monospace">{{ scheduleCalculation.totalMatchesPerWeek }} <small class="fs-6 text-muted fw-normal">partidos / sem</small></h2>
                        </div>
                      </div>
                    </div>

                    <!-- Desglose por Cancha y Días Habilitados -->
                    <div class="mb-3">
                      <label class="form-label small fw-bold text-body-emphasis mb-2">Desglose por Cancha y Días Habilitados:</label>
                      <div v-if="scheduleCalculation.courtBreakdowns.length === 0" class="text-muted small p-2 border rounded bg-body">
                        No hay canchas con días activos aún. Selecciona una cancha a la izquierda y habilita sus días de juego.
                      </div>
                      <div v-else class="d-flex flex-column gap-2" style="max-height: 380px; overflow-y: auto;">
                        <div
                          v-for="cb in scheduleCalculation.courtBreakdowns"
                          :key="cb.courtId"
                          class="card p-2 border rounded bg-body shadow-none"
                        >
                          <div class="d-flex align-items-center justify-content-between border-bottom pb-1 mb-1">
                            <span class="fw-bold text-primary small d-flex align-items-center gap-1">
                              <iconify-icon icon="solar:map-point-wave-bold-duotone"></iconify-icon>
                              {{ cb.courtName }}
                            </span>
                            <span class="badge bg-success-subtle text-success font-monospace small">
                              {{ cb.totalMatches }} part. / sem
                            </span>
                          </div>
                          <div class="d-flex flex-column gap-1">
                            <div
                              v-for="d in cb.days"
                              :key="d.key"
                              class="d-flex align-items-center justify-content-between small text-muted px-1"
                            >
                              <span><strong>{{ d.label }}</strong> ({{ d.startTime }} - {{ d.endTime }})</span>
                              <span class="font-monospace text-body-emphasis">{{ d.matches }} part.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p class="text-muted small mb-0">
                      💡 <strong>Regla deportiva:</strong> Cada día tiene su propio horario independiente. El <strong>Generador de Fixture</strong> y la asignación de árbitros y vocales respetarán estos rangos exactos por cada día de la semana.
                    </p>
                  </div>

                  <div class="pt-3 border-top mt-3">
                    <button
                      type="button"
                      class="btn btn-outline-info w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      @click="applyScheduleToFixture"
                    >
                      <iconify-icon icon="solar:calendar-add-bold" class="fs-5"></iconify-icon>
                      <span>Aplicar al Generador de Fixture</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            

            <!-- TARJETA INFORMATIVA DE TRANSFERENCIA: DETECCIÓN AUTOMÁTICA DEL CLUB DE ORIGEN -->
            <div v-if="activeTab === 'playerTransfers'" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center gap-2 mb-2">
                <iconify-icon icon="solar:shield-check-bold-duotone" class="fs-4 text-warning"></iconify-icon>
                <h6 class="fw-bold mb-0 text-body-emphasis">Detección Automática de Club de Origen</h6>
              </div>
              <div v-if="checkingOriginRegistration" class="text-muted small py-2">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Verificando inscripción activa del jugador en este torneo...
              </div>
              <div v-else-if="detectedOriginRegistration" class="alert alert-info py-2 px-3 mb-0 rounded-3 border-0 bg-info-subtle text-info-emphasis d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <span class="fw-bold">Club de Origen Identificado:</span>
                  <span class="badge bg-primary text-white ms-2 px-2 py-1">
                    🛡️ {{ detectedOriginRegistration.teamRegistration?.team?.name || 'Club de Origen' }}
                  </span>
                  <span class="small ms-2 text-muted">
                    (Dorsal: {{ detectedOriginRegistration.jerseyNumber || 'S/N' }} · Clasificación: {{ detectedOriginRegistration.playerClassification?.description || 'General' }})
                  </span>
                </div>
                <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace">
                  ✓ Inscripción Activa Detectada
                </span>
              </div>
              <div v-else-if="formData.player_id && formData.edition_id" class="alert alert-warning py-2 px-3 mb-0 rounded-3 border-0 bg-warning-subtle text-warning-emphasis small">
                <iconify-icon icon="solar:info-circle-bold" class="me-1"></iconify-icon>
                El jugador seleccionado no registra una inscripción previa en este campeonato. Se tramitará como transferencia de jugador libre o incorporación inicial.
              </div>
              <div v-else class="text-muted small">
                Selecciona la <strong>Edición del Campeonato</strong> y el <strong>Futbolista</strong>. El sistema identificará automáticamente su club de origen e historial sin permitir selecciones arbitrarias.
              </div>
            </div>

            

            <div v-if="activeTab !== 'schedules'" class="row g-4">
              <div v-for="field in formFields" :key="field.key" :class="field.colClass || 'col-md-6'">
                <label class="form-label text-secondary small fw-semibold">
                  {{ field.label }}
                  <span v-if="isFieldCalculated(field)" class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">(Calculado)</span>
                  <span v-else-if="isFieldLockedByGlobal(field)" class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">Bloqueado</span>
                </label>
                <input
                  v-if="field.type === 'text' || field.type === 'number' || field.type === 'date'"
                  :type="field.type"
                  v-model="formData[field.key]"
                  class="form-control"
                  :class="{ 'bg-body-secondary text-secondary cursor-not-allowed': isFieldDisabled(field) || isFieldReadonly(field) }"
                  :placeholder="field.placeholder || ''"
                  :readonly="isFieldReadonly(field)"
                  :disabled="isFieldDisabled(field)"
                />
                <!-- Alerta reactiva de cálculo de edad para Jugadores -->
                <div v-if="activeTab === 'players' && field.key === 'birthDate' && computedPlayerAge" class="mt-2">
                  <div class="alert alert-info py-2 px-3 d-flex align-items-center gap-2 mb-0 border-0 bg-info-subtle text-info-emphasis rounded-3">
                    <iconify-icon icon="solar:cake-bold-duotone" class="fs-4 text-info"></iconify-icon>
                    <span class="small">
                      Edad calculada: <strong>{{ computedPlayerAge.years }} años</strong> (en meses: <strong>{{ computedPlayerAge.months }} meses</strong> acumulados)
                    </span>
                  </div>
                </div>
                <!-- Selector de Color con Hexadecimal y Vista Previa Interactiva -->
                <div v-else-if="field.type === 'color'" class="input-group">
                  <span class="input-group-text p-1 bg-body-tertiary">
                    <input
                      type="color"
                      :value="isValidHex(formData[field.key]) ? formData[field.key] : '#1E40AF'"
                      @input="(e: any) => formData[field.key] = e.target.value.toUpperCase()"
                      class="form-control form-control-color border-0 p-0 cursor-pointer"
                      style="width: 34px; height: 32px; border-radius: 6px;"
                      :title="'Elegir paleta para ' + field.label"
                      :disabled="isFieldDisabled(field)"
                    />
                  </span>
                  <input
                    type="text"
                    v-model="formData[field.key]"
                    class="form-control font-monospace text-uppercase"
                    :class="{ 'bg-body-secondary text-secondary cursor-not-allowed': isFieldDisabled(field) || isFieldReadonly(field) }"
                    :placeholder="field.placeholder || '#000000'"
                    maxlength="7"
                    :readonly="isFieldReadonly(field)"
                    :disabled="isFieldDisabled(field)"
                    @input="(e: any) => { if (e.target.value && !e.target.value.startsWith('#')) formData[field.key] = '#' + e.target.value }"
                  />
                  <span
                    class="input-group-text px-3"
                    :style="{
                      backgroundColor: isValidHex(formData[field.key]) ? formData[field.key] : 'transparent',
                      color: getContrastColor(formData[field.key]),
                      borderColor: 'var(--bs-border-color)'
                    }"
                    title="Muestra del color seleccionado"
                  >
                    <iconify-icon icon="solar:paint-roller-bold" class="fs-5"></iconify-icon>
                  </span>
                </div>
                <textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="formData[field.key]"
                  class="form-control"
                  :class="{ 'bg-body-secondary text-secondary cursor-not-allowed': isFieldDisabled(field) || isFieldReadonly(field) }"
                  rows="3"
                  :placeholder="field.placeholder || ''"
                  :readonly="isFieldReadonly(field)"
                  :disabled="isFieldDisabled(field)"
                ></textarea>
                <AppSelect2
                  v-else-if="field.type === 'select'"
                  v-model="formData[field.key]"
                  :options="field.options || []"
                  :placeholder="field.placeholder || '-- Seleccionar --'"
                  :disabled="isFieldDisabled(field)"
                  search-placeholder="Buscar..."
                />
                <div v-else-if="field.type === 'boolean'" class="form-check form-switch mt-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="formData[field.key]"
                    :id="'field_' + field.key"
                    :disabled="isFieldDisabled(field)"
                  />
                  <label class="form-check-label text-body-emphasis fw-semibold small ms-2" :for="'field_' + field.key">
                    {{ formData[field.key] ? 'Habilitado / Activo' : 'Deshabilitado / Inactivo' }}
                  </label>
                </div>
              </div>
            </div>

            

            <!-- Estado para Clasificación de Futbolistas: editable solo al modificar -->
            <div v-if="activeTab === 'playerClassifications' && isEditing" class="mt-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="pc_is_active_edit" />
                <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="pc_is_active_edit">
                  {{ formData.isActive ? 'Clasificación Habilitada / Activa' : 'Clasificación Deshabilitada / Inactiva' }}
                </label>
              </div>
            </div>

            

            <!-- ======================================================== -->
            <!-- SECCIÓN: MAPA INTERACTIVO Y UBICACIÓN PARA ESCENARIOS     -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'scenaries'" class="card p-3 mt-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:map-point-wave-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                  <div>
                    <h6 class="fw-bold mb-0 text-body-emphasis">Ubicación en el Mapa (Calles y Puntos Cardinales)</h6>
                    <small class="text-muted">Haz clic en el mapa o busca un sector para fijar las calles y puntos cardinales oficiales de la cancha.</small>
                  </div>
                </div>
              </div>

              <!-- Buscador en el mapa -->
              <div class="input-group mb-3">
                <span class="input-group-text bg-body border-secondary-subtle">
                  <iconify-icon icon="solar:magnifer-linear"></iconify-icon>
                </span>
                <input
                  type="text"
                  v-model="mapSearchQuery"
                  class="form-control"
                  placeholder="Buscar calle, barrio o sector en el mapa (ej. San José de Cangahua)..."
                  @keyup.enter="searchLocationOnMap"
                />
                <button type="button" class="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-1" @click="searchLocationOnMap">
                  <iconify-icon icon="solar:map-point-search-bold"></iconify-icon>
                  <span>Buscar en Mapa</span>
                </button>
              </div>

              <!-- Contenedor del Mapa Leaflet -->
              <div
                id="scenary-map-container"
                class="border rounded-3 overflow-hidden shadow-sm position-relative mb-3"
                style="height: 340px; background: #1a2234; min-height: 300px; z-index: 1;"
              ></div>

              <!-- Campos derivados del mapa (Calles y Puntos Cardinales) -->
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">
                    Calles / Dirección del Escenario <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text"><iconify-icon icon="solar:streets-map-point-bold-duotone"></iconify-icon></span>
                    <input
                      type="text"
                      v-model="formData.address"
                      class="form-control"
                      placeholder="Ej. Calle Simón Bolívar y Pichincha"
                      required
                    />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">
                    Puntos Cardinales <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text"><iconify-icon icon="solar:compass-bold-duotone" class="text-primary"></iconify-icon></span>
                    <input
                      type="text"
                      v-model="formData.cardinalPoints"
                      class="form-control font-monospace"
                      placeholder="Ej. 0° 03' 24&quot; S, 78° 12' 45&quot; O"
                      required
                    />
                  </div>
                </div>

                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Latitud</label>
                  <input type="text" v-model="formData.latitude" class="form-control form-control-sm font-monospace" placeholder="-0.057045" readonly />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Longitud</label>
                  <input type="text" v-model="formData.longitude" class="form-control form-control-sm font-monospace" placeholder="-78.209045" readonly />
                </div>

                <div class="col-md-4 d-flex align-items-end">
                  <a
                    v-if="formData.googleMapsUrl"
                    :href="formData.googleMapsUrl"
                    target="_blank"
                    class="btn btn-outline-info btn-sm w-100 rounded-pill d-inline-flex align-items-center justify-content-center gap-1"
                  >
                    <iconify-icon icon="solar:map-arrow-up-bold" class="fs-5"></iconify-icon>
                    <span>Ver en Google Maps</span>
                  </a>
                </div>

                <!-- Si está editando, mostramos el switch de estado por si se requiere inactivar -->
                <div v-if="isEditing" class="col-12 mt-2">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="scenary_is_active_edit" />
                    <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="scenary_is_active_edit">
                      {{ formData.isActive ? 'Cancha Habilitada / Activa' : 'Cancha Deshabilitada / Inactiva' }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            

            <!-- ======================================================== -->
            <!-- SECCIÓN: MODALIDAD DE IDENTIFICACIÓN DE JUGADORES       -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'categoryEditions'" class="card p-3 mt-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center gap-2 mb-3">
                <iconify-icon icon="solar:user-id-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                <div>
                  <h6 class="fw-bold mb-0 text-body-emphasis">Modalidad de Identificación de Jugadores en el Torneo</h6>
                  <small class="text-muted">Define si en este campeonato los jugadores se configurarán y registrarán por su número de camiseta (dorsal) o mediante su código único secuencial de jugador.</small>
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <div
                    class="card p-3 border rounded-3 cursor-pointer h-100 transition-all shadow-sm"
                    :class="!formData.identifyByPlayerCode ? 'border-primary bg-primary-subtle bg-opacity-25' : 'border-secondary-subtle bg-body'"
                    @click="formData.identifyByPlayerCode = false"
                  >
                    <div class="form-check d-flex align-items-start gap-2">
                      <input
                        class="form-check-input mt-1 cursor-pointer"
                        type="radio"
                        name="identifyMode"
                        id="identifyByJersey"
                        :checked="!formData.identifyByPlayerCode"
                        @change="formData.identifyByPlayerCode = false"
                      />
                      <label class="form-check-label cursor-pointer" for="identifyByJersey">
                        <span class="fw-bold d-block text-body-emphasis mb-1">
                          🎽 Por Número de Jugador (Dorsal de Camiseta)
                        </span>
                        <small class="text-secondary d-block">
                          Los jugadores juegan y se identifican en cada partido con el número asignado a su camiseta (del 1 al 99).
                        </small>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div
                    class="card p-3 border rounded-3 cursor-pointer h-100 transition-all shadow-sm"
                    :class="formData.identifyByPlayerCode ? 'border-primary bg-primary-subtle bg-opacity-25' : 'border-secondary-subtle bg-body'"
                    @click="formData.identifyByPlayerCode = true"
                  >
                    <div class="form-check d-flex align-items-start gap-2">
                      <input
                        class="form-check-input mt-1 cursor-pointer"
                        type="radio"
                        name="identifyMode"
                        id="identifyByCode"
                        :checked="formData.identifyByPlayerCode === true"
                        @change="formData.identifyByPlayerCode = true"
                      />
                      <label class="form-check-label cursor-pointer" for="identifyByCode">
                        <span class="fw-bold d-block text-body-emphasis mb-1">
                          🏷️ Por Código Único de Jugador (Secuencial)
                        </span>
                        <small class="text-secondary d-block">
                          Los jugadores se identifican mediante el código secuencial asignado por la liga (ej. JUG-00001), independientemente del número en su camiseta.
                        </small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            

            <!-- ======================================================== -->
            <!-- SECCIÓN: CANCHAS DISPONIBLES PARA EL CAMPEONATO           -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'categoryEditions'" class="card p-3 mt-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:map-point-wave-bold-duotone" class="fs-4 text-success"></iconify-icon>
                  <div>
                    <h6 class="fw-bold mb-0 text-body-emphasis">Canchas Habilitadas para este Campeonato</h6>
                    <small class="text-muted">Selecciona las canchas o escenarios deportivos donde se disputará esta edición del campeonato.</small>
                  </div>
                </div>
                <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold">
                  {{ (formData.availableScenaryIds || []).length }} Cancha(s) Habilitada(s)
                </span>
              </div>

              <div v-if="scenariesList.length === 0" class="alert alert-warning mb-0 py-2 d-flex align-items-center gap-2">
                <iconify-icon icon="solar:danger-triangle-bold" class="fs-4 text-warning"></iconify-icon>
                <span>No hay canchas registradas en el sistema. Registra canchas en la pestaña <strong>Escenarios / Canchas</strong>.</span>
              </div>

              <div v-else class="row g-3">
                <div v-for="sc in scenariesList" :key="sc.id" class="col-md-6 col-lg-4">
                  <div
                    class="card h-100 p-3 border rounded-3 cursor-pointer transition-all"
                    :class="(formData.availableScenaryIds || []).includes(sc.id) ? 'border-success bg-success-subtle shadow-sm' : 'border-secondary-subtle bg-body'"
                    @click="toggleScenarySelection(sc.id)"
                  >
                    <div class="d-flex align-items-start gap-3">
                      <input
                        type="checkbox"
                        class="form-check-input mt-1 cursor-pointer"
                        :checked="(formData.availableScenaryIds || []).includes(sc.id)"
                        @change.stop="toggleScenarySelection(sc.id)"
                      />
                      <div class="flex-grow-1">
                        <div class="fw-bold text-body-emphasis">{{ sc.name }}</div>
                        <div class="small text-muted mt-1" v-if="sc.address || sc.location">
                          📍 {{ sc.address || sc.location }}
                        </div>
                        <div class="small font-monospace text-secondary mt-1" v-if="sc.cardinalPoints">
                          🧭 {{ sc.cardinalPoints }}
                        </div>
                        <div class="mt-2">
                          <span class="badge bg-secondary-subtle text-secondary font-monospace small">
                            {{ sc.surfaceType === 'SYNTHETIC' ? 'Césped Sintético' : sc.surfaceType === 'NATURAL_GRASS' ? 'Césped Natural' : sc.surfaceType || 'Cancha Oficial' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            

            <!-- ======================================================== -->
            <!-- SECCIÓN MAESTRO-DETALLE: CATEGORÍAS DE LA EDICIÓN        -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'categoryEditions'" class="card p-3 mt-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:cup-bold" class="fs-4 text-primary"></iconify-icon>
                  <div>
                    <h6 class="fw-bold mb-0 text-body-emphasis">Detalle de Categorías del Torneo (Edición de Torneo Detalle Categorías)</h6>
                    <small class="text-muted">Agrega las categorías que competirán en esta edición, con sus fechas oficiales, costo y clasificaciones.</small>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
                    {{ editionCategoriesDetail.length }} Categoría(s) Agregada(s)
                  </span>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 fw-semibold shadow-sm"
                    @click="addCategoryToEditionDetail"
                  >
                    <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
                    <span>+ Agregar</span>
                  </button>
                </div>
              </div>

              <!-- Tabla Maestro-Detalle idéntica al formato de referencia -->
              <div class="table-responsive border rounded-3 bg-body shadow-sm">
                <table class="table table-hover table-sm align-middle mb-0">
                  <thead class="table-light fs-1 text-uppercase">
                    <tr>
                      <th style="width: 70px;" class="text-center">#</th>
                      <th style="min-width: 220px; width: 22%;">Categoría *</th>
                      <th style="min-width: 140px; width: 14%;">Fechas (Inicio - Fin)</th>
                      <th style="min-width: 100px; width: 9%;" class="text-end">Costo ($)</th>
                      <th style="min-width: 70px; width: 6%;" class="text-center">Máx. Jug. *</th>
                      <th style="min-width: 150px; width: 15%;" class="text-center">Tiempos (Dur./Desc./Esp.)</th>
                      <th style="min-width: 110px; width: 11%;" class="text-center">Clasificaciones</th>
                      <th style="min-width: 110px; width: 11%;" class="text-center">Etapas / Fases</th>
                      <th style="width: 85px;" class="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="editionCategoriesDetail.length === 0">
                      <td colspan="9" class="text-center py-5 text-muted">
                        <iconify-icon icon="solar:info-circle-line-duotone" class="fs-2 d-block mb-2 text-secondary"></iconify-icon>
                        Aún no se han agregado categorías al detalle de esta edición de torneo.<br/>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 mt-2 fw-semibold"
                          @click="addCategoryToEditionDetail"
                        >
                          <iconify-icon icon="solar:add-circle-bold" class="fs-5 me-1"></iconify-icon>
                          <span>Agregar Primera Categoría</span>
                        </button>
                      </td>
                    </tr>
                    <template v-for="(item, idx) in editionCategoriesDetail" :key="item._uid || idx">
                      <!-- Fila Maestra de Categoría -->
                      <tr>
                        <!-- Columna # con número y chevron de expansión -->
                        <td class="text-center">
                          <div class="d-flex align-items-center justify-content-center gap-2">
                            <span class="fw-bold font-monospace text-secondary fs-3">{{ idx + 1 }}</span>
                            <button
                              type="button"
                              class="btn btn-sm btn-link p-0 text-decoration-none d-inline-flex align-items-center justify-content-center text-body-emphasis"
                              @click="toggleCategoryRow(idx)"
                              :title="isCategoryRowExpanded(idx) ? 'Colapsar detalles de categoría' : 'Expandir etapas y fases'"
                            >
                              <iconify-icon
                                :icon="isCategoryRowExpanded(idx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'"
                                class="fs-5 fw-bold"
                              ></iconify-icon>
                            </button>
                          </div>
                        </td>

                        <!-- Columna Categoría -->
                        <td>
                          <div class="d-flex align-items-start gap-2">
                            <div class="p-2 rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center mt-1 flex-shrink-0" style="width: 36px; height: 36px;">
                              <iconify-icon icon="solar:cup-bold" class="fs-4"></iconify-icon>
                            </div>
                            <div class="flex-grow-1" style="min-width: 180px;">
                              <select
                                v-model="item.categoryId"
                                class="form-select form-select-sm fw-semibold"
                                @change="onCategoryChangeInRow(item)"
                                required
                              >
                                <option value="" disabled>-- Seleccione una Categoría --</option>
                                <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">
                                  {{ cat.name }} {{ cat.acronyms ? '[' + cat.acronyms + ']' : '' }} ({{ cat.gender === 'MALE' ? 'Varones' : cat.gender === 'FEMALE' ? 'Mujeres' : 'Mixto' }})
                                </option>
                              </select>
                              <div v-if="item.categoryId" class="mt-1 d-flex align-items-center gap-1 flex-wrap">
                                <span v-if="getCategoryAcronymsById(item.categoryId)" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-1 py-0 fs-1">
                                  Siglas: {{ getCategoryAcronymsById(item.categoryId) }}
                                </span>
                                <span class="badge bg-secondary-subtle text-body border border-secondary-subtle px-1 py-0 fs-1">
                                  {{ getCategoryGenderById(item.categoryId) }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <!-- Fechas (Inicio - Fin) -->
                        <td>
                          <div class="d-flex flex-column gap-1" style="min-width: 125px;">
                            <div class="d-flex align-items-center gap-1">
                              <span class="badge bg-light text-muted border px-1 py-0 font-monospace" style="font-size: 0.72rem; min-width: 28px;">Ini</span>
                              <input
                                type="date"
                                v-model="item.startDate"
                                class="form-control form-control-sm py-0 px-1 font-monospace"
                              />
                            </div>
                            <div class="d-flex align-items-center gap-1">
                              <span class="badge bg-light text-muted border px-1 py-0 font-monospace" style="font-size: 0.72rem; min-width: 28px;">Fin</span>
                              <input
                                type="date"
                                v-model="item.endDate"
                                class="form-control form-control-sm py-0 px-1 font-monospace"
                              />
                            </div>
                          </div>
                        </td>

                        <!-- Costo ($) -->
                        <td>
                          <div class="input-group input-group-sm" style="min-width: 90px;">
                            <span class="input-group-text px-1">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              v-model.number="item.registrationFee"
                              class="form-control form-control-sm text-end font-monospace px-1"
                              placeholder="0.00"
                            />
                          </div>
                        </td>

                        <!-- Máximo Jugadores -->
                        <td>
                          <div style="min-width: 60px;">
                            <input
                              type="number"
                              min="1"
                              v-model.number="item.maxPlayers"
                              class="form-control form-control-sm font-monospace text-center px-1"
                              placeholder="25"
                              required
                            />
                          </div>
                        </td>

                        <!-- Tiempos (Duración / Descanso / Espera) -->
                        <td>
                          <div class="d-flex align-items-center justify-content-center gap-1" style="min-width: 140px;">
                            <div class="input-group input-group-sm" title="Duración del partido en minutos">
                              <input
                                type="number"
                                min="10"
                                max="120"
                                step="5"
                                v-model.number="item.matchDurationMinutes"
                                class="form-control form-control-sm font-monospace text-center px-1"
                                placeholder="60"
                                required
                              />
                              <span class="input-group-text px-1 text-muted fs-1">m</span>
                            </div>
                            <div class="input-group input-group-sm" title="Descanso o entretiempo (minutos)">
                              <input
                                type="number"
                                min="0"
                                max="45"
                                step="5"
                                v-model.number="item.breakDurationMinutes"
                                class="form-control form-control-sm font-monospace text-center px-1"
                                placeholder="10"
                              />
                              <span class="input-group-text px-1 text-muted fs-1">m</span>
                            </div>
                            <div class="input-group input-group-sm" title="Tiempo de espera para el siguiente partido (minutos)">
                              <input
                                type="number"
                                min="0"
                                max="60"
                                step="5"
                                v-model.number="item.waitBetweenMatchesMinutes"
                                class="form-control form-control-sm font-monospace text-center px-1"
                                placeholder="10"
                              />
                              <span class="input-group-text px-1 text-muted fs-1">m</span>
                            </div>
                          </div>
                        </td>

                        <!-- Clasificaciones -->
                        <td class="text-center">
                          <div class="d-flex align-items-center justify-content-center gap-1" style="min-width: 105px;">
                            <span
                              v-if="item.classifications && item.classifications.length"
                              class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1"
                              title="Total jugadores asignados / cupo máximo"
                            >
                              {{ getSumClassifications(item) }}/{{ item.maxPlayers || 25 }}
                            </span>
                            <span
                              v-else
                              class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1"
                              title="Sin clasificaciones asignadas aún"
                            >
                              0/{{ item.maxPlayers || 25 }}
                            </span>
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                              style="width: 28px; height: 28px;"
                              @click="openCategoryClassificationsModal(item, idx)"
                              title="Configurar Clasificaciones y Cupos"
                            >
                              <iconify-icon icon="solar:user-check-bold" class="fs-6"></iconify-icon>
                            </button>
                          </div>
                        </td>

                        <!-- Etapas / Fases -->
                        <td class="text-center">
                          <div class="d-flex align-items-center justify-content-center gap-1" style="min-width: 110px;">
                            <button
                              type="button"
                              class="btn btn-sm rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1 border"
                              :class="item.stages && item.stages.length ? 'btn-info-subtle text-info border-info-subtle' : 'btn-light text-muted border-secondary-subtle'"
                              @click="toggleCategoryRow(idx)"
                              title="Ver/Ocultar Etapas y Fases"
                            >
                              <iconify-icon icon="solar:diagram-up-bold" class="fs-6"></iconify-icon>
                              <span class="small fw-semibold">{{ item.stages && item.stages.length ? (item.stages.length + ' Etapa(s)') : '0 Etapas' }}</span>
                              <iconify-icon :icon="isCategoryRowExpanded(idx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" class="fs-6 ms-1"></iconify-icon>
                            </button>
                          </div>
                        </td>

                        <!-- Acciones Maestras: Botón azul editar + Botón rojo eliminar -->
                        <td class="text-center">
                          <div class="d-flex align-items-center justify-content-center gap-1">
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                              style="width: 32px; height: 32px;"
                              @click="openCategoryClassificationsModal(item, idx)"
                              title="Configurar Clasificaciones y Cupos"
                            >
                              <iconify-icon icon="solar:pen-bold" class="fs-5"></iconify-icon>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                              style="width: 32px; height: 32px;"
                              @click="removeCategoryFromEditionDetail(idx)"
                              title="Eliminar Categoría"
                            >
                              <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                            </button>
                          </div>
                        </td>
                      </tr>

                      <!-- Sub-Tarjeta Anidada: Detalle de Etapas / Fases de la Categoría -->
                      <tr v-if="isCategoryRowExpanded(idx)" class="bg-transparent">
                        <td colspan="9" class="p-3 bg-transparent">
                          <div class="card border border-primary-subtle rounded-3 shadow-sm bg-body-tertiary p-3">
                            <!-- Encabezado de la sub-tarjeta -->
                            <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                              <div class="d-flex align-items-center gap-2">
                                <iconify-icon icon="solar:diagram-up-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                                <span class="fw-bold text-body-emphasis fs-6">Etapas y Fases de la Categoría</span>
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 fs-1">
                                  {{ item.stages?.length || 0 }} registros
                                </span>
                              </div>
                              <div class="d-flex align-items-center gap-2">
                                <button
                                  type="button"
                                  class="btn btn-sm btn-link text-muted p-0 text-decoration-none d-flex align-items-center"
                                  @click="toggleCategoryRow(idx)"
                                  title="Colapsar Etapas"
                                >
                                  <iconify-icon icon="solar:alt-arrow-up-linear" class="fs-5"></iconify-icon>
                                </button>
                              </div>
                            </div>

                            <!-- Sub-tabla anidada editable 100% en línea -->
                            <div class="table-responsive rounded-2 border bg-body shadow-sm">
                              <table class="table table-sm table-hover align-middle mb-0">
                                <thead class="table-light fs-1 text-uppercase">
                                  <tr>
                                    <th style="width: 50px;" class="text-center">#</th>
                                    <th style="min-width: 180px; width: 22%;">Nombre de la Etapa / Fase *</th>
                                    <th style="min-width: 160px; width: 20%;">Tipo de Competencia *</th>
                                    <th style="min-width: 150px; width: 18%;">Vueltas / Modalidad *</th>
                                    <th style="min-width: 300px; width: 34%;">Criterios de Desempate (Jerarquía en Línea)</th>
                                    <th style="width: 60px;" class="text-center">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-if="!item.stages || item.stages.length === 0">
                                    <td colspan="6" class="text-center py-4 text-muted">
                                      <iconify-icon icon="solar:info-circle-line-duotone" class="fs-3 d-block mb-1 text-secondary"></iconify-icon>
                                      No se han configurado etapas para esta categoría.<br/>
                                      <button
                                        type="button"
                                        class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 mt-2 fw-semibold"
                                        @click="addStageToCategoryDirect(item)"
                                      >
                                        <iconify-icon icon="solar:add-circle-bold" class="fs-5 me-1"></iconify-icon>
                                        <span>+ Agregar Primera Etapa en Línea</span>
                                      </button>
                                    </td>
                                  </tr>
                                  <tr v-for="(stg, sIdx) in item.stages" :key="stg._uid || sIdx">
                                    <!-- # Numeración compuesta -->
                                    <td class="text-center fw-bold font-monospace text-secondary fs-2">
                                      {{ (idx + 1) + '.' + (sIdx + 1) }}
                                    </td>

                                    <!-- Nombre de la Etapa / Fase -->
                                    <td>
                                      <div>
                                        <input
                                          type="text"
                                          v-model="stg.name"
                                          class="form-control form-control-sm fw-semibold"
                                          placeholder="Ej. Primera Fase"
                                          required
                                        />
                                        <small class="text-muted font-monospace d-block mt-1">Orden en fase: #{{ stg.stageOrder || (sIdx + 1) }}</small>
                                      </div>
                                    </td>

                                    <!-- Tipo de Competencia -->
                                    <td>
                                      <select
                                        v-model="stg.competitionTypeId"
                                        class="form-select form-select-sm"
                                        @change="onCompetitionTypeChangeInStage(stg)"
                                        required
                                      >
                                        <option value="" disabled>-- Tipo Competencia --</option>
                                        <option v-for="ct in competitionTypesList" :key="ct.id" :value="ct.id">
                                          {{ ct.description }}
                                        </option>
                                      </select>
                                    </td>

                                    <!-- Vueltas / Modalidad -->
                                    <td>
                                      <select
                                        v-model="stg.competitionLapId"
                                        class="form-select form-select-sm"
                                        @change="onCompetitionLapChangeInStage(stg)"
                                        required
                                      >
                                        <option value="" disabled>-- Modalidad Vueltas --</option>
                                        <option v-for="cl in competitionLapsList" :key="cl.id" :value="cl.id">
                                          {{ cl.description }}
                                        </option>
                                      </select>
                                    </td>

                                    <!-- Criterios de Desempate (Jerarquía en Línea) -->
                                    <td>
                                      <div>
                                        <!-- Selector rápido de criterios -->
                                        <select
                                          class="form-select form-select-sm"
                                          @change="addCriterionToStageDirect(stg, $event)"
                                        >
                                          <option value="" selected>+ Agregar criterio reglamentario...</option>
                                          <option
                                            v-for="crit in tieBreakerCriteriaList"
                                            :key="crit.id"
                                            :value="crit.id"
                                            :disabled="isCriterionAlreadyInStage(stg, crit.id)"
                                          >
                                            {{ crit.description }} {{ crit.code ? '(' + crit.code + ')' : '' }}
                                          </option>
                                        </select>

                                        <!-- Chips de criterios jerárquicos con botones subir/bajar -->
                                        <div v-if="stg.tieBreakerCriteria && stg.tieBreakerCriteria.length" class="d-flex flex-column gap-1 mt-1">
                                          <div
                                            v-for="(c, cIdx) in stg.tieBreakerCriteria"
                                            :key="c.criterionId || c.id || cIdx"
                                            class="d-flex align-items-center justify-content-between gap-1 p-1 rounded bg-body-tertiary border border-primary-subtle"
                                          >
                                            <div class="d-flex align-items-center gap-1 overflow-hidden">
                                              <!-- Botones ▲ y ▼ -->
                                              <div class="btn-group btn-group-sm flex-shrink-0" role="group">
                                                <button
                                                  type="button"
                                                  class="btn btn-sm btn-outline-secondary py-0 px-1"
                                                  style="font-size: 0.7rem; line-height: 1.2;"
                                                  :disabled="cIdx === 0"
                                                  @click="moveStageCriterionUp(stg, cIdx)"
                                                  title="Subir orden"
                                                >
                                                  ▲
                                                </button>
                                                <button
                                                  type="button"
                                                  class="btn btn-sm btn-outline-secondary py-0 px-1"
                                                  style="font-size: 0.7rem; line-height: 1.2;"
                                                  :disabled="cIdx === stg.tieBreakerCriteria.length - 1"
                                                  @click="moveStageCriterionDown(stg, cIdx)"
                                                  title="Bajar orden"
                                                >
                                                  ▼
                                                </button>
                                              </div>
                                              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace py-0 px-1 fs-1 flex-shrink-0">
                                                #{{ c.order || (cIdx + 1) }}
                                              </span>
                                              <span class="small fw-semibold text-truncate text-body" :title="c.description">
                                                {{ c.description }}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              class="btn btn-sm btn-link text-danger p-0 px-1 text-decoration-none"
                                              @click="removeStageCriterion(stg, cIdx)"
                                              title="Quitar criterio"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                        <div v-else class="text-muted small fst-italic mt-1">
                                          Sin criterios seleccionados aún
                                        </div>
                                      </div>
                                    </td>

                                    <!-- Acción: Eliminar Fila de Etapa -->
                                    <td class="text-center">
                                      <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                                        style="width: 28px; height: 28px;"
                                        @click="removeCategoryStageDirect(item, sIdx)"
                                        title="Eliminar Etapa"
                                      >
                                        <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-6"></iconify-icon>
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <!-- Pie de la sub-tarjeta: botón + Agregar Etapa en Línea -->
                            <div class="mt-2 pt-1">
                              <button
                                type="button"
                                class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                                @click="addStageToCategoryDirect(item)"
                              >
                                <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
                                <span>+ Agregar Etapa / Fase</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ======================================================== -->
            <!-- SECCIÓN MAESTRO-DETALLE: ETAPAS DE LA PLANTILLA         -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'stages'" class="card p-3 mt-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:diagram-up-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                  <div>
                    <h6 class="fw-bold mb-0 text-body-emphasis">Detalle de Etapas y Fases de la Plantilla</h6>
                    <small class="text-muted">Define las fases secuenciales que componen esta plantilla (orden, nombre, tipo de competencia, vueltas y desempate).</small>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
                    {{ templateStagesDetail.length }} Etapa(s) en la Plantilla
                  </span>
                </div>
              </div>

              <!-- Formulario interactivo para agregar etapa a la plantilla -->
              <div class="card p-3 mb-3 border rounded-3 bg-body shadow-xs">
                <h6 class="fw-bold mb-3 text-body-emphasis d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:add-circle-bold" class="fs-5 text-primary"></iconify-icon>
                  <span>Agregar Nueva Etapa o Fase a la Plantilla</span>
                </h6>
                <div class="row g-3 align-items-end">
                  <div class="col-md-2">
                    <label class="form-label small fw-semibold text-secondary">Orden <span class="text-danger">*</span></label>
                    <input
                      type="number"
                      v-model.number="formTemplateStage.stageOrder"
                      class="form-control form-control-sm font-monospace text-center"
                      min="1"
                      placeholder="1"
                    />
                  </div>

                  <div class="col-md-5">
                    <label class="form-label small fw-semibold text-secondary">Nombre de la Etapa / Fase <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="formTemplateStage.name"
                      class="form-control form-control-sm"
                      placeholder="Ej. Primera Etapa - Clasificatoria"
                      @keyup.enter.prevent="addTemplateStageRecord"
                    />
                  </div>

                  <div class="col-md-5">
                    <label class="form-label small fw-semibold text-secondary">Tipo Principal de Competencia <span class="text-danger">*</span></label>
                    <AppSelect2
                      v-model="formTemplateStage.competitionTypeId"
                      :options="competitionTypeOptions"
                      placeholder="Seleccionar tipo de competencia..."
                      search-placeholder="Buscar tipo..."
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-semibold text-secondary">Vueltas / Modalidad <span class="text-danger">*</span></label>
                    <AppSelect2
                      v-model="formTemplateStage.competitionLapId"
                      :options="competitionLapOptions"
                      placeholder="Seleccionar modalidad de vueltas..."
                      search-placeholder="Buscar vueltas..."
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-semibold text-secondary">Criterio de Desempate</label>
                    <AppSelect2
                      v-model="formTemplateStage.tieBreakerCriterionId"
                      :options="tieBreakerCriteriaOptions"
                      placeholder="Seleccionar criterio (opcional)..."
                      search-placeholder="Buscar criterio..."
                      allow-clear
                    />
                  </div>

                  <div class="col-12 text-end mt-2">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm rounded-pill fw-semibold px-4 d-inline-flex align-items-center gap-1 shadow-sm"
                      @click="addTemplateStageRecord"
                    >
                      <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
                      <span>+ Agregar Etapa a la Plantilla</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tabla de Etapas de la Plantilla -->
              <div class="table-responsive border rounded-3 bg-body shadow-sm">
                <table class="table table-hover table-sm align-middle mb-0">
                  <thead class="table-primary fs-1 text-uppercase">
                    <tr>
                      <th class="ps-3 text-center" style="width: 75px;">Orden</th>
                      <th>Nombre de la Etapa / Fase</th>
                      <th>Tipo de Competencia</th>
                      <th>Vueltas / Modalidad</th>
                      <th>Criterio de Desempate</th>
                      <th class="text-end pe-3" style="width: 60px;">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="templateStagesDetail.length === 0">
                      <td colspan="6" class="text-center py-4 text-muted">
                        <iconify-icon icon="solar:info-circle-line-duotone" class="fs-2 text-secondary mb-1 d-block"></iconify-icon>
                        Aún no se han agregado etapas a esta plantilla. Utiliza el formulario superior para añadir la primera fase.
                      </td>
                    </tr>
                    <tr v-for="(stg, sIdx) in templateStagesDetail" :key="stg._uid || sIdx">
                      <td class="text-center ps-3">
                        <span class="badge bg-secondary-subtle text-body font-monospace px-2 py-1 fs-2">
                          #{{ stg.stageOrder || (sIdx + 1) }}
                        </span>
                      </td>
                      <td>
                        <span class="fw-bold text-body-emphasis">
                          🏆 {{ stg.name }}
                        </span>
                      </td>
                      <td>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                          {{ getCompetitionTypeDescById(stg.competitionTypeId) || 'Todos contra Todos' }}
                        </span>
                      </td>
                      <td>
                        <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                          {{ getCompetitionLapDescById(stg.competitionLapId) || '1 Vuelta' }}
                        </span>
                      </td>
                      <td>
                        <span v-if="stg.tieBreakerCriterionId" class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                          ⚖️ {{ getTieBreakerCriterionDescById(stg.tieBreakerCriterionId) }}
                        </span>
                        <span v-else class="text-muted small">Sin criterio</span>
                      </td>
                      <td class="text-end pe-3">
                        <button
                          type="button"
                          class="btn btn-link text-danger p-0 border-0"
                          title="Eliminar Etapa de la Plantilla"
                          @click="removeTemplateStageRecord(sIdx)"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
              v-if="activeTab === 'schedules'"
              type="button"
              class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
              :disabled="savingSchedule"
              @click="saveScheduleConfig"
            >
              <span v-if="savingSchedule" class="spinner-grow spinner-grow-sm text-white" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
              <span>{{ savingSchedule ? 'Guardando...' : 'Guardar Horarios' }}</span>
            </button>
            <button
              v-else
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

    <!-- ========================================== -->
    <!-- MODAL: GENERADOR DE FIXTURE AUTOMÁTICO     -->
    <!-- ========================================== -->
    <div v-if="showFixtureModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.7); z-index: 1055;">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2">
              <iconify-icon icon="solar:calendar-add-bold" class="fs-4"></iconify-icon>
              <span>Generador Automático de Fixture (Round-Robin)</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showFixtureModal = false"></button>
          </div>
          <form @submit.prevent="generateFixture">
            <div class="modal-body p-4">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold small text-dark">Etapa / Fase del Torneo <span class="text-danger">*</span></label>
                  <select v-model="formFixture.stageId" class="form-select" required>
                    <option value="" disabled>Seleccione la etapa...</option>
                    <option v-for="s in stagesList" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small text-dark">Cancha / Escenario Principal</label>
                  <select v-model="formFixture.scenaryId" class="form-select">
                    <option value="">Por definir / Asignar después</option>
                    <option v-for="sc in scenariesList" :key="sc.id" :value="sc.id">{{ sc.name }}</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small text-dark">Fecha y Hora de la 1° Fecha <span class="text-danger">*</span></label>
                  <input type="datetime-local" v-model="formFixture.startDate" class="form-control" required />
                </div>

                <div class="col-md-3">
                  <label class="form-label fw-semibold small text-dark">Días entre Fechas</label>
                  <input type="number" v-model.number="formFixture.intervalDays" class="form-control" min="1" max="30" />
                  <small class="text-muted fs-1">Ej. 7 para cada semana</small>
                </div>

                <div class="col-md-3">
                  <label class="form-label fw-semibold small text-dark">Minutos x Partido</label>
                  <input type="number" v-model.number="formFixture.matchDurationMinutes" class="form-control" min="30" max="120" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small text-dark">Sistema de Vueltas (Algoritmo de Berger)</label>
                  <select v-model.number="formFixture.numberOfLaps" class="form-select">
                    <option :value="1">Solo Ida (1 Vuelta)</option>
                    <option :value="2">Ida y Vuelta (2 Vueltas - Revancha)</option>
                  </select>
                </div>

                <div class="col-12 mt-3">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <label class="form-label fw-semibold small text-dark mb-0">
                      Equipos Participantes (Seleccionados: {{ formFixture.teamIds.length }}) <span class="text-danger">*</span>
                    </label>
                    <button type="button" class="btn btn-sm btn-outline-primary" @click="selectAllTeams">
                      {{ formFixture.teamIds.length === teamsList.length ? 'Deseleccionar Todos' : 'Seleccionar Todos' }}
                    </button>
                  </div>
                  <div class="border rounded p-3" style="max-height: 200px; overflow-y: auto; background: #f8fafc;">
                    <div class="row g-2">
                      <div v-for="t in teamsList" :key="t.id" class="col-md-6">
                        <div class="form-check">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            :value="t.id"
                            :id="'team_' + t.id"
                            v-model="formFixture.teamIds"
                          />
                          <label class="form-check-label fw-medium small text-dark" :for="'team_' + t.id">
                            {{ t.name }} <span v-if="t.shortName" class="text-muted">({{ t.shortName }})</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <small class="text-muted fs-1 d-block mt-1">
                    Si el número de equipos es impar, el sistema programará automáticamente una fecha libre para cada equipo.
                  </small>
                </div>
              </div>
            </div>

            
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="showFixtureModal = false">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                :disabled="generatingFixture || formFixture.teamIds.length < 2 || !formFixture.stageId"
              >
                <span v-if="generatingFixture" class="spinner-grow spinner-grow-sm text-white"></span>
                <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
                <span>{{ generatingFixture ? 'Generando Fixture...' : 'Generar Calendario Oficial' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: VISOR DE CARNET DEPORTIVO (QR)      -->
    <!-- ========================================== -->
    <div v-if="showCarnetModal && selectedCarnet" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.7); z-index: 1055;">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2">
              <iconify-icon icon="solar:card-2-bold-duotone" class="fs-4 text-warning"></iconify-icon>
              <span>Credencial Deportiva Oficial</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showCarnetModal = false"></button>
          </div>
          <div class="modal-body p-4 text-center">
            <!-- Credencial Estilo PVC de Cancha -->
            <div
              id="printableCarnet"
              class="card shadow-sm border-2 border-primary mx-auto position-relative overflow-hidden"
              style="max-width: 380px; border-radius: 1.25rem; background: linear-gradient(145deg, #ffffff 0%, #f0f4f8 100%); text-align: left;"
            >
              <!-- Cabecera de la credencial -->
              <div class="bg-primary text-white p-3 text-center">
                <span class="badge bg-white text-primary fw-bold font-monospace mb-1">LIGA & TORNEO DEPORTIVO</span>
                <h6 class="fw-bold mb-0 text-white text-uppercase tracking-wide">CARNET DE JUGADOR</h6>
              </div>

              <div class="p-3">
                <div class="row align-items-center g-3">
                  <!-- Foto del Jugador -->
                  <div class="col-4 text-center">
                    <img
                      v-if="selectedCarnet.photo || selectedCarnet.player?.photo"
                      :src="selectedCarnet.photo || selectedCarnet.player?.photo"
                      class="rounded-3 border border-2 border-primary shadow-sm"
                      style="width: 90px; height: 110px; object-fit: cover;"
                    />
                    <div
                      v-else
                      class="rounded-3 border border-2 border-secondary bg-light d-flex align-items-center justify-content-center mx-auto"
                      style="width: 90px; height: 110px;"
                    >
                      <iconify-icon icon="solar:user-bold" class="fs-1 text-secondary"></iconify-icon>
                    </div>
                    <span class="badge bg-dark text-white font-monospace mt-2 d-block">
                      DORSAL #{{ selectedCarnet.dorsalNumber || selectedCarnet.player?.jerseyNumber || 'S/N' }}
                    </span>
                  </div>

                  <!-- Datos del Jugador -->
                  <div class="col-8">
                    <h5 class="fw-bold mb-1 text-dark">
                      {{ selectedCarnet.player?.name || 'Nombre' }} {{ selectedCarnet.player?.lastName || '' }}
                    </h5>
                    <p class="mb-1 text-muted small font-monospace">
                      Doc: <strong>{{ selectedCarnet.player?.identification || 'Sin Cédula' }}</strong>
                    </p>
                    <div class="mb-1 d-flex align-items-center gap-1">
                      <img
                        v-if="selectedCarnet.team?.logo || selectedCarnet.teamLogo"
                        :src="selectedCarnet.team?.logo || selectedCarnet.teamLogo"
                        class="rounded-circle shadow-sm border"
                        style="width: 20px; height: 20px; object-fit: cover;"
                      />
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-2">
                        Club: {{ selectedCarnet.team?.name || selectedCarnet.teamName || 'Equipo' }}
                      </span>
                    </div>
                    <div class="mb-1">
                      <span class="badge bg-info-subtle text-info border border-info-subtle fs-1">
                        Posición: {{ selectedCarnet.player?.demarcation?.name || 'Deportista' }}
                      </span>
                    </div>
                    <div>
                      <span
                        class="badge"
                        :class="selectedCarnet.status === 'APPROVED' || selectedCarnet.status === 'ACTIVE' || selectedCarnet.isActive ? 'bg-success text-white' : 'bg-warning text-dark'"
                      >
                        ● HABILITADO PARA CANCHA
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Código QR de Validación en Cancha -->
                <div class="border-top border-2 border-dark-subtle mt-3 pt-3 text-center">
                  <div class="d-flex align-items-center justify-content-center gap-3">
                    <img
                      :src="`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent('JUGADOR:' + (selectedCarnet.player?.identification || selectedCarnet.id) + '|CLUB:' + (selectedCarnet.team?.name || ''))}`"
                      alt="QR Carnet"
                      style="width: 80px; height: 80px;"
                      class="border rounded p-1 bg-white"
                    />
                    <div class="text-start">
                      <small class="d-block text-muted font-monospace fs-1">CÓDIGO DE VALIDACIÓN</small>
                      <small class="fw-bold font-monospace text-dark">{{ selectedCarnet.carnetNumber || selectedCarnet.id?.substring(0, 8).toUpperCase() }}</small>
                      <small class="d-block text-muted fs-1 mt-1">Escanee para verificar habilitación en mesa</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="showCarnetModal = false">
              Cerrar
            </button>
            <button type="button" class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2" @click="printCarnet">
              <iconify-icon icon="solar:printer-line-duotone" class="fs-5"></iconify-icon>
              <span>Imprimir Credencial</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 5. MODAL: HISTORIAL DE CATEGORÍAS DEL EQUIPO             -->
    <!-- ========================================================= -->
    <div
      v-if="showTeamCategoryModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.65); z-index: 1060;"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:history-bold-duotone" class="fs-3"></iconify-icon>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0">
                  Historial de Categorías · {{ selectedTeamForHistory?.name }}
                </h5>
                <small class="text-white-50">Registro por campeonatos anuales (ej: 2026 Máxima, 2027 Primera)</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showTeamCategoryModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <!-- Nota informativa de sincronización transaccional -->
            <div class="alert alert-primary d-flex align-items-center gap-2 py-2 mb-3">
              <iconify-icon icon="solar:info-circle-bold" class="fs-4 text-primary"></iconify-icon>
              <small class="mb-0">
                Este historial registra y audita automáticamente cada campeonato y categoría en la que participa el club mediante <strong>Inscripción de Equipos</strong>.
              </small>
            </div>

            <!-- Formulario para agregar nuevo período/categoría -->
            <div class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <h6 class="fw-bold mb-2 text-body-emphasis d-flex align-items-center gap-2">
                <iconify-icon icon="solar:add-circle-bold" class="fs-4 text-primary"></iconify-icon>
                <span>Asignar Nueva Categoría al Equipo</span>
              </h6>
              <form @submit.prevent="saveTeamCategoryRecord">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Categoría (Búsqueda en BD)</label>
                    <AppSelect2
                      v-model="formTeamCategory.categoryId"
                      :fetch-options="fetchCategoriesOptions"
                      placeholder="Seleccionar categoría..."
                      search-placeholder="Buscar categoría..."
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Año / Temporada</label>
                    <input
                      type="number"
                      v-model.number="formTeamCategory.seasonYear"
                      class="form-control"
                      placeholder="2026"
                      required
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Estado</label>
                    <select v-model="formTeamCategory.status" class="form-select">
                      <option value="ACTIVE">Activa</option>
                      <option value="PROMOTED">Ascendido</option>
                      <option value="RELEGATED">Descendido</option>
                      <option value="HISTORIC">Histórico</option>
                    </select>
                  </div>
                  <div class="col-md-9">
                    <label class="form-label text-secondary small fw-semibold">Notas / Motivo (Opcional)</label>
                    <input
                      type="text"
                      v-model="formTeamCategory.notes"
                      class="form-control"
                      placeholder="Ej. Ascenso por quedar campeón en 2025"
                    />
                  </div>
                  <div class="col-md-3 d-flex align-items-end">
                    <button
                      type="submit"
                      class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-1"
                      :disabled="savingTeamCategoryHistory"
                    >
                      <span v-if="savingTeamCategoryHistory" class="spinner-border spinner-border-sm"></span>
                      <iconify-icon v-else icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Tabla de Historial -->
            <h6 class="fw-bold mb-2 text-body-emphasis">Recorrido Histórico por Temporadas</h6>
            <div class="table-responsive border rounded-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="ps-3">Año / Temporada</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Fecha Asignación</th>
                    <th>Notas</th>
                    <th class="text-end pe-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingTeamCategoryHistory">
                    <td colspan="6" class="text-center py-4 text-muted">
                      <span class="spinner-border spinner-border-sm me-2"></span> Cargando historial...
                    </td>
                  </tr>
                  <tr v-else-if="teamCategoryHistoryList.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">
                      No hay registros históricos de categoría para este equipo.
                    </td>
                  </tr>
                  <tr v-for="hist in teamCategoryHistoryList" :key="hist.id">
                    <td class="ps-3">
                      <span class="badge bg-secondary-subtle text-secondary font-monospace fs-2">
                        📅 {{ hist.seasonYear }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                        🏆 {{ hist.category?.name || 'Categoría' }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="badge"
                        :class="hist.status === 'ACTIVE' ? 'bg-success-subtle text-success' : (hist.status === 'PROMOTED' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning')"
                      >
                        {{ hist.status === 'ACTIVE' ? 'Activa' : (hist.status === 'PROMOTED' ? 'Ascenso' : (hist.status === 'RELEGATED' ? 'Descenso' : 'Histórico')) }}
                      </span>
                    </td>
                    <td><small class="text-muted font-monospace">{{ hist.assignedDate ? new Date(hist.assignedDate).toLocaleDateString() : '-' }}</small></td>
                    <td><small class="text-muted">{{ hist.notes || '-' }}</small></td>
                    <td class="text-end pe-3">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteTeamCategoryRecord(hist.id)"
                        title="Eliminar registro histórico"
                      >
                        <iconify-icon icon="solar:trash-bin-trash-line-duotone"></iconify-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary rounded-pill px-4" @click="showTeamCategoryModal = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL: DIRECTORIO DEL EQUIPO / CLUB                       -->
    <!-- ========================================================= -->
    <Teleport to="body">
      <div
        v-if="showTeamManagementModal && selectedTeamForManagement"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.75); z-index: 2050;"
        role="dialog"
        aria-modal="true"
      >
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-dark text-white">
            <div class="d-flex align-items-center gap-3">
              <img
                v-if="selectedTeamForManagement.logo"
                :src="selectedTeamForManagement.logo"
                class="rounded-circle border border-2 border-white shadow-sm"
                style="width: 38px; height: 38px; object-fit: cover;"
              />
              <div
                v-else
                class="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                style="width: 38px; height: 38px;"
              >
                <iconify-icon icon="solar:shield-bold-duotone" class="fs-4 text-white"></iconify-icon>
              </div>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0">
                  Directorio del Club · {{ selectedTeamForManagement.name }}
                </h5>
                <small class="text-white-50">Cargos oficiales del directorio del club deportivo</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showTeamManagementModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <!-- Formulario para agregar directivo -->
            <div class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <h6 class="fw-bold mb-3 text-body-emphasis d-flex align-items-center gap-2">
                <iconify-icon icon="solar:user-plus-bold" class="fs-4 text-warning"></iconify-icon>
                <span>Registrar Directivo en el Club</span>
              </h6>
              <form @submit.prevent="saveTeamManagementRecord">
                <div class="row g-3">
                  <!-- Select2 quemado con los cargos oficiales -->
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Cargo Oficial <span class="text-danger">*</span></label>
                    <select v-model="formTeamManagement.roleTitle" class="form-select" required>
                      <option value="Presidente">Presidente</option>
                      <option value="Vicepresidente">Vicepresidente</option>
                      <option value="Secretario/a">Secretario/a</option>
                      <option value="Vocal 1">Vocal 1</option>
                      <option value="Vocal 2">Vocal 2</option>
                      <option value="Vocal 3">Vocal 3</option>
                      <option value="Vocal 4">Vocal 4</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Nombres <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="formTeamManagement.name"
                      class="form-control"
                      placeholder="Ej. Juan Carlos"
                      required
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Apellidos <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="formTeamManagement.lastName"
                      class="form-control"
                      placeholder="Ej. Pérez Gómez"
                      required
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Cédula / Identificación <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="formTeamManagement.identification"
                      class="form-control font-monospace"
                      placeholder="1712345678"
                      required
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Teléfono / Celular</label>
                    <input
                      type="text"
                      v-model="formTeamManagement.cellphone"
                      class="form-control"
                      placeholder="0991234567"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold">Correo Electrónico</label>
                    <input
                      type="email"
                      v-model="formTeamManagement.email"
                      class="form-control"
                      placeholder="directivo@correo.com"
                    />
                  </div>
                  <div class="col-12 text-end mt-3">
                    <button
                      type="submit"
                      class="btn btn-warning text-dark fw-semibold rounded-pill px-4 d-inline-flex align-items-center gap-2"
                      :disabled="savingTeamManagement"
                    >
                      <span v-if="savingTeamManagement" class="spinner-grow spinner-grow-sm" role="status"></span>
                      <iconify-icon v-else icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
                      <span>{{ savingTeamManagement ? 'Registrando...' : 'Registrar en Directorio' }}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Tabla de directivos ya registrados en este club -->
            <div class="card border rounded-3 bg-body">
              <div class="card-header bg-body-tertiary d-flex align-items-center justify-content-between py-2 px-3">
                <span class="fw-bold small text-body-emphasis">Directivos Registrados ({{ teamManagementList.length }})</span>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 d-flex align-items-center gap-1"
                  @click="loadTeamManagement(selectedTeamForManagement.id)"
                  :disabled="loadingTeamManagement"
                >
                  <iconify-icon icon="solar:refresh-line-duotone" :class="{ 'spin': loadingTeamManagement }"></iconify-icon>
                  <span>Refrescar</span>
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 50px;">#</th>
                      <th>Cargo</th>
                      <th>Nombre Completo</th>
                      <th>Identificación</th>
                      <th>Contacto</th>
                      <th class="text-end" style="width: 90px;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(tm, idx) in teamManagementList" :key="tm.id">
                      <td class="fw-bold text-muted">{{ idx + 1 }}</td>
                      <td>
                        <span
                          class="badge font-monospace px-2 py-1"
                          :class="getRoleBadgeClass(tm.roleTitle)"
                        >
                          🎖️ {{ tm.roleTitle || tm.position?.name || 'Directivo' }}
                        </span>
                      </td>
                      <td class="fw-bold text-body-emphasis">
                        {{ tm.name }} {{ tm.lastName }}
                      </td>
                      <td class="font-monospace small">
                        {{ tm.identification }}
                      </td>
                      <td>
                        <div class="small">
                          <span v-if="tm.cellphone" class="d-block text-secondary">
                            📞 {{ tm.cellphone }}
                          </span>
                          <span v-if="tm.email" class="d-block text-muted">
                            ✉️ {{ tm.email }}
                          </span>
                          <span v-if="!tm.cellphone && !tm.email" class="text-muted">-</span>
                        </div>
                      </td>
                      <td class="text-end">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger rounded-circle p-1"
                          @click="deleteTeamManagementRecord(tm.id)"
                          title="Eliminar del directorio"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="teamManagementList.length === 0 && !loadingTeamManagement">
                      <td colspan="6" class="text-center py-4 text-muted">
                        <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-2 text-secondary d-block mb-1"></iconify-icon>
                        No hay directivos registrados aún para este club.
                      </td>
                    </tr>
                    <tr v-if="loadingTeamManagement">
                      <td colspan="6" class="text-center py-4 text-muted">
                        <span class="spinner-border spinner-border-sm text-primary me-2"></span>
                        Cargando directorio...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            
          </div>

            <div class="modal-footer bg-body-tertiary">
              <button type="button" class="btn btn-secondary rounded-pill px-4" @click="showTeamManagementModal = false">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ========================================================= -->
    <!-- 6. MODAL: TRANSFERENCIA DE JUGADOR                       -->
    <!-- ========================================================= -->
    <div
      v-if="showTransferModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.65); z-index: 1060;"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-info text-white">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-3 text-white"></iconify-icon>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0">
                  Transferir Jugador · {{ selectedPlayerForTransfer?.name }} {{ selectedPlayerForTransfer?.lastName }}
                </h5>
                <small class="text-white-50">DNI: {{ selectedPlayerForTransfer?.identification || 'Sin cédula' }}</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showTransferModal = false"></button>
          </div>

          <form @submit.prevent="processTransfer">
            <div class="modal-body p-4">
              <!-- Información actual del jugador -->
              <div class="alert alert-info d-flex align-items-center gap-3 py-2 mb-4">
                <iconify-icon icon="solar:info-circle-bold" class="fs-2 text-info"></iconify-icon>
                <div>
                  <strong>Club Actual:</strong> {{ selectedPlayerForTransfer?.currentTeam?.name || 'Agente Libre (Sin club)' }}
                  <span class="mx-2">|</span>
                  <strong>Dueño del Pase:</strong> {{ selectedPlayerForTransfer?.passOwnerType === 'TEAM' ? ('Club ' + (selectedPlayerForTransfer?.passOwnerTeam?.name || '')) : 'Pase Libre (Jugador)' }}
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Club de Destino (Nuevo Equipo) *</label>
                  <AppSelect2
                    v-model="formTransfer.destinationTeamId"
                    :fetch-options="fetchTeamsOptions"
                    placeholder="Seleccionar nuevo club..."
                    search-placeholder="Buscar club en BD..."
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Año / Temporada *</label>
                  <input
                    type="number"
                    v-model.number="formTransfer.seasonYear"
                    class="form-control"
                    placeholder="2026"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Tipo de Transferencia</label>
                  <select v-model="formTransfer.transferType" class="form-select">
                    <option value="DEFINITIVE">Venta / Pase Definitivo</option>
                    <option value="LOAN">Préstamo Temporal (Cesión)</option>
                    <option value="FREE_AGENT">Llegada como Jugador Libre</option>
                    <option value="RETURN">Retorno de Préstamo</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Propiedad del Pase tras Transferencia</label>
                  <select v-model="formTransfer.passOwnerType" class="form-select">
                    <option value="PLAYER">👤 El jugador sigue siendo dueño de su pase</option>
                    <option value="TEAM">🛡️ El club de destino adquiere el pase</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Valor / Costo del Pase o Transferencia ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    v-model.number="formTransfer.transferFee"
                    class="form-control"
                    placeholder="0.00"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Fecha de Transferencia</label>
                  <input
                    type="date"
                    v-model="formTransfer.transferDate"
                    class="form-control"
                    required
                  />
                </div>

                <div class="col-12">
                  <label class="form-label text-secondary small fw-semibold">Observaciones / Cláusulas del Pase</label>
                  <textarea
                    v-model="formTransfer.observations"
                    class="form-control"
                    rows="2"
                    placeholder="Ej. Transferencia con opción de compra o acuerdo entre clubes"
                  ></textarea>
                </div>
              </div>
            </div>

            

            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-secondary rounded-pill px-4" @click="showTransferModal = false">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-info text-white rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                :disabled="savingTransfer"
              >
                <span v-if="savingTransfer" class="spinner-border spinner-border-sm"></span>
                <iconify-icon v-else icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
                <span>Procesar Transferencia</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 7. MODAL: HISTORIAL DE TRANSFERENCIAS DEL JUGADOR        -->
    <!-- ========================================================= -->
    <div
      v-if="showPlayerTransfersModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.65); z-index: 1060;"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:history-bold-duotone" class="fs-3"></iconify-icon>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0">
                  Historial de Pases y Transferencias · {{ selectedPlayerForTransfersHistory?.name }} {{ selectedPlayerForTransfersHistory?.lastName }}
                </h5>
                <small class="text-white-50">Trayectoria de clubes y traspasos a lo largo de las temporadas</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showPlayerTransfersModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <div class="table-responsive border rounded-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="ps-3">Temporada</th>
                    <th>Club Origen</th>
                    <th>Club Destino</th>
                    <th>Tipo Traspaso</th>
                    <th>Titularidad del Pase</th>
                    <th>Costo ($)</th>
                    <th>Fecha</th>
                    <th>Observaciones</th>
                    <th class="text-end pe-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingPlayerTransfers">
                    <td colspan="9" class="text-center py-4 text-muted">
                      <span class="spinner-border spinner-border-sm me-2"></span> Cargando transferencias...
                    </td>
                  </tr>
                  <tr v-else-if="playerTransfersList.length === 0">
                    <td colspan="9" class="text-center py-4 text-muted">
                      No se registran transferencias previas para este jugador.
                    </td>
                  </tr>
                  <tr v-for="tr in playerTransfersList" :key="tr.id">
                    <td class="ps-3">
                      <span class="badge bg-secondary-subtle text-secondary font-monospace fs-2">
                        📅 {{ tr.seasonYear }}
                      </span>
                    </td>
                    <td>
                      <span v-if="tr.originTeam" class="text-body-emphasis fw-medium">
                        🛡️ {{ tr.originTeam.name }}
                      </span>
                      <span v-else class="badge bg-light text-muted">Jugador Libre</span>
                    </td>
                    <td>
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                        ⚽ {{ tr.destinationTeam?.name || 'Club' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-info-subtle text-info font-monospace">
                        {{ tr.transferType === 'DEFINITIVE' ? 'Definitiva' : (tr.transferType === 'LOAN' ? 'Préstamo' : (tr.transferType === 'FREE_AGENT' ? 'Libre' : tr.transferType)) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="tr.passOwnerType === 'TEAM' ? 'bg-info-subtle text-info' : 'bg-success-subtle text-success'">
                        {{ tr.passOwnerType === 'TEAM' ? 'Club Dueño' : 'Pase Libre' }}
                      </span>
                    </td>
                    <td><span class="font-monospace fw-semibold">${{ Number(tr.transferFee || 0).toFixed(2) }}</span></td>
                    <td><small class="text-muted font-monospace">{{ tr.transferDate ? new Date(tr.transferDate).toLocaleDateString() : '-' }}</small></td>
                    <td><small class="text-muted">{{ tr.observations || '-' }}</small></td>
                    <td class="text-end pe-3">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="deletePlayerTransferRecord(tr.id)"
                        title="Eliminar registro"
                      >
                        <iconify-icon icon="solar:trash-bin-trash-line-duotone"></iconify-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary rounded-pill px-4" @click="showPlayerTransfersModal = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: CLASIFICACIÓN DE FUTBOLISTAS POR CATEGORÍA DE LA EDICIÓN DE TORNEO -->
    <!-- ===================================================================== -->
    <Teleport to="body">
      <div
        v-if="showCategoryClassificationsModal && selectedCategoryForClassifications"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.75); z-index: 2050;"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2">
                <iconify-icon icon="solar:user-check-bold-duotone" class="fs-4"></iconify-icon>
                <span>Clasificación de Futbolistas · Categoría: {{ selectedCategoryForClassifications.categoryDescription || getCategoryNameById(selectedCategoryForClassifications.categoryId) }}</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="showCategoryClassificationsModal = false"></button>
            </div>
            <div class="modal-body p-4">
              <!-- Barra de progreso y resumen de cupos -->
              <div class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <div>
                    <h6 class="fw-bold mb-0 text-body-emphasis">Distribución del Límite de Jugadores por Equipo</h6>
                    <small class="text-muted">
                      Máximo de jugadores inscritos en esta categoría: <strong>{{ selectedCategoryForClassifications.maxPlayers || 25 }} futbolistas</strong>
                    </small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary fs-3 font-monospace">
                      {{ currentCategoryClassificationsTotal }} asignados
                    </span>
                    <span
                      class="badge font-monospace fs-3"
                      :class="(selectedCategoryForClassifications.maxPlayers || 25) - currentCategoryClassificationsTotal >= 0 ? 'bg-success' : 'bg-danger'"
                    >
                      {{ (selectedCategoryForClassifications.maxPlayers || 25) - currentCategoryClassificationsTotal }} libres
                    </span>
                  </div>
                </div>

                <!-- Indicador visual -->
                <div class="progress" style="height: 10px;">
                  <div
                    class="progress-bar"
                    :class="currentCategoryClassificationsTotal > (selectedCategoryForClassifications.maxPlayers || 25) ? 'bg-danger' : 'bg-primary'"
                    role="progressbar"
                    :style="{ width: Math.min(100, (currentCategoryClassificationsTotal / (selectedCategoryForClassifications.maxPlayers || 25)) * 100) + '%' }"
                  ></div>
                </div>

                <!-- Alerta si la suma supera el máximo -->
                <div v-if="currentCategoryClassificationsTotal > (selectedCategoryForClassifications.maxPlayers || 25)" class="alert alert-danger d-flex align-items-center gap-2 mt-3 py-2 mb-0">
                  <iconify-icon icon="solar:danger-triangle-bold" class="fs-4 text-danger"></iconify-icon>
                  <small class="mb-0">
                    <strong>¡Atención!</strong> La suma de las clasificaciones ({{ currentCategoryClassificationsTotal }}) no puede superar el máximo de jugadores inscritos ({{ selectedCategoryForClassifications.maxPlayers || 25 }}).
                  </small>
                </div>
              </div>

              <!-- Formulario para agregar una clasificación a la categoría -->
              <form @submit.prevent="addCategoryClassificationRecord" class="card p-3 mb-4 border rounded-3 bg-body">
                <h6 class="fw-bold mb-3 text-body-emphasis d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:add-circle-bold" class="fs-4 text-primary"></iconify-icon>
                  <span>Asignar Clasificación y Cupo a la Categoría</span>
                </h6>
                <div class="row g-3 align-items-end">
                  <div :class="isExprofessionalSelected || isJuvenileSelected ? 'col-md-4' : 'col-md-6'">
                    <label class="form-label small fw-semibold text-secondary">Clasificación de Futbolista <span class="text-danger">*</span></label>
                    <select v-model="formCategoryClassification.playerClassificationId" class="form-select form-select-sm" required>
                      <option value="" disabled>Seleccione una clasificación...</option>
                      <option
                        v-for="pc in availableClassificationsForCurrentCategory"
                        :key="pc.id"
                        :value="pc.id"
                      >
                        {{ pc.description }} {{ pc.code ? '(' + pc.code + ')' : '' }}
                      </option>
                    </select>
                  </div>

                  <div :class="isExprofessionalSelected || isJuvenileSelected ? 'col-md-3' : 'col-md-4'">
                    <label class="form-label small fw-semibold text-secondary">Cupo Máximo x Equipo <span class="text-danger">*</span></label>
                    <div class="input-group input-group-sm">
                      <input
                        type="number"
                        v-model.number="formCategoryClassification.maxPlayers"
                        class="form-control font-monospace"
                        min="1"
                        placeholder="Ej. 10"
                        required
                      />
                      <span class="input-group-text">jugadores</span>
                    </div>
                  </div>

                  <!-- Campo adicional para Exprofesional: Cantidad máxima de meses de inactividad en el fútbol profesional -->
                  <div v-if="isExprofessionalSelected" class="col-md-5">
                    <label class="form-label small fw-semibold text-warning d-flex align-items-center gap-1">
                      <iconify-icon icon="solar:clock-circle-bold"></iconify-icon>
                      <span>Cantidad Máxima de Meses de Inactividad en el Fútbol Profesional <span class="text-danger">*</span></span>
                    </label>
                    <div class="input-group input-group-sm">
                      <input
                        type="number"
                        v-model.number="formCategoryClassification.maxInactivityMonths"
                        class="form-control font-monospace"
                        min="1"
                        placeholder="Ej. 12"
                        required
                      />
                      <span class="input-group-text">meses de inactividad</span>
                    </div>
                  </div>

                  <!-- Campo extra para Juvenil: Cantidad máxima de meses -->
                  <div v-if="isJuvenileSelected" class="col-md-5">
                    <label class="form-label small fw-semibold text-info d-flex align-items-center gap-1">
                      <iconify-icon icon="solar:calendar-bold"></iconify-icon>
                      <span>Cantidad Máxima de Meses <span class="text-danger">*</span></span>
                    </label>
                    <div class="input-group input-group-sm">
                      <input
                        type="number"
                        v-model.number="formCategoryClassification.maxMonths"
                        class="form-control font-monospace"
                        min="1"
                        placeholder="Ej. 216 meses (18 años)"
                        required
                      />
                      <span class="input-group-text">meses máx.</span>
                    </div>
                  </div>

                  <div :class="isExprofessionalSelected || isJuvenileSelected ? 'col-12 text-end mt-2' : 'col-md-2'">
                    <button
                      type="submit"
                      class="btn btn-primary btn-sm rounded-pill fw-semibold px-4 d-inline-flex align-items-center justify-content-center gap-1 shadow-sm"
                      :class="{ 'w-100': !isExprofessionalSelected && !isJuvenileSelected }"
                    >
                      <iconify-icon icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
                      <span>Asignar</span>
                    </button>
                  </div>
                </div>
              </form>

              <!-- Tabla de clasificaciones configuradas para esta categoría -->
              <div class="table-responsive border rounded-3">
                <table class="table table-sm table-hover mb-0 align-middle">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-3">Clasificación</th>
                      <th class="text-center">Código</th>
                      <th class="text-center">Cantidad Máxima x Equipo</th>
                      <th class="text-center">Condición / Parámetro Especial</th>
                      <th class="text-end pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!selectedCategoryForClassifications.classifications || selectedCategoryForClassifications.classifications.length === 0">
                      <td colspan="5" class="text-center py-4 text-muted">
                        No hay clasificaciones específicas configuradas para esta categoría. El registro de jugadores se regirá únicamente por el límite de jugadores inscritos ({{ selectedCategoryForClassifications.maxPlayers || 25 }}).
                      </td>
                    </tr>
                    <tr v-for="(item, idx) in (selectedCategoryForClassifications.classifications || [])" :key="idx">
                      <td class="ps-3">
                        <span class="fw-bold text-body-emphasis">
                          🏷️ {{ item.playerClassification?.description || getPlayerClassificationDescById(item.playerClassificationId) }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-secondary-subtle text-secondary font-monospace">
                          {{ item.playerClassification?.code || getPlayerClassificationCodeById(item.playerClassificationId) || '-' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-3 py-1 fs-3">
                          👥 Máx. {{ item.maxPlayers }} jugadores
                        </span>
                      </td>
                      <td class="text-center">
                        <span v-if="item.maxInactivityMonths" class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1">
                          ⏱️ Inactividad: máx. {{ item.maxInactivityMonths }} meses
                        </span>
                        <span v-else-if="item.maxMonths" class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                          📅 Límite: máx. {{ item.maxMonths }} meses
                        </span>
                        <span v-else class="text-muted small">
                          -
                        </span>
                      </td>
                      <td class="text-end pe-3">
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm rounded-pill px-2 py-1"
                          @click="removeCategoryClassificationRecord(Number(idx))"
                          title="Eliminar clasificación de esta categoría"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-primary rounded-pill px-4 fw-semibold" @click="showCategoryClassificationsModal = false">
                Listo / Aceptar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL PARA CONFIGURACIÓN DE ETAPAS Y FASES POR CATEGORÍA -->
      <div
        v-if="showCategoryStagesModal && selectedCategoryForStages"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.75); z-index: 2050;"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2">
                <iconify-icon icon="solar:diagram-up-bold-duotone" class="fs-4"></iconify-icon>
                <span>Configuración de Etapas y Fases · Categoría: {{ selectedCategoryForStages.categoryDescription || getCategoryNameById(selectedCategoryForStages.categoryId) }}</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="showCategoryStagesModal = false"></button>
            </div>
            <div class="modal-body p-4">
              <!-- Información orientativa -->
              <div class="alert alert-info py-2 px-3 d-flex align-items-center gap-2 mb-3">
                <iconify-icon icon="solar:info-circle-line-duotone" class="fs-4 text-info"></iconify-icon>
                <small>
                  Configura las etapas competitivas de esta categoría (ej. <strong>Fase Inicial</strong>, <strong>Liguilla</strong> o <strong>Play-offs</strong>), asignando el orden, tipo principal de competencia, modalidad de vueltas y criterios de desempate.
                </small>
              </div>

              <!-- Barra de aplicación de plantilla rápida -->
              <div v-if="stagesList && stagesList.length > 0" class="card p-2 px-3 mb-3 border rounded-3 bg-body-tertiary d-flex flex-row align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:diagram-up-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                  <div>
                    <span class="small fw-bold text-body-emphasis">Cargar formato desde Plantilla:</span>
                    <span class="small text-muted ms-1">Aplica una estructura predefinida de etapas y fases a esta categoría.</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <select class="form-select form-select-sm" style="min-width: 260px;" @change="applyStageTemplateToCategory($event)">
                    <option value="">-- Seleccionar Plantilla Predefinida --</option>
                    <option v-for="tpl in stagesList" :key="tpl.id" :value="tpl.id">
                      {{ tpl.name }} ({{ (tpl.details || []).length }} etapas)
                    </option>
                  </select>
                </div>
              </div>

              <!-- Formulario para agregar una Etapa / Fase -->
              <form @submit.prevent="addCategoryStageRecord" class="card p-3 mb-4 border rounded-3 bg-body shadow-xs">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <h6 class="fw-bold mb-0 text-body-emphasis d-flex align-items-center gap-2">
                    <iconify-icon :icon="editingCategoryStageIndex !== null ? 'solar:pen-bold' : 'solar:add-circle-bold'" class="fs-4 text-primary"></iconify-icon>
                    <span>{{ editingCategoryStageIndex !== null ? 'Modificar Etapa o Fase' : 'Agregar Nueva Etapa o Fase' }}</span>
                  </h6>
                  <button
                    v-if="editingCategoryStageIndex !== null"
                    type="button"
                    class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                    @click="cancelEditCategoryStage"
                  >
                    <iconify-icon icon="solar:close-circle-bold" class="fs-6"></iconify-icon>
                    <span>Cancelar Edición</span>
                  </button>
                </div>
                <div class="row g-3 align-items-end">
                  <div class="col-md-2">
                    <label class="form-label small fw-semibold text-secondary">Orden <span class="text-danger">*</span></label>
                    <input
                      type="number"
                      v-model.number="formCategoryStage.stageOrder"
                      class="form-control form-control-sm font-monospace text-center"
                      min="1"
                      placeholder="1"
                      required
                    />
                  </div>

                  <div class="col-md-5">
                    <label class="form-label small fw-semibold text-secondary">Nombre de la Etapa / Fase <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="formCategoryStage.name"
                      class="form-control form-control-sm"
                      placeholder="Ej. Primera Etapa - Todos contra Todos"
                      required
                    />
                  </div>

                  <div class="col-md-5">
                    <label class="form-label small fw-semibold text-secondary">Tipo Principal de Competencia <span class="text-danger">*</span></label>
                    <AppSelect2
                      v-model="formCategoryStage.competitionTypeId"
                      :options="competitionTypeOptions"
                      placeholder="Seleccionar tipo de competencia..."
                      search-placeholder="Buscar tipo..."
                      required
                    />
                  </div>

                  <div class="col-md-12">
                    <label class="form-label small fw-semibold text-secondary">Vueltas / Modalidad <span class="text-danger">*</span></label>
                    <AppSelect2
                      v-model="formCategoryStage.competitionLapId"
                      :options="competitionLapOptions"
                      placeholder="Seleccionar modalidad de vueltas..."
                      search-placeholder="Buscar vueltas..."
                      required
                    />
                  </div>

                  <!-- TABLA DETALLE DE CRITERIOS DE DESEMPATE JERÁRQUICOS -->
                  <div class="col-12 mt-2">
                    <div class="card p-3 border rounded-3 bg-body-tertiary">
                      <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <div class="d-flex align-items-center gap-2">
                          <iconify-icon icon="solar:sort-by-time-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                          <div>
                            <span class="small fw-bold text-body-emphasis">Criterios de Desempate (Prioridad Jerárquica)</span>
                            <span class="d-block small text-muted" style="font-size: 0.8rem;">
                              Define y ordena los criterios de desempate de esta etapa. El orden de prioridad determina cuál criterio se aplica primero (#1, luego #2, etc.).
                            </span>
                          </div>
                        </div>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 font-monospace">
                          {{ formCategoryStageCriteria.length }} criterio(s)
                        </span>
                      </div>

                      <!-- Selector para agregar criterio a la lista -->
                      <div class="row g-2 align-items-end mb-3">
                        <div class="col-md-9 col-sm-8">
                          <label class="form-label small fw-semibold text-secondary mb-1">
                            Seleccionar Criterio para Añadir
                          </label>
                          <AppSelect2
                            v-model="selectedCriterionToAdd"
                            :options="availableTieBreakerOptions"
                            placeholder="Buscar y seleccionar criterio de desempate..."
                            search-placeholder="Buscar criterio..."
                            allow-clear
                          />
                        </div>
                        <div class="col-md-3 col-sm-4">
                          <button
                            type="button"
                            class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-semibold py-1 d-inline-flex align-items-center justify-content-center gap-1 shadow-sm"
                            :disabled="!selectedCriterionToAdd"
                            @click="addCriterionToStage"
                          >
                            <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
                            <span>+ Añadir Criterio</span>
                          </button>
                        </div>
                      </div>

                      <!-- Tabla detalle de criterios con acciones Subir / Bajar / Eliminar -->
                      <div class="table-responsive border rounded-3 bg-body">
                        <table class="table table-sm table-hover mb-0 align-middle">
                          <thead class="table-light fs-1 text-uppercase">
                            <tr>
                              <th class="ps-3 text-center" style="width: 80px;">Prioridad</th>
                              <th>Criterio de Desempate</th>
                              <th style="width: 110px;">Código</th>
                              <th>Observación / Regla Reglamentaria</th>
                              <th class="text-end pe-3" style="width: 140px;">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-if="formCategoryStageCriteria.length === 0">
                              <td colspan="5" class="text-center py-3 text-muted small">
                                <iconify-icon icon="solar:info-circle-line-duotone" class="fs-5 text-secondary me-1 align-middle"></iconify-icon>
                                No se han configurado criterios de desempate para esta etapa. Selecciona un criterio arriba y haz clic en <strong>+ Añadir Criterio</strong>.
                              </td>
                            </tr>
                            <tr v-for="(crit, cIdx) in formCategoryStageCriteria" :key="crit.criterionId || crit.id || cIdx">
                              <td class="text-center ps-3">
                                <span class="badge bg-primary text-white font-monospace px-2 py-1 rounded-pill" style="font-size: 0.8rem;">
                                  #{{ cIdx + 1 }}
                                </span>
                              </td>
                              <td>
                                <span class="fw-semibold text-body-emphasis">
                                  {{ crit.description }}
                                </span>
                              </td>
                              <td>
                                <span class="badge bg-secondary-subtle text-body border px-2 py-1 font-monospace">
                                  {{ crit.code || '-' }}
                                </span>
                              </td>
                              <td>
                                <span class="text-muted small">
                                  {{ crit.observation || 'Evaluación reglamentaria de torneo' }}
                                </span>
                              </td>
                              <td class="text-end pe-3">
                                <div class="d-inline-flex align-items-center gap-1">
                                  <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary rounded-circle p-1 d-inline-flex align-items-center justify-content-center"
                                    style="width: 28px; height: 28px;"
                                    :disabled="cIdx === 0"
                                    @click="moveCriterionUp(cIdx)"
                                    title="Subir prioridad (mayor relevancia)"
                                  >
                                    <iconify-icon icon="solar:arrow-up-bold" class="fs-6"></iconify-icon>
                                  </button>
                                  <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary rounded-circle p-1 d-inline-flex align-items-center justify-content-center"
                                    style="width: 28px; height: 28px;"
                                    :disabled="cIdx === formCategoryStageCriteria.length - 1"
                                    @click="moveCriterionDown(cIdx)"
                                    title="Bajar prioridad (menor relevancia)"
                                  >
                                    <iconify-icon icon="solar:arrow-down-bold" class="fs-6"></iconify-icon>
                                  </button>
                                  <button
                                    type="button"
                                    class="btn btn-sm btn-outline-danger rounded-circle p-1 d-inline-flex align-items-center justify-content-center ms-1"
                                    style="width: 28px; height: 28px;"
                                    @click="removeCriterionFromStage(cIdx)"
                                    title="Eliminar criterio"
                                  >
                                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-6"></iconify-icon>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 text-end mt-3">
                    <button
                      type="submit"
                      class="btn btn-primary btn-sm rounded-pill fw-semibold px-4 d-inline-flex align-items-center gap-1 shadow-sm"
                    >
                      <iconify-icon :icon="editingCategoryStageIndex !== null ? 'solar:check-circle-bold' : 'solar:add-circle-bold'" class="fs-5"></iconify-icon>
                      <span>{{ editingCategoryStageIndex !== null ? 'Guardar Cambios de la Etapa' : 'Agregar Etapa a la Categoría' }}</span>
                    </button>
                  </div>
                </div>
              </form>

              <!-- Tabla de Etapas configuradas para esta categoría -->
              <div class="table-responsive border rounded-3 bg-body">
                <table class="table table-sm table-hover mb-0 align-middle">
                  <thead class="table-light fs-1 text-uppercase">
                    <tr>
                      <th class="ps-3 text-center" style="width: 75px;">Orden</th>
                      <th>Nombre de la Etapa / Fase</th>
                      <th>Tipo de Competencia</th>
                      <th>Vueltas / Modalidad</th>
                      <th>Criterios de Desempate (Jerarquía)</th>
                      <th class="text-end pe-3" style="width: 100px;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!selectedCategoryForStages.stages || selectedCategoryForStages.stages.length === 0">
                      <td colspan="6" class="text-center py-4 text-muted">
                        <iconify-icon icon="solar:info-circle-line-duotone" class="fs-2 text-secondary mb-1 d-block"></iconify-icon>
                        No se han configurado etapas para esta categoría todavía. Agrega la primera etapa arriba.
                      </td>
                    </tr>
                    <tr v-for="(stg, sIdx) in (selectedCategoryForStages.stages || [])" :key="sIdx">
                      <td class="text-center ps-3">
                        <span class="badge bg-secondary-subtle text-body font-monospace px-2 py-1 fs-2">
                          #{{ stg.stageOrder || (sIdx + 1) }}
                        </span>
                      </td>
                      <td>
                        <span class="fw-bold text-body-emphasis">
                          🏆 {{ stg.name }}
                        </span>
                      </td>
                      <td>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                          {{ stg.competitionTypeDescription || getCompetitionTypeDescById(stg.competitionTypeId) || 'Todos contra Todos' }}
                        </span>
                      </td>
                      <td>
                        <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 font-monospace">
                          🔄 {{ stg.competitionLapDescription || getCompetitionLapDescById(stg.competitionLapId) || '1 Vuelta' }}
                        </span>
                      </td>
                      <td>
                        <div v-if="stg.tieBreakerCriteria && stg.tieBreakerCriteria.length > 0" class="d-flex flex-wrap gap-1 align-items-center">
                          <span
                            v-for="(crit, cIdx) in stg.tieBreakerCriteria"
                            :key="cIdx"
                            class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-inline-flex align-items-center gap-1 shadow-2xs"
                            :title="crit.description + (crit.observation ? ': ' + crit.observation : '')"
                          >
                            <span class="badge bg-success text-white rounded-pill px-1" style="font-size: 0.65rem;">#{{ crit.order || (cIdx + 1) }}</span>
                            <span>{{ crit.code || crit.description }}</span>
                          </span>
                        </div>
                        <span v-else-if="stg.tieBreakerCriterionId || stg.tieBreakerCriterionDescription" class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          ⚖️ {{ stg.tieBreakerCriterionDescription || getTieBreakerCriterionDescById(stg.tieBreakerCriterionId) }}
                        </span>
                        <span v-else class="text-muted small fst-italic">Sin criterios</span>
                      </td>
                      <td class="text-end pe-3">
                        <div class="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            class="btn btn-outline-primary btn-sm rounded-circle p-1 d-inline-flex align-items-center justify-content-center"
                            style="width: 28px; height: 28px;"
                            @click="editCategoryStageRecord(Number(sIdx))"
                            title="Modificar etapa y criterios"
                          >
                            <iconify-icon icon="solar:pen-bold" class="fs-6"></iconify-icon>
                          </button>
                          <button
                            type="button"
                            class="btn btn-outline-danger btn-sm rounded-circle p-1 d-inline-flex align-items-center justify-content-center"
                            style="width: 28px; height: 28px;"
                            @click="removeCategoryStageRecord(Number(sIdx))"
                            title="Eliminar etapa"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-6"></iconify-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-primary rounded-pill px-4 fw-semibold" @click="showCategoryStagesModal = false">
                Listo / Aceptar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router';
import { CampeonatoApi, uploadTeamLogo, uploadPlayerPhoto, TeamManagementsService, type TeamManagementItem } from '@/services/campeonato.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/utils/toastr';
import AppSelect2 from '@/components/common/AppSelect2.vue';
import ImageUpload from '@/components/common/ImageUpload.vue';

interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  api: any;
  columns: { key: string; label: string; type?: string }[];
  fields: { key: string; label: string; type: string; options?: { label: string; value: any }[]; colClass?: string; placeholder?: string; readonly?: boolean; disabled?: boolean }[];
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
      { key: 'currentCategory.name', label: 'Categoría Actual' },
      { key: 'currentSeasonYear', label: 'Temporada' },
      { key: 'city', label: 'Ciudad' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombre del Equipo', type: 'text', colClass: 'col-md-6' },
      { key: 'shortName', label: 'Nombre Corto', type: 'text', colClass: 'col-md-6' },
      { key: 'acronyms', label: 'Siglas', type: 'text', colClass: 'col-md-6' },
      { key: 'color1', label: 'Color Principal', type: 'color', colClass: 'col-md-4', placeholder: '#FFFFFF' },
      { key: 'color2', label: 'Color Secundario', type: 'color', colClass: 'col-md-4', placeholder: '#000000' },
      { key: 'colorAlternate', label: 'Uniforme Alterno', type: 'color', colClass: 'col-md-4', placeholder: '#1E40AF' },
      { key: 'dateOfFoundation', label: 'Fecha de Fundación', type: 'date', colClass: 'col-md-4' },
      { key: 'email', label: 'Correo Oficial del Club', type: 'text', colClass: 'col-md-4' },
      { key: 'representativePhone', label: 'Teléfono Rep.', type: 'text', colClass: 'col-md-4' },
    ],
  },
  {
    id: 'players',
    label: 'Jugadores',
    icon: 'solar:users-group-two-rounded-bold-duotone',
    api: CampeonatoApi.players,
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nombres' },
      { key: 'lastName', label: 'Apellidos' },
      { key: 'ageDisplay', label: 'Edad' },
      { key: 'identification', label: 'Identificación' },
      { key: 'demarcation.name', label: 'Demarcación' },
      { key: 'playerClassification.description', label: 'Clasificación' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'identification', label: 'Cédula / Identificación *', type: 'text', colClass: 'col-md-4', placeholder: 'Ingrese cédula y presione Consultar...' },
      { key: 'code', label: 'Código Secuencial de Jugador', type: 'text', colClass: 'col-md-4', placeholder: 'Autogenerado ej. JUG-00001', readonly: true, disabled: true },
      { key: 'birthDate', label: 'Fecha de Nacimiento', type: 'date', colClass: 'col-md-4' },
      { key: 'name', label: 'Nombres *', type: 'text', colClass: 'col-md-6' },
      { key: 'lastName', label: 'Apellidos *', type: 'text', colClass: 'col-md-6' },
      { key: 'ageYears', label: 'Edad en Años', type: 'number', colClass: 'col-md-3', placeholder: 'Autocalculado', readonly: true, disabled: true },
      { key: 'ageMonths', label: 'Edad en Meses', type: 'number', colClass: 'col-md-3', placeholder: 'Autocalculado', readonly: true, disabled: true },
      { key: 'demarcationId', label: 'Posición / Demarcación en Campo', type: 'select', colClass: 'col-md-3', options: [] },
      { key: 'playerClassificationId', label: 'Clasificación de Futbolista', type: 'select', colClass: 'col-md-3', options: [] },
      {
        key: 'dominantFoot',
        label: 'Pie Dominante',
        type: 'select',
        options: [
          { label: 'Diestro (Derecho)', value: 'RIGHT' },
          { label: 'Zurdo (Izquierdo)', value: 'LEFT' },
          { label: 'Ambidiestro', value: 'BOTH' },
        ],
        colClass: 'col-md-3',
      },
      {
        key: 'bloodType',
        label: 'Tipo de Sangre',
        type: 'select',
        options: [
          { label: 'O Positivo (O+)', value: 'O+' },
          { label: 'O Negativo (O-)', value: 'O-' },
          { label: 'A Positivo (A+)', value: 'A+' },
          { label: 'A Negativo (A-)', value: 'A-' },
          { label: 'B Positivo (B+)', value: 'B+' },
          { label: 'B Negativo (B-)', value: 'B-' },
          { label: 'AB Positivo (AB+)', value: 'AB+' },
          { label: 'AB Negativo (AB-)', value: 'AB-' },
        ],
        colClass: 'col-md-3',
      },
      { key: 'phone', label: 'Teléfono Personal', type: 'text', colClass: 'col-md-3' },
      { key: 'email', label: 'Correo Electrónico', type: 'text', colClass: 'col-md-3' },
      { key: 'emergencyContactName', label: 'Contacto de Emergencia', type: 'text', colClass: 'col-md-6' },
      { key: 'emergencyContactPhone', label: 'Teléfono de Emergencia', type: 'text', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'categories',
    label: 'Categorías',
    icon: 'solar:medal-star-bold-duotone',
    api: CampeonatoApi.categories,
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'acronyms', label: 'Siglas' },
      { key: 'code', label: 'Código' },
      { key: 'gender', label: 'Género' },
      { key: 'minAge', label: 'Edad Mín.' },
      { key: 'maxAge', label: 'Edad Máx.' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de la Categoría *', type: 'text', colClass: 'col-md-6', placeholder: 'Ej. Máxima, Primera, Juvenil' },
      { key: 'acronyms', label: 'Siglas de la Categoría', type: 'text', colClass: 'col-md-6', placeholder: 'Ej. MAX, PRI, JUV' },
      { key: 'code', label: 'Código Secuencial de Categoría', type: 'text', colClass: 'col-md-4', placeholder: 'Autogenerado ej. CAT-001', readonly: true, disabled: true },
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
    label: 'Ediciones de Torneo',
    icon: 'solar:calendar-date-bold-duotone',
    api: CampeonatoApi.categoryEditions,
    columns: [
      { key: 'name', label: 'Nombre / Descripción Edición' },
      { key: 'identifyByPlayerCode', label: 'Modalidad de Jugadores' },
      { key: 'categoriesDetail', label: 'Categorías (Detalle)' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { key: 'name', label: 'Nombre / Descripción de la Edición', type: 'text', colClass: 'col-md-8', placeholder: 'Ej. Campeonato Oficial 2026' },
      { key: 'description', label: 'Observaciones Adicionales', type: 'text', colClass: 'col-md-4', placeholder: 'Detalles u observaciones...' },
    ],
  },
  {
    id: 'stages',
    label: 'Plantillas de Etapas y Fases',
    icon: 'solar:diagram-up-bold-duotone',
    api: CampeonatoApi.stageTemplates,
    columns: [
      { key: 'name', label: 'Nombre de la Plantilla' },
      { key: 'description', label: 'Descripción' },
      { key: 'detailsCount', label: 'Total de Etapas' },
      { key: 'stagesSummary', label: 'Etapas y Fases Configuradas' },
      { key: 'isActive', label: 'Estado' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de la Plantilla *', type: 'text', colClass: 'col-md-6', placeholder: 'Ej. Formato Oficial Barrial - 2 Etapas' },
      { key: 'description', label: 'Descripción de la Plantilla', type: 'text', colClass: 'col-md-6', placeholder: 'Observaciones o resumen del formato...' },
    ],
  },
  {
    id: 'scenaries',
    label: 'Escenarios / Canchas',
    icon: 'solar:map-point-wave-bold-duotone',
    api: CampeonatoApi.scenaries,
    columns: [
      { key: 'name', label: 'Nombre Cancha' },
      { key: 'address', label: 'Calles / Dirección' },
      { key: 'cardinalPoints', label: 'Puntos Cardinales' },
      { key: 'surfaceType', label: 'Superficie' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombre del Escenario', type: 'text', colClass: 'col-md-6', placeholder: 'Ej. Cancha Central San José de Cangahua' },
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
    ],
  },
  {
    id: 'teamRegistrations',
    label: 'Inscripción de Equipos',
    icon: 'solar:diploma-verified-bold-duotone',
    api: CampeonatoApi.teamRegistrations,
    columns: [
      { key: 'team.name', label: 'Equipo' },
      { key: 'categoryEdition.name', label: 'Edición Torneo' },
      { key: 'registrationNumber', label: '# Inscripción' },
      { key: 'status', label: 'Estado Inscripción' },
      { key: 'paidAmount', label: 'Monto Pagado ($)' },
      { key: 'paymentStatus', label: 'Estado Pago' },
    ],
    fields: [
      { key: 'teamId', label: 'Equipo', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'categoryEditionId', label: 'Edición de Categoría', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'registrationNumber', label: 'Número de Registro', type: 'text', colClass: 'col-md-4' },
      {
        key: 'status',
        label: 'Estado de Inscripción',
        type: 'select',
        options: [
          { label: 'Aprobado / Habilitado', value: 'APPROVED' },
          { label: 'Pendiente de Aprobación', value: 'PENDING' },
          { label: 'Rechazado', value: 'REJECTED' },
          { label: 'Retirado', value: 'WITHDRAWN' },
        ],
        colClass: 'col-md-4',
      },
      {
        key: 'paymentStatus',
        label: 'Estado de Pago',
        type: 'select',
        options: [
          { label: 'Pagado Completo', value: 'PAID' },
          { label: 'Pago Parcial', value: 'PARTIAL' },
          { label: 'Pendiente de Pago', value: 'PENDING' },
          { label: 'Exonerado', value: 'EXEMPT' },
        ],
        colClass: 'col-md-4',
      },
      { key: 'paidAmount', label: 'Monto Abonado ($)', type: 'number', colClass: 'col-md-6' },
      { key: 'observations', label: 'Observaciones', type: 'text', colClass: 'col-md-6' },
    ],
  },
  {
    id: 'playerRegistrations',
    label: 'Inscripción y Carnets',
    icon: 'solar:card-2-bold-duotone',
    api: CampeonatoApi.playerRegistrations,
    columns: [
      { key: 'carnetCode', label: 'Carnet #' },
      { key: 'player.name', label: 'Jugador' },
      { key: 'teamRegistration.team.name', label: 'Equipo' },
      { key: 'playerClassification.description', label: 'Clasificación' },
      { key: 'jerseyNumber', label: 'Dorsal' },
      { key: 'isCaptain', label: 'Capitán', type: 'boolean' },
      { key: 'status', label: 'Estado Carnet' },
    ],
    fields: [
      { key: 'teamRegistrationId', label: 'Inscripción de Equipo (Torneo)', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'playerId', label: 'Jugador', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'playerClassificationId', label: 'Clasificación de Futbolista', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'jerseyNumber', label: 'Número de Dorsal / Camiseta', type: 'number', colClass: 'col-md-3' },
      { key: 'carnetCode', label: 'Código de Carnet', type: 'text', colClass: 'col-md-3' },
      {
        key: 'status',
        label: 'Estado de Habilitación',
        type: 'select',
        options: [
          { label: 'Habilitado / Elegible', value: 'ELIGIBLE' },
          { label: 'No Elegible', value: 'INELIGIBLE' },
          { label: 'Suspendido', value: 'SUSPENDED' },
          { label: 'Transferido', value: 'TRANSFERRED' },
        ],
        colClass: 'col-md-6',
      },
      { key: 'isCaptain', label: 'Es Capitán del Equipo', type: 'boolean', colClass: 'col-md-6' },
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
      { key: 'maxPlayers', label: 'Límite Máx. por Equipo' },
      { key: 'order', label: 'Orden' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de la Demarcación', type: 'text', colClass: 'col-md-6', placeholder: 'Ej. Delantero Centro' },
      { key: 'code', label: 'Código Único', type: 'text', colClass: 'col-md-6', placeholder: 'Ej. DEL, ARQ, DEF' },
      {
        key: 'zone',
        label: 'Zona de Juego',
        type: 'select',
        options: [
          { label: 'Portero / Arquero', value: 'GOALKEEPER' },
          { label: 'Defensa', value: 'DEFENDER' },
          { label: 'Mediocampista / Volante', value: 'MIDFIELDER' },
          { label: 'Delantero / Atacante', value: 'FORWARD' },
        ],
        colClass: 'col-md-6',
      },
      {
        key: 'maxPlayers',
        label: 'Límite Máximo de Inscritos por Equipo',
        type: 'number',
        colClass: 'col-md-3',
        placeholder: 'Ej. 5 (0 = Sin límite)',
      },
      { key: 'order', label: 'Orden', type: 'number', colClass: 'col-md-3' },
    ],
  },
  {
    id: 'referees',
    label: 'Árbitros',
    icon: 'solar:whistle-bold-duotone',
    api: CampeonatoApi.referees,
    columns: [
      { key: 'identification', label: 'Documento / Cédula' },
      { key: 'name', label: 'Nombres' },
      { key: 'lastName', label: 'Apellidos' },
      { key: 'guild.description', label: 'Gremio / Núcleo' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'email', label: 'Correo' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'identification', label: 'Número de Documento / Cédula *', type: 'text', colClass: 'col-md-6', placeholder: 'Ingrese documento y presione Consultar...' },
      { key: 'guildId', label: 'Gremio / Núcleo Arbitral', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'name', label: 'Nombres *', type: 'text', colClass: 'col-md-6' },
      { key: 'lastName', label: 'Apellidos *', type: 'text', colClass: 'col-md-6' },
      { key: 'phone', label: 'Teléfono Personal', type: 'text', colClass: 'col-md-6' },
      { key: 'email', label: 'Correo Electrónico', type: 'text', colClass: 'col-md-6' },
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
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombres', type: 'text', colClass: 'col-md-4' },
      { key: 'lastName', label: 'Apellidos', type: 'text', colClass: 'col-md-4' },
      { key: 'identification', label: 'Identificación', type: 'text', colClass: 'col-md-4' },
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
  {
    id: 'standings',
    label: 'Tabla de Posiciones & Goleadores',
    icon: 'solar:ranking-bold-duotone',
    api: null,
    columns: [],
    fields: [],
  },
  {
    id: 'schedules',
    label: 'Días y Horarios de Juego',
    icon: 'solar:clock-circle-bold-duotone',
    api: null,
    columns: [],
    fields: [],
  },
  {
    id: 'playerClassifications',
    label: 'Clasificación de Futbolistas',
    icon: 'solar:user-check-bold-duotone',
    api: CampeonatoApi.playerClassifications,
    columns: [
      { key: 'description', label: 'Descripción / Nombre' },
      { key: 'code', label: 'Código' },
      { key: 'observation', label: 'Observación' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'description', label: 'Descripción o Nombre de Clasificación', type: 'text', colClass: 'col-md-8', placeholder: 'Ej. Foráneo, Juvenil, Nativo, Extranjero, Sub-20' },
      { key: 'code', label: 'Código Abreviado', type: 'text', colClass: 'col-md-4', placeholder: 'Ej. FOR, JUV, NAT, EXT' },
      { key: 'observation', label: 'Observación', type: 'text', colClass: 'col-md-12', placeholder: 'Notas u observaciones de la clasificación...' },
    ],
  },
  {
    id: 'playerTransfers',
    label: 'Transferencias de Jugadores',
    icon: 'solar:transfer-horizontal-bold-duotone',
    api: CampeonatoApi.playerTransfers,
    columns: [
      { key: 'player.name', label: 'Futbolista' },
      { key: 'originTeam.name', label: 'Club Origen' },
      { key: 'destinationTeam.name', label: 'Club Destino' },
      { key: 'edition.name', label: 'Edición' },
      { key: 'status', label: 'Estado' },
      { key: 'approvalsSummary', label: 'Firmas / Resoluciones' },
      { key: 'request_date', label: 'Fecha Solicitud', type: 'date' },
    ],
    fields: [
      { key: 'edition_id', label: 'Edición del Campeonato *', type: 'select', options: [], colClass: 'col-md-6' },
      { key: 'player_id', label: 'Futbolista a Transferir *', type: 'select', options: [], colClass: 'col-md-6' },
      { key: 'destination_team_id', label: 'Club de Destino (Receptor) *', type: 'select', options: [], colClass: 'col-md-6' },
      { key: 'stage_id', label: 'Etapa / Fase (Opcional)', type: 'select', options: [], colClass: 'col-md-6' },
      { key: 'reason', label: 'Motivo / Justificación de la Transferencia', type: 'textarea', colClass: 'col-md-12', placeholder: 'Ingrese el motivo del traspaso de derechos o cambio de club...' },
    ],
  },
];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Sub-pestañas de la sección de Configuración General
const isConfigSection = computed(() => {
  const cfgList = [
    'configuracion',
    'teams',
    'players',
    'categories',
    'categoryEditions',
    'stages',
    'scenaries',
    'schedules',
    'referees',
    'vocals',
  ];
  return cfgList.includes(activeTab.value);
});

const configSubTab = ref('teams');

const configSubTabsList = [
  { id: 'teams', label: 'Equipos', icon: 'solar:shield-bold-duotone' },
  { id: 'players', label: 'Jugadores', icon: 'solar:users-group-two-rounded-bold-duotone' },
  { id: 'categories', label: 'Categorías', icon: 'solar:medal-star-bold-duotone' },
  { id: 'categoryEditions', label: 'Ediciones de Torneo', icon: 'solar:calendar-date-bold-duotone' },
  { id: 'stages', label: 'Plantillas de Etapas y Fases', icon: 'solar:diagram-up-bold-duotone' },
  { id: 'scenaries', label: 'Canchas (Escenarios)', icon: 'solar:map-point-wave-bold-duotone' },
  { id: 'schedules', label: 'Días y Horarios', icon: 'solar:clock-circle-bold-duotone' },
  { id: 'referees', label: 'Árbitros', icon: 'solar:whistle-bold-duotone' },
  { id: 'vocals', label: 'Vocales', icon: 'solar:notes-bold-duotone' },
];

const switchConfigSubTab = (subId: string) => {
  configSubTab.value = subId;
  closeForm();
  activeTab.value = subId;
  page.value = 1;
  searchQuery.value = '';
  if (route.query.tab === 'configuracion' && route.query.sub === subId) {
    if (subId === 'schedules') {
      loadAuxiliaryTournamentData();
      loadScheduleConfig();
    } else {
      loadData();
    }
  } else {
    router.replace({ path: '/campeonato', query: { tab: 'configuracion', sub: subId } });
  }
};

// Estado y cálculo para Días y Horarios de Juego
const savingSchedule = ref(false);

type WeekDayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface DayScheduleItem {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const defaultDailySchedules = (): Record<WeekDayKey, DayScheduleItem> => ({
  MON: { enabled: false, startTime: '18:00', endTime: '22:00' },
  TUE: { enabled: false, startTime: '18:00', endTime: '22:00' },
  WED: { enabled: false, startTime: '18:00', endTime: '22:00' },
  THU: { enabled: false, startTime: '18:00', endTime: '22:00' },
  FRI: { enabled: false, startTime: '19:00', endTime: '21:00' },
  SAT: { enabled: false, startTime: '08:00', endTime: '22:00' },
  SUN: { enabled: true, startTime: '08:00', endTime: '16:00' }, // Por defecto domingo activo
});

const scheduleConfig = ref<{
  editionId: string;
  dailySchedules: Record<WeekDayKey, DayScheduleItem>;
  matchDurationMinutes: number;
  intervalMinutes: number;
  selectedScenaryIds: string[];
}>({
  editionId: '',
  dailySchedules: defaultDailySchedules(),
  matchDurationMinutes: 60,
  intervalMinutes: 20,
  selectedScenaryIds: [] as string[],
});

// Programación por cancha individual: { [scenaryId]: Record<WeekDayKey, DayScheduleItem> }
const courtSchedules = ref<Record<string, Record<WeekDayKey, DayScheduleItem>>>({});
const selectedCourtId = ref<string>('');

const weekDaysList: Array<{ key: WeekDayKey; label: string }> = [
  { key: 'MON', label: 'Lunes' },
  { key: 'TUE', label: 'Martes' },
  { key: 'WED', label: 'Miércoles' },
  { key: 'THU', label: 'Jueves' },
  { key: 'FRI', label: 'Viernes' },
  { key: 'SAT', label: 'Sábado' },
  { key: 'SUN', label: 'Domingo' },
];

// Canchas habilitadas para la edición seleccionada
const availableScenariesForEdition = computed(() => {
  const ed = categoryEditionsList.value.find((e) => e.id === scheduleConfig.value.editionId);
  if (ed && Array.isArray(ed.availableScenaryIds) && ed.availableScenaryIds.length > 0) {
    const filtered = scenariesList.value.filter((sc) => ed.availableScenaryIds.includes(sc.id));
    if (filtered.length > 0) return filtered;
  }
  return scenariesList.value;
});

const currentCourtName = computed(() => {
  const sc = scenariesList.value.find((s) => s.id === selectedCourtId.value);
  return sc ? sc.name : 'Cancha Seleccionada';
});

const getCourtDailySchedules = (scenaryId: string): Record<WeekDayKey, DayScheduleItem> => {
  if (!scenaryId) return defaultDailySchedules();
  if (!courtSchedules.value[scenaryId]) {
    courtSchedules.value[scenaryId] = defaultDailySchedules();
  }
  return courtSchedules.value[scenaryId];
};

const activeCourtDailySchedules = computed(() => {
  if (!selectedCourtId.value && availableScenariesForEdition.value.length > 0) {
    selectedCourtId.value = availableScenariesForEdition.value[0].id;
  }
  return getCourtDailySchedules(selectedCourtId.value);
});

const getCourtActiveDaysCount = (scenaryId: string): number => {
  const sched = courtSchedules.value[scenaryId];
  if (!sched) return 0;
  return weekDaysList.filter((d) => sched[d.key]?.enabled).length;
};

const selectCourtToConfigure = (scenaryId: string) => {
  selectedCourtId.value = scenaryId;
};

const setQuickDays = (mode: 'sunday_only' | 'weekend_fri' | 'weekend_std' | 'weekdays' | 'all' | 'none') => {
  const current = activeCourtDailySchedules.value;
  weekDaysList.forEach((d) => {
    const item = current[d.key];
    if (!item) return;
    if (mode === 'sunday_only') {
      item.enabled = d.key === 'SUN';
      if (d.key === 'SUN') {
        item.startTime = '08:00';
        item.endTime = '16:00';
      }
    } else if (mode === 'weekend_fri') {
      item.enabled = ['FRI', 'SAT', 'SUN'].includes(d.key);
      if (d.key === 'FRI') {
        item.startTime = '19:00';
        item.endTime = '21:00';
      } else if (d.key === 'SAT') {
        item.startTime = '08:00';
        item.endTime = '22:00';
      } else if (d.key === 'SUN') {
        item.startTime = '08:00';
        item.endTime = '16:00';
      }
    } else if (mode === 'weekend_std') {
      item.enabled = ['SAT', 'SUN'].includes(d.key);
      if (d.key === 'SAT') {
        item.startTime = '08:00';
        item.endTime = '22:00';
      } else if (d.key === 'SUN') {
        item.startTime = '08:00';
        item.endTime = '16:00';
      }
    } else if (mode === 'weekdays') {
      item.enabled = ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(d.key);
      item.startTime = '18:00';
      item.endTime = '22:00';
    } else if (mode === 'all') {
      item.enabled = true;
    } else if (mode === 'none') {
      item.enabled = false;
    }
  });
};

const getDayCalculation = (dayKey: WeekDayKey | string, schedMap?: Record<WeekDayKey, DayScheduleItem>) => {
  const dayConf = (schedMap || activeCourtDailySchedules.value)[dayKey as WeekDayKey];
  if (!dayConf || !dayConf.enabled) {
    return { minutes: 0, hours: '0.0', matchesPerCourt: 0 };
  }
  const partsStart = (dayConf.startTime || '08:00').split(':');
  const startMins = Number(partsStart[0] ?? 8) * 60 + Number(partsStart[1] ?? 0);

  const partsEnd = (dayConf.endTime || '20:00').split(':');
  const endMins = Number(partsEnd[0] ?? 20) * 60 + Number(partsEnd[1] ?? 0);

  const totalMinutes = Math.max(0, endMins - startMins);
  const hours = (totalMinutes / 60).toFixed(1);

  const slotMinutes =
    (Number(scheduleConfig.value.matchDurationMinutes) || 60) +
    (Number(scheduleConfig.value.intervalMinutes) || 0);

  const matchesPerCourt = slotMinutes > 0 ? Math.floor(totalMinutes / slotMinutes) : 0;

  return {
    minutes: totalMinutes,
    hours,
    matchesPerCourt,
  };
};

const scheduleCalculation = computed(() => {
  const slotMinutes =
    (Number(scheduleConfig.value.matchDurationMinutes) || 60) +
    (Number(scheduleConfig.value.intervalMinutes) || 0);

  let totalMinutesWeek = 0;
  let totalMatchesPerWeek = 0;
  const activeCourtsSet = new Set<string>();

  const courtBreakdowns: Array<{
    courtId: string;
    courtName: string;
    totalMatches: number;
    days: Array<{
      key: string;
      label: string;
      startTime: string;
      endTime: string;
      hours: string;
      matches: number;
    }>;
  }> = [];

  for (const sc of availableScenariesForEdition.value) {
    const cSched = courtSchedules.value[sc.id];
    if (!cSched) continue;

    const daysWithMatches: Array<{
      key: string;
      label: string;
      startTime: string;
      endTime: string;
      hours: string;
      matches: number;
    }> = [];
    let courtTotalMatches = 0;

    for (const day of weekDaysList) {
      const dayConf = cSched[day.key];
      if (dayConf && dayConf.enabled) {
        activeCourtsSet.add(sc.id);
        const calc = getDayCalculation(day.key, cSched);
        totalMinutesWeek += calc.minutes;
        courtTotalMatches += calc.matchesPerCourt;
        totalMatchesPerWeek += calc.matchesPerCourt;

        daysWithMatches.push({
          key: day.key,
          label: day.label,
          startTime: dayConf.startTime,
          endTime: dayConf.endTime,
          hours: calc.hours,
          matches: calc.matchesPerCourt,
        });
      }
    }

    if (daysWithMatches.length > 0) {
      courtBreakdowns.push({
        courtId: sc.id,
        courtName: sc.name,
        totalMatches: courtTotalMatches,
        days: daysWithMatches,
      });
    }
  }

  // Contar días únicos con al menos 1 cancha activa
  const activeWeekDays = new Set<string>();
  for (const cb of courtBreakdowns) {
    for (const d of cb.days) {
      activeWeekDays.add(d.key);
    }
  }
  const activeDaysCount = activeWeekDays.size;
  const totalHoursWeek = (totalMinutesWeek / 60).toFixed(1);

  return {
    slotMinutes,
    activeDaysCount,
    courtsCount: activeCourtsSet.size,
    totalHoursWeek,
    totalMatchesPerWeek,
    courtBreakdowns,
  };
});

const syncEditionTimes = () => {
  const edId = scheduleConfig.value.editionId;
  if (!edId) return;
  const foundEd = categoryEditionsList.value.find((e) => e.id === edId);
  if (foundEd) {
    if (foundEd.matchDurationMinutes) {
      scheduleConfig.value.matchDurationMinutes = Number(foundEd.matchDurationMinutes);
    }
    const brk = Number(foundEd.breakDurationMinutes) || 0;
    const wait = Number(foundEd.waitBetweenMatchesMinutes) || 0;
    scheduleConfig.value.intervalMinutes = brk + wait;
    if (foundEd.availableScenaryIds && Array.isArray(foundEd.availableScenaryIds) && foundEd.availableScenaryIds.length > 0) {
      scheduleConfig.value.selectedScenaryIds = [...foundEd.availableScenaryIds];
    }
  }
};

const saveScheduleConfig = () => {
  savingSchedule.value = true;
  try {
    const companyId = getActiveCompanyId();
    if (selectedCourtId.value && activeCourtDailySchedules.value) {
      courtSchedules.value[selectedCourtId.value] = { ...activeCourtDailySchedules.value };
    }

    const activeScenaryIds = availableScenariesForEdition.value
      .filter((sc) => getCourtActiveDaysCount(sc.id) > 0)
      .map((sc) => sc.id);

    scheduleConfig.value.selectedScenaryIds = activeScenaryIds;
    scheduleConfig.value.dailySchedules = activeCourtDailySchedules.value;

    const dataToSave = {
      ...scheduleConfig.value,
      courtSchedules: courtSchedules.value,
      selectedCourtId: selectedCourtId.value,
    };

    localStorage.setItem(`deskounta_camp_schedules_${companyId}`, JSON.stringify(dataToSave));
    if (scheduleConfig.value.editionId) {
      localStorage.setItem(`deskounta_camp_schedules_${companyId}_${scheduleConfig.value.editionId}`, JSON.stringify(dataToSave));
    }
    toast.success('Horarios específicos por cancha guardados exitosamente');
    closeForm();
  } catch {
    toast.error('Error al guardar la configuración de horarios');
  } finally {
    savingSchedule.value = false;
  }
};

interface ScheduleTableItem {
  editionId: string;
  editionName: string;
  categoryName: string;
  courtNames: string[];
  activeDayLabels: string[];
  matchDuration: number;
  intervalMinutes: number;
  slotMinutes: number;
  totalMatchesWeek: number;
}

const schedulesList = computed<ScheduleTableItem[]>(() => {
  const companyId = getActiveCompanyId();
  const list: ScheduleTableItem[] = [];

  for (const ed of categoryEditionsList.value) {
    let raw = localStorage.getItem(`deskounta_camp_schedules_${companyId}_${ed.id}`);
    if (!raw && categoryEditionsList.value.length === 1) {
      raw = localStorage.getItem(`deskounta_camp_schedules_${companyId}`);
    }

    const matchDuration = Number(ed.matchDurationMinutes) || 60;
    const brk = Number(ed.breakDurationMinutes) || 10;
    const wait = Number(ed.waitBetweenMatchesMinutes) || 10;
    const intervalMinutes = brk + wait;
    const slotMinutes = matchDuration + intervalMinutes;

    let cSchedules: Record<string, Record<WeekDayKey, DayScheduleItem>> = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.courtSchedules && typeof parsed.courtSchedules === 'object') {
          cSchedules = parsed.courtSchedules;
        }
      } catch {
        // Ignorar
      }
    }

    const editionScenaryIds = Array.isArray(ed.availableScenaryIds) && ed.availableScenaryIds.length > 0
      ? ed.availableScenaryIds
      : scenariesList.value.map((s: any) => s.id);

    const activeCourtNames: string[] = [];
    const activeDaysSet = new Set<string>();
    let totalMatches = 0;

    for (const scId of editionScenaryIds) {
      const sc = scenariesList.value.find((s: any) => s.id === scId);
      const sched = cSchedules[scId];
      if (sched) {
        let hasActiveDay = false;
        for (const day of weekDaysList) {
          if (sched[day.key]?.enabled) {
            hasActiveDay = true;
            activeDaysSet.add(day.label.slice(0, 3));
            const startParts = (sched[day.key].startTime || '08:00').split(':').map(Number);
            const endParts = (sched[day.key].endTime || '16:00').split(':').map(Number);
            const sh = startParts[0] ?? 8;
            const sm = startParts[1] ?? 0;
            const eh = endParts[0] ?? 16;
            const em = endParts[1] ?? 0;
            const diffMin = (eh * 60 + em) - (sh * 60 + sm);
            if (diffMin > 0 && slotMinutes > 0) {
              totalMatches += Math.floor(diffMin / slotMinutes);
            }
          }
        }
        if (hasActiveDay && sc) {
          activeCourtNames.push(sc.name);
        }
      }
    }

    list.push({
      editionId: ed.id,
      editionName: ed.name,
      categoryName: ed.category?.name || 'Categoría Principal',
      courtNames: activeCourtNames.length > 0 ? activeCourtNames : (scenariesList.value.length > 0 ? [scenariesList.value[0].name] : ['Cancha Central']),
      activeDayLabels: activeDaysSet.size > 0 ? Array.from(activeDaysSet) : ['Dom'],
      matchDuration,
      intervalMinutes,
      slotMinutes,
      totalMatchesWeek: totalMatches > 0 ? totalMatches : 6,
    });
  }

  return list;
});

const schedulesListFiltered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return schedulesList.value;
  return schedulesList.value.filter(
    (s) =>
      s.editionName.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q) ||
      s.courtNames.some((c) => c.toLowerCase().includes(q))
  );
});

const openCreateSchedule = () => {
  isEditing.value = false;
  editingId.value = null;
  if (categoryEditionsList.value.length > 0) {
    scheduleConfig.value.editionId = categoryEditionsList.value[0].id;
  }
  syncEditionTimes();
  loadScheduleConfig();
  if (availableScenariesForEdition.value.length > 0) {
    selectedCourtId.value = availableScenariesForEdition.value[0].id;
  }
  isFormOpen.value = true;
};

const openEditSchedule = (item: ScheduleTableItem) => {
  isEditing.value = true;
  editingId.value = item.editionId;
  scheduleConfig.value.editionId = item.editionId;
  syncEditionTimes();
  loadScheduleConfig();
  if (availableScenariesForEdition.value.length > 0) {
    selectedCourtId.value = availableScenariesForEdition.value[0].id;
  }
  isFormOpen.value = true;
};

const deleteSchedule = (item: ScheduleTableItem) => {
  const companyId = getActiveCompanyId();
  localStorage.removeItem(`deskounta_camp_schedules_${companyId}_${item.editionId}`);
  courtSchedules.value = {};
  toast.success('Reglamento de horarios eliminado correctamente');
};

const applyScheduleFromItem = (item: ScheduleTableItem) => {
  scheduleConfig.value.editionId = item.editionId;
  syncEditionTimes();
  loadScheduleConfig();
  applyScheduleToFixture();
};

const loadScheduleConfig = () => {
  try {
    const companyId = getActiveCompanyId();
    if (!scheduleConfig.value.editionId && categoryEditionsList.value.length > 0) {
      scheduleConfig.value.editionId = categoryEditionsList.value[0].id;
    }

    const edId = scheduleConfig.value.editionId;
    let raw = edId ? localStorage.getItem(`deskounta_camp_schedules_${companyId}_${edId}`) : null;
    if (!raw) {
      raw = localStorage.getItem(`deskounta_camp_schedules_${companyId}`);
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.courtSchedules && typeof parsed.courtSchedules === 'object') {
        courtSchedules.value = parsed.courtSchedules;
      }
      if (parsed.selectedCourtId) {
        selectedCourtId.value = parsed.selectedCourtId;
      }
      if (parsed.editionId) {
        scheduleConfig.value.editionId = parsed.editionId;
      }
    }

    syncEditionTimes();

    if (!selectedCourtId.value && availableScenariesForEdition.value.length > 0) {
      selectedCourtId.value = availableScenariesForEdition.value[0].id;
    }
  } catch (err) {
    console.error('Error cargando configuración de horarios:', err);
  }
};

const applyScheduleToFixture = async () => {
  formFixture.value.matchDurationMinutes = scheduleConfig.value.matchDurationMinutes;
  const firstScenaryId = scheduleConfig.value.selectedScenaryIds[0];
  if (firstScenaryId) {
    formFixture.value.scenaryId = firstScenaryId;
  }
  toast.success('Parámetros de horarios aplicados al Generador de Fixture');
  await openFixtureModal();
};

const tabToSubCode: Record<string, string> = {
  teams: 'SUB-CAMP-001',
  players: 'SUB-CAMP-002',
  categories: 'SUB-CAMP-003',
  categoryEditions: 'SUB-CAMP-004',
  stages: 'SUB-CAMP-005',
  scenaries: 'SUB-CAMP-006',
  teamRegistrations: 'SUB-CAMP-007',
  playerRegistrations: 'SUB-CAMP-008',
  referees: 'SUB-CAMP-009',
  vocals: 'SUB-CAMP-010',
  matches: 'SUB-CAMP-011',
  sanctions: 'SUB-CAMP-012',
  payments: 'SUB-CAMP-013',
  demarcations: 'SUB-CAMP-015',
  schedules: 'SUB-CAMP-016',
  standings: 'SUB-CAMP-017',
  playerClassifications: 'SUB-CAMP-019',
  playerTransfers: 'SUB-CAMP-020',
};

// Filtrar las pestañas según los permisos / submódulos activos de la empresa
const allowedTabs = computed(() => {
  const isSuper = Boolean(authStore.tokenPayload?.super_admin || authStore.accessInfo?.isSuperAdmin);
  if (isSuper) return tabs;

  const allowedUrls = (authStore.accessInfo?.allowedUrls || []).map((u) => u.toLowerCase());
  const menu = authStore.accessInfo?.menu || [];
  const campMenu = menu.find((m) => m.code === 'MOD-010' || m.description?.toLowerCase().includes('campeonato'));
  const subChildren = campMenu?.children || [];
  const subCodes = subChildren.map((c: any) => (c.code || '').toUpperCase());
  const subUrls = subChildren.map((c: any) => (c.url_desc || c.url || '').toLowerCase());

  // Si no hay restricciones explícitas o tiene el módulo de campeonato completo asignado
  if (allowedUrls.length === 0 && subUrls.length === 0 && subCodes.length === 0) return tabs;

  const hasGeneralConfigAccess =
    allowedUrls.some((u) => u.includes('tab=configuracion') || u.includes('tab=configuraciones') || u === '/campeonato') ||
    subUrls.some((u) => u.includes('tab=configuracion') || u.includes('tab=configuraciones') || u === '/campeonato');

  return tabs.filter((t) => {
    // Si tiene acceso a Configuraciones, todas las subpestañas de configuración son visibles
    if (hasGeneralConfigAccess && configSubTabsList.some((st) => st.id === t.id)) return true;

    const code = tabToSubCode[t.id];
    if (code && subCodes.includes(code)) return true;

    const tabUrl = `/campeonato?tab=${t.id}`.toLowerCase();
    return (
      allowedUrls.some((u) => u.includes(`tab=${t.id.toLowerCase()}`) || u.includes(t.id.toLowerCase()) || u === tabUrl) ||
      subUrls.some((u) => u.includes(`tab=${t.id.toLowerCase()}`) || u.includes(t.id.toLowerCase()) || u === tabUrl)
    );
  });
});

const visibleConfigSubTabs = computed(() => {
  return configSubTabsList.filter((st) => allowedTabs.value.some((at) => at.id === st.id));
});

const activeTab = ref('teams');
const currentTabConfig = computed<TabConfig>(() => {
  return tabs.find((t) => t.id === activeTab.value) ?? tabs[0]!;
});
const activeTabLabel = computed(() => currentTabConfig.value.label);
const columns = computed(() => currentTabConfig.value.columns);
const formFields = computed(() => {
  const fields = currentTabConfig.value.fields || [];
  if (activeTab.value === 'categories' && !isEditing.value) {
    return fields.filter((f) => f.key !== 'code');
  }
  return fields;
});

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

// ==========================================
// CÁLCULO DE EDAD DE JUGADORES (AÑOS Y MESES)
// ==========================================
const calculatePlayerAgeDirect = (birthDateStr: string | null | undefined) => {
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
  if (years < 0) years = 0;
  if (months < 0) months = 0;
  return { years, months };
};

const computedPlayerAge = computed(() => {
  if (!formData.value.birthDate) return null;
  return calculatePlayerAgeDirect(formData.value.birthDate);
});

// ==========================================
// HELPERS PARA BLOQUEO Y DESHABILITADO DE CAMPOS
// ==========================================
const isFieldLockedByGlobal = (field: any): boolean => {
  if (activeTab.value === 'players' && globalPlayerFound.value) {
    return true;
  }
  if (activeTab.value === 'referees' && globalRefereeFound.value) {
    return true;
  }
  return false;
};

const isFieldCalculated = (field: any): boolean => {
  return Boolean(field.readonly || field.disabled);
};

const isFieldDisabled = (field: any): boolean => {
  if (field.disabled) return true;
  if (isFieldLockedByGlobal(field)) return true;
  return false;
};

const isFieldReadonly = (field: any): boolean => {
  if (field.readonly) return true;
  if (isFieldLockedByGlobal(field)) return true;
  return false;
};

// ==========================================
// PADRÓN GLOBAL DE FUTBOLISTAS
// ==========================================
const searchingGlobalPlayer = ref(false);
const globalPlayerFound = ref(false);
const globalPlayerSearched = ref(false);

const searchGlobalPlayer = async () => {
  const ident = (formData.value.identification || '').trim();
  if (!ident) {
    toast.warning('Ingresa el número de cédula o identificación para consultar');
    return;
  }

  try {
    searchingGlobalPlayer.value = true;
    const res = await CampeonatoApi.players.findGlobal(ident);
    const data = res.data;

    globalPlayerSearched.value = true;

    if (data.exists && data.player) {
      const p = data.player;
      globalPlayerFound.value = true;

      formData.value.name = p.name || '';
      formData.value.lastName = p.lastName || '';
      formData.value.code = p.code || 'JUG-GLOBAL';
      formData.value.birthDate = p.birthDate ? String(p.birthDate).slice(0, 10) : '';
      formData.value.photo = p.photo || '';
      formData.value.demarcationId = p.demarcationId || formData.value.demarcationId || '';
      formData.value.playerClassificationId = p.playerClassificationId || formData.value.playerClassificationId || '';
      formData.value.dominantFoot = p.dominantFoot || formData.value.dominantFoot || 'RIGHT';
      formData.value.bloodType = p.bloodType || formData.value.bloodType || '';
      formData.value.phone = p.phone || '';
      formData.value.email = p.email || '';
      formData.value.emergencyContactName = p.emergencyContactName || '';
      formData.value.emergencyContactPhone = p.emergencyContactPhone || '';
      formData.value.passOwnerType = p.passOwnerType || 'PLAYER';
      formData.value.isActive = true;

      if (formData.value.birthDate) {
        const calculated = calculatePlayerAgeDirect(formData.value.birthDate);
        if (calculated) {
          formData.value.ageYears = calculated.years;
          formData.value.ageMonths = calculated.months;
        }
      }

      if (data.isLinkedToCurrentCompany) {
        toast.info(`El futbolista ${p.name} ${p.lastName} ya se encuentra registrado en tu liga.`);
      } else {
        toast.success(`Futbolista localizado: ${p.name} ${p.lastName}. Se vinculará a tu liga al guardar.`);
      }
    } else {
      globalPlayerFound.value = false;
      toast.info('No existe en el padrón global. Puedes proceder a registrar sus datos como nuevo futbolista.');
    }
  } catch (err: any) {
    console.error('Error al consultar padrón global de jugadores:', err);
    toast.error('Error al consultar el padrón global de futbolistas');
  } finally {
    searchingGlobalPlayer.value = false;
  }
};

// ==========================================
// PADRÓN GLOBAL DE ÁRBITROS
// ==========================================
const refereeGuildsList = ref<any[]>([]);
const searchingGlobalReferee = ref(false);
const globalRefereeFound = ref(false);
const globalRefereeSearched = ref(false);

const getGuildNameById = (guildId: string) => {
  const found = refereeGuildsList.value.find((g) => g.id === guildId);
  return found ? `${found.description}${found.acronyms ? ' (' + found.acronyms + ')' : ''}` : '';
};

const searchGlobalReferee = async () => {
  const ident = (formData.value.identification || '').trim();
  if (!ident) {
    toast.warning('Ingresa el número de documento para consultar');
    return;
  }

  try {
    searchingGlobalReferee.value = true;
    const res = await CampeonatoApi.referees.findGlobal(ident);
    const data = res.data;

    globalRefereeSearched.value = true;

    if (data.exists && data.referee) {
      const r = data.referee;
      globalRefereeFound.value = true;

      formData.value.name = r.name || '';
      formData.value.lastName = r.lastName || '';
      formData.value.guildId = r.guildId || '';
      formData.value.phone = r.phone || '';
      formData.value.email = r.email || '';
      formData.value.isActive = true;

      if (data.isLinkedToCurrentCompany) {
        toast.info(`El árbitro ${r.name} ${r.lastName} ya está vinculado a tu liga.`);
      } else {
        toast.success(`Árbitro localizado: ${r.name} ${r.lastName}. Se vinculará a tu liga al guardar.`);
      }
    } else {
      globalRefereeFound.value = false;
      toast.info('No existe en el padrón global. Puedes proceder a registrarlo como nuevo árbitro.');
    }
  } catch (err: any) {
    console.error('Error al consultar árbitro en padrón global:', err);
    toast.error('Error al consultar el padrón global de árbitros');
  } finally {
    searchingGlobalReferee.value = false;
  }
};

watch(
  () => formData.value.birthDate,
  (newBirthDate) => {
    if (activeTab.value === 'players') {
      if (newBirthDate) {
        const calculated = calculatePlayerAgeDirect(newBirthDate);
        if (calculated) {
          formData.value.ageYears = calculated.years;
          formData.value.ageMonths = calculated.months;
        }
      } else {
        formData.value.ageYears = null;
        formData.value.ageMonths = null;
      }
    }
  }
);

// Sincronización automática cuando el usuario elige una Plantilla de Formato Global en Etapas
watch(
  () => formData.value.stageFormatId,
  (newFmtId) => {
    if (activeTab.value === 'stages' && newFmtId) {
      const found = stageFormatsList.value.find((f) => f.id === newFmtId);
      if (found) {
        if (!formData.value.name || formData.value.name === '') {
          formData.value.name = found.name;
        }
        formData.value.format = found.formatType || 'EVERYONE_AGAINST_EVERYONE';
        formData.value.numberOfLaps = found.defaultLaps || 1;
        formData.value.tieBreaker = found.defaultTieBreaker || 'PENALTIES';
        if (found.requiresGroups) {
          formData.value.numberOfGroups = formData.value.numberOfGroups || 2;
        } else {
          formData.value.numberOfGroups = 1;
        }
      }
    }
  }
);

// Estado para Tabla de Posiciones y Goleadores
const selectedStageId = ref('');
const stagesList = ref<any[]>([]);
const stageFormatsList = ref<any[]>([]);
const teamsList = ref<any[]>([]);
const categoriesList = ref<any[]>([]);
const scenariesList = ref<any[]>([]);
const demarcationsList = ref<any[]>([]);
const playerClassificationsList = ref<any[]>([]);
const playersList = ref<any[]>([]);
const categoryEditionsList = ref<any[]>([]);
const teamRegistrationsList = ref<any[]>([]);
const standingsList = ref<any[]>([]);
const topScorersList = ref<any[]>([]);
const loadingStandings = ref(false);
const uploadingImage = ref(false);

// ==========================================
// EDICIÓN DE TORNEO DETALLE CATEGORÍAS
// ==========================================
const editionCategoriesDetail = ref<Array<{
  _uid?: string;
  id?: string;
  categoryId: string;
  categoryDescription?: string;
  startDate?: string;
  endDate?: string;
  registrationFee?: number;
  maxPlayers?: number;
  classifications?: Array<{
    id?: string;
    playerClassificationId: string;
    playerClassification?: any;
    maxPlayers: number;
    maxInactivityMonths?: number | null;
    maxMonths?: number | null;
  }>;
}>>([]);

const editionDetailInput = ref({
  categoryId: '',
  startDate: '',
  endDate: '',
  registrationFee: 0,
  maxPlayers: 25,
});

const getCategoryNameById = (catId: string) => {
  const found = categoriesList.value.find((c: any) => c.id === catId);
  return found ? found.name : 'Categoría';
};

const expandedCategoryRows = ref<Set<number>>(new Set([0]));

const toggleCategoryRow = (idx: number) => {
  if (expandedCategoryRows.value.has(idx)) {
    expandedCategoryRows.value.delete(idx);
  } else {
    expandedCategoryRows.value.add(idx);
  }
};

const isCategoryRowExpanded = (idx: number): boolean => {
  return expandedCategoryRows.value.has(idx);
};

const removeCategoryStageDirect = (item: any, sIdx: number) => {
  if (!item || !Array.isArray(item.stages)) return;
  item.stages.splice(sIdx, 1);
  toast.info('Etapa eliminada de la categoría');
};

const addStageToCategoryDirect = (item: any) => {
  if (!item.stages) {
    item.stages = [];
  }
  const nextOrder = item.stages.length + 1;
  const defaultCT = competitionTypesList.value.length > 0 ? competitionTypesList.value[0] : null;
  const defaultCL = competitionLapsList.value.length > 0 ? competitionLapsList.value[0] : null;

  item.stages.push({
    _uid: 'stg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    stageOrder: nextOrder,
    name: nextOrder === 1 ? 'Primera Fase' : nextOrder === 2 ? 'Liguilla Final' : `Fase ${nextOrder}`,
    competitionTypeId: defaultCT ? defaultCT.id : '',
    competitionTypeDescription: defaultCT ? defaultCT.description : '',
    competitionLapId: defaultCL ? defaultCL.id : '',
    competitionLapDescription: defaultCL ? defaultCL.description : '',
    tieBreakerCriteria: [],
    tieBreakerCriterionId: null,
    tieBreakerCriterionDescription: null,
  });
};

const onCompetitionTypeChangeInStage = (stg: any) => {
  if (!stg.competitionTypeId) return;
  const found = competitionTypesList.value.find((c: any) => c.id === stg.competitionTypeId);
  if (found) {
    stg.competitionTypeDescription = found.description;
  }
};

const onCompetitionLapChangeInStage = (stg: any) => {
  if (!stg.competitionLapId) return;
  const found = competitionLapsList.value.find((c: any) => c.id === stg.competitionLapId);
  if (found) {
    stg.competitionLapDescription = found.description;
  }
};

const isCriterionAlreadyInStage = (stg: any, critId: string): boolean => {
  if (!stg.tieBreakerCriteria || !Array.isArray(stg.tieBreakerCriteria)) return false;
  return stg.tieBreakerCriteria.some((c: any) => (c.criterionId || c.id) === critId);
};

const updateStageTieBreakerSummary = (stg: any) => {
  if (stg.tieBreakerCriteria && stg.tieBreakerCriteria.length > 0) {
    stg.tieBreakerCriterionId = stg.tieBreakerCriteria[0].criterionId || stg.tieBreakerCriteria[0].id;
    stg.tieBreakerCriterionDescription = stg.tieBreakerCriteria
      .map((c: any) => `#${c.order} ${c.code || c.description}`)
      .join(' → ');
  } else {
    stg.tieBreakerCriterionId = null;
    stg.tieBreakerCriterionDescription = null;
  }
};

const addCriterionToStageDirect = (stg: any, event: any) => {
  const critId = event?.target?.value;
  if (!critId) return;
  if (!stg.tieBreakerCriteria) {
    stg.tieBreakerCriteria = [];
  }
  if (isCriterionAlreadyInStage(stg, critId)) {
    toast.warning('Este criterio de desempate ya está en la lista de esta etapa');
    event.target.value = '';
    return;
  }
  const found = tieBreakerCriteriaList.value.find((c: any) => c.id === critId);
  if (found) {
    stg.tieBreakerCriteria.push({
      criterionId: found.id,
      id: found.id,
      description: found.description,
      code: found.code || '',
      observation: found.observation || '',
      order: stg.tieBreakerCriteria.length + 1,
    });
    updateStageTieBreakerSummary(stg);
  }
  event.target.value = '';
};

const moveStageCriterionUp = (stg: any, index: number) => {
  if (!stg.tieBreakerCriteria || index <= 0) return;
  const temp = stg.tieBreakerCriteria[index];
  stg.tieBreakerCriteria[index] = stg.tieBreakerCriteria[index - 1];
  stg.tieBreakerCriteria[index - 1] = temp;
  stg.tieBreakerCriteria.forEach((c: any, idx: number) => {
    c.order = idx + 1;
  });
  updateStageTieBreakerSummary(stg);
};

const moveStageCriterionDown = (stg: any, index: number) => {
  if (!stg.tieBreakerCriteria || index >= stg.tieBreakerCriteria.length - 1) return;
  const temp = stg.tieBreakerCriteria[index];
  stg.tieBreakerCriteria[index] = stg.tieBreakerCriteria[index + 1];
  stg.tieBreakerCriteria[index + 1] = temp;
  stg.tieBreakerCriteria.forEach((c: any, idx: number) => {
    c.order = idx + 1;
  });
  updateStageTieBreakerSummary(stg);
};

const removeStageCriterion = (stg: any, index: number) => {
  if (!stg.tieBreakerCriteria) return;
  stg.tieBreakerCriteria.splice(index, 1);
  stg.tieBreakerCriteria.forEach((c: any, idx: number) => {
    c.order = idx + 1;
  });
  updateStageTieBreakerSummary(stg);
};

const getCategoryGenderById = (categoryId: string): string => {
  if (!categoryId) return '';
  const found = categoriesList.value.find((c: any) => c.id === categoryId);
  if (!found) return '';
  return found.gender === 'MALE' ? 'Varones' : found.gender === 'FEMALE' ? 'Mujeres' : 'Mixto';
};

const addCategoryToEditionDetail = () => {
  const newRow = {
    _uid: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    categoryId: '',
    categoryDescription: '',
    categoryAcronyms: '',
    startDate: formData.value.startDate || '',
    endDate: formData.value.endDate || '',
    registrationFee: 0,
    maxPlayers: 25,
    matchDurationMinutes: 60,
    breakDurationMinutes: 10,
    waitBetweenMatchesMinutes: 10,
    classifications: [],
    stages: [],
  };
  editionCategoriesDetail.value.push(newRow);
  expandedCategoryRows.value.add(editionCategoriesDetail.value.length - 1);
};

const onCategoryChangeInRow = (item: any) => {
  if (!item.categoryId) return;
  const found = categoriesList.value.find((c: any) => c.id === item.categoryId);
  if (found) {
    item.categoryDescription = found.name;
    item.categoryAcronyms = found.acronyms || '';
  }
};

const getCategoryAcronymsById = (categoryId: string): string => {
  if (!categoryId) return '';
  const found = categoriesList.value.find((c: any) => c.id === categoryId);
  return found?.acronyms || '';
};

const removeCategoryFromEditionDetail = (index: number) => {
  editionCategoriesDetail.value.splice(index, 1);
  expandedCategoryRows.value.delete(index);
  const nextSet = new Set<number>();
  expandedCategoryRows.value.forEach((expIdx) => {
    if (expIdx < index) {
      nextSet.add(expIdx);
    } else if (expIdx > index) {
      nextSet.add(expIdx - 1);
    }
  });
  expandedCategoryRows.value = nextSet;
};

// ==========================================
// DIRECTORIO DEL EQUIPO / CLUB
// ==========================================
const showTeamManagementModal = ref(false);
const selectedTeamForManagement = ref<any>(null);
const teamManagementList = ref<TeamManagementItem[]>([]);
const loadingTeamManagement = ref(false);
const savingTeamManagement = ref(false);
const formTeamManagement = ref({
  roleTitle: 'Presidente',
  name: '',
  lastName: '',
  identification: '',
  cellphone: '',
  email: '',
});

const openTeamManagementModal = (team: any) => {
  selectedTeamForManagement.value = team;
  showTeamManagementModal.value = true;
  formTeamManagement.value = {
    roleTitle: 'Presidente',
    name: '',
    lastName: '',
    identification: '',
    cellphone: '',
    email: '',
  };
  loadTeamManagement(team.id);
};

const loadTeamManagement = async (teamId: string) => {
  try {
    loadingTeamManagement.value = true;
    const res = await TeamManagementsService.listByTeam(teamId);
    teamManagementList.value = res.data || [];
  } catch (err: any) {
    console.error(err);
    toast.error('Error al cargar directivos del equipo');
  } finally {
    loadingTeamManagement.value = false;
  }
};

const saveTeamManagementRecord = async () => {
  if (!selectedTeamForManagement.value?.id) return;
  try {
    savingTeamManagement.value = true;
    await TeamManagementsService.create({
      teamId: selectedTeamForManagement.value.id,
      roleTitle: formTeamManagement.value.roleTitle,
      name: formTeamManagement.value.name,
      lastName: formTeamManagement.value.lastName,
      identification: formTeamManagement.value.identification,
      cellphone: formTeamManagement.value.cellphone || undefined,
      email: formTeamManagement.value.email || undefined,
      isActive: true,
    });
    toast.success(`Directivo (${formTeamManagement.value.roleTitle}) registrado correctamente`);
    formTeamManagement.value = {
      roleTitle: 'Vocal 1',
      name: '',
      lastName: '',
      identification: '',
      cellphone: '',
      email: '',
    };
    await loadTeamManagement(selectedTeamForManagement.value.id);
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Error al guardar directivo');
  } finally {
    savingTeamManagement.value = false;
  }
};

const deleteTeamManagementRecord = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este directivo del club?')) return;
  try {
    await TeamManagementsService.delete(id);
    toast.success('Directivo eliminado del directorio');
    if (selectedTeamForManagement.value?.id) {
      await loadTeamManagement(selectedTeamForManagement.value.id);
    }
  } catch (err: any) {
    console.error(err);
    toast.error('Error al eliminar directivo');
  }
};

const getRoleBadgeClass = (role?: string) => {
  switch (role) {
    case 'Presidente':
      return 'bg-warning-subtle text-warning border border-warning-subtle fw-bold';
    case 'Vicepresidente':
      return 'bg-info-subtle text-info border border-info-subtle fw-bold';
    case 'Secretario/a':
      return 'bg-primary-subtle text-primary border border-primary-subtle fw-semibold';
    default:
      return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  }
};

// =========================================================================
// CLASIFICACIONES DE FUTBOLISTAS POR CATEGORÍA EN EDICIÓN DE TORNEO
// =========================================================================
const showCategoryClassificationsModal = ref(false);
const selectedCategoryForClassifications = ref<any>(null);
const selectedCategoryIndex = ref<number>(-1);
const formCategoryClassification = ref({
  playerClassificationId: '',
  maxPlayers: 5,
  maxInactivityMonths: null as number | null,
  maxMonths: null as number | null,
});

const isExprofessionalSelected = computed(() => {
  if (!formCategoryClassification.value.playerClassificationId) return false;
  const pc = playerClassificationsList.value.find(
    (c) => c.id === formCategoryClassification.value.playerClassificationId,
  );
  if (!pc) return false;
  const desc = (pc.description || '').toLowerCase();
  const code = (pc.code || '').toUpperCase();
  return (
    code === 'EXPRO' ||
    desc.includes('exprofesional') ||
    desc.includes('ex-profesional') ||
    desc.includes('profesional')
  );
});

const isJuvenileSelected = computed(() => {
  if (!formCategoryClassification.value.playerClassificationId) return false;
  const pc = playerClassificationsList.value.find(
    (c) => c.id === formCategoryClassification.value.playerClassificationId,
  );
  if (!pc) return false;
  const desc = (pc.description || '').toLowerCase();
  const code = (pc.code || '').toUpperCase();
  return code === 'JUV' || desc.includes('juvenil');
});

watch(
  () => formCategoryClassification.value.playerClassificationId,
  () => {
    formCategoryClassification.value.maxInactivityMonths = null;
    formCategoryClassification.value.maxMonths = null;
  },
);

const openCategoryClassificationsModal = (item: any, idx: number) => {
  selectedCategoryForClassifications.value = item;
  selectedCategoryIndex.value = idx;
  if (!item.classifications) {
    item.classifications = [];
  }
  formCategoryClassification.value = {
    playerClassificationId: '',
    maxPlayers: 5,
    maxInactivityMonths: null,
    maxMonths: null,
  };
  showCategoryClassificationsModal.value = true;
};

const currentCategoryClassificationsTotal = computed(() => {
  if (!selectedCategoryForClassifications.value?.classifications) return 0;
  return selectedCategoryForClassifications.value.classifications.reduce(
    (acc: number, c: any) => acc + (Number(c.maxPlayers) || 0),
    0,
  );
});

const availableClassificationsForCurrentCategory = computed(() => {
  const existingIds = (selectedCategoryForClassifications.value?.classifications || []).map(
    (c: any) => c.playerClassificationId,
  );
  return playerClassificationsList.value.filter(
    (pc) => !existingIds.includes(pc.id) && pc.isActive,
  );
});

const addCategoryClassificationRecord = () => {
  if (!formCategoryClassification.value.playerClassificationId) {
    toast.warning('Seleccione una clasificación');
    return;
  }
  const maxLimit = Number(selectedCategoryForClassifications.value.maxPlayers) || 25;
  const newMax = Number(formCategoryClassification.value.maxPlayers) || 0;
  if (newMax <= 0) {
    toast.warning('El cupo máximo debe ser mayor a 0');
    return;
  }

  // Validación de meses de inactividad para Exprofesional
  if (isExprofessionalSelected.value) {
    const inact = Number(formCategoryClassification.value.maxInactivityMonths);
    if (!inact || inact <= 0) {
      toast.warning('Ingrese la cantidad máxima de meses de inactividad en el fútbol profesional');
      return;
    }
  }

  // Validación de cantidad máxima de meses para Juvenil
  if (isJuvenileSelected.value) {
    const jMonths = Number(formCategoryClassification.value.maxMonths);
    if (!jMonths || jMonths <= 0) {
      toast.warning('Ingrese la cantidad máxima de meses permitida para la categoría juvenil');
      return;
    }
  }

  const currentTotal = currentCategoryClassificationsTotal.value;
  if (currentTotal + newMax > maxLimit) {
    toast.error(
      `La suma de las clasificaciones (${currentTotal + newMax}) no puede superar el máximo de jugadores inscritos (${maxLimit}) de esta categoría.`,
    );
    return;
  }

  const pcObj = playerClassificationsList.value.find(
    (pc) => pc.id === formCategoryClassification.value.playerClassificationId,
  );

  selectedCategoryForClassifications.value.classifications.push({
    playerClassificationId: formCategoryClassification.value.playerClassificationId,
    playerClassification: pcObj,
    maxPlayers: newMax,
    maxInactivityMonths: isExprofessionalSelected.value
      ? Number(formCategoryClassification.value.maxInactivityMonths) || null
      : null,
    maxMonths: isJuvenileSelected.value
      ? Number(formCategoryClassification.value.maxMonths) || null
      : null,
  });

  formCategoryClassification.value.playerClassificationId = '';
  formCategoryClassification.value.maxPlayers = 5;
  formCategoryClassification.value.maxInactivityMonths = null;
  formCategoryClassification.value.maxMonths = null;
  toast.success('Clasificación asignada a la categoría');
};

const removeCategoryClassificationRecord = (idx: number) => {
  if (selectedCategoryForClassifications.value?.classifications) {
    selectedCategoryForClassifications.value.classifications.splice(idx, 1);
  }
};

const getSumClassifications = (item: any) => {
  if (!item.classifications || !item.classifications.length) return 0;
  return item.classifications.reduce((sum: number, c: any) => sum + (Number(c.maxPlayers) || 0), 0);
};

const getPlayerClassificationDescById = (id: string) => {
  const found = playerClassificationsList.value.find((pc) => pc.id === id);
  return found ? found.description : 'Clasificación';
};

const getPlayerClassificationCodeById = (id: string) => {
  const found = playerClassificationsList.value.find((pc) => pc.id === id);
  return found ? found.code : '';
};

// =========================================================================
// ETAPAS Y FASES POR CATEGORÍA EN EDICIÓN DE TORNEO
// =========================================================================
const showCategoryStagesModal = ref(false);
const selectedCategoryForStages = ref<any>(null);
const selectedCategoryStagesIndex = ref<number>(-1);
const editingCategoryStageIndex = ref<number | null>(null);
const formCategoryStage = ref({
  stageOrder: 1,
  name: '',
  competitionTypeId: '',
  competitionLapId: '',
  tieBreakerCriterionId: '',
});
const formCategoryStageCriteria = ref<any[]>([]);
const selectedCriterionToAdd = ref('');

const competitionTypesList = ref<any[]>([]);
const competitionLapsList = ref<any[]>([]);
const tieBreakerCriteriaList = ref<any[]>([]);

const competitionTypeOptions = computed(() => {
  return competitionTypesList.value.map((ct) => ({
    value: ct.id,
    label: ct.description,
    sublabel: ct.observation || undefined,
  }));
});

const competitionLapOptions = computed(() => {
  return competitionLapsList.value.map((cl) => ({
    value: cl.id,
    label: cl.description,
    sublabel: cl.observation || undefined,
  }));
});

const tieBreakerCriteriaOptions = computed(() => {
  return tieBreakerCriteriaList.value.map((tb) => ({
    value: tb.id,
    label: tb.description,
    sublabel: tb.observation || undefined,
  }));
});

const availableTieBreakerOptions = computed(() => {
  const selectedIds = new Set(
    formCategoryStageCriteria.value.map((c) => c.criterionId || c.id)
  );
  return tieBreakerCriteriaList.value
    .filter((tb) => !selectedIds.has(tb.id))
    .map((tb) => ({
      value: tb.id,
      label: tb.description,
      sublabel: tb.code ? `[${tb.code}] ${tb.observation || ''}`.trim() : tb.observation || undefined,
    }));
});

const addCriterionToStage = () => {
  if (!selectedCriterionToAdd.value) return;
  const item = tieBreakerCriteriaList.value.find((c) => c.id === selectedCriterionToAdd.value);
  if (!item) return;

  formCategoryStageCriteria.value.push({
    criterionId: item.id,
    id: item.id,
    description: item.description,
    code: item.code || '',
    observation: item.observation || '',
    order: formCategoryStageCriteria.value.length + 1,
  });
  selectedCriterionToAdd.value = '';
};

const moveCriterionUp = (index: number) => {
  if (index <= 0 || index >= formCategoryStageCriteria.value.length) return;
  const item = formCategoryStageCriteria.value.splice(index, 1)[0];
  formCategoryStageCriteria.value.splice(index - 1, 0, item);
  formCategoryStageCriteria.value.forEach((c, idx) => {
    c.order = idx + 1;
  });
};

const moveCriterionDown = (index: number) => {
  if (index < 0 || index >= formCategoryStageCriteria.value.length - 1) return;
  const item = formCategoryStageCriteria.value.splice(index, 1)[0];
  formCategoryStageCriteria.value.splice(index + 1, 0, item);
  formCategoryStageCriteria.value.forEach((c, idx) => {
    c.order = idx + 1;
  });
};

const removeCriterionFromStage = (index: number) => {
  formCategoryStageCriteria.value.splice(index, 1);
  formCategoryStageCriteria.value.forEach((c, idx) => {
    c.order = idx + 1;
  });
};

const editCategoryStageRecord = (index: number) => {
  if (!selectedCategoryForStages.value?.stages?.[index]) return;
  const stg = selectedCategoryForStages.value.stages[index];
  editingCategoryStageIndex.value = index;

  formCategoryStage.value = {
    stageOrder: stg.stageOrder || (index + 1),
    name: stg.name || '',
    competitionTypeId: stg.competitionTypeId || '',
    competitionLapId: stg.competitionLapId || '',
    tieBreakerCriterionId: stg.tieBreakerCriterionId || '',
  };

  if (Array.isArray(stg.tieBreakerCriteria) && stg.tieBreakerCriteria.length > 0) {
    formCategoryStageCriteria.value = JSON.parse(JSON.stringify(stg.tieBreakerCriteria)).map((c: any, cIdx: number) => ({
      criterionId: c.criterionId || c.id,
      id: c.id || c.criterionId,
      description: c.description || getTieBreakerCriterionDescById(c.criterionId || c.id),
      code: c.code || '',
      observation: c.observation || '',
      order: Number(c.order) || (cIdx + 1),
    }));
  } else if (stg.tieBreakerCriterionId) {
    const item = tieBreakerCriteriaList.value.find((c) => c.id === stg.tieBreakerCriterionId);
    formCategoryStageCriteria.value = [{
      criterionId: stg.tieBreakerCriterionId,
      id: stg.tieBreakerCriterionId,
      description: item?.description || stg.tieBreakerCriterionDescription || getTieBreakerCriterionDescById(stg.tieBreakerCriterionId),
      code: item?.code || '',
      observation: item?.observation || '',
      order: 1,
    }];
  } else {
    formCategoryStageCriteria.value = [];
  }
  selectedCriterionToAdd.value = '';
};

const cancelEditCategoryStage = () => {
  editingCategoryStageIndex.value = null;
  formCategoryStage.value = {
    stageOrder: (selectedCategoryForStages.value?.stages?.length || 0) + 1,
    name: '',
    competitionTypeId: competitionTypesList.value.length > 0 ? competitionTypesList.value[0].id : '',
    competitionLapId: competitionLapsList.value.length > 0 ? competitionLapsList.value[0].id : '',
    tieBreakerCriterionId: '',
  };
  formCategoryStageCriteria.value = [];
  selectedCriterionToAdd.value = '';
};

const getCompetitionTypeDescById = (id: string): string => {
  if (!id) return '';
  const item = competitionTypesList.value.find((c) => c.id === id);
  return item ? item.description : id;
};

const getCompetitionLapDescById = (id: string): string => {
  if (!id) return '';
  const item = competitionLapsList.value.find((c) => c.id === id);
  return item ? item.description : id;
};

const getTieBreakerCriterionDescById = (id: string): string => {
  if (!id) return '';
  const item = tieBreakerCriteriaList.value.find((c) => c.id === id);
  return item ? item.description : id;
};

const openCategoryStagesModal = (item: any, idx: number, stageIdxToEdit?: number) => {
  selectedCategoryForStages.value = item;
  selectedCategoryStagesIndex.value = idx;
  editingCategoryStageIndex.value = null;
  if (!item.stages) {
    item.stages = [];
  }
  formCategoryStageCriteria.value = [];
  selectedCriterionToAdd.value = '';
  formCategoryStage.value = {
    stageOrder: (item.stages.length || 0) + 1,
    name: '',
    competitionTypeId: competitionTypesList.value.length > 0 ? competitionTypesList.value[0].id : '',
    competitionLapId: competitionLapsList.value.length > 0 ? competitionLapsList.value[0].id : '',
    tieBreakerCriterionId: '',
  };
  if (typeof stageIdxToEdit === 'number' && stageIdxToEdit >= 0) {
    editCategoryStageRecord(stageIdxToEdit);
  }
  showCategoryStagesModal.value = true;
};

const addCategoryStageRecord = () => {
  if (!selectedCategoryForStages.value) return;
  if (!selectedCategoryForStages.value.stages) {
    selectedCategoryForStages.value.stages = [];
  }
  if (!formCategoryStage.value.name.trim()) {
    toast.error('El nombre de la etapa o fase es obligatorio');
    return;
  }
  if (!formCategoryStage.value.competitionTypeId) {
    toast.error('Seleccione el tipo principal de competencia');
    return;
  }
  if (!formCategoryStage.value.competitionLapId) {
    toast.error('Seleccione la modalidad de vueltas');
    return;
  }

  const ctDesc = getCompetitionTypeDescById(formCategoryStage.value.competitionTypeId);
  const clDesc = getCompetitionLapDescById(formCategoryStage.value.competitionLapId);

  // Al momento de guardar en un campo nuevo guarda según el orden del array sumando al índice del array 1
  const tieBreakerCriteria = formCategoryStageCriteria.value.map((c, idx) => ({
    criterionId: c.criterionId || c.id,
    id: c.id || c.criterionId,
    description: c.description || getTieBreakerCriterionDescById(c.criterionId || c.id),
    code: c.code || '',
    observation: c.observation || '',
    order: idx + 1,
  }));

  const tbDesc = tieBreakerCriteria.length > 0
    ? tieBreakerCriteria.map((c) => `#${c.order} ${c.code || c.description}`).join(' → ')
    : null;

  const stageData = {
    stageOrder: Number(formCategoryStage.value.stageOrder) || (editingCategoryStageIndex.value !== null ? (editingCategoryStageIndex.value + 1) : (selectedCategoryForStages.value.stages.length + 1)),
    name: formCategoryStage.value.name.trim(),
    competitionTypeId: formCategoryStage.value.competitionTypeId,
    competitionTypeDescription: ctDesc,
    competitionLapId: formCategoryStage.value.competitionLapId,
    competitionLapDescription: clDesc,
    tieBreakerCriteria: tieBreakerCriteria,
    tieBreakerCriterionId: tieBreakerCriteria.length > 0 ? tieBreakerCriteria[0].criterionId : null,
    tieBreakerCriterionDescription: tbDesc,
  };

  if (editingCategoryStageIndex.value !== null && editingCategoryStageIndex.value >= 0) {
    selectedCategoryForStages.value.stages[editingCategoryStageIndex.value] = stageData;
    toast.success('Etapa actualizada correctamente');
    editingCategoryStageIndex.value = null;
  } else {
    selectedCategoryForStages.value.stages.push(stageData);
    toast.success('Etapa agregada a la categoría');
  }

  // Ordenar por stageOrder
  selectedCategoryForStages.value.stages.sort((a: any, b: any) => (Number(a.stageOrder) || 0) - (Number(b.stageOrder) || 0));

  // Preparar siguiente etapa en orden sucesivo
  formCategoryStage.value = {
    stageOrder: (selectedCategoryForStages.value.stages.length || 0) + 1,
    name: '',
    competitionTypeId: competitionTypesList.value.length > 0 ? competitionTypesList.value[0].id : '',
    competitionLapId: competitionLapsList.value.length > 0 ? competitionLapsList.value[0].id : '',
    tieBreakerCriterionId: '',
  };
  formCategoryStageCriteria.value = [];
  selectedCriterionToAdd.value = '';
};

const removeCategoryStageRecord = (index: number) => {
  if (!selectedCategoryForStages.value || !selectedCategoryForStages.value.stages) return;
  if (editingCategoryStageIndex.value === index) {
    cancelEditCategoryStage();
  }
  selectedCategoryForStages.value.stages.splice(index, 1);
  toast.info('Etapa eliminada de la categoría');
};

const applyStageTemplateToCategory = (event: any) => {
  const tplId = event?.target?.value;
  if (!tplId || !selectedCategoryForStages.value) return;
  const template = stagesList.value.find((t: any) => t.id === tplId);
  if (!template || !Array.isArray(template.details) || template.details.length === 0) {
    toast.warning('La plantilla seleccionada no tiene etapas configuradas');
    return;
  }
  const stagesToApply = template.details.map((d: any, idx: number) => {
    const rawCriteria = Array.isArray(d.tieBreakerCriteria) && d.tieBreakerCriteria.length > 0
      ? d.tieBreakerCriteria
      : (d.tieBreakerCriterionId ? [{
          criterionId: d.tieBreakerCriterionId,
          id: d.tieBreakerCriterionId,
          description: d.tieBreakerCriterion?.description || getTieBreakerCriterionDescById(d.tieBreakerCriterionId),
          code: d.tieBreakerCriterion?.code || '',
          observation: d.tieBreakerCriterion?.observation || '',
          order: 1,
        }] : []);

    const tieBreakerCriteria = rawCriteria.map((c: any, cIdx: number) => ({
      criterionId: c.criterionId || c.id,
      id: c.id || c.criterionId,
      description: c.description || getTieBreakerCriterionDescById(c.criterionId || c.id),
      code: c.code || '',
      observation: c.observation || '',
      order: Number(c.order) || (cIdx + 1),
    }));

    const tbDesc = tieBreakerCriteria.length > 0
      ? tieBreakerCriteria.map((c) => `#${c.order} ${c.code || c.description}`).join(' → ')
      : (d.tieBreakerCriterion?.description || (d.tieBreakerCriterionId ? getTieBreakerCriterionDescById(d.tieBreakerCriterionId) : null));

    return {
      stageOrder: Number(d.stageOrder) || idx + 1,
      name: d.name,
      competitionTypeId: d.competitionTypeId,
      competitionTypeDescription: d.competitionType?.description || getCompetitionTypeDescById(d.competitionTypeId),
      competitionLapId: d.competitionLapId,
      competitionLapDescription: d.competitionLap?.description || getCompetitionLapDescById(d.competitionLapId),
      tieBreakerCriteria: tieBreakerCriteria,
      tieBreakerCriterionId: tieBreakerCriteria.length > 0 ? tieBreakerCriteria[0].criterionId : null,
      tieBreakerCriterionDescription: tbDesc,
    };
  });
  selectedCategoryForStages.value.stages = stagesToApply;
  formCategoryStage.value.stageOrder = stagesToApply.length + 1;
  cancelEditCategoryStage();
  toast.success(`Se aplicaron ${stagesToApply.length} etapa(s) desde la plantilla "${template.name}"`);
  event.target.value = '';
};

// =========================================================================
// PLANTILLAS DE ETAPAS Y FASES (MAESTRO - DETALLE)
// =========================================================================
const templateStagesDetail = ref<any[]>([]);
const formTemplateStage = ref<any>({
  stageOrder: 1,
  name: '',
  competitionTypeId: '',
  competitionLapId: '',
  tieBreakerCriterionId: '',
});

const addTemplateStageRecord = () => {
  if (!formTemplateStage.value.name || !formTemplateStage.value.name.trim()) {
    toast.error('Debe ingresar el nombre de la etapa o fase');
    return;
  }
  if (!formTemplateStage.value.competitionTypeId) {
    toast.error('Seleccione el tipo principal de competencia');
    return;
  }
  if (!formTemplateStage.value.competitionLapId) {
    toast.error('Seleccione la modalidad de vueltas');
    return;
  }

  templateStagesDetail.value.push({
    _uid: 'stg_' + Math.random().toString(36).substring(2, 9),
    stageOrder: Number(formTemplateStage.value.stageOrder) || (templateStagesDetail.value.length + 1),
    name: formTemplateStage.value.name.trim(),
    competitionTypeId: formTemplateStage.value.competitionTypeId,
    competitionLapId: formTemplateStage.value.competitionLapId,
    tieBreakerCriterionId: formTemplateStage.value.tieBreakerCriterionId || '',
  });

  templateStagesDetail.value.sort((a, b) => (Number(a.stageOrder) || 0) - (Number(b.stageOrder) || 0));
  toast.success('Etapa agregada a la plantilla');

  formTemplateStage.value = {
    stageOrder: templateStagesDetail.value.length + 1,
    name: '',
    competitionTypeId: competitionTypesList.value.length > 0 ? competitionTypesList.value[0].id : '',
    competitionLapId: competitionLapsList.value.length > 0 ? competitionLapsList.value[0].id : '',
    tieBreakerCriterionId: '',
  };
};

const removeTemplateStageRecord = (index: number) => {
  templateStagesDetail.value.splice(index, 1);
  formTemplateStage.value.stageOrder = templateStagesDetail.value.length + 1;
  toast.info('Etapa eliminada de la plantilla');
};

const updatePlayerRegistrationClassifications = async (teamRegId: string) => {
  const prTab = tabs.find((t) => t.id === 'playerRegistrations');
  const classField = prTab?.fields.find((f) => f.key === 'playerClassificationId');
  if (!classField) return;

  if (!teamRegId) {
    classField.options = playerClassificationsList.value.map((pc) => ({
      label: `${pc.description} (${pc.code || 'Clasificación'})`,
      value: pc.id,
    }));
    return;
  }

  const reg = teamRegistrationsList.value.find((r) => r.id === teamRegId);
  if (!reg || !reg.categoryEditionId) {
    classField.options = playerClassificationsList.value.map((pc) => ({
      label: `${pc.description} (${pc.code || 'Clasificación'})`,
      value: pc.id,
    }));
    return;
  }

  const edition = categoryEditionsList.value.find((e) => e.id === reg.categoryEditionId);
  const detail = edition?.categoriesDetail?.[0];

  if (detail?.classifications && detail.classifications.length > 0) {
    try {
      const teamPlayersRes = await CampeonatoApi.playerRegistrations.list({ teamRegistrationId: teamRegId, limit: 100 });
      const teamPlayers = teamPlayersRes.data.data || [];

      classField.options = detail.classifications.map((sc: any) => {
        const pc = sc.playerClassification || playerClassificationsList.value.find((p) => p.id === sc.playerClassificationId);
        const used = teamPlayers.filter((tp: any) => tp.playerClassificationId === sc.playerClassificationId).length;
        const free = Math.max(0, sc.maxPlayers - used);
        const cupoInfo = free <= 0 ? ' [AGOTADO: 0 cupos]' : ` [Quedan ${free} de ${sc.maxPlayers} cupos]`;
        return {
          label: `${pc?.description || 'Clasificación'}${cupoInfo}`,
          value: sc.playerClassificationId,
        };
      });
    } catch {
      classField.options = detail.classifications.map((sc: any) => {
        const pc = sc.playerClassification || playerClassificationsList.value.find((p) => p.id === sc.playerClassificationId);
        return {
          label: `${pc?.description || 'Clasificación'} [Máx. ${sc.maxPlayers} cupos]`,
          value: sc.playerClassificationId,
        };
      });
    }
  } else {
    classField.options = playerClassificationsList.value.map((pc) => ({
      label: `${pc.description} (${pc.code || 'General'})`,
      value: pc.id,
    }));
  }
};

// Estado para Generador de Fixture Automático
const showFixtureModal = ref(false);
const generatingFixture = ref(false);
const formFixture = ref({
  stageId: '',
  scenaryId: '',
  teamIds: [] as string[],
  startDate: new Date().toISOString().slice(0, 16),
  intervalDays: 7,
  matchDurationMinutes: 90,
  numberOfLaps: 1,
});

// Estado para Visor de Carnet Deportivo QR
const showCarnetModal = ref(false);
const selectedCarnet = ref<any>(null);

const populateFieldOptions = () => {
  // Opciones para Jugadores (Demarcación y Clasificación)
  const plTab = tabs.find((t) => t.id === 'players');
  const demField = plTab?.fields.find((f) => f.key === 'demarcationId');
  if (demField) {
    demField.options = demarcationsList.value.map((d) => ({ label: `${d.name} (${d.zone || d.code})`, value: d.id }));
  }
  const plClassField = plTab?.fields.find((f) => f.key === 'playerClassificationId');
  if (plClassField) {
    plClassField.options = playerClassificationsList.value.map((pc) => ({
      label: `${pc.description} ${pc.code ? '(' + pc.code + ')' : ''}`,
      value: pc.id,
    }));
  }

  // Opciones para Etapas (Edición y Categoría)
  const stTab = tabs.find((t) => t.id === 'stages');
  const stEdField = stTab?.fields.find((f) => f.key === 'categoryEditionId');
  if (stEdField) {
    stEdField.options = categoryEditionsList.value.map((e) => ({
      label: `${e.name} - ${e.category?.name || 'Categoría'}`,
      value: e.id,
    }));
  }
  const stCatField = stTab?.fields.find((f) => f.key === 'categoryId');
  if (stCatField) {
    stCatField.options = categoriesList.value.map((c) => ({
      label: `${c.name}${c.acronyms ? ' (' + c.acronyms + ')' : ''}`,
      value: c.id,
    }));
  }
  const stFmtField = stTab?.fields.find((f) => f.key === 'stageFormatId');
  if (stFmtField) {
    stFmtField.options = stageFormatsList.value.map((fmt) => ({
      label: `${fmt.name} (${fmt.code || 'FMT'})`,
      value: fmt.id,
    }));
  }

  // Opciones para Inscripción de Equipos (Equipos y Ediciones)
  const trTab = tabs.find((t) => t.id === 'teamRegistrations');
  const tmField = trTab?.fields.find((f) => f.key === 'teamId');
  if (tmField) {
    tmField.options = teamsList.value.map((t) => ({ label: `${t.name} (${t.acronyms || t.shortName || 'Club'})`, value: t.id }));
  }
  const edField = trTab?.fields.find((f) => f.key === 'categoryEditionId');
  if (edField) {
    edField.options = categoryEditionsList.value.map((e) => ({ label: `${e.name} - ${e.category?.name || 'Categoría'}`, value: e.id }));
  }

  // Opciones para Inscripción y Carnets (Inscripción de equipo, Jugadores y Clasificación base)
  const prTab = tabs.find((t) => t.id === 'playerRegistrations');
  const regField = prTab?.fields.find((f) => f.key === 'teamRegistrationId');
  if (regField) {
    regField.options = teamRegistrationsList.value.map((r) => ({
      label: `${r.team?.name || 'Equipo'} - ${r.categoryEdition?.name || 'Edición'}`,
      value: r.id,
    }));
  }
  const prClassField = prTab?.fields.find((f) => f.key === 'playerClassificationId');
  if (prClassField) {
    prClassField.options = playerClassificationsList.value.map((pc) => ({
      label: `${pc.description} ${pc.code ? '(' + pc.code + ')' : ''}`,
      value: pc.id,
    }));
  }
  const playerField = prTab?.fields.find((f) => f.key === 'playerId');
  if (playerField) {
    playerField.options = playersList.value.map((p) => {
      const dem = p.demarcation?.name || demarcationsList.value.find((d) => d.id === p.demarcationId)?.name;
      const demLimit = p.demarcation?.maxPlayers ?? demarcationsList.value.find((d) => d.id === p.demarcationId)?.maxPlayers;
      const limitTxt = demLimit && Number(demLimit) > 0 ? ` · Máx. ${demLimit}` : '';
      const demLabel = dem ? ` [${dem}${limitTxt}]` : '';
      return {
        label: `${p.name} ${p.lastName} (${p.identification || 'Sin DNI'})${demLabel}`,
        value: p.id,
      };
    });
  }

  // Opciones para Transferencias de Jugadores
  const ptTab = tabs.find((t) => t.id === 'playerTransfers');
  if (ptTab) {
    const ptEdField = ptTab.fields.find((f) => f.key === 'edition_id');
    if (ptEdField) {
      ptEdField.options = categoryEditionsList.value.map((e) => ({
        label: `${e.name} - ${e.category?.name || 'Categoría'}`,
        value: e.id,
      }));
    }
    const ptPlField = ptTab.fields.find((f) => f.key === 'player_id');
    if (ptPlField) {
      ptPlField.options = playersList.value.map((p) => ({
        label: `${p.name} ${p.lastName} (${p.identification || p.code || 'ID'})`,
        value: p.id,
      }));
    }
    const ptDestField = ptTab.fields.find((f) => f.key === 'destination_team_id');
    if (ptDestField) {
      ptDestField.options = teamsList.value.map((t) => ({
        label: `${t.name} (${t.acronyms || t.shortName || 'Club'})`,
        value: t.id,
      }));
    }
    const ptStField = ptTab.fields.find((f) => f.key === 'stage_id');
    if (ptStField) {
      ptStField.options = stagesList.value.map((s) => ({
        label: s.name,
        value: s.id,
      }));
    }
  }

  // Opciones para Árbitros (Gremios Arbitrales)
  const rfTab = tabs.find((t) => t.id === 'referees');
  if (rfTab) {
    const gField = rfTab.fields.find((f) => f.key === 'guildId');
    if (gField) {
      gField.options = refereeGuildsList.value.map((g) => ({
        label: `${g.description}${g.acronyms ? ' (' + g.acronyms + ')' : ''}`,
        value: g.id,
      }));
    }
  }
};

const loadAuxiliaryTournamentData = async () => {
  try {
    const [stRes, tmRes, scRes, dmRes, plRes, edRes, trRes, pcRes, catRes, rgRes, fmtRes, ctRes, clRes, tbRes] = await Promise.all([
      CampeonatoApi.stages.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teams.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.scenaries.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.demarcations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.players.list({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categoryEditions.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teamRegistrations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.playerClassifications.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categories.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.refereeGuilds.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.stageFormats.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.competitionTypes.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.competitionLaps.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.tieBreakerCriteria.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
    ]);
    stagesList.value = stRes.data.data || [];
    teamsList.value = tmRes.data.data || [];
    scenariesList.value = scRes.data.data || [];
    demarcationsList.value = dmRes.data.data || [];
    playersList.value = plRes.data.data || [];
    categoryEditionsList.value = edRes.data.data || [];
    teamRegistrationsList.value = trRes.data.data || [];
    playerClassificationsList.value = pcRes.data.data || [];
    categoriesList.value = catRes.data.data || [];
    refereeGuildsList.value = rgRes.data.data || [];
    stageFormatsList.value = fmtRes.data.data || [];
    competitionTypesList.value = ctRes.data.data || [];
    competitionLapsList.value = clRes.data.data || [];
    tieBreakerCriteriaList.value = tbRes.data.data || [];
    populateFieldOptions();
  } catch (err) {
    console.error('Error cargando datos auxiliares de campeonato:', err);
  }
};

const getActiveCompanyId = (): number => {
  try {
    const raw = localStorage.getItem('selectedCompany');
    if (raw) {
      const parsed = JSON.parse(raw);
      const id = Number(parsed?.id || parsed?.companyId);
      if (!isNaN(id) && id > 0) return id;
    }
  } catch {}
  return authStore.tokenPayload?.company_id || 1;
};

const compressImageFile = (file: File, maxDim = 400, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const onTeamLogoSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadingImage.value = true;
  try {
    const base64Preview = await compressImageFile(file, 400, 0.9);
    formData.value.logo = base64Preview;

    try {
      const companyId = getActiveCompanyId();
      const uploadedUrl = await uploadTeamLogo(file, companyId);
      if (uploadedUrl) {
        formData.value.logo = uploadedUrl;
      }
    } catch (storageErr) {
      console.warn('Storage local/offline, guardado como imagen base64:', storageErr);
    }
    toast.success('Escudo del equipo cargado correctamente');
  } catch (err) {
    console.error('Error al procesar escudo del equipo:', err);
    toast.error('No se pudo procesar la imagen del escudo');
  } finally {
    uploadingImage.value = false;
    input.value = '';
  }
};

const onPlayerPhotoSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadingImage.value = true;
  try {
    const base64Preview = await compressImageFile(file, 400, 0.85);
    formData.value.photo = base64Preview;

    try {
      const companyId = getActiveCompanyId();
      const uploadedUrl = await uploadPlayerPhoto(file, companyId);
      if (uploadedUrl) {
        formData.value.photo = uploadedUrl;
      }
    } catch (storageErr) {
      console.warn('Storage local/offline, guardado como imagen base64:', storageErr);
    }
    toast.success('Foto del jugador cargada correctamente');
  } catch (err) {
    console.error('Error al procesar foto del jugador:', err);
    toast.error('No se pudo procesar la foto del jugador');
  } finally {
    uploadingImage.value = false;
    input.value = '';
  }
};

const handleUploadTeamLogo = async (file: File): Promise<string> => {
  const companyId = getActiveCompanyId();
  try {
    const url = await uploadTeamLogo(file, companyId);
    toast.success('Escudo optimizado y subido correctamente');
    return url;
  } catch (err) {
    console.warn('Error al subir a storage, usando fallback local:', err);
    toast.info('Escudo optimizado y preparado');
    return URL.createObjectURL(file);
  }
};

const handleUploadPlayerPhoto = async (file: File): Promise<string> => {
  const companyId = getActiveCompanyId();
  try {
    const url = await uploadPlayerPhoto(file, companyId);
    toast.success('Foto oficial del jugador subida correctamente');
    return url;
  } catch (err) {
    console.warn('Error al subir a storage, usando fallback local:', err);
    toast.info('Foto optimizada y preparada');
    return URL.createObjectURL(file);
  }
};

const inscribeTeamToTorneo = async (team: any) => {
  selectTab('teamRegistrations');
  await loadAuxiliaryTournamentData();
  openCreateForm();
  formData.value.teamId = team.id;
  toast.info(`Inscribiendo a ${team.name} en una edición del torneo`);
};

const viewTeamPlayers = (team: any) => {
  selectTab('playerRegistrations');
  searchQuery.value = team.name || team.shortName || '';
  loadData();
  toast.info(`Listando jugadores y carnets de ${team.name}`);
};

const loadStandings = async () => {
  try {
    loadingStandings.value = true;
    const res = await CampeonatoApi.matches.getStandings(selectedStageId.value || undefined);
    standingsList.value = res.data.standings || [];
    topScorersList.value = res.data.topScorers || [];
  } catch (err: any) {
    console.error(err);
    toast.error('Error al calcular tabla de posiciones');
  } finally {
    loadingStandings.value = false;
  }
};

const openFixtureModal = async () => {
  await loadAuxiliaryTournamentData();
  formFixture.value.teamIds = teamsList.value.map((t) => t.id);
  if (stagesList.value.length > 0 && !formFixture.value.stageId) {
    formFixture.value.stageId = stagesList.value[0].id;
  }
  showFixtureModal.value = true;
};

const selectAllTeams = () => {
  if (formFixture.value.teamIds.length === teamsList.value.length) {
    formFixture.value.teamIds = [];
  } else {
    formFixture.value.teamIds = teamsList.value.map((t) => t.id);
  }
};

const generateFixture = async () => {
  try {
    generatingFixture.value = true;
    const res = await CampeonatoApi.matches.generateFixture({
      stageId: formFixture.value.stageId,
      teamIds: formFixture.value.teamIds,
      scenaryId: formFixture.value.scenaryId || undefined,
      startDate: formFixture.value.startDate,
      intervalDays: formFixture.value.intervalDays,
      matchDurationMinutes: formFixture.value.matchDurationMinutes,
      numberOfLaps: formFixture.value.numberOfLaps,
    });
    toast.success(res.data.message || 'Fixture generado con éxito');
    showFixtureModal.value = false;
    loadData();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Error al generar el fixture');
  } finally {
    generatingFixture.value = false;
  }
};

const openCarnetModal = (item: any) => {
  selectedCarnet.value = {
    ...item,
    player: item.player || {
      name: item.playerName || item.name,
      lastName: item.playerLastName || item.lastName || '',
      identification: item.identification || item.playerIdentification,
      photo: item.photo || item.playerPhoto,
      jerseyNumber: item.jerseyNumber,
      demarcation: item.demarcation || { name: 'Deportista' },
    },
    team: item.teamRegistration?.team || item.team || {
      name: item.teamName || 'Equipo',
      logo: item.teamLogo,
    },
    carnetNumber: item.carnetCode || item.carnetNumber || item.id?.substring(0, 8).toUpperCase(),
    dorsalNumber: item.jerseyNumber || item.player?.jerseyNumber || 'S/N',
  };
  showCarnetModal.value = true;
};

const printCarnet = () => {
  window.print();
};

// Utilidades de color y hexadecimal
const isValidHex = (hex?: string) => {
  return typeof hex === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
};

const getContrastColor = (hexColor?: string) => {
  if (!isValidHex(hexColor)) return '#333333';
  let hex = hexColor!.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

// ==========================================
// FUNCIONES REMOTAS PARA SELECT2
// ==========================================
const fetchCategoriesOptions = async (query: string) => {
  try {
    const res = await CampeonatoApi.categories.list({ search: query, limit: 30 });
    const items = res.data.data || [];
    return items.map((cat: any) => ({
      value: cat.id,
      label: `${cat.name} (${cat.gender === 'MALE' ? 'Masculino' : cat.gender === 'FEMALE' ? 'Femenino' : 'Mixto'} · Código: ${cat.code || 'S/C'})`,
    }));
  } catch (err) {
    console.error('Error buscando categorías:', err);
    return [];
  }
};

const fetchTeamsOptions = async (query: string) => {
  try {
    const res = await CampeonatoApi.teams.list({ search: query, limit: 30 });
    const items = res.data.data || [];
    return items.map((t: any) => ({
      value: t.id,
      label: `${t.name} (${t.acronyms || t.shortName || 'Club'}${t.city ? ' - ' + t.city : ''})`,
    }));
  } catch (err) {
    console.error('Error buscando equipos:', err);
    return [];
  }
};

// ==========================================
// MÓDULO DE INSCRIPCIONES, PLANTILLAS Y TRANSFERENCIAS
// ==========================================
const isMassRegistrationOpen = ref(false);
const isTeamRosterOpen = ref(false);
const selectedTeamRegIdForRoster = ref<string | null>(null);

const isSportsHistoryOpen = ref(false);
const selectedPlayerIdForHistory = ref<string | null>(null);

const isTransferConfigOpen = ref(false);
const selectedEditionForConfig = ref<any>(null);

const isTransferDetailOpen = ref(false);
const selectedTransferForDetail = ref<any>(null);

const detectedOriginRegistration = ref<any>(null);
const checkingOriginRegistration = ref(false);

const openMassRegistrationModal = () => {
  isMassRegistrationOpen.value = true;
};

const openGeneralRosterModal = () => {
  if (teamRegistrationsList.value.length > 0) {
    selectedTeamRegIdForRoster.value = teamRegistrationsList.value[0].id;
  }
  isTeamRosterOpen.value = true;
};

const openRosterForTeamReg = (teamRegId: string) => {
  selectedTeamRegIdForRoster.value = teamRegId;
  isTeamRosterOpen.value = true;
};

const openSportsHistory = (playerId: string) => {
  if (!playerId) return;
  selectedPlayerIdForHistory.value = playerId;
  isSportsHistoryOpen.value = true;
};

const openTransferConfig = (edition: any) => {
  selectedEditionForConfig.value = edition;
  isTransferConfigOpen.value = true;
};

const openTransferDetail = (transfer: any) => {
  selectedTransferForDetail.value = transfer;
  isTransferDetailOpen.value = true;
};

const onTransferUpdated = () => {
  loadData();
  if (selectedTransferForDetail.value?.id) {
    CampeonatoApi.playerTransfers.get(selectedTransferForDetail.value.id).then((res: any) => {
      selectedTransferForDetail.value = res.data;
    }).catch(() => {});
  }
};

const checkPlayerCurrentRegistration = async () => {
  if (activeTab.value !== 'playerTransfers') return;
  const pId = formData.value.player_id;
  const eId = formData.value.edition_id;
  if (!pId || !eId) {
    detectedOriginRegistration.value = null;
    return;
  }
  checkingOriginRegistration.value = true;
  try {
    const listRes = await CampeonatoApi.playerRegistrations.list({
      limit: 100,
      playerId: pId,
    });
    const regs = listRes.data?.data || [];
    const activeReg = regs.find((r: any) => {
      const rEditionId = r.teamRegistration?.categoryEditionId || r.categoryEditionId;
      return (
        String(rEditionId) === String(eId) &&
        (r.status === 'ELIGIBLE' || r.status === 'IN_REVIEW' || r.status === 'PENDING_APPROVAL')
      );
    });
    detectedOriginRegistration.value = activeReg || null;
  } catch (e) {
    console.error('Error detectando inscripción previa:', e);
    detectedOriginRegistration.value = null;
  } finally {
    checkingOriginRegistration.value = false;
  }
};

watch(() => [formData.value.player_id, formData.value.edition_id], () => {
  if (activeTab.value === 'playerTransfers' && isFormOpen.value) {
    checkPlayerCurrentRegistration();
  }
});

// ==========================================
// HISTORIAL DE CATEGORÍAS DE EQUIPOS
// ==========================================
const showTeamCategoryModal = ref(false);
const selectedTeamForHistory = ref<any>(null);
const teamCategoryHistoryList = ref<any[]>([]);
const loadingTeamCategoryHistory = ref(false);
const savingTeamCategoryHistory = ref(false);
const formTeamCategory = ref({
  categoryId: '',
  seasonYear: new Date().getFullYear(),
  status: 'ACTIVE',
  assignedDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

const openTeamCategoryHistory = (team: any) => {
  selectedTeamForHistory.value = team;
  formTeamCategory.value = {
    categoryId: team.currentCategoryId || '',
    seasonYear: team.currentSeasonYear || new Date().getFullYear(),
    status: 'ACTIVE',
    assignedDate: new Date().toISOString().slice(0, 10),
    notes: '',
  };
  showTeamCategoryModal.value = true;
  loadTeamCategoryHistory(team.id);
};

const loadTeamCategoryHistory = async (teamId: string) => {
  try {
    loadingTeamCategoryHistory.value = true;
    const res = await CampeonatoApi.teamCategoryHistory.listByTeam(teamId);
    teamCategoryHistoryList.value = res.data || [];
  } catch (err) {
    console.error('Error al cargar historial de categorías:', err);
    toast.error('No se pudo cargar el historial de categorías del equipo');
  } finally {
    loadingTeamCategoryHistory.value = false;
  }
};

const saveTeamCategoryRecord = async () => {
  if (!formTeamCategory.value.categoryId) {
    toast.warning('Por favor seleccione una categoría');
    return;
  }
  if (!formTeamCategory.value.seasonYear) {
    toast.warning('Ingrese el año o temporada de competencia');
    return;
  }
  try {
    savingTeamCategoryHistory.value = true;
    await CampeonatoApi.teamCategoryHistory.create({
      teamId: selectedTeamForHistory.value.id,
      ...formTeamCategory.value,
    });
    toast.success('Categoría asignada y registrada en el historial');
    formTeamCategory.value.notes = '';
    await loadTeamCategoryHistory(selectedTeamForHistory.value.id);
    loadData();
  } catch (err: any) {
    console.error('Error al guardar historial de categoría:', err);
    toast.error(err?.response?.data?.message || 'Error al guardar registro en el historial');
  } finally {
    savingTeamCategoryHistory.value = false;
  }
};

const deleteTeamCategoryRecord = async (id: string) => {
  if (!confirm('¿Deseas eliminar este registro del historial de categorías?')) return;
  try {
    await CampeonatoApi.teamCategoryHistory.delete(id);
    toast.success('Registro de historial eliminado');
    if (selectedTeamForHistory.value?.id) {
      loadTeamCategoryHistory(selectedTeamForHistory.value.id);
    }
  } catch (err) {
    console.error(err);
    toast.error('Error al eliminar el registro del historial');
  }
};

// ==========================================
// TRANSFERENCIAS DE JUGADORES E HISTORIAL
// ==========================================
const showTransferModal = ref(false);
const selectedPlayerForTransfer = ref<any>(null);
const savingTransfer = ref(false);
const formTransfer = ref({
  destinationTeamId: '',
  seasonYear: new Date().getFullYear(),
  transferType: 'DEFINITIVE',
  passOwnerType: 'PLAYER',
  passOwnerTeamId: '',
  transferFee: 0,
  transferDate: new Date().toISOString().slice(0, 10),
  observations: '',
});

const showPlayerTransfersModal = ref(false);
const selectedPlayerForTransfersHistory = ref<any>(null);
const playerTransfersList = ref<any[]>([]);
const loadingPlayerTransfers = ref(false);

const openTransferModal = (player: any) => {
  selectedPlayerForTransfer.value = player;
  formTransfer.value = {
    destinationTeamId: '',
    seasonYear: new Date().getFullYear(),
    transferType: 'DEFINITIVE',
    passOwnerType: player.passOwnerType || 'PLAYER',
    passOwnerTeamId: player.passOwnerTeamId || '',
    transferFee: 0,
    transferDate: new Date().toISOString().slice(0, 10),
    observations: '',
  };
  showTransferModal.value = true;
};

const processTransfer = async () => {
  if (!formTransfer.value.destinationTeamId) {
    toast.warning('Debe seleccionar el club de destino para transferir al jugador');
    return;
  }
  try {
    savingTransfer.value = true;
    const originTeamId = selectedPlayerForTransfer.value.currentTeamId || null;
    await CampeonatoApi.playerTransfers.create({
      playerId: selectedPlayerForTransfer.value.id,
      originTeamId,
      ...formTransfer.value,
    });
    toast.success('Transferencia del jugador registrada con éxito');
    showTransferModal.value = false;
    loadData();
  } catch (err: any) {
    console.error('Error al procesar transferencia:', err);
    toast.error(err?.response?.data?.message || 'Error al procesar transferencia');
  } finally {
    savingTransfer.value = false;
  }
};

const openPlayerTransfersModal = (player: any) => {
  selectedPlayerForTransfersHistory.value = player;
  showPlayerTransfersModal.value = true;
  loadPlayerTransfersHistory(player.id);
};

const loadPlayerTransfersHistory = async (playerId: string) => {
  try {
    loadingPlayerTransfers.value = true;
    const res = await CampeonatoApi.playerTransfers.listByPlayer(playerId);
    playerTransfersList.value = res.data || [];
  } catch (err) {
    console.error('Error cargando historial de transferencias:', err);
    toast.error('No se pudo cargar el historial de transferencias del jugador');
  } finally {
    loadingPlayerTransfers.value = false;
  }
};

const deletePlayerTransferRecord = async (id: string) => {
  if (!confirm('¿Deseas eliminar este registro del historial de transferencias?')) return;
  try {
    await CampeonatoApi.playerTransfers.delete(id);
    toast.success('Registro de transferencia eliminado');
    if (selectedPlayerForTransfersHistory.value?.id) {
      loadPlayerTransfersHistory(selectedPlayerForTransfersHistory.value.id);
    }
  } catch (err) {
    console.error(err);
    toast.error('Error al eliminar registro de transferencia');
  }
};

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
    items.value = [];
    if (activeTab.value === 'standings') {
      await Promise.all([loadAuxiliaryTournamentData(), loadStandings()]);
      return;
    }
    if (activeTab.value === 'matches' || activeTab.value === 'playerRegistrations' || activeTab.value === 'playerTransfers') {
      loadAuxiliaryTournamentData();
    }
    if (!currentTabConfig.value?.api) {
      return;
    }
    const res = await currentTabConfig.value.api.list({
      page: page.value,
      limit: limit.value,
      search: searchQuery.value,
    });
    items.value = res.data?.data || [];
    total.value = res.data?.total || 0;
    totalPages.value = res.data?.totalPages || 1;
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

function formatCoordinateToCardinal(lat: number, lng: number): string {
  const formatDMS = (coord: number, isLat: boolean) => {
    const dir = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'O');
    const absCoord = Math.abs(coord);
    const degrees = Math.floor(absCoord);
    const minutesNotTruncated = (absCoord - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    return `${degrees}° ${minutes}' ${seconds}" ${dir}`;
  };
  return `${formatDMS(lat, true)}, ${formatDMS(lng, false)}`;
}

let scenaryMapInstance: any = null;
let scenaryMarkerInstance: any = null;
const mapSearchQuery = ref('');

const loadLeaflet = async (): Promise<any> => {
  if ((window as any).L) return (window as any).L;
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error('No se pudo cargar el mapa Leaflet'));
    document.head.appendChild(script);
  });
};

const setMapLocation = async (lat: number, lng: number, L?: any) => {
  const Leaflet = L || (window as any).L;
  formData.value.latitude = lat.toFixed(6);
  formData.value.longitude = lng.toFixed(6);
  formData.value.cardinalPoints = formatCoordinateToCardinal(lat, lng);
  formData.value.googleMapsUrl = `https://www.google.com/maps?q=${formData.value.latitude},${formData.value.longitude}`;

  if (scenaryMapInstance && Leaflet) {
    if (scenaryMarkerInstance) {
      scenaryMarkerInstance.setLatLng([lat, lng]);
    } else {
      scenaryMarkerInstance = Leaflet.marker([lat, lng]).addTo(scenaryMapInstance);
    }
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data && data.address) {
      const road = data.address.road || data.address.street || data.address.suburb || data.address.neighbourhood || '';
      const district = data.address.city_district || data.address.village || data.address.town || data.address.city || '';
      const parts = [road, district].filter(Boolean);
      const streetName = parts.length > 0 ? parts.join(', ') : (data.display_name ? data.display_name.split(',')[0] : '');
      if (streetName) {
        formData.value.address = streetName;
      }
    }
  } catch (geoErr) {
    console.warn('Geocodificación inversa no disponible:', geoErr);
  }

  formData.value.location = formData.value.address
    ? `${formData.value.address} (${formData.value.cardinalPoints})`
    : `Coordenadas: ${formData.value.cardinalPoints}`;

  if (scenaryMarkerInstance) {
    scenaryMarkerInstance.bindPopup(`<b>${formData.value.name || 'Cancha'}</b><br/>${formData.value.location}`).openPopup();
  }
};

const initScenaryMap = async () => {
  try {
    const L = await loadLeaflet();
    const mapContainer = document.getElementById('scenary-map-container');
    if (!mapContainer) return;

    if (scenaryMapInstance) {
      scenaryMapInstance.remove();
      scenaryMapInstance = null;
      scenaryMarkerInstance = null;
    }

    const defaultLat = Number(formData.value.latitude) || -0.057045;
    const defaultLng = Number(formData.value.longitude) || -78.209045;
    const initialZoom = formData.value.latitude ? 16 : 14;

    scenaryMapInstance = L.map('scenary-map-container').setView([defaultLat, defaultLng], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(scenaryMapInstance);

    if (formData.value.latitude && formData.value.longitude) {
      scenaryMarkerInstance = L.marker([defaultLat, defaultLng]).addTo(scenaryMapInstance);
      if (formData.value.address) {
        scenaryMarkerInstance.bindPopup(formData.value.address).openPopup();
      }
    }

    scenaryMapInstance.on('click', (e: any) => {
      setMapLocation(e.latlng.lat, e.latlng.lng, L);
    });

    setTimeout(() => {
      scenaryMapInstance?.invalidateSize();
    }, 300);
  } catch (err) {
    console.error('Error al inicializar mapa:', err);
  }
};

const searchLocationOnMap = async () => {
  if (!mapSearchQuery.value.trim()) return;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(mapSearchQuery.value.trim())}`);
    const data = await res.json();
    if (data && data.length > 0) {
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      if (scenaryMapInstance) {
        scenaryMapInstance.setView([lat, lng], 16);
      }
      setMapLocation(lat, lng);
    } else {
      toast.info('No se encontraron resultados para esa búsqueda');
    }
  } catch {
    toast.error('Error al buscar ubicación en el mapa');
  }
};

const toggleScenarySelection = (id: string) => {
  if (!formData.value.availableScenaryIds) {
    formData.value.availableScenaryIds = [];
  }
  const idx = formData.value.availableScenaryIds.indexOf(id);
  if (idx >= 0) {
    formData.value.availableScenaryIds.splice(idx, 1);
  } else {
    formData.value.availableScenaryIds.push(id);
  }
};

const openCreateForm = () => {
  if (activeTab.value === 'schedules') {
    openCreateSchedule();
    return;
  }
  isEditing.value = false;
  editingId.value = null;
  formData.value = {};
  if (activeTab.value === 'categoryEditions') {
    formData.value = {
      status: 'IN_PROGRESS',
      identifyByPlayerCode: false,
      matchDurationMinutes: 60,
      breakDurationMinutes: 10,
      waitBetweenMatchesMinutes: 10,
      availableScenaryIds: scenariesList.value.map((s) => s.id),
      categoriesDetail: [],
    };
    editionCategoriesDetail.value = [
      {
        _uid: 'cat_' + Date.now(),
        categoryId: '',
        categoryDescription: '',
        categoryAcronyms: '',
        startDate: '',
        endDate: '',
        registrationFee: 0,
        maxPlayers: 25,
        matchDurationMinutes: 60,
        breakDurationMinutes: 10,
        waitBetweenMatchesMinutes: 10,
        classifications: [],
        stages: [],
      },
    ];
    expandedCategoryRows.value = new Set([0]);
  } else if (activeTab.value === 'categories') {
    formData.value = {};
  } else if (activeTab.value === 'players') {
    formData.value = {
      isActive: true,
      passOwnerType: 'PLAYER',
    };
    globalPlayerFound.value = false;
    globalPlayerSearched.value = false;
  } else if (activeTab.value === 'referees') {
    formData.value = {
      isActive: true,
    };
    globalRefereeFound.value = false;
    globalRefereeSearched.value = false;
  } else if (activeTab.value === 'scenaries') {
    formData.value = {
      name: '',
      surfaceType: 'SYNTHETIC',
      isActive: true,
      address: '',
      cardinalPoints: '',
      latitude: '-0.057045',
      longitude: '-78.209045',
      location: '',
      googleMapsUrl: '',
    };
    nextTick(() => initScenaryMap());
  } else if (activeTab.value === 'playerClassifications') {
    formData.value = { isActive: true };
  } else if (activeTab.value === 'teams') {
    formData.value = { isActive: true };
  } else if (activeTab.value === 'vocals') {
    formData.value = { isActive: true };
  } else if (activeTab.value === 'playerTransfers') {
    formData.value = {
      edition_id: categoryEditionsList.value.length > 0 ? categoryEditionsList.value[0].id : '',
      player_id: '',
      destination_team_id: '',
      stage_id: '',
      reason: '',
    };
  } else if (activeTab.value === 'stages') {
    formData.value = {
      name: '',
      description: '',
      isActive: true,
    };
    templateStagesDetail.value = [];
    formTemplateStage.value = {
      stageOrder: 1,
      name: '',
      competitionTypeId: competitionTypesList.value.length > 0 ? competitionTypesList.value[0].id : '',
      competitionLapId: competitionLapsList.value.length > 0 ? competitionLapsList.value[0].id : '',
      tieBreakerCriterionId: '',
    };
  }
  isFormOpen.value = true;
  showModal.value = true;
  loadAuxiliaryTournamentData();
};

const openEditForm = (item: any) => {
  if (activeTab.value === 'schedules') {
    openEditSchedule(item);
    return;
  }
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  if (activeTab.value === 'categoryEditions') {
    formData.value.status = formData.value.status || 'IN_PROGRESS';
    formData.value.identifyByPlayerCode = item.identifyByPlayerCode === true;
    formData.value.matchDurationMinutes = Number(item.matchDurationMinutes) || 60;
    formData.value.breakDurationMinutes = Number(item.breakDurationMinutes) || 10;
    formData.value.waitBetweenMatchesMinutes = Number(item.waitBetweenMatchesMinutes) || 10;
    formData.value.availableScenaryIds = Array.isArray(item.availableScenaryIds) ? item.availableScenaryIds : [];
    editionCategoriesDetail.value = item.categoriesDetail
      ? JSON.parse(JSON.stringify(item.categoriesDetail)).map((det: any) => ({
          ...det,
          _uid: det._uid || ('cat_' + Math.random().toString(36).substring(2, 9)),
          matchDurationMinutes: det.matchDurationMinutes !== undefined && det.matchDurationMinutes !== null ? Number(det.matchDurationMinutes) : (Number(item.matchDurationMinutes) || 60),
          breakDurationMinutes: det.breakDurationMinutes !== undefined && det.breakDurationMinutes !== null ? Number(det.breakDurationMinutes) : (Number(item.breakDurationMinutes) || 10),
          waitBetweenMatchesMinutes: det.waitBetweenMatchesMinutes !== undefined && det.waitBetweenMatchesMinutes !== null ? Number(det.waitBetweenMatchesMinutes) : (Number(item.waitBetweenMatchesMinutes) || 10),
          classifications: Array.isArray(det.classifications) ? det.classifications : [],
          stages: (Array.isArray(det.stages) ? det.stages : []).map((stg: any, sIdx: number) => {
            const rawCriteria = Array.isArray(stg.tieBreakerCriteria) && stg.tieBreakerCriteria.length > 0
              ? stg.tieBreakerCriteria
              : (stg.tieBreakerCriterionId ? [{
                  criterionId: stg.tieBreakerCriterionId,
                  id: stg.tieBreakerCriterionId,
                  description: stg.tieBreakerCriterionDescription || getTieBreakerCriterionDescById(stg.tieBreakerCriterionId),
                  code: '',
                  observation: '',
                  order: 1,
                }] : []);
            return {
              ...stg,
              stageOrder: Number(stg.stageOrder) || (sIdx + 1),
              tieBreakerCriteria: rawCriteria.map((c: any, cIdx: number) => ({
                criterionId: c.criterionId || c.id,
                id: c.id || c.criterionId,
                description: c.description || getTieBreakerCriterionDescById(c.criterionId || c.id),
                code: c.code || '',
                observation: c.observation || '',
                order: Number(c.order) || (cIdx + 1),
              })),
            };
          }),
        }))
      : [];
    expandedCategoryRows.value = new Set([0]);
  } else if (activeTab.value === 'categories') {
    // Mantener los datos del item para edición
  } else if (activeTab.value === 'players') {
    if (item.birthDate) {
      const calculated = calculatePlayerAgeDirect(item.birthDate);
      if (calculated) {
        formData.value.ageYears = item.ageYears ?? calculated.years;
        formData.value.ageMonths = item.ageMonths ?? calculated.months;
      }
    }
  } else if (activeTab.value === 'scenaries') {
    nextTick(() => initScenaryMap());
  } else if (activeTab.value === 'stages') {
    formData.value = {
      name: item.name || '',
      description: item.description || '',
      isActive: item.isActive !== false,
    };
    templateStagesDetail.value = Array.isArray(item.details)
      ? JSON.parse(JSON.stringify(item.details)).map((d: any, idx: number) => ({
          ...d,
          _uid: d.id || ('stg_' + Math.random().toString(36).substring(2, 9)),
          stageOrder: Number(d.stageOrder) || idx + 1,
          name: d.name,
          competitionTypeId: d.competitionTypeId || d.competitionType?.id || '',
          competitionLapId: d.competitionLapId || d.competitionLap?.id || '',
          tieBreakerCriterionId: d.tieBreakerCriterionId || d.tieBreakerCriterion?.id || '',
        }))
      : [];
    formTemplateStage.value = {
      stageOrder: templateStagesDetail.value.length + 1,
      name: '',
      competitionTypeId: competitionTypesList.value.length > 0 ? competitionTypesList.value[0].id : '',
      competitionLapId: competitionLapsList.value.length > 0 ? competitionLapsList.value[0].id : '',
      tieBreakerCriterionId: '',
    };
  }
  isFormOpen.value = true;
  showModal.value = true;
  loadAuxiliaryTournamentData();
  if (activeTab.value === 'playerRegistrations' && item.teamRegistrationId) {
    updatePlayerRegistrationClassifications(item.teamRegistrationId);
  }
};

const closeForm = () => {
  isFormOpen.value = false;
  showModal.value = false;
  formData.value = {};
  globalPlayerFound.value = false;
  globalPlayerSearched.value = false;
  globalRefereeFound.value = false;
  globalRefereeSearched.value = false;
  detectedOriginRegistration.value = null;
  isEditing.value = false;
  editingId.value = null;
  editionCategoriesDetail.value = [];
  expandedCategoryRows.value = new Set();
  templateStagesDetail.value = [];
  if (scenaryMapInstance) {
    scenaryMapInstance.remove();
    scenaryMapInstance = null;
    scenaryMarkerInstance = null;
  }
};

const openCreateModal = openCreateForm;
const openEditModal = openEditForm;
const closeModal = closeForm;

const saveForm = async () => {
  try {
    saving.value = true;
    if (activeTab.value === 'categoryEditions') {
      if (editionCategoriesDetail.value.length === 0) {
        toast.warning('Debe agregar al menos una categoría al detalle del torneo');
        saving.value = false;
        return;
      }
      for (let i = 0; i < editionCategoriesDetail.value.length; i++) {
        const d = editionCategoriesDetail.value[i];
        if (!d || !d.categoryId) {
          toast.error(`Seleccione la categoría en la fila #${i + 1}`);
          saving.value = false;
          return;
        }
      }
      const catIds = editionCategoriesDetail.value.map((d) => d.categoryId);
      const hasDuplicates = catIds.some((id, idx) => catIds.indexOf(id) !== idx);
      if (hasDuplicates) {
        toast.error('No se permite repetir la misma categoría en una edición de torneo.');
        saving.value = false;
        return;
      }
      for (const d of editionCategoriesDetail.value) {
        const maxL = Number(d.maxPlayers) > 0 ? Number(d.maxPlayers) : 25;
        const sumC = (d.classifications || []).reduce((acc: number, c: any) => acc + (Number(c.maxPlayers) || 0), 0);
        if (sumC > maxL) {
          toast.error(`La suma de las clasificaciones (${sumC}) para "${d.categoryDescription || 'Categoría'}" supera el máximo de jugadores (${maxL}).`);
          saving.value = false;
          return;
        }
      }
      formData.value.status = 'IN_PROGRESS';
      formData.value.identifyByPlayerCode = Boolean(formData.value.identifyByPlayerCode);
      formData.value.matchDurationMinutes = Number(formData.value.matchDurationMinutes) || 60;
      formData.value.breakDurationMinutes = Number(formData.value.breakDurationMinutes) || 10;
      formData.value.waitBetweenMatchesMinutes = Number(formData.value.waitBetweenMatchesMinutes) || 10;
      formData.value.availableScenaryIds = Array.isArray(formData.value.availableScenaryIds) ? formData.value.availableScenaryIds : [];
      formData.value.categoriesDetail = editionCategoriesDetail.value.map((d) => ({
        categoryId: d.categoryId,
        categoryDescription: d.categoryDescription || getCategoryNameById(d.categoryId),
        startDate: d.startDate || undefined,
        endDate: d.endDate || undefined,
        registrationFee: Number(d.registrationFee) || 0,
        maxPlayers: Number(d.maxPlayers) > 0 ? Number(d.maxPlayers) : 25,
        matchDurationMinutes: Number(d.matchDurationMinutes) || 60,
        breakDurationMinutes: d.breakDurationMinutes !== undefined && d.breakDurationMinutes !== null ? Number(d.breakDurationMinutes) : 10,
        waitBetweenMatchesMinutes: d.waitBetweenMatchesMinutes !== undefined && d.waitBetweenMatchesMinutes !== null ? Number(d.waitBetweenMatchesMinutes) : 10,
        classifications: (d.classifications || []).map((c: any) => ({
          playerClassificationId: c.playerClassificationId,
          maxPlayers: Number(c.maxPlayers) || 0,
          maxInactivityMonths: c.maxInactivityMonths !== undefined && c.maxInactivityMonths !== null ? Number(c.maxInactivityMonths) : null,
          maxMonths: c.maxMonths !== undefined && c.maxMonths !== null ? Number(c.maxMonths) : null,
        })),
        stages: (d.stages || []).map((s: any, sIdx: number) => {
          const rawCriteria = Array.isArray(s.tieBreakerCriteria) ? s.tieBreakerCriteria : [];
          const formattedCriteria = rawCriteria.map((c: any, cIdx: number) => ({
            criterionId: c.criterionId || c.id,
            id: c.id || c.criterionId,
            description: c.description || getTieBreakerCriterionDescById(c.criterionId || c.id),
            code: c.code || '',
            observation: c.observation || '',
            order: Number(c.order) || (cIdx + 1),
          }));

          return {
            stageOrder: Number(s.stageOrder) || (sIdx + 1),
            name: s.name,
            competitionTypeId: s.competitionTypeId,
            competitionTypeDescription: s.competitionTypeDescription || getCompetitionTypeDescById(s.competitionTypeId),
            competitionLapId: s.competitionLapId,
            competitionLapDescription: s.competitionLapDescription || getCompetitionLapDescById(s.competitionLapId),
            tieBreakerCriteria: formattedCriteria,
            tieBreakerCriterionId: s.tieBreakerCriterionId || (formattedCriteria[0]?.criterionId || null),
            tieBreakerCriterionDescription: formattedCriteria.length > 0
              ? formattedCriteria.map((c) => `#${c.order} ${c.code || c.description}`).join(' → ')
              : (s.tieBreakerCriterionDescription || (s.tieBreakerCriterionId ? getTieBreakerCriterionDescById(s.tieBreakerCriterionId) : null)),
          };
        }),
      }));
    } else if (activeTab.value === 'categories') {
      if (!formData.value.code) {
        delete formData.value.code;
      }
    } else if (activeTab.value === 'categories') {
    // Mantener los datos del item para edición
  } else if (activeTab.value === 'players') {
      if (formData.value.birthDate) {
        const calculated = calculatePlayerAgeDirect(formData.value.birthDate);
        if (calculated) {
          formData.value.ageYears = calculated.years;
          formData.value.ageMonths = calculated.months;
        }
      }
      if (!formData.value.code) {
        delete formData.value.code;
      }
    } else if (activeTab.value === 'scenaries') {
      if (formData.value.isActive === undefined) {
        formData.value.isActive = true;
      }
      if (formData.value.latitude !== undefined && formData.value.latitude !== null) {
        formData.value.latitude = String(formData.value.latitude);
      }
      if (formData.value.longitude !== undefined && formData.value.longitude !== null) {
        formData.value.longitude = String(formData.value.longitude);
      }
      if (formData.value.address && !formData.value.location) {
        formData.value.location = `${formData.value.address} (${formData.value.cardinalPoints || ''})`;
      }
    } else if (activeTab.value === 'playerClassifications' && formData.value.isActive === undefined) {
      formData.value.isActive = true;
    } else if (activeTab.value === 'teams' || activeTab.value === 'vocals' || activeTab.value === 'referees') {
      if (formData.value.isActive === undefined) {
        formData.value.isActive = true;
      }
    } else if (activeTab.value === 'playerTransfers') {
      if (!formData.value.edition_id) {
        toast.error('Debe seleccionar la edición del campeonato');
        saving.value = false;
        return;
      }
      if (!formData.value.player_id) {
        toast.error('Debe seleccionar al futbolista a transferir');
        saving.value = false;
        return;
      }
      if (!formData.value.destination_team_id) {
        toast.error('Debe seleccionar el club de destino');
        saving.value = false;
        return;
      }
    } else if (activeTab.value === 'stages') {
      if (!formData.value.name || !formData.value.name.trim()) {
        toast.error('El nombre de la plantilla es obligatorio');
        saving.value = false;
        return;
      }
      formData.value.name = formData.value.name.trim();
      formData.value.description = formData.value.description ? formData.value.description.trim() : null;
      formData.value.isActive = formData.value.isActive !== false;
      formData.value.details = templateStagesDetail.value.map((d: any, idx: number) => ({
        stageOrder: Number(d.stageOrder) || idx + 1,
        name: d.name.trim(),
        competitionTypeId: d.competitionTypeId || null,
        competitionLapId: d.competitionLapId || null,
        tieBreakerCriterionId: d.tieBreakerCriterionId || null,
      }));
    }

    // Limpiar el payload de metadatos de auditoría y relaciones para cumplir con los DTOs del backend
    const payload = { ...formData.value };
    const forbiddenKeys = [
      'id',
      '_id',
      'companyId',
      'tournamentId',
      'createdName',
      'createdBy',
      'createdAt',
      'updateName',
      'updatedBy',
      'updatedAt',
      'deletedAt',
    ];
    for (const k of forbiddenKeys) {
      delete (payload as any)[k];
    }
    for (const [k, v] of Object.entries(payload)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        delete (payload as any)[k];
      }
    }

    if (isEditing.value && editingId.value) {
      await currentTabConfig.value.api.update(editingId.value, payload);
      toast.success('Registro actualizado exitosamente');
    } else {
      await currentTabConfig.value.api.create(payload);
      toast.success('Registro creado exitosamente');
    }
    closeForm();
    loadData();
  } catch (err: any) {
    console.error(err);
    const msg = err?.response?.data?.message || err?.message || 'Error al guardar el registro';
    toast.error(msg);
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
  canchas: 'scenaries',
  horarios: 'schedules',
  schedules: 'schedules',
  configuracion: 'teams',
  configuraciones: 'teams',
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
  posiciones: 'standings',
  'tabla-posiciones': 'standings',
  standings: 'standings',
  clasificaciones: 'playerClassifications',
  'clasificacion-futbolistas': 'playerClassifications',
  playerClassifications: 'playerClassifications',
  'player-classifications': 'playerClassifications',
  transferencias: 'playerTransfers',
  'transferencias-jugadores': 'playerTransfers',
  playerTransfers: 'playerTransfers',
  'player-transfers': 'playerTransfers',
};

const resolveTabFromRoute = (): string => {
  const queryTab = route.query.tab as string;
  const subQuery = route.query.sub as string;

  if (queryTab === 'configuracion' || queryTab === 'configuraciones') {
    if (subQuery && slugToTab[subQuery]) {
      configSubTab.value = slugToTab[subQuery];
      return slugToTab[subQuery];
    }
    configSubTab.value = 'teams';
    return 'teams';
  }

  if (queryTab && slugToTab[queryTab]) {
    const resolved = slugToTab[queryTab];
    if (configSubTabsList.some((st) => st.id === resolved)) {
      configSubTab.value = resolved;
    }
    return resolved;
  }

  const subParam = route.params.sub as string;
  if (subParam && slugToTab[subParam]) return slugToTab[subParam];

  if (allowedTabs.value.length > 0) return allowedTabs.value[0]!.id;
  return 'teams';
};

watch(
  () => formData.value.teamRegistrationId,
  (newTeamRegId) => {
    if (activeTab.value === 'playerRegistrations' && isFormOpen.value) {
      updatePlayerRegistrationClassifications(newTeamRegId);
    }
  }
);

onMounted(async () => {
  activeTab.value = resolveTabFromRoute();
  window.addEventListener('deskounta:reset-view', onGlobalResetView);
  await loadAuxiliaryTournamentData();
  if (activeTab.value === 'schedules') {
    loadScheduleConfig();
  } else {
    loadData();
  }
});

onUnmounted(() => {
  window.removeEventListener('deskounta:reset-view', onGlobalResetView);
});

watch(
  () => scheduleConfig.value.editionId,
  (edId) => {
    if (!edId) return;
    const foundEd = categoryEditionsList.value.find((e) => e.id === edId);
    if (foundEd) {
      if (foundEd.matchDurationMinutes) {
        scheduleConfig.value.matchDurationMinutes = foundEd.matchDurationMinutes;
      }
      if (foundEd.breakDurationMinutes !== undefined && foundEd.waitBetweenMatchesMinutes !== undefined) {
        scheduleConfig.value.intervalMinutes = foundEd.breakDurationMinutes + foundEd.waitBetweenMatchesMinutes;
      } else if (foundEd.breakDurationMinutes !== undefined) {
        scheduleConfig.value.intervalMinutes = foundEd.breakDurationMinutes;
      }
      if (foundEd.availableScenaryIds && foundEd.availableScenaryIds.length > 0) {
        scheduleConfig.value.selectedScenaryIds = [...foundEd.availableScenaryIds];
      }
    }
  }
);

const handleRouteTabChange = (forceReload = false) => {
  closeForm();
  const targetTab = resolveTabFromRoute();
  const tabChanged = targetTab !== activeTab.value;
  activeTab.value = targetTab;
  page.value = 1;
  searchQuery.value = '';
  if (targetTab === 'schedules') {
    loadAuxiliaryTournamentData();
    loadScheduleConfig();
  } else if (tabChanged || forceReload) {
    loadData();
  }
};

watch(
  () => [route.query.tab, route.query.sub, route.params.sub, route.path],
  () => {
    handleRouteTabChange(true);
  }
);

onBeforeRouteUpdate(() => {
  closeForm();
});

onBeforeRouteLeave(() => {
  closeForm();
});

const onGlobalResetView = () => {
  handleRouteTabChange(true);
};
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
