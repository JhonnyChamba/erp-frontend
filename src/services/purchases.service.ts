import { api } from '@/services/axios'

export interface PurchaseDetailItem {
  id?: number
  item_type?: string
  item_id?: number
  code?: string
  description: string
  unit?: string
  quantity: number
  unit_cost: number
  tax_rate: number
  tax_value: number
  subtotal: number
  total: number
}

export interface PurchaseItem {
  id: number
  company_id: number
  provider_id?: number | null
  provider_name: string
  provider_id_type: string
  provider_id_number: string
  provider_email?: string
  provider_phone?: string
  provider_address?: string
  establishment: string
  emission_point: string
  sequential: string
  invoice_number: string
  authorization_number?: string
  issue_date: string
  warehouse_id: number
  warehouse_name: string
  branch_id?: number | null
  payment_method: string
  notes?: string
  status: 'COMPLETED' | 'CANCELED'
  subtotal_zero_tax: number
  subtotal_taxed: number
  tax_value: number
  total: number
  details?: PurchaseDetailItem[]
  created_at: string
}

export interface CreatePurchasePayload {
  provider_id?: number
  provider_name: string
  provider_id_type?: string
  provider_id_number: string
  provider_email?: string
  provider_phone?: string
  provider_address?: string
  establishment: string
  emission_point: string
  sequential: string
  invoice_number?: string
  authorization_number?: string
  issue_date: string
  warehouse_id: number
  payment_method?: string
  notes?: string
  items: {
    item_type?: string
    item_id?: number
    code?: string
    description: string
    unit?: string
    quantity: number
    unit_cost: number
    tax_rate?: number
  }[]
}

const withCompany = (companyId?: number) => (companyId ? { headers: { 'x-company-id': String(companyId) } } : {})

export const getPurchases = async (companyId?: number, params?: { warehouseId?: number; status?: string; q?: string }): Promise<PurchaseItem[]> => {
  const { data } = await api.get('/purchases', {
    ...withCompany(companyId),
    params: {
      ...(companyId ? { companyId } : {}),
      ...(params || {})
    }
  })
  return data
}

export const getPurchaseById = async (id: number, companyId?: number): Promise<PurchaseItem> => {
  const { data } = await api.get(`/purchases/${id}`, {
    ...withCompany(companyId),
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createPurchase = async (payload: CreatePurchasePayload, companyId?: number): Promise<PurchaseItem> => {
  const { data } = await api.post('/purchases', payload, withCompany(companyId))
  return data
}

export const cancelPurchase = async (id: number, companyId?: number): Promise<PurchaseItem> => {
  const { data } = await api.post(`/purchases/${id}/cancel`, {}, {
    ...withCompany(companyId),
    params: companyId ? { companyId } : {}
  })
  return data
}
