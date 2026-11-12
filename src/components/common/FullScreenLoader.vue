<template>
  <Transition name="fade-loader">
    <div
      v-if="loadingStore.isLoading"
      class="fullscreen-loader-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="fullscreen-loader-card">
        <!-- Logo / Icono Animado -->
        <div class="loader-icon-wrapper mb-3">
          <img
            src="/controller/images/logos/loader.svg"
            alt="Cargando..."
            width="68"
            height="68"
            class="loader-svg-anim"
          />
        </div>

        <!-- Puntos Pulsantes Estilo Spike -->
        <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
          <span class="spinner-grow spinner-grow-sm text-primary" role="status"></span>
          <span class="spinner-grow spinner-grow-sm text-info" style="animation-delay: 0.15s;" role="status"></span>
          <span class="spinner-grow spinner-grow-sm text-warning" style="animation-delay: 0.3s;" role="status"></span>
        </div>

        <!-- Texto Informativo -->
        <div class="loader-title fw-bold fs-4 text-center">
          {{ loadingStore.message || 'Cargando información...' }}
        </div>
        <div class="loader-subtitle text-muted fs-2 text-center mt-1">
          Por favor espera un momento...
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading.store'

const loadingStore = useLoadingStore()
</script>

<style scoped>
.fullscreen-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 15, 30, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  user-select: none;
  pointer-events: all;
  transition: opacity 0.25s ease;
}

:root[data-bs-theme='light'] .fullscreen-loader-overlay,
html[data-bs-theme='light'] .fullscreen-loader-overlay {
  background: rgba(248, 250, 252, 0.82);
}

.fullscreen-loader-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.25rem 2.5rem;
  background: rgba(18, 26, 44, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
  max-width: 90vw;
  width: 320px;
}

:root[data-bs-theme='light'] .fullscreen-loader-card,
html[data-bs-theme='light'] .fullscreen-loader-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.12);
}

.loader-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-svg-anim {
  filter: drop-shadow(0 0 10px rgba(0, 133, 219, 0.4));
}

.loader-title {
  color: #fff;
  letter-spacing: 0.2px;
}

:root[data-bs-theme='light'] .loader-title,
html[data-bs-theme='light'] .loader-title {
  color: #1e293b;
}

.loader-subtitle {
  color: #94a3b8;
}

:root[data-bs-theme='light'] .loader-subtitle,
html[data-bs-theme='light'] .loader-subtitle {
  color: #64748b;
}

/* Transición suave */
.fade-loader-enter-active,
.fade-loader-leave-active {
  transition: opacity 0.22s ease;
}

.fade-loader-enter-from,
.fade-loader-leave-to {
  opacity: 0;
}
</style>
