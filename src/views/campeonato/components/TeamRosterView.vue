<template>
  <div class="form-page-card border shadow-sm rounded-4 bg-body p-4">
    <!-- Encabezado de la Plantilla -->
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 pb-3 border-bottom">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-2">
            MOD-010 · CAMPEONATO
          </span>
          <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1 fs-2">
            PLANTILLA Y CUPOS
          </span>
        </div>
        <h3 class="crud-title mb-0">Plantilla Oficial y Control de Cupos por Equipo</h3>
        <p class="crud-subtitle mb-0">
          Consulta la nómina registrada, los cupos disponibles por clasificación y administra las habilitaciones.
        </p>
      </div>

      <button type="button" class="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-1" @click="$emit('close')">
        <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
        <span>Volver al Listado</span>
      </button>
    </div>

    <!-- Selector de Equipo -->
    <div class="card p-3 border rounded-3 bg-body-tertiary mb-4">
      <div class="row g-3 align-items-center">
        <div class="col-md-6">
          <label class="form-label text-secondary small fw-semibold">Seleccionar Equipo Inscrito</label>
          <select v-model="selectedTeamRegId" class="form-select" @change="loadRoster" :disabled="loading">
            <option value="" disabled>-- Elige un equipo --</option>
            <option v-for="tr in teamRegistrations" :key="tr.id" :value="tr.id">
              {{ tr.team?.name }} — {{ tr.categoryEdition?.name }}
            </option>
          </select>
        </div>

        <div class="col-md-6 d-flex justify-content-end gap-2" v-if="selectedTeamRegId">
          <button type="button" class="btn btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1" @click="loadRoster" :disabled="loading">
            <iconify-icon icon="solar:refresh-line-duotone" class="fs-5" :class="{ 'spin-anim': loading }"></iconify-icon>
            <span>Actualizar Plantilla</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Métricas de Cupos -->
    <div v-if="roster" class="row g-3 mb-4">
      <!-- Cupo General de Jugadores -->
      <div class="col-md-4">
        <div class="card p-3 border rounded-3 bg-body shadow-sm h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-secondary small fw-semibold">Límite General de Jugadores</span>
            <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="fs-3 text-primary"></iconify-icon>
          </div>
          <div class="d-flex align-items-baseline gap-2 mb-2">
            <h2 class="fw-bold mb-0 text-body-emphasis">{{ roster.totalActive }}</h2>
            <span class="text-secondary fs-5">/ {{ roster.maxGeneralPlayers }} máx.</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div
              class="progress-bar"
              :class="roster.availableGeneralSlots <= 0 ? 'bg-danger' : (roster.availableGeneralSlots <= 3 ? 'bg-warning' : 'bg-success')"
              :style="{ width: `${Math.min(100, (roster.totalActive / roster.maxGeneralPlayers) * 100)}%` }"
            ></div>
          </div>
          <small class="text-muted mt-2 d-block">
            Disponibles: <strong>{{ roster.availableGeneralSlots }}</strong> cupo(s) en nómina
          </small>
        </div>
      </div>

      <!-- Cupos por Clasificación -->
      <div class="col-md-8">
        <div class="card p-3 border rounded-3 bg-body shadow-sm h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-secondary small fw-semibold">Cupos por Clasificación de Futbolistas</span>
            <iconify-icon icon="solar:medal-star-bold-duotone" class="fs-3 text-info"></iconify-icon>
          </div>

          <div v-if="!roster.classificationStats?.length" class="text-muted small py-3">
            Esta categoría no tiene límites por clasificación específicos. Aplica únicamente el límite general.
          </div>

          <div v-else class="row g-2">
            <div
              v-for="cs in roster.classificationStats"
              :key="cs.playerClassificationId"
              class="col-md-6"
            >
              <div class="p-2 border rounded-2 bg-body-tertiary d-flex align-items-center justify-content-between">
                <div>
                  <strong class="d-block small text-body-emphasis">{{ cs.description }}</strong>
                  <span class="badge font-monospace" :class="cs.available <= 0 ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'">
                    {{ cs.currentCount }} / {{ cs.maxAllowed }} usados
                  </span>
                </div>
                <div class="text-end">
                  <span class="badge rounded-pill" :class="cs.available <= 0 ? 'bg-danger text-white' : 'bg-success text-white'">
                    {{ cs.available }} cupo(s) libre(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Listado de Futbolistas de la Plantilla -->
    <div v-if="roster" class="card border rounded-3 bg-body shadow-sm">
      <div class="card-header bg-transparent py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h5 class="fw-bold mb-0 text-body-emphasis">
          Nómina de Jugadores Inscritos ({{ roster.players?.length || 0 }})
        </h5>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 50px;">Dorsal</th>
              <th>Jugador</th>
              <th>Identificación</th>
              <th>Posición</th>
              <th>Clasificación</th>
              <th>Carnet</th>
              <th class="text-center">Estado</th>
              <th class="text-end" style="width: 70px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!roster.players?.length">
              <td colspan="8" class="text-center py-5 text-muted">
                No hay jugadores inscritos en este equipo aún.
              </td>
            </tr>

            <tr v-for="item in roster.players" :key="item.id">
              <td>
                <span class="badge bg-primary text-white font-monospace fs-4 rounded-circle" style="width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;">
                  {{ item.jerseyNumber || '-' }}
                </span>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <img
                    v-if="item.player?.photo"
                    :src="item.player.photo"
                    class="rounded-circle shadow-sm border border-info-subtle"
                    style="width: 32px; height: 32px; object-fit: cover;"
                  />
                  <div v-else class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                    <iconify-icon icon="solar:user-bold" class="fs-5 text-info"></iconify-icon>
                  </div>
                  <div>
                    <span class="fw-semibold text-body-emphasis d-block">
                      {{ item.player?.name }} {{ item.player?.lastName }}
                      <span v-if="item.isCaptain" class="badge bg-warning text-dark ms-1">Capitán</span>
                    </span>
                    <small class="text-muted font-monospace">{{ item.player?.code || 'Sin código' }}</small>
                  </div>
                </div>
              </td>
              <td class="font-monospace small">{{ item.player?.identification || '-' }}</td>
              <td>
                <span class="badge bg-secondary-subtle text-secondary">
                  {{ item.player?.demarcation?.name || 'No definida' }}
                </span>
              </td>
              <td>
                <span class="badge bg-info-subtle text-info border border-info-subtle">
                  🏷️ {{ item.playerClassification?.description || 'General' }}
                </span>
              </td>
              <td>
                <span class="badge bg-body-secondary text-body font-monospace border">
                  🪪 {{ item.carnetCode || '-' }}
                </span>
              </td>
              <td class="text-center">
                <span
                  class="badge font-monospace px-2 py-1"
                  :class="{
                    'bg-success-subtle text-success border border-success-subtle': item.status === 'ELIGIBLE',
                    'bg-warning-subtle text-warning border border-warning-subtle': item.status === 'PENDING_APPROVAL',
                    'bg-danger-subtle text-danger border border-danger-subtle': item.status === 'SUSPENDED' || item.status === 'INELIGIBLE',
                    'bg-secondary-subtle text-secondary border': item.status === 'FINALIZED_BY_TRANSFER',
                  }"
                >
                  {{ item.status === 'ELIGIBLE' ? '🟢 Habilitado' : (item.status === 'PENDING_APPROVAL' ? '⏳ Pendiente Aprobación' : (item.status === 'SUSPENDED' ? '🔴 Suspendido' : item.status)) }}
                </span>
              </td>
              <td class="text-end">
                <div class="dropdown">
                  <button
                    class="btn btn-action-kebab"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-display="static"
                    aria-expanded="false"
                    title="Acciones"
                  >
                    <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li v-if="item.status === 'PENDING_APPROVAL'">
                      <button class="dropdown-item text-success d-flex align-items-center gap-2" @click="updateStatus(item, 'ELIGIBLE')">
                        <iconify-icon icon="solar:check-circle-bold" class="fs-5"></iconify-icon>
                        <span>Aprobar y Habilitar</span>
                      </button>
                    </li>
                    <li v-if="item.status === 'ELIGIBLE'">
                      <button class="dropdown-item text-warning d-flex align-items-center gap-2" @click="updateStatus(item, 'SUSPENDED')">
                        <iconify-icon icon="solar:forbidden-circle-bold" class="fs-5"></iconify-icon>
                        <span>Suspender Jugador</span>
                      </button>
                    </li>
                    <li v-if="item.status === 'SUSPENDED'">
                      <button class="dropdown-item text-info d-flex align-items-center gap-2" @click="updateStatus(item, 'ELIGIBLE')">
                        <iconify-icon icon="solar:restart-bold" class="fs-5"></iconify-icon>
                        <span>Reactivar Habilitación</span>
                      </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" @click="$emit('view-history', item.playerId)">
                        <iconify-icon icon="solar:history-bold-duotone" class="fs-5 text-primary"></iconify-icon>
                        <span>Historial Deportivo</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CampeonatoApi } from '@/services/campeonato.service';
import { toast } from '@/utils/toastr';

const props = defineProps<{
  teamRegistrations: any[];
  initialTeamRegId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'view-history', playerId: string): void;
}>();

const selectedTeamRegId = ref(props.initialTeamRegId || '');
const roster = ref<any>(null);
const loading = ref(false);

const loadRoster = async () => {
  if (!selectedTeamRegId.value) return;
  try {
    loading.value = true;
    const res = await CampeonatoApi.playerRegistrations.getRoster(selectedTeamRegId.value);
    roster.value = res.data;
  } catch (err: any) {
    console.error(err);
    toast.error('Error al cargar la plantilla del equipo');
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (item: any, status: string) => {
  try {
    await CampeonatoApi.playerRegistrations.updateStatus(item.id, { status });
    toast.success('Estado actualizado correctamente');
    await loadRoster();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Error al actualizar estado');
  }
};

onMounted(() => {
  if (selectedTeamRegId.value) {
    loadRoster();
  } else if (props.teamRegistrations.length > 0) {
    selectedTeamRegId.value = props.teamRegistrations[0].id;
    loadRoster();
  }
});
</script>
