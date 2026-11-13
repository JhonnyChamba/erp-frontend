import axios from 'axios'
import { useLoadingStore } from '@/stores/loading.store'
import { toast } from '@/utils/toastr'

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

    const method = (config.method || 'get').toUpperCase()
    const customConfig = config as any

    // Determinar si debe mostrar el spinner a pantalla completa:
    // - Si customConfig.silent === true o customConfig.fullscreen === false: NO mostrar
    // - Si customConfig.fullscreen === true: SÍ mostrar
    // - Por defecto:
    //   * GET (listados, búsquedas, filtros): NO mostrar a pantalla completa (se muestra el spinner local de la tabla)
    //   * POST (crear / registrar): SÍ mostrar -> "Registrando información..."
    //   * PUT / PATCH (actualizar / editar): SÍ mostrar -> "Actualizando información..."
    //   * DELETE (eliminar): SÍ mostrar -> "Eliminando información..."
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const shouldShowFullscreen =
      !customConfig.silent &&
      (customConfig.fullscreen === true || (customConfig.fullscreen !== false && isMutating))

    if (shouldShowFullscreen) {
      customConfig._trackedByFullscreenLoader = true
      let message = customConfig.loadingMessage

      if (!message) {
        if (config.url?.includes('/auth/login')) {
          message = 'Iniciando sesión...'
        } else if (method === 'POST') {
          message = 'Registrando información...'
        } else if (method === 'PUT' || method === 'PATCH') {
          message = 'Actualizando información...'
        } else if (method === 'DELETE') {
          message = 'Eliminando información...'
        } else {
          message = 'Procesando información...'
        }
      }

      try {
        const loadingStore = useLoadingStore()
        loadingStore.startRequest(message)
      } catch (_) {}
    }

    return config
  },
  (error) => {
    if ((error?.config as any)?._trackedByFullscreenLoader) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.finishRequest()
      } catch (_) {}
    }
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    if ((response?.config as any)?._trackedByFullscreenLoader) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.finishRequest()
      } catch (_) {}
    }
    return response
  },
  (error) => {
    if ((error?.config as any)?._trackedByFullscreenLoader) {
      try {
        const loadingStore = useLoadingStore()
        loadingStore.finishRequest()
      } catch (_) {}
    }

    // Expiración de sesión (401 Unauthorized): forzar re-inicio de sesión si el token caducó
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      const token = localStorage.getItem('token')
      if (token) {
        localStorage.removeItem('token')
        localStorage.removeItem('userPhoto')
        localStorage.removeItem('selectedCompany')
        localStorage.removeItem('selectedBranch')

        try {
          toast.warning('Tu sesión ha expirado (15 horas). Por favor, inicia sesión nuevamente.')
        } catch (_) {}

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 350)
        }
      }
    }

    return Promise.reject(error)
  }
)