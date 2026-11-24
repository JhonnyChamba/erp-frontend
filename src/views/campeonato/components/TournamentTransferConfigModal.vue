<template>
  <div v-if="isOpen" class="modal-backdrop-custom app-modal-backdrop">
    <div class="modal-dialog-custom modal-lg app-modal">
      <div class="modal-content-custom app-modal">
        <div class="modal-header-custom d-flex justify-content-between align-items-center app-modal-header">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary-subtle text-primary fw-bold font-monospace">CFG-PASES</span>
              <h5 class="m-0 text-light fw-bold">Configuración de Inscripciones y Transferencias</h5>
            </div>
            <p class="m-0 text-muted small">
              Reglas, fechas de apertura/cierre, cupos y firmas de aprobación requeridas para: <strong>{{ editionName }}</strong>
            </p>
          </div>
          <button type="button" class="btn-close-custom" @click="close">
            <span class="iconify" data-icon="solar:close-circle-bold" data-width="24"></span>
          </button>
        </div>

        <div class="modal-body-custom app-modal-body" v-if="loading">
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2">Cargando configuración de la edición...</p>
          </div>
        </div>

        <div class="modal-body-custom app-modal-body" v-else>
          <!-- Alerta de estado -->
          <div class="alert alert-info py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2 border-0 bg-info-subtle text-info">
            <span class="iconify fs-5" data-icon="solar:info-circle-bold"></span>
            <span class="small">
              Estas reglas rigen automáticamente las validaciones al momento de registrar futbolistas o generar solicitudes de transferencia entre clubes.
            </span>
          </div>

          <!-- BLOQUE 1: REGLAS DE INSCRIPCIÓN -->
          <div class="card bg-surface-dark border-secondary-subtle mb-4 shadow-sm">
            <div class="card-header bg-dark-subtle py-2 px-3 border-bottom border-secondary-subtle d-flex align-items-center justify-content-between">
              <span class="fw-bold text-light d-flex align-items-center gap-2">
                <span class="iconify text-primary" data-icon="solar:user-id-bold"></span>
                Inscripciones de Futbolistas
              </span>
              <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="regEnabled" v-model="form.registrations_enabled">
                <label class="form-check-label small fw-bold" :class="form.registrations_enabled ? 'text-success' : 'text-danger'" for="regEnabled">
                  {{ form.registrations_enabled ? 'Inscripciones HABILITADAS' : 'Inscripciones CERRADAS' }}
                </label>
              </div>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small text-muted">Fecha y Hora de Apertura</label>
                  <input type="datetime-local" class="form-control form-control-sm" v-model="form.registration_start_date">
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-muted">Fecha y Hora Límite de Cierre</label>
                  <input type="datetime-local" class="form-control form-control-sm" v-model="form.registration_end_date">
                </div>

                <div class="col-md-6">
                  <label class="form-label small text-muted">¿Quién puede realizar la inscripción?</label>
                  <select class="form-select form-select-sm" v-model="form.allowed_roles_registration">
                    <option value="ADMIN_ONLY">Solo Administradores de la Liga</option>
                    <option value="CLUB_AND_ADMIN">Delegados de Club y Administradores</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small text-muted">Validación de Plantilla</label>
                  <div class="form-check mt-1">
                    <input class="form-check-input" type="checkbox" id="enforceRoster" v-model="form.enforce_roster_limit">
                    <label class="form-check-label small text-light" for="enforceRoster">
                      Exigir cupo máximo de jugadores por equipo
                    </label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="reqRegApproval" v-model="form.require_registration_approval">
                    <label class="form-check-label small text-light" for="reqRegApproval">
                      Requerir aprobación previa de liga
                    </label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="allowMass" v-model="form.allow_mass_registration">
                    <label class="form-check-label small text-light" for="allowMass">
                      Permitir inscripción masiva
                    </label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="allowReReg" v-model="form.allow_re_registration">
                    <label class="form-check-label small text-light" for="allowReReg">
                      Permitir reinscripciones
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- BLOQUE 2: REGLAS DE TRANSFERENCIAS Y PASES -->
          <div class="card bg-surface-dark border-secondary-subtle mb-4 shadow-sm">
            <div class="card-header bg-dark-subtle py-2 px-3 border-bottom border-secondary-subtle d-flex align-items-center justify-content-between">
              <span class="fw-bold text-light d-flex align-items-center gap-2">
                <span class="iconify text-warning" data-icon="solar:transfer-horizontal-bold"></span>
                Transferencias y Pases entre Equipos
              </span>
              <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="transEnabled" v-model="form.transfers_enabled">
                <label class="form-check-label small fw-bold" :class="form.transfers_enabled ? 'text-success' : 'text-danger'" for="transEnabled">
                  {{ form.transfers_enabled ? 'Transferencias HABILITADAS' : 'Transferencias CERRADAS' }}
                </label>
              </div>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small text-muted">Fecha de Apertura Libro de Pases</label>
                  <input type="datetime-local" class="form-control form-control-sm" v-model="form.transfer_start_date">
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-muted">Fecha de Cierre Libro de Pases</label>
                  <input type="datetime-local" class="form-control form-control-sm" v-model="form.transfer_end_date">
                </div>

                <div class="col-md-4">
                  <label class="form-label small text-muted">Máx. Transferencias por Jugador</label>
                  <input type="number" min="1" max="10" class="form-control form-control-sm" v-model.number="form.max_transfers_per_player">
                  <div class="form-text text-muted small">Por defecto: 1 transferencia por edición.</div>
                </div>

                <div class="col-md-8">
                  <label class="form-label small text-muted">Control de Clasificaciones</label>
                  <div class="form-check mt-1">
                    <input class="form-check-input" type="checkbox" id="enforceClass" v-model="form.enforce_classification_limits">
                    <label class="form-check-label small text-light" for="enforceClass">
                      Validar estrictamente cupos por clasificación en equipo receptor
                    </label>
                  </div>
                </div>

                <!-- FIRMAS / APROBACIONES REQUERIDAS -->
                <div class="col-12 mt-3">
                  <label class="form-label small text-primary fw-bold">Flujo de Aprobaciones Requeridas para Ejecutar Pase:</label>
                  <div class="p-3 bg-dark rounded border border-secondary-subtle">
                    <div class="row g-2">
                      <div class="col-md-4">
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="appOrigin" v-model="form.require_origin_club_approval">
                          <label class="form-check-label small text-light" for="appOrigin">
                            <strong>Club de Origen</strong> (Visto Bueno / Carta de Pase)
                          </label>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="appDest" v-model="form.require_destination_club_approval">
                          <label class="form-check-label small text-light" for="appDest">
                            <strong>Club de Destino</strong> (Aceptación de Ficha)
                          </label>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="appAdmin" v-model="form.require_admin_approval">
                          <label class="form-check-label small text-light" for="appAdmin">
                            <strong>Administración / Liga</strong> (Dictamen Final)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-custom d-flex justify-content-between app-modal-footer">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="saving">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary d-flex align-items-center gap-2" @click="save" :disabled="saving || loading">
            <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
            <span v-else class="iconify" data-icon="solar:disk-bold"></span>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { campeonatoService } from '@/services/campeonato.service';

const props = defineProps<{
  isOpen: boolean;
  editionId: number | null;
  editionName: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const loading = ref(false);
const saving = ref(false);

const form = ref<any>({
  registrations_enabled: true,
  registration_start_date: '',
  registration_end_date: '',
  require_registration_approval: false,
  allowed_roles_registration: 'CLUB_AND_ADMIN',
  allow_mass_registration: true,
  allow_re_registration: true,
  transfers_enabled: true,
  transfer_start_date: '',
  transfer_end_date: '',
  max_transfers_per_player: 1,
  require_origin_club_approval: true,
  require_destination_club_approval: true,
  require_admin_approval: true,
  enforce_classification_limits: true,
  enforce_roster_limit: true,
});

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal && props.editionId) {
      await loadConfig();
    }
  }
);

const loadConfig = async () => {
  if (!props.editionId) return;
  loading.value = true;
  try {
    const data = await campeonatoService.getTournamentTransferConfig(props.editionId);
    if (data) {
      // El backend responde en camelCase (TournamentTransferConfigOrmEntity); el formulario usa sus propias claves.
      const toInput = (value: unknown) => (value ? String(value).substring(0, 16) : '');
      form.value = {
        ...form.value,
        registrations_enabled: data.inscriptionsEnabled ?? true,
        registration_start_date: toInput(data.inscriptionsStartDate),
        registration_end_date: toInput(data.inscriptionsEndDate),
        require_registration_approval: data.inscriptionsRequireApproval ?? false,
        allow_mass_registration: data.allowMassInscription ?? true,
        allow_re_registration: data.allowReinscription ?? true,
        transfers_enabled: data.transfersEnabled ?? true,
        transfer_start_date: toInput(data.transfersStartDate),
        transfer_end_date: toInput(data.transfersEndDate),
        max_transfers_per_player: data.maxTransfersPerPlayer ?? 1,
        require_origin_club_approval: data.requireOriginTeamApproval ?? true,
        require_destination_club_approval: data.requireDestinationTeamApproval ?? true,
        require_admin_approval: data.requireAdminApproval ?? true,
      };
    }
  } catch (error) {
    console.error('Error al cargar configuración de transferencias:', error);
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!props.editionId) return;
  saving.value = true;
  try {
    // Solo los campos de UpsertTournamentTransferConfigDto (camelCase): cualquier otro campo responde 400.
    const payload = {
      inscriptionsEnabled: Boolean(form.value.registrations_enabled),
      inscriptionsStartDate: form.value.registration_start_date || null,
      inscriptionsEndDate: form.value.registration_end_date || null,
      inscriptionsRequireApproval: Boolean(form.value.require_registration_approval),
      allowMassInscription: Boolean(form.value.allow_mass_registration),
      allowReinscription: Boolean(form.value.allow_re_registration),
      transfersEnabled: Boolean(form.value.transfers_enabled),
      transfersStartDate: form.value.transfer_start_date || null,
      transfersEndDate: form.value.transfer_end_date || null,
      maxTransfersPerPlayer: Math.max(0, Math.trunc(Number(form.value.max_transfers_per_player) || 0)),
      requireOriginTeamApproval: Boolean(form.value.require_origin_club_approval),
      requireDestinationTeamApproval: Boolean(form.value.require_destination_club_approval),
      requireAdminApproval: Boolean(form.value.require_admin_approval),
    };
    await campeonatoService.saveTournamentTransferConfig(props.editionId, payload);
    emit('saved');
    emit('close');
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Error al guardar la configuración');
  } finally {
    saving.value = false;
  }
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1.5rem;
}

.modal-dialog-custom {
  width: 100%;
  max-width: 850px;
  max-height: 90vh;
  display: flex;
}

.modal-content-custom {
  background: #141b2d;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.modal-header-custom {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.modal-body-custom {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.modal-footer-custom {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.btn-close-custom {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.btn-close-custom:hover {
  color: #fff;
}

.bg-surface-dark {
  background-color: #1a2236;
}
</style>
