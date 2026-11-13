<template>
  <div class="reports-hub-page">
    <!-- CABECERA PRINCIPAL -->
    <div class="card shadow-sm border-0 rounded-4 mb-4">
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-2 rounded-pill">
                <iconify-icon icon="solar:chart-square-bold-duotone" class="align-middle me-1"></iconify-icon>
                CENTRO DE REPORTES ERP
              </span>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-2 rounded-pill">
                DESKOUNTA ENTERPRISE
              </span>
            </div>
            <h3 class="fw-bold mb-1" style="color: var(--bs-text-title);">
              Catálogo General de Reportes e Informes
            </h3>
            <p class="text-muted fs-3 mb-0">
              Selecciona un informe por área comercial, tributaria, inventario, contable o administrativa para consultar y exportar información.
            </p>
          </div>

          <!-- BUSCADOR EN VIVO DE REPORTES -->
          <div class="search-box-wrapper" style="min-width: 280px; max-width: 400px;">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0">
                <iconify-icon icon="solar:magnifer-line-duotone" class="text-primary fs-4"></iconify-icon>
              </span>
              <input
                type="text"
                v-model="searchQuery"
                class="form-control border-start-0 rounded-end-3"
                placeholder="Buscar reporte (ej. ventas, kardex, sri, compras)..."
              />
              <button
                v-if="searchQuery"
                class="btn btn-outline-secondary"
                type="button"
                @click="searchQuery = ''"
              >
                <iconify-icon icon="solar:close-circle-line-duotone"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MENSAJE SI LA BÚSQUEDA NO COINCIDE -->
    <div v-if="filteredCategories.length === 0" class="card shadow-sm border-0 rounded-4 p-5 text-center mb-4">
      <iconify-icon icon="solar:magnifer-broken" class="fs-10 text-muted mb-2"></iconify-icon>
      <h5 class="fw-bold mb-1">No se encontraron reportes con "{{ searchQuery }}"</h5>
      <p class="text-muted fs-2 mb-3">Intenta con otra palabra clave como ventas, compras, inventario, etc.</p>
      <div>
        <button class="btn btn-primary btn-sm rounded-pill px-3" @click="searchQuery = ''">
          Ver todos los reportes
        </button>
      </div>
    </div>

    <!-- GRID DE COLUMNAS DE REPORTES SEPARADOS POR MÓDULOS -->
    <div v-else class="reports-grid">
      <div
        v-for="cat in filteredCategories"
        :key="cat.id"
        class="report-category-col"
      >
        <div class="card h-100 border-0 shadow-sm rounded-4 report-category-card">
          <!-- CABECERA DE LA CATEGORÍA CON ICONO -->
          <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4 text-center">
            <div class="category-icon-box mx-auto mb-3" :class="cat.iconBgClass">
              <iconify-icon :icon="cat.icon" class="fs-8"></iconify-icon>
            </div>
            <h5 class="category-title fw-bold text-uppercase mb-1">
              {{ cat.title }}
            </h5>
            <small class="text-muted fs-1 d-block">{{ cat.subtitle }}</small>
          </div>

          <!-- LISTA DE REPORTES DE LA CATEGORÍA -->
          <div class="card-body p-3 pt-2">
            <div class="list-group list-group-flush border-0">
              <a
                v-for="rep in cat.reports"
                :key="rep.title"
                href="javascript:void(0)"
                class="list-group-item list-group-item-action border-0 rounded-3 mb-1 px-3 py-2 report-item d-flex align-items-center justify-content-between gap-2"
                :class="{ 'item-active-route': rep.route, 'item-roadmap': !rep.route }"
                @click="handleReportClick(rep)"
                :title="rep.description || rep.title"
              >
                <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                  <iconify-icon
                    :icon="rep.icon || 'solar:document-text-line-duotone'"
                    class="fs-4 flex-shrink-0"
                    :class="rep.route ? 'text-primary' : 'text-muted'"
                  ></iconify-icon>
                  <span class="report-title fs-2 text-truncate" :class="{ 'fw-semibold': rep.route }">
                    {{ rep.title }}
                  </span>
                  <!-- ETIQUETA PENDIENTE SOLO VISIBLE PARA SUPER ADMIN -->
                  <span
                    v-if="!rep.route && isSuperAdmin"
                    class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-0 fs-1 flex-shrink-0"
                  >
                    Pendiente
                  </span>
                </div>

                <div class="d-flex align-items-center gap-1 flex-shrink-0">
                  <span
                    v-if="rep.route"
                    class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0 fs-1"
                  >
                    Abrir
                  </span>
                  <iconify-icon
                    v-if="rep.route"
                    icon="solar:arrow-right-line-duotone"
                    class="fs-4 text-primary"
                  ></iconify-icon>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/utils/toastr'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')

const isSuperAdmin = computed(() => {
  return Boolean(
    authStore.tokenPayload?.super_admin ||
    authStore.tokenPayload?.developer ||
    authStore.accessInfo?.isSuperAdmin
  )
})

// Módulos y URLs autorizados para el rol del usuario
const allowedModules = computed(() => (authStore.accessInfo?.moduleCodes || []).map((c: string) => c.toUpperCase()))
const allowedUrls = computed(() => (authStore.accessInfo?.allowedUrls || []).map((u: string) => u.toLowerCase()))

// Comprobar si un reporte es accesible según el rol
const canUserAccessReport = (catId: string, rep: ReportItem) => {
  // Los Super Administradores ven todos los reportes (disponibles y pendientes)
  if (isSuperAdmin.value) return true

  // Los usuarios regulares NO pueden ver reportes que aún no estén disponibles
  if (!rep.route) return false

  // Validar permisos por rol en cada módulo
  if (catId === 'ventas') {
    return (
      allowedModules.value.includes('MOD-001') ||
      allowedUrls.value.some((u: string) => u.includes('venta') || u.includes('factura'))
    )
  }
  if (catId === 'compras') {
    return (
      allowedModules.value.includes('MOD-002') ||
      allowedUrls.value.some((u: string) => u.includes('compra'))
    )
  }
  if (catId === 'inventario') {
    return (
      allowedModules.value.includes('MOD-003') ||
      allowedUrls.value.some((u: string) => u.includes('inventario') || u.includes('kardex') || u.includes('articulo') || u.includes('bodega'))
    )
  }
  if (catId === 'contables') {
    return (
      allowedModules.value.includes('MOD-004') ||
      allowedUrls.value.some((u: string) => u.includes('contab') || u.includes('asiento') || u.includes('cuenta'))
    )
  }
  if (catId === 'administrativos') {
    return (
      allowedModules.value.includes('MOD-005') ||
      allowedUrls.value.some((u: string) => u.includes('admin') || u.includes('gerenc'))
    )
  }

  return true
}

interface ReportItem {
  title: string
  description?: string
  icon?: string
  route?: string
  badge?: string
}

interface ReportCategory {
  id: string
  title: string
  subtitle: string
  icon: string
  iconBgClass: string
  reports: ReportItem[]
}

// Estructura completa de reportes de Deskounta conforme a la imagen de referencia
const categories: ReportCategory[] = [
  // 1. REPORTES DE VENTAS
  {
    id: 'ventas',
    title: 'Reportes de Ventas',
    subtitle: 'Comprobantes, facturación e impuestos SRI',
    icon: 'solar:bill-list-bold-duotone',
    iconBgClass: 'icon-box-blue',
    reports: [
      {
        title: 'Facturas y Notas de Crédito (Liquidación SRI)',
        description: 'Bases imponibles IVA 15% / 0%, estado SRI, exportación a Excel e impresión',
        icon: 'solar:document-text-bold-duotone',
        route: '/ventas/reportes',
      },
      {
        title: 'Ventas por Producto y Servicio',
        description: 'Detalle de cantidades y montos facturados por ítem',
        icon: 'solar:box-minimalistic-line-duotone',
      },
      {
        title: 'Ventas por Producto Consolidado',
        description: 'Resumen consolidado de productos vendidos',
        icon: 'solar:chart-2-line-duotone',
      },
      {
        title: 'Ventas por Cliente / Razón Social',
        description: 'Historial de compras agrupado por cliente',
        icon: 'solar:users-group-two-rounded-line-duotone',
      },
      {
        title: 'Cuentas por Cobrar Clientes',
        description: 'Saldos pendientes y cartera de clientes',
        icon: 'solar:card-recive-line-duotone',
      },
      {
        title: 'Cuentas por Cobrar x Días Vencidos',
        description: 'Antigüedad de saldos de clientes (1 a 30, 60, 90+ días)',
        icon: 'solar:calendar-date-line-duotone',
      },
      {
        title: 'Reporte Facturas de Exportación',
        description: 'Comprobantes emitidos con régimen de exportación',
        icon: 'solar:global-line-duotone',
      },
      {
        title: 'Estado de Cuenta Cliente',
        description: 'Movimientos de débitos y créditos por cliente',
        icon: 'solar:user-id-line-duotone',
      },
    ],
  },

  // 2. REPORTES DE COMPRAS
  {
    id: 'compras',
    title: 'Reportes de Compras',
    subtitle: 'Adquisiciones, proveedores y gastos',
    icon: 'solar:cart-large-4-bold-duotone',
    iconBgClass: 'icon-box-cyan',
    reports: [
      {
        title: 'Documentos y Facturas de Compra',
        description: 'Registro de compras a proveedores con sustento tributario',
        icon: 'solar:bag-check-bold-duotone',
        route: '/compras',
      },
      {
        title: 'Compras por Producto e Insumo',
        description: 'Detalle de productos y costos adquiridos',
        icon: 'solar:box-line-duotone',
      },
      {
        title: 'Compras por Formas de Pago',
        description: 'Desglose de compras según el medio financiero utilizado',
        icon: 'solar:card-2-line-duotone',
      },
      {
        title: 'Cuentas por Pagar Proveedores',
        description: 'Obligaciones y pagos pendientes a proveedores',
        icon: 'solar:card-send-line-duotone',
      },
      {
        title: 'Cuentas por Pagar x Días Vencidos',
        description: 'Antigüedad de deudas con proveedores',
        icon: 'solar:calendar-line-duotone',
      },
      {
        title: 'Reporte Días Vencidos y Por Vencer',
        description: 'Proyección de compromisos a corto y mediano plazo',
        icon: 'solar:clock-circle-line-duotone',
      },
      {
        title: 'Cuentas por Pagar Resumen',
        description: 'Consolidado general de deudas por proveedor',
        icon: 'solar:wallet-money-line-duotone',
      },
      {
        title: 'Retenciones en Compras SRI',
        description: 'Retenciones en la fuente e IVA emitidas',
        icon: 'solar:diploma-verified-line-duotone',
      },
    ],
  },

  // 3. REPORTES DE INVENTARIO Y BODEGAS
  {
    id: 'inventario',
    title: 'Reportes de Inventario',
    subtitle: 'Kardex, existencias y movimientos',
    icon: 'solar:box-minimalistic-bold-duotone',
    iconBgClass: 'icon-box-purple',
    reports: [
      {
        title: 'Kardex Físico y Valorado (Ponderado)',
        description: 'Movimientos de entradas, salidas y costo promedio ponderado',
        icon: 'solar:clipboard-list-bold-duotone',
        route: '/inventario?tab=kardex',
      },
      {
        title: 'Existencias y Balances por Bodega',
        description: 'Stock físico y valorizado en cada bodega o sucursal',
        icon: 'solar:buildings-2-bold-duotone',
        route: '/inventario?tab=bodegas',
      },
      {
        title: 'Catálogo de Artículos y Precios',
        description: 'Listado de ítems con sus precios de venta y stock',
        icon: 'solar:tag-horizontal-bold-duotone',
        route: '/inventario?tab=articulos',
      },
      {
        title: 'Catálogo de Servicios y Subcontratación',
        description: 'Servicios registrados sin control de existencias físicas',
        icon: 'solar:diploma-bold-duotone',
        route: '/inventario?tab=servicios',
      },
      {
        title: 'Ajustes y Transferencias de Stock',
        description: 'Movimientos de ajustes manuales e ingresos directos',
        icon: 'solar:sort-vertical-bold-duotone',
        route: '/inventario?tab=ajustes',
      },
      {
        title: 'Productos Bajo Stock Mínimo',
        description: 'Alertas de reabastecimiento y reposición de bodega',
        icon: 'solar:danger-triangle-line-duotone',
      },
      {
        title: 'Rotación y Antigüedad de Stock',
        description: 'Análisis de artículos de alta y baja rotación',
        icon: 'solar:history-line-duotone',
      },
    ],
  },

  // 4. REPORTES CONTABLES
  {
    id: 'contables',
    title: 'Reportes Contables',
    subtitle: 'Estados financieros y balances NIIF',
    icon: 'solar:calculator-minimalistic-bold-duotone',
    iconBgClass: 'icon-box-emerald',
    reports: [
      {
        title: 'Estado de Resultados Integral (P&L)',
        description: 'Ingresos, costos, gastos y utilidad neta del período',
        icon: 'solar:chart-square-line-duotone',
      },
      {
        title: 'Estado de Resultados Mensualizado',
        description: 'Evolución mensualizada de pérdidas y ganancias',
        icon: 'solar:chart-line-duotone',
      },
      {
        title: 'Estado de Situación Financiera',
        description: 'Balance General de Activos, Pasivos y Patrimonio',
        icon: 'solar:pie-chart-2-line-duotone',
      },
      {
        title: 'Estado de Situación Financiera Mensualizado',
        description: 'Comparativo mes a mes de la estructura patrimonial',
        icon: 'solar:graph-up-line-duotone',
      },
      {
        title: 'Índices Financieros',
        description: 'Ratios de liquidez, solvencia y rentabilidad operativa',
        icon: 'solar:tuning-square-2-line-duotone',
      },
      {
        title: 'Libro Diario General',
        description: 'Asientos contables cronológicos con partida doble',
        icon: 'solar:book-2-line-duotone',
      },
      {
        title: 'Libro Mayor General',
        description: 'Movimientos de débitos y créditos por cada cuenta contable',
        icon: 'solar:notebook-line-duotone',
      },
      {
        title: 'Libro Mayor por Cuentas',
        description: 'Detalle filtrado de cuentas del plan contable',
        icon: 'solar:folder-with-files-line-duotone',
      },
    ],
  },

  // 5. REPORTES ADMINISTRATIVOS Y GERENCIALES
  {
    id: 'administrativos',
    title: 'Reportes Administrativos',
    subtitle: 'Control gerencial, tendencias y auditoría',
    icon: 'solar:chart-2-bold-duotone',
    iconBgClass: 'icon-box-indigo',
    reports: [
      {
        title: 'Reporte Gerencial de Ventas',
        description: 'Resumen ejecutivo de ventas por sucursal y vendedor',
        icon: 'solar:presentation-graph-line-duotone',
      },
      {
        title: 'Reporte Gerencial de Compras',
        description: 'Resumen consolidado de costos y gastos por centro de costo',
        icon: 'solar:wallet-2-line-duotone',
      },
      {
        title: 'Compras vs. Ventas (Margen Bruto)',
        description: 'Comparativo de margen comercial y rentabilidad del negocio',
        icon: 'solar:scale-line-duotone',
      },
      {
        title: 'Productos Más Vendidos (Top Ventas)',
        description: 'Ranking de los productos con mayor volumen y facturación',
        icon: 'solar:cup-first-line-duotone',
      },
      {
        title: 'Productos Menos Vendidos',
        description: 'Identificación de ítems de baja salida y capital inmovilizado',
        icon: 'solar:sleeping-line-duotone',
      },
      {
        title: 'Tendencia de Facturación',
        description: 'Proyección y curva histórica de crecimiento comercial',
        icon: 'solar:graph-new-line-duotone',
      },
      {
        title: 'Ventas por Clientes',
        description: 'Comportamiento de compra y concentración de clientes',
        icon: 'solar:users-group-rounded-line-duotone',
      },
      {
        title: 'Estado del Negocio',
        description: 'Tablero consolidado de salud financiera y operativa',
        icon: 'solar:shield-check-line-duotone',
      },
    ],
  },
]

// Filtrado reactivo por rol y por buscador
const filteredCategories = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  return categories
    .map((cat) => {
      // 1. Filtrar primero los reportes según rol / disponibilidad
      const roleAllowedReports = cat.reports.filter((rep) => canUserAccessReport(cat.id, rep))

      // 2. Filtrar por buscador
      const matchCat = cat.title.toLowerCase().includes(query) || cat.subtitle.toLowerCase().includes(query)
      const matchingReports = roleAllowedReports.filter(
        (r) =>
          matchCat ||
          r.title.toLowerCase().includes(query) ||
          (r.description && r.description.toLowerCase().includes(query))
      )
      return {
        ...cat,
        reports: matchingReports,
      }
    })
    .filter((cat) => cat.reports.length > 0)
})

// Manejo de clic en un reporte
const handleReportClick = (rep: ReportItem) => {
  if (rep.route) {
    router.push(rep.route)
  } else {
    toast.info(
      `El informe "${rep.title}" se encuentra en preparación para la próxima versión de Deskounta.`,
      'Reporte en Desarrollo'
    )
  }
}
</script>

<style scoped>
.reports-hub-page {
  width: 100%;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.report-category-col {
  min-width: 0;
  display: flex;
}

.report-category-card {
  width: 100%;
  background: var(--bs-card-bg);
  border: 1px solid var(--bs-border-color) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.report-category-card:hover {
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12) !important;
}

.category-icon-box {
  width: 68px;
  height: 68px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box-blue {
  background: rgba(0, 133, 219, 0.15);
  color: #0085db;
  border: 1px solid rgba(0, 133, 219, 0.3);
}

.icon-box-cyan {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.icon-box-purple {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.icon-box-emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.icon-box-indigo {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.category-title {
  color: var(--bs-text-title);
  letter-spacing: 0.5px;
  font-size: 0.95rem;
}

.report-item {
  background: transparent;
  color: var(--bs-body-color);
  transition: background-color 0.18s ease, transform 0.18s ease;
  cursor: pointer;
}

.report-item:hover {
  background-color: var(--bs-subtle-bg);
  transform: translateX(3px);
}

.item-active-route {
  background-color: rgba(0, 133, 219, 0.05);
}

.item-active-route:hover {
  background-color: rgba(0, 133, 219, 0.12);
}

.report-title {
  color: var(--bs-heading-color);
}
</style>

