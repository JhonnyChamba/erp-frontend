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
      if (this.tokenPayload?.super_admin || this.tokenPayload?.developer || this.accessInfo?.isSuperAdmin) {
        return true
      }
      if (!this.accessInfo) return false
      return this.accessInfo.moduleCodes.some((c) => c.toUpperCase() === code.toUpperCase())
    },

    hasSubModuleAccess(code: string): boolean {
      if (this.tokenPayload?.super_admin || this.tokenPayload?.developer || this.accessInfo?.isSuperAdmin) {
        return true
      }
      if (!this.accessInfo) return false
      return this.accessInfo.subModuleCodes.some((c) => c.toUpperCase() === code.toUpperCase())
    },

    canAccessUrl(fullPath: string): boolean {
      if (this.tokenPayload?.super_admin || this.tokenPayload?.developer || this.accessInfo?.isSuperAdmin) {
        return true
      }
      if (!this.accessInfo) return true
      const cleanTarget = fullPath.trim().toLowerCase()
      if (
        cleanTarget === '/' ||
        cleanTarget.startsWith('/dashboard') ||
        cleanTarget.startsWith('/companies') ||
        cleanTarget.startsWith('/login')
      ) {
        return true
      }
      return this.accessInfo.allowedUrls.some((u) => {
        const cleanAllowed = (u || '').trim().toLowerCase()
        if (!cleanAllowed) return false
        return cleanTarget === cleanAllowed || cleanTarget.startsWith(cleanAllowed.split('?')[0] || cleanAllowed)
      })
    },

    logout() {
      this.token = null
      this.accessInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('selectedCompany')
      localStorage.removeItem('selectedBranch')
    },
  },
})
