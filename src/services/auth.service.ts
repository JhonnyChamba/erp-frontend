import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL

export const loginRequest = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password })
  return response.data
}

// Request para obtener empresas del usuario autenticado
export const userCompanyRequest = async (params: { page: number, limit: number }) => {
  const token = localStorage.getItem('token') // o authStore.token si importas el store
  if (!token) throw new Error('Usuario no autenticado')

  const response = await axios.get(`${API_URL}/userCompany/companies`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`, // ✅ token enviado al backend
    },
  })
  console.log('------');
  console.log(response);

  return response.data
}

export const listBranchesRequest = async (params: { companyId: number, page: number, limit: number }) => {

  const token = localStorage.getItem('token')
  if (!token) throw new Error('Usuario no autenticado')

  const { data } = await axios.get(`${API_URL}/branchCompany`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`, // 🔥 IMPORTANTE
    },
  })

  return data
}
