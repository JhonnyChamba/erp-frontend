<template>
  <div class="appointment-orders-page">
    <!-- HEADER DE PÁGINA (ESTILO SPIKE ADMIN ESTÁNDAR) -->
    <div class="card bg-info-subtle shadow-none position-relative overflow-hidden mb-4 border-0">
      <div class="card-body px-4 py-3">
        <div class="row align-items-center">
          <div class="col-9">
            <h4 class="fw-semibold mb-8 text-dark">Órdenes de Cita & Recepción</h4>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><router-link to="/" class="text-muted text-decoration-none">Inicio</router-link></li>
                <li class="breadcrumb-item text-muted">Agenda & Citas</li>
                <li class="breadcrumb-item active text-primary" aria-current="page">Órdenes de Cita</li>
              </ol>
            </nav>
          </div>
          <div class="col-3 text-end">
            <router-link to="/citas/calendario" class="btn btn-primary d-inline-flex align-items-center gap-2">
              <iconify-icon icon="solar:calendar-bold" class="fs-5"></iconify-icon>
              <span>Ver Calendario</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- FILTROS Y BÚSQUEDA -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          
          <!-- BÚSQUEDA TEXTUAL -->
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0">
                <iconify-icon icon="solar:magnifer-line-duotone" class="fs-5 text-muted"></iconify-icon>
              </span>
              <input
                type="text"
                v-model="searchQuery"
                class="form-control border-start-0"
                placeholder="Buscar orden, cliente o especialista..."
                @input="debouncedSearch()"
              />
            </div>
          </div>

          <!-- ESTADO -->
          <div class="col-md-2">
            <select v-model="filterStatus" class="form-select" @change="loadOrders()">
              <option value="">Todos los Estados</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EN_ATENCION">En Atención</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="FACTURADA">Facturada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <!-- ESPECIALISTA -->
          <div class="col-md-3">
            <select v-model="filterEmployeeId" class="form-select" @change="loadOrders()">
              <option :value="null">Todas las Especialistas</option>
              <option v-for="emp in specialists" :key="emp.id" :value="emp.id">
                {{ emp.first_name }} {{ emp.last_name }} ({{ emp.category?.name || 'Spa' }})
              </option>
            </select>
          </div>

          <!-- FECHA DESDE / HASTA -->
          <div class="col-md-2">
            <input type="date" v-model="filterStartDate" class="form-control" @change="loadOrders()" title="Fecha Desde" />
          </div>
          <div class="col-md-2">
            <input type="date" v-model="filterEndDate" class="form-control" @change="loadOrders()" title="Fecha Hasta" />
          </div>

        </div>
      </div>
    </div>

    <!-- TABLA DE ÓRDENES DE CITA -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted mt-2 mb-0">Cargando órdenes de cita...</p>
        </div>

        <div v-else-if="orders.length === 0" class="text-center py-5">
          <iconify-icon icon="solar:clipboard-list-line-duotone" class="fs-1 text-muted mb-2"></iconify-icon>
          <h5 class="text-dark">No se encontraron órdenes de cita</h5>
          <p class="text-muted">No hay registros con los filtros seleccionados.</p>
          <router-link to="/citas/calendario" class="btn btn-sm btn-primary">
            Agendar en Calendario
          </router-link>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4" style="width: 140px;">ORDEN #</th>
                <th>FECHA & HORA</th>
                <th>CLIENTE</th>
                <th>ESPECIALISTA</th>
                <th>SERVICIOS</th>
                <th class="text-center">ESTADO</th>
                <th class="text-end">TOTAL</th>
                <th class="text-center pe-4" style="width: 180px;">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                
                <!-- NÚMERO DE ORDEN -->
                <td class="ps-4">
                  <span class="badge bg-primary-subtle text-primary font-monospace fs-2 px-2 py-1">
                    {{ order.order_number }}
                  </span>
                </td>

                <!-- FECHA Y HORA -->
                <td>
                  <div class="fw-semibold text-dark">{{ order.appointment_date }}</div>
                  <small class="text-muted fs-1 font-monospace">
                    {{ formatTime(order.start_time) }} - {{ formatTime(order.end_time) }}
                  </small>
                </td>

                <!-- CLIENTE -->
                <td>
                  <div class="fw-bold text-dark">{{ order.customer?.razon_social || order.customer?.nombre_comercial }}</div>
                  <small class="text-muted font-monospace fs-1">{{ order.customer?.num_document }}</small>
                </td>

                <!-- ESPECIALISTA -->
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="rounded-circle d-inline-block"
                      :style="{ backgroundColor: order.employee?.calendar_color || '#0085db', width: '10px', height: '10px' }"
                    ></span>
                    <span class="fw-medium text-dark">
                      {{ order.employee?.first_name }} {{ order.employee?.last_name }}
                    </span>
                  </div>
                </td>

                <!-- SERVICIOS -->
                <td>
                  <div class="text-dark fs-2 text-truncate" style="max-width: 250px;">
                    {{ getServicesList(order) }}
                  </div>
                  <small class="text-muted fs-1">
                    {{ getTotalDuration(order) }} min de atención
                  </small>
                </td>

                <!-- ESTADO -->
                <td class="text-center">
                  <span class="badge px-3 py-2 fs-2" :class="getStatusBadgeClass(order.status)">
                    {{ order.status }}
                  </span>
                </td>

                <!-- TOTAL -->
                <td class="text-end fw-bold text-success fs-3">
                  ${{ Number(order.total_estimated || 0).toFixed(2) }}
                </td>

                <!-- ACCIONES -->
                <td class="text-center pe-4">
                  <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      Acciones
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow">
                      
                      <!-- VER TICKET / ORDEN IMPRESA -->
                      <li>
                        <button class="dropdown-item d-flex align-items-center gap-2" @click="openTicketModal(order)">
                          <iconify-icon icon="solar:printer-line-duotone" class="fs-5 text-primary"></iconify-icon>
                          <span>Imprimir Ticket de Orden</span>
                        </button>
                      </li>

                      <!-- COBRAR EN FACTURACIÓN -->
                      <li v-if="order.status !== 'FACTURADA' && order.status !== 'CANCELADA'">
                        <button class="dropdown-item d-flex align-items-center gap-2 text-success" @click="goToBilling(order)">
                          <iconify-icon icon="solar:bill-list-line-duotone" class="fs-5"></iconify-icon>
                          <span class="fw-bold">Cobrar en Facturación</span>
                        </button>
                      </li>

                      <li><hr class="dropdown-divider" /></li>

                      <!-- CAMBIOS DE ESTADO RÁPIDO -->
                      <li v-if="order.status === 'PROGRAMADA'">
                        <button class="dropdown-item" @click="updateStatus(order, 'CONFIRMADA')">
                          Marcar como Confirmada
                        </button>
                      </li>
                      <li v-if="['PROGRAMADA', 'CONFIRMADA'].includes(order.status)">
                        <button class="dropdown-item" @click="updateStatus(order, 'EN_ATENCION')">
                          Pasar a "En Atención"
                        </button>
                      </li>
                      <li v-if="order.status === 'EN_ATENCION'">
                        <button class="dropdown-item" @click="updateStatus(order, 'FINALIZADA')">
                          Marcar como Finalizada
                        </button>
                      </li>
                      <li v-if="order.status !== 'CANCELADA'">
                        <button class="dropdown-item text-danger" @click="updateStatus(order, 'CANCELADA')">
                          Cancelar Cita
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

    <!-- MODAL TICKET DE CITA / ORDEN DE ATENCIÓN TÉRMICA -->
    <div class="modal fade" id="modalAppointmentTicket" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-dark text-white py-2">
            <h6 class="modal-title fw-bold text-white mb-0">Ticket de Orden de Servicio</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" v-if="ticketOrder" id="printableTicketArea">
            
            <div class="ticket-receipt text-center font-monospace">
              <h5 class="fw-bold mb-0 text-dark">SPA & CENTRO DE BELLEZA</h5>
              <small class="text-muted d-block mb-2">ORDEN DE ATENCIÓN</small>
              <div class="border-top border-bottom border-dark py-1 my-2">
                <span class="fs-3 fw-bold text-dark">{{ ticketOrder.order_number }}</span>
              </div>

              <div class="text-start fs-1 mb-2">
                <div><strong>Fecha:</strong> {{ ticketOrder.appointment_date }}</div>
                <div><strong>Hora:</strong> {{ formatTime(ticketOrder.start_time) }} - {{ formatTime(ticketOrder.end_time) }}</div>
                <div><strong>Cliente:</strong> {{ ticketOrder.customer?.razon_social }}</div>
                <div><strong>Cédula:</strong> {{ ticketOrder.customer?.num_document }}</div>
                <div><strong>Especialista:</strong> {{ ticketOrder.employee?.first_name }} {{ ticketOrder.employee?.last_name }}</div>
              </div>

              <div class="border-top border-dark pt-2 mb-2 text-start">
                <table class="w-100 fs-1">
                  <thead>
                    <tr class="border-bottom border-secondary">
                      <th class="text-start">Servicio</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in ticketOrder.items" :key="item.id">
                      <td class="text-start py-1">
                        {{ item.service_name }}
                        <small class="d-block text-muted">({{ item.duration_minutes }} min)</small>
                      </td>
                      <td class="text-end py-1">${{ Number(item.total || item.price * 1.15).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="border-top border-dark pt-2 text-end">
                <div class="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>${{ Number(ticketOrder.subtotal || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>IVA 15%:</span>
                  <span>${{ Number(ticketOrder.tax_amount || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between fw-bold fs-3 text-dark border-top pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>${{ Number(ticketOrder.total_estimated || 0).toFixed(2) }}</span>
                </div>
              </div>

              <div v-if="ticketOrder.notes" class="text-start border-top mt-2 pt-1 fs-1 text-muted">
                <strong>Notas:</strong> {{ ticketOrder.notes }}
              </div>

              <div class="mt-4 pt-2 border-top border-dashed text-muted fs-1">
                ¡Gracias por su visita!<br />
                Este ticket es una orden de trabajo interna.
              </div>
            </div>

          </div>
          <div class="modal-footer p-2 bg-light d-flex justify-content-between">
            <button type="button" class="btn btn-sm btn-light" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-sm btn-primary d-flex align-items-center gap-1" @click="printTicket()">
              <iconify-icon icon="solar:printer-line-duotone"></iconify-icon>
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { appointmentsService, type Appointment } from '@/services/appointments.service';
import { getEmployees, type EmployeeItem } from '@/services/hr.service';
import { toast } from '@/utils/toastr';

const router = useRouter();

const loading = ref(false);
const searchQuery = ref('');
const filterStatus = ref('');
const filterEmployeeId = ref<number | null>(null);
const filterStartDate = ref('');
const filterEndDate = ref('');

const orders = ref<Appointment[]>([]);
const specialists = ref<EmployeeItem[]>([]);
const ticketOrder = ref<Appointment | null>(null);

let debounceTimeout: any = null;

const debouncedSearch = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    loadOrders();
  }, 300);
};

const loadOrders = async () => {
  loading.value = true;
  try {
    orders.value = await appointmentsService.list({
      status: filterStatus.value || undefined,
      employeeId: filterEmployeeId.value || undefined,
      startDate: filterStartDate.value || undefined,
      endDate: filterEndDate.value || undefined,
      search: searchQuery.value || undefined,
    });
  } catch (err: any) {
    console.error('Error loading orders:', err);
  } finally {
    loading.value = false;
  }
};

const loadSpecialists = async () => {
  try {
    specialists.value = await getEmployees(undefined, { acceptsAppointments: true, status: 'ACTIVO' });
  } catch (err) {
    console.error('Error loading specialists:', err);
  }
};

const updateStatus = async (order: Appointment, newStatus: string) => {
  try {
    const updated = await appointmentsService.changeStatus(order.id, newStatus);
    order.status = updated.status;
    toast.success(`La orden ${order.order_number} ahora está en estado ${newStatus}.`, 'Estado Actualizado');
  } catch (err: any) {
    toast.error('No se pudo actualizar el estado.', 'Error');
  }
};

const openTicketModal = (order: Appointment) => {
  ticketOrder.value = order;
  const modalEl = document.getElementById('modalAppointmentTicket');
  if (modalEl && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
};

const printTicket = () => {
  window.print();
};

const goToBilling = (order: Appointment) => {
  router.push({
    path: '/ventas/facturas',
    query: {
      customerId: order.customer_id,
      appointmentId: order.id,
      orderNumber: order.order_number,
    },
  });
};

const getServicesList = (order: Appointment) => {
  return (order.items || []).map((i) => i.service_name).join(', ') || 'Sin servicios';
};

const getTotalDuration = (order: Appointment) => {
  return (order.items || []).reduce((acc, it) => acc + (it.duration_minutes || 30), 0);
};

const formatTime = (timeStr?: string) => {
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

onMounted(async () => {
  await loadSpecialists();
  await loadOrders();
});
</script>

<style scoped>
.ticket-receipt {
  font-family: 'Courier New', Courier, monospace;
}
</style>
