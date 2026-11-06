import { api } from './axios'

export interface CompanyItem {
  id: number
  ruc: string
  description: string
  business_name: string
  trade_name: string
  enabled?: boolean
  createdAt?: string
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
  enabled?: boolean
  created_at?: string
  theme_color?: string
}

export interface RoleItem {
  id: number
  code: string
  description: string
  companyId?: number
  enabled?: boolean
  created_at?: string
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

export const createCompany = async (payload: {
  ruc: string
  description: string
  business_name: string
  trade_name: string
}) => {
  const { data } = await api.post('/company/register', payload)
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
  theme_color?: string
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
  code: string
  description: string
}) => {
  const { data } = await api.post('/roles', payload)
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
  code: string
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
  const { data } = await api.get('/subModule', { params: queryParams })
  return data
}

export const createSubModule = async (payload: {
  moduleId: number
  code: string
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
