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
  /** Mano de obra total guardada: base + ítems que no son repuestos. */
  labor_cost: number;
  /** Mano de obra base (lo que edita el formulario), sin los ítems. */
  base_labor_cost: number;
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
  total: number;
  kpis: WorkOrderKPIs;
}

export interface WorkOrderFilters {
  branch_id?: number;
  technician_id?: number;
  status?: string;
  priority?: string;
  service_type?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateWorkOrderPayload {
  branch_id?: number | null;
  customer_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  technician_id?: number | null;
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
  estimated_delivery_date?: string | null;
  warranty_days?: number;
  labor_cost?: number;
  tax_amount?: number;
  advance_payment?: number;
  notes?: string;
  items?: Array<{
    item_type: 'REPUESTO' | 'MANO_OBRA' | 'SERVICIO' | 'OTRO';
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface UpdateWorkOrderPayload extends Partial<CreateWorkOrderPayload> {
  status?: string;
  real_delivery_date?: string | null;
}

// ---------------------------------------------------------------------------
// Único punto de traducción entre el contrato del backend (camelCase,
// /technical-service) y el modelo snake_case que usa la vista.
// El backend rechaza con 400 cualquier campo que no esté en sus DTO, así que
// aquí solo se envían los campos declarados en ellos.
// ---------------------------------------------------------------------------

const toIso = (value: unknown): string | null => (value ? String(value) : null);

const itemFromApi = (raw: any): WorkOrderItem => {
  const quantity = Number(raw?.quantity ?? 0);
  const unitPrice = Number(raw?.unitPrice ?? 0);
  const subtotal = Number(raw?.subtotal ?? quantity * unitPrice);
  return {
    id: raw?.id ?? undefined,
    item_type: raw?.itemType,
    description: raw?.description ?? '',
    quantity,
    unit_price: unitPrice,
    // El backend no guarda IVA, garantía ni notas por ítem: solo el subtotal.
    tax_rate: 15,
    subtotal,
    total: subtotal,
  };
};

const workOrderFromApi = (raw: any): WorkOrder => {
  const items: WorkOrderItem[] = Array.isArray(raw?.items) ? raw.items.map(itemFromApi) : [];
  // El backend guarda en laborCost la mano de obra base más los ítems que no son
  // repuestos; el formulario edita solo la base, así que se separa aquí.
  const nonPartItems = items
    .filter((it) => it.item_type !== 'REPUESTO')
    .reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
  const laborCost = Number(raw?.laborCost ?? 0);
  return {
    id: raw?.id,
    company_id: raw?.companyId,
    branch_id: raw?.branchId ?? null,
    branch_name: raw?.branchName ?? null,
    customer_id: raw?.customerId ?? null,
    customer_name: raw?.customerName ?? '',
    customer_phone: raw?.customerPhone ?? null,
    customer_email: raw?.customerEmail ?? null,
    technician_id: raw?.technicianId ?? null,
    technician_name: raw?.technicianName ?? null,
    order_number: raw?.orderNumber ?? '',
    service_type: raw?.serviceType,
    priority: raw?.priority,
    status: raw?.status,
    equipment_type: raw?.equipmentType ?? '',
    brand: raw?.brand ?? '',
    model: raw?.model ?? null,
    serial_number: raw?.serialNumber ?? null,
    color: raw?.color ?? null,
    security_pin: raw?.securityPin ?? null,
    accessories: raw?.accessories ?? null,
    physical_condition: raw?.physicalCondition ?? null,
    reported_failure: raw?.reportedFailure ?? '',
    technical_diagnosis: raw?.technicalDiagnosis ?? null,
    solution_applied: raw?.solutionApplied ?? null,
    entry_date: toIso(raw?.entryDate) ?? '',
    estimated_delivery_date: toIso(raw?.estimatedDeliveryDate),
    real_delivery_date: toIso(raw?.realDeliveryDate),
    warranty_days: Number(raw?.warrantyDays ?? 0),
    labor_cost: laborCost,
    base_labor_cost: Math.max(0, Math.round((laborCost - nonPartItems) * 100) / 100),
    parts_cost: Number(raw?.partsCost ?? 0),
    subtotal: Number(raw?.subtotal ?? 0),
    tax_amount: Number(raw?.taxAmount ?? 0),
    total_amount: Number(raw?.totalAmount ?? 0),
    advance_payment: Number(raw?.advancePayment ?? 0),
    pending_balance: Number(raw?.pendingBalance ?? 0),
    notes: raw?.notes ?? null,
    items,
    created_at: toIso(raw?.createdAt) ?? undefined,
    updated_at: toIso(raw?.updatedAt) ?? undefined,
  };
};

const filtersToApi = (filters: WorkOrderFilters): Record<string, string | number> => {
  const params: Record<string, string | number> = {};
  const put = (key: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && value !== '') params[key] = value;
  };
  put('search', filters.search?.trim());
  put('status', filters.status);
  put('priority', filters.priority);
  put('serviceType', filters.service_type);
  put('branchId', filters.branch_id);
  put('technicianId', filters.technician_id);
  put('startDate', filters.start_date);
  put('endDate', filters.end_date);
  return params;
};

const payloadToApi = (payload: UpdateWorkOrderPayload): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    branchId: payload.branch_id,
    customerId: payload.customer_id,
    customerName: payload.customer_name,
    customerPhone: payload.customer_phone,
    customerEmail: payload.customer_email,
    technicianId: payload.technician_id,
    technicianName: payload.technician_name,
    serviceType: payload.service_type,
    priority: payload.priority,
    status: payload.status,
    equipmentType: payload.equipment_type,
    brand: payload.brand,
    model: payload.model,
    serialNumber: payload.serial_number,
    color: payload.color,
    securityPin: payload.security_pin,
    accessories: payload.accessories,
    physicalCondition: payload.physical_condition,
    reportedFailure: payload.reported_failure,
    technicalDiagnosis: payload.technical_diagnosis,
    solutionApplied: payload.solution_applied,
    entryDate: payload.entry_date,
    estimatedDeliveryDate: payload.estimated_delivery_date,
    realDeliveryDate: payload.real_delivery_date,
    warrantyDays: payload.warranty_days,
    laborCost: payload.labor_cost,
    taxAmount: payload.tax_amount,
    advancePayment: payload.advance_payment,
    notes: payload.notes,
    items: payload.items?.map((it) => ({
      itemType: it.item_type,
      description: it.description,
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unit_price) || 0,
    })),
  };
  Object.keys(body).forEach((key) => {
    if (body[key] === undefined) delete body[key];
  });
  return body;
};

export const technicalServiceService = {
  async list(filters: WorkOrderFilters = {}): Promise<WorkOrdersResponse> {
    const res = await api.get('/technical-service', { params: filtersToApi(filters) });
    const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
    const kpis = res.data?.kpis || {};
    return {
      items: rows.map(workOrderFromApi),
      total: Number(res.data?.total ?? rows.length),
      kpis: {
        totalOrders: Number(kpis.total ?? 0),
        inProgress: Number(kpis.inProgress ?? 0),
        readyToDeliver: Number(kpis.readyToDeliver ?? 0),
        pendingBalance: Number(kpis.totalPendingAmount ?? 0),
      },
    };
  },

  async getNextOrderNumber(): Promise<string> {
    const res = await api.get('/technical-service/next-number');
    return res.data?.orderNumber || '';
  },

  async getById(id: number): Promise<WorkOrder> {
    const res = await api.get(`/technical-service/${id}`);
    return workOrderFromApi(res.data);
  },

  async create(payload: CreateWorkOrderPayload): Promise<WorkOrder> {
    const res = await api.post('/technical-service', payloadToApi(payload));
    return workOrderFromApi(res.data);
  },

  async update(id: number, payload: UpdateWorkOrderPayload): Promise<WorkOrder> {
    const res = await api.patch(`/technical-service/${id}`, payloadToApi(payload));
    return workOrderFromApi(res.data);
  },

  async updateStatus(
    id: number,
    status: string,
    notes?: string,
    realDeliveryDate?: string
  ): Promise<WorkOrder> {
    const body: Record<string, unknown> = { status };
    if (notes?.trim()) body.notes = notes.trim();
    if (realDeliveryDate) body.realDeliveryDate = realDeliveryDate;
    const res = await api.patch(`/technical-service/${id}/status`, body);
    return workOrderFromApi(res.data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/technical-service/${id}`);
  },
};
