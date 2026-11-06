<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const emit = defineEmits(['toggle-sidebar'])

const selectedCompany = ref<any>(null)
const selectedBranch = ref<any>(null)
const userName = ref('Usuario')

onMounted(() => {
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
})

const logout = () => {
  authStore.logout()
  localStorage.removeItem('selectedCompany')
  localStorage.removeItem('selectedBranch')
  router.replace('/login')
}

const changeCompany = () => {
  router.push({ path: '/companies', query: { cambiar: 'true' } })
}
</script>

<template>
  <header class="app-header position-relative py-2 px-3 border-bottom border-dark-subtle">
    <nav class="navbar navbar-expand-lg navbar-dark p-0 d-flex align-items-center justify-content-between">
      
      <!-- LADO IZQUIERDO: TOGGLER + EMPRESA / SUCURSAL ACTIVA -->
      <div class="d-flex align-items-center gap-3">
        <button
          class="nav-link sidebartoggler p-2 rounded-circle hover-bg d-flex align-items-center justify-content-center text-white"
          type="button"
          @click="emit('toggle-sidebar')"
          title="Colapsar / Expandir menú"
        >
          <iconify-icon icon="solar:hamburger-menu-line-duotone" class="fs-6"></iconify-icon>
        </button>

        <!-- Context Badge: Empresa y Sucursal -->
        <div class="d-none d-md-flex align-items-center gap-2 bg-dark-subtle px-3 py-1 rounded-pill border border-secondary-subtle">
          <iconify-icon icon="solar:buildings-3-line-duotone" class="text-primary fs-5"></iconify-icon>
          <span class="fw-semibold text-white fs-3">
            {{ selectedCompany?.razon_social || selectedCompany?.nombre_comercial || 'Deskounta' }}
          </span>
          <span class="text-secondary mx-1">|</span>
          <iconify-icon icon="solar:shop-2-line-duotone" class="text-info fs-5"></iconify-icon>
          <span class="text-info-emphasis fs-2">
            {{ selectedBranch?.name ? `${selectedBranch.name} (${selectedBranch.code})` : 'Sucursal General' }}
          </span>
          <button class="btn btn-xs btn-outline-primary ms-2 rounded-pill px-2 py-0 fs-1" @click="changeCompany" title="Cambiar Empresa / Sucursal">
            Cambiar
          </button>
        </div>
      </div>

      <!-- CENTRO: BARRA DE BÚSQUEDA ESTILO SPIKE -->
      <div class="d-none d-lg-block w-25">
        <div class="input-group">
          <span class="input-group-text bg-dark-subtle border-0 text-secondary">
            <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
          </span>
          <input
            type="text"
            class="form-control bg-dark-subtle border-0 text-white shadow-none ps-0"
            placeholder="Buscar en el sistema..."
          />
        </div>
      </div>

      <!-- LADO DERECHO: ACCIONES + PERFIL DE USUARIO + BOTÓN SALIR -->
      <div class="d-flex align-items-center gap-2 gap-md-3">
        
        <!-- Notificaciones -->
        <button class="nav-link p-2 rounded-circle hover-bg d-flex align-items-center justify-content-center text-white" type="button">
          <iconify-icon icon="solar:bell-bing-line-duotone" class="fs-6"></iconify-icon>
        </button>

        <!-- Perfil de usuario -->
        <div class="dropdown">
          <a
            class="nav-link d-flex align-items-center gap-2 p-1 rounded-pill hover-bg text-decoration-none"
            href="javascript:void(0)"
            id="drop2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <img
              src="/controller/images/profile/user-1.jpg"
              alt="user"
              width="36"
              height="36"
              class="rounded-circle border border-primary border-2"
            />
            <div class="d-none d-md-block text-start pe-2">
              <span class="d-block fw-bold fs-2 text-white lh-1">{{ userName }}</span>
              <small class="text-info fs-1">
                {{ authStore.accessInfo?.roleName || (authStore.tokenPayload?.super_admin ? 'Super Admin' : 'Usuario') }}
              </small>
            </div>
            <iconify-icon icon="solar:alt-arrow-down-line-duotone" class="text-secondary fs-4"></iconify-icon>
          </a>

          <div class="dropdown-menu dropdown-menu-end shadow-lg rounded-3 py-2 border-0 bg-dark" aria-labelledby="drop2" style="min-width: 200px;">
            <div class="px-3 py-2 border-bottom border-dark-subtle">
              <span class="d-block text-white fw-bold">{{ userName }}</span>
              <small class="text-muted">jc@gmail.com</small>
            </div>
            <a class="dropdown-item d-flex align-items-center gap-2 py-2 text-white-50" href="javascript:void(0)" @click="changeCompany">
              <iconify-icon icon="solar:buildings-3-line-duotone" class="fs-5 text-primary"></iconify-icon>
              <span>Cambiar Sucursal</span>
            </a>
            <div class="dropdown-divider border-dark-subtle"></div>
            <a class="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" href="javascript:void(0)" @click="logout">
              <iconify-icon icon="solar:logout-2-line-duotone" class="fs-5"></iconify-icon>
              <span>Cerrar Sesión</span>
            </a>
          </div>
        </div>

        <!-- Botón Salir Directo -->
        <button
          class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 rounded-pill px-3 py-1 ms-1"
          @click="logout"
          title="Cerrar Sesión"
        >
          <iconify-icon icon="solar:logout-2-line-duotone" class="fs-4"></iconify-icon>
          <span class="d-none d-sm-inline fw-semibold">Salir</span>
        </button>

      </div>
    </nav>
  </header>
</template>

<style scoped>
.hover-bg:hover {
  background: rgba(255, 255, 255, 0.08);
}
.btn-xs {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}
</style>
