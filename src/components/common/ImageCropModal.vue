<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { createCroppedImage, type CropArea } from '@/utils/image-processor'

interface Props {
  isOpen: boolean
  imageSrc: string
  aspectRatio?: number
  cropShape?: 'round' | 'rect'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 1,
  cropShape: 'rect',
  title: 'Ajustar y Recortar Imagen',
})

const emit = defineEmits<{
  (e: 'crop-complete', blob: Blob, previewUrl: string): void
  (e: 'cancel'): void
}>()

const zoom = ref(1)
const rotation = ref(0)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const isProcessing = ref(false)

const containerRef = ref<HTMLDivElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      zoom.value = 1
      rotation.value = 0
      position.value = { x: 0, y: 0 }
    }
  }
)

const handleMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    if (!touch) return
    isDragging.value = true
    dragStart.value = {
      x: touch.clientX - position.value.x,
      y: touch.clientY - position.value.y,
    }
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || e.touches.length !== 1) return
  const touch = e.touches[0]
  if (!touch) return
  position.value = {
    x: touch.clientX - dragStart.value.x,
    y: touch.clientY - dragStart.value.y,
  }
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoom.value = Math.min(Math.max(1, zoom.value + delta), 3)
}

const handleRotate = () => {
  rotation.value = (rotation.value + 90) % 360
}

const handleApply = async () => {
  if (!imageRef.value || !containerRef.value) return

  try {
    isProcessing.value = true
    const img = imageRef.value
    const container = containerRef.value

    const containerRect = container.getBoundingClientRect()
    const cropSize = Math.min(containerRect.width, containerRect.height) * 0.82
    const cropWidth = cropSize
    const cropHeight = cropSize / props.aspectRatio

    const displayedWidth = img.width * zoom.value
    const displayedHeight = img.height * zoom.value

    const scaleX = img.naturalWidth / displayedWidth
    const scaleY = img.naturalHeight / displayedHeight

    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2

    const imgLeft = centerX + position.value.x - displayedWidth / 2
    const imgTop = centerY + position.value.y - displayedHeight / 2

    const cropLeft = centerX - cropWidth / 2
    const cropTop = centerY - cropHeight / 2

    const sourceX = Math.max(0, (cropLeft - imgLeft) * scaleX)
    const sourceY = Math.max(0, (cropTop - imgTop) * scaleY)
    const sourceWidth = Math.min(img.naturalWidth - sourceX, cropWidth * scaleX)
    const sourceHeight = Math.min(img.naturalHeight - sourceY, cropHeight * scaleY)

    const cropArea: CropArea = {
      x: Math.round(sourceX),
      y: Math.round(sourceY),
      width: Math.round(sourceWidth),
      height: Math.round(sourceHeight),
    }

    const croppedBlob = await createCroppedImage(
      props.imageSrc,
      cropArea,
      rotation.value,
      'image/webp',
      0.9
    )

    const previewUrl = URL.createObjectURL(croppedBlob)
    emit('crop-complete', croppedBlob, previewUrl)
  } catch (err) {
    console.error('Error al aplicar recorte:', err)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="image-crop-backdrop" @click.self="$emit('cancel')">
    <div class="image-crop-card">
      <!-- Header -->
      <div class="image-crop-header">
        <div class="d-flex align-items-center gap-2">
          <div class="crop-icon-box">
            <iconify-icon icon="solar:crop-bold-duotone" class="fs-5 text-primary"></iconify-icon>
          </div>
          <div>
            <h6 class="mb-0 fw-bold text-white">{{ title }}</h6>
            <small class="text-secondary">Arrastra y usa el zoom para centrar</small>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle p-1" @click="$emit('cancel')">
          <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
        </button>
      </div>

      <!-- Área de Recorte Interactiva -->
      <div
        ref="containerRef"
        class="crop-viewport-container"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleMouseUp"
        @wheel="handleWheel"
      >
        <!-- Imagen que se arrastra y transforma -->
        <img
          ref="imageRef"
          :src="imageSrc"
          alt="Recortar"
          class="crop-target-image"
          :style="{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }"
          draggable="false"
        />

        <!-- Cuadro / Círculo Guía de Recorte con oscurecimiento exterior -->
        <div class="crop-overlay-backdrop"></div>
        <div
          class="crop-target-frame"
          :class="{ 'is-round': cropShape === 'round' }"
          :style="{
            aspectRatio: String(aspectRatio),
          }"
        >
          <div class="crop-grid-lines">
            <span class="line-v"></span>
            <span class="line-h"></span>
          </div>
        </div>
      </div>

      <!-- Controles de Zoom y Rotación -->
      <div class="crop-controls-bar">
        <div class="d-flex align-items-center gap-2 flex-grow-1">
          <iconify-icon icon="solar:magnifer-zoom-out-line-duotone" class="text-secondary fs-5"></iconify-icon>
          <input
            v-model.number="zoom"
            type="range"
            min="1"
            max="3"
            step="0.05"
            class="form-range flex-grow-1"
          />
          <iconify-icon icon="solar:magnifer-zoom-in-line-duotone" class="text-secondary fs-5"></iconify-icon>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
          @click="handleRotate"
          title="Rotar 90 grados"
        >
          <iconify-icon icon="solar:restart-bold" class="fs-5"></iconify-icon>
          <span>Rotar</span>
        </button>
      </div>

      <!-- Footer / Acciones -->
      <div class="image-crop-footer">
        <button type="button" class="btn btn-outline-secondary rounded-pill px-3" @click="$emit('cancel')">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-1 fw-semibold"
          :disabled="isProcessing"
          @click="handleApply"
        >
          <iconify-icon v-if="!isProcessing" icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
          <span v-if="isProcessing" class="spinner-border spinner-border-sm me-1"></span>
          <span>{{ isProcessing ? 'Procesando...' : 'Aplicar Recorte' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-crop-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10500;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.image-crop-card {
  background-color: var(--bs-card-bg, #111c2d);
  border: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.15));
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
}

.image-crop-header {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.1));
}

.crop-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(0, 133, 219, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-viewport-container {
  position: relative;
  width: 100%;
  height: 320px;
  background-color: #050a12;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
}

.crop-target-image {
  max-width: 85%;
  max-height: 85%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.05s ease-out;
  pointer-events: none;
}

.crop-target-frame {
  position: absolute;
  width: 250px;
  height: 250px;
  border: 2px solid #0085db;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  border-radius: 16px;
  pointer-events: none;
  z-index: 2;
}

.crop-target-frame.is-round {
  border-radius: 50% !important;
}

.crop-grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.crop-grid-lines .line-v {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.crop-grid-lines .line-h {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.crop-controls-bar {
  padding: 0.85rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.1));
  border-bottom: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.1));
  display: flex;
  align-items: center;
  gap: 1rem;
}

.image-crop-footer {
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
