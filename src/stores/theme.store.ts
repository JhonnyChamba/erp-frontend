import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { api } from '@/services/axios'

export type ThemeMode = 'dark' | 'light'
export type ContainerOption = 'boxed' | 'full'
export type ThemeColor =
  | 'Blue_Theme'
  | 'Aqua_Theme'
  | 'Purple_Theme'
  | 'Green_Theme'
  | 'Cyan_Theme'
  | 'Orange_Theme'
export type CardStyle = 'border' | 'shadow'

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>(
    (localStorage.getItem('app-theme') as ThemeMode) || 'dark'
  )
  const containerOption = ref<ContainerOption>(
    (localStorage.getItem('app-container-layout') as ContainerOption) || 'full'
  )
  const themeColor = ref<ThemeColor>(
    (localStorage.getItem('userTheme') as ThemeColor) || 'Blue_Theme'
  )
  const cardStyle = ref<CardStyle>(
    (localStorage.getItem('app-card-style') as CardStyle) || 'shadow'
  )

  const isDark = computed(() => themeMode.value === 'dark')
  const isFullContainer = computed(() => containerOption.value === 'full')

  const applyThemeMode = (mode: ThemeMode, persistToBackend: boolean = true) => {
    themeMode.value = mode
    localStorage.setItem('app-theme', mode)
    document.documentElement.setAttribute('data-bs-theme', mode)

    if (persistToBackend && localStorage.getItem('token')) {
      api.patch('/auth/theme', { theme_mode: mode }).catch(() => {})
    }
  }

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode.value === 'dark' ? 'light' : 'dark'
    applyThemeMode(nextMode, true)
  }

  const setContainerOption = (option: ContainerOption) => {
    containerOption.value = option
    localStorage.setItem('app-container-layout', option)
    document.documentElement.setAttribute('data-boxed-layout', option)
  }

  const toggleContainerOption = () => {
    const next = containerOption.value === 'full' ? 'boxed' : 'full'
    setContainerOption(next)
  }

  const setThemeColor = (color: ThemeColor, persistToBackend: boolean = true) => {
    themeColor.value = color
    localStorage.setItem('userTheme', color)
    document.documentElement.setAttribute('data-color-theme', color)

    if (persistToBackend && localStorage.getItem('token')) {
      api.patch('/auth/theme', { theme_color: color }).catch(() => {})
    }
  }

  const setCardStyle = (style: CardStyle) => {
    cardStyle.value = style
    localStorage.setItem('app-card-style', style)
    document.documentElement.setAttribute('data-card', style)
  }

  const initTheme = () => {
    let savedMode = (localStorage.getItem('app-theme') as ThemeMode) || 'dark'
    let savedColor = (localStorage.getItem('userTheme') as ThemeColor) || 'Blue_Theme'

    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload: any = jwtDecode(token)
        if (payload?.theme_mode) savedMode = payload.theme_mode as ThemeMode
        if (payload?.theme_color) savedColor = payload.theme_color as ThemeColor
      } catch {}
    }

    applyThemeMode(savedMode, false)

    const savedContainer =
      (localStorage.getItem('app-container-layout') as ContainerOption) || 'full'
    setContainerOption(savedContainer)

    setThemeColor(savedColor, false)

    const savedCard =
      (localStorage.getItem('app-card-style') as CardStyle) || 'shadow'
    setCardStyle(savedCard)
  }

  return {
    themeMode,
    containerOption,
    themeColor,
    cardStyle,
    isDark,
    isFullContainer,
    applyThemeMode,
    toggleTheme,
    setContainerOption,
    toggleContainerOption,
    setThemeColor,
    setCardStyle,
    initTheme,
  }
})


