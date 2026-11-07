<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const selectedCompany = ref<any>(null)
const selectedBranch = ref<any>(null)
const userName = ref('Mike Nielsen')

let chartTotalOrders: any = null
let chartProducts: any = null
let chartNetsells: any = null
let chartCustomers: any = null

const handleBackBlock = () => {
  window.history.pushState(null, '', window.location.href)
}

const destroyCharts = () => {
  if (chartTotalOrders) { chartTotalOrders.destroy(); chartTotalOrders = null }
  if (chartProducts) { chartProducts.destroy(); chartProducts = null }
  if (chartNetsells) { chartNetsells.destroy(); chartNetsells = null }
  if (chartCustomers) { chartCustomers.destroy(); chartCustomers = null }
}

watch(() => themeStore.themeMode, () => {
  destroyCharts()
  setTimeout(() => {
    if ((window as any).ApexCharts) {
      initCharts()
    }
  }, 100)
})

onMounted(() => {
  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', handleBackBlock)
  const comp = localStorage.getItem('selectedCompany')
  if (comp) {
    try { selectedCompany.value = JSON.parse(comp) } catch (e) {}
  }
  const branch = localStorage.getItem('selectedBranch')
  if (branch) {
    try { selectedBranch.value = JSON.parse(branch) } catch (e) {}
  }
  const payload = authStore.tokenPayload
  if (payload?.user_name) {
    userName.value = payload.user_name
  }

  setTimeout(() => {
    if ((window as any).ApexCharts) {
      initCharts()
    }
  }, 200)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handleBackBlock)
  if (chartTotalOrders) chartTotalOrders.destroy()
  if (chartProducts) chartProducts.destroy()
  if (chartNetsells) chartNetsells.destroy()
  if (chartCustomers) chartCustomers.destroy()
})

const initCharts = () => {
  const ApexCharts = (window as any).ApexCharts
  const isDark = themeStore.isDark

  // 1. Total Orders Bar Chart
  const elTotalOrders = document.querySelector("#total-orders")
  if (elTotalOrders && !chartTotalOrders) {
    chartTotalOrders = new ApexCharts(elTotalOrders, {
      series: [
        { name: "Anterior", data: [29, 52, 38, 47, 56, 41, 46] },
        { name: "Actual", data: [71, 71, 71, 71, 71, 71, 71] },
      ],
      chart: {
        fontFamily: "inherit",
        type: "bar",
        height: 140,
        stacked: true,
        toolbar: { show: false },
        foreColor: isDark ? "#707a82" : "#94a3b8",
      },
      grid: { show: false },
      colors: ["#0d6efd", isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0"],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "28%",
          borderRadius: 3,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["L", "M", "M", "J", "V", "S", "D"],
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { show: false },
      tooltip: { theme: isDark ? "dark" : "light" },
      legend: { show: false },
    })
    chartTotalOrders.render()
  }

  // 2. Donut Profit Chart
  const elProducts = document.querySelector("#products")
  if (elProducts && !chartProducts) {
    chartProducts = new ApexCharts(elProducts, {
      series: [70, 18, 12],
      labels: ["2026", "2025", "2024"],
      chart: {
        height: 160,
        type: "donut",
        fontFamily: "inherit",
        foreColor: isDark ? "#adb0bb" : "#64748b",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "82%",
          },
        },
      },
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },
      colors: ["#0d6efd", "#dc3545", "#0dcaf0"],
      tooltip: { theme: isDark ? "dark" : "light" },
    })
    chartProducts.render()
  }

  // 3. Weekly Order Updates Line Chart
  const elNetsells = document.querySelector("#netsells")
  if (elNetsells && !chartNetsells) {
    chartNetsells = new ApexCharts(elNetsells, {
      series: [
        { name: "Ventas", data: [0, 20, 15, 19, 14, 25, 32] },
        { name: "Metas", data: [0, 12, 19, 13, 26, 16, 25] },
      ],
      chart: {
        fontFamily: "inherit",
        foreColor: isDark ? "#adb0bb" : "#64748b",
        height: 220,
        type: "line",
        toolbar: { show: false },
      },
      legend: { show: false },
      stroke: { width: 3, curve: "smooth" },
      grid: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5eaef",
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
      },
      colors: ["#0d6efd", "#0dcaf0"],
      xaxis: {
        categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (v: number) => `$${v}k`,
        },
      },
      tooltip: { theme: isDark ? "dark" : "light" },
    })
    chartNetsells.render()
  }

  // 4. Customers Area Sparkline
  const elCustomers = document.querySelector("#customers")
  if (elCustomers && !chartCustomers) {
    chartCustomers = new ApexCharts(elCustomers, {
      chart: {
        type: "area",
        height: 100,
        sparkline: { enabled: true },
        fontFamily: "inherit",
      },
      series: [{ name: "Clientes", data: [25, 66, 20, 40, 12, 30] }],
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 0,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [20, 100],
        },
      },
      colors: ["#0dcaf0"],
      tooltip: { theme: isDark ? "dark" : "light" },
    })
    chartCustomers.render()
  }
}
</script>

<template>
  <div class="dashboard-container">
    
    <!-- FILA SUPERIOR -->
    <div class="row g-4 mb-4">
      
      <!-- 1. EARNING CARD -->
      <div class="col-xl-3 col-md-6">
        <div class="card h-100 rounded-4 border shadow-sm p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span class="text-muted fs-3 fw-medium">Earning</span>
              <h3 class="fw-bold mb-0 mt-1">$12,389</h3>
            </div>
            <span class="badge bg-warning-subtle text-warning fs-2 px-2 py-1 rounded-pill">
              -3.8%
            </span>
          </div>
          <small class="text-muted d-block mb-3">Last 7 Days</small>

          <!-- Gráfico de barras -->
          <div id="total-orders" class="mb-3"></div>

          <!-- Leyendas -->
          <div class="d-flex justify-content-between pt-2 border-top">
            <div class="d-flex align-items-center gap-2">
              <span class="p-1 rounded-circle bg-primary"></span>
              <span class="text-muted fs-2">Facturado</span>
              <span class="fw-bold fs-2">52%</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="p-1 rounded-circle bg-info"></span>
              <span class="text-muted fs-2">Cobrado</span>
              <span class="fw-bold fs-2">48%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. CONGRATULATIONS HERO CARD (CENTRO) -->
      <div class="col-xl-6 col-md-12 order-xl-2 order-1">
        <div class="card h-100 rounded-4 border shadow-sm p-4 overflow-hidden position-relative hero-card">
          <div class="row align-items-center h-100">
            
            <!-- Texto y estadísticas -->
            <div class="col-lg-7 col-md-8 position-relative z-1">
              <h4 class="card-title fw-bold mb-1">
                Congratulations {{ userName }}
              </h4>
              <p class="text-muted fs-3 mb-4">
                Has seleccionado la sucursal 
                <span class="text-info fw-semibold">{{ selectedBranch?.name || 'Quito Norte (001)' }}</span> 
                en <span class="fw-semibold">{{ selectedCompany?.razon_social || 'Deskounta' }}</span>.
              </p>

              <div class="d-flex flex-column gap-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="stat-icon bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:bag-check-line-duotone" class="fs-6"></iconify-icon>
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold">64 nuevas facturas</h6>
                    <small class="text-muted">Procesadas en el sistema</small>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <div class="stat-icon bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:clock-circle-line-duotone" class="fs-6"></iconify-icon>
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold">4 órdenes</h6>
                    <small class="text-muted">En espera de validación</small>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <div class="stat-icon bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:delivery-line-duotone" class="fs-6"></iconify-icon>
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold">12 entregas</h6>
                    <small class="text-muted">Completadas con éxito</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ilustración 3D de Spike Admin -->
            <div class="col-lg-5 col-md-4 text-center position-relative">
              <img
                src="/controller/images/backgrounds/man-working-on-laptop.png"
                alt="man-working"
                class="img-fluid character-img"
              />
            </div>

          </div>
        </div>
      </div>

      <!-- 3. PROFIT CARD (DERECHA) -->
      <div class="col-xl-3 col-md-6 order-xl-3 order-2">
        <div class="card h-100 rounded-4 border shadow-sm p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span class="text-muted fs-3 fw-medium">Profit</span>
              <h3 class="fw-bold mb-0 mt-1">432</h3>
            </div>
            <span class="badge bg-success-subtle text-success fs-2 px-2 py-1 rounded-pill">
              +26.5%
            </span>
          </div>
          <small class="text-muted d-block mb-2">Years</small>

          <!-- Donut chart -->
          <div id="products" class="d-flex justify-content-center my-2"></div>

          <div class="text-center pt-3 border-top">
            <p class="text-muted fs-2 mb-0">
              <strong class="text-body">$18k Profit</strong> más que en años anteriores
            </p>
          </div>
        </div>
      </div>

    </div>

    <!-- FILA INFERIOR -->
    <div class="row g-4">
      
      <!-- 4. LATEST DEAL -->
      <div class="col-xl-3 col-md-6">
        <div class="card h-100 rounded-4 border shadow-sm p-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted fs-3 fw-medium">Latest Deal</span>
            <span class="badge bg-success-subtle text-success fs-2 px-2 py-1 rounded-pill">
              86.5%
            </span>
          </div>
          <small class="text-muted d-block mb-4">Last 7 Days</small>

          <div class="d-flex justify-content-between mb-4">
            <div>
              <h4 class="fw-bold mb-1">$98,500</h4>
              <small class="text-muted">Meta mensual</small>
            </div>
            <div class="text-end">
              <h4 class="fw-bold text-info mb-1">$122,900</h4>
              <small class="text-muted">Total alcanzado</small>
            </div>
          </div>

          <div class="progress" style="height: 8px; background-color: var(--bs-subtle-bg);">
            <div class="progress-bar bg-primary" role="progressbar" style="width: 86.5%;"></div>
          </div>
        </div>
      </div>

      <!-- 5. TOTAL ORDERS / GRÁFICO PRINCIPAL DE VENTAS -->
      <div class="col-xl-6 col-md-12">
        <div class="card h-100 rounded-4 border shadow-sm p-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h5 class="card-title fw-bold mb-1">Total Orders</h5>
              <small class="text-muted">Weekly Order Updates</small>
            </div>
            <span class="badge bg-light-subtle text-primary border px-3 py-2 rounded-pill">
              This Week
            </span>
          </div>

          <div id="netsells"></div>
        </div>
      </div>

      <!-- 6. CUSTOMERS CARD -->
      <div class="col-xl-3 col-md-6">
        <div class="card h-100 rounded-4 border shadow-sm p-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="text-muted fs-3 fw-medium">Customers</span>
              <h3 class="fw-bold mb-0 mt-1">6,380</h3>
            </div>
            <span class="badge bg-success-subtle text-success fs-2 px-2 py-1 rounded-pill">
              +26.5%
            </span>
          </div>
          <small class="text-muted d-block mb-3">Last 7 Days</small>

          <div id="customers" class="mt-2"></div>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
[data-bs-theme="dark"] .bg-navy-card {
  background-color: #0d182e !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

[data-bs-theme="light"] .bg-navy-card {
  background-color: #ffffff !important;
  border: 1px solid #e5eaef !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
}

[data-bs-theme="dark"] .hero-card {
  background: radial-gradient(circle at right top, rgba(13, 110, 253, 0.15), transparent 60%), #0d182e !important;
}

[data-bs-theme="light"] .hero-card {
  background: radial-gradient(circle at right top, rgba(13, 110, 253, 0.08), transparent 60%), #ffffff !important;
  border: 1px solid #e5eaef !important;
}

.stat-icon {
  width: 44px;
  height: 44px;
}

.character-img {
  max-height: 220px;
  filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.2));
}
</style>