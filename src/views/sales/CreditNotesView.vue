<template>
  <div class="credit-notes-view p-3 p-md-4">
    <!-- Encabezado Principal -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1 text-muted small">
            <li class="breadcrumb-item"><router-link to="/dashboard">Dashboard</router-link></li>
            <li class="breadcrumb-item">Ventas</li>
            <li class="breadcrumb-item active text-white" aria-current="page">Notas de Crédito</li>
          </ol>
        </nav>
        <h2 class="h4 fw-bold mb-1 text-white d-flex align-items-center gap-2">
          <iconify-icon icon="solar:document-medicine-bold-duotone" class="text-primary fs-3"></iconify-icon>
          Notas de Crédito de Ventas
        </h2>
        <p class="text-muted small mb-0">
          Documento complementario oficial del SRI (Código 04) para devoluciones de mercadería, anulación de facturas y descuentos comerciales.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button
          v-if="currentTab === 'form'"
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-3"
          @click="switchToList"
        >
          <iconify-icon icon="solar:arrow-left-linear"></iconify-icon>
          Volver al Listado
        </button>

        <button
          v-if="currentTab === 'list'"
          type="button"
          class="btn btn-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-3 fw-semibold shadow-sm"
          @click="switchToCreate"
        >
          <iconify-icon icon="solar:add-circle-bold"></iconify-icon>
          Nueva Nota de Crédito
        </button>
      </div>
    </div>

    <!-- VISTA 1: LISTADO DE NOTAS DE CRÉDITO -->
    <div v-if="currentTab === 'list'">
      <!-- Tarjetas Resumen -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card bg-dark border-secondary h-100 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="badge-icon bg-primary-subtle text-primary p-3 rounded-circle">
                <iconify-icon icon="solar:documents-bold" class="fs-4"></iconify-icon>
              </div>
              <div>
                <span class="text-muted small d-block">Total Emitidas</span>
                <span class="h4 fw-bold text-white mb-0">{{ creditNotes.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card bg-dark border-secondary h-100 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="badge-icon bg-success-subtle text-success p-3 rounded-circle">
                <iconify-icon icon="solar:check-circle-bold" class="fs-4"></iconify-icon>
              </div>
              <div>
                <span class="text-muted small d-block">Autorizadas SRI</span>
                <span class="h4 fw-bold text-white mb-0">{{ authorizedCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card bg-dark border-secondary h-100 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="badge-icon bg-warning-subtle text-warning p-3 rounded-circle">
                <iconify-icon icon="solar:box-minimalistic-bold" class="fs-4"></iconify-icon>
              </div>
              <div>
                <span class="text-muted small d-block">Con Devolución Kardex</span>
                <span class="h4 fw-bold text-white mb-0">{{ returnsCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card bg-dark border-secondary h-100 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="badge-icon bg-info-subtle text-info p-3 rounded-circle">
                <iconify-icon icon="solar:dollar-minimalistic-bold" class="fs-4"></iconify-icon>
              </div>
              <div>
                <span class="text-muted small d-block">Total Acreditado ($)</span>
                <span class="h4 fw-bold text-white mb-0">${{ formatMoney(totalCreditedAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="card bg-dark border-secondary mb-3 shadow-sm">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-md-5">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-dark border-secondary text-secondary">
                  <iconify-icon icon="solar:magnifer-linear"></iconify-icon>
                </span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control bg-dark border-secondary text-white"
                  placeholder="Buscar por N° NC, factura modificada, cliente o RUC..."
                />
              </div>
            </div>

            <div class="col-6 col-md-4">
              <select v-model="filterBranchId" class="form-select form-select-sm bg-dark border-secondary text-white">
                <option :value="undefined">Todas las sucursales</option>
                <option v-for="b in branches" :key="b.id" :value="b.id">
                  {{ b.code }} - {{ b.name }}
                </option>
              </select>
            </div>

            <div class="col-6 col-md-3 text-end">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm rounded-pill w-100 d-inline-flex align-items-center justify-content-center gap-1"
                :disabled="isLoading"
                @click="loadData"
              >
                <span v-if="isLoading" class="spinner-grow spinner-grow-sm" role="status"></span>
                <iconify-icon v-else icon="solar:restart-bold"></iconify-icon>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Notas de Crédito -->
      <div class="card bg-dark border-secondary shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover align-middle mb-0">
              <thead class="table-dark text-muted small text-uppercase">
                <tr>
                  <th scope="col" class="ps-3">N° Nota de Crédito</th>
                  <th scope="col">Factura Modificada</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Motivo SRI</th>
                  <th scope="col" class="text-center">Kardex</th>
                  <th scope="col" class="text-end">Total</th>
                  <th scope="col" class="text-center">Estado SRI</th>
                  <th scope="col" class="text-center pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="9" class="text-center py-5 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando notas de crédito...
                  </td>
                </tr>

                <tr v-else-if="filteredCreditNotes.length === 0">
                  <td colspan="9" class="text-center py-5 text-muted">
                    <iconify-icon icon="solar:folder-error-linear" class="fs-1 d-block mb-2 text-secondary"></iconify-icon>
                    No se encontraron notas de crédito registradas.
                  </td>
                </tr>

                <tr v-for="cn in filteredCreditNotes" :key="cn.id">
                  <td class="ps-3 font-monospace fw-bold text-primary">
                    {{ cn.credit_note_number }}
                  </td>

                  <td>
                    <span class="badge bg-secondary-subtle text-light border border-secondary font-monospace">
                      {{ cn.modified_document_number }}
                    </span>
                    <span v-if="cn.modified_document_date" class="d-block text-muted small">
                      {{ cn.modified_document_date }}
                    </span>
                  </td>

                  <td class="text-white small">
                    {{ cn.issue_date }}
                  </td>

                  <td>
                    <div class="fw-semibold text-white">{{ cn.customer_name }}</div>
                    <div class="text-muted small font-monospace">{{ cn.customer_id_number }}</div>
                  </td>

                  <td>
                    <div class="text-truncate text-secondary small" style="max-width: 220px;" :title="cn.reason">
                      {{ cn.reason }}
                    </div>
                  </td>

                  <td class="text-center">
                    <span v-if="cn.adjust_inventory" class="badge bg-success-subtle text-success border border-success-subtle">
                      Reingresó
                    </span>
                    <span v-else class="badge bg-dark text-muted border border-secondary">
                      No aplica
                    </span>
                  </td>

                  <td class="text-end font-monospace fw-bold text-white">
                    ${{ formatMoney(cn.total) }}
                  </td>

                  <td class="text-center">
                    <span
                      class="badge"
                      :class="{
                        'bg-success-subtle text-success border border-success': cn.sri_status === 'AUTHORIZED',
                        'bg-warning-subtle text-warning border border-warning': cn.sri_status === 'IN_PROCESS',
                        'bg-danger-subtle text-danger border border-danger': cn.sri_status === 'RETURNED' || cn.sri_status === 'NOT_AUTHORIZED',
                        'bg-secondary-subtle text-muted border border-secondary': cn.sri_status === 'NOT_SENT'
                      }"
                    >
                      <iconify-icon
                        :icon="
                          cn.sri_status === 'AUTHORIZED'
                            ? 'solar:check-circle-bold'
                            : cn.sri_status === 'IN_PROCESS'
                            ? 'solar:clock-circle-bold'
                            : cn.sri_status === 'RETURNED' || cn.sri_status === 'NOT_AUTHORIZED'
                            ? 'solar:close-circle-bold'
                            : 'solar:send-square-linear'
                        "
                        class="me-1"
                      ></iconify-icon>
                      {{ formatSriStatus(cn.sri_status) }}
                    </span>
                  </td>

                  <td class="text-center pe-3">
                    <div class="btn-group btn-group-sm">
                      <!-- Enviar al SRI -->
                      <button
                        v-if="cn.sri_status !== 'AUTHORIZED'"
                        type="button"
                        class="btn btn-outline-primary"
                        :disabled="actionLoadingId === cn.id"
                        title="Enviar al SRI"
                        @click="handleSendSri(cn)"
                      >
                        <span v-if="actionLoadingId === cn.id" class="spinner-grow spinner-grow-sm" role="status"></span>
                        <iconify-icon v-else icon="solar:send-bold"></iconify-icon>
                      </button>

                      <!-- Descargar XML -->
                      <button
                        v-if="cn.sign_status === 'SIGNED' || cn.sri_status === 'AUTHORIZED'"
                        type="button"
                        class="btn btn-outline-info"
                        title="Descargar XML SRI"
                        @click="handleDownloadXml(cn)"
                      >
                        <iconify-icon icon="solar:code-file-bold"></iconify-icon>
                      </button>

                      <!-- Ver Detalle -->
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        title="Ver Detalle"
                        @click="openDetail(cn)"
                      >
                        <iconify-icon icon="solar:eye-bold"></iconify-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA 2: FORMULARIO DE EMISIÓN DE NOTA DE CRÉDITO (EN PÁGINA) -->
    <div v-else-if="currentTab === 'form'" class="create-nc-container">
      <form @submit.prevent="submitCreditNote">
        <!-- Tarjeta 1: Factura a Modificar y Datos del Cliente -->
        <div class="card bg-dark border-secondary mb-4 shadow-sm">
          <div class="card-header bg-dark border-secondary py-3">
            <h5 class="card-title h6 text-white mb-0 d-flex align-items-center gap-2">
              <iconify-icon icon="solar:bill-list-bold-duotone" class="text-primary fs-5"></iconify-icon>
              1. Seleccionar Factura a Modificar (Sustento SRI)
            </h5>
          </div>
          <div class="card-body p-3 p-md-4">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-light small fw-semibold">
                  Buscar Factura Emitida <span class="text-danger">*</span>
                </label>
                <AppSelect2
                  v-model="selectedInvoiceId"
                  :options="invoiceSelectOptions"
                  placeholder="-- Seleccionar Factura Emitida --"
                  search-placeholder="Buscar por N° factura o cliente..."
                  @update:model-value="onInvoiceSelected"
                />
                <div class="form-text text-muted small">
                  Selecciona la factura autorizada para cargar sus ítems, cliente y sucursal.
                </div>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label text-light small fw-semibold">Número Factura Modificada</label>
                <input
                  v-model="form.modified_document_number"
                  type="text"
                  class="form-control form-control-sm bg-dark border-secondary text-white font-monospace"
                  placeholder="001-001-000000001"
                  required
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label text-light small fw-semibold">Fecha Factura Modificada</label>
                <input
                  v-model="form.modified_document_date"
                  type="date"
                  class="form-control form-control-sm bg-dark border-secondary text-white"
                  required
                />
              </div>

              <!-- Datos del Cliente Autocompletados -->
              <div class="col-12">
                <div class="p-3 rounded bg-black bg-opacity-25 border border-secondary">
                  <div class="row g-2 align-items-center">
                    <div class="col-12 col-md-4">
                      <span class="text-muted small d-block">Cliente:</span>
                      <span class="fw-bold text-white">{{ form.customer_name || 'No seleccionado' }}</span>
                    </div>
                    <div class="col-6 col-md-3">
                      <span class="text-muted small d-block">RUC / Cédula:</span>
                      <span class="font-monospace text-light">{{ form.customer_id_number || '-' }}</span>
                    </div>
                    <div class="col-6 col-md-3">
                      <span class="text-muted small d-block">Correo:</span>
                      <span class="text-light small">{{ form.customer_email || 'Sin correo' }}</span>
                    </div>
                    <div class="col-12 col-md-2 text-md-end">
                      <span class="badge bg-secondary font-monospace">Tipo: {{ form.customer_id_type }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta 2: Punto de Emisión y Motivo SRI -->
        <div class="card bg-dark border-secondary mb-4 shadow-sm">
          <div class="card-header bg-dark border-secondary py-3">
            <h5 class="card-title h6 text-white mb-0 d-flex align-items-center gap-2">
              <iconify-icon icon="solar:settings-bold-duotone" class="text-primary fs-5"></iconify-icon>
              2. Punto de Emisión y Motivo SRI de la Nota de Crédito
            </h5>
          </div>
          <div class="card-body p-3 p-md-4">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label text-light small fw-semibold">Sucursal Emisora <span class="text-danger">*</span></label>
                <select
                  v-model="form.branchId"
                  class="form-select form-select-sm bg-dark border-secondary text-white"
                  required
                  @change="onBranchChanged"
                >
                  <option v-for="b in branches" :key="b.id" :value="b.id">
                    {{ b.code }} - {{ b.name }}
                  </option>
                </select>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label text-light small fw-semibold">Punto de Emisión <span class="text-danger">*</span></label>
                <AppSelect2
                  v-model="form.emission_point"
                  :options="emissionPointOptions"
                  placeholder="-- Seleccionar --"
                  search-placeholder="Buscar serie..."
                  @update:model-value="fetchNextSequential"
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label text-light small fw-semibold">Secuencial NC (Previsualización)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-dark border-secondary text-muted font-monospace">{{ establishmentCode }}-{{ form.emission_point }}-</span>
                  <input
                    v-model="previewSequential"
                    type="text"
                    class="form-control bg-dark border-secondary text-white font-monospace fw-bold"
                    readonly
                  />
                </div>
              </div>

              <div class="col-12 col-md-2">
                <label class="form-label text-light small fw-semibold">Fecha Emisión NC</label>
                <input
                  v-model="form.issue_date"
                  type="date"
                  class="form-control form-control-sm bg-dark border-secondary text-white"
                  required
                />
              </div>

              <!-- Motivo SRI -->
              <div class="col-12 col-md-6">
                <label class="form-label text-light small fw-semibold">
                  Motivo Estándar SRI <span class="text-danger">*</span>
                </label>
                <select
                  v-model="quickReasonSelect"
                  class="form-select form-select-sm bg-dark border-secondary text-white mb-2"
                  @change="onQuickReasonChange"
                >
                  <option value="">-- Seleccionar motivo estándar --</option>
                  <option value="Devolución de mercadería">Devolución de mercadería (Afecta stock)</option>
                  <option value="Anulación de factura por error en digitación o datos del cliente">Anulación de factura por error en digitación o datos</option>
                  <option value="Descuento o rebaja comercial posterior a la emisión">Descuento o rebaja comercial posterior</option>
                  <option value="Ajuste de precio o tarifa pactada">Ajuste de precio o tarifa pactada</option>
                  <option value="Rescisión o terminación de contrato de servicios">Rescisión o terminación de contrato</option>
                </select>

                <textarea
                  v-model="form.reason"
                  class="form-control form-control-sm bg-dark border-secondary text-white"
                  rows="2"
                  maxlength="300"
                  placeholder="Describe el motivo formal exigido por el SRI (máx. 300 caracteres)..."
                  required
                ></textarea>
                <div class="form-text text-muted small text-end">{{ form.reason.length }}/300 caracteres</div>
              </div>

              <!-- Control de Inventario -->
              <div class="col-12 col-md-6 d-flex align-items-center">
                <div class="p-3 rounded bg-black bg-opacity-25 border border-secondary w-100">
                  <div class="form-check form-switch mb-2">
                    <input
                      id="adjustInventorySwitch"
                      v-model="form.adjust_inventory"
                      class="form-check-input"
                      type="checkbox"
                    />
                    <label class="form-check-label text-light fw-semibold small" for="adjustInventorySwitch">
                      Reingresar artículos físicos devueltos al inventario (Kardex)
                    </label>
                  </div>
                  <p class="text-muted small mb-0">
                    Al activar esta opción, los artículos físicos con cantidad devuelta generarán un movimiento de entrada en bodega con motivo <code>CUSTOMER_RETURN</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta 3: Ítems a Devolver o Acreditar -->
        <div class="card bg-dark border-secondary mb-4 shadow-sm">
          <div class="card-header bg-dark border-secondary py-3 d-flex justify-content-between align-items-center">
            <h5 class="card-title h6 text-white mb-0 d-flex align-items-center gap-2">
              <iconify-icon icon="solar:box-minimalistic-bold-duotone" class="text-primary fs-5"></iconify-icon>
              3. Detalle de Ítems / Conceptos a Acreditar
            </h5>

            <button
              v-if="selectedInvoice"
              type="button"
              class="btn btn-outline-info btn-xs rounded-pill"
              @click="resetOriginalItems"
            >
              <iconify-icon icon="solar:restart-bold" class="me-1"></iconify-icon>
              Restaurar ítems completos de la factura
            </button>
          </div>

          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-dark table-hover align-middle mb-0">
                <thead class="table-dark text-muted small text-uppercase">
                  <tr>
                    <th scope="col" class="ps-3" style="width: 35%;">Ítem / Concepto</th>
                    <th scope="col" class="text-center" style="width: 12%;">Cant. Facturada</th>
                    <th scope="col" class="text-center" style="width: 14%;">Cant. a Devolver *</th>
                    <th scope="col" class="text-end" style="width: 12%;">Precio Unit. ($)</th>
                    <th scope="col" class="text-end" style="width: 10%;">Desc. ($)</th>
                    <th scope="col" class="text-center" style="width: 8%;">Tarifa IVA</th>
                    <th scope="col" class="text-end" style="width: 12%;">Subtotal ($)</th>
                    <th scope="col" class="text-center pe-3" style="width: 5%;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="form.details.length === 0">
                    <td colspan="8" class="text-center py-4 text-muted">
                      No hay ítems en la nota de crédito. Selecciona una factura arriba para cargar su detalle.
                    </td>
                  </tr>

                  <tr v-for="(row, idx) in form.details" :key="idx">
                    <td class="ps-3">
                      <div class="fw-semibold text-white">{{ row.description }}</div>
                      <span class="badge bg-secondary-subtle text-light font-monospace small">
                        {{ row.code || 'SIN_COD' }}
                      </span>
                      <span v-if="row.item_type === 'PRODUCT' || row.item_type === 'ITEM'" class="badge bg-info-subtle text-info small ms-1">
                        Físico
                      </span>
                      <span v-else class="badge bg-dark text-secondary small ms-1">
                        Intangible
                      </span>
                    </td>

                    <td class="text-center text-muted font-monospace">
                      {{ row.original_quantity ?? row.quantity }}
                    </td>

                    <td>
                      <input
                        v-model.number="row.quantity"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        :max="row.original_quantity || 999999"
                        class="form-control form-control-sm bg-dark border-secondary text-white text-center fw-bold"
                        required
                      />
                    </td>

                    <td>
                      <input
                        v-model.number="row.unit_price"
                        type="number"
                        step="0.0001"
                        min="0"
                        class="form-control form-control-sm bg-dark border-secondary text-white text-end"
                        required
                      />
                    </td>

                    <td>
                      <input
                        v-model.number="row.discount"
                        type="number"
                        step="0.01"
                        min="0"
                        class="form-control form-control-sm bg-dark border-secondary text-white text-end"
                      />
                    </td>

                    <td class="text-center">
                      <span class="badge bg-secondary font-monospace">{{ row.tax_rate }}%</span>
                    </td>

                    <td class="text-end font-monospace fw-bold text-white">
                      ${{ formatMoney(calculateRowSubtotal(row)) }}
                    </td>

                    <td class="text-center pe-3">
                      <button
                        type="button"
                        class="btn btn-link text-danger p-0"
                        title="Quitar ítem de la nota de crédito"
                        :disabled="form.details.length === 1"
                        @click="removeRow(idx)"
                      >
                        <iconify-icon icon="solar:trash-bin-minimalistic-bold" class="fs-5"></iconify-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tarjeta 4: Totales y Botón de Emisión -->
        <div class="card bg-dark border-secondary shadow-sm mb-4">
          <div class="card-body p-3 p-md-4">
            <div class="row align-items-center">
              <div class="col-12 col-md-6 mb-3 mb-md-0">
                <div class="form-check form-switch mb-2">
                  <input
                    id="autoSendSriSwitch"
                    v-model="autoSendSri"
                    class="form-check-input"
                    type="checkbox"
                  />
                  <label class="form-check-label text-light fw-semibold small" for="autoSendSriSwitch">
                    Firmar y Enviar al SRI de inmediato tras registrar
                  </label>
                </div>
                <div class="form-text text-muted small">
                  Se generará el archivo XML con la firma digital de la empresa (.p12) y se comunicará con el WebService del SRI.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="p-3 rounded bg-black bg-opacity-25 border border-secondary ms-auto" style="max-width: 360px;">
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal Gravado:</span>
                    <span class="text-white font-monospace">${{ formatMoney(calculatedTotals.subtotalTaxable) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal Tarifa 0%:</span>
                    <span class="text-white font-monospace">${{ formatMoney(calculatedTotals.subtotalZero) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Descuento Total:</span>
                    <span class="text-danger font-monospace">-${{ formatMoney(calculatedTotals.discountTotal) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2 small text-muted">
                    <span>IVA Calculado:</span>
                    <span class="text-white font-monospace">${{ formatMoney(calculatedTotals.taxTotal) }}</span>
                  </div>
                  <hr class="border-secondary my-2" />
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-white">TOTAL ACREDITADO:</span>
                    <span class="h4 fw-bold text-primary mb-0 font-monospace">${{ formatMoney(calculatedTotals.total) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <hr class="border-secondary my-3" />

            <div class="d-flex justify-content-end gap-2">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm rounded-pill px-4"
                @click="switchToList"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                :disabled="isSubmitting || form.details.length === 0"
              >
                <span v-if="isSubmitting" class="spinner-grow spinner-grow-sm" role="status"></span>
                <iconify-icon v-else icon="solar:document-medicine-bold"></iconify-icon>
                Emitir Nota de Crédito
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- VISTA 3: MODAL/PANEL DETALLE DE LA NOTA DE CRÉDITO -->
    <div v-if="selectedDetail" class="card bg-dark border-secondary mt-4 shadow-sm">
      <div class="card-header bg-dark border-secondary py-3 d-flex justify-content-between align-items-center">
        <h5 class="card-title h6 text-white mb-0 d-flex align-items-center gap-2">
          <iconify-icon icon="solar:document-text-bold-duotone" class="text-primary fs-5"></iconify-icon>
          Detalle de Nota de Crédito: <span class="font-monospace text-primary">{{ selectedDetail.credit_note_number }}</span>
        </h5>
        <button type="button" class="btn btn-link text-muted p-0" @click="selectedDetail = null">
          <iconify-icon icon="solar:close-circle-bold" class="fs-4"></iconify-icon>
        </button>
      </div>
      <div class="card-body p-3 p-md-4">
        <div class="row g-3 mb-3">
          <div class="col-12 col-md-3">
            <span class="text-muted small d-block">Factura Modificada:</span>
            <span class="fw-bold text-white font-monospace">{{ selectedDetail.modified_document_number }}</span>
          </div>
          <div class="col-12 col-md-3">
            <span class="text-muted small d-block">Cliente:</span>
            <span class="text-white">{{ selectedDetail.customer_name }} ({{ selectedDetail.customer_id_number }})</span>
          </div>
          <div class="col-12 col-md-3">
            <span class="text-muted small d-block">Clave de Acceso SRI:</span>
            <span class="text-muted font-monospace small text-truncate d-block" :title="selectedDetail.access_key || ''">
              {{ selectedDetail.access_key || 'No generada' }}
            </span>
          </div>
          <div class="col-12 col-md-3">
            <span class="text-muted small d-block">Autorización SRI:</span>
            <span class="badge bg-success-subtle text-success">{{ selectedDetail.sri_status }}</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-dark table-sm table-bordered border-secondary mb-0">
            <thead class="text-muted small">
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th class="text-center">Cantidad</th>
                <th class="text-end">Precio Unit.</th>
                <th class="text-end">Descuento</th>
                <th class="text-center">Tarifa IVA</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in selectedDetail.details" :key="d.id">
                <td class="font-monospace text-muted">{{ d.code || '-' }}</td>
                <td class="text-white">{{ d.description }}</td>
                <td class="text-center font-monospace">{{ d.quantity }}</td>
                <td class="text-end font-monospace">${{ formatMoney(d.unit_price) }}</td>
                <td class="text-end font-monospace">${{ formatMoney(d.discount || 0) }}</td>
                <td class="text-center font-monospace">{{ d.tax_rate }}%</td>
                <td class="text-end font-monospace fw-bold text-white">${{ formatMoney(d.subtotal || 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/axios'
import AppSelect2 from '@/components/common/AppSelect2.vue'
import { toast } from '@/utils/toastr'
import {
  listCreditNotes,
  createCreditNote,
  sendCreditNoteSri,
  downloadCreditNoteXml,
  getNextCreditNoteSequential,
  type CreditNoteItem
} from '@/services/credit-notes.service'
import { getEmissionPoints } from '@/services/emission-points.service'

// Estado de pestañas: 'list' | 'form'
const currentTab = ref<'list' | 'form'>('list')
const isLoading = ref(false)
const isSubmitting = ref(false)
const actionLoadingId = ref<number | null>(null)
const autoSendSri = ref(true)

// Listados
const creditNotes = ref<CreditNoteItem[]>([])
const invoices = ref<any[]>([])
const branches = ref<any[]>([])
const emissionPoints = ref<any[]>([])

// Filtros
const searchQuery = ref('')
const filterBranchId = ref<number | undefined>(undefined)
const selectedDetail = ref<CreditNoteItem | null>(null)

// Selección de Factura y Formulario de Nueva NC
const selectedInvoiceId = ref<number | undefined>(undefined)
const selectedInvoice = ref<any | null>(null)
const quickReasonSelect = ref('')
const previewSequential = ref('000000001')

const form = ref({
  invoiceId: undefined as number | undefined,
  branchId: 1,
  emission_point: '001',
  issue_date: new Date().toISOString().slice(0, 10),
  modified_document_type: '01',
  modified_document_number: '',
  modified_document_date: '',
  reason: '',
  customer_id_type: '05',
  customer_id_number: '',
  customer_name: '',
  customer_address: '',
  customer_email: '',
  customer_phone: '',
  adjust_inventory: true,
  notes: '',
  details: [] as any[]
})

// Opciones de Select2 para facturas
const invoiceSelectOptions = computed(() =>
  invoices.value.map((inv) => ({
    value: inv.id,
    label: `${inv.invoice_number} - ${inv.customer_name} ($${formatMoney(inv.total)})`,
    sublabel: `Fecha: ${inv.issue_date} | Estado: ${inv.status || 'EMITIDA'}`
  }))
)

// Opciones de Select2 para puntos de emisión
const emissionPointOptions = computed(() => {
  const branchPoints = emissionPoints.value.filter(
    (p) => !form.value.branchId || p.branch_id === form.value.branchId
  )
  if (branchPoints.length === 0) {
    return [{ value: '001', label: '001 - Punto Principal' }]
  }
  return branchPoints.map((p) => ({
    value: p.serie,
    label: `${p.serie} - ${p.description}`,
    sublabel: `Sucursal: ${p.branch?.name || form.value.branchId}`
  }))
})

const establishmentCode = computed(() => {
  const branch = branches.value.find((b) => b.id === form.value.branchId)
  return String(branch?.code || '001').padStart(3, '0')
})

// Cálculos de Totales en Tiempo Real
const calculateRowSubtotal = (row: any) => {
  const qty = Number(row.quantity || 0)
  const price = Number(row.unit_price || 0)
  const disc = Number(row.discount || 0)
  return Math.max(0, qty * price - disc)
}

const calculatedTotals = computed(() => {
  let subtotalTaxable = 0
  let subtotalZero = 0
  let discountTotal = 0
  let taxTotal = 0

  for (const d of form.value.details) {
    const rowSubtotal = calculateRowSubtotal(d)
    const rate = Number(d.tax_rate ?? 15)
    const rowTax = Number(((rowSubtotal * rate) / 100).toFixed(2))

    if (rate > 0) {
      subtotalTaxable += rowSubtotal
    } else {
      subtotalZero += rowSubtotal
    }
    discountTotal += Number(d.discount || 0)
    taxTotal += rowTax
  }

  const total = Number((subtotalTaxable + subtotalZero + taxTotal).toFixed(2))

  return {
    subtotalTaxable: Number(subtotalTaxable.toFixed(2)),
    subtotalZero: Number(subtotalZero.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    total
  }
})

// Métricas de tarjetas
const authorizedCount = computed(() => creditNotes.value.filter((c) => c.sri_status === 'AUTHORIZED').length)
const returnsCount = computed(() => creditNotes.value.filter((c) => c.adjust_inventory).length)
const totalCreditedAmount = computed(() =>
  creditNotes.value.reduce((acc, c) => acc + Number(c.total || 0), 0)
)

const filteredCreditNotes = computed(() => {
  return creditNotes.value.filter((cn) => {
    if (filterBranchId.value && cn.branch_id !== filterBranchId.value) return false
    if (!searchQuery.value) return true
    const q = searchQuery.value.toLowerCase()
    return (
      cn.credit_note_number?.toLowerCase().includes(q) ||
      cn.modified_document_number?.toLowerCase().includes(q) ||
      cn.customer_name?.toLowerCase().includes(q) ||
      cn.customer_id_number?.toLowerCase().includes(q) ||
      cn.reason?.toLowerCase().includes(q)
    )
  })
})

// Cargar Datos
const loadData = async () => {
  isLoading.value = true
  try {
    const [cns, invs, brs, points] = await Promise.all([
      listCreditNotes(),
      api.get('/sales/invoices').then((r: any) => r.data).catch(() => []),
      api.get('/branches/company').then((r: any) => r.data).catch(() => []),
      getEmissionPoints().catch(() => [])
    ])
    creditNotes.value = cns || []
    invoices.value = invs || []
    branches.value = brs || []
    emissionPoints.value = points || []

    if (branches.value.length > 0 && !form.value.branchId) {
      form.value.branchId = branches.value[0].id
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error cargando datos de ventas.')
  } finally {
    isLoading.value = false
  }
}

// Navegación entre lista y formulario
const switchToList = () => {
  currentTab.value = 'list'
  selectedDetail.value = null
}

const switchToCreate = () => {
  currentTab.value = 'form'
  selectedDetail.value = null
  fetchNextSequential()
}

// Al seleccionar factura
const onInvoiceSelected = (invId: any) => {
  const inv = invoices.value.find((i) => i.id === Number(invId))
  if (!inv) return

  selectedInvoice.value = inv
  form.value.invoiceId = inv.id
  form.value.modified_document_number = inv.invoice_number
  form.value.modified_document_date = inv.issue_date
  form.value.branchId = inv.branch_id || form.value.branchId
  form.value.customer_id_type = inv.customer_id_type || '05'
  form.value.customer_id_number = inv.customer_id_number || ''
  form.value.customer_name = inv.customer_name || ''
  form.value.customer_address = inv.customer_address || ''
  form.value.customer_email = inv.customer_email || ''
  form.value.customer_phone = inv.customer_phone || ''

  resetOriginalItems()
  fetchNextSequential()
}

const resetOriginalItems = () => {
  if (!selectedInvoice.value?.details) return
  form.value.details = selectedInvoice.value.details.map((d: any) => ({
    item_type: d.item_type || 'PRODUCT',
    item_id: d.item_id,
    warehouse_id: d.warehouse_id,
    code: d.code,
    description: d.description,
    quantity: Number(d.quantity || 1),
    original_quantity: Number(d.quantity || 1),
    unit_price: Number(d.unit_price || 0),
    discount: Number(d.discount || 0),
    tax_rate: Number(d.tax_rate ?? 15)
  }))
}

const onQuickReasonChange = () => {
  if (quickReasonSelect.value) {
    form.value.reason = quickReasonSelect.value
    if (quickReasonSelect.value.includes('Devolución')) {
      form.value.adjust_inventory = true
    }
  }
}

const onBranchChanged = () => {
  const points = emissionPoints.value.filter((p) => p.branch_id === form.value.branchId)
  if (points.length > 0) {
    form.value.emission_point = points[0].serie
  }
  fetchNextSequential()
}

const fetchNextSequential = async () => {
  if (!form.value.branchId || !form.value.emission_point) return
  try {
    const res = await getNextCreditNoteSequential(form.value.branchId, form.value.emission_point)
    if (res?.sequential) {
      previewSequential.value = res.sequential
    }
  } catch (e) {
    // Silencioso
  }
}

const removeRow = (index: number) => {
  if (form.value.details.length <= 1) return
  form.value.details.splice(index, 1)
}

// Registrar Nota de Crédito
const submitCreditNote = async () => {
  if (form.value.details.length === 0) {
    toast.error('Debe incluir al menos un ítem o concepto en la nota de crédito.')
    return
  }
  if (!form.value.reason.trim()) {
    toast.error('El motivo de emisión es obligatorio según el SRI.')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      invoiceId: form.value.invoiceId,
      branchId: form.value.branchId,
      emission_point: form.value.emission_point,
      issue_date: form.value.issue_date,
      modified_document_type: form.value.modified_document_type,
      modified_document_number: form.value.modified_document_number,
      modified_document_date: form.value.modified_document_date,
      reason: form.value.reason.trim(),
      customer_id_type: form.value.customer_id_type,
      customer_id_number: form.value.customer_id_number,
      customer_name: form.value.customer_name,
      customer_address: form.value.customer_address,
      customer_email: form.value.customer_email,
      customer_phone: form.value.customer_phone,
      adjust_inventory: form.value.adjust_inventory,
      notes: form.value.notes,
      details: form.value.details.map((d) => ({
        item_type: d.item_type,
        item_id: d.item_id,
        warehouse_id: d.warehouse_id,
        code: d.code,
        description: d.description,
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
        discount: Number(d.discount || 0),
        tax_rate: Number(d.tax_rate ?? 15)
      }))
    }

    const created = await createCreditNote(payload)
    toast.success(`Nota de Crédito ${created.credit_note_number} generada con éxito.`)

    if (autoSendSri.value && created.id) {
      toast.info('Firmando y enviando nota de crédito al SRI...')
      try {
        const sriRes = await sendCreditNoteSri(created.id)
        if (sriRes.status === 'AUTHORIZED') {
          toast.success('¡Nota de Crédito AUTORIZADA por el SRI!')
        } else if (sriRes.status === 'IN_PROCESS') {
          toast.warning('Nota de crédito recibida por el SRI, en procesamiento.')
        } else {
          toast.error(sriRes.message || 'El SRI devolvió la nota de crédito.')
        }
      } catch (sriErr: any) {
        toast.error(sriErr?.response?.data?.message || 'Error enviando al SRI.')
      }
    }

    await loadData()
    switchToList()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al emitir la nota de crédito.')
  } finally {
    isSubmitting.value = false
  }
}

// Acciones en la tabla
const handleSendSri = async (cn: CreditNoteItem) => {
  actionLoadingId.value = cn.id
  toast.info(`Enviando NC ${cn.credit_note_number} al SRI...`)
  try {
    const res = await sendCreditNoteSri(cn.id)
    if (res.status === 'AUTHORIZED') {
      toast.success(`¡NC ${cn.credit_note_number} AUTORIZADA por el SRI!`)
    } else if (res.status === 'IN_PROCESS') {
      toast.warning(`NC ${cn.credit_note_number} recibida en proceso de autorización.`)
    } else {
      toast.error(res.message || 'Inconsistencias devueltas por el SRI.')
    }
    await loadData()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al comunicarse con el SRI.')
  } finally {
    actionLoadingId.value = null
  }
}

const handleDownloadXml = async (cn: CreditNoteItem) => {
  try {
    await downloadCreditNoteXml(cn.id)
    toast.success(`XML de la NC ${cn.credit_note_number} descargado.`)
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Error descargando el XML.')
  }
}

const openDetail = (cn: CreditNoteItem) => {
  selectedDetail.value = cn
}

// Helpers
const formatMoney = (val: any) => {
  const n = Number(val || 0)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatSriStatus = (status: string) => {
  switch (status) {
    case 'AUTHORIZED': return 'Autorizada SRI'
    case 'IN_PROCESS': return 'En Proceso SRI'
    case 'RETURNED': return 'Devuelta SRI'
    case 'NOT_AUTHORIZED': return 'No Autorizada'
    case 'NOT_SENT': return 'No Enviada'
    default: return status || 'Pendiente'
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.credit-notes-view {
  background-color: var(--bs-body-bg, #111c2d);
  min-height: 100vh;
}

.table th {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.badge-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
