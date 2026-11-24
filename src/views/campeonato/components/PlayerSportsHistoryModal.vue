<template>
  <div class="form-page-card border shadow-sm rounded-4 bg-body p-4">
    <!-- Encabezado del Historial Deportivo -->
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 pb-3 border-bottom">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-2">
            MOD-010 · CAMPEONATO
          </span>
          <span class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace px-2 py-1 fs-2">
            HISTORIAL DEPORTIVO
          </span>
        </div>
        <h3 class="crud-title mb-0">Trayectoria e Historial Deportivo del Futbolista</h3>
        <p class="crud-subtitle mb-0">
          Trazabilidad completa de inscripciones oficiales, clubes donde ha militado y transferencias ejecutadas.
        </p>
      </div>

      <button type="button" class="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-1" @click="$emit('close')">
        <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
        <span>Cerrar Historial</span>
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Cargando trayectoria deportiva...</p>
    </div>

    <div v-else-if="data" class="row g-4">
      <!-- Tarjeta Perfil del Jugador -->
      <div class="col-lg-4">
        <div class="card p-4 border rounded-3 bg-body-tertiary shadow-sm text-center">
          <div class="position-relative mx-auto mb-3" style="width: 100px; height: 120px;">
            <img
              v-if="data.player?.photo"
              :src="data.player.photo"
              class="rounded-3 shadow border border-2 border-primary w-100 h-100"
              style="object-fit: cover;"
            />
            <div
              v-else
              class="rounded-3 bg-secondary-subtle text-secondary d-flex flex-column align-items-center justify-content-center w-100 h-100 border border-2 border-dashed"
            >
              <iconify-icon icon="solar:user-bold" class="fs-1 text-secondary"></iconify-icon>
              <small class="text-muted">Sin Foto</small>
            </div>
          </div>

          <h4 class="fw-bold mb-1 text-body-emphasis">{{ data.player?.name }} {{ data.player?.lastName }}</h4>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-3 py-1 mb-3">
            🏷️ {{ data.player?.code || 'JUG-00000' }}
          </span>

          <div class="text-start bg-body p-3 rounded-3 border small space-y-2">
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-secondary">Identificación:</span>
              <strong class="font-monospace text-body-emphasis">{{ data.player?.identification || '-' }}</strong>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-secondary">Edad:</span>
              <strong class="text-body-emphasis">
                🎂 {{ data.player?.ageYears }} años ({{ data.player?.ageMonths }} meses)
              </strong>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-secondary">Posición:</span>
              <strong class="text-body-emphasis">{{ data.player?.demarcation?.name || '-' }}</strong>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-secondary">Club Actual:</span>
              <span class="badge bg-success-subtle text-success">
                ⚽ {{ data.player?.currentTeam?.name || 'Sin club' }}
              </span>
            </div>
            <div class="d-flex justify-content-between py-1">
              <span class="text-secondary">Titularidad del Pase:</span>
              <span class="badge bg-info-subtle text-info">
                {{ data.player?.passOwnerType === 'TEAM' ? (data.player?.passOwnerTeam?.name || 'Club') : '👤 Pase Libre' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Trayectoria e Inscripciones -->
      <div class="col-lg-8">
        <!-- Pestañas internas -->
        <ul class="nav nav-pills mb-3 gap-2" role="tablist">
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fw-semibold"
              :class="activeSubTab === 'timeline' ? 'active bg-primary text-white' : 'btn-outline-secondary'"
              @click="activeSubTab = 'timeline'"
            >
              <iconify-icon icon="solar:clock-circle-bold-duotone" class="fs-5 me-1"></iconify-icon>
              <span>Línea de Tiempo ({{ data.timeline?.length || 0 }})</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fw-semibold"
              :class="activeSubTab === 'registrations' ? 'active bg-primary text-white' : 'btn-outline-secondary'"
              @click="activeSubTab = 'registrations'"
            >
              <iconify-icon icon="solar:diploma-verified-bold-duotone" class="fs-5 me-1"></iconify-icon>
              <span>Inscripciones en Torneos ({{ data.registrations?.length || 0 }})</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link rounded-pill px-3 py-2 fw-semibold"
              :class="activeSubTab === 'transfers' ? 'active bg-primary text-white' : 'btn-outline-secondary'"
              @click="activeSubTab = 'transfers'"
            >
              <iconify-icon icon="solar:transfer-horizontal-bold-duotone" class="fs-5 me-1"></iconify-icon>
              <span>Transferencias ({{ data.transfers?.length || 0 }})</span>
            </button>
          </li>
        </ul>

        <!-- 1. Línea de Tiempo -->
        <div v-if="activeSubTab === 'timeline'" class="card p-3 border rounded-3 bg-body shadow-sm">
          <div v-if="!data.timeline?.length" class="text-center py-4 text-muted">
            No hay eventos registrados en la línea de tiempo.
          </div>
          <div v-else class="timeline-container ps-3">
            <div
              v-for="(t, idx) in data.timeline"
              :key="t.id || idx"
              class="position-relative pb-3 mb-3 border-start border-2 border-primary ps-4"
            >
              <div
                class="position-absolute rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style="width: 24px; height: 24px; left: -13px; top: 0;"
              >
                <iconify-icon icon="solar:check-read-bold" class="fs-6"></iconify-icon>
              </div>
              <div class="d-flex align-items-center justify-content-between mb-1">
                <strong class="text-body-emphasis small">{{ t.action }}</strong>
                <span class="text-muted font-monospace small" style="font-size: 0.75rem;">
                  {{ new Date(t.createdAt).toLocaleString() }}
                </span>
              </div>
              <p class="text-secondary small mb-1">{{ t.comments }}</p>
              <div class="d-flex align-items-center gap-2">
                <span v-if="t.previousStatus" class="badge bg-secondary-subtle text-secondary small">
                  Anterior: {{ t.previousStatus }}
                </span>
                <span v-if="t.newStatus" class="badge bg-info-subtle text-info small">
                  Nuevo: {{ t.newStatus }}
                </span>
                <small class="text-muted">Por: {{ t.performedByName || 'Sistema' }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Inscripciones -->
        <div v-if="activeSubTab === 'registrations'" class="card p-3 border rounded-3 bg-body shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 app-table">
              <thead class="table-light">
                <tr>
                  <th>Torneo</th>
                  <th>Equipo</th>
                  <th>Dorsal</th>
                  <th>Clasificación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!data.registrations?.length">
                  <td colspan="5" class="text-center py-4 text-muted">No cuenta con inscripciones previas</td>
                </tr>
                <tr v-for="r in data.registrations" :key="r.id">
                  <td class="fw-semibold text-body-emphasis">{{ r.teamRegistration?.categoryEdition?.name || 'Torneo' }}</td>
                  <td>{{ r.teamRegistration?.team?.name }}</td>
                  <td class="font-monospace">#{{ r.jerseyNumber }}</td>
                  <td><span class="badge bg-info-subtle text-info">{{ r.playerClassification?.description || 'General' }}</span></td>
                  <td>
                    <span
                      class="badge font-monospace"
                      :class="r.status === 'ELIGIBLE' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'"
                    >
                      {{ r.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Transferencias -->
        <div v-if="activeSubTab === 'transfers'" class="card p-3 border rounded-3 bg-body shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 app-table">
              <thead class="table-light">
                <tr>
                  <th>Campeonato</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!data.transfers?.length">
                  <td colspan="6" class="text-center py-4 text-muted">No cuenta con transferencias registradas</td>
                </tr>
                <tr v-for="tr in data.transfers" :key="tr.id">
                  <td>{{ tr.edition?.name || 'Campeonato' }}</td>
                  <td>{{ tr.originTeam?.name || 'Libre' }}</td>
                  <td class="fw-bold text-primary">{{ tr.destinationTeam?.name }}</td>
                  <td><span class="badge bg-secondary-subtle text-secondary">{{ tr.transferType }}</span></td>
                  <td>
                    <span
                      class="badge"
                      :class="tr.status === 'EXECUTED' ? 'bg-success-subtle text-success' : (tr.status === 'REJECTED' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning')"
                    >
                      {{ tr.status }}
                    </span>
                  </td>
                  <td class="font-monospace small">{{ tr.executionDate ? new Date(tr.executionDate).toLocaleDateString() : new Date(tr.createdAt).toLocaleDateString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CampeonatoApi } from '@/services/campeonato.service';
import { toast } from '@/utils/toastr';

const props = defineProps<{
  playerId: number;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const loading = ref(false);
const data = ref<any>(null);
const activeSubTab = ref<'timeline' | 'registrations' | 'transfers'>('timeline');

const loadHistory = async () => {
  if (!props.playerId) return;
  try {
    loading.value = true;
    const res = await CampeonatoApi.playerTransfers.getSportsHistory(props.playerId);
    data.value = res.data;
  } catch (err: any) {
    console.error(err);
    toast.error('Error al cargar historial deportivo del futbolista');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadHistory();
});
</script>
