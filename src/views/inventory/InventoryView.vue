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
        <template v-if="activeTab === 'kardex'">
          <button class="btn-secondary" @click="openCreateTransfer">
            <iconify-icon icon="solar:transfer-horizontal-bold-duotone" width="18"></iconify-icon>
            <span>Transferencia</span>
          </button>
          <button class="btn-primary" @click="openCreateAdjustment">
            <iconify-icon icon="solar:tuning-square-2-bold-duotone" width="18"></iconify-icon>
            <span>Ajuste de Stock</span>
          </button>
        </template>
        <button v-else class="btn-primary" @click="openCreateModal">
          <iconify-icon icon="solar:add-circle-line-duotone" width="18"></iconify-icon>
          <span>{{ createButtonLabel }}</span>
        </button>
      </div>
    </div>

    <!-- Main 5-Tab Switcher -->
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

        <button
          class="tab-pill"
          :class="{ active: activeTab === 'categorias' }"
          @click="switchTab('categorias')"
        >
          <iconify-icon icon="solar:tag-price-line-duotone" width="18"></iconify-icon>
          <span>Categorías</span>
          <span class="pill-count">{{ categoriesList.length }}</span>
        </button>

        <button
          class="tab-pill"
          :class="{ active: activeTab === 'bodegas' }"
          @click="switchTab('bodegas')"
        >
          <iconify-icon icon="solar:home-smile-line-duotone" width="18"></iconify-icon>
          <span>Bodegas / Almacenes</span>
          <span class="pill-count">{{ warehousesList.length }}</span>
        </button>

        <button
          class="tab-pill"
          :class="{ active: activeTab === 'kardex' }"
          @click="switchTab('kardex')"
        >
          <iconify-icon icon="solar:history-bold-duotone" width="18"></iconify-icon>
          <span>Kardex / Movimientos</span>
          <span class="pill-count">{{ kardexMovements.length }}</span>
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

        <select v-if="activeTab === 'kardex'" v-model="kardexProductFilter" @change="loadKardex" class="filter-select" style="min-width: 220px;">
          <option :value="0">-- Todos los productos --</option>
          <option v-for="it in itemsList" :key="it.id" :value="it.id">
            {{ it.code ? `[${it.code}] ` : '' }}{{ it.name }}
          </option>
        </select>

        <select v-if="activeTab === 'kardex'" v-model="kardexWarehouseFilter" @change="loadKardex" class="filter-select">
          <option :value="0">-- Todas las bodegas --</option>
          <option v-for="wh in activeWarehouses" :key="wh.id" :value="wh.id">
            {{ wh.name }}
          </option>
        </select>

        <select v-if="activeTab !== 'kardex'" v-model="statusFilter" class="filter-select">
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

    <div class="kpi-grid" v-else-if="activeTab === 'subcontratacion'">
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

    <div class="kpi-grid" v-else-if="activeTab === 'categorias'">
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <iconify-icon icon="solar:tag-price-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Total Categorías</span>
          <h4 class="kpi-val">{{ categoriesList.length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <iconify-icon icon="solar:check-circle-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Categorías Activas</span>
          <h4 class="kpi-val">{{ categoriesList.filter(c => c.status).length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple">
          <iconify-icon icon="solar:box-minimalistic-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Artículos Categorizados</span>
          <h4 class="kpi-val">{{ itemsList.filter(i => i.categoryId || i.category).length }}</h4>
        </div>
      </div>
    </div>

    <div class="kpi-grid" v-else>
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <iconify-icon icon="solar:home-smile-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Total Bodegas</span>
          <h4 class="kpi-val">{{ warehousesList.length }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <iconify-icon icon="solar:star-circle-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Bodega Principal</span>
          <h4 class="kpi-val fs-3">{{ defaultWarehouseName }}</h4>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber">
          <iconify-icon icon="solar:buildings-3-bold-duotone" width="24"></iconify-icon>
        </div>
        <div>
          <span class="kpi-label">Bodegas Habilitadas</span>
          <h4 class="kpi-val">{{ warehousesList.filter(w => w.status).length }}</h4>
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
              <td colspan="11" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando artículos del inventario...</span>
              </td>
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
                  <button class="act-btn" @click="viewItemKardex(item)" title="Ver Kardex / Movimientos">
                    <iconify-icon icon="solar:history-bold-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn edit" @click="openEditItem(item)" title="Editar artículo">
                    <iconify-icon icon="solar:pen-new-square-line-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn delete" :disabled="deletingId === item.id" @click="confirmDelete('articulos', item)" title="Eliminar artículo">
                    <span v-if="deletingId === item.id" class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span>
                    <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
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
              <td colspan="10" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando catálogo de servicios...</span>
              </td>
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
                  <button class="act-btn delete" :disabled="deletingId === srv.id" @click="confirmDelete('servicios', srv)" title="Eliminar servicio">
                    <span v-if="deletingId === srv.id" class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span>
                    <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
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
              <td colspan="11" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando servicios de subcontratación y mano de obra...</span>
              </td>
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
                  <button class="act-btn delete" :disabled="deletingId === sub.id" @click="confirmDelete('subcontratacion', sub)" title="Eliminar rubro">
                    <span v-if="deletingId === sub.id" class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span>
                    <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- TAB 4: TABLA DE CATEGORÍAS                                 -->
    <!-- ========================================================== -->
    <div v-if="activeTab === 'categorias'" class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 110px;">Código</th>
              <th>Nombre de la Categoría</th>
              <th style="width: 150px;">Tipo de Concepto</th>
              <th>Descripción</th>
              <th class="text-center" style="width: 150px;">Artículos Asociados</th>
              <th class="text-center" style="width: 110px;">Estado</th>
              <th class="text-right" style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando categorías de inventario...</span>
              </td>
            </tr>
            <tr v-else-if="filteredCategories.length === 0">
              <td colspan="7" class="empty-cell">
                No se encontraron categorías registradas. Haz clic en <strong>+ Nueva Categoría</strong> para crear la primera.
              </td>
            </tr>
            <tr v-for="cat in filteredCategories" :key="cat.id">
              <td><span class="code-chip cat">{{ cat.code }}</span></td>
              <td>
                <span class="item-name fw-bold">{{ cat.name }}</span>
              </td>
              <td>
                <span v-if="cat.category_type === 'SERVICE'" class="badge border" style="background: rgba(139, 92, 246, 0.15); color: #c4b5fd; border-color: rgba(196, 181, 253, 0.3);">
                  Servicios
                </span>
                <span v-else-if="cat.category_type === 'LABOR'" class="badge bg-warning-subtle text-warning border border-warning-subtle">
                  Mano de Obra
                </span>
                <span v-else-if="cat.category_type === 'ALL'" class="badge border" style="background: rgba(20, 184, 166, 0.15); color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">
                  Universal / Todos
                </span>
                <span v-else class="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Productos Físicos
                </span>
              </td>
              <td>
                <span class="text-secondary small">{{ cat.description || 'Sin descripción' }}</span>
              </td>
              <td class="text-center">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                  {{ countItemsByCategory(cat) }} artículos
                </span>
              </td>
              <td class="text-center">
                <button
                  class="status-pill"
                  :class="cat.status ? 'active' : 'inactive'"
                  @click="toggleCategoryStatus(cat)"
                  title="Clic para cambiar estado"
                >
                  {{ cat.status ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="act-btn edit" @click="openEditCategory(cat)" title="Editar categoría">
                    <iconify-icon icon="solar:pen-new-square-line-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn delete" :disabled="deletingId === cat.id" @click="confirmDelete('categorias', cat)" title="Eliminar categoría">
                    <span v-if="deletingId === cat.id" class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span>
                    <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- TAB 5: TABLA DE BODEGAS / ALMACENES                        -->
    <!-- ========================================================== -->
    <div v-if="activeTab === 'bodegas'" class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 110px;">Código</th>
              <th>Nombre de Bodega</th>
              <th>Dirección / Ubicación</th>
              <th>Responsable</th>
              <th>Teléfono</th>
              <th class="text-center" style="width: 150px;">Artículos Alojados</th>
              <th class="text-center" style="width: 110px;">Estado</th>
              <th class="text-right" style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando bodegas de la empresa...</span>
              </td>
            </tr>
            <tr v-else-if="filteredWarehouses.length === 0">
              <td colspan="8" class="empty-cell">
                No se encontraron bodegas registradas. Haz clic en <strong>+ Nueva Bodega</strong> para crear la primera.
              </td>
            </tr>
            <tr v-for="wh in filteredWarehouses" :key="wh.id">
              <td><span class="code-chip bod">{{ wh.code }}</span></td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="item-name fw-bold">{{ wh.name }}</span>
                  <span v-if="wh.isDefault" class="badge bg-success-subtle text-success border border-success-subtle fs-1">
                    Principal
                  </span>
                </div>
              </td>
              <td><span class="text-secondary small">{{ wh.address || 'Sin dirección asignada' }}</span></td>
              <td><span class="text-secondary small">{{ wh.responsible || 'Sin responsable' }}</span></td>
              <td><span class="text-secondary small">{{ wh.phone || 'Sin teléfono' }}</span></td>
              <td class="text-center">
                <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                  {{ countItemsByWarehouse(wh) }} artículos
                </span>
              </td>
              <td class="text-center">
                <button
                  class="status-pill"
                  :class="wh.status ? 'active' : 'inactive'"
                  @click="toggleWarehouseStatus(wh)"
                  title="Clic para cambiar estado"
                >
                  {{ wh.status ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="act-btn edit" @click="openEditWarehouse(wh)" title="Editar bodega">
                    <iconify-icon icon="solar:pen-new-square-line-duotone" width="17"></iconify-icon>
                  </button>
                  <button class="act-btn delete" :disabled="deletingId === wh.id" @click="confirmDelete('bodegas', wh)" title="Eliminar bodega">
                    <span v-if="deletingId === wh.id" class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span>
                    <iconify-icon v-else icon="solar:trash-bin-trash-line-duotone" width="17"></iconify-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- TAB 6: KARDEX / MOVIMIENTOS HISTÓRICOS                     -->
    <!-- ========================================================== -->
    <div v-if="activeTab === 'kardex'" class="table-card">
      <div class="table-scroll">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 140px;">Fecha / Hora</th>
              <th style="width: 110px;">Tipo</th>
              <th style="width: 130px;">Motivo</th>
              <th>Artículo / Producto</th>
              <th>Bodega</th>
              <th class="text-right" style="width: 100px;">Cantidad</th>
              <th class="text-right" style="width: 110px;">Costo Unit.</th>
              <th class="text-right" style="width: 110px;">Costo Total</th>
              <th class="text-right" style="width: 110px;">Saldo Físico</th>
              <th>Doc. Origen / Referencia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingKardex">
              <td colspan="10" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Consultando movimientos del Kardex...</span>
              </td>
            </tr>
            <tr v-else-if="filteredKardexMovements.length === 0">
              <td colspan="10" class="empty-cell">
                No se encontraron movimientos registrados con los filtros actuales. Registra una factura, ajuste o transferencia.
              </td>
            </tr>
            <tr v-for="mov in filteredKardexMovements" :key="mov.id">
              <td>
                <span class="text-secondary font-mono small">{{ formatDateTime(mov.date) }}</span>
              </td>
              <td>
                <span
                  class="badge border px-2 py-1"
                  :style="mov.type === 'IN' ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(52, 211, 153, 0.3);' : 'background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(248, 113, 113, 0.3);'"
                >
                  <iconify-icon :icon="mov.type === 'IN' ? 'solar:arrow-down-left-line-duotone' : 'solar:arrow-up-right-line-duotone'"></iconify-icon>
                  {{ mov.type === 'IN' ? 'ENTRADA' : 'SALIDA' }}
                </span>
              </td>
              <td>
                <span class="badge bg-dark-subtle text-white border border-secondary">{{ formatMovementReason(mov.reason) }}</span>
              </td>
              <td>
                <div class="item-cell">
                  <span class="item-title font-mono small text-info">{{ mov.productCode }}</span>
                  <span class="item-desc">{{ mov.productName }}</span>
                </div>
              </td>
              <td>
                <span class="text-secondary">{{ mov.warehouseName || 'Bodega' }}</span>
              </td>
              <td class="text-right font-mono fw-bold" :class="mov.type === 'IN' ? 'text-success' : 'text-danger'">
                {{ mov.type === 'IN' ? '+' : '' }}{{ formatNumber(mov.quantity) }}
              </td>
              <td class="text-right font-mono">${{ formatNumber(mov.unitCost) }}</td>
              <td class="text-right font-mono">${{ formatNumber(mov.totalCost) }}</td>
              <td class="text-right font-mono text-warning fw-bold">{{ formatNumber(mov.stockAfter) }}</td>
              <td>
                <span class="text-secondary small font-mono">{{ mov.originDocument || mov.originName || 'Ajuste Interno' }}</span>
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
              <label>Categoría * <span class="badge bg-primary-subtle text-primary" style="font-size: 10px; margin-left: 6px;">Obligatoria</span></label>
              <select v-model="itemForm.categoryId" @change="onCategorySelect" required>
                <option :value="null" disabled>-- Selecciona una categoría obligatoria --</option>
                <option v-for="cat in activeCategories" :key="cat.id" :value="cat.id">
                  {{ cat.code ? `[${cat.code}] ` : '' }}{{ cat.name }}
                </option>
              </select>
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
              <label>Bodega de Almacenamiento</label>
              <select v-model="itemForm.warehouseId" @change="onWarehouseSelect">
                <option :value="null">-- Ninguna / Sin asignar --</option>
                <option v-for="wh in activeWarehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }}{{ wh.isDefault ? ' ★ (Principal)' : '' }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Ubicación / Percha</label>
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
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
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
              <label>Categoría del Servicio * <span class="badge bg-primary-subtle text-primary" style="font-size: 10px; margin-left: 6px;">Obligatoria</span></label>
              <select v-model="serviceForm.categoryId" @change="onServiceCategorySelect" required>
                <option :value="null" disabled>-- Selecciona una categoría obligatoria --</option>
                <option v-for="cat in serviceCategories" :key="cat.id" :value="cat.id">
                  {{ cat.code ? `[${cat.code}] ` : '' }}{{ cat.name }}
                </option>
              </select>
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
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
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

            <div class="form-group">
              <label>Categoría de Mano de Obra</label>
              <select v-model="subcontractForm.categoryId" @change="onSubcontractCategorySelect">
                <option :value="null">-- Seleccionar categoría (opcional) --</option>
                <option v-for="cat in laborCategories" :key="cat.id" :value="cat.id">
                  {{ cat.code ? `[${cat.code}] ` : '' }}{{ cat.name }}
                </option>
              </select>
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
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (editingSubcontractId ? 'Guardar Cambios' : 'Registrar Mano de Obra') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 4: CREAR / EDITAR CATEGORÍA                          -->
    <!-- ========================================================== -->
    <div v-if="showCategoryModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge cat">CONFIGURACIÓN DE CATEGORÍAS</span>
            <h3>{{ editingCategoryId ? `Editar Categoría (${categoryForm.code})` : 'Registrar Nueva Categoría' }}</h3>
          </div>
          <button type="button" class="btn-secondary" @click="showCategoryModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveCategoryForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Código de Categoría (Autogenerado si se deja vacío)</label>
              <input v-model="categoryForm.code" type="text" placeholder="Ej: CAT-001" :disabled="Boolean(editingCategoryId)" />
            </div>

            <div class="form-group">
              <label>Estado</label>
              <select v-model="categoryForm.status">
                <option :value="true">Activa (Disponible para productos)</option>
                <option :value="false">Inactiva</option>
              </select>
            </div>

            <div class="form-group span-2">
              <label>Nombre de la Categoría *</label>
              <input v-model="categoryForm.name" type="text" required placeholder="Ej: Equipos Informáticos, Repuestos, Suministros..." />
            </div>

            <div class="form-group span-2">
              <label>Tipo de Catálogo / Concepto que clasifica *</label>
              <select v-model="categoryForm.category_type" required>
                <option value="PRODUCT">PRODUCT · Artículos y Productos Físicos (Control de Inventario)</option>
                <option value="SERVICE">SERVICE · Servicios Profesionales y Comerciales</option>
                <option value="LABOR">LABOR · Mano de Obra y Subcontratación</option>
                <option value="ALL">ALL · Universal (Aplica a cualquier concepto)</option>
              </select>
            </div>

            <div class="form-group span-2">
              <label>Descripción / Observaciones</label>
              <textarea v-model="categoryForm.description" rows="3" placeholder="Detalle o alcance de los productos incluidos en esta categoría..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showCategoryModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (editingCategoryId ? 'Guardar Cambios' : 'Registrar Categoría') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 5: CREAR / EDITAR BODEGA                             -->
    <!-- ========================================================== -->
    <div v-if="showWarehouseModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge bod">LOGÍSTICA Y BODEGAS</span>
            <h3>{{ editingWarehouseId ? `Editar Bodega (${warehouseForm.code})` : 'Registrar Nueva Bodega' }}</h3>
          </div>
          <button type="button" class="btn-secondary" @click="showWarehouseModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveWarehouseForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Código de Bodega (Autogenerado si se deja vacío)</label>
              <input v-model="warehouseForm.code" type="text" placeholder="Ej: BOD-001" :disabled="Boolean(editingWarehouseId)" />
            </div>

            <div class="form-group">
              <label>Estado</label>
              <select v-model="warehouseForm.status">
                <option :value="true">Habilitada</option>
                <option :value="false">Inactiva / Bloqueada</option>
              </select>
            </div>

            <div class="form-group span-2">
              <label>Nombre de la Bodega *</label>
              <input v-model="warehouseForm.name" type="text" required placeholder="Ej: Bodega Central Quito, Almacén Guayaquil, Percha 1..." />
            </div>

            <div class="form-group">
              <label>Responsable / Custodio</label>
              <input v-model="warehouseForm.responsible" type="text" placeholder="Ej: Ing. Marco Salgado" />
            </div>

            <div class="form-group">
              <label>Teléfono de Contacto</label>
              <input v-model="warehouseForm.phone" type="text" placeholder="Ej: 0991234567" />
            </div>

            <div class="form-group span-2">
              <label>Dirección / Ubicación Física</label>
              <input v-model="warehouseForm.address" type="text" placeholder="Ej: Av. 10 de Agosto N24-102 y Orellana" />
            </div>

            <div class="form-group span-2">
              <label class="checkbox-row">
                <input v-model="warehouseForm.isDefault" type="checkbox" />
                <span>Marcar como Bodega Principal / Predeterminada de la empresa</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showWarehouseModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:diskette-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : (editingWarehouseId ? 'Guardar Cambios' : 'Registrar Bodega') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 6: TRANSFERENCIA ENTRE BODEGAS                       -->
    <!-- ========================================================== -->
    <div v-if="showTransferModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge bod">MOVIMIENTOS DE STOCK</span>
            <h3>Transferencia entre Bodegas</h3>
          </div>
          <button type="button" class="btn-secondary" @click="showTransferModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveTransferForm">
          <div class="form-grid">
            <div class="form-group span-2">
              <label>Artículo / Producto a Transferir *</label>
              <select v-model="transferForm.product_id" required>
                <option :value="null" disabled>-- Selecciona un artículo físico --</option>
                <option v-for="item in itemsList" :key="item.id" :value="item.id">
                  {{ item.code ? `[${item.code}] ` : '' }}{{ item.name }} (Stock Total: {{ formatNumber(item.stockCurrent) }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Bodega de Origen (Sale stock) *</label>
              <select v-model="transferForm.from_warehouse_id" required>
                <option :value="null" disabled>-- Selecciona bodega origen --</option>
                <option v-for="wh in activeWarehouses" :key="'from-'+wh.id" :value="wh.id">
                  {{ wh.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Bodega de Destino (Entra stock) *</label>
              <select v-model="transferForm.to_warehouse_id" required>
                <option :value="null" disabled>-- Selecciona bodega destino --</option>
                <option v-for="wh in activeWarehouses" :key="'to-'+wh.id" :value="wh.id">
                  {{ wh.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Cantidad a Transferir *</label>
              <input v-model.number="transferForm.quantity" type="number" step="0.01" min="0.01" required />
            </div>

            <div class="form-group">
              <label>Motivo / Observación de Transferencia</label>
              <input v-model="transferForm.notes" type="text" placeholder="Ej: Reabastecimiento punto de venta norte" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showTransferModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:transfer-horizontal-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Transfiriendo...' : 'Procesar Transferencia' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 7: AJUSTE FÍSICO DE STOCK                            -->
    <!-- ========================================================== -->
    <div v-if="showAdjustmentModal" id="form-page" class="form-page">
      <div class="modal-card form-page-card">
        <div class="modal-header">
          <div>
            <span class="mod-code-badge" style="background: rgba(245, 158, 11, 0.18); color: #fcd34d;">AJUSTE DE INVENTARIO</span>
            <h3>Ajuste Físico de Existencias</h3>
          </div>
          <button type="button" class="btn-secondary" @click="showAdjustmentModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" width="18"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="saveAdjustmentForm">
          <div class="form-grid">
            <div class="form-group span-2">
              <label>Artículo / Producto a Ajustar *</label>
              <select v-model="adjustmentForm.product_id" @change="onAdjustmentProductChange" required>
                <option :value="null" disabled>-- Selecciona un artículo --</option>
                <option v-for="item in itemsList" :key="item.id" :value="item.id">
                  {{ item.code ? `[${item.code}] ` : '' }}{{ item.name }} (Stock registrado: {{ formatNumber(item.stockCurrent) }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Bodega donde se realiza el conteo *</label>
              <select v-model="adjustmentForm.warehouse_id" required>
                <option :value="null" disabled>-- Selecciona bodega --</option>
                <option v-for="wh in activeWarehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Motivo del Ajuste *</label>
              <select v-model="adjustmentForm.reason" required>
                <option value="COUNT_CORRECTION">Conteo Físico / Corrección de Inventario</option>
                <option value="OPENING">Carga de Stock Inicial</option>
                <option value="DAMAGED">Mercadería Dañada / Merma</option>
                <option value="EXPIRED">Producto Caducado / Vencido</option>
                <option value="INTERNAL_USE">Consumo Interno de la Empresa</option>
                <option value="OTHER">Otro Motivo</option>
              </select>
            </div>

            <div class="form-group">
              <label>Nuevo Stock Físico Real *</label>
              <input v-model.number="adjustmentForm.new_stock" type="number" step="0.01" min="0" required placeholder="0.00" />
            </div>

            <div class="form-group">
              <label>Costo Unitario de Referencia ($)</label>
              <input v-model.number="adjustmentForm.unit_cost" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showAdjustmentModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:tuning-square-2-bold-duotone" width="18"></iconify-icon>
              <span>{{ saving ? 'Aplicando ajuste...' : 'Confirmar Ajuste de Stock' }}</span>
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
  getInventoryCategories,
  createInventoryCategory,
  updateInventoryCategory,
  deleteInventoryCategory,
  getInventoryWarehouses,
  createInventoryWarehouse,
  updateInventoryWarehouse,
  deleteInventoryWarehouse,
  getInventoryKardex,
  createInventoryTransfer,
  createInventoryAdjustment,
  type InventoryArticle,
  type InventoryServiceItem,
  type InventorySubcontractItem,
  type InventoryCategory,
  type InventoryWarehouse,
  type InventoryKardexMovement,
  type InventoryTransferPayload,
  type InventoryAdjustmentPayload
} from '@/services/inventory.service'

type InventoryTab = 'articulos' | 'servicios' | 'subcontratacion' | 'categorias' | 'bodegas' | 'kardex'

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
const categoriesList = ref<InventoryCategory[]>([])
const warehousesList = ref<InventoryWarehouse[]>([])
const kardexMovements = ref<InventoryKardexMovement[]>([])
const kardexProductFilter = ref<number>(0)
const kardexWarehouseFilter = ref<number>(0)
const loadingKardex = ref(false)

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

// Sync tab with URL query (?tab=articulos | servicios | subcontratacion | categorias | bodegas | kardex) or route param
const syncTabFromRoute = () => {
  const qTab = String(route.query.tab || route.params.sub || '').toLowerCase()
  if (qTab.includes('serv')) {
    activeTab.value = 'servicios'
  } else if (qTab.includes('sub') || qTab.includes('mano') || qTab.includes('obra')) {
    activeTab.value = 'subcontratacion'
  } else if (qTab.includes('cat')) {
    activeTab.value = 'categorias'
  } else if (qTab.includes('bod') || qTab.includes('ware') || qTab.includes('almacen')) {
    activeTab.value = 'bodegas'
  } else if (qTab.includes('kardex') || qTab.includes('mov')) {
    activeTab.value = 'kardex'
    loadKardex()
  } else {
    activeTab.value = 'articulos'
  }
}

const switchTab = (tab: InventoryTab) => {
  activeTab.value = tab
  statusFilter.value = 'ALL'
  router.replace({ path: '/inventario', query: { tab } })
  if (tab === 'kardex') {
    loadKardex()
  }
}

watch(() => [route.query.tab, route.params.sub], () => {
  syncTabFromRoute()
})

const activeTabBadge = computed(() => {
  if (activeTab.value === 'servicios') return { code: 'SUB-009 · SERVICIOS' }
  if (activeTab.value === 'subcontratacion') return { code: 'SUB-010 · MANO DE OBRA' }
  if (activeTab.value === 'categorias') return { code: 'CONFIG · CATEGORÍAS' }
  if (activeTab.value === 'bodegas') return { code: 'LOGÍSTICA · BODEGAS' }
  if (activeTab.value === 'kardex') return { code: 'AUDITORÍA · KARDEX' }
  return { code: 'SUB-008 · ARTÍCULOS' }
})

const createButtonLabel = computed(() => {
  if (activeTab.value === 'servicios') return 'Nuevo Servicio'
  if (activeTab.value === 'subcontratacion') return 'Nueva Mano de Obra / Subcontrato'
  if (activeTab.value === 'categorias') return 'Nueva Categoría'
  if (activeTab.value === 'bodegas') return 'Nueva Bodega'
  if (activeTab.value === 'kardex') return 'Ajuste de Stock'
  return 'Nuevo Artículo'
})

const searchPlaceholder = computed(() => {
  if (activeTab.value === 'servicios') return 'Buscar por código SRV, nombre o categoría...'
  if (activeTab.value === 'subcontratacion') return 'Buscar por código MO, rubro, contratista o especialidad...'
  if (activeTab.value === 'categorias') return 'Buscar categoría por código, nombre o descripción...'
  if (activeTab.value === 'bodegas') return 'Buscar bodega por código, nombre, responsable o dirección...'
  if (activeTab.value === 'kardex') return 'Buscar movimiento por código, producto, bodega o doc. origen...'
  return 'Buscar por código ART, SKU, nombre o bodega...'
})

const formatNumber = (val: any) => {
  const num = Number(val || 0)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDateTime = (val?: string) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleString()
  } catch {
    return val
  }
}

const formatMovementReason = (reason?: string) => {
  switch (reason) {
    case 'OPENING': return 'Apertura Inicial'
    case 'PURCHASE': return 'Compra'
    case 'SALE': return 'Venta / Factura'
    case 'CUSTOMER_RETURN': return 'Devolución Cliente'
    case 'SUPPLIER_RETURN': return 'Devolución Proveedor'
    case 'ADJUSTMENT': return 'Ajuste Físico'
    case 'TRANSFER': return 'Transferencia'
    case 'REVERSAL': return 'Reversión'
    default: return reason || 'Movimiento'
  }
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

const activeCategories = computed(() => categoriesList.value.filter(c => c.status))
const productCategories = computed(() =>
  activeCategories.value.filter(c => c.category_type === 'PRODUCT' || c.category_type === 'ALL' || !c.category_type)
)
const serviceCategories = computed(() =>
  activeCategories.value.filter(c => c.category_type === 'SERVICE' || c.category_type === 'ALL' || !c.category_type)
)
const laborCategories = computed(() =>
  activeCategories.value.filter(c => c.category_type === 'LABOR' || c.category_type === 'ALL' || !c.category_type)
)
const activeWarehouses = computed(() => warehousesList.value.filter(w => w.status))
const defaultWarehouseName = computed(() => warehousesList.value.find(w => w.isDefault)?.name || 'Sin predeterminada')

const filteredKardexMovements = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return kardexMovements.value.filter(m => {
    if (kardexProductFilter.value && m.productId !== kardexProductFilter.value) return false
    if (kardexWarehouseFilter.value && m.warehouseId !== kardexWarehouseFilter.value) return false
    if (!q) return true
    return (
      m.productCode?.toLowerCase().includes(q) ||
      m.productName?.toLowerCase().includes(q) ||
      m.warehouseName?.toLowerCase().includes(q) ||
      m.originDocument?.toLowerCase().includes(q) ||
      m.originName?.toLowerCase().includes(q) ||
      m.reason?.toLowerCase().includes(q)
    )
  })
})

const countItemsByCategory = (cat: InventoryCategory) => {
  return itemsList.value.filter(item => {
    if (item.categoryId && item.categoryId === cat.id) return true
    if (item.category && cat.name && item.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) return true
    return false
  }).length
}

const countItemsByWarehouse = (wh: InventoryWarehouse) => {
  return itemsList.value.filter(item => {
    if (item.warehouseId && item.warehouseId === wh.id) return true
    if (item.location && wh.name && item.location.toLowerCase().includes(wh.name.toLowerCase())) return true
    return false
  }).length
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return categoriesList.value.filter(cat => {
    if (statusFilter.value === 'ACTIVE' && !cat.status) return false
    if (statusFilter.value === 'INACTIVE' && cat.status) return false
    if (!q) return true
    return (
      cat.code?.toLowerCase().includes(q) ||
      cat.name?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    )
  })
})

const filteredWarehouses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return warehousesList.value.filter(wh => {
    if (statusFilter.value === 'ACTIVE' && !wh.status) return false
    if (statusFilter.value === 'INACTIVE' && wh.status) return false
    if (!q) return true
    return (
      wh.code?.toLowerCase().includes(q) ||
      wh.name?.toLowerCase().includes(q) ||
      wh.address?.toLowerCase().includes(q) ||
      wh.responsible?.toLowerCase().includes(q) ||
      wh.phone?.toLowerCase().includes(q)
    )
  })
})

// Load All Catalogs
const loadAllInventory = async () => {
  loading.value = true
  const companyId = getActiveCompanyId()
  try {
    const [items, services, subcontracts, categories, warehouses] = await Promise.all([
      getInventoryItems(companyId),
      getInventoryServices(companyId),
      getInventorySubcontracts(companyId),
      getInventoryCategories(companyId),
      getInventoryWarehouses(companyId)
    ])
    itemsList.value = Array.isArray(items) ? items : []
    servicesList.value = Array.isArray(services) ? services : []
    subcontractsList.value = Array.isArray(subcontracts) ? subcontracts : []
    categoriesList.value = Array.isArray(categories) ? categories : []
    warehousesList.value = Array.isArray(warehouses) ? warehouses : []
    loadKardex().catch(() => {})
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
  categoryId: null as number | null,
  category: '',
  warehouseId: null as number | null,
  unit: 'UND',
  costPrice: 0,
  salePrice: 0,
  taxRate: 15,
  stockCurrent: 0,
  stockMin: 5,
  location: '',
  description: '',
  status: true
})

const onCategorySelect = () => {
  const found = categoriesList.value.find(c => c.id === itemForm.value.categoryId)
  if (found) {
    itemForm.value.category = found.name
  }
}

const onWarehouseSelect = () => {
  const found = warehousesList.value.find(w => w.id === itemForm.value.warehouseId)
  if (found && !itemForm.value.location) {
    itemForm.value.location = found.name
  }
}

const openCreateItem = () => {
  editingItemId.value = null
  const firstCat = productCategories.value[0] || null
  const defWh = warehousesList.value.find(w => w.isDefault && w.status) || activeWarehouses.value[0] || null
  itemForm.value = {
    code: '',
    sku: '',
    name: '',
    categoryId: firstCat ? firstCat.id : null,
    category: firstCat ? firstCat.name : '',
    warehouseId: defWh ? defWh.id : null,
    unit: 'UND',
    costPrice: 0,
    salePrice: 0,
    taxRate: 15,
    stockCurrent: 1,
    stockMin: 2,
    location: defWh ? defWh.name : '',
    description: '',
    status: true
  }
  showItemModal.value = true
}

const openEditItem = (item: InventoryArticle) => {
  editingItemId.value = item.id
  const catMatch = categoriesList.value.find(c =>
    (item.categoryId && c.id === item.categoryId) ||
    (item.category && c.name.toLowerCase() === item.category.toLowerCase())
  )
  const whMatch = warehousesList.value.find(w =>
    (item.warehouseId && w.id === item.warehouseId) ||
    (item.location && item.location.toLowerCase().includes(w.name.toLowerCase()))
  )

  itemForm.value = {
    code: item.code || '',
    sku: item.sku || '',
    name: item.name || '',
    categoryId: catMatch ? catMatch.id : (item.categoryId || null),
    category: item.category || catMatch?.name || '',
    warehouseId: whMatch ? whMatch.id : (item.warehouseId || null),
    unit: item.unit || 'UND',
    costPrice: Number(item.costPrice || 0),
    salePrice: Number(item.salePrice || 0),
    taxRate: Number(item.taxRate ?? 15),
    stockCurrent: Number(item.stockCurrent || 0),
    stockMin: Number(item.stockMin || 0),
    location: item.location || (whMatch ? whMatch.name : ''),
    description: item.description || '',
    status: Boolean(item.status)
  }
  showItemModal.value = true
}

const saveItemForm = async () => {
  if (!itemForm.value.categoryId) {
    showFeedback('Debe seleccionar obligatoriamente una categoría para el producto', 'error')
    return
  }
  const matchedCat = categoriesList.value.find(c => c.id === itemForm.value.categoryId)
  if (matchedCat) {
    itemForm.value.category = matchedCat.name
  }

  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    const payload = {
      ...itemForm.value,
      companyId,
      categoryId: itemForm.value.categoryId,
      category_id: itemForm.value.categoryId,
      category: itemForm.value.category,
      warehouseId: itemForm.value.warehouseId,
      warehouse_id: itemForm.value.warehouseId
    }
    if (editingItemId.value) {
      await updateInventoryItem(editingItemId.value, payload)
      showFeedback('Artículo actualizado correctamente')
    } else {
      await createInventoryItem(payload)
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
  categoryId: null as number | null,
  category: '',
  unit: 'SERV',
  costPrice: 0,
  salePrice: 0,
  taxRate: 15,
  estimatedDuration: 'Según alcance',
  description: '',
  status: true
})

const onServiceCategorySelect = () => {
  const found = categoriesList.value.find(c => c.id === serviceForm.value.categoryId)
  if (found) {
    serviceForm.value.category = found.name
  }
}

const openCreateService = () => {
  editingServiceId.value = null
  const firstCat = serviceCategories.value[0] || null
  serviceForm.value = {
    code: '',
    name: '',
    categoryId: firstCat ? firstCat.id : null,
    category: firstCat ? firstCat.name : '',
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
  const catMatch = categoriesList.value.find(c =>
    (c.id === (srv as any).categoryId) || (srv.category && c.name.toLowerCase() === srv.category.toLowerCase())
  )
  serviceForm.value = {
    code: srv.code || '',
    name: srv.name || '',
    categoryId: catMatch ? catMatch.id : ((srv as any).categoryId || null),
    category: srv.category || catMatch?.name || '',
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
  if (!serviceForm.value.categoryId) {
    showFeedback('Debe seleccionar obligatoriamente una categoría para el servicio', 'error')
    return
  }
  const matched = categoriesList.value.find(c => c.id === serviceForm.value.categoryId)
  if (matched) serviceForm.value.category = matched.name

  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    const payload = {
      ...serviceForm.value,
      companyId,
      categoryId: serviceForm.value.categoryId,
      category_id: serviceForm.value.categoryId,
      category: serviceForm.value.category
    }
    if (editingServiceId.value) {
      await updateInventoryService(editingServiceId.value, payload)
      showFeedback('Servicio actualizado correctamente')
    } else {
      await createInventoryService(payload)
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
const isFormOpen = computed(() =>
  showItemModal.value ||
  showServiceModal.value ||
  showSubcontractModal.value ||
  showCategoryModal.value ||
  showWarehouseModal.value ||
  showTransferModal.value ||
  showAdjustmentModal.value
)
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
  categoryId: null as number | null,
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

const onSubcontractCategorySelect = () => {
  const found = categoriesList.value.find(c => c.id === subcontractForm.value.categoryId)
  if (found) {
    subcontractForm.value.specialty = found.name
  }
}

const openCreateSubcontract = () => {
  editingSubcontractId.value = null
  const firstCat = laborCategories.value[0] || null
  subcontractForm.value = {
    code: '',
    name: '',
    categoryId: firstCat ? firstCat.id : null,
    specialty: firstCat ? firstCat.name : 'Ingeniería / Técnico',
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
    categoryId: (sub as any).categoryId || null,
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
// 4. CRUD CATEGORÍAS
// ==========================================
const showCategoryModal = ref(false)
const editingCategoryId = ref<number | null>(null)
const categoryForm = ref({
  code: '',
  name: '',
  description: '',
  category_type: 'PRODUCT' as 'PRODUCT' | 'SERVICE' | 'LABOR' | 'ALL',
  status: true
})

const openCreateCategory = (initialType?: 'PRODUCT' | 'SERVICE' | 'LABOR' | 'ALL') => {
  editingCategoryId.value = null
  let defaultType: 'PRODUCT' | 'SERVICE' | 'LABOR' | 'ALL' = initialType || 'PRODUCT'
  if (!initialType) {
    if (activeTab.value === 'servicios') defaultType = 'SERVICE'
    else if (activeTab.value === 'subcontratacion') defaultType = 'LABOR'
  }
  categoryForm.value = {
    code: '',
    name: '',
    description: '',
    category_type: defaultType,
    status: true
  }
  showCategoryModal.value = true
}

const openEditCategory = (cat: InventoryCategory) => {
  editingCategoryId.value = cat.id
  categoryForm.value = {
    code: cat.code || '',
    name: cat.name || '',
    description: cat.description || '',
    category_type: (cat.category_type as any) || 'PRODUCT',
    status: Boolean(cat.status)
  }
  showCategoryModal.value = true
}

const saveCategoryForm = async () => {
  if (!categoryForm.value.name.trim()) {
    showFeedback('El nombre de la categoría es obligatorio', 'error')
    return
  }
  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    if (editingCategoryId.value) {
      await updateInventoryCategory(editingCategoryId.value, { ...categoryForm.value, companyId })
      showFeedback('Categoría actualizada con éxito')
    } else {
      await createInventoryCategory({ ...categoryForm.value, companyId })
      showFeedback('Categoría registrada con éxito')
    }
    showCategoryModal.value = false
    await loadAllInventory()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al guardar la categoría', 'error')
  } finally {
    saving.value = false
  }
}

const toggleCategoryStatus = async (cat: InventoryCategory) => {
  try {
    await updateInventoryCategory(cat.id, { companyId: getActiveCompanyId(), status: !cat.status })
    cat.status = !cat.status
    showFeedback(`Categoría "${cat.name}" ahora está ${cat.status ? 'activa' : 'inactiva'}`)
  } catch {
    showFeedback('No se pudo cambiar el estado de la categoría', 'error')
  }
}

// ==========================================
// 5. CRUD BODEGAS
// ==========================================
const showWarehouseModal = ref(false)
const editingWarehouseId = ref<number | null>(null)
const warehouseForm = ref({
  code: '',
  name: '',
  address: '',
  responsible: '',
  phone: '',
  isDefault: false,
  status: true
})

const openCreateWarehouse = () => {
  editingWarehouseId.value = null
  warehouseForm.value = {
    code: '',
    name: '',
    address: '',
    responsible: '',
    phone: '',
    isDefault: warehousesList.value.length === 0,
    status: true
  }
  showWarehouseModal.value = true
}

const openEditWarehouse = (wh: InventoryWarehouse) => {
  editingWarehouseId.value = wh.id
  warehouseForm.value = {
    code: wh.code || '',
    name: wh.name || '',
    address: wh.address || '',
    responsible: wh.responsible || '',
    phone: wh.phone || '',
    isDefault: Boolean(wh.isDefault),
    status: Boolean(wh.status)
  }
  showWarehouseModal.value = true
}

const saveWarehouseForm = async () => {
  if (!warehouseForm.value.name.trim()) {
    showFeedback('El nombre de la bodega es obligatorio', 'error')
    return
  }
  saving.value = true
  const companyId = getActiveCompanyId()
  try {
    if (editingWarehouseId.value) {
      await updateInventoryWarehouse(editingWarehouseId.value, { ...warehouseForm.value, companyId })
      showFeedback('Bodega actualizada con éxito')
    } else {
      await createInventoryWarehouse({ ...warehouseForm.value, companyId })
      showFeedback('Bodega registrada con éxito')
    }
    showWarehouseModal.value = false
    await loadAllInventory()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al guardar la bodega', 'error')
  } finally {
    saving.value = false
  }
}

const toggleWarehouseStatus = async (wh: InventoryWarehouse) => {
  try {
    await updateInventoryWarehouse(wh.id, { companyId: getActiveCompanyId(), status: !wh.status })
    wh.status = !wh.status
    showFeedback(`Bodega "${wh.name}" ahora está ${wh.status ? 'habilitada' : 'inactiva'}`)
  } catch {
    showFeedback('No se pudo cambiar el estado de la bodega', 'error')
  }
}

// ==========================================
// 6. KARDEX, TRANSFERENCIAS Y AJUSTES
// ==========================================
const loadKardex = async () => {
  loadingKardex.value = true
  try {
    const companyId = getActiveCompanyId()
    const pId = kardexProductFilter.value || undefined
    const wId = kardexWarehouseFilter.value || undefined
    kardexMovements.value = await getInventoryKardex(pId, companyId, wId)
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al consultar movimientos del Kardex', 'error')
  } finally {
    loadingKardex.value = false
  }
}

const viewItemKardex = (item: InventoryArticle) => {
  kardexProductFilter.value = item.id
  kardexWarehouseFilter.value = 0
  switchTab('kardex')
  loadKardex()
}

// Transferencias
const showTransferModal = ref(false)
const transferForm = ref({
  product_id: null as number | null,
  from_warehouse_id: null as number | null,
  to_warehouse_id: null as number | null,
  quantity: 1,
  notes: ''
})

const openCreateTransfer = () => {
  const p = itemsList.value[0] || null
  const wh1 = activeWarehouses.value[0] || null
  const wh2 = activeWarehouses.value[1] || activeWarehouses.value[0] || null
  transferForm.value = {
    product_id: p ? p.id : null,
    from_warehouse_id: wh1 ? wh1.id : null,
    to_warehouse_id: wh2 ? wh2.id : null,
    quantity: 1,
    notes: ''
  }
  showTransferModal.value = true
}

const saveTransferForm = async () => {
  if (!transferForm.value.product_id) {
    showFeedback('Debe seleccionar un producto para transferir', 'error')
    return
  }
  if (!transferForm.value.from_warehouse_id || !transferForm.value.to_warehouse_id) {
    showFeedback('Debe seleccionar bodega de origen y de destino', 'error')
    return
  }
  if (transferForm.value.from_warehouse_id === transferForm.value.to_warehouse_id) {
    showFeedback('La bodega de origen y destino no pueden ser la misma', 'error')
    return
  }
  if (Number(transferForm.value.quantity) <= 0) {
    showFeedback('La cantidad a transferir debe ser mayor a cero', 'error')
    return
  }

  saving.value = true
  try {
    await createInventoryTransfer({
      companyId: getActiveCompanyId(),
      product_id: transferForm.value.product_id,
      from_warehouse_id: transferForm.value.from_warehouse_id,
      to_warehouse_id: transferForm.value.to_warehouse_id,
      quantity: Number(transferForm.value.quantity),
      notes: transferForm.value.notes
    })
    showFeedback('Transferencia registrada exitosamente')
    showTransferModal.value = false
    await loadAllInventory()
    await loadKardex()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al procesar la transferencia', 'error')
  } finally {
    saving.value = false
  }
}

// Ajustes físicos de stock
const showAdjustmentModal = ref(false)
const adjustmentForm = ref({
  product_id: null as number | null,
  warehouse_id: null as number | null,
  new_stock: 0,
  unit_cost: 0,
  reason: 'COUNT_CORRECTION'
})

const openCreateAdjustment = () => {
  const p = itemsList.value[0] || null
  const wh = activeWarehouses.value.find(w => w.isDefault) || activeWarehouses.value[0] || null
  adjustmentForm.value = {
    product_id: p ? p.id : null,
    warehouse_id: wh ? wh.id : null,
    new_stock: p ? Number(p.stockCurrent || 0) : 0,
    unit_cost: p ? Number(p.costPrice || 0) : 0,
    reason: 'COUNT_CORRECTION'
  }
  showAdjustmentModal.value = true
}

const onAdjustmentProductChange = () => {
  const p = itemsList.value.find(i => i.id === adjustmentForm.value.product_id)
  if (p) {
    adjustmentForm.value.unit_cost = Number(p.costPrice || 0)
    adjustmentForm.value.new_stock = Number(p.stockCurrent || 0)
  }
}

const saveAdjustmentForm = async () => {
  if (!adjustmentForm.value.product_id) {
    showFeedback('Debe seleccionar un producto para el ajuste', 'error')
    return
  }
  if (!adjustmentForm.value.warehouse_id) {
    showFeedback('Debe seleccionar una bodega para el ajuste', 'error')
    return
  }
  if (Number(adjustmentForm.value.new_stock) < 0) {
    showFeedback('El nuevo stock físico no puede ser negativo', 'error')
    return
  }

  saving.value = true
  try {
    await createInventoryAdjustment({
      companyId: getActiveCompanyId(),
      product_id: adjustmentForm.value.product_id,
      warehouse_id: adjustmentForm.value.warehouse_id,
      new_stock: Number(adjustmentForm.value.new_stock),
      unit_cost: Number(adjustmentForm.value.unit_cost || 0),
      reason: adjustmentForm.value.reason
    })
    showFeedback('Ajuste de inventario registrado con éxito')
    showAdjustmentModal.value = false
    await loadAllInventory()
    await loadKardex()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'Error al registrar el ajuste de stock', 'error')
  } finally {
    saving.value = false
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
  } else if (activeTab.value === 'categorias') {
    openCreateCategory()
  } else if (activeTab.value === 'bodegas') {
    openCreateWarehouse()
  } else if (activeTab.value === 'kardex') {
    openCreateAdjustment()
  } else {
    openCreateItem()
  }
}

const deletingId = ref<number | null>(null)

const confirmDelete = async (tab: InventoryTab, record: any) => {
  const companyId = getActiveCompanyId()
  if (!window.confirm(`¿Estás seguro de eliminar "${record.name}" (${record.code})?`)) return
  deletingId.value = record.id
  try {
    if (tab === 'articulos') {
      await deleteInventoryItem(record.id, companyId)
    } else if (tab === 'servicios') {
      await deleteInventoryService(record.id, companyId)
    } else if (tab === 'subcontratacion') {
      await deleteInventorySubcontract(record.id, companyId)
    } else if (tab === 'categorias') {
      await deleteInventoryCategory(record.id, companyId)
    } else if (tab === 'bodegas') {
      await deleteInventoryWarehouse(record.id, companyId)
    }
    showFeedback(`Registro ${record.code} eliminado correctamente`)
    await loadAllInventory()
    if (activeTab.value === 'kardex') await loadKardex()
  } catch (err: any) {
    showFeedback(err?.response?.data?.message || 'No se pudo eliminar el registro', 'error')
  } finally {
    deletingId.value = null
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

.mod-code-badge.cat {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}

.mod-code-badge.bod {
  background: rgba(6, 182, 212, 0.18);
  color: #22d3ee;
  border-color: rgba(34, 211, 238, 0.3);
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

.code-chip.cat {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.code-chip.bod {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
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
