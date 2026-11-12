import { api } from './axios'

export interface InvoiceDetailItem {
  id?: number
  item_type?: 'ITEM' | 'SERVICE' | 'SUBCONTRACT'
  item_id?: number
  warehouse_id?: number | null
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

export interface SriMessage {
  identificador: string
  mensaje: string
  informacionAdicional?: string
  tipo?: string
}

export interface SriSendResult {
  id: number
  sri_status: 'RETURNED' | 'IN_PROCESS' | 'AUTHORIZED' | 'NOT_AUTHORIZED'
  sri_authorization_number: string | null
  sri_authorization_date: string | null
  sri_messages: SriMessage[]
}

export interface InvoiceItem {
  id: number
  /** Sucursal con la que se emitió (null en facturas anteriores a las sucursales) */
  branch_id?: number | null
  warehouse_id?: number | null
  establishment: string
  emission_point: string
  sequential: string
  invoice_number: string
  issue_date: string
  customer_id_type: string
  customer_id_number: string
  customer_name: string
  customer_address?: string
  customer_email?: string
  customer_phone?: string
  payment_method: string
  access_key?: string
  sign_status?: 'NOT_SIGNED' | 'SIGNED'
  sri_status?: 'NOT_SENT' | 'RETURNED' | 'IN_PROCESS' | 'AUTHORIZED' | 'NOT_AUTHORIZED'
  sri_authorization_number?: string | null
  sri_authorization_date?: string | null
  sri_sent_at?: string | null
  sri_messages?: SriMessage[] | null
  status: 'DRAFT' | 'ISSUED' | 'AUTHORIZED' | 'CANCELED'
  subtotal_zero_tax: number
  subtotal_taxable: number
  subtotal: number
  discount_total: number
  tax_total: number
  total: number
  notes?: string
  logo_url?: string | null
  created_at: string
  details?: InvoiceDetailItem[]
}

export interface CreateInvoicePayload {
  companyId?: number
  /** Sucursal (establecimiento) con la que se emite: obligatoria; define establecimiento, punto de emisión y dirección */
  branchId: number
  warehouseId?: number | null
  warehouse_id?: number | null
  emission_point?: string
  issue_date?: string
  customer_id_type: string
  customer_id_number: string
  customer_name: string
  customer_address?: string
  customer_email?: string
  customer_phone?: string
  payment_method?: string
  notes?: string
  details: {
    item_type?: string
    item_id?: number
    warehouse_id?: number | null
    warehouseId?: number | null
    code?: string
    description: string
    quantity: number
    unit_price: number
    discount?: number
    tax_rate?: number
  }[]
}

export const getInvoices = async (companyId?: number, branchId?: number): Promise<InvoiceItem[]> => {
  const { data } = await api.get('/sales/invoices', {
    params: { ...(companyId ? { companyId } : {}), ...(branchId ? { branchId } : {}) }
  })
  return Array.isArray(data) ? data : []
}

export const getInvoiceById = async (id: number, companyId?: number): Promise<InvoiceItem> => {
  const { data } = await api.get(`/sales/invoices/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createInvoice = async (payload: CreateInvoicePayload): Promise<InvoiceItem> => {
  const { data } = await api.post('/sales/invoices', payload)
  return data
}

export const cancelInvoice = async (id: number, companyId?: number): Promise<InvoiceItem> => {
  const { data } = await api.patch(`/sales/invoices/${id}/cancel`, null, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const signInvoice = async (id: number, companyId?: number) => {
  const { data } = await api.post(`/sales/invoices/${id}/sign`, null, {
    params: companyId ? { companyId } : {}
  })
  return data as { id: number; sign_status: string; file_name: string }
}

export const sendInvoiceToSri = async (id: number, companyId?: number) => {
  const { data } = await api.post(`/sales/invoices/${id}/send-sri`, null, {
    params: companyId ? { companyId } : {}
  })
  return data as SriSendResult
}

export const checkInvoiceSri = async (id: number, companyId?: number) => {
  const { data } = await api.post(`/sales/invoices/${id}/check-sri`, null, {
    params: companyId ? { companyId } : {}
  })
  return data as SriSendResult
}

export const getInvoiceXml = async (id: number, companyId?: number) => {
  const { data } = await api.get(`/sales/invoices/${id}/xml`, {
    params: companyId ? { companyId } : {}
  })
  return data as { file_name: string; xml: string }
}

