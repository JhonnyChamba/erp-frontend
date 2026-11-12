import { api } from './axios'

export interface CompanyFiscal {
  address_matriz?: string
  phone?: string
  email?: string
  obligated_accounting?: boolean
  special_taxpayer?: string
  tax_regime?: string
  sri_environment?: string
  auto_send_sri?: boolean
  default_establishment?: string
  default_emission_point?: string
  cert_file_name?: string
  cert_expires_at?: string
  has_certificate?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_secure?: boolean
  smtp_user?: string
  has_smtp_password?: boolean
  smtp_from_name?: string
  smtp_from_email?: string
}

export interface CompanyItem {
  id: number
  ruc: string
  description: string
  business_name: string
  trade_name: string
  enabled?: boolean
  createdAt?: string
  fiscal?: CompanyFiscal
}

export interface CompanyPayload {
  ruc?: string
  description?: string
  business_name?: string
  trade_name?: string
  enabled?: boolean
  address_matriz?: string
  phone?: string
  email?: string
  obligated_accounting?: boolean
  special_taxpayer?: string
  tax_regime?: string
  sri_environment?: string
  auto_send_sri?: boolean
  default_establishment?: string
  default_emission_point?: string
  cert_p12_base64?: string
  cert_password?: string
  cert_file_name?: string
  cert_expires_at?: string
  remove_certificate?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_secure?: boolean
  smtp_user?: string
  smtp_password?: string
  smtp_from_name?: string
  smtp_from_email?: string
}

export interface UserCompanyRoleItem {
  companyId: number
  roleId?: number | null
  roleName?: string | null
}

export interface UserItem {
  id: number
  num_document: string
  name_user: string
  last_name_user: string
  email: string
  developer?: boolean
  super_admin?: boolean
  multi_company?: boolean
  companyIds?: number[]
  roleId?: number | null
  roleName?: string | null
  companyRoles?: UserCompanyRoleItem[]
  enabled?: boolean
  created_at?: string
  theme_color?: string
  birth_date?: string | null
}

export interface RoleAccessDetail {
  moduleId?: number | null
  subModuleId?: number | null
  hasAccess: boolean
}

export interface RoleItem {
  id: number
  code: string
  description: string
  companyId?: number
  enabled?: boolean
  created_at?: string
  moduleIds?: number[]
  subModuleIds?: number[]
  details?: RoleAccessDetail[]
}

export interface PlanItem {
  id: number
  price: string
  billing_cycle: string
  description: string
  max_users: number
  max_branches: number
  enabled?: boolean
}

export interface SubscriptionItem {
  id: number
  begin_date: string
  end_date: string
  planId: number
  companyId: number
  enabled?: boolean
  moduleIds?: number[]
  subModuleIds?: number[]
}

export interface ModuleItem {
  id: number
  code: string
  desc_icon: string
  description: string
  enabled?: boolean
  createdAt?: string
}

export interface SubModuleItem {
  id: number
  moduleId: number
  code: string
  desc_icon: string
  description: string
  url_desc: string
  enabled?: boolean
  createdAt?: string
}

// EMPRESAS
export const getCompanies = async (params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/company', { params: { page: params.page || 1, limit: params.limit || 20 } })
  return data
}

export const createCompany = async (payload: CompanyPayload & {
  ruc: string
  description: string
  business_name: string
  trade_name: string
}) => {
  const { data } = await api.post('/company/register', payload)
  return data
}

export const updateCompany = async (id: number, payload: CompanyPayload) => {
  const { data } = await api.patch(`/company/${id}`, payload)
  return data
}

// USUARIOS
export const getUsers = async (companyId: number, params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/users', {
    params: { companyId, page: params.page || 1, limit: params.limit || 20 },
  })
  return data
}

export const createUser = async (payload: {
  companyId: number
  num_document: string
  name_user: string
  last_name_user: string
  email: string
  password: string
  developer?: boolean
  super_admin?: boolean
  multi_company?: boolean
  companyIds?: number[]
  roleId?: number | null
  companyRoles?: UserCompanyRoleItem[]
  theme_color?: string
  birth_date?: string | null
}) => {
  const { data } = await api.post('/users', payload)
  return data
}

export const updateUser = async (
  id: number,
  payload: Partial<UserItem> & { password?: string; companyId?: number }
) => {
  const { data } = await api.patch(`/users/${id}`, payload)
  return data
}

// ROLES
export const getRoles = async (companyId: number, params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/roles', {
    params: { companyId, page: params.page || 1, limit: params.limit || 20 },
  })
  return data
}

export const createRole = async (payload: {
  companyId: number
  code?: string
  description: string
  moduleIds?: number[]
  subModuleIds?: number[]
  details?: RoleAccessDetail[]
}) => {
  const { data } = await api.post('/roles', payload)
  return data
}

export const updateRole = async (
  id: number,
  payload: {
    companyId: number
    code?: string
    description?: string
    enabled?: boolean
    moduleIds?: number[]
    subModuleIds?: number[]
    details?: RoleAccessDetail[]
  }
) => {
  const { data } = await api.patch(`/roles/${id}`, payload)
  return data
}

// PLANES
export const getPlans = async (params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/plans', { params: { page: params.page || 1, limit: params.limit || 20 } })
  return data
}

export const createPlan = async (payload: {
  price: string
  billing_cycle: string
  description: string
  max_users: number
  max_branches: number
}) => {
  const { data } = await api.post('/plans/register', payload)
  return data
}

// SUSCRIPCIONES
export const getSubscriptions = async (companyId: number, params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/subscriptions', {
    params: { companyId, page: params.page || 1, limit: params.limit || 20 },
  })
  return data
}

export const createSubscription = async (payload: {
  companyId: number
  planId: number
  begin_date: string
  end_date: string
  moduleIds?: number[]
  subModuleIds?: number[]
}) => {
  const { data } = await api.post('/subscriptions', payload)
  return data
}

export const updateSubscription = async (
  id: number,
  payload: {
    companyId: number
    planId?: number
    begin_date?: string
    end_date?: string
    enabled?: boolean
    moduleIds?: number[]
    subModuleIds?: number[]
  }
) => {
  const { data } = await api.patch(`/subscriptions/${id}`, payload)
  return data
}

// MÓDULOS
export const getModules = async (params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/module', {
    params: { page: params.page || 1, limit: params.limit || 50 },
  })
  return data
}

export const createModule = async (payload: {
  code?: string
  desc_icon: string
  description: string
}) => {
  const { data } = await api.post('/module', payload)
  return data
}

export const updateModule = async (id: number, payload: Partial<ModuleItem>) => {
  const { data } = await api.patch(`/module/${id}`, payload)
  return data
}

// SUBMÓDULOS
export const getSubModules = async (params: { moduleId?: number; page?: number; limit?: number } = {}) => {
  const queryParams: any = { page: params.page || 1, limit: params.limit || 50 }
  if (params.moduleId) {
    queryParams.moduleId = params.moduleId
  }
  try {
    const { data } = await api.get('/subModule', { params: queryParams })
    return data
  } catch (err: any) {
    // Fallback por si el backend local aún no se ha reiniciado y exige moduleId obligatorio
    if (!params.moduleId && err?.response?.status === 400) {
      const modsRes = await getModules({ page: 1, limit: 100 })
      const mods: ModuleItem[] = Array.isArray(modsRes?.data)
        ? modsRes.data
        : Array.isArray(modsRes)
        ? modsRes
        : []
      const allSubs: SubModuleItem[] = []
      await Promise.all(
        mods.map(async (m) => {
          try {
            const { data } = await api.get('/subModule', {
              params: { moduleId: m.id, page: 1, limit: 100 },
            })
            const list: SubModuleItem[] = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
              ? data
              : []
            for (const item of list) {
              allSubs.push({
                ...item,
                moduleId: item.moduleId ?? m.id,
              })
            }
          } catch (_) {}
        })
      )
      allSubs.sort((a, b) => (b.id || 0) - (a.id || 0))
      return { data: allSubs, meta: { total: allSubs.length, page: 1, limit: queryParams.limit } }
    }
    throw err
  }
}

export const createSubModule = async (payload: {
  moduleId: number
  code?: string
  desc_icon: string
  description: string
  url_desc: string
}) => {
  const { data } = await api.post('/subModule', payload)
  return data
}

export const updateSubModule = async (id: number, payload: Partial<SubModuleItem>) => {
  const { data } = await api.patch(`/subModule/${id}`, payload)
  return data
}

// =================== SUCURSALES (ESTABLECIMIENTOS) ===================
export interface BranchItem {
  id: number
  companyId: number
  /** Número de establecimiento SRI (3 dígitos) */
  code: string
  name: string
  /** Dirección del establecimiento (dirEstablecimiento del SRI) */
  address: string
  /** Punto de emisión por defecto (3 dígitos) */
  emissionPoint: string
  phone: string | null
  email: string | null
  isMatrix: boolean
  enabled: boolean
}

export interface BranchPayload {
  code: string
  name: string
  address: string
  emission_point?: string
  phone?: string
  email?: string
  is_matrix?: boolean
  enabled?: boolean
}

const companyHeader = (companyId: number) => ({ headers: { 'x-company-id': String(companyId) } })

export const getBranches = async (companyId: number, params: { onlyEnabled?: boolean } = {}) => {
  const { data } = await api.get('/branchCompany', {
    params: { companyId, page: 1, limit: 100, ...(params.onlyEnabled ? { onlyEnabled: true } : {}) },
    ...companyHeader(companyId),
  })
  return data
}

export const createBranch = async (companyId: number, payload: BranchPayload) => {
  const { data } = await api.post('/branchCompany', { companyId, emission_point: '001', ...payload }, companyHeader(companyId))
  return data
}

export const updateBranch = async (companyId: number, id: number, payload: Partial<BranchPayload>) => {
  const { data } = await api.patch(`/branchCompany/${id}`, { companyId, ...payload }, companyHeader(companyId))
  return data
}

/** Define la matriz de la empresa: la anterior deja de serlo (una empresa solo puede tener una). */
export const setMainBranch = async (companyId: number, id: number) => {
  const { data } = await api.patch(`/branchCompany/${id}/set-matrix`, {}, companyHeader(companyId))
  return data
}

export const deleteBranch = async (companyId: number, id: number) => {
  const { data } = await api.delete(`/branchCompany/${id}`, companyHeader(companyId))
  return data
}

export interface CertInspectionResult {
  valid: boolean
  expires_at: string
  issued_at: string
  subject_name: string
  issuer_name: string
  is_expired: boolean
}

export const inspectCompanyCert = async (
  companyId?: number | null,
  payload?: { cert_p12_base64?: string; cert_password?: string }
): Promise<CertInspectionResult> => {
  const url = companyId ? `/company/${companyId}/inspect-cert` : '/company/inspect-cert'
  const { data } = await api.post(url, payload || {})
  return data
}

