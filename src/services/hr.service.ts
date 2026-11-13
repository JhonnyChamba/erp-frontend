import { api } from './axios';

export interface EmployeeCategoryItem {
  id: number;
  company_id: number;
  name: string;
  description?: string | null;
  default_commission_rate: number;
  active: boolean;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeItem {
  id: number;
  company_id: number;
  branch_id?: number | null;
  category_id?: number | null;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  id_type: string;
  id_number: string;
  birth_date?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  photo_url?: string | null;
  hire_date: string;
  contract_type: string;
  base_salary: number;
  payment_frequency: string;
  bank_name?: string | null;
  bank_account_type?: string | null;
  bank_account_number?: string | null;
  iess_affiliation_code?: string | null;
  accepts_appointments: boolean;
  calendar_color: string;
  commission_rate: number;
  status: string;
  deleted: boolean;
  category?: EmployeeCategoryItem;
  branch?: any;
  user?: {
    id: number;
    name_user: string;
    last_name_user: string;
    email: string;
    role?: { id: number; description: string; code?: string } | null;
  } | null;
  create_user_account?: boolean;
  user_email?: string;
  user_password?: string;
  user_role_id?: number;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// CARGOS / CATEGORÍAS
// ==========================================
export const getEmployeeCategories = async (
  companyId?: number,
  active?: boolean
): Promise<EmployeeCategoryItem[]> => {
  const { data } = await api.get('/hr/categories', {
    params: {
      ...(companyId ? { companyId } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });
  return Array.isArray(data) ? data : [];
};

export const createEmployeeCategory = async (
  payload: Partial<EmployeeCategoryItem>,
  companyId?: number
): Promise<EmployeeCategoryCategoryItem> => {
  const { data } = await api.post('/hr/categories', payload, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const updateEmployeeCategory = async (
  id: number,
  payload: Partial<EmployeeCategoryItem>,
  companyId?: number
): Promise<EmployeeCategoryItem> => {
  const { data } = await api.patch(`/hr/categories/${id}`, payload, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const toggleEmployeeCategoryStatus = async (
  id: number,
  companyId?: number
): Promise<EmployeeCategoryItem> => {
  const { data } = await api.patch(`/hr/categories/${id}/toggle-status`, {}, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const deleteEmployeeCategory = async (
  id: number,
  companyId?: number
): Promise<void> => {
  await api.delete(`/hr/categories/${id}`, {
    params: companyId ? { companyId } : {},
  });
};

// ==========================================
// EMPLEADOS
// ==========================================
export const getEmployees = async (
  companyId?: number,
  filters: {
    branchId?: number;
    categoryId?: number;
    acceptsAppointments?: boolean;
    status?: string;
    search?: string;
  } = {}
): Promise<EmployeeItem[]> => {
  const { data } = await api.get('/hr/employees', {
    params: {
      ...(companyId ? { companyId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.acceptsAppointments !== undefined ? { acceptsAppointments: filters.acceptsAppointments } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    },
  });
  return Array.isArray(data) ? data : [];
};

export const getEmployeeById = async (
  id: number,
  companyId?: number
): Promise<EmployeeItem> => {
  const { data } = await api.get(`/hr/employees/${id}`, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const createEmployee = async (
  payload: Partial<EmployeeItem>,
  companyId?: number
): Promise<EmployeeItem> => {
  const { data } = await api.post('/hr/employees', payload, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const updateEmployee = async (
  id: number,
  payload: Partial<EmployeeItem>,
  companyId?: number
): Promise<EmployeeItem> => {
  const { data } = await api.patch(`/hr/employees/${id}`, payload, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const toggleEmployeeStatus = async (
  id: number,
  companyId?: number
): Promise<EmployeeItem> => {
  const { data } = await api.patch(`/hr/employees/${id}/toggle-status`, {}, {
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const deleteEmployee = async (
  id: number,
  companyId?: number
): Promise<void> => {
  await api.delete(`/hr/employees/${id}`, {
    params: companyId ? { companyId } : {},
  });
};
type EmployeeCategoryCategoryItem = EmployeeCategoryItem;
