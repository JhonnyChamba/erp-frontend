<template>
  <div class="inventory-page" :class="{ 'form-open': isFormOpen }">
    <!-- Top Header -->
    <div class="page-header">
      <div>
        <div class="header-badge-row">
          <span class="mod-code-badge">MOD-003</span>
          <span class="mod-sub-badge">{{ activeTabBadge.code }}</span>
        </div>
        <h2 class="page-title">Módulo de Inventario y Catálogo</h2>
        <p class="page-subtitle">
          Gestión independiente de artículos físicos, servicios propios y servicios de subcontratación / mano de obra
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="loadAllInventory" :disabled="loading">
          <iconify-icon icon="solar:refresh-line-duotone" width="18" :class="{ 'spin-anim': loading }"></iconify-icon>
          <span>Actualizar</span>
        </button>
        <button class="btn-primary" @click="openCreateModal">
          <iconify-icon icon="solar:add-circle-line-duotone" width="18"></iconify-icon>
          <span>{{ createButtonLabel }}</span>
        </button>
      </div>
    </div>

    <!-- Main 3-Tab Switcher -->
    <div class="tabs-bar">
      <div class="tabs-pills">
        <button
          class="tab-pill"
          :class="{ active: activeTab === 'articulos' }"
          @click="switchTab('articulos')"
        >
          <iconify-icon icon="solar:box-line-duotone" width="18"></iconify-icon>
          <span>Ítems / Artículos</span>
          <span class="pill-count">{{ itemsList.length }}</span>
        </button>

        <button
          class="tab-pill"
          :class="{ active: activeTab === 'servicios' }"
          @click="switchTab('servicios')"
        >
          <iconify-icon icon="solar:settings-minimalistic-line-duotone" width="18"></iconify-icon>
          <span>Servicios</span>
          <span class="pill-count">{{ servicesList.length }}</span>
        </button>

        <button
          class="tab-pill"
          :class="{ active: activeTab === 'subcontratacion' }"
          @click="switchTab('subcontratacion')"
        >
          <iconify-icon icon="solar:users-group-rounded-line-duotone" width="18"></iconify-icon>
          <span>Subcontratación / Mano de Obra</span>
          <span class="pill-count">{{ subcontractsList.length }}</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="filters-row">
        <div class="search-box">
          <iconify-icon icon="solar:magnifer-line-duotone" width="17" class="search-ic"></iconify-icon>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
          />
        </div>

        <select v-model="statusFilter" class="filter-select">
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Solo Activos</option>
          <option value="INACTIVE">Inactivos</option>
          <option v-if="activeTab === 'articulos'" value="LOW_STOCK">Stock Bajo</option>
        </select>
      </div>
    </div>

    <!-- KPI Cards per Active Section -->
    <div class="kpi-grid" v-if="activeTab === 'articulos'">
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <iconify-icon icon="solar:box-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Total Artículos</span>
          <h4 class="kpi-val">{{ itemsList.length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <iconify-icon icon="solar:wallet-money-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Valorizado en Bodega (Costo)</span>
          <h4 class="kpi-val">${{ formatNumber(totalInventoryCostValue) }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple">
          <iconify-icon icon="solar:tag-price-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Valor Potencial de Venta</span>
          <h4 class="kpi-val">${{ formatNumber(totalInventorySaleValue) }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber">
          <iconify-icon icon="solar:danger-triangle-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Alertas Stock Mínimo</span>
          <h4 class="kpi-val">{{ lowStockCount }}</h4>
        </div>
      </div>
    </div>

    <div class="kpi-grid" v-else-if="activeTab === 'servicios'">
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <iconify-icon icon="solar:settings-minimalistic-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Total Servicios Propios</span>
          <h4 class="kpi-val">{{ servicesList.length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <iconify-icon icon="solar:check-circle-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Servicios Activos</span>
          <h4 class="kpi-val">{{ servicesList.filter(s => s.status).length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple">
          <iconify-icon icon="solar:dollar-minimalistic-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Tarifa Promedio Venta</span>
          <h4 class="kpi-val">${{ formatNumber(averageServicePrice) }}</h4>
        </div>
      </div>
    </div>

    <div class="kpi-grid" v-else>
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <iconify-icon icon="solar:users-group-rounded-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Rubros Mano de Obra / Subcontratos</span>
          <h4 class="kpi-val">{{ subcontractsList.length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <iconify-icon icon="solar:shield-user-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Con Materiales Incluidos</span>
          <h4 class="kpi-val">{{ subcontractsList.filter(s => s.includesMaterials).length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber">
          <iconify-icon icon="solar:calculator-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Costo Promedio Rubro</span>
          <h4 class="kpi-val">${{ formatNumber(averageSubcontractCost) }}</h4>
        </div>
      </div>
    </div>

    <!-- Status Banner -->
    <div v-if="feedbackBanner.text" class="feedback-banner keep-in-form" :class="feedbackBanner.type">
      <iconify-icon
        :icon="feedbackBanner.type === 'success' ? 'solar:check-circle-bold' : 'solar:danger-circle-bold'"
        width="18"
      ></iconify-icon>
      <span>{{ feedbackBanner.text }}</span>
    </div>

    <!-- ========================================================== -->
    <!-- TAB 1: TABLA DE ÍTEMS / ARTÍCULOS                          -->
    <!-- ========================================================== -->
    <div v-if="activeTab === 'articulos'" class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Código / SKU</th>
              <th>Artículo / Ítem</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th class="text-right">Costo</th>
              <th class="text-right">Precio Venta</th>
              <th class="text-center">IVA</th>
              <th class="text-center">Stock</th>
              <th>Ubicación</th>
              <th class="text-center">Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="empty-cell">Cargando artículos del inventario...</td>
            </tr>
            <tr v-else-if="filteredItems.length === 0">
              <td colspan="11" class="empty-cell">
                No se encontraron artículos registrados. Haz clic en <strong>+ Nuevo Artículo</strong> para crear el primero.
              </td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>
                <div class="code-stack">
                  <span class="code-chip">{{ item.code }}</span>
                  <span v-if="item.sku" class="sku-sub">SKU: {{ item.sku }}</span>
                </div>
              </td>
              <td>
                <div class="item-main">
                  <span class="item-title">{{ item.name }}</span>
                  <span v-if="item.description" class="item-desc">{{ item.description }}</span>
                </div>
              </td>
              <td>
                <span class="cat-badge">{{ item.category || 'General' }}</span>
              </td>
              <td>{{ item.unit || 'UND' }}</td>
              <td class="text-right font-mono">${{ formatNumber(item.costPrice) }}</td>
              <td class="text-right font-mono price-highlight">${{ formatNumber(item.salePrice) }}</td>
              <td class="text-center">
                <span class="tax-pill">{{ Number(item.taxRate || 0) }}%</span>
              </td>
              <td class="text-center">
                <span
                  class="stock-badge"
                  :class="Number(item.stockCurrent) <= Number(item.stockMin) ? 'low' : 'ok'"
                >
                  {{ formatNumber(item.stockCurrent) }}
                  <small>/ mín {{ formatNumber(item.stockMin) }}</small>
                </span>
              </td>
              <td>{{ item.location || 'Bodega Principal' }}</td>
              <td class="text-center">
                <button
                  class="status-pill"
                  :class="item.status ? 'active' : 'inactive'"
                  @click="toggleItemStatus(item)"
                  title="Cambiar estado"
                >
                  {{ item.status ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="act-btn edit" @click="openEditItem(item)" title="Editar artículo">
                    <iconify-icon icon="solar:pen-new-square-line-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn delete" @click="confirmDelete('articulos', item)" title="Eliminar artículo">
                    <iconify-icon icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- TAB 2: TABLA DE SERVICIOS                                  -->
    <!-- ========================================================== -->
    <div v-if="activeTab === 'servicios'" class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Servicio</th>
              <th>Categoría</th>
              <th>Unidad de Cobro</th>
              <th>Duración Est.</th>
              <th class="text-right">Costo Base</th>
              <th class="text-right">Tarifa Venta</th>
              <th class="text-center">IVA</th>
              <th class="text-center">Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="empty-cell">Cargando catálogo de servicios...</td>
            </tr>
            <tr v-else-if="filteredServices.length === 0">
              <td colspan="10" class="empty-cell">
                No se encontraron servicios registrados. Haz clic en <strong>+ Nuevo Servicio</strong> para crear el primero.
              </td>
            </tr>
            <tr v-for="srv in filteredServices" :key="srv.id">
              <td>
                <span class="code-chip srv">{{ srv.code }}</span>
              </td>
              <td>
                <div class="item-main">
                  <span class="item-title">{{ srv.name }}</span>
                  <span v-if="srv.description" class="item-desc">{{ srv.description }}</span>
                </div>
              </td>
              <td>
                <span class="cat-badge">{{ srv.category || 'Servicios' }}</span>
              </td>
              <td>{{ srv.unit || 'SERV' }}</td>
              <td>{{ srv.estimatedDuration || 'Según alcance' }}</td>
              <td class="text-right font-mono">${{ formatNumber(srv.costPrice) }}</td>
              <td class="text-right font-mono price-highlight">${{ formatNumber(srv.salePrice) }}</td>
              <td class="text-center">
                <span class="tax-pill">{{ Number(srv.taxRate || 0) }}%</span>
              </td>
              <td class="text-center">
                <button
                  class="status-pill"
                  :class="srv.status ? 'active' : 'inactive'"
                  @click="toggleServiceStatus(srv)"
                >
                  {{ srv.status ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="act-btn edit" @click="openEditService(srv)" title="Editar servicio">
                    <iconify-icon icon="solar:pen-new-square-line-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn delete" @click="confirmDelete('servicios', srv)" title="Eliminar servicio">
                    <iconify-icon icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- TAB 3: TABLA DE SUBCONTRATACIÓN / MANO DE OBRA             -->
    <!-- ========================================================== -->
    <div v-if="activeTab === 'subcontratacion'" class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Rubro / Mano de Obra</th>
              <th>Especialidad</th>
              <th>Contratista / Proveedor</th>
              <th>Unidad</th>
              <th class="text-right">Costo Unit.</th>
              <th class="text-right">Precio Sugerido</th>
              <th class="text-center">Materiales</th>
              <th class="text-center">IVA</th>
              <th class="text-center">Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="empty-cell">Cargando servicios de subcontratación y mano de obra...</td>
            </tr>
            <tr v-else-if="filteredSubcontracts.length === 0">
              <td colspan="11" class="empty-cell">
                No se encontraron rubros de subcontratación o mano de obra. Haz clic en <strong>+ Nueva Mano de Obra / Subcontrato</strong>.
              </td>
            </tr>
            <tr v-for="sub in filteredSubcontracts" :key="sub.id">
              <td>
                <span class="code-chip mo">{{ sub.code }}</span>
              </td>
              <td>
                <div class="item-main">
                  <span class="item-title">{{ sub.name }}</span>
                  <span v-if="sub.description" class="item-desc">{{ sub.description }}</span>
                </div>
              </td>
              <td>
                <span class="cat-badge">{{ sub.specialty || 'General' }}</span>
              </td>
              <td>
                <div class="item-main">
                  <span class="item-title">{{ sub.contractorName || 'Por asignar' }}</span>
                  <span v-if="sub.contractorTaxId" class="sku-sub">RUC/CI: {{ sub.contractorTaxId }}</span>
                </div>
              </td>
              <td>{{ sub.unit || 'HORA' }}</td>
              <td class="text-right font-mono">${{ formatNumber(sub.unitCost) }}</td>
              <td class="text-right font-mono price-highlight">${{ formatNumber(sub.suggestedPrice) }}</td>
              <td class="text-center">
                <span class="mat-badge" :class="sub.includesMaterials ? 'yes' : 'no'">
                  {{ sub.includesMaterials ? 'Incluye Mat.' : 'Solo Mano Obra' }}
                </span>
              </td>
              <td class="text-center">
                <span class="tax-pill">{{ Number(sub.taxRate || 0) }}%</span>
              </td>
              <td class="text-center">
                <button
                  class="status-pill"
                  :class="sub.status ? 'active' : 'inactive'"
                  @click="toggleSubcontractStatus(sub)"
                >
                  {{ sub.status ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="act-btn edit" @click="openEditSubcontract(sub)" title="Editar rubro">
                    <iconify-icon icon="solar:pen-new-square-line-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn delete" @click="confirmDelete('subcontratacion', sub)" title="Eliminar rubro">
                    <iconify-icon icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 1: CREAR / EDITAR ÍTEM / ARTÍCULO                    -->
    <!-- ========================================================== -->
    <div v-if="showItemModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge">ARTÍCULOS FÍSICOS</span>
            <h3>{{ editingItemId ? `Editar Artículo (${itemForm.code})` : 'Registrar Nuevo Artículo / Ítem' }}</h3>
          </div>
          <button type="button" class="btn-secondary" @click="showItemModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveItemForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Código Interno (Autogenerado si se deja vacío)</label>
              <input v-model="itemForm.code" type="text" placeholder="Ej: ART-001" :disabled="Boolean(editingItemId)" />
            </div>
            <div class="form-group">
              <label>SKU / Código de Barras</label>
              <input v-model="itemForm.sku" type="text" placeholder="Ej: 786100012345" />
            </div>

            <div class="form-group span-2">
              <label>Nombre del Artículo / Producto *</label>
              <input v-model="itemForm.name" type="text" required placeholder="Ej: Laptop Dell Latitude 5440 Core i7 16GB" />
            </div>

            <div class="form-group">
              <label>Categoría</label>
              <input v-model="itemForm.category" type="text" placeholder="Ej: Equipos, Repuestos, Suministros" />
            </div>

            <div class="form-group">
              <label>Unidad de Medida</label>
              <select v-model="itemForm.unit">
                <option value="UND">Unidad (UND)</option>
                <option value="CAJA">Caja (CAJA)</option>
                <option value="KG">Kilogramo (KG)</option>
                <option value="LT">Litro (LT)</option>
                <option value="MT">Metro (MT)</option>
                <option value="M2">Metro Cuadrado (M2)</option>
                <option value="KIT">Kit / Paquete (KIT)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Costo Unitario ($) *</label>
              <input v-model.number="itemForm.costPrice" type="number" step="0.01" min="0" required />
            </div>

            <div class="form-group">
              <label>Precio de Venta ($) *</label>
              <input v-model.number="itemForm.salePrice" type="number" step="0.01" min="0" required />
            </div>

            <div class="form-group">
              <label>Tarifa IVA (%)</label>
              <select v-model.number="itemForm.taxRate">
                <option :value="15">15% (Gravado)</option>
                <option :value="0">0% (Tarifa Cero / Exento)</option>
                <option :value="5">5% (Materiales Construcción)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Ubicación / Bodega</label>
              <input v-model="itemForm.location" type="text" placeholder="Ej: Bodega Central - Percha A2" />
            </div>

            <div class="form-group">
              <label>Stock Actual</label>
              <input v-model.number="itemForm.stockCurrent" type="number" step="0.01" min="0" />
            </div>

            <div class="form-group">
              <label>Stock Mínimo (Alerta)</label>
              <input v-model.number="itemForm.stockMin" type="number" step="0.01" min="0" />
            </div>

            <div class="form-group span-2">
              <label>Descripción / Especificaciones Técnicas</label>
              <textarea v-model="itemForm.description" rows="2" placeholder="Detalles adicionales del ítem..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showItemModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <iconify-icon icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (editingItemId ? 'Guardar Cambios' : 'Registrar Artículo') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 2: CREAR / EDITAR SERVICIO                           -->
    <!-- ========================================================== -->
    <div v-if="showServiceModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge srv">CATÁLOGO DE SERVICIOS</span>
            <h3>{{ editingServiceId ? `Editar Servicio (${serviceForm.code})` : 'Registrar Nuevo Servicio' }}</h3>
          </div>
          <button type="button" class="btn-secondary" @click="showServiceModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveServiceForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Código Interno (Autogenerado si se deja vacío)</label>
              <input v-model="serviceForm.code" type="text" placeholder="Ej: SRV-001" :disabled="Boolean(editingServiceId)" />
            </div>

            <div class="form-group">
              <label>Categoría del Servicio</label>
              <input v-model="serviceForm.category" type="text" placeholder="Ej: Consultoría, Soporte, Mantenimiento" />
            </div>

            <div class="form-group span-2">
              <label>Nombre del Servicio *</label>
              <input v-model="serviceForm.name" type="text" required placeholder="Ej: Mantenimiento Preventivo de Servidores" />
            </div>

            <div class="form-group">
              <label>Unidad de Cobro</label>
              <select v-model="serviceForm.unit">
                <option value="SERV">Por Servicio (SERV)</option>
                <option value="HORA">Por Hora (HORA)</option>
                <option value="MENSUAL">Mensualidad (MENSUAL)</option>
                <option value="ANUAL">Suscripción Anual (ANUAL)</option>
                <option value="PROYECTO">Por Proyecto (PROYECTO)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Duración Estimada / SLA</label>
              <input v-model="serviceForm.estimatedDuration" type="text" placeholder="Ej: 4 horas / Entrega 48h" />
            </div>

            <div class="form-group">
              <label>Costo Operativo Base ($)</label>
              <input v-model.number="serviceForm.costPrice" type="number" step="0.01" min="0" />
            </div>

            <div class="form-group">
              <label>Tarifa / Precio de Venta ($) *</label>
              <input v-model.number="serviceForm.salePrice" type="number" step="0.01" min="0" required />
            </div>

            <div class="form-group">
              <label>Tarifa IVA (%)</label>
              <select v-model.number="serviceForm.taxRate">
                <option :value="15">15% (Gravado)</option>
                <option :value="0">0% (Exento)</option>
              </select>
            </div>

            <div class="form-group span-2">
              <label>Alcance y Descripción del Servicio</label>
              <textarea v-model="serviceForm.description" rows="3" placeholder="Incluye revisión técnica, informe y garantía..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showServiceModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <iconify-icon icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (editingServiceId ? 'Guardar Cambios' : 'Registrar Servicio') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 3: CREAR / EDITAR SUBCONTRATACIÓN / MANO DE OBRA     -->
    <!-- ========================================================== -->
    <div v-if="showSubcontractModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge mo">SUBCONTRATACIÓN Y MANO DE OBRA</span>
            <h3>
              {{ editingSubcontractId ? `Editar Rubro (${subcontractForm.code})` : 'Registrar Mano de Obra / Subcontratación' }}
            </h3>
          </div>
          <button type="button" class="btn-secondary" @click="showSubcontractModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveSubcontractForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Código Interno (Autogenerado si se deja vacío)</label>
              <input v-model="subcontractForm.code" type="text" placeholder="Ej: MO-001" :disabled="Boolean(editingSubcontractId)" />
            </div>

            <div class="form-group">
              <label>Especialidad / Área Técnica</label>
              <input v-model="subcontractForm.specialty" type="text" placeholder="Ej: Electricidad, Obra Civil, Soldadura, TI" />
            </div>

            <div class="form-group span-2">
              <label>Nombre de la Labor / Servicio Subcontratado *</label>
              <input v-model="subcontractForm.name" type="text" required placeholder="Ej: Instalación de Cableado Estructurado Cat 6A por Punto" />
            </div>

            <div class="form-group">
              <label>Contratista / Proveedor Habitual</label>
              <input v-model="subcontractForm.contractorName" type="text" placeholder="Ej: Ing. Carlos Méndez / ElectroRedes S.A." />
            </div>

            <div class="form-group">
              <label>RUC / Cédula del Contratista</label>
              <input v-model="subcontractForm.contractorTaxId" type="text" placeholder="Ej: 1790012345001" />
            </div>

            <div class="form-group">
              <label>Unidad de Medida / Pago</label>
              <select v-model="subcontractForm.unit">
                <option value="HORA_HOMBRE">Hora Hombre (HORA_HOMBRE)</option>
                <option value="JORNAL">Jornal / Día (JORNAL)</option>
                <option value="PUNTO">Por Punto Instalado (PUNTO)</option>
                <option value="M2">Metro Cuadrado (M2)</option>
                <option value="ML">Metro Lineal (ML)</option>
                <option value="OBRA">Por Obra / Contrato Cerrado (OBRA)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Tarifa IVA (%)</label>
              <select v-model.number="subcontractForm.taxRate">
                <option :value="15">15% (Gravado)</option>
                <option :value="0">0% (Rimen Rimpe / Exento)</option>
                <option :value="5">5%</option>
              </select>
            </div>

            <div class="form-group">
              <label>Costo Contratista ($) *</label>
              <input v-model.number="subcontractForm.unitCost" type="number" step="0.01" min="0" required />
            </div>

            <div class="form-group">
              <label>Precio Sugerido al Cliente ($) *</label>
              <input v-model.number="subcontractForm.suggestedPrice" type="number" step="0.01" min="0" required />
            </div>

            <div class="form-group span-2">
              <label class="checkbox-row">
                <input v-model="subcontractForm.includesMaterials" type="checkbox" />
                <span>¿El contratista incluye materiales menores o herramientas propias en esta tarifa?</span>
              </label>
            </div>

            <div class="form-group span-2">
              <label>Condiciones Técnicas / Entregables de la Mano de Obra</label>
              <textarea v-model="subcontractForm.description" rows="2" placeholder="Condiciones de entrega, certificaciones o garantías requeridas..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showSubcontractModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <iconify-icon icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (editingSubcontractId ? 'Guardar Cambios' : 'Registrar Mano de Obra') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryServices,
  createInventoryService,
  updateInventoryService,
  deleteInventoryService,
  getInventorySubcontracts,
  createInventorySubcontract,
  updateInventorySubcontract,
  deleteInventorySubcontract,
  type InventoryArticle,
  type InventoryServiceItem,
  type InventorySubcontractItem
} from '@/services/inventory.service'

type InventoryTab = 'articulos' | 'servicios' | 'subcontratacion'

const route = useRoute()
const router = useRouter()

const activeTab = ref<InventoryTab>('articulos')
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOW_STOCK'>('ALL')

const itemsList = ref<InventoryArticle[]>([])
const servicesList = ref<InventoryServiceItem[]>([])
const subcontractsList = ref<InventorySubcontractItem[]>([])

const feedbackBanner = ref<{ text: string; type: 'success' | 'error' | '' }>({
  text: '',
  type: ''
})

const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
  feedbackBanner.value = { text, type }
  setTimeout(() => {
    if (feedbackBanner.value.text === text) {
      feedbackBanner.value = { text: '', type: '' }
    }
  }, 4000)
}

const getActiveCompanyId = (): number => {
  try {
    const raw = localStorage.getItem('selectedCompany')
    if (raw) {
      const parsed = JSON.parse(raw)
      const id = Number(parsed?.companyId || parsed?.company?.id || parsed?.id)
      if (!Number.isNaN(id) && id > 0) return id
    }
  } catch {
    // ignore
  }
  return 1
}

// Sync tab with URL query (?tab=articulos | servicios | subcontratacion) or route param
const syncTabFromRoute = () => {
  const qTab = String(route.query.tab || route.params.sub || '').toLowerCase()
  if (qTab.includes('serv')) {
    activeTab.value = 'servicios'
  } else if (qTab.includes('sub') || qTab.includes('mano') || qTab.includes('obra')) {
    activeTab.value = 'subcontratacion'
  } else {
    activeTab.value = 'articulos'
  }
}

const switchTab = (tab: InventoryTab) => {
  activeTab.value = tab
  statusFilter.value = 'ALL'
  router.replace({ path: '/inventario', query: { tab } })
}

watch(() => [route.query.tab, route.params.sub], () => {
  syncTabFromRoute()
})

const activeTabBadge = computed(() => {
  if (activeTab.value === 'servicios') return { code: 'SUB-009 · SERVICIOS' }
  if (activeTab.value === 'subcontratacion') return { code: 'SUB-010 · MANO DE OBRA' }
  return { code: 'SUB-008 · ARTÍCULOS' }
})

const createButtonLabel = computed(() => {
  if (activeTab.value === 'servicios') return 'Nuevo Servicio'
  if (activeTab.value === 'subcontratacion') return 'Nueva Mano de Obra / Subcontrato'
  return 'Nuevo Artículo'
})

const searchPlaceholder = computed(() => {
  if (activeTab.value === 'servicios') return 'Buscar por código SRV, nombre o categoría...'
  if (activeTab.value === 'subcontratacion') return 'Buscar por código MO, rubro, contratista o especialidad...'
  return 'Buscar por código ART, SKU, nombre o bodega...'
})

const formatNumber = (val: any) => {
  const num = Number(val || 0)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// KPIs
const totalInventoryCostValue = computed(() =>
  itemsList.value.reduce((acc, item) => acc + Number(item.costPrice || 0) * Number(item.stockCurrent || 0), 0)
)
const totalInventorySaleValue = computed(() =>
  itemsList.value.reduce((acc, item) => acc + Number(item.salePrice || 0) * Number(item.stockCurrent || 0), 0)
)
const lowStockCount = computed(() =>
  itemsList.value.filter(i => i.status && Number(i.stockCurrent || 0) <= Number(i.stockMin || 0)).length
)
const averageServicePrice = computed(() => {
  if (!servicesList.value.length) return 0
  const sum = servicesList.value.reduce((acc, s) => acc + Number(s.salePrice || 0), 0)
  return sum / servicesList.value.length
})
const averageSubcontractCost = computed(() => {
  if (!subcontractsList.value.length) return 0
  const sum = subcontractsList.value.reduce((acc, s) => acc + Number(s.unitCost || 0), 0)
  return sum / subcontractsList.value.length
})

// Filtered lists
const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return itemsList.value.filter(item => {
    if (statusFilter.value === 'ACTIVE' && !item.status) return false
    if (statusFilter.value === 'INACTIVE' && item.status) return false
    if (statusFilter.value === 'LOW_STOCK' && Number(item.stockCurrent) > Number(item.stockMin)) return false
    if (!q) return true
    return (
      item.code?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    )
  })
})

const filteredServices = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return servicesList.value.filter(srv => {
    if (statusFilter.value === 'ACTIVE' && !srv.status) return false
    if (statusFilter.value === 'INACTIVE' && srv.status) return false
    if (!q) return true
    return (
      srv.code?.toLowerCase().includes(q) ||
      srv.name?.toLowerCase().includes(q) ||
      srv.category?.toLowerCase().includes(q) ||
      srv.description?.toLowerCase().includes(q)
    )
  })
})

const filteredSubcontracts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return subcontractsList.value.filter(sub => {
    if (statusFilter.value === 'ACTIVE' && !sub.status) return false
    if (statusFilter.value === 'INACTIVE' && sub.status) return false
    if (!q) return true
    return (
      sub.code?.toLowerCase().includes(q) ||
      sub.name?.toLowerCase().includes(q) ||
      sub.specialty?.toLowerCase().includes(q) ||
      sub.contractorName?.toLowerCase().includes(q) ||
      sub.contractorTaxId?.toLowerCase().includes(q)
    )
  })
})

// Load All 3 Catalogs
const loadAllInventory = async () => {
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const [items, services, subcontracts] = await Promise.all([
      getInventoryItems(companyId),
      getInventoryServices(companyId),
      getInventorySubcontracts(companyId)
    ])
    itemsList.value = Array.isArray(items) ? items : []
    servicesList.value = Array.isArray(services) ? services : []
    subcontractsList.value = Array.isArray(subcontracts) ? subcontracts : []
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al cargar los catálogos de inventario', 'error')
  } finally {
    loading.value = false
  }
}

// ==========================================
// 1. CRUD ARTÍCULOS
// ==========================================
const showItemModal = ref(false)
const editingItemId = ref<number | null>(null)
const itemForm = ref({
  code: '',
  sku: '',
  name: '',
  category: 'General',
  unit: 'UND',
  costPrice: 0,
  salePrice: 0,
  taxRate: 15,
  stockCurrent: 0,
  stockMin: 5,
  location: 'Bodega Principal',
  description: '',
  status: true
})

const openCreateItem = () => {
  editingItemId.value = null
  itemForm.value = {
    code: '',
    sku: '',
    name: '',
    category: 'Equipos y Suministros',
    unit: 'UND',
    costPrice: 0,
    salePrice: 0,
    taxRate: 15,
    stockCurrent: 1,
    stockMin: 2,
    location: 'Bodega Principal',
    description: '',
    status: true
  }
  showItemModal.value = true
}

const openEditItem = (item: InventoryArticle) => {
  editingItemId.value = item.id
  itemForm.value = {
    code: item.code || '',
    sku: item.sku || '',
    name: item.name || '',
    category: item.category || 'General',
    unit: item.unit || 'UND',
    costPrice: Number(item.costPrice || 0),
    salePrice: Number(item.salePrice || 0),
    taxRate: Number(item.taxRate ?? 15),
    stockCurrent: Number(item.stockCurrent || 0),
    stockMin: Number(item.stockMin || 0),
    location: item.location || 'Bodega Principal',
    description: item.description || '',
    status: Boolean(item.status)
  }
  showItemModal.value = true
}

const saveItemForm = async () => {
  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    if (editingItemId.value) {
      await updateInventoryItem(editingItemId.value, { ...itemForm.value, companyId })
      showFeedback('Artículo actualizado correctamente')
    } else {
      await createInventoryItem({ ...itemForm.value, companyId })
      showFeedback('Artículo registrado con éxito')
    }
    showItemModal.value = false
    await loadAllInventory()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al guardar el artículo', 'error')
  } finally {
    saving.value = false
  }
}

const toggleItemStatus = async (item: InventoryArticle) => {
  try {
    await updateInventoryItem(item.id, { companyId: getActiveCompanyId(), status: !item.status })
    item.status = !item.status
  } catch {
    showFeedback('No se pudo cambiar el estado del artículo', 'error')
  }
}

// ==========================================
// 2. CRUD SERVICIOS
// ==========================================
const showServiceModal = ref(false)
const editingServiceId = ref<number | null>(null)
const serviceForm = ref({
  code: '',
  name: '',
  category: 'Servicios Profesionales',
  unit: 'SERV',
  costPrice: 0,
  salePrice: 0,
  taxRate: 15,
  estimatedDuration: 'Según alcance',
  description: '',
  status: true
})

const openCreateService = () => {
  editingServiceId.value = null
  serviceForm.value = {
    code: '',
    name: '',
    category: 'Servicios Profesionales',
    unit: 'SERV',
    costPrice: 0,
    salePrice: 0,
    taxRate: 15,
    estimatedDuration: 'Según alcance',
    description: '',
    status: true
  }
  showServiceModal.value = true
}

const openEditService = (srv: InventoryServiceItem) => {
  editingServiceId.value = srv.id
  serviceForm.value = {
    code: srv.code || '',
    name: srv.name || '',
    category: srv.category || 'Servicios',
    unit: srv.unit || 'SERV',
    costPrice: Number(srv.costPrice || 0),
    salePrice: Number(srv.salePrice || 0),
    taxRate: Number(srv.taxRate ?? 15),
    estimatedDuration: srv.estimatedDuration || '',
    description: srv.description || '',
    status: Boolean(srv.status)
  }
  showServiceModal.value = true
}

const saveServiceForm = async () => {
  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    if (editingServiceId.value) {
      await updateInventoryService(editingServiceId.value, { ...serviceForm.value, companyId })
      showFeedback('Servicio actualizado correctamente')
    } else {
      await createInventoryService({ ...serviceForm.value, companyId })
      showFeedback('Servicio registrado con éxito')
    }
    showServiceModal.value = false
    await loadAllInventory()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al guardar el servicio', 'error')
  } finally {
    saving.value = false
  }
}

const toggleServiceStatus = async (srv: InventoryServiceItem) => {
  try {
    await updateInventoryService(srv.id, { companyId: getActiveCompanyId(), status: !srv.status })
    srv.status = !srv.status
  } catch {
    showFeedback('No se pudo cambiar el estado del servicio', 'error')
  }
}

// ==========================================
// 3. CRUD SUBCONTRATACIÓN / MANO DE OBRA
// ==========================================
const showSubcontractModal = ref(false)
// Mientras un formulario de registro/edición está abierto se muestra como página y se oculta el listado
const isFormOpen = computed(() => showItemModal.value || showServiceModal.value || showSubcontractModal.value)
watch(isFormOpen, async (open) => {
  if (open) {
    await nextTick()
    document.getElementById('form-page')?.scrollIntoView({ block: 'start' })
  }
})
const editingSubcontractId = ref<number | null>(null)
const subcontractForm = ref({
  code: '',
  name: '',
  specialty: 'Ingeniería / Técnico',
  contractorName: '',
  contractorTaxId: '',
  unit: 'HORA_HOMBRE',
  unitCost: 0,
  suggestedPrice: 0,
  includesMaterials: false,
  taxRate: 15,
  description: '',
  status: true
})

const openCreateSubcontract = () => {
  editingSubcontractId.value = null
  subcontractForm.value = {
    code: '',
    name: '',
    specialty: 'Ingeniería / Técnico',
    contractorName: '',
    contractorTaxId: '',
    unit: 'HORA_HOMBRE',
    unitCost: 0,
    suggestedPrice: 0,
    includesMaterials: false,
    taxRate: 15,
    description: '',
    status: true
  }
  showSubcontractModal.value = true
}

const openEditSubcontract = (sub: InventorySubcontractItem) => {
  editingSubcontractId.value = sub.id
  subcontractForm.value = {
    code: sub.code || '',
    name: sub.name || '',
    specialty: sub.specialty || 'General',
    contractorName: sub.contractorName || '',
    contractorTaxId: sub.contractorTaxId || '',
    unit: sub.unit || 'HORA_HOMBRE',
    unitCost: Number(sub.unitCost || 0),
    suggestedPrice: Number(sub.suggestedPrice || 0),
    includesMaterials: Boolean(sub.includesMaterials),
    taxRate: Number(sub.taxRate ?? 15),
    description: sub.description || '',
    status: Boolean(sub.status)
  }
  showSubcontractModal.value = true
}

const saveSubcontractForm = async () => {
  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    if (editingSubcontractId.value) {
      await updateInventorySubcontract(editingSubcontractId.value, { ...subcontractForm.value, companyId })
      showFeedback('Rubro de subcontratación / mano de obra actualizado')
    } else {
      await createInventorySubcontract({ ...subcontractForm.value, companyId })
      showFeedback('Rubro de subcontratación / mano de obra registrado con éxito')
    }
    showSubcontractModal.value = false
    await loadAllInventory()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al guardar el rubro de mano de obra', 'error')
  } finally {
    saving.value = false
  }
}

const toggleSubcontractStatus = async (sub: InventorySubcontractItem) => {
  try {
    await updateInventorySubcontract(sub.id, { companyId: getActiveCompanyId(), status: !sub.status })
    sub.status = !sub.status
  } catch {
    showFeedback('No se pudo cambiar el estado del rubro', 'error')
  }
}

// ==========================================
// DISPATCHER BOTÓN CREAR Y ELIMINAR
// ==========================================
const openCreateModal = () => {
  if (activeTab.value === 'servicios') {
    openCreateService()
  } else if (activeTab.value === 'subcontratacion') {
    openCreateSubcontract()
  } else {
    openCreateItem()
  }
}

const confirmDelete = async (tab: InventoryTab, record: any) => {
  const companyId = getActiveCompanyId()
  if (!window.confirm(`¿Estás seguro de eliminar "${record.name}" (${record.code})?`)) return
  try {
    if (tab === 'articulos') {
      await deleteInventoryItem(record.id, companyId)
    } else if (tab === 'servicios') {
      await deleteInventoryService(record.id, companyId)
    } else {
      await deleteInventorySubcontract(record.id, companyId)
    }
    showFeedback(`Registro ${record.code} eliminado correctamente`)
    await loadAllInventory()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'No se pudo eliminar el registro', 'error')
  }
}

onMounted(() => {
  syncTabFromRoute()
  loadAllInventory()
})
</script>

<style scoped>
.inventory-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.mod-code-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: rgba(0, 133, 219, 0.18);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.mod-code-badge.srv {
  background: rgba(139, 92, 246, 0.18);
  color: #c4b5fd;
  border-color: rgba(196, 181, 253, 0.3);
}

.mod-code-badge.mo {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
  border-color: rgba(252, 211, 77, 0.3);
}

.mod-sub-badge {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #0085db, #006bb3);
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 133, 219, 0.28);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 133, 219, 0.38);
}

.btn-secondary {
  background: #17233b;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover:not(:disabled) {
  background: #1e2d4a;
  color: #fff;
}

.tabs-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  background: #111c2d;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tabs-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px;
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid transparent;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-pill:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.04);
}

.tab-pill.active {
  background: rgba(0, 133, 219, 0.16);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}

.pill-count {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 270px;
}

.search-ic {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-box input {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b1426;
  color: #f1f5f9;
  font-size: 13px;
}

.filter-select {
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b1426;
  color: #f1f5f9;
  font-size: 13px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 18px;
}

.kpi-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon.blue {
  background: rgba(0, 133, 219, 0.16);
  color: #38bdf8;
}
.kpi-icon.green {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}
.kpi-icon.purple {
  background: rgba(139, 92, 246, 0.16);
  color: #a78bfa;
}
.kpi-icon.amber {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.kpi-label {
  font-size: 12px;
  color: #94a3b8;
}

.kpi-val {
  margin: 3px 0 0;
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
}

.feedback-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
}

.feedback-banner.success {
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feedback-banner.error {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.table-card {
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.erp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.erp-table th {
  text-align: left;
  padding: 13px 16px;
  background: #162238;
  color: #94a3b8;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.erp-table td {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.erp-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.empty-cell {
  text-align: center;
  padding: 36px 16px !important;
  color: #94a3b8;
}

.code-stack {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.code-chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.14);
  color: #38bdf8;
  width: fit-content;
}

.code-chip.srv {
  background: rgba(167, 139, 250, 0.15);
  color: #c4b5fd;
}

.code-chip.mo {
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
}

.sku-sub {
  font-size: 11px;
  color: #64748b;
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-weight: 600;
  color: #f8fafc;
}

.item-desc {
  font-size: 12px;
  color: #64748b;
}

.cat-badge {
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 12px;
}

.price-highlight {
  color: #38bdf8;
  font-weight: 700;
}

.tax-pill {
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
}

.stock-badge.ok {
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
}

.stock-badge.low {
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
}

.stock-badge small {
  font-weight: 400;
  opacity: 0.75;
}

.mat-badge {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
}

.mat-badge.yes {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.mat-badge.no {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.status-pill.active {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}

.status-pill.inactive {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.row-actions {
  display: inline-flex;
  gap: 6px;
}

.act-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: #17233b;
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.act-btn.edit:hover {
  background: rgba(0, 133, 219, 0.2);
  color: #38bdf8;
}

.act-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 20, 0.76);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 680px;
  background: #111c2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.modal-header h3 {
  margin: 6px 0 0;
  font-size: 18px;
  color: #f8fafc;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 20px 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.span-2 {
  grid-column: span 2;
}

.form-group label {
  font-size: 12.5px;
  font-weight: 600;
  color: #cbd5e1;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0b1426;
  color: #f8fafc;
  font-size: 13.5px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.03);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.text-right {
  text-align: right !important;
}
.text-center {
  text-align: center !important;
}
.font-mono {
  font-family: monospace;
}

/* Formularios de registro/edición como página (no modal): al abrirse reemplazan al listado */
.form-open > :not(.form-page):not(.keep-in-form) {
  display: none !important;
}
.form-page {
  width: 100%;
  scroll-margin-top: 110px; /* deja libre la barra superior fija */
}
.form-page-card {
  max-width: none;
  margin: 0 auto;
}
.form-page-card-lg {
  max-width: none;
}
.modal-card.form-page-card {
  max-width: none;
  margin: 0 auto;
  box-shadow: none;
}
</style>
