import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/crud-theme.css'
import './assets/select2-theme.css'
import './assets/toastr-theme.css'
import { toast } from './utils/toastr'
import AppSelect2 from './components/common/AppSelect2.vue'

// Inicializar tema de color y modo oscuro/claro
const savedColorTheme = localStorage.getItem('userTheme') || 'Blue_Theme'
const savedThemeMode = localStorage.getItem('app-theme') || 'dark'

document.documentElement.setAttribute('data-color-theme', savedColorTheme)
document.documentElement.setAttribute('data-bs-theme', savedThemeMode)

const app = createApp(App)

app.config.globalProperties.$toast = toast
app.component('AppSelect2', AppSelect2)
app.component('Select2', AppSelect2)

app.use(createPinia())
app.use(router)

app.mount('#app')
