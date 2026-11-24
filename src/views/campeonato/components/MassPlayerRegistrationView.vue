<template>
  <div class="form-page-card border shadow-sm rounded-4 bg-body p-4">
    <!-- Encabezado de la Vista Masiva -->
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 pb-3 border-bottom">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-2">
            MOD-010 · CAMPEONATO
          </span>
          <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1 fs-2">
            INSCRIPCIÓN MASIVA
          </span>
        </div>
        <h3 class="crud-title mb-0">Inscripción Masiva de Nómina de Jugadores</h3>
        <p class="crud-subtitle mb-0">
          Inscribe a múltiples futbolistas en un solo paso con validación atómica de cupos y clasificaciones.
        </p>
      </div>

      <button type="button" class="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-1" @click="$emit('close')">
        <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-4"></iconify-icon>
        <span>Volver a Inscripciones</span>
      </button>
    </div>

    <!-- Selección de Equipo Inscrito y Torneo -->
    <div class="card p-4 border rounded-3 bg-body-tertiary mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-6">
          <label class="form-label text-secondary small fw-semibold">
            Equipo Inscrito en el Campeonato <span class="text-danger">*</span>
          </label>
          <select v-model="selectedTeamRegId" class="form-select" @change="onTeamSelected" :disabled="loadingRoster">
            <option value="" disabled>-- Selecciona un equipo participante --</option>
            <option v-for="tr in teamRegistrations" :key="tr.id" :value="tr.id">
              {{ tr.team?.name }} — {{ tr.categoryEdition?.name || 'Torneo' }}
            </option>
          </select>
        </div>

        <div class="col-md-6" v-if="rosterData">
          <div class="d-flex align-items-center justify-content-between bg-body p-3 rounded-3 border">
            <div>
              <span class="text-secondary small d-block">Cupos Generales de la Categoría</span>
              <strong class="fs-4 text-body-emphasis">
                {{ rosterData.totalActive }} / {{ rosterData.maxGeneralPlayers }}
              </strong>
              <small class="text-muted ms-2">({{ rosterData.availableGeneralSlots }} disponibles)</small>
            </div>
            <div class="progress" style="width: 140px; height: 10px;">
              <div
                class="progress-bar"
                :class="rosterData.availableGeneralSlots <= 0 ? 'bg-danger' : (rosterData.availableGeneralSlots <= 3 ? 'bg-warning' : 'bg-success')"
                :style="{ width: `${Math.min(100, (rosterData.totalActive / rosterData.maxGeneralPlayers) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Desglose de cupos por Clasificación -->
        <div class="col-12" v-if="rosterData?.classificationStats?.length">
          <div class="d-flex flex-wrap gap-2 pt-2">
            <span
              v-for="cs in rosterData.classificationStats"
              :key="cs.playerClassificationId"
              class="badge border px-3 py-2 font-monospace"
              :class="cs.available <= 0 ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-info-subtle text-info border-info-subtle'"
            >
              🏷️ {{ cs.description }}: {{ cs.currentCount }} / {{ cs.maxAllowed }} (Quedan: {{ cs.available }})
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Dinámica de Carga de Futbolistas -->
    <div v-if="selectedTeamRegId" class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 class="fw-bold mb-0 text-body-emphasis d-flex align-items-center gap-2">
          <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="text-primary fs-4"></iconify-icon>
          <span>Nómina a Inscribir ({{ rows.length }} futbolistas)</span>
        </h5>

        <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1" @click="addRow">
          <iconify-icon icon="solar:user-plus-bold" class="fs-5"></iconify-icon>
          <span>+ Agregar Futbolista a la Fila</span>
        </button>
      </div>

      <div class="table-responsive border rounded-3 bg-body">
        <table class="table table-hover align-middle mb-0 app-table">
          <thead class="table-light">
            <tr>
              <th style="width: 45px;">#</th>
              <th style="min-width: 280px;">Futbolista (Buscar en BD) *</th>
              <th style="min-width: 220px;">Clasificación de Futbolista *</th>
              <th style="width: 130px;">Dorsal *</th>
              <th style="width: 140px;">¿Es Capitán?</th>
              <th style="width: 150px;">Carnet Opcional</th>
              <th style="width: 60px;" class="text-end">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="7" class="text-center py-4 text-muted">
                No hay futbolistas agregados en la nómina. Haz clic en <strong>+ Agregar Futbolista a la Fila</strong> para comenzar.
              </td>
            </tr>

            <tr v-for="(row, idx) in rows" :key="row._uid">
              <td class="text-muted font-monospace small">{{ idx + 1 }}</td>
              <td>
                <select v-model="row.playerId" class="form-select form-select-sm" required>
                  <option value="" disabled>-- Seleccione futbolista --</option>
                  <option v-for="p in availablePlayers" :key="p.id" :value="p.id">
                    {{ p.name }} {{ p.lastName }} ({{ p.identification || 'Sin DNI' }})
                  </option>
                </select>
              </td>
              <td>
                <select v-model="row.playerClassificationId" class="form-select form-select-sm" required>
                  <option value="" disabled>-- Clasificación --</option>
                  <option v-for="pc in availableClassifications" :key="pc.id" :value="pc.id">
                    {{ pc.description }} ({{ pc.code || 'Clasif' }})
                  </option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  v-model.number="row.jerseyNumber"
                  class="form-control form-control-sm font-monospace"
                  min="1"
                  max="99"
                  placeholder="Dorsal"
                  required
                />
              </td>
              <td>
                <div class="form-check form-switch mt-1">
                  <input class="form-check-input" type="checkbox" v-model="row.isCaptain" :id="'capt_' + idx" />
                  <label class="form-check-label small ms-1" :for="'capt_' + idx">Capitán</label>
                </div>
              </td>
              <td>
                <input
                  type="text"
                  v-model="row.carnetCode"
                  class="form-control form-control-sm font-monospace"
                  placeholder="Ej. CRN-01"
                />
              </td>
              <td class="text-end">
                <button type="button" class="btn btn-sm btn-outline-danger border-0 p-1 rounded-circle" @click="removeRow(idx)" title="Eliminar fila">
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-5"></iconify-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Botonera de Guardado -->
    <div class="d-flex align-items-center justify-content-end gap-2 pt-3 border-top" v-if="selectedTeamRegId">
      <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="$emit('close')">
        Cancelar
      </button>
      <button
        type="button"
        class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
        :disabled="saving || rows.length === 0"
        @click="submitMass"
      >
        <iconify-icon icon="solar:diskette-bold" class="fs-5"></iconify-icon>
        <span>{{ saving ? 'Procesando Transacción...' : `Inscribir Nómina de ${rows.length} Jugador(es)` }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CampeonatoApi } from '@/services/campeonato.service';
import { toast } from '@/utils/toastr';

const props = defineProps<{
  teamRegistrations: any[];
  players: any[];
  classifications: any[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const selectedTeamRegId = ref<number | ''>('');
const rosterData = ref<any>(null);
const loadingRoster = ref(false);
const saving = ref(false);

const rows = ref<Array<{
  _uid: string;
  playerId: number | '';
  playerClassificationId: string;
  jerseyNumber: number | null;
  isCaptain: boolean;
  carnetCode: string;
}>>([]);

const availablePlayers = computed(() => props.players || []);
const availableClassifications = computed(() => props.classifications || []);

const onTeamSelected = async () => {
  if (!selectedTeamRegId.value) return;
  try {
    loadingRoster.value = true;
    const res = await CampeonatoApi.playerRegistrations.getRoster(selectedTeamRegId.value);
    rosterData.value = res.data;
    if (rows.value.length === 0) {
      addRow();
    }
  } catch (err: any) {
    console.error(err);
    toast.error('Error al cargar balance de cupos del equipo');
  } finally {
    loadingRoster.value = false;
  }
};

const addRow = () => {
  rows.value.push({
    _uid: 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    playerId: '',
    playerClassificationId: props.classifications[0]?.id || '',
    jerseyNumber: (rows.value.length + 1),
    isCaptain: rows.value.length === 0,
    carnetCode: '',
  });
};

const removeRow = (idx: number) => {
  rows.value.splice(idx, 1);
};

const submitMass = async () => {
  if (!selectedTeamRegId.value) {
    toast.warning('Selecciona un equipo para inscribir');
    return;
  }
  if (rows.value.length === 0) {
    toast.warning('Agrega al menos un futbolista a la nómina');
    return;
  }

  // Validaciones locales
  for (let i = 0; i < rows.value.length; i++) {
    const r = rows.value[i];
    if (!r || !r.playerId) {
      toast.warning(`Selecciona el futbolista en la fila #${i + 1}`);
      return;
    }
    if (!r.jerseyNumber || r.jerseyNumber <= 0) {
      toast.warning(`Ingresa el número de dorsal para el futbolista en la fila #${i + 1}`);
      return;
    }
  }

  // Validar jugadores repetidos en la nómina
  const pIds = rows.value.map((r) => r.playerId);
  const dupPlayer = pIds.some((id, idx) => pIds.indexOf(id) !== idx);
  if (dupPlayer) {
    toast.error('No puedes incluir al mismo jugador más de una vez en la misma nómina.');
    return;
  }

  // Validar dorsales repetidos
  const jerseys = rows.value.map((r) => r.jerseyNumber);
  const dupJersey = jerseys.some((num, idx) => jerseys.indexOf(num) !== idx);
  if (dupJersey) {
    toast.error('No se permiten dorsales duplicados en la misma nómina.');
    return;
  }

  try {
    saving.value = true;
    const payload = {
      teamRegistrationId: Number(selectedTeamRegId.value),
      registrations: rows.value.map((r) => ({
        playerId: Number(r.playerId),
        jerseyNumber: Number(r.jerseyNumber),
        playerClassificationId: r.playerClassificationId ? Number(r.playerClassificationId) : undefined,
        isCaptain: Boolean(r.isCaptain),
        carnetCode: r.carnetCode || undefined,
      })),
    };

    const res = await CampeonatoApi.playerRegistrations.massCreate(payload);
    toast.success(res.data?.message || 'Nómina inscrita con éxito');
    emit('saved');
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Error al procesar inscripción masiva');
  } finally {
    saving.value = false;
  }
};
</script>
