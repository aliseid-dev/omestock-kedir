import React, { useState, useMemo } from 'react'
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
  Package
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

  // Global Page Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  // Modals
  const [isWarehouseInboundModalOpen, setIsWarehouseInboundModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const [isProductPricingModalOpen, setIsProductPricingModalOpen] = useState(false)
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false)

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
  const handleTransferSubmit = (e) => {
    e.preventDefault()
    const success = transferStock(transferForm, currentUser)
    if (success) {
      setIsTransferModalOpen(false)
    } else {
      alert('Could not complete transfer. Please verify warehouse stock.')
    }
  }

  // Submit Direct Store Purchase
  const handlePurchaseSubmit = (e) => {
    e.preventDefault()
    let bankProviderName = null
    if (purchaseForm.paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === purchaseForm.bankProvider)
      bankProviderName = bankObj ? bankObj.name : purchaseForm.bankProvider
    }

    recordDirectPurchase({
      ...purchaseForm,
      bankProvider: bankProviderName,
    }, currentUser)
    setIsPurchaseModalOpen(false)
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
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
          Locations & Inventory Flow
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Central warehouse distribution, multi-store stock, and bulk intake
        </p>
      </div>

      {/* Action Buttons Bar - Mobile 2x2 Grid / Desktop Inline */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {/* Restock Warehouse (Bulk Inbound) - Owner Only */}
        {isOwner && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsInboundCreatingNewProduct(false)
              setIsWarehouseInboundModalOpen(true)
            }}
            className="flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-bold w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white shadow-2xs"
          >
            <Package className="w-4 h-4" />
            <span>+ Restock Warehouse</span>
          </Button>
        )}

        {/* Transfer Stock */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-bold w-full sm:w-auto"
        >
          <ArrowRightLeft className="w-4 h-4 text-slate-700" />
          <span>Transfer Stock</span>
        </Button>

        {/* Direct Store Purchase */}
        <Button
          variant="outline"
          size="md"
          onClick={() => setIsPurchaseModalOpen(true)}
          className="flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-bold w-full sm:w-auto border-slate-300"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>Direct Purchase</span>
        </Button>

        {/* Owner Pricing & Commission Adjustment (Searchable) */}
        {isOwner && (
          <Button
            variant="outline"
            size="md"
            onClick={() => handleOpenProductPricing(products[0])}
            className="flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px] w-full sm:w-auto border-emerald-300 text-emerald-900 bg-emerald-50/50 hover:bg-emerald-100/70"
          >
            <Tags className="w-4 h-4 text-emerald-700" />
            <span>Price & Commission</span>
          </Button>
        )}

        {/* Owner Add Store */}
        {isOwner && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsAddStoreModalOpen(true)}
            className="flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px] w-full sm:w-auto border-blue-300 text-blue-900 bg-blue-50/50 hover:bg-blue-100/70"
          >
            <PlusCircle className="w-4 h-4 text-blue-700" />
            <span>+ Add Store</span>
          </Button>
        )}
      </div>

      {/* Global Inventory Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search inventory by product name..."
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] shadow-2xs"
        />
        {globalSearchQuery && (
          <button
            onClick={() => setGlobalSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {globalSearchQuery && (
        <div className="flex items-center justify-between text-xs px-1 text-slate-500">
          <span>Filtering {filteredProducts.length} matching products</span>
          <button
            onClick={() => setGlobalSearchQuery('')}
            className="font-bold text-emerald-700 hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Central Warehouse Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-purple-700" />
            Central Warehouse (Primary Hub)
          </h2>
          <span className="text-[11px] text-slate-400">{warehouses.length} Hub</span>
        </div>

        {warehouses.map(wh => (
          <Card key={wh.id} className="border-slate-300 bg-white shadow-xs">
            <CardHeader className="py-3 px-3.5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{wh.name}</span>
                  <Badge variant="purple" className="text-[10px]">Distribution Central</Badge>
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">{wh.location}</p>
              </div>

              {/* Warehouse Quick Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isOwner && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setWarehouseInboundForm(prev => ({ ...prev, warehouseId: wh.id }))
                      setIsInboundCreatingNewProduct(false)
                      setIsWarehouseInboundModalOpen(true)
                    }}
                    className="text-xs min-h-[38px] flex-1 sm:flex-none font-bold bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    <Package className="w-3.5 h-3.5 mr-1" />
                    + Restock Warehouse
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTransferForm(prev => ({ ...prev, fromWarehouseId: wh.id }))
                    setIsTransferModalOpen(true)
                  }}
                  className="text-xs min-h-[38px] flex-1 sm:flex-none font-bold"
                >
                  Dispatch to Stores &rarr;
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-5">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No products match "{globalSearchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {filteredProducts.map(p => {
                    const qty = wh.stock[p.id] || 0
                    const isLow = qty > 0 && qty <= (p.minStockThreshold || 5)
                    const isOut = qty === 0

                    return (
                      <div
                        key={p.id}
                        className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                              {p.name}
                            </p>
                            <span className="text-xs font-black text-emerald-700 shrink-0">
                              {formatCurrency(p.sellingPrice)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>Cost: {formatCurrency(p.costPrice)}</span>
                            {p.category && (
                              <>
                                <span>&bull;</span>
                                <span>{p.category}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base sm:text-lg font-black text-slate-900">{qty}</span>
                            {isOut ? (
                              <Badge variant="danger" className="text-[10px]">Out</Badge>
                            ) : isLow ? (
                              <Badge variant="warning" className="text-[10px]">Low ({qty})</Badge>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">units</span>
                            )}
                          </div>

                          {/* Owner Action Buttons */}
                          {isOwner && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenProductPricing(p)}
                                title="Adjust Price & Commission"
                                className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 touch-manipulation min-h-[32px]"
                              >
                                <Tags className="w-3 h-3 text-emerald-600" />
                                <span>Price</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenOverride(wh.id, wh.name, 'warehouse', p.id, p.name, qty)}
                                title="Stock Override"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-lg touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retail Stores Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-700" />
            Retail Stores ({stores.length} Locations)
          </h2>
          {isOwner && (
            <button
              onClick={() => setIsAddStoreModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Store</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {stores.map(store => (
            <Card key={store.id} className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="py-3 px-3.5 sm:px-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">{store.name}</CardTitle>
                  <p className="text-[11px] text-slate-500">{store.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">Storefront</Badge>
                  {isOwner && stores.length > 1 && (
                    <button
                      onClick={() => handleDeleteStore(store)}
                      title="Delete Store Branch"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-5 space-y-3">
                <div className="space-y-2">
                  {filteredProducts.map(p => {
                    const qty = store.stock[p.id] || 0
                    const isLow = qty > 0 && qty <= (p.minStockThreshold || 5)
                    const isOut = qty === 0

                    return (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatCurrency(p.sellingPrice)} {p.category ? `• ${p.category}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-sm text-slate-900">{qty}</span>
                          {isOut ? (
                            <Badge variant="danger" className="text-[10px]">Out</Badge>
                          ) : isLow ? (
                            <Badge variant="warning" className="text-[10px]">Low</Badge>
                          ) : null}

                          {/* Owner Quick Actions */}
                          {isOwner && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenProductPricing(p)}
                                title="Adjust Price & Commission"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg touch-manipulation"
                              >
                                <Tags className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenOverride(store.id, store.name, 'store', p.id, p.name, qty)}
                                title="Owner Inventory Override"
                                className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 touch-manipulation"
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

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      setPurchaseForm(prev => ({ ...prev, storeId: store.id }))
                      setIsPurchaseModalOpen(true)
                    }}
                    className="w-full text-xs font-bold min-h-[44px]"
                  >
                    + Direct Store Purchase
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
                Confirm
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

            {/* Searchable Product Pick */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Product to Dispatch:</label>
              <input
                type="text"
                placeholder="Search product..."
                value={transferProductSearch}
                onChange={(e) => setTransferProductSearch(e.target.value)}
                className="w-full mb-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <select
                value={transferForm.productId}
                onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              >
                {products
                  .filter(p => !transferProductSearch || p.name.toLowerCase().includes(transferProductSearch.toLowerCase()))
                  .map(p => {
                    const wh = warehouses.find(w => w.id === transferForm.fromWarehouseId)
                    const whQty = wh?.stock[p.id] || 0
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Warehouse Available: {whQty})
                      </option>
                    )
                  })}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity to Transfer:</label>
              <input
                type="number"
                min="1"
                required
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsTransferModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
                Complete Transfer
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
                  value={purchaseForm.costPerUnit}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold text-slate-800"
                />
              </div>
            </div>

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
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
                Confirm Purchase & Stock In
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
