import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  writeBatch, increment, query, orderBy, limit, getDocs, getDoc, setDoc, where, arrayUnion
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { getTenantCollections } from '../lib/firestore-collections'
import { generateCompanyCode } from '../lib/utils'
import { useAuth } from './AuthContext'

export const TenantContext = createContext(null)

const getAvatar = (name = '', email = '') => {
  if (name && name.trim()) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'LG'
}

const toIso = (ts) => {
  if (!ts) return new Date().toISOString()
  if (typeof ts === 'string') return ts
  if (ts?.toDate) return ts.toDate().toISOString()
  return new Date().toISOString()
}

export function TenantProvider({ children }) {
  const { firebaseUser } = useAuth()

  // Organizations list
  const [organizations, setOrganizations] = useState([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [activeOrg, setActiveOrg] = useState(null)

  // Salesperson Pending Approval Lockout State
  const [isStaffPending, setIsStaffPending] = useState(false)
  const [pendingOrgInfo, setPendingOrgInfo] = useState(null)
  const [checkingApproval, setCheckingApproval] = useState(true)

  // Live collection state for active organization
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stores, setStores] = useState([])
  const [staff, setStaff] = useState([])
  const [sales, setSales] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)

  // Quick switch / session state inside active organization
  const [activeStaffUser, setActiveStaffUser] = useState(null)
  const [isPasscodeLocked, setIsPasscodeLocked] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  // ─── 1. Query Organizations & Staff Approval for Authenticated User ────────
  useEffect(() => {
    if (!db || !isFirebaseConfigured || !firebaseUser) {
      setOrganizations([])
      setActiveOrg(null)
      setIsStaffPending(false)
      setPendingOrgInfo(null)
      setOrgsLoading(false)
      setCheckingApproval(false)
      return
    }

    setOrgsLoading(true)
    setCheckingApproval(true)

    const unsubs = []
    const clientsRef = collection(db, 'clients')
    const userDocRef = doc(db, 'users', firebaseUser.uid)

    // A. Listen to top-level /users/{uid} document for role, orgId, and approval status
    const unsubUserDoc = onSnapshot(userDocRef, async (userSnap) => {
      if (userSnap.exists()) {
        const uData = userSnap.data()
        if (uData.role === 'salesperson') {
          if (uData.status === 'pending' || uData.status === 'rejected') {
            setIsStaffPending(true)
            setPendingOrgInfo({
              id: uData.orgId,
              name: uData.orgName || 'Your Organization',
              companyCode: uData.companyCode || '------',
              status: uData.status,
            })
            setCheckingApproval(false)
          } else if (uData.status === 'approved') {
            setIsStaffPending(false)
            setPendingOrgInfo(null)
            setCheckingApproval(false)
          }
        } else if (uData.role === 'owner') {
          setIsStaffPending(false)
          setPendingOrgInfo(null)
          setCheckingApproval(false)
        }
      }
    }, (err) => {
      console.warn('Error reading user profile doc:', err)
    })
    unsubs.push(unsubUserDoc)

    // B. Query organizations where user is owner OR member
    const ownerQuery = query(clientsRef, where('ownerUid', '==', firebaseUser.uid))
    const userEmail = (firebaseUser.email || '').toLowerCase()
    const memberQuery = userEmail ? query(clientsRef, where('members', 'array-contains', userEmail)) : null

    let ownedOrgs = []
    let memberOrgs = []

    const mergeAndSetOrgs = async () => {
      const orgMap = new Map()
      ownedOrgs.forEach(o => orgMap.set(o.id, o))
      memberOrgs.forEach(o => {
        if (!orgMap.has(o.id)) orgMap.set(o.id, o)
      })
      const merged = Array.from(orgMap.values())

      // Auto-backfill 6-digit companyCode if missing on any organization
      for (const org of merged) {
        if (!org.companyCode) {
          const newCode = generateCompanyCode()
          org.companyCode = newCode
          try {
            await updateDoc(doc(db, 'clients', org.id), { companyCode: newCode })
          } catch (e) {
            console.warn('Could not backfill company code:', e)
          }
        }
      }

      setOrganizations(merged)
      setOrgsLoading(false)

      // If user is owner of any organization, they are not pending
      const isUserOwnerOfAny = merged.some(o => o.ownerUid === firebaseUser.uid)
      if (isUserOwnerOfAny) {
        setIsStaffPending(false)
        setPendingOrgInfo(null)
        setCheckingApproval(false)
      }

      // Check staff collection in member orgs to see if user is pending approval
      if (!isUserOwnerOfAny && merged.length > 0) {
        for (const org of merged) {
          try {
            const staffQ = query(
              collection(db, 'clients', org.id, 'staff'),
              where('email', '==', userEmail)
            )
            const staffSnap = await getDocs(staffQ)
            if (!staffSnap.empty) {
              const staffData = staffSnap.docs[0].data()
              if (staffData.status === 'pending' || (staffData.active === false && staffData.status !== 'approved')) {
                setIsStaffPending(true)
                setPendingOrgInfo({
                  id: org.id,
                  name: org.name || org.businessName,
                  companyCode: org.companyCode,
                  status: 'pending',
                })
                setCheckingApproval(false)
                return
              } else if (staffData.status === 'approved' || staffData.active === true) {
                setIsStaffPending(false)
                setPendingOrgInfo(null)
                setCheckingApproval(false)
                if (!activeOrg) {
                  setActiveOrg(org)
                  localStorage.setItem('omestock_active_org_id', org.id)
                }
                return
              }
            }
          } catch (e) {
            console.warn('Staff query error:', e)
          }
        }
      }

      setCheckingApproval(false)

      // Auto-restore previously selected active organization from localStorage
      const savedOrgId = localStorage.getItem('omestock_active_org_id')
      if (savedOrgId) {
        const found = merged.find(o => o.id === savedOrgId)
        if (found) {
          setActiveOrg(found)
          return
        }
      }

      // If exactly 1 organization exists and none active, auto-select it
      if (merged.length === 1 && !activeOrg) {
        setActiveOrg(merged[0])
        localStorage.setItem('omestock_active_org_id', merged[0].id)
      }
    }

    const unsubOwner = onSnapshot(ownerQuery, (snap) => {
      ownedOrgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      mergeAndSetOrgs()
    }, (err) => {
      console.error('Owner organizations listener error:', err)
      setOrgsLoading(false)
      setCheckingApproval(false)
    })
    unsubs.push(unsubOwner)

    if (memberQuery) {
      const unsubMember = onSnapshot(memberQuery, (snap) => {
        memberOrgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        mergeAndSetOrgs()
      }, (err) => {
        console.error('Member organizations listener error:', err)
        setOrgsLoading(false)
        setCheckingApproval(false)
      })
      unsubs.push(unsubMember)
    }

    return () => unsubs.forEach(u => u())
  }, [firebaseUser?.uid, firebaseUser?.email])

  // Manual refresh of approval status
  const refreshApprovalStatus = useCallback(async () => {
    if (!db || !firebaseUser) return
    setCheckingApproval(true)
    try {
      const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (userSnap.exists()) {
        const uData = userSnap.data()
        if (uData.role === 'salesperson') {
          if (uData.status === 'pending' || uData.status === 'rejected') {
            setIsStaffPending(true)
            setPendingOrgInfo({
              id: uData.orgId,
              name: uData.orgName || 'Your Organization',
              companyCode: uData.companyCode || '------',
              status: uData.status,
            })
          } else if (uData.status === 'approved') {
            setIsStaffPending(false)
            setPendingOrgInfo(null)
          }
        }
      }
    } catch (err) {
      console.error('refreshApprovalStatus failed:', err)
    } finally {
      setCheckingApproval(false)
    }
  }, [firebaseUser])

  // Select active organization
  const selectOrganization = (org) => {
    setActiveOrg(org)
    if (org?.id) {
      localStorage.setItem('omestock_active_org_id', org.id)
    } else {
      localStorage.removeItem('omestock_active_org_id')
    }
  }

  // Clear active organization (return to Org Hub)
  const clearActiveOrganization = () => {
    setActiveOrg(null)
    localStorage.removeItem('omestock_active_org_id')
  }

  // ─── 2. Create New Organization ───────────────────────────────────────────
  const createOrganization = async ({ name, currency = 'ETB', initialStoreName, storeLocation }) => {
    if (!db || !firebaseUser) throw new Error('Database or user not available')
    const orgId = `org-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    const orgRef = doc(db, 'clients', orgId)
    const companyCode = generateCompanyCode()

    const orgData = {
      id: orgId,
      name: name.trim(),
      businessName: name.trim(),
      companyCode,
      ownerUid: firebaseUser.uid,
      ownerEmail: firebaseUser.email,
      currency: currency || 'ETB',
      members: [firebaseUser.email.toLowerCase()],
      createdAt: new Date().toISOString(),
      setupComplete: true,
    }

    await setDoc(orgRef, orgData)

    // Also update /users/{uid} document
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || name.trim(),
      email: firebaseUser.email.toLowerCase(),
      role: 'owner',
      orgId,
      companyCode,
      status: 'approved',
      createdAt: new Date().toISOString(),
    }, { merge: true })

    // Provision Central Warehouse
    const whRef = doc(collection(db, 'clients', orgId, 'warehouses'))
    await setDoc(whRef, {
      name: 'Central Warehouse',
      location: 'Main Distribution Hub',
      isCentral: true,
      stock: {},
    })

    // Provision Initial Store
    const storeName = initialStoreName?.trim() || 'Main Branch'
    const storeRef = doc(collection(db, 'clients', orgId, 'stores'))
    await setDoc(storeRef, {
      name: storeName,
      location: storeLocation?.trim() || 'Primary Storefront',
      isWarehouse: false,
      stock: {},
    })

    // Provision Owner Staff Record
    const staffRef = doc(collection(db, 'clients', orgId, 'staff'))
    await setDoc(staffRef, {
      name: firebaseUser.displayName || 'Business Owner',
      email: firebaseUser.email.toLowerCase(),
      role: 'owner',
      status: 'approved',
      storeId: null,
      passcode: '0000',
      active: true,
      totalCommissionsEarned: 0,
    })

    // Audit log
    const auditRef = doc(collection(db, 'clients', orgId, 'audit_logs'))
    await setDoc(auditRef, {
      actorId: firebaseUser.uid,
      actorName: firebaseUser.displayName || firebaseUser.email,
      role: 'owner',
      action: 'ORGANIZATION_CREATED',
      description: `Created organization "${name.trim()}" with code ${companyCode} and primary store "${storeName}"`,
      target: orgId,
      timestamp: new Date().toISOString(),
    })

    selectOrganization(orgData)
    return orgData
  }

  // ─── 3. Real-Time Listeners for active organization ───────────────────────
  const clientId = activeOrg?.id
  const tenantName = activeOrg?.name || activeOrg?.businessName || 'OMESTOCK'


  useEffect(() => {
    if (!db || !isFirebaseConfigured || !clientId) {
      setProducts([])
      setWarehouses([])
      setStores([])
      setStaff([])
      setSales([])
      setAuditLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    let resolved = 0
    const needed = 6
    const tryResolve = () => {
      resolved++
      if (resolved >= needed) setLoading(false)
    }

    const cols = getTenantCollections(db, clientId)
    const unsubs = [
      onSnapshot(cols.products, (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        tryResolve()
      }, () => tryResolve()),

      onSnapshot(cols.warehouses, (snap) => {
        setWarehouses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        tryResolve()
      }, () => tryResolve()),

      onSnapshot(cols.stores, (snap) => {
        setStores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        tryResolve()
      }, () => tryResolve()),

      onSnapshot(cols.staff, (snap) => {
        setStaff(snap.docs.map(d => ({ id: d.id, ...d.data(), avatar: getAvatar(d.data().name, d.data().email) })))
        tryResolve()
      }, () => tryResolve()),

      onSnapshot(
        query(cols.sales, orderBy('timestamp', 'desc'), limit(500)),
        (snap) => {
          setSales(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toIso(d.data().timestamp) })))
          tryResolve()
        },
        () => tryResolve()
      ),

      onSnapshot(
        query(cols.auditLogs, orderBy('timestamp', 'desc'), limit(300)),
        (snap) => {
          setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toIso(d.data().timestamp) })))
          tryResolve()
        },
        () => tryResolve()
      ),
    ]

    return () => unsubs.forEach(u => u())
  }, [clientId])

  // ─── 4. Current User & Permissions ─────────────────────────────────────────
  const isOrgOwner = activeOrg?.ownerUid === firebaseUser?.uid
  const matchingStaff = staff.find(s => s.email?.toLowerCase() === firebaseUser?.email?.toLowerCase())

  // Effective current user (either actively switched staff member or the authenticated owner/staff)
  const currentUser = activeStaffUser || {
    id: matchingStaff?.id || firebaseUser?.uid || 'user-default',
    name: matchingStaff?.name || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'User',
    email: firebaseUser?.email || '',
    role: isOrgOwner ? 'owner' : (matchingStaff?.role || 'salesperson'),
    storeId: matchingStaff?.storeId || null,
    avatar: getAvatar(matchingStaff?.name || firebaseUser?.displayName, firebaseUser?.email),
    passcode: matchingStaff?.passcode || '0000',
  }

  const isOwner = currentUser.role === 'owner' || isOrgOwner
  const isSalesperson = currentUser.role === 'salesperson'

  const permissions = {
    isOwner,
    isSalesperson,
    canViewAuditTrail: isOwner,
    canManageStaff: isOwner,
    canViewAnalytics: isOwner,
    canAccessInventoryFlow: true,
    canProcessSale: true,
  }

  // Switch active staff member on POS terminal
  const switchUser = (userId) => {
    const user = staff.find(u => u.id === userId)
    if (!user) return
    if (user.role === 'salesperson') {
      setPendingUser(user)
      setIsPasscodeLocked(true)
    } else {
      setActiveStaffUser(user)
      setIsPasscodeLocked(false)
      setPendingUser(null)
    }
  }

  const verifyPasscode = (pin) => {
    const targetUser = pendingUser || currentUser
    if (targetUser && targetUser.passcode === pin) {
      if (pendingUser) {
        setActiveStaffUser(pendingUser)
        setPendingUser(null)
      }
      setIsPasscodeLocked(false)
      return { success: true }
    }
    return { success: false, error: 'Incorrect 4-digit passcode' }
  }

  const lockSession = () => setIsPasscodeLocked(true)

  // ─── 5. Audit Logger ───────────────────────────────────────────────────────
  const logAuditAction = async ({ actorId, actorName, role, action, description, target }) => {
    if (!db || !clientId) return
    try {
      const cols = getTenantCollections(db, clientId)
      await addDoc(cols.auditLogs, {
        actorId: actorId || currentUser.id,
        actorName: actorName || currentUser.name,
        role: role || currentUser.role,
        action,
        description,
        target: target || 'general',
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error('logAuditAction error:', err)
    }
  }

  // ─── 6. Store & Warehouse Mutations ────────────────────────────────────────
  const updateBusinessName = async (newName) => {
    if (!db || !clientId || !newName.trim()) return
    await updateDoc(doc(db, 'clients', clientId), {
      name: newName.trim(),
      businessName: newName.trim(),
    })
    setActiveOrg(prev => prev ? { ...prev, name: newName.trim(), businessName: newName.trim() } : prev)
  }

  const recordSale = async (saleData, currentStaff) => {
    if (!db || !clientId) return null
    try {
      const cols = getTenantCollections(db, clientId)
      const batch = writeBatch(db)

      const saleRef = doc(cols.sales)
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      const commissionTotal = saleData.items.reduce((sum, item) => sum + (item.commissionAmount || 0), 0)
      const timestamp = new Date().toISOString()

      const newSale = {
        invoiceNumber,
        storeId: saleData.storeId,
        storeName: saleData.storeName,
        salespersonId: currentStaff?.id || currentUser.id,
        salespersonName: currentStaff?.name || currentUser.name,
        items: saleData.items,
        subtotal: saleData.totalAmount,
        totalAmount: saleData.totalAmount,
        paymentMethod: saleData.paymentMethod,
        bankProvider: saleData.bankProvider || null,
        bankRef: saleData.bankRef || null,
        paymentStatus: saleData.paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
        customerName: saleData.customerName || 'Walk-in Customer',
        customerPhone: saleData.customerPhone || '',
        commissionTotal,
        timestamp,
      }

      batch.set(saleRef, newSale)

      const storeRef = doc(db, 'clients', clientId, 'stores', saleData.storeId)
      const stockUpdates = {}
      saleData.items.forEach(item => {
        stockUpdates[`stock.${item.productId}`] = increment(-item.quantity)
      })
      batch.update(storeRef, stockUpdates)

      if (currentStaff?.id && commissionTotal > 0) {
        const staffRef = doc(db, 'clients', clientId, 'staff', currentStaff.id)
        batch.update(staffRef, { totalCommissionsEarned: increment(commissionTotal) })
      }

      await batch.commit()

      await logAuditAction({
        action: 'SALE_RECORDED',
        description: `Recorded ${saleData.paymentMethod} sale ${invoiceNumber} (ETB ${saleData.totalAmount.toFixed(2)})`,
        target: saleData.storeId,
      })

      return { id: saleRef.id, ...newSale }
    } catch (err) {
      console.error('recordSale failed:', err)
      throw err
    }
  }

  const settleCreditSale = async (saleId, settledPaymentMethod = 'Cash', bankProvider = null, currentStaff) => {
    if (!db || !clientId) return
    try {
      const saleRef = doc(db, 'clients', clientId, 'sales', saleId)
      await updateDoc(saleRef, {
        paymentStatus: 'Paid',
        settledAt: new Date().toISOString(),
        settledPaymentMethod,
        settledBankProvider: settledPaymentMethod === 'Banking' ? bankProvider : null,
      })
      await logAuditAction({
        action: 'CREDIT_SALE_SETTLED',
        description: `Settled credit sale ${saleId} via ${settledPaymentMethod}`,
        target: saleId,
      })
    } catch (err) {
      console.error('settleCreditSale failed:', err)
    }
  }

  const transferStock = async ({ fromWarehouseId, toStoreId, productId, quantity }) => {
    if (!db || !clientId) return false
    const qty = parseInt(quantity, 10)
    if (!qty || qty <= 0) return false
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'clients', clientId, 'warehouses', fromWarehouseId), { [`stock.${productId}`]: increment(-qty) })
      batch.update(doc(db, 'clients', clientId, 'stores', toStoreId), { [`stock.${productId}`]: increment(qty) })
      await batch.commit()

      await logAuditAction({
        action: 'STOCK_TRANSFER',
        description: `Transferred ${qty}x of ${productId} from warehouse to store`,
        target: `${fromWarehouseId} -> ${toStoreId}`,
      })
      return true
    } catch (err) {
      console.error('transferStock failed:', err)
      return false
    }
  }

  const recordDirectPurchase = async ({ storeId, productId, quantity, costPerUnit, paymentMethod, bankProvider, supplierName }) => {
    if (!db || !clientId) return false
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(costPerUnit) || 0
    try {
      await updateDoc(doc(db, 'clients', clientId, 'stores', storeId), { [`stock.${productId}`]: increment(qty) })
      await logAuditAction({
        action: 'DIRECT_STORE_PURCHASE',
        description: `Direct purchase: ${qty}x of ${productId} (ETB ${(qty * cost).toFixed(2)})`,
        target: storeId,
      })
      return true
    } catch (err) {
      console.error('recordDirectPurchase failed:', err)
      return false
    }
  }

  const recordWarehouseInbound = async ({ warehouseId, productId, quantity, costPerUnit, paymentMethod, bankProvider, supplierName }) => {
    if (!db || !clientId) return false
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(costPerUnit) || 0
    try {
      await updateDoc(doc(db, 'clients', clientId, 'warehouses', warehouseId), { [`stock.${productId}`]: increment(qty) })
      await logAuditAction({
        action: 'WAREHOUSE_INBOUND',
        description: `Inbound restock: ${qty}x of ${productId} (ETB ${(qty * cost).toFixed(2)})`,
        target: warehouseId,
      })
      return true
    } catch (err) {
      console.error('recordWarehouseInbound failed:', err)
      return false
    }
  }

  const createProduct = async ({ name, category, sellingPrice, costPrice, defaultCommissionRate, minStockThreshold }) => {
    if (!db || !clientId) return null
    try {
      const cols = getTenantCollections(db, clientId)
      const newProd = {
        name,
        category: category || 'General',
        sellingPrice: parseFloat(sellingPrice) || 0,
        costPrice: parseFloat(costPrice) || 0,
        defaultCommissionRate: parseFloat(defaultCommissionRate) || 5,
        minStockThreshold: parseInt(minStockThreshold, 10) || 10,
      }
      const prodRef = await addDoc(cols.products, newProd)
      const newId = prodRef.id

      if (warehouses.length > 0 || stores.length > 0) {
        const batch = writeBatch(db)
        warehouses.forEach(wh => {
          batch.update(doc(db, 'clients', clientId, 'warehouses', wh.id), { [`stock.${newId}`]: 0 })
        })
        stores.forEach(st => {
          batch.update(doc(db, 'clients', clientId, 'stores', st.id), { [`stock.${newId}`]: 0 })
        })
        await batch.commit()
      }

      await logAuditAction({
        action: 'PRODUCT_CREATED',
        description: `Created catalog product "${newProd.name}"`,
        target: newId,
      })
      return { id: newId, ...newProd }
    } catch (err) {
      console.error('createProduct failed:', err)
      return null
    }
  }

  const updateProduct = async (productId, updates) => {
    if (!db || !clientId) return false
    try {
      const toUpdate = {}
      if (updates.sellingPrice !== undefined) toUpdate.sellingPrice = parseFloat(updates.sellingPrice)
      if (updates.costPrice !== undefined) toUpdate.costPrice = parseFloat(updates.costPrice)
      if (updates.defaultCommissionRate !== undefined) toUpdate.defaultCommissionRate = parseFloat(updates.defaultCommissionRate)
      if (updates.minStockThreshold !== undefined) toUpdate.minStockThreshold = parseInt(updates.minStockThreshold, 10)
      await updateDoc(doc(db, 'clients', clientId, 'products', productId), toUpdate)
      return true
    } catch (err) {
      console.error('updateProduct failed:', err)
      return false
    }
  }

  const overrideStock = async ({ locationId, locationType, productId, newQuantity, reason }) => {
    if (!db || !clientId) return false
    const newQty = parseInt(newQuantity, 10)
    if (isNaN(newQty) || newQty < 0) return false
    try {
      const locationPath = locationType === 'warehouse' ? 'warehouses' : 'stores'
      await updateDoc(doc(db, 'clients', clientId, locationPath, locationId), { [`stock.${productId}`]: newQty })
      await logAuditAction({
        action: 'INVENTORY_OVERRIDE',
        description: `Override stock for ${productId} at ${locationId} to ${newQty}. Reason: ${reason || 'Physical Count'}`,
        target: locationId,
      })
      return true
    } catch (err) {
      console.error('overrideStock failed:', err)
      return false
    }
  }

  const addStore = async ({ name, location }) => {
    if (!db || !clientId) return null
    try {
      const cols = getTenantCollections(db, clientId)
      const initialStock = {}
      products.forEach(p => { initialStock[p.id] = 0 })
      const newStore = { name, location: location || 'New Branch', isWarehouse: false, stock: initialStock }
      const storeRef = await addDoc(cols.stores, newStore)
      await logAuditAction({
        action: 'STORE_CREATED',
        description: `Created new retail store: "${name}"`,
        target: storeRef.id,
      })
      return { id: storeRef.id, ...newStore }
    } catch (err) {
      console.error('addStore failed:', err)
      return null
    }
  }

  const deleteStore = async (storeId) => {
    if (!db || !clientId) return false
    try {
      await deleteDoc(doc(db, 'clients', clientId, 'stores', storeId))
      await logAuditAction({
        action: 'STORE_DELETED',
        description: `Deleted retail store ${storeId}`,
        target: storeId,
      })
      return true
    } catch (err) {
      console.error('deleteStore failed:', err)
      return false
    }
  }

  const saveStaffMember = async (staffMember) => {
    if (!db || !clientId) return
    try {
      const cols = getTenantCollections(db, clientId)
      if (staffMember.id) {
        const { id, avatar, ...data } = staffMember
        await updateDoc(doc(db, 'clients', clientId, 'staff', id), data)
      } else {
        const { avatar, ...data } = staffMember
        const newDoc = {
          ...data,
          active: true,
          totalCommissionsEarned: 0,
          passcode: staffMember.passcode || '1234',
        }
        await addDoc(cols.staff, newDoc)
      }
    } catch (err) {
      console.error('saveStaffMember failed:', err)
    }
  }

  const approveStaffMember = async (staffMemberId, storeId) => {
    if (!db || !clientId) return false
    try {
      const targetStaff = staff.find(s => s.id === staffMemberId)
      const staffDocRef = doc(db, 'clients', clientId, 'staff', staffMemberId)
      
      const updateData = {
        status: 'approved',
        active: true,
        approvedAt: new Date().toISOString(),
        approvedBy: firebaseUser?.uid,
      }
      if (storeId) {
        updateData.storeId = storeId
      }

      await updateDoc(staffDocRef, updateData)

      // Update /users/{uid} document if staff member has linked Firebase Auth UID
      if (targetStaff?.uid) {
        try {
          await updateDoc(doc(db, 'users', targetStaff.uid), {
            status: 'approved',
            active: true,
          })
        } catch (e) {
          console.warn('Could not update user doc for approved staff:', e)
        }
      }

      await logAuditAction({
        action: 'STAFF_APPROVED',
        description: `Approved salesperson access for ${targetStaff?.name || staffMemberId} (${targetStaff?.email || ''})`,
        target: staffMemberId,
      })
      return true
    } catch (err) {
      console.error('approveStaffMember failed:', err)
      return false
    }
  }

  const rejectStaffMember = async (staffMemberId) => {
    if (!db || !clientId) return false
    try {
      const targetStaff = staff.find(s => s.id === staffMemberId)
      const staffDocRef = doc(db, 'clients', clientId, 'staff', staffMemberId)

      await updateDoc(staffDocRef, {
        status: 'rejected',
        active: false,
        rejectedAt: new Date().toISOString(),
        rejectedBy: firebaseUser?.uid,
      })

      if (targetStaff?.uid) {
        try {
          await updateDoc(doc(db, 'users', targetStaff.uid), {
            status: 'rejected',
            active: false,
          })
        } catch (e) {
          console.warn('Could not update user doc for rejected staff:', e)
        }
      }

      await logAuditAction({
        action: 'STAFF_REJECTED',
        description: `Declined salesperson access request for ${targetStaff?.name || staffMemberId}`,
        target: staffMemberId,
      })
      return true
    } catch (err) {
      console.error('rejectStaffMember failed:', err)
      return false
    }
  }

  const updateUserPasscode = async (newPin) => {
    if (!db || !clientId) return
    const targetStaff = staff.find(s => s.email?.toLowerCase() === firebaseUser?.email?.toLowerCase())
    if (targetStaff?.id) {
      await updateDoc(doc(db, 'clients', clientId, 'staff', targetStaff.id), {
        passcode: newPin,
      })
    }
  }

  return (
    <TenantContext.Provider value={{
      organizations,
      orgsLoading,
      activeOrg,
      companyCode: activeOrg?.companyCode,
      selectOrganization,
      clearActiveOrganization,
      createOrganization,
      clientId,
      tenantName,
      currency: activeOrg?.currency || 'ETB',
      warehouses,
      stores,
      products,
      staff,
      sales,
      auditLogs,
      loading,
      currentUser,
      users: staff,
      isOwner,
      isSalesperson,
      permissions,
      isStaffPending,
      pendingOrgInfo,
      checkingApproval,
      refreshApprovalStatus,
      approveStaffMember,
      rejectStaffMember,
      switchUser,
      lockSession,
      isPasscodeLocked,
      pendingUser,
      verifyPasscode,
      recordSale,
      settleCreditSale,
      transferStock,
      recordDirectPurchase,
      recordWarehouseInbound,
      createProduct,
      overrideStock,
      updateProduct,
      addStore,
      deleteStore,
      saveStaffMember,
      updateBusinessName,
      updateUserPasscode,
      logAuditAction,
      isFirebaseLive: isFirebaseConfigured,
    }}>
      {children}
    </TenantContext.Provider>
  )
}


export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) throw new Error('useTenant must be used within a TenantProvider')
  return context
}
