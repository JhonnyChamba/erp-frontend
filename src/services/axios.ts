import axios from 'axios'
import { useLoadingStore } from '@/stores/loading.store'

const API_URL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use(
  (config) => {
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

    if (!(config as any).silent) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.startRequest()
      } catch (_) {}
    }

    return config
  },
  (error) => {
    try {
      const loadingStore = useLoadingStore()
      loadingStore.finishRequest()
    } catch (_) {}
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    if (!(response.config as any)?.silent) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.finishRequest()
      } catch (_) {}
    }
    return response
  },
  (error) => {
    if (!(error.config as any)?.silent) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.finishRequest()
      } catch (_) {}
    }
    return Promise.reject(error)
  }
)