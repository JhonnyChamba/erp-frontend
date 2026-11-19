<template>
  <div class="crud-page technical-service-page">
    <!-- ========================================== -->
    <!-- 1. ENCABEZADO DE PÁGINA (ESTILO SPIKE UI)  -->
    <!-- ========================================== -->
    <div class="card bg-info-subtle shadow-none position-relative overflow-hidden mb-4 border-0">
      <div class="card-body px-4 py-3">
        <div class="row align-items-center">
          <div class="col-md-8 col-12">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">MOD-TEC</span>
              <span class="text-muted small">Servicio Técnico & Reparaciones</span>
            </div>
            <h4 class="fw-semibold mb-1 text-body-emphasis">Órdenes de Trabajo & Servicio Técnico</h4>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><router-link to="/" class="text-muted text-decoration-none">Inicio</router-link></li>
                <li class="breadcrumb-item text-muted">Servicio Técnico</li>
                <li class="breadcrumb-item active text-primary" aria-current="page">Órdenes de Trabajo</li>
              </ol>
            </nav>
          </div>
          <div class="col-md-4 col-12 text-md-end mt-3 mt-md-0">
            <button
              v-if="!isFormOpen"
              class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
              @click="openCreateForm"
            >
              <iconify-icon icon="solar:add-circle-bold" class="fs-5"></iconify-icon>
              <span>Nueva Orden de Trabajo</span>
            </button>
            <button
              v-else
              class="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
              @click="closeForm"
            >
              <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
              <span>Volver al Listado</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2. TARJETAS DE INDICADORES (KPIS)          -->
    <!-- ========================================== -->
    <div v-show="!isFormOpen" class="crud-kpi-grid">
      <!-- Total Órdenes -->
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon primary">
          <iconify-icon icon="solar:clipboard-list-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Total Órdenes</span>
          <h4 class="crud-kpi-val">{{ kpis.totalOrders }}</h4>
        </div>
      </div>

      <!-- En Diagnóstico / Reparación -->
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon warning">
          <iconify-icon icon="solar:wrench-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">En Diagnóstico / Taller</span>
          <h4 class="crud-kpi-val text-warning">{{ kpis.inProgress }}</h4>
        </div>
      </div>

      <!-- Listos para Entrega -->
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon success">
          <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Listos para Entrega</span>
          <h4 class="crud-kpi-val text-success">{{ kpis.readyToDeliver }}</h4>
        </div>
      </div>

      <!-- Saldo por Cobrar -->
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon danger">
          <iconify-icon icon="solar:wallet-money-bold-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Saldo por Cobrar</span>
          <h4 class="crud-kpi-val text-danger">${{ Number(kpis.pendingBalance || 0).toFixed(2) }}</h4>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3. TARJETA DE FILTROS Y BÚSQUEDA           -->
    <!-- ========================================== -->
    <div v-show="!isFormOpen" class="crud-filters-card">
      <div class="row g-3 align-items-center">
        <!-- Búsqueda rápida -->
        <div class="col-lg-4 col-md-6 col-12">
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0">
              <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5 text-muted"></iconify-icon>
            </span>
            <input
              type="text"
              v-model="filters.search"
              class="form-control border-start-0"
              placeholder="Buscar por N° Orden, cliente, equipo, serie o falla..."
              @input="debouncedSearch"
            />
          </div>
        </div>

        <!-- Filtro Estado -->
        <div class="col-lg-2 col-md-3 col-6">
          <select v-model="filters.status" class="form-select" @change="loadOrders">
            <option value="">Todos los Estados</option>
            <option value="RECIBIDO">Recibido</option>
            <option value="EN_DIAGNOSTICO">En Diagnóstico</option>
            <option value="PRESUPUESTADO">Presupuestado</option>
            <option value="APROBADO">Aprobado</option>
            <option value="EN_REPARACION">En Reparación</option>
            <option value="EN_ESPERA_REPUESTOS">Espera Repuestos</option>
            <option value="LISTO_ENTREGA">Listo p/ Entrega</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <!-- Filtro Prioridad -->
        <div class="col-lg-2 col-md-3 col-6">
          <select v-model="filters.priority" class="form-select" @change="loadOrders">
            <option value="">Todas las Prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente 🔥</option>
          </select>
        </div>

        <!-- Filtro Tipo de Servicio -->
        <div class="col-lg-2 col-md-4 col-6">
          <select v-model="filters.service_type" class="form-select" @change="loadOrders">
            <option value="">Todos los Servicios</option>
            <option value="REPARACION">Reparación</option>
            <option value="MANTENIMIENTO_PREVENTIVO">Mantenimiento Prev.</option>
            <option value="DIAGNOSTICO">Solo Diagnóstico</option>
            <option value="GARANTIA">Garantía</option>
          </select>
        </div>

        <!-- Filtro Sucursal (si aplica) -->
        <div class="col-lg-2 col-md-4 col-6" v-if="branches.length > 1">
          <select v-model="filters.branch_id" class="form-select" @change="loadOrders">
            <option :value="undefined">Todas las Sucursales</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">
              {{ b.name }}
            </option>
          </select>
        </div>

        <!-- Limpiar Filtros -->
        <div class="col-auto ms-auto" v-if="hasActiveFilters">
          <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="resetFilters">
            <iconify-icon icon="solar:restart-line-duotone" class="fs-5"></iconify-icon>
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 4. TABLA PRINCIPAL DE ÓRDENES              -->
    <!-- ========================================== -->
    <div v-show="!isFormOpen" class="crud-table-card">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2 mb-0">Cargando órdenes de trabajo...</p>
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-5">
        <iconify-icon icon="solar:laptop-minimalistic-line-duotone" class="fs-1 text-muted mb-2"></iconify-icon>
        <h5 class="text-body-emphasis">No se encontraron órdenes de servicio técnico</h5>
        <p class="text-muted">No existen registros con los criterios seleccionados.</p>
        <button class="btn btn-sm btn-primary" @click="openCreateForm">
          + Crear Primera Orden de Trabajo
        </button>
      </div>

      <div v-else class="table-responsive" style="min-height: 420px; padding-bottom: 6rem;">
        <table class="crud-table table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4" style="width: 140px;">N° ORDEN</th>
              <th>CLIENTE</th>
              <th>EQUIPO ELECTRÓNICO</th>
              <th>FALLA / DIAGNÓSTICO</th>
              <th>TÉCNICO</th>
              <th class="text-center">PRIORIDAD</th>
              <th class="text-center">ESTADO</th>
              <th class="text-end">TOTAL / SALDO</th>
              <th class="text-center pe-4" style="width: 150px;">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <!-- N° Orden -->
              <td class="ps-4">
                <div class="d-flex flex-column">
                  <span class="badge bg-primary-subtle text-primary font-monospace fs-2 px-2 py-1 mb-1">
                    {{ order.order_number }}
                  </span>
                  <small class="text-muted fs-1">{{ formatDate(order.entry_date) }}</small>
                </div>
              </td>

              <!-- Cliente -->
              <td>
                <div class="fw-bold text-body-emphasis">{{ order.customer_name }}</div>
                <small class="text-muted fs-1 d-block font-monospace">
                  <iconify-icon icon="solar:phone-calling-line-duotone" class="me-1"></iconify-icon>
                  {{ order.customer_phone || 'Sin teléfono' }}
                </small>
              </td>

              <!-- Equipo -->
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="p-2 rounded bg-light-subtle text-primary border border-secondary-subtle">
                    <iconify-icon :icon="getEquipmentIcon(order.equipment_type)" class="fs-4"></iconify-icon>
                  </div>
                  <div>
                    <div class="fw-semibold text-body-emphasis">{{ order.brand }} {{ order.model || '' }}</div>
                    <small class="text-muted fs-1">
                      {{ order.equipment_type }} 
                      <span v-if="order.serial_number" class="font-monospace text-secondary">| S/N: {{ order.serial_number }}</span>
                    </small>
                  </div>
                </div>
              </td>

              <!-- Falla Reportada -->
              <td>
                <div class="text-truncate text-body-emphasis" style="max-width: 220px;" :title="order.reported_failure">
                  {{ order.reported_failure }}
                </div>
                <small v-if="order.technical_diagnosis" class="text-muted fs-1 text-truncate d-block" style="max-width: 220px;">
                  Diag: {{ order.technical_diagnosis }}
                </small>
              </td>

              <!-- Técnico -->
              <td>
                <div class="d-flex align-items-center gap-1">
                  <iconify-icon icon="solar:user-bold-duotone" class="text-muted"></iconify-icon>
                  <span class="fs-2 text-body-emphasis">{{ order.technician_name || 'Por Asignar' }}</span>
                </div>
              </td>

              <!-- Prioridad -->
              <td class="text-center">
                <span class="badge px-2 py-1 fs-1" :class="getPriorityBadgeClass(order.priority)">
                  {{ order.priority }}
                </span>
              </td>

              <!-- Estado -->
              <td class="text-center">
                <span class="badge px-2 py-1 fs-2" :class="getStatusBadgeClass(order.status)">
                  {{ formatStatusLabel(order.status) }}
                </span>
              </td>

              <!-- Total & Saldo -->
              <td class="text-end">
                <div class="fw-bold text-success fs-3">
                  ${{ Number(order.total_amount || 0).toFixed(2) }}
                </div>
                <small v-if="Number(order.pending_balance) > 0" class="text-danger fw-semibold fs-1 d-block">
                  Saldo: ${{ Number(order.pending_balance).toFixed(2) }}
                </small>
                <small v-else class="text-success fs-1 d-block">
                  Pagado
                </small>
              </td>

              <!-- Acciones (Spike UI Dropdown) -->
              <td class="text-center pe-4">
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
                    <!-- Imprimir Ticket -->
                    <li>
                      <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="javascript:void(0)" @click="openTicketModal(order)">
                        <iconify-icon icon="solar:printer-line-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Imprimir Ticket / Orden</span>
                      </a>
                    </li>

                    <!-- Cambiar Estado Rápido -->
                    <li>
                      <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="javascript:void(0)" @click="openStatusModal(order)">
                        <iconify-icon icon="solar:refresh-line-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Cambiar Estado</span>
                      </a>
                    </li>

                    <li><hr class="dropdown-divider"></li>

                    <!-- Editar Orden -->
                    <li>
                      <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="javascript:void(0)" @click="openEditForm(order)">
                        <iconify-icon icon="solar:pen-2-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar Orden</span>
                      </a>
                    </li>

                    <!-- Eliminar -->
                    <li>
                      <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-danger" href="javascript:void(0)" @click="confirmDelete(order)">
                        <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-5 text-danger"></iconify-icon>
                        <span>Eliminar Orden</span>
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

    <!-- ============================================================== -->
    <!-- 5. FORMULARIO EN PÁGINA (100% ANCHO, NO MODAL, FLUJO COMPLETO) -->
    <!-- ============================================================== -->
    <div v-if="isFormOpen" id="form-page" class="form-page w-100 mt-2">
      <div class="form-page-card w-100 shadow-sm border border-secondary-subtle">
        
        <!-- Cabecera del Formulario -->
        <div class="modal-header-custom d-flex justify-content-between align-items-center p-3 px-4 border-bottom border-dark-subtle">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                {{ isEditing ? 'ORDEN: ' + form.order_number : 'NUEVA RECEPCIÓN' }}
              </span>
              <span class="text-muted small">Servicio Técnico Electrónico</span>
            </div>
            <h4 class="text-body-emphasis fw-bold mb-0">
              {{ isEditing ? 'Editar Orden de Trabajo #' + form.order_number : 'Registrar Nueva Orden de Servicio Técnico' }}
            </h4>
          </div>
          <!-- Botón Volver al Listado -->
          <button type="button" class="btn btn-outline-secondary d-flex align-items-center gap-1 shadow-sm" @click="closeForm">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <!-- Cuerpo del Formulario 100% Ancho -->
        <form @submit.prevent="submitForm" class="p-4">
          <div class="row g-4">
            
            <!-- SECCIÓN 1: DATOS DE RECEPCIÓN Y CLIENTE -->
            <div class="col-12">
              <div class="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <iconify-icon icon="solar:user-hand-up-bold-duotone" class="fs-4 text-primary"></iconify-icon>
                  <h5 class="fw-bold mb-0 text-body-emphasis">1. Datos del Cliente & Recepción</h5>
                </div>
                
                <div class="row g-3">
                  <!-- Selector de Cliente Registrado -->
                  <div class="col-lg-6 col-12">
                    <label class="form-label fw-semibold">Seleccionar Cliente Registrado <span class="text-danger">*</span></label>
                    <AppSelect2
                      v-model="form.customer_id"
                      :options="customerOptions"
                      :fetch-options="fetchCustomerOptions"
                      placeholder="Buscar cliente por nombre o cédula..."
                      allow-clear
                      @change="onCustomerSelected"
                    />
                  </div>

                  <!-- Nombre del Cliente (Obligatorio) -->
                  <div class="col-lg-6 col-12">
                    <label class="form-label fw-semibold">Nombre Completo del Cliente <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="form.customer_name"
                      class="form-control"
                      placeholder="Ej. Juan Pérez"
                      required
                    />
                  </div>

                  <!-- Teléfono / WhatsApp -->
                  <div class="col-md-4 col-12">
                    <label class="form-label fw-semibold">Teléfono / WhatsApp</label>
                    <div class="input-group">
                      <span class="input-group-text"><iconify-icon icon="solar:phone-line-duotone"></iconify-icon></span>
                      <input
                        type="text"
                        v-model="form.customer_phone"
                        class="form-control"
                        placeholder="Ej. 0991234567"
                      />
                    </div>
                  </div>

                  <!-- Correo Electrónico -->
                  <div class="col-md-4 col-12">
                    <label class="form-label fw-semibold">Correo Electrónico</label>
                    <div class="input-group">
                      <span class="input-group-text"><iconify-icon icon="solar:letter-line-duotone"></iconify-icon></span>
                      <input
                        type="email"
                        v-model="form.customer_email"
                        class="form-control"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <!-- Técnico Asignado -->
                  <div class="col-md-4 col-12">
                    <label class="form-label fw-semibold">Técnico Responsable</label>
                    <AppSelect2
                      v-model="form.technician_id"
                      :options="technicianOptions"
                      :fetch-options="fetchTechnicianOptions"
                      placeholder="Seleccionar técnico..."
                      allow-clear
                      @change="onTechnicianSelected"
                    />
                  </div>

                  <!-- Sucursal -->
                  <div class="col-md-3 col-6" v-if="branches.length > 0">
                    <label class="form-label fw-semibold">Sucursal / Taller</label>
                    <select v-model="form.branch_id" class="form-select">
                      <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                  </div>

                  <!-- Tipo de Servicio -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Tipo de Servicio <span class="text-danger">*</span></label>
                    <select v-model="form.service_type" class="form-select" required>
                      <option value="REPARACION">Reparación</option>
                      <option value="MANTENIMIENTO_PREVENTIVO">Mantenimiento Preventivo</option>
                      <option value="DIAGNOSTICO">Solo Diagnóstico</option>
                      <option value="GARANTIA">Garantía</option>
                    </select>
                  </div>

                  <!-- Prioridad -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Prioridad</label>
                    <select v-model="form.priority" class="form-select">
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente 🔥</option>
                    </select>
                  </div>

                  <!-- Fecha Estimada de Entrega -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Fecha Promesa Entrega</label>
                    <input
                      type="date"
                      v-model="form.estimated_delivery_date"
                      class="form-control"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: DATOS DEL EQUIPO ELECTRÓNICO -->
            <div class="col-12">
              <div class="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <iconify-icon icon="solar:devices-bold-duotone" class="fs-4 text-warning"></iconify-icon>
                  <h5 class="fw-bold mb-0 text-body-emphasis">2. Datos del Dispositivo o Equipo Electrónico</h5>
                </div>

                <div class="row g-3">
                  <!-- Tipo de Equipo -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Tipo de Equipo <span class="text-danger">*</span></label>
                    <select v-model="form.equipment_type" class="form-select" required>
                      <option value="Smartphone">Smartphone / Celular</option>
                      <option value="Laptop">Laptop / Portátil</option>
                      <option value="PC Escritorio">PC de Escritorio / Torre</option>
                      <option value="Tablet">Tablet / iPad</option>
                      <option value="Consola">Consola de Videojuegos</option>
                      <option value="Smartwatch">Smartwatch / Reloj Inteligente</option>
                      <option value="TV / Monitor">TV / Monitor</option>
                      <option value="Impresora">Impresora / Multifunción</option>
                      <option value="Audio / Parlante">Equipo de Audio / Parlante</option>
                      <option value="Otro">Otro Dispositivo</option>
                    </select>
                  </div>

                  <!-- Marca -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Marca <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      v-model="form.brand"
                      class="form-control"
                      placeholder="Ej. Apple, Samsung, Lenovo, Dell"
                      required
                    />
                  </div>

                  <!-- Modelo -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Modelo</label>
                    <input
                      type="text"
                      v-model="form.model"
                      class="form-control"
                      placeholder="Ej. iPhone 13, ThinkPad T14, PS5"
                    />
                  </div>

                  <!-- Serie / IMEI -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">N° Serie / IMEI</label>
                    <input
                      type="text"
                      v-model="form.serial_number"
                      class="form-control font-monospace"
                      placeholder="Ej. SN892348123"
                    />
                  </div>

                  <!-- Color -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Color</label>
                    <input
                      type="text"
                      v-model="form.color"
                      class="form-control"
                      placeholder="Ej. Negro Mate, Azul, Plata"
                    />
                  </div>

                  <!-- Contraseña / PIN / Patrón de Desbloqueo -->
                  <div class="col-md-3 col-6">
                    <label class="form-label fw-semibold">Clave / PIN de Desbloqueo</label>
                    <div class="input-group">
                      <span class="input-group-text"><iconify-icon icon="solar:lock-password-line-duotone"></iconify-icon></span>
                      <input
                        type="text"
                        v-model="form.security_pin"
                        class="form-control font-monospace"
                        placeholder="PIN o patrón de pruebas"
                      />
                    </div>
                  </div>

                  <!-- Accesorios Dejados -->
                  <div class="col-md-6 col-12">
                    <label class="form-label fw-semibold">Accesorios Entregados</label>
                    <input
                      type="text"
                      v-model="form.accessories"
                      class="form-control"
                      placeholder="Ej. Cargador original, funda de silicona, cable HDMI, caja"
                    />
                  </div>

                  <!-- Estado Físico de Recepción -->
                  <div class="col-12">
                    <label class="form-label fw-semibold">Estado Estético y Físico en Recepción</label>
                    <input
                      type="text"
                      v-model="form.physical_condition"
                      class="form-control"
                      placeholder="Ej. Pantalla intacta pero tapa trasera rayada, bisagra izquierda floja, esquinas con marcas de impacto"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: FALLA Y DIAGNÓSTICO -->
            <div class="col-12">
              <div class="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <iconify-icon icon="solar:danger-circle-bold-duotone" class="fs-4 text-danger"></iconify-icon>
                  <h5 class="fw-bold mb-0 text-body-emphasis">3. Falla Reportada por el Cliente & Diagnóstico Técnico</h5>
                </div>

                <div class="row g-3">
                  <!-- Falla Reportada (Obligatorio) -->
                  <div class="col-md-6 col-12">
                    <label class="form-label fw-semibold">Falla Reportada por el Cliente <span class="text-danger">*</span></label>
                    <textarea
                      v-model="form.reported_failure"
                      class="form-control"
                      rows="3"
                      placeholder="Detalle los síntomas descritos por el cliente (ej. No enciende, se apaga a los 5 minutos, pantalla azul, etc.)..."
                      required
                    ></textarea>
                  </div>

                  <!-- Diagnóstico Técnico Inicial -->
                  <div class="col-md-6 col-12">
                    <label class="form-label fw-semibold">Diagnóstico Técnico / Procedimiento</label>
                    <textarea
                      v-model="form.technical_diagnosis"
                      class="form-control"
                      rows="3"
                      placeholder="Observaciones del técnico tras inspección (ej. Cortocircuito en línea principal VDD, sulfatación en puerto de carga, etc.)..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 4: REPUESTOS, MATERIALES Y MANO DE OBRA -->
            <div class="col-12">
              <div class="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:box-bold-duotone" class="fs-4 text-info"></iconify-icon>
                    <h5 class="fw-bold mb-0 text-body-emphasis">4. Repuestos Utilizados & Mano de Obra</h5>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    @click="addItemRow"
                  >
                    <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
                    <span>+ Agregar Ítem</span>
                  </button>
                </div>

                <div class="table-responsive">
                  <table class="table table-bordered table-sm align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 140px;">Tipo</th>
                        <th>Descripción del Repuesto / Trabajo</th>
                        <th style="width: 90px;" class="text-center">Cant.</th>
                        <th style="width: 120px;" class="text-end">P. Unitario ($)</th>
                        <th style="width: 100px;" class="text-center">IVA %</th>
                        <th style="width: 100px;" class="text-center">Garantía (Días)</th>
                        <th style="width: 120px;" class="text-end">Total ($)</th>
                        <th style="width: 50px;" class="text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="form.items.length === 0">
                        <td colspan="8" class="text-center text-muted py-3">
                          No se han agregado repuestos o ítems adicionales. Puede agregar mano de obra y repuestos con el botón de arriba.
                        </td>
                      </tr>
                      <tr v-for="(item, index) in form.items" :key="index">
                        <!-- Tipo -->
                        <td>
                          <select v-model="item.item_type" class="form-select form-select-sm">
                            <option value="REPUESTO">Repuesto</option>
                            <option value="MANO_OBRA">Mano de Obra</option>
                            <option value="SERVICIO">Servicio</option>
                            <option value="OTRO">Otro</option>
                          </select>
                        </td>

                        <!-- Descripción -->
                        <td>
                          <input
                            type="text"
                            v-model="item.description"
                            class="form-control form-control-sm"
                            placeholder="Descripción del ítem o repuesto..."
                            required
                          />
                        </td>

                        <!-- Cantidad -->
                        <td>
                          <input
                            type="number"
                            v-model.number="item.quantity"
                            min="1"
                            step="1"
                            class="form-control form-control-sm text-center"
                            @input="recalculateTotals"
                          />
                        </td>

                        <!-- Precio Unitario -->
                        <td>
                          <input
                            type="number"
                            v-model.number="item.unit_price"
                            min="0"
                            step="0.01"
                            class="form-control form-control-sm text-end"
                            @input="recalculateTotals"
                          />
                        </td>

                        <!-- IVA -->
                        <td>
                          <select v-model.number="item.tax_rate" class="form-select form-select-sm text-center" @change="recalculateTotals">
                            <option :value="15">15%</option>
                            <option :value="0">0%</option>
                          </select>
                        </td>

                        <!-- Garantía -->
                        <td>
                          <input
                            type="number"
                            v-model.number="item.warranty_days"
                            min="0"
                            step="1"
                            class="form-control form-control-sm text-center"
                            placeholder="Días"
                          />
                        </td>

                        <!-- Total Ítem -->
                        <td class="text-end fw-semibold">
                          ${{ getItemTotal(item).toFixed(2) }}
                        </td>

                        <!-- Quitar -->
                        <td class="text-center">
                          <button
                            type="button"
                            class="btn btn-sm btn-link text-danger p-0"
                            @click="removeItemRow(index)"
                            title="Eliminar ítem"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 5: LIQUIDACIÓN ECONÓMICA Y CONDICIONES -->
            <div class="col-12">
              <div class="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle">
                <div class="row g-4 align-items-center">
                  <!-- Notas y Términos de Garantía -->
                  <div class="col-lg-6 col-12">
                    <div class="mb-3">
                      <label class="form-label fw-semibold">Días de Garantía del Trabajo</label>
                      <div class="input-group" style="max-width: 200px;">
                        <input
                          type="number"
                          v-model.number="form.warranty_days"
                          min="0"
                          class="form-control"
                        />
                        <span class="input-group-text">Días</span>
                      </div>
                    </div>

                    <div>
                      <label class="form-label fw-semibold">Observaciones Internas o Condiciones Especiales</label>
                      <textarea
                        v-model="form.notes"
                        class="form-control"
                        rows="3"
                        placeholder="Notas adicionales sobre la entrega, datos respaldados, etc."
                      ></textarea>
                    </div>
                  </div>

                  <!-- Resumen Financiero -->
                  <div class="col-lg-6 col-12">
                    <div class="card bg-body border p-3 shadow-none">
                      <h6 class="fw-bold mb-3 border-bottom pb-2 text-body-emphasis">Liquidación Presupuestaria</h6>
                      
                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Mano de Obra Base:</span>
                        <div class="input-group input-group-sm" style="max-width: 140px;">
                          <span class="input-group-text">$</span>
                          <input
                            type="number"
                            v-model.number="form.labor_cost"
                            min="0"
                            step="0.01"
                            class="form-control text-end"
                            @input="recalculateTotals"
                          />
                        </div>
                      </div>

                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Total Repuestos / Partes:</span>
                        <span class="fw-semibold">${{ calculatedPartsCost.toFixed(2) }}</span>
                      </div>

                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Subtotal:</span>
                        <span class="fw-semibold">${{ calculatedSubtotal.toFixed(2) }}</span>
                      </div>

                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">IVA Total (15%):</span>
                        <span class="fw-semibold">${{ calculatedTaxAmount.toFixed(2) }}</span>
                      </div>

                      <div class="d-flex justify-content-between mb-3 border-top pt-2">
                        <span class="fw-bold fs-4 text-body-emphasis">TOTAL DE LA ORDEN:</span>
                        <span class="fw-bold fs-4 text-success">${{ calculatedTotal.toFixed(2) }}</span>
                      </div>

                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted fw-semibold">Abono / Anticipo Dejado:</span>
                        <div class="input-group input-group-sm" style="max-width: 140px;">
                          <span class="input-group-text">$</span>
                          <input
                            type="number"
                            v-model.number="form.advance_payment"
                            min="0"
                            step="0.01"
                            class="form-control text-end"
                            @input="recalculateTotals"
                          />
                        </div>
                      </div>

                      <div class="d-flex justify-content-between border-top pt-2">
                        <span class="fw-bold fs-4 text-danger">SALDO PENDIENTE:</span>
                        <span class="fw-bold fs-4 text-danger">${{ calculatedBalance.toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOTONES DE PIE DE FORMULARIO -->
            <div class="col-12 text-end border-top pt-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-outline-secondary px-4 py-2" @click="closeForm">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary px-4 py-2 fw-bold d-inline-flex align-items-center gap-2" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
                <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Orden de Trabajo' }}</span>
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 1: TICKET TÉRMICO IMPRIMIBLE DE LA ORDEN                 -->
    <!-- ============================================================== -->
    <div class="modal fade" id="modalWorkOrderTicket" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-dark text-white py-2">
            <h6 class="modal-title fw-bold text-white mb-0">Comprobante de Servicio Técnico</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" v-if="selectedTicketOrder" id="printableWorkOrderTicket">
            <div class="ticket-receipt text-center font-monospace">
              <h5 class="fw-bold mb-0 text-dark">{{ activeCompanyName }}</h5>
              <small class="text-muted d-block mb-2">SERVICIO TÉCNICO & ELECTRÓNICA</small>
              <div class="border-top border-bottom border-dark py-1 my-2">
                <span class="fs-4 fw-bold text-dark">{{ selectedTicketOrder.order_number }}</span>
              </div>

              <div class="text-start fs-1 mb-2">
                <div><strong>Fecha Ingreso:</strong> {{ selectedTicketOrder.entry_date }}</div>
                <div><strong>Cliente:</strong> {{ selectedTicketOrder.customer_name }}</div>
                <div v-if="selectedTicketOrder.customer_phone"><strong>Teléfono:</strong> {{ selectedTicketOrder.customer_phone }}</div>
                <div><strong>Técnico:</strong> {{ selectedTicketOrder.technician_name || 'Por Asignar' }}</div>
              </div>

              <div class="border-top border-dark pt-2 mb-2 text-start fs-1">
                <div class="fw-bold mb-1">EQUIPO RECEPCIONADO:</div>
                <div><strong>Dispositivo:</strong> {{ selectedTicketOrder.equipment_type }}</div>
                <div><strong>Marca / Modelo:</strong> {{ selectedTicketOrder.brand }} {{ selectedTicketOrder.model || '' }}</div>
                <div v-if="selectedTicketOrder.serial_number"><strong>S/N / IMEI:</strong> {{ selectedTicketOrder.serial_number }}</div>
                <div v-if="selectedTicketOrder.accessories"><strong>Accesorios:</strong> {{ selectedTicketOrder.accessories }}</div>
                <div><strong>Falla Reportada:</strong> {{ selectedTicketOrder.reported_failure }}</div>
              </div>

              <div v-if="selectedTicketOrder.items && selectedTicketOrder.items.length > 0" class="border-top border-dark pt-2 mb-2 text-start">
                <table class="w-100 fs-1">
                  <thead>
                    <tr class="border-bottom border-secondary">
                      <th class="text-start">Detalle</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedTicketOrder.items" :key="item.id">
                      <td class="text-start py-1">
                        {{ item.description }}
                        <small class="d-block text-muted">Cant: {{ item.quantity }}</small>
                      </td>
                      <td class="text-end py-1">${{ Number(item.total || 0).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="border-top border-dark pt-2 text-end fs-2">
                <div class="d-flex justify-content-between">
                  <span>Mano de Obra:</span>
                  <span>${{ Number(selectedTicketOrder.labor_cost || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Repuestos:</span>
                  <span>${{ Number(selectedTicketOrder.parts_cost || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between fw-bold fs-3 text-dark border-top pt-1 mt-1">
                  <span>TOTAL ESTIMADO:</span>
                  <span>${{ Number(selectedTicketOrder.total_amount || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between text-success">
                  <span>Abono:</span>
                  <span>${{ Number(selectedTicketOrder.advance_payment || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between fw-bold text-danger border-top pt-1 mt-1">
                  <span>SALDO PENDIENTE:</span>
                  <span>${{ Number(selectedTicketOrder.pending_balance || 0).toFixed(2) }}</span>
                </div>
              </div>

              <div class="mt-4 pt-2 border-top border-dashed text-muted fs-1 text-center">
                Garantía: {{ selectedTicketOrder.warranty_days || 30 }} días en mano de obra y repuestos sustituidos.<br />
                Conserve este comprobante para retirar su equipo.
              </div>
            </div>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="printTicket">
              <iconify-icon icon="solar:printer-bold" class="fs-5"></iconify-icon>
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 2: CAMBIO RÁPIDO DE ESTADO DE LA ORDEN                   -->
    <!-- ============================================================== -->
    <div class="modal fade" id="modalChangeStatus" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-dark text-white py-2">
            <h6 class="modal-title fw-bold text-white mb-0">Actualizar Estado de la Orden</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" v-if="selectedStatusOrder">
            <div class="mb-3">
              <label class="form-label fw-semibold">Orden de Trabajo</label>
              <div class="form-control-plaintext font-monospace fw-bold fs-4 text-primary">
                {{ selectedStatusOrder.order_number }} - {{ selectedStatusOrder.customer_name }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold">Nuevo Estado <span class="text-danger">*</span></label>
              <select v-model="newStatus" class="form-select">
                <option value="RECIBIDO">Recibido (En Espera)</option>
                <option value="EN_DIAGNOSTICO">En Diagnóstico</option>
                <option value="PRESUPUESTADO">Presupuestado</option>
                <option value="APROBADO">Aprobado por Cliente</option>
                <option value="EN_REPARACION">En Reparación</option>
                <option value="EN_ESPERA_REPUESTOS">En Espera de Repuestos</option>
                <option value="LISTO_ENTREGA">Listo para Entrega ✅</option>
                <option value="ENTREGADO">Entregado al Cliente 🎉</option>
                <option value="CANCELADO">Cancelado / No Aceptado</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold">Notas / Observaciones del Cambio de Estado</label>
              <textarea
                v-model="statusNotes"
                class="form-control"
                rows="3"
                placeholder="Indique las novedades o detalles técnicos de este cambio de estado..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary btn-sm" :disabled="savingStatus" @click="saveStatusChange">
              <span v-if="savingStatus" class="spinner-border spinner-border-sm me-1" role="status"></span>
              Actualizar Estado
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AppSelect2, { type Select2Option } from '@/components/common/AppSelect2.vue';
import { toast } from '@/utils/toastr';
import { useAuthStore } from '@/stores/auth.store';
import {
  technicalServiceService,
  type WorkOrder,
  type WorkOrderItem,
  type WorkOrderKPIs,
  type WorkOrderFilters,
} from '@/services/technical-service.service';
import { getCustomers, type CustomerItem } from '@/services/contacts.service';
import { getEmployees, type EmployeeItem } from '@/services/hr.service';
import { getBranches, type BranchItem } from '@/services/config.service';

const authStore = useAuthStore();

// Active Company Name
const getActiveCompany = (): any => {
  try {
    const raw = localStorage.getItem('selectedCompany');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const getActiveCompanyId = (): number => {
  const comp = getActiveCompany();
  if (comp?.id) return Number(comp.id);
  return authStore.tokenPayload?.company_id || authStore.accessInfo?.companyId || 1;
};

const activeCompanyName = computed(() => {
  const comp = getActiveCompany();
  return comp?.razon_social || comp?.nombre_comercial || 'Deskounta Service';
});

// State
const loading = ref(false);
const saving = ref(false);
const isFormOpen = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const orders = ref<WorkOrder[]>([]);
const kpis = ref<WorkOrderKPIs>({
  totalOrders: 0,
  inProgress: 0,
  readyToDeliver: 0,
  pendingBalance: 0,
});

const customers = ref<CustomerItem[]>([]);
const employees = ref<EmployeeItem[]>([]);
const branches = ref<BranchItem[]>([]);

// Filters
const filters = ref<WorkOrderFilters>({
  search: '',
  status: '',
  priority: '',
  service_type: '',
  branch_id: undefined,
});

let searchTimeout: any = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadOrders();
  }, 350);
};

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.value.search ||
    filters.value.status ||
    filters.value.priority ||
    filters.value.service_type ||
    filters.value.branch_id
  );
});

const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    priority: '',
    service_type: '',
    branch_id: undefined,
  };
  loadOrders();
};

// Form Interface
interface WorkOrderFormData {
  order_number: string;
  branch_id?: number;
  customer_id?: number | null;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  technician_id?: number | null;
  technician_name?: string;
  service_type: string;
  priority: string;
  equipment_type: string;
  brand: string;
  model?: string;
  serial_number?: string;
  color?: string;
  security_pin?: string;
  accessories?: string;
  physical_condition?: string;
  reported_failure: string;
  technical_diagnosis?: string;
  solution_applied?: string;
  estimated_delivery_date?: string;
  warranty_days: number;
  labor_cost: number;
  advance_payment: number;
  notes?: string;
  items: Array<{
    item_type: 'REPUESTO' | 'MANO_OBRA' | 'SERVICIO' | 'OTRO';
    product_id?: number | null;
    code?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    warranty_days: number;
    notes?: string | null;
  }>;
}

const initialForm = (): WorkOrderFormData => ({
  order_number: '',
  branch_id: undefined,
  customer_id: null,
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  technician_id: null,
  technician_name: '',
  service_type: 'REPARACION',
  priority: 'MEDIA',
  equipment_type: 'Smartphone',
  brand: '',
  model: '',
  serial_number: '',
  color: '',
  security_pin: '',
  accessories: '',
  physical_condition: '',
  reported_failure: '',
  technical_diagnosis: '',
  solution_applied: '',
  estimated_delivery_date: '',
  warranty_days: 30,
  labor_cost: 0,
  advance_payment: 0,
  notes: '',
  items: [],
});

const form = ref<WorkOrderFormData>(initialForm());

// Computed Options for Select2
const customerOptions = computed<Select2Option[]>(() => {
  return customers.value.map((c) => ({
    value: c.id,
    label: c.razon_social || c.nombre_comercial || 'Cliente',
    sublabel: c.num_document ? `Doc: ${c.num_document} | Tel: ${c.telefono || '-'}` : c.telefono,
  }));
});

const technicianOptions = computed<Select2Option[]>(() => {
  return employees.value.map((e) => ({
    value: e.id,
    label: `${e.first_name} ${e.last_name}`,
    sublabel: e.category?.name || 'Técnico',
  }));
});

const fetchCustomerOptions = async (query: string): Promise<Select2Option[]> => {
  try {
    const list = await getCustomers(getActiveCompanyId());
    if (Array.isArray(list)) customers.value = list;
    const q = query.trim().toLowerCase();
    return customers.value
      .filter((c) => !q || (c.razon_social || c.nombre_comercial)?.toLowerCase().includes(q) || c.num_document?.includes(q))
      .map((c) => ({
        value: c.id,
        label: c.razon_social || c.nombre_comercial || 'Cliente',
        sublabel: c.num_document ? `Doc: ${c.num_document} | Tel: ${c.telefono || '-'}` : c.telefono,
      }));
  } catch (e) {
    return customerOptions.value;
  }
};

const fetchTechnicianOptions = async (query: string): Promise<Select2Option[]> => {
  try {
    const list = await getEmployees();
    if (Array.isArray(list)) employees.value = list;
    const q = query.trim().toLowerCase();
    return employees.value
      .filter((e) => !q || `${e.first_name} ${e.last_name}`.toLowerCase().includes(q))
      .map((e) => ({
        value: e.id,
        label: `${e.first_name} ${e.last_name}`,
        sublabel: e.category?.name || 'Técnico',
      }));
  } catch (e) {
    return technicianOptions.value;
  }
};

// Selection Handlers
const onCustomerSelected = (customerId: number | null) => {
  if (!customerId) return;
  const c = customers.value.find((cust) => cust.id === customerId);
  if (c) {
    form.value.customer_name = c.razon_social || c.nombre_comercial || '';
    form.value.customer_phone = c.telefono || '';
    form.value.customer_email = c.email || '';
  }
};

const onTechnicianSelected = (technicianId: number | null) => {
  if (!technicianId) {
    form.value.technician_name = '';
    return;
  }
  const t = employees.value.find((emp) => emp.id === technicianId);
  if (t) {
    form.value.technician_name = `${t.first_name} ${t.last_name}`;
  }
};

// Item Calculations
const getItemTotal = (item: { quantity: number; unit_price: number; tax_rate: number }) => {
  const base = Number(item.quantity || 0) * Number(item.unit_price || 0);
  const tax = base * (Number(item.tax_rate || 0) / 100);
  return base + tax;
};

const addItemRow = () => {
  form.value.items.push({
    item_type: 'REPUESTO',
    description: '',
    quantity: 1,
    unit_price: 0,
    tax_rate: 15,
    warranty_days: 30,
    notes: '',
  });
};

const removeItemRow = (index: number) => {
  form.value.items.splice(index, 1);
  recalculateTotals();
};

const recalculateTotals = () => {
  // Triggers reactivity for financial summary
};

const calculatedPartsCost = computed(() => {
  return form.value.items
    .filter((it) => it.item_type === 'REPUESTO')
    .reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
});

const calculatedSubtotal = computed(() => {
  const labor = Number(form.value.labor_cost || 0);
  const itemsSubtotal = form.value.items.reduce(
    (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
    0
  );
  return labor + itemsSubtotal;
});

const calculatedTaxAmount = computed(() => {
  const laborTax = Number(form.value.labor_cost || 0) * 0.15;
  const itemsTax = form.value.items.reduce((sum, it) => {
    const base = Number(it.quantity || 0) * Number(it.unit_price || 0);
    return sum + base * (Number(it.tax_rate || 0) / 100);
  }, 0);
  return laborTax + itemsTax;
});

const calculatedTotal = computed(() => {
  return calculatedSubtotal.value + calculatedTaxAmount.value;
});

const calculatedBalance = computed(() => {
  const bal = calculatedTotal.value - Number(form.value.advance_payment || 0);
  return bal < 0 ? 0 : bal;
});

// Load Data
const loadOrders = async () => {
  loading.value = true;
  try {
    const res = await technicalServiceService.list(filters.value);
    orders.value = res.items || [];
    if (res.kpis) {
      kpis.value = res.kpis;
    }
  } catch (error: any) {
    toast.error(error.message || 'Error al cargar las órdenes de servicio técnico');
  } finally {
    loading.value = false;
  }
};

const loadAuxiliaryData = async () => {
  try {
    const companyId = getActiveCompanyId();
    const [custs, emps] = await Promise.all([
      getCustomers(companyId).catch(() => []),
      getEmployees().catch(() => []),
    ]);
    customers.value = custs;
    employees.value = emps;

    if (companyId) {
      const branchRes = await getBranches(companyId).catch(() => ({ data: [] }));
      branches.value = Array.isArray(branchRes) ? branchRes : (branchRes.data || []);
    }
  } catch (err) {
    console.error('Error cargando catálogos auxiliares', err);
  }
};

// Form Actions
const openCreateForm = async () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = initialForm();

  // Set default branch if available
  if (branches.value.length > 0 && branches.value[0]?.id) {
    form.value.branch_id = branches.value[0].id;
  }

  // Fetch next order number preview
  try {
    const nextNumber = await technicalServiceService.getNextOrderNumber();
    form.value.order_number = nextNumber;
  } catch (err) {
    form.value.order_number = 'OT-0001';
  }

  isFormOpen.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openEditForm = async (order: WorkOrder) => {
  try {
    const detail = await technicalServiceService.getById(order.id);
    isEditing.value = true;
    editingId.value = detail.id;
    form.value = {
      order_number: detail.order_number,
      branch_id: detail.branch_id || undefined,
      customer_id: detail.customer_id || null,
      customer_name: detail.customer_name,
      customer_phone: detail.customer_phone || '',
      customer_email: detail.customer_email || '',
      technician_id: detail.technician_id || null,
      technician_name: detail.technician_name || '',
      service_type: detail.service_type,
      priority: detail.priority,
      equipment_type: detail.equipment_type,
      brand: detail.brand,
      model: detail.model || '',
      serial_number: detail.serial_number || '',
      color: detail.color || '',
      security_pin: detail.security_pin || '',
      accessories: detail.accessories || '',
      physical_condition: detail.physical_condition || '',
      reported_failure: detail.reported_failure,
      technical_diagnosis: detail.technical_diagnosis || '',
      solution_applied: detail.solution_applied || '',
      estimated_delivery_date: (detail.estimated_delivery_date || '').substring(0, 10),
      warranty_days: detail.warranty_days || 30,
      // Solo la mano de obra base: los ítems de mano de obra/servicio ya están en la tabla.
      labor_cost: Number(detail.base_labor_cost || 0),
      advance_payment: Number(detail.advance_payment || 0),
      notes: detail.notes || '',
      items: (detail.items || []).map((it) => ({
        item_type: it.item_type,
        product_id: it.product_id,
        code: it.code,
        description: it.description,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        tax_rate: Number(it.tax_rate ?? 15),
        warranty_days: Number(it.warranty_days || 0),
        notes: it.notes,
      })),
    };
    isFormOpen.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error: any) {
    toast.error(error.message || 'Error al obtener el detalle de la orden');
  }
};

const closeForm = () => {
  isFormOpen.value = false;
  isEditing.value = false;
  editingId.value = null;
};

const submitForm = async () => {
  // El backend exige un cliente registrado (customerId obligatorio).
  if (!form.value.customer_id) {
    toast.warning('Por favor seleccione un cliente registrado');
    return;
  }
  if (!form.value.customer_name.trim()) {
    toast.warning('Por favor ingrese el nombre del cliente');
    return;
  }
  if (!form.value.brand.trim() || !form.value.reported_failure.trim()) {
    toast.warning('Por favor ingrese la marca del equipo y la falla reportada');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      branch_id: form.value.branch_id || null,
      customer_id: form.value.customer_id,
      customer_name: form.value.customer_name,
      customer_phone: form.value.customer_phone,
      customer_email: form.value.customer_email,
      technician_id: form.value.technician_id || null,
      technician_name: form.value.technician_name,
      service_type: form.value.service_type,
      priority: form.value.priority,
      equipment_type: form.value.equipment_type,
      brand: form.value.brand,
      model: form.value.model,
      serial_number: form.value.serial_number,
      color: form.value.color,
      security_pin: form.value.security_pin,
      accessories: form.value.accessories,
      physical_condition: form.value.physical_condition,
      reported_failure: form.value.reported_failure,
      technical_diagnosis: form.value.technical_diagnosis,
      solution_applied: form.value.solution_applied,
      estimated_delivery_date: form.value.estimated_delivery_date || null,
      warranty_days: Number(form.value.warranty_days) || 0,
      labor_cost: Number(form.value.labor_cost) || 0,
      // El backend no calcula el IVA: guarda el total que se le envía.
      tax_amount: Math.round(calculatedTaxAmount.value * 100) / 100,
      advance_payment: Number(form.value.advance_payment) || 0,
      notes: form.value.notes,
      // IVA %, garantía y notas por ítem no existen en el backend: no se envían.
      items: form.value.items.map((it) => ({
        item_type: it.item_type,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
      })),
    };

    if (isEditing.value && editingId.value) {
      await technicalServiceService.update(editingId.value, payload);
      toast.success('Orden de trabajo actualizada con éxito');
    } else {
      await technicalServiceService.create(payload);
      toast.success('Orden de servicio técnico registrada exitosamente');
    }

    closeForm();
    await loadOrders();
  } catch (error: any) {
    toast.error(error.message || 'Error al procesar la orden de trabajo');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (order: WorkOrder) => {
  if (confirm(`¿Está seguro de eliminar la orden de trabajo ${order.order_number}?`)) {
    try {
      await technicalServiceService.delete(order.id);
      toast.success('Orden de trabajo eliminada correctamente');
      await loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar la orden');
    }
  }
};

// Modal Ticket de Impresión
const selectedTicketOrder = ref<WorkOrder | null>(null);

const openTicketModal = (order: WorkOrder) => {
  selectedTicketOrder.value = order;
  const modalEl = document.getElementById('modalWorkOrderTicket');
  if (modalEl && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
};

const printTicket = () => {
  const content = document.getElementById('printableWorkOrderTicket');
  if (!content) return;
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>Imprimir Orden de Trabajo</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: #000; }
          .ticket-receipt { text-align: center; }
          .text-start { text-align: left; }
          .text-end { text-align: right; }
          .fw-bold { font-weight: bold; }
          .border-top { border-top: 1px solid #000; }
          .border-bottom { border-bottom: 1px solid #000; }
          .border-dashed { border-top: 1px dashed #000; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 3px 0; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

// Modal Cambio Rápido de Estado
const selectedStatusOrder = ref<WorkOrder | null>(null);
const newStatus = ref<string>('RECIBIDO');
const statusNotes = ref<string>('');
const savingStatus = ref(false);

const openStatusModal = (order: WorkOrder) => {
  selectedStatusOrder.value = order;
  newStatus.value = order.status;
  statusNotes.value = '';
  const modalEl = document.getElementById('modalChangeStatus');
  if (modalEl && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
};

const saveStatusChange = async () => {
  if (!selectedStatusOrder.value) return;
  savingStatus.value = true;
  try {
    await technicalServiceService.updateStatus(
      selectedStatusOrder.value.id,
      newStatus.value,
      statusNotes.value
    );
    toast.success('Estado actualizado correctamente');
    const modalEl = document.getElementById('modalChangeStatus');
    if (modalEl && (window as any).bootstrap) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
    await loadOrders();
  } catch (error: any) {
    toast.error(error.message || 'Error al actualizar el estado');
  } finally {
    savingStatus.value = false;
  }
};

// UI Helpers
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  return dateStr.substring(0, 10);
};

const getEquipmentIcon = (type?: string) => {
  switch (type) {
    case 'Smartphone':
      return 'solar:smartphone-bold-duotone';
    case 'Laptop':
      return 'solar:laptop-bold-duotone';
    case 'PC Escritorio':
      return 'solar:monitor-bold-duotone';
    case 'Tablet':
      return 'solar:tablet-bold-duotone';
    case 'Consola':
      return 'solar:gamepad-bold-duotone';
    case 'Smartwatch':
      return 'solar:watch-round-bold-duotone';
    case 'TV / Monitor':
      return 'solar:tv-bold-duotone';
    case 'Impresora':
      return 'solar:printer-bold-duotone';
    default:
      return 'solar:devices-bold-duotone';
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'URGENTE':
      return 'bg-danger text-white';
    case 'ALTA':
      return 'bg-danger-subtle text-danger border border-danger-subtle';
    case 'MEDIA':
      return 'bg-warning-subtle text-warning border border-warning-subtle';
    case 'BAJA':
    default:
      return 'bg-info-subtle text-info border border-info-subtle';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'RECIBIDO':
      return 'bg-secondary-subtle text-secondary';
    case 'EN_DIAGNOSTICO':
      return 'bg-info-subtle text-info';
    case 'PRESUPUESTADO':
      return 'bg-warning-subtle text-warning';
    case 'APROBADO':
      return 'bg-primary-subtle text-primary';
    case 'EN_REPARACION':
      return 'bg-warning text-dark';
    case 'EN_ESPERA_REPUESTOS':
      return 'bg-dark-subtle text-body';
    case 'LISTO_ENTREGA':
      return 'bg-success-subtle text-success border border-success-subtle';
    case 'ENTREGADO':
      return 'bg-success text-white';
    case 'CANCELADO':
      return 'bg-danger-subtle text-danger';
    default:
      return 'bg-secondary text-white';
  }
};

const formatStatusLabel = (status: string) => {
  switch (status) {
    case 'RECIBIDO':
      return 'Recibido';
    case 'EN_DIAGNOSTICO':
      return 'En Diagnóstico';
    case 'PRESUPUESTADO':
      return 'Presupuestado';
    case 'APROBADO':
      return 'Aprobado';
    case 'EN_REPARACION':
      return 'En Reparación';
    case 'EN_ESPERA_REPUESTOS':
      return 'Espera Repuestos';
    case 'LISTO_ENTREGA':
      return 'Listo Entrega';
    case 'ENTREGADO':
      return 'Entregado';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return status;
  }
};

const closeWorkOrderForm = () => {
  isFormOpen.value = false;
};

onMounted(() => {
  loadOrders();
  loadAuxiliaryData();
  window.addEventListener('deskounta:reset-view', closeWorkOrderForm);
});

onUnmounted(() => {
  window.removeEventListener('deskounta:reset-view', closeWorkOrderForm);
});
</script>

<style scoped>
.technical-service-page {
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

.ticket-receipt {
  max-width: 280px;
  margin: 0 auto;
}
</style>
