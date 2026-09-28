import React, { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
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
  Warehouse
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'
import { ETHIOPIAN_PAYMENT_PROVIDERS, DEFAULT_BANK } from '../lib/ethiopian-banks'

export function PosPage() {
  const { stores, warehouses, products, recordSale } = useTenant()
  const { currentUser, isOwner } = useAuth()

  // Selected Store: strictly locked if salesperson
  const assignedStoreId = currentUser.storeId || stores[0]?.id || ''
  const [selectedStoreId, setSelectedStoreId] = useState(assignedStoreId)
  
  // When active user changes, enforce assigned store if salesperson
  useEffect(() => {
    if (!isOwner && currentUser.storeId) {
      setSelectedStoreId(currentUser.storeId)
    }
  }, [currentUser.id, isOwner])

  const [searchQuery, setSearchQuery] = useState('')

  // Cart: [{ product, quantity, commissionAmount }]
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

  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0]

  // Filtered Products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Add product to cart
  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id)
    const currentStoreStock = activeStore?.stock[product.id] || 0

    if (existing) {
      if (existing.quantity >= currentStoreStock) {
        alert(`Cannot add more than available store stock (${currentStoreStock} units)`)
        return
      }
      setCart(cart.map(item => {
        if (item.product.id === product.id) {
          const newQty = item.quantity + 1
          const commissionAmount = (product.sellingPrice * newQty * (product.defaultCommissionRate || 5)) / 100
          return { ...item, quantity: newQty, commissionAmount }
        }
        return item
      }))
    } else {
      if (currentStoreStock <= 0) {
        alert('Item is currently out of stock at this store!')
        return
      }
      const commissionAmount = (product.sellingPrice * 1 * (product.defaultCommissionRate || 5)) / 100
      setCart([...cart, { product, quantity: 1, commissionAmount }])
    }
  }

  // Update item quantity (via stepper or manual numeric typing)
  const handleSetQuantity = (productId, newQuantityStr) => {
    const item = cart.find(i => i.product.id === productId)
    if (!item) return

    const currentStoreStock = activeStore?.stock[productId] || 0
    let parsedQty = parseInt(newQuantityStr, 10)

    if (isNaN(parsedQty) || parsedQty <= 0) {
      parsedQty = 1
    }

    if (parsedQty > currentStoreStock) {
      alert(`Max available stock at ${activeStore.name} is ${currentStoreStock}`)
      parsedQty = currentStoreStock
    }

    setCart(cart.map(i => {
      if (i.product.id === productId) {
        const commissionAmount = (i.product.sellingPrice * parsedQty * (i.product.defaultCommissionRate || 5)) / 100
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
    setIsMultiStoreModalOpen(true)
  }

  // Cart Totals
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0)
  const totalCommission = cart.reduce((sum, item) => sum + (item.commissionAmount || 0), 0)

  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Submit Sale
  const handleCheckout = async (e) => {
    if (e) e.preventDefault()
    if (cart.length === 0 || isCheckingOut) return

    if (paymentMethod === 'Credit' && !customerName.trim()) {
      alert('Please enter a Customer or Company Name for Credit sales.')
      return
    }

    let bankProviderName = null
    if (paymentMethod === 'Banking') {
      const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === selectedBank)
      bankProviderName = selectedBank === 'other' ? (customBankName.trim() || 'Other Bank') : bankObj?.name
    }

    const salePayload = {
      storeId: activeStore.id,
      storeName: activeStore.name,
      paymentMethod,
      bankProvider: bankProviderName,
      bankRef: bankRef.trim() || null,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      totalAmount,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        commissionRate: item.product.defaultCommissionRate || 5,
        commissionAmount: item.commissionAmount,
      }))
    }

    setIsCheckingOut(true)
    // Clear cart optimistically for snappy UX
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setBankRef('')
    setIsMobileCartOpen(false)

    try {
      const createdSale = await recordSale(salePayload, currentUser)
      if (createdSale) {
        setLastCompletedSale(createdSale)
        setTimeout(() => {
          setLastCompletedSale(curr => (curr?.id === createdSale.id ? null : curr))
        }, 3000)
      }
    } catch (err) {
      console.error('Sale recording failed:', err)
      alert('Sale could not be saved to the database. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Reusable Checkout Form
  const renderCheckoutForm = () => (
    <div className="space-y-4">
      {/* Cart Items List with Direct Manual Numeric Input */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Cart is empty. Tap products to add them.
          </div>
        ) : (
          cart.map(({ product, quantity, commissionAmount }) => {
            const currentStoreStock = activeStore?.stock[product.id] || 0
            return (
              <div key={product.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex-1 pr-2">
                  <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatCurrency(product.sellingPrice)} &bull; Comm: +{formatCurrency(commissionAmount)}
                  </p>
                </div>
                
                {/* Manual Quantity Input & Stepper */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantityDelta(product.id, -1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 touch-manipulation active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5 text-slate-700" />
                  </button>

                  {/* Direct Manual Numeric Input */}
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={currentStoreStock}
                      value={quantity}
                      onChange={(e) => handleSetQuantity(product.id, e.target.value)}
                      className="w-12 h-8 text-center font-extrabold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateQuantityDelta(product.id, 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 touch-manipulation active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(product.id)}
                    className="ml-1 p-1 text-slate-400 hover:text-rose-600 touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
            { id: 'Cash', icon: DollarSign },
            { id: 'Banking', icon: Building },
            { id: 'Credit', icon: CreditCard }
          ].map(method => (
            <button
              key={method.id}
              type="button"
              onClick={() => setPaymentMethod(method.id)}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                paymentMethod === method.id
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <method.icon className="w-4 h-4" />
              <span>{method.id}</span>
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
      
      {/* Mobile Top Header: Store Switcher & Staff Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            Point-of-Sale (POS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Salesperson: <span className="font-semibold text-slate-700">{currentUser.name}</span>
          </p>
        </div>

        {/* Store Location: Locked for Salesperson, Unlocked for Owner */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isOwner ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 w-full sm:w-auto">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Assigned Store: <span className="text-emerald-700">{activeStore?.name}</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-500 shrink-0">Selling Store (Owner):</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="flex-1 sm:flex-none text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Sale Success Notification */}
      {lastCompletedSale && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start sm:items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                Sale {lastCompletedSale.invoiceNumber} recorded!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {lastCompletedSale.paymentMethod} {lastCompletedSale.bankProvider ? `(${lastCompletedSale.bankProvider})` : ''} &bull; {formatCurrency(lastCompletedSale.totalAmount)} &bull; Comm: +{formatCurrency(lastCompletedSale.commissionTotal)}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLastCompletedSale(null)}
            className="text-xs bg-white text-emerald-800 border-emerald-300 self-end sm:self-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Search Bar & Multi-Store Stock Quick Lookup Trigger */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          />
        </div>

        {/* Global Multi-Store Inventory Lookup Button */}
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            setInspectProduct(products[0])
            setIsMultiStoreModalOpen(true)
          }}
          className="shrink-0 flex items-center gap-1.5 text-xs font-bold min-h-[44px]"
        >
          <Store className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Check Other Stores</span>
          <span className="sm:hidden">Check Stock</span>
        </Button>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Product Catalog */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {activeStore?.name} &bull; Available Items
            </span>
            <span className="text-xs text-slate-400">
              {filteredProducts.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const stockAtStore = activeStore?.stock[product.id] || 0
              const isLow = stockAtStore > 0 && stockAtStore <= (product.minStockThreshold || 5)
              const isOut = stockAtStore <= 0
              const inCart = cart.find(i => i.product.id === product.id)

              return (
                <div
                  key={product.id}
                  onClick={() => !isOut && handleAddToCart(product)}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between touch-manipulation active:scale-[0.98] ${
                    isOut
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
                      : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{product.name}</h4>
                      <span className="text-sm font-extrabold text-emerald-600 shrink-0">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Comm: <span className="font-bold text-slate-800">{product.defaultCommissionRate}%</span>
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
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 touch-manipulation"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {inCart && (
                    <div className="mt-2 py-1 px-2.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center justify-between">
                      <span>In Cart</span>
                      <span>{inCart.quantity}x &bull; {formatCurrency(product.sellingPrice * inCart.quantity)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
          onClose={() => setIsMultiStoreModalOpen(false)}
          title="Branch Stock Availability"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Select Product to Check:</label>
              <select
                value={inspectProduct?.id || ''}
                onChange={(e) => setInspectProduct(products.find(p => p.id === e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(p.sellingPrice)}
                  </option>
                ))}
              </select>
            </div>

            {inspectProduct && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-700">Stock across all locations:</p>
                
                {/* Central Warehouse */}
                {warehouses.map(wh => {
                  const qty = wh.stock[inspectProduct.id] || 0
                  return (
                    <div key={wh.id} className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-purple-900 flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-purple-700" />
                          <span>{wh.name}</span>
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
                {stores.map(store => {
                  const qty = store.stock[inspectProduct.id] || 0
                  const isCurrent = store.id === activeStore.id
                  return (
                    <div key={store.id} className={`p-3 border rounded-xl flex items-center justify-between ${isCurrent ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-600" />
                          <span>{store.name}</span>
                          {isCurrent && <span className="text-[10px] text-emerald-700 font-bold">(Your Store)</span>}
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

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsMultiStoreModalOpen(false)}
                className="w-full sm:w-auto font-bold min-h-[44px]"
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
