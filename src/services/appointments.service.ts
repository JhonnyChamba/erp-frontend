import { api } from './axios';

export interface AppointmentItem {
  id?: number;
  service_id?: number | null;
  service_name: string;
  duration_minutes: number;
  price: number;
  tax_rate: number;
  tax_amount?: number;
  total?: number;
  notes?: string | null;
}

export interface Appointment {
  id: number;
  company_id: number;
  branch_id?: number | null;
  branch?: { id: number; name: string; code: string } | null;
  customer_id: number;
  customer?: {
    id: number;
    razon_social: string;
    nombre_comercial?: string;
    num_document: string;
    tipo_documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  };
  employee_id: number;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    calendar_color?: string;
    commission_rate?: number;
    phone?: string;
  };
  order_number: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  status: 'PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'FINALIZADA' | 'FACTURADA' | 'CANCELADA' | 'NO_ASISTIO';
  subtotal: number;
  tax_amount: number;
  total_estimated: number;
  notes?: string | null;
  invoice_id?: number | null;
  items: AppointmentItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CalendarEvent {
  id: number;
  order_number: string;
  title: string;
  start: string;
  end: string;
  color: string;
  status: string;
  customer: {
    id: number;
    name: string;
    document?: string;
    phone?: string;
    email?: string;
  };
  employee: {
    id: number;
    name: string;
    color: string;
  };
  items: AppointmentItem[];
  total_estimated: number;
  notes?: string | null;
  invoice_id?: number | null;
}

export interface EmployeeSchedule {
  id?: number;
  company_id?: number;
  employee_id: number;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  day_of_week: number; // 0 to 6
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  active: boolean;
}

export interface CreateAppointmentPayload {
  branch_id?: number;
  customer_id: number;
  employee_id: number;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  status?: string;
  notes?: string;
  items: Array<{
    service_id?: number;
    service_name: string;
    duration_minutes?: number;
    price: number;
    tax_rate?: number;
    notes?: string;
  }>;
}

export interface UpdateAppointmentPayload extends Partial<CreateAppointmentPayload> {}

export const appointmentsService = {
  async list(filters: {
    branchId?: number;
    employeeId?: number;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  } = {}): Promise<Appointment[]> {
    const res = await api.get('/appointments', { params: filters });
    return res.data;
  },

  async getById(id: number): Promise<Appointment> {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },

  async getCalendarEvents(filters: {
    startDate: string;
    endDate: string;
    employeeId?: number;
    branchId?: number;
  }): Promise<CalendarEvent[]> {
    const res = await api.get('/appointments/calendar', { params: filters });
    return res.data;
  },

  async create(payload: CreateAppointmentPayload): Promise<Appointment> {
    const res = await api.post('/appointments', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateAppointmentPayload): Promise<Appointment> {
    const res = await api.patch(`/appointments/${id}`, payload);
    return res.data;
  },

  async changeStatus(id: number, status: string, invoiceId?: number): Promise<Appointment> {
    const res = await api.patch(`/appointments/${id}/status`, { status, invoice_id: invoiceId });
    return res.data;
  },

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/appointments/${id}`);
    return res.data;
  },

  async getSchedules(employeeId?: number): Promise<EmployeeSchedule[]> {
    const res = await api.get('/appointments/schedules', {
      params: employeeId ? { employeeId } : {},
    });
    return res.data;
  },

  async saveSchedules(employeeId: number, schedules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    break_start?: string;
    break_end?: string;
    active: boolean;
  }>): Promise<EmployeeSchedule[]> {
    const res = await api.post('/appointments/schedules', {
      employee_id: employeeId,
      schedules,
    });
    return res.data;
  },
};

