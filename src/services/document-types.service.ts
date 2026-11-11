import { api } from './axios'

export interface DocumentTypeItem {
  id: number
  company_id: number
  name: string
  type: string
  code: string
  status: 'ACTIVO' | 'INACTIVO'
  deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateDocumentTypePayload {
  name: string
  type: string
  code: string
  status?: string
}

export interface UpdateDocumentTypePayload {
  name?: string
  type?: string
  code?: string
  status?: string
}

export const getDocumentTypes = async (params?: {
  companyId?: number
  type?: string
  active?: boolean
}): Promise<DocumentTypeItem[]> => {
  const res = await api.get('/document-types', { params })
  return res.data
}

export const getDocumentTypeById = async (id: number): Promise<DocumentTypeItem> => {
  const res = await api.get(`/document-types/${id}`)
  return res.data
}

export const createDocumentType = async (payload: CreateDocumentTypePayload): Promise<DocumentTypeItem> => {
  const res = await api.post('/document-types', payload)
  return res.data
}

export const updateDocumentType = async (
  id: number,
  payload: UpdateDocumentTypePayload
): Promise<DocumentTypeItem> => {
  const res = await api.patch(`/document-types/${id}`, payload)
  return res.data
}

export const toggleDocumentTypeStatus = async (id: number): Promise<DocumentTypeItem> => {
  const res = await api.patch(`/document-types/${id}/toggle-status`)
  return res.data
}

export const deleteDocumentType = async (id: number): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/document-types/${id}`)
  return res.data
}
