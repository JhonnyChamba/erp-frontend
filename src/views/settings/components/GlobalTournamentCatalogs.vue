<template>
  <div class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card text-white">
    <!-- Encabezado con Botón de Acción -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
      <div>
        <h5 class="fw-bold text-white mb-1 d-flex align-items-center gap-2">
          <iconify-icon :icon="currentMeta.icon" class="fs-4 text-primary"></iconify-icon>
          <span>{{ currentMeta.title }}</span>
        </h5>
        <small class="text-secondary">{{ currentMeta.subtitle }}</small>
      </div>
      <button
        class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2 text-nowrap shadow-sm"
        style="height: 40px;"
        @click="openCreateModal"
      >
        <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
        <span>+ Nuevo {{ currentMeta.entityName }}</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-4 p-2 rounded-3 bg-dark-subtle border border-secondary-subtle">
      <div class="input-group flex-grow-1" style="max-width: 380px;">
        <span class="input-group-text bg-dark border-secondary-subtle text-secondary" style="height: 40px;">
          <iconify-icon icon="solar:magnifer-line-duotone"></iconify-icon>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control bg-dark border-secondary-subtle text-white"
          style="height: 40px;"
          :placeholder="`Buscar en ${currentMeta.title.toLowerCase()}...`"
          @input="onSearchInput"
        />
      </div>
      <div class="ms-auto pe-2 text-secondary fs-2 d-none d-sm-block">
        Total: <span class="text-white fw-bold">{{ items.length }}</span> registro(s)
      </div>
    </div>

    <!-- TABLA 1: GREMIOS ARBITRALES -->
    <div v-if="tab === 'referee_guilds'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>#</th>
            <th>Descripción / Nombre</th>
            <th>Siglas</th>
            <th class="text-center">Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="5" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando gremios arbitrales...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="5" class="py-4 text-secondary">No hay gremios arbitrales registrados.</td>
          </tr>
          <tr v-for="(item, idx) in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="text-secondary">{{ idx + 1 }}</td>
            <td>
              <span class="fw-bold text-white">{{ item.description }}</span>
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.acronyms || '-' }}
              </span>
            </td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-1">
                <button class="btn btn-sm btn-outline-warning rounded-circle p-2" title="Editar" @click="openEditModal(item)">
                  <iconify-icon icon="solar:pen-new-square-linear" class="fs-5"></iconify-icon>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle p-2" title="Eliminar" @click="deleteItem(item.id)">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-5"></iconify-icon>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TABLA 2: PADRÓN GLOBAL DE ÁRBITROS -->
    <div v-else-if="tab === 'global_referees'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Documento / Cédula</th>
            <th>Nombre Completo</th>
            <th>Gremio / Núcleo</th>
            <th>Contacto</th>
            <th class="text-center">Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="6" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando padrón global de árbitros...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="6" class="py-4 text-secondary">No hay árbitros registrados en el padrón global.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                {{ item.identification }}
              </span>
            </td>
            <td class="fw-bold text-white">
              {{ item.name }} {{ item.lastName }}
            </td>
            <td>
              <span v-if="item.guild?.description" class="badge bg-secondary-subtle text-secondary px-2 py-1">
                🏛️ {{ item.guild.description }} <span v-if="item.guild.acronyms">({{ item.guild.acronyms }})</span>
              </span>
              <span v-else class="text-muted small">Independiente</span>
            </td>
            <td>
              <div class="small">
                <span v-if="item.phone" class="d-block text-secondary">📞 {{ item.phone }}</span>
                <span v-if="item.email" class="d-block text-secondary">✉️ {{ item.email }}</span>
                <span v-if="!item.phone && !item.email" class="text-muted">-</span>
              </div>
            </td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-1">
                <button class="btn btn-sm btn-outline-warning rounded-circle p-2" title="Editar" @click="openEditModal(item)">
                  <iconify-icon icon="solar:pen-new-square-linear" class="fs-5"></iconify-icon>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle p-2" title="Eliminar del Padrón Global" @click="deleteItem(item.id, true)">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-5"></iconify-icon>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TABLA 3: CLASIFICACIÓN DE FUTBOLISTAS -->
    <div v-else-if="tab === 'player_classifications'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Descripción / Nombre</th>
            <th>Código</th>
            <th>Observación</th>
            <th class="text-center">Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="5" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando clasificaciones...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="5" class="py-4 text-secondary">No hay clasificaciones de futbolistas registradas.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="fw-bold text-white">
              🏷️ {{ item.description }}
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.code || '-' }}
              </span>
            </td>
            <td class="text-secondary small">{{ item.observation || '-' }}</td>
            <td class="text-center">
              <span :class="item.isActive ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-1">
                <button class="btn btn-sm btn-outline-warning rounded-circle p-2" title="Editar" @click="openEditModal(item)">
                  <iconify-icon icon="solar:pen-new-square-linear" class="fs-5"></iconify-icon>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle p-2" title="Eliminar" @click="deleteItem(item.id)">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-5"></iconify-icon>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TABLA 4: DEMARCACIONES -->
    <div v-else-if="tab === 'demarcations'" class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr class="border-bottom border-dark-subtle text-secondary fs-2 text-uppercase">
            <th>Posición en Campo</th>
            <th>Código</th>
            <th>Zona de Juego</th>
            <th>Límite Máx. x Equipo</th>
            <th class="text-center">Orden</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="6" class="py-4 text-secondary">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando demarcaciones...
            </td>
          </tr>
          <tr v-else-if="items.length === 0" class="text-center">
            <td colspan="6" class="py-4 text-secondary">No hay demarcaciones registradas.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-bottom border-dark-subtle">
            <td class="fw-bold text-white">
              🏃 {{ item.name }}
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">
                {{ item.code }}
              </span>
            </td>
            <td>
              <span class="badge bg-info-subtle text-info px-2 py-1">
                {{ getZoneLabel(item.zone) }}
              </span>
            </td>
            <td>
              <span v-if="item.maxPlayers && Number(item.maxPlayers) > 0" class="badge bg-warning-subtle text-warning font-monospace px-2 py-1">
                Máx. {{ item.maxPlayers }}
              </span>
              <span v-else class="text-muted small">Sin límite</span>
            </td>
            <td class="text-center font-monospace">{{ item.order ?? '-' }}</td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-1">
                <button class="btn btn-sm btn-outline-warning rounded-circle p-2" title="Editar" @click="openEditModal(item)">
                  <iconify-icon icon="solar:pen-new-square-linear" class="fs-5"></iconify-icon>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle p-2" title="Eliminar" @click="deleteItem(item.id)">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-5"></iconify-icon>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL DE CREACIÓN / EDICIÓN -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.75); z-index: 2050;"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-dialog modal-dialog-centered" :class="tab === 'global_referees' ? 'modal-lg' : 'modal-md'">
          <div class="modal-content border-0 shadow-lg bg-navy-card text-white">
            <div class="modal-header border-bottom border-dark-subtle">
              <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2">
                <iconify-icon :icon="isEditing ? 'solar:pen-new-square-linear' : 'solar:add-circle-line-duotone'" class="fs-4 text-primary"></iconify-icon>
                <span>{{ isEditing ? 'Editar' : 'Nuevo' }} {{ currentMeta.entityName }}</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
            </div>
            
            <form @submit.prevent="submitForm">
              <div class="modal-body p-4">
                <!-- FORMULARIO 1: GREMIOS ARBITRALES -->
                <div v-if="tab === 'referee_guilds'" class="row g-3">
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Descripción o Nombre del Gremio / Núcleo *</label>
                    <input
                      v-model="formData.description"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Asociación de Árbitros de Pichincha"
                      required
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Siglas o Abreviatura</label>
                    <input
                      v-model="formData.acronyms"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white text-uppercase font-monospace"
                      placeholder="Ej. AAP, NAC"
                    />
                  </div>
                </div>

                <!-- FORMULARIO 2: PADRÓN GLOBAL DE ÁRBITROS -->
                <div v-else-if="tab === 'global_referees'" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Número de Documento / Cédula *</label>
                    <input
                      v-model="formData.identification"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white font-monospace"
                      placeholder="Cédula o pasaporte"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Gremio o Núcleo Arbitral</label>
                    <select v-model="formData.guildId" class="form-select bg-dark border-secondary-subtle text-white">
                      <option value="">-- Sin gremio (Independiente) --</option>
                      <option v-for="g in guildsList" :key="g.id" :value="g.id">
                        {{ g.description }} {{ g.acronyms ? '(' + g.acronyms + ')' : '' }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Nombres *</label>
                    <input
                      v-model="formData.name"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Nombres del árbitro"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Apellidos *</label>
                    <input
                      v-model="formData.lastName"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Apellidos del árbitro"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Teléfono Personal</label>
                    <input
                      v-model="formData.phone"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. 0991234567"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Correo Electrónico</label>
                    <input
                      v-model="formData.email"
                      type="email"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="arbitro@ejemplo.com"
                    />
                  </div>
                </div>

                <!-- FORMULARIO 3: CLASIFICACIÓN DE FUTBOLISTAS -->
                <div v-else-if="tab === 'player_classifications'" class="row g-3">
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Descripción / Nombre de Clasificación *</label>
                    <input
                      v-model="formData.description"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Juvenil, Nativo, Foráneo, Extranjero"
                      required
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Código Abreviado</label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white text-uppercase font-monospace"
                      placeholder="Ej. JUV, NAT, FOR"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label text-secondary small fw-semibold">Observaciones / Reglamento</label>
                    <textarea
                      v-model="formData.observation"
                      rows="2"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Notas o condiciones de esta clasificación..."
                    ></textarea>
                  </div>
                </div>

                <!-- FORMULARIO 4: DEMARCACIONES -->
                <div v-else-if="tab === 'demarcations'" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Nombre de la Demarcación *</label>
                    <input
                      v-model="formData.name"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="Ej. Delantero Centro"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Código Único *</label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="form-control bg-dark border-secondary-subtle text-white text-uppercase font-monospace"
                      placeholder="Ej. DEL, ARQ, DEF"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-semibold">Zona de Juego *</label>
                    <select v-model="formData.zone" class="form-select bg-dark border-secondary-subtle text-white" required>
                      <option value="GOALKEEPER">Portero / Arquero</option>
                      <option value="DEFENDER">Defensa</option>
                      <option value="MIDFIELDER">Mediocampista / Volante</option>
                      <option value="FORWARD">Delantero / Atacante</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Límite Máx. x Equipo</label>
                    <input
                      v-model.number="formData.maxPlayers"
                      type="number"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="0 = Sin límite"
                      min="0"
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-secondary small fw-semibold">Orden</label>
                    <input
                      v-model.number="formData.order"
                      type="number"
                      class="form-control bg-dark border-secondary-subtle text-white"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div class="modal-footer border-top border-dark-subtle bg-dark-subtle">
                <button type="button" class="btn btn-secondary rounded-pill px-4" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary rounded-pill px-4 fw-semibold" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CampeonatoApi } from '@/services/campeonato.service';
import { toast } from '@/utils/toastr';

const props = defineProps<{
  tab: 'referee_guilds' | 'global_referees' | 'player_classifications' | 'demarcations';
}>();

const items = ref<any[]>([]);
const guildsList = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const formData = ref<Record<string, any>>({});

const metaMap = {
  referee_guilds: {
    title: 'Gremios y Núcleos Arbitrales',
    subtitle: 'Catálogo global de asociaciones, colegios y núcleos arbitrales registrados en el sistema.',
    entityName: 'Gremio Arbitral',
    icon: 'solar:shield-star-bold-duotone',
  },
  global_referees: {
    title: 'Padrón Global de Árbitros',
    subtitle: 'Registro centralizado de jueces y colegiados deportivos para su asignación a campeonatos.',
    entityName: 'Árbitro',
    icon: 'solar:whistle-bold-duotone',
  },
  player_classifications: {
    title: 'Clasificación Global de Futbolistas',
    subtitle: 'Catálogo maestro de clasificaciones deportivas (Juvenil, Nativo, Foráneo, Extranjero, etc.).',
    entityName: 'Clasificación',
    icon: 'solar:user-check-bold-duotone',
  },
  demarcations: {
    title: 'Demarcaciones y Posiciones en Campo',
    subtitle: 'Catálogo global de zonas y demarcaciones tácticas de juego (Portero, Defensa, etc.).',
    entityName: 'Demarcación',
    icon: 'solar:running-bold-duotone',
  },
};

const currentMeta = computed(() => metaMap[props.tab] || metaMap.referee_guilds);

const getZoneLabel = (zone: string) => {
  const map: Record<string, string> = {
    GOALKEEPER: '🧤 Portero',
    DEFENDER: '🛡️ Defensa',
    MIDFIELDER: '⚙️ Mediocampo',
    FORWARD: '⚡ Delantero',
  };
  return map[zone] || zone || 'General';
};

const loadData = async () => {
  try {
    loading.value = true;
    const query: any = { limit: 100, search: searchQuery.value.trim() || undefined };

    if (props.tab === 'referee_guilds') {
      const res = await CampeonatoApi.refereeGuilds.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'global_referees') {
      query.global = 'true';
      const [refRes, gRes] = await Promise.all([
        CampeonatoApi.referees.list(query),
        CampeonatoApi.refereeGuilds.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      ]);
      items.value = refRes.data?.data || [];
      guildsList.value = gRes.data?.data || [];
    } else if (props.tab === 'player_classifications') {
      const res = await CampeonatoApi.playerClassifications.list(query);
      items.value = res.data?.data || [];
    } else if (props.tab === 'demarcations') {
      const res = await CampeonatoApi.demarcations.list(query);
      items.value = res.data?.data || [];
    }
  } catch (err) {
    console.error('Error al cargar datos globales:', err);
    toast.error('Error al cargar información del catálogo');
  } finally {
    loading.value = false;
  }
};

let searchTimer: any = null;
const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadData();
  }, 350);
};

const openCreateModal = async () => {
  isEditing.value = false;
  editingId.value = null;
  if (props.tab === 'global_referees') {
    if (guildsList.value.length === 0) {
      try {
        const gRes = await CampeonatoApi.refereeGuilds.list({ limit: 100 });
        guildsList.value = gRes.data?.data || [];
      } catch {}
    }
    formData.value = { isActive: true, guildId: '' };
  } else if (props.tab === 'demarcations') {
    formData.value = { zone: 'DEFENDER', maxPlayers: 0, order: (items.value.length || 0) + 1 };
  } else {
    formData.value = { isActive: true };
  }
  showModal.value = true;
};

const openEditModal = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = { ...item };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  formData.value = {};
  isEditing.value = false;
  editingId.value = null;
};

const submitForm = async () => {
  try {
    saving.value = true;
    const payload = { ...formData.value };
    delete payload.id;
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;

    if (props.tab === 'referee_guilds') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.refereeGuilds.update(editingId.value, payload);
        toast.success('Gremio arbitral actualizado exitosamente');
      } else {
        await CampeonatoApi.refereeGuilds.create(payload);
        toast.success('Gremio arbitral creado exitosamente');
      }
    } else if (props.tab === 'global_referees') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.referees.update(editingId.value, payload);
        toast.success('Árbitro actualizado exitosamente');
      } else {
        await CampeonatoApi.referees.create(payload);
        toast.success('Árbitro registrado en el Padrón Global exitosamente');
      }
    } else if (props.tab === 'player_classifications') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.playerClassifications.update(editingId.value, payload);
        toast.success('Clasificación de futbolista actualizada exitosamente');
      } else {
        await CampeonatoApi.playerClassifications.create(payload);
        toast.success('Clasificación de futbolista creada exitosamente');
      }
    } else if (props.tab === 'demarcations') {
      if (isEditing.value && editingId.value) {
        await CampeonatoApi.demarcations.update(editingId.value, payload);
        toast.success('Demarcación actualizada exitosamente');
      } else {
        await CampeonatoApi.demarcations.create(payload);
        toast.success('Demarcación creada exitosamente');
      }
    }

    closeModal();
    loadData();
  } catch (err: any) {
    console.error('Error al guardar registro:', err);
    toast.error(err?.response?.data?.message || err?.message || 'Error al guardar el registro');
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: string, isGlobal = false) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este registro del catálogo global?')) return;
  try {
    if (props.tab === 'referee_guilds') {
      await CampeonatoApi.refereeGuilds.delete(id);
    } else if (props.tab === 'global_referees') {
      await CampeonatoApi.referees.delete(id);
    } else if (props.tab === 'player_classifications') {
      await CampeonatoApi.playerClassifications.delete(id);
    } else if (props.tab === 'demarcations') {
      await CampeonatoApi.demarcations.delete(id);
    }
    toast.success('Registro eliminado exitosamente');
    loadData();
  } catch (err: any) {
    console.error('Error al eliminar registro:', err);
    toast.error(err?.response?.data?.message || 'Error al eliminar el registro');
  }
};

watch(() => props.tab, () => {
  searchQuery.value = '';
  loadData();
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.bg-navy-card {
  background: #111c2d;
}
</style>
