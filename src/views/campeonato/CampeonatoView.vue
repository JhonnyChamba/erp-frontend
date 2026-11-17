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

        <button v-if="activeTab !== 'schedules'" class="btn btn-secondary d-flex align-items-center gap-2" @click="loadData" :disabled="loading">
          <iconify-icon icon="solar:refresh-line-duotone" :class="{ 'spin-anim': loading }"></iconify-icon>
          <span>Actualizar</span>
        </button>
        <button v-if="activeTab !== 'standings' && activeTab !== 'schedules'" class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateForm">
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
    <div v-show="!isFormOpen && activeTab !== 'schedules' && activeTab !== 'standings'" class="crud-filters-card">
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
    <!-- 2.5 SECCIÓN DE DÍAS Y HORARIOS DE JUEGO    -->
    <!-- ========================================== -->
    <div v-if="!isFormOpen && activeTab === 'schedules'" class="row g-3">
      <!-- Formulario de Configuración de Horarios -->
      <div class="col-lg-7">
        <div class="crud-table-card p-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <iconify-icon icon="solar:clock-circle-bold-duotone" class="fs-3 text-primary"></iconify-icon>
            <div>
              <h5 class="fw-bold mb-0 text-body-emphasis">Reglamento de Días y Horarios de Juego</h5>
              <p class="text-muted small mb-0">Define los días de la semana y los horarios habilitados para la disputa de partidos.</p>
            </div>
          </div>

          <form @submit.prevent="saveScheduleConfig">
            <div class="row g-3">
              <!-- Selección de Edición -->
              <div class="col-12">
                <label class="form-label fw-semibold small text-secondary">Edición del Campeonato</label>
                <select v-model="scheduleConfig.editionId" class="form-select">
                  <option value="" disabled>Seleccione una edición...</option>
                  <option v-for="ed in categoryEditionsList" :key="ed.id" :value="ed.id">
                    {{ ed.name }} ({{ ed.category?.name || 'Categoría' }})
                  </option>
                </select>
              </div>

              <!-- Días de Juego -->
              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                  <label class="form-label fw-semibold small text-secondary mb-0">Días Habilitados para Jugar</label>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekends')">Fines de Semana</button>
                    <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekdays')">Entre Semana</button>
                    <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('all')">Todos</button>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  <button
                    v-for="day in weekDaysList"
                    :key="day.key"
                    type="button"
                    class="btn rounded-pill px-3 py-1-5 d-flex align-items-center gap-1 fw-semibold fs-2"
                    :class="scheduleConfig.gameDays.includes(day.key) ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary text-secondary'"
                    @click="toggleGameDay(day.key)"
                  >
                    <iconify-icon :icon="scheduleConfig.gameDays.includes(day.key) ? 'solar:check-circle-bold' : 'solar:circle-linear'"></iconify-icon>
                    <span>{{ day.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Horas de la Jornada -->
              <div class="col-md-6">
                <label class="form-label fw-semibold small text-secondary">Hora Inicio Primer Partido</label>
                <div class="input-group">
                  <span class="input-group-text"><iconify-icon icon="solar:sunrise-bold-duotone"></iconify-icon></span>
                  <input type="time" v-model="scheduleConfig.startTime" class="form-control" required />
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold small text-secondary">Hora Límite Último Partido</label>
                <div class="input-group">
                  <span class="input-group-text"><iconify-icon icon="solar:sunset-bold-duotone"></iconify-icon></span>
                  <input type="time" v-model="scheduleConfig.endTime" class="form-control" required />
                </div>
              </div>

              <!-- Tiempos Reglamentarios -->
              <div class="col-md-6">
                <label class="form-label fw-semibold small text-secondary">Duración Partido (Minutos)</label>
                <div class="input-group">
                  <span class="input-group-text"><iconify-icon icon="solar:stopwatch-play-bold-duotone"></iconify-icon></span>
                  <input type="number" v-model.number="scheduleConfig.matchDurationMinutes" class="form-control" min="30" max="120" step="5" required />
                  <span class="input-group-text">min</span>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold small text-secondary">Descanso / Entretiempo entre Partidos</label>
                <div class="input-group">
                  <span class="input-group-text"><iconify-icon icon="solar:hourglass-line-duotone"></iconify-icon></span>
                  <input type="number" v-model.number="scheduleConfig.intervalMinutes" class="form-control" min="0" max="60" step="5" required />
                  <span class="input-group-text">min</span>
                </div>
              </div>

              <!-- Canchas Disponibles -->
              <div class="col-12 mt-3">
                <label class="form-label fw-semibold small text-secondary mb-2">Canchas Habilitadas para esta Programación</label>
                <div class="border rounded p-3 bg-body-tertiary">
                  <div v-if="scenariesList.length === 0" class="text-muted small">
                    No hay canchas registradas aún. Agrega una cancha en la pestaña de <strong>Canchas (Escenarios)</strong>.
                  </div>
                  <div v-else class="row g-2">
                    <div v-for="sc in scenariesList" :key="sc.id" class="col-md-6">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :value="sc.id"
                          :id="'sc_sched_' + sc.id"
                          v-model="scheduleConfig.selectedScenaryIds"
                        />
                        <label class="form-check-label small fw-semibold text-body-emphasis" :for="'sc_sched_' + sc.id">
                          {{ sc.name }} <span class="badge bg-secondary-subtle text-secondary ms-1">{{ sc.surfaceType || 'Cancha' }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botones de Acción -->
              <div class="col-12 d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                <button
                  type="submit"
                  class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                  :disabled="savingSchedule"
                >
                  <iconify-icon icon="solar:diskette-bold-duotone" class="fs-5"></iconify-icon>
                  <span>{{ savingSchedule ? 'Guardando...' : 'Guardar Horarios' }}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Tarjeta Resumen y Capacidad Deportiva -->
      <div class="col-lg-5">
        <div class="card p-4 border rounded-4 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex align-items-center gap-2 mb-3">
              <iconify-icon icon="solar:calculator-minimalistic-bold-duotone" class="fs-3 text-info"></iconify-icon>
              <h5 class="fw-bold mb-0 text-body-emphasis">Capacidad y Simulación</h5>
            </div>

            <div class="card p-3 mb-3 border-0 bg-primary-subtle text-primary rounded-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">Jornada Disponible</span>
                <span class="fw-bold font-monospace">{{ scheduleCalculation.totalHoursPerDay }} horas / día</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">Franja x Partido</span>
                <span class="fw-bold font-monospace">{{ scheduleCalculation.slotMinutes }} min ({{ scheduleConfig.matchDurationMinutes }}m + {{ scheduleConfig.intervalMinutes }}m)</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="small fw-semibold">Días Activos</span>
                <span class="badge bg-primary text-white font-monospace">{{ scheduleCalculation.activeDaysCount }} días / sem</span>
              </div>
            </div>

            <div class="row g-2 text-center mb-3">
              <div class="col-6">
                <div class="p-3 border rounded-3 bg-body">
                  <span class="text-muted small d-block mb-1">Partidos x Cancha / Día</span>
                  <h3 class="fw-bold text-success mb-0 font-monospace">{{ scheduleCalculation.matchesPerCourtPerDay }}</h3>
                </div>
              </div>
              <div class="col-6">
                <div class="p-3 border rounded-3 bg-body">
                  <span class="text-muted small d-block mb-1">Total x Semana</span>
                  <h3 class="fw-bold text-primary mb-0 font-monospace">{{ scheduleCalculation.totalMatchesPerWeek }}</h3>
                </div>
              </div>
            </div>

            <p class="text-muted small mb-0">
              💡 <strong>Regla deportiva:</strong> Estos parámetros son utilizados automáticamente por el <strong>Generador de Fixture</strong> para programar los encuentros sin solapamiento de canchas y respetando los intervalos de descanso.
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

    <!-- ========================================== -->
    <!-- 3. TABLA DE POSICIONES Y GOLEADORES        -->
    <!-- ========================================== -->
    <div v-if="!isFormOpen && activeTab === 'standings'" class="row g-3">
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
                  <span class="text-body-emphasis fw-bold">{{ item.name }}</span>
                </div>

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
                    <!-- Ver Carnet QR si es inscripción de jugador -->
                    <li v-if="activeTab === 'playerRegistrations'">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openCarnetModal(item)">
                        <iconify-icon icon="solar:card-2-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Carnet (QR)</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerRegistrations'"><hr class="dropdown-divider"></li>

                    <!-- Acciones directas desde la fila de Equipos -->
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
            <!-- SECCIÓN ESPECIAL: CARGA DE LOGO / ESCUDO PARA EQUIPOS -->
            <div v-if="activeTab === 'teams'" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center gap-3 flex-wrap">
                <div class="position-relative">
                  <img
                    v-if="formData.logo"
                    :src="formData.logo"
                    alt="Escudo del Equipo"
                    class="rounded-circle shadow-sm border border-2 border-primary"
                    style="width: 85px; height: 85px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center shadow-sm border border-2 border-dashed"
                    style="width: 85px; height: 85px;"
                  >
                    <iconify-icon icon="solar:shield-bold-duotone" class="fs-1 text-secondary"></iconify-icon>
                  </div>
                </div>
                <div class="flex-grow-1">
                  <h6 class="fw-bold mb-1 text-body-emphasis">Escudo / Logo Oficial del Equipo</h6>
                  <p class="text-muted small mb-2">Carga el escudo oficial del club deportivo (PNG, JPG o WebP con fondo transparente o sólido).</p>
                  <div class="d-flex align-items-center gap-2">
                    <label class="btn btn-sm btn-primary rounded-pill px-3 cursor-pointer d-inline-flex align-items-center gap-1 mb-0">
                      <iconify-icon icon="solar:camera-add-bold" class="fs-5"></iconify-icon>
                      <span>{{ uploadingImage ? 'Procesando...' : (formData.logo ? 'Cambiar Escudo' : 'Cargar Escudo') }}</span>
                      <input type="file" accept="image/*" class="d-none" @change="onTeamLogoSelected" :disabled="uploadingImage" />
                    </label>
                    <button
                      v-if="formData.logo"
                      type="button"
                      class="btn btn-sm btn-outline-danger rounded-pill px-3 d-inline-flex align-items-center gap-1"
                      @click="formData.logo = ''"
                    >
                      <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5"></iconify-icon>
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN ESPECIAL: CARGA DE FOTO PARA JUGADORES -->
            <div v-if="activeTab === 'players'" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center gap-3 flex-wrap">
                <div class="position-relative">
                  <img
                    v-if="formData.photo"
                    :src="formData.photo"
                    alt="Foto del Jugador"
                    class="rounded-3 shadow-sm border border-2 border-info"
                    style="width: 80px; height: 100px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-3 bg-secondary-subtle text-secondary d-flex flex-column align-items-center justify-content-center shadow-sm border border-2 border-dashed"
                    style="width: 80px; height: 100px;"
                  >
                    <iconify-icon icon="solar:user-bold-duotone" class="fs-1 text-secondary"></iconify-icon>
                    <span class="fs-1 text-muted">Foto Carnet</span>
                  </div>
                </div>
                <div class="flex-grow-1">
                  <h6 class="fw-bold mb-1 text-body-emphasis">Foto Oficial del Jugador (Carnet Deportivo)</h6>
                  <p class="text-muted small mb-2">Fotografía tamaño carnet con rostro visible para emisión de credenciales y validación QR.</p>
                  <div class="d-flex align-items-center gap-2">
                    <label class="btn btn-sm btn-info rounded-pill px-3 cursor-pointer d-inline-flex align-items-center gap-1 text-white mb-0">
                      <iconify-icon icon="solar:camera-add-bold" class="fs-5"></iconify-icon>
                      <span>{{ uploadingImage ? 'Procesando...' : (formData.photo ? 'Cambiar Foto' : 'Cargar Foto') }}</span>
                      <input type="file" accept="image/*" class="d-none" @change="onPlayerPhotoSelected" :disabled="uploadingImage" />
                    </label>
                    <button
                      v-if="formData.photo"
                      type="button"
                      class="btn btn-sm btn-outline-danger rounded-pill px-3 d-inline-flex align-items-center gap-1"
                      @click="formData.photo = ''"
                    >
                      <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5"></iconify-icon>
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: TITULARIDAD DEL PASE Y CLUB PARA JUGADORES -->
            <div v-if="activeTab === 'players'" class="card p-3 mb-4 border rounded-3 bg-body-tertiary">
              <h6 class="fw-bold mb-1 text-body-emphasis d-flex align-items-center gap-2">
                <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-4 text-info"></iconify-icon>
                <span>Titularidad del Pase y Club Actual</span>
              </h6>
              <p class="text-muted small mb-3">
                Gestiona los derechos federativos y la titularidad del pase deportivo del jugador.
              </p>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Propiedad del Pase</label>
                  <select v-model="formData.passOwnerType" class="form-select">
                    <option value="PLAYER">👤 Pase Propio (Jugador Libre)</option>
                    <option value="TEAM">🛡️ Club / Equipo es Dueño del Pase</option>
                  </select>
                </div>
                <div v-if="formData.passOwnerType === 'TEAM'" class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Club Dueño de los Derechos</label>
                  <AppSelect2
                    v-model="formData.passOwnerTeamId"
                    :fetch-options="fetchTeamsOptions"
                    placeholder="Buscar club dueño del pase..."
                    search-placeholder="Buscar club en BD..."
                  />
                </div>
                <div :class="formData.passOwnerType === 'TEAM' ? 'col-md-4' : 'col-md-8'">
                  <label class="form-label text-secondary small fw-semibold">Club en el que Juega Actualmente</label>
                  <AppSelect2
                    v-model="formData.currentTeamId"
                    :fetch-options="fetchTeamsOptions"
                    placeholder="Buscar club actual del jugador..."
                    search-placeholder="Buscar club en BD..."
                  />
                </div>
              </div>
            </div>

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
                <AppSelect2
                  v-else-if="field.type === 'select'"
                  v-model="formData[field.key]"
                  :options="field.options || []"
                  :placeholder="field.placeholder || '-- Seleccionar --'"
                  search-placeholder="Buscar..."
                />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CampeonatoApi, uploadTeamLogo, uploadPlayerPhoto } from '@/services/campeonato.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/utils/toastr';
import AppSelect2 from '@/components/common/AppSelect2.vue';

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
      { key: 'currentCategory.name', label: 'Categoría Actual' },
      { key: 'currentSeasonYear', label: 'Temporada' },
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
      { key: 'colorAlternate', label: 'Uniforme Alterno', type: 'text', colClass: 'col-md-4', placeholder: '#000000' },
      { key: 'dateOfFoundation', label: 'Fecha de Fundación', type: 'date', colClass: 'col-md-4' },
      { key: 'email', label: 'Correo Oficial del Club', type: 'text', colClass: 'col-md-4' },
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
      { key: 'passOwnerType', label: 'Dueño del Pase' },
      { key: 'currentTeam.name', label: 'Club Actual' },
      { key: 'medicalClearanceExpiry', label: 'Ficha Médica', type: 'date' },
      { key: 'isActive', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Nombres', type: 'text', colClass: 'col-md-6' },
      { key: 'lastName', label: 'Apellidos', type: 'text', colClass: 'col-md-6' },
      { key: 'identification', label: 'Cédula / DNI / Pasaporte', type: 'text', colClass: 'col-md-4' },
      { key: 'isForeigner', label: '¿Es Extranjero? (Permite Pasaporte)', type: 'boolean', colClass: 'col-md-4' },
      { key: 'birthDate', label: 'Fecha de Nacimiento', type: 'date', colClass: 'col-md-4' },
      { key: 'demarcationId', label: 'Posición / Demarcación en Campo', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'jerseyNumber', label: 'Dorsal habitual', type: 'number', colClass: 'col-md-3' },
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
        colClass: 'col-md-4',
      },
      { key: 'emergencyContactName', label: 'Contacto de Emergencia', type: 'text', colClass: 'col-md-4' },
      { key: 'emergencyContactPhone', label: 'Teléfono de Emergencia', type: 'text', colClass: 'col-md-4' },
      { key: 'medicalClearanceExpiry', label: 'Vencimiento de Chequeo Médico', type: 'date', colClass: 'col-md-4' },
      { key: 'phone', label: 'Teléfono Personal', type: 'text', colClass: 'col-md-4' },
      { key: 'email', label: 'Correo Electrónico', type: 'text', colClass: 'col-md-4' },
      { key: 'isActive', label: 'Habilitado / Activo', type: 'boolean', colClass: 'col-md-12' },
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
      { key: 'jerseyNumber', label: 'Dorsal' },
      { key: 'isCaptain', label: 'Capitán', type: 'boolean' },
      { key: 'status', label: 'Estado Carnet' },
    ],
    fields: [
      { key: 'teamRegistrationId', label: 'Inscripción de Equipo (Torneo)', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'playerId', label: 'Jugador', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'jerseyNumber', label: 'Número de Dorsal / Camiseta', type: 'number', colClass: 'col-md-4' },
      { key: 'carnetCode', label: 'Código de Carnet', type: 'text', colClass: 'col-md-4' },
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
        colClass: 'col-md-4',
      },
      { key: 'isCaptain', label: 'Es Capitán del Equipo', type: 'boolean', colClass: 'col-md-12' },
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
    'demarcations',
    'positions',
  ];
  return cfgList.includes(activeTab.value);
});

const configSubTab = ref('teams');

const configSubTabsList = [
  { id: 'teams', label: 'Equipos', icon: 'solar:shield-bold-duotone' },
  { id: 'players', label: 'Jugadores', icon: 'solar:users-group-two-rounded-bold-duotone' },
  { id: 'categories', label: 'Categorías', icon: 'solar:medal-star-bold-duotone' },
  { id: 'categoryEditions', label: 'Ediciones de Torneo', icon: 'solar:calendar-date-bold-duotone' },
  { id: 'stages', label: 'Etapas y Fases', icon: 'solar:cup-first-bold-duotone' },
  { id: 'scenaries', label: 'Canchas (Escenarios)', icon: 'solar:map-point-wave-bold-duotone' },
  { id: 'schedules', label: 'Días y Horarios', icon: 'solar:clock-circle-bold-duotone' },
  { id: 'referees', label: 'Árbitros', icon: 'solar:whistle-bold-duotone' },
  { id: 'vocals', label: 'Vocales', icon: 'solar:notes-bold-duotone' },
  { id: 'demarcations', label: 'Demarcaciones', icon: 'solar:running-bold-duotone' },
  { id: 'positions', label: 'Cargos y Roles', icon: 'solar:user-id-bold-duotone' },
];

const switchConfigSubTab = (subId: string) => {
  configSubTab.value = subId;
  closeForm();
  activeTab.value = subId;
  page.value = 1;
  searchQuery.value = '';
  router.replace({ path: '/campeonato', query: { tab: 'configuracion', sub: subId } });
  if (subId === 'schedules') {
    loadAuxiliaryTournamentData();
    loadScheduleConfig();
  } else {
    loadData();
  }
};

// Estado y cálculo para Días y Horarios de Juego
const savingSchedule = ref(false);
const scheduleConfig = ref({
  editionId: '',
  gameDays: ['SAT', 'SUN'],
  startTime: '08:00',
  endTime: '18:00',
  matchDurationMinutes: 60,
  intervalMinutes: 10,
  selectedScenaryIds: [] as string[],
});

const weekDaysList = [
  { key: 'MON', label: 'Lunes' },
  { key: 'TUE', label: 'Martes' },
  { key: 'WED', label: 'Miércoles' },
  { key: 'THU', label: 'Jueves' },
  { key: 'FRI', label: 'Viernes' },
  { key: 'SAT', label: 'Sábado' },
  { key: 'SUN', label: 'Domingo' },
];

const toggleGameDay = (dayKey: string) => {
  const idx = scheduleConfig.value.gameDays.indexOf(dayKey);
  if (idx > -1) {
    if (scheduleConfig.value.gameDays.length > 1) {
      scheduleConfig.value.gameDays.splice(idx, 1);
    } else {
      toast.warning('Debe haber al menos un día habilitado para jugar');
    }
  } else {
    scheduleConfig.value.gameDays.push(dayKey);
  }
};

const setQuickDays = (mode: 'weekends' | 'weekdays' | 'all') => {
  if (mode === 'weekends') {
    scheduleConfig.value.gameDays = ['SAT', 'SUN'];
  } else if (mode === 'weekdays') {
    scheduleConfig.value.gameDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  } else {
    scheduleConfig.value.gameDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  }
};

const scheduleCalculation = computed(() => {
  const partsStart = (scheduleConfig.value.startTime || '08:00').split(':');
  const startH = Number(partsStart[0] ?? 8);
  const startM = Number(partsStart[1] ?? 0);

  const partsEnd = (scheduleConfig.value.endTime || '18:00').split(':');
  const endH = Number(partsEnd[0] ?? 18);
  const endM = Number(partsEnd[1] ?? 0);

  const totalMinutes = Math.max(0, (endH * 60 + endM) - (startH * 60 + startM));
  const totalHoursPerDay = (totalMinutes / 60).toFixed(1);

  const slotMinutes = (Number(scheduleConfig.value.matchDurationMinutes) || 60) + (Number(scheduleConfig.value.intervalMinutes) || 0);
  const matchesPerCourtPerDay = slotMinutes > 0 ? Math.floor(totalMinutes / slotMinutes) : 0;
  const activeDaysCount = scheduleConfig.value.gameDays.length;
  const courtsCount = scheduleConfig.value.selectedScenaryIds.length || (scenariesList.value.length || 1);
  const totalMatchesPerWeek = matchesPerCourtPerDay * courtsCount * activeDaysCount;

  return {
    totalHoursPerDay,
    slotMinutes,
    activeDaysCount,
    matchesPerCourtPerDay,
    totalMatchesPerWeek,
  };
});

const saveScheduleConfig = () => {
  savingSchedule.value = true;
  try {
    const companyId = getActiveCompanyId();
    localStorage.setItem(`deskounta_camp_schedules_${companyId}`, JSON.stringify(scheduleConfig.value));
    toast.success('Horarios y configuración de juego guardados exitosamente');
  } catch {
    toast.error('Error al guardar la configuración de horarios');
  } finally {
    savingSchedule.value = false;
  }
};

const loadScheduleConfig = () => {
  try {
    const companyId = getActiveCompanyId();
    const raw = localStorage.getItem(`deskounta_camp_schedules_${companyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      scheduleConfig.value = { ...scheduleConfig.value, ...parsed };
    }
    if (scheduleConfig.value.selectedScenaryIds.length === 0 && scenariesList.value.length > 0) {
      scheduleConfig.value.selectedScenaryIds = scenariesList.value.map((s) => s.id);
    }
    if (!scheduleConfig.value.editionId && categoryEditionsList.value.length > 0) {
      scheduleConfig.value.editionId = categoryEditionsList.value[0].id;
    }
  } catch {}
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
  positions: 'SUB-CAMP-014',
  demarcations: 'SUB-CAMP-015',
  schedules: 'SUB-CAMP-016',
  standings: 'SUB-CAMP-017',
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

  return tabs.filter((t) => {
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

// Estado para Tabla de Posiciones y Goleadores
const selectedStageId = ref('');
const stagesList = ref<any[]>([]);
const teamsList = ref<any[]>([]);
const scenariesList = ref<any[]>([]);
const demarcationsList = ref<any[]>([]);
const playersList = ref<any[]>([]);
const categoryEditionsList = ref<any[]>([]);
const teamRegistrationsList = ref<any[]>([]);
const standingsList = ref<any[]>([]);
const topScorersList = ref<any[]>([]);
const loadingStandings = ref(false);
const uploadingImage = ref(false);

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
  // Opciones para Jugadores (Demarcación)
  const plTab = tabs.find((t) => t.id === 'players');
  const demField = plTab?.fields.find((f) => f.key === 'demarcationId');
  if (demField) {
    demField.options = demarcationsList.value.map((d) => ({ label: `${d.name} (${d.zone || d.code})`, value: d.id }));
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

  // Opciones para Inscripción y Carnets (Inscripción de equipo y Jugadores)
  const prTab = tabs.find((t) => t.id === 'playerRegistrations');
  const regField = prTab?.fields.find((f) => f.key === 'teamRegistrationId');
  if (regField) {
    regField.options = teamRegistrationsList.value.map((r) => ({
      label: `${r.team?.name || 'Equipo'} - ${r.categoryEdition?.name || 'Edición'}`,
      value: r.id,
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
};

const loadAuxiliaryTournamentData = async () => {
  try {
    const [stRes, tmRes, scRes, dmRes, plRes, edRes, trRes] = await Promise.all([
      CampeonatoApi.stages.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teams.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.scenaries.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.demarcations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.players.list({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categoryEditions.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teamRegistrations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
    ]);
    stagesList.value = stRes.data.data || [];
    teamsList.value = tmRes.data.data || [];
    scenariesList.value = scRes.data.data || [];
    demarcationsList.value = dmRes.data.data || [];
    playersList.value = plRes.data.data || [];
    categoryEditionsList.value = edRes.data.data || [];
    teamRegistrationsList.value = trRes.data.data || [];
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
    if (activeTab.value === 'standings') {
      await Promise.all([loadAuxiliaryTournamentData(), loadStandings()]);
      return;
    }
    if (activeTab.value === 'matches' || activeTab.value === 'playerRegistrations') {
      loadAuxiliaryTournamentData();
    }
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
  loadAuxiliaryTournamentData();
};

const openEditForm = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  isFormOpen.value = true;
  showModal.value = true;
  loadAuxiliaryTournamentData();
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

onMounted(async () => {
  activeTab.value = resolveTabFromRoute();
  await loadAuxiliaryTournamentData();
  if (activeTab.value === 'schedules') {
    loadScheduleConfig();
  } else {
    loadData();
  }
});

watch(
  () => [route.query.tab, route.query.sub, route.params.sub],
  () => {
    const targetTab = resolveTabFromRoute();
    if (targetTab !== activeTab.value) {
      activeTab.value = targetTab;
      page.value = 1;
      searchQuery.value = '';
      if (targetTab === 'schedules') {
        loadScheduleConfig();
      } else {
        loadData();
      }
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
