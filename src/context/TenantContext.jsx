import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from './AuthContext'
import { formatCurrency, formatProductCode, getDefaultCommissionRate, getProductCommissionRate, isOilInLiter } from '../lib/utils'

export const SAMPLE_AUTO_PARTS = [
  { id: 'sp-001', code: 'SP-001', name: '12 KG GAS nok', category: 'Gas Cylinders', unit: 'Kg', costPrice: 2950, sellingPrice: 3500, sellingPriceRange: '3500', minStockThreshold: 2, defaultCommissionRate: 2.5 },
  { id: 'sp-002', code: 'SP-002', name: '12 KG GAS giyon', category: 'Gas Cylinders', unit: 'Kg', costPrice: 3300, sellingPrice: 3500, sellingPriceRange: '3500-3700', minStockThreshold: 2, defaultCommissionRate: 2.5 },
  { id: 'sp-003', code: 'SP-003', name: '6 KG GAS', category: 'Gas Cylinders', unit: 'Kg', costPrice: 1300, sellingPrice: 1800, sellingPriceRange: '1800-2000', minStockThreshold: 2, defaultCommissionRate: 2.5 },
  { id: 'sp-004', code: 'SP-004', name: '15kg Gas Cylinder', category: 'Gas Cylinders', unit: 'Kg', costPrice: 4000, sellingPrice: 4500, sellingPriceRange: '4500-5000', minStockThreshold: 2, defaultCommissionRate: 2.5 },
  { id: 'sp-005', code: 'SP-005', name: '22 KG GAS', category: 'Gas Cylinders', unit: 'Kg', costPrice: 5500, sellingPrice: 6500, sellingPriceRange: '6500-7000', minStockThreshold: 1, defaultCommissionRate: 2.5 },
  { id: 'sp-006', code: 'SP-006', name: '64010 Fuel filter rinken', category: 'Filters', unit: 'Piece', costPrice: 400, sellingPrice: 500, sellingPriceRange: '500-600', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-007', code: 'SP-007', name: 'FLANja lokal DX', category: 'Filters', unit: 'Piece', costPrice: 1800, sellingPrice: 2500, sellingPriceRange: '2500-2800', minStockThreshold: 6, defaultCommissionRate: 2.5 },
  { id: 'sp-008', code: 'SP-008', name: 'ISUZU fuel filter', category: 'Filters', unit: 'Piece', costPrice: 400, sellingPrice: 600, sellingPriceRange: '600-750', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-009', code: 'SP-009', name: 'Coolant 1L', category: 'Coolants & Fluids', unit: 'L', costPrice: 350, sellingPrice: 500, sellingPriceRange: '500-600', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-010', code: 'SP-010', name: 'Coolant 4L', category: 'Coolants & Fluids', unit: 'L', costPrice: 1100, sellingPrice: 1200, sellingPriceRange: '1200-1800', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-011', code: 'SP-011', name: 'OSCAR BREAK FLUD', category: 'Brake Fluids', unit: 'Piece', costPrice: 150, sellingPrice: 300, sellingPriceRange: '300-400', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-012', code: 'SP-012', name: 'Asmico break fluid 1/2', category: 'Brake Fluids', unit: 'Piece', costPrice: 450, sellingPrice: 500, sellingPriceRange: '500-700', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-016', code: 'SP-016', name: 'SDK 30002 oil filter', category: 'Oil Filters', unit: 'Piece', costPrice: 350, sellingPrice: 500, sellingPriceRange: '500-650', minStockThreshold: 5, defaultCommissionRate: 2.5 },
  { id: 'sp-030', code: 'SP-030', name: 'Rubia 1L', category: 'Engine Oils (1L)', unit: 'L', costPrice: 1100, sellingPrice: 1200, sellingPriceRange: '1200-1500', minStockThreshold: 5, defaultCommissionRate: 0.5 },
  { id: 'sp-035', code: 'SP-035', name: 'Delo 4L', category: 'Engine Oils (4L)', unit: 'L', costPrice: 5000, sellingPrice: 5500, sellingPriceRange: '5500-6000', minStockThreshold: 3, defaultCommissionRate: 0.5 },
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

  const pendingApprovalsData = useQuery(
    api.approvals.getPendingApprovals,
    clientId ? { clientId } : 'skip'
  )

  const approvalHistoryData = useQuery(
    api.approvals.getAllApprovals,
    clientId ? { clientId } : 'skip'
  )

  const commissionSettlementsData = useQuery(
    api.commissions.getCommissionSettlements,
    clientId ? { clientId } : 'skip'
  )

  // Synchronized & Locally Persisted Commission Settlements Store
  const [localSettlements, setLocalSettlements] = useState(() => {
    try {
      const stored = localStorage.getItem(`omestock_commission_settlements_${clientId || 'default'}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Load settlements whenever clientId changes or on mount
  useEffect(() => {
    if (!clientId) return
    try {
      const stored = localStorage.getItem(`omestock_commission_settlements_${clientId}`)
      if (stored) {
        setLocalSettlements(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Failed to load commission settlements:', e)
    }
  }, [clientId])

  const saveSettlements = (newSettlements) => {
    setLocalSettlements(newSettlements)
    try {
      const key = `omestock_commission_settlements_${clientId || 'default'}`
      localStorage.setItem(key, JSON.stringify(newSettlements))
    } catch (e) {
      console.warn('Failed to save commission settlements:', e)
    }
  }

  // Realtime Convex Mutations
  const createProductMutation = useMutation(api.inventory.createProduct)
  const updateProductMutation = useMutation(api.inventory.updateProduct)
  const deleteProductMutation = useMutation(api.inventory.deleteProduct)
  const transferStockMutation = useMutation(api.inventory.transferStock)
  const recordWarehouseInboundMutation = useMutation(api.inventory.recordWarehouseInbound)
  const recordDirectPurchaseMutation = useMutation(api.inventory.recordDirectPurchase)
  const recordSaleMutation = useMutation(api.sales.recordSale)
  const settleCreditSaleMutation = useMutation(api.sales.settleCreditSale)
  const settleStaffCommissionMutation = useMutation(api.commissions.settleStaffCommission)
  const approveStaffMutation = useMutation(api.users.approveStaff)
  const rejectStaffMutation = useMutation(api.users.rejectStaff)
  const deleteStaffMutation = useMutation(api.users.deleteStaff)
  const updateStaffMemberMutation = useMutation(api.users.updateStaffMember)
  const updateBusinessNameMutation = useMutation(api.users.updateBusinessName)
  const logActionMutation = useMutation(api.audit.logAction)
  const overrideStockMutation = useMutation(api.inventory.overrideStock)
  const addStoreMutation = useMutation(api.inventory.addStore)
  const deleteStoreMutation = useMutation(api.inventory.deleteStore)
  const seedSampleInventoryMutation = useMutation(api.inventory.seedSampleInventory)
  const normalizeLocationNamesMutation = useMutation(api.inventory.normalizeLocationNames)
  const bulkImportInventoryMutation = useMutation(api.inventory.bulkImportInventory)
  const clearOrganizationDataMutation = useMutation(api.users.clearOrganizationData)
  const wipeClientAndResetMutation = useMutation(api.users.wipeClientAndReset)
  const wipeEntireDatabaseMutation = useMutation(api.users.wipeEntireDatabase)
  const deleteUserAccountMutation = useMutation(api.users.deleteUserAccount)

  // Approvals & Telegram Actions
  const createApprovalRequestMutation = useMutation(api.approvals.createApprovalRequest)
  const approveRequestMutation = useMutation(api.approvals.approveRequest)
  const rejectRequestMutation = useMutation(api.approvals.rejectRequest)
  const dispatchTelegramApprovalAction = useAction(api.telegram.dispatchTelegramApproval)
  const updateTelegramApprovalMessageAction = useAction(api.telegram.updateTelegramApprovalMessage)
  const ensureTelegramWebhookAction = useAction(api.telegram.ensureTelegramWebhook)
  const getTelegramBotInfoAction = useAction(api.telegram.getTelegramBotInfo)
  const dispatchItemEditedNotificationAction = useAction(api.telegram.dispatchItemEditedNotification)
  const telegramSubscribersData = useQuery(api.approvals.getActiveTelegramSubscribers)

  // Auto-ensure Telegram Webhook is active for real-time approvals
  useEffect(() => {
    ensureTelegramWebhookAction({}).catch(() => {})
  }, [ensureTelegramWebhookAction])

  // Auto-normalize location names (e.g. Central Distribution Hub -> Warehouse, Retail Store #1 -> Store 1)
  useEffect(() => {
    if (clientId) {
      normalizeLocationNamesMutation({ clientId }).catch(() => {})
    }
  }, [clientId, normalizeLocationNamesMutation])

  // Auto-sync any unsynced local settlements to Convex DB so all user devices receive the settled status
  useEffect(() => {
    if (!clientId || !Array.isArray(localSettlements) || localSettlements.length === 0 || !Array.isArray(salesData)) {
      return
    }

    const unsettledConvexSales = salesData.filter((s) => !s.commissionSettled && (s.commission ?? 0) > 0)
    if (unsettledConvexSales.length === 0) return

    localSettlements.forEach(async (ls) => {
      const saleIds = Array.isArray(ls.settledSaleIds) ? ls.settledSaleIds : []
      const hasUnsettledInConvex = unsettledConvexSales.some(
        (s) => saleIds.includes(s._id) || saleIds.includes(String(s._id))
      )
      if (hasUnsettledInConvex) {
        try {
          await settleStaffCommissionMutation({
            clientId,
            staffId: String(ls.staffId),
            staffName: String(ls.staffName),
            amount: parseFloat(ls.amount) || 0,
            paymentMethod: ls.paymentMethod || 'Cash',
            bankProvider: ls.bankProvider || undefined,
            reference: ls.reference || undefined,
            notes: ls.notes || undefined,
            settledByUserId: ls.settledByUserId || 'owner',
            settledByUserName: ls.settledByUserName || 'Owner',
            saleIds: saleIds.map(String),
          })
        } catch (syncErr) {
          console.warn('Auto-sync unsynced local settlement error:', syncErr)
        }
      }
    })
  }, [clientId, localSettlements, salesData, settleStaffCommissionMutation])

  // Quick switch / session state inside active organization
  const [activeStaffUser, setActiveStaffUser] = useState(null)
  const [isPasscodeLocked, setIsPasscodeLocked] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  // Format products with compatibility id field and standardized commission rates (0.5% for oils in liter, 2.5% default for all other items)
  const products = useMemo(() => {
    if (!inventoryData?.products) {
      return []
    }
    return inventoryData.products.map((p) => {
      const commRate = getProductCommissionRate(p)
      return {
        ...p,
        id: p._id,
        code: p.code ? formatProductCode(p.code) : undefined,
        defaultCommissionRate: commRate,
      }
    })
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

  // Format commission settlements history (realtime Convex sync + optimistic local fallback)
  const commissionSettlements = useMemo(() => {
    const list = []
    const seen = new Set()

    if (Array.isArray(commissionSettlementsData)) {
      commissionSettlementsData.forEach((cs) => {
        const id = String(cs._id || cs.id)
        seen.add(id)
        list.push({
          ...cs,
          id: cs._id,
        })
      })
    }

    if (Array.isArray(localSettlements)) {
      localSettlements.forEach((cs) => {
        const id = String(cs._id || cs.id)
        if (!seen.has(id)) {
          seen.add(id)
          list.push(cs)
        }
      })
    }

    return list
  }, [commissionSettlementsData, localSettlements])

  // Format sales history with complete customer debt and commission settlement fields
  const sales = useMemo(() => {
    if (!salesData) return []
    // Build set of settled sale IDs from commission settlements
    const settledIdsSet = new Set()
    commissionSettlements.forEach((cs) => {
      if (Array.isArray(cs.settledSaleIds)) {
        cs.settledSaleIds.forEach((id) => settledIdsSet.add(String(id)))
      }
    })

    return salesData.map((s) => {
      const isSettled =
        Boolean(s.commissionSettled) ||
        settledIdsSet.has(String(s._id)) ||
        settledIdsSet.has(String(s.id))
      return {
        ...s,
        id: s._id,
        invoiceNumber: s.receiptNumber,
        totalAmount: s.total,
        commissionTotal: s.commission ?? 0,
        commissionSettled: isSettled,
        commissionSettledAt: s.commissionSettledAt,
        commissionSettlementId: s.commissionSettlementId,
        salespersonName: s.staffName,
        salespersonId: s.staffId,
        storeName: s.storeName || 'Main Store',
        customerName: s.customerName || 'Walk-in Customer',
        customerPhone: s.customerPhone || '',
        timestamp: s.createdAt,
      }
    })
  }, [salesData, commissionSettlements])

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

  // Format pending approvals
  const pendingApprovals = useMemo(() => {
    if (!pendingApprovalsData) return []
    return pendingApprovalsData.map((r) => ({
      ...r,
      id: r._id,
    }))
  }, [pendingApprovalsData])

  // Format approval history
  const approvalHistory = useMemo(() => {
    if (!approvalHistoryData) return []
    return approvalHistoryData.map((r) => ({
      ...r,
      id: r._id,
    }))
  }, [approvalHistoryData])

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
        code: productData.code ? formatProductCode(productData.code) : undefined,
        category: productData.category?.trim() || 'General',
        unit: productData.unit?.trim() || 'Piece',
        sellingPrice: parseFloat(productData.sellingPrice) || 0,
        sellingPriceRange: productData.sellingPriceRange?.trim() || undefined,
        minSellingPrice: productData.minSellingPrice !== undefined ? parseFloat(productData.minSellingPrice) : undefined,
        maxSellingPrice: productData.maxSellingPrice !== undefined ? parseFloat(productData.maxSellingPrice) : undefined,
        costPrice: parseFloat(productData.costPrice) || 0,
        defaultCommissionRate:
          productData.defaultCommissionRate !== undefined && productData.defaultCommissionRate !== ''
            ? parseFloat(productData.defaultCommissionRate)
            : getDefaultCommissionRate(productData),
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
          target: productData.name,
        })
      }
      return res ? { ...res, id: res._id } : null
    } catch (err) {
      console.error('createProduct failed:', err)
      return null
    }
  }

  const updateProduct = async (productId, updates, user, locationStockUpdate) => {
    try {
      const prevProd = products.find(p => p.id === productId || p._id === productId)

      // 1. If locationStockUpdate is provided and quantity changed, update location stock
      let stockChangeMsg = null
      if (locationStockUpdate && locationStockUpdate.locationId && locationStockUpdate.newQuantity !== undefined && locationStockUpdate.newQuantity !== '') {
        const newQty = parseInt(locationStockUpdate.newQuantity, 10) || 0
        const oldQty = parseInt(locationStockUpdate.oldQuantity, 10) || 0
        if (newQty !== oldQty) {
          await overrideStockMutation({
            locationType: locationStockUpdate.locationType,
            locationId: locationStockUpdate.locationId,
            productId,
            newQuantity: newQty,
          })
          const diff = newQty - oldQty
          const diffStr = diff >= 0 ? `+${diff}` : `${diff}`
          const unitStr = updates.unit || prevProd?.unit || 'units'
          const locName = locationStockUpdate.locationName || 'Location'
          stockChangeMsg = `• Stock Quantity (${locName}): <s>${oldQty}</s> ➔ <b>${newQty} ${unitStr}</b> (${diffStr})`
          await logAuditAction({
            action: 'STOCK_OVERRIDE',
            description: `Adjusted stock for "${updates.name || prevProd?.name || 'Product'}" to ${newQty} in ${locName}`,
            target: locName,
          })
        }
      }

      // 2. Update catalog product properties
      await updateProductMutation({
        productId,
        name: updates.name,
        code: updates.code !== undefined && updates.code !== null ? formatProductCode(updates.code) : undefined,
        category: updates.category,
        unit: updates.unit,
        sellingPrice: updates.sellingPrice !== undefined && updates.sellingPrice !== '' ? parseFloat(updates.sellingPrice) : undefined,
        sellingPriceRange: updates.sellingPriceRange !== undefined ? updates.sellingPriceRange : undefined,
        minSellingPrice: updates.minSellingPrice !== undefined && updates.minSellingPrice !== '' ? parseFloat(updates.minSellingPrice) : undefined,
        maxSellingPrice: updates.maxSellingPrice !== undefined && updates.maxSellingPrice !== '' ? parseFloat(updates.maxSellingPrice) : undefined,
        costPrice: updates.costPrice !== undefined && updates.costPrice !== '' ? parseFloat(updates.costPrice) : undefined,
        defaultCommissionRate:
          updates.defaultCommissionRate !== undefined && updates.defaultCommissionRate !== '' ? parseFloat(updates.defaultCommissionRate) : undefined,
        minStockThreshold:
          updates.minStockThreshold !== undefined && updates.minStockThreshold !== '' ? parseInt(updates.minStockThreshold, 10) : undefined,
        notes: updates.notes,
      })
      const prodName = updates.name || prevProd?.name || 'Product'
      await logAuditAction({
        action: 'PRODUCT_UPDATED',
        description: `Updated properties for "${prodName}"`,
        target: prodName,
      })

      // Detect field-by-field differences
      const changes = []
      if (stockChangeMsg) {
        changes.push(stockChangeMsg)
      }
      if (updates.name !== undefined && updates.name.trim() && updates.name.trim() !== (prevProd?.name || '')) {
        changes.push(`• Name: <s>${prevProd?.name || 'None'}</s> ➔ <b>${updates.name.trim()}</b>`)
      }
      if (updates.code !== undefined && updates.code.trim() !== (prevProd?.code || '')) {
        changes.push(`• Product ID / SKU: <s>${prevProd?.code || 'None'}</s> ➔ <b>${updates.code.trim()}</b>`)
      }
      if (updates.category !== undefined && updates.category.trim() && updates.category.trim() !== (prevProd?.category || '')) {
        changes.push(`• Category: <s>${prevProd?.category || 'General'}</s> ➔ <b>${updates.category.trim()}</b>`)
      }
      if (updates.unit !== undefined && updates.unit.trim() && updates.unit.trim() !== (prevProd?.unit || '')) {
        changes.push(`• Unit: <s>${prevProd?.unit || 'Piece'}</s> ➔ <b>${updates.unit.trim()}</b>`)
      }
      if (updates.sellingPrice !== undefined && updates.sellingPrice !== '') {
        const newSelling = parseFloat(updates.sellingPrice) || 0
        const oldSelling = parseFloat(prevProd?.sellingPrice || 0)
        if (Math.abs(newSelling - oldSelling) > 0.001) {
          changes.push(`• Selling Price: <s>${oldSelling.toLocaleString()} ETB</s> ➔ <b>${newSelling.toLocaleString()} ETB</b>`)
        }
      }
      if (updates.costPrice !== undefined && updates.costPrice !== '') {
        const newCost = parseFloat(updates.costPrice) || 0
        const oldCost = parseFloat(prevProd?.costPrice || 0)
        if (Math.abs(newCost - oldCost) > 0.001) {
          changes.push(`• Cost Price: <s>${oldCost.toLocaleString()} ETB</s> ➔ <b>${newCost.toLocaleString()} ETB</b>`)
        }
      }
      if (updates.minStockThreshold !== undefined && updates.minStockThreshold !== '') {
        const newMin = parseInt(updates.minStockThreshold, 10) || 0
        const oldMin = parseInt(prevProd?.minStockThreshold || 0, 10)
        if (newMin !== oldMin) {
          changes.push(`• Min Stock Alert: <s>${oldMin} units</s> ➔ <b>${newMin} units</b>`)
        }
      }
      if (updates.defaultCommissionRate !== undefined && updates.defaultCommissionRate !== '') {
        const newComm = parseFloat(updates.defaultCommissionRate) || 0
        const oldComm = parseFloat(prevProd?.defaultCommissionRate || 0)
        if (Math.abs(newComm - oldComm) > 0.001) {
          changes.push(`• Commission Rate: <s>${oldComm}%</s> ➔ <b>${newComm}%</b>`)
        }
      }

      // If any field changed, dispatch Telegram notification to owner
      if (changes.length > 0) {
        const editor = user || currentUser
        const editorName = editor?.name || editor?.email || 'Staff Member'
        const rawRole = editor?.role || (editor?.isOwner ? 'Owner' : 'Salesperson')
        const editorRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1)
        const targetCategory = updates.category || prevProd?.category || 'General'
        const locName = locationStockUpdate?.locationName || undefined

        let actionDispatched = false
        try {
          const res = await dispatchItemEditedNotificationAction({
            productName: prodName,
            category: targetCategory || undefined,
            locationName: locName,
            editedByName: editorName,
            editedByRole: editorRole,
            changesSummary: changes.join('\n'),
          })
          if (res && res.success) {
            actionDispatched = true
          }
        } catch (actionErr) {
          console.warn('Convex item edited notification action warning:', actionErr)
        }

        // Direct fetch backup to guarantee delivery to all owners
        if (!actionDispatched) {
          try {
            const recipientChatIds = new Set()
            if (Array.isArray(telegramSubscribersData)) {
              telegramSubscribersData.forEach(s => {
                if (s.chatId) recipientChatIds.add(String(s.chatId))
              })
            }
            recipientChatIds.add('5069830125')

            const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            let tgMsg = `<b>ITEM EDITED</b>\n\n`
            tgMsg += `<b>Item:</b> ${prodName}\n`
            if (locName) {
              tgMsg += `<b>Location:</b> ${locName}\n`
            }
            if (targetCategory) {
              tgMsg += `<b>Category:</b> ${targetCategory}\n`
            }
            tgMsg += `<b>Edited By:</b> ${editorName} (${editorRole})\n\n`
            tgMsg += `<b>Changes:</b>\n${changes.join('\n')}\n\n`
            tgMsg += `<i>Time: ${nowStr}</i>`

            for (const chatId of recipientChatIds) {
              await fetch(`https://api.telegram.org/bot8862271033:AAHoUK5i_r_DaYxHKUMlEyXHvOaTtmGOt-Q/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: tgMsg,
                  parse_mode: 'HTML',
                }),
              }).catch(() => {})
            }
          } catch (directErr) {
            console.error('Direct Telegram send error:', directErr)
          }
        }
      }

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
      const prodName = products.find(p => p.id === productId)?.name || 'Product'
      await deleteProductMutation({ productId })
      await logAuditAction({
        action: 'PRODUCT_DELETED',
        description: `Deleted catalog product "${prodName}"`,
        target: prodName,
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
      const fromName = warehouses.find(w => w.id === fromWarehouseId)?.name || stores.find(s => s.id === fromStoreId)?.name || 'Origin'
      const toName = warehouses.find(w => w.id === toWarehouseId)?.name || stores.find(s => s.id === toStoreId)?.name || 'Destination'
      await logAuditAction({
        action: 'STOCK_TRANSFER',
        description: `Transferred ${totalUnits} units across ${transferItems.length} product(s) from ${fromName} to ${toName}`,
        target: `${fromName} → ${toName}`,
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
      const whName = warehouses.find(w => w.id === warehouseId)?.name || 'Warehouse'
      await logAuditAction({
        action: 'WAREHOUSE_INBOUND',
        description: `Warehouse direct purchase: ${totalUnits} units (via ${paymentMethod || 'Cash'}${supplierName ? `, Supplier: ${supplierName}` : ''})`,
        target: whName,
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
      const storeName = stores.find(s => s.id === storeId)?.name || 'Store'
      await logAuditAction({
        action: 'DIRECT_STORE_PURCHASE',
        description: `Direct store purchase: ${totalUnits} units (via ${paymentMethod || 'Cash'}${supplierName ? `, Supplier: ${supplierName}` : ''})`,
        target: storeName,
      })
      return true
    } catch (err) {
      console.error('recordDirectPurchase failed:', err)
      return false
    }
  }

  // ─── Approval Requests & Telegram Notifications ─────────────────────────

  const submitTransferRequest = async ({
    fromWarehouseId,
    fromStoreId,
    toStoreId,
    toWarehouseId,
    sourceName,
    destinationName,
    items,
    notes,
  }) => {
    if (!clientId) return null
    try {
      const isFromWarehouse = fromWarehouseId !== undefined ? Boolean(fromWarehouseId) : true
      const isToWarehouse = Boolean(toWarehouseId)

      const effectiveFromId = fromWarehouseId || fromStoreId || (isFromWarehouse ? warehouses[0]?.id : stores[0]?.id)
      const effectiveToId = toWarehouseId || toStoreId || (isToWarehouse ? warehouses[0]?.id : stores[0]?.id)

      const effectiveSourceName =
        sourceName ||
        (isFromWarehouse
          ? warehouses.find((w) => w.id === effectiveFromId)?.name || 'Warehouse'
          : stores.find((s) => s.id === effectiveFromId)?.name || 'Store')

      const effectiveDestName =
        destinationName ||
        (isToWarehouse
          ? warehouses.find((w) => w.id === effectiveToId)?.name || 'Warehouse'
          : stores.find((s) => s.id === effectiveToId)?.name || 'Store')

      const formattedItems = (items || []).map((it) => {
        const prod = products.find((p) => p.id === it.productId)
        return {
          productId: it.productId,
          productName: it.productName || prod?.name || 'Product',
          productCode: prod?.code || '',
          quantity: parseInt(it.quantity, 10) || 1,
        }
      })

      const requestId = await createApprovalRequestMutation({
        clientId,
        type: 'transfer',
        sourceLocationType: isFromWarehouse ? 'warehouse' : 'store',
        sourceLocationId: effectiveFromId,
        sourceLocationName: effectiveSourceName,
        destinationLocationType: isToWarehouse ? 'warehouse' : 'store',
        destinationLocationId: effectiveToId,
        destinationLocationName: effectiveDestName,
        items: formattedItems,
        notes: notes || undefined,
        requestedByUserId: currentUser?.id || 'staff',
        requestedByUserName: currentUser?.name || currentUser?.email || 'Staff Member',
        requestedByUserEmail: currentUser?.email || undefined,
      })

      // Send interactive Telegram approval notification to owner
      const itemsSummary = formattedItems
        .map((it) => `• <b>${it.productName}</b>: <code>${it.quantity}</code> units`)
        .join('\n')

      try {
        const tgRes = await dispatchTelegramApprovalAction({
          requestId,
          type: 'transfer',
          requestedByName: currentUser?.name || currentUser?.email || 'Staff Member',
          sourceName,
          destinationName,
          itemsSummary,
          notes: notes || undefined,
        })
        if (tgRes && !tgRes.success) {
          console.warn('Telegram notification warning:', tgRes.error)
        }
      } catch (tgErr) {
        console.error('Telegram dispatch error:', tgErr)
      }

      return requestId
    } catch (err) {
      console.error('submitTransferRequest failed:', err)
      throw err
    }
  }

  const submitDirectPurchaseRequest = async ({
    destinationLocationType = 'store',
    destinationLocationId,
    destinationName,
    items,
    paymentMethod,
    bankProvider,
    supplierName,
    notes,
    isNewItem,
  }) => {
    if (!clientId) return null
    try {
      // Extract target category to encode in notes metadata (avoiding Convex validator rejection on deployed backends)
      const targetCategory = items?.find((it) => it.category)?.category || (items || [])[0]?.category
      const categoryTag = targetCategory ? `[Category: ${targetCategory}]` : ''
      const enrichedNotes = [categoryTag, notes].filter(Boolean).join(' ').trim() || undefined

      const formattedItems = (items || []).map((it) => {
        const prod = products.find((p) => p.id === it.productId)
        const cost = parseFloat(it.costPerUnit) || parseFloat(it.costPrice) || prod?.costPrice || 0
        return {
          productId: it.productId,
          productName: it.productName || prod?.name || 'Product',
          productCode: prod?.code || '',
          quantity: parseInt(it.quantity, 10) || 1,
          costPerUnit: 0,
          unit: it.unit || prod?.unit || 'Piece',
          sellingPrice: it.sellingPrice !== undefined && it.sellingPrice !== '' ? parseFloat(it.sellingPrice) : prod?.sellingPrice,
          minStockThreshold: it.minStockThreshold !== undefined && it.minStockThreshold !== '' ? parseInt(it.minStockThreshold, 10) : (prod?.minStockThreshold || 3),
        }
      })

      const totalCost = 0

      const effectiveDestId =
        destinationLocationId ||
        (destinationLocationType === 'warehouse' ? warehouses[0]?.id : stores[0]?.id)
      const effectiveDestName =
        destinationName ||
        (destinationLocationType === 'warehouse'
          ? warehouses.find((w) => w.id === effectiveDestId)?.name || 'Warehouse'
          : stores.find((s) => s.id === effectiveDestId)?.name || 'Store')

      const requestId = await createApprovalRequestMutation({
        clientId,
        type: 'direct_purchase',
        destinationLocationType,
        destinationLocationId: effectiveDestId,
        destinationLocationName: effectiveDestName,
        items: formattedItems,
        paymentMethod: paymentMethod || 'Cash',
        bankProvider: bankProvider || undefined,
        supplierName: supplierName || undefined,
        totalCost,
        notes: enrichedNotes,
        requestedByUserId: currentUser?.id || 'staff',
        requestedByUserName: currentUser?.name || currentUser?.email || 'Staff Member',
        requestedByUserEmail: currentUser?.email || undefined,
      })

      // Send interactive Telegram approval notification to owner
      const hasNewItem = Boolean(
        isNewItem ||
        formattedItems.some((it) => it.productId === 'new_item') ||
        (items || []).some((it) => it.isNewItem)
      )

      const itemsSummary = (items || [])
        .map((it) => {
          const qtyStr = `<code>+${it.quantity}</code> ${it.unit || 'units'}`
          const sell = parseFloat(it.sellingPrice) || 0
          const cat = it.category || targetCategory
          let line = `• <b>${it.productName}</b>: ${qtyStr}`
          if (cat) line += ` [${cat}]`
          if (sell > 0) {
            line += `\n  <i>(Selling Price: ${sell.toLocaleString()} ETB)</i>`
          }
          return line
        })
        .join('\n')

      // Embed [New Item] tag in notes so backend detects new item without extra validator fields
      const notesWithNewItem = hasNewItem
        ? `[New Item] ${enrichedNotes || ''}`.trim()
        : enrichedNotes

      try {
        const tgRes = await dispatchTelegramApprovalAction({
          requestId,
          type: 'direct_purchase',
          requestedByName: currentUser?.name || currentUser?.email || 'Staff Member',
          destinationName: effectiveDestName,
          itemsSummary,
          totalCost: totalCost || 0,
          paymentMethod: paymentMethod || 'Cash',
          supplierName: supplierName || undefined,
          notes: notesWithNewItem || undefined,
        })
        if (tgRes && !tgRes.success) {
          console.warn('Telegram notification warning:', tgRes.error)
        }
      } catch (tgErr) {
        console.error('Telegram dispatch error:', tgErr)
      }

      return requestId
    } catch (err) {
      console.error('submitDirectPurchaseRequest failed:', err)
      throw err
    }
  }

  const approveApprovalRequest = async (requestId, productConfigs) => {
    try {
      const res = await approveRequestMutation({
        requestId,
        reviewerUserId: currentUser?.id || 'owner',
        reviewerUserName: currentUser?.name || currentUser?.email || 'Owner',
        productConfigs: productConfigs || undefined,
      })
      return res
    } catch (err) {
      console.error('approveApprovalRequest failed:', err)
      throw err
    }
  }

  const rejectApprovalRequest = async (requestId, reason) => {
    try {
      const res = await rejectRequestMutation({
        requestId,
        reviewerUserId: currentUser?.id || 'owner',
        reviewerUserName: currentUser?.name || currentUser?.email || 'Owner',
        reason: reason || undefined,
      })
      return res
    } catch (err) {
      console.error('rejectApprovalRequest failed:', err)
      throw err
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
        const itemsSummary = items
          .map((it) => `${it.quantity}x ${it.productName || 'Product'}`)
          .join(', ')
        const storeObj = stores.find(s => s.id === saleData.storeId)
        const locName = saleData.storeName || storeObj?.name || 'Store 1'

        await logAuditAction({
          action: 'SALE_RECORDED',
          description: `Sold ${itemsSummary} via ${saleData.paymentMethod}${saleData.bankProvider ? ` (${saleData.bankProvider})` : ''} at ${locName} (${created.receiptNumber} • ${formatCurrency(saleData.totalAmount)})`,
          target: locName,
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

      const matchedSale = sales.find(s => s.id === saleId)
      await logAuditAction({
        action: 'CREDIT_SALE_SETTLED',
        description: `Settled unpaid credit sale ${matchedSale?.invoiceNumber ? `(${matchedSale.invoiceNumber})` : ''} for ${matchedSale?.customerName || 'Customer'} via ${settledPaymentMethod}${bankProvider ? ` (${bankProvider})` : ''}`,
        target: matchedSale?.invoiceNumber || matchedSale?.customerName || 'Credit Sale',
      })
      return true
    } catch (err) {
      console.error('settleCreditSale failed:', err)
      return false
    }
  }

  // ─── Commission Settlement & Analytics Actions ───────────────────────────

  const getStaffCommissionStats = useCallback(
    (staffMemberOrId) => {
      if (!staffMemberOrId) {
        return {
          unsettledAmount: 0,
          unsettledSales: [],
          settledAmount: 0,
          settlements: [],
          totalEarned: 0,
        }
      }

      // Check if we can find associated staff member in the staff list
      const staffMember =
        typeof staffMemberOrId === 'object'
          ? staffMemberOrId
          : staff.find(
              (st) =>
                st.id === staffMemberOrId ||
                st._id === staffMemberOrId ||
                st.userId === staffMemberOrId
            )

      const candidateIds = new Set()
      if (typeof staffMemberOrId === 'string') {
        candidateIds.add(staffMemberOrId)
      } else if (staffMemberOrId) {
        if (staffMemberOrId.id) candidateIds.add(String(staffMemberOrId.id))
        if (staffMemberOrId._id) candidateIds.add(String(staffMemberOrId._id))
        if (staffMemberOrId.userId) candidateIds.add(String(staffMemberOrId.userId))
      }
      if (staffMember) {
        if (staffMember.id) candidateIds.add(String(staffMember.id))
        if (staffMember._id) candidateIds.add(String(staffMember._id))
        if (staffMember.userId) candidateIds.add(String(staffMember.userId))
      }

      const candidateNames = new Set()
      if (typeof staffMemberOrId === 'object' && staffMemberOrId?.name) {
        candidateNames.add(staffMemberOrId.name.trim().toLowerCase())
      }
      if (staffMember?.name) {
        candidateNames.add(staffMember.name.trim().toLowerCase())
      }

      const matchingSales = sales.filter((s) => {
        const sSalespersonId = s.salespersonId ? String(s.salespersonId) : null
        const sStaffId = s.staffId ? String(s.staffId) : null
        const idMatch =
          (sSalespersonId && candidateIds.has(sSalespersonId)) ||
          (sStaffId && candidateIds.has(sStaffId))

        const sSalespersonName = s.salespersonName ? s.salespersonName.trim().toLowerCase() : ''
        const sStaffName = s.staffName ? s.staffName.trim().toLowerCase() : ''
        const nameMatch =
          (sSalespersonName && candidateNames.has(sSalespersonName)) ||
          (sStaffName && candidateNames.has(sStaffName))

        return Boolean(idMatch || nameMatch)
      })

      const unsettledSales = matchingSales.filter(
        (s) => !s.commissionSettled && (s.commissionTotal || s.commission || 0) > 0
      )
      const unsettledAmount = unsettledSales.reduce(
        (sum, s) => sum + (s.commissionTotal || s.commission || 0),
        0
      )

      const matchingSettlements = commissionSettlements.filter((cs) => {
        const csStaffId = cs.staffId ? String(cs.staffId) : null
        const idMatch = csStaffId && candidateIds.has(csStaffId)
        const csStaffName = cs.staffName ? cs.staffName.trim().toLowerCase() : ''
        const nameMatch = csStaffName && candidateNames.has(csStaffName)
        return Boolean(idMatch || nameMatch)
      })
      const settledAmount = matchingSettlements.reduce((sum, cs) => sum + (cs.amount || 0), 0)

      return {
        unsettledAmount,
        unsettledSales,
        settledAmount,
        settlements: matchingSettlements,
        totalEarned: unsettledAmount + settledAmount,
      }
    },
    [sales, commissionSettlements, staff]
  )

  const currentUserCommissionStats = useMemo(() => {
    if (!currentUser) {
      return {
        unsettledAmount: 0,
        unsettledSales: [],
        settledAmount: 0,
        settlements: [],
        totalEarned: 0,
      }
    }
    return getStaffCommissionStats(currentUser)
  }, [currentUser, getStaffCommissionStats])

  const settleStaffCommission = async ({
    staffId,
    staffName,
    amount,
    paymentMethod = 'Cash',
    bankProvider = null,
    reference = null,
    notes = null,
  }) => {
    try {
      const targetStats = getStaffCommissionStats({ id: staffId, name: staffName })
      const unsettledSaleIds = (targetStats?.unsettledSales || []).map((s) => String(s.id || s._id))

      let settlementId = `cset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      // 1. Persist directly to Convex database (updates sales to commissionSettled: true and inserts commissionSettlements record)
      if (clientId) {
        try {
          const res = await settleStaffCommissionMutation({
            clientId,
            staffId: String(staffId),
            staffName: String(staffName),
            amount: parseFloat(amount) || 0,
            paymentMethod,
            bankProvider: bankProvider || undefined,
            reference: reference || undefined,
            notes: notes || undefined,
            settledByUserId: currentUser?.id || 'owner',
            settledByUserName: currentUser?.name || 'Owner',
            saleIds: unsettledSaleIds,
          })
          if (res?.settlementId) {
            settlementId = String(res.settlementId)
          }
        } catch (convexErr) {
          console.warn('Convex settleStaffCommissionMutation warning:', convexErr)
        }
      }

      // 2. Also record in local state and localStorage for instant zero-latency optimistic feedback
      const newSettlement = {
        id: settlementId,
        _id: settlementId,
        clientId,
        staffId,
        staffName,
        amount: parseFloat(amount) || 0,
        salesCount: unsettledSaleIds.length,
        settledSaleIds: unsettledSaleIds,
        paymentMethod,
        bankProvider: bankProvider || null,
        reference: reference || null,
        notes: notes || null,
        settledByUserId: currentUser?.id || 'owner',
        settledByUserName: currentUser?.name || 'Owner',
        createdAt: new Date().toISOString(),
      }

      // Persist settlement to local and organization storage
      saveSettlements([newSettlement, ...localSettlements])

      // Record to auditLogs on Convex
      try {
        await logAuditAction({
          action: 'COMMISSION_SETTLED',
          description: `Settled ${parseFloat(amount).toFixed(2)} ETB commission for ${staffName} via ${paymentMethod} (${unsettledSaleIds.length} sales cleared)${reference ? ` [Ref: ${reference}]` : ''}`,
          target: staffName,
        })
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr)
      }

      // Dispatch Telegram Notification to registered business owners
      try {
        const botToken = '8862271033:AAHoUK5i_r_DaYxHKUMlEyXHvOaTtmGOt-Q'
        const defaultChatId = '5069830125'
        const text = `💰 <b>Staff Commission Settled & Paid</b>\n\n` +
          `👤 <b>Staff Member:</b> ${staffName}\n` +
          `💵 <b>Amount Paid:</b> ${parseFloat(amount).toFixed(2)} ETB\n` +
          `📊 <b>Sales Cleared:</b> ${unsettledSaleIds.length}\n` +
          `💳 <b>Payment Method:</b> ${paymentMethod}${bankProvider ? ` (${bankProvider})` : ''}\n` +
          (reference ? `🔢 <b>Reference / Slip:</b> ${reference}\n` : '') +
          (notes ? `📝 <b>Notes:</b> ${notes}\n` : '') +
          `✍️ <b>Settled By:</b> ${currentUser?.name || 'Owner'}\n` +
          `📅 <b>Date:</b> ${new Date().toLocaleString()}\n\n` +
          `<i>Status: Staff commission balance cleared to 0 ETB (showing "No commissions earned yet").</i>`

        const chatIds = new Set([defaultChatId])
        if (Array.isArray(telegramSubscribersData)) {
          telegramSubscribersData.forEach(sub => {
            if (sub.chatId) chatIds.add(String(sub.chatId))
          })
        }

        for (const chatId of chatIds) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
            })
          }).catch(err => console.warn('Telegram send failed for chat', chatId, err))
        }
      } catch (tgErr) {
        console.warn('Telegram commission settlement notification warning:', tgErr)
      }

      return {
        success: true,
        settlementId,
        salesCount: unsettledSaleIds.length,
      }
    } catch (err) {
      console.error('settleStaffCommission failed:', err)
      throw err
    }
  }

  // ─── Staff & Business Actions ────────────────────────────────────────────

  const approveStaffMember = async (staffId, storeId) => {
    try {
      const storeObj = stores.find(s => s.id === storeId || s._id === storeId)
      await approveStaffMutation({
        staffId,
        storeId: storeId || undefined,
        storeName: storeObj?.name || undefined,
      })
      const matchedStaff = staff.find(s => s.id === staffId)
      await logAuditAction({
        action: 'STAFF_UPDATED',
        description: `Approved salesperson access for ${matchedStaff?.name || 'Staff Member'}${storeObj ? ` at ${storeObj.name}` : ''}`,
        target: matchedStaff?.name || 'Staff Member',
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
      const matchedStaff = staff.find(s => s.id === staffId)
      await logAuditAction({
        action: 'STAFF_UPDATED',
        description: `Rejected salesperson application for ${matchedStaff?.name || 'Staff Member'}`,
        target: matchedStaff?.name || 'Staff Member',
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
      const matchedStaff = staff.find(s => s.id === staffId)
      await logAuditAction({
        action: 'STAFF_UPDATED',
        description: `Removed staff member ${matchedStaff?.name || 'Staff Member'}`,
        target: matchedStaff?.name || 'Staff Member',
      })
      return true
    } catch (err) {
      console.error('deleteStaffMember failed:', err)
      return false
    }
  }

  const saveStaffMember = async (member, actor) => {
    const staffId = member.id || member._id
    if (!staffId) return false
    try {
      const storeObj = stores.find(s => s.id === member.storeId || s._id === member.storeId)
      const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin'
      await updateStaffMemberMutation({
        staffId,
        name: member.name,
        role: member.role || 'salesperson',
        status: member.status || 'approved',
        storeId: member.storeId || undefined,
        storeName: storeObj?.name || member.storeName || undefined,
        allowCreditSales: isOwnerOrAdmin ? true : (member.allowCreditSales ?? true),
        canManageStock: isOwnerOrAdmin ? true : Boolean(member.canManageStock),
        canManageStaff: isOwnerOrAdmin ? true : Boolean(member.canManageStaff),
      })

      const actorInfo = actor || currentUser
      await logAuditAction({
        actorId: actorInfo?.id,
        actorName: actorInfo?.name,
        role: actorInfo?.role,
        action: 'STAFF_UPDATED',
        description: `Updated access permissions for ${member.name}: Role=${member.role}, Status=${member.status}${storeObj ? `, Store=${storeObj.name}` : ''}`,
        target: member.name,
      })
      return true
    } catch (err) {
      console.error('saveStaffMember failed:', err)
      throw err
    }
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
        target: newName.trim(),
      })
    } catch (err) {
      console.error('updateBusinessName failed:', err)
    }
  }

  const overrideStock = async (locationIdOrObj, locationName, locationType, productId, productName, newQuantity) => {
    let locId = locationIdOrObj
    let locName = locationName
    let locType = locationType
    let prodId = productId
    let prodName = productName
    let newQty = newQuantity

    if (typeof locationIdOrObj === 'object' && locationIdOrObj !== null) {
      locId = locationIdOrObj.locationId
      locName = locationIdOrObj.locationName
      locType = locationIdOrObj.locationType
      prodId = locationIdOrObj.productId
      prodName = locationIdOrObj.productName
      newQty = locationIdOrObj.newQuantity
    }

    try {
      await overrideStockMutation({
        locationType: locType,
        locationId: locId,
        productId: prodId,
        newQuantity: parseInt(newQty, 10) || 0,
      })
      await logAuditAction({
        action: 'STOCK_OVERRIDE',
        description: `Overrode stock for "${prodName || 'Product'}" to ${newQty} in ${locName || 'location'}`,
        target: locName || 'location',
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
        target: name.trim(),
      })
      return res
    } catch (err) {
      console.error('addStore failed:', err)
      return null
    }
  }

  const deleteStore = async (storeId) => {
    try {
      const stName = stores.find(s => s.id === storeId)?.name || 'Store Branch'
      await deleteStoreMutation({ storeId })
      await logAuditAction({
        action: 'STORE_DELETED',
        description: `Deleted retail store branch "${stName}"`,
        target: stName,
      })
      return true
    } catch (err) {
      console.error('deleteStore failed:', err)
      return false
    }
  }

  // Bulk import products and stock allocations from Excel
  const bulkImportInventory = async (items, clearExisting = false) => {
    if (!clientId) return null
    try {
      const res = await bulkImportInventoryMutation({
        clientId,
        items,
        clearExisting,
      })
      return res
    } catch (err) {
      console.error('bulkImportInventory failed:', err)
      throw err
    }
  }

  // Clear products, sales, and reset inventory stock to {} for the active client
  const clearDatabaseData = async () => {
    if (!clientId) return false
    try {
      await clearOrganizationDataMutation({ clientId })
      return true
    } catch (err) {
      console.error('clearDatabaseData failed:', err)
      throw err
    }
  }

  // Wipe client organization and all associated data, returning user to initial onboarding
  const wipeAndResetAccount = async () => {
    if (!clientId) return false
    try {
      await wipeClientAndResetMutation({ clientId })
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
        pendingApprovals,
        approvalHistory,
        loading,
        isFirebaseLive: true,
        // Methods
        createProduct,
        updateProduct,
        deleteProduct,
        seedSampleInventory,
        bulkImportInventory,
        transferStock,
        recordWarehouseInbound,
        recordDirectPurchase,
        submitTransferRequest,
        submitDirectPurchaseRequest,
        approveApprovalRequest,
        rejectApprovalRequest,
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
        // Staff Commission Tracking & Settlement
        commissionSettlements,
        getStaffCommissionStats,
        currentUserCommissionStats,
        settleStaffCommission,
        // Telegram Bot Real-time Sync
        telegramSubscribers: telegramSubscribersData || [],
        ensureTelegramWebhook: () => ensureTelegramWebhookAction({}),
        getTelegramBotInfo: () => getTelegramBotInfoAction({}),
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
