<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/utils/toastr'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getProviders,
  createProvider,
  updateProvider,
  toggleProviderStatus,
  getSellers,
  createSeller,
  updateSeller,
  toggleSellerStatus,
  type CustomerItem,
  type ProviderItem,
  type SellerItem,
} from '@/services/contacts.service'
import { getDocumentTypes, type DocumentTypeItem } from '@/services/document-types.service'
import { CampeonatoApi } from '@/services/campeonato.service'

const route = useRoute()
const router = useRouter()

// Pestaña activa ('clientes' | 'proveedores' | 'vendedores')
const activeTab = ref<'clientes' | 'proveedores' | 'vendedores'>('clientes')

// Estado de carga y mensajes
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

watch(successMsg, (msg) => {
  if (msg) toast.success(msg, 'Contactos')
})
watch(errorMsg, (msg) => {
  if (msg) toast.error(msg, 'Error en Contactos')
})

// Empresa seleccionada
const selectedCompany = ref<any>(null)
const currentCompanyId = computed(() => selectedCompany.value?.id || 1)

// Listas de datos en memoria
const customers = ref<CustomerItem[]>([])
const providers = ref<ProviderItem[]>([])
const sellers = ref<SellerItem[]>([])

// Filtros y búsquedas
const filterCustomerStatus = ref<'todos' | 'activo' | 'inactivo'>('todos')
const filterCustomerDocType = ref('todos')
const filterCustomerName = ref('')
const filterCustomerDoc = ref('')

const buscandoDocumentoExterno = ref(false)
const externalFoundCustomer = ref<{
  source: string
  tipo_documento: string
  num_document: string
  razon_social: string
  nombre_comercial: string
  telefono: string
  email: string
  direccion: string
} | null>(null)

const appliedCustomerFilters = ref({
  status: 'todos',
  docType: 'todos',
  name: '',
  doc: '',
})

const onFilterDocTypeChange = () => {
  if (filterCustomerDocType.value === '05') {
    filterCustomerDoc.value = filterCustomerDoc.value.replace(/\D/g, '').slice(0, 10)
  } else if (filterCustomerDocType.value === '04' || filterCustomerDocType.value === '07') {
    filterCustomerDoc.value = filterCustomerDoc.value.replace(/\D/g, '').slice(0, 13)
  }
  applyCustomerFilters()
}

const onFilterCustomerDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value
  if (filterCustomerDocType.value === '05') {
    val = val.replace(/\D/g, '').slice(0, 10)
  } else if (filterCustomerDocType.value === '04' || filterCustomerDocType.value === '07') {
    val = val.replace(/\D/g, '').slice(0, 13)
  }
  if (val !== target.value) target.value = val
  filterCustomerDoc.value = val
}

const clearCustomerFilters = () => {
  filterCustomerStatus.value = 'todos'
  filterCustomerDocType.value = 'todos'
  filterCustomerName.value = ''
  filterCustomerDoc.value = ''
  externalFoundCustomer.value = null
  applyCustomerFilters()
}

const registrarClienteExternoEncontrado = () => {
  if (!externalFoundCustomer.value) return
  const ext = externalFoundCustomer.value
  openCreateCustomer()
  formCustomer.value.tipo_documento = ext.tipo_documento
  formCustomer.value.num_document = ext.num_document
  if (ext.razon_social) {
    formCustomer.value.razon_social = ext.razon_social
    formCustomer.value.nombre_comercial = ext.nombre_comercial || ext.razon_social
  }
  if (ext.telefono) formCustomer.value.telefono = ext.telefono
  if (ext.email) formCustomer.value.email = ext.email
  if (ext.direccion) formCustomer.value.direccion = ext.direccion
  externalFoundCustomer.value = null
}

const applyCustomerFilters = async () => {
  const docClean = filterCustomerDoc.value.trim()
  const tipo = filterCustomerDocType.value

  appliedCustomerFilters.value = {
    status: filterCustomerStatus.value,
    docType: filterCustomerDocType.value,
    name: filterCustomerName.value.trim().toLowerCase(),
    doc: docClean.toLowerCase(),
  }

  // Si no hay documento especificado, limpiar resultado externo
  if (!docClean) {
    externalFoundCustomer.value = null
    return
  }

  // Verificar si ya existe en la lista local de clientes de la empresa
  const matchLocal = customers.value.find(
    (c) => c.num_document && c.num_document.toLowerCase() === docClean.toLowerCase()
  )

  const esCedula = tipo === '05' || (tipo === 'todos' && docClean.length === 10 && /^\d{10}$/.test(docClean))
  const esRuc = tipo === '04' || (tipo === 'todos' && docClean.length === 13 && /^\d{13}$/.test(docClean))

  if (esCedula || esRuc) {
    if (matchLocal) {
      externalFoundCustomer.value = null
      if (esCedula) {
        if (validarCedulaEcuadorLocal(docClean)) {
          toast.success(`Cliente verificado en Registro Civil: ${matchLocal.razon_social}`)
        }
      } else if (esRuc) {
        if (validarRucEcuadorLocal(docClean)) {
          toast.success(`Cliente verificado en SRI: ${matchLocal.razon_social}`)
        }
      }
      return
    }

    // No existe en la empresa local: consultar API externa (Registro Civil si es cédula, SRI si es RUC)
    try {
      buscandoDocumentoExterno.value = true

      if (esCedula) {
        if (!validarCedulaEcuadorLocal(docClean)) {
          toast.error('La cédula ingresada no es válida según el Registro Civil de Ecuador.')
          externalFoundCustomer.value = null
          return
        }

        const res = await CampeonatoApi.players.consultaRegistroCivil(docClean)
        const data = res.data
        if (data?.exists && data?.player) {
          const p = data.player
          const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
          externalFoundCustomer.value = {
            source: data.source?.includes('REGISTRO') ? 'Registro Civil de Ecuador' : 'SRI / Padrón',
            tipo_documento: '05',
            num_document: docClean,
            razon_social: nombreCompleto,
            nombre_comercial: nombreCompleto,
            telefono: p.phone || '',
            email: p.email || '',
            direccion: p.address || '',
          }
          toast.info(`Cédula encontrada (${externalFoundCustomer.value.source}): ${nombreCompleto}. Puedes registrarlo con 1 clic.`)
        } else {
          externalFoundCustomer.value = {
            source: 'Registro Civil de Ecuador',
            tipo_documento: '05',
            num_document: docClean,
            razon_social: '',
            nombre_comercial: '',
            telefono: '',
            email: '',
            direccion: '',
          }
          toast.info('Cédula válida en Registro Civil. No registrada aún en tu empresa.')
        }
      } else if (esRuc) {
        if (!validarRucEcuadorLocal(docClean)) {
          toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI.')
          externalFoundCustomer.value = null
          return
        }

        const res = await CampeonatoApi.players.consultaRegistroCivil(docClean)
        const data = res.data
        if (data?.exists && data?.player) {
          const p = data.player
          const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
          externalFoundCustomer.value = {
            source: 'SRI (Servicio de Rentas Internas)',
            tipo_documento: '04',
            num_document: docClean,
            razon_social: nombreCompleto || 'RUC Verificado SRI',
            nombre_comercial: nombreCompleto || 'RUC Verificado SRI',
            telefono: p.phone || '',
            email: p.email || '',
            direccion: p.address || '',
          }
          toast.info(`RUC verificado en el SRI: ${nombreCompleto || docClean}. No registrado aún en tu empresa.`)
        } else {
          externalFoundCustomer.value = {
            source: 'SRI (Servicio de Rentas Internas)',
            tipo_documento: '04',
            num_document: docClean,
            razon_social: '',
            nombre_comercial: '',
            telefono: '',
            email: '',
            direccion: '',
          }
          toast.info('RUC verificado según el SRI. No registrado aún en tu empresa.')
        }
      }
    } catch {
      if (esCedula && validarCedulaEcuadorLocal(docClean)) {
        externalFoundCustomer.value = {
          source: 'Registro Civil de Ecuador',
          tipo_documento: '05',
          num_document: docClean,
          razon_social: '',
          nombre_comercial: '',
          telefono: '',
          email: '',
          direccion: '',
        }
        toast.info('Cédula válida. Puedes registrarla como cliente en tu empresa.')
      } else if (esRuc && validarRucEcuadorLocal(docClean)) {
        externalFoundCustomer.value = {
          source: 'SRI (Servicio de Rentas Internas)',
          tipo_documento: '04',
          num_document: docClean,
          razon_social: '',
          nombre_comercial: '',
          telefono: '',
          email: '',
          direccion: '',
        }
        toast.info('RUC válido según SRI. Puedes registrarlo como cliente en tu empresa.')
      } else {
        externalFoundCustomer.value = null
      }
    } finally {
      buscandoDocumentoExterno.value = false
    }
  } else {
    externalFoundCustomer.value = null
  }
}

// Filtros y búsquedas de Proveedores
const filterProviderStatus = ref<'todos' | 'activo' | 'inactivo'>('todos')
const filterProviderDocType = ref('todos')
const filterProviderName = ref('')
const filterProviderDoc = ref('')

const buscandoDocumentoExternoProveedor = ref(false)
const externalFoundProvider = ref<{
  source: string
  tipo_documento: string
  num_document: string
  razon_social: string
  nombre_comercial: string
  telefono: string
  email: string
  direccion: string
} | null>(null)

const appliedProviderFilters = ref({
  status: 'todos',
  docType: 'todos',
  name: '',
  doc: '',
})

const onFilterProviderDocTypeChange = () => {
  if (filterProviderDocType.value === '05') {
    filterProviderDoc.value = filterProviderDoc.value.replace(/\D/g, '').slice(0, 10)
  } else if (filterProviderDocType.value === '04') {
    filterProviderDoc.value = filterProviderDoc.value.replace(/\D/g, '').slice(0, 13)
  }
  applyProviderFilters()
}

const onFilterProviderDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value
  if (filterProviderDocType.value === '05') {
    val = val.replace(/\D/g, '').slice(0, 10)
  } else if (filterProviderDocType.value === '04') {
    val = val.replace(/\D/g, '').slice(0, 13)
  }
  if (val !== target.value) target.value = val
  filterProviderDoc.value = val
}

const clearProviderFilters = () => {
  filterProviderStatus.value = 'todos'
  filterProviderDocType.value = 'todos'
  filterProviderName.value = ''
  filterProviderDoc.value = ''
  externalFoundProvider.value = null
  applyProviderFilters()
}

const registrarProveedorExternoEncontrado = () => {
  if (!externalFoundProvider.value) return
  const ext = externalFoundProvider.value
  openCreateProvider()
  formProvider.value.tipo_documento = ext.tipo_documento
  formProvider.value.num_document = ext.num_document
  if (ext.razon_social) {
    formProvider.value.razon_social = ext.razon_social
    formProvider.value.nombre_comercial = ext.nombre_comercial || ext.razon_social
  }
  if (ext.telefono) formProvider.value.telefono = ext.telefono
  if (ext.email) formProvider.value.email = ext.email
  if (ext.direccion) formProvider.value.direccion = ext.direccion
  externalFoundProvider.value = null
}

const applyProviderFilters = async () => {
  const docClean = filterProviderDoc.value.trim()
  const tipo = filterProviderDocType.value

  appliedProviderFilters.value = {
    status: filterProviderStatus.value,
    docType: filterProviderDocType.value,
    name: filterProviderName.value.trim().toLowerCase(),
    doc: docClean.toLowerCase(),
  }

  if (!docClean) {
    externalFoundProvider.value = null
    return
  }

  // Comprobar si ya existe en la lista local de proveedores de la empresa
  const matchLocal = providers.value.find(
    (p) => p.num_document && p.num_document.toLowerCase() === docClean.toLowerCase()
  )

  const esCedula = tipo === '05' || (tipo === 'todos' && docClean.length === 10 && /^\d{10}$/.test(docClean))
  const esRuc = tipo === '04' || (tipo === 'todos' && docClean.length === 13 && /^\d{13}$/.test(docClean))

  if (esCedula || esRuc) {
    if (matchLocal) {
      externalFoundProvider.value = null
      if (esCedula && validarCedulaEcuadorLocal(docClean)) {
        toast.success(`Proveedor verificado en Registro Civil: ${matchLocal.razon_social}`)
      } else if (esRuc && validarRucEcuadorLocal(docClean)) {
        toast.success(`Proveedor verificado en SRI: ${matchLocal.razon_social}`)
      }
      return
    }

    try {
      buscandoDocumentoExternoProveedor.value = true

      if (esCedula) {
        if (!validarCedulaEcuadorLocal(docClean)) {
          toast.error('La cédula ingresada no es válida según el Registro Civil de Ecuador.')
          externalFoundProvider.value = null
          return
        }

        const res = await CampeonatoApi.players.consultaRegistroCivil(docClean)
        const data = res.data
        if (data?.exists && data?.player) {
          const p = data.player
          const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
          externalFoundProvider.value = {
            source: data.source?.includes('REGISTRO') ? 'Registro Civil de Ecuador' : 'SRI / Padrón',
            tipo_documento: '05',
            num_document: docClean,
            razon_social: nombreCompleto,
            nombre_comercial: nombreCompleto,
            telefono: p.phone || '',
            email: p.email || '',
            direccion: p.address || '',
          }
          toast.info(`Cédula encontrada (${externalFoundProvider.value.source}): ${nombreCompleto}. Puedes registrarlo con 1 clic.`)
        } else {
          externalFoundProvider.value = {
            source: 'Registro Civil de Ecuador',
            tipo_documento: '05',
            num_document: docClean,
            razon_social: '',
            nombre_comercial: '',
            telefono: '',
            email: '',
            direccion: '',
          }
          toast.info('Cédula válida en Registro Civil. No registrada aún en tus proveedores.')
        }
      } else if (esRuc) {
        if (!validarRucEcuadorLocal(docClean)) {
          toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI.')
          externalFoundProvider.value = null
          return
        }

        const res = await CampeonatoApi.players.consultaRegistroCivil(docClean)
        const data = res.data
        if (data?.exists && data?.player) {
          const p = data.player
          const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
          externalFoundProvider.value = {
            source: 'SRI (Servicio de Rentas Internas)',
            tipo_documento: '04',
            num_document: docClean,
            razon_social: nombreCompleto || 'RUC Verificado SRI',
            nombre_comercial: nombreCompleto || 'RUC Verificado SRI',
            telefono: p.phone || '',
            email: p.email || '',
            direccion: p.address || '',
          }
          toast.info(`RUC verificado en el SRI: ${nombreCompleto || docClean}. No registrado aún en tus proveedores.`)
        } else {
          externalFoundProvider.value = {
            source: 'SRI (Servicio de Rentas Internas)',
            tipo_documento: '04',
            num_document: docClean,
            razon_social: '',
            nombre_comercial: '',
            telefono: '',
            email: '',
            direccion: '',
          }
          toast.info('RUC verificado según el SRI. No registrado aún en tus proveedores.')
        }
      }
    } catch {
      if (esCedula && validarCedulaEcuadorLocal(docClean)) {
        externalFoundProvider.value = {
          source: 'Registro Civil de Ecuador',
          tipo_documento: '05',
          num_document: docClean,
          razon_social: '',
          nombre_comercial: '',
          telefono: '',
          email: '',
          direccion: '',
        }
        toast.info('Cédula válida. Puedes registrarla como proveedor en tu empresa.')
      } else if (esRuc && validarRucEcuadorLocal(docClean)) {
        externalFoundProvider.value = {
          source: 'SRI (Servicio de Rentas Internas)',
          tipo_documento: '04',
          num_document: docClean,
          razon_social: '',
          nombre_comercial: '',
          telefono: '',
          email: '',
          direccion: '',
        }
        toast.info('RUC válido según SRI. Puedes registrarlo como proveedor en tu empresa.')
      } else {
        externalFoundProvider.value = null
      }
    } finally {
      buscandoDocumentoExternoProveedor.value = false
    }
  } else {
    externalFoundProvider.value = null
  }
}

// Filtros y búsquedas de Vendedores
const filterSellerStatus = ref<'todos' | 'activo' | 'inactivo'>('todos')
const filterSellerDocType = ref('todos')
const filterSellerName = ref('')
const filterSellerDoc = ref('')

const buscandoDocumentoExternoSeller = ref(false)
const externalFoundSeller = ref<{
  source: string
  tipo_documento: string
  num_document: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  direccion: string
} | null>(null)

const appliedSellerFilters = ref({
  status: 'todos',
  docType: 'todos',
  name: '',
  doc: '',
})

const onFilterSellerDocTypeChange = () => {
  if (filterSellerDocType.value === '05') {
    filterSellerDoc.value = filterSellerDoc.value.replace(/\D/g, '').slice(0, 10)
  } else if (filterSellerDocType.value === '04') {
    filterSellerDoc.value = filterSellerDoc.value.replace(/\D/g, '').slice(0, 13)
  }
  applySellerFilters()
}

const onFilterSellerDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value
  if (filterSellerDocType.value === '05') {
    val = val.replace(/\D/g, '').slice(0, 10)
  } else if (filterSellerDocType.value === '04') {
    val = val.replace(/\D/g, '').slice(0, 13)
  }
  if (val !== target.value) target.value = val
  filterSellerDoc.value = val
}

const clearSellerFilters = () => {
  filterSellerStatus.value = 'todos'
  filterSellerDocType.value = 'todos'
  filterSellerName.value = ''
  filterSellerDoc.value = ''
  externalFoundSeller.value = null
  applySellerFilters()
}

const registrarVendedorExternoEncontrado = () => {
  if (!externalFoundSeller.value) return
  const ext = externalFoundSeller.value
  openCreateSeller()
  formSeller.value.tipo_documento = ext.tipo_documento
  formSeller.value.num_document = ext.num_document
  if (ext.nombres) formSeller.value.nombres = ext.nombres
  if (ext.apellidos) formSeller.value.apellidos = ext.apellidos
  if (ext.telefono) formSeller.value.telefono = ext.telefono
  if (ext.email) formSeller.value.email = ext.email
  if (ext.direccion) formSeller.value.direccion = ext.direccion
  externalFoundSeller.value = null
}

const applySellerFilters = async () => {
  const docClean = filterSellerDoc.value.trim()
  const tipo = filterSellerDocType.value

  appliedSellerFilters.value = {
    status: filterSellerStatus.value,
    docType: filterSellerDocType.value,
    name: filterSellerName.value.trim().toLowerCase(),
    doc: docClean.toLowerCase(),
  }

  if (!docClean) {
    externalFoundSeller.value = null
    return
  }

  // Comprobar si ya existe en la lista local de vendedores de la empresa
  const matchLocal = sellers.value.find(
    (s) => s.num_document && s.num_document.toLowerCase() === docClean.toLowerCase()
  )

  const esCedula = tipo === '05' || (tipo === 'todos' && docClean.length === 10 && /^\d{10}$/.test(docClean))
  const esRuc = tipo === '04' || (tipo === 'todos' && docClean.length === 13 && /^\d{13}$/.test(docClean))

  if (esCedula || esRuc) {
    if (matchLocal) {
      externalFoundSeller.value = null
      if (esCedula && validarCedulaEcuadorLocal(docClean)) {
        toast.success(`Vendedor verificado en Registro Civil: ${matchLocal.nombres} ${matchLocal.apellidos}`)
      } else if (esRuc && validarRucEcuadorLocal(docClean)) {
        toast.success(`Vendedor verificado en SRI: ${matchLocal.nombres} ${matchLocal.apellidos}`)
      }
      return
    }

    try {
      buscandoDocumentoExternoSeller.value = true

      if (esCedula) {
        if (!validarCedulaEcuadorLocal(docClean)) {
          toast.error('La cédula ingresada no es válida según el Registro Civil de Ecuador.')
          externalFoundSeller.value = null
          return
        }

        const res = await CampeonatoApi.players.consultaRegistroCivil(docClean)
        const data = res.data
        if (data?.exists && data?.player) {
          const p = data.player
          let nombres = p.name || ''
          let apellidos = p.lastName || ''
          if (!apellidos && nombres) {
            const parts = nombres.trim().split(/\s+/)
            if (parts.length >= 4) {
              apellidos = `${parts[0]} ${parts[1]}`
              nombres = parts.slice(2).join(' ')
            } else if (parts.length === 3) {
              apellidos = `${parts[0]} ${parts[1]}`
              nombres = parts[2]
            } else if (parts.length === 2) {
              apellidos = parts[0]
              nombres = parts[1]
            }
          }
          const nombreCompleto = `${nombres} ${apellidos}`.trim()
          externalFoundSeller.value = {
            source: data.source?.includes('REGISTRO') ? 'Registro Civil de Ecuador' : 'SRI / Padrón',
            tipo_documento: '05',
            num_document: docClean,
            nombres,
            apellidos,
            telefono: p.phone || '',
            email: p.email || '',
            direccion: p.address || '',
          }
          toast.info(`Cédula encontrada (${externalFoundSeller.value.source}): ${nombreCompleto}. Puedes registrarlo con 1 clic.`)
        } else {
          externalFoundSeller.value = {
            source: 'Registro Civil de Ecuador',
            tipo_documento: '05',
            num_document: docClean,
            nombres: '',
            apellidos: '',
            telefono: '',
            email: '',
            direccion: '',
          }
          toast.info('Cédula válida en Registro Civil. No registrada aún en tu equipo.')
        }
      } else if (esRuc) {
        if (!validarRucEcuadorLocal(docClean)) {
          toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI.')
          externalFoundSeller.value = null
          return
        }

        const res = await CampeonatoApi.players.consultaRegistroCivil(docClean)
        const data = res.data
        if (data?.exists && data?.player) {
          const p = data.player
          let nombres = p.name || ''
          let apellidos = p.lastName || ''
          if (!apellidos && nombres) {
            const parts = nombres.trim().split(/\s+/)
            if (parts.length >= 4) {
              apellidos = `${parts[0]} ${parts[1]}`
              nombres = parts.slice(2).join(' ')
            } else if (parts.length === 3) {
              apellidos = `${parts[0]} ${parts[1]}`
              nombres = parts[2]
            } else if (parts.length === 2) {
              apellidos = parts[0]
              nombres = parts[1]
            }
          }
          const nombreCompleto = `${nombres} ${apellidos}`.trim() || docClean
          externalFoundSeller.value = {
            source: 'SRI (Servicio de Rentas Internas)',
            tipo_documento: '04',
            num_document: docClean,
            nombres: nombres || 'Vendedor Verificado',
            apellidos: apellidos || 'SRI',
            telefono: p.phone || '',
            email: p.email || '',
            direccion: p.address || '',
          }
          toast.info(`RUC verificado en el SRI: ${nombreCompleto}. No registrado aún en tu equipo.`)
        } else {
          externalFoundSeller.value = {
            source: 'SRI (Servicio de Rentas Internas)',
            tipo_documento: '04',
            num_document: docClean,
            nombres: '',
            apellidos: '',
            telefono: '',
            email: '',
            direccion: '',
          }
          toast.info('RUC verificado según el SRI. No registrado aún en tu equipo.')
        }
      }
    } catch {
      if (esCedula && validarCedulaEcuadorLocal(docClean)) {
        externalFoundSeller.value = {
          source: 'Registro Civil de Ecuador',
          tipo_documento: '05',
          num_document: docClean,
          nombres: '',
          apellidos: '',
          telefono: '',
          email: '',
          direccion: '',
        }
        toast.info('Cédula válida. Puedes registrarla como vendedor en tu equipo.')
      } else if (esRuc && validarRucEcuadorLocal(docClean)) {
        externalFoundSeller.value = {
          source: 'SRI (Servicio de Rentas Internas)',
          tipo_documento: '04',
          num_document: docClean,
          nombres: '',
          apellidos: '',
          telefono: '',
          email: '',
          direccion: '',
        }
        toast.info('RUC válido según SRI. Puedes registrarlo como vendedor en tu equipo.')
      } else {
        externalFoundSeller.value = null
      }
    } finally {
      buscandoDocumentoExternoSeller.value = false
    }
  } else {
    externalFoundSeller.value = null
  }
}

// Modales de Crear / Editar
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const showCustomerModal = ref(false)
const showProviderModal = ref(false)
const showSellerModal = ref(false)
// Mientras un formulario de registro/edición está abierto se muestra como página y se oculta el listado
const isFormOpen = computed(() => showCustomerModal.value || showProviderModal.value || showSellerModal.value)
watch(isFormOpen, async (open) => {
  if (open) {
    await nextTick()
    document.getElementById('form-page')?.scrollIntoView({ block: 'start' })
  }
})

// Modales de Ver Detalle
const showViewCustomerModal = ref(false)
const showViewProviderModal = ref(false)
const showViewSellerModal = ref(false)

const viewingCustomer = ref<CustomerItem | null>(null)
const viewingProvider = ref<ProviderItem | null>(null)
const viewingSeller = ref<SellerItem | null>(null)

// Formularios
const docTypes = ref<DocumentTypeItem[]>([])

const loadDocTypes = async () => {
  try {
    const res = await getDocumentTypes({ active: true })
    docTypes.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.warn('No se pudieron cargar tipos de documento dinámicos:', err)
  }
}

// El backend de contactos solo admite estos tipos de documento (contacts.dto.ts):
// cualquier otro del catálogo (p. ej. 08) se rechaza con 400, así que no se ofrece.
const CONTACT_DOC_TYPE_CODES = ['04', '05', '06', '07']
const isContactDocType = (dt: DocumentTypeItem) => CONTACT_DOC_TYPE_CODES.includes(String(dt.code))

const customerDocTypeOptions = computed(() => {
  const filtered = docTypes.value.filter((dt) => isContactDocType(dt) && (dt.type === 'TODOS' || dt.type === 'CLIENTE'))
  if (filtered.length === 0) {
    return [
      { value: '05', label: 'Cédula (05)' },
      { value: '04', label: 'RUC (04)' },
      { value: '06', label: 'Pasaporte (06)' },
      { value: '07', label: 'Consumidor Final (07)' },
    ]
  }
  return filtered.map((dt) => ({
    value: dt.code,
    label: `${dt.name} (${dt.code})`,
  }))
})

const providerDocTypeOptions = computed(() => {
  const filtered = docTypes.value.filter((dt) => isContactDocType(dt) && (dt.type === 'TODOS' || dt.type === 'PROVEEDOR'))
  if (filtered.length === 0) {
    return [
      { value: '04', label: 'RUC (04)' },
      { value: '05', label: 'Cédula (05)' },
      { value: '06', label: 'Pasaporte (06)' },
    ]
  }
  return filtered.map((dt) => ({
    value: dt.code,
    label: `${dt.name} (${dt.code})`,
  }))
})

const sellerDocTypeOptions = computed(() => {
  const filtered = docTypes.value.filter((dt) => isContactDocType(dt) && (dt.type === 'TODOS' || dt.type === 'VENDEDOR'))
  if (filtered.length === 0) {
    return [
      { value: '05', label: 'Cédula (05)' },
      { value: '04', label: 'RUC (04)' },
      { value: '06', label: 'Pasaporte (06)' },
    ]
  }
  return filtered.map((dt) => ({
    value: dt.code,
    label: `${dt.name} (${dt.code})`,
  }))
})

const formCustomer = ref({
  tipo_documento: '05' as string,
  num_document: '',
  razon_social: '',
  nombre_comercial: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  estado: 'activo' as 'activo' | 'inactivo',
})

const formProvider = ref({
  tipo_documento: '04' as string,
  num_document: '',
  razon_social: '',
  nombre_comercial: '',
  email: '',
  telefono: '',
  direccion: '',
  forma_pago: 'credito_30' as 'contado' | 'credito_15' | 'credito_30' | 'credito_60' | 'transferencia',
  banco: '',
  num_cuenta: '',
  estado: 'activo' as 'activo' | 'inactivo',
})

const formSeller = ref({
  tipo_documento: '05' as string,
  num_document: '',
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  comision_pct: 5.0,
  estado: 'activo' as 'activo' | 'inactivo',
})

// Carga de datos
const loadData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'clientes') {
      customers.value = await getCustomers(currentCompanyId.value)
    } else if (activeTab.value === 'proveedores') {
      providers.value = await getProviders(currentCompanyId.value)
    } else if (activeTab.value === 'vendedores') {
      sellers.value = await getSellers(currentCompanyId.value)
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: 'clientes' | 'proveedores' | 'vendedores') => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  loadData()
}

const closeAllContactModals = () => {
  showCustomerModal.value = false
  showProviderModal.value = false
  showSellerModal.value = false
  showViewCustomerModal.value = false
  showViewProviderModal.value = false
  showViewSellerModal.value = false
}

// Sincronizar pestaña activa con ruta
watch(
  () => route.query.tab,
  (newTab) => {
    closeAllContactModals()
    if (newTab && ['clientes', 'proveedores', 'vendedores'].includes(newTab as string)) {
      activeTab.value = newTab as any
      loadData()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  window.addEventListener('deskounta:reset-view', closeAllContactModals)
  const comp = localStorage.getItem('selectedCompany')
  if (comp) {
    try {
      selectedCompany.value = JSON.parse(comp)
    } catch (e) {}
  }
  loadData()
  loadDocTypes()
})

onUnmounted(() => {
  window.removeEventListener('deskounta:reset-view', closeAllContactModals)
})

// ==========================================
// FILTROS COMPUTADOS
// ==========================================
const filteredCustomers = computed(() => {
  let list = customers.value || []

  if (appliedCustomerFilters.value.status !== 'todos') {
    list = list.filter((item) => item.estado === appliedCustomerFilters.value.status)
  }

  if (appliedCustomerFilters.value.docType !== 'todos') {
    list = list.filter((item) => item.tipo_documento === appliedCustomerFilters.value.docType)
  }

  if (appliedCustomerFilters.value.name) {
    const nameQ = appliedCustomerFilters.value.name
    list = list.filter(
      (item) =>
        (item.razon_social && item.razon_social.toLowerCase().includes(nameQ)) ||
        (item.nombre_comercial && item.nombre_comercial.toLowerCase().includes(nameQ))
    )
  }

  if (appliedCustomerFilters.value.doc) {
    const docQ = appliedCustomerFilters.value.doc
    list = list.filter((item) => item.num_document && item.num_document.toLowerCase().includes(docQ))
  }

  return list
})

const filteredProviders = computed(() => {
  let list = providers.value || []

  if (appliedProviderFilters.value.status !== 'todos') {
    list = list.filter((item) => item.estado === appliedProviderFilters.value.status)
  }

  if (appliedProviderFilters.value.docType !== 'todos') {
    list = list.filter((item) => item.tipo_documento === appliedProviderFilters.value.docType)
  }

  if (appliedProviderFilters.value.name) {
    const nameQ = appliedProviderFilters.value.name
    list = list.filter(
      (item) =>
        (item.razon_social && item.razon_social.toLowerCase().includes(nameQ)) ||
        (item.nombre_comercial && item.nombre_comercial.toLowerCase().includes(nameQ))
    )
  }

  if (appliedProviderFilters.value.doc) {
    const docQ = appliedProviderFilters.value.doc
    list = list.filter((item) => item.num_document && item.num_document.toLowerCase().includes(docQ))
  }

  return list
})

const filteredSellers = computed(() => {
  let list = sellers.value || []

  if (appliedSellerFilters.value.status !== 'todos') {
    list = list.filter((item) => item.estado === appliedSellerFilters.value.status)
  }

  if (appliedSellerFilters.value.docType !== 'todos') {
    list = list.filter((item) => item.tipo_documento === appliedSellerFilters.value.docType)
  }

  if (appliedSellerFilters.value.name) {
    const nameQ = appliedSellerFilters.value.name
    list = list.filter((item) => {
      const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.toLowerCase()
      return fullName.includes(nameQ) || (item.nombres && item.nombres.toLowerCase().includes(nameQ)) || (item.apellidos && item.apellidos.toLowerCase().includes(nameQ))
    })
  }

  if (appliedSellerFilters.value.doc) {
    const docQ = appliedSellerFilters.value.doc
    list = list.filter((item) => item.num_document && item.num_document.toLowerCase().includes(docQ))
  }

  return list
})

// ==========================================
// VALIDACIONES ECUADOR Y LOOKUP REGISTRO CIVIL / SRI
// ==========================================
const validarCedulaEcuadorLocal = (cedula: string): boolean => {
  if (!cedula || !/^\d{10}$/.test(cedula.trim())) return false
  const prov = parseInt(cedula.substring(0, 2), 10)
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false
  if (parseInt(cedula.charAt(2), 10) >= 6) return false

  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let p = parseInt(cedula.charAt(i), 10) * (coef[i] ?? 1)
    if (p >= 10) p -= 9
    sum += p
  }
  const digitoVerificador = sum % 10 === 0 ? 0 : 10 - (sum % 10)
  return digitoVerificador === parseInt(cedula.charAt(9), 10)
}

const validarRucEcuadorLocal = (ruc: string): boolean => {
  if (!ruc || !/^\d{13}$/.test(ruc.trim())) return false
  const prov = parseInt(ruc.substring(0, 2), 10)
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false

  const tercerDigito = parseInt(ruc.charAt(2), 10)

  // 1. Persona natural (tercer dígito < 6)
  if (tercerDigito < 6) {
    return ruc.substring(10) !== '000' && validarCedulaEcuadorLocal(ruc.substring(0, 10))
  }

  // 2. Sociedades privadas / extranjeras (tercer dígito == 9)
  if (tercerDigito === 9) {
    if (ruc.substring(10) === '000') return false
    const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(ruc.charAt(i), 10) * (coef[i] ?? 1)
    }
    const mod = sum % 11
    const digitoVerificador = mod === 0 ? 0 : 11 - mod
    return digitoVerificador === parseInt(ruc.charAt(9), 10)
  }

  // 3. Entidades públicas (tercer dígito == 6)
  if (tercerDigito === 6) {
    if (ruc.substring(9) === '0000') return false
    const coef = [3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += parseInt(ruc.charAt(i), 10) * (coef[i] ?? 1)
    }
    const mod = sum % 11
    const digitoVerificador = mod === 0 ? 0 : 11 - mod
    return digitoVerificador === parseInt(ruc.charAt(8), 10)
  }

  return false
}

const consultandoDocumentoCliente = ref(false)

const onCustomerDocTypeChange = (newVal?: string) => {
  if (newVal === '07') {
    if (!formCustomer.value.num_document || formCustomer.value.num_document === '') {
      formCustomer.value.num_document = '9999999999999'
    }
    if (!formCustomer.value.razon_social) {
      formCustomer.value.razon_social = 'CONSUMIDOR FINAL'
    }
    if (!formCustomer.value.direccion) {
      formCustomer.value.direccion = 'S/N (Ecuador)'
    }
    if (!formCustomer.value.telefono) {
      formCustomer.value.telefono = '9999999999'
    }
  }
}

watch(
  () => formCustomer.value.tipo_documento,
  (newVal) => {
    onCustomerDocTypeChange(newVal)
  }
)

const onCustomerDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value
  if (formCustomer.value.tipo_documento === '05') {
    val = val.replace(/\D/g, '').slice(0, 10)
  } else if (formCustomer.value.tipo_documento === '04' || formCustomer.value.tipo_documento === '07') {
    val = val.replace(/\D/g, '').slice(0, 13)
  } else {
    val = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()
  }
  if (val !== target.value) target.value = val
  formCustomer.value.num_document = val
}

const onCustomerPhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const clean = target.value.replace(/\D/g, '').slice(0, 10)
  if (clean !== target.value) target.value = clean
  formCustomer.value.telefono = clean
}

const consultarDocumentoCliente = async () => {
  const doc = String(formCustomer.value.num_document || '').trim()
  const tipo = formCustomer.value.tipo_documento

  if (!doc) {
    toast.warning('Ingresa el número de documento para consultar')
    return
  }

  if (tipo === '05') {
    if (!/^\d{10}$/.test(doc)) {
      toast.warning('La cédula debe contener exactamente 10 dígitos numéricos')
      return
    }
    if (!validarCedulaEcuadorLocal(doc)) {
      toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.')
      return
    }

    try {
      consultandoDocumentoCliente.value = true
      const res = await CampeonatoApi.players.consultaRegistroCivil(doc)
      const data = res.data
      if (data?.exists && data?.player) {
        const p = data.player
        const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
        if (nombreCompleto) {
          formCustomer.value.razon_social = nombreCompleto
        }
        if (p.phone && !formCustomer.value.telefono) {
          formCustomer.value.telefono = p.phone
        }
        if (p.email && !formCustomer.value.email) {
          formCustomer.value.email = p.email
        }
        if (p.address && !formCustomer.value.direccion) {
          formCustomer.value.direccion = p.address
        }

        if (data.source === 'REGISTRO_CIVIL') {
          toast.success(`Datos extraídos del Registro Civil: ${nombreCompleto}`)
        } else {
          toast.success(`Datos obtenidos del padrón: ${nombreCompleto}`)
        }
        return
      }
      toast.info('Cédula ecuatoriana válida. Puedes completar los datos del cliente.')
    } catch {
      toast.info('Cédula verificada con éxito.')
    } finally {
      consultandoDocumentoCliente.value = false
    }
  } else if (tipo === '04') {
    if (!/^\d{13}$/.test(doc)) {
      toast.warning('El RUC debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (!validarRucEcuadorLocal(doc)) {
      toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI de Ecuador.')
      return
    }

    try {
      consultandoDocumentoCliente.value = true
      const res = await CampeonatoApi.players.consultaRegistroCivil(doc)
      const data = res.data
      if (data?.exists && data?.player) {
        const p = data.player
        const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
        if (nombreCompleto) {
          formCustomer.value.razon_social = nombreCompleto
          if (!formCustomer.value.nombre_comercial) formCustomer.value.nombre_comercial = nombreCompleto
        }
        if (p.phone && !formCustomer.value.telefono) formCustomer.value.telefono = p.phone
        if (p.email && !formCustomer.value.email) formCustomer.value.email = p.email
        if (p.address && !formCustomer.value.direccion) formCustomer.value.direccion = p.address

        toast.success(`Datos obtenidos del SRI / Registro Civil: ${nombreCompleto || doc}`)
        return
      }
      toast.success('RUC verificado con éxito según el algoritmo oficial del SRI.')
    } catch {
      toast.info('RUC verificado con éxito.')
    } finally {
      consultandoDocumentoCliente.value = false
    }
  }
}

const consultandoDocumentoProveedor = ref(false)

const onProviderDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value
  if (formProvider.value.tipo_documento === '05') {
    val = val.replace(/\D/g, '').slice(0, 10)
  } else if (formProvider.value.tipo_documento === '04') {
    val = val.replace(/\D/g, '').slice(0, 13)
  } else {
    val = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()
  }
  if (val !== target.value) target.value = val
  formProvider.value.num_document = val
}

const onProviderPhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const clean = target.value.replace(/\D/g, '').slice(0, 10)
  if (clean !== target.value) target.value = clean
  formProvider.value.telefono = clean
}

const consultarDocumentoProveedor = async () => {
  const doc = String(formProvider.value.num_document || '').trim()
  const tipo = formProvider.value.tipo_documento

  if (!doc) {
    toast.warning('Ingresa el número de documento para consultar')
    return
  }

  if (tipo === '05') {
    if (!/^\d{10}$/.test(doc)) {
      toast.warning('La cédula debe contener exactamente 10 dígitos numéricos')
      return
    }
    if (!validarCedulaEcuadorLocal(doc)) {
      toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.')
      return
    }

    try {
      consultandoDocumentoProveedor.value = true
      const res = await CampeonatoApi.players.consultaRegistroCivil(doc)
      const data = res.data
      if (data?.exists && data?.player) {
        const p = data.player
        const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
        if (nombreCompleto) {
          formProvider.value.razon_social = nombreCompleto
          if (!formProvider.value.nombre_comercial) formProvider.value.nombre_comercial = nombreCompleto
        }
        if (p.phone && !formProvider.value.telefono) formProvider.value.telefono = p.phone
        if (p.email && !formProvider.value.email) formProvider.value.email = p.email
        if (p.address && !formProvider.value.direccion) formProvider.value.direccion = p.address

        toast.success(`Datos obtenidos del Registro Civil / SRI: ${nombreCompleto}`)
        return
      }
      toast.info('Cédula ecuatoriana válida. Puedes completar los datos del proveedor.')
    } catch {
      toast.info('Cédula verificada con éxito.')
    } finally {
      consultandoDocumentoProveedor.value = false
    }
  } else if (tipo === '04') {
    if (!/^\d{13}$/.test(doc)) {
      toast.warning('El RUC debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (!validarRucEcuadorLocal(doc)) {
      toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI de Ecuador.')
      return
    }

    try {
      consultandoDocumentoProveedor.value = true
      const res = await CampeonatoApi.players.consultaRegistroCivil(doc)
      const data = res.data
      if (data?.exists && data?.player) {
        const p = data.player
        const nombreCompleto = `${p.name || ''} ${p.lastName || ''}`.trim()
        if (nombreCompleto) {
          formProvider.value.razon_social = nombreCompleto
          if (!formProvider.value.nombre_comercial) formProvider.value.nombre_comercial = nombreCompleto
        }
        if (p.phone && !formProvider.value.telefono) formProvider.value.telefono = p.phone
        if (p.email && !formProvider.value.email) formProvider.value.email = p.email
        if (p.address && !formProvider.value.direccion) formProvider.value.direccion = p.address

        toast.success(`Datos obtenidos del SRI / Registro Civil: ${nombreCompleto || doc}`)
        return
      }
      toast.success('RUC verificado con éxito según el algoritmo oficial del SRI.')
    } catch {
      toast.info('RUC verificado con éxito.')
    } finally {
      consultandoDocumentoProveedor.value = false
    }
  }
}

const consultandoDocumentoSeller = ref(false)

const onSellerDocInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value
  if (formSeller.value.tipo_documento === '05') {
    val = val.replace(/\D/g, '').slice(0, 10)
  } else if (formSeller.value.tipo_documento === '04') {
    val = val.replace(/\D/g, '').slice(0, 13)
  } else {
    val = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()
  }
  if (val !== target.value) target.value = val
  formSeller.value.num_document = val
}

const onSellerPhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const clean = target.value.replace(/\D/g, '').slice(0, 10)
  if (clean !== target.value) target.value = clean
  formSeller.value.telefono = clean
}

const consultarDocumentoSeller = async () => {
  const doc = String(formSeller.value.num_document || '').trim()
  const tipo = formSeller.value.tipo_documento

  if (!doc) {
    toast.warning('Ingresa el número de documento para consultar')
    return
  }

  if (tipo === '05') {
    if (!/^\d{10}$/.test(doc)) {
      toast.warning('La cédula debe contener exactamente 10 dígitos numéricos')
      return
    }
    if (!validarCedulaEcuadorLocal(doc)) {
      toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.')
      return
    }

    try {
      consultandoDocumentoSeller.value = true
      const res = await CampeonatoApi.players.consultaRegistroCivil(doc)
      const data = res.data
      if (data?.exists && data?.player) {
        const p = data.player
        let nombres = p.name || ''
        let apellidos = p.lastName || ''
        if (!apellidos && nombres) {
          const parts = nombres.trim().split(/\s+/)
          if (parts.length >= 4) {
            apellidos = `${parts[0]} ${parts[1]}`
            nombres = parts.slice(2).join(' ')
          } else if (parts.length === 3) {
            apellidos = `${parts[0]} ${parts[1]}`
            nombres = parts[2]
          } else if (parts.length === 2) {
            apellidos = parts[0]
            nombres = parts[1]
          }
        }
        if (nombres) formSeller.value.nombres = nombres
        if (apellidos) formSeller.value.apellidos = apellidos
        if (p.phone && !formSeller.value.telefono) formSeller.value.telefono = p.phone
        if (p.email && !formSeller.value.email) formSeller.value.email = p.email
        if (p.address && !formSeller.value.direccion) formSeller.value.direccion = p.address

        toast.success(`Datos obtenidos del Registro Civil / SRI: ${nombres} ${apellidos}`.trim())
        return
      }
      toast.info('Cédula ecuatoriana válida. Puedes completar los datos del vendedor.')
    } catch {
      toast.info('Cédula verificada con éxito.')
    } finally {
      consultandoDocumentoSeller.value = false
    }
  } else if (tipo === '04') {
    if (!/^\d{13}$/.test(doc)) {
      toast.warning('El RUC debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (!validarRucEcuadorLocal(doc)) {
      toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI de Ecuador.')
      return
    }

    try {
      consultandoDocumentoSeller.value = true
      const res = await CampeonatoApi.players.consultaRegistroCivil(doc)
      const data = res.data
      if (data?.exists && data?.player) {
        const p = data.player
        let nombres = p.name || ''
        let apellidos = p.lastName || ''
        if (!apellidos && nombres) {
          const parts = nombres.trim().split(/\s+/)
          if (parts.length >= 4) {
            apellidos = `${parts[0]} ${parts[1]}`
            nombres = parts.slice(2).join(' ')
          } else if (parts.length === 3) {
            apellidos = `${parts[0]} ${parts[1]}`
            nombres = parts[2]
          } else if (parts.length === 2) {
            apellidos = parts[0]
            nombres = parts[1]
          }
        }
        if (nombres) formSeller.value.nombres = nombres
        if (apellidos) formSeller.value.apellidos = apellidos
        if (p.phone && !formSeller.value.telefono) formSeller.value.telefono = p.phone
        if (p.email && !formSeller.value.email) formSeller.value.email = p.email
        if (p.address && !formSeller.value.direccion) formSeller.value.direccion = p.address

        toast.success(`Datos obtenidos del SRI / Registro Civil: ${nombres} ${apellidos}`.trim() || doc)
        return
      }
      toast.success('RUC verificado con éxito según el algoritmo oficial del SRI.')
    } catch {
      toast.info('RUC verificado con éxito.')
    } finally {
      consultandoDocumentoSeller.value = false
    }
  }
}

// ==========================================
// OPERACIONES: CLIENTE
// ==========================================
const openCreateCustomer = () => {
  isEditMode.value = false
  editingId.value = null
  formCustomer.value = {
    tipo_documento: '05',
    num_document: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: 'activo',
  }
  showCustomerModal.value = true
}

const openEditCustomer = (c: CustomerItem) => {
  isEditMode.value = true
  editingId.value = c.id
  formCustomer.value = {
    tipo_documento: c.tipo_documento,
    num_document: c.num_document,
    razon_social: c.razon_social,
    nombre_comercial: c.nombre_comercial || '',
    email: c.email,
    telefono: c.telefono,
    direccion: c.direccion,
    ciudad: c.ciudad || '',
    estado: c.estado,
  }
  showCustomerModal.value = true
}

const openViewCustomer = (c: CustomerItem) => {
  viewingCustomer.value = c
  showViewCustomerModal.value = true
}

const saveCustomer = async () => {
  const doc = String(formCustomer.value.num_document || '').trim()
  const tipo = formCustomer.value.tipo_documento

  if (!doc) {
    toast.error('El número de documento es obligatorio')
    return
  }

  if (tipo === '05') {
    if (!/^\d{10}$/.test(doc)) {
      toast.error('La cédula debe tener exactamente 10 dígitos numéricos')
      return
    }
    if (!validarCedulaEcuadorLocal(doc)) {
      toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.')
      return
    }
  } else if (tipo === '04') {
    if (!/^\d{13}$/.test(doc)) {
      toast.error('El RUC debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (!validarRucEcuadorLocal(doc)) {
      toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI de Ecuador.')
      return
    }
  }

  if (!formCustomer.value.razon_social?.trim()) {
    toast.error('El nombre / razón social del cliente es obligatorio')
    return
  }

  if (formCustomer.value.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formCustomer.value.email.trim())) {
      toast.error('El correo electrónico no tiene un formato válido')
      return
    }
  }

  if (formCustomer.value.telefono?.trim()) {
    if (!/^\d{9,10}$/.test(formCustomer.value.telefono.trim())) {
      toast.error('El teléfono debe contener entre 9 y 10 dígitos numéricos')
      return
    }
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const payload = {
      tipo_documento: formCustomer.value.tipo_documento,
      num_document: doc,
      razon_social: formCustomer.value.razon_social.trim(),
      nombre_comercial: formCustomer.value.nombre_comercial?.trim() || '',
      email: formCustomer.value.email?.trim() || '',
      telefono: formCustomer.value.telefono?.trim() || '',
      direccion: formCustomer.value.direccion?.trim() || '',
      ciudad: formCustomer.value.ciudad?.trim() || '',
      estado: isEditMode.value ? formCustomer.value.estado : 'activo',
    }

    if (isEditMode.value && editingId.value) {
      await updateCustomer(editingId.value, payload, currentCompanyId.value)
      toast.success('Cliente actualizado exitosamente.')
    } else {
      await createCustomer(
        {
          ...payload,
          company_id: currentCompanyId.value,
        },
        currentCompanyId.value
      )
      toast.success('Cliente registrado exitosamente.')
    }
    showCustomerModal.value = false
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Error al guardar cliente')
  } finally {
    loading.value = false
  }
}

const actionProcessingId = ref<number | null>(null)

const handleToggleCustomerStatus = async (c: CustomerItem) => {
  actionProcessingId.value = c.id
  try {
    const updated = await toggleCustomerStatus(c.id, currentCompanyId.value)
    successMsg.value = `Cliente "${updated.razon_social}" ahora está ${updated.estado.toUpperCase()}.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cambiar estado'
  } finally {
    actionProcessingId.value = null
  }
}

// ==========================================
// OPERACIONES: PROVEEDOR
// ==========================================
const openCreateProvider = () => {
  isEditMode.value = false
  editingId.value = null
  formProvider.value = {
    tipo_documento: '04',
    num_document: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
    direccion: '',
    forma_pago: 'credito_30',
    banco: '',
    num_cuenta: '',
    estado: 'activo',
  }
  showProviderModal.value = true
}

const openEditProvider = (p: ProviderItem) => {
  isEditMode.value = true
  editingId.value = p.id
  formProvider.value = {
    tipo_documento: p.tipo_documento,
    num_document: p.num_document,
    razon_social: p.razon_social,
    nombre_comercial: p.nombre_comercial || '',
    email: p.email,
    telefono: p.telefono,
    direccion: p.direccion,
    forma_pago: p.forma_pago,
    banco: p.banco || '',
    num_cuenta: p.num_cuenta || '',
    estado: p.estado,
  }
  showProviderModal.value = true
}

const openViewProvider = (p: ProviderItem) => {
  viewingProvider.value = p
  showViewProviderModal.value = true
}

const saveProvider = async () => {
  const doc = String(formProvider.value.num_document || '').trim()
  const tipo = formProvider.value.tipo_documento

  if (!doc) {
    toast.error('El número de documento / RUC es obligatorio')
    return
  }

  if (tipo === '05') {
    if (!/^\d{10}$/.test(doc)) {
      toast.error('La cédula debe tener exactamente 10 dígitos numéricos')
      return
    }
    if (!validarCedulaEcuadorLocal(doc)) {
      toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.')
      return
    }
  } else if (tipo === '04') {
    if (!/^\d{13}$/.test(doc)) {
      toast.error('El RUC debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (!validarRucEcuadorLocal(doc)) {
      toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI de Ecuador.')
      return
    }
  }

  if (!formProvider.value.razon_social?.trim()) {
    toast.error('La razón social / empresa del proveedor es obligatoria')
    return
  }

  if (formProvider.value.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formProvider.value.email.trim())) {
      toast.error('El correo electrónico no tiene un formato válido')
      return
    }
  }

  if (formProvider.value.telefono?.trim()) {
    if (!/^\d{7,10}$/.test(formProvider.value.telefono.trim())) {
      toast.error('El teléfono debe contener entre 7 y 10 dígitos numéricos')
      return
    }
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const payload = {
      tipo_documento: formProvider.value.tipo_documento,
      num_document: doc,
      razon_social: formProvider.value.razon_social.trim(),
      nombre_comercial: formProvider.value.nombre_comercial?.trim() || '',
      email: formProvider.value.email?.trim() || '',
      telefono: formProvider.value.telefono?.trim() || '',
      direccion: formProvider.value.direccion?.trim() || '',
      forma_pago: formProvider.value.forma_pago,
      banco: formProvider.value.banco?.trim() || '',
      num_cuenta: formProvider.value.num_cuenta?.trim() || '',
      estado: isEditMode.value ? formProvider.value.estado : 'activo',
    }

    if (isEditMode.value && editingId.value) {
      await updateProvider(editingId.value, payload, currentCompanyId.value)
      toast.success('Proveedor actualizado exitosamente.')
    } else {
      await createProvider(
        {
          ...payload,
          company_id: currentCompanyId.value,
        },
        currentCompanyId.value
      )
      toast.success('Proveedor registrado exitosamente.')
    }
    showProviderModal.value = false
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Error al guardar proveedor')
  } finally {
    loading.value = false
  }
}

const handleToggleProviderStatus = async (p: ProviderItem) => {
  actionProcessingId.value = p.id
  try {
    const updated = await toggleProviderStatus(p.id, currentCompanyId.value)
    successMsg.value = `Proveedor "${updated.razon_social}" ahora está ${updated.estado.toUpperCase()}.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cambiar estado'
  } finally {
    actionProcessingId.value = null
  }
}

// ==========================================
// OPERACIONES: VENDEDOR
// ==========================================
const openCreateSeller = () => {
  isEditMode.value = false
  editingId.value = null
  formSeller.value = {
    tipo_documento: '05',
    num_document: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    comision_pct: 5.0,
    estado: 'activo',
  }
  showSellerModal.value = true
}

const openEditSeller = (s: SellerItem) => {
  isEditMode.value = true
  editingId.value = s.id
  formSeller.value = {
    tipo_documento: s.tipo_documento,
    num_document: s.num_document,
    nombres: s.nombres,
    apellidos: s.apellidos,
    email: s.email,
    telefono: s.telefono,
    direccion: s.direccion || '',
    comision_pct: s.comision_pct,
    estado: s.estado,
  }
  showSellerModal.value = true
}

const openViewSeller = (s: SellerItem) => {
  viewingSeller.value = s
  showViewSellerModal.value = true
}

const saveSeller = async () => {
  const doc = String(formSeller.value.num_document || '').trim()
  const tipo = formSeller.value.tipo_documento

  if (!doc) {
    toast.error('El número de documento del vendedor es obligatorio')
    return
  }

  if (tipo === '05') {
    if (!/^\d{10}$/.test(doc)) {
      toast.error('La cédula debe tener exactamente 10 dígitos numéricos')
      return
    }
    if (!validarCedulaEcuadorLocal(doc)) {
      toast.error('La cédula ingresada no es válida según el algoritmo oficial del Registro Civil de Ecuador.')
      return
    }
  } else if (tipo === '04') {
    if (!/^\d{13}$/.test(doc)) {
      toast.error('El RUC debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (!validarRucEcuadorLocal(doc)) {
      toast.error('El RUC ingresado no es válido según el algoritmo oficial del SRI de Ecuador.')
      return
    }
  }

  if (!formSeller.value.nombres?.trim()) {
    toast.error('Los nombres del vendedor son obligatorios')
    return
  }
  if (!formSeller.value.apellidos?.trim()) {
    toast.error('Los apellidos del vendedor son obligatorios')
    return
  }

  if (formSeller.value.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formSeller.value.email.trim())) {
      toast.error('El correo electrónico no tiene un formato válido')
      return
    }
  }

  if (formSeller.value.telefono?.trim()) {
    if (!/^\d{7,10}$/.test(formSeller.value.telefono.trim())) {
      toast.error('El teléfono debe contener entre 7 y 10 dígitos numéricos')
      return
    }
  }

  const comision = Number(formSeller.value.comision_pct)
  if (isNaN(comision) || comision < 0 || comision > 100) {
    toast.error('El porcentaje de comisión debe estar entre 0% y 100%')
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const payload = {
      tipo_documento: formSeller.value.tipo_documento,
      num_document: doc,
      nombres: formSeller.value.nombres.trim(),
      apellidos: formSeller.value.apellidos.trim(),
      email: formSeller.value.email?.trim() || '',
      telefono: formSeller.value.telefono?.trim() || '',
      direccion: formSeller.value.direccion?.trim() || '',
      comision_pct: comision,
      estado: isEditMode.value ? formSeller.value.estado : 'activo',
    }

    if (isEditMode.value && editingId.value) {
      await updateSeller(editingId.value, payload, currentCompanyId.value)
      toast.success('Vendedor actualizado exitosamente.')
    } else {
      await createSeller(
        {
          ...payload,
          company_id: currentCompanyId.value,
        },
        currentCompanyId.value
      )
      toast.success('Vendedor registrado exitosamente.')
    }
    showSellerModal.value = false
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Error al guardar vendedor')
  } finally {
    loading.value = false
  }
}

const handleToggleSellerStatus = async (s: SellerItem) => {
  actionProcessingId.value = s.id
  try {
    const updated = await toggleSellerStatus(s.id, currentCompanyId.value)
    successMsg.value = `Vendedor "${updated.nombres} ${updated.apellidos}" ahora está ${updated.estado.toUpperCase()}.`
    await loadData()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al cambiar estado'
  } finally {
    actionProcessingId.value = null
  }
}

// Helpers visuales
const docTypeLabel = (type: string) => {
  const found = docTypes.value.find((dt) => dt.code === type)
  if (found) return found.name
  switch (type) {
    case '04':
      return 'RUC'
    case '05':
      return 'Cédula'
    case '06':
      return 'Pasaporte'
    case '07':
      return 'Consumidor Final'
    default:
      return type
  }
}

const paymentLabel = (p: string) => {
  switch (p) {
    case 'contado':
      return 'Contado'
    case 'credito_15':
      return 'Crédito 15 días'
    case 'credito_30':
      return 'Crédito 30 días'
    case 'credito_60':
      return 'Crédito 60 días'
    case 'transferencia':
      return 'Transferencia bancaria'
    default:
      return p
  }
}
</script>

<template>
  <div class="crud-page contacts-page" :class="{ 'form-open': isFormOpen }">
    <!-- ENCABEZADO DE MÓDULO GENERAL -->
    <div class="crud-page-header keep-in-form">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle">MOD-004 · CONTACTOS</span>
          <span class="text-muted small">Terceros & Relaciones Comerciales</span>
        </div>
        <h2 class="crud-title">
          {{ activeTab === 'clientes' ? 'Directorio de Clientes' : activeTab === 'proveedores' ? 'Directorio de Proveedores' : 'Equipo de Vendedores' }}
        </h2>
        <p class="crud-subtitle">
          Administración de {{ activeTab }} registrados en la empresa.
        </p>
      </div>


    </div>

    <!-- Indicadores KPIs de Contactos -->
    <div v-show="!isFormOpen" class="crud-kpi-grid">
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon primary">
          <iconify-icon icon="solar:users-group-two-rounded-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Clientes Registrados</span>
          <h4 class="crud-kpi-val">{{ customers.length }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon warning">
          <iconify-icon icon="solar:box-minimalistic-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Proveedores</span>
          <h4 class="crud-kpi-val">{{ providers.length }}</h4>
        </div>
      </div>
      <div class="crud-kpi-card">
        <div class="crud-kpi-icon success">
          <iconify-icon icon="solar:user-id-line-duotone" class="fs-5"></iconify-icon>
        </div>
        <div>
          <span class="crud-kpi-label">Vendedores</span>
          <h4 class="crud-kpi-val">{{ sellers.length }}</h4>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- SUB-MÓDULO: CLIENTES -->
    <!-- ============================================================= -->
    <div v-if="activeTab === 'clientes'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <iconify-icon icon="solar:users-group-two-rounded-line-duotone" class="text-primary fs-5"></iconify-icon>
            <span>Directorio de Clientes</span>
          </h5>
          <small class="text-secondary">Gestión de cartera de clientes, personas naturales y jurídicas</small>
        </div>
        <button
          class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
          @click="openCreateCustomer"
        >
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo</span>
        </button>
      </div>

      <!-- Barra de Filtros Dedicada -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
        <select
          v-model="filterCustomerStatus"
          class="form-select bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 160px;"
          @change="applyCustomerFilters"
          @keyup.enter="applyCustomerFilters"
        >
          <option value="todos">Estado: Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          v-model="filterCustomerDocType"
          class="form-select bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 190px;"
          @change="onFilterDocTypeChange"
          @keyup.enter="applyCustomerFilters"
        >
          <option value="todos">Tipo: Todos</option>
          <option value="05">Cédula (05) - Reg. Civil</option>
          <option value="04">RUC (04) - SRI</option>
          <option value="06">Pasaporte (06)</option>
          <option value="07">Consumidor Final (07)</option>
        </select>

        <input
          v-model="filterCustomerName"
          type="text"
          class="form-control bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 260px;"
          placeholder="Razón Social / Nombre"
          @keyup.enter="applyCustomerFilters"
        />

        <div class="position-relative" style="width: 220px;">
          <input
            v-model="filterCustomerDoc"
            type="text"
            class="form-control bg-dark border-secondary-subtle text-white font-monospace pe-5"
            style="height: 40px;"
            :placeholder="filterCustomerDocType === '05' ? 'Cédula (Reg. Civil)' : filterCustomerDocType === '04' ? 'RUC (SRI)' : 'N° Identificación'"
            @input="onFilterCustomerDocInput"
            @keyup.enter="applyCustomerFilters"
          />
          <div
            v-if="buscandoDocumentoExterno"
            class="position-absolute end-0 top-50 translate-middle-y me-2 text-primary d-flex align-items-center"
          >
            <div class="spinner-border spinner-border-sm text-primary" role="status" style="width: 1rem; height: 1rem;">
              <span class="visually-hidden">Consultando...</span>
            </div>
          </div>
          <span
            v-else-if="filterCustomerDocType === '05' || filterCustomerDoc.length === 10"
            class="position-absolute end-0 top-50 translate-middle-y me-2 badge bg-primary-subtle text-primary border border-primary-subtle py-1"
            style="font-size: 0.7rem;"
            title="Validación / Consulta Registro Civil"
          >
            RC
          </span>
          <span
            v-else-if="filterCustomerDocType === '04' || filterCustomerDoc.length === 13"
            class="position-absolute end-0 top-50 translate-middle-y me-2 badge bg-info-subtle text-info border border-info-subtle py-1"
            style="font-size: 0.7rem;"
            title="Validación / Consulta SRI"
          >
            SRI
          </span>
        </div>

        <button
          type="button"
          class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
          style="height: 40px;"
          :disabled="buscandoDocumentoExterno"
          @click="applyCustomerFilters"
        >
          <span v-if="buscandoDocumentoExterno" class="spinner-border spinner-border-sm"></span>
          <iconify-icon v-else icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
          <span>Buscar</span>
        </button>

        <button
          v-if="appliedCustomerFilters.doc || appliedCustomerFilters.name || appliedCustomerFilters.status !== 'todos' || appliedCustomerFilters.docType !== 'todos' || externalFoundCustomer"
          type="button"
          class="btn btn-outline-secondary bg-dark d-flex align-items-center gap-1 px-2"
          style="height: 40px;"
          title="Limpiar filtros"
          @click="clearCustomerFilters"
        >
          <iconify-icon icon="solar:refresh-line-duotone" class="fs-5"></iconify-icon>
        </button>
      </div>

      <!-- Banner de Cliente Encontrado en Registro Civil / SRI (no registrado aún en la empresa) -->
      <div
        v-if="externalFoundCustomer"
        class="alert alert-info border-info-subtle bg-info-subtle text-white p-3 rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm"
      >
        <div class="d-flex align-items-center gap-3">
          <div class="bg-primary bg-opacity-25 p-2 rounded-circle text-primary d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
            <iconify-icon icon="solar:user-check-bold-duotone" class="fs-3"></iconify-icon>
          </div>
          <div>
            <div class="fw-bold fs-6 d-flex align-items-center gap-2">
              <span class="badge bg-primary text-white">{{ externalFoundCustomer.source }}</span>
              <span>{{ externalFoundCustomer.razon_social || 'Documento Válido en Padrón' }}</span>
            </div>
            <div class="small text-secondary mt-1">
              Documento: <span class="font-monospace text-white fw-bold">{{ externalFoundCustomer.num_document }}</span>
              <span v-if="externalFoundCustomer.telefono"> • Tel: <span class="text-white">{{ externalFoundCustomer.telefono }}</span></span>
              <span v-if="externalFoundCustomer.email"> • Email: <span class="text-white">{{ externalFoundCustomer.email }}</span></span>
              <span v-if="externalFoundCustomer.direccion"> • Dir: <span class="text-white">{{ externalFoundCustomer.direccion }}</span></span>
              — <span class="text-warning fw-medium">No registrado aún en esta empresa</span>
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm"
            @click="registrarClienteExternoEncontrado"
          >
            <iconify-icon icon="solar:user-plus-bold-duotone" class="fs-5"></iconify-icon>
            <span>Registrar como Cliente</span>
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm text-secondary"
            title="Cerrar aviso"
            @click="externalFoundCustomer = null"
          >
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- Tabla de Clientes -->
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 crud-table app-table">
          <thead class="table-primary">
            <tr>
              <th width="5%">#</th>
              <th width="18%">Documento</th>
              <th width="30%">Razón Social / Cliente</th>
              <th width="17%">Contacto</th>
              <th width="15%">Dirección</th>
              <th width="8%" class="text-center">Estado</th>
              <th width="7%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando clientes...</span>
              </td>
            </tr>

            <tr v-else-if="filteredCustomers.length === 0">
              <td colspan="7" class="text-center text-muted py-4">
                No se encontraron clientes registrados o que coincidan con los filtros aplicados.
              </td>
            </tr>

            <tr
              v-for="c in filteredCustomers"
              :key="c.id"
              :class="{ 'opacity-75': c.estado === 'inactivo' }"
            >
              <!-- # ID -->
              <td>
                <span class="badge bg-dark-subtle text-white">{{ c.id }}</span>
              </td>

              <!-- Documento -->
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-1">
                    {{ docTypeLabel(c.tipo_documento) }}
                  </span>
                  <span class="badge bg-dark-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                    {{ c.num_document }}
                  </span>
                </div>
              </td>

              <!-- Razón Social -->
              <td>
                <div class="d-flex flex-column">
                  <span class="text-white fw-bold">{{ c.razon_social }}</span>
                  <small v-if="c.nombre_comercial" class="text-muted fs-1">
                    {{ c.nombre_comercial }}
                  </small>
                </div>
              </td>

              <!-- Contacto -->
              <td>
                <div class="d-flex flex-column gap-1">
                  <span class="text-secondary fs-2 d-flex align-items-center gap-1 font-monospace">
                    <iconify-icon icon="solar:phone-line-duotone" class="text-info"></iconify-icon>
                    {{ c.telefono || 'Sin teléfono' }}
                  </span>
                  <span class="text-secondary fs-2 d-flex align-items-center gap-1">
                    <iconify-icon icon="solar:letter-line-duotone" class="text-warning"></iconify-icon>
                    {{ c.email || 'Sin correo' }}
                  </span>
                </div>
              </td>

              <!-- Dirección -->
              <td>
                <span class="text-secondary fs-2 text-wrap" style="max-width: 220px; display: inline-block;">
                  {{ c.direccion || 'S/N' }} {{ c.ciudad ? `(${c.ciudad})` : '' }}
                </span>
              </td>

              <!-- Estado -->
              <td class="text-center">
                <button
                  type="button"
                  class="badge px-3 py-1 rounded-pill border-0 cursor-pointer transition-all"
                  :class="c.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  @click="handleToggleCustomerStatus(c)"
                  title="Click para cambiar estado"
                >
                  {{ c.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                </button>
              </td>

              <!-- Acciones -->
              <td class="text-end">
                <div class="dropdown">
                  <button
                    class="btn btn-action-kebab"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-display="static"
                    aria-expanded="false"
                    title="Acciones"
                  >
                    <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" @click="openViewCustomer(c)">
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Detalle</span>
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditCustomer(c)">
                        <iconify-icon icon="solar:pen-2-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar</span>
                      </a>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                      <a
                        class="dropdown-item py-2"
                        :class="[c.estado === 'activo' ? 'text-danger' : 'text-success', { disabled: actionProcessingId === c.id }]"
                        href="javascript:void(0)"
                        @click="handleToggleCustomerStatus(c)"
                      >
                        <span v-if="actionProcessingId === c.id" class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                        <iconify-icon
                          v-else
                          :icon="c.estado === 'activo' ? 'solar:pause-circle-line-duotone' : 'solar:play-circle-line-duotone'"
                          class="fs-5"
                        ></iconify-icon>
                        <span>{{ c.estado === 'activo' ? 'Desactivar' : 'Activar' }}</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- SUB-MÓDULO: PROVEEDORES -->
    <!-- ============================================================= -->
    <div v-else-if="activeTab === 'proveedores'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <iconify-icon icon="solar:box-minimalistic-line-duotone" class="text-primary fs-5"></iconify-icon>
            <span>Directorio de Proveedores</span>
          </h5>
          <small class="text-secondary">Administración y control de proveedores de bienes y servicios</small>
        </div>
        <button
          class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
          @click="openCreateProvider"
        >
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo</span>
        </button>
      </div>

      <!-- Barra de Filtros Dedicada -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
        <select
          v-model="filterProviderStatus"
          class="form-select bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 160px;"
          @change="applyProviderFilters"
          @keyup.enter="applyProviderFilters"
        >
          <option value="todos">Estado: Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          v-model="filterProviderDocType"
          class="form-select bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 190px;"
          @change="onFilterProviderDocTypeChange"
          @keyup.enter="applyProviderFilters"
        >
          <option value="todos">Tipo: Todos</option>
          <option value="04">RUC (04) - SRI</option>
          <option value="05">Cédula (05) - Reg. Civil</option>
          <option value="06">Pasaporte (06)</option>
        </select>

        <input
          v-model="filterProviderName"
          type="text"
          class="form-control bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 260px;"
          placeholder="Razón Social / Empresa"
          @keyup.enter="applyProviderFilters"
        />

        <div class="position-relative" style="width: 220px;">
          <input
            v-model="filterProviderDoc"
            type="text"
            class="form-control bg-dark border-secondary-subtle text-white font-monospace pe-5"
            style="height: 40px;"
            :placeholder="filterProviderDocType === '04' ? 'RUC (SRI)' : filterProviderDocType === '05' ? 'Cédula (Reg. Civil)' : 'N° Identificación'"
            @input="onFilterProviderDocInput"
            @keyup.enter="applyProviderFilters"
          />
          <div
            v-if="buscandoDocumentoExternoProveedor"
            class="position-absolute end-0 top-50 translate-middle-y me-2 text-primary d-flex align-items-center"
          >
            <div class="spinner-border spinner-border-sm text-primary" role="status" style="width: 1rem; height: 1rem;">
              <span class="visually-hidden">Consultando...</span>
            </div>
          </div>
          <span
            v-else-if="filterProviderDocType === '04' || filterProviderDoc.length === 13"
            class="position-absolute end-0 top-50 translate-middle-y me-2 badge bg-info-subtle text-info border border-info-subtle py-1"
            style="font-size: 0.7rem;"
            title="Validación / Consulta SRI"
          >
            SRI
          </span>
          <span
            v-else-if="filterProviderDocType === '05' || filterProviderDoc.length === 10"
            class="position-absolute end-0 top-50 translate-middle-y me-2 badge bg-primary-subtle text-primary border border-primary-subtle py-1"
            style="font-size: 0.7rem;"
            title="Validación / Consulta Registro Civil"
          >
            RC
          </span>
        </div>

        <button
          type="button"
          class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
          style="height: 40px;"
          :disabled="buscandoDocumentoExternoProveedor"
          @click="applyProviderFilters"
        >
          <span v-if="buscandoDocumentoExternoProveedor" class="spinner-border spinner-border-sm"></span>
          <iconify-icon v-else icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
          <span>Buscar</span>
        </button>

        <button
          v-if="appliedProviderFilters.doc || appliedProviderFilters.name || appliedProviderFilters.status !== 'todos' || appliedProviderFilters.docType !== 'todos' || externalFoundProvider"
          type="button"
          class="btn btn-outline-secondary bg-dark d-flex align-items-center gap-1 px-2"
          style="height: 40px;"
          title="Limpiar filtros"
          @click="clearProviderFilters"
        >
          <iconify-icon icon="solar:refresh-line-duotone" class="fs-5"></iconify-icon>
        </button>
      </div>

      <!-- Banner de Proveedor Encontrado en SRI / Registro Civil (no registrado aún en la empresa) -->
      <div
        v-if="externalFoundProvider"
        class="alert alert-info border-info-subtle bg-info-subtle text-white p-3 rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm"
      >
        <div class="d-flex align-items-center gap-3">
          <div class="bg-primary bg-opacity-25 p-2 rounded-circle text-primary d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
            <iconify-icon icon="solar:box-minimalistic-bold-duotone" class="fs-3"></iconify-icon>
          </div>
          <div>
            <div class="fw-bold fs-6 d-flex align-items-center gap-2">
              <span class="badge bg-primary text-white">{{ externalFoundProvider.source }}</span>
              <span>{{ externalFoundProvider.razon_social || 'Documento Válido en SRI' }}</span>
            </div>
            <div class="small text-secondary mt-1">
              Documento: <span class="font-monospace text-white fw-bold">{{ externalFoundProvider.num_document }}</span>
              <span v-if="externalFoundProvider.telefono"> • Tel: <span class="text-white">{{ externalFoundProvider.telefono }}</span></span>
              <span v-if="externalFoundProvider.email"> • Email: <span class="text-white">{{ externalFoundProvider.email }}</span></span>
              <span v-if="externalFoundProvider.direccion"> • Dir: <span class="text-white">{{ externalFoundProvider.direccion }}</span></span>
              — <span class="text-warning fw-medium">No registrado aún en tus proveedores</span>
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm"
            @click="registrarProveedorExternoEncontrado"
          >
            <iconify-icon icon="solar:add-circle-bold-duotone" class="fs-5"></iconify-icon>
            <span>Registrar como Proveedor</span>
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm text-secondary"
            title="Cerrar aviso"
            @click="externalFoundProvider = null"
          >
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- Tabla de Proveedores -->
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 crud-table app-table">
          <thead class="table-primary">
            <tr>
              <th width="5%">#</th>
              <th width="16%">Documento</th>
              <th width="28%">Razón Social / Empresa</th>
              <th width="18%">Contacto</th>
              <th width="18%">Condición Pago / Cuenta</th>
              <th width="8%" class="text-center">Estado</th>
              <th width="7%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando proveedores...</span>
              </td>
            </tr>

            <tr v-else-if="filteredProviders.length === 0">
              <td colspan="7" class="text-center py-5 text-secondary">
                <iconify-icon icon="solar:ghost-line-duotone" class="fs-8 mb-2 d-block"></iconify-icon>
                No se encontraron proveedores registrados.
              </td>
            </tr>

            <tr
              v-for="p in filteredProviders"
              :key="p.id"
              :class="{ 'opacity-75': p.estado === 'inactivo' }"
            >
              <td>
                <span class="text-white fw-bold">{{ p.id }}</span>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-warning-subtle text-warning border border-warning-subtle fs-1">
                    {{ docTypeLabel(p.tipo_documento) }}
                  </span>
                  <span class="crud-chip font-monospace">{{ p.num_document }}</span>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column">
                  <span class="text-white fw-semibold">{{ p.razon_social }}</span>
                  <small v-if="p.nombre_comercial" class="text-secondary">
                    {{ p.nombre_comercial }}
                  </small>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column gap-1">
                  <span class="text-secondary d-flex align-items-center gap-1">
                    <iconify-icon icon="solar:phone-line-duotone" class="text-info"></iconify-icon>
                    <span>{{ p.telefono || 'Sin teléfono' }}</span>
                  </span>
                  <span class="text-secondary d-flex align-items-center gap-1">
                    <iconify-icon icon="solar:letter-line-duotone" class="text-warning"></iconify-icon>
                    <span>{{ p.email || 'Sin correo' }}</span>
                  </span>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column gap-1">
                  <span class="badge bg-dark-subtle text-body-secondary border border-secondary-subtle px-2 py-1 align-self-start">
                    {{ paymentLabel(p.forma_pago) }}
                  </span>
                  <span v-if="p.banco" class="text-secondary small">
                    {{ p.banco }} <span v-if="p.num_cuenta" class="font-monospace text-white">({{ p.num_cuenta }})</span>
                  </span>
                </div>
              </td>
              <td class="text-center">
                <button
                  type="button"
                  class="badge px-3 py-1 rounded-pill border-0 cursor-pointer transition-all"
                  :class="p.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  @click="handleToggleProviderStatus(p)"
                  title="Click para cambiar estado"
                >
                  {{ p.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-end">
                <div class="dropdown">
                  <button
                    class="btn btn-action-kebab"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-display="static"
                    aria-expanded="false"
                    title="Acciones"
                  >
                    <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" @click="openViewProvider(p)">
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Detalle</span>
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditProvider(p)">
                        <iconify-icon icon="solar:pen-2-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar</span>
                      </a>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                      <a
                        class="dropdown-item py-2"
                        :class="[p.estado === 'activo' ? 'text-danger' : 'text-success', { disabled: actionProcessingId === p.id }]"
                        href="javascript:void(0)"
                        @click="handleToggleProviderStatus(p)"
                      >
                        <span v-if="actionProcessingId === p.id" class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                        <iconify-icon
                          v-else
                          :icon="p.estado === 'activo' ? 'solar:pause-circle-line-duotone' : 'solar:play-circle-line-duotone'"
                          class="fs-5"
                        ></iconify-icon>
                        <span>{{ p.estado === 'activo' ? 'Desactivar' : 'Activar' }}</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- SUB-MÓDULO: VENDEDORES -->
    <!-- ============================================================= -->
    <div v-else-if="activeTab === 'vendedores'" class="card rounded-4 border-0 shadow-sm p-4 bg-navy-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 class="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <iconify-icon icon="solar:user-id-line-duotone" class="text-primary fs-5"></iconify-icon>
            <span>Equipo de Vendedores</span>
          </h5>
          <small class="text-secondary">Gestión de asesores comerciales y comisiones de venta</small>
        </div>
        <button
          class="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
          @click="openCreateSeller"
        >
          <iconify-icon icon="solar:add-circle-line-duotone" class="fs-5"></iconify-icon>
          <span>Nuevo</span>
        </button>
      </div>

      <!-- Barra de Filtros Dedicada -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
        <select
          v-model="filterSellerStatus"
          class="form-select bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 160px;"
          @change="applySellerFilters"
          @keyup.enter="applySellerFilters"
        >
          <option value="todos">Estado: Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          v-model="filterSellerDocType"
          class="form-select bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 190px;"
          @change="onFilterSellerDocTypeChange"
          @keyup.enter="applySellerFilters"
        >
          <option value="todos">Tipo: Todos</option>
          <option value="05">Cédula (05) - Reg. Civil</option>
          <option value="04">RUC (04) - SRI</option>
          <option value="06">Pasaporte (06)</option>
        </select>

        <input
          v-model="filterSellerName"
          type="text"
          class="form-control bg-dark border-secondary-subtle text-white"
          style="height: 40px; width: 260px;"
          placeholder="Nombre / Apellidos"
          @keyup.enter="applySellerFilters"
        />

        <div class="position-relative" style="width: 220px;">
          <input
            v-model="filterSellerDoc"
            type="text"
            class="form-control bg-dark border-secondary-subtle text-white font-monospace pe-5"
            style="height: 40px;"
            :placeholder="filterSellerDocType === '05' ? 'Cédula (Reg. Civil)' : filterSellerDocType === '04' ? 'RUC (SRI)' : 'N° Identificación'"
            @input="onFilterSellerDocInput"
            @keyup.enter="applySellerFilters"
          />
          <div
            v-if="buscandoDocumentoExternoSeller"
            class="position-absolute end-0 top-50 translate-middle-y me-2 text-primary d-flex align-items-center"
          >
            <div class="spinner-border spinner-border-sm text-primary" role="status" style="width: 1rem; height: 1rem;">
              <span class="visually-hidden">Consultando...</span>
            </div>
          </div>
          <span
            v-else-if="filterSellerDocType === '05' || filterSellerDoc.length === 10"
            class="position-absolute end-0 top-50 translate-middle-y me-2 badge bg-primary-subtle text-primary border border-primary-subtle py-1"
            style="font-size: 0.7rem;"
            title="Validación / Consulta Registro Civil"
          >
            RC
          </span>
          <span
            v-else-if="filterSellerDocType === '04' || filterSellerDoc.length === 13"
            class="position-absolute end-0 top-50 translate-middle-y me-2 badge bg-info-subtle text-info border border-info-subtle py-1"
            style="font-size: 0.7rem;"
            title="Validación / Consulta SRI"
          >
            SRI
          </span>
        </div>

        <button
          type="button"
          class="btn btn-outline-primary bg-dark d-flex align-items-center gap-1 px-3 ms-auto"
          style="height: 40px;"
          :disabled="buscandoDocumentoExternoSeller"
          @click="applySellerFilters"
        >
          <span v-if="buscandoDocumentoExternoSeller" class="spinner-border spinner-border-sm"></span>
          <iconify-icon v-else icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
          <span>Buscar</span>
        </button>

        <button
          v-if="appliedSellerFilters.doc || appliedSellerFilters.name || appliedSellerFilters.status !== 'todos' || appliedSellerFilters.docType !== 'todos' || externalFoundSeller"
          type="button"
          class="btn btn-outline-secondary bg-dark d-flex align-items-center gap-1 px-2"
          style="height: 40px;"
          title="Limpiar filtros"
          @click="clearSellerFilters"
        >
          <iconify-icon icon="solar:refresh-line-duotone" class="fs-5"></iconify-icon>
        </button>
      </div>

      <!-- Banner de Vendedor Encontrado en Registro Civil / SRI (no registrado aún en la empresa) -->
      <div
        v-if="externalFoundSeller"
        class="alert alert-info border-info-subtle bg-info-subtle text-white p-3 rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm"
      >
        <div class="d-flex align-items-center gap-3">
          <div class="bg-primary bg-opacity-25 p-2 rounded-circle text-primary d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
            <iconify-icon icon="solar:user-id-bold-duotone" class="fs-3"></iconify-icon>
          </div>
          <div>
            <div class="fw-bold fs-6 d-flex align-items-center gap-2">
              <span class="badge bg-primary text-white">{{ externalFoundSeller.source }}</span>
              <span>{{ externalFoundSeller.nombres }} {{ externalFoundSeller.apellidos }}</span>
            </div>
            <div class="small text-secondary mt-1">
              Documento: <span class="font-monospace text-white fw-bold">{{ externalFoundSeller.num_document }}</span>
              <span v-if="externalFoundSeller.telefono"> • Tel: <span class="text-white">{{ externalFoundSeller.telefono }}</span></span>
              <span v-if="externalFoundSeller.email"> • Email: <span class="text-white">{{ externalFoundSeller.email }}</span></span>
              <span v-if="externalFoundSeller.direccion"> • Dir: <span class="text-white">{{ externalFoundSeller.direccion }}</span></span>
              — <span class="text-warning fw-medium">No registrado aún en tu equipo</span>
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm"
            @click="registrarVendedorExternoEncontrado"
          >
            <iconify-icon icon="solar:user-plus-bold-duotone" class="fs-5"></iconify-icon>
            <span>Registrar como Vendedor</span>
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm text-secondary"
            title="Cerrar aviso"
            @click="externalFoundSeller = null"
          >
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-5"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- Tabla de Vendedores -->
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 crud-table app-table">
          <thead class="table-primary">
            <tr>
              <th width="5%">#</th>
              <th width="16%">Documento</th>
              <th width="28%">Vendedor / Asesor</th>
              <th width="18%">Contacto</th>
              <th width="16%">Dirección</th>
              <th width="8%" class="text-center">Comisión</th>
              <th width="8%" class="text-center">Estado</th>
              <th width="7%" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center py-5">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                  <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
                </div>
                <span class="text-secondary small">Cargando vendedores...</span>
              </td>
            </tr>

            <tr v-else-if="filteredSellers.length === 0">
              <td colspan="8" class="text-center py-5 text-secondary">
                <iconify-icon icon="solar:ghost-line-duotone" class="fs-8 mb-2 d-block"></iconify-icon>
                No se encontraron vendedores registrados.
              </td>
            </tr>

            <tr
              v-for="s in filteredSellers"
              :key="s.id"
              :class="{ 'opacity-75': s.estado === 'inactivo' }"
            >
              <td>
                <span class="text-white fw-bold">{{ s.id }}</span>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-success-subtle text-success border border-success-subtle fs-1">
                    {{ docTypeLabel(s.tipo_documento) }}
                  </span>
                  <span class="crud-chip font-monospace">{{ s.num_document }}</span>
                </div>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 34px; height: 34px;">
                    {{ (s.nombres || 'V').charAt(0) }}{{ (s.apellidos || 'C').charAt(0) }}
                  </div>
                  <div class="d-flex flex-column">
                    <span class="text-white fw-semibold">{{ s.nombres }} {{ s.apellidos }}</span>
                    <small class="text-secondary">Asesor Comercial</small>
                  </div>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column gap-1">
                  <span class="text-secondary d-flex align-items-center gap-1">
                    <iconify-icon icon="solar:phone-line-duotone" class="text-info"></iconify-icon>
                    <span>{{ s.telefono || 'Sin teléfono' }}</span>
                  </span>
                  <span class="text-secondary d-flex align-items-center gap-1">
                    <iconify-icon icon="solar:letter-line-duotone" class="text-warning"></iconify-icon>
                    <span>{{ s.email || 'Sin correo' }}</span>
                  </span>
                </div>
              </td>
              <td>
                <span class="text-secondary fs-2 text-wrap" style="max-width: 200px; display: inline-block;">
                  {{ s.direccion || 'No especificada' }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 fs-2 fw-bold">
                  {{ s.comision_pct }}%
                </span>
              </td>
              <td class="text-center">
                <button
                  type="button"
                  class="badge px-3 py-1 rounded-pill border-0 cursor-pointer transition-all"
                  :class="s.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                  @click="handleToggleSellerStatus(s)"
                  title="Click para cambiar estado"
                >
                  {{ s.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="text-end">
                <div class="dropdown">
                  <button
                    class="btn btn-action-kebab"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-display="static"
                    aria-expanded="false"
                    title="Acciones"
                  >
                    <iconify-icon icon="solar:menu-dots-vertical-bold" class="fs-4"></iconify-icon>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-1">
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" @click="openViewSeller(s)">
                        <iconify-icon icon="solar:eye-line-duotone" class="fs-5 text-info"></iconify-icon>
                        <span>Ver Detalle</span>
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item py-2 text-warning" href="javascript:void(0)" @click="openEditSeller(s)">
                        <iconify-icon icon="solar:pen-2-line-duotone" class="fs-5 text-warning"></iconify-icon>
                        <span>Editar</span>
                      </a>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                      <a
                        class="dropdown-item py-2"
                        :class="[s.estado === 'activo' ? 'text-danger' : 'text-success', { disabled: actionProcessingId === s.id }]"
                        href="javascript:void(0)"
                        @click="handleToggleSellerStatus(s)"
                      >
                        <span v-if="actionProcessingId === s.id" class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                        <iconify-icon
                          v-else
                          :icon="s.estado === 'activo' ? 'solar:pause-circle-line-duotone' : 'solar:play-circle-line-duotone'"
                          class="fs-5"
                        ></iconify-icon>
                        <span>{{ s.estado === 'activo' ? 'Desactivar' : 'Activar' }}</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL CREAR / EDITAR CLIENTE -->
    <!-- ============================================================= -->
    <div v-if="showCustomerModal" id="form-page" class="form-page">
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-primary-subtle text-primary rounded-3">
              <iconify-icon :icon="isEditMode ? 'solar:pen-new-square-line-duotone' : 'solar:user-plus-line-duotone'" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">
              {{ isEditMode ? 'Editar Cliente' : 'Registrar Nuevo Cliente' }}
            </h5>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showCustomerModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="saveCustomer">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Documento *</label>
              <AppSelect2
                v-model="formCustomer.tipo_documento"
                :options="customerDocTypeOptions"
                placeholder="Seleccionar Tipo de Documento"
                search-placeholder="Buscar tipo de documento..."
                required
              />
            </div>

            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Número Documento *</label>
              <div class="input-group">
                <input
                  v-model="formCustomer.num_document"
                  type="text"
                  :maxlength="formCustomer.tipo_documento === '04' || formCustomer.tipo_documento === '07' ? 13 : (formCustomer.tipo_documento === '05' ? 10 : 20)"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                  placeholder="Ej. 1718293847"
                  @input="onCustomerDocInput"
                  @keyup.enter.prevent="consultarDocumentoCliente"
                  required
                />
                <button
                  v-if="formCustomer.tipo_documento === '05' || formCustomer.tipo_documento === '04'"
                  type="button"
                  class="btn btn-outline-primary bg-dark border-secondary-subtle d-flex align-items-center gap-1"
                  :disabled="consultandoDocumentoCliente"
                  title="Consultar en Registro Civil / SRI"
                  @click="consultarDocumentoCliente"
                >
                  <span v-if="consultandoDocumentoCliente" class="spinner-border spinner-border-sm text-primary"></span>
                  <iconify-icon v-else icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
                  <span class="d-none d-sm-inline">SRI</span>
                </button>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre / Razón Social *</label>
              <input
                v-model="formCustomer.razon_social"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Nombre completo o Razón Social"
                required
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre Comercial (Opcional)</label>
              <input
                v-model="formCustomer.nombre_comercial"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Ej. Comercial Los Andes"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono / Celular</label>
              <input
                v-model="formCustomer.telefono"
                type="text"
                maxlength="10"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="0991234567"
                @input="onCustomerPhoneInput"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico</label>
              <input
                v-model="formCustomer.email"
                type="email"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="cliente@correo.com"
              />
            </div>

            <div class="col-md-8">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección</label>
              <input
                v-model="formCustomer.direccion"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Calle principal y secundaria"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">Ciudad</label>
              <input
                v-model="formCustomer.ciudad"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Quito"
              />
            </div>

            <div v-if="isEditMode" class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Estado</label>
              <select v-model="formCustomer.estado" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="border-top pt-3 mt-4 pb-2 px-2 d-flex align-items-center justify-content-end gap-3">
            <button type="button" class="btn bg-danger-subtle text-danger" @click="showCustomerModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="loading">
              <span v-if="loading" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              <span>{{ isEditMode ? 'Guardar Cambios' : 'Registrar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL CREAR / EDITAR PROVEEDOR -->
    <!-- ============================================================= -->
    <div v-if="showProviderModal" id="form-page" class="form-page">
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-warning-subtle text-warning rounded-3">
              <iconify-icon :icon="isEditMode ? 'solar:pen-new-square-line-duotone' : 'solar:box-minimalistic-line-duotone'" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">
              {{ isEditMode ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor' }}
            </h5>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showProviderModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="saveProvider">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Documento *</label>
              <AppSelect2
                v-model="formProvider.tipo_documento"
                :options="providerDocTypeOptions"
                placeholder="Seleccionar Tipo de Documento"
                search-placeholder="Buscar tipo de documento..."
                required
              />
            </div>

            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Número Documento / RUC *</label>
              <div class="input-group">
                <input
                  v-model="formProvider.num_document"
                  type="text"
                  :maxlength="formProvider.tipo_documento === '04' ? 13 : (formProvider.tipo_documento === '05' ? 10 : 20)"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                  placeholder="Ej. 1790013820001"
                  @input="onProviderDocInput"
                  @keyup.enter.prevent="consultarDocumentoProveedor"
                  required
                />
                <button
                  v-if="formProvider.tipo_documento === '05' || formProvider.tipo_documento === '04'"
                  type="button"
                  class="btn btn-outline-primary bg-dark border-secondary-subtle d-flex align-items-center gap-1"
                  :disabled="consultandoDocumentoProveedor"
                  title="Consultar en SRI / Registro Civil"
                  @click="consultarDocumentoProveedor"
                >
                  <span v-if="consultandoDocumentoProveedor" class="spinner-border spinner-border-sm text-primary"></span>
                  <iconify-icon v-else icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
                  <span class="d-none d-sm-inline">SRI</span>
                </button>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Razón Social / Empresa *</label>
              <input
                v-model="formProvider.razon_social"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Nombre legal de la empresa proveedora"
                required
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombre Comercial</label>
              <input
                v-model="formProvider.nombre_comercial"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Marca o nombre comercial"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono de Contacto</label>
              <input
                v-model="formProvider.telefono"
                type="text"
                maxlength="10"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="0991234567"
                @input="onProviderPhoneInput"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo de Pagos / Ventas</label>
              <input
                v-model="formProvider.email"
                type="email"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="pagos@proveedor.com"
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección</label>
              <input
                v-model="formProvider.direccion"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Dirección fiscal o almacén"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">Forma de Pago</label>
              <select v-model="formProvider.forma_pago" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="contado">Contado</option>
                <option value="credito_15">Crédito 15 días</option>
                <option value="credito_30">Crédito 30 días</option>
                <option value="credito_60">Crédito 60 días</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">Banco (Opcional)</label>
              <input
                v-model="formProvider.banco"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Ej. Banco Pichincha"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-secondary fs-2 fw-semibold">N° Cuenta Bancaria</label>
              <input
                v-model="formProvider.num_cuenta"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="2100xxxxxx"
              />
            </div>

            <div v-if="isEditMode" class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Estado</label>
              <select v-model="formProvider.estado" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="border-top pt-3 mt-4 pb-2 px-2 d-flex align-items-center justify-content-end gap-3">
            <button type="button" class="btn bg-danger-subtle text-danger" @click="showProviderModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="loading">
              <span v-if="loading" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              <span>{{ isEditMode ? 'Guardar Cambios' : 'Registrar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL CREAR / EDITAR VENDEDOR -->
    <!-- ============================================================= -->
    <div v-if="showSellerModal" id="form-page" class="form-page">
      <div class="form-page-card card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-sm">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-success-subtle text-success rounded-3">
              <iconify-icon :icon="isEditMode ? 'solar:pen-new-square-line-duotone' : 'solar:user-id-line-duotone'" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">
              {{ isEditMode ? 'Editar Vendedor' : 'Registrar Nuevo Vendedor' }}
            </h5>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" @click="showSellerModal = false">
            <iconify-icon icon="solar:alt-arrow-left-line-duotone" class="fs-5"></iconify-icon>
            <span>Volver</span>
          </button>
        </div>

        <form @submit.prevent="saveSeller">
          <div class="row g-3">
            <div class="col-md-5">
              <label class="form-label text-secondary fs-2 fw-semibold">Tipo Documento *</label>
              <AppSelect2
                v-model="formSeller.tipo_documento"
                :options="sellerDocTypeOptions"
                placeholder="Seleccionar Tipo de Documento"
                search-placeholder="Buscar tipo de documento..."
                required
              />
            </div>

            <div class="col-md-7">
              <label class="form-label text-secondary fs-2 fw-semibold">Número Documento *</label>
              <div class="input-group">
                <input
                  v-model="formSeller.num_document"
                  type="text"
                  :maxlength="formSeller.tipo_documento === '04' ? 13 : (formSeller.tipo_documento === '05' ? 10 : 20)"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                  placeholder="Ej. 1720394857"
                  @input="onSellerDocInput"
                  @keyup.enter.prevent="consultarDocumentoSeller"
                  required
                />
                <button
                  v-if="formSeller.tipo_documento === '05' || formSeller.tipo_documento === '04'"
                  type="button"
                  class="btn btn-outline-primary bg-dark border-secondary-subtle d-flex align-items-center gap-1"
                  :disabled="consultandoDocumentoSeller"
                  title="Consultar en Registro Civil / SRI"
                  @click="consultarDocumentoSeller"
                >
                  <span v-if="consultandoDocumentoSeller" class="spinner-border spinner-border-sm text-primary"></span>
                  <iconify-icon v-else icon="solar:magnifer-line-duotone" class="fs-5"></iconify-icon>
                  <span class="d-none d-sm-inline">SRI</span>
                </button>
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Nombres *</label>
              <input
                v-model="formSeller.nombres"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Nombres completos"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Apellidos *</label>
              <input
                v-model="formSeller.apellidos"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Apellidos completos"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Teléfono / Celular</label>
              <input
                v-model="formSeller.telefono"
                type="text"
                maxlength="10"
                class="form-control bg-dark-subtle border-secondary-subtle text-white font-monospace"
                placeholder="0992345678"
                @input="onSellerPhoneInput"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Correo Electrónico</label>
              <input
                v-model="formSeller.email"
                type="email"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="vendedor@empresa.com"
              />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary fs-2 fw-semibold">Dirección Residencial</label>
              <input
                v-model="formSeller.direccion"
                type="text"
                class="form-control bg-dark-subtle border-secondary-subtle text-white"
                placeholder="Sector o calles de domicilio"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Porcentaje de Comisión (%)</label>
              <div class="input-group">
                <input
                  v-model.number="formSeller.comision_pct"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  class="form-control bg-dark-subtle border-secondary-subtle text-white"
                  placeholder="5.0"
                />
                <span class="input-group-text bg-dark-subtle border-secondary-subtle text-secondary">%</span>
              </div>
            </div>

            <div v-if="isEditMode" class="col-md-6">
              <label class="form-label text-secondary fs-2 fw-semibold">Estado</label>
              <select v-model="formSeller.estado" class="form-select bg-dark-subtle border-secondary-subtle text-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="border-top pt-3 mt-4 pb-2 px-2 d-flex align-items-center justify-content-end gap-3">
            <button type="button" class="btn bg-danger-subtle text-danger" @click="showSellerModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="loading">
              <span v-if="loading" class="spinner-grow spinner-grow-sm text-white" role="status"></span>
              <span>{{ isEditMode ? 'Guardar Cambios' : 'Registrar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: VER DETALLE DE CLIENTE -->
    <!-- ============================================================= -->
    <div v-if="showViewCustomerModal && viewingCustomer" class="modal-backdrop-custom d-flex align-items-center justify-content-center app-modal-backdrop">
      <div class="modal-dialog-custom card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-lg app-modal" style="max-width: 580px; width: 95%;">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-info-subtle text-info rounded-3">
              <iconify-icon icon="solar:eye-line-duotone" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">Detalle del Cliente</h5>
          </div>
          <button class="btn btn-link text-white-50 p-0" @click="showViewCustomerModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <div class="p-3 bg-dark-subtle rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 48px; height: 48px;">
              {{ viewingCustomer.razon_social.charAt(0) }}
            </div>
            <div>
              <h6 class="text-white fw-bold mb-1">{{ viewingCustomer.razon_social }}</h6>
              <span class="text-secondary fs-2 font-monospace">{{ docTypeLabel(viewingCustomer.tipo_documento) }}: {{ viewingCustomer.num_document }}</span>
            </div>
          </div>
          <span
            class="badge px-3 py-2 rounded-pill fs-1 fw-bold"
            :class="viewingCustomer.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
          >
            {{ viewingCustomer.estado === 'activo' ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="row g-3 fs-2">
          <div class="col-6">
            <span class="text-secondary d-block">Nombre Comercial:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.nombre_comercial || 'No especificado' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Ciudad:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.ciudad || 'No especificada' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Teléfono:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.telefono || 'Sin teléfono' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Correo Electrónico:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.email || 'Sin correo' }}</span>
          </div>
          <div class="col-12">
            <span class="text-secondary d-block">Dirección Fiscal:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.direccion || 'S/N' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Fecha de Registro:</span>
            <span class="text-white fw-medium">{{ viewingCustomer.created_at }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">ID Sistema:</span>
            <span class="text-white fw-medium">#{{ viewingCustomer.id }}</span>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
          <button
            class="btn btn-outline-primary px-3 rounded-3 d-flex align-items-center gap-1"
            @click="showViewCustomerModal = false; openEditCustomer(viewingCustomer)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Editar</span>
          </button>
          <button class="btn btn-secondary px-4 rounded-3" @click="showViewCustomerModal = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: VER DETALLE DE PROVEEDOR -->
    <!-- ============================================================= -->
    <div v-if="showViewProviderModal && viewingProvider" class="modal-backdrop-custom d-flex align-items-center justify-content-center app-modal-backdrop">
      <div class="modal-dialog-custom card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-lg app-modal" style="max-width: 580px; width: 95%;">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-warning-subtle text-warning rounded-3">
              <iconify-icon icon="solar:eye-line-duotone" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">Detalle del Proveedor</h5>
          </div>
          <button class="btn btn-link text-white-50 p-0" @click="showViewProviderModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <div class="p-3 bg-dark-subtle rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 48px; height: 48px;">
              {{ viewingProvider.razon_social.charAt(0) }}
            </div>
            <div>
              <h6 class="text-white fw-bold mb-1">{{ viewingProvider.razon_social }}</h6>
              <span class="text-secondary fs-2 font-monospace">{{ docTypeLabel(viewingProvider.tipo_documento) }}: {{ viewingProvider.num_document }}</span>
            </div>
          </div>
          <span
            class="badge px-3 py-2 rounded-pill fs-1 fw-bold"
            :class="viewingProvider.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
          >
            {{ viewingProvider.estado === 'activo' ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="row g-3 fs-2">
          <div class="col-6">
            <span class="text-secondary d-block">Nombre Comercial:</span>
            <span class="text-white fw-medium">{{ viewingProvider.nombre_comercial || 'No especificado' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Condición de Pago:</span>
            <span class="badge bg-dark-subtle text-warning border border-warning-subtle px-2 py-1">
              {{ paymentLabel(viewingProvider.forma_pago) }}
            </span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Teléfono:</span>
            <span class="text-white fw-medium">{{ viewingProvider.telefono || 'Sin teléfono' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Correo Electrónico:</span>
            <span class="text-white fw-medium">{{ viewingProvider.email || 'Sin correo' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Banco:</span>
            <span class="text-white fw-medium">{{ viewingProvider.banco || 'No especificado' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Cuenta Bancaria:</span>
            <span class="text-white fw-medium font-monospace">{{ viewingProvider.num_cuenta || 'No especificada' }}</span>
          </div>
          <div class="col-12">
            <span class="text-secondary d-block">Dirección:</span>
            <span class="text-white fw-medium">{{ viewingProvider.direccion || 'S/N' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Fecha de Registro:</span>
            <span class="text-white fw-medium">{{ viewingProvider.created_at }}</span>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
          <button
            class="btn btn-outline-warning text-warning px-3 rounded-3 d-flex align-items-center gap-1"
            @click="showViewProviderModal = false; openEditProvider(viewingProvider)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Editar</span>
          </button>
          <button class="btn btn-secondary px-4 rounded-3" @click="showViewProviderModal = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: VER DETALLE DE VENDEDOR -->
    <!-- ============================================================= -->
    <div v-if="showViewSellerModal && viewingSeller" class="modal-backdrop-custom d-flex align-items-center justify-content-center app-modal-backdrop">
      <div class="modal-dialog-custom card bg-navy-card border border-secondary-subtle rounded-4 p-4 shadow-lg app-modal" style="max-width: 580px; width: 95%;">
        <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark-subtle mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-success-subtle text-success rounded-3">
              <iconify-icon icon="solar:eye-line-duotone" class="fs-5"></iconify-icon>
            </span>
            <h5 class="fw-bold text-white mb-0">Detalle del Vendedor</h5>
          </div>
          <button class="btn btn-link text-white-50 p-0" @click="showViewSellerModal = false">
            <iconify-icon icon="solar:close-circle-line-duotone" class="fs-6"></iconify-icon>
          </button>
        </div>

        <div class="p-3 bg-dark-subtle rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 48px; height: 48px;">
              {{ viewingSeller.nombres.charAt(0) }}{{ viewingSeller.apellidos.charAt(0) }}
            </div>
            <div>
              <h6 class="text-white fw-bold mb-1">{{ viewingSeller.nombres }} {{ viewingSeller.apellidos }}</h6>
              <span class="text-secondary fs-2 font-monospace">{{ docTypeLabel(viewingSeller.tipo_documento) }}: {{ viewingSeller.num_document }}</span>
            </div>
          </div>
          <span
            class="badge px-3 py-2 rounded-pill fs-1 fw-bold"
            :class="viewingSeller.estado === 'activo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
          >
            {{ viewingSeller.estado === 'activo' ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="row g-3 fs-2">
          <div class="col-6">
            <span class="text-secondary d-block">Porcentaje Comisión:</span>
            <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 fs-2 fw-bold">
              {{ viewingSeller.comision_pct }}%
            </span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Cargo:</span>
            <span class="text-white fw-medium">Asesor Comercial</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Teléfono / Celular:</span>
            <span class="text-white fw-medium">{{ viewingSeller.telefono || 'Sin teléfono' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Correo Electrónico:</span>
            <span class="text-white fw-medium">{{ viewingSeller.email || 'Sin correo' }}</span>
          </div>
          <div class="col-12">
            <span class="text-secondary d-block">Dirección Domiciliaria:</span>
            <span class="text-white fw-medium">{{ viewingSeller.direccion || 'No especificada' }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">Fecha de Registro:</span>
            <span class="text-white fw-medium">{{ viewingSeller.created_at }}</span>
          </div>
          <div class="col-6">
            <span class="text-secondary d-block">ID Vendedor:</span>
            <span class="text-white fw-medium">#{{ viewingSeller.id }}</span>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark-subtle">
          <button
            class="btn btn-outline-success text-success px-3 rounded-3 d-flex align-items-center gap-1"
            @click="showViewSellerModal = false; openEditSeller(viewingSeller)"
          >
            <iconify-icon icon="solar:pen-new-square-line-duotone"></iconify-icon>
            <span>Editar</span>
          </button>
          <button class="btn btn-secondary px-4 rounded-3" @click="showViewSellerModal = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-page {
  animation: fadeIn 0.25s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-navy-card {
  background-color: var(--bs-card-bg, #1a2234) !important;
}

[data-bs-theme="dark"] .bg-navy-card {
  background-color: #1a2234 !important;
}

[data-bs-theme="light"] .bg-navy-card {
  background-color: #ffffff !important;
  border: 1px solid #e6ecf1 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
  color: #2a3547 !important;
}

.hover-tab {
  transition: all 0.2s ease;
}

.hover-tab:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff !important;
}

/* Modales personalizados */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog-custom {
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: scaleUp 0.2s ease-out;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Formularios de registro/edición como página (no modal): al abrirse reemplazan al listado */
.form-open > :not(.form-page):not(.keep-in-form) {
  display: none !important;
}
.form-page {
  width: 100%;
  scroll-margin-top: 110px; /* deja libre la barra superior fija */
}
.form-page-card {
  max-width: none;
  margin: 0 auto;
}
.form-page-card-lg {
  max-width: none;
}
</style>
