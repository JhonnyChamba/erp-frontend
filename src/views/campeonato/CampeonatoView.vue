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
          {{ isConfigSection ? 'Parametrización general del torneo: categorías, canchas, árbitros y vocales.' : `Gestión y administración de ${activeTabLabel.toLowerCase()} en el torneo deportivo.` }}
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

        <!-- Se oculta mientras el formulario está abierto; en Inscripción y Carnets no hay botón Nuevo porque se alimenta de Inscripción de Equipos -->
        <button
          v-if="activeTab !== 'standings' && activeTab !== 'playerRegistrations' && !isPaymentOrdersView && !isFormOpen"
          class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
          style="height: 40px;"
          @click="activeTab === 'schedules' ? openCreateSchedule() : openCreateForm()"
        >
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>{{ (isConfigSection || activeTab === 'teams' || activeTab === 'players' || activeTab === 'categories' || activeTab === 'teamRegistrations') ? 'Nuevo' : ('+ Nuevo ' + activeTabLabel) }}</span>
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
    <!-- 2. FILTROS Y BÚSQUEDA                      -->
    <!-- ========================================== -->
    <!-- Barra de Filtros y Búsqueda Estandarizada para Equipos -->
    <div v-if="!isFormOpen && activeTab === 'teams'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <select
        v-model="filterTeamStatus"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 160px;"
        @change="searchList"
      >
        <option value="todos">Estado: Todos</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 320px;"
        placeholder="Buscar por nombre, siglas o ciudad..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Jugadores -->
    <div v-else-if="!isFormOpen && activeTab === 'players'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <select
        v-model="filterPlayerStatus"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 160px;"
        @change="searchList"
      >
        <option value="todos">Estado: Todos</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 320px;"
        placeholder="Buscar por cédula, nombre o código..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Categorías -->
    <div v-else-if="!isFormOpen && activeTab === 'categories'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 320px;"
        placeholder="Buscar por nombre, siglas o código..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Ediciones de Torneo -->
    <div v-else-if="!isFormOpen && activeTab === 'categoryEditions'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <select
        v-model="filterEditionStatus"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 175px;"
        @change="searchList"
      >
        <option value="todos">Estado: Todos</option>
        <option value="PENDING">Pendiente de Inicio</option>
        <option value="IN_PROGRESS">En Curso</option>
        <option value="COMPLETED">Finalizado</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 320px;"
        placeholder="Buscar por nombre de edición o categoría..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Inscripción de Equipos -->
    <div v-else-if="!isFormOpen && activeTab === 'teamRegistrations'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <select
        v-model="filterTeamRegStatus"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 185px;"
        @change="searchList"
      >
        <option value="todos">Inscripción: Todas</option>
        <option value="APPROVED">Aprobado / Habilitado</option>
        <option value="PENDING">Pendiente</option>
        <option value="REJECTED">Rechazado</option>
        <option value="DISQUALIFIED">Descalificado</option>
      </select>

      <select
        v-model="filterTeamRegPayment"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 175px;"
        @change="searchList"
      >
        <option value="todos">Pago: Todos</option>
        <option value="PAID">Pagado Completo</option>
        <option value="PARTIAL">Pago Parcial</option>
        <option value="UNPAID">Pendiente de Pago</option>
        <option value="REFUNDED">Reembolsado</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 290px;"
        placeholder="Buscar por equipo, edición o grupo..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Inscripción y Carnets -->
    <div v-else-if="!isFormOpen && activeTab === 'playerRegistrations'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <select
        v-model="filterPlayerRegEditionId"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 250px;"
        @change="searchList"
      >
        <option value="todos">Edición: Todas las Ediciones</option>
        <option v-for="ed in categoryEditionsList" :key="ed.id" :value="String(ed.id)">
          {{ ed.name }}
        </option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 320px;"
        placeholder="Buscar por equipo, siglas, edición o categoría..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Transferencias de Jugadores -->
    <div v-else-if="!isFormOpen && activeTab === 'playerTransfers'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <select
        v-model="filterTransferEditionId"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 230px;"
        @change="onTransferEditionFilterChange"
      >
        <option value="todos">Edición: Todas las Ediciones</option>
        <option v-for="ed in categoryEditionsList" :key="ed.id" :value="String(ed.id)">
          {{ ed.name }}
        </option>
      </select>

      <select
        v-model="filterTransferCategoryId"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 200px;"
        :disabled="transferFilterCategories.length === 0"
        @change="searchList"
      >
        <option value="todos">Categoría: Todas</option>
        <option v-for="cat in transferFilterCategories" :key="cat.id" :value="String(cat.id)">
          {{ cat.name }}
        </option>
      </select>

      <select
        v-model="filterTransferStatus"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 185px;"
        @change="searchList"
      >
        <option value="todos">Estado: Todos</option>
        <option value="PENDING_APPROVAL">Pendiente de Firmas</option>
        <option value="APPROVED">Aprobada (Lista)</option>
        <option value="EXECUTED">Pase Ejecutado</option>
        <option value="REJECTED">Rechazada</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 280px;"
        placeholder="Buscar por futbolista o club..."
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda Estandarizada para Pagos y Finanzas -->
    <div v-else-if="!isFormOpen && activeTab === 'payments'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <div class="btn-group" role="group">
        <button
          type="button"
          class="btn d-flex align-items-center gap-1 px-3"
          :class="paymentsView === 'orders' ? 'btn-primary' : 'btn-outline-primary bg-dark'"
          style="height: 40px;"
          @click="setPaymentsView('orders')"
        >
          <iconify-icon icon="solar:document-text-bold-duotone" class="fs-5"></iconify-icon>
          <span>Órdenes de Pago</span>
        </button>
        <button
          type="button"
          class="btn d-flex align-items-center gap-1 px-3"
          :class="paymentsView === 'payments' ? 'btn-primary' : 'btn-outline-primary bg-dark'"
          style="height: 40px;"
          @click="setPaymentsView('payments')"
        >
          <iconify-icon icon="solar:wallet-money-bold-duotone" class="fs-5"></iconify-icon>
          <span>Pagos Registrados</span>
        </button>
      </div>

      <select
        v-if="paymentsView === 'orders'"
        v-model="filterPaymentOrderStatus"
        class="form-select bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 185px;"
        @change="searchList"
      >
        <option value="todos">Estado: Todos</option>
        <option value="PENDING">Pendiente de Pago</option>
        <option value="PAID">Pagada</option>
        <option value="CANCELLED">Anulada</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 300px;"
        :placeholder="paymentsView === 'orders' ? 'Buscar por equipo o edición...' : 'Buscar por recibo, notas o equipo...'"
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <div v-else-if="!isFormOpen && activeTab !== 'standings'" class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control bg-dark border-secondary-subtle text-white"
        style="height: 40px; width: 320px;"
        :placeholder="'Buscar en ' + activeTabLabel + '...'"
        @keyup.enter="searchList"
      />

      <button
        type="button"
        class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
        style="height: 40px;"
        :disabled="loading"
        @click="searchList"
      >
        <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
        <span>Buscar</span>
      </button>
    </div>

    <!-- ============================================================== -->
    <!-- 2.5 LISTADO DE REGLAMENTOS DE DÍAS Y HORARIOS (ESTILO VENTAS)   -->
    <!-- ============================================================== -->
    <div v-if="!isFormOpen && activeTab === 'schedules'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card crud-table-card">
      <!-- Vista Desktop: Tabla tradicional -->
      <div class="table-responsive d-none d-md-block">
        <table class="table table-hover align-middle mb-0 crud-table app-table">
          <thead class="table-primary">
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

      <!-- Vista Móvil / Tablet: Tarjetas CRUD -->
      <div class="d-block d-md-none p-2">
        <div v-if="schedulesListFiltered.length === 0" class="text-center py-4 text-secondary">
          <iconify-icon icon="solar:clock-circle-bold-duotone" class="fs-1 text-secondary mb-2 d-block"></iconify-icon>
          <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron reglamentos de días y horarios</p>
          <p class="mb-0 fs-2 text-muted">Haz clic en <strong>+ Nuevo {{ activeTabLabel }}</strong> para registrar la programación de una edición.</p>
        </div>
        <div v-else class="crud-mobile-cards-view">
          <div v-for="(item, idx) in schedulesListFiltered" :key="'m-sch-' + (item.editionId || idx)" class="crud-mobile-card">
            <div class="crud-mobile-card-header">
              <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                <div class="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
                  <iconify-icon icon="solar:clock-circle-bold-duotone" class="fs-2 text-primary"></iconify-icon>
                </div>
                <div class="min-w-0 flex-grow-1">
                  <div class="d-flex align-items-center gap-1.5 mb-0.5">
                    <span class="badge bg-secondary-subtle text-body-secondary font-monospace fw-bold" style="font-size: 0.65rem;">
                      #{{ idx + 1 }}
                    </span>
                    <span class="text-uppercase fw-bold text-secondary font-monospace" style="font-size: 0.62rem; letter-spacing: 0.05em;">
                      Horarios
                    </span>
                  </div>
                  <div class="fw-bold text-body-emphasis fs-3 text-truncate">{{ item.editionName }}</div>
                  <div class="text-muted fs-1 text-truncate">{{ item.categoryName }}</div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-primary text-white font-monospace">
                  ⚽ {{ item.totalMatchesWeek }} p/s
                </span>
                <div class="dropdown">
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
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" type="button" @click="openEditSchedule(item)">
                        <iconify-icon icon="solar:pen-bold" class="text-primary fs-5"></iconify-icon>
                        <span>Editar Horarios</span>
                      </button>
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2 text-danger" type="button" @click="deleteSchedule(item)">
                        <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                        <span>Eliminar Horarios</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="crud-mobile-card-grid">
              <div class="crud-mobile-field">
                <span class="crud-mobile-field-label">Canchas</span>
                <div class="d-flex flex-wrap gap-1">
                  <span v-for="cName in item.courtNames" :key="cName" class="badge bg-secondary-subtle text-secondary small">
                    📍 {{ cName }}
                  </span>
                  <span v-if="item.courtNames.length === 0" class="text-muted small">Sin canchas</span>
                </div>
              </div>
              <div class="crud-mobile-field">
                <span class="crud-mobile-field-label">Días Habilitados</span>
                <div class="d-flex flex-wrap gap-1">
                  <span v-for="d in item.activeDayLabels" :key="d" class="badge bg-success-subtle text-success small font-monospace">
                    {{ d }}
                  </span>
                  <span v-if="item.activeDayLabels.length === 0" class="text-muted small">Sin días</span>
                </div>
              </div>
              <div class="crud-mobile-field">
                <span class="crud-mobile-field-label">Tiempos</span>
                <span class="crud-mobile-field-value font-monospace text-info small">{{ item.slotMinutes }}m ({{ item.matchDuration }}m + {{ item.intervalMinutes }}m)</span>
              </div>
              <div class="crud-mobile-field">
                <span class="crud-mobile-field-label">Estado</span>
                <span class="crud-mobile-field-value"><span class="badge bg-success-subtle text-success">Activo</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3. TABLA DE POSICIONES Y GOLEADORES        -->
    <!-- ========================================== -->
    <div v-else-if="!isFormOpen && activeTab === 'standings'" class="row g-3">
      <!-- 4 TARJETAS KPI DE RESUMEN (Inspiradas en soccerAdminEC) -->
      <div class="col-12">
        <div class="row g-3">
          <!-- 1. Líder / Puntero -->
          <div class="col-6 col-lg-3">
            <div class="stat-kpi-card">
              <div class="p-2 rounded-3 bg-warning-subtle text-warning d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
                <iconify-icon icon="solar:cup-star-bold" class="fs-3 text-warning"></iconify-icon>
              </div>
              <div class="min-w-0 flex-grow-1">
                <span class="text-uppercase fw-semibold text-muted d-block text-truncate" style="font-size: 0.72rem; letter-spacing: 0.5px;">Puntero / Líder</span>
                <span class="fw-bold text-body-emphasis d-block text-truncate fs-5">{{ standingsLeader ? standingsLeader.teamName : 'Sin disputar' }}</span>
                <small class="text-warning fw-semibold font-monospace" style="font-size: 0.75rem;">
                  {{ standingsLeader ? `${standingsLeader.pts} pts (GD: ${standingsLeader.gd > 0 ? '+' + standingsLeader.gd : standingsLeader.gd})` : '0 pts' }}
                </small>
              </div>
            </div>
          </div>

          <!-- 2. Partidos Jugados -->
          <div class="col-6 col-lg-3">
            <div class="stat-kpi-card">
              <div class="p-2 rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
                <iconify-icon icon="solar:football-bold" class="fs-3 text-primary"></iconify-icon>
              </div>
              <div class="min-w-0 flex-grow-1">
                <span class="text-uppercase fw-semibold text-muted d-block text-truncate" style="font-size: 0.72rem; letter-spacing: 0.5px;">Partidos Jugados</span>
                <span class="fw-bold text-body-emphasis d-block fs-4 font-monospace">{{ totalStandingsMatches }}</span>
                <small class="text-muted" style="font-size: 0.75rem;">{{ standingsList.length }} clubes activos</small>
              </div>
            </div>
          </div>

          <!-- 3. Goles Totales -->
          <div class="col-6 col-lg-3">
            <div class="stat-kpi-card">
              <div class="p-2 rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
                <iconify-icon icon="solar:target-bold-duotone" class="fs-3 text-success"></iconify-icon>
              </div>
              <div class="min-w-0 flex-grow-1">
                <span class="text-uppercase fw-semibold text-muted d-block text-truncate" style="font-size: 0.72rem; letter-spacing: 0.5px;">Goles Totales</span>
                <span class="fw-bold text-success d-block fs-4 font-monospace">{{ totalStandingsGoals }}</span>
                <small class="text-muted" style="font-size: 0.75rem;">En esta etapa</small>
              </div>
            </div>
          </div>

          <!-- 4. Promedio de Gol -->
          <div class="col-6 col-lg-3">
            <div class="stat-kpi-card">
              <div class="p-2 rounded-3 bg-info-subtle text-info d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
                <iconify-icon icon="solar:chart-2-bold-duotone" class="fs-3 text-info"></iconify-icon>
              </div>
              <div class="min-w-0 flex-grow-1">
                <span class="text-uppercase fw-semibold text-muted d-block text-truncate" style="font-size: 0.72rem; letter-spacing: 0.5px;">Promedio de Gol</span>
                <span class="fw-bold text-info d-block fs-4 font-monospace">{{ standingsGoalsAverage }}</span>
                <small class="text-muted" style="font-size: 0.75rem;">Goles por encuentro</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Clasificación -->
      <div class="col-lg-8">
        <div class="crud-table-card p-3">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:ranking-bold-duotone" class="fs-4 text-warning"></iconify-icon>
              <h5 class="mb-0 fw-bold text-body-emphasis">Tabla General de Clasificación</h5>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- Tabs de Local / Visitante estilo soccerAdminEC -->
              <div class="btn-group btn-group-sm p-1 rounded-pill bg-body-tertiary border" role="group">
                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold"
                  :class="standingsViewScope === 'general' ? 'btn-primary' : 'btn-link text-body text-decoration-none'"
                  @click="standingsViewScope = 'general'"
                >
                  General
                </button>
                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold"
                  :class="standingsViewScope === 'home' ? 'btn-primary' : 'btn-link text-body text-decoration-none'"
                  @click="standingsViewScope = 'home'"
                >
                  Local
                </button>
                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold"
                  :class="standingsViewScope === 'away' ? 'btn-primary' : 'btn-link text-body text-decoration-none'"
                  @click="standingsViewScope = 'away'"
                >
                  Visita
                </button>
              </div>

              <div class="d-flex align-items-center gap-1">
                <label class="small text-muted fw-semibold">Etapa:</label>
                <select v-model="selectedStageId" class="form-select form-select-sm w-auto" @change="loadStandings">
                  <option value="">Todas las etapas</option>
                  <option v-for="s in stagesList" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="crud-table app-table">
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
                  <th class="text-center" style="width: 80px;" title="Forma reciente">FORMA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingStandings">
                  <td colspan="11" class="text-center py-4 text-secondary">
                    <span class="spinner-border spinner-border-sm me-2"></span> Calculando posiciones del campeonato...
                  </td>
                </tr>
                <tr v-else-if="standingsList.length === 0">
                  <td colspan="11" class="text-center py-4 text-secondary">
                    No hay partidos finalizados para calcular la tabla de posiciones de esta etapa.
                  </td>
                </tr>
                <tr
                  v-for="(row, idx) in standingsList"
                  :key="row.teamId"
                  :class="[
                    idx < 4 ? 'border-start border-4 border-success' : (idx >= standingsList.length - 2 && standingsList.length > 4 ? 'border-start border-4 border-danger' : '')
                  ]"
                >
                  <td class="fw-bold font-monospace">
                    <span v-if="idx === 0" class="badge bg-warning text-dark">1° 🏆</span>
                    <span v-else-if="idx === 1" class="badge bg-secondary text-white">2° 🥈</span>
                    <span v-else-if="idx === 2" class="badge bg-warning-subtle text-warning border">3° 🥉</span>
                    <span v-else-if="idx < 4" class="badge bg-info-subtle text-info border">{{ idx + 1 }}°</span>
                    <span v-else class="text-muted">{{ idx + 1 }}°</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img v-if="row.logoUrl" :src="row.logoUrl" class="rounded-circle shadow-xs" style="width: 26px; height: 26px; object-fit: cover;" />
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
                  <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <span
                        v-if="row.pg > 0"
                        class="form-badge-w"
                        title="Victoria reciente"
                      >G</span>
                      <span
                        v-if="row.pe > 0"
                        class="form-badge-d"
                        title="Empate reciente"
                      >E</span>
                      <span
                        v-if="row.pp > 0"
                        class="form-badge-l"
                        title="Derrota reciente"
                      >P</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Leyenda de Zonas estilo soccerAdminEC -->
          <div class="d-flex align-items-center gap-3 pt-2 mt-2 border-top small text-muted flex-wrap">
            <span class="d-flex align-items-center gap-1">
              <span class="border-start border-4 border-success d-inline-block ps-1" style="height: 12px;"></span>
              <span>Puestos 1-4: Clasificación / Playoffs</span>
            </span>
            <span class="d-flex align-items-center gap-1">
              <span class="border-start border-4 border-danger d-inline-block ps-1" style="height: 12px;"></span>
              <span>Últimos puestos: Zona de Descenso</span>
            </span>
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
            <table class="crud-table app-table">
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
    <div v-else-if="!isFormOpen" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card crud-table-card">
      <!-- 4.A VISTA ESCRITORIO Y TABLET: TABLA DE DATOS (PANTALLAS >= 768px) -->
      <div class="table-responsive d-none d-md-block">
        <table class="table table-hover align-middle mb-0 crud-table app-table">
          <thead class="table-primary">
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

            <tr v-else-if="displayedItems.length === 0">
              <td :colspan="columns.length + 2" class="text-center py-5 text-secondary">
                <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
                <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron registros en {{ activeTabLabel }}</p>
                <p class="mb-0 fs-2 text-muted">
            <template v-if="isPaymentOrdersView">Las órdenes de pago se generan al inscribir equipos en una edición.</template>
            <template v-else>Haz clic en <strong>+ Nuevo {{ activeTabLabel }}</strong> para registrar el primero.</template>
          </p>
              </td>
            </tr>

            <tr v-for="(item, idx) in displayedItems" :key="item.id || idx">
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

                <!-- Partidos: Equipo Local con Escudo -->
                <div v-else-if="activeTab === 'matches' && col.key === 'localTeam.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.localTeam?.logo"
                    :src="item.localTeam.logo"
                    class="rounded-circle shadow-xs border"
                    style="width: 26px; height: 26px; object-fit: cover;"
                  />
                  <iconify-icon v-else icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                  <span class="text-body-emphasis fw-bold">{{ item.localTeam?.name || item.localTeam?.shortName || '-' }}</span>
                </div>

                <!-- Partidos: Marcador Goles Local vs Visita -->
                <span v-else-if="activeTab === 'matches' && (col.key === 'homeGoals' || col.key === 'awayGoals')">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-3">
                    {{ item[col.key] !== null && item[col.key] !== undefined ? item[col.key] : '-' }}
                  </span>
                </span>

                <!-- Partidos: Equipo Visita con Escudo -->
                <div v-else-if="activeTab === 'matches' && col.key === 'awayTeam.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.awayTeam?.logo"
                    :src="item.awayTeam.logo"
                    class="rounded-circle shadow-xs border"
                    style="width: 26px; height: 26px; object-fit: cover;"
                  />
                  <iconify-icon v-else icon="solar:shield-bold-duotone" class="fs-5 text-info"></iconify-icon>
                  <span class="text-body-emphasis fw-bold">{{ item.awayTeam?.name || item.awayTeam?.shortName || '-' }}</span>
                </div>

                <!-- Partidos: Estado del Encuentro -->
                <span v-else-if="activeTab === 'matches' && col.key === 'status'">
                  <span
                    v-if="item.status === 'PLAYED' || item.status === 'FINISHED'"
                    class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1"
                  >
                    🟢 Finalizado
                  </span>
                  <span
                    v-else-if="item.status === 'IN_PROGRESS'"
                    class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1 animate-pulse"
                  >
                    ⚽ En Juego
                  </span>
                  <span
                    v-else-if="item.status === 'POSTPONED'"
                    class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace px-2 py-1"
                  >
                    ⏸️ Pospuesto
                  </span>
                  <span
                    v-else
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                  >
                    ⏳ Programado
                  </span>
                </span>

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

                <!-- Inscripción de Equipos: botón que abre el modal de categorías / equipos de la edición -->
                <button
                  v-else-if="activeTab === 'teamRegistrations' && (col.key === 'categoriesCount' || col.key === 'teamsCount')"
                  type="button"
                  class="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 border"
                  :class="col.key === 'categoriesCount' ? 'bg-info-subtle text-info border-info-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'"
                  @click="openTeamRegModal(col.key === 'categoriesCount' ? 'categories' : 'teams', item)"
                >
                  <iconify-icon :icon="col.key === 'categoriesCount' ? 'solar:medal-star-bold-duotone' : 'solar:shield-bold-duotone'" class="fs-6"></iconify-icon>
                  <span class="small fw-semibold">{{ item[col.key] }} {{ col.key === 'categoriesCount' ? 'Categoría(s)' : 'Equipo(s)' }}</span>
                  <iconify-icon icon="solar:eye-bold-duotone" class="fs-6"></iconify-icon>
                </button>

                <!-- Inscripción de Equipos: Edición del Torneo -->
                <span v-else-if="activeTab === 'teamRegistrations' && col.key === 'categoryEdition.name'">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    🏆 {{ item.categoryEdition?.name || '-' }}
                  </span>
                </span>

                <!-- Inscripción de Equipos: Categoría -->
                <span v-else-if="activeTab === 'teamRegistrations' && col.key === 'category.name'">
                  <span v-if="item.category?.name || getCategoryNameForTeamRegItem(item)" class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                    ⚽ {{ item.category?.name || getCategoryNameForTeamRegItem(item) }}
                  </span>
                  <span v-else class="text-muted small">-</span>
                </span>

                <!-- Inscripción de Equipos: Grupo / Serie -->
                <span v-else-if="activeTab === 'teamRegistrations' && col.key === 'groupName'">
                  <span v-if="item.groupName" class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                    {{ item.groupName }}
                  </span>
                  <span v-else class="text-muted small">-</span>
                </span>

                <!-- Inscripción de Equipos: Estado de Inscripción -->
                <span v-else-if="activeTab === 'teamRegistrations' && col.key === 'status'">
                  <span v-if="item.status === 'APPROVED'" class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">
                    🟢 Aprobado / Habilitado
                  </span>
                  <span v-else-if="item.status === 'PENDING'" class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1">
                    ⏳ Pendiente
                  </span>
                  <span v-else-if="item.status === 'REJECTED'" class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace px-2 py-1">
                    🔴 Rechazado
                  </span>
                  <span v-else-if="item.status === 'DISQUALIFIED' || item.status === 'WITHDRAWN'" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace px-2 py-1">
                    ⛔ Descalificado
                  </span>
                  <span v-else class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                    {{ item.status || '-' }}
                  </span>
                </span>

                <!-- Inscripción de Equipos: Estado de Pago -->
                <span v-else-if="activeTab === 'teamRegistrations' && col.key === 'paymentStatus'">
                  <span v-if="item.paymentStatus === 'PAID'" class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">
                    💳 Pagado Completo
                  </span>
                  <span v-else-if="item.paymentStatus === 'PARTIAL'" class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1">
                    💵 Pago Parcial
                  </span>
                  <span v-else-if="item.paymentStatus === 'UNPAID' || item.paymentStatus === 'PENDING'" class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace px-2 py-1">
                    ⏳ Pendiente de Pago
                  </span>
                  <span v-else-if="item.paymentStatus === 'REFUNDED' || item.paymentStatus === 'EXEMPT'" class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                    ↩️ Reembolsado
                  </span>
                  <span v-else class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                    {{ item.paymentStatus || '-' }}
                  </span>
                </span>

                <!-- Inscripción y Carnets: Cabecera del Equipo -->
                <div v-else-if="activeTab === 'playerRegistrations' && col.key === 'team.name'" class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.team?.logo"
                    :src="item.team.logo"
                    class="rounded-circle shadow-sm border border-secondary-subtle flex-shrink-0"
                    style="width: 30px; height: 30px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                    style="width: 30px; height: 30px;"
                  >
                    <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                  </div>
                  <div>
                    <span class="text-body-emphasis fw-bold d-block">{{ item.team?.name || '-' }}</span>
                    <span v-if="item.team?.acronyms" class="badge bg-secondary-subtle text-secondary font-monospace px-1.5 py-0 fs-1">
                      {{ item.team.acronyms }}
                    </span>
                  </div>
                </div>

                <!-- Inscripción y Carnets: Edición del Torneo -->
                <span v-else-if="activeTab === 'playerRegistrations' && col.key === 'categoryEdition.name'">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    🏆 {{ item.categoryEdition?.name || '-' }}
                  </span>
                </span>

                <!-- Inscripción y Carnets: Categorías Permitidas del Equipo -->
                <div v-else-if="activeTab === 'playerRegistrations' && col.key === 'categoriesSummary'" class="d-flex flex-wrap align-items-center gap-1.5">
                  <span
                    v-for="cat in (item.categories || [])"
                    :key="cat.teamRegistrationId || cat.categoryId"
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                  >
                    ⚽ {{ cat.categoryName }}
                    <span class="opacity-75">({{ cat.gender === 'FEMALE' ? 'Mujeres' : cat.gender === 'MIXED' ? 'Mixto' : 'Varones' }} · {{ cat.playersCount || 0 }}/{{ cat.maxPlayers || 25 }})</span>
                  </span>
                </div>

                <!-- Inscripción y Carnets: Total Jugadores Inscritos -->
                <span v-else-if="activeTab === 'playerRegistrations' && col.key === 'playersCount'">
                  <span
                    class="badge rounded-pill font-monospace px-3 py-1 border"
                    :class="(item.playersCount || 0) > 0 ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'"
                  >
                    👥 {{ item.playersCount || 0 }} Jugador(es)
                  </span>
                </span>

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

                <!-- Pagos y Finanzas: N° de orden de pago -->
                <span v-else-if="isPaymentOrdersView && col.key === 'orderNumber'">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    ORD-{{ String(item.id).padStart(6, '0') }}
                  </span>
                </span>

                <!-- Pagos y Finanzas: Equipo -->
                <span v-else-if="isPaymentOrdersView && col.key === 'teamName'" class="d-inline-flex align-items-center gap-2">
                  <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                  <span class="text-body-emphasis fw-semibold">{{ item.teamName || '-' }}</span>
                </span>

                <!-- Pagos y Finanzas: Edición -->
                <span v-else-if="isPaymentOrdersView && col.key === 'editionName'">
                  <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">🏆 {{ item.editionName || '-' }}</span>
                </span>

                <!-- Pagos y Finanzas: Categorías con su subtotal -->
                <div v-else-if="isPaymentOrdersView && col.key === 'categoriesSummary'" class="d-flex flex-wrap gap-1">
                  <span
                    v-for="d in (item.details || [])"
                    :key="d.id"
                    class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                  >
                    ⚽ {{ d.categoryName }} · ${{ Number(d.subtotal || 0).toFixed(2) }}
                  </span>
                  <span v-if="!item.details || item.details.length === 0" class="text-muted small">-</span>
                </div>

                <!-- Pagos y Finanzas: Valor total -->
                <span v-else-if="isPaymentOrdersView && col.key === 'totalAmount'" class="fw-bold font-monospace text-body-emphasis">
                  ${{ Number(item.totalAmount || 0).toFixed(2) }}
                </span>

                <!-- Pagos y Finanzas: Estado de la orden -->
                <span v-else-if="isPaymentOrdersView && col.key === 'status'">
                  <span v-if="item.status === 'PAID'" class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">🟢 Pagada</span>
                  <span v-else-if="item.status === 'CANCELLED'" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace px-2 py-1">⛔ Anulada</span>
                  <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1">⏳ Pendiente de Pago</span>
                </span>

                <!-- Transferencias: N° de Orden -->
                <span v-else-if="activeTab === 'playerTransfers' && col.key === 'orderNumber'">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    TRF-{{ String(item.id).padStart(6, '0') }}
                  </span>
                </span>

                <!-- Transferencias: Categoría -->
                <span v-else-if="activeTab === 'playerTransfers' && col.key === 'category.name'">
                  <span v-if="item.category?.name" class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                    ⚽ {{ item.category.name }}
                  </span>
                  <span v-else class="text-muted small">-</span>
                </span>

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
                      class="badge border px-2 py-1"
                      :class="det.startedAt ? 'bg-success-subtle text-success border-success-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'"
                      :title="(det.startedAt ? 'Campeonato iniciado' : 'Pendiente de inicio') + ' | Inicio: ' + (det.startDate ? new Date(det.startDate).toLocaleDateString() : 'N/A') + ' | Fin: ' + (det.endDate ? new Date(det.endDate).toLocaleDateString() : 'N/A')"
                    >
                      {{ det.startedAt ? '🟢' : '⚽' }} {{ det.categoryDescription || det.category?.name || 'Categoría' }}
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
                  <span v-if="item.status === 'COMPLETED'" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace px-2 py-1">🏁 Finalizado</span>
                  <span v-else-if="item.status === 'CANCELLED'" class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace px-2 py-1">❌ Cancelado</span>
                  <span v-else-if="item.startedAt" class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">🟢 En Curso</span>
                  <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1">⏳ Pendiente de Inicio</span>
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

                <!-- Badge para Código de Carnet (toma código de la ficha del jugador o carnetCode) -->
                <span v-else-if="col.key === 'carnetCode'">
                  <span class="badge bg-secondary-subtle text-body-emphasis font-monospace border px-2 py-1">
                    🪪 {{ item.carnetCode || item.player?.code || '-' }}
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
                    <!-- Pagos y Finanzas: detalle de la orden de pago -->
                    <li v-if="isPaymentOrdersView">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openPaymentOrderDetail(item)">
                        <iconify-icon icon="solar:document-text-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Ver Detalle de la Orden</span>
                      </a>
                    </li>

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

                    <!-- Inscripción y Carnets: Agregar / Configurar Plantilla por Categoría -->
                    <li v-if="activeTab === 'playerRegistrations'">
                      <a class="dropdown-item py-2 text-primary fw-semibold d-flex align-items-center gap-2" href="javascript:void(0)" @click="openEditForm(item)">
                        <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Agregar / Configurar Plantilla</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'playerRegistrations' && item.categories?.[0]?.teamRegistrationId">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openRosterForTeamReg(item.categories[0].teamRegistrationId)">
                        <iconify-icon icon="solar:clipboard-list-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Plantilla del Club</span>
                      </a>
                    </li>

                    <!-- Inscripción de equipos: ver categorías / equipos de la edición -->
                    <li v-if="activeTab === 'teamRegistrations'">
                      <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamRegModal('categories', item)">
                        <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Categorías</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'teamRegistrations'">
                      <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamRegModal('teams', item)">
                        <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Ver Equipos</span>
                      </a>
                    </li>
                    <li v-if="activeTab === 'teamRegistrations'"><hr class="dropdown-divider"></li>

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

                    <!-- Ediciones de Torneo: iniciar el campeonato por categoría (una sola vez cada una) -->
                    <template v-if="activeTab === 'categoryEditions' && pendingStartCategories(item).length">
                      <li v-for="det in pendingStartCategories(item)" :key="'start-' + (det.id || det.categoryId)">
                        <a class="dropdown-item py-2 text-success fw-semibold d-flex align-items-center gap-2" href="javascript:void(0)" @click="startEditionChampionship(item, det)">
                          <iconify-icon icon="solar:play-circle-bold-duotone" class="fs-5 text-success"></iconify-icon>
                          <span>Iniciar Campeonato: {{ det.categoryDescription || det.category?.name || 'Categoría' }}</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider"></li>
                    </template>

                    <!-- Editar (En playerRegistrations ya está Agregar / Configurar Plantilla arriba) -->
                    <li v-if="activeTab !== 'playerRegistrations' && activeTab !== 'playerTransfers' && !isPaymentOrdersView">
                      <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openEditForm(item)">
                        <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar</span>
                      </a>
                    </li>

                    <!-- Separador (las filas de teamRegistrations y playerRegistrations son cabeceras agrupadas) -->
                    <li v-if="activeTab !== 'teamRegistrations' && activeTab !== 'playerRegistrations' && activeTab !== 'playerTransfers' && !isPaymentOrdersView"><hr class="dropdown-divider"></li>

                    <!-- Eliminar -->
                    <li v-if="activeTab !== 'teamRegistrations' && activeTab !== 'playerRegistrations' && !isPaymentOrdersView">
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

        <div v-else-if="displayedItems.length === 0" class="text-center py-5 text-secondary card border rounded-4 p-4 bg-body-tertiary">
          <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
          <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron registros en {{ activeTabLabel }}</p>
          <p class="mb-0 fs-2 text-muted">
            <template v-if="isPaymentOrdersView">Las órdenes de pago se generan al inscribir equipos en una edición.</template>
            <template v-else>Haz clic en <strong>+ Nuevo {{ activeTabLabel }}</strong> para registrar el primero.</template>
          </p>
        </div>

        <div v-else class="crud-mobile-cards-view">
          <div
            v-for="(item, idx) in displayedItems"
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
                  v-else
                  class="rounded-3 bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 44px; height: 44px;"
                >
                  <iconify-icon
                    :icon="
                      activeTab === 'teams' ? 'solar:shield-bold-duotone' :
                      activeTab === 'players' ? 'solar:user-bold-duotone' :
                      activeTab === 'categories' ? 'solar:medal-star-bold-duotone' :
                      activeTab === 'categoryEditions' ? 'solar:calendar-date-bold-duotone' :
                      activeTab === 'stages' ? 'solar:diagram-up-bold-duotone' :
                      activeTab === 'scenaries' ? 'solar:map-point-wave-bold-duotone' :
                      activeTab === 'referees' ? 'solar:whistle-bold-duotone' :
                      activeTab === 'vocals' ? 'solar:notes-bold-duotone' :
                      activeTab === 'matches' ? 'solar:football-bold' :
                      (currentTabConfig.icon || 'solar:widget-4-bold-duotone')
                    "
                    class="fs-2 text-primary"
                  ></iconify-icon>
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
                    {{ item.name || item.fullName || (item.player ? item.player.name : '') || getNestedValue(item, columns[0]?.key || '') || '-' }}
                  </div>

                  <!-- Subtítulo complementario -->
                  <div v-if="activeTab === 'teams' && item.shortName" class="text-muted fs-1 text-truncate">
                    {{ item.shortName }}
                  </div>
                  <div v-else-if="activeTab === 'players' && (item.identification || item.documentNumber || item.idCard)" class="text-muted fs-1 font-monospace">
                    CI: {{ item.identification || item.documentNumber || item.idCard }}
                  </div>
                  <div v-else-if="activeTab === 'categories' && item.acronyms" class="text-muted fs-1 font-monospace">
                    Siglas: {{ item.acronyms }}
                  </div>
                  <div v-else-if="activeTab === 'categoryEditions' && item.category?.name" class="text-muted fs-1 text-truncate">
                    {{ item.category.name }}
                  </div>
                  <div v-else-if="activeTab === 'scenaries' && item.address" class="text-muted fs-1 text-truncate">
                    📍 {{ item.address }}
                  </div>
                  <div v-else-if="(activeTab === 'referees' || activeTab === 'vocals') && item.identification" class="text-muted fs-1 font-monospace">
                    Doc: {{ item.identification }}
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
                  <!-- Pagos y Finanzas: detalle de la orden de pago -->
                  <li v-if="isPaymentOrdersView">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openPaymentOrderDetail(item)">
                      <iconify-icon icon="solar:document-text-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Ver Detalle de la Orden</span>
                    </a>
                  </li>

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

                  <!-- Inscripción y Carnets en vista móvil -->
                  <li v-if="activeTab === 'playerRegistrations'">
                    <a class="dropdown-item py-2 text-primary fw-semibold d-flex align-items-center gap-2" href="javascript:void(0)" @click="openEditForm(item)">
                      <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Agregar / Configurar Plantilla</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'playerRegistrations' && item.categories?.[0]?.teamRegistrationId">
                    <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openRosterForTeamReg(item.categories[0].teamRegistrationId)">
                      <iconify-icon icon="solar:clipboard-list-bold-duotone" class="fs-5 text-info"></iconify-icon>
                      <span>Ver Plantilla del Club</span>
                    </a>
                  </li>

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

                  <li v-if="activeTab === 'teamRegistrations'">
                    <a class="dropdown-item py-2 text-info d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamRegModal('categories', item)">
                      <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-5 text-info"></iconify-icon>
                      <span>Ver Categorías</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'teamRegistrations'">
                    <a class="dropdown-item py-2 text-primary d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTeamRegModal('teams', item)">
                      <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                      <span>Ver Equipos</span>
                    </a>
                  </li>
                  <li v-if="activeTab === 'teamRegistrations'"><hr class="dropdown-divider"></li>

                  <!-- Ediciones de Torneo: iniciar el campeonato por categoría (una sola vez cada una) -->
                  <template v-if="activeTab === 'categoryEditions' && pendingStartCategories(item).length">
                    <li v-for="det in pendingStartCategories(item)" :key="'start-' + (det.id || det.categoryId)">
                      <a class="dropdown-item py-2 text-success fw-semibold d-flex align-items-center gap-2" href="javascript:void(0)" @click="startEditionChampionship(item, det)">
                        <iconify-icon icon="solar:play-circle-bold-duotone" class="fs-5 text-success"></iconify-icon>
                        <span>Iniciar Campeonato: {{ det.categoryDescription || det.category?.name || 'Categoría' }}</span>
                      </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                  </template>

                  <!-- Editar -->
                  <li v-if="activeTab !== 'playerRegistrations' && activeTab !== 'playerTransfers' && !isPaymentOrdersView">
                    <a class="dropdown-item py-2 text-warning d-flex align-items-center gap-2" href="javascript:void(0)" @click="openEditForm(item)">
                      <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5 text-warning"></iconify-icon>
                      <span>Editar</span>
                    </a>
                  </li>

                  <!-- Separador -->
                  <li v-if="activeTab !== 'teamRegistrations' && activeTab !== 'playerRegistrations' && activeTab !== 'playerTransfers' && !isPaymentOrdersView"><hr class="dropdown-divider"></li>

                  <!-- Eliminar -->
                  <li v-if="activeTab !== 'teamRegistrations' && activeTab !== 'playerRegistrations' && !isPaymentOrdersView">
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
                    <!-- Pagos y Finanzas: orden de pago -->
                    <span v-else-if="isPaymentOrdersView && col.key === 'orderNumber'" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                      ORD-{{ String(item.id).padStart(6, '0') }}
                    </span>
                    <span v-else-if="isPaymentOrdersView && col.key === 'categoriesSummary'">
                      {{ (item.details || []).map((d: any) => d.categoryName).join(', ') || '-' }}
                    </span>
                    <span v-else-if="isPaymentOrdersView && col.key === 'totalAmount'" class="fw-bold font-monospace">
                      ${{ Number(item.totalAmount || 0).toFixed(2) }}
                    </span>
                    <span v-else-if="isPaymentOrdersView && col.key === 'status'">
                      {{ item.status === 'PAID' ? '🟢 Pagada' : item.status === 'CANCELLED' ? '⛔ Anulada' : '⏳ Pendiente de Pago' }}
                    </span>
                    <!-- Transferencias: N° de Orden -->
                    <span v-else-if="activeTab === 'playerTransfers' && col.key === 'orderNumber'" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                      TRF-{{ String(item.id).padStart(6, '0') }}
                    </span>
                    <!-- Fechas -->
                    <span v-else-if="col.type === 'date'">
                      {{ item[col.key] ? new Date(item[col.key]).toLocaleDateString() : '-' }}
                    </span>
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
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <!-- CABECERA DEL FORMULARIO ESTANDARIZADA -->
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-4">
          <div class="d-flex align-items-center gap-3">
            <span class="p-2 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
              <iconify-icon :icon="isEditing ? 'solar:pen-new-square-line-duotone' : 'solar:add-circle-line-duotone'" class="fs-3"></iconify-icon>
            </span>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 fs-1 font-monospace">
                  MOD-010 · CAMPEONATO
                </span>
                <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-0.5 fs-1 font-monospace">
                  {{ isEditing ? 'MODIFICACIÓN' : 'REGISTRO' }}
                </span>
              </div>
              <h5 class="fw-bold mb-0 text-white">
                {{
                  activeTab === 'players'
                    ? (isEditing ? 'Modificar Jugador' : 'Nuevo Jugador')
                    : activeTab === 'teams'
                    ? (isEditing ? 'Modificar Equipo' : 'Nuevo Equipo')
                    : activeTab === 'categories'
                    ? (isEditing ? 'Modificar Categoría' : 'Nueva Categoría')
                    : activeTab === 'categoryEditions'
                    ? (isEditing ? 'Modificar Edición de Torneo' : 'Nueva Edición de Torneo')
                    : activeTab === 'teamRegistrations'
                    ? (isEditing ? 'Modificar Inscripción de Equipo' : 'Nueva Inscripción de Equipo')
                    : activeTab === 'playerRegistrations'
                    ? 'Configurar Plantilla y Carnets del Equipo'
                    : activeTab === 'playerTransfers'
                    ? 'Nueva Orden de Transferencia'
                    : (isEditing ? `Modificar ${activeTabLabel}` : `Nuevo ${activeTabLabel}`)
                }}
              </h5>
              <small class="text-secondary">
                Completa los campos requeridos para {{ isEditing ? 'actualizar' : 'crear' }} el registro en el sistema.
              </small>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
            style="height: 38px;"
            @click="closeForm"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
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
            <div v-if="activeTab === 'teams' && isEditing && formData.id" class="card p-3 mb-4 rounded-4 border border-secondary-subtle bg-dark-subtle">
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
            <div v-if="activeTab === 'players' && (isEditing || globalPlayerSearched)" class="mb-4">
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

            

            <!-- SECCIÓN: IDENTIFICACIÓN Y CONSULTA DE FUTBOLISTAS -->
            <div v-if="activeTab === 'players'" class="card p-3 mb-4 rounded-4 border border-secondary-subtle bg-dark-subtle">
              <div class="d-flex align-items-center gap-2 mb-2">
                <iconify-icon icon="solar:user-id-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                <h6 class="fw-bold mb-0 text-body-emphasis">Identificación del Futbolista</h6>
              </div>
              <div class="row g-2 align-items-center">
                <div class="col-md-3">
                  <AppSelect2
                    v-model="formData.documentType"
                    :options="playerDocumentTypeOptions"
                    placeholder="Tipo de Documento..."
                    search-placeholder="Buscar tipo..."
                  />
                </div>
                <div class="col-md-5">
                  <div class="input-group">
                    <span class="input-group-text bg-body-secondary">
                      <iconify-icon icon="solar:card-2-bold-duotone" class="text-secondary"></iconify-icon>
                    </span>
                    <input
                      type="text"
                      v-model="formData.identification"
                      class="form-control font-monospace"
                      :placeholder="identificationPlaceholder"
                      @keyup.enter="searchGlobalPlayer"
                      @keypress="formData.documentType === '05' ? (!/[0-9]/.test($event.key) && $event.preventDefault()) : null"
                      @input="handlePlayerDocInput"
                      :maxlength="formData.documentType === '05' ? 10 : 20"
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

                <div class="col-md-4" v-if="globalPlayerFound">
                  <!-- Indicador positivo discreto si fue localizado en el padrón -->
                  <div class="alert alert-success py-2 px-3 mb-0 rounded-3 border-0 bg-success-subtle text-success-emphasis d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:check-circle-bold" class="fs-4 text-success"></iconify-icon>
                    <span class="small">
                      <strong>✓ Localizado:</strong> {{ formData.name }} {{ formData.lastName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            

            <!-- SECCIÓN: CONSULTA EN PADRÓN GLOBAL DE ÁRBITROS -->
            <div v-if="activeTab === 'referees'" class="card p-3 mb-4 rounded-4 border border-secondary-subtle bg-dark-subtle">
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
                <div class="card p-4 rounded-4 border border-secondary-subtle bg-dark-subtle">
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
                <div class="card p-4 rounded-4 border border-secondary-subtle bg-dark-subtle h-100 d-flex flex-column justify-content-between">
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
                      💡 <strong>Regla deportiva:</strong> Cada día tiene su propio horario independiente. La asignación de árbitros y vocales respetará estos rangos exactos por cada día de la semana.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            

            <!-- ========================================================================= -->
            <!-- FORMULARIO: ORDEN DE TRANSFERENCIA DE JUGADOR (se genera en estado pendiente) -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'playerTransfers'" class="card p-3 mb-4 rounded-4 border border-secondary-subtle bg-dark-subtle shadow-sm">
              <div class="d-flex align-items-center gap-2 mb-3">
                <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                <div>
                  <h6 class="fw-bold mb-0 text-body-emphasis">Orden de Transferencia</h6>
                  <small class="text-secondary">
                    Se genera en estado <strong>pendiente</strong> y queda a la espera de las firmas que exija el campeonato.
                  </small>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold mb-1">
                    Edición del Campeonato <span class="text-danger">*</span>
                  </label>
                  <AppSelect2
                    v-model="formData.edition_id"
                    :options="transferEditionOptions"
                    placeholder="Seleccionar la edición..."
                    search-placeholder="Buscar edición..."
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold mb-1">
                    Categoría <span class="text-danger">*</span>
                  </label>
                  <AppSelect2
                    v-model="formData.category_id"
                    :options="transferCategoryOptions"
                    :disabled="!formData.edition_id"
                    placeholder="Seleccionar la categoría..."
                    search-placeholder="Buscar categoría..."
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold mb-1">
                    Futbolista a Transferir <span class="text-danger">*</span>
                  </label>
                  <AppSelect2
                    v-model="formData.player_id"
                    :options="transferPlayerOptions"
                    placeholder="Seleccionar el futbolista..."
                    search-placeholder="Buscar por nombre, apellido o cédula..."
                  />
                </div>

                <!-- Solo aparece si el jugador ya está inscrito en un equipo de esa categoría -->
                <div v-if="transferOriginTeamName" class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold mb-1">
                    Club de Origen (inscrito actualmente)
                  </label>
                  <input type="text" class="form-control bg-body-secondary text-secondary" :value="transferOriginTeamName" readonly disabled />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold mb-1">
                    Club de Destino <span class="text-danger">*</span>
                  </label>
                  <AppSelect2
                    v-model="formData.destination_team_id"
                    :options="transferDestinationOptions"
                    :disabled="!formData.category_id"
                    placeholder="Seleccionar el club de destino..."
                    search-placeholder="Buscar club..."
                  />
                </div>

                <div class="col-12">
                  <label class="form-label text-secondary small fw-semibold mb-1">Motivo / Justificación de la Transferencia</label>
                  <textarea
                    v-model="formData.reason"
                    class="form-control"
                    rows="3"
                    placeholder="Ingrese el motivo del traspaso de derechos o cambio de club..."
                  ></textarea>
                </div>
              </div>
            </div>

            

            <!-- ========================================================================= -->
            <!-- FORMULARIO MAESTRO-DETALLE: INSCRIPCIÓN DE EQUIPOS POR EDICIÓN Y CATEGORÍA -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'teamRegistrations'">
              <!-- PASO 1: SELECCIONAR EDICIÓN DEL TORNEO EN SELECT2 -->
              <div class="card p-3 mb-4 rounded-4 border border-secondary-subtle bg-dark-subtle shadow-sm">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:cup-star-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                    <div>
                      <h6 class="fw-bold mb-0 text-body-emphasis">1. Selección de Edición del Torneo</h6>
                      <small class="text-secondary">
                        Elige la edición del torneo para cargar automáticamente todas sus categorías y gestionar los equipos inscritos en cada una.
                      </small>
                    </div>
                  </div>
                  <span
                    v-if="selectedEditionForTeamReg"
                    class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold rounded-pill"
                  >
                    {{ teamRegCategoriesArray.length }} Categoría(s) · {{ totalTeamsInTeamRegEdition }} Equipo(s) Inscrito(s)
                  </span>
                </div>

                <div class="row g-3 align-items-center">
                  <div class="col-md-8 col-lg-7">
                    <label class="form-label text-secondary small fw-semibold mb-1">
                      Edición del Campeonato <span class="text-danger">*</span>
                    </label>
                    <AppSelect2
                      v-model="selectedEditionForTeamReg"
                      :options="editionOptionsForTeamReg"
                      placeholder="Buscar y seleccionar la Edición del Torneo..."
                      search-placeholder="Escribe el nombre de la edición..."
                    />
                  </div>
                  <div v-if="loadingTeamRegEdition" class="col-md-4 col-lg-5 d-flex align-items-center gap-2 pt-3">
                    <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
                    <span class="small text-secondary">Cargando categorías y equipos de la edición...</span>
                  </div>
                </div>
              </div>

              <!-- PASO 2: ARRAY DE CATEGORÍAS DEL TORNEO Y SUB-ARRAY DE EQUIPOS POR CATEGORÍA -->
              <div v-if="selectedEditionForTeamReg" class="card p-3 rounded-4 border border-secondary-subtle bg-dark-subtle shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                    <div>
                      <h5 class="fw-bold mb-0 text-body-emphasis">
                        2. Categorías del Torneo <span class="fs-6 fw-normal text-secondary">(Inscripción de Equipos por Categoría)</span>
                      </h5>
                      <small class="text-secondary">
                        Expande cada categoría para agregar o administrar el listado de equipos participantes en ella.
                      </small>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 fw-semibold rounded-pill">
                      {{ teamRegCategoriesArray.length }} Categoría(s) del Torneo
                    </span>
                  </div>
                </div>

                <div v-if="teamRegCategoriesArray.length === 0 && !loadingTeamRegEdition" class="alert alert-warning mb-0 d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:danger-triangle-bold" class="fs-4 text-warning"></iconify-icon>
                  <span>
                    Esta edición de torneo aún no tiene categorías configuradas. Ve a <strong>Configuraciones del Torneo → Ediciones de Torneo</strong> para asignarle sus categorías.
                  </span>
                </div>

                <div v-else class="table-responsive">
                  <table class="table table-hover table-sm align-middle mb-0 app-table app-table-framed">
                    <thead class="table-primary fs-2">
                      <tr>
                        <th style="width: 70px;" class="text-center fw-semibold">#</th>
                        <th style="min-width: 240px;" class="fw-semibold">Categoría del Torneo</th>
                        <th style="min-width: 150px;" class="fw-semibold">Vigencia (Inicio - Fin)</th>
                        <th style="min-width: 120px;" class="text-end fw-semibold">Costo Inscripción</th>
                        <th style="min-width: 120px;" class="text-center fw-semibold">Cupo Máx. Jug.</th>
                        <th style="min-width: 160px;" class="text-center fw-semibold">Equipos Inscritos</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(cat, catIdx) in teamRegCategoriesArray" :key="cat._uid || cat.categoryId || catIdx">
                        <!-- Fila Maestra: Categoría de la Edición -->
                        <tr>
                          <td class="text-center">
                            <div class="d-flex align-items-center justify-content-center gap-2">
                              <span class="fw-bold font-monospace text-secondary fs-3">{{ catIdx + 1 }}</span>
                              <button
                                type="button"
                                class="btn btn-sm btn-link p-0 text-decoration-none d-inline-flex align-items-center justify-content-center text-body-emphasis"
                                @click="toggleTeamRegCategoryRow(catIdx)"
                                :title="isTeamRegCategoryExpanded(catIdx) ? 'Colapsar equipos de la categoría' : 'Expandir equipos de la categoría'"
                              >
                                <iconify-icon
                                  :icon="isTeamRegCategoryExpanded(catIdx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'"
                                  class="fs-5 fw-bold"
                                ></iconify-icon>
                              </button>
                            </div>
                          </td>

                          <td>
                            <div class="d-flex align-items-center gap-2">
                              <div class="p-2 rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 36px; height: 36px;">
                                <iconify-icon icon="solar:cup-bold" class="fs-4"></iconify-icon>
                              </div>
                              <div>
                                <span class="fw-bold text-body-emphasis d-block">{{ cat.categoryName }}</span>
                                <div class="d-flex align-items-center gap-1 mt-0.5">
                                  <span v-if="cat.categoryAcronyms" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-1.5 py-0 fs-1">
                                    {{ cat.categoryAcronyms }}
                                  </span>
                                  <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-1.5 py-0 fs-1">
                                    {{ cat.gender }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span v-if="cat.startDate || cat.endDate" class="font-monospace small text-secondary">
                              📅 {{ cat.startDate || 'N/A' }} → {{ cat.endDate || 'N/A' }}
                            </span>
                            <span v-else class="text-muted small">Según edición general</span>
                          </td>

                          <td class="text-end">
                            <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">
                              ${{ Number(cat.registrationFee || 0).toFixed(2) }}
                            </span>
                          </td>

                          <td class="text-center">
                            <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                              👥 Máx. {{ cat.maxPlayers || 25 }} jug.
                            </span>
                          </td>

                          <td class="text-center">
                            <button
                              type="button"
                              class="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 border"
                              :class="cat.teams.length > 0 ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'"
                              @click="toggleTeamRegCategoryRow(catIdx)"
                            >
                              <iconify-icon icon="solar:shield-bold-duotone" class="fs-6"></iconify-icon>
                              <span class="small fw-semibold">{{ cat.teams.length }} Equipo(s)</span>
                              <iconify-icon :icon="isTeamRegCategoryExpanded(catIdx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" class="fs-6 ms-1"></iconify-icon>
                            </button>
                          </td>
                        </tr>

                        <!-- Sub-Tarjeta Expandible: Array de Equipos Inscritos en esta Categoría -->
                        <tr v-if="isTeamRegCategoryExpanded(catIdx)" class="bg-transparent">
                          <td colspan="6" class="p-3 bg-transparent">
                            <div class="card rounded-4 border border-primary-subtle bg-body p-3 shadow-xs">
                              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                <div class="d-flex align-items-center gap-2">
                                  <iconify-icon icon="solar:shield-user-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                                  <span class="fw-bold text-body-emphasis fs-6">
                                    Equipos Inscritos en {{ cat.categoryName }}
                                  </span>
                                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-1 fw-semibold">
                                    {{ cat.teams.length }} equipo(s)
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  class="btn btn-sm btn-link text-secondary p-0 text-decoration-none d-flex align-items-center"
                                  @click="toggleTeamRegCategoryRow(catIdx)"
                                  title="Colapsar Equipos"
                                >
                                  <iconify-icon icon="solar:alt-arrow-up-linear" class="fs-4 fw-bold"></iconify-icon>
                                </button>
                              </div>

                              <!-- Sub-Tabla del Array de Equipos de la Categoría (Selección en línea + Agregar fila) -->
                              <div class="table-responsive">
                                <table class="table table-sm table-hover align-middle mb-0 app-table app-table-framed">
                                  <thead class="table-primary fs-2">
                                    <tr>
                                      <th style="width: 60px;" class="text-center fw-semibold">N°</th>
                                      <th style="min-width: 300px;" class="fw-semibold">Equipo / Club *</th>
                                      <th style="width: 80px;" class="text-center fw-semibold">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-if="cat.teams.length === 0">
                                      <td colspan="3" class="text-center py-5 text-muted">
                                        <iconify-icon icon="solar:box-minimalistic-bold-duotone" class="d-block mx-auto mb-2 text-secondary opacity-50" style="font-size: 3.2rem;"></iconify-icon>
                                        <div class="fw-bold text-body-emphasis fs-5">Sin equipos</div>
                                        <div class="small text-secondary mt-1">Aún no se han agregado equipos en <strong>{{ cat.categoryName }}</strong></div>
                                      </td>
                                    </tr>
                                    <tr v-for="(tm, tIdx) in cat.teams" :key="tm._uid || tIdx">
                                      <td class="text-center fw-bold font-monospace text-secondary fs-2">
                                        {{ (catIdx + 1) + '.' + (tIdx + 1) }}
                                      </td>

                                      <td>
                                        <div class="d-flex align-items-center gap-2">
                                          <img
                                            v-if="tm.teamLogo"
                                            :src="tm.teamLogo"
                                            class="rounded-circle shadow-xs border border-secondary-subtle flex-shrink-0"
                                            style="width: 30px; height: 30px; object-fit: cover;"
                                          />
                                          <div
                                            v-else
                                            class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                                            style="width: 30px; height: 30px;"
                                          >
                                            <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                                          </div>
                                            <div class="flex-grow-1">
                                              <AppSelect2
                                                v-model="tm.teamId"
                                                :options="getAvailableTeamsOptionsForCategoryRow(cat, tm.teamId)"
                                                direction="down"
                                                placeholder="Seleccionar equipo / club..."
                                                search-placeholder="Buscar club por nombre o siglas..."
                                                @update:modelValue="onTeamRowSelectChange(tm, $event)"
                                              />
                                            </div>
                                        </div>
                                      </td>

                                      <td class="text-center">
                                        <div class="d-inline-flex align-items-center gap-1">
                                          <button
                                            v-if="tm.id"
                                            type="button"
                                            class="btn btn-sm btn-outline-info d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                                            style="width: 28px; height: 28px;"
                                            @click="openRosterForTeamReg(tm.id)"
                                            title="Ver Plantilla del Club"
                                          >
                                            <iconify-icon icon="solar:clipboard-list-bold-duotone" class="fs-6"></iconify-icon>
                                          </button>
                                          <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                                            style="width: 28px; height: 28px;"
                                            @click="removeTeamFromCategoryReg(cat, tIdx)"
                                            title="Quitar fila"
                                          >
                                            <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-6"></iconify-icon>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <!-- Pie de la tabla con botón "+ Agregar fila" al estilo de facturación/servicios -->
                              <div class="d-flex align-items-center gap-2 mt-3">
                                <button
                                  type="button"
                                  class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1 fw-semibold shadow-xs"
                                  @click="addEmptyTeamRowToCategoryReg(cat)"
                                >
                                  <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
                                  <span>+ Agregar fila</span>
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
            </div>

            <!-- ========================================================================= -->
            <!-- FORMULARIO JERÁRQUICO 3 NIVELES: INSCRIPCIÓN Y CARNETS (POR EQUIPO)       -->
            <!-- Nivel 1: Cabecera del Equipo · Nivel 2: Categorías Permitidas · Nivel 3: Array de Jugadores -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'playerRegistrations'" class="d-flex flex-column gap-4">
              <!-- NIVEL 1: CABECERA DEL EQUIPO Y EDICIÓN DEL TORNEO (DATOS BLOQUEADOS) -->
              <div class="card p-4 rounded-4 border border-secondary-subtle bg-dark-subtle shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:shield-user-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                    <div>
                      <h5 class="fw-bold mb-0 text-body-emphasis">
                        1. Cabecera del Equipo <span class="fs-6 fw-normal text-secondary">(Datos Oficiales del Club en el Torneo)</span>
                      </h5>
                      <small class="text-secondary">
                        Datos cargados automáticamente desde <strong>Inscripción de Equipos</strong>.
                      </small>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 fw-semibold rounded-pill">
                      {{ playerRegCategoriesArray.length }} Categoría(s) Habilitada(s)
                    </span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold rounded-pill">
                      👥 {{ totalPlayersInTeamRosterForm }} Jugador(es) en Plantilla
                    </span>
                  </div>
                </div>

                <div class="row g-3 align-items-center">
                  <div class="col-md-5">
                    <label class="form-label text-secondary small fw-semibold mb-1">
                      Equipo / Club Deportivo <span class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">Bloqueado</span>
                    </label>
                    <div class="d-flex align-items-center gap-2 p-2 rounded-3 border border-secondary-subtle bg-body-secondary">
                      <img
                        v-if="playerRegHeaderTeam.logo"
                        :src="playerRegHeaderTeam.logo"
                        class="rounded-circle border border-secondary-subtle flex-shrink-0"
                        style="width: 32px; height: 32px; object-fit: cover;"
                      />
                      <div
                        v-else
                        class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                        style="width: 32px; height: 32px;"
                      >
                        <iconify-icon icon="solar:shield-bold-duotone" class="fs-5"></iconify-icon>
                      </div>
                      <div class="min-w-0 flex-grow-1">
                        <span class="fw-bold text-body-emphasis d-block text-truncate">{{ playerRegHeaderTeam.name || '-' }}</span>
                      </div>
                      <span v-if="playerRegHeaderTeam.acronyms" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                        {{ playerRegHeaderTeam.acronyms }}
                      </span>
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-secondary small fw-semibold mb-1">
                      Edición del Campeonato <span class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">Bloqueado</span>
                    </label>
                    <input
                      type="text"
                      class="form-control bg-body-secondary text-secondary cursor-not-allowed fw-semibold"
                      :value="playerRegHeaderTeam.editionName || '-'"
                      readonly
                      disabled
                    />
                  </div>

                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold mb-1">
                      Categorías Permitidas <span class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">Bloqueado</span>
                    </label>
                    <input
                      type="text"
                      class="form-control bg-body-secondary text-secondary cursor-not-allowed font-monospace"
                      :value="playerRegCategoriesArray.map((c) => c.categoryName).join(', ') || '-'"
                      readonly
                      disabled
                    />
                  </div>
                </div>
              </div>

              <!-- NIVEL 2: DETALLE DE CATEGORÍAS PERMITIDAS DEL EQUIPO -->
              <div class="card p-3 rounded-4 border border-secondary-subtle bg-dark-subtle shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                    <div>
                      <h5 class="fw-bold mb-0 text-body-emphasis">
                        2. Categorías Habilitadas del Equipo <span class="fs-6 fw-normal text-secondary">(Plantilla y Carnets por Categoría)</span>
                      </h5>
                      <small class="text-secondary">
                        Expande cada categoría en la que participa <strong>{{ playerRegHeaderTeam.name }}</strong> para agregar o configurar el array de jugadores.
                      </small>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="table table-hover table-sm align-middle mb-0 app-table app-table-framed">
                    <thead class="table-primary fs-2">
                      <tr>
                        <th style="width: 70px;" class="text-center fw-semibold">#</th>
                        <th style="min-width: 240px;" class="fw-semibold">Categoría Permitida</th>
                        <th style="min-width: 140px;" class="text-center fw-semibold">Género</th>
                        <th style="min-width: 160px;" class="text-center fw-semibold">Cupo Máx. Jugadores</th>
                        <th style="min-width: 220px;" class="fw-semibold">Clasificaciones Reglamentarias</th>
                        <th style="min-width: 170px;" class="text-center fw-semibold">Plantilla de Jugadores</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(cat, catIdx) in playerRegCategoriesArray" :key="cat.teamRegistrationId || catIdx">
                        <!-- Fila Maestra: Categoría del Equipo -->
                        <tr>
                          <td class="text-center">
                            <div class="d-flex align-items-center justify-content-center gap-2">
                              <span class="fw-bold font-monospace text-secondary fs-3">{{ catIdx + 1 }}</span>
                              <button
                                type="button"
                                class="btn btn-sm btn-link p-0 text-decoration-none d-inline-flex align-items-center justify-content-center text-body-emphasis"
                                @click="togglePlayerRegCategoryRow(catIdx)"
                                :title="isPlayerRegCategoryExpanded(catIdx) ? 'Colapsar plantilla de la categoría' : 'Expandir plantilla de la categoría'"
                              >
                                <iconify-icon
                                  :icon="isPlayerRegCategoryExpanded(catIdx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'"
                                  class="fs-5 fw-bold"
                                ></iconify-icon>
                              </button>
                            </div>
                          </td>

                          <td>
                            <div class="d-flex align-items-center gap-2">
                              <div class="p-2 rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 36px; height: 36px;">
                                <iconify-icon icon="solar:cup-bold" class="fs-4"></iconify-icon>
                              </div>
                              <div>
                                <span class="fw-bold text-body-emphasis d-block">{{ cat.categoryName }}</span>
                                <span v-if="cat.categoryAcronyms" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-1.5 py-0 fs-1">
                                  {{ cat.categoryAcronyms }}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td class="text-center">
                            <span
                              class="badge font-monospace px-2 py-1"
                              :class="cat.gender === 'FEMALE' ? 'bg-danger-subtle text-danger border border-danger-subtle' : cat.gender === 'MIXED' ? 'bg-warning-subtle text-warning border border-warning-subtle' : 'bg-info-subtle text-info border border-info-subtle'"
                            >
                              {{ cat.gender === 'FEMALE' ? 'Mujeres (Femenino)' : cat.gender === 'MIXED' ? 'Mixto' : 'Varones (Masculino)' }}
                            </span>
                          </td>

                          <td class="text-center">
                            <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                              👥 {{ getValidPlayersCountInCat(cat) }} / {{ cat.maxPlayers || 25 }} jug.
                            </span>
                          </td>

                          <td>
                            <div v-if="cat.allowedClassifications && cat.allowedClassifications.length > 0" class="d-flex flex-wrap gap-1">
                              <span
                                v-for="cl in cat.allowedClassifications"
                                :key="cl.playerClassificationId"
                                class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-0.5 fs-1"
                              >
                                {{ cl.description }}: {{ getClassificationUsedCount(cat, cl.playerClassificationId) }}/{{ cl.maxPlayers }}
                              </span>
                            </div>
                            <span v-else class="text-muted small">Libre (Hasta {{ cat.maxPlayers || 25 }} cupos)</span>
                          </td>

                          <td class="text-center">
                            <button
                              type="button"
                              class="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 border"
                              :class="cat.players.length > 0 ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'"
                              @click="togglePlayerRegCategoryRow(catIdx)"
                            >
                              <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-6"></iconify-icon>
                              <span class="small fw-semibold">{{ getValidPlayersCountInCat(cat) }} Jugador(es)</span>
                              <iconify-icon :icon="isPlayerRegCategoryExpanded(catIdx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" class="fs-6 ms-1"></iconify-icon>
                            </button>
                          </td>
                        </tr>

                        <!-- NIVEL 3: SUB-TARJETA EXPANDIBLE CON EL ARRAY DE JUGADORES DE ESTA CATEGORÍA -->
                        <tr v-if="isPlayerRegCategoryExpanded(catIdx)" class="bg-transparent">
                          <td colspan="6" class="p-3 bg-transparent">
                            <div class="card rounded-4 border border-primary-subtle bg-body p-3 shadow-xs">
                              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                <div class="d-flex align-items-center gap-2">
                                  <iconify-icon icon="solar:card-2-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                                  <span class="fw-bold text-body-emphasis fs-6">
                                    Plantilla de Jugadores · {{ playerRegHeaderTeam.name }} ({{ cat.categoryName }})
                                  </span>
                                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-1 fw-semibold">
                                    {{ getValidPlayersCountInCat(cat) }} / {{ cat.maxPlayers || 25 }} inscritos
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  class="btn btn-sm btn-link text-secondary p-0 text-decoration-none d-flex align-items-center"
                                  @click="togglePlayerRegCategoryRow(catIdx)"
                                  title="Colapsar Plantilla"
                                >
                                  <iconify-icon icon="solar:alt-arrow-up-linear" class="fs-4 fw-bold"></iconify-icon>
                                </button>
                              </div>

                              <!-- Sub-Tabla del Array de Jugadores de la Categoría -->
                              <div class="table-responsive">
                                <table class="table table-sm table-hover align-middle mb-0 app-table app-table-framed">
                                  <thead class="table-primary fs-2">
                                    <tr>
                                      <th style="width: 55px;" class="text-center fw-semibold">N°</th>
                                      <th style="min-width: 260px; width: 28%;" class="fw-semibold">Jugador / Futbolista *</th>
                                      <th style="min-width: 140px; width: 12%;" class="fw-semibold">Código de Carnet</th>
                                      <th style="min-width: 190px; width: 17%;" class="fw-semibold">Clasificación *</th>
                                      <th style="min-width: 200px; width: 17%;" class="fw-semibold">Demarcación / Posición</th>
                                      <th style="min-width: 110px; width: 11%;" class="text-center fw-semibold">Dorsal # *</th>
                                      <th style="min-width: 100px; width: 9%;" class="text-center fw-semibold">Capitán</th>
                                      <th style="width: 80px;" class="text-center fw-semibold">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-if="cat.players.length === 0">
                                      <td colspan="8" class="text-center py-5 text-muted">
                                        <iconify-icon icon="solar:box-minimalistic-bold-duotone" class="d-block mx-auto mb-2 text-secondary opacity-50" style="font-size: 3.2rem;"></iconify-icon>
                                        <div class="fw-bold text-body-emphasis fs-5">Sin jugadores</div>
                                        <div class="small text-secondary mt-1">Aún no se han agregado jugadores en la categoría <strong>{{ cat.categoryName }}</strong></div>
                                      </td>
                                    </tr>
                                    <tr v-for="(pl, pIdx) in cat.players" :key="pl._uid || pIdx">
                                      <td class="text-center fw-bold font-monospace text-secondary fs-2">
                                        {{ (catIdx + 1) + '.' + (pIdx + 1) }}
                                      </td>

                                      <!-- Jugador (AppSelect2 directo en el array) -->
                                      <td>
                                        <div class="d-flex align-items-center gap-2">
                                          <img
                                            v-if="pl.photo"
                                            :src="pl.photo"
                                            class="rounded-circle shadow-xs border border-info-subtle flex-shrink-0"
                                            style="width: 30px; height: 30px; object-fit: cover;"
                                          />
                                          <div
                                            v-else
                                            class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                                            style="width: 30px; height: 30px;"
                                          >
                                            <iconify-icon icon="solar:user-bold-duotone" class="fs-5 text-info"></iconify-icon>
                                          </div>
                                          <div class="flex-grow-1">
                                            <AppSelect2
                                              v-model="pl.playerId"
                                              :options="getAvailablePlayersOptionsForCategoryRow(cat, pl.playerId)"
                                              direction="down"
                                              placeholder="Seleccionar futbolista..."
                                              search-placeholder="Buscar por nombre, apellido o cédula..."
                                              @update:modelValue="onPlayerRowSelectChange(cat, pl, $event)"
                                            />
                                          </div>
                                        </div>
                                      </td>

                                      <!-- Código de Carnet (Viene de la ficha del jugador y está bloqueado) -->
                                      <td>
                                        <input
                                          type="text"
                                          :value="pl.carnetCode"
                                          class="form-control form-control-sm font-monospace bg-body-secondary text-secondary cursor-not-allowed"
                                          placeholder="Automático (Ficha)"
                                          readonly
                                          disabled
                                          title="Código de carnet generado automáticamente en la ficha del jugador (Bloqueado)"
                                        />
                                      </td>

                                      <!-- Clasificación de Futbolista -->
                                      <td>
                                        <select
                                          v-model="pl.playerClassificationId"
                                          class="form-select form-select-sm"
                                        >
                                          <option value="">-- Seleccionar --</option>
                                          <option
                                            v-for="clOpt in getClassificationsOptionsForCatRow(cat, pl.playerClassificationId)"
                                            :key="clOpt.value"
                                            :value="clOpt.value"
                                            :disabled="clOpt.disabled"
                                          >
                                            {{ clOpt.label }}
                                          </option>
                                        </select>
                                      </td>

                                      <!-- Demarcación / Posición en campo (por defecto la del jugador) -->
                                      <td>
                                        <select v-model="pl.demarcationId" class="form-select form-select-sm">
                                          <option value="">-- Seleccionar --</option>
                                          <option v-for="dem in demarcationsList" :key="dem.id" :value="dem.id">
                                            {{ dem.name }}{{ dem.zone ? ' (' + dem.zone + ')' : '' }}
                                          </option>
                                        </select>
                                      </td>

                                      <!-- Dorsal / Camiseta -->
                                      <td>
                                        <input
                                          type="number"
                                          v-model.number="pl.jerseyNumber"
                                          class="form-control form-control-sm text-center font-monospace fw-bold"
                                          min="1"
                                          max="999"
                                          placeholder="Ej. 10"
                                        />
                                      </td>

                                      <!-- Capitán -->
                                      <td class="text-center">
                                        <div class="form-check form-switch d-inline-flex align-items-center justify-content-center mb-0">
                                          <input
                                            class="form-check-input cursor-pointer"
                                            type="checkbox"
                                            v-model="pl.isCaptain"
                                            @change="onPlayerRowCaptainChange(cat, pl)"
                                            :title="pl.isCaptain ? 'Capitán de esta categoría' : 'Marcar como capitán'"
                                          />
                                        </div>
                                      </td>

                                      <!-- Acciones: Ver Carnet QR + Quitar Fila -->
                                      <td class="text-center">
                                        <div class="d-inline-flex align-items-center gap-1">
                                          <button
                                            v-if="pl.playerId"
                                            type="button"
                                            class="btn btn-sm btn-outline-info d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                                            style="width: 28px; height: 28px;"
                                            @click="openCarnetFromPlayerRow(cat, pl)"
                                            title="Ver Carnet Deportivo (QR)"
                                          >
                                            <iconify-icon icon="solar:card-2-bold-duotone" class="fs-6"></iconify-icon>
                                          </button>
                                          <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center rounded-2 p-1"
                                            style="width: 28px; height: 28px;"
                                            @click="removePlayerRowFromCategory(cat, pIdx)"
                                            title="Quitar fila"
                                          >
                                            <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-6"></iconify-icon>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <!-- Pie de la tabla con botón "+ Agregar fila" -->
                              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                                <button
                                  type="button"
                                  class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1 fw-semibold shadow-xs"
                                  :disabled="cat.players.length >= (cat.maxPlayers || 25)"
                                  @click="addEmptyPlayerRowToCategory(cat)"
                                >
                                  <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
                                  <span>+ Agregar fila</span>
                                </button>
                                <small v-if="cat.players.length >= (cat.maxPlayers || 25)" class="text-warning fw-semibold">
                                  Cupo máximo alcanzado ({{ cat.maxPlayers || 25 }} jugadores).
                                </small>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              v-if="activeTab !== 'schedules' && activeTab !== 'teamRegistrations' && activeTab !== 'playerRegistrations' && activeTab !== 'playerTransfers' && (activeTab !== 'players' || isEditing || globalPlayerSearched)"
              class="row g-4"
            >
              <div v-for="field in formFields" :key="field.key" :class="field.colClass || 'col-md-6'">
                <label class="form-label text-secondary small fw-semibold">
                  {{ field.label }}
                  <span v-if="isFieldCalculated(field)" class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">(Calculado)</span>
                  <span v-else-if="isFieldLockedByGlobal(field)" class="badge bg-secondary-subtle text-secondary ms-1 fw-normal font-monospace" style="font-size: 0.68rem;">Bloqueado</span>
                </label>
                <input
                  v-if="field.type === 'text' || field.type === 'number' || field.type === 'date'"
                  :type="getFieldType(field)"
                  v-model="formData[field.key]"
                  class="form-control"
                  :class="{ 'bg-body-secondary text-secondary cursor-not-allowed': isFieldDisabled(field) || isFieldReadonly(field) }"
                  :placeholder="field.placeholder || ''"
                  :readonly="isFieldReadonly(field)"
                  :disabled="isFieldDisabled(field)"
                  :inputmode="getFieldInputMode(field.key)"
                  @keypress="handleFieldKeypress($event, field.key)"
                  @input="handleFieldInput($event, field.key)"
                  @change="handleFieldChange($event, field.key)"
                  @paste="handleFieldPaste($event, field.key)"
                  :maxlength="getFieldMaxLength(field.key)"
                  :minlength="getFieldMinLength(field.key)"
                  :required="isFieldRequired(field.key)"
                  :max="getFieldMax(field.key)"
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

            

            <!-- Estado para Equipos: editable al modificar -->
            <div v-if="activeTab === 'teams' && isEditing" class="mt-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="team_is_active_edit" />
                <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="team_is_active_edit">
                  {{ formData.isActive !== false ? 'Equipo Activo (Habilitado para disputar partidos)' : 'Equipo Inactivo (Deshabilitado)' }}
                </label>
              </div>
            </div>

            <!-- Estado para Jugadores: editable al modificar -->
            <div v-if="activeTab === 'players' && isEditing" class="mt-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="player_is_active_edit" />
                <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="player_is_active_edit">
                  {{ formData.isActive !== false ? 'Jugador Activo (Habilitado para disputar partidos)' : 'Jugador Inactivo (Deshabilitado)' }}
                </label>
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
            <div v-if="activeTab === 'categoryEditions'" class="card p-3 mt-4 rounded-4 border border-secondary-subtle bg-dark-subtle">
              <div class="d-flex align-items-center gap-2 mb-3">
                <iconify-icon icon="solar:user-id-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                <div>
                  <h6 class="fw-bold mb-0 text-body-emphasis">Modalidad de Identificación de Jugadores en el Torneo</h6>
                  <small class="text-secondary">Define si en este campeonato los jugadores se configurarán y registrarán por su número de camiseta (dorsal) o mediante su código único secuencial de jugador.</small>
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
            <!-- SECCIÓN MAESTRO-DETALLE: CATEGORÍAS DE LA EDICIÓN        -->
            <!-- ======================================================== -->
            <div v-if="activeTab === 'categoryEditions'" class="card p-3 mt-4 rounded-4 border border-secondary-subtle bg-dark-subtle shadow-sm">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-3 text-primary"></iconify-icon>
                  <div>
                    <h5 class="fw-bold mb-0 text-body-emphasis">Detalle <span class="fs-6 fw-normal text-secondary">(Detalle de Categorías del Torneo)</span></h5>
                    <small class="text-secondary">Agrega las categorías que competirán en esta edición, con sus costos, tiempos, cupos y clasificaciones.</small>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold rounded-pill">
                    {{ editionCategoriesDetail.length }} Categoría(s) Agregada(s)
                  </span>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 fw-semibold shadow-sm"
                    @click="addCategoryToEditionDetail"
                  >
                    <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
                    <span>+ Agregar</span>
                  </button>
                </div>
              </div>

              <!-- Tabla Maestro-Detalle con cabecera oficial table-primary -->
              <div class="table-responsive border border-secondary-subtle rounded-3 bg-body shadow-sm">
                <table class="table table-hover table-sm align-middle mb-0 app-table">
                  <thead class="table-primary fs-2">
                    <tr>
                      <th style="width: 70px;" class="text-center fw-semibold">#</th>
                      <th style="min-width: 220px; width: 24%;" class="fw-semibold">Categoría *</th>
                      <th style="min-width: 100px; width: 9%;" class="text-end fw-semibold">Inscripción ($)</th>
                      <th style="min-width: 100px; width: 9%;" class="text-end fw-semibold">Garantía ($)</th>
                      <th style="min-width: 70px; width: 7%;" class="text-center fw-semibold">Máx. Jug. *</th>
                      <th style="min-width: 150px; width: 17%;" class="text-center fw-semibold">Tiempos (Dur./Desc./Esp.)</th>
                      <th style="min-width: 110px; width: 12%;" class="text-center fw-semibold">Clasificaciones</th>
                      <th style="min-width: 110px; width: 12%;" class="text-center fw-semibold">Etapas / Fases</th>
                      <th style="width: 85px;" class="text-center fw-semibold">Acciones</th>
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

                        <!-- Inscripción ($) -->
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

                        <!-- Garantía ($) -->
                        <td>
                          <div class="input-group input-group-sm" style="min-width: 90px;">
                            <span class="input-group-text px-1">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              v-model.number="item.guaranteeFee"
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
                          <div class="d-flex flex-column align-items-center justify-content-center gap-1" style="min-width: 120px;">
                            <div class="form-check form-switch d-inline-flex align-items-center gap-1 mb-0">
                              <input
                                class="form-check-input cursor-pointer"
                                type="checkbox"
                                v-model="item.useClassifications"
                                :id="'use_class_' + (item._uid || idx)"
                                title="Activar o desactivar manejo de clasificaciones en esta categoría"
                              />
                              <label
                                class="form-check-label small fw-semibold cursor-pointer"
                                :class="item.useClassifications ? 'text-primary' : 'text-secondary'"
                                :for="'use_class_' + (item._uid || idx)"
                              >
                                {{ item.useClassifications ? 'Sí' : 'No' }}
                              </label>
                            </div>
                            <div v-if="item.useClassifications" class="d-flex align-items-center justify-content-center gap-1">
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
                          </div>
                        </td>

                        <!-- Etapas / Fases -->
                        <td class="text-center">
                          <div class="d-flex align-items-center justify-content-center gap-1" style="min-width: 110px;">
                            <button
                              type="button"
                              class="btn btn-sm rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1 border"
                              :class="item.stages && item.stages.length ? 'bg-info-subtle text-info border-info-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'"
                              @click="toggleCategoryRow(idx)"
                              title="Ver/Ocultar Etapas y Fases"
                            >
                              <iconify-icon icon="solar:diagram-up-bold" class="fs-6"></iconify-icon>
                              <span class="small fw-semibold">{{ item.stages && item.stages.length ? (item.stages.length + ' Etapa(s)') : '0 Etapas' }}</span>
                              <iconify-icon :icon="isCategoryRowExpanded(idx) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" class="fs-6 ms-1"></iconify-icon>
                            </button>
                          </div>
                        </td>

                        <!-- Acciones Maestras: Botón azul editar (si maneja clasificaciones) + Botón rojo eliminar -->
                        <td class="text-center">
                          <div class="d-flex align-items-center justify-content-center gap-1">
                            <button
                              v-if="item.useClassifications"
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
                          <div class="card rounded-4 border border-primary-subtle bg-body p-3 shadow-xs">
                            <!-- Encabezado de la sub-tarjeta -->
                            <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                              <div class="d-flex align-items-center gap-2">
                                <iconify-icon icon="solar:diagram-up-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                                <span class="fw-bold text-body-emphasis fs-6">Componentes de la Categoría (Etapas y Fases)</span>
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-1 fw-semibold">
                                  {{ item.stages?.length || 0 }} registros
                                </span>
                              </div>
                              <div class="d-flex align-items-center gap-2">
                                <button
                                  type="button"
                                  class="btn btn-sm btn-link text-secondary p-0 text-decoration-none d-flex align-items-center"
                                  @click="toggleCategoryRow(idx)"
                                  title="Colapsar Etapas"
                                >
                                  <iconify-icon icon="solar:alt-arrow-up-linear" class="fs-4 fw-bold"></iconify-icon>
                                </button>
                              </div>
                            </div>

                            <!-- Sub-tabla anidada editable 100% en línea -->
                            <div class="table-responsive rounded-3 border border-secondary-subtle bg-body shadow-xs">
                              <table class="table table-sm table-hover align-middle mb-0 app-table">
                                <thead class="table-primary fs-2">
                                  <tr>
                                    <th style="width: 50px;" class="text-center fw-semibold">#</th>
                                    <th style="min-width: 180px; width: 22%;" class="fw-semibold">Nombre de la Etapa / Fase *</th>
                                    <th style="min-width: 160px; width: 20%;" class="fw-semibold">Tipo de Competencia *</th>
                                    <th style="min-width: 150px; width: 18%;" class="fw-semibold">Vueltas / Modalidad *</th>
                                    <th style="min-width: 300px; width: 34%;" class="fw-semibold">Criterios de Desempate (Jerarquía en Línea)</th>
                                    <th style="width: 60px;" class="text-center fw-semibold">Acción</th>
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
                                  <template v-for="(stg, sIdx) in item.stages" :key="stg._uid || sIdx">
                                  <tr>
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

                                    <!-- Criterios de Desempate (Jerarquía en Línea): pestaña desplegable, igual que las etapas -->
                                    <td>
                                      <button
                                        type="button"
                                        class="btn btn-sm rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1 border"
                                        :class="stg.tieBreakerCriteria && stg.tieBreakerCriteria.length ? 'bg-info-subtle text-info border-info-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'"
                                        @click="toggleStageCriteria(stg, Number(idx), Number(sIdx))"
                                        title="Ver/Ocultar Criterios de Desempate"
                                      >
                                        <span class="fs-6">⚖️</span>
                                        <span class="small fw-semibold">{{ stg.tieBreakerCriteria && stg.tieBreakerCriteria.length ? (stg.tieBreakerCriteria.length + ' Criterio(s)') : '0 Criterios' }}</span>
                                        <iconify-icon :icon="isStageCriteriaExpanded(stg, Number(idx), Number(sIdx)) ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" class="fs-6 ms-1"></iconify-icon>
                                      </button>
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
                                  <!-- Sub-fila desplegable: Criterios de Desempate (Jerarquía en Línea) de la etapa -->
                                  <tr v-if="isStageCriteriaExpanded(stg, Number(idx), Number(sIdx))" class="bg-transparent">
                                    <td colspan="6" class="p-2 bg-transparent">
                                      <div class="card rounded-4 border border-info-subtle bg-body p-3 shadow-xs">
                                        <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                          <div class="d-flex align-items-center gap-2 flex-wrap">
                                            <span class="fs-5">⚖️</span>
                                            <span class="fw-bold text-body-emphasis">Criterios de Desempate (Jerarquía en Línea)</span>
                                            <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1 fs-1 fw-semibold">
                                              {{ stg.tieBreakerCriteria?.length || 0 }} registros
                                            </span>
                                            <span class="small text-secondary font-monospace">Etapa {{ (Number(idx) + 1) + '.' + (Number(sIdx) + 1) }}{{ stg.name ? ' · ' + stg.name : '' }}</span>
                                          </div>
                                          <button
                                            type="button"
                                            class="btn btn-sm btn-link text-secondary p-0 text-decoration-none d-flex align-items-center"
                                            @click="toggleStageCriteria(stg, Number(idx), Number(sIdx))"
                                            title="Colapsar Criterios"
                                          >
                                            <iconify-icon icon="solar:alt-arrow-up-linear" class="fs-4 fw-bold"></iconify-icon>
                                          </button>
                                        </div>

                                        <!-- Selector para añadir criterios en el orden en que se aplicarán -->
                                        <div class="d-flex align-items-center gap-2 mb-2" style="max-width: 460px;">
                                          <select
                                            class="form-select form-select-sm"
                                            @change="addCriterionToStageDirect(stg, $event)"
                                          >
                                            <option value="" selected>
                                              {{ (stg.tieBreakerCriteria && stg.tieBreakerCriteria.length > 0) ? `+ Agregar ${stg.tieBreakerCriteria.length + 1}° criterio de desempate...` : '+ Agregar 1° criterio de desempate...' }}
                                            </option>
                                            <option
                                              v-for="crit in tieBreakerCriteriaList"
                                              :key="crit.id"
                                              :value="crit.id"
                                              :disabled="isCriterionAlreadyInStage(stg, crit.id)"
                                            >
                                              {{ isCriterionAlreadyInStage(stg, crit.id) ? '✓ ' : '' }}{{ crit.description }} {{ crit.code ? '(' + crit.code + ')' : '' }}
                                            </option>
                                          </select>
                                        </div>

                                        <!-- Lista ordenada de criterios jerárquicos (#1, #2, #3...) con botones subir/bajar -->
                                        <div v-if="stg.tieBreakerCriteria && stg.tieBreakerCriteria.length" class="d-flex flex-column gap-1">
                                          <div
                                            v-for="(c, cIdx) in stg.tieBreakerCriteria"
                                            :key="c.criterionId || c.id || cIdx"
                                            class="d-flex align-items-center justify-content-between gap-2 px-2 py-1 rounded-2 bg-dark-subtle border border-info-subtle"
                                          >
                                            <div class="d-flex align-items-center gap-2 overflow-hidden">
                                              <div class="btn-group btn-group-sm flex-shrink-0" role="group">
                                                <button
                                                  type="button"
                                                  class="btn btn-sm btn-outline-secondary py-0 px-1"
                                                  style="font-size: 0.68rem; line-height: 1.2;"
                                                  :disabled="Number(cIdx) === 0"
                                                  @click="moveStageCriterionUp(stg, Number(cIdx))"
                                                  title="Subir prioridad"
                                                >
                                                  ▲
                                                </button>
                                                <button
                                                  type="button"
                                                  class="btn btn-sm btn-outline-secondary py-0 px-1"
                                                  style="font-size: 0.68rem; line-height: 1.2;"
                                                  :disabled="Number(cIdx) === stg.tieBreakerCriteria.length - 1"
                                                  @click="moveStageCriterionDown(stg, Number(cIdx))"
                                                  title="Bajar prioridad"
                                                >
                                                  ▼
                                                </button>
                                              </div>
                                              <span class="badge bg-primary text-white font-monospace py-0.5 px-1.5 fs-1 flex-shrink-0">
                                                {{ c.order || (Number(cIdx) + 1) }}°
                                              </span>
                                              <span class="small fw-semibold text-truncate text-body-emphasis" :title="c.description">
                                                {{ c.description }}
                                              </span>
                                              <span v-if="c.code" class="badge bg-secondary-subtle text-secondary font-monospace py-0 px-1 fs-1 flex-shrink-0">
                                                {{ c.code }}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              class="btn btn-sm btn-link text-danger p-0 px-1 text-decoration-none flex-shrink-0"
                                              @click="removeStageCriterion(stg, Number(cIdx))"
                                              title="Quitar criterio"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                        <div v-else class="text-secondary small fst-italic">
                                          Selecciona los criterios en el orden en que se aplicarán (1°, 2°, 3°...)
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  </template>
                                </tbody>
                              </table>
                            </div>

                            <!-- Pie de la sub-tarjeta: botón + Agregar Etapa en Línea (exacto al diseño) -->
                            <div class="mt-2 pt-1">
                              <button
                                type="button"
                                class="btn btn-sm btn-link text-primary text-decoration-none fw-semibold d-inline-flex align-items-center gap-1 p-0"
                                @click="addStageToCategoryDirect(item)"
                              >
                                <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
                                <span>+ Agregar</span>
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
                <table class="table table-hover table-sm align-middle mb-0 app-table">
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

          <!-- PIE DE ACCIONES DEL FORMULARIO ESTANDARIZADO -->
          <div class="border-top border-secondary-subtle pt-3 mt-4 pb-2 px-2 d-flex align-items-center justify-content-end gap-3">
            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              style="height: 40px;"
              @click="closeForm"
            >
              Cancelar
            </button>
            <button
              v-if="activeTab === 'schedules'"
              type="button"
              class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
              style="height: 40px;"
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
              class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
              style="height: 40px;"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : (activeTab === 'playerTransfers' ? 'Generar Orden de Transferencia' : 'Registrar ' + activeTabLabel)) }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: GENERAR FIXTURE (solo los partidos de la etapa en proceso) -->
    <!-- ========================================== -->
    <div v-if="showFixtureModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.7); z-index: 1055;">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow app-modal">
          <div class="modal-header bg-primary text-white app-modal-header">
            <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2 app-modal-title">
              <iconify-icon icon="solar:calendar-add-bold" class="fs-4"></iconify-icon>
              <span>Generar Fixture</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showFixtureModal = false"></button>
          </div>
          <form @submit.prevent="generateFixture">
            <div class="modal-body p-4 app-modal-body">
              <div v-if="loadingFixtureOptions" class="text-center py-4">
                <span class="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                <span class="text-secondary small">Cargando los campeonatos iniciados...</span>
              </div>

              <div v-else-if="fixtureEditions.length === 0" class="alert alert-warning mb-0 d-flex align-items-start gap-2">
                <iconify-icon icon="solar:danger-triangle-bold" class="fs-4 text-warning"></iconify-icon>
                <span>
                  No hay campeonatos iniciados. Inicia el campeonato de cada categoría desde <strong>Ediciones de Torneo → Acciones → Iniciar Campeonato</strong> y vuelve a generar el fixture.
                </span>
              </div>

              <template v-else>
                <label class="form-label fw-semibold small">
                  Edición del Torneo <span class="text-danger">*</span>
                  <span class="text-secondary fw-normal">(puedes seleccionar varias)</span>
                </label>
                <div class="border rounded-3 p-2 mb-3">
                  <div v-for="ed in fixtureEditions" :key="ed.id" class="form-check py-1">
                    <input class="form-check-input" type="checkbox" :id="'fixture_ed_' + ed.id" :value="ed.id" v-model="selectedFixtureEditionIds" />
                    <label class="form-check-label fw-medium" :for="'fixture_ed_' + ed.id">
                      {{ ed.name }}
                      <span class="badge bg-info-subtle text-info border border-info-subtle ms-1">{{ ed.stages.length }} etapa(s) en proceso</span>
                    </label>
                  </div>
                </div>

                <!-- Informativo: etapas en proceso y categorías de cada edición seleccionada -->
                <div v-for="ed in selectedFixtureEditions" :key="'info_' + ed.id" class="card p-3 mb-3 rounded-4 border border-secondary-subtle">
                  <h6 class="fw-bold mb-2 d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:cup-star-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                    <span>{{ ed.name }}</span>
                  </h6>
                  <div v-if="ed.stages.length === 0" class="text-secondary small">Esta edición no tiene etapas en proceso.</div>
                  <div v-else class="table-responsive">
                    <table class="table table-sm align-middle mb-0 app-table app-table-framed">
                      <thead class="table-primary fs-2">
                        <tr>
                          <th class="fw-semibold">Etapa en proceso</th>
                          <th class="fw-semibold">Categoría</th>
                          <th class="text-center fw-semibold">Equipos aprobados</th>
                          <th class="text-center fw-semibold">Partidos</th>
                          <th class="fw-semibold">Fixture</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="st in ed.stages" :key="st.id">
                          <td>
                            <span class="fw-semibold">{{ st.name }}</span>
                            <span class="badge bg-warning-subtle text-warning border border-warning-subtle ms-1">En proceso</span>
                          </td>
                          <td>{{ st.categoryName || '-' }}</td>
                          <td class="text-center font-monospace">
                            {{ st.teamsCount }}
                            <small v-if="st.pendingTeamsCount > 0" class="text-warning d-block">{{ st.pendingTeamsCount }} pendiente(s)</small>
                          </td>
                          <td class="text-center font-monospace">{{ st.matchesCount }}</td>
                          <td>
                            <span v-if="st.canGenerate" class="badge bg-success-subtle text-success border border-success-subtle">Listo para generar</span>
                            <small v-else class="text-secondary">{{ st.reason }}</small>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </template>

              <small class="text-secondary d-block mt-2">
                El fixture solo genera los partidos de cada categoría; los días, horarios y canchas se programan después.
              </small>
            </div>

            <div class="modal-footer bg-light app-modal-footer">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="showFixtureModal = false">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                :disabled="generatingFixture || fixtureReadyStages === 0"
              >
                <span v-if="generatingFixture" class="spinner-grow spinner-grow-sm text-white"></span>
                <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
                <span>{{ generatingFixture ? 'Generando Fixture...' : 'Generar Fixture' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: DETALLE DE LA ORDEN DE PAGO         -->
    <!-- ========================================== -->
    <div v-if="showPaymentOrderModal && selectedPaymentOrder" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.7); z-index: 1055;">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow app-modal">
          <div class="modal-header bg-primary text-white app-modal-header">
            <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2 app-modal-title">
              <iconify-icon icon="solar:wallet-money-bold-duotone" class="fs-4"></iconify-icon>
              <span>Orden de Pago ORD-{{ String(selectedPaymentOrder.id).padStart(6, '0') }}</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showPaymentOrderModal = false"></button>
          </div>

          <div class="modal-body p-4 app-modal-body">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <small class="text-secondary d-block">Equipo</small>
                <span class="fw-semibold">{{ selectedPaymentOrder.teamName }}</span>
              </div>
              <div class="col-md-6">
                <small class="text-secondary d-block">Edición del Torneo</small>
                <span class="fw-semibold">{{ selectedPaymentOrder.editionName }}</span>
              </div>
              <div class="col-md-4">
                <small class="text-secondary d-block">Estado</small>
                <span v-if="selectedPaymentOrder.status === 'PAID'" class="badge bg-success-subtle text-success border border-success-subtle">🟢 Pagada</span>
                <span v-else-if="selectedPaymentOrder.status === 'CANCELLED'" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">⛔ Anulada</span>
                <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle">⏳ Pendiente de Pago</span>
              </div>
              <div class="col-md-4">
                <small class="text-secondary d-block">Fecha de la orden</small>
                <span class="fw-semibold">{{ selectedPaymentOrder.createdAt ? new Date(selectedPaymentOrder.createdAt).toLocaleDateString() : '-' }}</span>
              </div>
              <div class="col-md-4">
                <small class="text-secondary d-block">Valor total</small>
                <span class="fw-bold font-monospace fs-5">${{ Number(selectedPaymentOrder.totalAmount || 0).toFixed(2) }}</span>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0 app-table app-table-framed">
                <thead class="table-primary fs-2">
                  <tr>
                    <th class="fw-semibold">Categoría / Concepto</th>
                    <th class="text-end fw-semibold" style="width: 140px;">Valor ($)</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="d in (selectedPaymentOrder.details || [])" :key="d.id">
                    <tr class="table-active">
                      <td class="fw-semibold">⚽ {{ d.categoryName }}</td>
                      <td class="text-end fw-semibold font-monospace">${{ Number(d.subtotal || 0).toFixed(2) }}</td>
                    </tr>
                    <tr v-for="(c, cIdx) in (d.concepts || [])" :key="d.id + '_' + cIdx">
                      <td class="ps-4 text-secondary">{{ c.description }}</td>
                      <td class="text-end font-monospace">${{ Number(c.amount || 0).toFixed(2) }}</td>
                    </tr>
                  </template>
                  <tr v-if="!selectedPaymentOrder.details || selectedPaymentOrder.details.length === 0">
                    <td colspan="2" class="text-center py-3 text-muted">La orden no tiene categorías.</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td class="text-end fw-bold">Valor total</td>
                    <td class="text-end fw-bold font-monospace">${{ Number(selectedPaymentOrder.totalAmount || 0).toFixed(2) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="modal-footer bg-light app-modal-footer">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="showPaymentOrderModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: VISOR DE CARNET DEPORTIVO (QR)      -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div
        v-if="showCarnetModal && selectedCarnet"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.75); z-index: 2050; backdrop-filter: blur(4px);"
        role="dialog"
        aria-modal="true"
        @click.self="showCarnetModal = false"
      >
        <div class="modal-dialog modal-md modal-dialog-centered">
          <div class="modal-content bg-navy-card border border-secondary-subtle rounded-4 shadow-lg overflow-hidden">
            <div class="modal-header border-bottom border-secondary-subtle px-4 py-3 d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
                <span class="p-2 rounded-3 bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
                  <iconify-icon icon="solar:card-2-bold-duotone" class="fs-3"></iconify-icon>
                </span>
                <div>
                  <h5 class="modal-title fw-bold text-body-emphasis mb-0">
                    Credencial Deportiva Oficial
                  </h5>
                  <small class="text-secondary font-monospace">
                    Carnet: {{ selectedCarnet.carnetCode || selectedCarnet.player?.code || selectedCarnet.carnetNumber }}
                  </small>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                @click="showCarnetModal = false"
              >
                <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
                <span>Cerrar</span>
              </button>
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
                          :class="selectedCarnet.status === 'ELIGIBLE' || selectedCarnet.status === 'APPROVED' || selectedCarnet.status === 'ACTIVE' || selectedCarnet.isActive ? 'bg-success text-white' : 'bg-warning text-dark'"
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
                        :src="`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent('JUGADOR:' + (selectedCarnet.player?.identification || selectedCarnet.id) + '|CARNET:' + (selectedCarnet.carnetCode || selectedCarnet.player?.code || selectedCarnet.carnetNumber) + '|CLUB:' + (selectedCarnet.team?.name || ''))}`"
                        alt="QR Carnet"
                        style="width: 80px; height: 80px;"
                        class="border rounded p-1 bg-white"
                      />
                      <div class="text-start">
                        <small class="d-block text-muted font-monospace fs-1">CÓDIGO DE CARNET</small>
                        <small class="fw-bold font-monospace text-dark">{{ selectedCarnet.carnetCode || selectedCarnet.player?.code || selectedCarnet.carnetNumber || String(selectedCarnet.id ?? '').padStart(8, '0') }}</small>
                        <small class="d-block text-muted fs-1 mt-1">Escanee para verificar habilitación en mesa</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-top border-secondary-subtle px-4 py-3 d-flex justify-content-end gap-2">
              <button
                type="button"
                class="btn btn-outline-secondary rounded-pill px-4"
                style="height: 38px;"
                @click="showCarnetModal = false"
              >
                Cerrar
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                style="height: 38px;"
                @click="printCarnet"
              >
                <iconify-icon icon="solar:printer-line-duotone" class="fs-5"></iconify-icon>
                <span>Imprimir Credencial</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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
        <div class="modal-content border-0 shadow-lg app-modal">
          <div class="modal-header bg-primary text-white app-modal-header">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:history-bold-duotone" class="fs-3"></iconify-icon>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0 app-modal-title">
                  Historial de Categorías · {{ selectedTeamForHistory?.name }}
                </h5>
                <small class="text-white-50">Registro por campeonatos anuales (ej: 2026 Máxima, 2027 Primera)</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showTeamCategoryModal = false"></button>
          </div>

          <div class="modal-body p-4 app-modal-body">
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
              <table class="table table-hover align-middle mb-0 app-table">
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

          <div class="modal-footer bg-light app-modal-footer">
            <button type="button" class="btn btn-secondary rounded-pill px-4" @click="showTeamCategoryModal = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL: CATEGORÍAS / EQUIPOS DE UNA EDICIÓN (INSCRIPCIÓN)  -->
    <!-- ========================================================= -->
    <Teleport to="body">
      <div
        v-if="teamRegModal"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.75); z-index: 2050; backdrop-filter: blur(4px);"
        role="dialog"
        aria-modal="true"
        @click.self="teamRegModal = null"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-navy-card border border-secondary-subtle rounded-4 shadow-lg overflow-hidden app-modal">
            <!-- Cabecera del Modal Estandarizada -->
            <div class="modal-header border-bottom border-secondary-subtle px-4 py-3 d-flex justify-content-between align-items-center app-modal-header">
              <div class="d-flex align-items-center gap-3">
                <span
                  class="p-2 rounded-3 d-flex align-items-center justify-content-center"
                  :class="teamRegModal.mode === 'categories' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'"
                  style="width: 44px; height: 44px;"
                >
                  <iconify-icon
                    :icon="teamRegModal.mode === 'categories' ? 'solar:medal-star-bold-duotone' : 'solar:shield-bold-duotone'"
                    class="fs-3"
                  ></iconify-icon>
                </span>
                <div>
                  <h5 class="modal-title fw-bold text-body-emphasis mb-0 app-modal-title">
                    {{ teamRegModal.mode === 'categories' ? 'Categorías del Torneo' : 'Equipos Inscritos' }} · {{ teamRegModal.row.categoryEdition?.name }}
                  </h5>
                  <small class="text-secondary">
                    {{ teamRegModal.mode === 'categories' ? teamRegModal.row.categories.length + ' categoría(s) configurada(s) en esta edición' : teamRegModal.row.teams.length + ' equipo(s) inscrito(s) en esta edición' }}
                  </small>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                @click="teamRegModal = null"
              >
                <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
                <span>Cerrar</span>
              </button>
            </div>

            <div class="modal-body p-4 app-modal-body">
              <!-- Categorías de la edición -->
              <div v-if="teamRegModal.mode === 'categories'" class="table-responsive border border-secondary-subtle rounded-3">
                <table class="table table-hover align-middle mb-0 crud-table app-table">
                  <thead class="table-primary">
                    <tr>
                      <th style="width: 60px;" class="text-center">#</th>
                      <th>Categoría del Torneo</th>
                      <th>Vigencia (Inicio - Fin)</th>
                      <th class="text-end">Costo Inscripción</th>
                      <th class="text-center">Cupo Máx. Jug.</th>
                      <th class="text-center">Equipos Inscritos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="teamRegModal.row.categories.length === 0">
                      <td colspan="6" class="text-center text-secondary py-5">
                        <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-1 text-secondary d-block mx-auto mb-2"></iconify-icon>
                        Esta edición no tiene categorías configuradas.
                      </td>
                    </tr>
                    <tr v-for="(cat, idx) in teamRegModal.row.categories" :key="cat.categoryId || idx">
                      <td class="text-center fw-bold font-monospace text-secondary">{{ Number(idx) + 1 }}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="p-2 rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 34px; height: 34px;">
                            <iconify-icon icon="solar:cup-bold" class="fs-5"></iconify-icon>
                          </div>
                          <div>
                            <span class="fw-bold text-body-emphasis d-block">{{ cat.name }}</span>
                            <div class="d-flex align-items-center gap-1 mt-0.5">
                              <span v-if="cat.acronyms" class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-0.5">{{ cat.acronyms }}</span>
                              <span v-if="cat.gender" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-0.5">
                                {{ cat.gender === 'FEMALE' ? 'Femenino' : cat.gender === 'MIXED' ? 'Mixto' : cat.gender === 'MALE' ? 'Masculino' : cat.gender }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="font-monospace small text-secondary">
                        <template v-if="cat.startDate || cat.endDate">📅 {{ String(cat.startDate || '').slice(0, 10) || 'N/A' }} → {{ String(cat.endDate || '').slice(0, 10) || 'N/A' }}</template>
                        <template v-else>Según edición general</template>
                      </td>
                      <td class="text-end">
                        <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1">
                          ${{ Number(cat.registrationFee || 0).toFixed(2) }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                          👥 Máx. {{ cat.maxPlayers || 25 }} jug.
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="badge rounded-pill px-3 py-1" :class="cat.teamsCount > 0 ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'">
                          🛡️ {{ cat.teamsCount }} equipo(s)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Equipos inscritos en la edición -->
              <div v-else class="table-responsive border border-secondary-subtle rounded-3">
                <table class="table table-hover align-middle mb-0 crud-table app-table">
                  <thead class="table-primary">
                    <tr>
                      <th style="width: 60px;" class="text-center">#</th>
                      <th>Equipo / Club</th>
                      <th>Categoría</th>
                      <th>Estado Inscripción</th>
                      <th>Estado Pago</th>
                      <th class="text-center" style="width: 95px;">Plantilla</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="teamRegModal.row.teams.length === 0">
                      <td colspan="6" class="text-center text-secondary py-5">
                        <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-1 text-secondary d-block mx-auto mb-2"></iconify-icon>
                        No hay equipos inscritos en esta edición.
                      </td>
                    </tr>
                    <tr v-for="(tm, idx) in teamRegModal.row.teams" :key="tm.id">
                      <td class="text-center fw-bold font-monospace text-secondary">{{ Number(idx) + 1 }}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <img
                            v-if="tm.logo"
                            :src="tm.logo"
                            class="rounded-circle shadow-xs border border-secondary-subtle flex-shrink-0"
                            style="width: 32px; height: 32px; object-fit: cover;"
                          />
                          <div
                            v-else
                            class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                            style="width: 32px; height: 32px;"
                          >
                            <iconify-icon icon="solar:shield-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                          </div>
                          <div>
                            <span class="fw-bold text-body-emphasis d-block">{{ tm.name || tm.shortName || '-' }}</span>
                            <span v-if="tm.acronyms" class="badge bg-secondary-subtle text-secondary font-monospace px-1.5 py-0 fs-1">{{ tm.acronyms }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span v-if="tm.categoryName" class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                          ⚽ {{ tm.categoryName }}
                        </span>
                        <span v-else class="text-muted small">-</span>
                      </td>
                      <td>
                        <span class="badge border px-2 py-1" :class="teamRegStatusMeta[tm.status]?.cls || 'bg-secondary-subtle text-secondary'">
                          {{ teamRegStatusMeta[tm.status]?.label || tm.status || '-' }}
                        </span>
                      </td>
                      <td>
                        <span class="badge border px-2 py-1" :class="teamRegPaymentMeta[tm.paymentStatus]?.cls || 'bg-secondary-subtle text-secondary'">
                          {{ teamRegPaymentMeta[tm.paymentStatus]?.label || tm.paymentStatus || '-' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-info rounded-2 p-1 d-inline-flex align-items-center justify-content-center"
                          style="width: 30px; height: 30px;"
                          title="Ver Plantilla del Club"
                          @click="openRosterFromTeamRegModal(tm.id)"
                        >
                          <iconify-icon icon="solar:clipboard-list-bold-duotone" class="fs-5"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer border-top border-secondary-subtle px-4 py-3 d-flex justify-content-end gap-2 app-modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary rounded-pill px-4"
                style="height: 38px;"
                @click="teamRegModal = null"
              >
                Cerrar
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
                style="height: 38px;"
                @click="() => { const r = teamRegModal?.row; teamRegModal = null; if (r) openEditForm(r); }"
              >
                <iconify-icon icon="solar:pen-new-square-line-duotone" class="fs-5"></iconify-icon>
                <span>Editar Inscripciones</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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
        <div class="modal-content border-0 shadow-lg app-modal">
          <div class="modal-header bg-dark text-white app-modal-header">
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
                <h5 class="modal-title fw-bold text-white mb-0 app-modal-title">
                  Directorio del Club · {{ selectedTeamForManagement.name }}
                </h5>
                <small class="text-white-50">Cargos oficiales del directorio del club deportivo</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showTeamManagementModal = false"></button>
          </div>

          <div class="modal-body p-4 app-modal-body">
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
                      maxlength="10"
                      inputmode="numeric"
                      @keypress="!/[0-9]/.test($event.key) && $event.preventDefault()"
                      @input="(e: any) => { const clean = e.target.value.replace(/\D/g, '').slice(0, 10); e.target.value = clean; formTeamManagement.cellphone = clean; }"
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
                <table class="table table-hover align-middle mb-0 app-table">
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

            <div class="modal-footer bg-body-tertiary app-modal-footer">
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
        <div class="modal-content border-0 shadow-lg app-modal">
          <div class="modal-header bg-info text-white app-modal-header">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-3 text-white"></iconify-icon>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0 app-modal-title">
                  Transferir Jugador · {{ selectedPlayerForTransfer?.name }} {{ selectedPlayerForTransfer?.lastName }}
                </h5>
                <small class="text-white-50">DNI: {{ selectedPlayerForTransfer?.identification || 'Sin cédula' }}</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showTransferModal = false"></button>
          </div>

          <form @submit.prevent="processTransfer">
            <div class="modal-body p-4 app-modal-body">
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
                <div class="col-md-12">
                  <label class="form-label text-secondary small fw-semibold">Edición del Campeonato *</label>
                  <select v-model="formTransfer.editionId" class="form-select" required>
                    <option value="" disabled>Seleccionar edición...</option>
                    <option v-for="ed in categoryEditionsList" :key="ed.id" :value="ed.id">{{ ed.name }}</option>
                  </select>
                </div>

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

            

            <div class="modal-footer bg-light app-modal-footer">
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
        <div class="modal-content border-0 shadow-lg app-modal">
          <div class="modal-header bg-primary text-white app-modal-header">
            <div class="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:history-bold-duotone" class="fs-3"></iconify-icon>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0 app-modal-title">
                  Historial de Pases y Transferencias · {{ selectedPlayerForTransfersHistory?.name }} {{ selectedPlayerForTransfersHistory?.lastName }}
                </h5>
                <small class="text-white-50">Trayectoria de clubes y traspasos a lo largo de las temporadas</small>
              </div>
            </div>

            
            <button type="button" class="btn-close btn-close-white" @click="showPlayerTransfersModal = false"></button>
          </div>

          <div class="modal-body p-4 app-modal-body">
            <div class="table-responsive border rounded-3">
              <table class="table table-hover align-middle mb-0 app-table">
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

          <div class="modal-footer bg-light app-modal-footer">
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
          <div class="modal-content border-0 shadow-lg app-modal">
            <div class="modal-header bg-primary text-white app-modal-header">
              <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2 app-modal-title">
                <iconify-icon icon="solar:user-check-bold-duotone" class="fs-4"></iconify-icon>
                <span>Clasificación de Futbolistas · Categoría: {{ selectedCategoryForClassifications.categoryDescription || getCategoryNameById(selectedCategoryForClassifications.categoryId) }}</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="showCategoryClassificationsModal = false"></button>
            </div>
            <div class="modal-body p-4 app-modal-body">
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
              <div class="table-responsive border border-secondary-subtle rounded-3">
                <table class="table table-sm table-hover mb-0 align-middle crud-table app-table">
                  <thead class="table-primary">
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

            
            <div class="modal-footer border-top border-secondary-subtle app-modal-footer">
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
          <div class="modal-content border-0 shadow-lg app-modal">
            <div class="modal-header bg-primary text-white app-modal-header">
              <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2 app-modal-title">
                <iconify-icon icon="solar:diagram-up-bold-duotone" class="fs-4"></iconify-icon>
                <span>Configuración de Etapas y Fases · Categoría: {{ selectedCategoryForStages.categoryDescription || getCategoryNameById(selectedCategoryForStages.categoryId) }}</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="showCategoryStagesModal = false"></button>
            </div>
            <div class="modal-body p-4 app-modal-body">
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
                      <div class="table-responsive border border-secondary-subtle rounded-3 bg-body">
                        <table class="table table-sm table-hover mb-0 align-middle crud-table app-table">
                          <thead class="table-primary fs-1 text-uppercase">
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
              <div class="table-responsive border border-secondary-subtle rounded-3 bg-body">
                <table class="table table-sm table-hover mb-0 align-middle crud-table app-table">
                  <thead class="table-primary fs-1 text-uppercase">
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
                          #{{ stg.stageOrder || (Number(sIdx) + 1) }}
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
                            <span class="badge bg-success text-white rounded-pill px-1" style="font-size: 0.65rem;">#{{ crit.order || (Number(cIdx) + 1) }}</span>
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

            
            <div class="modal-footer bg-light app-modal-footer">
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
import { getSubModules } from '@/services/config.service';
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

const playerDocumentTypeOptions = [
  { value: '05', label: 'Cédula de Identidad (05)' },
  { value: '06', label: 'Pasaporte (06)' },
  { value: '08', label: 'Identificación del Exterior / DNI (08)' },
];

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
      { key: 'birthDate', label: 'Fecha de Nacimiento *', type: 'date', colClass: 'col-md-4' },
      { key: 'name', label: 'Nombres *', type: 'text', colClass: 'col-md-4' },
      { key: 'lastName', label: 'Apellidos *', type: 'text', colClass: 'col-md-4' },
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
      { key: 'address', label: 'Dirección', type: 'text', colClass: 'col-md-6', placeholder: 'Dirección domiciliaria (calle principal, secundaria, sector)' },
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
      { key: 'minAge', label: 'Edad Mín.' },
      { key: 'maxAge', label: 'Edad Máx.' },
    ],
    fields: [
      {
        key: 'divisionGroupId',
        label: 'Grupo de División *',
        type: 'select',
        options: [],
        colClass: 'col-md-4',
        placeholder: 'Seleccionar grupo de división...',
      },
      { key: 'name', label: 'Nombre de la Categoría *', type: 'text', colClass: 'col-md-4', placeholder: 'Ej. Máxima, Primera, Juvenil' },
      { key: 'acronyms', label: 'Siglas de la Categoría', type: 'text', colClass: 'col-md-4', placeholder: 'Ej. MAX, PRI, JUV' },
      { key: 'minAge', label: 'Edad Mínima', type: 'number', colClass: 'col-md-4' },
      { key: 'maxAge', label: 'Edad Máxima', type: 'number', colClass: 'col-md-4' },
      { key: 'code', label: 'Código Secuencial de Categoría', type: 'text', colClass: 'col-md-4', placeholder: 'Autogenerado ej. CAT-001', readonly: true, disabled: true },
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
    // El listado trae una fila por edición del torneo (con sus categorías y equipos); los filtros se aplican en el backend.
    api: {
      ...CampeonatoApi.teamRegistrations,
      list: (params: any) => CampeonatoApi.teamRegistrations.listGrouped({ ...params, status: filterTeamRegStatus.value, paymentStatus: filterTeamRegPayment.value }),
    },
    columns: [
      { key: 'categoryEdition.name', label: 'Edición Torneo' },
      { key: 'categoriesCount', label: 'Categorías' },
      { key: 'teamsCount', label: 'Equipos' },
    ],
    fields: [],
  },
  {
    id: 'playerRegistrations',
    label: 'Inscripción y Carnets',
    icon: 'solar:card-2-bold-duotone',
    api: {
      ...CampeonatoApi.playerRegistrations,
      list: (params: any) =>
        CampeonatoApi.playerRegistrations.listGrouped({
          ...params,
          categoryEditionId: filterPlayerRegEditionId.value !== 'todos' ? Number(filterPlayerRegEditionId.value) : undefined,
        }),
    },
    columns: [
      { key: 'team.name', label: 'Equipo / Club' },
      { key: 'categoryEdition.name', label: 'Edición Torneo' },
      { key: 'categoriesSummary', label: 'Categorías Permitidas' },
      { key: 'playersCount', label: 'Jugadores Inscritos' },
    ],
    fields: [],
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
    // Por defecto lista las órdenes de pago generadas al inscribir equipos; la otra vista lista los cobros registrados
    api: {
      ...CampeonatoApi.payments,
      list: (params: any) =>
        paymentsView.value === 'orders'
          ? CampeonatoApi.teamPaymentOrders.list({ ...params, status: filterPaymentOrderStatus.value !== 'todos' ? filterPaymentOrderStatus.value : undefined })
          : CampeonatoApi.payments.list(params),
    },
    get columns() {
      return paymentsView.value === 'orders'
        ? [
            { key: 'orderNumber', label: 'Orden' },
            { key: 'teamName', label: 'Equipo' },
            { key: 'editionName', label: 'Edición del Torneo' },
            { key: 'categoriesSummary', label: 'Categorías' },
            { key: 'totalAmount', label: 'Valor Total ($)' },
            { key: 'status', label: 'Estado' },
            { key: 'createdAt', label: 'Fecha', type: 'date' },
          ]
        : [
            { key: 'concept', label: 'Concepto' },
            { key: 'amount', label: 'Monto ($)' },
            { key: 'paymentMethod', label: 'Método' },
            { key: 'receiptNumber', label: '# Recibo' },
            { key: 'status', label: 'Estado' },
          ];
    },
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
    id: 'divisionGroups',
    label: 'Grupos de División',
    icon: 'solar:layers-minimalistic-bold-duotone',
    api: CampeonatoApi.divisionGroups,
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
      { key: 'enabled', label: 'Estado', type: 'boolean' },
    ],
    fields: [
      { key: 'code', label: 'Código (Generado por el sistema)', type: 'text', colClass: 'col-md-4', disabled: true, readonly: true },
      { key: 'description', label: 'Descripción', type: 'text', colClass: 'col-md-12', placeholder: 'Ej. Senior Masculino, Senior Femenino, Sub-40' },
    ],
  },
  {
    id: 'playerTransfers',
    label: 'Transferencias de Jugadores',
    icon: 'solar:transfer-horizontal-bold-duotone',
    api: {
      ...CampeonatoApi.playerTransfers,
      list: (params: any) =>
        CampeonatoApi.playerTransfers.list({
          ...params,
          editionId: filterTransferEditionId.value !== 'todos' ? Number(filterTransferEditionId.value) : undefined,
          categoryId: filterTransferCategoryId.value !== 'todos' ? Number(filterTransferCategoryId.value) : undefined,
          status: filterTransferStatus.value !== 'todos' ? filterTransferStatus.value : undefined,
        }),
    },
    columns: [
      { key: 'orderNumber', label: 'Orden' },
      { key: 'player.name', label: 'Futbolista' },
      { key: 'edition.name', label: 'Edición' },
      { key: 'category.name', label: 'Categoría' },
      { key: 'originTeam.name', label: 'Club Origen' },
      { key: 'destinationTeam.name', label: 'Club Destino' },
      { key: 'status', label: 'Estado' },
      { key: 'approvalsSummary', label: 'Firmas / Resoluciones' },
      { key: 'requestDate', label: 'Fecha Solicitud', type: 'date' },
    ],
    // El formulario es propio (orden de transferencia): no usa campos genéricos
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
  { id: 'divisionGroups', label: 'Grupos de División', icon: 'solar:layers-minimalistic-bold-duotone' },
  { id: 'categoryEditions', label: 'Ediciones de Torneo', icon: 'solar:calendar-date-bold-duotone' },
  { id: 'stages', label: 'Plantillas de Etapas y Fases', icon: 'solar:diagram-up-bold-duotone' },
  { id: 'scenaries', label: 'Canchas (Escenarios)', icon: 'solar:map-point-wave-bold-duotone' },
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
  editionId: number | '';
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
  editionId: number;
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
  // En la base SUB-CAMP-020 es "Grupos de División"; Transferencias de Jugadores usa el 021 (y se reconoce también por su ruta)
  divisionGroups: 'SUB-CAMP-020',
  playerTransfers: 'SUB-CAMP-021',
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
    // Transferencias puede estar registrada con una ruta en español (/campeonato/transferencias)
    const extraHint = t.id === 'playerTransfers' ? 'transferencias' : '';
    const matchesUrl = (u: string) => u.includes(`tab=${t.id.toLowerCase()}`) || u.includes(t.id.toLowerCase()) || u === tabUrl || (extraHint !== '' && u.includes(extraHint));
    return allowedUrls.some(matchesUrl) || subUrls.some(matchesUrl);
  });
});

// Las pestañas de Configuraciones siguen el orden de los submódulos de Campeonato (order_index): el menú de accesos ya llega ordenado,
// así que la posición del submódulo en `children` es su orden. Se busca por código y, si no hay, por la ruta (ej. divisionGroups).
// Una pestaña sin submódulo en el menú queda al final, con su orden original.
// El menú de accesos solo trae los submódulos incluidos en el plan; los demás (ej. Grupos de División) no están en él y quedarían al final.
// Por eso el orden se toma del catálogo completo del módulo (ya ordenado por order_index) y el menú queda de respaldo.
const catalogCampSubModules = ref<any[]>([]);

const loadCatalogCampSubModules = async () => {
  const menu = authStore.accessInfo?.menu || [];
  const campMenu = menu.find((m) => m.code === 'MOD-010' || m.description?.toLowerCase().includes('campeonato'));
  if (!campMenu?.id) return;
  try {
    const res: any = await getSubModules({ moduleId: Number(campMenu.id), page: 1, limit: 200 });
    catalogCampSubModules.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  } catch {
    catalogCampSubModules.value = [];
  }
};

const configSubTabOrder = (tabId: string): number => {
  const menu = authStore.accessInfo?.menu || [];
  const campMenu = menu.find((m) => m.code === 'MOD-010' || m.description?.toLowerCase().includes('campeonato'));
  const children: any[] = catalogCampSubModules.value.length > 0 ? catalogCampSubModules.value : campMenu?.children || [];
  const code = tabToSubCode[tabId];
  let index = code ? children.findIndex((c) => (c.code || '').toUpperCase() === code) : -1;
  if (index === -1) index = children.findIndex((c) => (c.url_desc || c.url || '').toLowerCase().includes(tabId.toLowerCase()));
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const visibleConfigSubTabs = computed(() => {
  return configSubTabsList
    .filter((st) => allowedTabs.value.some((at) => at.id === st.id))
    .sort((a, b) => configSubTabOrder(a.id) - configSubTabOrder(b.id));
});

const activeTab = ref('teams');
const currentTabConfig = computed<TabConfig>(() => {
  return tabs.find((t) => t.id === activeTab.value) ?? tabs[0]!;
});
const activeTabLabel = computed(() => currentTabConfig.value.label);
const columns = computed(() => currentTabConfig.value.columns);
const formFields = computed(() => {
  const fields = currentTabConfig.value.fields || [];
  if ((activeTab.value === 'categories' || activeTab.value === 'divisionGroups') && !isEditing.value) {
    return fields.filter((f) => f.key !== 'code');
  }
  return fields;
});

const items = ref<any[]>([]);
const filterTeamStatus = ref<'todos' | 'activo' | 'inactivo'>('todos');
const filterPlayerStatus = ref<'todos' | 'activo' | 'inactivo'>('todos');
const filterEditionStatus = ref<'todos' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('todos');
const filterTeamRegStatus = ref<'todos' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISQUALIFIED'>('todos');
const filterTeamRegPayment = ref<'todos' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'REFUNDED'>('todos');
const filterPlayerRegEditionId = ref<string>('todos');

// Filtros del listado de Transferencias de Jugadores
const filterTransferEditionId = ref<string>('todos');
const filterTransferCategoryId = ref<string>('todos');
const filterTransferStatus = ref<string>('todos');

const transferFilterCategories = computed(() => {
  if (filterTransferEditionId.value === 'todos') return [];
  const edition = categoryEditionsList.value.find((e: any) => String(e.id) === filterTransferEditionId.value);
  return (edition?.categoriesDetail ?? []).map((d: any) => ({
    id: d.categoryId,
    name: d.categoryDescription || d.category?.name || getCategoryNameById(d.categoryId) || 'Categoría',
  }));
});

const onTransferEditionFilterChange = () => {
  filterTransferCategoryId.value = 'todos';
  searchList();
};
const filterPlayerRegStatus = ref<'todos' | 'ELIGIBLE' | 'PENDING_APPROVAL' | 'INELIGIBLE' | 'SUSPENDED' | 'TRANSFERRED'>('todos');

const displayedItems = computed(() => {
  if (activeTab.value === 'teams') {
    return items.value.filter((item) => {
      if (filterTeamStatus.value === 'activo' && item.isActive === false) return false;
      if (filterTeamStatus.value === 'inactivo' && item.isActive !== false) return false;
      return true;
    });
  }
  if (activeTab.value === 'players') {
    return items.value.filter((item) => {
      if (filterPlayerStatus.value === 'activo' && item.isActive === false) return false;
      if (filterPlayerStatus.value === 'inactivo' && item.isActive !== false) return false;
      return true;
    });
  }
  if (activeTab.value === 'categoryEditions') {
    return items.value.filter((item) => {
      // Una edición sin inicio registrado está pendiente, aunque su estado guardado sea otro
      const currentStatus = item.status === 'COMPLETED' || item.status === 'CANCELLED' ? item.status : item.startedAt ? 'IN_PROGRESS' : 'PENDING';
      if (filterEditionStatus.value !== 'todos' && currentStatus !== filterEditionStatus.value) return false;
      return true;
    });
  }
  if (activeTab.value === 'playerRegistrations') {
    return items.value.filter((item) => {
      if (filterPlayerRegStatus.value !== 'todos') {
        const st = item.status || 'ELIGIBLE';
        if (filterPlayerRegStatus.value === 'TRANSFERRED' && (st === 'TRANSFERRED' || st === 'FINALIZED_BY_TRANSFER')) return true;
        if (st !== filterPlayerRegStatus.value) return false;
      }
      return true;
    });
  }
  return items.value;
});
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const totalPages = ref(1);
const searchQuery = ref('');
const loading = ref(false);

const isFormOpen = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formData = ref<Record<string, any>>({});
const saving = ref(false);

const maxFoundationDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
});

const getFieldType = (field: any) => {
  if ((activeTab.value === 'teams' || activeTab.value === 'players') && field.key === 'email') return 'email';
  return field.type;
};

const getFieldInputMode = (fieldKey: string) => {
  if (activeTab.value === 'teams' && fieldKey === 'representativePhone') return 'numeric';
  if (activeTab.value === 'players' && (fieldKey === 'phone' || fieldKey === 'emergencyContactPhone')) return 'numeric';
  return undefined;
};

const getFieldMaxLength = (fieldKey: string): number | undefined => {
  if (activeTab.value === 'teams') {
    if (fieldKey === 'representativePhone' || fieldKey === 'acronyms') return 10;
    if (fieldKey === 'name') return 100;
    if (fieldKey === 'email') return 150;
  }
  if (activeTab.value === 'players') {
    if (fieldKey === 'phone' || fieldKey === 'emergencyContactPhone') return 10;
    if (fieldKey === 'name' || fieldKey === 'lastName') return 100;
    if (fieldKey === 'email') return 150;
  }
  return undefined;
};

const getFieldMinLength = (fieldKey: string): number | undefined => {
  if (activeTab.value === 'teams' && fieldKey === 'name') return 3;
  if (activeTab.value === 'players' && (fieldKey === 'name' || fieldKey === 'lastName')) return 3;
  return undefined;
};

const isFieldRequired = (fieldKey: string): boolean => {
  if (activeTab.value === 'teams' && fieldKey === 'name') return true;
  if (activeTab.value === 'players' && (fieldKey === 'name' || fieldKey === 'lastName')) return true;
  return false;
};

const getFieldMax = (fieldKey: string): string | undefined => {
  if (activeTab.value === 'teams' && fieldKey === 'dateOfFoundation') return maxFoundationDate.value;
  if (activeTab.value === 'players' && fieldKey === 'birthDate') return maxFoundationDate.value;
  return undefined;
};

const handlePlayerDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target) return;
  if (formData.value.documentType === '05') {
    const clean = target.value.replace(/\D/g, '').slice(0, 10);
    target.value = clean;
    formData.value.identification = clean;
  } else {
    formData.value.identification = target.value;
  }
};

const handleFieldKeypress = (e: KeyboardEvent, fieldKey: string) => {
  if (
    (activeTab.value === 'teams' && fieldKey === 'representativePhone') ||
    (activeTab.value === 'players' && (fieldKey === 'phone' || fieldKey === 'emergencyContactPhone'))
  ) {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }
};

const handleFieldInput = (e: Event, fieldKey: string) => {
  const target = e.target as HTMLInputElement;
  if (!target) return;
  if (activeTab.value === 'teams' && fieldKey === 'representativePhone') {
    const clean = target.value.replace(/\D/g, '').slice(0, 10);
    target.value = clean;
    formData.value[fieldKey] = clean;
    formData.value.representativePhone = clean;
  } else if (activeTab.value === 'players' && (fieldKey === 'phone' || fieldKey === 'emergencyContactPhone')) {
    const clean = target.value.replace(/\D/g, '').slice(0, 10);
    target.value = clean;
    formData.value[fieldKey] = clean;
  } else if (activeTab.value === 'teams' && fieldKey === 'acronyms') {
    const clean = target.value.toUpperCase().slice(0, 10);
    target.value = clean;
    formData.value[fieldKey] = clean;
    formData.value.acronyms = clean;
  } else if (activeTab.value === 'teams' && fieldKey === 'dateOfFoundation') {
    if (target.value && target.value.length === 10 && target.value > maxFoundationDate.value) {
      toast.warning('La fecha de fundación no puede ser mayor a la fecha actual.', 'Validación');
      target.value = maxFoundationDate.value;
      formData.value[fieldKey] = maxFoundationDate.value;
      formData.value.dateOfFoundation = maxFoundationDate.value;
    }
  } else if (activeTab.value === 'players' && fieldKey === 'birthDate') {
    if (target.value && target.value.length === 10 && target.value > maxFoundationDate.value) {
      toast.warning('La fecha de nacimiento no puede ser mayor a la fecha actual.', 'Validación');
      target.value = maxFoundationDate.value;
      formData.value[fieldKey] = maxFoundationDate.value;
      formData.value.birthDate = maxFoundationDate.value;
    }
    const calculated = calculatePlayerAgeDirect(formData.value.birthDate);
    if (calculated) {
      formData.value.ageYears = calculated.years;
      formData.value.ageMonths = calculated.months;
    }
  }
};

const handleFieldChange = (e: Event, fieldKey: string) => {
  const target = e.target as HTMLInputElement;
  if (!target) return;
  if (activeTab.value === 'teams' && fieldKey === 'dateOfFoundation') {
    if (target.value && target.value > maxFoundationDate.value) {
      toast.warning('La fecha de fundación no puede ser mayor a la fecha actual.', 'Validación');
      target.value = maxFoundationDate.value;
      formData.value[fieldKey] = maxFoundationDate.value;
      formData.value.dateOfFoundation = maxFoundationDate.value;
    }
  } else if (activeTab.value === 'players' && fieldKey === 'birthDate') {
    if (target.value && target.value > maxFoundationDate.value) {
      toast.warning('La fecha de nacimiento no puede ser mayor a la fecha actual.', 'Validación');
      target.value = maxFoundationDate.value;
      formData.value[fieldKey] = maxFoundationDate.value;
      formData.value.birthDate = maxFoundationDate.value;
    }
    const calculated = calculatePlayerAgeDirect(formData.value.birthDate);
    if (calculated) {
      formData.value.ageYears = calculated.years;
      formData.value.ageMonths = calculated.months;
    }
  }
};

const handleFieldPaste = (e: ClipboardEvent, fieldKey: string) => {
  if (
    (activeTab.value === 'teams' && fieldKey === 'representativePhone') ||
    (activeTab.value === 'players' && (fieldKey === 'phone' || fieldKey === 'emergencyContactPhone'))
  ) {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    const clean = pasted.replace(/\D/g, '').slice(0, 10);
    const target = e.target as HTMLInputElement;
    if (target) {
      target.value = clean;
    }
    formData.value[fieldKey] = clean;
    if (activeTab.value === 'teams' && fieldKey === 'representativePhone') {
      formData.value.representativePhone = clean;
    }
  }
};

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
    return ['name', 'lastName', 'identification', 'birthDate', 'ageYears', 'ageMonths'].includes(field.key);
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
const identificationPlaceholder = computed(() => {
  if (formData.value?.documentType === '06') return 'Número de Pasaporte...';
  if (formData.value?.documentType === '08') return 'DNI / Identificación Extranjera...';
  return 'Cédula de Identidad (10 dígitos)...';
});

const searchingGlobalPlayer = ref(false);
const globalPlayerFound = ref(false);
const globalPlayerSearched = ref(false);

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

const searchGlobalPlayer = async () => {
  const ident = (formData.value.identification || '').trim();
  if (!ident) {
    toast.warning('Ingresa el número de cédula o identificación para consultar');
    return;
  }

  if (formData.value.documentType === '05' && !validarCedulaEcuadorLocal(ident)) {
    toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.');
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
      formData.value.address = p.address || p.direccion || p.domicilio || formData.value.address || '';
      formData.value.emergencyContactName = p.emergencyContactName || '';
      formData.value.emergencyContactPhone = p.emergencyContactPhone || '';
      formData.value.passOwnerType = p.passOwnerType || 'PLAYER';
      formData.value.isActive = true;
      if (p.isForeigner) {
        formData.value.documentType = '06';
      } else if (!formData.value.documentType) {
        formData.value.documentType = '05';
      }

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
    }
  } catch (err: any) {
    console.error('Error al consultar padrón global de jugadores:', err);
    globalPlayerFound.value = false;
  } finally {
    globalPlayerSearched.value = true;
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
const divisionGroupsList = ref<any[]>([]);
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
  categoryAcronyms?: string;
  startDate?: string;
  endDate?: string;
  registrationFee?: number;
  guaranteeFee?: number;
  maxPlayers?: number;
  useClassifications?: boolean;
  matchDurationMinutes?: number;
  breakDurationMinutes?: number;
  waitBetweenMatchesMinutes?: number;
  stages?: any[];
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

const getCategoryNameById = (catId: string | number) => {
  const found = categoriesList.value.find((c: any) => String(c.id) === String(catId));
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

// Criterios de desempate de cada etapa: pestaña desplegable (solo presentación, no cambia lo que se guarda)
const expandedStageCriteria = ref<Set<string>>(new Set());

const stageCriteriaKey = (stg: any, idx: number, sIdx: number): string => String(stg?._uid ?? `${idx}.${sIdx}`);

const toggleStageCriteria = (stg: any, idx: number, sIdx: number) => {
  const key = stageCriteriaKey(stg, idx, sIdx);
  if (expandedStageCriteria.value.has(key)) {
    expandedStageCriteria.value.delete(key);
  } else {
    expandedStageCriteria.value.add(key);
  }
};

const isStageCriteriaExpanded = (stg: any, idx: number, sIdx: number): boolean => {
  return expandedStageCriteria.value.has(stageCriteriaKey(stg, idx, sIdx));
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
  const found = competitionTypesList.value.find((c: any) => String(c.id) === String(stg.competitionTypeId));
  if (found) {
    stg.competitionTypeDescription = found.description;
  }
};

const onCompetitionLapChangeInStage = (stg: any) => {
  if (!stg.competitionLapId) return;
  const found = competitionLapsList.value.find((c: any) => String(c.id) === String(stg.competitionLapId));
  if (found) {
    stg.competitionLapDescription = found.description;
  }
};

const isCriterionAlreadyInStage = (stg: any, critId: string | number): boolean => {
  if (!stg.tieBreakerCriteria || !Array.isArray(stg.tieBreakerCriteria)) return false;
  return stg.tieBreakerCriteria.some((c: any) => String(c.criterionId ?? c.id) === String(critId));
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
  if (!stg.tieBreakerCriteria || !Array.isArray(stg.tieBreakerCriteria)) {
    stg.tieBreakerCriteria = [];
  }
  if (isCriterionAlreadyInStage(stg, critId)) {
    toast.warning('Este criterio de desempate ya está en la lista de esta etapa');
    event.target.value = '';
    return;
  }
  const found = tieBreakerCriteriaList.value.find((c: any) => String(c.id) === String(critId));
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

const getCategoryGenderById = (categoryId: string | number): string => {
  if (!categoryId) return '';
  const found = categoriesList.value.find((c: any) => String(c.id) === String(categoryId));
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
    guaranteeFee: 0,
    maxPlayers: 25,
    useClassifications: false,
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
  const found = categoriesList.value.find((c: any) => String(c.id) === String(item.categoryId));
  if (found) {
    item.categoryDescription = found.name;
    item.categoryAcronyms = found.acronyms || '';
  }
};

const getCategoryAcronymsById = (categoryId: string | number): string => {
  if (!categoryId) return '';
  const found = categoriesList.value.find((c: any) => String(c.id) === String(categoryId));
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

const loadTeamManagement = async (teamId: number) => {
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

const deleteTeamManagementRecord = async (id: number) => {
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
    (c) => String(c.id) === String(formCategoryClassification.value.playerClassificationId),
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
    (c) => String(c.id) === String(formCategoryClassification.value.playerClassificationId),
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
    (c: any) => String(c.playerClassificationId),
  );
  return playerClassificationsList.value.filter(
    (pc) => !existingIds.includes(String(pc.id)) && pc.isActive,
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
    (pc) => String(pc.id) === String(formCategoryClassification.value.playerClassificationId),
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

const getPlayerClassificationDescById = (id: string | number) => {
  const found = playerClassificationsList.value.find((pc) => String(pc.id) === String(id));
  return found ? found.description : 'Clasificación';
};

const getPlayerClassificationCodeById = (id: string | number) => {
  const found = playerClassificationsList.value.find((pc) => String(pc.id) === String(id));
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
    formCategoryStageCriteria.value.map((c) => String(c.criterionId ?? c.id))
  );
  return tieBreakerCriteriaList.value
    .filter((tb) => !selectedIds.has(String(tb.id)))
    .map((tb) => ({
      value: tb.id,
      label: tb.description,
      sublabel: tb.code ? `[${tb.code}] ${tb.observation || ''}`.trim() : tb.observation || undefined,
    }));
});

const addCriterionToStage = () => {
  if (!selectedCriterionToAdd.value) return;
  const item = tieBreakerCriteriaList.value.find((c) => String(c.id) === String(selectedCriterionToAdd.value));
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

const getCompetitionTypeDescById = (id: string | number): string => {
  if (!id) return '';
  const item = competitionTypesList.value.find((c) => String(c.id) === String(id));
  return item ? item.description : String(id);
};

const getCompetitionLapDescById = (id: string | number): string => {
  if (!id) return '';
  const item = competitionLapsList.value.find((c) => String(c.id) === String(id));
  return item ? item.description : String(id);
};

const getTieBreakerCriterionDescById = (id: string | number): string => {
  if (!id) return '';
  const item = tieBreakerCriteriaList.value.find((c) => String(c.id) === String(id));
  return item ? item.description : String(id);
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
    tieBreakerCriterionId: tieBreakerCriteria.length > 0 ? (tieBreakerCriteria[0]?.criterionId || null) : null,
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
  const template = stagesList.value.find((t: any) => String(t.id) === String(tplId));
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
      ? tieBreakerCriteria.map((c: any) => `#${c.order} ${c.code || c.description}`).join(' → ')
      : (d.tieBreakerCriterion?.description || (d.tieBreakerCriterionId ? getTieBreakerCriterionDescById(d.tieBreakerCriterionId) : null));

    return {
      stageOrder: Number(d.stageOrder) || idx + 1,
      name: d.name,
      competitionTypeId: d.competitionTypeId,
      competitionTypeDescription: d.competitionType?.description || getCompetitionTypeDescById(d.competitionTypeId),
      competitionLapId: d.competitionLapId,
      competitionLapDescription: d.competitionLap?.description || getCompetitionLapDescById(d.competitionLapId),
      tieBreakerCriteria: tieBreakerCriteria,
      tieBreakerCriterionId: tieBreakerCriteria.length > 0 ? (tieBreakerCriteria[0]?.criterionId || null) : null,
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

// Estado para Generar Fixture (solo los partidos de la etapa en proceso)
const showFixtureModal = ref(false);
const loadingFixtureOptions = ref(false);
const generatingFixture = ref(false);
const fixtureEditions = ref<any[]>([]);
const selectedFixtureEditionIds = ref<number[]>([]);
const selectedFixtureEditions = computed(() => fixtureEditions.value.filter((ed: any) => selectedFixtureEditionIds.value.includes(ed.id)));
// Etapas seleccionadas que ya pueden generar su fixture
const fixtureReadyStages = computed(() => selectedFixtureEditions.value.reduce((total: number, ed: any) => total + ed.stages.filter((st: any) => st.canGenerate).length, 0));

// Pagos y Finanzas: órdenes de pago de la inscripción de equipos (por defecto) o cobros registrados
const paymentsView = ref<'orders' | 'payments'>('orders');
const filterPaymentOrderStatus = ref<string>('todos');
const isPaymentOrdersView = computed(() => activeTab.value === 'payments' && paymentsView.value === 'orders');
const showPaymentOrderModal = ref(false);
const selectedPaymentOrder = ref<any>(null);

const setPaymentsView = (view: 'orders' | 'payments') => {
  paymentsView.value = view;
  page.value = 1;
  loadData();
};

const openPaymentOrderDetail = (order: any) => {
  selectedPaymentOrder.value = order;
  showPaymentOrderModal.value = true;
};

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
    edField.options = categoryEditionsList.value.map((e) => {
      const cats = Array.isArray(e.categoriesDetail) && e.categoriesDetail.length > 0
        ? e.categoriesDetail.map((d: any) => d.categoryDescription || d.category?.name).filter(Boolean).join(', ')
        : (e.category?.name || '');
      return {
        label: cats ? `${e.name} (${cats})` : e.name,
        value: e.id,
      };
    });
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
    const [stRes, tmRes, scRes, dmRes, plRes, edRes, trRes, pcRes, catRes, dgRes, rgRes, fmtRes, ctRes, clRes, tbRes] = await Promise.all([
      CampeonatoApi.stages.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teams.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.scenaries.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.demarcations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.players.list({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categoryEditions.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.teamRegistrations.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.playerClassifications.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.categories.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      CampeonatoApi.divisionGroups.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
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
    divisionGroupsList.value = dgRes.data.data || [];
    const catTab = tabs.find((t) => t.id === 'categories');
    const dgField = catTab?.fields.find((f) => f.key === 'divisionGroupId');
    if (dgField) {
      dgField.options = divisionGroupsList.value
        .filter((dg) => dg.enabled !== false)
        .map((dg) => ({
          label: `${dg.description}${dg.code ? ` (${dg.code})` : ''}`,
          value: dg.id,
        }));
    }
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
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
    toast.error('Formato no permitido. Solo se aceptan imágenes (PNG, JPG, WEBP).');
    throw new Error('Formato no permitido');
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('El tamaño del escudo no puede superar 5MB.');
    throw new Error('Tamaño no permitido');
  }
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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    toast.error('Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.', 'Validación');
    throw new Error('Invalid format');
  }
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    toast.error('La imagen no debe superar los 5MB.', 'Validación');
    throw new Error('File too large');
  }
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
  pendingTeamToAutoAdd.value = team.id;
  openCreateForm();
  toast.info(`Selecciona la edición y categoría para inscribir a ${team.name}`);
};

// =========================================================================
// INSCRIPCIÓN DE EQUIPOS POR EDICIÓN (SELECT2) -> CATEGORÍAS -> EQUIPOS
// =========================================================================
interface TeamRegTeamEntry {
  _uid: string;
  id?: number;
  teamId: number | string;
  teamName: string;
  teamShortName?: string;
  teamAcronyms?: string;
  teamLogo?: string;
  groupName: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISQUALIFIED';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'REFUNDED';
  pointsPenalty: number;
}

interface TeamRegCategoryEntry {
  _uid: string;
  categoryId: number;
  categoryName: string;
  categoryAcronyms: string;
  gender: string;
  startDate?: string;
  endDate?: string;
  registrationFee: number;
  maxPlayers: number;
  selectedTeamIdToAdd?: string | number;
  teams: TeamRegTeamEntry[];
}

const selectedEditionForTeamReg = ref<string | number>('');
const teamRegCategoriesArray = ref<TeamRegCategoryEntry[]>([]);
const expandedTeamRegCategories = ref<Set<number>>(new Set());
const loadingTeamRegEdition = ref(false);
// Si no se pudieron cargar TODAS las inscripciones de la edición, no se permite guardar: al guardar se quitan las que no se envían.
const teamRegLoadFailed = ref(false);
const pendingTeamToAutoAdd = ref<number | null>(null);

const editionOptionsForTeamReg = computed(() => {
  return categoryEditionsList.value.map((e: any) => {
    const cats = Array.isArray(e.categoriesDetail) && e.categoriesDetail.length > 0
      ? e.categoriesDetail.map((d: any) => d.categoryDescription || d.category?.name || getCategoryNameById(d.categoryId)).filter(Boolean).join(', ')
      : (e.category?.name || '');
    return {
      value: e.id,
      label: e.name,
      sublabel: cats ? `Categorías: ${cats}` : undefined,
    };
  });
});

const totalTeamsInTeamRegEdition = computed(() => {
  return teamRegCategoriesArray.value.reduce(
    (acc, cat) => acc + (cat.teams?.filter((t) => Boolean(t.teamId)).length || 0),
    0,
  );
});

const allAssignedTeamIdsInTeamRegEdition = computed(() => {
  const used = new Set<string>();
  for (const cat of teamRegCategoriesArray.value) {
    for (const tm of cat.teams || []) {
      if (tm.teamId) used.add(String(tm.teamId));
    }
  }
  return used;
});

const getAvailableTeamsOptionsForCategoryRow = (cat: TeamRegCategoryEntry, currentTeamId?: number | string) => {
  const usedInThisCat = new Set<string>();
  for (const tm of cat.teams || []) {
    if (tm.teamId) usedInThisCat.add(String(tm.teamId));
  }
  return teamsList.value
    .filter((t: any) => {
      if (currentTeamId && String(t.id) === String(currentTeamId)) return true;
      return t.isActive !== false && !usedInThisCat.has(String(t.id));
    })
    .map((t: any) => ({
      value: t.id,
      label: t.name,
      sublabel: [t.acronyms ? `[${t.acronyms}]` : '', t.shortName || '', t.city || ''].filter(Boolean).join(' · ') || undefined,
    }));
};

// =========================================================================
// INSCRIPCIÓN Y CARNETS (3 NIVELES: CABECERA EQUIPO -> CATEGORÍAS -> JUGADORES)
// =========================================================================
interface PlayerRegRowEntry {
  _uid: string;
  id?: number;
  teamRegistrationId: number;
  playerId: number | string;
  playerName: string;
  identification: string;
  photo: string;
  carnetCode: string;
  playerClassificationId: number | string;
  demarcationId: number | string;
  jerseyNumber: number | null;
  isCaptain: boolean;
  status: string;
}

interface PlayerRegAllowedClassification {
  playerClassificationId: number;
  description: string;
  code: string;
  maxPlayers: number;
}

interface PlayerRegCategoryEntry {
  _uid: string;
  teamRegistrationId: number;
  categoryId: number;
  categoryName: string;
  categoryAcronyms: string;
  gender: string;
  maxPlayers: number;
  allowedClassifications: PlayerRegAllowedClassification[];
  players: PlayerRegRowEntry[];
}

const playerRegHeaderTeam = ref<{
  categoryEditionId: number | string;
  editionName: string;
  teamId: number | string;
  name: string;
  shortName: string;
  acronyms: string;
  logo: string;
}>({
  categoryEditionId: '',
  editionName: '',
  teamId: '',
  name: '',
  shortName: '',
  acronyms: '',
  logo: '',
});

const playerRegCategoriesArray = ref<PlayerRegCategoryEntry[]>([]);
const expandedPlayerRegCategories = ref<Set<number>>(new Set());

const totalPlayersInTeamRosterForm = computed(() => {
  return playerRegCategoriesArray.value.reduce(
    (acc, cat) => acc + (cat.players?.filter((p) => Boolean(p.playerId)).length || 0),
    0,
  );
});

const getValidPlayersCountInCat = (cat: PlayerRegCategoryEntry): number => {
  return (cat.players || []).filter((p) => Boolean(p.playerId)).length;
};

const getClassificationUsedCount = (cat: PlayerRegCategoryEntry, classId: number | string): number => {
  return (cat.players || []).filter(
    (p) => Boolean(p.playerId) && String(p.playerClassificationId) === String(classId),
  ).length;
};

const togglePlayerRegCategoryRow = (idx: number) => {
  if (expandedPlayerRegCategories.value.has(idx)) {
    expandedPlayerRegCategories.value.delete(idx);
  } else {
    expandedPlayerRegCategories.value.add(idx);
  }
};

const isPlayerRegCategoryExpanded = (idx: number): boolean => {
  return expandedPlayerRegCategories.value.has(idx);
};

const getAvailablePlayersOptionsForCategoryRow = (
  cat: PlayerRegCategoryEntry,
  currentPlayerId?: number | string,
) => {
  const usedInCat = new Set<string>();
  for (const pl of cat.players || []) {
    if (pl.playerId) usedInCat.add(String(pl.playerId));
  }
  return playersList.value
    .filter((p: any) => {
      if (currentPlayerId && String(p.id) === String(currentPlayerId)) return true;
      return p.isActive !== false && !usedInCat.has(String(p.id));
    })
    .map((p: any) => {
      const dem = p.demarcation?.name || demarcationsList.value.find((d) => d.id === p.demarcationId)?.name;
      return {
        value: p.id,
        label: `${p.name} ${p.lastName}`.trim(),
        sublabel: [
          p.identification ? `CI: ${p.identification}` : '',
          p.code ? `[${p.code}]` : '',
          dem || '',
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
      };
    });
};

const getClassificationsOptionsForCatRow = (
  cat: PlayerRegCategoryEntry,
  currentClassId?: number | string,
) => {
  if (cat.allowedClassifications && cat.allowedClassifications.length > 0) {
    return cat.allowedClassifications.map((cl) => {
      const used = (cat.players || []).filter(
        (p) =>
          Boolean(p.playerId) &&
          String(p.playerClassificationId) === String(cl.playerClassificationId) &&
          String(cl.playerClassificationId) !== String(currentClassId),
      ).length;
      const totalUsed = getClassificationUsedCount(cat, cl.playerClassificationId);
      const free = Math.max(0, (cl.maxPlayers || 0) - totalUsed);
      const isFull = cl.maxPlayers > 0 && used >= cl.maxPlayers;
      return {
        value: cl.playerClassificationId,
        label: `${cl.description} (${free} de ${cl.maxPlayers} disp.)`,
        disabled: isFull,
      };
    });
  }
  return playerClassificationsList.value.map((pc: any) => ({
    value: pc.id,
    label: `${pc.description}${pc.code ? ' (' + pc.code + ')' : ''}`,
    disabled: false,
  }));
};

const onPlayerRowSelectChange = (
  cat: PlayerRegCategoryEntry,
  pl: PlayerRegRowEntry,
  selectedId: string | number,
) => {
  const pId = Number(selectedId);
  if (!pId) {
    pl.playerId = '';
    pl.playerName = '';
    pl.identification = '';
    pl.photo = '';
    pl.carnetCode = '';
    return;
  }
  const foundPlayer = playersList.value.find((p: any) => Number(p.id) === pId);
  if (foundPlayer) {
    pl.playerId = foundPlayer.id;
    pl.playerName = `${foundPlayer.name || ''} ${foundPlayer.lastName || ''}`.trim();
    pl.identification = foundPlayer.identification || '';
    pl.photo = foundPlayer.photo || '';
    pl.carnetCode = foundPlayer.code || `JUG-${String(foundPlayer.id).padStart(5, '0')}`;
    if (!pl.playerClassificationId && foundPlayer.playerClassificationId) {
      if (
        !cat.allowedClassifications ||
        cat.allowedClassifications.length === 0 ||
        cat.allowedClassifications.some((c) => Number(c.playerClassificationId) === Number(foundPlayer.playerClassificationId))
      ) {
        pl.playerClassificationId = foundPlayer.playerClassificationId;
      }
    }
    // Al elegir un futbolista, la demarcación propone la de su ficha (se puede cambiar en la fila)
    pl.demarcationId = foundPlayer.demarcationId || '';
    if (!pl.jerseyNumber) {
      const usedJerseys = new Set((cat.players || []).map((r) => Number(r.jerseyNumber)).filter(Boolean));
      let nextJersey = 1;
      while (usedJerseys.has(nextJersey)) nextJersey++;
      pl.jerseyNumber = nextJersey;
    }
  }
};

const onPlayerRowCaptainChange = (cat: PlayerRegCategoryEntry, changedPl: PlayerRegRowEntry) => {
  if (changedPl.isCaptain) {
    for (const pl of cat.players || []) {
      if (pl._uid !== changedPl._uid) {
        pl.isCaptain = false;
      }
    }
  }
};

const addEmptyPlayerRowToCategory = (cat: PlayerRegCategoryEntry) => {
  if (cat.players.length >= (cat.maxPlayers || 25)) {
    toast.warning(`La categoría "${cat.categoryName}" tiene un límite máximo de ${cat.maxPlayers || 25} jugadores.`);
    return;
  }
  const usedJerseys = new Set((cat.players || []).map((r) => Number(r.jerseyNumber)).filter(Boolean));
  let nextJersey = 1;
  while (usedJerseys.has(nextJersey)) nextJersey++;

  const defaultClassId =
    cat.allowedClassifications && cat.allowedClassifications.length > 0
      ? cat.allowedClassifications[0]?.playerClassificationId ?? ''
      : '';

  cat.players.push({
    _uid: 'pr_new_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    teamRegistrationId: cat.teamRegistrationId,
    playerId: '',
    playerName: '',
    identification: '',
    photo: '',
    carnetCode: '',
    playerClassificationId: defaultClassId,
    demarcationId: '',
    jerseyNumber: nextJersey,
    isCaptain: cat.players.length === 0,
    status: 'ELIGIBLE',
  });
};

const removePlayerRowFromCategory = (cat: PlayerRegCategoryEntry, pIdx: number) => {
  if (!cat || !Array.isArray(cat.players)) return;
  const removed = cat.players.splice(pIdx, 1)[0];
  if (removed && removed.playerName) {
    toast.info(`${removed.playerName} quitado de ${cat.categoryName}`);
  }
};

const openCarnetFromPlayerRow = (cat: PlayerRegCategoryEntry, pl: PlayerRegRowEntry) => {
  if (!pl.playerId) return;
  const foundPlayer = playersList.value.find((p: any) => Number(p.id) === Number(pl.playerId));
  openCarnetModal({
    id: pl.id || pl.playerId,
    carnetCode: pl.carnetCode || foundPlayer?.code,
    jerseyNumber: pl.jerseyNumber,
    status: pl.status || 'ELIGIBLE',
    player: foundPlayer || {
      name: pl.playerName,
      lastName: '',
      identification: pl.identification,
      photo: pl.photo,
      code: pl.carnetCode,
    },
    team: {
      name: playerRegHeaderTeam.value.name,
      logo: playerRegHeaderTeam.value.logo,
    },
  });
};

const onTeamRowSelectChange = (tm: TeamRegTeamEntry, selectedId: string | number) => {
  const tId = Number(selectedId);
  if (!tId) {
    tm.teamId = '';
    tm.teamName = '';
    tm.teamShortName = '';
    tm.teamAcronyms = '';
    tm.teamLogo = '';
    return;
  }
  const foundTeam = teamsList.value.find((t: any) => Number(t.id) === tId);
  if (foundTeam) {
    tm.teamId = foundTeam.id;
    tm.teamName = foundTeam.name;
    tm.teamShortName = foundTeam.shortName || '';
    tm.teamAcronyms = foundTeam.acronyms || '';
    tm.teamLogo = foundTeam.logo || '';
  }
};

const addEmptyTeamRowToCategoryReg = (cat: TeamRegCategoryEntry) => {
  cat.teams.push({
    _uid: 'tr_new_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    teamId: '',
    teamName: '',
    teamShortName: '',
    teamAcronyms: '',
    teamLogo: '',
    groupName: '',
    status: 'PENDING', paymentStatus: 'UNPAID',
    pointsPenalty: 0,
  });
};

const toggleTeamRegCategoryRow = (idx: number) => {
  if (expandedTeamRegCategories.value.has(idx)) {
    expandedTeamRegCategories.value.delete(idx);
  } else {
    expandedTeamRegCategories.value.add(idx);
  }
};

const isTeamRegCategoryExpanded = (idx: number): boolean => {
  return expandedTeamRegCategories.value.has(idx);
};

const getCategoryNameForTeamRegItem = (item: any): string => {
  if (item.category?.name) return item.category.name;
  if (item.categoryId) return getCategoryNameById(item.categoryId);
  const ed = categoryEditionsList.value.find((e: any) => String(e.id) === String(item.categoryEditionId));
  if (ed?.category?.name) return ed.category.name;
  if (Array.isArray(ed?.categoriesDetail) && ed.categoriesDetail.length === 1) {
    const det = ed.categoriesDetail[0];
    return det.categoryDescription || det.category?.name || getCategoryNameById(det.categoryId);
  }
  return '';
};

const loadEditionCategoriesForTeamReg = async (editionId: string | number) => {
  if (!editionId) {
    teamRegCategoriesArray.value = [];
    expandedTeamRegCategories.value = new Set();
    return;
  }

  loadingTeamRegEdition.value = true;
  try {
    let edition = categoryEditionsList.value.find((e: any) => String(e.id) === String(editionId));
    if (!edition || !Array.isArray(edition.categoriesDetail)) {
      try {
        const edRes = await CampeonatoApi.categoryEditions.get(Number(editionId));
        if (edRes?.data) {
          edition = edRes.data;
        }
      } catch {}
    }

    // Se cargan TODAS las inscripciones de la edición (de 200 en 200): el guardado quita las que no se envían.
    teamRegLoadFailed.value = false;
    const existingRegs: any[] = [];
    try {
      for (let page = 1; page <= 100; page++) {
        const pageRes: any = await CampeonatoApi.teamRegistrations.list({ categoryEditionId: Number(editionId), limit: 200, page });
        const rows: any[] = pageRes?.data?.data || [];
        existingRegs.push(...rows);
        if (rows.length < 200 || existingRegs.length >= Number(pageRes?.data?.total || 0)) break;
      }
    } catch {
      teamRegLoadFailed.value = true;
      toast.error('No se pudieron cargar las inscripciones existentes de la edición. Cierra y vuelve a abrir el formulario antes de guardar.');
    }

    const rawCategories: Array<{
      categoryId: number;
      categoryName: string;
      categoryAcronyms: string;
      gender: string;
      startDate?: string;
      endDate?: string;
      registrationFee: number;
      maxPlayers: number;
    }> = [];

    if (edition && Array.isArray(edition.categoriesDetail) && edition.categoriesDetail.length > 0) {
      for (const det of edition.categoriesDetail) {
        const catId = Number(det.categoryId || det.category?.id);
        if (!catId) continue;
        rawCategories.push({
          categoryId: catId,
          categoryName: det.categoryDescription || det.category?.name || getCategoryNameById(catId),
          categoryAcronyms: det.category?.acronyms || getCategoryAcronymsById(catId),
          gender: getCategoryGenderById(catId) || 'Varones',
          startDate: det.startDate ? String(det.startDate).slice(0, 10) : '',
          endDate: det.endDate ? String(det.endDate).slice(0, 10) : '',
          registrationFee: Number(det.registrationFee) || 0,
          maxPlayers: Number(det.maxPlayers) || 25,
        });
      }
    } else if (edition && (edition.categoryId || edition.category?.id)) {
      const catId = Number(edition.categoryId || edition.category?.id);
      rawCategories.push({
        categoryId: catId,
        categoryName: edition.category?.name || getCategoryNameById(catId),
        categoryAcronyms: edition.category?.acronyms || getCategoryAcronymsById(catId),
        gender: getCategoryGenderById(catId) || 'Varones',
        startDate: edition.startDate ? String(edition.startDate).slice(0, 10) : '',
        endDate: edition.endDate ? String(edition.endDate).slice(0, 10) : '',
        registrationFee: Number(edition.registrationFee) || 0,
        maxPlayers: Number(edition.maxPlayersPerTeam) || 25,
      });
    }

    const assignedRegIds = new Set<number>();

    const builtCategories: TeamRegCategoryEntry[] = rawCategories.map((rc, idx) => {
      const matchingRegs = existingRegs.filter((r: any) => {
        if (r.categoryId && Number(r.categoryId) === Number(rc.categoryId)) {
          assignedRegIds.add(Number(r.id));
          return true;
        }
        return false;
      });

      // Para registros históricos sin category_id, asignarlos a la primera categoría
      if (idx === 0) {
        for (const r of existingRegs) {
          if (!r.categoryId && !assignedRegIds.has(Number(r.id))) {
            assignedRegIds.add(Number(r.id));
            matchingRegs.push(r);
          }
        }
      }

      const mappedTeams: TeamRegTeamEntry[] = matchingRegs.map((r: any) => {
        const tId = Number(r.teamId || r.team?.id);
        const foundTeam = teamsList.value.find((t: any) => Number(t.id) === tId);
        return {
          _uid: 'tr_' + (r.id || Math.random().toString(36).substring(2, 9)),
          id: r.id,
          teamId: tId,
          teamName: r.team?.name || foundTeam?.name || `Equipo #${tId}`,
          teamShortName: r.team?.shortName || foundTeam?.shortName || '',
          teamAcronyms: r.team?.acronyms || foundTeam?.acronyms || '',
          teamLogo: r.team?.logo || foundTeam?.logo || '',
          groupName: r.groupName || '',
          status: r.status || 'PENDING',
          paymentStatus: r.paymentStatus || 'UNPAID',
          pointsPenalty: Number(r.pointsPenalty) || 0,
        };
      });

      if (idx === 0 && pendingTeamToAutoAdd.value) {
        const autoTeamId = Number(pendingTeamToAutoAdd.value);
        const alreadyIn = mappedTeams.some((t) => Number(t.teamId) === autoTeamId);
        if (!alreadyIn) {
          const foundAuto = teamsList.value.find((t: any) => Number(t.id) === autoTeamId);
          mappedTeams.push({
            _uid: 'tr_auto_' + Date.now(),
            teamId: autoTeamId,
            teamName: foundAuto?.name || `Equipo #${autoTeamId}`,
            teamShortName: foundAuto?.shortName || '',
            teamAcronyms: foundAuto?.acronyms || '',
            teamLogo: foundAuto?.logo || '',
            groupName: '',
            status: 'PENDING', paymentStatus: 'UNPAID',
            pointsPenalty: 0,
          });
        }
      }

      return {
        _uid: 'trcat_' + rc.categoryId + '_' + idx,
        ...rc,
        teams: mappedTeams,
      };
    });

    pendingTeamToAutoAdd.value = null;
    teamRegCategoriesArray.value = builtCategories;
    expandedTeamRegCategories.value = new Set(builtCategories.map((_, i) => i));
  } finally {
    loadingTeamRegEdition.value = false;
  }
};

watch(
  () => selectedEditionForTeamReg.value,
  (newEdId) => {
    if (activeTab.value === 'teamRegistrations' && isFormOpen.value) {
      loadEditionCategoriesForTeamReg(newEdId);
    }
  }
);

const addTeamToCategoryReg = (cat: TeamRegCategoryEntry) => {
  const tId = Number(cat.selectedTeamIdToAdd);
  if (!tId) {
    toast.warning('Selecciona un equipo para agregar a la categoría');
    return;
  }
  if (allAssignedTeamIdsInTeamRegEdition.value.has(String(tId))) {
    toast.warning('Este equipo ya está agregado en una categoría de esta edición');
    cat.selectedTeamIdToAdd = '';
    return;
  }
  const foundTeam = teamsList.value.find((t: any) => Number(t.id) === tId);
  if (!foundTeam) return;

  cat.teams.push({
    _uid: 'tr_new_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    teamId: foundTeam.id,
    teamName: foundTeam.name,
    teamShortName: foundTeam.shortName || '',
    teamAcronyms: foundTeam.acronyms || '',
    teamLogo: foundTeam.logo || '',
    groupName: '',
    status: 'PENDING', paymentStatus: 'UNPAID',
    pointsPenalty: 0,
  });

  cat.selectedTeamIdToAdd = '';
  toast.success(`${foundTeam.name} agregado a ${cat.categoryName}`);
};

const removeTeamFromCategoryReg = (cat: TeamRegCategoryEntry, tIdx: number) => {
  if (!cat || !Array.isArray(cat.teams)) return;
  const removed = cat.teams.splice(tIdx, 1)[0];
  if (removed) {
    toast.info(`${removed.teamName} quitado de ${cat.categoryName}`);
  }
};

const viewTeamPlayers = (team: any) => {
  selectTab('playerRegistrations');
  searchQuery.value = team.name || team.shortName || '';
  loadData();
  toast.info(`Listando jugadores y carnets de ${team.name}`);
};

const standingsViewScope = ref<'general' | 'home' | 'away'>('general');

const standingsLeader = computed(() => {
  return standingsList.value.length > 0 ? standingsList.value[0] : null;
});

const totalStandingsMatches = computed(() => {
  if (!standingsList.value.length) return 0;
  const totalPJ = standingsList.value.reduce((sum: number, r: any) => sum + (Number(r.pj) || 0), 0);
  return Math.floor(totalPJ / 2);
});

const totalStandingsGoals = computed(() => {
  if (!standingsList.value.length) return 0;
  return standingsList.value.reduce((sum: number, r: any) => sum + (Number(r.gf) || 0), 0);
});

const standingsGoalsAverage = computed(() => {
  const matches = totalStandingsMatches.value;
  if (!matches) return '0.00';
  return (totalStandingsGoals.value / matches).toFixed(2);
});

const loadStandings = async () => {
  try {
    loadingStandings.value = true;
    const res = await CampeonatoApi.matches.getStandings(selectedStageId.value ? Number(selectedStageId.value) : undefined);
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
  showFixtureModal.value = true;
  selectedFixtureEditionIds.value = [];
  loadingFixtureOptions.value = true;
  try {
    const res = await CampeonatoApi.matches.getFixtureOptions();
    fixtureEditions.value = res.data || [];
  } catch (err: any) {
    console.error(err);
    fixtureEditions.value = [];
    toast.error(err?.response?.data?.message || 'No se pudieron cargar los campeonatos iniciados');
  } finally {
    loadingFixtureOptions.value = false;
  }
};

const generateFixture = async () => {
  if (selectedFixtureEditionIds.value.length === 0) {
    toast.warning('Seleccione al menos una edición del torneo');
    return;
  }
  try {
    generatingFixture.value = true;
    const res = await CampeonatoApi.matches.generateFixture({ editionIds: selectedFixtureEditionIds.value.map((id) => Number(id)) });
    toast.success(res.data.message || 'Fixture generado con éxito');
    const notGenerated = (res.data.results || []).filter((r: any) => !r.generated);
    if (notGenerated.length > 0) {
      toast.info(notGenerated.length + ' etapa(s) no generaron fixture: ' + notGenerated.map((r: any) => r.categoryName + ' (' + r.reason + ')').join(' | '));
    }
    showFixtureModal.value = false;
    loadData();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Error al generar el fixture');
  } finally {
    generatingFixture.value = false;
  }
};

// Categorías de la edición que todavía no inician su campeonato (ninguna si la edición está finalizada o cancelada)
const pendingStartCategories = (item: any): any[] => (item.status === 'COMPLETED' || item.status === 'CANCELLED' ? [] : (item.categoriesDetail ?? []).filter((det: any) => !det.startedAt));

// Inicia el campeonato de una categoría de la edición (una sola vez por categoría): su primera etapa pasa a «En proceso»
const startEditionChampionship = async (item: any, det: any) => {
  const categoryName = det.categoryDescription || det.category?.name || 'la categoría';
  if (!confirm('¿Iniciar el campeonato de "' + categoryName + '" en "' + item.name + '"? Su primera etapa pasará a «En proceso». Esta acción solo se puede realizar una vez por categoría.')) return;
  try {
    await CampeonatoApi.categoryEditions.start(item.id, det.categoryId);
    toast.success('Campeonato iniciado: la primera etapa de ' + categoryName + ' está en proceso');
    loadData();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'No se pudo iniciar el campeonato');
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
    carnetNumber: item.carnetCode || item.carnetNumber || String(item.id ?? '').padStart(8, '0'),
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
const selectedTeamRegIdForRoster = ref<number | null>(null);

const isSportsHistoryOpen = ref(false);
const selectedPlayerIdForHistory = ref<number | null>(null);

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

// Modal del listado de Inscripción de Equipos: categorías o equipos de una edición.
const teamRegModal = ref<{ mode: 'categories' | 'teams'; row: any } | null>(null);
const teamRegStatusMeta: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: '🟢 Aprobado / Habilitado', cls: 'bg-success-subtle text-success border-success-subtle' },
  PENDING: { label: '⏳ Pendiente', cls: 'bg-warning-subtle text-warning border-warning-subtle' },
  REJECTED: { label: '🔴 Rechazado', cls: 'bg-danger-subtle text-danger border-danger-subtle' },
  DISQUALIFIED: { label: '⛔ Descalificado', cls: 'bg-secondary-subtle text-secondary border-secondary-subtle' },
  WITHDRAWN: { label: '⛔ Descalificado', cls: 'bg-secondary-subtle text-secondary border-secondary-subtle' },
};
const teamRegPaymentMeta: Record<string, { label: string; cls: string }> = {
  PAID: { label: '💳 Pagado Completo', cls: 'bg-success-subtle text-success border-success-subtle' },
  PARTIAL: { label: '💵 Pago Parcial', cls: 'bg-warning-subtle text-warning border-warning-subtle' },
  UNPAID: { label: '⏳ Pendiente de Pago', cls: 'bg-danger-subtle text-danger border-danger-subtle' },
  PENDING: { label: '⏳ Pendiente de Pago', cls: 'bg-danger-subtle text-danger border-danger-subtle' },
  REFUNDED: { label: '↩️ Reembolsado', cls: 'bg-info-subtle text-info border-info-subtle' },
  EXEMPT: { label: '↩️ Reembolsado', cls: 'bg-info-subtle text-info border-info-subtle' },
};
const openTeamRegModal = (mode: 'categories' | 'teams', row: any) => {
  teamRegModal.value = { mode, row };
};
const openRosterFromTeamRegModal = (teamRegId: number) => {
  teamRegModal.value = null;
  openRosterForTeamReg(teamRegId);
};

const openRosterForTeamReg = (teamRegId: number) => {
  selectedTeamRegIdForRoster.value = teamRegId;
  isTeamRosterOpen.value = true;
};

const openSportsHistory = (playerId: number) => {
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

// ==========================================
// ORDEN DE TRANSFERENCIA DE JUGADOR (formulario)
// ==========================================
const transferPlayers = ref<any[]>([]);
const transferDestinationRegistrations = ref<any[]>([]);

// Ediciones activas de la empresa (no finalizadas ni canceladas)
const transferEditionOptions = computed(() =>
  categoryEditionsList.value
    .filter((e: any) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
    .map((e: any) => ({ value: e.id, label: e.name })),
);

// Categorías de la edición elegida
const transferCategoryOptions = computed(() => {
  const edition = categoryEditionsList.value.find((e: any) => String(e.id) === String(formData.value.edition_id));
  return (edition?.categoriesDetail ?? []).map((d: any) => ({
    value: d.categoryId,
    label: d.categoryDescription || d.category?.name || getCategoryNameById(d.categoryId) || 'Categoría',
  }));
});

const transferPlayerOptions = computed(() =>
  transferPlayers.value.map((p: any) => ({
    value: p.id,
    label: `${p.name} ${p.lastName}`.trim(),
    sublabel: p.identification || p.code || undefined,
  })),
);

// Club donde el jugador está inscrito hoy en esa categoría: el campo solo se muestra si existe
const transferOriginTeamName = computed(() => detectedOriginRegistration.value?.teamRegistration?.team?.name || '');

// Clubes inscritos en la edición y categoría, sin el club de origen del jugador
const transferDestinationOptions = computed(() => {
  const originTeamId = detectedOriginRegistration.value?.teamRegistration?.teamId;
  return transferDestinationRegistrations.value
    .filter((tr: any) => tr.team && String(tr.teamId) !== String(originTeamId))
    .map((tr: any) => ({ value: tr.teamId, label: tr.team.name, sublabel: tr.team.acronyms || tr.team.shortName || undefined }));
});

// Todos los jugadores de la empresa (el listado se pagina en el backend)
const loadTransferPlayers = async () => {
  try {
    const all: any[] = [];
    for (let pageNumber = 1; pageNumber <= 100; pageNumber++) {
      const res = await CampeonatoApi.players.list({ page: pageNumber, limit: 100 });
      all.push(...(res.data?.data || []));
      if (pageNumber >= (res.data?.totalPages || 1)) break;
    }
    transferPlayers.value = all;
  } catch (e) {
    console.error('Error cargando los jugadores para la transferencia:', e);
    transferPlayers.value = playersList.value;
  }
};

// Equipos inscritos en la edición y categoría elegidas
const loadTransferDestinationTeams = async () => {
  const editionId = formData.value.edition_id;
  const categoryId = formData.value.category_id;
  if (!editionId || !categoryId) {
    transferDestinationRegistrations.value = [];
    return;
  }
  try {
    const res = await CampeonatoApi.teamRegistrations.list({ categoryEditionId: Number(editionId), categoryId: Number(categoryId), limit: 200 });
    transferDestinationRegistrations.value = res.data?.data || [];
  } catch (e) {
    console.error('Error cargando los equipos de la categoría:', e);
    transferDestinationRegistrations.value = [];
  }
};

// Inscripción vigente del jugador en la edición y categoría (su club de origen)
const checkPlayerCurrentRegistration = async () => {
  if (activeTab.value !== 'playerTransfers') return;
  const { player_id: playerId, edition_id: editionId, category_id: categoryId } = formData.value;
  if (!playerId || !editionId || !categoryId) {
    detectedOriginRegistration.value = null;
    return;
  }
  checkingOriginRegistration.value = true;
  try {
    const res = await CampeonatoApi.playerRegistrations.list({
      playerId: Number(playerId),
      categoryEditionId: Number(editionId),
      categoryId: Number(categoryId),
      limit: 20,
    });
    const regs = res.data?.data || [];
    detectedOriginRegistration.value = regs.find((r: any) => r.status !== 'FINALIZED_BY_TRANSFER') || null;
    // El club de destino no puede ser el club de origen
    if (String(detectedOriginRegistration.value?.teamRegistration?.teamId) === String(formData.value.destination_team_id)) {
      formData.value.destination_team_id = '';
    }
  } catch (e) {
    console.error('Error detectando inscripción previa:', e);
    detectedOriginRegistration.value = null;
  } finally {
    checkingOriginRegistration.value = false;
  }
};

// Al cambiar la edición, la categoría se limita a las de esa edición (si solo tiene una, se elige sola)
watch(
  () => formData.value.edition_id,
  () => {
    if (activeTab.value !== 'playerTransfers' || !isFormOpen.value) return;
    const options = transferCategoryOptions.value;
    if (!options.some((o: any) => String(o.value) === String(formData.value.category_id))) {
      formData.value.category_id = options.length === 1 ? options[0].value : '';
    }
  },
);

// Al cambiar la edición o la categoría se recargan los clubes inscritos y el club de origen del jugador
watch(
  () => [formData.value.edition_id, formData.value.category_id],
  () => {
    if (activeTab.value !== 'playerTransfers' || !isFormOpen.value) return;
    formData.value.destination_team_id = '';
    loadTransferDestinationTeams();
    checkPlayerCurrentRegistration();
  },
);

watch(
  () => formData.value.player_id,
  () => {
    if (activeTab.value === 'playerTransfers' && isFormOpen.value) {
      checkPlayerCurrentRegistration();
    }
  },
);

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

const loadTeamCategoryHistory = async (teamId: number) => {
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

const deleteTeamCategoryRecord = async (id: number) => {
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
  editionId: '' as number | '',
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
  if (categoryEditionsList.value.length === 0) {
    loadAuxiliaryTournamentData();
  }
  formTransfer.value = {
    editionId: categoryEditionsList.value.length > 0 ? categoryEditionsList.value[0].id : '',
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
  if (!formTransfer.value.editionId) {
    toast.warning('Debe seleccionar la edición del campeonato en la que se tramita la transferencia');
    return;
  }
  try {
    savingTransfer.value = true;
    // Payload según CreatePlayerTransferDto: el club de origen lo detecta el backend desde la inscripción vigente.
    const form = formTransfer.value;
    await CampeonatoApi.playerTransfers.createRequest({
      editionId: Number(form.editionId),
      playerId: Number(selectedPlayerForTransfer.value.id),
      destinationTeamId: Number(form.destinationTeamId),
      seasonYear: String(form.seasonYear),
      transferType: form.transferType,
      passOwnerType: form.passOwnerType,
      passOwnerTeamId: form.passOwnerType === 'TEAM' && form.passOwnerTeamId ? Number(form.passOwnerTeamId) : undefined,
      transferFee: Number(form.transferFee) || 0,
      transferDate: form.transferDate || undefined,
      observations: form.observations?.trim() || undefined,
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

const loadPlayerTransfersHistory = async (playerId: number) => {
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

const deletePlayerTransferRecord = async (id: number) => {
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

// Botón «Buscar» (y Enter en el buscador): aplica el texto escrito desde la primera página. Sin texto lista todo.
const searchList = () => {
  page.value = 1;
  if (activeTab.value === 'schedules') {
    loadScheduleConfig();
  } else {
    loadData();
  }
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
    scenaryMarkerInstance.bindPopup(`<b>${escapeHtml(formData.value.name || 'Cancha')}</b><br/>${escapeHtml(formData.value.location)}`).openPopup();
  }
};

// bindPopup() de Leaflet interpreta el string como HTML: todo texto del usuario/servidor se escapa antes.
const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string);

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
        scenaryMarkerInstance.bindPopup(escapeHtml(formData.value.address)).openPopup();
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
      status: 'PENDING',
      identifyByPlayerCode: false,
      matchDurationMinutes: 60,
      breakDurationMinutes: 10,
      waitBetweenMatchesMinutes: 10,
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
        guaranteeFee: 0,
        maxPlayers: 25,
        useClassifications: false,
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
      documentType: '05',
      name: '',
      lastName: '',
      identification: '',
      birthDate: '',
      ageYears: null,
      ageMonths: null,
      demarcationId: '',
      playerClassificationId: '',
      dominantFoot: 'RIGHT',
      bloodType: '',
      phone: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      photo: '',
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
    formData.value = {
      name: '',
      shortName: '',
      acronyms: '',
      color1: '#FFFFFF',
      color2: '#000000',
      colorAlternate: '#1E40AF',
      dateOfFoundation: '',
      email: '',
      representativePhone: '',
      isActive: true,
      logo: '',
    };
  } else if (activeTab.value === 'vocals') {
    formData.value = { isActive: true };
  } else if (activeTab.value === 'teamRegistrations') {
    const defaultEdId = categoryEditionsList.value.length > 0 ? categoryEditionsList.value[0].id : '';
    selectedEditionForTeamReg.value = defaultEdId;
    formData.value = { categoryEditionId: defaultEdId };
    if (defaultEdId) {
      loadEditionCategoriesForTeamReg(defaultEdId);
    } else {
      teamRegCategoriesArray.value = [];
      expandedTeamRegCategories.value = new Set();
    }
  } else if (activeTab.value === 'playerRegistrations') {
    formData.value = {
      teamRegistrationId: '',
      playerId: '',
      playerClassificationId: '',
      jerseyNumber: null,
      carnetCode: '',
      isCaptain: false,
    };
  } else if (activeTab.value === 'playerTransfers') {
    detectedOriginRegistration.value = null;
    transferDestinationRegistrations.value = [];
    formData.value = {
      edition_id: transferEditionOptions.value[0]?.value ?? '',
      category_id: '',
      player_id: '',
      destination_team_id: '',
      reason: '',
    };
    // Si la edición tiene una sola categoría, queda elegida
    if (transferCategoryOptions.value.length === 1) {
      formData.value.category_id = transferCategoryOptions.value[0].value;
    }
    loadTransferPlayers();
    loadTransferDestinationTeams();
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

const mapEditionDetailToForm = (src: any) => {
  formData.value.status = src.status || formData.value.status || 'PENDING';
  formData.value.name = src.name || '';
  formData.value.description = src.description || '';
  formData.value.identifyByPlayerCode = Boolean(src.identifyByPlayerCode);
  formData.value.matchDurationMinutes = Number(src.matchDurationMinutes) || 60;
  formData.value.breakDurationMinutes = Number(src.breakDurationMinutes) || 10;
  formData.value.waitBetweenMatchesMinutes = Number(src.waitBetweenMatchesMinutes) || 10;
  editionCategoriesDetail.value = Array.isArray(src.categoriesDetail)
    ? JSON.parse(JSON.stringify(src.categoriesDetail)).map((det: any) => ({
        ...det,
        _uid: det._uid || ('cat_' + Math.random().toString(36).substring(2, 9)),
        categoryId: det.categoryId ? Number(det.categoryId) : (det.category?.id ? Number(det.category.id) : ''),
        categoryDescription: det.categoryDescription || det.category?.name || '',
        registrationFee: Number(det.registrationFee) || 0,
        guaranteeFee: Number(det.guaranteeFee) || 0,
        maxPlayers: Number(det.maxPlayers) || 25,
        useClassifications:
          det.useClassifications !== undefined
            ? Boolean(det.useClassifications)
            : Array.isArray(det.classifications) && det.classifications.length > 0,
        matchDurationMinutes:
          det.matchDurationMinutes !== undefined && det.matchDurationMinutes !== null
            ? Number(det.matchDurationMinutes)
            : Number(src.matchDurationMinutes) || 60,
        breakDurationMinutes:
          det.breakDurationMinutes !== undefined && det.breakDurationMinutes !== null
            ? Number(det.breakDurationMinutes)
            : Number(src.breakDurationMinutes) || 10,
        waitBetweenMatchesMinutes:
          det.waitBetweenMatchesMinutes !== undefined && det.waitBetweenMatchesMinutes !== null
            ? Number(det.waitBetweenMatchesMinutes)
            : Number(src.waitBetweenMatchesMinutes) || 10,
        classifications: Array.isArray(det.classifications)
          ? det.classifications.map((c: any) => ({
              ...c,
              playerClassificationId: Number(c.playerClassificationId || c.playerClassification?.id),
              maxPlayers: Number(c.maxPlayers) || 0,
              maxInactivityMonths: c.maxInactivityMonths !== undefined && c.maxInactivityMonths !== null ? Number(c.maxInactivityMonths) : null,
              maxMonths: c.maxMonths !== undefined && c.maxMonths !== null ? Number(c.maxMonths) : null,
            }))
          : [],
        stages: (Array.isArray(det.stages) ? det.stages : []).map((stg: any, sIdx: number) => {
          const rawCriteria =
            Array.isArray(stg.tieBreakerCriteria) && stg.tieBreakerCriteria.length > 0
              ? stg.tieBreakerCriteria
              : stg.tieBreakerCriterionId
                ? [
                    {
                      criterionId: stg.tieBreakerCriterionId,
                      id: stg.tieBreakerCriterionId,
                      description:
                        stg.tieBreakerCriterionDescription ||
                        getTieBreakerCriterionDescById(stg.tieBreakerCriterionId),
                      code: '',
                      observation: '',
                      order: 1,
                    },
                  ]
                : [];
          return {
            ...stg,
            _uid: stg._uid || ('stg_' + Math.random().toString(36).substring(2, 9)),
            stageOrder: Number(stg.stageOrder) || sIdx + 1,
            competitionTypeId: stg.competitionTypeId ? Number(stg.competitionTypeId) : '',
            competitionLapId: stg.competitionLapId ? Number(stg.competitionLapId) : '',
            tieBreakerCriteria: rawCriteria.map((c: any, cIdx: number) => ({
              criterionId: Number(c.criterionId || c.id),
              id: Number(c.id || c.criterionId),
              description: c.description || getTieBreakerCriterionDescById(c.criterionId || c.id),
              code: c.code || '',
              observation: c.observation || '',
              order: Number(c.order) || cIdx + 1,
            })),
          };
        }),
      }))
    : [];
  expandedCategoryRows.value = new Set(editionCategoriesDetail.value.map((_, i) => i));
};

const openEditForm = async (item: any) => {
  if (activeTab.value === 'schedules') {
    openEditSchedule(item);
    return;
  }
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  if (activeTab.value === 'teams' && formData.value.isActive === undefined) {
    formData.value.isActive = true;
  }
  if (activeTab.value === 'teamRegistrations') {
    const edId = item.categoryEditionId ?? item.categoryEdition?.id ?? '';
    selectedEditionForTeamReg.value = edId;
    formData.value.categoryEditionId = edId;
    if (edId) {
      loadEditionCategoriesForTeamReg(edId);
    }
  }
  if (activeTab.value === 'playerRegistrations') {
    playerRegHeaderTeam.value = {
      categoryEditionId: item.categoryEditionId || item.categoryEdition?.id || '',
      editionName: item.categoryEdition?.name || '',
      teamId: item.teamId || item.team?.id || '',
      name: item.team?.name || '',
      shortName: item.team?.shortName || '',
      acronyms: item.team?.acronyms || '',
      logo: item.team?.logo || '',
    };

    const incomingCategories = Array.isArray(item.categories) ? item.categories : [];
    playerRegCategoriesArray.value = incomingCategories.map((cat: any, cIdx: number) => ({
      _uid: 'prcat_' + (cat.teamRegistrationId || cIdx),
      teamRegistrationId: Number(cat.teamRegistrationId),
      categoryId: Number(cat.categoryId),
      categoryName: cat.categoryName || 'Categoría',
      categoryAcronyms: cat.categoryAcronyms || '',
      gender: cat.gender || 'MALE',
      maxPlayers: Number(cat.maxPlayers) || 25,
      allowedClassifications: Array.isArray(cat.allowedClassifications) ? cat.allowedClassifications : [],
      players: (Array.isArray(cat.players) ? cat.players : []).map((pl: any, pIdx: number) => ({
        _uid: 'pr_' + (pl.id || `${cIdx}_${pIdx}`),
        id: pl.id,
        teamRegistrationId: Number(cat.teamRegistrationId),
        playerId: Number(pl.playerId),
        playerName: pl.playerName || '',
        identification: pl.identification || '',
        photo: pl.photo || '',
        carnetCode: pl.carnetCode || '',
        playerClassificationId: pl.playerClassificationId || '',
        demarcationId: pl.demarcationId || '',
        jerseyNumber: Number(pl.jerseyNumber) || null,
        isCaptain: Boolean(pl.isCaptain),
        status: pl.status || 'ELIGIBLE',
      })),
    }));
    expandedPlayerRegCategories.value = new Set(playerRegCategoriesArray.value.map((_, i) => i));
  }
  if (activeTab.value === 'categoryEditions') {
    await loadAuxiliaryTournamentData();
    mapEditionDetailToForm(item);
    CampeonatoApi.categoryEditions
      .get(item.id)
      .then((res: any) => {
        if (res?.data && isFormOpen.value && isEditing.value && Number(editingId.value) === Number(item.id)) {
          formData.value = { ...formData.value, ...res.data };
          mapEditionDetailToForm(res.data);
        }
      })
      .catch(() => {});
  } else if (activeTab.value === 'categories') {
    // Mantener los datos del item para edición
  } else if (activeTab.value === 'players') {
    globalPlayerSearched.value = true;
    if (!formData.value.documentType) {
      formData.value.documentType = item.isForeigner ? '06' : '05';
    }
    if (formData.value.isActive === undefined) {
      formData.value.isActive = true;
    }
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
  expandedStageCriteria.value = new Set();
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
        if (!d.useClassifications) continue;
        const maxL = Number(d.maxPlayers) > 0 ? Number(d.maxPlayers) : 25;
        const sumC = (d.classifications || []).reduce((acc: number, c: any) => acc + (Number(c.maxPlayers) || 0), 0);
        if (sumC > maxL) {
          toast.error(`La suma de las clasificaciones (${sumC}) para "${d.categoryDescription || 'Categoría'}" supera el máximo de jugadores (${maxL}).`);
          saving.value = false;
          return;
        }
      }
      formData.value.identifyByPlayerCode = Boolean(formData.value.identifyByPlayerCode);
      formData.value.matchDurationMinutes = Number(formData.value.matchDurationMinutes) || 60;
      formData.value.breakDurationMinutes = Number(formData.value.breakDurationMinutes) || 10;
      formData.value.waitBetweenMatchesMinutes = Number(formData.value.waitBetweenMatchesMinutes) || 10;
      formData.value.categoriesDetail = editionCategoriesDetail.value.map((d) => ({
        categoryId: d.categoryId,
        categoryDescription: d.categoryDescription || getCategoryNameById(d.categoryId),
        startDate: d.startDate || undefined,
        endDate: d.endDate || undefined,
        registrationFee: Number(d.registrationFee) || 0,
        guaranteeFee: Number(d.guaranteeFee) || 0,
        maxPlayers: Number(d.maxPlayers) > 0 ? Number(d.maxPlayers) : 25,
        useClassifications: Boolean(d.useClassifications),
        matchDurationMinutes: Number(d.matchDurationMinutes) || 60,
        breakDurationMinutes: d.breakDurationMinutes !== undefined && d.breakDurationMinutes !== null ? Number(d.breakDurationMinutes) : 10,
        waitBetweenMatchesMinutes: d.waitBetweenMatchesMinutes !== undefined && d.waitBetweenMatchesMinutes !== null ? Number(d.waitBetweenMatchesMinutes) : 10,
        classifications: d.useClassifications
          ? (d.classifications || []).map((c: any) => ({
              playerClassificationId: c.playerClassificationId,
              maxPlayers: Number(c.maxPlayers) || 0,
              maxInactivityMonths: c.maxInactivityMonths !== undefined && c.maxInactivityMonths !== null ? Number(c.maxInactivityMonths) : null,
              maxMonths: c.maxMonths !== undefined && c.maxMonths !== null ? Number(c.maxMonths) : null,
            }))
          : [],
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
              ? formattedCriteria.map((c: any) => `#${c.order} ${c.code || c.description}`).join(' → ')
              : (s.tieBreakerCriterionDescription || (s.tieBreakerCriterionId ? getTieBreakerCriterionDescById(s.tieBreakerCriterionId) : null)),
          };
        }),
      }));
    } else if (activeTab.value === 'categories') {
      if (!formData.value.divisionGroupId) {
        toast.warning('El grupo de división es obligatorio.', 'Validación');
        saving.value = false;
        return;
      }
      formData.value.divisionGroupId = Number(formData.value.divisionGroupId);
      delete formData.value.divisionGroup;
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
      if (formData.value.documentType === '06' || formData.value.documentType === '08') {
        formData.value.isForeigner = true;
      } else if (formData.value.documentType === '05') {
        formData.value.isForeigner = false;
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
    } else if (activeTab.value === 'teams') {
      const teamName = String(formData.value.name || '').trim();
      if (!teamName || teamName.length < 3) {
        toast.warning('El nombre del equipo es obligatorio y debe tener al menos 3 caracteres.', 'Validación');
        saving.value = false;
        return;
      }
      formData.value.name = teamName;

      if (formData.value.shortName) {
        formData.value.shortName = String(formData.value.shortName).trim();
      }
      if (formData.value.acronyms) {
        formData.value.acronyms = String(formData.value.acronyms).trim().toUpperCase();
      }

      if (formData.value.email && String(formData.value.email).trim()) {
        const emailTrimmed = String(formData.value.email).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
          toast.warning('Ingrese un correo electrónico válido (ej: club@correo.com).', 'Validación');
          saving.value = false;
          return;
        }
        formData.value.email = emailTrimmed;
      }

      if (formData.value.representativePhone && String(formData.value.representativePhone).trim()) {
        const cleanPhone = String(formData.value.representativePhone).replace(/\D/g, '');
        if (cleanPhone.length < 7 || cleanPhone.length > 10) {
          toast.warning('El teléfono del representante debe contener entre 7 y 10 dígitos numéricos.', 'Validación');
          saving.value = false;
          return;
        }
        formData.value.representativePhone = cleanPhone;
      }

      if (formData.value.dateOfFoundation) {
        if (formData.value.dateOfFoundation > maxFoundationDate.value) {
          toast.warning('La fecha de fundación no puede ser mayor a la fecha actual.', 'Validación');
          saving.value = false;
          return;
        }
      }

      if (formData.value.isActive === undefined) {
        formData.value.isActive = true;
      }
    } else if (activeTab.value === 'players') {
      const ident = (formData.value.identification || '').trim();
      if (!ident) {
        toast.warning('La identificación o cédula del jugador es obligatoria.', 'Validación');
        saving.value = false;
        return;
      }
      if (formData.value.documentType === '05' && !validarCedulaEcuadorLocal(ident)) {
        toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.', 'Validación');
        saving.value = false;
        return;
      }
      formData.value.identification = ident;

      if (!formData.value.name || String(formData.value.name).trim().length < 3) {
        toast.warning('El nombre del jugador es obligatorio y debe tener al menos 3 caracteres.', 'Validación');
        saving.value = false;
        return;
      }
      formData.value.name = String(formData.value.name).trim();

      if (!formData.value.lastName || String(formData.value.lastName).trim().length < 3) {
        toast.warning('El apellido del jugador es obligatorio y debe tener al menos 3 caracteres.', 'Validación');
        saving.value = false;
        return;
      }
      formData.value.lastName = String(formData.value.lastName).trim();

      if (formData.value.birthDate) {
        if (formData.value.birthDate > maxFoundationDate.value) {
          toast.warning('La fecha de nacimiento no puede ser mayor a la fecha actual.', 'Validación');
          saving.value = false;
          return;
        }
        const calc = calculatePlayerAgeDirect(formData.value.birthDate);
        if (calc) {
          formData.value.ageYears = calc.years;
          formData.value.ageMonths = calc.months;
        }
      }

      if (formData.value.email && String(formData.value.email).trim()) {
        const emailTrimmed = String(formData.value.email).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
          toast.warning('Ingrese un correo electrónico válido (ej: jugador@correo.com).', 'Validación');
          saving.value = false;
          return;
        }
        formData.value.email = emailTrimmed;
      }

      if (formData.value.phone && String(formData.value.phone).trim()) {
        const clean = String(formData.value.phone).replace(/\D/g, '');
        if (clean.length < 7 || clean.length > 10) {
          toast.warning('El teléfono personal debe contener entre 7 y 10 dígitos numéricos.', 'Validación');
          saving.value = false;
          return;
        }
        formData.value.phone = clean;
      }

      if (formData.value.emergencyContactPhone && String(formData.value.emergencyContactPhone).trim()) {
        const clean = String(formData.value.emergencyContactPhone).replace(/\D/g, '');
        if (clean.length < 7 || clean.length > 10) {
          toast.warning('El teléfono de emergencia debe contener entre 7 y 10 dígitos numéricos.', 'Validación');
          saving.value = false;
          return;
        }
        formData.value.emergencyContactPhone = clean;
      }

      if (formData.value.isActive === undefined) {
        formData.value.isActive = true;
      }
    } else if (activeTab.value === 'vocals' || activeTab.value === 'referees') {
      if (formData.value.isActive === undefined) {
        formData.value.isActive = true;
      }
    } else if (activeTab.value === 'teamRegistrations') {
      if (!selectedEditionForTeamReg.value) {
        toast.warning('Debe seleccionar la edición del torneo.', 'Validación');
        saving.value = false;
        return;
      }
      if (teamRegCategoriesArray.value.length === 0) {
        toast.warning('La edición seleccionada no tiene categorías configuradas.', 'Validación');
        saving.value = false;
        return;
      }
      for (const cat of teamRegCategoriesArray.value) {
        for (let i = 0; i < (cat.teams || []).length; i++) {
          if (!cat.teams[i]?.teamId) {
            toast.warning(`Selecciona el equipo en la fila #${i + 1} de la categoría "${cat.categoryName}" o elimina la fila vacía.`, 'Validación');
            saving.value = false;
            return;
          }
        }
      }
      if (teamRegLoadFailed.value) {
        toast.error('No se cargaron todas las inscripciones existentes de la edición; guardar quitaría las que faltan. Cierra y vuelve a abrir el formulario.');
        saving.value = false;
        return;
      }
      const buildSyncPayload = (forceRemovePlayers = false) => ({
        categoryEditionId: Number(selectedEditionForTeamReg.value),
        categories: teamRegCategoriesArray.value.map((cat) => ({
          categoryId: Number(cat.categoryId),
          teams: (cat.teams || [])
            .filter((tm) => Boolean(tm.teamId))
            .map((tm) => ({
              id: tm.id ? Number(tm.id) : undefined,
              teamId: Number(tm.teamId),
              groupName: tm.groupName ? String(tm.groupName).trim() : undefined,
              pointsPenalty: Number(tm.pointsPenalty) || 0,
            })),
        })),
        ...(forceRemovePlayers ? { forceRemovePlayers: true } : {}),
      });
      let syncRes: any;
      try {
        syncRes = await CampeonatoApi.teamRegistrations.syncByEdition(buildSyncPayload());
      } catch (syncErr: any) {
        // Quitar equipos con jugadores inscritos también elimina a esos jugadores: se pide confirmación y se reintenta
        if (syncErr?.response?.status === 409 && syncErr?.response?.data?.code === 'PLAYERS_WOULD_BE_DELETED') {
          if (!confirm(syncErr.response.data.message)) {
            saving.value = false;
            return;
          }
          syncRes = await CampeonatoApi.teamRegistrations.syncByEdition(buildSyncPayload(true));
        } else {
          throw syncErr;
        }
      }
      const paymentOrders = syncRes.data?.paymentOrders || [];
      const skippedOrders = syncRes.data?.paymentOrdersSkipped || [];
      if (paymentOrders.length > 0) {
        const total = paymentOrders.reduce((sum: number, order: any) => sum + (Number(order.totalAmount) || 0), 0);
        toast.success('Inscripción guardada. Se generaron ' + paymentOrders.length + ' orden(es) de pago pendiente(s) por un total de $' + total.toFixed(2));
      } else {
        toast.success('Inscripción de equipos por categoría guardada exitosamente');
      }
      // Equipos nuevos para los que no se generó orden de pago (por ejemplo, inscripción y garantía en 0)
      if (skippedOrders.length > 0) {
        toast.warning(skippedOrders.map((item: any) => `${item.teamName}: ${item.reason}`).join('\n'), 'Sin orden de pago');
      }
      closeForm();
      await loadData();
      await loadAuxiliaryTournamentData();
      return;
    } else if (activeTab.value === 'playerRegistrations') {
      if (!playerRegHeaderTeam.value.categoryEditionId || !playerRegHeaderTeam.value.teamId) {
        toast.warning('No se identificó el equipo o la edición del torneo.', 'Validación');
        saving.value = false;
        return;
      }
      for (const cat of playerRegCategoriesArray.value) {
        for (let i = 0; i < (cat.players || []).length; i++) {
          const pl = cat.players[i];
          if (!pl) continue;
          if (!pl.playerId) {
            toast.warning(`Selecciona el jugador en la fila #${i + 1} de la categoría "${cat.categoryName}" o elimina la fila vacía.`, 'Validación');
            saving.value = false;
            return;
          }
          if (!pl.jerseyNumber || Number(pl.jerseyNumber) <= 0) {
            toast.warning(`Ingresa un número de dorsal válido en la fila #${i + 1} (${pl.playerName || 'Jugador'}) de la categoría "${cat.categoryName}".`, 'Validación');
            saving.value = false;
            return;
          }
          if (cat.allowedClassifications && cat.allowedClassifications.length > 0 && !pl.playerClassificationId) {
            toast.warning(`Selecciona la clasificación de futbolista en la fila #${i + 1} (${pl.playerName || 'Jugador'}) de la categoría "${cat.categoryName}".`, 'Validación');
            saving.value = false;
            return;
          }
        }
      }
      await CampeonatoApi.playerRegistrations.syncTeamRoster({
        categoryEditionId: Number(playerRegHeaderTeam.value.categoryEditionId),
        teamId: Number(playerRegHeaderTeam.value.teamId),
        categories: playerRegCategoriesArray.value.map((cat) => ({
          teamRegistrationId: Number(cat.teamRegistrationId),
          players: (cat.players || [])
            .filter((pl) => Boolean(pl.playerId))
            .map((pl) => ({
              id: pl.id ? Number(pl.id) : undefined,
              playerId: Number(pl.playerId),
              jerseyNumber: Number(pl.jerseyNumber),
              carnetCode: pl.carnetCode || undefined,
              playerClassificationId: pl.playerClassificationId ? Number(pl.playerClassificationId) : undefined,
              demarcationId: pl.demarcationId ? Number(pl.demarcationId) : undefined,
              isCaptain: Boolean(pl.isCaptain),
            })),
        })),
      });
      toast.success('Plantilla y carnets del equipo guardados exitosamente');
      closeForm();
      await loadData();
      await loadAuxiliaryTournamentData();
      return;
    } else if (activeTab.value === 'playerTransfers') {
      if (!formData.value.edition_id) {
        toast.error('Debe seleccionar la edición del campeonato');
        saving.value = false;
        return;
      }
      if (!formData.value.category_id) {
        toast.error('Debe seleccionar la categoría de la edición');
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
      'documentType',
      'startedAt',
      'startedName',
      'availableScenaryIds',
    ];
    for (const k of forbiddenKeys) {
      delete (payload as any)[k];
    }
    for (const [k, v] of Object.entries(payload)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        delete (payload as any)[k];
      }
    }

    // Ajuste por pestaña al DTO del backend (whitelist + forbidNonWhitelisted: un campo de más responde 400)
    let body: Record<string, any> = payload;
    if (activeTab.value === 'teamRegistrations') {
      body = {
        teamId: Number(formData.value.teamId),
        categoryEditionId: Number(formData.value.categoryEditionId),
        groupName: formData.value.groupName ? String(formData.value.groupName).trim() : undefined,
      };
    } else if (activeTab.value === 'playerTransfers') {
      // CreatePlayerTransferDto es camelCase; el formulario usa claves propias
      body = {
        editionId: Number(payload.edition_id),
        categoryId: Number(payload.category_id),
        playerId: Number(payload.player_id),
        destinationTeamId: Number(payload.destination_team_id),
        observations: payload.reason?.trim() || undefined,
      };
    } else if (activeTab.value === 'referees') {
      // El listado por liga añade companyRefereeId / isActiveInCompany, que no son campos del árbitro
      body = {};
      for (const key of ['name', 'lastName', 'identification', 'guildId', 'phone', 'email', 'category', 'isActive']) {
        const value = (payload as any)[key];
        if (value === undefined) continue;
        body[key] = value === '' ? null : value;
      }
    } else if (activeTab.value === 'players') {
      body = {
        name: formData.value.name,
        lastName: formData.value.lastName,
        identification: formData.value.identification?.trim(),
        isForeigner: formData.value.documentType === '06' || formData.value.documentType === '08',
        birthDate: formData.value.birthDate ? String(formData.value.birthDate).slice(0, 10) : undefined,
        ageYears: formData.value.ageYears !== undefined && formData.value.ageYears !== null && formData.value.ageYears !== '' ? Number(formData.value.ageYears) : undefined,
        ageMonths: formData.value.ageMonths !== undefined && formData.value.ageMonths !== null && formData.value.ageMonths !== '' ? Number(formData.value.ageMonths) : undefined,
        demarcationId: formData.value.demarcationId ? Number(formData.value.demarcationId) : undefined,
        playerClassificationId: formData.value.playerClassificationId ? Number(formData.value.playerClassificationId) : undefined,
        dominantFoot: formData.value.dominantFoot || undefined,
        bloodType: formData.value.bloodType || undefined,
        phone: formData.value.phone?.trim() || undefined,
        email: formData.value.email?.trim() || undefined,
        address: formData.value.address?.trim() || undefined,
        emergencyContactName: formData.value.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.value.emergencyContactPhone?.trim() || undefined,
        passOwnerType: formData.value.passOwnerType || 'PLAYER',
        isActive: formData.value.isActive !== false,
        photo: formData.value.photo || undefined,
      };
      if (formData.value.code) {
        body.code = formData.value.code;
      }
    }

    if (isEditing.value && editingId.value) {
      await currentTabConfig.value.api.update(editingId.value, body);
      toast.success('Registro actualizado exitosamente');
    } else {
      await currentTabConfig.value.api.create(body);
      toast.success(activeTab.value === 'playerTransfers' ? 'Orden de transferencia generada en estado pendiente' : 'Registro creado exitosamente');
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

// Una edición se elimina con todo lo que se creó a partir de ella: se muestra el detalle antes de confirmar
const confirmDeleteEdition = async (id: number) => {
  let message = '¿Estás seguro de eliminar esta edición de torneo con todo lo que tiene registrado?';
  try {
    const res: any = await CampeonatoApi.categoryEditions.deletionSummary(id);
    const s = res?.data;
    if (s) {
      // Opción de pruebas: elimina todo lo relacionado, incluso órdenes ya pagadas y registros creados por otras empresas
      const orders = Number(s.paymentOrders?.pending || 0) + Number(s.paymentOrders?.cancelled || 0) + Number(s.paymentOrders?.paid || 0);
      const other = s.otherCompanies || {};
      const otherTotal = Number(other.teamRegistrations || 0) + Number(other.paymentOrders || 0) + Number(other.playerTransfers || 0);
      message =
        `Se eliminará la edición "${s.name}" y TODO lo relacionado con ella (modo de pruebas). Esta acción no se puede deshacer:\n\n` +
        `• Categorías configuradas: ${s.categories} (con sus etapas, criterios de desempate y clasificaciones)\n` +
        `• Etapas del campeonato: ${s.stages}\n` +
        `• Partidos: ${s.matches} (y ${s.sanctions || 0} sanción(es) de esos partidos)\n` +
        `• Equipos inscritos: ${s.teamRegistrations}\n` +
        `• Jugadores inscritos: ${s.playerRegistrations}\n` +
        `• Pagos registrados: ${s.payments || 0}\n` +
        `• Órdenes de pago: ${orders}${s.paymentOrders?.paid > 0 ? ` (${s.paymentOrders.paid} ya pagada(s))` : ''}\n` +
        `• Pases y movimientos de jugadores: ${Number(s.playerTransfers || 0) + Number(s.playerTransactions || 0)}\n` +
        (otherTotal > 0 ? `\nIncluye ${otherTotal} registro(s) creado(s) por otras empresas en esta edición (${other.teamRegistrations || 0} inscripción(es), ${other.paymentOrders || 0} orden(es) de pago, ${other.playerTransfers || 0} pase(s)).\n` : '') +
        `\n¿Deseas continuar?`;
    }
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'No se pudo consultar lo que se eliminaría');
    return;
  }
  if (!confirm(message)) return;
  try {
    await CampeonatoApi.categoryEditions.delete(id);
    toast.success('Edición eliminada junto con todo lo relacionado');
    loadData();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Error al eliminar la edición');
  }
};

const confirmDelete = async (id: number) => {
  if (activeTab.value === 'categoryEditions') return confirmDeleteEdition(id);
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

watch(
  () => formData.value.playerId,
  (newPlayerId) => {
    if (activeTab.value === 'playerRegistrations' && isFormOpen.value) {
      if (!newPlayerId) {
        formData.value.carnetCode = '';
        return;
      }
      const selectedPlayer = playersList.value.find((p) => String(p.id) === String(newPlayerId));
      if (selectedPlayer) {
        formData.value.carnetCode = selectedPlayer.code || `JUG-${String(selectedPlayer.id).padStart(5, '0')}`;
        if (!formData.value.playerClassificationId && selectedPlayer.playerClassificationId) {
          formData.value.playerClassificationId = selectedPlayer.playerClassificationId;
        }
      }
    }
  }
);

onMounted(async () => {
  activeTab.value = resolveTabFromRoute();
  window.addEventListener('deskounta:reset-view', onGlobalResetView);
  void loadCatalogCampSubModules();
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
