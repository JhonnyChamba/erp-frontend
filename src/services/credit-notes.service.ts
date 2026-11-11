import { api } from './axios'

export interface CreditNoteDetailItem {
  id?: number
  item_type?: string
  item_id?: number
  warehouse_id?: number
  code?: string
  description: string
  quantity: number
  unit_price: number
  discount?: number
  tax_rate?: number
  tax_value?: number
  subtotal?: number
  total?: number
}

export interface CreditNoteItem {
  id: number
  company_id: number
  invoice_id?: number | null
  branch_id?: number | null
  branch_address?: string | null
  establishment: string
  emission_point: string
  sequential: string
  credit_note_number: string
  issue_date: string
  modified_document_type: string
  modified_document_number: string
  modified_document_date?: string | null
  reason: string
  customer_id_type: string
  customer_id_number: string
  customer_name: string
  customer_address?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  access_key?: string | null
  status: string
  subtotal_zero_tax: number
  subtotal_taxable: number
  subtotal: number
  discount_total: number
  tax_total: number
  total: number
  adjust_inventory: boolean
  notes?: string | null
  sign_status: string
  signed_at?: string | null
  sri_status: string
  sri_authorization_number?: string | null
  sri_authorization_date?: string | null
  sri_messages?: Array<{ identificador: string; mensaje: string; informacionAdicional?: string; tipo?: string }> | null
  created_at: string
  details?: CreditNoteDetailItem[]
  invoice?: any
}

export interface CreateCreditNotePayload {
  invoiceId?: number
  branchId: number
  emission_point?: string
  issue_date?: string
  modified_document_type?: string
  modified_document_number: string
  modified_document_date?: string
  reason: string
  customer_id_type?: string
  customer_id_number?: string
  customer_name?: string
  customer_address?: string
  customer_email?: string
  customer_phone?: string
  adjust_inventory?: boolean
  notes?: string
  details: Array<{
    item_type?: string
    item_id?: number
    warehouse_id?: number
    code?: string
    description: string
    quantity: number
    unit_price: number
    discount?: number
    tax_rate?: number
  }>
}

export const listCreditNotes = async (params?: { branchId?: number; invoiceId?: number; search?: string }): Promise<CreditNoteItem[]> => {
  const res = await api.get('/sales/credit-notes', { params })
  return res.data
}

export const getCreditNoteById = async (id: number): Promise<CreditNoteItem> => {
  const res = await api.get(`/sales/credit-notes/${id}`)
  return res.data
}

export const createCreditNote = async (payload: CreateCreditNotePayload): Promise<CreditNoteItem> => {
  const res = await api.post('/sales/credit-notes', payload)
  return res.data
}

export const sendCreditNoteSri = async (id: number): Promise<{ success: boolean; status: string; message: string; authorizationNumber?: string; authorizationDate?: string; sriMessages?: any[] }> => {
  const res = await api.post(`/sales/credit-notes/${id}/send-sri`)
  return res.data
}

export const getNextCreditNoteSequential = async (branchId: number, emissionPoint: string): Promise<any> => {
  const res = await api.get('/sales/credit-notes/next-sequential', {
    params: { branchId, emissionPoint }
  })
  return res.data
}

export const downloadCreditNoteXml = async (id: number): Promise<void> => {
  const res = await api.get(`/sales/credit-notes/${id}/xml`, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: 'application/xml' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `NotaCredito_${id}.xml`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
