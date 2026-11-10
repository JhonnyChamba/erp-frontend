import { api } from '@/services/axios'

export interface CustomerItem {
  id: number
  company_id: number
  tipo_documento: '04' | '05' | '06' | '07' // 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final
  num_document: string
  razon_social: string
  nombre_comercial?: string
  email: string
  telefono: string
  direccion: string
  ciudad?: string
  estado: 'activo' | 'inactivo'
  created_at: string
}

export interface ProviderItem {
  id: number
  company_id: number
  tipo_documento: '04' | '05' | '06' // 04=RUC, 05=Cédula, 06=Pasaporte
  num_document: string
  razon_social: string
  nombre_comercial?: string
  email: string
  telefono: string
  direccion: string
  forma_pago: 'contado' | 'credito_15' | 'credito_30' | 'credito_60' | 'transferencia'
  banco?: string
  num_cuenta?: string
  estado: 'activo' | 'inactivo'
  created_at: string
}

export interface SellerItem {
  id: number
  company_id: number
  tipo_documento: '05' | '04' | '06' // 05=Cédula, 04=RUC, 06=Pasaporte
  num_document: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  direccion?: string
  comision_pct: number
  estado: 'activo' | 'inactivo'
  created_at: string
}

// Campos que acepta el backend al crear/editar (id, company_id y created_at los gestiona el servidor).
const CUSTOMER_FIELDS = ['tipo_documento', 'num_document', 'razon_social', 'nombre_comercial', 'email', 'telefono', 'direccion', 'ciudad', 'estado'] as const
const PROVIDER_FIELDS = ['tipo_documento', 'num_document', 'razon_social', 'nombre_comercial', 'email', 'telefono', 'direccion', 'forma_pago', 'banco', 'num_cuenta', 'estado'] as const
const SELLER_FIELDS = ['tipo_documento', 'num_document', 'nombres', 'apellidos', 'email', 'telefono', 'direccion', 'comision_pct', 'estado'] as const

const pick = (data: object, fields: readonly string[]) => {
  const source = data as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const f of fields) if (source[f] !== undefined) out[f] = source[f]
  return out
}

/**
 * Ejecuta la llamada y, si falla, lanza un Error con el mensaje que devolvió el backend
 * (las vistas muestran `err.message`). La empresa viaja en el header x-company-id y el backend
 * valida que el usuario pertenezca a ella.
 */
const request = async <T>(fn: () => Promise<{ data: T }>): Promise<T> => {
  try {
    return (await fn()).data
  } catch (err: any) {
    const message = err?.response?.data?.message
    throw new Error(Array.isArray(message) ? message.join('. ') : message || err?.message || 'Error de comunicación con el servidor')
  }
}

const withCompany = (companyId?: number) => (companyId ? { headers: { 'x-company-id': String(companyId) } } : {})

// ==========================================
// CLIENTES
// ==========================================
export const getCustomers = (companyId?: number): Promise<CustomerItem[]> => request(() => api.get('/customers', withCompany(companyId)))

export const getCustomerById = (id: number, companyId?: number): Promise<CustomerItem> => request(() => api.get(`/customers/${id}`, withCompany(companyId)))

export const createCustomer = (data: Partial<Omit<CustomerItem, 'id' | 'created_at'>>, companyId?: number): Promise<CustomerItem> =>
  request(() => api.post('/customers', pick(data, CUSTOMER_FIELDS), withCompany(companyId)))

export const updateCustomer = (id: number, data: Partial<CustomerItem>, companyId?: number): Promise<CustomerItem> =>
  request(() => api.patch(`/customers/${id}`, pick(data, CUSTOMER_FIELDS), withCompany(companyId)))

export const toggleCustomerStatus = (id: number, companyId?: number): Promise<CustomerItem> => request(() => api.patch(`/customers/${id}/toggle-status`, {}, withCompany(companyId)))

export const deleteCustomer = async (id: number, companyId?: number): Promise<boolean> => {
  await request(() => api.delete(`/customers/${id}`, withCompany(companyId)))
  return true
}

// ==========================================
// PROVEEDORES
// ==========================================
export const getProviders = (companyId?: number): Promise<ProviderItem[]> => request(() => api.get('/providers', withCompany(companyId)))

export const getProviderById = (id: number, companyId?: number): Promise<ProviderItem> => request(() => api.get(`/providers/${id}`, withCompany(companyId)))

export const createProvider = (data: Partial<Omit<ProviderItem, 'id' | 'created_at'>>, companyId?: number): Promise<ProviderItem> =>
  request(() => api.post('/providers', pick(data, PROVIDER_FIELDS), withCompany(companyId)))

export const updateProvider = (id: number, data: Partial<ProviderItem>, companyId?: number): Promise<ProviderItem> =>
  request(() => api.patch(`/providers/${id}`, pick(data, PROVIDER_FIELDS), withCompany(companyId)))

export const toggleProviderStatus = (id: number, companyId?: number): Promise<ProviderItem> => request(() => api.patch(`/providers/${id}/toggle-status`, {}, withCompany(companyId)))

export const deleteProvider = async (id: number, companyId?: number): Promise<boolean> => {
  await request(() => api.delete(`/providers/${id}`, withCompany(companyId)))
  return true
}

// ==========================================
// VENDEDORES
// ==========================================
export const getSellers = (companyId?: number): Promise<SellerItem[]> => request(() => api.get('/sellers', withCompany(companyId)))

export const getSellerById = (id: number, companyId?: number): Promise<SellerItem> => request(() => api.get(`/sellers/${id}`, withCompany(companyId)))

export const createSeller = (data: Partial<Omit<SellerItem, 'id' | 'created_at'>>, companyId?: number): Promise<SellerItem> =>
  request(() => api.post('/sellers', pick(data, SELLER_FIELDS), withCompany(companyId)))

export const updateSeller = (id: number, data: Partial<SellerItem>, companyId?: number): Promise<SellerItem> =>
  request(() => api.patch(`/sellers/${id}`, pick(data, SELLER_FIELDS), withCompany(companyId)))

export const toggleSellerStatus = (id: number, companyId?: number): Promise<SellerItem> => request(() => api.patch(`/sellers/${id}/toggle-status`, {}, withCompany(companyId)))

export const deleteSeller = async (id: number, companyId?: number): Promise<boolean> => {
  await request(() => api.delete(`/sellers/${id}`, withCompany(companyId)))
  return true
}
