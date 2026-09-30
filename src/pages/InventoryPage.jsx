import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Boxes,
  ArrowRightLeft,
  ShoppingBag,
  Warehouse,
  Store,
  AlertTriangle,
  Plus,
  DollarSign,
  Building,
  CreditCard,
  Check,
  Trash2,
  Edit3,
  SlidersHorizontal,
  Tags,
  PlusCircle,
  ShieldAlert,
  Search,
  X,
  Sparkles,
  TrendingUp,
  Percent,
  CheckCircle2,
  Package,
  ArrowLeft,
  ChevronRight,
  Landmark,
  Smartphone,
  Banknote
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'
import { ETHIOPIAN_PAYMENT_PROVIDERS, DEFAULT_BANK } from '../lib/ethiopian-banks'

export function InventoryPage() {
  const {
    warehouses,
    stores,
    products,
    transferStock,
    recordDirectPurchase,
    recordWarehouseInbound,
    createProduct,
    overrideStock,
    updateProduct,
    addStore,
    deleteStore
  } = useTenant()
  const { currentUser, isOwner } = useAuth()

  // Location URL Router & State (Hub vs Dedicated Location)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeLocationId = searchParams.get('loc')
  const activeLocationType = searchParams.get('type') // 'warehouse' | 'store'

  const activeWarehouse = activeLocationType === 'warehouse' ? warehouses.find(w => w.id === activeLocationId) : null
  const activeStore = activeLocationType === 'store' ? stores.find(s => s.id === activeLocationId) : null
  const activeLocation = activeWarehouse || activeStore

  // Global Page Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  // Category filter for active location
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const availableCategories = useMemo(() => {
    const cats = new Set()
    products.forEach(p => {
      if (p.category) cats.add(p.category)
    })
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const locationFilteredProducts = useMemo(() => {
    if (!activeLocation) return []
    return products.filter(p => {
      const q = globalSearchQuery.toLowerCase().trim()
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, activeLocation, globalSearchQuery, selectedCategory])

  // Modals
  const [isWarehouseInboundModalOpen, setIsWarehouseInboundModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const [isProductPricingModalOpen, setIsProductPricingModalOpen] = useState(false)
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false)

  // Dedicated Warehouse Page States & Modals
  const [isWarehouseAddProductOpen, setIsWarehouseAddProductOpen] = useState(false)
  const [warehouseAddProductForm, setWarehouseAddProductForm] = useState({
    name: '',
    category: 'General',
    sellingPrice: '30',
    costPrice: '20',
    initialQuantity: '10',
    minStockThreshold: '5',
  })

  const [isWarehouseDirectPurchaseOpen, setIsWarehouseDirectPurchaseOpen] = useState(false)
  const [warehouseDirectPurchaseForm, setWarehouseDirectPurchaseForm] = useState({
    productId: '',
    quantity: '10',
    costPerUnit: '20',
    paymentMethod: 'Banking', // 'Banking' | 'Telebirr' | 'Cash'
    bankProvider: 'cbe',
    bankReference: '',
    telebirrReference: '',
    supplierName: '',
  })

  const [isWarehouseTransferOpen, setIsWarehouseTransferOpen] = useState(false)
  const [warehouseTransferForm, setWarehouseTransferForm] = useState({
    toWarehouseId: '',
    toStoreId: '',
    productId: '',
    quantity: '5',
  })

  // Dedicated Store Page States & Modals
  const [isStoreAddProductOpen, setIsStoreAddProductOpen] = useState(false)
  const [storeAddProductForm, setStoreAddProductForm] = useState({
    name: '',
    category: 'General',
    sellingPrice: '30',
    costPrice: '20',
    initialQuantity: '10',
    minStockThreshold: '5',
  })

  const [isStoreDirectPurchaseOpen, setIsStoreDirectPurchaseOpen] = useState(false)
  const [storeDirectPurchaseForm, setStoreDirectPurchaseForm] = useState({
    productId: '',
    quantity: '10',
    costPerUnit: '20',
    paymentMethod: 'Banking', // 'Banking' | 'Telebirr' | 'Cash'
    bankProvider: 'cbe',
    bankReference: '',
    telebirrReference: '',
    supplierName: '',
  })

  const [isStoreTransferOpen, setIsStoreTransferOpen] = useState(false)
  const [storeTransferForm, setStoreTransferForm] = useState({
    toWarehouseId: '',
    toStoreId: '',
    productId: '',
    quantity: '5',
  })

  // Pricing Modal Search & State
  const [pricingSearchQuery, setPricingSearchQuery] = useState('')
  const [pricingSavedToast, setPricingSavedToast] = useState(false)

  // Transfer Modal Search
  const [transferProductSearch, setTransferProductSearch] = useState('')

  // Purchase Modal Search
  const [purchaseProductSearch, setPurchaseProductSearch] = useState('')

  // Warehouse Inbound Form & Search
  const [inboundProductSearch, setInboundProductSearch] = useState('')
  const [isInboundCreatingNewProduct, setIsInboundCreatingNewProduct] = useState(false)
  const [warehouseInboundForm, setWarehouseInboundForm] = useState({
    warehouseId: warehouses[0]?.id || '',
    productId: products[0]?.id || '',
    quantity: '50',
    costPerUnit: products[0]?.costPrice || '20',
    paymentMethod: 'Cash', // Cash | Banking | Credit
    bankProvider: DEFAULT_BANK,
    supplierName: '',
    // New product fields
    newProductName: '',
    newProductCategory: 'Groceries',
    newProductSellingPrice: '30',
    newProductCostPrice: '20',
    newProductCommissionRate: '5',
    newProductMinThreshold: '10',
  })

  // Bulk Warehouse Inbound State
  const [isInboundBulkMode, setIsInboundBulkMode] = useState(false)
  const [bulkInboundItems, setBulkInboundItems] = useState([
    {
      id: 'bulk-inbound-1',
      isNewProduct: false,
      productId: products[0]?.id || '',
      quantity: '50',
      costPerUnit: products[0]?.costPrice || '20',
      newProductName: '',
      newProductCategory: 'General',
      newProductSellingPrice: '30',
    }
  ])

  // Bulk Inbound Row Handlers
  const handleAddBulkInboundRow = (isNew = false) => {
    const usedIds = new Set(bulkInboundItems.filter(it => !it.isNewProduct).map(it => it.productId))
    const nextProd = products.find(p => !usedIds.has(p.id)) || products[0]
    setBulkInboundItems(prev => [
      ...prev,
      {
        id: `bulk-inbound-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        isNewProduct: isNew,
        productId: nextProd?.id || '',
        quantity: '20',
        costPerUnit: isNew ? '20' : (nextProd?.costPrice || '10'),
        newProductName: '',
        newProductCategory: 'General',
        newProductSellingPrice: '30',
      }
    ])
  }

  const handleRemoveBulkInboundRow = (rowId) => {
    if (bulkInboundItems.length <= 1) return
    setBulkInboundItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateBulkInboundRow = (rowId, field, val) => {
    setBulkInboundItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const updated = { ...r, [field]: val }
      if (field === 'productId') {
        const prod = products.find(p => p.id === val)
        if (prod) updated.costPerUnit = prod.costPrice || '0'
      }
      return updated
    }))
  }

  // Stock Transfer Items State (Defaults to 1 item)
  const [transferItems, setTransferItems] = useState([
    {
      id: 'trans-1',
      productId: products[0]?.id || '',
      quantity: '5'
    }
  ])

  const handleAddTransferItem = () => {
    const usedIds = new Set(transferItems.map(it => it.productId))
    const nextProd = products.find(p => !usedIds.has(p.id)) || products[0]
    setTransferItems(prev => [
      ...prev,
      {
        id: `trans-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: nextProd?.id || '',
        quantity: '5'
      }
    ])
  }

  const handleRemoveTransferItem = (rowId) => {
    if (transferItems.length <= 1) return
    setTransferItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateTransferItem = (rowId, field, val) => {
    setTransferItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      return { ...r, [field]: val }
    }))
  }

  // Direct Store Purchase State & Handlers
  const [isPurchaseCreatingNewProduct, setIsPurchaseCreatingNewProduct] = useState(false)
  const [isPurchaseBulkMode, setIsPurchaseBulkMode] = useState(false)
  const [bulkPurchaseItems, setBulkPurchaseItems] = useState([
    {
      id: 'bulk-purch-1',
      isNewProduct: false,
      productId: products[0]?.id || '',
      quantity: '10',
      costPerUnit: products[0]?.costPrice || '20',
      newProductName: '',
      newProductCategory: 'General',
      newProductSellingPrice: '30',
    }
  ])

  const handleAddBulkPurchaseRow = (isNew = false) => {
    const usedIds = new Set(bulkPurchaseItems.filter(it => !it.isNewProduct).map(it => it.productId))
    const nextProd = products.find(p => !usedIds.has(p.id)) || products[0]
    setBulkPurchaseItems(prev => [
      ...prev,
      {
        id: `bulk-purch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        isNewProduct: isNew,
        productId: nextProd?.id || '',
        quantity: '10',
        costPerUnit: isNew ? '20' : (nextProd?.costPrice || '20'),
        newProductName: '',
        newProductCategory: 'General',
        newProductSellingPrice: '30',
      }
    ])
  }

  const handleRemoveBulkPurchaseRow = (rowId) => {
    if (bulkPurchaseItems.length <= 1) return
    setBulkPurchaseItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateBulkPurchaseRow = (rowId, field, val) => {
    setBulkPurchaseItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const updated = { ...r, [field]: val }
      if (field === 'productId') {
        const prod = products.find(p => p.id === val)
        if (prod) updated.costPerUnit = prod.costPrice || '0'
      }
      return updated
    }))
  }

  // Standalone Add Product Modal State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [standaloneProductForm, setStandaloneProductForm] = useState({
    name: '',
    category: 'General',
    sellingPrice: '30',
    costPrice: '20',
    defaultCommissionRate: '5',
    minStockThreshold: '10',
    initialDestination: 'none', // 'none' | 'warehouse' | 'store'
    initialDestinationId: '',
    initialQuantity: '0',
  })

  // Forms
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: warehouses[0]?.id || '',
    toStoreId: stores[0]?.id || '',
    productId: products[0]?.id || '',
    quantity: '5',
  })

  const [purchaseForm, setPurchaseForm] = useState({
    storeId: stores[0]?.id || '',
    productId: products[0]?.id || '',
    quantity: '10',
    costPerUnit: products[0]?.costPrice || '20',
    paymentMethod: 'Cash', // Cash | Banking | Credit
    bankProvider: DEFAULT_BANK,
    supplierName: '',
    // New product fields
    newProductName: '',
    newProductCategory: 'General',
    newProductSellingPrice: '30',
    newProductCostPrice: '20',
    newProductCommissionRate: '5',
    newProductMinThreshold: '10',
  })

  const [overrideForm, setOverrideForm] = useState({
    locationId: '',
    locationName: '',
    locationType: 'store', // 'warehouse' | 'store'
    productId: '',
    productName: '',
    currentQuantity: 0,
    newQuantity: '0',
    reason: '',
  })

  const [productPricingForm, setProductPricingForm] = useState({
    productId: products[0]?.id || '',
    sellingPrice: products[0]?.sellingPrice || 0,
    costPrice: products[0]?.costPrice || 0,
    defaultCommissionRate: products[0]?.defaultCommissionRate || 5,
    minStockThreshold: products[0]?.minStockThreshold || 10,
  })

  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    location: '',
  })

  // Filtered products for main inventory page
  const filteredProducts = useMemo(() => {
    if (!globalSearchQuery.trim()) return products
    const q = globalSearchQuery.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
  }, [products, globalSearchQuery])

  // Filtered products for Pricing Modal
  const pricingFilteredProducts = useMemo(() => {
    if (!pricingSearchQuery.trim()) return products
    const q = pricingSearchQuery.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
  }, [products, pricingSearchQuery])

  // Active product in pricing editor
  const activePricingProduct = useMemo(() => {
    return products.find(p => p.id === productPricingForm.productId) || products[0]
  }, [products, productPricingForm.productId])

  // Live profit margin calculation for pricing modal
  const sellingNum = parseFloat(productPricingForm.sellingPrice) || 0
  const costNum = parseFloat(productPricingForm.costPrice) || 0
  const grossProfitPerUnit = sellingNum - costNum
  const profitMarginPercent = sellingNum > 0 ? ((grossProfitPerUnit / sellingNum) * 100).toFixed(1) : '0.0'
  const commissionRateNum = parseFloat(productPricingForm.defaultCommissionRate) || 0
  const commissionPerUnit = sellingNum * (commissionRateNum / 100)

  // Submit Warehouse Inbound Restock
  const handleWarehouseInboundSubmit = async (e) => {
    e.preventDefault()
    if (!isOwner) return
    let bankProviderName = null
    if (warehouseInboundForm.paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === warehouseInboundForm.bankProvider)
      bankProviderName = bankObj ? bankObj.name : warehouseInboundForm.bankProvider
    }

    // ─── Bulk Inbound Submission ───
    if (isInboundBulkMode) {
      const validItems = []
      for (const it of bulkInboundItems) {
        const qty = parseInt(it.quantity, 10) || 0
        if (qty <= 0) continue

        if (it.isNewProduct) {
          if (!it.newProductName || !it.newProductName.trim()) {
            alert('Please enter a product name for all new items in the inbound manifest.')
            return
          }
          const created = await createProduct({
            name: it.newProductName.trim(),
            category: it.newProductCategory?.trim() || 'General',
            sellingPrice: it.newProductSellingPrice || '30',
            costPrice: it.costPerUnit || '20',
            defaultCommissionRate: 5,
            minStockThreshold: 10,
          }, currentUser)
          if (!created) {
            alert(`Failed to create product "${it.newProductName}". Please try again.`)
            return
          }
          validItems.push({
            productId: created.id,
            productName: created.name,
            quantity: qty,
            costPerUnit: parseFloat(it.costPerUnit) || 0,
          })
        } else if (it.productId) {
          const prod = products.find(p => p.id === it.productId)
          validItems.push({
            productId: it.productId,
            productName: prod?.name || it.productId,
            quantity: qty,
            costPerUnit: parseFloat(it.costPerUnit) || 0,
          })
        }
      }

      if (validItems.length === 0) {
        alert('Please specify at least one valid product with quantity > 0')
        return
      }

      await recordWarehouseInbound({
        warehouseId: warehouseInboundForm.warehouseId,
        items: validItems,
        paymentMethod: warehouseInboundForm.paymentMethod,
        bankProvider: bankProviderName,
        supplierName: warehouseInboundForm.supplierName,
      }, currentUser)

      setIsWarehouseInboundModalOpen(false)
      setBulkInboundItems([
        {
          id: `bulk-inbound-${Date.now()}`,
          isNewProduct: false,
          productId: products[0]?.id || '',
          quantity: '50',
          costPerUnit: products[0]?.costPrice || '20',
          newProductName: '',
          newProductCategory: 'General',
          newProductSellingPrice: '30',
        }
      ])
      return
    }

    let targetProductId = warehouseInboundForm.productId

    // If creating a brand new product during warehouse intake
    if (isInboundCreatingNewProduct) {
      if (!warehouseInboundForm.newProductName.trim()) {
        alert('Please enter a product name')
        return
      }
      const created = await createProduct({
        name: warehouseInboundForm.newProductName.trim(),
        category: warehouseInboundForm.newProductCategory.trim(),
        sellingPrice: warehouseInboundForm.newProductSellingPrice,
        costPrice: warehouseInboundForm.newProductCostPrice,
        defaultCommissionRate: warehouseInboundForm.newProductCommissionRate,
        minStockThreshold: warehouseInboundForm.newProductMinThreshold,
      }, currentUser)
      if (!created) {
        alert('Failed to create product. Please try again.')
        return
      }
      targetProductId = created.id
    }

    await recordWarehouseInbound({
      warehouseId: warehouseInboundForm.warehouseId,
      productId: targetProductId,
      quantity: warehouseInboundForm.quantity,
      costPerUnit: isInboundCreatingNewProduct ? warehouseInboundForm.newProductCostPrice : warehouseInboundForm.costPerUnit,
      paymentMethod: warehouseInboundForm.paymentMethod,
      bankProvider: bankProviderName,
      supplierName: warehouseInboundForm.supplierName,
    }, currentUser)

    setIsWarehouseInboundModalOpen(false)
    setIsInboundCreatingNewProduct(false)
    setWarehouseInboundForm(prev => ({
      ...prev,
      quantity: '50',
      supplierName: '',
      newProductName: '',
    }))
  }

  // Submit Stock Transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    const wh = warehouses.find(w => w.id === transferForm.fromWarehouseId)
    const validItems = transferItems
      .filter(it => it.productId && parseInt(it.quantity, 10) > 0)
      .map(it => {
        const prod = products.find(p => p.id === it.productId)
        return {
          productId: it.productId,
          productName: prod?.name || it.productId,
          quantity: parseInt(it.quantity, 10),
        }
      })

    if (validItems.length === 0) {
      alert('Please add at least one item with quantity greater than 0.')
      return
    }

    for (const item of validItems) {
      const available = wh?.stock[item.productId] || 0
      if (item.quantity > available) {
        alert(`Transfer quantity for "${item.productName}" (${item.quantity}) exceeds available warehouse stock (${available}).`)
        return
      }
    }

    const success = await transferStock({
      fromWarehouseId: transferForm.fromWarehouseId,
      toStoreId: transferForm.toStoreId,
      items: validItems,
    }, currentUser)

    if (success) {
      setIsTransferModalOpen(false)
      setTransferItems([
        {
          id: `trans-${Date.now()}`,
          productId: products[0]?.id || '',
          quantity: '5'
        }
      ])
    } else {
      alert('Could not complete transfer. Please verify warehouse stock.')
    }
  }

  // ─── Dedicated Warehouse Page Handlers ────────────────────────────────────

  const handleWarehouseAddProductSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    if (!warehouseAddProductForm.name.trim()) {
      alert('Please enter a product name')
      return
    }

    const created = await createProduct({
      name: warehouseAddProductForm.name.trim(),
      category: warehouseAddProductForm.category?.trim() || 'General',
      sellingPrice: warehouseAddProductForm.sellingPrice,
      costPrice: warehouseAddProductForm.costPrice,
      minStockThreshold: warehouseAddProductForm.minStockThreshold,
      initialWarehouseId: activeLocation.id,
      initialQuantity: parseInt(warehouseAddProductForm.initialQuantity, 10) || 0,
    })

    if (created) {
      setIsWarehouseAddProductOpen(false)
      setWarehouseAddProductForm({
        name: '',
        category: 'General',
        sellingPrice: '30',
        costPrice: '20',
        initialQuantity: '10',
        minStockThreshold: '5',
      })
    } else {
      alert('Failed to add product to warehouse.')
    }
  }

  // ─── Dedicated Warehouse Page Multi-Item Handlers ─────────────────────────
  const handleAddWarehousePurchaseRow = () => {
    const usedIds = new Set(warehousePurchaseItems.map(it => it.productId))
    const nextProd = products.find(p => !usedIds.has(p.id)) || products[0]
    setWarehousePurchaseItems(prev => [
      ...prev,
      {
        id: `wh-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: nextProd?.id || '',
        quantity: '10',
        costPerUnit: nextProd?.costPrice || '20',
      }
    ])
  }

  const handleRemoveWarehousePurchaseRow = (rowId) => {
    if (warehousePurchaseItems.length <= 1) return
    setWarehousePurchaseItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateWarehousePurchaseRow = (rowId, field, val) => {
    setWarehousePurchaseItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const updated = { ...r, [field]: val }
      if (field === 'productId') {
        const prod = products.find(p => p.id === val)
        if (prod) updated.costPerUnit = prod.costPrice || '20'
      }
      return updated
    }))
  }

  const handleWarehouseDirectPurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    const validItems = warehousePurchaseItems
      .filter(it => it.productId && parseInt(it.quantity, 10) > 0)
      .map(it => {
        const prod = products.find(p => p.id === it.productId)
        return {
          productId: it.productId,
          productName: prod?.name || it.productId,
          quantity: parseInt(it.quantity, 10),
          costPerUnit: parseFloat(it.costPerUnit) || 0,
        }
      })

    if (validItems.length === 0) {
      alert('Please add at least one product with quantity > 0')
      return
    }

    let bankProviderName = undefined
    if (warehouseDirectPurchaseForm.paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === warehouseDirectPurchaseForm.bankProvider)
      bankProviderName = bankObj ? bankObj.name : warehouseDirectPurchaseForm.bankProvider
    }

    const ref = warehouseDirectPurchaseForm.paymentMethod === 'Banking'
      ? warehouseDirectPurchaseForm.bankReference
      : warehouseDirectPurchaseForm.paymentMethod === 'Telebirr'
      ? warehouseDirectPurchaseForm.telebirrReference
      : ''

    const supplierStr = warehouseDirectPurchaseForm.supplierName
      ? `${warehouseDirectPurchaseForm.supplierName}${ref ? ` (Ref: ${ref})` : ''}`
      : (ref ? `Ref: ${ref}` : undefined)

    const success = await recordWarehouseInbound({
      warehouseId: activeLocation.id,
      items: validItems,
      paymentMethod: warehouseDirectPurchaseForm.paymentMethod,
      bankProvider: bankProviderName,
      supplierName: supplierStr,
    })

    if (success) {
      setIsWarehouseDirectPurchaseOpen(false)
      setWarehousePurchaseItems([
        { id: `wh-p-${Date.now()}`, productId: products[0]?.id || '', quantity: '10', costPerUnit: products[0]?.costPrice || '20' }
      ])
      setWarehouseDirectPurchaseForm(prev => ({
        ...prev,
        supplierName: '',
        bankReference: '',
        telebirrReference: '',
      }))
    } else {
      alert('Could not record direct warehouse purchase.')
    }
  }

  const handleAddWarehouseTransferRow = () => {
    const stockedProds = products.filter(p => (activeLocation?.stock?.[p.id] || 0) > 0)
    const usedIds = new Set(warehouseTransferItems.map(it => it.productId))
    const nextProd = stockedProds.find(p => !usedIds.has(p.id)) || stockedProds[0] || products[0]
    setWarehouseTransferItems(prev => [
      ...prev,
      {
        id: `wh-t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: nextProd?.id || '',
        quantity: '5',
      }
    ])
  }

  const handleRemoveWarehouseTransferRow = (rowId) => {
    if (warehouseTransferItems.length <= 1) return
    setWarehouseTransferItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateWarehouseTransferRow = (rowId, field, val) => {
    setWarehouseTransferItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      return { ...r, [field]: val }
    }))
  }

  const handleWarehouseTransferSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    if (!warehouseTransferForm.toWarehouseId && !warehouseTransferForm.toStoreId) {
      alert('Please select a destination warehouse or store')
      return
    }

    const validItems = warehouseTransferItems
      .filter(it => it.productId && parseInt(it.quantity, 10) > 0)
      .map(it => {
        const prod = products.find(p => p.id === it.productId)
        return {
          productId: it.productId,
          productName: prod?.name || it.productId,
          quantity: parseInt(it.quantity, 10),
        }
      })

    if (validItems.length === 0) {
      alert('Please select at least one item with quantity > 0')
      return
    }

    for (const item of validItems) {
      const available = activeLocation.stock?.[item.productId] || 0
      if (item.quantity > available) {
        alert(`Transfer quantity for "${item.productName}" (${item.quantity}) exceeds available stock (${available}) in ${activeLocation.name}`)
        return
      }
    }

    const success = await transferStock({
      fromWarehouseId: activeLocation.id,
      toWarehouseId: warehouseTransferForm.toWarehouseId || undefined,
      toStoreId: warehouseTransferForm.toStoreId || undefined,
      items: validItems,
    })

    if (success) {
      setIsWarehouseTransferOpen(false)
      setWarehouseTransferItems([
        { id: `wh-t-${Date.now()}`, productId: '', quantity: '5' }
      ])
    } else {
      alert('Could not complete transfer. Please verify stock availability.')
    }
  }

  // ─── Dedicated Store Page Multi-Item Handlers ─────────────────────────────
  const handleStoreAddProductSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    if (!storeAddProductForm.name.trim()) {
      alert('Please enter a product name')
      return
    }

    const created = await createProduct({
      name: storeAddProductForm.name.trim(),
      category: storeAddProductForm.category?.trim() || 'General',
      sellingPrice: storeAddProductForm.sellingPrice,
      costPrice: storeAddProductForm.costPrice,
      minStockThreshold: storeAddProductForm.minStockThreshold,
      initialStoreId: activeLocation.id,
      initialQuantity: parseInt(storeAddProductForm.initialQuantity, 10) || 0,
    })

    if (created) {
      setIsStoreAddProductOpen(false)
      setStoreAddProductForm({
        name: '',
        category: 'General',
        sellingPrice: '30',
        costPrice: '20',
        initialQuantity: '10',
        minStockThreshold: '5',
      })
    } else {
      alert('Failed to add product to store.')
    }
  }

  const handleAddStorePurchaseRow = () => {
    const usedIds = new Set(storePurchaseItems.map(it => it.productId))
    const nextProd = products.find(p => !usedIds.has(p.id)) || products[0]
    setStorePurchaseItems(prev => [
      ...prev,
      {
        id: `st-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: nextProd?.id || '',
        quantity: '10',
        costPerUnit: nextProd?.costPrice || '20',
      }
    ])
  }

  const handleRemoveStorePurchaseRow = (rowId) => {
    if (storePurchaseItems.length <= 1) return
    setStorePurchaseItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateStorePurchaseRow = (rowId, field, val) => {
    setStorePurchaseItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const updated = { ...r, [field]: val }
      if (field === 'productId') {
        const prod = products.find(p => p.id === val)
        if (prod) updated.costPerUnit = prod.costPrice || '20'
      }
      return updated
    }))
  }

  const handleStoreDirectPurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    const validItems = storePurchaseItems
      .filter(it => it.productId && parseInt(it.quantity, 10) > 0)
      .map(it => {
        const prod = products.find(p => p.id === it.productId)
        return {
          productId: it.productId,
          productName: prod?.name || it.productId,
          quantity: parseInt(it.quantity, 10),
          costPerUnit: parseFloat(it.costPerUnit) || 0,
        }
      })

    if (validItems.length === 0) {
      alert('Please add at least one product with quantity > 0')
      return
    }

    let bankProviderName = undefined
    if (storeDirectPurchaseForm.paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === storeDirectPurchaseForm.bankProvider)
      bankProviderName = bankObj ? bankObj.name : storeDirectPurchaseForm.bankProvider
    }

    const ref = storeDirectPurchaseForm.paymentMethod === 'Banking'
      ? storeDirectPurchaseForm.bankReference
      : storeDirectPurchaseForm.paymentMethod === 'Telebirr'
      ? storeDirectPurchaseForm.telebirrReference
      : ''

    const supplierStr = storeDirectPurchaseForm.supplierName
      ? `${storeDirectPurchaseForm.supplierName}${ref ? ` (Ref: ${ref})` : ''}`
      : (ref ? `Ref: ${ref}` : undefined)

    const success = await recordDirectPurchase({
      storeId: activeLocation.id,
      items: validItems,
      paymentMethod: storeDirectPurchaseForm.paymentMethod,
      bankProvider: bankProviderName,
      supplierName: supplierStr,
    })

    if (success) {
      setIsStoreDirectPurchaseOpen(false)
      setStorePurchaseItems([
        { id: `st-p-${Date.now()}`, productId: products[0]?.id || '', quantity: '10', costPerUnit: products[0]?.costPrice || '20' }
      ])
      setStoreDirectPurchaseForm(prev => ({
        ...prev,
        supplierName: '',
        bankReference: '',
        telebirrReference: '',
      }))
    } else {
      alert('Could not record direct store purchase.')
    }
  }

  const handleAddStoreTransferRow = () => {
    const stockedProds = products.filter(p => (activeLocation?.stock?.[p.id] || 0) > 0)
    const usedIds = new Set(storeTransferItems.map(it => it.productId))
    const nextProd = stockedProds.find(p => !usedIds.has(p.id)) || stockedProds[0] || products[0]
    setStoreTransferItems(prev => [
      ...prev,
      {
        id: `st-t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: nextProd?.id || '',
        quantity: '5',
      }
    ])
  }

  const handleRemoveStoreTransferRow = (rowId) => {
    if (storeTransferItems.length <= 1) return
    setStoreTransferItems(prev => prev.filter(r => r.id !== rowId))
  }

  const handleUpdateStoreTransferRow = (rowId, field, val) => {
    setStoreTransferItems(prev => prev.map(r => {
      if (r.id !== rowId) return r
      return { ...r, [field]: val }
    }))
  }

  const handleStoreTransferSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    if (!storeTransferForm.toWarehouseId && !storeTransferForm.toStoreId) {
      alert('Please select a destination warehouse or store')
      return
    }

    const validItems = storeTransferItems
      .filter(it => it.productId && parseInt(it.quantity, 10) > 0)
      .map(it => {
        const prod = products.find(p => p.id === it.productId)
        return {
          productId: it.productId,
          productName: prod?.name || it.productId,
          quantity: parseInt(it.quantity, 10),
        }
      })

    if (validItems.length === 0) {
      alert('Please select at least one item with quantity > 0')
      return
    }

    for (const item of validItems) {
      const available = activeLocation.stock?.[item.productId] || 0
      if (item.quantity > available) {
        alert(`Transfer quantity for "${item.productName}" (${item.quantity}) exceeds available stock (${available}) in ${activeLocation.name}`)
        return
      }
    }

    const success = await transferStock({
      fromStoreId: activeLocation.id,
      toWarehouseId: storeTransferForm.toWarehouseId || undefined,
      toStoreId: storeTransferForm.toStoreId || undefined,
      items: validItems,
    })

    if (success) {
      setIsStoreTransferOpen(false)
      setStoreTransferItems([
        { id: `st-t-${Date.now()}`, productId: '', quantity: '5' }
      ])
    } else {
      alert('Could not complete transfer. Please verify stock availability.')
    }
  }
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    let bankProviderName = null
    if (purchaseForm.paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === purchaseForm.bankProvider)
      bankProviderName = bankObj ? bankObj.name : purchaseForm.bankProvider
    }

    if (isPurchaseBulkMode) {
      const validItems = []
      for (const it of bulkPurchaseItems) {
        const qty = parseInt(it.quantity, 10) || 0
        if (qty <= 0) continue

        if (it.isNewProduct) {
          if (!it.newProductName || !it.newProductName.trim()) {
            alert('Please specify a product name for all new items in the purchase manifest.')
            return
          }
          const created = await createProduct({
            name: it.newProductName.trim(),
            category: it.newProductCategory?.trim() || 'General',
            sellingPrice: it.newProductSellingPrice || '30',
            costPrice: it.costPerUnit || '20',
            defaultCommissionRate: 5,
            minStockThreshold: 10,
          }, currentUser)
          if (!created) {
            alert(`Failed to create product "${it.newProductName}".`)
            return
          }
          validItems.push({
            productId: created.id,
            productName: created.name,
            quantity: qty,
            costPerUnit: parseFloat(it.costPerUnit) || 0,
          })
        } else if (it.productId) {
          const prod = products.find(p => p.id === it.productId)
          validItems.push({
            productId: it.productId,
            productName: prod?.name || it.productId,
            quantity: qty,
            costPerUnit: parseFloat(it.costPerUnit) || 0,
          })
        }
      }

      if (validItems.length === 0) {
        alert('Please add at least one valid item with quantity greater than 0.')
        return
      }

      await recordDirectPurchase({
        storeId: purchaseForm.storeId,
        items: validItems,
        paymentMethod: purchaseForm.paymentMethod,
        bankProvider: bankProviderName,
        supplierName: purchaseForm.supplierName,
      }, currentUser)

      setIsPurchaseModalOpen(false)
      setBulkPurchaseItems([
        {
          id: `bulk-purch-${Date.now()}`,
          isNewProduct: false,
          productId: products[0]?.id || '',
          quantity: '10',
          costPerUnit: products[0]?.costPrice || '20',
          newProductName: '',
          newProductCategory: 'General',
          newProductSellingPrice: '30'
        }
      ])
      return
    }

    // Single item mode
    let targetProductId = purchaseForm.productId

    if (isPurchaseCreatingNewProduct) {
      if (!purchaseForm.newProductName.trim()) {
        alert('Please enter a product name')
        return
      }
      const created = await createProduct({
        name: purchaseForm.newProductName.trim(),
        category: purchaseForm.newProductCategory.trim() || 'General',
        sellingPrice: purchaseForm.newProductSellingPrice,
        costPrice: purchaseForm.newProductCostPrice,
        defaultCommissionRate: purchaseForm.newProductCommissionRate,
        minStockThreshold: purchaseForm.newProductMinThreshold,
      }, currentUser)
      if (!created) {
        alert('Failed to create product. Please try again.')
        return
      }
      targetProductId = created.id
    }

    await recordDirectPurchase({
      storeId: purchaseForm.storeId,
      productId: targetProductId,
      quantity: purchaseForm.quantity,
      costPerUnit: isPurchaseCreatingNewProduct ? purchaseForm.newProductCostPrice : purchaseForm.costPerUnit,
      paymentMethod: purchaseForm.paymentMethod,
      bankProvider: bankProviderName,
      supplierName: purchaseForm.supplierName,
    }, currentUser)

    setIsPurchaseModalOpen(false)
    setIsPurchaseCreatingNewProduct(false)
    setPurchaseForm(prev => ({
      ...prev,
      quantity: '10',
      supplierName: '',
      newProductName: '',
    }))
  }

  // Handle Standalone Product Creation
  const handleCreateStandaloneProduct = async (e) => {
    e.preventDefault()
    if (!standaloneProductForm.name.trim()) {
      alert('Please enter a product name')
      return
    }
    const created = await createProduct({
      name: standaloneProductForm.name.trim(),
      category: standaloneProductForm.category.trim() || 'General',
      sellingPrice: standaloneProductForm.sellingPrice,
      costPrice: standaloneProductForm.costPrice,
      defaultCommissionRate: standaloneProductForm.defaultCommissionRate,
      minStockThreshold: standaloneProductForm.minStockThreshold,
    }, currentUser)

    if (!created) {
      alert('Failed to create product.')
      return
    }

    const initQty = parseInt(standaloneProductForm.initialQuantity, 10) || 0
    if (initQty > 0 && standaloneProductForm.initialDestination !== 'none') {
      if (standaloneProductForm.initialDestination === 'warehouse') {
        const whId = standaloneProductForm.initialDestinationId || warehouses[0]?.id
        if (whId) {
          await recordWarehouseInbound({
            warehouseId: whId,
            productId: created.id,
            quantity: initQty,
            costPerUnit: standaloneProductForm.costPrice,
            paymentMethod: 'Cash',
            supplierName: 'Initial Product Stocking'
          }, currentUser)
        }
      } else if (standaloneProductForm.initialDestination === 'store') {
        const stId = standaloneProductForm.initialDestinationId || stores[0]?.id
        if (stId) {
          await recordDirectPurchase({
            storeId: stId,
            productId: created.id,
            quantity: initQty,
            costPerUnit: standaloneProductForm.costPrice,
            paymentMethod: 'Cash',
            supplierName: 'Initial Product Stocking'
          }, currentUser)
        }
      }
    }

    setIsAddProductModalOpen(false)
    setStandaloneProductForm({
      name: '',
      category: 'General',
      sellingPrice: '30',
      costPrice: '20',
      defaultCommissionRate: '5',
      minStockThreshold: '10',
      initialDestination: 'none',
      initialDestinationId: '',
      initialQuantity: '0',
    })
  }

  // Open Override Modal
  const handleOpenOverride = (locId, locName, locType, prodId, prodName, curQty) => {
    setOverrideForm({
      locationId: locId,
      locationName: locName,
      locationType: locType,
      productId: prodId,
      productName: prodName,
      currentQuantity: curQty,
      newQuantity: String(curQty),
      reason: 'Physical Stock Count Reconciliation',
    })
    setIsOverrideModalOpen(true)
  }

  const handleOverrideSubmit = (e) => {
    e.preventDefault()
    overrideStock(overrideForm, currentUser)
    setIsOverrideModalOpen(false)
  }

  // Open Product Pricing Edit Modal with a specific product
  const handleOpenProductPricing = (prod) => {
    const target = prod || products[0]
    if (target) {
      setProductPricingForm({
        productId: target.id,
        sellingPrice: target.sellingPrice,
        costPrice: target.costPrice,
        defaultCommissionRate: target.defaultCommissionRate || 5,
        minStockThreshold: target.minStockThreshold || 10,
      })
    }
    setPricingSearchQuery('')
    setPricingSavedToast(false)
    setIsProductPricingModalOpen(true)
  }

  // Select product inside pricing modal
  const handleSelectProductInPricing = (p) => {
    setProductPricingForm({
      productId: p.id,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      defaultCommissionRate: p.defaultCommissionRate || 5,
      minStockThreshold: p.minStockThreshold || 10,
    })
  }

  const handleProductPricingSubmit = (e) => {
    e.preventDefault()
    updateProduct(productPricingForm.productId, {
      sellingPrice: productPricingForm.sellingPrice,
      costPrice: productPricingForm.costPrice,
      defaultCommissionRate: productPricingForm.defaultCommissionRate,
      minStockThreshold: productPricingForm.minStockThreshold,
    }, currentUser)
    
    setPricingSavedToast(true)
    setTimeout(() => {
      setPricingSavedToast(false)
    }, 2500)
  }

  // Add Store
  const handleAddStoreSubmit = (e) => {
    e.preventDefault()
    if (!newStoreForm.name.trim()) return
    addStore(newStoreForm, currentUser)
    setNewStoreForm({ name: '', location: '' })
    setIsAddStoreModalOpen(false)
  }

  // Delete Store
  const handleDeleteStore = (store) => {
    if (window.confirm(`Are you sure you want to delete "${store.name}"? This action is permanent and will be logged in the audit trail.`)) {
      deleteStore(store.id, currentUser)
    }
  }

  // Calculate total stock across all locations for a product
  const getTotalStock = (productId) => {
    let count = 0
    warehouses.forEach(w => { count += (w.stock[productId] || 0) })
    stores.forEach(s => { count += (s.stock[productId] || 0) })
    return count
  }

  return (
    <div className="space-y-5 pb-28 sm:pb-8 animate-in fade-in duration-200">
      {!activeLocation ? (
        /* ═════════════════════════════════════════════════════════════════════ */
        /* VIEW 1: LOCATIONS HUB (AVAILABLE STORES & MAIN WAREHOUSE)            */
        /* ═════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Hub Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
                Stock & Inventory Locations
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Select a warehouse or retail store below to inspect and manage stock levels
              </p>
            </div>

            {/* Quick Actions: Mobile-First 2-button layout (Transfer Stock & Add Store only) */}
            <div className={`w-full sm:w-auto gap-2.5 sm:gap-3 ${isOwner ? 'grid grid-cols-2 sm:flex sm:items-center' : 'flex items-center'}`}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setTransferItems([
                    {
                      id: `trans-${Date.now()}`,
                      productId: products[0]?.id || '',
                      quantity: '5'
                    }
                  ])
                  setIsTransferModalOpen(true)
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold min-h-[46px] rounded-xl shadow-xs border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation cursor-pointer px-4"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate">Transfer Stock</span>
              </Button>

              {isOwner && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsAddStoreModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border-blue-300 text-blue-900 bg-blue-50/80 hover:bg-blue-100 active:scale-[0.98] transition-all min-h-[46px] rounded-xl shadow-xs touch-manipulation cursor-pointer px-4"
                >
                  <PlusCircle className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">+ Add Store</span>
                </Button>
              )}
            </div>
          </div>

          {/* ─── Warehouses ─── */}
          <div className="space-y-3">
            <div className="px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-purple-700" />
                Warehouses
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {warehouses.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No warehouse registered yet.
                </div>
              ) : (
                warehouses.map((wh) => {
                  const totalProducts = products.filter(p => (wh.stock?.[p.id] || 0) > 0).length

                  return (
                    <div
                      key={wh.id}
                      onClick={() => setSearchParams({ loc: wh.id, type: 'warehouse' })}
                      className="p-5 sm:p-6 bg-white hover:bg-purple-50/20 active:scale-[0.99] border border-slate-200 hover:border-purple-300 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-between group touch-manipulation min-h-[80px]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 group-hover:scale-105 transition-transform">
                          <Warehouse className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {wh.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                            {totalProducts} {totalProducts === 1 ? 'Product' : 'Products'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-purple-600 transition-colors">
                        <span className="text-xs font-bold hidden sm:inline">Open</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ─── Retail Stores ─── */}
          <div className="space-y-3">
            <div className="px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-700" />
                Retail Stores
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {stores.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No retail stores registered yet. Click "+ Add Store" to configure a store branch.
                </div>
              ) : (
                stores.map((store) => {
                  const totalProducts = products.filter(p => (store.stock?.[p.id] || 0) > 0).length

                  return (
                    <div
                      key={store.id}
                      onClick={() => setSearchParams({ loc: store.id, type: 'store' })}
                      className="p-5 sm:p-6 bg-white hover:bg-emerald-50/20 active:scale-[0.99] border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-between group touch-manipulation min-h-[80px]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:scale-105 transition-transform">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {store.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                            {totalProducts} {totalProducts === 1 ? 'Product' : 'Products'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && stores.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteStore(store)
                            }}
                            title="Delete Store Branch"
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer mr-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                          <span className="text-xs font-bold hidden sm:inline">Open</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════ */
        /* VIEW 2: DEDICATED SINGLE LOCATION STOCK PAGE                          */
        /* ═════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Back Button & Location Title Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer min-h-[44px] px-3.5 rounded-xl touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Locations</span>
              </Button>

              <div className="h-6 w-px bg-slate-200" />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {activeLocation.name}
                  </h1>
                  <Badge variant={activeLocationType === 'warehouse' ? 'purple' : 'info'} className="text-xs font-bold">
                    {activeLocationType === 'warehouse' ? 'Warehouse' : 'Retail Store'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                  {products.filter(p => (activeLocation.stock?.[p.id] || 0) > 0).length} Products in Stock &bull; {products.reduce((acc, p) => acc + (activeLocation.stock?.[p.id] || 0), 0)} Total Units
                </p>
              </div>
            </div>

            {/* Location Actions: + Add, Direct Purchase, Transfer Stock */}
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full md:w-auto">
              {activeLocationType === 'warehouse' ? (
                <>
                  {/* 1. + Add Product Directly to Warehouse */}
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => {
                      setWarehouseAddProductForm({
                        name: '',
                        category: 'General',
                        sellingPrice: '30',
                        costPrice: '20',
                        initialQuantity: '10',
                        minStockThreshold: '5',
                      })
                      setIsWarehouseAddProductOpen(true)
                    }}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl cursor-pointer touch-manipulation shadow-xs px-3 sm:px-4"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add</span>
                  </Button>

                  {/* 2. Direct Purchase to Warehouse */}
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const firstProd = products[0]
                      setWarehousePurchaseItems([
                        { id: `wh-p-${Date.now()}`, productId: firstProd?.id || '', quantity: '10', costPerUnit: firstProd?.costPrice || '20' }
                      ])
                      setWarehouseDirectPurchaseForm(prev => ({
                        ...prev,
                        supplierName: '',
                        bankReference: '',
                        telebirrReference: '',
                      }))
                      setIsWarehouseDirectPurchaseOpen(true)
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-transparent font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl cursor-pointer touch-manipulation shadow-xs px-3 sm:px-4"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="truncate">Direct Purchase</span>
                  </Button>

                  {/* 3. Transfer Stock */}
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const otherWh = warehouses.find(w => w.id !== activeLocation.id)
                      const stockedProd = products.find(p => (activeLocation.stock?.[p.id] || 0) > 0)
                      setWarehouseTransferForm({
                        toWarehouseId: otherWh?.id || '',
                        toStoreId: otherWh ? '' : (stores[0]?.id || ''),
                      })
                      setWarehouseTransferItems([
                        { id: `wh-t-${Date.now()}`, productId: stockedProd?.id || products[0]?.id || '', quantity: '5' }
                      ])
                      setIsWarehouseTransferOpen(true)
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm font-bold border-slate-300 text-slate-800 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl cursor-pointer touch-manipulation shadow-xs px-3 sm:px-4"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-purple-700 shrink-0" />
                    <span className="truncate">Transfer Stock</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* 1. + Add Product Directly to Store */}
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => {
                      setStoreAddProductForm({
                        name: '',
                        category: 'General',
                        sellingPrice: '30',
                        costPrice: '20',
                        initialQuantity: '10',
                        minStockThreshold: '5',
                      })
                      setIsStoreAddProductOpen(true)
                    }}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl cursor-pointer touch-manipulation shadow-xs px-3 sm:px-4"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add</span>
                  </Button>

                  {/* 2. Direct Purchase to Store */}
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const firstProd = products[0]
                      setStorePurchaseItems([
                        { id: `st-p-${Date.now()}`, productId: firstProd?.id || '', quantity: '10', costPerUnit: firstProd?.costPrice || '20' }
                      ])
                      setStoreDirectPurchaseForm(prev => ({
                        ...prev,
                        supplierName: '',
                        bankReference: '',
                        telebirrReference: '',
                      }))
                      setIsStoreDirectPurchaseOpen(true)
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-transparent font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl cursor-pointer touch-manipulation shadow-xs px-3 sm:px-4"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="truncate">Direct Purchase</span>
                  </Button>

                  {/* 3. Transfer Stock */}
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const defaultWh = warehouses[0]?.id || ''
                      const stockedProd = products.find(p => (activeLocation.stock?.[p.id] || 0) > 0)
                      setStoreTransferForm({
                        toWarehouseId: defaultWh,
                        toStoreId: stores.find(s => s.id !== activeLocation.id)?.id || '',
                      })
                      setStoreTransferItems([
                        { id: `st-t-${Date.now()}`, productId: stockedProd?.id || products[0]?.id || '', quantity: '5' }
                      ])
                      setIsStoreTransferOpen(true)
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm font-bold border-slate-300 text-slate-800 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl cursor-pointer touch-manipulation shadow-xs px-3 sm:px-4"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">Transfer Stock</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar & Category Filter for this Location */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={`Search products in ${activeLocation.name}...`}
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Stock Cards Grid */}
          {locationFilteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              No products found matching your search or category filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {locationFilteredProducts.map((p) => {
                const qty = activeLocation.stock?.[p.id] || 0
                const isLow = qty > 0 && qty <= (p.minStockThreshold || 5)
                const isOut = qty === 0

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <span className="text-xs font-black text-emerald-700 shrink-0">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                        <span>Cost: {formatCurrency(p.costPrice)}</span>
                        {p.category && (
                          <>
                            <span>&bull;</span>
                            <span>{p.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-slate-900">{qty}</span>
                        {isOut ? (
                          <Badge variant="danger" className="text-[10px]">Out</Badge>
                        ) : isLow ? (
                          <Badge variant="warning" className="text-[10px]">Low ({qty})</Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">units</span>
                        )}
                      </div>

                      {/* Owner Quick Actions */}
                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenProductPricing(p)}
                            title="Adjust Price & Commission"
                            className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Tags className="w-3 h-3 text-emerald-600" />
                            <span>Price</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenOverride(activeLocation.id, activeLocation.name, activeLocationType, p.id, p.name, qty)}
                            title="Stock Override"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RESTOCK CENTRAL WAREHOUSE (BULK INBOUND) MODAL - OWNER ONLY */}
      {/* ========================================================================= */}
      {isWarehouseInboundModalOpen && isOwner && (
        <Modal
          isOpen={isWarehouseInboundModalOpen && isOwner}
          onClose={() => setIsWarehouseInboundModalOpen(false)}
          title="Receive Warehouse Stock (Inbound Shipment)"
        >
          <form onSubmit={handleWarehouseInboundSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-purple-50 text-purple-900 rounded-xl border border-purple-200">
              <p className="font-bold flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-purple-700" />
                Primary Hub Stock Inflow
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Bulk shipment received from wholesale distributor directly into central warehouse storage.
              </p>
            </div>

            {/* Target Warehouse */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Warehouse:</label>
              <select
                value={warehouseInboundForm.warehouseId}
                onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, warehouseId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                ))}
              </select>
            </div>

            {/* Intake Mode Switcher: Single Item vs Bulk Restock */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsInboundBulkMode(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  !isInboundBulkMode
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Single Item</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInboundBulkMode(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  isInboundBulkMode
                    ? 'bg-purple-700 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Bulk Restock (Multi-Item)</span>
              </button>
            </div>

            {isInboundBulkMode ? (
              /* Bulk / Multi-Item Restock Manifest */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Shipment Item Manifest</span>
                    <p className="text-[10px] text-slate-500">Receive multiple existing or new products together</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBulkInboundRow(false)}
                      className="h-8 text-xs font-bold border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Existing Item</span>
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddBulkInboundRow(true)}
                      className="h-8 text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ New Item</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-0.5">
                  {bulkInboundItems.map((item, index) => {
                    const targetWh = warehouses.find(w => w.id === warehouseInboundForm.warehouseId)
                    const lineSubtotal = (parseInt(item.quantity, 10) || 0) * (parseFloat(item.costPerUnit) || 0)

                    return (
                      <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item #{index + 1}</span>
                            {item.isNewProduct ? (
                              <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">✨ New Product</span>
                            ) : (
                              <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded-full">Existing Item</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateBulkInboundRow(item.id, 'isNewProduct', !item.isNewProduct)}
                              className="text-[10px] font-semibold text-purple-700 hover:underline px-1 py-0.5"
                            >
                              {item.isNewProduct ? 'Pick Existing' : '+ Convert to New'}
                            </button>
                            {bulkInboundItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkInboundRow(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {item.isNewProduct ? (
                          <div className="space-y-1.5 p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                            <div>
                              <label className="block text-[10px] font-bold text-purple-900 mb-0.5">New Product Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Ethiopian Highland Coffee"
                                value={item.newProductName || ''}
                                onChange={(e) => handleUpdateBulkInboundRow(item.id, 'newProductName', e.target.value)}
                                className="w-full p-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Category</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Groceries"
                                  value={item.newProductCategory || ''}
                                  onChange={(e) => handleUpdateBulkInboundRow(item.id, 'newProductCategory', e.target.value)}
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Retail Selling Price (ETB) *</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={item.newProductSellingPrice || '30'}
                                  onChange={(e) => handleUpdateBulkInboundRow(item.id, 'newProductSellingPrice', e.target.value)}
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Product</label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleUpdateBulkInboundRow(item.id, 'productId', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold min-h-[38px]"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Wh Stock: {targetWh?.stock[p.id] || 0})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleUpdateBulkInboundRow(item.id, 'quantity', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Cost/Unit (ETB)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.costPerUnit}
                              onChange={(e) => handleUpdateBulkInboundRow(item.id, 'costPerUnit', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                            />
                          </div>
                          <div className="text-right pb-1">
                            <span className="block text-[10px] text-slate-400">Subtotal</span>
                            <span className="text-xs font-black text-purple-900">
                              {formatCurrency(lineSubtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bulk Shipment Summary Card */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="block text-[11px] font-medium text-purple-700">Total Shipment Manifest:</span>
                    <span className="font-bold text-purple-900">
                      {bulkInboundItems.length} Products &bull; {bulkInboundItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} Total Units
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-purple-600 font-medium">Grand Total Cost</span>
                    <span className="text-base font-black text-purple-900">
                      {formatCurrency(
                        bulkInboundItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0) * (parseFloat(it.costPerUnit) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Single Item Intake */
              <>
                {/* Product Mode Toggle: Existing Product vs Create New Product */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsInboundCreatingNewProduct(false)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation ${
                      !isInboundCreatingNewProduct
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Existing Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInboundCreatingNewProduct(true)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation ${
                      isInboundCreatingNewProduct
                        ? 'bg-white text-purple-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    New Product
                  </button>
                </div>

                {/* 1A. Existing Product Selection */}
                {!isInboundCreatingNewProduct ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Product to Restock:</label>
                    <input
                      type="text"
                      placeholder="Search product to filter..."
                      value={inboundProductSearch}
                      onChange={(e) => setInboundProductSearch(e.target.value)}
                      className="w-full mb-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={warehouseInboundForm.productId}
                      onChange={(e) => {
                        const prod = products.find(p => p.id === e.target.value)
                        setWarehouseInboundForm({
                          ...warehouseInboundForm,
                          productId: e.target.value,
                          costPerUnit: prod ? prod.costPrice : warehouseInboundForm.costPerUnit
                        })
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
                    >
                      {products
                        .filter(p => !inboundProductSearch || p.name.toLowerCase().includes(inboundProductSearch.toLowerCase()))
                        .map(p => {
                          const wh = warehouses.find(w => w.id === warehouseInboundForm.warehouseId)
                          const curWhQty = wh?.stock[p.id] || 0
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} &bull; Current Warehouse Stock: {curWhQty}
                            </option>
                          )
                        })}
                    </select>
                  </div>
                ) : (
                  /* 1B. Inline Create New Product Fields */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <p className="font-bold text-purple-900 text-xs">New Product Details</p>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ethiopian Highland Yirgacheffe Beans (1kg)"
                        value={warehouseInboundForm.newProductName}
                        onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, newProductName: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Category</label>
                        <input
                          type="text"
                          placeholder="e.g. Groceries, Beverages"
                          value={warehouseInboundForm.newProductCategory}
                          onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, newProductCategory: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Retail Selling Price (ETB) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={warehouseInboundForm.newProductSellingPrice}
                          onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, newProductSellingPrice: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity & Unit Cost */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Inbound Quantity (Units):</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={warehouseInboundForm.quantity}
                      onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, quantity: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Wholesale Cost / Unit (ETB):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={isInboundCreatingNewProduct ? warehouseInboundForm.newProductCostPrice : warehouseInboundForm.costPerUnit}
                      onChange={(e) => {
                        if (isInboundCreatingNewProduct) {
                          setWarehouseInboundForm({ ...warehouseInboundForm, newProductCostPrice: e.target.value })
                        } else {
                          setWarehouseInboundForm({ ...warehouseInboundForm, costPerUnit: e.target.value })
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Live Total Cost Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Purchase Cost:</span>
                  <span className="text-sm font-black text-purple-900">
                    {formatCurrency(
                      (parseInt(warehouseInboundForm.quantity, 10) || 0) * 
                      (parseFloat(isInboundCreatingNewProduct ? warehouseInboundForm.newProductCostPrice : warehouseInboundForm.costPerUnit) || 0)
                    )}
                  </span>
                </div>
              </>
            )}

            {/* Payment Method */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method Used:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Banking', 'Credit'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setWarehouseInboundForm({ ...warehouseInboundForm, paymentMethod: method })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all touch-manipulation ${
                      warehouseInboundForm.paymentMethod === method
                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Ethiopian Banking Dropdown */}
            {warehouseInboundForm.paymentMethod === 'Banking' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <label className="block font-bold text-blue-900">Ethiopian Bank / Digital Wallet:</label>
                <select
                  value={warehouseInboundForm.bankProvider}
                  onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, bankProvider: e.target.value })}
                  className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-bold min-h-[44px]"
                >
                  {ETHIOPIAN_PAYMENT_PROVIDERS.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Supplier Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wholesale Supplier / Vendor:</label>
              <input
                type="text"
                placeholder="e.g. Merkato Wholesale Hub / Importer"
                value={warehouseInboundForm.supplierName}
                onChange={(e) => setWarehouseInboundForm({ ...warehouseInboundForm, supplierName: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsWarehouseInboundModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px] bg-purple-700 hover:bg-purple-800 text-white shadow-sm">
                {isInboundBulkMode
                  ? `Confirm Inbound (${bulkInboundItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} units)`
                  : 'Confirm Restock'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 2. SEARCHABLE PRODUCT PRICING & COMMISSION ADJUSTMENT MODAL (OWNER ONLY) */}
      {/* ========================================================================= */}
      {isProductPricingModalOpen && (
        <Modal
          isOpen={isProductPricingModalOpen}
          onClose={() => setIsProductPricingModalOpen(false)}
          title="Search & Adjust Product Pricing"
        >
          <div className="space-y-4 text-xs">
            
            {/* Live Search Bar for Products */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Search Product to Adjust:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search product to adjust (e.g., Teff, Coffee)..."
                  value={pricingSearchQuery}
                  onChange={(e) => setPricingSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
                {pricingSearchQuery && (
                  <button
                    onClick={() => setPricingSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results List (Scrollable Cards) */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Product ({pricingFilteredProducts.length} available):
              </p>
              {pricingFilteredProducts.length === 0 ? (
                <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-xl">
                  No products found matching "{pricingSearchQuery}"
                </div>
              ) : (
                pricingFilteredProducts.map(p => {
                  const isSelected = p.id === productPricingForm.productId
                  const totalStock = getTotalStock(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProductInPricing(p)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between touch-manipulation ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                            {p.name}
                          </span>
                          {p.category && <span className="text-[10px] text-slate-400">&bull; {p.category}</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Sell: <span className="font-semibold text-slate-800">{formatCurrency(p.sellingPrice)}</span> &bull; 
                          Cost: {formatCurrency(p.costPrice)} &bull; 
                          Comm: {p.defaultCommissionRate || 5}%
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={totalStock > 0 ? 'success' : 'danger'} className="text-[10px]">
                          {totalStock} in stock
                        </Badge>
                        {isSelected && (
                          <div className="flex items-center justify-end text-[10px] text-emerald-700 font-bold mt-1">
                            <Check className="w-3.5 h-3.5 mr-0.5" /> Selected
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Active Product Form */}
            {activePricingProduct && (
              <form onSubmit={handleProductPricingSubmit} className="pt-2 border-t border-slate-200 space-y-3.5">
                
                {/* Active Product Banner */}
                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">{activePricingProduct.name}</div>
                    <div className="text-[10px] text-slate-400">Total Stock: {getTotalStock(activePricingProduct.id)} units across all locations</div>
                  </div>
                  <Badge variant="purple" className="text-[10px]">Owner Override</Badge>
                </div>

                {/* Selling & Cost Price */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price (ETB):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={productPricingForm.sellingPrice}
                      onChange={(e) => setProductPricingForm({ ...productPricingForm, sellingPrice: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cost Price (ETB):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={productPricingForm.costPrice}
                      onChange={(e) => setProductPricingForm({ ...productPricingForm, costPrice: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Profit Margin & Commission Preview Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Gross Profit per Unit:</span>
                    <span className={`font-bold ${grossProfitPerUnit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatCurrency(grossProfitPerUnit)} ({profitMarginPercent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Salesperson Commission:</span>
                    <span className="font-bold text-purple-700">
                      +{formatCurrency(commissionPerUnit)} / sale ({commissionRateNum}%)
                    </span>
                  </div>
                </div>

                {/* Commission Rate & Quick Preset Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Commission Rate (%):</label>
                    <span className="text-[10px] text-slate-400">Quick presets:</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {[2, 5, 7.5, 10, 15].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setProductPricingForm({ ...productPricingForm, defaultCommissionRate: rate })}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors touch-manipulation ${
                          commissionRateNum === rate
                            ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={productPricingForm.defaultCommissionRate}
                    onChange={(e) => setProductPricingForm({ ...productPricingForm, defaultCommissionRate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Min Stock Alert Threshold */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Threshold (Units):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productPricingForm.minStockThreshold}
                    onChange={(e) => setProductPricingForm({ ...productPricingForm, minStockThreshold: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Toast Notification */}
                {pricingSavedToast && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs">Pricing & commission updated successfully!</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    type="button"
                    onClick={() => setIsProductPricingModalOpen(false)}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    className="w-full sm:w-auto font-bold min-h-[44px] shadow-sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MODAL: ADD PRODUCT DIRECTLY TO WAREHOUSE                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isWarehouseAddProductOpen && (
        <Modal
          isOpen={isWarehouseAddProductOpen}
          onClose={() => setIsWarehouseAddProductOpen(false)}
          title={`Add Product to ${activeLocation?.name || 'Warehouse'}`}
        >
          <form onSubmit={handleWarehouseAddProductSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 text-purple-900 rounded-xl border border-purple-200">
              <p className="font-bold">Direct Warehouse Product Addition</p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Creates this product and immediately places initial stock directly into <strong>{activeLocation?.name}</strong>.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Arabica Coffee Beans (1kg)"
                value={warehouseAddProductForm.name}
                onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, name: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Electronics"
                  value={warehouseAddProductForm.category}
                  onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Stock (Units) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={warehouseAddProductForm.initialQuantity}
                  onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, initialQuantity: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Selling Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={warehouseAddProductForm.sellingPrice}
                  onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, sellingPrice: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-emerald-700 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={warehouseAddProductForm.costPrice}
                  onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, costPrice: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={warehouseAddProductForm.minStockThreshold}
                onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, minStockThreshold: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setIsWarehouseAddProductOpen(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                Add Product to Warehouse
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MODAL: DIRECT PURCHASE TO WAREHOUSE (MULTI-ITEM)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isWarehouseDirectPurchaseOpen && (
        <Modal
          isOpen={isWarehouseDirectPurchaseOpen}
          onClose={() => setIsWarehouseDirectPurchaseOpen(false)}
          title={`Direct Purchase to ${activeLocation?.name || 'Warehouse'}`}
        >
          <form onSubmit={handleWarehouseDirectPurchaseSubmit} className="space-y-4 text-xs">
            {/* Header: Items Manifest with + Add Item button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-800 text-sm">
                  Purchased Products {warehousePurchaseItems.length > 1 && `(${warehousePurchaseItems.length})`}
                </span>
                <p className="text-[11px] text-slate-500">
                  Add one or more items to purchase and stock in this warehouse
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWarehousePurchaseRow}
                className="h-8 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-slate-700" />
                <span>+ Add Item</span>
              </Button>
            </div>

            {/* Multi-Item Rows */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-0.5">
              {warehousePurchaseItems.map((item, index) => {
                const subtotal = (parseInt(item.quantity, 10) || 0) * (parseFloat(item.costPerUnit) || 0)
                return (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {warehousePurchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWarehousePurchaseRow(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs font-bold rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateWarehousePurchaseRow(item.id, 'productId', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[42px] font-bold text-xs"
                      >
                        <option value="">Choose a product...</option>
                        {products.map(p => {
                          const curStock = activeLocation?.stock?.[p.id] || 0
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (Current Stock: {curStock})
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 items-end">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateWarehousePurchaseRow(item.id, 'quantity', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg min-h-[40px] font-black text-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Cost / Unit (ETB) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.costPerUnit}
                          onChange={(e) => handleUpdateWarehousePurchaseRow(item.id, 'costPerUnit', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg min-h-[40px] font-bold text-slate-800 text-xs"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 p-2 bg-white border border-slate-200 rounded-lg flex flex-col justify-center min-h-[40px]">
                        <span className="text-[10px] text-slate-400 font-semibold">Subtotal</span>
                        <span className="font-black text-slate-900 text-xs">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Cost Display */}
            {(() => {
              const totalCost = warehousePurchaseItems.reduce((acc, it) => {
                const q = parseInt(it.quantity, 10) || 0
                const c = parseFloat(it.costPerUnit) || 0
                return acc + (q * c)
              }, 0)
              const totalUnits = warehousePurchaseItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)

              return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 font-bold text-xs block">Total Purchase Cost</span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {warehousePurchaseItems.length} item{warehousePurchaseItems.length > 1 ? 's' : ''} • {totalUnits} total units
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-950">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              )
            })()}

            {/* Purchase / Payment Method: Banking, Telebirr, Cash */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Purchase Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Banking', label: 'Banking', icon: Landmark },
                  { id: 'Telebirr', label: 'Telebirr', icon: Smartphone },
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                ].map(({ id, label, icon: Icon }) => {
                  const isSelected = warehouseDirectPurchaseForm.paymentMethod === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setWarehouseDirectPurchaseForm(prev => ({ ...prev, paymentMethod: id }))}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all touch-manipulation cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment Method Specific Inputs */}
            {warehouseDirectPurchaseForm.paymentMethod === 'Banking' && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">Select Bank Provider:</label>
                  <select
                    value={warehouseDirectPurchaseForm.bankProvider}
                    onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, bankProvider: e.target.value }))}
                    className="w-full p-2 bg-white border border-purple-200 rounded-lg font-bold min-h-[40px]"
                  >
                    {ETHIOPIAN_PAYMENT_PROVIDERS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-purple-900 mb-0.5">Bank Reference / Transaction #:</label>
                  <input
                    type="text"
                    placeholder="e.g. FT2609A98BC1"
                    value={warehouseDirectPurchaseForm.bankReference}
                    onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, bankReference: e.target.value }))}
                    className="w-full p-2 bg-white border border-purple-200 rounded-lg font-medium"
                  />
                </div>
              </div>
            )}

            {warehouseDirectPurchaseForm.paymentMethod === 'Telebirr' && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <label className="block font-bold text-emerald-950 mb-0.5">Telebirr Transaction # or Phone:</label>
                <input
                  type="text"
                  placeholder="e.g. TB9823412 or +251 9..."
                  value={warehouseDirectPurchaseForm.telebirrReference}
                  onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, telebirrReference: e.target.value }))}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Name (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Central Wholesalers Ltd."
                value={warehouseDirectPurchaseForm.supplierName}
                onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, supplierName: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setIsWarehouseDirectPurchaseOpen(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full sm:w-auto font-bold min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Record Direct Purchase
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MODAL: TRANSFER STOCK FROM WAREHOUSE (MULTI-ITEM)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isWarehouseTransferOpen && (
        <Modal
          isOpen={isWarehouseTransferOpen}
          onClose={() => setIsWarehouseTransferOpen(false)}
          title={`Transfer Stock from ${activeLocation?.name || 'Warehouse'}`}
        >
          <form onSubmit={handleWarehouseTransferSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Source Warehouse</span>
              <p className="text-sm font-black text-purple-950 mt-0.5">{activeLocation?.name} ({activeLocation?.location})</p>
            </div>

            {/* Destination Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination Location *</label>
              <select
                value={warehouseTransferForm.toWarehouseId ? `wh-${warehouseTransferForm.toWarehouseId}` : (warehouseTransferForm.toStoreId ? `st-${warehouseTransferForm.toStoreId}` : '')}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.startsWith('wh-')) {
                    setWarehouseTransferForm(prev => ({ ...prev, toWarehouseId: val.replace('wh-', ''), toStoreId: '' }))
                  } else if (val.startsWith('st-')) {
                    setWarehouseTransferForm(prev => ({ ...prev, toStoreId: val.replace('st-', ''), toWarehouseId: '' }))
                  } else {
                    setWarehouseTransferForm(prev => ({ ...prev, toWarehouseId: '', toStoreId: '' }))
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-sm"
              >
                <option value="">Select Destination Location...</option>
                {warehouses.filter(w => w.id !== activeLocation?.id).length > 0 && (
                  <optgroup label="Warehouses">
                    {warehouses.filter(w => w.id !== activeLocation?.id).map(w => (
                      <option key={w.id} value={`wh-${w.id}`}>
                        Warehouse: {w.name} ({w.location})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Retail Stores">
                  {stores.map(s => (
                    <option key={s.id} value={`st-${s.id}`}>
                      Retail Store: {s.name} ({s.location})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Header: Items Manifest with + Add Item button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-800 text-sm">
                  Items to Transfer {warehouseTransferItems.length > 1 && `(${warehouseTransferItems.length})`}
                </span>
                <p className="text-[11px] text-slate-500">
                  Transfer one or multiple products to the chosen destination
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWarehouseTransferRow}
                className="h-8 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-slate-700" />
                <span>+ Add Item</span>
              </Button>
            </div>

            {/* Multi-Item Transfer Rows */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-0.5">
              {warehouseTransferItems.map((item, index) => {
                const available = activeLocation?.stock?.[item.productId] || 0
                const qtyNum = parseInt(item.quantity, 10) || 0
                const isOverLimit = qtyNum > available

                return (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {warehouseTransferItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWarehouseTransferRow(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs font-bold rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Select Product *</label>
                        <span className={`text-[11px] font-bold ${available > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          Available: {available} units
                        </span>
                      </div>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateWarehouseTransferRow(item.id, 'productId', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[42px] font-bold text-xs"
                      >
                        <option value="">Choose a product...</option>
                        {products.map(p => {
                          const pAvail = activeLocation?.stock?.[p.id] || 0
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({pAvail} in stock)
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        max={available || 1}
                        required
                        value={item.quantity}
                        onChange={(e) => handleUpdateWarehouseTransferRow(item.id, 'quantity', e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl min-h-[42px] font-black text-slate-900 text-sm ${
                          isOverLimit ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-300'
                        }`}
                      />
                      {isOverLimit && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          Exceeds available stock ({available})
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Transfer Summary */}
            {(() => {
              const totalUnits = warehouseTransferItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)
              return (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <span className="text-purple-900 font-bold text-xs">Total Units to Transfer:</span>
                  <span className="text-sm font-black text-purple-950">
                    {totalUnits} units across {warehouseTransferItems.length} product{warehouseTransferItems.length > 1 ? 's' : ''}
                  </span>
                </div>
              )
            })()}

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setIsWarehouseTransferOpen(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                Transfer Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: ADD PRODUCT DIRECTLY TO STORE                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isStoreAddProductOpen && (
        <Modal
          isOpen={isStoreAddProductOpen}
          onClose={() => setIsStoreAddProductOpen(false)}
          title={`Add Product to ${activeLocation?.name || 'Store'}`}
        >
          <form onSubmit={handleStoreAddProductSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
              <p className="font-bold">Direct Store Product Addition</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Creates this product and immediately places initial stock directly into <strong>{activeLocation?.name}</strong>.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bottled Water (500ml)"
                value={storeAddProductForm.name}
                onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, name: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Beverages, Snacks"
                  value={storeAddProductForm.category}
                  onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Stock (Units) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={storeAddProductForm.initialQuantity}
                  onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, initialQuantity: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Selling Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={storeAddProductForm.sellingPrice}
                  onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, sellingPrice: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-emerald-700 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={storeAddProductForm.costPrice}
                  onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, costPrice: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={storeAddProductForm.minStockThreshold}
                onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, minStockThreshold: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setIsStoreAddProductOpen(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                Add Product to Store
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. MODAL: DIRECT PURCHASE TO STORE (MULTI-ITEM)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isStoreDirectPurchaseOpen && (
        <Modal
          isOpen={isStoreDirectPurchaseOpen}
          onClose={() => setIsStoreDirectPurchaseOpen(false)}
          title={`Direct Purchase to ${activeLocation?.name || 'Store'}`}
        >
          <form onSubmit={handleStoreDirectPurchaseSubmit} className="space-y-4 text-xs">
            {/* Header: Items Manifest with + Add Item button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-800 text-sm">
                  Purchased Products {storePurchaseItems.length > 1 && `(${storePurchaseItems.length})`}
                </span>
                <p className="text-[11px] text-slate-500">
                  Add one or more items to purchase directly into this store
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStorePurchaseRow}
                className="h-8 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-slate-700" />
                <span>+ Add Item</span>
              </Button>
            </div>

            {/* Multi-Item Rows */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-0.5">
              {storePurchaseItems.map((item, index) => {
                const subtotal = (parseInt(item.quantity, 10) || 0) * (parseFloat(item.costPerUnit) || 0)
                return (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {storePurchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStorePurchaseRow(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs font-bold rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateStorePurchaseRow(item.id, 'productId', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[42px] font-bold text-xs"
                      >
                        <option value="">Choose a product...</option>
                        {products.map(p => {
                          const curStock = activeLocation?.stock?.[p.id] || 0
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (Current Stock: {curStock})
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 items-end">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateStorePurchaseRow(item.id, 'quantity', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg min-h-[40px] font-black text-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Cost / Unit (ETB) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.costPerUnit}
                          onChange={(e) => handleUpdateStorePurchaseRow(item.id, 'costPerUnit', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg min-h-[40px] font-bold text-slate-800 text-xs"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 p-2 bg-white border border-slate-200 rounded-lg flex flex-col justify-center min-h-[40px]">
                        <span className="text-[10px] text-slate-400 font-semibold">Subtotal</span>
                        <span className="font-black text-slate-900 text-xs">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Cost Display */}
            {(() => {
              const totalCost = storePurchaseItems.reduce((acc, it) => {
                const q = parseInt(it.quantity, 10) || 0
                const c = parseFloat(it.costPerUnit) || 0
                return acc + (q * c)
              }, 0)
              const totalUnits = storePurchaseItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)

              return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 font-bold text-xs block">Total Purchase Cost</span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {storePurchaseItems.length} item{storePurchaseItems.length > 1 ? 's' : ''} • {totalUnits} total units
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-950">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              )
            })()}

            {/* Purchase / Payment Method: Banking, Telebirr, Cash */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Purchase Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Banking', label: 'Banking', icon: Landmark },
                  { id: 'Telebirr', label: 'Telebirr', icon: Smartphone },
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                ].map(({ id, label, icon: Icon }) => {
                  const isSelected = storeDirectPurchaseForm.paymentMethod === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStoreDirectPurchaseForm(prev => ({ ...prev, paymentMethod: id }))}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all touch-manipulation cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment Method Specific Inputs */}
            {storeDirectPurchaseForm.paymentMethod === 'Banking' && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">Select Bank Provider:</label>
                  <select
                    value={storeDirectPurchaseForm.bankProvider}
                    onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, bankProvider: e.target.value }))}
                    className="w-full p-2 bg-white border border-purple-200 rounded-lg font-bold min-h-[40px]"
                  >
                    {ETHIOPIAN_PAYMENT_PROVIDERS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-purple-900 mb-0.5">Bank Reference / Transaction #:</label>
                  <input
                    type="text"
                    placeholder="e.g. FT2609A98BC1"
                    value={storeDirectPurchaseForm.bankReference}
                    onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, bankReference: e.target.value }))}
                    className="w-full p-2 bg-white border border-purple-200 rounded-lg font-medium"
                  />
                </div>
              </div>
            )}

            {storeDirectPurchaseForm.paymentMethod === 'Telebirr' && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <label className="block font-bold text-emerald-950 mb-0.5">Telebirr Transaction # or Phone:</label>
                <input
                  type="text"
                  placeholder="e.g. TB9823412 or +251 9..."
                  value={storeDirectPurchaseForm.telebirrReference}
                  onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, telebirrReference: e.target.value }))}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Name (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Local Merchant Supply"
                value={storeDirectPurchaseForm.supplierName}
                onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, supplierName: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setIsStoreDirectPurchaseOpen(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full sm:w-auto font-bold min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Record Direct Purchase
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. MODAL: TRANSFER STOCK FROM STORE (MULTI-ITEM)              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isStoreTransferOpen && (
        <Modal
          isOpen={isStoreTransferOpen}
          onClose={() => setIsStoreTransferOpen(false)}
          title={`Transfer Stock from ${activeLocation?.name || 'Store'}`}
        >
          <form onSubmit={handleStoreTransferSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Source Store</span>
              <p className="text-sm font-black text-emerald-950 mt-0.5">{activeLocation?.name} ({activeLocation?.location})</p>
            </div>

            {/* Destination Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination Location *</label>
              <select
                value={storeTransferForm.toWarehouseId ? `wh-${storeTransferForm.toWarehouseId}` : (storeTransferForm.toStoreId ? `st-${storeTransferForm.toStoreId}` : '')}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.startsWith('wh-')) {
                    setStoreTransferForm(prev => ({ ...prev, toWarehouseId: val.replace('wh-', ''), toStoreId: '' }))
                  } else if (val.startsWith('st-')) {
                    setStoreTransferForm(prev => ({ ...prev, toStoreId: val.replace('st-', ''), toWarehouseId: '' }))
                  } else {
                    setStoreTransferForm(prev => ({ ...prev, toWarehouseId: '', toStoreId: '' }))
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-sm"
              >
                <option value="">Select Destination Location...</option>
                {warehouses.length > 0 && (
                  <optgroup label="Warehouses">
                    {warehouses.map(w => (
                      <option key={w.id} value={`wh-${w.id}`}>
                        Warehouse: {w.name} ({w.location})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Retail Stores">
                  {stores.filter(s => s.id !== activeLocation?.id).map(s => (
                    <option key={s.id} value={`st-${s.id}`}>
                      Store: {s.name} ({s.location})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Header: Items Manifest with + Add Item button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-800 text-sm">
                  Items to Transfer {storeTransferItems.length > 1 && `(${storeTransferItems.length})`}
                </span>
                <p className="text-[11px] text-slate-500">
                  Transfer one or multiple products to the chosen destination
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStoreTransferRow}
                className="h-8 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-slate-700" />
                <span>+ Add Item</span>
              </Button>
            </div>

            {/* Multi-Item Transfer Rows */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-0.5">
              {storeTransferItems.map((item, index) => {
                const available = activeLocation?.stock?.[item.productId] || 0
                const qtyNum = parseInt(item.quantity, 10) || 0
                const isOverLimit = qtyNum > available

                return (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {storeTransferItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStoreTransferRow(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs font-bold rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Select Product *</label>
                        <span className={`text-[11px] font-bold ${available > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          Available: {available} units
                        </span>
                      </div>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateStoreTransferRow(item.id, 'productId', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[42px] font-bold text-xs"
                      >
                        <option value="">Choose a product...</option>
                        {products.map(p => {
                          const pAvail = activeLocation?.stock?.[p.id] || 0
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({pAvail} in stock)
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        max={available || 1}
                        required
                        value={item.quantity}
                        onChange={(e) => handleUpdateStoreTransferRow(item.id, 'quantity', e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl min-h-[42px] font-black text-slate-900 text-sm ${
                          isOverLimit ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-300'
                        }`}
                      />
                      {isOverLimit && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          Exceeds available stock ({available})
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Transfer Summary */}
            {(() => {
              const totalUnits = storeTransferItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)
              return (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <span className="text-purple-900 font-bold text-xs">Total Units to Transfer:</span>
                  <span className="text-sm font-black text-purple-950">
                    {totalUnits} units across {storeTransferItems.length} product{storeTransferItems.length > 1 ? 's' : ''}
                  </span>
                </div>
              )
            })()}

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setIsStoreTransferOpen(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                Transfer Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 3. STOCK TRANSFER SLIDE-UP MODAL (SEARCHABLE) */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Transfer Stock from Warehouse"
        >
          <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">From Warehouse:</label>
              <select
                value={transferForm.fromWarehouseId}
                onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination Retail Store:</label>
              <select
                value={transferForm.toStoreId}
                onChange={(e) => setTransferForm({ ...transferForm, toStoreId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>

            {/* Items Manifest Header with prominent "+ Add Item" on top */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-bold text-slate-800 text-xs">
                  Items to Transfer {transferItems.length > 1 && `(${transferItems.length})`}
                </span>
                <p className="text-[10px] text-slate-500">
                  {transferItems.length === 1
                    ? 'Default single product transfer'
                    : `Multi-item dispatch (${transferItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} units total)`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTransferItem}
                className="h-8 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-700" />
                <span>+ Add Item</span>
              </Button>
            </div>

            {/* Items List */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-0.5">
              {transferItems.map((item, index) => {
                const currentWh = warehouses.find(w => w.id === transferForm.fromWarehouseId)
                const availableQty = currentWh?.stock[item.productId] || 0
                const qtyNum = parseInt(item.quantity, 10) || 0
                const isOverLimit = qtyNum > availableQty

                return (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {transferItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTransferItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateTransferItem(item.id, 'productId', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold min-h-[38px]"
                      >
                        {products.map(p => {
                          const whStock = currentWh?.stock[p.id] || 0
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (Wh Available: {whStock})
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Quantity to Dispatch</label>
                        <input
                          type="number"
                          min="1"
                          max={availableQty}
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateTransferItem(item.id, 'quantity', e.target.value)}
                          className={`w-full p-2 bg-white border rounded-lg text-xs font-bold ${
                            isOverLimit ? 'border-red-400 text-red-600 bg-red-50/50' : 'border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Warehouse Available</span>
                        <span className={`text-xs font-bold ${availableQty === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          {availableQty} units
                        </span>
                      </div>
                    </div>

                    {isOverLimit && (
                      <p className="text-[10px] text-red-600 font-semibold">
                        ⚠️ Exceeds warehouse stock of {availableQty} units.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Total Summary Footer if multiple items */}
            {transferItems.length > 1 && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="block text-[11px] font-medium text-slate-600">Total Dispatch Manifest:</span>
                  <span className="font-bold text-slate-900">
                    {transferItems.length} Products &bull; {transferItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} Total Units
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsTransferModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                {transferItems.length > 1
                  ? `Bulk Transfer (${transferItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} units)`
                  : 'Transfer Stock'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 4. DIRECT STORE PURCHASE MODAL */}
      {/* ========================================================================= */}
      {isPurchaseModalOpen && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title="Direct Store Purchase (External)"
        >
          <form onSubmit={handlePurchaseSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
              <p className="font-bold">Direct Store Inflow</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Adding stock directly to a store records an external purchase with payment tracking.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Retail Store:</label>
              <select
                value={purchaseForm.storeId}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, storeId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>

            {/* Purchase Mode Switcher: Single Item vs Bulk Purchase */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsPurchaseBulkMode(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  !isPurchaseBulkMode
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Single Item</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPurchaseBulkMode(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  isPurchaseBulkMode
                    ? 'bg-emerald-700 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bulk Purchase (Multi-Item)</span>
              </button>
            </div>

            {isPurchaseBulkMode ? (
              /* Bulk Purchase Manifest */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Purchase Manifest</span>
                    <p className="text-[10px] text-slate-500">Receive multiple existing or new products into store</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBulkPurchaseRow(false)}
                      className="h-8 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Existing Item</span>
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddBulkPurchaseRow(true)}
                      className="h-8 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ New Item</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-0.5">
                  {bulkPurchaseItems.map((item, index) => {
                    const lineSubtotal = (parseInt(item.quantity, 10) || 0) * (parseFloat(item.costPerUnit) || 0)

                    return (
                      <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item #{index + 1}</span>
                            {item.isNewProduct ? (
                              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">✨ New Product</span>
                            ) : (
                              <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded-full">Existing Item</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateBulkPurchaseRow(item.id, 'isNewProduct', !item.isNewProduct)}
                              className="text-[10px] font-semibold text-emerald-700 hover:underline px-1 py-0.5"
                            >
                              {item.isNewProduct ? 'Pick Existing' : '+ Convert to New'}
                            </button>
                            {bulkPurchaseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkPurchaseRow(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {item.isNewProduct ? (
                          <div className="space-y-1.5 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">New Product Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Merkato Cotton T-Shirts"
                                value={item.newProductName || ''}
                                onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'newProductName', e.target.value)}
                                className="w-full p-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Category</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Apparel"
                                  value={item.newProductCategory || ''}
                                  onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'newProductCategory', e.target.value)}
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Retail Price (ETB) *</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={item.newProductSellingPrice || '30'}
                                  onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'newProductSellingPrice', e.target.value)}
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Product</label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'productId', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold min-h-[38px]"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Current Cost: {formatCurrency(p.costPrice)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'quantity', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Cost/Unit (ETB)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.costPerUnit}
                              onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'costPerUnit', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                            />
                          </div>
                          <div className="text-right pb-1">
                            <span className="block text-[10px] text-slate-400">Subtotal</span>
                            <span className="text-xs font-black text-emerald-700">
                              {formatCurrency(lineSubtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bulk Purchase Summary Card */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="block text-[11px] font-medium text-emerald-700">Total Purchase Manifest:</span>
                    <span className="font-bold text-emerald-950">
                      {bulkPurchaseItems.length} Products &bull; {bulkPurchaseItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} Total Units
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-emerald-600 font-medium">Grand Total Cost</span>
                    <span className="text-base font-black text-emerald-800">
                      {formatCurrency(
                        bulkPurchaseItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0) * (parseFloat(it.costPerUnit) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Single Item Purchase */
              <>
                {/* Product Mode Toggle: Existing Product vs Create New Product */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsPurchaseCreatingNewProduct(false)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation ${
                      !isPurchaseCreatingNewProduct
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Existing Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPurchaseCreatingNewProduct(true)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation ${
                      isPurchaseCreatingNewProduct
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    New Product
                  </button>
                </div>

                {!isPurchaseCreatingNewProduct ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Product:</label>
                    <input
                      type="text"
                      placeholder="Search product..."
                      value={purchaseProductSearch}
                      onChange={(e) => setPurchaseProductSearch(e.target.value)}
                      className="w-full mb-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={purchaseForm.productId}
                      onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value)
                        setPurchaseForm({
                          ...purchaseForm,
                          productId: e.target.value,
                          costPerUnit: p ? p.costPrice : purchaseForm.costPerUnit
                        })
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
                    >
                      {products
                        .filter(p => !purchaseProductSearch || p.name.toLowerCase().includes(purchaseProductSearch.toLowerCase()))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Current Cost: {formatCurrency(p.costPrice)})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  /* New Product Fields for Direct Purchase */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <p className="font-bold text-emerald-900 text-xs">New Product Details</p>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Merkato Cotton T-Shirts"
                        value={purchaseForm.newProductName}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, newProductName: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Category</label>
                        <input
                          type="text"
                          placeholder="e.g. Apparel"
                          value={purchaseForm.newProductCategory}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, newProductCategory: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Retail Selling Price (ETB) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={purchaseForm.newProductSellingPrice}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, newProductSellingPrice: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantity Received:</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={purchaseForm.quantity}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cost Per Unit (ETB):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={isPurchaseCreatingNewProduct ? purchaseForm.newProductCostPrice : purchaseForm.costPerUnit}
                      onChange={(e) => {
                        if (isPurchaseCreatingNewProduct) {
                          setPurchaseForm({ ...purchaseForm, newProductCostPrice: e.target.value })
                        } else {
                          setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Live Total Cost Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Purchase Cost:</span>
                  <span className="text-sm font-black text-emerald-800">
                    {formatCurrency(
                      (parseInt(purchaseForm.quantity, 10) || 0) * 
                      (parseFloat(isPurchaseCreatingNewProduct ? purchaseForm.newProductCostPrice : purchaseForm.costPerUnit) || 0)
                    )}
                  </span>
                </div>
              </>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method Used:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Banking', 'Credit'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: method })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all touch-manipulation ${
                      purchaseForm.paymentMethod === method
                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {purchaseForm.paymentMethod === 'Banking' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <label className="block font-bold text-blue-900">Ethiopian Bank / Digital Wallet:</label>
                <select
                  value={purchaseForm.bankProvider}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, bankProvider: e.target.value })}
                  className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-bold min-h-[44px]"
                >
                  {ETHIOPIAN_PAYMENT_PROVIDERS.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier / Vendor Name (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Merkato Wholesalers"
                value={purchaseForm.supplierName}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsPurchaseModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
                {isPurchaseBulkMode
                  ? `Confirm Purchase (${bulkPurchaseItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)} units)`
                  : 'Confirm Purchase & Stock In'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 4B. STANDALONE ADD PRODUCT MODAL (OWNER ONLY) */}
      {/* ========================================================================= */}
      {isAddProductModalOpen && (
        <Modal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          title="Create New Catalog Product"
        >
          <form onSubmit={handleCreateStandaloneProduct} className="space-y-3.5 text-xs">
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Add Product to Enterprise Catalog
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Register a new inventory product. You can optionally stock it immediately into a warehouse or store.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ethiopian Yirgacheffe Coffee Beans (500g)"
                value={standaloneProductForm.name}
                onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, name: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Beverages"
                  value={standaloneProductForm.category}
                  onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Retail Selling Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={standaloneProductForm.sellingPrice}
                  onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, sellingPrice: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-black text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wholesale Cost (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={standaloneProductForm.costPrice}
                  onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, costPrice: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl min-h-[40px] font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Comm (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={standaloneProductForm.defaultCommissionRate}
                  onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, defaultCommissionRate: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Low Alert Qty</label>
                <input
                  type="number"
                  value={standaloneProductForm.minStockThreshold}
                  onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, minStockThreshold: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl min-h-[40px]"
                />
              </div>
            </div>

            {/* Optional Initial Stock Placement */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-bold text-slate-800">Initial Stock Intake (Optional):</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'none', label: 'Catalog Only (0)' },
                  { id: 'warehouse', label: 'Central Warehouse' },
                  { id: 'store', label: 'Retail Store' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStandaloneProductForm({
                      ...standaloneProductForm,
                      initialDestination: opt.id,
                      initialDestinationId: opt.id === 'warehouse' ? (warehouses[0]?.id || '') : (stores[0]?.id || '')
                    })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors touch-manipulation ${
                      standaloneProductForm.initialDestination === opt.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {standaloneProductForm.initialDestination !== 'none' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Destination {standaloneProductForm.initialDestination === 'warehouse' ? 'Warehouse' : 'Store'}:
                    </label>
                    <select
                      value={standaloneProductForm.initialDestinationId}
                      onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, initialDestinationId: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold min-h-[38px]"
                    >
                      {standaloneProductForm.initialDestination === 'warehouse'
                        ? warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                        : stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Initial Units:</label>
                    <input
                      type="number"
                      min="1"
                      value={standaloneProductForm.initialQuantity}
                      onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, initialQuantity: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold min-h-[38px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsAddProductModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
                Create Product
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 5. OWNER STOCK OVERRIDE MODAL */}
      {/* ========================================================================= */}
      {isOverrideModalOpen && (
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title="Owner Stock Override"
        >
          <form onSubmit={handleOverrideSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Administrative Stock Override
              </p>
              <p className="text-[11px] text-amber-800 mt-1">
                Directly adjust stock counts without recording a sale or purchase. This adjustment will be permanently logged in the Audit Trail.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-slate-500">Target Location: <span className="font-bold text-slate-900">{overrideForm.locationName}</span></p>
              <p className="text-slate-500">Target Product: <span className="font-bold text-slate-900">{overrideForm.productName}</span></p>
              <p className="text-slate-500">Current Stock: <span className="font-black text-slate-900">{overrideForm.currentQuantity} units</span></p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Reconciled Quantity:</label>
              <input
                type="number"
                min="0"
                required
                value={overrideForm.newQuantity}
                onChange={(e) => setOverrideForm({ ...overrideForm, newQuantity: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-base font-black text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
              <input
                type="text"
                required
                placeholder="e.g. Physical inventory count, damaged goods write-off"
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsOverrideModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
                Save Reconciled Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. OWNER ADD STORE BRANCH MODAL */}
      {/* ========================================================================= */}
      {isAddStoreModalOpen && (
        <Modal
          isOpen={isAddStoreModalOpen}
          onClose={() => setIsAddStoreModalOpen(false)}
          title="Add New Retail Store Branch"
        >
          <form onSubmit={handleAddStoreSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Store Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. OMESTOCK Kazanchis Branch"
                value={newStoreForm.name}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Location / Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kazanchis, Addis Ababa"
                value={newStoreForm.location}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, location: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsAddStoreModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
                Create Store Branch
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
