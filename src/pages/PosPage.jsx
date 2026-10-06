import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Search,
  ChevronUp,
  X,
  Lock,
  Eye,
  Store,
  Warehouse,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'
import { ETHIOPIAN_PAYMENT_PROVIDERS, DEFAULT_BANK } from '../lib/ethiopian-banks'

export const getProductCommissionRate = (product) => {
  if (product?.defaultCommissionRate !== undefined && product?.defaultCommissionRate !== null) {
    return product.defaultCommissionRate
  }
  const isOil = ((product?.name || '') + ' ' + (product?.category || '')).toLowerCase().includes('oil')
  return isOil ? 0.5 : 2.5
}

export function PosPage() {
  const { stores, warehouses, products, staff, recordSale } = useTenant()
  const { currentUser, isOwner } = useAuth()
  const { toast } = useToast()

  // Permission check for credit / unpaid sales
  const currentStaffMember = staff?.find(s => s.userId === currentUser?.id || s.email === currentUser?.email || s.id === currentUser?.id)
  const canMakeCreditSales = isOwner || (currentStaffMember?.allowCreditSales !== false)

  // Location selection: Supports both Retail Stores & Central Warehouses (for direct warehouse sales)
  // Format of key: "store:<id>" or "warehouse:<id>"
  const defaultLocationKey = currentUser?.storeId 
    ? `store:${currentUser.storeId}` 
    : (stores?.[0]?.id ? `store:${stores[0].id}` : (warehouses?.[0]?.id ? `warehouse:${warehouses[0].id}` : ''))
  const [selectedLocationKey, setSelectedLocationKey] = useState(defaultLocationKey)

  // Enforce salesperson assigned store if not owner, and auto-sync on load
  useEffect(() => {
    if (!isOwner && currentUser?.storeId) {
      setSelectedLocationKey(`store:${currentUser.storeId}`)
    } else if (!selectedLocationKey && (stores?.[0]?.id || warehouses?.[0]?.id)) {
      setSelectedLocationKey(stores?.[0]?.id ? `store:${stores[0].id}` : `warehouse:${warehouses[0].id}`)
    }
  }, [currentUser?.id, currentUser?.storeId, isOwner, stores, warehouses, selectedLocationKey])

  // Active Location resolution (Store or Warehouse)
  const isSelectedWarehouse = Boolean(selectedLocationKey?.startsWith('warehouse:'))
  const rawLocationId = selectedLocationKey ? selectedLocationKey.replace(/^(store|warehouse):/, '') : ''

  const activeLocation = useMemo(() => {
    if (isSelectedWarehouse) {
      const wh = warehouses?.find(w => w.id === rawLocationId) || warehouses?.[0]
      if (wh) {
        return {
          ...wh,
          isWarehouse: true,
          stock: wh.stock || {},
          label: wh.name.toLowerCase().includes('warehouse') ? wh.name : `${wh.name} (Warehouse)`
        }
      }
    }
    const st = stores?.find(s => s.id === rawLocationId) || stores?.[0]
    if (st) {
      return {
        ...st,
        isWarehouse: false,
        stock: st.stock || {},
        label: st.name
      }
    }
    // Fallback to warehouse if no stores exist
    if (warehouses?.[0]) {
      return {
        ...warehouses[0],
        isWarehouse: true,
        stock: warehouses[0].stock || {},
        label: warehouses[0].name.toLowerCase().includes('warehouse') ? warehouses[0].name : `${warehouses[0].name} (Warehouse)`
      }
    }
    // Safe default to prevent null reference errors
    return {
      id: 'default',
      name: 'Main Location',
      isWarehouse: false,
      stock: {},
      label: 'Main Location'
    }
  }, [selectedLocationKey, isSelectedWarehouse, rawLocationId, warehouses, stores])

  // Backward-compatibility alias for all cart & stock logic
  const activeStore = activeLocation

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Catalog View Mode: 'cards' | 'table' (persisted in localStorage, matches InventoryPage)
  const [posViewMode, setPosViewMode] = useState(() => {
    try {
      return localStorage.getItem('omestock_pos_view_mode') || 'cards'
    } catch {
      return 'cards'
    }
  })

  const handleSetPosViewMode = (mode) => {
    setPosViewMode(mode)
    try {
      localStorage.setItem('omestock_pos_view_mode', mode)
    } catch {}
  }

  // Cart: [{ product, quantity, customPrice, commissionAmount }]
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Cash') // 'Cash' | 'Banking' | 'Credit'
  const [selectedBank, setSelectedBank] = useState(DEFAULT_BANK)
  const [customBankName, setCustomBankName] = useState('')
  const [bankRef, setBankRef] = useState('')
  
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [lastCompletedSale, setLastCompletedSale] = useState(null)
  
  // Mobile Checkout Drawer State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  // Multi-Store Inventory Lookup Modal State
  const [isMultiStoreModalOpen, setIsMultiStoreModalOpen] = useState(false)
  const [inspectProduct, setInspectProduct] = useState(null)
  const [inspectSearchQuery, setInspectSearchQuery] = useState('')

  // Filtered products for inspection modal
  const inspectFilteredProducts = useMemo(() => {
    const query = inspectSearchQuery.trim().toLowerCase()
    if (!query) return products
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.code && p.code.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query))
    )
  }, [products, inspectSearchQuery])

  // Available categories for filtering
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return ['All', ...Array.from(cats)]
  }, [products])

  // Filtered Products by Search Query and Category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return products.filter(p => {
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Add product to cart
  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id)
    const currentStoreStock = activeStore?.stock?.[product.id] || 0

    if (existing) {
      if (existing.quantity >= currentStoreStock) {
        toast.warning('Stock Limit', `Cannot add more than available store stock (${currentStoreStock} units).`)
        return
      }
      setCart(cart.map(item => {
        if (item.product.id === product.id) {
          const newQty = item.quantity + 1
          const unitPrice = item.customPrice !== undefined && !isNaN(item.customPrice) ? item.customPrice : (product.sellingPrice || 0)
          const commissionAmount = (unitPrice * newQty * (product.defaultCommissionRate || 5)) / 100
          return { ...item, quantity: newQty, commissionAmount }
        }
        return item
      }))
    } else {
      if (currentStoreStock <= 0) {
        toast.warning('Out of Stock', `"${product.name}" is currently out of stock at this location!`)
        return
      }
      const unitPrice = product.sellingPrice || 0
      const commRate = getProductCommissionRate(product)
      const commissionAmount = (unitPrice * 1 * commRate) / 100
      setCart([...cart, { product, quantity: 1, customPrice: unitPrice, commissionAmount }])
    }
  }

  // Update custom selling price for an item in cart (supports price negotiation / price ranges)
  const handleSetCustomPrice = (productId, newPriceStr) => {
    const item = cart.find(i => i.product.id === productId)
    if (!item) return

    const parsedPrice = parseFloat(newPriceStr)
    const validPrice = isNaN(parsedPrice) || parsedPrice < 0 ? 0 : parsedPrice

    setCart(cart.map(i => {
      if (i.product.id === productId) {
        const commRate = getProductCommissionRate(i.product)
        const commissionAmount = (validPrice * i.quantity * commRate) / 100
        return { ...i, customPrice: validPrice, commissionAmount }
      }
      return i
    }))
  }

  // Update item quantity (via stepper or manual numeric typing)
  const handleSetQuantity = (productId, newQuantityStr) => {
    const item = cart.find(i => i.product.id === productId)
    if (!item) return

    const currentStoreStock = activeStore?.stock?.[productId] || 0
    let parsedQty = parseInt(newQuantityStr, 10)

    if (isNaN(parsedQty) || parsedQty <= 0) {
      parsedQty = 1
    }

    if (parsedQty > currentStoreStock) {
      toast.warning('Max Stock', `Max available stock at ${activeStore?.name || 'this location'} is ${currentStoreStock}.`)
      parsedQty = currentStoreStock
    }

    setCart(cart.map(i => {
      if (i.product.id === productId) {
        const unitPrice = i.customPrice !== undefined && !isNaN(i.customPrice) ? i.customPrice : (i.product.sellingPrice || 0)
        const commRate = getProductCommissionRate(i.product)
        const commissionAmount = (unitPrice * parsedQty * commRate) / 100
        return { ...i, quantity: parsedQty, commissionAmount }
      }
      return i
    }))
  }

  const handleUpdateQuantityDelta = (productId, delta) => {
    const item = cart.find(i => i.product.id === productId)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      handleRemoveItem(productId)
    } else {
      handleSetQuantity(productId, String(newQty))
    }
  }

  // Remove item
  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  // Open Multi-Store Stock Modal for an item
  const handleInspectStock = (e, product) => {
    e.stopPropagation()
    setInspectProduct(product)
    setInspectSearchQuery('')
    setIsMultiStoreModalOpen(true)
  }

  // Cart Totals
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => {
    const unitPrice = item.customPrice !== undefined && !isNaN(item.customPrice) ? item.customPrice : (item.product.sellingPrice || 0)
    return sum + (unitPrice * item.quantity)
  }, 0)
  const totalCommission = cart.reduce((sum, item) => sum + (item.commissionAmount || 0), 0)

  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Submit Sale
  const handleCheckout = async (e) => {
    if (e) e.preventDefault()
    if (cart.length === 0 || isCheckingOut) return

    if (paymentMethod === 'Credit' && !customerName.trim()) {
      toast.warning('Customer Required', 'Please enter a Customer or Company Name for Credit sales.')
      return
    }

    let bankProviderName = null
    if (paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === selectedBank)
      bankProviderName = selectedBank === 'other' ? (customBankName.trim() || 'Other Bank') : bankObj?.name
    }

    const salePayload = {
      storeId: activeStore?.id,
      storeName: activeStore?.name,
      paymentMethod,
      bankProvider: bankProviderName,
      bankRef: bankRef.trim() || undefined,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      totalAmount,
      items: cart.map(item => {
        const unitPrice = item.customPrice !== undefined && !isNaN(item.customPrice) ? item.customPrice : (item.product.sellingPrice || 0)
        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice,
          costPrice: item.product.costPrice,
          commissionRate: getProductCommissionRate(item.product),
          commissionAmount: item.commissionAmount,
        }
      })
    }

    setIsCheckingOut(true)

    try {
      const createdSale = await recordSale(salePayload, currentUser)
      if (createdSale) {
        const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
        toast.success(
          paymentMethod === 'Credit' ? 'Credit Sale Recorded' : 'Sale Completed',
          `${formatCurrency(totalAmount)} • ${totalItems} item${totalItems > 1 ? 's' : ''} via ${paymentMethod}`
        )
        setCart([])
        setCustomerName('')
        setCustomerPhone('')
        setBankRef('')
        setIsMobileCartOpen(false)
        setLastCompletedSale(createdSale)
        setTimeout(() => {
          setLastCompletedSale(curr => (curr?.id === createdSale.id ? null : curr))
        }, 5000)
      }
    } catch (err) {
      console.error('Sale recording failed:', err)
      toast.error('Sale Failed', 'Sale could not be saved to the database. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Reusable Checkout Form
  const renderCheckoutForm = () => (
    <div className="space-y-4">
      {/* Cart Items List with Direct Manual Numeric Input & Unit Price editing */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Cart is empty. Tap products to add them.
          </div>
        ) : (
          cart.map(({ product, quantity, commissionAmount, customPrice }) => {
            const currentStoreStock = activeStore?.stock?.[product.id] || 0
            const activePrice = customPrice !== undefined && !isNaN(customPrice) ? customPrice : (product.sellingPrice || 0)
            return (
              <div key={product.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Comm ({product.defaultCommissionRate || 5}%): +{formatCurrency(commissionAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(product.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 touch-manipulation"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  {/* Unit Selling Price input (flexible for variable / negotiable items) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Price:</span>
                    <input
                      type="number"
                      step="any"
                      value={activePrice}
                      onChange={(e) => handleSetCustomPrice(product.id, e.target.value)}
                      className="w-20 h-7 px-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400">ETB</span>
                    {product.sellingPriceRange && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200/60">
                        {product.sellingPriceRange}
                      </span>
                    )}
                  </div>

                  {/* Manual Quantity Input & Stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantityDelta(product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 touch-manipulation active:scale-95"
                    >
                      <Minus className="w-3 h-3 text-slate-700" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      max={currentStoreStock}
                      value={quantity}
                      onChange={(e) => handleSetQuantity(product.id, e.target.value)}
                      className="w-10 h-7 text-center font-extrabold text-slate-900 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={() => handleUpdateQuantityDelta(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 touch-manipulation active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-slate-700" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Calculations */}
      {cart.length > 0 && (
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl font-medium border border-emerald-200">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Your Commission:
            </span>
            <span className="font-bold text-sm">+{formatCurrency(totalCommission)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-1">
            <span>Total Payable:</span>
            <span className="text-lg text-emerald-700 font-extrabold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Payment Method Selector Tiles */}
      <div className="pt-1">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Payment Method:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'Cash', icon: Banknote },
            { id: 'Banking', icon: Building },
            { id: 'Credit', icon: CreditCard, disabled: !canMakeCreditSales }
          ].map(method => (
            <button
              key={method.id}
              type="button"
              disabled={method.disabled}
              onClick={() => !method.disabled && setPaymentMethod(method.id)}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                method.disabled
                  ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  : paymentMethod === method.id
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={method.disabled ? 'Unpaid / Credit sales access disabled by owner' : ''}
            >
              <method.icon className="w-4 h-4" />
              <span>{method.id}</span>
              {method.disabled && (
                <span className="text-[9px] font-medium text-slate-400 -mt-1">Locked</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ethiopian Banking & Telebirr Sub-options */}
      {paymentMethod === 'Banking' && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900">Select Bank / Digital Wallet:</span>
            <Badge variant="info">Ethiopian Providers</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ETHIOPIAN_PAYMENT_PROVIDERS.slice(0, 6).map(prov => (
              <button
                key={prov.id}
                type="button"
                onClick={() => setSelectedBank(prov.id)}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all border ${
                  selectedBank === prov.id
                    ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {prov.short}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">More Banks / Providers:</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-blue-300 rounded-lg font-medium"
            >
              {ETHIOPIAN_PAYMENT_PROVIDERS.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.name}</option>
              ))}
            </select>
          </div>

          {selectedBank === 'other' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Custom Bank Name:</label>
              <input
                type="text"
                placeholder="e.g. Enat Bank, Berhan Bank"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Transaction Ref / Slip # (Optional):</label>
            <input
              type="text"
              placeholder="e.g. FT26089ABC or Telebirr Trans ID"
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Credit Details */}
      {paymentMethod === 'Credit' && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5 text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Credit Sale &bull; Logged to Unpaid Sales list</span>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer / Debtor Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Studio Ltd"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer Phone (Optional)</label>
            <input
              type="tel"
              placeholder="+251-91-123-4567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      )}

      {/* Checkout Submit Button */}
      <Button
        variant="primary"
        size="lg"
        disabled={cart.length === 0 || isCheckingOut}
        onClick={handleCheckout}
        className="w-full font-bold shadow-md min-h-[48px] text-base"
      >
        {isCheckingOut ? (
          <span>Saving Sale...</span>
        ) : (
          <>
            <span>Complete Sale &bull; {formatCurrency(totalAmount)}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* POS Top Header: Inline Title + Location Selector (Store or Warehouse) */}
      <div className="flex items-center justify-between gap-2.5 w-full">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2 shrink-0">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          <span>POS</span>
        </h1>

        {/* Location Selector moved all the way to the right */}
        {!isOwner ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 ml-auto shrink-0">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-none">
              Store: <span className="text-emerald-700">{activeLocation?.name}</span>
            </span>
          </div>
        ) : (
          <div className="relative w-auto min-w-[140px] max-w-[200px] sm:min-w-[240px] sm:max-w-[280px] ml-auto">
            <select
              value={selectedLocationKey}
              onChange={(e) => setSelectedLocationKey(e.target.value)}
              className="w-full text-xs font-bold bg-white border-2 border-emerald-500 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-900 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer truncate"
            >
              <optgroup label="Retail Stores">
                {stores.map(store => (
                  <option key={`store:${store.id}`} value={`store:${store.id}`}>
                    {store.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Warehouses (Direct Sale)">
                {warehouses.map(wh => (
                  <option key={`warehouse:${wh.id}`} value={`warehouse:${wh.id}`}>
                    {wh.name.toLowerCase().includes('warehouse') ? wh.name : `${wh.name} (Warehouse)`}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>

      {/* Sale Success Notification */}
      {lastCompletedSale && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start sm:items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                Sale {lastCompletedSale.invoiceNumber || lastCompletedSale.receiptNumber || 'Order'} recorded!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {lastCompletedSale.paymentMethod} {lastCompletedSale.bankProvider ? `(${lastCompletedSale.bankProvider})` : ''} &bull; {formatCurrency(lastCompletedSale.totalAmount ?? lastCompletedSale.total ?? 0)} &bull; Comm: +{formatCurrency(lastCompletedSale.commissionTotal ?? lastCompletedSale.commission ?? 0)}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLastCompletedSale(null)}
            className="text-xs bg-white text-emerald-800 border-emerald-300 self-end sm:self-auto cursor-pointer"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Search Bar, Multi-Store Stock Quick Lookup & View Switcher */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search products by name, code, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Global Multi-Store Inventory Lookup Button */}
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              if (!inspectProduct && products.length > 0) {
                setInspectProduct(products[0])
              }
              setInspectSearchQuery('')
              setIsMultiStoreModalOpen(true)
            }}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold min-h-[44px]"
            title="Check stock across all branches"
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Check Other Stores</span>
            <span className="sm:hidden">Stock</span>
          </Button>

          {/* View Switcher Toggle (matching InventoryPage design) */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 shrink-0 min-h-[44px] items-center">
            <button
              type="button"
              onClick={() => handleSetPosViewMode('table')}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer h-full ${
                posViewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetPosViewMode('cards')}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer h-full ${
                posViewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-800'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills (if multiple categories exist) */}
        {availableCategories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Catalog Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Product Catalog */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {activeStore?.name} &bull; Available Items
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {filteredProducts.length} items
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              No products found matching your search or category filter.
            </div>
          ) : posViewMode === 'table' ? (
            /* ══════════════════════════════════════════════════════════════════ */
            /* TABLE DESIGN: Clean, Compact POS Table with Instant +/- Stepper    */
            /* ══════════════════════════════════════════════════════════════════ */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse">
                  <colgroup>
                    <col className="w-auto" />
                    <col className="hidden md:table-column md:w-[120px]" />
                    <col className="w-[48px] sm:w-[64px]" />
                    <col className="w-[72px] sm:w-[100px]" />
                    <col className="w-[74px] sm:w-[86px]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 pl-3 pr-1 sm:px-4">Item</th>
                      <th className="py-2.5 px-3 hidden md:table-cell">Category</th>
                      <th className="py-2.5 px-1 sm:px-2 text-center">Stock</th>
                      <th className="py-2.5 px-1 sm:px-2 text-right sm:text-left">Price</th>
                      <th className="py-2.5 px-1 sm:px-2 text-center">
                        <span className="hidden sm:inline">Action</span>
                        <span className="sm:hidden">Add</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredProducts.map((product) => {
                      const stockAtStore = activeStore?.stock?.[product.id] || 0
                      const isLow = stockAtStore > 0 && stockAtStore <= (product.minStockThreshold || 5)
                      const isOut = stockAtStore <= 0
                      const inCart = cart.find(i => i.product.id === product.id)

                      return (
                        <tr
                          key={product.id}
                          onClick={() => !isOut && !inCart && handleAddToCart(product)}
                          className={`transition-colors touch-manipulation ${
                            isOut
                              ? 'bg-slate-50/80 opacity-60 cursor-not-allowed'
                              : inCart
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                              : 'hover:bg-slate-50/80 cursor-pointer'
                          }`}
                        >
                          {/* Item Name, Code & Unit - wraps cleanly across lines */}
                          <td className="py-2.5 pl-3 pr-1 sm:px-4 align-middle">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words hyphens-auto [overflow-wrap:anywhere]">
                                {product.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap leading-tight">
                                <span className="font-medium text-slate-500 shrink-0">{product.unit || 'Pc'}</span>
                                {product.category && (
                                  <>
                                    <span className="shrink-0">&bull;</span>
                                    <span className="break-words line-clamp-1">{product.category}</span>
                                  </>
                                )}
                                <span className="hidden sm:inline shrink-0">&bull; Comm: {getProductCommissionRate(product)}%</span>
                              </div>
                            </div>
                          </td>

                          {/* Category (Hidden on mobile) */}
                          <td className="py-2.5 px-3 hidden md:table-cell align-middle">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold break-words">
                              {product.category || 'General'}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Comm: {getProductCommissionRate(product)}%
                            </span>
                          </td>

                          {/* Stock & Quick Eye Button */}
                          <td className="py-2.5 px-0.5 sm:px-1.5 text-center align-middle">
                            <div className="inline-flex flex-col items-center justify-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <span className={`font-black text-xs sm:text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {stockAtStore}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleInspectStock(e, product)}
                                  title="Check branches stock"
                                  className="p-0.5 rounded text-slate-300 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className={`text-[9px] font-bold leading-none ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                                {isOut ? 'Out' : isLow ? 'Low' : 'In Store'}
                              </span>
                            </div>
                          </td>

                          {/* Price & Variable Indicator */}
                          <td className="py-2.5 px-1 sm:px-2 text-right sm:text-left align-middle">
                            <div className="flex flex-col items-end sm:items-start leading-tight">
                              {product.sellingPriceRange ? (
                                <>
                                  <span className="font-black text-emerald-700 text-xs sm:text-sm leading-tight break-words">
                                    {product.sellingPriceRange} <span className="text-[9px] font-bold text-slate-400">ETB</span>
                                  </span>
                                  <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mt-0.5">
                                    Variable
                                  </span>
                                </>
                              ) : (
                                <span className="font-black text-emerald-600 text-xs sm:text-sm leading-tight break-words">
                                  {formatCurrency(product.sellingPrice)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action / Always-visible + Button & Stepper */}
                          <td className="py-2.5 px-1 sm:px-2 text-center align-middle">
                            {isOut ? (
                              <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                Out
                              </span>
                            ) : inCart ? (
                              /* Interactive Stepper when in cart: fits completely within column with zero clipping */
                              <div
                                className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-300 p-0.5 shadow-xs mx-auto shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateQuantityDelta(product.id, -1)
                                  }}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white border border-emerald-200 flex items-center justify-center text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 active:scale-90 transition-all cursor-pointer shrink-0"
                                  title={inCart.quantity === 1 ? "Remove from cart" : "Decrease quantity"}
                                >
                                  {inCart.quantity === 1 ? (
                                    <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500" />
                                  ) : (
                                    <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-700" />
                                  )}
                                </button>

                                <span className="w-4 sm:w-5 text-center font-black text-[11px] sm:text-xs text-emerald-900 select-none shrink-0 px-0.5">
                                  {inCart.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateQuantityDelta(product.id, 1)
                                  }}
                                  disabled={inCart.quantity >= stockAtStore}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 active:scale-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToCart(product)
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs mx-auto shrink-0"
                                title="Add to cart"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════ */
            /* CARDS DESIGN: Visual Card Grid with Interactive +/- Stepper         */
            /* ══════════════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const stockAtStore = activeStore?.stock?.[product.id] || 0
                const isLow = stockAtStore > 0 && stockAtStore <= (product.minStockThreshold || 5)
                const isOut = stockAtStore <= 0
                const inCart = cart.find(i => i.product.id === product.id)

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOut && !inCart && handleAddToCart(product)}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between touch-manipulation ${
                      isOut
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-xs cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {product.unit && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {product.unit}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{product.name}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          {product.sellingPriceRange ? (
                            <>
                              <span className="text-xs font-extrabold text-emerald-700 block">
                                {product.sellingPriceRange} ETB
                              </span>
                              <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                Variable Price
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-extrabold text-emerald-600 block">
                              {formatCurrency(product.sellingPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Comm: <span className="font-bold text-slate-800">{getProductCommissionRate(product)}%</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isOut ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">{stockAtStore} left</Badge>
                        ) : (
                          <Badge variant="success">{stockAtStore} in store</Badge>
                        )}

                        {/* Check Other Stores Quick Eye Button */}
                        <button
                          type="button"
                          onClick={(e) => handleInspectStock(e, product)}
                          title="Check stock at other branches"
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 touch-manipulation cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Stepper in Cards View */}
                    {inCart ? (
                      <div
                        className="mt-3 pt-2.5 border-t border-emerald-200/80 flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-xs font-bold text-emerald-900">
                          <span>{formatCurrency((inCart.customPrice ?? product.sellingPrice) * inCart.quantity)}</span>
                        </div>
                        <div className="inline-flex items-center rounded-lg bg-white border border-emerald-300 p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateQuantityDelta(product.id, -1)
                            }}
                            className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-90 transition-all cursor-pointer"
                            title={inCart.quantity === 1 ? "Remove from cart" : "Decrease quantity"}
                          >
                            {inCart.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Minus className="w-3 h-3 text-slate-700" />
                            )}
                          </button>
                          <span className="w-7 text-center font-black text-xs text-emerald-900 select-none">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateQuantityDelta(product.id, 1)
                            }}
                            disabled={inCart.quantity >= stockAtStore}
                            className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 active:scale-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(product)
                          }}
                          className="w-8 h-8 rounded-lg bg-black hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                          title="Add to cart"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Right Side Panel: Checkout */}
        <div className="hidden lg:block lg:col-span-5">
          <Card className="sticky top-20 shadow-sm border-slate-300">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between w-full">
                <span>Sale Order ({totalItemsCount})</span>
                <span className="text-xs text-slate-400 font-normal">Active Cart</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {renderCheckoutForm()}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Floating Bottom Cart Bar for Mobile Viewports (Floats above bottom nav when items > 0) */}
      {totalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl touch-manipulation active:scale-[0.98] shadow-xl border border-slate-700/60"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-500 text-slate-900 rounded-full">
                  {totalItemsCount}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Review Order ({totalItemsCount})</div>
                <div className="text-[10px] text-slate-300">Tap to checkout &bull; {paymentMethod}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-emerald-400">{formatCurrency(totalAmount)}</div>
              {totalCommission > 0 && (
                <div className="text-[10px] text-emerald-200 font-medium">+{formatCurrency(totalCommission)} comm.</div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Mobile Checkout Slide-Up Sheet */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileCartOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 w-full p-5 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Current Sale Order</h3>
                <p className="text-xs text-slate-500">{totalItemsCount} items selected</p>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              {renderCheckoutForm()}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Store Stock Visibility Modal (Accessible to all Salespersons) */}
      {isMultiStoreModalOpen && (
        <Modal
          isOpen={isMultiStoreModalOpen}
          onClose={() => {
            setIsMultiStoreModalOpen(false)
            setInspectSearchQuery('')
          }}
          title="Branch Stock Availability"
        >
          <div className="space-y-3.5 text-xs">
            {/* Search Input for Selecting Product */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                Search Product to Check Stock:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type product name, code (e.g. SP-001)..."
                  value={inspectSearchQuery}
                  onChange={(e) => setInspectSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white min-h-[42px]"
                  autoFocus
                />
                {inspectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setInspectSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Matching Products Search Results List for Selection */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {inspectSearchQuery ? `Search Results (${inspectFilteredProducts.length})` : 'Select Product from Catalog'}
                </span>
                {inspectProduct && (
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Selected: {inspectProduct.name}
                  </span>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-50/70 rounded-xl border border-slate-200 no-scrollbar">
                {inspectFilteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No products found matching &ldquo;{inspectSearchQuery}&rdquo;
                  </div>
                ) : (
                  inspectFilteredProducts.map((p) => {
                    const isSelected = inspectProduct?.id === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setInspectProduct(p)}
                        className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="font-bold text-xs truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            {p.sellingPriceRange ? `${p.sellingPriceRange} ETB` : formatCurrency(p.sellingPrice)}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Currently Inspected Product & Stock Across All Locations */}
            {inspectProduct && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between px-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    Stock across all locations:
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-emerald-700">
                      {inspectProduct.sellingPriceRange ? `${inspectProduct.sellingPriceRange} ETB` : formatCurrency(inspectProduct.sellingPrice)}
                    </span>
                  </div>
                </div>
                
                {/* Central Warehouse */}
                {(warehouses || []).map(wh => {
                  const qty = wh?.stock?.[inspectProduct?.id] || 0
                  const isCurrent = wh?.id === activeStore?.id
                  return (
                    <div key={wh.id} className={`p-3 border rounded-xl flex items-center justify-between ${isCurrent ? 'bg-purple-50/90 border-purple-300' : 'bg-purple-50/50 border-purple-200'}`}>
                      <div>
                        <div className="font-bold text-purple-900 flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-purple-700" />
                          <span>{wh.name}</span>
                          {isCurrent && <span className="text-[10px] text-purple-800 font-bold">(Selected)</span>}
                        </div>
                        <div className="text-[10px] text-purple-700">{wh.location}</div>
                      </div>
                      <Badge variant="purple" className="text-xs font-bold">
                        {qty} in warehouse
                      </Badge>
                    </div>
                  )
                })}

                {/* Retail Stores */}
                {(stores || []).map(store => {
                  const qty = store?.stock?.[inspectProduct?.id] || 0
                  const isCurrent = store?.id === activeStore?.id
                  return (
                    <div key={store.id} className={`p-3 border rounded-xl flex items-center justify-between ${isCurrent ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-600" />
                          <span>{store.name}</span>
                          {isCurrent && <span className="text-[10px] text-emerald-700 font-bold">(Selected)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">{store.location}</div>
                      </div>
                      <Badge variant={qty > 0 ? (isCurrent ? 'success' : 'info') : 'danger'} className="text-xs font-bold">
                        {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              {inspectProduct && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    handleAddToCart(inspectProduct)
                  }}
                  disabled={(activeStore?.stock?.[inspectProduct?.id] || 0) <= 0}
                  className="flex-1 font-bold min-h-[44px] border-emerald-500 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Add to Cart</span>
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsMultiStoreModalOpen(false)
                  setInspectSearchQuery('')
                }}
                className="flex-1 font-bold min-h-[44px] cursor-pointer"
              >
                Close Stock View
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
