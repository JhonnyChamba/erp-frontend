import { api } from './axios'

export interface EmissionPointSequence {
  id: number
  document_type: string
  document_code: string
  serie: string
  correlative: number
  enabled: boolean
}

export interface EmissionPointItem {
  id: number
  description: string
  serie: string
  enabled: boolean
  deleted?: boolean
  created_at?: string
  branch?: {
    id: number
    name: string
    code: string
    address?: string
    is_main?: boolean
  }
  sequences: EmissionPointSequence[]
}

export interface CreateEmissionPointPayload {
  branch_id: number
  description: string
  serie: string
  initial_correlative?: number
  companyId?: number
}

export interface UpdateEmissionPointPayload {
  description?: string
  serie?: string
  enabled?: boolean
  companyId?: number
}

export interface NextSequentialResponse {
  establishment: string
  emission_point: string
  emission_point_id: number
  emission_point_description: string
  document_type: string
  current_correlative: number
  next_correlative: number
  sequential: string
  full_invoice_number: string
}

export const getEmissionPoints = async (
  companyId?: number,
  branchId?: number
): Promise<EmissionPointItem[]> => {
  const { data } = await api.get('/sales/emission-points', {
    params: {
      ...(companyId ? { companyId } : {}),
      ...(branchId ? { branchId } : {})
    }
  })
  return Array.isArray(data) ? data : []
}

export const getEmissionPointById = async (
  id: number,
  companyId?: number
): Promise<EmissionPointItem> => {
  const { data } = await api.get(`/sales/emission-points/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createEmissionPoint = async (
  payload: CreateEmissionPointPayload,
  companyId?: number
): Promise<EmissionPointItem> => {
  const { data } = await api.post('/sales/emission-points', {
    ...payload,
    ...(companyId ? { companyId } : {})
  })
  return data
}

export const updateEmissionPoint = async (
  id: number,
  payload: UpdateEmissionPointPayload,
  companyId?: number
): Promise<EmissionPointItem> => {
  const { data } = await api.patch(`/sales/emission-points/${id}`, {
    ...payload,
    ...(companyId ? { companyId } : {})
  })
  return data
}

export const deleteEmissionPoint = async (
  id: number,
  companyId?: number
): Promise<{ deleted: boolean; id: number }> => {
  const { data } = await api.delete(`/sales/emission-points/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const updateSequenceCorrelative = async (
  sequenceId: number,
  correlative: number,
  companyId?: number
): Promise<EmissionPointSequence> => {
  const { data } = await api.patch(
    `/sales/emission-points/sequences/${sequenceId}`,
    { correlative },
    {
      params: companyId ? { companyId } : {}
    }
  )
  return data
}

export const getNextSequential = async (params: {
  branchId: number
  emissionPointId?: number
  serie?: string
  documentType?: string
  companyId?: number
}): Promise<NextSequentialResponse> => {
  const { data } = await api.get('/sales/emission-points/next-sequential', {
    params
  })
  return data
}

