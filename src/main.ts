import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/theme.css'

// Inicializar tema de color y modo oscuro/claro
const savedColorTheme = localStorage.getItem('userTheme') || 'Blue_Theme'
const savedThemeMode = localStorage.getItem('app-theme') || 'dark'

document.documentElement.setAttribute('data-color-theme', savedColorTheme)
document.documentElement.setAttribute('data-bs-theme', savedThemeMode)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
