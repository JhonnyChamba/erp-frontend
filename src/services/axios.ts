import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const selectedCompanyRaw = localStorage.getItem('selectedCompany')
  if (selectedCompanyRaw) {
    try {
      const comp = JSON.parse(selectedCompanyRaw)
      if (comp?.id) {
        config.headers['x-company-id'] = String(comp.id)
      }
    } catch (_) {}
  }
  return config
})