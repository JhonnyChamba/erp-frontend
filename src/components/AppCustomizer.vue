<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore, type ThemeColor, type ContainerOption, type CardStyle, type ThemeMode } from '@/stores/theme.store'

const props = defineProps<{
  isMiniSidebar?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const themeStore = useThemeStore()
const isOpen = ref(false)

const openDrawer = () => {
  isOpen.value = true
}

const closeDrawer = () => {
  isOpen.value = false
}

defineExpose({
  openDrawer,
  closeDrawer,
})

const colorOptions: { id: ThemeColor; label: string; color: string }[] = [
  { id: 'Blue_Theme', label: 'Azul (Default)', color: '#0085db' },
  { id: 'Aqua_Theme', label: 'Aqua', color: '#0074ba' },
  { id: 'Purple_Theme', label: 'Púrpura', color: '#763ebd' },
  { id: 'Green_Theme', label: 'Verde', color: '#4bd08b' },
  { id: 'Cyan_Theme', label: 'Cian', color: '#01c0c8' },
  { id: 'Orange_Theme', label: 'Naranja', color: '#fa896b' },
]

const selectThemeMode = (mode: ThemeMode) => {
  themeStore.applyThemeMode(mode)
}

const selectContainerOption = (option: ContainerOption) => {
  themeStore.setContainerOption(option)
}

const selectThemeColor = (color: ThemeColor) => {
  themeStore.setThemeColor(color)
}

const selectCardStyle = (style: CardStyle) => {
  themeStore.setCardStyle(style)
}
</script>

<template>
  <!-- BOTÓN FLOTANTE ESTILO SPIKE ADMIN -->
  <button
    class="btn btn-primary p-3 rounded-circle d-flex align-items-center justify-content-center customizer-btn shadow-lg"
    type="button"
    @click="openDrawer"
    title="Personalizar apariencia"
    aria-label="Abrir configuración de apariencia"
  >
    <iconify-icon icon="solar:settings-bold-duotone" class="fs-6"></iconify-icon>
  </button>

  <!-- TELÓN DE FONDO (BACKDROP) -->
  <div
    v-if="isOpen"
    class="customizer-backdrop"
    @click="closeDrawer"
  ></div>

  <!-- PANEL DESLIZABLE (OFFCANVAS DRAWER) -->
  <div
    class="offcanvas customizer offcanvas-end shadow-lg"
    :class="{ show: isOpen }"
    tabindex="-1"
    :style="{ visibility: isOpen ? 'visible' : 'hidden' }"
  >
    <!-- HEADER -->
    <div class="d-flex align-items-center justify-content-between p-3 border-bottom border-translucent">
      <div>
        <h5 class="offcanvas-title fw-bold mb-0 text-title d-flex align-items-center gap-2">
          <iconify-icon icon="solar:settings-bold-duotone" class="text-primary fs-5"></iconify-icon>
          Apariencia y Estilo
        </h5>
        <small class="text-muted fs-1">Personaliza la interfaz a tu preferencia</small>
      </div>
      <button
        type="button"
        class="btn-close text-reset"
        @click="closeDrawer"
        aria-label="Cerrar"
      ></button>
    </div>

    <!-- BODY -->
    <div class="offcanvas-body p-4 customizer-scroll">

      <!-- 1. CONTAINER OPTION (LA OPCIÓN SOLICITADA) -->
      <div class="mb-4 pb-3 border-bottom border-translucent">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h6 class="fw-bold fs-3 mb-0 text-title">Container Option</h6>
          <span class="badge bg-primary-subtle text-primary fs-1 rounded-pill">
            {{ themeStore.containerOption === 'full' ? 'Full Width' : 'Boxed' }}
          </span>
        </div>
        <p class="text-muted fs-2 mb-3">
          Elige si deseas que las tablas y contenidos abarquen todo el ancho de la pantalla o estén centrados en caja.
        </p>

        <div class="d-flex flex-row gap-2 customizer-box" role="group">
          <!-- BOXED -->
          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="themeStore.containerOption === 'boxed' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectContainerOption('boxed')"
          >
            <iconify-icon icon="solar:minimize-square-3-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Boxed</span>
          </button>

          <!-- FULL -->
          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="themeStore.containerOption === 'full' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectContainerOption('full')"
          >
            <iconify-icon icon="solar:maximize-square-3-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Full</span>
          </button>
        </div>
      </div>

      <!-- 2. MODO TEMA (LIGHT / DARK) -->
      <div class="mb-4 pb-3 border-bottom border-translucent">
        <h6 class="fw-bold fs-3 mb-2 text-title">Theme Mode</h6>
        <div class="d-flex flex-row gap-2 customizer-box" role="group">
          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="!themeStore.isDark ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectThemeMode('light')"
          >
            <iconify-icon icon="solar:sun-2-line-duotone" class="fs-5 text-warning"></iconify-icon>
            <span class="fw-semibold fs-2">Claro</span>
          </button>

          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="themeStore.isDark ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectThemeMode('dark')"
          >
            <iconify-icon icon="solar:moon-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Oscuro</span>
          </button>
        </div>
      </div>

      <!-- 3. THEME COLORS -->
      <div class="mb-4 pb-3 border-bottom border-translucent">
        <h6 class="fw-bold fs-3 mb-2 text-title">Theme Colors</h6>
        <div class="d-flex flex-row flex-wrap gap-2 customizer-box color-pallete pt-1" role="group">
          <button
            v-for="color in colorOptions"
            :key="color.id"
            type="button"
            class="btn color-swatch-btn rounded-circle p-0 d-flex align-items-center justify-content-center position-relative"
            :style="{ backgroundColor: color.color }"
            :title="color.label"
            @click="selectThemeColor(color.id)"
          >
            <iconify-icon
              v-if="themeStore.themeColor === color.id"
              icon="solar:check-read-linear"
              class="text-white fs-4 fw-bold"
            ></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 4. SIDEBAR TYPE -->
      <div class="mb-4 pb-3 border-bottom border-translucent">
        <h6 class="fw-bold fs-3 mb-2 text-title">Sidebar Type</h6>
        <div class="d-flex flex-row gap-2 customizer-box" role="group">
          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="!props.isMiniSidebar ? 'btn-primary' : 'btn-outline-secondary'"
            @click="emit('toggle-sidebar')"
          >
            <iconify-icon icon="solar:sidebar-minimalistic-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Full</span>
          </button>

          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="props.isMiniSidebar ? 'btn-primary' : 'btn-outline-secondary'"
            @click="emit('toggle-sidebar')"
          >
            <iconify-icon icon="solar:hamburger-menu-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Collapse</span>
          </button>
        </div>
      </div>

      <!-- 5. CARD STYLE -->
      <div class="mb-3">
        <h6 class="fw-bold fs-3 mb-2 text-title">Card With</h6>
        <div class="d-flex flex-row gap-2 customizer-box" role="group">
          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="themeStore.cardStyle === 'border' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectCardStyle('border')"
          >
            <iconify-icon icon="solar:square-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Border</span>
          </button>

          <button
            type="button"
            class="btn flex-fill py-2 px-3 d-flex align-items-center justify-content-center gap-2 customizer-toggle-btn"
            :class="themeStore.cardStyle === 'shadow' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="selectCardStyle('shadow')"
          >
            <iconify-icon icon="solar:layers-line-duotone" class="fs-5"></iconify-icon>
            <span class="fw-semibold fs-2">Shadow</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.customizer-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  z-index: 1040;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.customizer-btn:hover {
  transform: rotate(45deg) scale(1.08);
}

.customizer-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1050;
}

.offcanvas.customizer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px !important;
  max-width: 90vw;
  background-color: var(--bs-body-bg) !important;
  color: var(--bs-body-color);
  border-left: 1px solid var(--bs-border-color);
  z-index: 1060;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(100%);
}

.offcanvas.customizer.show {
  transform: translateX(0);
}

.customizer-scroll {
  overflow-y: auto;
  max-height: calc(100vh - 75px);
}

.text-title {
  color: var(--bs-text-title) !important;
}

.customizer-toggle-btn {
  border-radius: 12px !important;
  transition: all 0.2s ease;
}

.color-swatch-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.color-swatch-btn:hover {
  transform: scale(1.15);
}
</style>

