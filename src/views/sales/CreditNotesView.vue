<template>
  <div class="crud-page credit-notes-page">
    
    <!-- ============================================================== -->
    <!-- VISTA 1: LISTADO PRINCIPAL (TABLA, KPIS Y FILTROS)             -->
    <!-- ============================================================== -->
    <template v-if="currentView === 'list'">
      <!-- CABECERA PRINCIPAL -->
      <div class="crud-page-header">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
              MOD-001 VENTAS
            </span>
            <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
              SRI ECUADOR · COMPROBANTE 04
            </span>
          </div>
          <h3 class="crud-title">Notas de Crédito</h3>
          <p class="crud-subtitle">
            Gestión y emisión de Notas de Crédito electrónicas autorizadas por el SRI para devoluciones de mercadería, anulación de facturas y descuentos.
          </p>
        </div>

        <div class="crud-header-actions">
          <button
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
            class="btn btn-primary d-flex align-items-center gap-1 rounded-pill px-3 fw-semibold shadow-sm"
            @click="openCreateForm"
          >
            <iconify-icon icon="solar:add-circle-line-duotone" class="fs-4"></iconify-icon>
            <span>Nueva Nota de Crédito</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES (KPIs) -->
      <div class="crud-kpi-grid">
        <div class="crud-kpi-card">
          <div class="crud-kpi-icon primary">
            <iconify-icon icon="solar:document-medicine-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Total Emitidas</span>
            <h4 class="crud-kpi-val">{{ creditNotesList.length }}</h4>
          </div>
        </div>

        <div class="crud-kpi-card">
          <div class="crud-kpi-icon success">
            <iconify-icon icon="solar:check-circle-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Autorizadas SRI</span>
            <h4 class="crud-kpi-val">{{ authorizedCount }}</h4>
          </div>
        </div>

        <div class="crud-kpi-card">
          <div class="crud-kpi-icon warning">
            <iconify-icon icon="solar:box-minimalistic-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Con Devolución Kardex</span>
            <h4 class="crud-kpi-val">{{ returnsCount }}</h4>
          </div>
        </div>

        <div class="crud-kpi-card">
          <div class="crud-kpi-icon info">
            <iconify-icon icon="solar:dollar-minimalistic-bold-duotone" class="fs-7"></iconify-icon>
          </div>
          <div>
            <span class="crud-kpi-label">Total Acreditado ($)</span>
            <h4 class="crud-kpi-val">${{ formatMoney(totalCreditedAmount) }}</h4>
          </div>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTRO -->
      <div class="crud-filters-card">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-4">
            <label class="form-label">Filtrar por Sucursal</label>
            <AppSelect2
              v-model="filterBranchId"
              :options="branchFilterOptions"
              placeholder="Todas las Sucursales"
              search-placeholder="Buscar sucursal..."
            />
          </div>

          <div class="col-12 col-md-8">
            <label class="form-label">Buscar Nota de Crédito</label>
            <div class="input-group">
              <span class="input-group-text">
                <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
              </span>
              <input
                v-model="searchTerm"
                type="text"
                class="form-control"
                placeholder="Buscar por N° de Nota de Crédito, factura modificada, cliente, RUC o motivo..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE NOTAS DE CRÉDITO -->
      <div class="crud-table-card">
        <div class="table-responsive">
          <table class="crud-table">
            <thead>
              <tr>
                <th scope="col" style="min-width: 170px;">N° Nota de Crédito</th>
                <th scope="col" style="min-width: 170px;">Factura Modificada</th>
                <th scope="col" class="text-center" style="width: 110px;">Fecha</th>
                <th scope="col" style="min-width: 220px;">Cliente</th>
                <th scope="col" style="min-width: 220px;">Motivo SRI</th>
                <th scope="col" class="text-center" style="width: 110px;">Kardex</th>
                <th scope="col" class="text-end" style="width: 130px;">Total ($)</th>
                <th scope="col" class="text-center" style="width: 130px;">Estado SRI</th>
                <th scope="col" class="text-end" style="min-width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="9" class="text-center py-5 text-muted">
                  <div class="spinner-grow spinner-grow-sm text-primary mb-2" role="status"></div>
                  <p class="mb-0 fs-2">Cargando notas de crédito...</p>
                </td>
              </tr>

              <tr v-else-if="filteredCreditNotes.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-8 text-secondary mb-2 d-block"></iconify-icon>
                  <p class="mb-1 fw-semibold text-body-emphasis">No se encontraron notas de crédito registradas</p>
                  <p class="mb-0 fs-2 text-muted">Haz clic en "Nueva Nota de Crédito" para emitir un documento complementario.</p>
                </td>
              </tr>

              <tr v-for="cn in filteredCreditNotes" :key="cn.id">
                <td>
                  <span class="font-monospace fw-bold text-primary">
                    {{ cn.credit_note_number }}
                  </span>
                </td>

                <td>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                    {{ cn.modified_document_number }}
                  </span>
                  <small v-if="cn.modified_document_date" class="d-block text-muted fs-1 mt-1">
                    Emisión: {{ cn.modified_document_date }}
                  </small>
                </td>

                <td class="text-center text-muted font-monospace fs-2">
                  {{ cn.issue_date }}
                </td>

                <td>
                  <span class="fw-semibold d-block text-body-emphasis">{{ cn.customer_name }}</span>
                  <small class="text-muted d-block font-monospace fs-1">{{ cn.customer_id_number }}</small>
                </td>

                <td>
                  <div class="text-truncate text-muted small" style="max-width: 240px;" :title="cn.reason">
                    {{ cn.reason }}
                  </div>
                </td>

                <td class="text-center">
                  <span
                    v-if="cn.adjust_inventory"
                    class="badge bg-success-subtle text-success border border-success-subtle"
                    title="Artículos físicos reingresados al Kardex"
                  >
                    Reingreso
                  </span>
                  <span v-else class="badge bg-secondary-subtle text-muted border border-secondary-subtle">
                    No aplica
                  </span>
                </td>

                <td class="text-end font-monospace fw-bold text-body-emphasis fs-3">
                  ${{ formatMoney(cn.total) }}
                </td>

                <td class="text-center">
                  <span
                    class="badge"
                    :class="{
                      'bg-success-subtle text-success border border-success-subtle': cn.sri_status === 'AUTHORIZED',
                      'bg-warning-subtle text-warning border border-warning-subtle': cn.sri_status === 'IN_PROCESS',
                      'bg-danger-subtle text-danger border border-danger-subtle': cn.sri_status === 'RETURNED' || cn.sri_status === 'NOT_AUTHORIZED',
                      'bg-secondary-subtle text-muted border border-secondary-subtle': cn.sri_status === 'NOT_SENT'
                    }"
                    style="cursor: pointer;"
                    title="Ver resultado de respuesta del SRI"
                    @click="openSriModalForCreditNote(cn)"
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

                <td class="text-end">
                  <div class="d-inline-flex gap-1 align-items-center">
                    <!-- Enviar al SRI -->
                    <button
                      v-if="cn.sri_status !== 'AUTHORIZED'"
                      class="btn btn-sm btn-outline-primary rounded-pill px-2 d-inline-flex align-items-center gap-1"
                      :disabled="actionLoadingId === cn.id"
                      title="Firmar y enviar al SRI"
                      @click="handleSendSri(cn)"
                    >
                      <span v-if="actionLoadingId === cn.id" class="spinner-grow spinner-grow-sm text-primary" role="status" aria-hidden="true"></span>
                      <iconify-icon v-else icon="solar:send-square-line-duotone" class="fs-4"></iconify-icon>
                      <span class="d-none d-md-inline small">SRI</span>
                    </button>

                    <!-- Descargar XML -->
                    <button
                      v-if="cn.sign_status === 'SIGNED' || cn.sri_status === 'AUTHORIZED'"
                      class="btn btn-sm btn-outline-info rounded-pill px-2"
                      title="Descargar XML firmado por SRI"
                      @click="handleDownloadXml(cn)"
                    >
                      <iconify-icon icon="solar:code-file-line-duotone" class="fs-4"></iconify-icon>
                    </button>

                    <!-- Ver Detalle -->
                    <button
                      class="btn btn-sm btn-outline-secondary rounded-pill px-2"
                      title="Ver detalle de la nota de crédito"
                      @click="openDetailView(cn)"
                    >
                      <iconify-icon icon="solar:eye-line-duotone" class="fs-4"></iconify-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ============================================================== -->
    <!-- VISTA 2: FORMULARIO NORMAL EN PÁGINA (EMITIR NOTA DE CRÉDITO)  -->
    <!-- REGLA DEL SISTEMA: FORMULARIO NORMAL EN PÁGINA, NO MODAL       -->
    <!-- ============================================================== -->
    <div v-else-if="currentView === 'form'" class="form-page">
      <div class="form-page-card">
        <!-- CABECERA DEL FORMULARIO CON BOTÓN VOLVER -->
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
                VENTAS · EMISIÓN SRI
              </span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fs-2">
                COMPROBANTE 04 · NOTA DE CRÉDITO
              </span>
            </div>
            <h3 class="crud-title mb-0">Nueva Nota de Crédito Electrónica</h3>
            <p class="crud-subtitle">
              Genera la nota de crédito vinculada a una factura autorizada cumpliendo la ficha técnica SRI v1.1.0.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            @click="backToList"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <!-- CUERPO DEL FORMULARIO -->
        <form @submit.prevent="submitCreditNote">
          <div class="form-page-body">
            
            <!-- SECCIÓN 1: FACTURA SUSTENTO -->
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="text-primary fs-4">•</span>
              <h5 class="text-info fw-bold mb-0">1. Factura Sustento SRI a Modificar</h5>
            </div>

            <div class="row g-4 mb-4">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Buscar Factura Emitida *</label>
                <AppSelect2
                  v-model="selectedInvoiceId"
                  :options="invoiceSelectOptions"
                  placeholder="-- Seleccionar Factura --"
                  search-placeholder="Buscar por N° factura o cliente..."
                  @update:model-value="onInvoiceSelected"
                />
                <small class="text-muted fs-1 d-block mt-1">
                  Selecciona la factura para cargar automáticamente su número, cliente, sucursal e ítems facturados.
                </small>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label fw-semibold">N° Factura Modificada *</label>
                <input
                  v-model="form.modified_document_number"
                  type="text"
                  class="form-control font-monospace text-center fs-3 fw-bold"
                  placeholder="001-001-000000001"
                  required
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label fw-semibold">Fecha Factura Modificada *</label>
                <input
                  v-model="form.modified_document_date"
                  type="date"
                  class="form-control"
                  required
                />
              </div>

              <!-- Tarjeta informativa de cliente autocompletado -->
              <div class="col-12">
                <div class="p-3 rounded-3 bg-body-secondary border border-secondary-subtle">
                  <div class="row g-2 align-items-center">
                    <div class="col-12 col-md-4">
                      <span class="text-muted small d-block">Cliente:</span>
                      <strong class="text-body-emphasis">{{ form.customer_name || 'No seleccionado' }}</strong>
                    </div>
                    <div class="col-6 col-md-3">
                      <span class="text-muted small d-block">Identificación:</span>
                      <span class="font-monospace text-body-emphasis">{{ form.customer_id_number || '-' }}</span>
                    </div>
                    <div class="col-6 col-md-3">
                      <span class="text-muted small d-block">Correo:</span>
                      <span class="text-body-emphasis small">{{ form.customer_email || 'Sin correo registrado' }}</span>
                    </div>
                    <div class="col-12 col-md-2 text-md-end">
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                        Tipo: {{ form.customer_id_type }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: PUNTO DE EMISIÓN Y MOTIVO FISCAL -->
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="text-primary fs-4">•</span>
              <h5 class="text-info fw-bold mb-0">2. Punto de Emisión y Motivo Fiscal</h5>
            </div>

            <div class="row g-4 mb-4">
              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Sucursal Emisora *</label>
                <AppSelect2
                  v-model="form.branchId"
                  :options="branchSelectOptions"
                  placeholder="-- Selecciona la Sucursal --"
                  search-placeholder="Buscar sucursal..."
                  required
                  @update:model-value="onBranchChanged"
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label fw-semibold">Punto de Emisión *</label>
                <AppSelect2
                  v-model="form.emission_point"
                  :options="emissionPointOptions"
                  placeholder="-- Seleccionar Serie --"
                  search-placeholder="Buscar serie..."
                  required
                  @update:model-value="fetchNextSequential"
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label fw-semibold">Secuencial NC (Previsualización)</label>
                <div class="input-group">
                  <span class="input-group-text font-monospace">{{ establishmentCode }}-{{ form.emission_point }}-</span>
                  <input
                    v-model="previewSequential"
                    type="text"
                    class="form-control font-monospace text-center fw-bold text-info"
                    readonly
                  />
                </div>
              </div>

              <div class="col-12 col-md-2">
                <label class="form-label fw-semibold">Fecha Emisión NC *</label>
                <input
                  v-model="form.issue_date"
                  type="date"
                  class="form-control"
                  required
                />
              </div>

              <!-- Motivo SRI -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Motivo Estándar SRI *</label>
                <select
                  v-model="quickReasonSelect"
                  class="form-select mb-2"
                  @change="onQuickReasonChange"
                >
                  <option value="">-- Seleccionar motivo predefinido --</option>
                  <option value="Devolución de mercadería">Devolución de mercadería (Reingresa al Kardex)</option>
                  <option value="Anulación de factura por error en digitación o datos del cliente">Anulación de factura por error en digitación o datos</option>
                  <option value="Descuento o rebaja comercial posterior a la emisión">Descuento o rebaja comercial posterior</option>
                  <option value="Ajuste de precio o tarifa pactada">Ajuste de precio o tarifa pactada</option>
                  <option value="Rescisión o terminación de contrato de servicios">Rescisión o terminación de contrato de servicios</option>
                </select>

                <textarea
                  v-model="form.reason"
                  class="form-control"
                  rows="2"
                  maxlength="300"
                  placeholder="Describe el motivo formal obligatorio exigido por el SRI (máx. 300 caracteres)..."
                  required
                ></textarea>
                <small class="text-muted fs-1 d-block text-end mt-1">{{ form.reason.length }}/300 caracteres</small>
              </div>

              <!-- Control Kardex / Inventario -->
              <div class="col-12 col-md-6 d-flex align-items-center">
                <div class="p-3 rounded-3 bg-body-secondary border border-secondary-subtle w-100">
                  <div class="form-check form-switch mb-2">
                    <input
                      id="adjustInventorySwitch"
                      v-model="form.adjust_inventory"
                      class="form-check-input"
                      type="checkbox"
                    />
                    <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="adjustInventorySwitch">
                      Reingresar artículos físicos devueltos al inventario (Kardex)
                    </label>
                  </div>
                  <p class="text-muted fs-1 mb-0">
                    Al activar esta casilla, los artículos físicos devueltos generarán un movimiento de entrada en la bodega asignada con motivo <code>CUSTOMER_RETURN</code>.
                  </p>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: DETALLE DE ÍTEMS A ACREDITAR -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex align-items-center gap-2">
                <span class="text-primary fs-4">•</span>
                <h5 class="text-info fw-bold mb-0">3. Detalle de Ítems / Conceptos a Acreditar</h5>
              </div>

              <button
                v-if="selectedInvoice"
                type="button"
                class="btn btn-outline-info btn-sm rounded-pill d-inline-flex align-items-center gap-1"
                @click="resetOriginalItems"
              >
                <iconify-icon icon="solar:refresh-line-duotone" class="fs-4"></iconify-icon>
                <span>Restaurar ítems completos</span>
              </button>
            </div>

            <div class="crud-table-card mb-4">
              <div class="table-responsive">
                <table class="crud-table">
                  <thead>
                    <tr>
                      <th scope="col" style="min-width: 250px;">Ítem / Concepto</th>
                      <th scope="col" class="text-center" style="width: 120px;">Cant. Facturada</th>
                      <th scope="col" class="text-center" style="width: 140px;">Cant. a Devolver *</th>
                      <th scope="col" class="text-end" style="width: 120px;">Precio Unit. ($)</th>
                      <th scope="col" class="text-end" style="width: 110px;">Desc. ($)</th>
                      <th scope="col" class="text-center" style="width: 100px;">IVA</th>
                      <th scope="col" class="text-end" style="width: 130px;">Subtotal ($)</th>
                      <th scope="col" class="text-end" style="width: 60px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.details.length === 0">
                      <td colspan="8" class="text-center py-4 text-muted">
                        No hay ítems en la nota de crédito. Selecciona una factura arriba para cargar su detalle.
                      </td>
                    </tr>

                    <tr v-for="(row, idx) in form.details" :key="idx">
                      <td>
                        <span class="fw-semibold d-block text-body-emphasis">{{ row.description }}</span>
                        <div class="d-flex align-items-center gap-1 mt-1">
                          <span class="badge bg-secondary-subtle text-muted font-monospace fs-1">
                            {{ row.code || 'SIN_COD' }}
                          </span>
                          <span v-if="row.item_type === 'PRODUCT' || row.item_type === 'ITEM'" class="badge bg-info-subtle text-info fs-1">
                            Físico
                          </span>
                          <span v-else class="badge bg-secondary-subtle text-secondary fs-1">
                            Intangible
                          </span>
                        </div>
                      </td>

                      <td class="text-center font-monospace text-muted">
                        {{ row.original_quantity ?? row.quantity }}
                      </td>

                      <td class="text-center">
                        <input
                          v-model.number="row.quantity"
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          :max="row.original_quantity || 999999"
                          class="form-control form-control-sm font-monospace text-center fw-bold mx-auto"
                          style="max-width: 110px;"
                          required
                        />
                      </td>

                      <td class="text-end">
                        <input
                          v-model.number="row.unit_price"
                          type="number"
                          step="0.0001"
                          min="0"
                          class="form-control form-control-sm font-monospace text-end mx-auto"
                          style="max-width: 100px;"
                          required
                        />
                      </td>

                      <td class="text-end">
                        <input
                          v-model.number="row.discount"
                          type="number"
                          step="0.01"
                          min="0"
                          class="form-control form-control-sm font-monospace text-end mx-auto"
                          style="max-width: 90px;"
                        />
                      </td>

                      <td class="text-center">
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                          {{ row.tax_rate }}%
                        </span>
                      </td>

                      <td class="text-end font-monospace fw-bold text-body-emphasis fs-3">
                        ${{ formatMoney(calculateRowSubtotal(row)) }}
                      </td>

                      <td class="text-end">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger rounded-pill px-2"
                          title="Quitar ítem de la nota de crédito"
                          :disabled="form.details.length === 1"
                          @click="removeRow(idx)"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-line-duotone" class="fs-4"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- SECCIÓN 4: TOTALES Y EMISIÓN -->
            <div class="row align-items-center g-3">
              <div class="col-12 col-md-6">
                <div class="p-3 rounded-3 bg-body-secondary border border-secondary-subtle">
                  <div class="form-check form-switch mb-2">
                    <input
                      id="autoSendSriSwitch"
                      v-model="autoSendSri"
                      class="form-check-input"
                      type="checkbox"
                    />
                    <label class="form-check-label text-body-emphasis fw-semibold small ms-2" for="autoSendSriSwitch">
                      Firmar y Enviar al SRI de inmediato tras registrar
                    </label>
                  </div>
                  <p class="text-muted fs-1 mb-0">
                    Se construirá el XML canónico v1.1.0, se firmará con el certificado digital de la empresa (.p12) y se enviará al WebService del SRI.
                  </p>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="p-3 rounded-3 bg-body-secondary border border-secondary-subtle ms-auto" style="max-width: 380px;">
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal Gravado (15%):</span>
                    <span class="text-body-emphasis font-monospace">${{ formatMoney(calculatedTotals.subtotalTaxable) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal Tarifa 0%:</span>
                    <span class="text-body-emphasis font-monospace">${{ formatMoney(calculatedTotals.subtotalZero) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Descuento Total:</span>
                    <span class="text-danger font-monospace">-${{ formatMoney(calculatedTotals.discountTotal) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2 small text-muted">
                    <span>IVA Calculado:</span>
                    <span class="text-body-emphasis font-monospace">${{ formatMoney(calculatedTotals.taxTotal) }}</span>
                  </div>
                  <hr class="border-secondary-subtle my-2" />
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-body-emphasis">TOTAL ACREDITADO:</span>
                    <span class="h4 fw-bold text-primary mb-0 font-monospace">${{ formatMoney(calculatedTotals.total) }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- PIE DE ACCIONES DEL FORMULARIO -->
          <div class="form-page-footer">
            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              @click="backToList"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
              :disabled="saving || form.details.length === 0"
            >
              <span v-if="saving" class="spinner-grow spinner-grow-sm text-white" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:check-circle-line-duotone" class="fs-4"></iconify-icon>
              <span>Emitir Nota de Crédito</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- VISTA 3: CONSULTA DETALLE DE NOTA DE CRÉDITO (NO MODAL)       -->
    <!-- ============================================================== -->
    <div v-else-if="currentView === 'detail' && selectedDetail" class="form-page">
      <div class="form-page-card">
        <div class="form-page-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2">
                NOTA DE CRÉDITO SRI
              </span>
              <span
                class="badge"
                :class="selectedDetail.sri_status === 'AUTHORIZED' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'"
              >
                {{ formatSriStatus(selectedDetail.sri_status) }}
              </span>
            </div>
            <h3 class="crud-title mb-0 font-monospace text-primary">
              {{ selectedDetail.credit_note_number }}
            </h3>
            <p class="crud-subtitle">
              Documento sustento modificado: {{ selectedDetail.modified_document_number }} (Emitido el {{ selectedDetail.issue_date }})
            </p>
          </div>

          <button
            type="button"
            class="btn btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
            @click="backToList"
          >
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
            <span>Volver al Listado</span>
          </button>
        </div>

        <div class="form-page-body">
          <div class="row g-3 mb-4">
            <div class="col-12 col-md-3">
              <span class="text-muted small d-block">Cliente:</span>
              <strong class="text-body-emphasis">{{ selectedDetail.customer_name }}</strong>
              <small class="d-block text-muted font-monospace">{{ selectedDetail.customer_id_number }}</small>
            </div>

            <div class="col-12 col-md-3">
              <span class="text-muted small d-block">Factura Modificada:</span>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                {{ selectedDetail.modified_document_number }}
              </span>
            </div>

            <div class="col-12 col-md-3">
              <span class="text-muted small d-block">Motivo SRI:</span>
              <span class="text-body-emphasis small">{{ selectedDetail.reason }}</span>
            </div>

            <div class="col-12 col-md-3">
              <span class="text-muted small d-block">Total Acreditado:</span>
              <h4 class="text-primary font-monospace fw-bold mb-0">${{ formatMoney(selectedDetail.total) }}</h4>
            </div>

            <div class="col-12">
              <span class="text-muted small d-block">Clave de Acceso SRI (49 dígitos):</span>
              <span class="font-monospace text-body-emphasis small bg-body-secondary p-2 rounded d-block border border-secondary-subtle">
                {{ selectedDetail.access_key || 'No generada' }}
              </span>
            </div>
          </div>

          <!-- Tabla de ítems en el detalle -->
          <div class="crud-table-card">
            <div class="table-responsive">
              <table class="crud-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-end">Precio Unit. ($)</th>
                    <th class="text-end">Descuento ($)</th>
                    <th class="text-center">Tarifa IVA</th>
                    <th class="text-end">Subtotal ($)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in selectedDetail.details" :key="d.id">
                    <td class="font-monospace text-muted">{{ d.code || '-' }}</td>
                    <td class="text-body-emphasis fw-semibold">{{ d.description }}</td>
                    <td class="text-center font-monospace">{{ d.quantity }}</td>
                    <td class="text-end font-monospace">${{ formatMoney(d.unit_price) }}</td>
                    <td class="text-end font-monospace">${{ formatMoney(d.discount || 0) }}</td>
                    <td class="text-center font-monospace">{{ d.tax_rate }}%</td>
                    <td class="text-end font-monospace fw-bold text-body-emphasis">${{ formatMoney(d.subtotal || 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary-subtle">
            <div class="d-flex gap-2">
              <button
                v-if="selectedDetail.sign_status === 'SIGNED' || selectedDetail.sri_status === 'AUTHORIZED'"
                type="button"
                class="btn btn-outline-info rounded-pill px-3 d-inline-flex align-items-center gap-1"
                @click="handleDownloadXml(selectedDetail)"
              >
                <iconify-icon icon="solar:code-file-line-duotone" class="fs-4"></iconify-icon>
                <span>Descargar XML Firmado</span>
              </button>

              <button
                v-if="selectedDetail.sri_status !== 'AUTHORIZED'"
                type="button"
                class="btn btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                :disabled="actionLoadingId === selectedDetail.id"
                @click="handleSendSri(selectedDetail)"
              >
                <span v-if="actionLoadingId === selectedDetail.id" class="spinner-grow spinner-grow-sm text-primary" role="status" aria-hidden="true"></span>
                <iconify-icon v-else icon="solar:send-square-line-duotone" class="fs-4"></iconify-icon>
                <span>Enviar al SRI</span>
              </button>
            </div>

            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              @click="backToList"
            >
              Volver al Listado
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE RESPUESTA DEL SRI -->
    <SriResponseModal
      v-model="showSriModal"
      :document-type="sriModalData.documentType"
      :document-number="sriModalData.documentNumber"
      :access-key="sriModalData.accessKey"
      :result="sriModalData.result"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/axios'
import AppSelect2 from '@/components/common/AppSelect2.vue'
import { toast } from '@/utils/toastr'
import { useAuthStore } from '@/stores/auth.store'
import {
  listCreditNotes,
  createCreditNote,
  sendCreditNoteSri,
  downloadCreditNoteXml,
  getNextCreditNoteSequential,
  type CreditNoteItem
} from '@/services/credit-notes.service'
import { getEmissionPoints, type EmissionPointItem } from '@/services/emission-points.service'
import { getBranches, type BranchItem } from '@/services/config.service'
import SriResponseModal from '@/components/common/SriResponseModal.vue'

const authStore = useAuthStore()

const getActiveCompanyId = (): number => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) {
      const parsed = JSON.parse(raw)
      const id = Number(parsed?.companyId || parsed?.company?.id || parsed?.id)
      if (!Number.isNaN(id) && id > 0) return id
    }
  } catch {}
  return Number(authStore.accessInfo?.companyId || authStore.tokenPayload?.company_id || 1)
}

// Estados de vista: 'list' | 'form' | 'detail'
const currentView = ref<'list' | 'form' | 'detail'>('list')
const loading = ref(false)
const saving = ref(false)
const actionLoadingId = ref<number | null>(null)
const autoSendSri = ref(true)

// Modal de Respuesta SRI
const showSriModal = ref(false)
const sriModalData = ref<{
  documentType: string
  documentNumber: string
  accessKey: string
  result: any
}>({
  documentType: 'Nota de Crédito',
  documentNumber: '',
  accessKey: '',
  result: null,
})

const openSriModalForCreditNote = (cn: CreditNoteItem, customResult?: any) => {
  sriModalData.value = {
    documentType: 'Nota de Crédito',
    documentNumber: cn.credit_note_number,
    accessKey: cn.access_key || '',
    result: customResult || {
      status: cn.sri_status,
      sri_status: cn.sri_status,
      authorizationNumber: cn.sri_authorization_number,
      sri_authorization_number: cn.sri_authorization_number,
      authorizationDate: cn.sri_authorization_date,
      sri_authorization_date: cn.sri_authorization_date,
      sri_messages: cn.sri_messages,
      sriMessages: cn.sri_messages,
    },
  }
  showSriModal.value = true
}

// Listados
const creditNotesList = ref<CreditNoteItem[]>([])
const invoicesList = ref<any[]>([])
const branchesList = ref<BranchItem[]>([])
const emissionPointsList = ref<EmissionPointItem[]>([])

// Filtros
const searchTerm = ref('')
const filterBranchId = ref<string>('TODAS')
const selectedDetail = ref<CreditNoteItem | null>(null)

// Selección de Factura y Formulario de Nueva NC
const selectedInvoiceId = ref<number | undefined>(undefined)
const selectedInvoice = ref<any | null>(null)
const quickReasonSelect = ref('')
const previewSequential = ref('000000001')

const form = ref({
  invoiceId: undefined as number | undefined,
  branchId: null as number | null,
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

// Opciones de Select2 para sucursales
const branchFilterOptions = computed(() => [
  { value: 'TODAS', label: '-- Todas las Sucursales --' },
  ...branchesList.value.map((b) => ({
    value: String(b.id),
    label: `${b.code} - ${b.name}${b.isMatrix ? ' (Matriz)' : ''}`,
  })),
])

const branchSelectOptions = computed(() =>
  branchesList.value.filter((b) => b.enabled !== false).map((b) => ({
    value: b.id,
    label: `${b.code} - ${b.name}${b.isMatrix ? ' (Matriz)' : ''}`,
    sublabel: b.address || '',
  }))
)

// Opciones de Select2 para facturas emitidas
const invoiceSelectOptions = computed(() =>
  invoicesList.value.map((inv) => ({
    value: inv.id,
    label: `${inv.invoice_number} - ${inv.customer_name} ($${formatMoney(inv.total)})`,
    sublabel: `Fecha: ${inv.issue_date} | Estado: ${inv.status || 'EMITIDA'}`
  }))
)

// Opciones de Select2 para puntos de emisión
const emissionPointOptions = computed(() => {
  const branchPoints = emissionPointsList.value.filter(
    (p: any) => !form.value.branchId || p.branch_id === form.value.branchId || p.branch?.id === form.value.branchId
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
  const branch = branchesList.value.find((b) => b.id === form.value.branchId)
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

// Métricas de tarjetas KPI
const authorizedCount = computed(() => creditNotesList.value.filter((c) => c.sri_status === 'AUTHORIZED').length)
const returnsCount = computed(() => creditNotesList.value.filter((c) => c.adjust_inventory).length)
const totalCreditedAmount = computed(() =>
  creditNotesList.value.reduce((acc, c) => acc + Number(c.total || 0), 0)
)

const filteredCreditNotes = computed(() => {
  return creditNotesList.value.filter((cn) => {
    if (filterBranchId.value !== 'TODAS') {
      const bId = Number(filterBranchId.value)
      if (cn.branch_id !== bId) return false
    }
    if (!searchTerm.value.trim()) return true
    const q = searchTerm.value.trim().toLowerCase()
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
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const [cns, invs, brs, points] = await Promise.all([
      listCreditNotes(),
      api.get('/sales/invoices').then((r: any) => r.data).catch(() => []),
      getBranches(companyId).catch(() => ({ data: [] })),
      getEmissionPoints(companyId).catch(() => [])
    ])
    creditNotesList.value = Array.isArray(cns) ? cns : []
    invoicesList.value = Array.isArray(invs) ? invs : []
    const branchesData = (brs as any)?.data || brs || []
    branchesList.value = Array.isArray(branchesData) ? branchesData : []
    emissionPointsList.value = Array.isArray(points) ? points : []

    if (branchesList.value.length > 0 && !form.value.branchId) {
      form.value.branchId = branchesList.value[0]?.id || null
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error cargando datos de ventas.')
  } finally {
    loading.value = false
  }
}

// Navegación entre vistas
const backToList = () => {
  currentView.value = 'list'
  selectedDetail.value = null
}

const openCreateForm = () => {
  currentView.value = 'form'
  selectedDetail.value = null
  selectedInvoiceId.value = undefined
  selectedInvoice.value = null
  quickReasonSelect.value = ''
  const defaultBranch = branchesList.value.find((b) => b.enabled !== false) || branchesList.value[0]
  form.value = {
    invoiceId: undefined,
    branchId: defaultBranch?.id || null,
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
    details: []
  }
  fetchNextSequential()
}

const openDetailView = (cn: CreditNoteItem) => {
  selectedDetail.value = cn
  currentView.value = 'detail'
}

// Al seleccionar factura
const onInvoiceSelected = (invId: any) => {
  const inv = invoicesList.value.find((i) => i.id === Number(invId))
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
  const points = emissionPointsList.value.filter((p: any) => p.branch_id === form.value.branchId || p.branch?.id === form.value.branchId)
  if (points.length > 0 && points[0]?.serie) {
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
  if (!form.value.branchId) {
    toast.error('Selecciona una sucursal emisora.')
    return
  }

  saving.value = true
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
    await loadData()
    backToList()

    if ((created as any)?.sri_result) {
      openSriModalForCreditNote(created, (created as any).sri_result)
    } else {
      toast.success(`Nota de Crédito ${created.credit_note_number} generada con éxito.`, 'Emisión SRI')
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al emitir la nota de crédito.')
  } finally {
    saving.value = false
  }
}

// Acciones en la tabla y detalle
const handleSendSri = async (cn: CreditNoteItem) => {
  actionLoadingId.value = cn.id
  toast.info(`Enviando NC ${cn.credit_note_number} al SRI...`, 'SRI Ecuador')
  try {
    const res = await sendCreditNoteSri(cn.id)
    if (res.status === 'AUTHORIZED') {
      toast.success(`¡NC ${cn.credit_note_number} AUTORIZADA por el SRI!`, 'SRI Ecuador')
    } else if (res.status === 'IN_PROCESS') {
      toast.warning(`NC ${cn.credit_note_number} recibida en proceso de autorización.`, 'SRI Ecuador')
    } else {
      toast.error(res.message || 'Inconsistencias devueltas por el SRI.', 'SRI Ecuador')
    }
    await loadData()
    openSriModalForCreditNote(cn, res)
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al comunicarse con el SRI.')
  } finally {
    actionLoadingId.value = null
  }
}

const handleDownloadXml = async (cn: CreditNoteItem) => {
  try {
    await downloadCreditNoteXml(cn.id)
    toast.success(`XML de la NC ${cn.credit_note_number} descargado.`, 'Descarga')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Error descargando el XML.')
  }
}

// Helpers
const formatMoney = (val: any) => {
  const n = Number(val || 0)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatSriStatus = (status: string) => {
  switch (status) {
    case 'AUTHORIZED': return 'Autorizada SRI'
    case 'IN_PROCESS': return 'En Proceso'
    case 'RETURNED': return 'Devuelta'
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
/* Estilos adicionales específicos del módulo de Notas de Crédito */
.credit-notes-page {
  animation: crudFadeIn 0.2s ease-in-out;
}
</style>
