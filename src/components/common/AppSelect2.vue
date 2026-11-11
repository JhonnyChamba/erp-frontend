<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

export interface Select2Option {
  value: string | number | null
  label: string
  sublabel?: string
  disabled?: boolean
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options?: (Select2Option | string | number)[]
    placeholder?: string
    searchPlaceholder?: string
    disabled?: boolean
    required?: boolean
    allowClear?: boolean
    id?: string
    name?: string
  }>(),
  {
    modelValue: null,
    options: () => [],
    placeholder: 'Seleccionar...',
    searchPlaceholder: 'Buscar...',
    disabled: false,
    required: false,
    allowClear: false,
    id: undefined,
    name: undefined,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const resultsListRef = ref<HTMLElement | null>(null)

// Normalizar opciones
const normalizedOptions = computed<Select2Option[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: String(opt.label ?? opt.value ?? ''),
        sublabel: opt.sublabel,
        disabled: Boolean(opt.disabled),
      }
    }
    return {
      value: opt,
      label: String(opt),
      disabled: false,
    }
  })
})

// Opciones filtradas por el buscador
const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return normalizedOptions.value
  return normalizedOptions.value.filter((opt) => {
    const labelMatch = opt.label.toLowerCase().includes(query)
    const sublabelMatch = opt.sublabel ? opt.sublabel.toLowerCase().includes(query) : false
    const valMatch = opt.value !== null ? String(opt.value).toLowerCase().includes(query) : false
    return labelMatch || sublabelMatch || valMatch
  })
})

// Opción actualmente seleccionada
const selectedOption = computed(() => {
  return normalizedOptions.value.find((opt) => opt.value === props.modelValue) || null
})

// Abrir / Cerrar dropdown
const toggleDropdown = () => {
  if (props.disabled) return
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
  searchQuery.value = ''
  highlightedIndex.value = filteredOptions.value.findIndex((o) => o.value === props.modelValue)
  if (highlightedIndex.value === -1 && filteredOptions.value.length > 0) {
    highlightedIndex.value = 0
  }
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

// Seleccionar opción
const selectOption = (opt: Select2Option) => {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  closeDropdown()
}

// Limpiar selección
const clearSelection = (e: MouseEvent) => {
  e.stopPropagation()
  emit('update:modelValue', null)
  emit('change', null)
}

// Navegación con teclado
const onKeyDown = (e: KeyboardEvent) => {
  if (props.disabled) return

  if (!isOpen.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown()
    }
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    closeDropdown()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredOptions.value.length === 0) return
    highlightedIndex.value = (highlightedIndex.value + 1) % filteredOptions.value.length
    scrollToHighlighted()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredOptions.value.length === 0) return
    highlightedIndex.value =
      (highlightedIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length
    scrollToHighlighted()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
      const target = filteredOptions.value[highlightedIndex.value]
      if (target && !target.disabled) {
        selectOption(target)
      }
    }
  }
}

const scrollToHighlighted = () => {
  nextTick(() => {
    if (!resultsListRef.value) return
    const el = resultsListRef.value.children[highlightedIndex.value] as HTMLElement
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}

// Cierre al hacer click fuera
const handleClickOutside = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="rootRef"
    class="select2-container-custom"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
    @keydown="onKeyDown"
  >
    <!-- Elemento nativo oculto para validación de formularios -->
    <input
      type="text"
      :value="modelValue !== null && modelValue !== undefined ? String(modelValue) : ''"
      :required="required"
      tabindex="-1"
      class="visually-hidden"
      :name="name"
      :id="id"
      aria-hidden="true"
    />

    <!-- Barra de Selección (Trigger) -->
    <div
      class="select2-selection-custom"
      :tabindex="disabled ? -1 : 0"
      @click="toggleDropdown"
      role="combobox"
      :aria-expanded="isOpen"
    >
      <span
        class="select2-rendered-text"
        :class="{ 'is-placeholder': !selectedOption }"
      >
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>

      <!-- Botón Limpiar (si allowClear está activado y hay valor) -->
      <button
        v-if="allowClear && selectedOption && !disabled"
        type="button"
        class="select2-clear-btn"
        @click="clearSelection"
        title="Limpiar selección"
      >
        <iconify-icon icon="solar:close-circle-line-duotone"></iconify-icon>
      </button>

      <!-- Flecha desplegable animada -->
      <iconify-icon icon="solar:alt-arrow-down-line-duotone" class="select2-arrow-icon"></iconify-icon>
    </div>

    <!-- Dropdown con Buscador Integrado -->
    <div v-if="isOpen" class="select2-dropdown-custom">
      <!-- Buscador -->
      <div class="select2-search-container">
        <div class="select2-search-input-wrapper">
          <iconify-icon icon="solar:magnifer-line-duotone" class="search-icon"></iconify-icon>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="select2-search-input"
            :placeholder="searchPlaceholder"
            @click.stop
          />
        </div>
      </div>

      <!-- Lista de Opciones Filtradas -->
      <ul ref="resultsListRef" class="select2-results-list" role="listbox">
        <li
          v-if="filteredOptions.length === 0"
          class="select2-empty-message"
        >
          No se encontraron resultados
        </li>

        <li
          v-for="(opt, idx) in filteredOptions"
          :key="String(opt.value ?? idx)"
          class="select2-option-item"
          :class="{
            'is-selected': opt.value === modelValue,
            'is-highlighted': idx === highlightedIndex,
            'is-disabled': opt.disabled,
          }"
          role="option"
          :aria-selected="opt.value === modelValue"
          @click.stop="selectOption(opt)"
          @mouseenter="highlightedIndex = idx"
        >
          <span>{{ opt.label }}</span>
          <span v-if="opt.sublabel" class="option-subtext">{{ opt.sublabel }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
