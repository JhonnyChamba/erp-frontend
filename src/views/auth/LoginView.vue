<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { getBranches } from '@/services/config.service'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/utils/toastr'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

watch(errorMessage, (msg) => {
  if (msg) toast.error(msg, 'Inicio de Sesión')
})

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const login = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor ingresa usuario y contraseña.'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)
    const payload = authStore.tokenPayload

    if (payload?.super_admin || payload?.developer || payload?.multi_company) {
      router.push('/companies')
    } else {
      const assignedCompId = payload?.company_id || 1
      localStorage.setItem(
        'selectedCompany',
        JSON.stringify({
          id: assignedCompId,
          razon_social: 'Deskounta',
          nombre_comercial: 'Deskounta',
        })
      )
      await authStore.fetchCompanyAccess(assignedCompId)
      // Si la empresa solo tiene una sucursal, se inicia directamente en ella
      localStorage.removeItem('selectedBranch')
      try {
        const res: any = await getBranches(assignedCompId, { onlyEnabled: true })
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
        if (list.length === 1) localStorage.setItem('selectedBranch', JSON.stringify(list[0]))
      } catch {
        // sin sucursal seleccionada: se continúa al dashboard
      }
      toast.success('¡Bienvenido al sistema!', 'Sesión Iniciada')
      router.push('/dashboard')
    }
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error)
    errorMessage.value =
      error.response?.data?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper d-flex align-items-center justify-content-center min-vh-100 p-3">
    <!-- Círculos de luz ambiental de fondo -->
    <div class="ambient-glow glow-1"></div>
    <div class="ambient-glow glow-2"></div>

    <!-- TARJETA PRINCIPAL DEL LOGIN PERFECTAMENTE CENTRADA Y CUADRADA -->
    <div class="login-card card border border-secondary-subtle rounded-4 shadow-2xl overflow-hidden position-relative z-1">
      <div class="row g-0 align-items-stretch">
        
        <!-- COLUMNA IZQUIERDA: ILUSTRACIÓN & BRANDING -->
        <div class="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 illustration-side border-end border-dark-subtle">
          <div>
            <img
              src="/controller/images/logos/logo-light.svg"
              alt="Deskounta Logo"
              height="38"
              class="mb-4"
            />
            <h3 class="fw-bold text-white mb-2 tracking-wide">
              Gestión Integral & Facturación Inteligente
            </h3>
            <p class="text-white-50 fs-3 mb-0">
              Control total de ventas, compras, clientes, inventario y sucursales en tiempo real.
            </p>
          </div>

          <div class="text-center my-4">
            <img
              src="/controller/images/backgrounds/login-security.png"
              alt="Seguridad Deskounta"
              class="img-fluid illustration-img"
              style="max-height: 270px; object-fit: contain;"
            />
          </div>

          <div class="d-flex align-items-center justify-content-between pt-3 border-top border-dark-subtle text-white-50 fs-2">
            <span>© 2026 Deskounta ERP</span>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">v1.3 Enterprise</span>
          </div>
        </div>

        <!-- COLUMNA DERECHA: FORMULARIO DE ACCESO -->
        <div class="col-lg-6 d-flex flex-column justify-content-center p-4 p-md-5 form-side bg-navy-card position-relative">
          <!-- Botón de Modo Oscuro / Claro en Login -->
          <div class="position-absolute top-0 end-0 p-3">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center border-0 p-2"
              @click="themeStore.toggleTheme"
              :title="themeStore.themeMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              style="width: 38px; height: 38px; background: rgba(255,255,255,0.08);"
            >
              <iconify-icon :icon="themeStore.themeMode === 'dark' ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'" class="fs-5 text-warning"></iconify-icon>
            </button>
          </div>

          <!-- Logo para vista móvil -->
          <div class="d-lg-none text-center mb-4">
            <img
              src="/controller/images/logos/logo-dark.svg"
              class="dark-logo"
              alt="Deskounta Logo"
              height="36"
            />
            <img
              src="/controller/images/logos/logo-light.svg"
              class="light-logo"
              alt="Deskounta Logo"
              height="36"
            />
          </div>

          <div class="mb-4">
            <h2 class="fw-bold text-white mb-1 fs-7">
              Bienvenido a <span class="text-primary-gradient">Deskounta</span>
            </h2>
            <p class="text-secondary fs-3 mb-0">
              Ingresa tus credenciales para acceder al sistema ERP.
            </p>
          </div>

          <!-- ALERTA DE ERROR ELEGANTE -->
          <div v-if="errorMessage" class="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-4" role="alert">
            <iconify-icon icon="solar:danger-triangle-line-duotone" class="fs-5 text-danger flex-shrink-0"></iconify-icon>
            <span class="fs-2">{{ errorMessage }}</span>
          </div>

          <!-- FORMULARIO -->
          <form @submit.prevent="login">
            <!-- Correo / Usuario -->
            <div class="mb-3">
              <label class="form-label text-white-50 fs-2 fw-semibold">
                Correo Electrónico o Usuario
              </label>
              <div class="input-group">
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">
                  <iconify-icon icon="solar:user-circle-line-duotone" class="fs-5"></iconify-icon>
                </span>
                <input
                  v-model="email"
                  type="email"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white py-2"
                  placeholder="ejemplo@deskounta.ec"
                  required
                />
              </div>
            </div>

            <!-- Contraseña con Mostrar/Ocultar -->
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label text-white-50 fs-2 fw-semibold mb-0">
                  Contraseña
                </label>
              </div>
              <div class="input-group">
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">
                  <iconify-icon icon="solar:lock-keyhole-line-duotone" class="fs-5"></iconify-icon>
                </span>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white py-2"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  class="btn btn-dark-subtle border-secondary-subtle text-secondary"
                  @click="showPassword = !showPassword"
                  title="Mostrar/Ocultar contraseña"
                >
                  <iconify-icon
                    :icon="showPassword ? 'solar:eye-closed-line-duotone' : 'solar:eye-line-duotone'"
                    class="fs-5"
                  ></iconify-icon>
                </button>
              </div>
            </div>

            <!-- Botón de Inicio de Sesión -->
            <button
              type="submit"
              class="btn btn-primary w-100 py-3 rounded-3 fw-bold text-white d-flex align-items-center justify-content-center gap-2 btn-login"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
              <iconify-icon v-else icon="solar:login-2-line-duotone" class="fs-5"></iconify-icon>
              <span>{{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}</span>
            </button>
          </form>

          <div class="text-center mt-4 pt-2">
            <span class="text-secondary fs-2">
              ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  background: radial-gradient(circle at 15% 20%, #152238 0%, #0a0f1d 80%);
  position: relative;
  overflow: hidden;
}

/* Luces ambientales desenfocadas de fondo */
.ambient-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  opacity: 0.15;
}

.glow-1 {
  top: -100px;
  left: -100px;
  background: #0085db;
}

.glow-2 {
  bottom: -150px;
  right: -100px;
  background: #5ac8fa;
}

/* Tarjeta centrada y perfectamente simétrica */
.login-card {
  max-width: 960px;
  width: 100%;
  background-color: #121826;
  backdrop-filter: blur(16px);
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.illustration-side {
  background: linear-gradient(145deg, #162032 0%, #0f1728 100%);
}

.bg-navy-card {
  background-color: #1a2234 !important;
}

.illustration-img {
  filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.4));
  transition: transform 0.3s ease;
}

.illustration-img:hover {
  transform: translateY(-4px);
}

/* Adaptabilidad para Modo Claro en Login */
[data-bs-theme="light"] .login-wrapper {
  background-color: #f6f9fc;
}
[data-bs-theme="light"] .login-card {
  background-color: #ffffff;
  border-color: #e6ecf1 !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
}
[data-bs-theme="light"] .bg-navy-card {
  background-color: #ffffff !important;
}
[data-bs-theme="light"] .form-side h2 {
  color: #111c2d !important;
}
[data-bs-theme="light"] .form-side label {
  color: #475569 !important;
}
[data-bs-theme="light"] .form-side input.form-control {
  background-color: #ffffff !important;
  color: #111c2d !important;
  border-color: #e6ecf1 !important;
}
[data-bs-theme="light"] .form-side .input-group-text {
  background-color: #f8fafc !important;
  border-color: #e6ecf1 !important;
  color: #64748b !important;
}
[data-bs-theme="light"] .form-side .text-secondary {
  color: #64748b !important;
}
[data-bs-theme="light"] .illustration-side {
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
}

.text-primary-gradient {
  background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-login {
  background: linear-gradient(90deg, #0085db 0%, #0284c7 100%);
  border: none;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 133, 219, 0.3);
}

.btn-login:hover:not(:disabled) {
  background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 133, 219, 0.45);
}
</style>