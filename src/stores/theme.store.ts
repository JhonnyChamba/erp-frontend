import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  const applyThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
    localStorage.setItem('app-theme', mode)
    document.documentElement.setAttribute('data-bs-theme', mode)
  }

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode.value === 'dark' ? 'light' : 'dark'
    applyThemeMode(nextMode)
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

  const setThemeColor = (color: ThemeColor) => {
    themeColor.value = color
    localStorage.setItem('userTheme', color)
    document.documentElement.setAttribute('data-color-theme', color)
  }

  const setCardStyle = (style: CardStyle) => {
    cardStyle.value = style
    localStorage.setItem('app-card-style', style)
    document.documentElement.setAttribute('data-card', style)
  }

  const initTheme = () => {
    const savedMode = (localStorage.getItem('app-theme') as ThemeMode) || 'dark'
    applyThemeMode(savedMode)

    const savedContainer =
      (localStorage.getItem('app-container-layout') as ContainerOption) || 'full'
    setContainerOption(savedContainer)

    const savedColor =
      (localStorage.getItem('userTheme') as ThemeColor) || 'Blue_Theme'
    setThemeColor(savedColor)

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


