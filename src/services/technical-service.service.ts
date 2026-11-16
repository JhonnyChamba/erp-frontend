import { api } from './axios';

export interface WorkOrderItem {
  id?: number;
  item_type: 'REPUESTO' | 'MANO_OBRA' | 'SERVICIO' | 'OTRO';
  product_id?: number | null;
  code?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  subtotal?: number;
  total?: number;
  warranty_days?: number;
  notes?: string | null;
}

export interface WorkOrder {
  id: number;
  company_id: number;
  branch_id?: number | null;
  branch_name?: string | null;
  customer_id?: number | null;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  technician_id?: number | null;
  technician_name?: string | null;
  order_number: string;
  service_type: 'REPARACION' | 'MANTENIMIENTO_PREVENTIVO' | 'DIAGNOSTICO' | 'GARANTIA';
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status:
    | 'RECIBIDO'
    | 'EN_DIAGNOSTICO'
    | 'PRESUPUESTADO'
    | 'APROBADO'
    | 'EN_REPARACION'
    | 'EN_ESPERA_REPUESTOS'
    | 'LISTO_ENTREGA'
    | 'ENTREGADO'
    | 'CANCELADO';
  equipment_type: string;
  brand: string;
  model?: string | null;
  serial_number?: string | null;
  color?: string | null;
  security_pin?: string | null;
  accessories?: string | null;
  physical_condition?: string | null;
  reported_failure: string;
  technical_diagnosis?: string | null;
  solution_applied?: string | null;
  entry_date: string;
  estimated_delivery_date?: string | null;
  real_delivery_date?: string | null;
  warranty_days: number;
  labor_cost: number;
  parts_cost: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  advance_payment: number;
  pending_balance: number;
  notes?: string | null;
  items: WorkOrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkOrderKPIs {
  totalOrders: number;
  inProgress: number;
  readyToDeliver: number;
  pendingBalance: number;
}

export interface WorkOrdersResponse {
  items: WorkOrder[];
  kpis: WorkOrderKPIs;
}

export interface WorkOrderFilters {
  branch_id?: number;
  customer_id?: number;
  technician_id?: number;
  status?: string;
  priority?: string;
  service_type?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateWorkOrderPayload {
  branch_id?: number;
  customer_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  technician_id?: number;
  technician_name?: string;
  service_type?: string;
  priority?: string;
  equipment_type: string;
  brand: string;
  model?: string;
  serial_number?: string;
  color?: string;
  security_pin?: string;
  accessories?: string;
  physical_condition?: string;
  reported_failure: string;
  technical_diagnosis?: string;
  solution_applied?: string;
  entry_date?: string;
  estimated_delivery_date?: string;
  warranty_days?: number;
  labor_cost?: number;
  advance_payment?: number;
  notes?: string;
  items?: Array<{
    item_type: 'REPUESTO' | 'MANO_OBRA' | 'SERVICIO' | 'OTRO';
    product_id?: number | null;
    code?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
    warranty_days?: number;
    notes?: string | null;
  }>;
}

export interface UpdateWorkOrderPayload extends Partial<CreateWorkOrderPayload> {
  status?: string;
  real_delivery_date?: string;
}

export const technicalServiceService = {
  async list(filters: WorkOrderFilters = {}): Promise<WorkOrdersResponse> {
    const res = await api.get('/technical-service', { params: filters });
    return res.data;
  },

  async getNextOrderNumber(): Promise<string> {
    const res = await api.get('/technical-service/next-number');
    return res.data?.nextNumber || '';
  },

  async getById(id: number): Promise<WorkOrder> {
    const res = await api.get(`/technical-service/${id}`);
    return res.data;
  },

  async create(payload: CreateWorkOrderPayload): Promise<WorkOrder> {
    const res = await api.post('/technical-service', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateWorkOrderPayload): Promise<WorkOrder> {
    const res = await api.patch(`/technical-service/${id}`, payload);
    return res.data;
  },

  async updateStatus(
    id: number,
    status: string,
    notes?: string,
    realDeliveryDate?: string
  ): Promise<WorkOrder> {
    const res = await api.patch(`/technical-service/${id}/status`, {
      status,
      notes,
      real_delivery_date: realDeliveryDate,
    });
    return res.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const res = await api.delete(`/technical-service/${id}`);
    return res.data;
  },
};
