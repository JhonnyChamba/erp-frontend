<script setup lang="ts">
import { computed } from 'vue'
import { toast } from '@/utils/toastr'
import { resolveSriErrorInfo, type SriErrorInfo } from '@/utils/sri-errors'

export interface SriDetailMessage {
  identificador?: string
  mensaje?: string
  informacionAdicional?: string
  tipo?: string
}

export interface SriResultPayload {
  id?: number
  success?: boolean
  status?: string
  sri_status?: string
  message?: string
  error?: string
  authorizationNumber?: string | null
  sri_authorization_number?: string | null
  authorizationDate?: string | Date | null
  sri_authorization_date?: string | Date | null
  sriMessages?: SriDetailMessage[]
  sri_messages?: SriDetailMessage[]
}

const props = defineProps<{
  modelValue: boolean
  documentType?: string
  documentNumber?: string
  accessKey?: string
  result?: SriResultPayload | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const normalizedStatus = computed(() => {
  const s = props.result?.sri_status || props.result?.status
  if (s === 'AUTHORIZED' || props.result?.success === true) return 'AUTHORIZED'
  if (s === 'IN_PROCESS') return 'IN_PROCESS'
  if (s === 'NOT_AUTHORIZED') return 'NOT_AUTHORIZED'
  if (s === 'RETURNED' || props.result?.error || props.result?.success === false) return 'RETURNED'
  return s || 'NOT_SENT'
})

const authNumber = computed(() => {
  return props.result?.sri_authorization_number || props.result?.authorizationNumber || props.accessKey || ''
})

const authDate = computed(() => {
  const d = props.result?.sri_authorization_date || props.result?.authorizationDate
  if (!d) return ''
  try {
    const parsed = new Date(d)
    return isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleString('es-EC')
  } catch {
    return String(d)
  }
})

const messagesList = computed<SriDetailMessage[]>(() => {
  const list = props.result?.sri_messages || props.result?.sriMessages || []
  if (list.length > 0) return list
  if (props.result?.error) {
    return [{ mensaje: props.result.error, tipo: 'ERROR' }]
  }
  if (props.result?.message && normalizedStatus.value !== 'AUTHORIZED') {
    return [{ mensaje: props.result.message, tipo: 'ERROR' }]
  }
  return []
})

const copyToClipboard = (text: string, label: string) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    toast.info(`${label} copiado al portapapeles`, 'Copiado')
  }).catch(() => {
    toast.info(text, label)
  })
}

const getResolution = (msg: SriDetailMessage): SriErrorInfo | null => {
  return resolveSriErrorInfo(msg.identificador, `${msg.mensaje || ''} ${msg.informacionAdicional || ''}`)
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop-custom" @click.self="close">
    <div class="modal-card-custom modal-lg-custom sri-modal-card">
      <!-- HEADER -->
      <div class="modal-header-custom d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <div
            class="rounded-circle p-2 d-flex align-items-center justify-content-center"
            :class="{
              'bg-success-subtle text-success border border-success-subtle': normalizedStatus === 'AUTHORIZED',
              'bg-danger-subtle text-danger border border-danger-subtle': normalizedStatus === 'RETURNED' || normalizedStatus === 'NOT_AUTHORIZED',
              'bg-warning-subtle text-warning border border-warning-subtle': normalizedStatus === 'IN_PROCESS',
              'bg-secondary-subtle text-secondary border border-secondary-subtle': normalizedStatus === 'NOT_SENT',
            }"
            style="width: 40px; height: 40px;"
          >
            <iconify-icon
              v-if="normalizedStatus === 'AUTHORIZED'"
              icon="solar:shield-check-bold"
              class="fs-5"
            ></iconify-icon>
            <iconify-icon
              v-else-if="normalizedStatus === 'IN_PROCESS'"
              icon="solar:refresh-circle-bold-duotone"
              class="fs-5"
            ></iconify-icon>
            <iconify-icon
              v-else
              icon="solar:danger-triangle-bold-duotone"
              class="fs-5"
            ></iconify-icon>
          </div>
          <div>
            <h5 class="text-white fw-bold mb-0">Respuesta del SRI - Comprobante Electrónico</h5>
            <small class="text-white-50">
              {{ documentType || 'Comprobante' }}
              <strong v-if="documentNumber" class="text-white ms-1">{{ documentNumber }}</strong>
            </small>
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" @click="close"></button>
      </div>

      <!-- BODY -->
      <div class="p-4">
        <!-- ESTADO 1: AUTORIZADO -->
        <div v-if="normalizedStatus === 'AUTHORIZED'" class="p-3 rounded-3 bg-success-subtle border border-success-subtle mb-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-success text-white px-3 py-1 fs-2 fw-bold text-uppercase d-inline-flex align-items-center gap-1">
              <iconify-icon icon="solar:check-circle-bold" class="fs-4"></iconify-icon>
              AUTORIZADO
            </span>
            <span class="text-success fw-semibold fs-3">Comprobante con validez tributaria ante el SRI</span>
          </div>
          <p class="text-white-50 fs-2 mb-0">
            El comprobante fue validado y autorizado satisfactoriamente por los servidores del SRI Ecuador. Toda la información ha sido guardada en la base de datos del sistema.
          </p>
        </div>

        <!-- ESTADO 2: DEVUELTO / ERROR / NO AUTORIZADO -->
        <div v-else-if="normalizedStatus === 'RETURNED' || normalizedStatus === 'NOT_AUTHORIZED'" class="p-3 rounded-3 bg-danger-subtle border border-danger-subtle mb-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-danger text-white px-3 py-1 fs-2 fw-bold text-uppercase d-inline-flex align-items-center gap-1">
              <iconify-icon icon="solar:close-circle-bold" class="fs-4"></iconify-icon>
              {{ normalizedStatus === 'NOT_AUTHORIZED' ? 'NO AUTORIZADO' : 'DEVUELTO POR EL SRI' }}
            </span>
            <span class="text-danger fw-semibold fs-3">El SRI rechazó la emisión del comprobante</span>
          </div>
          <p class="text-white-50 fs-2 mb-0">
            El documento fue registrado en el sistema, pero el Servicio de Rentas Internas (SRI) reportó inconsistencias u observaciones que impiden su autorización inmediata. La información devuelta ha sido guardada en el comprobante.
          </p>
        </div>

        <!-- ESTADO 3: EN PROCESO -->
        <div v-else-if="normalizedStatus === 'IN_PROCESS'" class="p-3 rounded-3 bg-warning-subtle border border-warning-subtle mb-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-warning text-dark px-3 py-1 fs-2 fw-bold text-uppercase d-inline-flex align-items-center gap-1">
              <iconify-icon icon="solar:clock-circle-bold" class="fs-4"></iconify-icon>
              EN PROCESO
            </span>
            <span class="text-warning fw-semibold fs-3">Comprobante recibido por el WebService SRI</span>
          </div>
          <p class="text-white-50 fs-2 mb-0">
            El comprobante fue recibido correctamente en el SRI y se encuentra en la cola de procesamiento. Puedes consultar la autorización en unos instantes desde el listado.
          </p>
        </div>

        <!-- DETALLES DE AUTORIZACIÓN (SI EXISTEN) -->
        <div class="card bg-dark-subtle border-secondary-subtle p-3 mb-4">
          <div class="row g-3">
            <div v-if="authNumber" class="col-md-7">
              <label class="form-label text-secondary fs-1 fw-bold text-uppercase mb-1">Nº de Autorización</label>
              <div class="d-flex align-items-center gap-2">
                <code class="text-info fs-2 bg-dark p-2 rounded border border-secondary-subtle flex-grow-1 text-break">
                  {{ authNumber }}
                </code>
                <button
                  type="button"
                  class="btn btn-outline-info btn-sm px-2 py-1 d-flex align-items-center gap-1"
                  title="Copiar número"
                  @click="copyToClipboard(authNumber, 'Nº Autorización')"
                >
                  <iconify-icon icon="solar:copy-line-duotone" class="fs-4"></iconify-icon>
                  <span>Copiar</span>
                </button>
              </div>
            </div>

            <div v-if="authDate" class="col-md-5">
              <label class="form-label text-secondary fs-1 fw-bold text-uppercase mb-1">Fecha de Autorización</label>
              <div class="text-white fw-bold fs-3 py-2">
                <iconify-icon icon="solar:calendar-date-line-duotone" class="text-primary me-1"></iconify-icon>
                {{ authDate }}
              </div>
            </div>

            <div v-if="accessKey" class="col-12">
              <label class="form-label text-secondary fs-1 fw-bold text-uppercase mb-1">Clave de Acceso (49 dígitos)</label>
              <div class="d-flex align-items-center gap-2">
                <code class="text-warning fs-1 bg-dark p-2 rounded border border-secondary-subtle flex-grow-1 text-break font-monospace">
                  {{ accessKey }}
                </code>
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-sm px-2 py-1 d-flex align-items-center gap-1"
                  title="Copiar clave"
                  @click="copyToClipboard(accessKey, 'Clave de Acceso')"
                >
                  <iconify-icon icon="solar:copy-line-duotone" class="fs-4"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- LISTA DE MENSAJES / ERRORES DEL SRI -->
        <div v-if="messagesList.length > 0">
          <h6 class="text-white fw-bold mb-2 d-flex align-items-center gap-2">
            <iconify-icon icon="solar:chat-round-line-line-duotone" class="text-primary fs-5"></iconify-icon>
            Mensajes devueltos por el SRI ({{ messagesList.length }})
          </h6>
          <div class="d-flex flex-column gap-2">
            <div
              v-for="(msg, idx) in messagesList"
              :key="idx"
              class="p-3 rounded-2 border"
              :class="msg.tipo === 'ADVERTENCIA' ? 'border-warning-subtle bg-warning-subtle text-warning' : 'border-danger-subtle bg-danger-subtle text-danger'"
            >
              <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="badge" :class="msg.tipo === 'ADVERTENCIA' ? 'bg-warning text-dark' : 'bg-danger text-white'">
                  {{ msg.tipo || 'ERROR' }} {{ msg.identificador ? `[Código ${msg.identificador}]` : '' }}
                </span>
              </div>
              <div class="fw-semibold fs-2 text-white">
                {{ msg.mensaje || getResolution(msg)?.title || 'Error devuelto por el WebService SRI' }}
              </div>
              <div v-if="msg.informacionAdicional" class="text-white-50 fs-1 mt-1 font-monospace">
                Detalle adicional: {{ msg.informacionAdicional }}
              </div>

              <!-- GUÍA / SOLUCIÓN AMIGABLE DEL ERROR SRI -->
              <div v-if="getResolution(msg)" class="mt-2 p-2 rounded-2 bg-dark border border-warning-subtle text-light">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <iconify-icon icon="solar:lightbulb-bolt-bold-duotone" class="text-warning fs-4"></iconify-icon>
                  <strong class="text-warning fs-2">{{ getResolution(msg)?.title }}</strong>
                </div>
                <p class="fs-1 text-white-50 mb-1">
                  <strong>Causa:</strong> {{ getResolution(msg)?.cause }}
                </p>
                <div class="fs-1 text-info d-flex align-items-start gap-1">
                  <iconify-icon icon="solar:wrench-bold-duotone" class="fs-4 flex-shrink-0 mt-1"></iconify-icon>
                  <span style="white-space: pre-line;"><strong>Solución recomendada:</strong> {{ getResolution(msg)?.solution }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AVISO DE PERSISTENCIA -->
        <div class="p-2 rounded-2 bg-dark border border-secondary-subtle d-flex align-items-center gap-2 mt-4 text-white-50 fs-2">
          <iconify-icon icon="solar:database-bold-duotone" class="text-info fs-4 flex-shrink-0"></iconify-icon>
          <span>
            Esta respuesta y todos los detalles del WebService SRI han quedado guardados automáticamente en el registro del comprobante.
          </span>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="modal-footer-custom d-flex justify-content-end p-3 border-top border-secondary-subtle">
        <button type="button" class="btn btn-primary px-4 rounded-pill" @click="close">
          Aceptar y Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sri-modal-card {
  max-width: 680px;
  width: 95%;
  max-height: 88vh;
  margin: auto;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  background-color: var(--bs-card-bg, #111c2d);
  border: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.15));
}

.modal-header-custom {
  flex-shrink: 0;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.15));
}

.modal-body-custom {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem;
}

.modal-footer-custom {
  flex-shrink: 0;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--bs-border-color, rgba(189, 200, 240, 0.15));
  background-color: var(--bs-card-bg, #111c2d);
}

@media (max-width: 576px) {
  .sri-modal-card {
    width: 98%;
    max-height: 94vh;
  }
  .modal-body-custom {
    padding: 0.85rem;
  }
}
</style>

