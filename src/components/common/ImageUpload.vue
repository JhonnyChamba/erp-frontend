<script setup lang="ts">
import { ref, watch } from 'vue'
import { compressImageToWebP } from '@/utils/image-processor'
import ImageCropModal from './ImageCropModal.vue'

interface Props {
  modelValue?: string | null
  label?: string
  helpText?: string
  aspectRatio?: number
  cropShape?: 'round' | 'rect'
  maxSizeMB?: number
  enableCrop?: boolean
  enableCamera?: boolean
  uploadFn?: (file: File) => Promise<{ url: string } | string>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  helpText: 'PNG, JPG o WEBP (se optimizará a WebP automáticamente)',
  aspectRatio: 1,
  cropShape: 'rect',
  maxSizeMB: 10,
  enableCrop: true,
  enableCamera: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: string): void
  (e: 'file', file: File): void
  (e: 'remove'): void
}>()

const preview = ref<string | null>(props.modelValue || null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

// Modal de recorte
const isCropOpen = ref(false)
const rawImageForCrop = ref<string | null>(null)
const originalFile = ref<File | null>(null)

const fileInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.modelValue,
  (val) => {
    preview.value = val || null
  }
)

const handleFileSelected = async (file: File) => {
  errorMsg.value = null
  successMsg.value = null

  if (!file.type.startsWith('image/')) {
    errorMsg.value = 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, SVG).'
    return
  }

  if (file.size > props.maxSizeMB * 1024 * 1024) {
    errorMsg.value = `La imagen supera el límite de ${props.maxSizeMB}MB.`
    return
  }

  // SVG se sube directamente sin recorte
  if (file.type === 'image/svg+xml') {
    await processAndUpload(file)
    return
  }

  originalFile.value = file

  if (props.enableCrop) {
    const reader = new FileReader()
    reader.onload = () => {
      rawImageForCrop.value = reader.result as string
      isCropOpen.value = true
    }
    reader.readAsDataURL(file)
  } else {
    // Compresión directa
    try {
      const { file: compressed } = await compressImageToWebP(file)
      await processAndUpload(compressed)
    } catch {
      await processAndUpload(file)
    }
  }
}

const handleCropComplete = async (croppedBlob: Blob) => {
  isCropOpen.value = false

  try {
    const baseName = originalFile.value?.name.replace(/\.[^/.]+$/, '') || 'image'
    const fileFromBlob = new File([croppedBlob], `${baseName}.webp`, {
      type: 'image/webp',
    })

    const { file: compressed } = await compressImageToWebP(fileFromBlob)
    await processAndUpload(compressed)
  } catch (err) {
    console.error('Error al procesar recorte:', err)
    errorMsg.value = 'Error al procesar la imagen recortada.'
  }
}

const processAndUpload = async (fileToUpload: File) => {
  emit('file', fileToUpload)

  // Si hay función de subida provista, ejecutarla
  if (props.uploadFn) {
    try {
      isUploading.value = true
      uploadProgress.value = 25
      errorMsg.value = null

      const res = await props.uploadFn(fileToUpload)
      uploadProgress.value = 100

      const url = typeof res === 'string' ? res : res.url
      preview.value = url
      emit('update:modelValue', url)
      emit('change', url)
      successMsg.value = 'Imagen optimizada y cargada con éxito'
    } catch (err: any) {
      console.error('Error al subir imagen:', err)
      errorMsg.value = err?.response?.data?.message || err?.message || 'Error al subir la imagen'
    } finally {
      isUploading.value = false
      setTimeout(() => {
        successMsg.value = null
      }, 3500)
    }
  } else {
    // Modo local / formulario diferido: generar preview local
    const localUrl = URL.createObjectURL(fileToUpload)
    preview.value = localUrl
    emit('update:modelValue', localUrl)
    emit('change', localUrl)
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }
}

const handleRemove = () => {
  preview.value = null
  emit('update:modelValue', '')
  emit('change', '')
  emit('remove')
  errorMsg.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  if (cameraInputRef.value) cameraInputRef.value.value = ''
}

const handleReCrop = () => {
  if (preview.value) {
    rawImageForCrop.value = preview.value
    isCropOpen.value = true
  }
}
</script>

<template>
  <div class="image-upload-wrapper">
    <!-- Etiqueta superior opcional -->
    <div v-if="label" class="d-flex align-items-center justify-content-between mb-1">
      <label class="form-label text-uppercase fw-bold text-secondary mb-0" style="font-size: 0.72rem; letter-spacing: 0.04em;">
        {{ label }}
      </label>
      <span v-if="preview && !isUploading" class="text-success d-flex align-items-center gap-1 font-monospace" style="font-size: 0.72rem;">
        <iconify-icon icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
        <span>Listo</span>
      </span>
    </div>

    <!-- Inputs ocultos de archivo y cámara -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png, image/jpeg, image/webp, image/svg+xml"
      class="d-none"
      @change="(e: any) => e.target.files?.[0] && handleFileSelected(e.target.files[0])"
    />

    <input
      ref="cameraInputRef"
      type="file"
      accept="image/*"
      capture="user"
      class="d-none"
      @change="(e: any) => e.target.files?.[0] && handleFileSelected(e.target.files[0])"
    />

    <!-- Zona Interactiva Dropzone / Preview -->
    <div
      class="image-upload-box"
      :class="{
        'is-dragging': isDragging,
        'has-error': !!errorMsg,
        'has-preview': !!preview && !isUploading,
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- ESTADO 1: Cargando y Optimizado -->
      <div v-if="isUploading" class="text-center py-4 px-3">
        <div class="spinner-border text-primary mb-2" role="status" style="width: 2.5rem; height: 2.5rem;">
          <span class="visually-hidden">Optimizando...</span>
        </div>
        <h6 class="fw-bold mb-1 text-white">Optimizando y subiendo imagen...</h6>
        <p class="text-secondary small mb-2">Comprimiendo a WebP y transfiriendo al almacenamiento seguro</p>
        <div class="progress" style="height: 6px; max-width: 200px; margin: 0 auto;">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
            role="progressbar"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- ESTADO 2: Imagen Cargada (Preview con Botones Cambiar / Recortar / Quitar) -->
      <div v-else-if="preview" class="p-3 d-flex flex-column flex-sm-row align-items-center gap-3">
        <div
          class="preview-thumbnail-container"
          :class="{ 'is-round': cropShape === 'round' }"
        >
          <img :src="preview" alt="Vista previa" class="preview-thumbnail-img" />
        </div>

        <div class="flex-grow-1 text-center text-sm-start">
          <h6 class="fw-bold text-white mb-1">Imagen lista</h6>
          <p class="text-secondary small mb-2">Formato WebP optimizado para máxima velocidad de carga</p>

          <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
              @click="fileInputRef?.click()"
            >
              <iconify-icon icon="solar:refresh-line-duotone"></iconify-icon>
              <span>Cambiar</span>
            </button>

            <button
              v-if="enableCrop"
              type="button"
              class="btn btn-sm btn-outline-info rounded-pill px-3 d-inline-flex align-items-center gap-1"
              @click="handleReCrop"
            >
              <iconify-icon icon="solar:crop-bold-duotone"></iconify-icon>
              <span>Recortar</span>
            </button>

            <button
              type="button"
              class="btn btn-sm btn-outline-danger rounded-pill px-3 d-inline-flex align-items-center gap-1"
              @click="handleRemove"
            >
              <iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon>
              <span>Quitar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ESTADO 3: Estado Vacío (Dropzone interactivo) -->
      <div v-else class="p-4 text-center">
        <div class="upload-icon-circle mx-auto mb-2">
          <iconify-icon icon="solar:cloud-upload-bold-duotone" class="fs-3 text-primary"></iconify-icon>
        </div>

        <p class="mb-1 text-white fw-semibold" style="font-size: 0.85rem;">
          Arrastra tu imagen aquí, o
          <button
            type="button"
            class="btn btn-link p-0 text-primary fw-bold text-decoration-none ms-1"
            @click="fileInputRef?.click()"
          >
            selecciona un archivo
          </button>
        </p>
        <p class="text-secondary small mb-3">{{ helpText }}</p>

        <!-- Botones secundarios: Explorar y Cámara móvil -->
        <div class="d-flex align-items-center justify-content-center gap-2">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
            @click="fileInputRef?.click()"
          >
            <iconify-icon icon="solar:gallery-bold-duotone" class="fs-5"></iconify-icon>
            <span>Explorar Archivos</span>
          </button>

          <button
            v-if="enableCamera"
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
            @click="cameraInputRef?.click()"
          >
            <iconify-icon icon="solar:camera-bold-duotone" class="fs-5"></iconify-icon>
            <span>Tomar Foto</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Alertas de error o éxito -->
    <div v-if="errorMsg" class="alert alert-danger py-2 px-3 mt-2 d-flex align-items-center gap-2 mb-0" style="font-size: 0.8rem;">
      <iconify-icon icon="solar:danger-triangle-bold" class="fs-5 text-danger flex-shrink-0"></iconify-icon>
      <span>{{ errorMsg }}</span>
    </div>

    <div v-if="successMsg" class="alert alert-success py-2 px-3 mt-2 d-flex align-items-center gap-2 mb-0" style="font-size: 0.8rem;">
      <iconify-icon icon="solar:check-circle-bold" class="fs-5 text-success flex-shrink-0"></iconify-icon>
      <span>{{ successMsg }}</span>
    </div>

    <!-- Modal de recorte interactivo -->
    <ImageCropModal
      v-if="rawImageForCrop"
      :is-open="isCropOpen"
      :image-src="rawImageForCrop"
      :aspect-ratio="aspectRatio"
      :crop-shape="cropShape"
      :title="label ? `Recortar ${label}` : 'Ajustar Imagen'"
      @crop-complete="handleCropComplete"
      @cancel="isCropOpen = false"
    />
  </div>
</template>

<style scoped>
.image-upload-wrapper {
  width: 100%;
}

.image-upload-box {
  background-color: rgba(255, 255, 255, 0.02);
  border: 2px dashed var(--bs-border-color, rgba(189, 200, 240, 0.2));
  border-radius: 16px;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.image-upload-box:hover {
  border-color: rgba(0, 133, 219, 0.45);
  background-color: rgba(0, 133, 219, 0.02);
}

.image-upload-box.is-dragging {
  border-color: #0085db;
  background-color: rgba(0, 133, 219, 0.08);
  transform: scale(1.01);
}

.image-upload-box.has-error {
  border-color: #f43f5e;
  background-color: rgba(244, 63, 94, 0.03);
}

.image-upload-box.has-preview {
  border-style: solid;
  border-color: var(--bs-border-color, rgba(189, 200, 240, 0.15));
  background-color: var(--bs-card-bg, #111c2d);
}

.upload-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background-color: rgba(0, 133, 219, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-thumbnail-container {
  width: 80px;
  height: 80px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.25));
  background-color: #000;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-thumbnail-container.is-round {
  border-radius: 50% !important;
}

.preview-thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
