<template>
  <div class="appointments-calendar-page">
    <!-- HEADER DE PÁGINA (ESTILO CRUDS ESTÁNDAR) -->
    <div class="card bg-info-subtle shadow-none position-relative overflow-hidden mb-4 border-0">
      <div class="card-body px-4 py-3">
        <div class="row align-items-center">
          <div class="col-9">
            <h4 class="fw-semibold mb-8 text-dark">Agenda & Calendario de Citas</h4>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><router-link to="/" class="text-muted text-decoration-none">Inicio</router-link></li>
                <li class="breadcrumb-item text-muted">Agenda & Citas</li>
                <li class="breadcrumb-item active text-primary" aria-current="page">Calendario</li>
              </ol>
            </nav>
          </div>
          <div class="col-3 text-end">
            <button class="btn btn-primary d-inline-flex align-items-center gap-2" @click="openNewAppointmentModal()">
              <iconify-icon icon="solar:calendar-add-bold" class="fs-5"></iconify-icon>
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BARRA DE CONTROL Y NAVEGACIÓN DE FECHAS -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          <!-- NAVEGACIÓN DÍA / FECHA -->
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary d-flex align-items-center" @click="changeDate(-1)" title="Día Anterior">
              <iconify-icon icon="solar:arrow-left-line-duotone" class="fs-5"></iconify-icon>
            </button>
            <button class="btn btn-sm btn-outline-primary fw-medium px-3" @click="setToday()">
              Hoy
            </button>
            <button class="btn btn-sm btn-outline-secondary d-flex align-items-center" @click="changeDate(1)" title="Día Siguiente">
              <iconify-icon icon="solar:arrow-right-line-duotone" class="fs-5"></iconify-icon>
            </button>
            
            <div class="ms-2 d-flex align-items-center gap-2">
              <input
                type="date"
                v-model="selectedDate"
                class="form-control form-control-sm text-center fw-semibold"
                style="width: 150px;"
                @change="loadAppointments()"
              />
              <span class="badge bg-primary-subtle text-primary text-uppercase px-3 py-2 fs-2 fw-bold">
                {{ formattedDateDisplay }}
              </span>
            </div>
          </div>

          <!-- FILTRO DE ESPECIALISTAS Y VISTA -->
          <div class="d-flex align-items-center gap-3">
            <div class="d-flex align-items-center gap-2">
              <label class="form-label mb-0 fs-2 text-muted fw-bold">Especialista:</label>
              <select v-model="filterEmployeeId" class="form-select form-select-sm" style="min-width: 180px;" @change="loadAppointments()">
                <option :value="null">Todas las Especialistas</option>
                <option v-for="emp in specialists" :key="emp.id" :value="emp.id">
                  {{ emp.first_name }} {{ emp.last_name }}
                </option>
              </select>
            </div>

            <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" @click="loadAppointments()" title="Recargar Citas">
              <iconify-icon icon="solar:refresh-line-duotone" :class="{ 'spin-anim': loading }"></iconify-icon>
              <span>Actualizar</span>
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- CALENDARIO EN COLUMNAS POR ESPECIALISTA (VISTA SPA / SALÓN) -->
    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando agenda...</span>
          </div>
          <p class="text-muted mt-2 mb-0">Cargando disponibilidad y citas...</p>
        </div>

        <div v-else-if="visibleSpecialists.length === 0" class="text-center py-5">
          <iconify-icon icon="solar:users-group-rounded-line-duotone" class="fs-1 text-muted mb-2"></iconify-icon>
          <h5 class="text-dark">No hay especialistas configuradas</h5>
          <p class="text-muted">Asegúrate de marcar "Habilitada para Agendamiento de Citas" en la ficha del empleado.</p>
          <router-link to="/talento-humano/empleados" class="btn btn-sm btn-primary">
            Ir a Registro de Empleados
          </router-link>
        </div>

        <div v-else class="calendar-grid-container table-responsive">
          <table class="table calendar-table mb-0">
            <thead>
              <tr class="calendar-header-row">
                <th class="time-header-col text-center align-middle" style="width: 80px;">
                  <span class="text-muted fs-2 fw-bold">HORA</span>
                </th>
                <th
                  v-for="spec in visibleSpecialists"
                  :key="spec.id"
                  class="specialist-header-col text-center py-3"
                  :style="{ borderTop: `4px solid ${spec.calendar_color || '#0085db'}` }"
                >
                  <div class="d-flex align-items-center justify-content-center gap-2">
                    <div
                      class="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                      :style="{ backgroundColor: spec.calendar_color || '#0085db', width: '36px', height: '36px', fontSize: '13px' }"
                    >
                      {{ spec.first_name?.[0] }}{{ spec.last_name?.[0] }}
                    </div>
                    <div class="text-start">
                      <h6 class="mb-0 fw-bold text-dark">{{ spec.first_name }} {{ spec.last_name }}</h6>
                      <small class="text-muted d-block fs-1">{{ spec.category?.name || 'Especialista Spa' }}</small>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="timeSlot in timeSlots" :key="timeSlot" class="calendar-time-row">
                <!-- COLUMNA DE HORA -->
                <td class="time-label-cell text-center align-top py-2">
                  <span class="text-muted fs-2 fw-semibold">{{ timeSlot }}</span>
                </td>

                <!-- COLUMNAS DE ESPECIALISTAS -->
                <td
                  v-for="spec in visibleSpecialists"
                  :key="spec.id"
                  class="slot-cell position-relative p-1"
                  @click="onSlotClick(spec, timeSlot)"
                >
                  <!-- CITAS QUE INICIAN EN ESTE SLOT -->
                  <div
                    v-for="apt in getAppointmentsForSlot(spec.id, timeSlot)"
                    :key="apt.id"
                    class="appointment-card p-2 rounded-2 shadow-sm text-start"
                    :style="{
                      borderLeft: `4px solid ${spec.calendar_color || '#0085db'}`,
                      backgroundColor: getStatusBgColor(apt.status)
                    }"
                    @click.stop="openAppointmentDetails(apt)"
                  >
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="badge" :class="getStatusBadgeClass(apt.status)">
                        {{ apt.status }}
                      </span>
                      <small class="fw-bold text-dark font-monospace fs-1">{{ apt.order_number }}</small>
                    </div>
                    <div class="fw-bold text-dark fs-2 text-truncate">
                      {{ apt.customer?.razon_social || apt.customer?.nombre_comercial || 'Cliente' }}
                    </div>
                    <div class="text-muted fs-1 text-truncate mb-1">
                      <iconify-icon icon="solar:tag-price-line-duotone" class="me-1"></iconify-icon>
                      {{ getServicesSummary(apt) }}
                    </div>
                    <div class="d-flex align-items-center justify-content-between pt-1 border-top border-light-subtle">
                      <small class="text-muted fs-1">
                        <iconify-icon icon="solar:clock-circle-line-duotone" class="me-1"></iconify-icon>
                        {{ formatTimeOnly(apt.start_time) }} - {{ formatTimeOnly(apt.end_time) }}
                      </small>
                      <span class="fw-bold text-success fs-1">
                        ${{ Number(apt.total_estimated || 0).toFixed(2) }}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- MODAL NUEVA CITA / RESERVA -->
    <div class="modal fade" id="modalNewAppointment" tabindex="-1" aria-hidden="true" ref="modalNewAppointmentRef">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2">
              <iconify-icon icon="solar:calendar-add-bold" class="fs-4"></iconify-icon>
              <span>Nueva Cita / Reserva</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="saveNewAppointment">
              
              <div class="row g-3">
                <!-- CLIENTE -->
                <div class="col-md-6">
                  <label class="form-label fw-bold text-dark">Cliente <span class="text-danger">*</span></label>
                  <select v-model="formAppointment.customer_id" class="form-select" required>
                    <option :value="null" disabled>Seleccione un cliente...</option>
                    <option v-for="c in customersList" :key="c.id" :value="c.id">
                      {{ c.razon_social || c.nombre_comercial }} ({{ c.num_document }})
                    </option>
                  </select>
                </div>

                <!-- ESPECIALISTA -->
                <div class="col-md-6">
                  <label class="form-label fw-bold text-dark">Especialista / Profesional <span class="text-danger">*</span></label>
                  <select v-model="formAppointment.employee_id" class="form-select" required>
                    <option :value="null" disabled>Seleccione especialista...</option>
                    <option v-for="emp in specialists" :key="emp.id" :value="emp.id">
                      {{ emp.first_name }} {{ emp.last_name }} ({{ emp.category?.name || 'Spa' }})
                    </option>
                  </select>
                </div>

                <!-- FECHA -->
                <div class="col-md-4">
                  <label class="form-label fw-bold text-dark">Fecha de la Cita <span class="text-danger">*</span></label>
                  <input type="date" v-model="formAppointment.appointment_date" class="form-control" required />
                </div>

                <!-- HORA INICIO -->
                <div class="col-md-4">
                  <label class="form-label fw-bold text-dark">Hora Inicio <span class="text-danger">*</span></label>
                  <input type="time" v-model="formAppointment.start_time" class="form-control" required @change="recalcTimesAndTotals()" />
                </div>

                <!-- HORA FIN CALCULADA -->
                <div class="col-md-4">
                  <label class="form-label fw-bold text-dark">Hora Fin Estimada</label>
                  <input type="time" v-model="formAppointment.end_time" class="form-control bg-light" readonly />
                </div>
              </div>

              <!-- SECCIÓN SERVICIOS -->
              <div class="mt-4">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <label class="form-label fw-bold text-dark mb-0">Servicios Solicitados <span class="text-danger">*</span></label>
                  <small class="text-muted">Seleccione los servicios para calcular duración y total</small>
                </div>

                <div class="border rounded-2 p-3 bg-light-subtle">
                  <div class="row g-2 mb-3">
                    <div class="col-md-8">
                      <select v-model="selectedServiceToAdd" class="form-select">
                        <option :value="null">-- Elegir servicio de spa/salón para agregar --</option>
                        <option v-for="srv in availableServices" :key="srv.id" :value="srv">
                          {{ srv.name }} (${{ Number(srv.salePrice || 0).toFixed(2) }} - {{ srv.estimatedDuration || 30 }} min)
                        </option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <button type="button" class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-1" :disabled="!selectedServiceToAdd" @click="addServiceItem()">
                        <iconify-icon icon="solar:add-circle-bold"></iconify-icon>
                        <span>Agregar Servicio</span>
                      </button>
                    </div>
                  </div>

                  <!-- TABLA DE SERVICIOS AGREGADOS -->
                  <div v-if="formAppointment.items.length === 0" class="text-center py-3 text-muted">
                    No ha agregado servicios a esta cita todavía. Seleccione uno arriba.
                  </div>
                  <div v-else class="table-responsive">
                    <table class="table table-sm table-bordered bg-white mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Servicio</th>
                          <th class="text-center" style="width: 100px;">Duración</th>
                          <th class="text-end" style="width: 100px;">Precio</th>
                          <th class="text-end" style="width: 100px;">IVA (15%)</th>
                          <th class="text-end" style="width: 100px;">Total</th>
                          <th class="text-center" style="width: 50px;"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(it, idx) in formAppointment.items" :key="idx">
                          <td class="align-middle fw-medium">{{ it.service_name }}</td>
                          <td class="align-middle text-center">{{ it.duration_minutes }} min</td>
                          <td class="align-middle text-end">${{ Number(it.price).toFixed(2) }}</td>
                          <td class="align-middle text-end">${{ (Number(it.price) * 0.15).toFixed(2) }}</td>
                          <td class="align-middle text-end fw-bold text-success">
                            ${{ (Number(it.price) * 1.15).toFixed(2) }}
                          </td>
                          <td class="align-middle text-center">
                            <button type="button" class="btn btn-sm text-danger p-0" @click="removeServiceItem(idx)">
                              <iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr class="fw-bold bg-light">
                          <td colspan="2" class="text-end">Duración Total: {{ totalDurationMinutes }} min</td>
                          <td class="text-end">${{ calculatedSubtotal.toFixed(2) }}</td>
                          <td class="text-end">${{ calculatedTax.toFixed(2) }}</td>
                          <td class="text-end text-success fs-3">${{ calculatedTotal.toFixed(2) }}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <!-- NOTAS / OBSERVACIONES -->
              <div class="mt-3">
                <label class="form-label fw-bold text-dark">Notas u Observaciones del Cliente</label>
                <textarea
                  v-model="formAppointment.notes"
                  rows="2"
                  class="form-control"
                  placeholder="Ej: Prefiere esmalte tono nude, tiene uñas frágiles, piel sensible..."
                ></textarea>
              </div>

              <div class="modal-footer px-0 pb-0 mt-4 border-0">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary d-flex align-items-center gap-1" :disabled="savingApt || formAppointment.items.length === 0">
                  <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                  <span>{{ savingApt ? 'Guardando Cita...' : 'Confirmar y Agendar' }}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE CITA / ACCIONES OPERATIVAS -->
    <div class="modal fade" id="modalAppointmentDetails" tabindex="-1" aria-hidden="true" ref="modalAppointmentDetailsRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-dark text-white">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-primary fs-2 font-monospace">{{ selectedAppointment?.order_number }}</span>
              <h5 class="modal-title fw-bold text-white mb-0">Detalle de la Orden de Cita</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4" v-if="selectedAppointment">
            
            <!-- ESTADO ACTUAL -->
            <div class="d-flex align-items-center justify-content-between p-3 rounded-2 mb-3 bg-light">
              <div>
                <small class="text-muted d-block fs-1">ESTADO OPERATIVO</small>
                <span class="badge px-3 py-2 fs-2" :class="getStatusBadgeClass(selectedAppointment.status)">
                  {{ selectedAppointment.status }}
                </span>
              </div>
              <div class="text-end">
                <small class="text-muted d-block fs-1">TOTAL ESTIMADO</small>
                <span class="fs-4 fw-bold text-success">${{ Number(selectedAppointment.total_estimated).toFixed(2) }}</span>
              </div>
            </div>

            <!-- DATOS CLIENTE Y ESPECIALISTA -->
            <div class="list-group list-group-flush mb-3">
              <div class="list-group-item px-0 py-2 d-flex justify-content-between">
                <span class="text-muted">Cliente:</span>
                <span class="fw-bold text-dark">{{ selectedAppointment.customer?.razon_social }}</span>
              </div>
              <div class="list-group-item px-0 py-2 d-flex justify-content-between">
                <span class="text-muted">Cédula / RUC:</span>
                <span class="font-monospace">{{ selectedAppointment.customer?.num_document }}</span>
              </div>
              <div class="list-group-item px-0 py-2 d-flex justify-content-between">
                <span class="text-muted">Especialista:</span>
                <span class="fw-bold" :style="{ color: selectedAppointment.employee?.calendar_color || '#0085db' }">
                  {{ selectedAppointment.employee?.first_name }} {{ selectedAppointment.employee?.last_name }}
                </span>
              </div>
              <div class="list-group-item px-0 py-2 d-flex justify-content-between">
                <span class="text-muted">Horario:</span>
                <span class="fw-bold text-dark">
                  {{ selectedAppointment.appointment_date }} | {{ formatTimeOnly(selectedAppointment.start_time) }} - {{ formatTimeOnly(selectedAppointment.end_time) }}
                </span>
              </div>
            </div>

            <!-- SERVICIOS -->
            <div class="mb-3">
              <h6 class="fw-bold text-dark mb-2">Servicios Programados:</h6>
              <ul class="list-group">
                <li
                  v-for="item in selectedAppointment.items"
                  :key="item.id"
                  class="list-group-item d-flex justify-content-between align-items-center py-2"
                >
                  <div>
                    <span class="fw-medium text-dark">{{ item.service_name }}</span>
                    <small class="text-muted d-block fs-1">{{ item.duration_minutes }} min</small>
                  </div>
                  <span class="fw-bold">${{ Number(item.total || item.price * 1.15).toFixed(2) }}</span>
                </li>
              </ul>
            </div>

            <!-- ACCIONES DE CAMBIO DE ESTADO -->
            <div class="d-flex flex-wrap gap-2 pt-2 border-top">
              <button
                v-if="selectedAppointment.status === 'PROGRAMADA'"
                class="btn btn-sm btn-primary flex-grow-1"
                @click="updateStatus('CONFIRMADA')"
              >
                Confirmar Asistencia
              </button>
              
              <button
                v-if="['PROGRAMADA', 'CONFIRMADA'].includes(selectedAppointment.status)"
                class="btn btn-sm btn-warning flex-grow-1 text-dark"
                @click="updateStatus('EN_ATENCION')"
              >
                Iniciar Atención
              </button>

              <button
                v-if="selectedAppointment.status === 'EN_ATENCION'"
                class="btn btn-sm btn-success flex-grow-1"
                @click="updateStatus('FINALIZADA')"
              >
                Finalizar Servicio
              </button>

              <button
                v-if="['FINALIZADA', 'CONFIRMADA', 'EN_ATENCION'].includes(selectedAppointment.status)"
                class="btn btn-sm btn-info flex-grow-1 text-white d-flex align-items-center justify-content-center gap-1"
                @click="goToBilling(selectedAppointment)"
              >
                <iconify-icon icon="solar:bill-list-bold"></iconify-icon>
                <span>Cobrar en Facturación</span>
              </button>

              <button
                v-if="selectedAppointment.status !== 'CANCELADA'"
                class="btn btn-sm btn-outline-danger"
                @click="updateStatus('CANCELADA')"
              >
                Cancelar Cita
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { appointmentsService, type Appointment, type AppointmentItem } from '@/services/appointments.service';
import { getEmployees, type EmployeeItem } from '@/services/hr.service';
import { getCustomers, type CustomerItem } from '@/services/contacts.service';
import { getInventoryServices, type InventoryServiceItem } from '@/services/inventory.service';
import { toast } from '@/utils/toastr';

const router = useRouter();

// State
const loading = ref(false);
const savingApt = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const filterEmployeeId = ref<number | null>(null);

const appointments = ref<Appointment[]>([]);
const specialists = ref<EmployeeItem[]>([]);
const customersList = ref<CustomerItem[]>([]);
const availableServices = ref<InventoryServiceItem[]>([]);

const selectedAppointment = ref<Appointment | null>(null);
const selectedServiceToAdd = ref<InventoryServiceItem | null>(null);

// Form Nueva Cita
const formAppointment = ref<{
  customer_id: number | null;
  employee_id: number | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  items: AppointmentItem[];
}>({
  customer_id: null,
  employee_id: null,
  appointment_date: (new Date().toISOString().split('T')[0]) as string,
  start_time: '10:00',
  end_time: '10:30',
  notes: '',
  items: [],
});

// Time slots from 08:00 to 19:30 in 30-min increments
const timeSlots = computed(() => {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push(`${hh}:00`);
    slots.push(`${hh}:30`);
  }
  return slots;
});

// Visible specialists
const visibleSpecialists = computed(() => {
  if (filterEmployeeId.value) {
    return specialists.value.filter((e: EmployeeItem) => e.id === filterEmployeeId.value);
  }
  return specialists.value;
});

const formattedDateDisplay = computed(() => {
  if (!selectedDate.value) return '';
  const d = new Date(selectedDate.value + 'T00:00:00');
  return d.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
});

// Totals calculation
const totalDurationMinutes = computed(() => {
  return formAppointment.value.items.reduce((acc, it) => acc + (it.duration_minutes || 30), 0);
});

const calculatedSubtotal = computed(() => {
  return formAppointment.value.items.reduce((acc, it) => acc + Number(it.price || 0), 0);
});

const calculatedTax = computed(() => {
  return calculatedSubtotal.value * 0.15;
});

const calculatedTotal = computed(() => {
  return calculatedSubtotal.value + calculatedTax.value;
});

// Methods
const setToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0];
  loadAppointments();
};

const changeDate = (days: number) => {
  const current = new Date(selectedDate.value + 'T00:00:00');
  current.setDate(current.getDate() + days);
  selectedDate.value = current.toISOString().split('T')[0];
  loadAppointments();
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    const data = await appointmentsService.list({
      startDate: selectedDate.value,
      endDate: selectedDate.value,
      employeeId: filterEmployeeId.value || undefined,
    });
    appointments.value = data;
  } catch (err: any) {
    console.error('Error loading appointments:', err);
  } finally {
    loading.value = false;
  }
};

const loadInitialData = async () => {
  try {
    const [empsData, custData, srvData] = await Promise.all([
      getEmployees(undefined, { acceptsAppointments: true, status: 'ACTIVO' }),
      getCustomers(),
      getInventoryServices(),
    ]);
    specialists.value = empsData;
    customersList.value = custData;
    availableServices.value = srvData;
  } catch (err) {
    console.error('Error loading initial data:', err);
  }
};

const getAppointmentsForSlot = (employeeId: number, slotTime: string) => {
  return appointments.value.filter((apt) => {
    if (apt.employee_id !== employeeId) return false;
    const aptStart = apt.start_time.substring(0, 5);
    return aptStart === slotTime;
  });
};

const onSlotClick = (spec: EmployeeItem, timeSlot: string) => {
  openNewAppointmentModal(spec.id, timeSlot);
};

const openNewAppointmentModal = (employeeId?: number, timeSlot?: string) => {
  formAppointment.value = {
    customer_id: customersList.value[0]?.id || null,
    employee_id: employeeId || specialists.value[0]?.id || null,
    appointment_date: (selectedDate.value || new Date().toISOString().split('T')[0]) as string,
    start_time: timeSlot || '10:00',
    end_time: '10:30',
    notes: '',
    items: [],
  };
  selectedServiceToAdd.value = null;

  // Open modal using bootstrap
  const modalEl = document.getElementById('modalNewAppointment');
  if (modalEl && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
};

const addServiceItem = () => {
  if (!selectedServiceToAdd.value) return;
  const srv = selectedServiceToAdd.value;
  const duration = parseInt(srv.estimatedDuration as any) || 45;
  const price = Number(srv.salePrice) || 20;

  formAppointment.value.items.push({
    service_id: srv.id,
    service_name: srv.name,
    duration_minutes: duration,
    price: price,
    tax_rate: 15.0,
    notes: '',
  });

  selectedServiceToAdd.value = null;
  recalcTimesAndTotals();
};

const removeServiceItem = (index: number) => {
  formAppointment.value.items.splice(index, 1);
  recalcTimesAndTotals();
};

const recalcTimesAndTotals = () => {
  if (!formAppointment.value.start_time) return;
  const [h, m] = formAppointment.value.start_time.split(':').map(Number);
  const totalMin = (h || 0) * 60 + (m || 0) + (totalDurationMinutes.value > 0 ? totalDurationMinutes.value : 30);
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  formAppointment.value.end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

const saveNewAppointment = async () => {
  if (!formAppointment.value.customer_id || !formAppointment.value.employee_id) {
    toast.warning('Seleccione cliente y especialista.');
    return;
  }
  if (formAppointment.value.items.length === 0) {
    toast.warning('Debe agregar al menos un servicio a la cita.');
    return;
  }

  savingApt.value = true;
  try {
    await appointmentsService.create({
      customer_id: formAppointment.value.customer_id,
      employee_id: formAppointment.value.employee_id,
      appointment_date: formAppointment.value.appointment_date,
      start_time: formAppointment.value.start_time,
      end_time: formAppointment.value.end_time,
      status: 'CONFIRMADA',
      notes: formAppointment.value.notes,
      items: formAppointment.value.items.map((i) => ({
        service_id: i.service_id || undefined,
        service_name: i.service_name,
        duration_minutes: i.duration_minutes,
        price: i.price,
        tax_rate: i.tax_rate,
      })),
    });

    const modalEl = document.getElementById('modalNewAppointment');
    if (modalEl && (window as any).bootstrap) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }

    toast.success('La cita ha sido registrada exitosamente en el calendario.', '¡Cita Agendada!');
    loadAppointments();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'No se pudo guardar la cita.', 'Error');
  } finally {
    savingApt.value = false;
  }
};

const openAppointmentDetails = (apt: Appointment) => {
  selectedAppointment.value = apt;
  const modalEl = document.getElementById('modalAppointmentDetails');
  if (modalEl && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
};

const updateStatus = async (newStatus: string) => {
  if (!selectedAppointment.value) return;
  try {
    const updated = await appointmentsService.changeStatus(selectedAppointment.value.id, newStatus);
    selectedAppointment.value = updated;
    toast.success(`La cita ahora está en estado: ${newStatus}`, 'Estado Actualizado');
    loadAppointments();
  } catch (err: any) {
    toast.error('No se pudo actualizar el estado.', 'Error');
  }
};

const goToBilling = (apt: Appointment) => {
  // Close modal
  const modalEl = document.getElementById('modalAppointmentDetails');
  if (modalEl && (window as any).bootstrap) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }

  // Navigate to invoice view with query params so it pre-fills customer and appointment
  router.push({
    path: '/ventas/facturas',
    query: {
      customerId: apt.customer_id,
      appointmentId: apt.id,
      orderNumber: apt.order_number,
    },
  });
};

const getServicesSummary = (apt: Appointment) => {
  return (apt.items || []).map((i) => i.service_name).join(', ') || 'Servicios Spa';
};

const formatTimeOnly = (timeStr?: string) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PROGRAMADA': return 'bg-info-subtle text-info';
    case 'CONFIRMADA': return 'bg-primary-subtle text-primary';
    case 'EN_ATENCION': return 'bg-warning-subtle text-warning-emphasis';
    case 'FINALIZADA': return 'bg-purple-subtle text-purple';
    case 'FACTURADA': return 'bg-success-subtle text-success';
    case 'CANCELADA': return 'bg-danger-subtle text-danger';
    default: return 'bg-secondary-subtle text-secondary';
  }
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'EN_ATENCION': return 'rgba(254, 243, 199, 0.7)';
    case 'CONFIRMADA': return 'rgba(224, 231, 255, 0.6)';
    case 'FINALIZADA': return 'rgba(243, 232, 255, 0.7)';
    case 'FACTURADA': return 'rgba(220, 252, 231, 0.7)';
    case 'CANCELADA': return 'rgba(254, 226, 226, 0.6)';
    default: return 'rgba(241, 245, 249, 0.8)';
  }
};

onMounted(async () => {
  await loadInitialData();
  await loadAppointments();
});
</script>

<style scoped>
.calendar-grid-container {
  max-height: 720px;
  overflow-y: auto;
}

.calendar-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.calendar-header-row th {
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
  border-bottom: 2px solid #e2e8f0;
}

.time-header-col {
  background-color: #f8fafc !important;
  border-right: 1px solid #e2e8f0;
}

.specialist-header-col {
  min-width: 240px;
  border-right: 1px solid #e2e8f0;
}

.time-label-cell {
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px dashed #e2e8f0;
  vertical-align: top;
}

.slot-cell {
  min-height: 60px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px dashed #e2e8f0;
  cursor: pointer;
  transition: background-color 0.15s ease;
  vertical-align: top;
}

.slot-cell:hover {
  background-color: rgba(240, 249, 255, 0.5);
}

.appointment-card {
  cursor: pointer;
  margin-bottom: 4px;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.appointment-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
