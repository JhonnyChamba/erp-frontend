import { api } from './axios'

export const loginRequest = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password }, {
    loadingMessage: 'Iniciando sesión...',
  } as any)
  return response.data
}

export interface MyProfile {
  id: number
  num_document: string
  name_user: string
  last_name_user: string
  full_name: string
  email: string
  birth_date: string | null
  photo_url?: string | null
  enabled: boolean
  super_admin: boolean
  multi_company: boolean
  role_name: string | null
  company_name: string | null
  created_at: string | null
}

// Datos básicos del usuario autenticado
export const getMyProfile = async (): Promise<MyProfile> => {
  const { data } = await api.get('/auth/me')
  return data
}

// Request para obtener empresas del usuario autenticado
export const userCompanyRequest = async (params: { page: number, limit: number }) => {
  const response = await api.get('/userCompany/companies', { params })
  return response.data
}

export const listBranchesRequest = async (params: { companyId: number, page: number, limit: number, onlyEnabled?: boolean }) => {
  const { data } = await api.get('/branchCompany', { params })
  return data
}
