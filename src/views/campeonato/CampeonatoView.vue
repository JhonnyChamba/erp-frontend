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

              <!-- Días de Juego y Horarios por Día -->
              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div>
                    <label class="form-label fw-bold small text-body-emphasis mb-0">Días y Horarios Específicos por Día de Juego</label>
                    <p class="text-muted small mb-0">Personaliza la hora del primer y último partido independientemente para cada día (ej. viernes nocturno, sábados y domingos diurnos).</p>
                  </div>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekend_fri')">Vie, Sáb y Dom</button>
                    <button type="button" class="btn btn-outline-secondary" @click="setQuickDays('weekend_std')">Sáb y Dom</button>
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
                    :class="scheduleConfig.dailySchedules[day.key]?.enabled ? 'bg-body border-primary-subtle shadow-sm' : 'bg-body-tertiary opacity-75'"
                  >
                    <div v-if="scheduleConfig.dailySchedules[day.key]" class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <!-- Switch y Nombre del Día -->
                      <div class="d-flex align-items-center gap-2" style="min-width: 170px;">
                        <div class="form-check form-switch mb-0">
                          <input
                            class="form-check-input cursor-pointer"
                            type="checkbox"
                            :id="'switch_day_' + day.key"
                            v-model="scheduleConfig.dailySchedules[day.key]!.enabled"
                          />
                        </div>
                        <label :for="'switch_day_' + day.key" class="form-check-label fw-bold mb-0 cursor-pointer text-body-emphasis">
                          {{ day.label }}
                        </label>
                        <span
                          class="badge ms-1 font-monospace"
                          :class="scheduleConfig.dailySchedules[day.key]!.enabled ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'"
                        >
                          {{ scheduleConfig.dailySchedules[day.key]!.enabled ? 'Activo' : 'Inactivo' }}
                        </span>
                      </div>

                      <!-- Inputs de Horas (Solo si el día está habilitado) -->
                      <div v-if="scheduleConfig.dailySchedules[day.key]!.enabled" class="d-flex align-items-center gap-3 flex-wrap flex-grow-1 justify-content-md-end">
                        <div class="d-flex align-items-center gap-1">
                          <span class="small text-muted fw-semibold" style="white-space: nowrap;">1er Partido:</span>
                          <div class="input-group input-group-sm" style="width: 135px;">
                            <span class="input-group-text"><iconify-icon icon="solar:sunrise-bold-duotone"></iconify-icon></span>
                            <input
                              type="time"
                              v-model="scheduleConfig.dailySchedules[day.key]!.startTime"
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
                              v-model="scheduleConfig.dailySchedules[day.key]!.endTime"
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
                        Sin partidos programados para este día.
                      </div>
                    </div>
                  </div>
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
              <h5 class="fw-bold mb-0 text-body-emphasis">Capacidad y Simulación Semanal</h5>
            </div>

            <div class="card p-3 mb-3 border-0 bg-primary-subtle text-primary rounded-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">Horas Disponibles Semanales</span>
                <span class="fw-bold font-monospace">{{ scheduleCalculation.totalHoursWeek }} horas / sem</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">Franja x Partido</span>
                <span class="fw-bold font-monospace">{{ scheduleCalculation.slotMinutes }} min ({{ scheduleConfig.matchDurationMinutes }}m + {{ scheduleConfig.intervalMinutes }}m)</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">Días con Jornada Activa</span>
                <span class="badge bg-primary text-white font-monospace">{{ scheduleCalculation.activeDaysCount }} de 7 días</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="small fw-semibold">Canchas Habilitadas</span>
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

            <!-- Desglose por Día Activo -->
            <div class="mb-3">
              <label class="form-label small fw-bold text-body-emphasis mb-2">Desglose Diario de Capacidad:</label>
              <div v-if="scheduleCalculation.breakdown.length === 0" class="text-muted small p-2 border rounded bg-body">
                No hay días habilitados. Activa al menos un día para calcular la capacidad deportiva.
              </div>
              <div v-else class="d-flex flex-column gap-1">
                <div
                  v-for="item in scheduleCalculation.breakdown"
                  :key="item.key"
                  class="d-flex align-items-center justify-content-between p-2 border rounded bg-body small"
                >
                  <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold text-body-emphasis" style="min-width: 75px;">{{ item.label }}</span>
                    <span class="badge bg-secondary-subtle text-secondary font-monospace">{{ item.startTime }} - {{ item.endTime }}</span>
                  </div>
                  <div class="text-end">
                    <span class="fw-bold text-success font-monospace">{{ item.matchesPerCourt }} part. x cancha</span>
                    <span class="text-muted ms-1">({{ item.matchesAllCourts }} tot.)</span>
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
                    />
                  </span>
                  <input
                    type="text"
                    v-model="formData[field.key]"
                    class="form-control font-monospace text-uppercase"
                    :placeholder="field.placeholder || '#000000'"
                    maxlength="7"
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

            <!-- ======================================================== -->
            <!-- SECCIÓN MAESTRO-DETALLE: CATEGORÍAS DE LA EDICIÓN        -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'categoryEditions'" class="card p-3 mt-4 border rounded-3 bg-body-tertiary">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <h6 class="fw-bold mb-1 text-body-emphasis d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:widget-add-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                    <span>Detalle de Categorías del Torneo (Edición de Torneo Detalle Categorías)</span>
                  </h6>
                  <p class="text-muted small mb-0">
                    Agrega las categorías que competirán en esta edición, con sus fechas oficiales y costo de inscripción.
                  </p>
                </div>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
                  {{ editionCategoriesDetail.length }} Categoría(s) Agregada(s)
                </span>
              </div>

              <!-- Mini-formulario para agregar categoría al detalle -->
              <div class="card p-3 mb-3 border border-secondary-subtle rounded-3 bg-body">
                <div class="row g-3 align-items-end">
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Categoría <span class="text-danger">*</span></label>
                    <select v-model="editionDetailInput.categoryId" class="form-select">
                      <option value="" disabled>Seleccione una categoría...</option>
                      <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">
                        {{ cat.name }} ({{ cat.gender === 'MALE' ? 'Varones' : cat.gender === 'FEMALE' ? 'Mujeres' : 'Mixto' }})
                      </option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label text-secondary small fw-semibold">Fecha de Inicio</label>
                    <input type="date" v-model="editionDetailInput.startDate" class="form-control" />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label text-secondary small fw-semibold">Fecha Fin</label>
                    <input type="date" v-model="editionDetailInput.endDate" class="form-control" />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label text-secondary small fw-semibold">Costo Inscripción ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      v-model.number="editionDetailInput.registrationFee"
                      class="form-control"
                      placeholder="0.00"
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Máx. Jugadores Inscritos <span class="text-danger">*</span></label>
                    <input
                      type="number"
                      min="1"
                      v-model.number="editionDetailInput.maxPlayers"
                      class="form-control font-monospace"
                      placeholder="Ej. 30"
                      required
                    />
                  </div>
                  <div class="col-12 text-end">
                    <button
                      type="button"
                      class="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2"
                      @click="addCategoryToEditionDetail"
                    >
                      <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
                      <span>Agregar Categoría al Detalle</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tabla interactiva con el detalle de categorías -->
              <div class="table-responsive border rounded-3 bg-body">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 45px;">#</th>
                      <th>Categoría</th>
                      <th>Fechas Inicio / Fin</th>
                      <th>Costo Inscripción</th>
                      <th>Máximo Jugadores</th>
                      <th>Clasificaciones de Futbolistas</th>
                      <th class="text-end" style="width: 70px;">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in editionCategoriesDetail" :key="idx">
                      <td class="fw-bold text-muted">{{ idx + 1 }}</td>
                      <td>
                        <span class="fw-bold text-body-emphasis d-block">
                          🏆 {{ item.categoryDescription || getCategoryNameById(item.categoryId) }}
                        </span>
                        <small class="text-muted font-monospace">ID: {{ item.categoryId?.substring(0, 8) }}...</small>
                      </td>
                      <td>
                        <div class="small font-monospace">
                          <span class="d-block text-secondary">🟢 Inicio: {{ item.startDate || 'No def.' }}</span>
                          <span class="d-block text-muted">🔴 Fin: {{ item.endDate || 'No def.' }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold font-monospace">
                          ${{ Number(item.registrationFee || 0).toFixed(2) }}
                        </span>
                      </td>
                      <td>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-3">
                          👥 Máx. {{ item.maxPlayers || 25 }} inscritos
                        </span>
                      </td>
                      <td>
                        <div class="d-flex flex-column gap-1">
                          <button
                            type="button"
                            class="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 w-auto"
                            :class="item.classifications && item.classifications.length ? 'btn-outline-primary' : 'btn-outline-secondary'"
                            @click="openCategoryClassificationsModal(item, idx)"
                          >
                            <iconify-icon icon="solar:user-check-bold-duotone" class="fs-5"></iconify-icon>
                            <span>{{ item.classifications && item.classifications.length ? (item.classifications.length + ' Clasif. Asignadas (' + getSumClassifications(item) + '/' + (item.maxPlayers || 25) + ')') : '+ Configurar Clasificaciones' }}</span>
                          </button>
                          <div v-if="item.classifications && item.classifications.length" class="d-flex flex-wrap gap-1 mt-1">
                            <span
                              v-for="(c, cidx) in item.classifications"
                              :key="cidx"
                              class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1"
                            >
                              {{ c.playerClassification?.description || getPlayerClassificationDescById(c.playerClassificationId) }}: <strong>{{ c.maxPlayers }}</strong>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td class="text-end">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger rounded-circle p-1"
                          @click="removeCategoryFromEditionDetail(idx)"
                          title="Quitar categoría de esta edición"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="editionCategoriesDetail.length === 0">
                      <td colspan="7" class="text-center py-4 text-muted">
                        <iconify-icon icon="solar:info-circle-line-duotone" class="fs-3 d-block mb-1 text-secondary"></iconify-icon>
                        Aún no se han agregado categorías al detalle de esta edición de torneo.
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
                  <div :class="isExprofessionalSelected || isJuvenileSelected ? 'col-md-5' : 'col-md-6'">
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
                  <div v-if="isExprofessionalSelected" class="col-md-4">
                    <label class="form-label small fw-semibold text-warning d-flex align-items-center gap-1">
                      <iconify-icon icon="solar:clock-circle-bold"></iconify-icon>
                      <span>Inactividad Fútbol Profesional <span class="text-danger">*</span></span>
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
                      <span class="input-group-text">meses máx.</span>
                    </div>
                  </div>

                  <!-- Campo extra para Juvenil: Cantidad máxima de meses -->
                  <div v-if="isJuvenileSelected" class="col-md-4">
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
                        placeholder="Ej. 240"
                        required
                      />
                      <span class="input-group-text">meses</span>
                    </div>
                  </div>

                  <div :class="isExprofessionalSelected || isJuvenileSelected ? 'col-md-12 text-end' : 'col-md-2'">
                    <button
                      type="submit"
                      class="btn btn-primary btn-sm rounded-pill fw-semibold px-4 d-inline-flex align-items-center justify-content-center gap-1"
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CampeonatoApi, uploadTeamLogo, uploadPlayerPhoto, TeamManagementsService, type TeamManagementItem } from '@/services/campeonato.service';
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
      { key: 'color1', label: 'Color Principal', type: 'color', colClass: 'col-md-4', placeholder: '#FFFFFF' },
      { key: 'color2', label: 'Color Secundario', type: 'color', colClass: 'col-md-4', placeholder: '#000000' },
      { key: 'colorAlternate', label: 'Uniforme Alterno', type: 'color', colClass: 'col-md-4', placeholder: '#1E40AF' },
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
      { key: 'playerClassification.description', label: 'Clasificación' },
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
      { key: 'playerClassificationId', label: 'Clasificación de Futbolista (Predeterminada)', type: 'select', colClass: 'col-md-6', options: [] },
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
    label: 'Ediciones de Torneo',
    icon: 'solar:calendar-date-bold-duotone',
    api: CampeonatoApi.categoryEditions,
    columns: [
      { key: 'name', label: 'Nombre / Descripción Edición' },
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
      { key: 'categoryEditionId', label: 'Edición de Categoría', type: 'select', colClass: 'col-md-6', options: [] },
      { key: 'stageOrder', label: 'Orden de Etapa', type: 'number', colClass: 'col-md-6' },
      {
        key: 'format',
        label: 'Formato',
        type: 'select',
        options: [
          { label: 'Todos contra Todos', value: 'EVERYONE_AGAINST_EVERYONE' },
          { label: 'Eliminación Directa', value: 'DIRECT_ELIMINATION' },
          { label: 'Doble Eliminación', value: 'DOUBLE_ELIMINATION' },
        ],
        colClass: 'col-md-6',
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
    'playerClassifications',
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
  { id: 'playerClassifications', label: 'Clasificación Futbolistas', icon: 'solar:user-check-bold-duotone' },
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
  FRI: { enabled: true, startTime: '19:00', endTime: '21:00' }, // Ejemplo: viernes 7pm a 9pm
  SAT: { enabled: true, startTime: '08:00', endTime: '22:00' }, // Ejemplo: sábado 8am a 10pm
  SUN: { enabled: true, startTime: '08:00', endTime: '16:00' }, // Ejemplo: domingo 8am a 4pm
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
  intervalMinutes: 10,
  selectedScenaryIds: [] as string[],
});

const weekDaysList: Array<{ key: WeekDayKey; label: string }> = [
  { key: 'MON', label: 'Lunes' },
  { key: 'TUE', label: 'Martes' },
  { key: 'WED', label: 'Miércoles' },
  { key: 'THU', label: 'Jueves' },
  { key: 'FRI', label: 'Viernes' },
  { key: 'SAT', label: 'Sábado' },
  { key: 'SUN', label: 'Domingo' },
];

const setQuickDays = (mode: 'weekend_fri' | 'weekend_std' | 'weekdays' | 'all' | 'none') => {
  const current = scheduleConfig.value.dailySchedules;
  weekDaysList.forEach((d) => {
    const item = current[d.key];
    if (!item) return;
    if (mode === 'weekend_fri') {
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

const getDayCalculation = (dayKey: WeekDayKey | string) => {
  const dayConf = scheduleConfig.value.dailySchedules[dayKey as WeekDayKey];
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

  const courtsCount =
    scheduleConfig.value.selectedScenaryIds.length || (scenariesList.value.length || 1);

  let totalMinutesWeek = 0;
  let activeDaysCount = 0;
  let totalMatchesPerWeek = 0;

  const breakdown: Array<{
    key: string;
    label: string;
    startTime: string;
    endTime: string;
    hours: string;
    matchesPerCourt: number;
    matchesAllCourts: number;
  }> = [];

  for (const day of weekDaysList) {
    const dayConf = scheduleConfig.value.dailySchedules[day.key];
    if (dayConf && dayConf.enabled) {
      activeDaysCount++;
      const calc = getDayCalculation(day.key);
      totalMinutesWeek += calc.minutes;
      const dayMatchesAllCourts = calc.matchesPerCourt * courtsCount;
      totalMatchesPerWeek += dayMatchesAllCourts;

      breakdown.push({
        key: day.key,
        label: day.label,
        startTime: dayConf.startTime,
        endTime: dayConf.endTime,
        hours: calc.hours,
        matchesPerCourt: calc.matchesPerCourt,
        matchesAllCourts: dayMatchesAllCourts,
      });
    }
  }

  const totalHoursWeek = (totalMinutesWeek / 60).toFixed(1);

  return {
    slotMinutes,
    activeDaysCount,
    courtsCount,
    totalHoursWeek,
    totalMatchesPerWeek,
    breakdown,
  };
});

const saveScheduleConfig = () => {
  savingSchedule.value = true;
  try {
    const companyId = getActiveCompanyId();
    localStorage.setItem(`deskounta_camp_schedules_${companyId}`, JSON.stringify(scheduleConfig.value));
    toast.success('Horarios específicos por día guardados exitosamente');
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
      if (parsed.dailySchedules) {
        // Asegurar que todos los días existan
        scheduleConfig.value.dailySchedules = {
          ...defaultDailySchedules(),
          ...parsed.dailySchedules,
        };
      } else if (parsed.gameDays && Array.isArray(parsed.gameDays)) {
        // Migración de formato legado
        const migrated = defaultDailySchedules();
        weekDaysList.forEach((d) => {
          migrated[d.key] = {
            enabled: parsed.gameDays.includes(d.key),
            startTime: parsed.startTime || '08:00',
            endTime: parsed.endTime || '18:00',
          };
        });
        scheduleConfig.value.dailySchedules = migrated;
      }

      if (parsed.matchDurationMinutes) {
        scheduleConfig.value.matchDurationMinutes = parsed.matchDurationMinutes;
      }
      if (parsed.intervalMinutes !== undefined) {
        scheduleConfig.value.intervalMinutes = parsed.intervalMinutes;
      }
      if (parsed.selectedScenaryIds && Array.isArray(parsed.selectedScenaryIds)) {
        scheduleConfig.value.selectedScenaryIds = parsed.selectedScenaryIds;
      }
      if (parsed.editionId) {
        scheduleConfig.value.editionId = parsed.editionId;
      }
    }
    if (scheduleConfig.value.selectedScenaryIds.length === 0 && scenariesList.value.length > 0) {
      scheduleConfig.value.selectedScenaryIds = scenariesList.value.map((s) => s.id);
    }
    if (!scheduleConfig.value.editionId && categoryEditionsList.value.length > 0) {
      scheduleConfig.value.editionId = categoryEditionsList.value[0].id;
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
  positions: 'SUB-CAMP-014',
  demarcations: 'SUB-CAMP-015',
  schedules: 'SUB-CAMP-016',
  standings: 'SUB-CAMP-017',
  playerClassifications: 'SUB-CAMP-019',
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

const addCategoryToEditionDetail = () => {
  if (!editionDetailInput.value.categoryId) {
    toast.warning('Debe seleccionar una categoría');
    return;
  }
  const catName = getCategoryNameById(editionDetailInput.value.categoryId);
  const exists = editionCategoriesDetail.value.some((c) => c.categoryId === editionDetailInput.value.categoryId);
  if (exists) {
    toast.warning(`La categoría "${catName}" ya se encuentra agregada al detalle`);
    return;
  }
  const maxPl = Number(editionDetailInput.value.maxPlayers) > 0 ? Number(editionDetailInput.value.maxPlayers) : 25;
  editionCategoriesDetail.value.push({
    categoryId: editionDetailInput.value.categoryId,
    categoryDescription: catName,
    startDate: editionDetailInput.value.startDate || undefined,
    endDate: editionDetailInput.value.endDate || undefined,
    registrationFee: Number(editionDetailInput.value.registrationFee) || 0,
    maxPlayers: maxPl,
    classifications: [],
  });
  editionDetailInput.value = {
    categoryId: '',
    startDate: '',
    endDate: '',
    registrationFee: 0,
    maxPlayers: 25,
  };
  toast.success(`Categoría "${catName}" agregada al detalle`);
};

const removeCategoryFromEditionDetail = (index: number) => {
  editionCategoriesDetail.value.splice(index, 1);
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

  // Opciones para Etapas (Edición)
  const stTab = tabs.find((t) => t.id === 'stages');
  const stEdField = stTab?.fields.find((f) => f.key === 'categoryEditionId');
  if (stEdField) {
    stEdField.options = categoryEditionsList.value.map((e) => ({
      label: `${e.name} - ${e.category?.name || 'Categoría'}`,
      value: e.id,
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
};

const loadAuxiliaryTournamentData = async () => {
  try {
    const [stRes, tmRes, scRes, dmRes, plRes, edRes, trRes, pcRes, catRes] = await Promise.all([
      CampeonatoApi.stages.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teams.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.scenaries.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.demarcations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.players.list({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categoryEditions.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teamRegistrations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.playerClassifications.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categories.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
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
  if (activeTab.value === 'categoryEditions') {
    formData.value = { status: 'IN_PROGRESS' };
    editionCategoriesDetail.value = [];
    editionDetailInput.value = { categoryId: '', startDate: '', endDate: '', registrationFee: 0, maxPlayers: 25 };
  } else if (activeTab.value === 'playerClassifications') {
    formData.value = { isActive: true };
  }
  isFormOpen.value = true;
  showModal.value = true;
  loadAuxiliaryTournamentData();
};

const openEditForm = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  if (activeTab.value === 'categoryEditions') {
    formData.value.status = formData.value.status || 'IN_PROGRESS';
    editionCategoriesDetail.value = item.categoriesDetail ? JSON.parse(JSON.stringify(item.categoriesDetail)) : [];
    editionDetailInput.value = { categoryId: '', startDate: '', endDate: '', registrationFee: 0, maxPlayers: 25 };
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
  isEditing.value = false;
  editingId.value = null;
  editionCategoriesDetail.value = [];
  editionDetailInput.value = { categoryId: '', startDate: '', endDate: '', registrationFee: 0, maxPlayers: 25 };
};

const openCreateModal = openCreateForm;
const openEditModal = openEditForm;
const closeModal = closeForm;

const saveForm = async () => {
  try {
    saving.value = true;
    if (activeTab.value === 'categoryEditions') {
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
      formData.value.categoriesDetail = editionCategoriesDetail.value.map((d) => ({
        categoryId: d.categoryId,
        categoryDescription: d.categoryDescription || getCategoryNameById(d.categoryId),
        startDate: d.startDate || undefined,
        endDate: d.endDate || undefined,
        registrationFee: Number(d.registrationFee) || 0,
        maxPlayers: Number(d.maxPlayers) > 0 ? Number(d.maxPlayers) : 25,
        classifications: (d.classifications || []).map((c: any) => ({
          playerClassificationId: c.playerClassificationId,
          maxPlayers: Number(c.maxPlayers) || 0,
        })),
      }));
    } else if (activeTab.value === 'playerClassifications' && formData.value.isActive === undefined) {
      formData.value.isActive = true;
    }
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
  clasificaciones: 'playerClassifications',
  'clasificacion-futbolistas': 'playerClassifications',
  playerClassifications: 'playerClassifications',
  'player-classifications': 'playerClassifications',
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
