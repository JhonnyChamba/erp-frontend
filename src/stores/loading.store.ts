import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    requestCount: 0,
    manualLoading: false,
    message: 'Registrando información...',
  }),
  getters: {
    isLoading: (state) => state.requestCount > 0 || state.manualLoading,
  },
  actions: {
    show(msg = 'Procesando información...') {
      this.message = msg
      this.manualLoading = true
    },
    hide() {
      this.manualLoading = false
      this.requestCount = 0
    },
    startRequest(msg?: string) {
      if (msg) {
        this.message = msg
      }
      this.requestCount++
    },
    finishRequest() {
      if (this.requestCount > 0) {
        this.requestCount--
      }
      if (this.requestCount === 0 && !this.manualLoading) {
        this.message = 'Procesando información...'
      }
    },
  },
})


