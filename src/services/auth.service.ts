import { api } from './axios'

export const loginRequest = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

// Request para obtener empresas del usuario autenticado
export const userCompanyRequest = async (params: { page: number, limit: number }) => {
  const response = await api.get('/userCompany/companies', { params })
  return response.data
}

export const listBranchesRequest = async (params: { companyId: number, page: number, limit: number }) => {
  const { data } = await api.get('/branchCompany', { params })
  return data
}
