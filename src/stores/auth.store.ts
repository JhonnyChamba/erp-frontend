import { loginRequest } from '../services/auth.service'
import { api } from '../services/axios'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

export interface TokenPayload {
  user_id: number
  user_name: string
  developer: boolean
  super_admin?: boolean
  multi_company: boolean
  company_id?: number
  theme_color?: string
  theme_mode?: string
  photo_url?: string | null
  exp?: number
  iat?: number
}

export interface SidebarSubModuleItem {
  id: number
  code: string
  description: string
  icon: string
  url: string
}

export interface SidebarModuleItem {
  id: number
  code: string
  description: string
  icon: string
  children: SidebarSubModuleItem[]
}

export interface UserCompanyAccessInfo {
  companyId: number
  isSuperAdmin: boolean
  isMultiCompany?: boolean
  hasActiveSubscription?: boolean
  subscriptionStatus?: 'active' | 'no_subscription' | 'expired'
  subscriptionMessage?: string
  roleId: number | null
  roleCode: string | null
  roleName: string | null
  moduleCodes: string[]
  subModuleCodes: string[]
  allowedUrls: string[]
  menu: SidebarModuleItem[]
}

// Carga de permisos en curso (no reactiva). Permite que quien llame a fetchCompanyAccess
// mientras ya hay una petición para la misma empresa espere esa misma respuesta, y que una
// respuesta antigua no pise a la de una empresa pedida después.
let pendingAccess: { companyId: number; promise: Promise<UserCompanyAccessInfo | null> } | null = null

// ¿Alguna URL permitida es exactamente `<basePath>?tab=<tab>`? Se compara el valor del
// parámetro, no un "includes": tab=rol no debe coincidir con tab=roles.
const allowsTab = (allowedUrls: string[], basePath: string, tab: string): boolean => {
  const wanted = tab.toLowerCase()
  return (allowedUrls || []).some((u) => {
    const [rawPath = '', query = ''] = (u || '').trim().toLowerCase().split('?')
    const path = '/' + rawPath.replace(/^\/+|\/+$/g, '')
    return path === basePath && new URLSearchParams(query).get('tab') === wanted
  })
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null,
    currentTheme: localStorage.getItem('userTheme') || 'Blue_Theme',
    accessInfo: null as UserCompanyAccessInfo | null,
    loadingAccess: false,
  }),

  getters: {
    tokenPayload(): TokenPayload | null {
      if (!this.token) return null

      try {
        return jwtDecode<TokenPayload>(this.token)
      } catch (error) {
        console.log('Error decoding token:', error)
        return null
      }
    },

    canSwitchCompany(): boolean {
      if (this.accessInfo) {
        return Boolean(this.accessInfo.isSuperAdmin || this.accessInfo.isMultiCompany)
      }
      return Boolean(
        this.tokenPayload?.super_admin ||
          this.tokenPayload?.developer ||
          this.tokenPayload?.multi_company
      )
    },

    isTokenExpired(): boolean {
      if (!this.token) return true
      const payload = this.tokenPayload
      if (!payload || !payload.exp) return false
      // Margen de 5 segundos para prevenir desfasajes
      return payload.exp * 1000 <= Date.now() + 5000
    },

    isAuthenticated(): boolean {
      return Boolean(this.token && !this.isTokenExpired)
    },
  },

  actions: {
    applyTheme(themeName?: string, themeMode?: string) {
      const theme = themeName || this.tokenPayload?.theme_color || localStorage.getItem('userTheme') || 'Blue_Theme'
      const mode = themeMode || this.tokenPayload?.theme_mode || localStorage.getItem('app-theme') || 'dark'

      this.currentTheme = theme
      localStorage.setItem('userTheme', theme)
      document.documentElement.setAttribute('data-color-theme', theme)

      localStorage.setItem('app-theme', mode)
      document.documentElement.setAttribute('data-bs-theme', mode)
    },

    async login(email: string, password: string) {
      const data = await loginRequest(email, password)

      this.token = data.access_token
      this.accessInfo = null

      if (this.token) {
        localStorage.setItem('token', this.token)
        const theme = data.theme_color || this.tokenPayload?.theme_color || 'Blue_Theme'
        const mode = data.theme_mode || this.tokenPayload?.theme_mode || 'dark'
        this.applyTheme(theme, mode)
        if (data.photo_url) {
          localStorage.setItem('userPhoto', data.photo_url)
        } else {
          localStorage.removeItem('userPhoto')
        }
      }
    },

    async fetchCompanyAccess(companyId?: number) {
      if (!this.token) return null

      let targetCompanyId = companyId
      if (!targetCompanyId) {
        try {
          const comp = JSON.parse(localStorage.getItem('selectedCompany') || 'null')
          targetCompanyId = comp?.id || this.tokenPayload?.company_id || 1
        } catch {
          targetCompanyId = this.tokenPayload?.company_id || 1
        }
      }

      // Ya hay una carga en curso para esta misma empresa: se espera esa respuesta
      if (pendingAccess && pendingAccess.companyId === Number(targetCompanyId)) {
        return pendingAccess.promise
      }

      // Si la empresa solicitada es diferente a la almacenada en el estado actual, limpiar inmediatamente para evitar mezclar caché
      if (this.accessInfo && Number(this.accessInfo.companyId) !== Number(targetCompanyId)) {
        this.accessInfo = null
      }

      this.loadingAccess = true
      const request: { companyId: number; promise: Promise<UserCompanyAccessInfo | null> } = {
        companyId: Number(targetCompanyId),
        promise: Promise.resolve(null),
      }
      request.promise = (async () => {
        try {
          const { data } = await api.get<UserCompanyAccessInfo>('/auth/access', {
            params: { companyId: targetCompanyId },
          })
          // Solo la petición más reciente escribe en el estado
          if (pendingAccess === request) this.accessInfo = data
          return data
        } catch (err) {
          console.error('Error al cargar permisos de la empresa activa:', err)
          if (pendingAccess === request) this.accessInfo = null
          return null
        } finally {
          if (pendingAccess === request) {
            pendingAccess = null
            this.loadingAccess = false
          }
        }
      })()
      pendingAccess = request
      return request.promise
    },

    hasModuleAccess(code: string): boolean {
      if (this.accessInfo) {
        return this.accessInfo.moduleCodes.some((c) => c.toUpperCase() === code.toUpperCase())
      }
      return false
    },

    hasSubModuleAccess(code: string): boolean {
      if (this.accessInfo) {
        return this.accessInfo.subModuleCodes.some((c) => c.toUpperCase() === code.toUpperCase())
      }
      return false
    },

    canAccessUrl(fullPath: string): boolean {
      const isSuper = Boolean(this.tokenPayload?.super_admin || this.accessInfo?.isSuperAdmin)
      if (isSuper) {
        return true
      }

      const cleanTarget = fullPath.trim().toLowerCase()
      if (
        cleanTarget === '/' ||
        cleanTarget.startsWith('/companies') ||
        cleanTarget.startsWith('/login') ||
        cleanTarget.startsWith('/configuracion-global')
      ) {
        return true
      }

      // Si la empresa no tiene suscripción activa o expiró, bloquear acceso a cualquier ruta del ERP (incluido dashboard)
      if (this.accessInfo && !this.accessInfo.hasActiveSubscription) {
        return false
      }

      if (cleanTarget.startsWith('/dashboard')) {
        return true
      }

      if (this.accessInfo) {
        // Validación específica para /campeonato y sus pestañas / submódulos
        if (cleanTarget === '/campeonato' || cleanTarget.startsWith('/campeonato?') || cleanTarget.startsWith('/campeonato/')) {
          const hasCampeonatoMod =
            this.accessInfo.allowedUrls.some((u) => u.toLowerCase().includes('campeonato')) ||
            (this.accessInfo.subModuleCodes || []).some((c) => c.toUpperCase().startsWith('SUB-CAMP-')) ||
            (this.accessInfo.menu || []).some((m) => m.code === 'MOD-010' || m.description?.toLowerCase().includes('campeonato'))

          if (!hasCampeonatoMod) {
            return false
          }

          if (cleanTarget === '/campeonato') {
            return true
          }

          let tabParam = new URLSearchParams(cleanTarget.split('?')[1] || '').get('tab')
          if (!tabParam && cleanTarget.startsWith('/campeonato/')) {
            const rawPath = cleanTarget.split('?')[0] || ''
            const segs = rawPath.split('/')
            tabParam = segs[2] || ''
          }

          if (!tabParam) {
            return true
          }

          const tabNorm = tabParam.toLowerCase()
          if (tabNorm === 'configuracion' || tabNorm === 'configuraciones') {
            return true
          }
          const campTabMapping: Record<string, string[]> = {
            teams: ['equipos', 'teams', 'sub-camp-001'],
            players: ['jugadores', 'players', 'sub-camp-002'],
            demarcations: ['demarcaciones', 'demarcations', 'sub-camp-015'],
            teamregistrations: ['inscripciones-equipos', 'teamregistrations', 'sub-camp-007'],
            playerregistrations: ['inscripciones-jugadores', 'playerregistrations', 'sub-camp-008'],
            matches: ['partidos', 'matches', 'sub-camp-011'],
            standings: ['posiciones', 'standings', 'sub-camp-017'],
            sanctions: ['sanciones', 'sanctions', 'sub-camp-012'],
            payments: ['pagos', 'payments', 'sub-camp-013'],
            categories: ['categorias', 'categories', 'sub-camp-003'],
            categoryeditions: ['ediciones', 'categoryeditions', 'sub-camp-004'],
            stages: ['etapas', 'stages', 'sub-camp-005'],
            scenaries: ['escenarios', 'canchas', 'scenaries', 'sub-camp-006'],
            referees: ['arbitros', 'referees', 'sub-camp-009'],
            vocals: ['vocales', 'vocals', 'sub-camp-010'],
            positions: ['cargos', 'positions', 'sub-camp-014'],
            schedules: ['horarios', 'schedules', 'sub-camp-016'],
            configuracion: [
              'configuracion',
              'configuraciones',
              'campeonato',
              'equipos',
              'teams',
              'jugadores',
              'players',
              'categorias',
              'categories',
              'ediciones',
              'categoryeditions',
              'etapas',
              'stages',
              'escenarios',
              'canchas',
              'scenaries',
              'arbitros',
              'referees',
              'vocales',
              'vocals',
              'cargos',
              'positions',
              'horarios',
              'schedules',
              'demarcaciones',
              'demarcations',
              'sub-camp-001',
              'sub-camp-002',
              'sub-camp-003',
              'sub-camp-004',
              'sub-camp-005',
              'sub-camp-006',
              'sub-camp-009',
              'sub-camp-010',
              'sub-camp-014',
              'sub-camp-015',
              'sub-camp-016',
              'sub-camp-018',
            ],
            configuraciones: [
              'configuracion',
              'configuraciones',
              'campeonato',
              'equipos',
              'teams',
              'jugadores',
              'players',
              'categorias',
              'categories',
              'ediciones',
              'categoryeditions',
              'etapas',
              'stages',
              'escenarios',
              'canchas',
              'scenaries',
              'arbitros',
              'referees',
              'vocales',
              'vocals',
              'cargos',
              'positions',
              'horarios',
              'schedules',
              'demarcaciones',
              'demarcations',
              'sub-camp-001',
              'sub-camp-002',
              'sub-camp-003',
              'sub-camp-004',
              'sub-camp-005',
              'sub-camp-006',
              'sub-camp-009',
              'sub-camp-010',
              'sub-camp-014',
              'sub-camp-015',
              'sub-camp-016',
              'sub-camp-018',
            ],
          }

          const aliases = campTabMapping[tabNorm] || [tabNorm]
          const subCodes = (this.accessInfo.subModuleCodes || []).map((c) => c.toLowerCase())
          const allowedUrls = (this.accessInfo.allowedUrls || []).map((u) => u.toLowerCase())

          return (
            allowedUrls.some((u) => aliases.some((a) => u.includes(a))) ||
            subCodes.some((c) => aliases.some((a) => a === c)) ||
            (this.accessInfo.menu || []).some(
              (m) =>
                (m.code === 'MOD-010' || m.description?.toLowerCase().includes('campeonato')) &&
                (m.children || []).some((ch: any) => {
                  const chUrl = (ch.url_desc || ch.url || '').toLowerCase()
                  const chCode = (ch.code || '').toLowerCase()
                  return aliases.some((a) => chUrl.includes(a) || chCode === a)
                })
            )
          )
        }
        // Validación específica para /configuracion y sus pestañas
        if (cleanTarget === '/configuracion' || cleanTarget.startsWith('/configuracion?')) {
          const tabParam = new URLSearchParams(cleanTarget.split('?')[1] || '').get('tab')
          if (!tabParam) {
            return this.accessInfo.allowedUrls.some((u) => u.toLowerCase().startsWith('/configuracion'))
          }
          return allowsTab(this.accessInfo.allowedUrls, '/configuracion', tabParam)
        }

        // Validación específica para /inventario y sus pestañas
        if (cleanTarget === '/inventario' || cleanTarget.startsWith('/inventario?')) {
          const tabParam = new URLSearchParams(cleanTarget.split('?')[1] || '').get('tab')
          if (!tabParam) {
            return this.accessInfo.allowedUrls.some((u) => u.toLowerCase().startsWith('/inventario'))
          }
          return allowsTab(this.accessInfo.allowedUrls, '/inventario', tabParam)
        }

        // Validación específica para /contactos y sus pestañas
        if (cleanTarget === '/contactos' || cleanTarget.startsWith('/contactos?')) {
          const tabParam = new URLSearchParams(cleanTarget.split('?')[1] || '').get('tab')
          if (!tabParam) {
            return this.accessInfo.allowedUrls.some((u) => u.toLowerCase().startsWith('/contactos'))
          }
          return allowsTab(this.accessInfo.allowedUrls, '/contactos', tabParam)
        }

        return this.accessInfo.allowedUrls.some((u) => {
          const cleanAllowed = (u || '').trim().toLowerCase()
          if (!cleanAllowed) return false
          const basePath = cleanAllowed.split('?')[0] || cleanAllowed
          const targetBasePath = cleanTarget.split('?')[0] || cleanTarget

          // Si la URL permitida tiene parámetros query específicos (ej. /configuracion?tab=roles), comparamos exacto
          if (cleanAllowed.includes('?')) {
            return cleanTarget === cleanAllowed || cleanTarget.startsWith(cleanAllowed + '&')
          }

          // Si no tiene query, coincidencia exacta de ruta base o sub-ruta con barra diagonal
          return targetBasePath === basePath || targetBasePath.startsWith(basePath + '/')
        })
      }
      return false
    },

    logout() {
      this.token = null
      this.accessInfo = null
      pendingAccess = null
      this.loadingAccess = false
      localStorage.removeItem('token')
      localStorage.removeItem('userPhoto')
      localStorage.removeItem('selectedCompany')
      localStorage.removeItem('selectedBranch')
    },
  },
})
