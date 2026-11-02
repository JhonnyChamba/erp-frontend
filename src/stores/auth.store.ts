import { loginRequest } from '../services/auth.service'
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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null,
    currentTheme: localStorage.getItem('userTheme') || 'Blue_Theme',
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
    }
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

      if (this.token) {
        localStorage.setItem('token', this.token)
        const theme = data.theme_color || this.tokenPayload?.theme_color || 'Blue_Theme'
        this.applyTheme(theme)
      }
    },

    logout() {
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('selectedCompany')
      localStorage.removeItem('selectedBranch')
    }
  }
})
