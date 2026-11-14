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
  roleId: number | null
  roleCode: string | null
  roleName: string | null
  moduleCodes: string[]
  subModuleCodes: string[]
  allowedUrls: string[]
  menu: SidebarModuleItem[]
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
    applyTheme(themeName?: string) {
      const theme = themeName || this.tokenPayload?.theme_color || localStorage.getItem('userTheme') || 'Blue_Theme'
      this.currentTheme = theme
      localStorage.setItem('userTheme', theme)
      document.documentElement.setAttribute('data-color-theme', theme)
    },

    async login(email: string, password: string) {
      const data = await loginRequest(email, password)

      this.token = data.access_token
      this.accessInfo = null

      if (this.token) {
        localStorage.setItem('token', this.token)
        const theme = data.theme_color || this.tokenPayload?.theme_color || 'Blue_Theme'
        this.applyTheme(theme)
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

      this.loadingAccess = true
      try {
        const { data } = await api.get<UserCompanyAccessInfo>('/auth/access', {
          params: { companyId: targetCompanyId },
        })
        this.accessInfo = data
        return data
      } catch (err) {
        console.error('Error al cargar permisos de la empresa activa:', err)
        return null
      } finally {
        this.loadingAccess = false
      }
    },

    hasModuleAccess(code: string): boolean {
      if (this.accessInfo) {
        return this.accessInfo.moduleCodes.some((c) => c.toUpperCase() === code.toUpperCase())
      }
      if (this.tokenPayload?.super_admin || this.tokenPayload?.developer) {
        return true
      }
      return false
    },

    hasSubModuleAccess(code: string): boolean {
      if (this.accessInfo) {
        return this.accessInfo.subModuleCodes.some((c) => c.toUpperCase() === code.toUpperCase())
      }
      if (this.tokenPayload?.super_admin || this.tokenPayload?.developer) {
        return true
      }
      return false
    },

    canAccessUrl(fullPath: string): boolean {
      const cleanTarget = fullPath.trim().toLowerCase()
      if (
        cleanTarget === '/' ||
        cleanTarget.startsWith('/dashboard') ||
        cleanTarget.startsWith('/companies') ||
        cleanTarget.startsWith('/login') ||
        cleanTarget.startsWith('/configuracion-global')
      ) {
        return true
      }
      if (this.accessInfo) {
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
      if (this.tokenPayload?.super_admin || this.tokenPayload?.developer) {
        return true
      }
      return true
    },

    logout() {
      this.token = null
      this.accessInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userPhoto')
      localStorage.removeItem('selectedCompany')
      localStorage.removeItem('selectedBranch')
    },
  },
})
