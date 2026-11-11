import { api } from '@/services/axios'

export interface InventoryArticle {
  id: number
  companyId: number
  code: string
  sku: string
  name: string
  categoryId?: number | null
  category_id?: number | null
  category: string
  unit: string
  costPrice: number
  salePrice: number
  taxRate: number
  stockCurrent: number
  stockMin: number
  warehouseId?: number | null
  warehouse_id?: number | null
  location: string
  description: string
  status: boolean
}

export interface InventoryCategory {
  id: number
  companyId?: number
  code: string
  name: string
  categoryType?: 'PRODUCT' | 'SERVICE' | 'LABOR' | 'ALL' | string
  category_type?: 'PRODUCT' | 'SERVICE' | 'LABOR' | 'ALL' | string
  description?: string
  enabled?: boolean
  status?: boolean
  ind_active?: boolean
  created_at?: string
}

export interface InventoryWarehouse {
  id: number
  companyId?: number
  code: string
  name: string
  address?: string
  responsible?: string
  phone?: string
  branchId?: number
  branch_id?: number
  isDefault?: boolean
  is_default?: boolean
  enabled?: boolean
  status?: boolean
  ind_active?: boolean
  created_at?: string
}

export interface InventoryServiceItem {
  id: number
  companyId: number
  code: string
  name: string
  category: string
  unit: string
  costPrice: number
  salePrice: number
  taxRate: number
  estimatedDuration: string
  description: string
  status: boolean
}

export interface InventorySubcontractItem {
  id: number
  companyId: number
  code: string
  name: string
  specialty: string
  contractorName: string
  contractorTaxId: string
  unit: string
  unitCost: number
  suggestedPrice: number
  includesMaterials: boolean
  taxRate: number
  description: string
  status: boolean
}

// 1. ÍTEMS / ARTÍCULOS
export const getInventoryItems = async (companyId?: number): Promise<InventoryArticle[]> => {
  const { data } = await api.get('/inventory/items', {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createInventoryItem = async (payload: Partial<InventoryArticle>): Promise<InventoryArticle> => {
  const { data } = await api.post('/inventory/items', payload)
  return data
}

export const updateInventoryItem = async (id: number, payload: Partial<InventoryArticle>): Promise<InventoryArticle> => {
  const { data } = await api.patch(`/inventory/items/${id}`, payload)
  return data
}

export const deleteInventoryItem = async (id: number, companyId?: number) => {
  const { data } = await api.delete(`/inventory/items/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

// 2. SERVICIOS
export const getInventoryServices = async (companyId?: number): Promise<InventoryServiceItem[]> => {
  const { data } = await api.get('/inventory/services', {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createInventoryService = async (payload: Partial<InventoryServiceItem>): Promise<InventoryServiceItem> => {
  const { data } = await api.post('/inventory/services', payload)
  return data
}

export const updateInventoryService = async (id: number, payload: Partial<InventoryServiceItem>): Promise<InventoryServiceItem> => {
  const { data } = await api.patch(`/inventory/services/${id}`, payload)
  return data
}

export const deleteInventoryService = async (id: number, companyId?: number) => {
  const { data } = await api.delete(`/inventory/services/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

// 3. SERVICIOS DE SUBCONTRATACIÓN O MANO DE OBRA
export const getInventorySubcontracts = async (companyId?: number): Promise<InventorySubcontractItem[]> => {
  const { data } = await api.get('/inventory/subcontracts', {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createInventorySubcontract = async (payload: Partial<InventorySubcontractItem>): Promise<InventorySubcontractItem> => {
  const { data } = await api.post('/inventory/subcontracts', payload)
  return data
}

export const updateInventorySubcontract = async (id: number, payload: Partial<InventorySubcontractItem>): Promise<InventorySubcontractItem> => {
  const { data } = await api.patch(`/inventory/subcontracts/${id}`, payload)
  return data
}

export const deleteInventorySubcontract = async (id: number, companyId?: number) => {
  const { data } = await api.delete(`/inventory/subcontracts/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

// 4. CATEGORÍAS DE INVENTARIO
export const getInventoryCategories = async (companyId?: number, type?: string): Promise<InventoryCategory[]> => {
  const { data } = await api.get('/inventory/categories', {
    params: {
      ...(companyId ? { companyId } : {}),
      ...(type ? { type } : {})
    }
  })
  return data
}

export const createInventoryCategory = async (payload: Partial<InventoryCategory>): Promise<InventoryCategory> => {
  const { data } = await api.post('/inventory/categories', payload)
  return data
}

export const updateInventoryCategory = async (id: number, payload: Partial<InventoryCategory>): Promise<InventoryCategory> => {
  const { data } = await api.patch(`/inventory/categories/${id}`, payload)
  return data
}

export const deleteInventoryCategory = async (id: number, companyId?: number) => {
  const { data } = await api.delete(`/inventory/categories/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

// 5. BODEGAS / ALMACENES
export const getInventoryWarehouses = async (companyId?: number): Promise<InventoryWarehouse[]> => {
  const { data } = await api.get('/inventory/warehouses', {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createInventoryWarehouse = async (payload: Partial<InventoryWarehouse>): Promise<InventoryWarehouse> => {
  const { data } = await api.post('/inventory/warehouses', payload)
  return data
}

export const updateInventoryWarehouse = async (id: number, payload: Partial<InventoryWarehouse>): Promise<InventoryWarehouse> => {
  const { data } = await api.patch(`/inventory/warehouses/${id}`, payload)
  return data
}

export const deleteInventoryWarehouse = async (id: number, companyId?: number) => {
  const { data } = await api.delete(`/inventory/warehouses/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

// ============================================================================
// 6. CATÁLOGO ÚNICO Y MOTOR DE INVENTARIO (UNIFIED ITEMS, KARDEX & SALDOS)
// ============================================================================

export interface UnifiedItem {
  id: number
  companyId: number
  code: string
  sku?: string
  name: string
  description?: string
  itemType: 'PRODUCT' | 'SERVICE' | 'LABOR'
  item_type: 'PRODUCT' | 'SERVICE' | 'LABOR'
  categoryId?: number | null
  product_category_id?: number | null
  categoryName?: string
  category?: string
  unitMeasure?: string
  unit_measure?: string
  unit?: string
  salePrice: number
  sale_price: number
  purchasePrice: number
  purchase_price: number
  taxRate: number
  tax_rate: number
  stockCurrent?: number
  stock_current?: number
  reservedStock?: number
  availableStock?: number
  indActive?: boolean
  status: boolean
  enabled: boolean
  created_at?: string
}

export interface InventoryKardexMovement {
  id: number
  date: string
  warehouseId: number
  warehouseName: string
  productId: number
  productCode: string
  productName: string
  type: 'IN' | 'OUT'
  reason: string
  quantity: number
  unitCost: number
  totalCost: number
  stockAfter: number
  originDocument?: string
  originName?: string
  groupId?: string
  reversalOfId?: number
}

export interface InventoryTransferPayload {
  companyId?: number
  from_warehouse_id: number
  to_warehouse_id: number
  product_id: number
  quantity: number
  notes?: string
}

export interface InventoryAdjustmentPayload {
  companyId?: number
  warehouse_id: number
  product_id: number
  new_stock: number
  reason: string
  unit_cost?: number
}

export const getUnifiedItems = async (
  companyId?: number,
  filters?: { type?: string; categoryId?: number; search?: string; status?: boolean }
): Promise<UnifiedItem[]> => {
  const { data } = await api.get('/inventory/unified-items', {
    params: { companyId, ...filters }
  })
  return data
}

export const getUnifiedItemById = async (id: number, companyId?: number): Promise<UnifiedItem> => {
  const { data } = await api.get(`/inventory/unified-items/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const createUnifiedItem = async (
  payload: Partial<UnifiedItem> & { initial_stock?: number; warehouse_id?: number }
): Promise<UnifiedItem> => {
  const { data } = await api.post('/inventory/unified-items', payload)
  return data
}

export const updateUnifiedItem = async (id: number, payload: Partial<UnifiedItem>): Promise<UnifiedItem> => {
  const { data } = await api.patch(`/inventory/unified-items/${id}`, payload)
  return data
}

export const deleteUnifiedItem = async (id: number, companyId?: number) => {
  const { data } = await api.delete(`/inventory/unified-items/${id}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const getProductStock = async (productId: number, companyId?: number) => {
  const { data } = await api.get(`/inventory/stock/${productId}`, {
    params: companyId ? { companyId } : {}
  })
  return data
}

export const getWarehouseStock = async (warehouseId: number, companyId?: number, productId?: number) => {
  const { data } = await api.get(`/inventory/stock/warehouse/${warehouseId}`, {
    params: { companyId, productId }
  })
  return data
}

export const getInventoryKardex = async (
  productId?: number,
  companyId?: number,
  warehouseId?: number,
  fromDate?: string,
  toDate?: string
): Promise<InventoryKardexMovement[]> => {
  const url = productId ? `/inventory/kardex/${productId}` : '/inventory/kardex'
  const { data } = await api.get(url, {
    params: { companyId, productId, warehouseId, fromDate, toDate }
  })
  return data
}

export const createInventoryTransfer = async (payload: InventoryTransferPayload) => {
  const { data } = await api.post('/inventory/transfers', payload)
  return data
}

export const createInventoryAdjustment = async (payload: InventoryAdjustmentPayload) => {
  const { data } = await api.post('/inventory/adjustments', payload)
  return data
}

export const reverseInventoryMovement = async (movementId: number, companyId?: number, reason?: string) => {
  const { data } = await api.post(`/inventory/movements/${movementId}/reverse`, { reason }, {
    params: companyId ? { companyId } : {}
  })
  return data
}
