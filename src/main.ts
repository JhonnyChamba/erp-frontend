import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const savedTheme = localStorage.getItem('userTheme') || 'Blue_Theme'
document.documentElement.setAttribute('data-color-theme', savedTheme)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
