export interface CustomerItem {
  id: number
  company_id: number
  tipo_documento: '04' | '05' | '06' | '07' // 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final
  num_document: string
  razon_social: string
  nombre_comercial?: string
  email: string
  telefono: string
  direccion: string
  ciudad?: string
  estado: 'activo' | 'inactivo'
  created_at: string
}

export interface ProviderItem {
  id: number
  company_id: number
  tipo_documento: '04' | '05' | '06' // 04=RUC, 05=Cédula, 06=Pasaporte
  num_document: string
  razon_social: string
  nombre_comercial?: string
  email: string
  telefono: string
  direccion: string
  forma_pago: 'contado' | 'credito_15' | 'credito_30' | 'credito_60' | 'transferencia'
  banco?: string
  num_cuenta?: string
  estado: 'activo' | 'inactivo'
  created_at: string
}

export interface SellerItem {
  id: number
  company_id: number
  tipo_documento: '05' | '04' | '06' // 05=Cédula, 04=RUC, 06=Pasaporte
  num_document: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  direccion?: string
  comision_pct: number
  estado: 'activo' | 'inactivo'
  created_at: string
}

// Semillas iniciales realistas para demostración y migración
const SEED_CUSTOMERS: CustomerItem[] = [
  {
    id: 1,
    company_id: 1,
    tipo_documento: '04',
    num_document: '1792345678001',
    razon_social: 'CORPORACION FAVORITA C.A.',
    nombre_comercial: 'Supermaxi / Megamaxi',
    email: 'facturacion@cfavorita.ec',
    telefono: '022998800',
    direccion: 'Av. General Enríquez km 2.5, Vía Cotogchoa',
    ciudad: 'Quito',
    estado: 'activo',
    created_at: '2026-01-15',
  },
  {
    id: 2,
    company_id: 1,
    tipo_documento: '05',
    num_document: '1718293847',
    razon_social: 'Carlos Eduardo Mendoza Paz',
    nombre_comercial: 'Distribuidora Mendoza',
    email: 'carlos.mendoza@gmail.com',
    telefono: '0998765432',
    direccion: 'Av. 10 de Agosto N24-112 y Colón',
    ciudad: 'Quito',
    estado: 'activo',
    created_at: '2026-02-10',
  },
  {
    id: 3,
    company_id: 1,
    tipo_documento: '05',
    num_document: '0928374651',
    razon_social: 'María Fernanda Gómez Alarcón',
    nombre_comercial: 'Boutique Glamour',
    email: 'mafer.gomez@hotmail.com',
    telefono: '0984512398',
    direccion: 'Av. 9 de Octubre 415 y Chile',
    ciudad: 'Guayaquil',
    estado: 'activo',
    created_at: '2026-03-01',
  },
  {
    id: 4,
    company_id: 1,
    tipo_documento: '07',
    num_document: '9999999999999',
    razon_social: 'CONSUMIDOR FINAL',
    nombre_comercial: 'Venta Mostrador',
    email: 'consumidorfinal@deskounta.ec',
    telefono: '999999999',
    direccion: 'S/N',
    ciudad: 'Quito',
    estado: 'activo',
    created_at: '2026-01-01',
  },
  {
    id: 5,
    company_id: 1,
    tipo_documento: '04',
    num_document: '1790016919001',
    razon_social: 'IMPORTADORA TOMEBAMBA S.A.',
    nombre_comercial: 'Tomebamba Autos',
    email: 'cobranzas@tomebamba.com.ec',
    telefono: '072840000',
    direccion: 'Av. España y Huayna Cápac',
    ciudad: 'Cuenca',
    estado: 'inactivo',
    created_at: '2026-02-18',
  },
]

const SEED_PROVIDERS: ProviderItem[] = [
  {
    id: 1,
    company_id: 1,
    tipo_documento: '04',
    num_document: '1790013820001',
    razon_social: 'PRONACA PROCESADORA NACIONAL DE ALIMENTOS C.A.',
    nombre_comercial: 'PRONACA',
    email: 'proveedores@pronaca.com',
    telefono: '023971000',
    direccion: 'Av. Los Conquistadores y Ninahualpa',
    forma_pago: 'credito_30',
    banco: 'Banco Pichincha',
    num_cuenta: '2100456789',
    estado: 'activo',
    created_at: '2026-01-10',
  },
  {
    id: 2,
    company_id: 1,
    tipo_documento: '04',
    num_document: '0990004199001',
    razon_social: 'HOLCIM ECUADOR S.A.',
    nombre_comercial: 'Holcim Cemento',
    email: 'contacto.ec@holcim.com',
    telefono: '043700000',
    direccion: 'Av. Barcelona y calle San Jorge',
    forma_pago: 'credito_60',
    banco: 'Banco de Guayaquil',
    num_cuenta: '0015948372',
    estado: 'activo',
    created_at: '2026-02-05',
  },
  {
    id: 3,
    company_id: 1,
    tipo_documento: '04',
    num_document: '1791256115001',
    razon_social: 'TECNOLOGIA Y SUMINISTROS DIGITEC C. LTDA.',
    nombre_comercial: 'Digitec Ecuador',
    email: 'ventas@digitec.com.ec',
    telefono: '022445566',
    direccion: 'Av. Amazonas N34-210 y República',
    forma_pago: 'transferencia',
    banco: 'Banco Internacional',
    num_cuenta: '0800341299',
    estado: 'activo',
    created_at: '2026-02-22',
  },
  {
    id: 4,
    company_id: 1,
    tipo_documento: '05',
    num_document: '1714529814',
    razon_social: 'Juan Carlos Morales Vega',
    nombre_comercial: 'Servicios Logísticos Morales',
    email: 'jcmorales@logistica.com',
    telefono: '0991234567',
    direccion: 'Panamericana Norte Km 11',
    forma_pago: 'contado',
    banco: 'Banco del Pacífico',
    num_cuenta: '1048291048',
    estado: 'inactivo',
    created_at: '2026-01-28',
  },
]

const SEED_SELLERS: SellerItem[] = [
  {
    id: 1,
    company_id: 1,
    tipo_documento: '05',
    num_document: '1720394857',
    nombres: 'Andrés Marcelo',
    apellidos: 'Vásquez Ortega',
    email: 'andres.vasquez@empresa.com',
    telefono: '0992345678',
    direccion: 'Av. América y Rumipamba',
    comision_pct: 5.0,
    estado: 'activo',
    created_at: '2026-01-12',
  },
  {
    id: 2,
    company_id: 1,
    tipo_documento: '05',
    num_document: '1719283746',
    nombres: 'Gabriela Estefanía',
    apellidos: 'Salazar Castro',
    email: 'gabriela.salazar@empresa.com',
    telefono: '0987654321',
    direccion: 'Av. Eloy Alfaro y Shyris',
    comision_pct: 4.5,
    estado: 'activo',
    created_at: '2026-01-20',
  },
  {
    id: 3,
    company_id: 1,
    tipo_documento: '05',
    num_document: '0918273645',
    nombres: 'Roberto Javier',
    apellidos: 'Paredes Muñoz',
    email: 'roberto.paredes@empresa.com',
    telefono: '0995544332',
    direccion: 'Urdesa Central, Calle 3ra',
    comision_pct: 3.0,
    estado: 'inactivo',
    created_at: '2026-02-14',
  },
]

// Helpers de almacenamiento local
const getKey = (entity: string, companyId: number = 1) => `contacts_${entity}_${companyId}`

const getStorageList = <T>(key: string, seed: T[]): T[] => {
  const stored = localStorage.getItem(key)
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  try {
    return JSON.parse(stored)
  } catch {
    return seed
  }
}

const saveStorageList = <T>(key: string, list: T[]): void => {
  localStorage.setItem(key, JSON.stringify(list))
}

// ==========================================
// SERVICIOS DE CLIENTES (CUSTOMERS)
// ==========================================
export const getCustomers = async (companyId: number = 1): Promise<CustomerItem[]> => {
  const key = getKey('customers', companyId)
  return getStorageList<CustomerItem>(key, SEED_CUSTOMERS)
}

export const getCustomerById = async (id: number, companyId: number = 1): Promise<CustomerItem | undefined> => {
  const list = await getCustomers(companyId)
  return list.find((c) => c.id === id)
}

export const createCustomer = async (
  data: Omit<CustomerItem, 'id' | 'created_at'>,
  companyId: number = 1
): Promise<CustomerItem> => {
  const list = await getCustomers(companyId)
  const newId = list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1
  const today = new Date().toISOString().slice(0, 10)

  const newCustomer: CustomerItem = {
    ...data,
    id: newId,
    company_id: companyId,
    created_at: today,
  }

  list.unshift(newCustomer)
  saveStorageList(getKey('customers', companyId), list)
  return newCustomer
}

export const updateCustomer = async (
  id: number,
  data: Partial<CustomerItem>,
  companyId: number = 1
): Promise<CustomerItem> => {
  const list = await getCustomers(companyId)
  const index = list.findIndex((c) => c.id === id)
  if (index === -1) throw new Error('Cliente no encontrado')
  const existing = list[index]
  if (!existing) throw new Error('Cliente no encontrado')

  const updated: CustomerItem = {
    ...existing,
    ...data,
    id: existing.id,
    company_id: existing.company_id,
    created_at: existing.created_at,
  }
  list[index] = updated
  saveStorageList(getKey('customers', companyId), list)
  return updated
}

export const toggleCustomerStatus = async (id: number, companyId: number = 1): Promise<CustomerItem> => {
  const list = await getCustomers(companyId)
  const customer = list.find((c) => c.id === id)
  if (!customer) throw new Error('Cliente no encontrado')

  customer.estado = customer.estado === 'activo' ? 'inactivo' : 'activo'
  saveStorageList(getKey('customers', companyId), list)
  return customer
}

export const deleteCustomer = async (id: number, companyId: number = 1): Promise<boolean> => {
  let list = await getCustomers(companyId)
  list = list.filter((c) => c.id !== id)
  saveStorageList(getKey('customers', companyId), list)
  return true
}

// ==========================================
// SERVICIOS DE PROVEEDORES (PROVIDERS)
// ==========================================
export const getProviders = async (companyId: number = 1): Promise<ProviderItem[]> => {
  const key = getKey('providers', companyId)
  return getStorageList<ProviderItem>(key, SEED_PROVIDERS)
}

export const getProviderById = async (id: number, companyId: number = 1): Promise<ProviderItem | undefined> => {
  const list = await getProviders(companyId)
  return list.find((p) => p.id === id)
}

export const createProvider = async (
  data: Omit<ProviderItem, 'id' | 'created_at'>,
  companyId: number = 1
): Promise<ProviderItem> => {
  const list = await getProviders(companyId)
  const newId = list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1
  const today = new Date().toISOString().slice(0, 10)

  const newProvider: ProviderItem = {
    ...data,
    id: newId,
    company_id: companyId,
    created_at: today,
  }

  list.unshift(newProvider)
  saveStorageList(getKey('providers', companyId), list)
  return newProvider
}

export const updateProvider = async (
  id: number,
  data: Partial<ProviderItem>,
  companyId: number = 1
): Promise<ProviderItem> => {
  const list = await getProviders(companyId)
  const index = list.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('Proveedor no encontrado')
  const existing = list[index]
  if (!existing) throw new Error('Proveedor no encontrado')

  const updated: ProviderItem = {
    ...existing,
    ...data,
    id: existing.id,
    company_id: existing.company_id,
    created_at: existing.created_at,
  }
  list[index] = updated
  saveStorageList(getKey('providers', companyId), list)
  return updated
}

export const toggleProviderStatus = async (id: number, companyId: number = 1): Promise<ProviderItem> => {
  const list = await getProviders(companyId)
  const provider = list.find((p) => p.id === id)
  if (!provider) throw new Error('Proveedor no encontrado')

  provider.estado = provider.estado === 'activo' ? 'inactivo' : 'activo'
  saveStorageList(getKey('providers', companyId), list)
  return provider
}

export const deleteProvider = async (id: number, companyId: number = 1): Promise<boolean> => {
  let list = await getProviders(companyId)
  list = list.filter((p) => p.id !== id)
  saveStorageList(getKey('providers', companyId), list)
  return true
}

// ==========================================
// SERVICIOS DE VENDEDORES (SELLERS)
// ==========================================
export const getSellers = async (companyId: number = 1): Promise<SellerItem[]> => {
  const key = getKey('sellers', companyId)
  return getStorageList<SellerItem>(key, SEED_SELLERS)
}

export const getSellerById = async (id: number, companyId: number = 1): Promise<SellerItem | undefined> => {
  const list = await getSellers(companyId)
  return list.find((s) => s.id === id)
}

export const createSeller = async (
  data: Omit<SellerItem, 'id' | 'created_at'>,
  companyId: number = 1
): Promise<SellerItem> => {
  const list = await getSellers(companyId)
  const newId = list.length > 0 ? Math.max(...list.map((s) => s.id)) + 1 : 1
  const today = new Date().toISOString().slice(0, 10)

  const newSeller: SellerItem = {
    ...data,
    id: newId,
    company_id: companyId,
    created_at: today,
  }

  list.unshift(newSeller)
  saveStorageList(getKey('sellers', companyId), list)
  return newSeller
}

export const updateSeller = async (
  id: number,
  data: Partial<SellerItem>,
  companyId: number = 1
): Promise<SellerItem> => {
  const list = await getSellers(companyId)
  const index = list.findIndex((s) => s.id === id)
  if (index === -1) throw new Error('Vendedor no encontrado')
  const existing = list[index]
  if (!existing) throw new Error('Vendedor no encontrado')

  const updated: SellerItem = {
    ...existing,
    ...data,
    id: existing.id,
    company_id: existing.company_id,
    created_at: existing.created_at,
  }
  list[index] = updated
  saveStorageList(getKey('sellers', companyId), list)
  return updated
}

export const toggleSellerStatus = async (id: number, companyId: number = 1): Promise<SellerItem> => {
  const list = await getSellers(companyId)
  const seller = list.find((s) => s.id === id)
  if (!seller) throw new Error('Vendedor no encontrado')

  seller.estado = seller.estado === 'activo' ? 'inactivo' : 'activo'
  saveStorageList(getKey('sellers', companyId), list)
  return seller
}

export const deleteSeller = async (id: number, companyId: number = 1): Promise<boolean> => {
  let list = await getSellers(companyId)
  list = list.filter((s) => s.id !== id)
  saveStorageList(getKey('sellers', companyId), list)
  return true
}
