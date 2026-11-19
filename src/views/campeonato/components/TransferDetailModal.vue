<template>
  <div v-if="isOpen" class="modal-backdrop-custom">
    <div class="modal-dialog-custom modal-lg">
      <div class="modal-content-custom" v-if="transfer">
        <!-- HEADER -->
        <div class="modal-header-custom d-flex justify-content-between align-items-center">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-warning-subtle text-warning fw-bold font-monospace">SOLICITUD-PASE</span>
              <span class="badge" :class="getStatusBadgeClass(transfer.status)">
                {{ getStatusLabel(transfer.status) }}
              </span>
            </div>
            <h5 class="m-0 text-light fw-bold">Expediente de Transferencia de Jugador</h5>
          </div>
          <button type="button" class="btn-close-custom" @click="close">
            <span class="iconify" data-icon="solar:close-circle-bold" data-width="24"></span>
          </button>
        </div>

        <!-- BODY -->
        <div class="modal-body-custom">
          <!-- TARJETA DEL JUGADOR Y CLUBES -->
          <div class="card bg-surface-dark border-secondary-subtle p-3 mb-4 shadow-sm">
            <div class="row align-items-center g-3">
              <!-- JUGADOR -->
              <div class="col-md-5">
                <div class="d-flex align-items-center gap-3">
                  <div class="player-avatar-circle">
                    <span class="iconify" data-icon="solar:user-bold" data-width="28"></span>
                  </div>
                  <div>
                    <h6 class="m-0 text-light fw-bold">{{ getPlayerFullName(transfer.player) }}</h6>
                    <div class="small text-muted font-monospace">DNI: {{ transfer.player?.id_card || transfer.player?.identification_number || 'N/A' }}</div>
                    <div class="small text-info" v-if="transfer.player?.current_club">
                      Pase: {{ transfer.player.pass_ownership || 'Propio' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- FLECHA Y CLUBES -->
              <div class="col-md-7">
                <div class="d-flex align-items-center justify-content-between p-2 rounded bg-dark border border-secondary-subtle">
                  <div class="text-center flex-fill">
                    <div class="text-xs text-muted mb-1 text-uppercase fw-bold">Club Origen</div>
                    <div class="text-light fw-bold small text-truncate">
                      {{ getClubName(transfer.originTeam, transfer.origin_team) || 'Equipo Origen' }}
                    </div>
                  </div>

                  <div class="px-2 text-warning">
                    <span class="iconify" data-icon="solar:transfer-horizontal-bold" data-width="24"></span>
                  </div>

                  <div class="text-center flex-fill">
                    <div class="text-xs text-muted mb-1 text-uppercase fw-bold">Club Destino</div>
                    <div class="text-success fw-bold small text-truncate">
                      {{ getClubName(transfer.destinationTeam, transfer.destination_team) || 'Equipo Destino' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- DETALLES ADICIONALES -->
            <div class="row g-2 mt-2 pt-2 border-top border-secondary-subtle small text-muted">
              <div class="col-md-4">
                <strong>Edición:</strong> {{ transfer.edition?.name || 'Edición de Torneo' }}
              </div>
              <div class="col-md-4">
                <strong>Fecha Solicitud:</strong> {{ formatDate(transfer.request_date || transfer.created_at) }}
              </div>
              <div class="col-md-4" v-if="transfer.execution_date">
                <strong>Fecha Ejecución:</strong> {{ formatDate(transfer.execution_date) }}
              </div>
              <div class="col-12 mt-2" v-if="transfer.reason">
                <strong>Motivo / Justificación:</strong>
                <p class="m-0 text-light fst-italic">{{ transfer.reason }}</p>
              </div>
            </div>
          </div>

          <!-- FIRMAS Y APROBACIONES -->
          <div class="mb-4">
            <h6 class="text-light fw-bold mb-3 d-flex align-items-center gap-2">
              <span class="iconify text-info" data-icon="solar:checklist-minimalistic-bold"></span>
              Firmas y Resoluciones Requeridas
            </h6>

            <div class="row g-3">
              <div class="col-md-4" v-for="app in approvalsList" :key="app.id || app.role">
                <div class="card h-100 bg-surface-dark border-secondary-subtle p-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="fw-bold small text-light">{{ getRoleLabel(app.role) }}</span>
                    <span class="badge" :class="getApprovalBadgeClass(app.status)">
                      {{ getApprovalStatusLabel(app.status) }}
                    </span>
                  </div>

                  <div class="small text-muted flex-fill">
                    <div v-if="app.approved_by_user">
                      <strong>Por:</strong> {{ app.approved_by_user }}
                    </div>
                    <div v-if="app.approval_date">
                      <strong>Fecha:</strong> {{ formatDate(app.approval_date) }}
                    </div>
                    <div v-if="app.notes" class="mt-1 text-light fst-italic bg-dark p-1 rounded">
                      "{{ app.notes }}"
                    </div>
                    <div v-if="app.status === 'PENDING'" class="text-warning-subtle mt-2">
                      <span class="iconify me-1" data-icon="solar:clock-circle-bold"></span>
                      Pendiente de dictamen
                    </div>
                  </div>

                  <!-- BOTONES PARA FIRMAR SI ESTA PENDIENTE Y EL PASE ESTA PENDIENTE -->
                  <div class="mt-3 pt-2 border-top border-secondary-subtle" v-if="canActOnApproval(app)">
                    <div class="d-flex gap-2">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-success flex-fill d-flex align-items-center justify-content-center gap-1"
                        @click="promptApproval(app.role, 'APPROVED')"
                        :disabled="actionLoading"
                      >
                        <span class="iconify" data-icon="solar:check-circle-bold"></span>
                        Aprobar
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-danger flex-fill d-flex align-items-center justify-content-center gap-1"
                        @click="promptApproval(app.role, 'REJECTED')"
                        :disabled="actionLoading"
                      >
                        <span class="iconify" data-icon="solar:close-circle-bold"></span>
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- DOCUMENTOS ADJUNTOS -->
          <div class="card bg-surface-dark border-secondary-subtle p-3 mb-3" v-if="transfer.documents && transfer.documents.length">
            <h6 class="text-light fw-bold mb-2 small d-flex align-items-center gap-2">
              <span class="iconify text-warning" data-icon="solar:document-bold"></span>
              Documentación y Cartas de Solvencia
            </h6>
            <div class="d-flex flex-wrap gap-2">
              <a 
                v-for="(doc, idx) in transfer.documents" 
                :key="idx" 
                :href="doc.url || doc" 
                target="_blank" 
                class="btn btn-sm btn-dark border border-secondary-subtle text-light d-flex align-items-center gap-2"
              >
                <span class="iconify text-primary" data-icon="solar:file-text-bold"></span>
                <span>{{ doc.name || 'Documento adjunto' }}</span>
              </a>
            </div>
          </div>

          <!-- CAJA DE MOTIVO DE RECHAZO SI FUE RECHAZADA -->
          <div class="alert alert-danger mb-0 rounded-3" v-if="transfer.status === 'REJECTED'">
            <h6 class="fw-bold mb-1 d-flex align-items-center gap-2">
              <span class="iconify" data-icon="solar:danger-triangle-bold"></span>
              Solicitud Rechazada
            </h6>
            <p class="m-0 small">{{ transfer.rejection_reason || 'La solicitud fue rechazada por una de las partes requeridas.' }}</p>
          </div>

          <!-- BANNER DE EJECUTADA -->
          <div class="alert alert-success mb-0 rounded-3 d-flex align-items-center gap-2" v-if="transfer.status === 'EXECUTED'">
            <span class="iconify fs-4" data-icon="solar:verified-check-bold"></span>
            <div>
              <div class="fw-bold small">Transferencia Ejecutada Exitosamente</div>
              <div class="small">El pase ya fue asentado en la plantilla activa del club destino y se finalizó la inscripción anterior.</div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer-custom d-flex justify-content-between align-items-center">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="actionLoading">
            Cerrar
          </button>

          <!-- BOTÓN DE EJECUCIÓN TRANSACCIONAL -->
          <div class="d-flex gap-2">
            <button 
              type="button" 
              class="btn btn-success fw-bold d-flex align-items-center gap-2 px-3"
              v-if="canExecuteTransfer"
              @click="executeTransfer"
              :disabled="actionLoading"
            >
              <span v-if="actionLoading" class="spinner-border spinner-border-sm" role="status"></span>
              <span v-else class="iconify" data-icon="solar:play-circle-bold" data-width="20"></span>
              Ejecutar Pase en el Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { campeonatoService } from '@/services/campeonato.service';

const props = defineProps<{
  isOpen: boolean;
  transfer: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const actionLoading = ref(false);

const approvalsList = computed(() => {
  if (!props.transfer) return [];
  return props.transfer.approvals || [];
});

const canExecuteTransfer = computed(() => {
  if (!props.transfer) return false;
  // Solo transferencias con estado APPROVED (o PENDING_APPROVAL cuyas firmas requeridas ya estén completas)
  if (props.transfer.status === 'EXECUTED' || props.transfer.status === 'REJECTED' || props.transfer.status === 'CANCELLED') {
    return false;
  }
  const approvals = props.transfer.approvals || [];
  if (approvals.length === 0) return true;
  return approvals.every((a: any) => a.status === 'APPROVED');
});

const canActOnApproval = (app: any) => {
  if (!props.transfer) return false;
  if (props.transfer.status === 'EXECUTED' || props.transfer.status === 'REJECTED') return false;
  return app.status === 'PENDING';
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ORIGIN_TEAM': return 'Club de Origen';
    case 'DESTINATION_TEAM': return 'Club de Destino';
    case 'ADMIN': return 'Administrador de Liga';
    default: return role;
  }
};

const getApprovalStatusLabel = (st: string) => {
  switch (st) {
    case 'APPROVED': return 'Aprobado';
    case 'REJECTED': return 'Rechazado';
    default: return 'Pendiente';
  }
};

const getApprovalBadgeClass = (st: string) => {
  switch (st) {
    case 'APPROVED': return 'bg-success-subtle text-success border border-success-subtle';
    case 'REJECTED': return 'bg-danger-subtle text-danger border border-danger-subtle';
    default: return 'bg-warning-subtle text-warning border border-warning-subtle';
  }
};

const getStatusLabel = (st: string) => {
  switch (st) {
    case 'PENDING_APPROVAL': return 'Pendiente de Aprobación';
    case 'APPROVED': return 'Aprobada (Lista para Ejecución)';
    case 'REJECTED': return 'Rechazada';
    case 'EXECUTED': return 'Ejecutada';
    case 'CANCELLED': return 'Cancelada';
    default: return st;
  }
};

const getStatusBadgeClass = (st: string) => {
  switch (st) {
    case 'PENDING_APPROVAL': return 'bg-warning text-dark';
    case 'APPROVED': return 'bg-info text-white';
    case 'REJECTED': return 'bg-danger text-white';
    case 'EXECUTED': return 'bg-success text-white';
    default: return 'bg-secondary text-white';
  }
};

const getPlayerFullName = (player: any) => {
  if (!player) return 'Jugador';
  return `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Sin Nombre';
};

const getClubName = (teamObj: any, teamDirect: any) => {
  const team = teamObj || teamDirect;
  if (!team) return '';
  return team.team_name || team.name || '';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

const promptApproval = async (role: string, status: 'APPROVED' | 'REJECTED') => {
  const reason = prompt(
    status === 'APPROVED' 
      ? 'Comentarios u observaciones de visto bueno (Opcional):' 
      : 'Indique el motivo obligatorio del rechazo:'
  );
  if (status === 'REJECTED' && (!reason || !reason.trim())) {
    alert('Debe especificar un motivo para rechazar la solicitud.');
    return;
  }

  actionLoading.value = true;
  try {
    await campeonatoService.approveTransfer(props.transfer.id, {
      role,
      status,
      comments: reason?.trim() || undefined,
    });
    emit('updated');
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Error al procesar la resolución');
  } finally {
    actionLoading.value = false;
  }
};

const executeTransfer = async () => {
  if (!confirm('¿Está seguro de EJECUTAR esta transferencia? Esta acción cerrará la inscripción en el club origen, habilitará al jugador en el club destino y actualizará su ficha deportiva de forma irreversible.')) {
    return;
  }

  actionLoading.value = true;
  try {
    await campeonatoService.executeTransfer(props.transfer.id);
    alert('¡Transferencia ejecutada con éxito! La plantilla y el historial del jugador se han actualizado.');
    emit('updated');
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Error al ejecutar la transferencia');
  } finally {
    actionLoading.value = false;
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

.player-avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #232d4b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
  border: 2px solid #3b82f6;
}

.bg-surface-dark {
  background-color: #1a2236;
}

.text-xs {
  font-size: 0.725rem;
}
</style>
