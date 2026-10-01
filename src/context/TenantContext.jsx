import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from './AuthContext'

export const SAMPLE_AUTO_PARTS = [
  { id: 'sp-001', code: 'SP-001', name: '12 KG GAS nok', category: 'Gas Cylinders', unit: 'Kg', costPrice: 2950, sellingPrice: 3500, sellingPriceRange: '3500', minStockThreshold: 2, defaultCommissionRate: 5 },
  { id: 'sp-002', code: 'SP-002', name: '12 KG GAS giyon', category: 'Gas Cylinders', unit: 'Kg', costPrice: 3300, sellingPrice: 3500, sellingPriceRange: '3500-3700', minStockThreshold: 2, defaultCommissionRate: 5 },
  { id: 'sp-003', code: 'SP-003', name: '6 KG GAS', category: 'Gas Cylinders', unit: 'Kg', costPrice: 1300, sellingPrice: 1800, sellingPriceRange: '1800-2000', minStockThreshold: 2, defaultCommissionRate: 5 },
  { id: 'sp-004', code: 'SP-004', name: '15kg Gas Cylinder', category: 'Gas Cylinders', unit: 'Kg', costPrice: 4000, sellingPrice: 4500, sellingPriceRange: '4500-5000', minStockThreshold: 2, defaultCommissionRate: 5 },
  { id: 'sp-005', code: 'SP-005', name: '22 KG GAS', category: 'Gas Cylinders', unit: 'Kg', costPrice: 5500, sellingPrice: 6500, sellingPriceRange: '6500-7000', minStockThreshold: 1, defaultCommissionRate: 5 },
  { id: 'sp-006', code: 'SP-006', name: '64010 Fuel filter rinken', category: 'Filters', unit: 'Piece', costPrice: 400, sellingPrice: 500, sellingPriceRange: '500-600', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-007', code: 'SP-007', name: 'FLANja lokal DX', category: 'Filters', unit: 'Piece', costPrice: 1800, sellingPrice: 2500, sellingPriceRange: '2500-2800', minStockThreshold: 6, defaultCommissionRate: 5 },
  { id: 'sp-008', code: 'SP-008', name: 'ISUZU fuel filter', category: 'Filters', unit: 'Piece', costPrice: 400, sellingPrice: 600, sellingPriceRange: '600-750', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-009', code: 'SP-009', name: 'Coolant 1L', category: 'Coolants & Fluids', unit: 'L', costPrice: 350, sellingPrice: 500, sellingPriceRange: '500-600', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-010', code: 'SP-010', name: 'Coolant 4L', category: 'Coolants & Fluids', unit: 'L', costPrice: 1100, sellingPrice: 1200, sellingPriceRange: '1200-1800', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-011', code: 'SP-011', name: 'OSCAR BREAK FLUD', category: 'Brake Fluids', unit: 'Piece', costPrice: 150, sellingPrice: 300, sellingPriceRange: '300-400', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-012', code: 'SP-012', name: 'Asmico break fluid 1/2', category: 'Brake Fluids', unit: 'Piece', costPrice: 450, sellingPrice: 500, sellingPriceRange: '500-700', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-016', code: 'SP-016', name: 'SDK 30002 oil filter', category: 'Oil Filters', unit: 'Piece', costPrice: 350, sellingPrice: 500, sellingPriceRange: '500-650', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-030', code: 'SP-030', name: 'Rubia 1L', category: 'Engine Oils (1L)', unit: 'L', costPrice: 1100, sellingPrice: 1200, sellingPriceRange: '1200-1500', minStockThreshold: 5, defaultCommissionRate: 5 },
  { id: 'sp-035', code: 'SP-035', name: 'Delo 4L', category: 'Engine Oils (4L)', unit: 'L', costPrice: 5000, sellingPrice: 5500, sellingPriceRange: '5500-6000', minStockThreshold: 3, defaultCommissionRate: 5 },
]

export const SAMPLE_WH_STOCK = {
  'sp-001': 76,
  'sp-002': 149,
  'sp-003': 30,
  'sp-004': 38,
  'sp-005': 25,
  'sp-006': 40,
  'sp-007': 18,
  'sp-008': 35,
  'sp-009': 50,
  'sp-010': 28,
  'sp-011': 60,
  'sp-012': 30,
  'sp-016': 80,
  'sp-030': 24,
  'sp-035': 16,
}

export const SAMPLE_STORE_STOCK = {
  'sp-001': 20,
  'sp-002': 23,
  'sp-003': 9,
  'sp-004': 6,
  'sp-005': 10,
  'sp-006': 5,
  'sp-007': 6,
  'sp-008': 7,
  'sp-009': 11,
  'sp-010': 12,
  'sp-011': 22,
  'sp-012': 10,
  'sp-016': 40,
  'sp-030': 8,
  'sp-035': 4,
}

export const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const { currentUser, convexUser, authLoading } = useAuth()
  const clientId = convexUser?.clientId

  // Realtime Convex Queries
  const inventoryData = useQuery(
    api.inventory.getInventory,
    clientId ? { clientId } : 'skip'
  )

  const salesData = useQuery(
    api.sales.getSales,
    clientId ? { clientId } : 'skip'
  )

  const staffData = useQuery(
    api.users.getStaff,
    clientId ? { clientId } : 'skip'
  )

  const auditLogsData = useQuery(
    api.audit.getAuditLogs,
    clientId ? { clientId } : 'skip'
  )

  // Realtime Convex Mutations
  const createProductMutation = useMutation(api.inventory.createProduct)
  const updateProductMutation = useMutation(api.inventory.updateProduct)
  const deleteProductMutation = useMutation(api.inventory.deleteProduct)
  const transferStockMutation = useMutation(api.inventory.transferStock)
  const recordWarehouseInboundMutation = useMutation(api.inventory.recordWarehouseInbound)
  const recordDirectPurchaseMutation = useMutation(api.inventory.recordDirectPurchase)
  const recordSaleMutation = useMutation(api.sales.recordSale)
  const settleCreditSaleMutation = useMutation(api.sales.settleCreditSale)
  const approveStaffMutation = useMutation(api.users.approveStaff)
  const rejectStaffMutation = useMutation(api.users.rejectStaff)
  const deleteStaffMutation = useMutation(api.users.deleteStaff)
  const updateBusinessNameMutation = useMutation(api.users.updateBusinessName)
  const logActionMutation = useMutation(api.audit.logAction)
  const overrideStockMutation = useMutation(api.inventory.overrideStock)
  const addStoreMutation = useMutation(api.inventory.addStore)
  const deleteStoreMutation = useMutation(api.inventory.deleteStore)
  const seedSampleInventoryMutation = useMutation(api.inventory.seedSampleInventory)
  const normalizeLocationNamesMutation = useMutation(api.inventory.normalizeLocationNames)
  const clearOrganizationDataMutation = useMutation(api.users.clearOrganizationData)
  const wipeClientAndResetMutation = useMutation(api.users.wipeClientAndReset)
  const wipeEntireDatabaseMutation = useMutation(api.users.wipeEntireDatabase)
  const deleteUserAccountMutation = useMutation(api.users.deleteUserAccount)

  // Auto-normalize location names (e.g. Central Distribution Hub -> Warehouse, Retail Store #1 -> Store 1)
  useEffect(() => {
    if (clientId) {
      normalizeLocationNamesMutation({ clientId }).catch(() => {})
    }
  }, [clientId, normalizeLocationNamesMutation])

  // Quick switch / session state inside active organization
  const [activeStaffUser, setActiveStaffUser] = useState(null)
  const [isPasscodeLocked, setIsPasscodeLocked] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  // Format products with compatibility id field
  const products = useMemo(() => {
    if (!inventoryData?.products) {
      return []
    }
    return inventoryData.products.map((p) => ({
      ...p,
      id: p._id,
    }))
  }, [inventoryData?.products])

  // Format warehouses with compatibility id field
  const warehouses = useMemo(() => {
    if (!inventoryData?.warehouses) {
      return []
    }
    return inventoryData.warehouses.map((w) => ({
      ...w,
      id: w._id,
      stock: w.stock || {},
    }))
  }, [inventoryData?.warehouses])

  // Format stores with compatibility id field
  const stores = useMemo(() => {
    if (!inventoryData?.stores) {
      return []
    }
    return inventoryData.stores.map((s) => ({
      ...s,
      id: s._id,
      stock: s.stock || {},
    }))
  }, [inventoryData?.stores])

  // Format sales history with complete customer debt fields
  const sales = useMemo(() => {
    if (!salesData) return []
    return salesData.map((s) => ({
      ...s,
      id: s._id,
      invoiceNumber: s.receiptNumber,
      totalAmount: s.total,
      commissionTotal: s.commission ?? 0,
      salespersonName: s.staffName,
      salespersonId: s.staffId,
      storeName: s.storeName || 'Main Store',
      customerName: s.customerName || 'Walk-in Customer',
      customerPhone: s.customerPhone || '',
      timestamp: s.createdAt,
    }))
  }, [salesData])

  // Format staff list
  const staff = useMemo(() => {
    if (!staffData) return []
    return staffData.map((st) => ({
      ...st,
      id: st._id,
      active: st.status === 'approved',
      passcode: '1234',
    }))
  }, [staffData])

  // Format audit trail logs
  const auditLogs = useMemo(() => {
    if (!auditLogsData) return []
    return auditLogsData.map((l) => ({
      ...l,
      id: l._id,
    }))
  }, [auditLogsData])

  // Active Organization Details
  const activeOrg = useMemo(() => {
    if (!convexUser?.client) return null
    return {
      ...convexUser.client,
      id: convexUser.client._id,
      businessName: convexUser.client.name,
      name: convexUser.client.name,
      companyCode: convexUser.client.companyCode,
    }
  }, [convexUser?.client])

  const organizations = useMemo(() => (activeOrg ? [activeOrg] : []), [activeOrg])
  const companyCode = activeOrg?.companyCode || ''
  const tenantName = activeOrg?.name || 'OMESTOCK'

  const loading =
    authLoading ||
    (Boolean(clientId) &&
      (inventoryData === undefined || salesData === undefined || staffData === undefined))

  // ─── Audit Logger ────────────────────────────────────────────────────────
  const logAuditAction = async ({ actorId, actorName, role, action, description, target }) => {
    if (!clientId) return
    try {
      await logActionMutation({
        clientId,
        actorId: actorId || currentUser?.id || 'system',
        actorName: actorName || currentUser?.name || 'System',
        role: role || currentUser?.role || 'owner',
        action,
        description,
        target: target || 'general',
      })
    } catch (err) {
      console.warn('logAuditAction error:', err)
    }
  }

  // User switching (normal login flow without passcode lock)
  const switchUser = (userId) => {
    const user = staff.find((u) => u.id === userId)
    if (!user) return
    setActiveStaffUser(user)
    setIsPasscodeLocked(false)
    setPendingUser(null)
  }

  const verifyPasscode = () => {
    setIsPasscodeLocked(false)
    return { success: true }
  }

  const lockSession = () => {}

  // ─── Inventory Actions ───────────────────────────────────────────────────

  const createProduct = async (productData) => {
    if (!clientId) return null
    try {
      const res = await createProductMutation({
        clientId,
        name: productData.name.trim(),
        code: productData.code?.trim() || undefined,
        category: productData.category?.trim() || 'General',
        unit: productData.unit?.trim() || 'Piece',
        sellingPrice: parseFloat(productData.sellingPrice) || 0,
        sellingPriceRange: productData.sellingPriceRange?.trim() || undefined,
        minSellingPrice: productData.minSellingPrice !== undefined ? parseFloat(productData.minSellingPrice) : undefined,
        maxSellingPrice: productData.maxSellingPrice !== undefined ? parseFloat(productData.maxSellingPrice) : undefined,
        costPrice: parseFloat(productData.costPrice) || 0,
        defaultCommissionRate: parseFloat(productData.defaultCommissionRate) || 5,
        minStockThreshold: parseInt(productData.minStockThreshold, 10) || 5,
        notes: productData.notes?.trim() || undefined,
        initialWarehouseId: productData.initialWarehouseId || undefined,
        initialStoreId: productData.initialStoreId || undefined,
        initialQuantity: productData.initialQuantity !== undefined ? parseInt(productData.initialQuantity, 10) : undefined,
      })
      if (res) {
        await logAuditAction({
          action: 'PRODUCT_CREATED',
          description: `Created catalog product "${productData.name}"${productData.initialQuantity ? ` with ${productData.initialQuantity} units` : ''}`,
          target: res._id,
        })
      }
      return res ? { ...res, id: res._id } : null
    } catch (err) {
      console.error('createProduct failed:', err)
      return null
    }
  }

  const updateProduct = async (productId, updates) => {
    try {
      await updateProductMutation({
        productId,
        name: updates.name,
        code: updates.code,
        category: updates.category,
        unit: updates.unit,
        sellingPrice: updates.sellingPrice !== undefined ? parseFloat(updates.sellingPrice) : undefined,
        sellingPriceRange: updates.sellingPriceRange !== undefined ? updates.sellingPriceRange : undefined,
        minSellingPrice: updates.minSellingPrice !== undefined ? parseFloat(updates.minSellingPrice) : undefined,
        maxSellingPrice: updates.maxSellingPrice !== undefined ? parseFloat(updates.maxSellingPrice) : undefined,
        costPrice: updates.costPrice !== undefined ? parseFloat(updates.costPrice) : undefined,
        defaultCommissionRate:
          updates.defaultCommissionRate !== undefined ? parseFloat(updates.defaultCommissionRate) : undefined,
        minStockThreshold:
          updates.minStockThreshold !== undefined ? parseInt(updates.minStockThreshold, 10) : undefined,
        notes: updates.notes,
      })
      await logAuditAction({
        action: 'PRODUCT_UPDATED',
        description: `Updated product properties`,
        target: productId,
      })
      return true
    } catch (err) {
      console.error('updateProduct failed:', err)
      return false
    }
  }

  const seedSampleInventory = async () => {
    if (!clientId) return false
    try {
      const res = await seedSampleInventoryMutation({ clientId })
      await logAuditAction({
        action: 'INVENTORY_SEEDED',
        description: `Loaded 15 Kaya Yasmin Auto Parts sample items to warehouse and store`,
      })
      return res
    } catch (err) {
      console.error('seedSampleInventory failed:', err)
      return false
    }
  }

  const deleteProduct = async (productId) => {
    try {
      await deleteProductMutation({ productId })
      await logAuditAction({
        action: 'PRODUCT_DELETED',
        description: `Deleted catalog product`,
        target: productId,
      })
      return true
    } catch (err) {
      console.error('deleteProduct failed:', err)
      return false
    }
  }

  const transferStock = async ({ fromWarehouseId, fromStoreId, toStoreId, toWarehouseId, productId, quantity, items }) => {
    try {
      const transferItems =
        Array.isArray(items) && items.length > 0
          ? items
              .filter((it) => parseInt(it.quantity, 10) > 0 && it.productId)
              .map((it) => ({
                productId: it.productId,
                productName: it.productName || undefined,
                quantity: parseInt(it.quantity, 10),
              }))
          : productId && parseInt(quantity, 10) > 0
          ? [{ productId, quantity: parseInt(quantity, 10) }]
          : []

      if (transferItems.length === 0) return false

      await transferStockMutation({
        fromWarehouseId: fromWarehouseId || undefined,
        fromStoreId: fromStoreId || undefined,
        toStoreId: toStoreId || undefined,
        toWarehouseId: toWarehouseId || undefined,
        items: transferItems,
      })

      const totalUnits = transferItems.reduce((acc, it) => acc + it.quantity, 0)
      await logAuditAction({
        action: 'STOCK_TRANSFER',
        description: `Transferred ${totalUnits} units across ${transferItems.length} product(s)`,
        target: `${fromWarehouseId || fromStoreId} -> ${toWarehouseId || toStoreId}`,
      })
      return true
    } catch (err) {
      console.error('transferStock failed:', err)
      alert(err?.message || 'Stock transfer failed.')
      return false
    }
  }

  const recordWarehouseInbound = async ({
    warehouseId,
    productId,
    quantity,
    costPerUnit,
    items,
    paymentMethod,
    bankProvider,
    supplierName,
  }) => {
    try {
      const inboundItems =
        Array.isArray(items) && items.length > 0
          ? items
              .filter((it) => parseInt(it.quantity, 10) > 0 && it.productId)
              .map((it) => ({
                productId: it.productId,
                productName: it.productName || undefined,
                quantity: parseInt(it.quantity, 10),
                costPerUnit: parseFloat(it.costPerUnit) || 0,
              }))
          : productId && parseInt(quantity, 10) > 0
          ? [
              {
                productId,
                quantity: parseInt(quantity, 10),
                costPerUnit: parseFloat(costPerUnit) || 0,
              },
            ]
          : []

      if (inboundItems.length === 0) return false

      await recordWarehouseInboundMutation({
        warehouseId,
        items: inboundItems,
        paymentMethod: paymentMethod || 'Cash',
        bankProvider: bankProvider || undefined,
        supplierName: supplierName || undefined,
      })

      const totalUnits = inboundItems.reduce((acc, it) => acc + it.quantity, 0)
      await logAuditAction({
        action: 'WAREHOUSE_INBOUND',
        description: `Warehouse direct purchase: ${totalUnits} units (via ${paymentMethod || 'Cash'}${supplierName ? `, Supplier: ${supplierName}` : ''})`,
        target: warehouseId,
      })
      return true
    } catch (err) {
      console.error('recordWarehouseInbound failed:', err)
      return false
    }
  }

  const recordDirectPurchase = async ({
    storeId,
    productId,
    quantity,
    costPerUnit,
    items,
    paymentMethod,
    bankProvider,
    supplierName,
  }) => {
    try {
      const purchaseItems =
        Array.isArray(items) && items.length > 0
          ? items
              .filter((it) => parseInt(it.quantity, 10) > 0 && it.productId)
              .map((it) => ({
                productId: it.productId,
                productName: it.productName || undefined,
                quantity: parseInt(it.quantity, 10),
                costPerUnit: parseFloat(it.costPerUnit) || 0,
              }))
          : productId && parseInt(quantity, 10) > 0
          ? [
              {
                productId,
                quantity: parseInt(quantity, 10),
                costPerUnit: parseFloat(costPerUnit) || 0,
              },
            ]
          : []

      if (purchaseItems.length === 0) return false

      await recordDirectPurchaseMutation({
        storeId,
        items: purchaseItems,
        paymentMethod: paymentMethod || 'Cash',
        bankProvider: bankProvider || undefined,
        supplierName: supplierName || undefined,
      })

      const totalUnits = purchaseItems.reduce((acc, it) => acc + it.quantity, 0)
      await logAuditAction({
        action: 'DIRECT_STORE_PURCHASE',
        description: `Direct store purchase: ${totalUnits} units (via ${paymentMethod || 'Cash'}${supplierName ? `, Supplier: ${supplierName}` : ''})`,
        target: storeId,
      })
      return true
    } catch (err) {
      console.error('recordDirectPurchase failed:', err)
      return false
    }
  }

  // ─── Sales Actions ───────────────────────────────────────────────────────

  const recordSale = async (saleData, currentStaff) => {
    if (!clientId) return null
    try {
      const items = (saleData.items || []).map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        price: it.unitPrice ?? it.price ?? 0,
        costPrice: it.costPrice,
        subtotal: (it.unitPrice ?? it.price ?? 0) * it.quantity,
        commissionAmount: it.commissionAmount || 0,
      }))

      const commission = items.reduce((sum, it) => sum + (it.commissionAmount || 0), 0)

      const saleMutationArgs = {
        clientId,
        storeId: saleData.storeId,
        items,
        total: saleData.totalAmount,
        paymentMethod: saleData.paymentMethod || 'Cash',
        staffId: currentStaff?.id || currentUser?.id || 'staff',
        staffName: currentStaff?.name || currentUser?.name || 'Staff',
        commission,
      }

      if (saleData.storeName) saleMutationArgs.storeName = saleData.storeName
      if (saleData.bankProvider) saleMutationArgs.bankProvider = saleData.bankProvider
      if (saleData.bankRef) saleMutationArgs.bankRef = saleData.bankRef
      if (saleData.customerName) saleMutationArgs.customerName = saleData.customerName
      if (saleData.customerPhone) saleMutationArgs.customerPhone = saleData.customerPhone

      const created = await recordSaleMutation(saleMutationArgs)

      if (created) {
        await logAuditAction({
          action: 'SALE_RECORDED',
          description: `Recorded ${saleData.paymentMethod} sale ${created.receiptNumber} (ETB ${saleData.totalAmount.toFixed(2)})`,
          target: saleData.storeId,
        })
      }

      return created
        ? {
            ...created,
            id: created._id,
            invoiceNumber: created.receiptNumber,
            totalAmount: created.total ?? saleData.totalAmount,
            commissionTotal: created.commission ?? commission,
          }
        : null
    } catch (err) {
      console.error('recordSale failed:', err)
      throw err
    }
  }

  const settleCreditSale = async (saleId, settledPaymentMethod = 'Cash', bankProvider = null) => {
    try {
      await settleCreditSaleMutation({
        saleId,
        settledPaymentMethod,
        settledBankProvider: bankProvider || undefined,
      })

      await logAuditAction({
        action: 'CREDIT_SALE_SETTLED',
        description: `Settled unpaid credit sale via ${settledPaymentMethod}`,
        target: saleId,
      })
      return true
    } catch (err) {
      console.error('settleCreditSale failed:', err)
      return false
    }
  }

  // ─── Staff & Business Actions ────────────────────────────────────────────

  const approveStaffMember = async (staffId) => {
    try {
      await approveStaffMutation({ staffId })
      await logAuditAction({
        action: 'STAFF_UPDATED',
        description: `Approved salesperson access`,
        target: staffId,
      })
      return true
    } catch (err) {
      console.error('approveStaffMember failed:', err)
      return false
    }
  }

  const rejectStaffMember = async (staffId) => {
    try {
      await rejectStaffMutation({ staffId })
      await logAuditAction({
        action: 'STAFF_UPDATED',
        description: `Rejected salesperson application`,
        target: staffId,
      })
      return true
    } catch (err) {
      console.error('rejectStaffMember failed:', err)
      return false
    }
  }

  const deleteStaffMember = async (staffId) => {
    try {
      await deleteStaffMutation({ staffId })
      await logAuditAction({
        action: 'STAFF_UPDATED',
        description: `Removed staff member`,
        target: staffId,
      })
      return true
    } catch (err) {
      console.error('deleteStaffMember failed:', err)
      return false
    }
  }

  const saveStaffMember = async (member) => {
    if (member.id) {
      if (member.status === 'approved') {
        return await approveStaffMember(member.id)
      } else if (member.status === 'rejected') {
        return await rejectStaffMember(member.id)
      }
    }
    return true
  }

  const updateBusinessName = async (newName) => {
    if (!clientId || !newName?.trim()) return
    try {
      await updateBusinessNameMutation({
        clientId,
        name: newName.trim(),
      })
      await logAuditAction({
        action: 'BUSINESS_NAME_UPDATED',
        description: `Updated business name to "${newName.trim()}"`,
        target: clientId,
      })
    } catch (err) {
      console.error('updateBusinessName failed:', err)
    }
  }

  const overrideStock = async (locationId, locationName, locationType, productId, productName, newQuantity) => {
    try {
      await overrideStockMutation({
        locationType,
        locationId,
        productId,
        newQuantity: parseInt(newQuantity, 10) || 0,
      })
      await logAuditAction({
        action: 'STOCK_OVERRIDE',
        description: `Overrode stock for "${productName}" to ${newQuantity} in ${locationName}`,
        target: locationId,
      })
      return true
    } catch (err) {
      console.error('overrideStock failed:', err)
      return false
    }
  }

  const addStore = async ({ name, location }) => {
    if (!clientId) return null
    try {
      const res = await addStoreMutation({
        clientId,
        name: name.trim(),
        location: location?.trim() || name.trim() || 'Store 1',
      })
      await logAuditAction({
        action: 'STORE_CREATED',
        description: `Created new retail store branch "${name.trim()}"`,
        target: res,
      })
      return res
    } catch (err) {
      console.error('addStore failed:', err)
      return null
    }
  }

  const deleteStore = async (storeId) => {
    try {
      await deleteStoreMutation({ storeId })
      await logAuditAction({
        action: 'STORE_DELETED',
        description: `Deleted retail store branch`,
        target: storeId,
      })
      return true
    } catch (err) {
      console.error('deleteStore failed:', err)
      return false
    }
  }

  // Clear products, sales, and reset inventory stock to {} for the active client
  const clearDatabaseData = async () => {
    if (!activeClientId) return false
    try {
      await clearOrganizationDataMutation({ clientId: activeClientId })
      return true
    } catch (err) {
      console.error('clearDatabaseData failed:', err)
      throw err
    }
  }

  // Wipe client organization and all associated data, returning user to initial onboarding
  const wipeAndResetAccount = async () => {
    if (!activeClientId) return false
    try {
      await wipeClientAndResetMutation({ clientId: activeClientId })
      return true
    } catch (err) {
      console.error('wipeAndResetAccount failed:', err)
      throw err
    }
  }

  // Wipe all database tables across the deployment
  const wipeAllDatabaseData = async () => {
    try {
      await wipeEntireDatabaseMutation()
      return true
    } catch (err) {
      console.error('wipeAllDatabaseData failed:', err)
      throw err
    }
  }

  // Delete user record from Convex
  const deleteAccount = async (userId) => {
    if (!userId) return false
    try {
      await deleteUserAccountMutation({ userId })
      return true
    } catch (err) {
      console.error('deleteAccount failed:', err)
      throw err
    }
  }

  return (
    <TenantContext.Provider
      value={{
        clientId,
        tenantName,
        activeOrg,
        organizations,
        companyCode,
        products,
        warehouses,
        stores,
        sales,
        staff,
        auditLogs,
        loading,
        isFirebaseLive: true,
        // Methods
        createProduct,
        updateProduct,
        deleteProduct,
        seedSampleInventory,
        transferStock,
        recordWarehouseInbound,
        recordDirectPurchase,
        recordSale,
        settleCreditSale,
        overrideStock,
        addStore,
        deleteStore,
        logAuditAction,
        approveStaffMember,
        rejectStaffMember,
        deleteStaffMember,
        saveStaffMember,
        updateBusinessName,
        clearDatabaseData,
        wipeAndResetAccount,
        wipeAllDatabaseData,
        deleteAccount,
        // POS Passcode / Switch
        activeStaffUser,
        isPasscodeLocked,
        pendingUser,
        switchUser,
        verifyPasscode,
        lockSession,
        // Compatibility stubs
        selectOrganization: () => {},
        clearActiveOrganization: () => {},
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider')
  return ctx
}
