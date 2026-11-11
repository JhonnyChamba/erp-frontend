import { api } from './axios'

export interface TaxItem {
  id: number
  company_id: number
  code: string
  percentage: number
  description: string
  status: 'ACTIVO' | 'INACTIVO'
  is_default: boolean
  deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateTaxPayload {
  code: string
  percentage: number
  description: string
  status?: string
  is_default?: boolean
}

export interface UpdateTaxPayload {
  code?: string
  percentage?: number
  description?: string
  status?: string
  is_default?: boolean
}

export const getTaxes = async (params?: { companyId?: number; active?: boolean }): Promise<TaxItem[]> => {
  const res = await api.get('/taxes', { params })
  return res.data
}

export const getTaxById = async (id: number): Promise<TaxItem> => {
  const res = await api.get(`/taxes/${id}`)
  return res.data
}

export const createTax = async (payload: CreateTaxPayload): Promise<TaxItem> => {
  const res = await api.post('/taxes', payload)
  return res.data
}

export const updateTax = async (id: number, payload: UpdateTaxPayload): Promise<TaxItem> => {
  const res = await api.patch(`/taxes/${id}`, payload)
  return res.data
}

export const toggleTaxStatus = async (id: number): Promise<TaxItem> => {
  const res = await api.patch(`/taxes/${id}/toggle-status`)
  return res.data
}

export const deleteTax = async (id: number): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/taxes/${id}`)
  return res.data
}
