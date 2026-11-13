<template>
  <div class="appointment-schedules-page">
    <!-- HEADER DE PÁGINA (ESTILO CRUDS ESTÁNDAR) -->
    <div class="card bg-info-subtle shadow-none position-relative overflow-hidden mb-4 border-0">
      <div class="card-body px-4 py-3">
        <div class="row align-items-center">
          <div class="col-9">
            <h4 class="fw-semibold mb-8 text-dark">Horarios & Disponibilidad de Especialistas</h4>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><router-link to="/" class="text-muted text-decoration-none">Inicio</router-link></li>
                <li class="breadcrumb-item text-muted">Agenda & Citas</li>
                <li class="breadcrumb-item active text-primary" aria-current="page">Horarios y Disponibilidad</li>
              </ol>
            </nav>
          </div>
          <div class="col-3 text-end">
            <button class="btn btn-primary d-inline-flex align-items-center gap-2" :disabled="saving || !selectedEmployeeId" @click="saveSchedules()">
              <iconify-icon icon="solar:diskette-bold" class="fs-5"></iconify-icon>
              <span>{{ saving ? 'Guardando...' : 'Guardar Horarios' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SELECCIÓN DE ESPECIALISTA -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body p-4">
        <div class="row align-items-center">
          <div class="col-md-5">
            <label class="form-label fw-bold text-dark fs-3 mb-1">Seleccionar Colaborador / Especialista</label>
            <p class="text-muted fs-2 mb-0">Configura los días laborables, turnos de atención y horas de almuerzo.</p>
          </div>
          <div class="col-md-7">
            <div class="d-flex align-items-center gap-3">
              <select v-model="selectedEmployeeId" class="form-select" @change="loadEmployeeSchedule()">
                <option :value="null" disabled>-- Seleccione un colaborador --</option>
                <option v-for="emp in specialists" :key="emp.id" :value="emp.id">
                  {{ emp.first_name }} {{ emp.last_name }} - {{ emp.category?.name || 'Spa' }}
                </option>
              </select>
              <button class="btn btn-outline-secondary d-flex align-items-center gap-1 text-nowrap" @click="copyMondayToAll()" :disabled="!selectedEmployeeId">
                <iconify-icon icon="solar:copy-line-duotone"></iconify-icon>
                <span>Replicar Lunes a Sábado</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA DE CONFIGURACIÓN DÍA POR DÍA -->
    <div class="card border-0 shadow-sm" v-if="selectedEmployeeId">
      <div class="card-body p-0">
        
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted mt-2 mb-0">Cargando horario semanal...</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4" style="width: 180px;">DÍA DE LA SEMANA</th>
                <th class="text-center" style="width: 140px;">¿LABORA?</th>
                <th>HORA INICIO JORNADA</th>
                <th>HORA FIN JORNADA</th>
                <th>INICIO RECESO / ALMUERZO</th>
                <th>FIN RECESO / ALMUERZO</th>
                <th class="text-end pe-4" style="width: 120px;">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in weekDays" :key="day.day_of_week" :class="{ 'bg-light-subtle': !day.active }">
                
                <!-- DÍA -->
                <td class="ps-4 fw-bold text-dark">
                  <div class="d-flex align-items-center gap-2">
                    <iconify-icon
                      :icon="day.active ? 'solar:calendar-check-bold' : 'solar:calendar-cross-bold'"
                      :class="day.active ? 'text-primary' : 'text-muted'"
                      class="fs-5"
                    ></iconify-icon>
                    <span>{{ day.name }}</span>
                  </div>
                </td>

                <!-- SWITCH ACTIVO -->
                <td class="text-center">
                  <div class="form-check form-switch d-inline-block">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      v-model="day.active"
                      role="switch"
                    />
                  </div>
                </td>

                <!-- HORA INICIO -->
                <td>
                  <input
                    type="time"
                    v-model="day.start_time"
                    class="form-control form-control-sm"
                    :disabled="!day.active"
                    style="max-width: 140px;"
                  />
                </td>

                <!-- HORA FIN -->
                <td>
                  <input
                    type="time"
                    v-model="day.end_time"
                    class="form-control form-control-sm"
                    :disabled="!day.active"
                    style="max-width: 140px;"
                  />
                </td>

                <!-- RECESO INICIO -->
                <td>
                  <input
                    type="time"
                    v-model="day.break_start"
                    class="form-control form-control-sm"
                    :disabled="!day.active"
                    style="max-width: 140px;"
                  />
                </td>

                <!-- RECESO FIN -->
                <td>
                  <input
                    type="time"
                    v-model="day.break_end"
                    class="form-control form-control-sm"
                    :disabled="!day.active"
                    style="max-width: 140px;"
                  />
                </td>

                <!-- ESTADO -->
                <td class="text-end pe-4">
                  <span
                    class="badge px-3 py-1 fs-2"
                    :class="day.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'"
                  >
                    {{ day.active ? 'Disponible' : 'Descanso' }}
                  </span>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

        <div class="card-footer bg-light-subtle d-flex justify-content-end p-3">
          <button class="btn btn-primary d-inline-flex align-items-center gap-2" :disabled="saving" @click="saveSchedules()">
            <iconify-icon icon="solar:diskette-bold" class="fs-5"></iconify-icon>
            <span>{{ saving ? 'Guardando cambios...' : 'Guardar Configuración Semanal' }}</span>
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { appointmentsService } from '@/services/appointments.service';
import { getEmployees, type EmployeeItem } from '@/services/hr.service';
import { toast } from '@/utils/toastr';

interface DayConfig {
  day_of_week: number;
  name: string;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  active: boolean;
}

const loading = ref(false);
const saving = ref(false);
const specialists = ref<EmployeeItem[]>([]);
const selectedEmployeeId = ref<number | null>(null);

const defaultWeekDays: DayConfig[] = [
  { day_of_week: 1, name: 'Lunes', start_time: '09:00', end_time: '19:00', break_start: '13:00', break_end: '14:00', active: true },
  { day_of_week: 2, name: 'Martes', start_time: '09:00', end_time: '19:00', break_start: '13:00', break_end: '14:00', active: true },
  { day_of_week: 3, name: 'Miércoles', start_time: '09:00', end_time: '19:00', break_start: '13:00', break_end: '14:00', active: true },
  { day_of_week: 4, name: 'Jueves', start_time: '09:00', end_time: '19:00', break_start: '13:00', break_end: '14:00', active: true },
  { day_of_week: 5, name: 'Viernes', start_time: '09:00', end_time: '19:00', break_start: '13:00', break_end: '14:00', active: true },
  { day_of_week: 6, name: 'Sábado', start_time: '09:00', end_time: '18:00', break_start: '13:00', break_end: '14:00', active: true },
  { day_of_week: 0, name: 'Domingo', start_time: '10:00', end_time: '16:00', break_start: '13:00', break_end: '14:00', active: false },
];

const weekDays = ref<DayConfig[]>(JSON.parse(JSON.stringify(defaultWeekDays)));

const loadSpecialists = async () => {
  try {
    specialists.value = await getEmployees(undefined, { acceptsAppointments: true, status: 'ACTIVO' });
    if (specialists.value.length > 0 && !selectedEmployeeId.value) {
      selectedEmployeeId.value = specialists.value[0]?.id ?? null;
      loadEmployeeSchedule();
    }
  } catch (err) {
    console.error('Error loading specialists:', err);
  }
};

const loadEmployeeSchedule = async () => {
  if (!selectedEmployeeId.value) return;
  loading.value = true;
  try {
    const existing = await appointmentsService.getSchedules(selectedEmployeeId.value);
    if (existing && existing.length > 0) {
      weekDays.value = defaultWeekDays.map((defDay) => {
        const found = existing.find((e) => e.day_of_week === defDay.day_of_week);
        if (found) {
          return {
            day_of_week: defDay.day_of_week,
            name: defDay.name,
            start_time: found.start_time?.substring(0, 5) || defDay.start_time,
            end_time: found.end_time?.substring(0, 5) || defDay.end_time,
            break_start: found.break_start?.substring(0, 5) || defDay.break_start,
            break_end: found.break_end?.substring(0, 5) || defDay.break_end,
            active: found.active,
          };
        }
        return { ...defDay };
      });
    } else {
      weekDays.value = JSON.parse(JSON.stringify(defaultWeekDays));
    }
  } catch (err) {
    console.error('Error loading schedule:', err);
  } finally {
    loading.value = false;
  }
};

const copyMondayToAll = () => {
  const monday = weekDays.value.find((d) => d.day_of_week === 1);
  if (!monday) return;
  weekDays.value.forEach((d) => {
    if (d.day_of_week !== 0) { // Don't overwrite Sunday
      d.start_time = monday.start_time;
      d.end_time = monday.end_time;
      d.break_start = monday.break_start;
      d.break_end = monday.break_end;
      d.active = monday.active;
    }
  });
  toast.info('Se han copiado las horas del Lunes a los días Martes a Sábado.', 'Horario Replicado');
};

const saveSchedules = async () => {
  if (!selectedEmployeeId.value) return;
  saving.value = true;
  try {
    const payload = weekDays.value.map((d) => ({
      day_of_week: d.day_of_week,
      start_time: d.start_time,
      end_time: d.end_time,
      break_start: d.break_start,
      break_end: d.break_end,
      active: d.active,
    }));

    await appointmentsService.saveSchedules(selectedEmployeeId.value, payload);
    toast.success('La jornada y disponibilidad de la especialista ha sido actualizada.', '¡Horarios Guardados!');
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'No se pudieron guardar los horarios.', 'Error');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadSpecialists();
});
</script>
