import { loginRequest } from '../services/auth.service'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

interface TokenPayload {
  user_id: number
  user_name: string
  developer: boolean
  multi_company: boolean
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null
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
    async login(email: string, password: string) {
      const data = await loginRequest(email, password)

      this.token = data.access_token

      if (this.token) {
        localStorage.setItem('token', this.token)
      }
    },

    logout() {
      this.token = null
      localStorage.removeItem('token')
    }
  }
})
