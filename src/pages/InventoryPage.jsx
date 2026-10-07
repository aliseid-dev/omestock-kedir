import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Boxes,
  ArrowRightLeft,
  ShoppingBag,
  Warehouse,
  Store,
  AlertTriangle,
  Plus,
  Minus,
  ArrowDown,
  ChevronDown,
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
  Banknote,
  Table as TableIcon,
  LayoutGrid,
  Bell,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  UploadCloud,
  Zap,
  RefreshCw
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
import { parseInventoryExcel, PRELOADED_KAYA_YASMIN_ITEMS } from '../lib/excel-importer'

export const INVENTORY_UNITS = [
  'Piece',
  'Kg',
  'Litre',
  'Box',
  'Carton',
  'Set',
  'Pack',
  'Meter',
  'Pair',
  'Roll',
  'Can',
  'Drum',
]

function SearchableProductSelect({
  value,
  onChange,
  products = [],
  warehouseStock = null,
  stockLabel = 'in Wh',
  showStock = true,
  placeholder = "Select or search product...",
  compact = false,
  showCost = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  const selectedProduct = products.find(p => p.id === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase().trim()
    return products.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.code?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    )
  }, [products, search])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const hasStockMap = showStock && warehouseStock !== null && typeof warehouseStock === 'object'

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setSearch('')
        }}
        className={`w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
          compact ? 'p-2 min-h-[38px] text-xs' : 'p-2.5 min-h-[44px]'
        }`}
      >
        {selectedProduct ? (
          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className={`font-bold text-slate-900 truncate block ${compact ? 'text-xs' : 'text-xs'}`}>
                {selectedProduct.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {showCost && selectedProduct.costPrice ? `Cost: ${formatCurrency(selectedProduct.costPrice)} • ` : ''}
                {selectedProduct.category || 'General'}
              </span>
            </div>
            {hasStockMap && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                (warehouseStock[selectedProduct.id] || 0) > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {warehouseStock[selectedProduct.id] || 0} {stockLabel}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-xs font-medium">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search product name..."
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Product Items List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching products found
              </div>
            ) : (
              filtered.map(p => {
                const stock = hasStockMap ? (warehouseStock[p.id] || 0) : null
                const isSelected = p.id === value
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p.id, p)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-100/70 font-bold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        {showCost && p.costPrice && <span>Cost: {formatCurrency(p.costPrice)} &bull; </span>}
                        <span>{p.category || 'General'}</span>
                      </div>
                    </div>
                    {hasStockMap && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        stock > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {stock} {stockLabel}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
    seedSampleInventory,
    bulkImportInventory,
    clearDatabaseData,
    addStore,
    deleteStore,
    pendingApprovals,
    approvalHistory,
    submitTransferRequest,
    submitDirectPurchaseRequest,
    approveApprovalRequest,
    rejectApprovalRequest
  } = useTenant()
  const { currentUser, isOwner } = useAuth()
  const { toast } = useToast()

  const [stockViewMode, setStockViewMode] = useState('table') // 'table' | 'cards'
  const [isSeeding, setIsSeeding] = useState(false)
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false)
  const [processingApprovalId, setProcessingApprovalId] = useState(null)
  const [requireTelegramApproval, setRequireTelegramApproval] = useState(true)
  const [isSubmittingStorePurchase, setIsSubmittingStorePurchase] = useState(false)
  const [isSubmittingWarehousePurchase, setIsSubmittingWarehousePurchase] = useState(false)
  const [isSubmittingWarehouseAddProduct, setIsSubmittingWarehouseAddProduct] = useState(false)
  const [isSubmittingStoreAddProduct, setIsSubmittingStoreAddProduct] = useState(false)
  const [approvalConfigs, setApprovalConfigs] = useState({})

  // Excel Import & Clear Database States
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false)
  const [isClearDbModalOpen, setIsClearDbModalOpen] = useState(false)
  const [isImportingExcel, setIsImportingExcel] = useState(false)
  const [isClearingDatabase, setIsClearingDatabase] = useState(false)
  const [excelParsedData, setExcelParsedData] = useState(null)
  const [excelImportClearExisting, setExcelImportClearExisting] = useState(true)
  const [clearDbConfirmationText, setClearDbConfirmationText] = useState('')
  const fileInputRef = useRef(null)

  const getApprovalItemConfig = (reqId, it, idx) => {
    const itemKey = `${reqId}_${it.productId || idx}`
    if (approvalConfigs[itemKey]) {
      return approvalConfigs[itemKey]
    }
    const matchedProd = products?.find(
      (p) => p.id === it.productId || (it.productName && p.name?.toLowerCase().trim() === it.productName?.toLowerCase().trim())
    )
    const cost = it.costPerUnit || matchedProd?.costPrice || 0
    const defaultSellingPrice = it.sellingPrice || matchedProd?.sellingPrice || (cost > 0 ? Math.round(cost * 1.25) : 30)
    const defaultMinStock = it.minStockThreshold || matchedProd?.minStockThreshold || 5
    return {
      sellingPrice: defaultSellingPrice,
      minStockThreshold: defaultMinStock,
      unit: it.unit || matchedProd?.unit || 'Piece',
    }
  }

  const handleUpdateApprovalItemConfig = (reqId, it, idx, field, value) => {
    const itemKey = `${reqId}_${it.productId || idx}`
    const current = getApprovalItemConfig(reqId, it, idx)
    setApprovalConfigs((prev) => ({
      ...prev,
      [itemKey]: {
        ...current,
        [field]: value
      }
    }))
  }

  const handleSeedSampleData = async () => {
    if (!confirm('Load 15 sample items from Kaya Yasmin Auto Parts into warehouse and store?')) return
    setIsSeeding(true)
    try {
      const res = await seedSampleInventory()
      if (res) {
        toast.success('Sample Data Loaded', 'Successfully loaded 15 Auto Parts items into warehouse and store!')
      } else {
        toast.info('Sample Data', 'Sample auto parts loaded.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Seeding Error', 'Failed to load sample inventory.')
    } finally {
      setIsSeeding(false)
    }
  }

  // Handle Excel File Upload & Parse
  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImportingExcel(true)
    try {
      const parsed = await parseInventoryExcel(file)
      setExcelParsedData(parsed)
      toast.success(
        'Spreadsheet Parsed',
        `Found ${parsed.summary.totalProducts} products (${parsed.summary.warehouseUnits} in warehouse, ${parsed.summary.storeUnits} in store).`
      )
    } catch (err) {
      console.error('Failed to parse Excel file:', err)
      toast.error('Parse Error', err.message || 'Could not parse the selected Excel file.')
      setExcelParsedData(null)
    } finally {
      setIsImportingExcel(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle Load Preloaded Kaya Yasmin Auto Parts Excel
  const handleLoadPreloadedExcel = () => {
    const totalWhUnits = PRELOADED_KAYA_YASMIN_ITEMS.reduce((s, it) => s + (it.warehouseStock || 0), 0)
    const totalStUnits = PRELOADED_KAYA_YASMIN_ITEMS.reduce((s, it) => s + (it.storeStock || 0), 0)
    const whCount = PRELOADED_KAYA_YASMIN_ITEMS.filter((it) => it.warehouseStock !== undefined).length
    const stCount = PRELOADED_KAYA_YASMIN_ITEMS.filter((it) => it.storeStock !== undefined).length
    setExcelParsedData({
      fileName: 'Kaya Yasmin Auto Parts Inventory.xlsx',
      sheetsDetected: ['Inventory store (Warehouse)', 'Inventory shop (Retail Store)'],
      items: PRELOADED_KAYA_YASMIN_ITEMS,
      summary: {
        totalProducts: PRELOADED_KAYA_YASMIN_ITEMS.length,
        warehouseProductsCount: whCount,
        storeProductsCount: stCount,
        warehouseUnits: totalWhUnits,
        storeUnits: totalStUnits,
        oilProductsCount: PRELOADED_KAYA_YASMIN_ITEMS.filter((it) => it.defaultCommissionRate === 0.5).length,
      }
    })
    toast.info('Workbook Ready', `Loaded ${PRELOADED_KAYA_YASMIN_ITEMS.length} items (${whCount} Warehouse, ${stCount} Store). Ready to import!`)
  }

  // Confirm and Execute Bulk Import
  const handleConfirmBulkImport = async () => {
    if (!excelParsedData || !excelParsedData.items || excelParsedData.items.length === 0) {
      toast.warning('No Items', 'Please select or load an Excel workbook first.')
      return
    }

    setIsImportingExcel(true)
    try {
      const res = await bulkImportInventory(excelParsedData.items, excelImportClearExisting)
      toast.success(
        'Inventory Populated!',
        `Successfully imported ${res.importedCount} products (${res.warehouseUnits} Warehouse units, ${res.storeUnits} Store units).`
      )
      setIsImportExcelModalOpen(false)
      setExcelParsedData(null)
    } catch (err) {
      console.error('Bulk import failed:', err)
      toast.error('Import Failed', err.message || 'Could not complete inventory import.')
    } finally {
      setIsImportingExcel(false)
    }
  }

  // Handle Clear Database
  const handleConfirmClearDatabase = async () => {
    setIsClearingDatabase(true)
    try {
      await clearDatabaseData()
      toast.success('Database Cleared', 'All inventory products, warehouse stock, store stock, approvals, and sales records have been cleared.')
      setIsClearDbModalOpen(false)
      setClearDbConfirmationText('')
    } catch (err) {
      console.error('Clear database failed:', err)
      toast.error('Clear Failed', err.message || 'Could not clear database.')
    } finally {
      setIsClearingDatabase(false)
    }
  }

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
    if (!activeLocation) {
      products.forEach(p => {
        if (p.category) cats.add(p.category)
      })
    } else {
      const stockMap = activeLocation.stock || {}
      products.forEach(p => {
        const isStocked = Object.prototype.hasOwnProperty.call(stockMap, p.id) && stockMap[p.id] !== undefined
        if (isStocked) {
          // If in warehouse and 0 stock, only count if it's genuinely a warehouse product
          if (activeLocationType === 'warehouse' && (stockMap[p.id] || 0) <= 0) {
            const isGas = p.name.toLowerCase().includes('gas') || (p.category && p.category.toLowerCase().includes('gas'))
            if (!isGas) return
          }
          if (p.category) cats.add(p.category)
        }
      })
    }
    return ['ALL', ...Array.from(cats)]
  }, [products, activeLocation, activeLocationType])

  const locationFilteredProducts = useMemo(() => {
    if (!activeLocation) return []
    const stockMap = activeLocation.stock || {}
    return products.filter(p => {
      // Must be stocked / allocated in this location
      const isStocked = Object.prototype.hasOwnProperty.call(stockMap, p.id) && stockMap[p.id] !== undefined
      if (!isStocked) return false

      // Guard against ghost 0-stock entries in warehouse: if in warehouse with 0 stock, only show genuine warehouse products
      if (activeLocationType === 'warehouse' && (stockMap[p.id] || 0) <= 0) {
        const isGas = p.name.toLowerCase().includes('gas') || (p.category && p.category.toLowerCase().includes('gas'))
        if (!isGas) return false
      }

      const q = globalSearchQuery.toLowerCase().trim()
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, activeLocation, activeLocationType, globalSearchQuery, selectedCategory])

  // Modals
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
    unit: 'Piece',
    sellingPrice: '30',
    costPrice: '20',
    initialQuantity: '10',
    minStockThreshold: '5',
  })

  const [isWarehouseDirectPurchaseOpen, setIsWarehouseDirectPurchaseOpen] = useState(false)
  const [isWarehousePurchaseNewProduct, setIsWarehousePurchaseNewProduct] = useState(false)
  const [warehouseDirectPurchaseForm, setWarehouseDirectPurchaseForm] = useState({
    productId: '',
    quantity: '10',
    costPerUnit: '20',
    unit: 'Piece',
    paymentMethod: 'Banking', // 'Banking' | 'Telebirr' | 'Cash'
    bankProvider: 'cbe',
    bankReference: '',
    telebirrReference: '',
    supplierName: '',
    newProductName: '',
    newProductCategory: 'General',
    newProductSellingPrice: '30',
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
    unit: 'Piece',
    sellingPrice: '30',
    costPrice: '20',
    initialQuantity: '10',
    minStockThreshold: '5',
  })

  const [isStoreDirectPurchaseOpen, setIsStoreDirectPurchaseOpen] = useState(false)
  const [isStorePurchaseNewProduct, setIsStorePurchaseNewProduct] = useState(false)
  const [storeDirectPurchaseForm, setStoreDirectPurchaseForm] = useState({
    productId: '',
    quantity: '10',
    costPerUnit: '20',
    unit: 'Piece',
    paymentMethod: 'Banking', // 'Banking' | 'Telebirr' | 'Cash'
    bankProvider: 'cbe',
    bankReference: '',
    telebirrReference: '',
    supplierName: '',
    newProductName: '',
    newProductCategory: 'General',
    newProductSellingPrice: '30',
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
      unit: products[0]?.unit || 'Piece',
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
        unit: isNew ? 'Piece' : (nextProd?.unit || 'Piece'),
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
        if (prod) {
          updated.costPerUnit = prod.costPrice || '0'
          updated.unit = prod.unit || 'Piece'
        }
      }
      return updated
    }))
  }

  // Standalone Add Product Modal State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [standaloneProductForm, setStandaloneProductForm] = useState({
    name: '',
    category: 'General',
    unit: 'Piece',
    sellingPrice: '30',
    costPrice: '20',
    defaultCommissionRate: '2.5',
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
    unit: products[0]?.unit || 'Piece',
    paymentMethod: 'Cash', // Cash | Banking | Credit
    bankProvider: DEFAULT_BANK,
    supplierName: '',
    // New product fields
    newProductName: '',
    newProductCategory: 'General',
    newProductSellingPrice: '30',
    newProductCostPrice: '20',
    newProductCommissionRate: '2.5',
    newProductMinThreshold: '10',
  })

  // Auto-sync initial select values once data loads from Convex
  useEffect(() => {
    if (warehouses.length > 0 && !transferForm.fromWarehouseId) {
      setTransferForm(prev => ({ ...prev, fromWarehouseId: warehouses[0].id }))
    }
  }, [warehouses, transferForm.fromWarehouseId])

  useEffect(() => {
    if (stores.length > 0 && !transferForm.toStoreId) {
      setTransferForm(prev => ({ ...prev, toStoreId: stores[0].id }))
    }
    if (stores.length > 0 && !purchaseForm.storeId) {
      setPurchaseForm(prev => ({ ...prev, storeId: stores[0].id }))
    }
  }, [stores, transferForm.toStoreId, purchaseForm.storeId])

  useEffect(() => {
    if (products.length > 0 && !transferForm.productId) {
      setTransferForm(prev => ({ ...prev, productId: products[0].id }))
    }
    if (products.length > 0 && !purchaseForm.productId) {
      setPurchaseForm(prev => ({
        ...prev,
        productId: products[0].id,
        costPerUnit: products[0].costPrice || '20',
      }))
    }
  }, [products, transferForm.productId, purchaseForm.productId])

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

  // Submit Stock Transfer (One product at a time)
  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    const fromWhId = transferForm.fromWarehouseId || warehouses[0]?.id
    const toStId = transferForm.toStoreId || stores[0]?.id
    const prodId = transferForm.productId || products[0]?.id

    const wh = warehouses.find(w => w.id === fromWhId) || warehouses[0]
    const qty = parseInt(transferForm.quantity, 10) || 0

    if (!prodId) {
      toast.warning('Product Required', 'Please select a product to transfer.')
      return
    }

    if (qty <= 0) {
      toast.warning('Invalid Quantity', 'Please enter a valid transfer quantity greater than 0.')
      return
    }

    const available = wh?.stock?.[prodId] || 0
    if (qty > available) {
      const prod = products.find(p => p.id === prodId)
      toast.error('Stock Exceeded', `Transfer quantity (${qty}) exceeds available warehouse stock (${available}) for "${prod?.name || 'Product'}".`)
      return
    }

    const prod = products.find(p => p.id === prodId)
    const targetStore = stores.find(s => s.id === toStId) || stores[0]

    if (!isOwner || requireTelegramApproval) {
      await submitTransferRequest({
        fromWarehouseId: fromWhId,
        toStoreId: toStId,
        sourceName: wh?.name || 'Warehouse',
        destinationName: targetStore?.name || 'Store',
        items: [
          {
            productId: prodId,
            productName: prod?.name || prodId,
            quantity: qty,
          }
        ],
      })
      setIsTransferModalOpen(false)
      toast.info(
        'Approval Request Sent',
        `Transfer request for ${qty} unit${qty > 1 ? 's' : ''} sent to Owner on Telegram for review.`
      )
      setTransferForm(prev => ({
        ...prev,
        quantity: '5'
      }))
      return
    }

    const success = await transferStock({
      fromWarehouseId: fromWhId,
      toStoreId: toStId,
      items: [
        {
          productId: prodId,
          productName: prod?.name || prodId,
          quantity: qty,
        }
      ],
    }, currentUser)

    if (success) {
      setIsTransferModalOpen(false)
      toast.success(
        'Stock Transferred',
        `Transferred ${qty} unit${qty > 1 ? 's' : ''} of "${prod?.name || 'Product'}" to ${targetStore?.name || 'Store'}.`
      )
      setTransferForm(prev => ({
        ...prev,
        quantity: '5'
      }))
    } else {
      toast.error('Transfer Failed', 'Could not complete transfer. Please verify warehouse stock.')
    }
  }

  // ─── Dedicated Warehouse Page Handlers ────────────────────────────────────

  const handleWarehouseAddProductSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return
    if (isSubmittingWarehouseAddProduct) return

    if (!warehouseAddProductForm.name.trim()) {
      toast.warning('Product Name Required', 'Please enter a product name.')
      return
    }

    const trimmedName = warehouseAddProductForm.name.trim()
    const qty = parseInt(warehouseAddProductForm.initialQuantity, 10)
    const cost = parseFloat(warehouseAddProductForm.costPrice) || 0
    const selling = parseFloat(warehouseAddProductForm.sellingPrice) || 0
    const minThreshold = parseInt(warehouseAddProductForm.minStockThreshold, 10) || 5
    const unit = warehouseAddProductForm.unit || 'Piece'
    const category = warehouseAddProductForm.category?.trim() || 'General'

    if (isNaN(qty) || qty < 0) {
      toast.warning('Invalid Quantity', 'Please enter a valid initial stock amount (>= 0).')
      return
    }

    setIsSubmittingWarehouseAddProduct(true)

    try {
      if (!isOwner || requireTelegramApproval) {
        const existing = products.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())
        const targetProductId = existing ? existing.id : 'new_item'
        const targetProductName = existing ? existing.name : trimmedName

        await submitDirectPurchaseRequest({
          destinationLocationType: 'warehouse',
          destinationLocationId: activeLocation.id,
          destinationName: activeLocation.name,
          items: [{
            productId: targetProductId,
            productName: targetProductName,
            quantity: qty > 0 ? qty : 1,
            costPerUnit: cost,
            unit: unit,
            sellingPrice: selling > 0 ? selling : undefined,
            minStockThreshold: minThreshold,
          }],
          paymentMethod: 'Direct Intake',
          notes: `Stock addition request by ${currentUser?.name || 'Salesperson'}`,
        })

        setIsWarehouseAddProductOpen(false)
        toast.info(
          'Approval Request Sent',
          `Stock addition request for "${targetProductName}" (${qty > 0 ? qty : 1} ${unit}) sent to Owner on Telegram for review.`
        )
        setWarehouseAddProductForm({
          name: '',
          category: 'General',
          unit: 'Piece',
          sellingPrice: '30',
          costPrice: '20',
          initialQuantity: '10',
          minStockThreshold: '5',
        })
        return
      }

      // Owner direct addition
      const isOil = (trimmedName + ' ' + category).toLowerCase().includes('oil')
      const created = await createProduct({
        name: trimmedName,
        category: category,
        unit: unit,
        sellingPrice: warehouseAddProductForm.sellingPrice,
        costPrice: warehouseAddProductForm.costPrice,
        defaultCommissionRate: isOil ? 0.5 : 2.5,
        minStockThreshold: warehouseAddProductForm.minStockThreshold,
        initialWarehouseId: activeLocation.id,
        initialQuantity: qty,
      })

      if (created) {
        setIsWarehouseAddProductOpen(false)
        toast.success('Product Added', `"${created.name}" added to ${activeLocation.name}.`)
        setWarehouseAddProductForm({
          name: '',
          category: 'General',
          unit: 'Piece',
          sellingPrice: '30',
          costPrice: '20',
          initialQuantity: '10',
          minStockThreshold: '5',
        })
      } else {
        toast.error('Creation Failed', 'Failed to add product to warehouse.')
      }
    } catch (err) {
      console.error('handleWarehouseAddProductSubmit error:', err)
      toast.error('Submission Failed', err.message || 'Failed to submit item.')
    } finally {
      setIsSubmittingWarehouseAddProduct(false)
    }
  }

  // ─── Dedicated Warehouse Page Single-Item Handlers ─────────────────────────
  const handleWarehouseDirectPurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return
    if (isSubmittingWarehousePurchase) return

    const {
      productId,
      quantity,
      costPerUnit,
      unit,
      paymentMethod,
      bankProvider,
      bankReference,
      telebirrReference,
      supplierName,
      newProductName,
      newProductCategory,
      newProductSellingPrice,
    } = warehouseDirectPurchaseForm
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(costPerUnit) || 0

    if (isNaN(qty) || qty <= 0) {
      toast.warning('Invalid Quantity', 'Please enter a valid quantity (> 0).')
      return
    }

    setIsSubmittingWarehousePurchase(true)

    try {
      let targetProductId = productId
      let targetProductName = ''
      let targetProductUnit = unit || 'Piece'

      if (isWarehousePurchaseNewProduct) {
        if (!newProductName || !newProductName.trim()) {
          toast.warning('Product Name Required', 'Please enter a name for the new product.')
          return
        }
        const trimmedName = newProductName.trim()
        const existing = products.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())
        if (existing) {
          targetProductId = existing.id
          targetProductName = existing.name
          targetProductUnit = existing.unit || unit || 'Piece'
        } else {
          const isOil = (trimmedName + ' ' + (newProductCategory || '')).toLowerCase().includes('oil')
          const created = await createProduct({
            name: trimmedName,
            category: newProductCategory?.trim() || 'General',
            unit: unit || 'Piece',
            sellingPrice: newProductSellingPrice || '30',
            costPrice: costPerUnit || '20',
            defaultCommissionRate: isOil ? 0.5 : 2.5,
            minStockThreshold: 5,
          }, currentUser)
          if (!created) {
            toast.error('Creation Failed', 'Failed to create new product. Please try again.')
            return
          }
          targetProductId = created.id
          targetProductName = created.name
          targetProductUnit = created.unit || 'Piece'
        }
      } else {
        if (!productId) {
          toast.warning('Product Required', 'Please select a product.')
          return
        }
        const prod = products.find(p => p.id === productId)
        targetProductName = prod?.name || 'Product'
        targetProductUnit = prod?.unit || unit || 'Piece'
      }

      let bankProviderName = undefined
      if (paymentMethod === 'Banking') {
        const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === bankProvider)
        bankProviderName = bankObj ? bankObj.name : bankProvider
      }

      const ref = paymentMethod === 'Banking'
        ? bankReference
        : paymentMethod === 'Telebirr'
        ? telebirrReference
        : ''

      const supplierStr = supplierName
        ? `${supplierName}${ref ? ` (Ref: ${ref})` : ''}`
        : (ref ? `Ref: ${ref}` : undefined)

      if (!isOwner || requireTelegramApproval) {
        await submitDirectPurchaseRequest({
          destinationLocationType: 'warehouse',
          destinationLocationId: activeLocation.id,
          destinationName: activeLocation.name,
          items: [{
            productId: targetProductId,
            productName: targetProductName,
            quantity: qty,
            costPerUnit: cost,
            unit: targetProductUnit,
            sellingPrice: isWarehousePurchaseNewProduct && newProductSellingPrice ? parseFloat(newProductSellingPrice) : undefined,
            minStockThreshold: 5,
          }],
          paymentMethod,
          bankProvider: bankProviderName,
          supplierName: supplierStr,
        })
        setIsWarehouseDirectPurchaseOpen(false)
        setIsWarehousePurchaseNewProduct(false)
        toast.info(
          'Approval Request Sent',
          `Direct purchase request for ${qty} ${targetProductUnit} of "${targetProductName}" sent to Owner on Telegram for review.`
        )
        setWarehouseDirectPurchaseForm(prev => ({
          ...prev,
          productId: '',
          quantity: '10',
          supplierName: '',
          bankReference: '',
          telebirrReference: '',
          newProductName: '',
        }))
        return
      }

      const success = await recordWarehouseInbound({
        warehouseId: activeLocation.id,
        items: [{
          productId: targetProductId,
          productName: targetProductName,
          quantity: qty,
          costPerUnit: cost,
          unit: targetProductUnit,
        }],
        paymentMethod,
        bankProvider: bankProviderName,
        supplierName: supplierStr,
      })

      if (success) {
        setIsWarehouseDirectPurchaseOpen(false)
        setIsWarehousePurchaseNewProduct(false)
        toast.success(
          isWarehousePurchaseNewProduct ? 'New Product Added & Stocked' : 'Purchase Recorded',
          `Added ${qty} units of "${targetProductName}" to ${activeLocation.name}.`
        )
        setWarehouseDirectPurchaseForm(prev => ({
          ...prev,
          productId: '',
          quantity: '10',
          supplierName: '',
          bankReference: '',
          telebirrReference: '',
          newProductName: '',
          newProductCategory: 'General',
          newProductSellingPrice: '30',
        }))
      } else {
        toast.error('Purchase Failed', 'Could not record warehouse purchase.')
      }
    } catch (err) {
      console.error('Warehouse purchase error:', err)
      toast.error('Purchase Failed', err.message || 'Could not record warehouse purchase.')
    } finally {
      setIsSubmittingWarehousePurchase(false)
    }
  }

  const handleWarehouseTransferSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    const { toWarehouseId, toStoreId, productId, quantity } = warehouseTransferForm
    const qty = parseInt(quantity, 10)

    if (!toWarehouseId && !toStoreId) {
      toast.warning('Destination Required', 'Please select a destination warehouse or store.')
      return
    }

    if (!productId || isNaN(qty) || qty <= 0) {
      toast.warning('Invalid Input', 'Please select a product and enter a valid quantity (> 0).')
      return
    }

    const available = activeLocation.stock?.[productId] || 0
    if (qty > available) {
      const prod = products.find(p => p.id === productId)
      toast.error('Stock Exceeded', `Transfer quantity (${qty}) exceeds available stock (${available}) for "${prod?.name || 'Product'}".`)
      return
    }

    const prod = products.find(p => p.id === productId)
    const targetWh = toWarehouseId ? warehouses.find(w => w.id === toWarehouseId) : null
    const targetSt = toStoreId ? stores.find(s => s.id === toStoreId) : null
    const destName = targetWh?.name || targetSt?.name || 'Destination'

    if (!isOwner || requireTelegramApproval) {
      await submitTransferRequest({
        fromWarehouseId: activeLocation.id,
        toWarehouseId: toWarehouseId || undefined,
        toStoreId: toStoreId || undefined,
        sourceName: activeLocation.name,
        destinationName: destName,
        items: [{
          productId,
          productName: prod?.name || productId,
          quantity: qty,
        }],
        notes: warehouseTransferForm.notes,
      })
      setIsWarehouseTransferOpen(false)
      toast.info(
        'Approval Request Sent',
        `Transfer request for ${qty} unit${qty > 1 ? 's' : ''} sent to Owner on Telegram for review.`
      )
      setWarehouseTransferForm(prev => ({
        ...prev,
        quantity: '5',
      }))
      return
    }

    const success = await transferStock({
      fromWarehouseId: activeLocation.id,
      toWarehouseId: toWarehouseId || undefined,
      toStoreId: toStoreId || undefined,
      items: [{
        productId,
        productName: prod?.name || productId,
        quantity: qty,
      }],
    })

    if (success) {
      setIsWarehouseTransferOpen(false)
      toast.success('Stock Transferred', `Transferred ${qty} unit${qty > 1 ? 's' : ''} of "${prod?.name || 'Product'}".`)
      setWarehouseTransferForm(prev => ({
        ...prev,
        quantity: '5',
      }))
    } else {
      toast.error('Transfer Failed', 'Could not complete transfer. Please verify stock availability.')
    }
  }

  // ─── Dedicated Store Page Multi-Item Handlers ─────────────────────────────
  const handleStoreAddProductSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return
    if (isSubmittingStoreAddProduct) return

    if (!storeAddProductForm.name.trim()) {
      toast.warning('Product Name Required', 'Please enter a product name.')
      return
    }

    const trimmedName = storeAddProductForm.name.trim()
    const qty = parseInt(storeAddProductForm.initialQuantity, 10)
    const cost = parseFloat(storeAddProductForm.costPrice) || 0
    const selling = parseFloat(storeAddProductForm.sellingPrice) || 0
    const minThreshold = parseInt(storeAddProductForm.minStockThreshold, 10) || 5
    const unit = storeAddProductForm.unit || 'Piece'
    const category = storeAddProductForm.category?.trim() || 'General'

    if (isNaN(qty) || qty < 0) {
      toast.warning('Invalid Quantity', 'Please enter a valid initial stock amount (>= 0).')
      return
    }

    setIsSubmittingStoreAddProduct(true)

    try {
      if (!isOwner || requireTelegramApproval) {
        const existing = products.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())
        const targetProductId = existing ? existing.id : 'new_item'
        const targetProductName = existing ? existing.name : trimmedName

        await submitDirectPurchaseRequest({
          destinationLocationType: activeLocationType || 'store',
          destinationLocationId: activeLocation.id,
          destinationName: activeLocation.name,
          items: [{
            productId: targetProductId,
            productName: targetProductName,
            quantity: qty > 0 ? qty : 1,
            costPerUnit: cost,
            unit: unit,
            sellingPrice: selling > 0 ? selling : undefined,
            minStockThreshold: minThreshold,
          }],
          paymentMethod: 'Direct Intake',
          notes: `Stock addition request by ${currentUser?.name || 'Salesperson'}`,
        })

        setIsStoreAddProductOpen(false)
        toast.info(
          'Approval Request Sent',
          `Stock addition request for "${targetProductName}" (${qty > 0 ? qty : 1} ${unit}) sent to Owner on Telegram for review.`
        )
        setStoreAddProductForm({
          name: '',
          category: 'General',
          unit: 'Piece',
          sellingPrice: '30',
          costPrice: '20',
          initialQuantity: '10',
          minStockThreshold: '5',
        })
        return
      }

      // Owner direct addition
      const isOil = (trimmedName + ' ' + category).toLowerCase().includes('oil')
      const created = await createProduct({
        name: trimmedName,
        category: category,
        unit: unit,
        sellingPrice: storeAddProductForm.sellingPrice,
        costPrice: storeAddProductForm.costPrice,
        defaultCommissionRate: isOil ? 0.5 : 2.5,
        minStockThreshold: storeAddProductForm.minStockThreshold,
        initialStoreId: activeLocation.id,
        initialQuantity: qty,
      })

      if (created) {
        setIsStoreAddProductOpen(false)
        toast.success('Product Added', `"${created.name}" added to ${activeLocation.name}.`)
        setStoreAddProductForm({
          name: '',
          category: 'General',
          unit: 'Piece',
          sellingPrice: '30',
          costPrice: '20',
          initialQuantity: '10',
          minStockThreshold: '5',
        })
      } else {
        toast.error('Creation Failed', 'Failed to add product to store.')
      }
    } catch (err) {
      console.error('handleStoreAddProductSubmit error:', err)
      toast.error('Submission Failed', err.message || 'Failed to submit item.')
    } finally {
      setIsSubmittingStoreAddProduct(false)
    }
  }

  const handleStoreDirectPurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return
    if (isSubmittingStorePurchase) return

    const {
      productId,
      quantity,
      costPerUnit,
      unit,
      paymentMethod,
      bankProvider,
      bankReference,
      telebirrReference,
      supplierName,
      newProductName,
      newProductCategory,
      newProductSellingPrice,
    } = storeDirectPurchaseForm
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(costPerUnit) || 0

    if (isNaN(qty) || qty <= 0) {
      toast.warning('Invalid Quantity', 'Please enter a valid quantity (> 0).')
      return
    }

    setIsSubmittingStorePurchase(true)

    try {
      let targetProductId = productId
      let targetProductName = ''
      let targetProductUnit = unit || 'Piece'

      if (isStorePurchaseNewProduct) {
        if (!newProductName || !newProductName.trim()) {
          toast.warning('Product Name Required', 'Please enter a name for the new product.')
          return
        }
        const trimmedName = newProductName.trim()
        const existing = products.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())
        if (existing) {
          targetProductId = existing.id
          targetProductName = existing.name
          targetProductUnit = existing.unit || unit || 'Piece'
        } else {
          const isOil = (trimmedName + ' ' + (newProductCategory || '')).toLowerCase().includes('oil')
          const created = await createProduct({
            name: trimmedName,
            category: newProductCategory?.trim() || 'General',
            unit: unit || 'Piece',
            sellingPrice: newProductSellingPrice || '30',
            costPrice: costPerUnit || '20',
            defaultCommissionRate: isOil ? 0.5 : 2.5,
            minStockThreshold: 5,
          }, currentUser)
          if (!created) {
            toast.error('Creation Failed', 'Failed to create new product. Please try again.')
            return
          }
          targetProductId = created.id
          targetProductName = created.name
          targetProductUnit = created.unit || 'Piece'
        }
      } else {
        if (!productId) {
          toast.warning('Product Required', 'Please select a product.')
          return
        }
        const prod = products.find(p => p.id === productId)
        targetProductName = prod?.name || 'Product'
        targetProductUnit = prod?.unit || unit || 'Piece'
      }

      let bankProviderName = undefined
      if (paymentMethod === 'Banking') {
        const bankObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === bankProvider)
        bankProviderName = bankObj ? bankObj.name : bankProvider
      }

      const ref = paymentMethod === 'Banking'
        ? bankReference
        : paymentMethod === 'Telebirr'
        ? telebirrReference
        : ''

      const supplierStr = supplierName
        ? `${supplierName}${ref ? ` (Ref: ${ref})` : ''}`
        : (ref ? `Ref: ${ref}` : undefined)

      if (!isOwner || requireTelegramApproval) {
        await submitDirectPurchaseRequest({
          destinationLocationType: activeLocationType || 'store',
          destinationLocationId: activeLocation.id,
          destinationName: activeLocation.name,
          items: [{
            productId: targetProductId,
            productName: targetProductName,
            quantity: qty,
            costPerUnit: cost,
            unit: targetProductUnit,
            sellingPrice: isStorePurchaseNewProduct && newProductSellingPrice ? parseFloat(newProductSellingPrice) : undefined,
            minStockThreshold: 5,
          }],
          paymentMethod,
          bankProvider: bankProviderName,
          supplierName: supplierStr,
        })
        setIsStoreDirectPurchaseOpen(false)
        setIsStorePurchaseNewProduct(false)
        toast.info(
          'Approval Request Sent',
          `Direct purchase request for ${qty} ${targetProductUnit} of "${targetProductName}" sent to Owner on Telegram for review.`
        )
        setStoreDirectPurchaseForm(prev => ({
          ...prev,
          productId: '',
          quantity: '10',
          supplierName: '',
          bankReference: '',
          telebirrReference: '',
          newProductName: '',
        }))
        return
      }

      const success = await recordDirectPurchase({
        storeId: activeLocation.id,
        items: [{
          productId: targetProductId,
          productName: targetProductName,
          quantity: qty,
          costPerUnit: cost,
          unit: targetProductUnit,
        }],
        paymentMethod,
        bankProvider: bankProviderName,
        supplierName: supplierStr,
      })

      if (success) {
        setIsStoreDirectPurchaseOpen(false)
        setIsStorePurchaseNewProduct(false)
        toast.success(
          isStorePurchaseNewProduct ? 'New Product Added & Stocked' : 'Purchase Recorded',
          `Added ${qty} units of "${targetProductName}" to ${activeLocation.name}.`
        )
        setStoreDirectPurchaseForm(prev => ({
          ...prev,
          productId: '',
          quantity: '10',
          supplierName: '',
          bankReference: '',
          telebirrReference: '',
          newProductName: '',
          newProductCategory: 'General',
          newProductSellingPrice: '30',
        }))
      } else {
        toast.error('Purchase Failed', 'Could not record direct store purchase.')
      }
    } catch (err) {
      console.error('Direct purchase submission error:', err)
      toast.error('Purchase Failed', err.message || 'Could not complete direct purchase request.')
    } finally {
      setIsSubmittingStorePurchase(false)
    }
  }

  const handleStoreTransferSubmit = async (e) => {
    e.preventDefault()
    if (!activeLocation) return

    const { toWarehouseId, toStoreId, productId, quantity } = storeTransferForm
    const qty = parseInt(quantity, 10)

    if (!toWarehouseId && !toStoreId) {
      toast.warning('Destination Required', 'Please select a destination warehouse or store.')
      return
    }

    if (!productId || isNaN(qty) || qty <= 0) {
      toast.warning('Invalid Input', 'Please select a product and enter a valid quantity (> 0).')
      return
    }

    const available = activeLocation.stock?.[productId] || 0
    if (qty > available) {
      const prod = products.find(p => p.id === productId)
      toast.error('Stock Exceeded', `Transfer quantity (${qty}) exceeds available stock (${available}) for "${prod?.name || 'Product'}".`)
      return
    }

    const prod = products.find(p => p.id === productId)
    const targetWh = toWarehouseId ? warehouses.find(w => w.id === toWarehouseId) : null
    const targetSt = toStoreId ? stores.find(s => s.id === toStoreId) : null
    const destName = targetWh?.name || targetSt?.name || 'Destination'

    if (!isOwner || requireTelegramApproval) {
      await submitTransferRequest({
        fromStoreId: activeLocation.id,
        toWarehouseId: toWarehouseId || undefined,
        toStoreId: toStoreId || undefined,
        sourceName: activeLocation.name,
        destinationName: destName,
        items: [{
          productId,
          productName: prod?.name || productId,
          quantity: qty,
        }],
        notes: storeTransferForm.notes,
      })
      setIsStoreTransferOpen(false)
      toast.info(
        'Approval Request Sent',
        `Transfer request for ${qty} unit${qty > 1 ? 's' : ''} sent to Owner on Telegram for review.`
      )
      setStoreTransferForm(prev => ({
        ...prev,
        quantity: '5',
      }))
      return
    }

    const success = await transferStock({
      fromStoreId: activeLocation.id,
      toWarehouseId: toWarehouseId || undefined,
      toStoreId: toStoreId || undefined,
      items: [{
        productId,
        productName: prod?.name || productId,
        quantity: qty,
      }],
    })

    if (success) {
      setIsStoreTransferOpen(false)
      toast.success('Stock Transferred', `Transferred ${qty} unit${qty > 1 ? 's' : ''} of "${prod?.name || 'Product'}".`)
      setStoreTransferForm(prev => ({
        ...prev,
        quantity: '5',
      }))
    } else {
      toast.error('Transfer Failed', 'Could not complete transfer. Please verify stock availability.')
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
            toast.warning('Product Name Required', 'Please specify a product name for all new items in the purchase manifest.')
            return
          }
          const isOil = ((it.newProductName || '') + ' ' + (it.newProductCategory || '')).toLowerCase().includes('oil')
          const created = await createProduct({
            name: it.newProductName.trim(),
            category: it.newProductCategory?.trim() || 'General',
            unit: it.unit || 'Piece',
            sellingPrice: it.newProductSellingPrice || '30',
            costPrice: it.costPerUnit || '20',
            defaultCommissionRate: isOil ? 0.5 : 2.5,
            minStockThreshold: 10,
          }, currentUser)
          if (!created) {
            toast.error('Creation Failed', `Failed to create product "${it.newProductName}".`)
            return
          }
          validItems.push({
            productId: created.id,
            productName: created.name,
            quantity: qty,
            costPerUnit: parseFloat(it.costPerUnit) || 0,
            unit: it.unit || created.unit || 'Piece',
            sellingPrice: parseFloat(it.newProductSellingPrice) || undefined,
            minStockThreshold: 10,
          })
        } else if (it.productId) {
          const prod = products.find(p => p.id === it.productId)
          validItems.push({
            productId: it.productId,
            productName: prod?.name || it.productId,
            quantity: qty,
            costPerUnit: parseFloat(it.costPerUnit) || 0,
            unit: it.unit || prod?.unit || 'Piece',
            sellingPrice: prod?.sellingPrice,
            minStockThreshold: prod?.minStockThreshold,
          })
        }
      }

      if (validItems.length === 0) {
        toast.warning('No Items', 'Please add at least one valid item with quantity greater than 0.')
        return
      }

      if (!isOwner || requireTelegramApproval) {
        const st = stores.find(s => s.id === purchaseForm.storeId)
        await submitDirectPurchaseRequest({
          destinationLocationType: 'store',
          destinationLocationId: purchaseForm.storeId,
          destinationName: st?.name || 'Store',
          items: validItems,
          paymentMethod: purchaseForm.paymentMethod,
          bankProvider: bankProviderName,
          supplierName: purchaseForm.supplierName,
        })
        setIsPurchaseModalOpen(false)
        toast.info(
          'Approval Request Sent',
          `Direct purchase request for ${validItems.length} items sent to Owner on Telegram for review.`
        )
        setBulkPurchaseItems([
          {
            id: `bulk-purch-${Date.now()}`,
            isNewProduct: false,
            productId: products[0]?.id || '',
            quantity: '10',
            costPerUnit: products[0]?.costPrice || '20',
            unit: products[0]?.unit || 'Piece',
            newProductName: '',
            newProductCategory: 'General',
            newProductSellingPrice: '30'
          }
        ])
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
      const st = stores.find(s => s.id === purchaseForm.storeId)
      toast.success(
        'Direct Purchase Recorded',
        `Purchased ${validItems.length} product(s) for ${st?.name || 'store'}.`
      )
      setBulkPurchaseItems([
        {
          id: `bulk-purch-${Date.now()}`,
          isNewProduct: false,
          productId: products[0]?.id || '',
          quantity: '10',
          costPerUnit: products[0]?.costPrice || '20',
          unit: products[0]?.unit || 'Piece',
          newProductName: '',
          newProductCategory: 'General',
          newProductSellingPrice: '30'
        }
      ])
      return
    }

    // Single item mode
    let targetProductId = purchaseForm.productId
    let targetProductName = ''
    let targetProductUnit = purchaseForm.unit || 'Piece'

    if (isPurchaseCreatingNewProduct) {
      if (!purchaseForm.newProductName.trim()) {
        toast.warning('Product Name Required', 'Please enter a product name.')
        return
      }
      const isOil = ((purchaseForm.newProductName || '') + ' ' + (purchaseForm.newProductCategory || '')).toLowerCase().includes('oil')
      const created = await createProduct({
        name: purchaseForm.newProductName.trim(),
        category: purchaseForm.newProductCategory.trim() || 'General',
        unit: purchaseForm.unit || 'Piece',
        sellingPrice: purchaseForm.newProductSellingPrice,
        costPrice: purchaseForm.newProductCostPrice,
        defaultCommissionRate: isOil ? 0.5 : 2.5,
        minStockThreshold: purchaseForm.newProductMinThreshold || 5,
      }, currentUser)
      if (!created) {
        toast.error('Creation Failed', 'Failed to create product. Please try again.')
        return
      }
      targetProductId = created.id
      targetProductName = created.name
      targetProductUnit = created.unit || purchaseForm.unit || 'Piece'
    } else {
      const prod = products.find(p => p.id === targetProductId)
      targetProductName = prod?.name || 'Product'
      targetProductUnit = prod?.unit || purchaseForm.unit || 'Piece'
    }

    const singleCost = parseFloat(isPurchaseCreatingNewProduct ? purchaseForm.newProductCostPrice : purchaseForm.costPerUnit) || 0
    const singleQty = parseInt(purchaseForm.quantity, 10) || 1

    if (!isOwner || requireTelegramApproval) {
      const stObj = stores.find(s => s.id === purchaseForm.storeId)
      await submitDirectPurchaseRequest({
        destinationLocationType: 'store',
        destinationLocationId: purchaseForm.storeId,
        destinationName: stObj?.name || 'Store',
        items: [{
          productId: targetProductId,
          productName: targetProductName,
          quantity: singleQty,
          costPerUnit: singleCost,
          unit: targetProductUnit,
          sellingPrice: parseFloat(purchaseForm.newProductSellingPrice) || undefined,
          minStockThreshold: parseInt(purchaseForm.newProductMinThreshold, 10) || undefined,
        }],
        paymentMethod: purchaseForm.paymentMethod,
        bankProvider: bankProviderName,
        supplierName: purchaseForm.supplierName,
      })

      setIsPurchaseModalOpen(false)
      setIsPurchaseCreatingNewProduct(false)
      toast.info(
        'Approval Request Sent',
        `Direct purchase request for ${singleQty} ${targetProductUnit} of "${targetProductName}" sent to Owner on Telegram for review.`
      )
      setPurchaseForm(prev => ({
        ...prev,
        quantity: '10',
        supplierName: '',
        newProductName: '',
      }))
      return
    }

    await recordDirectPurchase({
      storeId: purchaseForm.storeId,
      items: [{
        productId: targetProductId,
        productName: targetProductName,
        quantity: singleQty,
        costPerUnit: singleCost,
        unit: targetProductUnit,
      }],
      paymentMethod: purchaseForm.paymentMethod,
      bankProvider: bankProviderName,
      supplierName: purchaseForm.supplierName,
    }, currentUser)

    setIsPurchaseModalOpen(false)
    setIsPurchaseCreatingNewProduct(false)
    const stObj = stores.find(s => s.id === purchaseForm.storeId)
    const prObj = products.find(p => p.id === targetProductId)
    toast.success(
      'Direct Purchase Recorded',
      `Purchased ${purchaseForm.quantity} ${targetProductUnit} of "${prObj?.name || 'Product'}" for ${stObj?.name || 'store'}.`
    )
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
      toast.warning('Product Name Required', 'Please enter a product name.')
      return
    }
    const isOil = ((standaloneProductForm.name || '') + ' ' + (standaloneProductForm.category || '')).toLowerCase().includes('oil')
    const commissionRate = standaloneProductForm.defaultCommissionRate !== undefined && standaloneProductForm.defaultCommissionRate !== ''
      ? parseFloat(standaloneProductForm.defaultCommissionRate)
      : (isOil ? 0.5 : 2.5)

    const created = await createProduct({
      name: standaloneProductForm.name.trim(),
      category: standaloneProductForm.category.trim() || 'General',
      unit: standaloneProductForm.unit || 'Piece',
      sellingPrice: standaloneProductForm.sellingPrice,
      costPrice: standaloneProductForm.costPrice,
      defaultCommissionRate: commissionRate,
      minStockThreshold: standaloneProductForm.minStockThreshold,
    }, currentUser)

    if (!created) {
      toast.error('Creation Failed', 'Failed to create product.')
      return
    }

    const initQty = parseInt(standaloneProductForm.initialQuantity, 10) || 0
    if (initQty > 0 && standaloneProductForm.initialDestination !== 'none') {
      if (standaloneProductForm.initialDestination === 'warehouse') {
        const whId = standaloneProductForm.initialDestinationId || warehouses[0]?.id
        const whObj = warehouses.find(w => w.id === whId)
        if (whId) {
          if (!isOwner || requireTelegramApproval) {
            await submitDirectPurchaseRequest({
              destinationLocationType: 'warehouse',
              destinationLocationId: whId,
              destinationName: whObj?.name || 'Warehouse',
              items: [{
                productId: created.id,
                productName: created.name,
                quantity: initQty,
                costPerUnit: parseFloat(standaloneProductForm.costPrice) || 0,
                unit: standaloneProductForm.unit || created.unit || 'Piece',
                sellingPrice: parseFloat(standaloneProductForm.sellingPrice) || undefined,
                minStockThreshold: parseInt(standaloneProductForm.minStockThreshold, 10) || undefined,
              }],
              paymentMethod: 'Cash',
              supplierName: 'Initial Product Stocking',
            })
            toast.info(
              'Stock Approval Request Sent',
              `Initial stocking of ${initQty} units for "${created.name}" sent to Owner on Telegram for approval.`
            )
          } else {
            await recordWarehouseInbound({
              warehouseId: whId,
              productId: created.id,
              quantity: initQty,
              costPerUnit: standaloneProductForm.costPrice,
              paymentMethod: 'Cash',
              supplierName: 'Initial Product Stocking'
            }, currentUser)
          }
        }
      } else if (standaloneProductForm.initialDestination === 'store') {
        const stId = standaloneProductForm.initialDestinationId || stores[0]?.id
        const stObj = stores.find(s => s.id === stId)
        if (stId) {
          if (!isOwner || requireTelegramApproval) {
            await submitDirectPurchaseRequest({
              destinationLocationType: 'store',
              destinationLocationId: stId,
              destinationName: stObj?.name || 'Store',
              items: [{
                productId: created.id,
                productName: created.name,
                quantity: initQty,
                costPerUnit: parseFloat(standaloneProductForm.costPrice) || 0,
                unit: standaloneProductForm.unit || created.unit || 'Piece',
                sellingPrice: parseFloat(standaloneProductForm.sellingPrice) || undefined,
                minStockThreshold: parseInt(standaloneProductForm.minStockThreshold, 10) || undefined,
              }],
              paymentMethod: 'Cash',
              supplierName: 'Initial Product Stocking',
            })
            toast.info(
              'Stock Approval Request Sent',
              `Initial stocking of ${initQty} units for "${created.name}" sent to Owner on Telegram for approval.`
            )
          } else {
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
    }

    setIsAddProductModalOpen(false)
    toast.success('Product Created', `"${created.name}" created and added to catalog.`)
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
    toast.success('Stock Adjusted', 'Inventory stock count successfully adjusted.')
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
    
    const prod = products.find(p => p.id === productPricingForm.productId)
    toast.success('Pricing Updated', `Saved prices and margins for "${prod?.name || 'Product'}".`)
    setPricingSavedToast(true)
    setTimeout(() => {
      setPricingSavedToast(false)
    }, 2500)
  }

  // Add Store
  const handleAddStoreSubmit = (e) => {
    e.preventDefault()
    if (!newStoreForm.name.trim()) return
    const storeName = newStoreForm.name.trim()
    addStore(newStoreForm, currentUser)
    toast.success('Store Added', `"${storeName}" created successfully.`)
    setNewStoreForm({ name: '', location: '' })
    setIsAddStoreModalOpen(false)
  }

  // Delete Store
  const handleDeleteStore = (store) => {
    if (window.confirm(`Are you sure you want to delete "${store.name}"? This action is permanent and will be logged in the audit trail.`)) {
      deleteStore(store.id, currentUser)
      toast.success('Store Removed', `"${store.name}" has been deleted.`)
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
                Inventory
              </h1>
            </div>

            {/* Quick Actions: Mobile-First layout (Transfer Stock, Add Store, Import Excel, Clear Database) */}
            <div className={`w-full sm:w-auto gap-2.5 sm:gap-3 ${isOwner ? 'grid grid-cols-2 sm:flex sm:items-center' : 'flex items-center'}`}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setTransferForm(prev => ({
                    fromWarehouseId: prev.fromWarehouseId || warehouses[0]?.id || '',
                    toStoreId: prev.toStoreId || stores[0]?.id || '',
                    productId: prev.productId || products[0]?.id || '',
                    quantity: '5',
                  }))
                  setIsTransferModalOpen(true)
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold min-h-[46px] rounded-xl shadow-xs border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation cursor-pointer px-4"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate">Transfer Stock</span>
              </Button>

              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsAddStoreModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border-blue-300 text-blue-900 bg-blue-50/80 hover:bg-blue-100 active:scale-[0.98] transition-all min-h-[46px] rounded-xl shadow-xs touch-manipulation cursor-pointer px-4"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="truncate">Add Store</span>
                  </Button>

                  

                  
                </>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Locations</span>
                </button>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {activeLocation.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {locationFilteredProducts.length} Items &bull; {locationFilteredProducts.reduce((acc, p) => acc + (activeLocation.stock?.[p.id] || 0), 0).toLocaleString()} Total Units
              </p>
            </div>

            {/* Location Actions: Add Item, Direct Purchase, Transfer */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              {activeLocationType === 'warehouse' ? (
                <>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => {
                      setWarehouseAddProductForm({
                        name: '',
                        category: 'General',
                        unit: 'Piece',
                        sellingPrice: '30',
                        costPrice: '20',
                        initialQuantity: '10',
                        minStockThreshold: '5',
                      })
                      setIsWarehouseAddProductOpen(true)
                    }}
                    className="w-full sm:w-auto bg-black hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add Item</span>
                  </Button>

                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const firstProd = products[0]
                      setWarehouseDirectPurchaseForm(prev => ({
                        ...prev,
                        productId: firstProd?.id || '',
                        quantity: '10',
                        costPerUnit: firstProd?.costPrice || '20',
                        paymentMethod: 'Banking',
                        bankProvider: 'cbe',
                        supplierName: '',
                        bankReference: '',
                        telebirrReference: '',
                        newProductName: '',
                        newProductCategory: 'General',
                        newProductSellingPrice: '30',
                      }))
                      setIsWarehousePurchaseNewProduct(false)
                      setIsWarehouseDirectPurchaseOpen(true)
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-transparent font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-xl cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Direct Purchase</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => {
                      setStoreAddProductForm({
                        name: '',
                        category: 'General',
                        unit: 'Piece',
                        sellingPrice: '30',
                        costPrice: '20',
                        initialQuantity: '10',
                        minStockThreshold: '5',
                      })
                      setIsStoreAddProductOpen(true)
                    }}
                    className="w-full sm:w-auto bg-black hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add Item</span>
                  </Button>

                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const firstProd = products[0]
                      setStoreDirectPurchaseForm(prev => ({
                        ...prev,
                        productId: firstProd?.id || '',
                        quantity: '10',
                        costPerUnit: firstProd?.costPrice || '20',
                        paymentMethod: 'Banking',
                        bankProvider: 'cbe',
                        supplierName: '',
                        bankReference: '',
                        telebirrReference: '',
                        newProductName: '',
                        newProductCategory: 'General',
                        newProductSellingPrice: '30',
                      }))
                      setIsStorePurchaseNewProduct(false)
                      setIsStoreDirectPurchaseOpen(true)
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-transparent font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-xl cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Direct Purchase</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar & View Controls (Merged, Space-Saving) */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                {globalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Switcher Toggle */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setStockViewMode('table')}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    stockViewMode === 'table'
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
                  onClick={() => setStockViewMode('cards')}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    stockViewMode === 'cards'
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

            {/* Category Filter Pills (Horizontal scrollable) */}
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
          </div>

          {/* Quick Seed Button - Only shown when inventory is empty */}
          {isOwner && products.length === 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
              <p className="text-xs font-bold text-amber-900">Your inventory is currently empty</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedSampleData}
                disabled={isSeeding}
                className="text-xs font-bold border-amber-300 text-amber-900 bg-white hover:bg-amber-100 inline-flex items-center gap-1.5 rounded-xl cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSeeding ? 'Loading Auto Parts...' : '⚡ Seed 15 Auto Parts'}</span>
              </Button>
            </div>
          )}

          {/* Products Stock Display (Table or Cards) */}
          {locationFilteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              No products found matching your search or category filter.
            </div>
          ) : stockViewMode === 'table' ? (
            /* ══════════════════════════════════════════════════════════════════ */
            /* TABLE DESIGN: Clean & Basic for Salesperson, Full for Owner        */
            /* ══════════════════════════════════════════════════════════════════ */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 sm:px-4">Item</th>
                      <th className="py-3 px-3 hidden md:table-cell">Category</th>
                      <th className="py-3 px-2 text-center hidden sm:table-cell">Unit</th>
                      <th className="py-3 px-2 sm:px-3 text-center">Stock</th>
                      <th className="py-3 px-2.5 sm:px-4">Price</th>
                      <th className="py-3 px-3 text-center hidden sm:table-cell">Status</th>
                      {isOwner && (
                        <>
                          <th className="py-3 px-3 hidden lg:table-cell">Cost</th>
                          <th className="py-3 px-3 hidden lg:table-cell">Value</th>
                          <th className="py-3 px-2 sm:px-3.5 text-right">Actions</th>
                        </>
                      )}
                      {!isOwner && activeLocationType === 'store' && (
                        <th className="py-3 px-2 text-right">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {locationFilteredProducts.map((p) => {
                      const qty = activeLocation.stock?.[p.id] || 0
                      const isLow = qty > 0 && qty <= (p.minStockThreshold || 5)
                      const isOut = qty === 0

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Item Name & Code */}
                          <td className="py-2.5 px-3 sm:px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                                  {p.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 sm:hidden">
                                <span>{p.category || 'General'}</span>
                                <span>&bull;</span>
                                <span className="font-semibold text-slate-600">{p.unit || 'Pc'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Category (Hidden on mobile) */}
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                              {p.category || 'General'}
                            </span>
                          </td>

                          {/* Unit (Hidden on mobile, merged with name) */}
                          <td className="py-2.5 px-2 text-center hidden sm:table-cell">
                            <span className="text-xs font-bold text-slate-600 uppercase">
                              {p.unit || 'Pc'}
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="py-2.5 px-2 sm:px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-black text-xs sm:text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                                {qty}
                              </span>
                              <span className={`text-[9px] font-extrabold sm:hidden ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                                {isOut ? 'Out' : isLow ? 'Low' : 'In Stock'}
                              </span>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-2.5 px-2.5 sm:px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-emerald-700 text-xs sm:text-sm">
                                {formatCurrency(p.sellingPrice)}
                              </span>
                              {p.sellingPriceRange && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 w-fit">
                                  {p.sellingPriceRange} ETB
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Badge (Desktop only, mobile shows dot/text in Stock cell) */}
                          <td className="py-2.5 px-3 text-center hidden sm:table-cell">
                            {isOut ? (
                              <Badge variant="danger" className="text-[10px] font-bold">Out of Stock</Badge>
                            ) : isLow ? (
                              <Badge variant="warning" className="text-[10px] font-bold">Low ({qty})</Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px] font-bold">In Stock</Badge>
                            )}
                          </td>

                          {/* Owner Cost Price */}
                          {isOwner && (
                            <td className="py-2.5 px-3 hidden lg:table-cell text-slate-600 text-xs font-medium">
                              {formatCurrency(p.costPrice)}
                            </td>
                          )}

                          {/* Owner Total Stock Value */}
                          {isOwner && (
                            <td className="py-2.5 px-3 hidden lg:table-cell font-bold text-slate-800 text-xs">
                              {formatCurrency(qty * (p.costPrice || 0))}
                            </td>
                          )}

                          {/* Owner Actions */}
                          {isOwner && (
                            <td className="py-2.5 px-2 sm:px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductPricing(p)}
                                  title="Adjust Price"
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Tags className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenOverride(activeLocation.id, activeLocation.name, activeLocationType, p.id, p.name, qty)}
                                  title="Stock Override"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}

                          {/* Salesperson Action (Only in store) */}
                          {!isOwner && activeLocationType === 'store' && (
                            <td className="py-3 px-3 text-right">
                              <a
                                href={`/pos?store=${activeLocation.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                              >
                                <span>Sell</span>
                              </a>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════ */
            /* CARDS DESIGN: Responsive Card Grid                                 */
            /* ══════════════════════════════════════════════════════════════════ */
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
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 inline">{p.name}</h4>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs font-black text-emerald-700">
                            {formatCurrency(p.sellingPrice)}
                          </span>
                          {p.sellingPriceRange && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mt-0.5">
                              {p.sellingPriceRange}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                        {isOwner && <span>Cost: {formatCurrency(p.costPrice)} &bull; </span>}
                        {p.category && <span>{p.category} &bull; </span>}
                        <span>{p.unit || 'Piece'}</span>
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
                          <span className="text-[11px] text-slate-400 font-medium">{p.unit || 'units'}</span>
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

                      {!isOwner && activeLocationType === 'store' && (
                        <a
                          href={`/pos?store=${activeLocation.id}`}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                        >
                          Sell
                        </a>
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
              <p className="font-bold">
                {isOwner ? 'Direct Warehouse Product Addition' : 'Warehouse Stock Addition (Pending Owner Approval)'}
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                {isOwner
                  ? <>Creates this product and immediately places initial stock directly into <strong>{activeLocation?.name}</strong>.</>
                  : <>Submits this item to the Owner via Telegram for verification. Once approved, the stock will be added directly into <strong>{activeLocation?.name}</strong> inventory without recording sales.</>}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                list="warehouse-product-suggestions"
                placeholder="Type or pick product name..."
                value={warehouseAddProductForm.name}
                onChange={(e) => {
                  const val = e.target.value
                  const match = products.find(p => p.name.toLowerCase() === val.toLowerCase())
                  if (match) {
                    setWarehouseAddProductForm(prev => ({
                      ...prev,
                      name: val,
                      category: match.category || prev.category,
                      unit: match.unit || prev.unit,
                      sellingPrice: match.sellingPrice ? String(match.sellingPrice) : prev.sellingPrice,
                      costPrice: match.costPrice ? String(match.costPrice) : prev.costPrice,
                      minStockThreshold: match.minStockThreshold ? String(match.minStockThreshold) : prev.minStockThreshold,
                    }))
                  } else {
                    setWarehouseAddProductForm(prev => ({ ...prev, name: val }))
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm min-h-[44px]"
              />
              <datalist id="warehouse-product-suggestions">
                {products.map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className="block font-bold text-slate-700 mb-1">Unit *</label>
                <select
                  value={warehouseAddProductForm.unit || 'Piece'}
                  onChange={(e) => setWarehouseAddProductForm({ ...warehouseAddProductForm, unit: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
                >
                  {INVENTORY_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Stock Amount *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Cost / Purchase Price (ETB) *</label>
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
                disabled={isSubmittingWarehouseAddProduct}
                className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSubmittingWarehouseAddProduct
                  ? 'Submitting...'
                  : isOwner
                  ? 'Add Product to Warehouse'
                  : 'Submit for Owner Approval'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MODAL: DIRECT PURCHASE TO WAREHOUSE (SINGLE-ITEM)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isWarehouseDirectPurchaseOpen && (
        <Modal
          isOpen={isWarehouseDirectPurchaseOpen}
          onClose={() => setIsWarehouseDirectPurchaseOpen(false)}
          title={`Direct Purchase to ${activeLocation?.name || 'Warehouse'}`}
        >
          <form onSubmit={handleWarehouseDirectPurchaseSubmit} className="space-y-4 text-xs">
            {/* Mode Toggle: Existing Item vs + New Item */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsWarehousePurchaseNewProduct(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation flex items-center justify-center gap-1.5 ${
                  !isWarehousePurchaseNewProduct
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Existing Item</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWarehousePurchaseNewProduct(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation flex items-center justify-center gap-1.5 ${
                  isWarehousePurchaseNewProduct
                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Item</span>
              </button>
            </div>

            {!isWarehousePurchaseNewProduct ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                <SearchableProductSelect
                  value={warehouseDirectPurchaseForm.productId}
                  onChange={(newId, prod) => {
                    setWarehouseDirectPurchaseForm(prev => ({
                      ...prev,
                      productId: newId,
                      costPerUnit: prod?.costPrice ? String(prod.costPrice) : prev.costPerUnit,
                      unit: prod?.unit || prev.unit || 'Piece',
                    }))
                  }}
                  products={products}
                  warehouseStock={activeLocation?.stock || {}}
                  stockLabel="in Wh"
                  placeholder="Search and select product..."
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Product Details</span>
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Merkato Cotton T-Shirts"
                    value={warehouseDirectPurchaseForm.newProductName}
                    onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, newProductName: e.target.value }))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Apparel, Hardware"
                      value={warehouseDirectPurchaseForm.newProductCategory}
                      onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, newProductCategory: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Unit *</label>
                    <select
                      value={warehouseDirectPurchaseForm.unit || 'Piece'}
                      onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {INVENTORY_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Note: Selling price and minimum stock alert will be set by the Owner during approval.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purchase Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 20"
                  value={warehouseDirectPurchaseForm.costPerUnit}
                  onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, costPerUnit: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (Quantity) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 10"
                  value={warehouseDirectPurchaseForm.quantity}
                  onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit *</label>
                <select
                  value={warehouseDirectPurchaseForm.unit || 'Piece'}
                  onChange={(e) => setWarehouseDirectPurchaseForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-slate-800 text-sm"
                >
                  {INVENTORY_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Cost Display */}
            {(() => {
              const q = parseInt(warehouseDirectPurchaseForm.quantity, 10) || 0
              const c = parseFloat(warehouseDirectPurchaseForm.costPerUnit) || 0
              const totalCost = q * c

              return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 font-bold text-xs block">Total Purchase Cost</span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {q} unit(s)
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
                disabled={isSubmittingWarehousePurchase}
                className="w-full sm:w-auto font-bold min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {isSubmittingWarehousePurchase
                  ? 'Submitting...'
                  : (!isOwner || requireTelegramApproval
                    ? 'Send for Telegram Approval'
                    : 'Record Direct Purchase')}
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
                        {w.name}{w.location && w.location !== w.name ? ` (${w.location})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Stores">
                  {stores.map(s => (
                    <option key={s.id} value={`st-${s.id}`}>
                      {s.name}{s.location && s.location !== s.name ? ` (${s.location})` : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Single Product Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Product *</label>
              <SearchableProductSelect
                value={warehouseTransferForm.productId}
                onChange={(newId) => setWarehouseTransferForm(prev => ({ ...prev, productId: newId }))}
                products={products}
                warehouseStock={activeLocation?.stock || {}}
                placeholder="Search & choose a product to transfer..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
              <input
                type="number"
                min="1"
                max={activeLocation?.stock?.[warehouseTransferForm.productId] || 1}
                required
                value={warehouseTransferForm.quantity}
                onChange={(e) => setWarehouseTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-black text-slate-900 text-sm"
              />
              {(() => {
                const avail = activeLocation?.stock?.[warehouseTransferForm.productId] || 0
                const qtyNum = parseInt(warehouseTransferForm.quantity, 10) || 0
                if (qtyNum > avail) {
                  return (
                    <p className="text-[11px] text-rose-600 font-bold mt-1">
                      Exceeds available stock ({avail})
                    </p>
                  )
                }
                return null
              })()}
            </div>

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
              <p className="font-bold">
                {isOwner ? 'Direct Store Product Addition' : 'Store Stock Addition (Pending Owner Approval)'}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {isOwner
                  ? <>Creates this product and immediately places initial stock directly into <strong>{activeLocation?.name}</strong>.</>
                  : <>Submits this item to the Owner via Telegram for verification. Once approved, the stock will be added directly into <strong>{activeLocation?.name}</strong> inventory without recording sales.</>}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                list="store-product-suggestions"
                placeholder="Type or pick product name..."
                value={storeAddProductForm.name}
                onChange={(e) => {
                  const val = e.target.value
                  const match = products.find(p => p.name.toLowerCase() === val.toLowerCase())
                  if (match) {
                    setStoreAddProductForm(prev => ({
                      ...prev,
                      name: val,
                      category: match.category || prev.category,
                      unit: match.unit || prev.unit,
                      sellingPrice: match.sellingPrice ? String(match.sellingPrice) : prev.sellingPrice,
                      costPrice: match.costPrice ? String(match.costPrice) : prev.costPrice,
                      minStockThreshold: match.minStockThreshold ? String(match.minStockThreshold) : prev.minStockThreshold,
                    }))
                  } else {
                    setStoreAddProductForm(prev => ({ ...prev, name: val }))
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm min-h-[44px]"
              />
              <datalist id="store-product-suggestions">
                {products.map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className="block font-bold text-slate-700 mb-1">Unit *</label>
                <select
                  value={storeAddProductForm.unit || 'Piece'}
                  onChange={(e) => setStoreAddProductForm({ ...storeAddProductForm, unit: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold min-h-[44px]"
                >
                  {INVENTORY_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Stock Amount *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Cost / Purchase Price (ETB) *</label>
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
                disabled={isSubmittingStoreAddProduct}
                className="w-full sm:w-auto font-bold min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSubmittingStoreAddProduct
                  ? 'Submitting...'
                  : isOwner
                  ? 'Add Product to Store'
                  : 'Submit for Owner Approval'}
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
            {/* Mode Toggle: Existing Item vs + New Item */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsStorePurchaseNewProduct(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation flex items-center justify-center gap-1.5 ${
                  !isStorePurchaseNewProduct
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Existing Item</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStorePurchaseNewProduct(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation flex items-center justify-center gap-1.5 ${
                  isStorePurchaseNewProduct
                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Item</span>
              </button>
            </div>

            {!isStorePurchaseNewProduct ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                <SearchableProductSelect
                  value={storeDirectPurchaseForm.productId}
                  onChange={(newId, prod) => {
                    setStoreDirectPurchaseForm(prev => ({
                      ...prev,
                      productId: newId,
                      costPerUnit: prod?.costPrice ? String(prod.costPrice) : prev.costPerUnit,
                      unit: prod?.unit || prev.unit || 'Piece',
                    }))
                  }}
                  products={products}
                  warehouseStock={activeLocation?.stock || {}}
                  stockLabel="in Store"
                  placeholder="Search and select product..."
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Product Details</span>
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Merkato Cotton T-Shirts"
                    value={storeDirectPurchaseForm.newProductName}
                    onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, newProductName: e.target.value }))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Apparel, Hardware"
                      value={storeDirectPurchaseForm.newProductCategory}
                      onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, newProductCategory: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Unit *</label>
                    <select
                      value={storeDirectPurchaseForm.unit || 'Piece'}
                      onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {INVENTORY_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Note: Selling price and minimum stock alert will be set by the Owner during approval.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purchase Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 20"
                  value={storeDirectPurchaseForm.costPerUnit}
                  onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, costPerUnit: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (Quantity) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 10"
                  value={storeDirectPurchaseForm.quantity}
                  onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit *</label>
                <select
                  value={storeDirectPurchaseForm.unit || 'Piece'}
                  onChange={(e) => setStoreDirectPurchaseForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold text-slate-800 text-sm"
                >
                  {INVENTORY_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Cost Display */}
            {(() => {
              const q = parseInt(storeDirectPurchaseForm.quantity, 10) || 0
              const c = parseFloat(storeDirectPurchaseForm.costPerUnit) || 0
              const totalCost = q * c

              return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 font-bold text-xs block">Total Purchase Cost</span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {q} unit(s)
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
                disabled={isSubmittingStorePurchase}
                className="w-full sm:w-auto font-bold min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {isSubmittingStorePurchase
                  ? 'Submitting...'
                  : (!isOwner || requireTelegramApproval
                    ? 'Request Approval'
                    : 'Record Direct Purchase')}
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
                        {w.name}{w.location && w.location !== w.name ? ` (${w.location})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Stores">
                  {stores.filter(s => s.id !== activeLocation?.id).map(s => (
                    <option key={s.id} value={`st-${s.id}`}>
                      {s.name}{s.location && s.location !== s.name ? ` (${s.location})` : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Single Product Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
              <SearchableProductSelect
                value={storeTransferForm.productId}
                onChange={(newId) => setStoreTransferForm(prev => ({ ...prev, productId: newId }))}
                products={products}
                warehouseStock={activeLocation?.stock || {}}
                stockLabel="available"
                placeholder="Search product to transfer..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
              <input
                type="number"
                min="1"
                max={activeLocation?.stock?.[storeTransferForm.productId] || 1}
                required
                value={storeTransferForm.quantity}
                onChange={(e) => setStoreTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-black text-slate-900 text-sm"
              />
              {(() => {
                const avail = activeLocation?.stock?.[storeTransferForm.productId] || 0
                const qtyNum = parseInt(storeTransferForm.quantity, 10) || 0
                if (qtyNum > avail) {
                  return (
                    <p className="text-[11px] text-rose-600 font-bold mt-1">
                      Exceeds available stock ({avail})
                    </p>
                  )
                }
                return null
              })()}
            </div>

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
      {/* 3. STOCK TRANSFER MODAL (SINGLE PRODUCT AT A TIME, CLEAN & SIMPLE UI) */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (() => {
        const currentWh = warehouses.find(w => w.id === transferForm.fromWarehouseId)
        const availableQty = currentWh?.stock?.[transferForm.productId] || 0
        const qtyNum = parseInt(transferForm.quantity, 10) || 0
        const isOverLimit = qtyNum > availableQty
        const selectedProd = products.find(p => p.id === transferForm.productId)

        return (
          <Modal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            title="Transfer Stock to Store"
          >
            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              {/* Route Card (From Warehouse -> Destination Store) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-purple-600" />
                    <span>From Warehouse (Source)</span>
                  </label>
                  <select
                    value={transferForm.fromWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl min-h-[42px] font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <div className="flex-1 border-t border-slate-200 border-dashed" />
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <ArrowDown className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="flex-1 border-t border-slate-200 border-dashed" />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Destination Retail Store (Target)</span>
                  </label>
                  <select
                    value={transferForm.toStoreId}
                    onChange={(e) => setTransferForm({ ...transferForm, toStoreId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl min-h-[42px] font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.location && s.location !== s.name ? ` (${s.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Single Product Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span>Product to Transfer</span>
                  </label>
                  {selectedProd && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      availableQty > 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {availableQty} units in warehouse
                    </span>
                  )}
                </div>
                <SearchableProductSelect
                  value={transferForm.productId}
                  onChange={(newId) => setTransferForm(prev => ({ ...prev, productId: newId }))}
                  products={products}
                  warehouseStock={currentWh?.stock || {}}
                />
              </div>

              {/* Quantity to Dispatch with Stepper Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Quantity to Dispatch
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Available: <strong className="text-slate-700">{availableQty}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(transferForm.quantity, 10) || 0
                      if (cur > 1) setTransferForm(prev => ({ ...prev, quantity: String(cur - 1) }))
                    }}
                    disabled={qtyNum <= 1}
                    className="w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={availableQty}
                    required
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className={`flex-1 h-11 px-3 bg-white border rounded-xl text-center text-base font-black transition-all ${
                      isOverLimit
                        ? 'border-rose-400 text-rose-600 bg-rose-50/50 ring-2 ring-rose-200'
                        : 'border-slate-200 text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(transferForm.quantity, 10) || 0
                      if (cur < availableQty) setTransferForm(prev => ({ ...prev, quantity: String(cur + 1) }))
                    }}
                    disabled={qtyNum >= availableQty}
                    className="w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {availableQty > 0 && (
                    <button
                      type="button"
                      onClick={() => setTransferForm(prev => ({ ...prev, quantity: String(availableQty) }))}
                      className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                      title="Set to max available warehouse stock"
                    >
                      Max ({availableQty})
                    </button>
                  )}
                </div>

                {isOverLimit && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    Exceeds available warehouse stock of {availableQty} units.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={qtyNum <= 0 || isOverLimit || availableQty === 0}
                  className="w-full sm:w-auto font-bold min-h-[46px] bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>
                    {qtyNum > 0 && !isOverLimit
                      ? `Transfer ${qtyNum} Units`
                      : 'Transfer Stock'}
                  </span>
                </Button>
              </div>
            </form>
          </Modal>
        )
      })()}

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
                            <SearchableProductSelect
                              value={item.productId}
                              onChange={(newId) => handleUpdateBulkPurchaseRow(item.id, 'productId', newId)}
                              products={products}
                              showStock={false}
                              showCost={true}
                              compact={true}
                              placeholder="Search product..."
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-2 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Amount (Qty)</label>
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
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Unit</label>
                            <select
                              value={item.unit || 'Piece'}
                              onChange={(e) => handleUpdateBulkPurchaseRow(item.id, 'unit', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                            >
                              {INVENTORY_UNITS.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Purchase Price (ETB)</label>
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
                    <label className="block font-bold text-slate-700 mb-1">Select Product *</label>
                    <SearchableProductSelect
                      value={purchaseForm.productId}
                      onChange={(newId, prod) => {
                        setPurchaseForm({
                          ...purchaseForm,
                          productId: newId,
                          costPerUnit: prod ? prod.costPrice : purchaseForm.costPerUnit,
                          unit: prod?.unit || purchaseForm.unit || 'Piece',
                        })
                      }}
                      products={products}
                      showStock={false}
                      showCost={true}
                      placeholder="Search and select product to purchase..."
                    />
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount (Qty):</label>
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
                    <label className="block font-bold text-slate-700 mb-1">Unit:</label>
                    <select
                      value={purchaseForm.unit || 'Piece'}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, unit: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-bold text-slate-800"
                    >
                      {INVENTORY_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Purchase Price (ETB):</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                <select
                  value={standaloneProductForm.unit || 'Piece'}
                  onChange={(e) => setStandaloneProductForm({ ...standaloneProductForm, unit: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
                >
                  {INVENTORY_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
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
                  { id: 'warehouse', label: 'Warehouse' },
                  { id: 'store', label: stores[0]?.name || 'Store 1' }
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

      {/* Pending Approvals Review Modal */}
      {isApprovalsModalOpen && (
        <Modal
          isOpen={isApprovalsModalOpen}
          onClose={() => setIsApprovalsModalOpen(false)}
          title="Pending Approval Requests"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Review requests submitted by staff members. You can approve or reject them here or directly via Telegram.
            </p>

            {(!pendingApprovals || pendingApprovals.length === 0) ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-700">All caught up!</p>
                <p className="text-xs">No pending transfer or direct purchase requests.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {pendingApprovals.map((req) => {
                  const isTransfer = req.type === 'transfer'
                  const isProcessing = processingApprovalId === req.id

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isTransfer ? 'blue' : 'purple'}
                              className="font-bold text-[10px] uppercase tracking-wider"
                            >
                              {isTransfer ? 'Stock Transfer' : 'Direct Purchase'}
                            </Badge>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm mt-1">
                            {isTransfer ? (
                              <span>{req.sourceLocationName || 'Warehouse'} &rarr; {req.destinationLocationName || 'Store'}</span>
                            ) : (
                              <span>Destination: {req.destinationLocationName || 'Store'}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Requested by <span className="font-semibold text-slate-700">{req.requestedByUserName}</span>
                            {req.supplierName && (
                              <> • Supplier: <span className="font-semibold text-slate-700">{req.supplierName}</span></>
                            )}
                          </div>
                        </div>

                        {req.totalCost !== undefined && req.totalCost > 0 && (
                          <div className="text-right">
                            <div className="text-[10px] uppercase text-slate-400 font-bold">Total Cost</div>
                            <div className="font-black text-slate-900 text-sm">
                              {req.totalCost.toLocaleString()} ETB
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items table / list with Owner Pricing Controls */}
                      {isOwner && !isTransfer ? (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Set Selling Price & Min Stock Alert before approving:</span>
                          </div>
                          {req.items?.map((it, idx) => {
                            const cfg = getApprovalItemConfig(req.id, it, idx)
                            return (
                              <div key={idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">{it.productName}</span>
                                    <span className="text-slate-500 ml-1.5">
                                      ({it.quantity} {it.unit || 'Piece'}{it.costPerUnit ? ` @ ${it.costPerUnit.toLocaleString()} ETB` : ''})
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] bg-white">
                                    {it.unit || 'Piece'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                      Selling Price (ETB) *
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={cfg.sellingPrice}
                                      onChange={(e) => handleUpdateApprovalItemConfig(req.id, it, idx, 'sellingPrice', e.target.value)}
                                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                      placeholder="Selling Price"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                      Min Stock Alert (units)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={cfg.minStockThreshold}
                                      onChange={(e) => handleUpdateApprovalItemConfig(req.id, it, idx, 'minStockThreshold', e.target.value)}
                                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                      placeholder="Min Stock Alert"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                          {req.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800">
                                {it.productName}
                              </span>
                              <span className="font-bold text-slate-900">
                                {it.quantity} {it.unit || 'units'} {it.costPerUnit ? `@ ${it.costPerUnit.toLocaleString()} ETB` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {req.notes && (
                        <div className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                          <span className="font-bold text-amber-800">Notes:</span> {req.notes}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={async () => {
                            setProcessingApprovalId(req.id)
                            try {
                              await rejectApprovalRequest(req.id, 'Rejected by Owner in App')
                              toast.info('Request Rejected', 'The request has been rejected.')
                            } catch (err) {
                              toast.error('Rejection Failed', err.message || 'Could not reject request.')
                            } finally {
                              setProcessingApprovalId(null)
                            }
                          }}
                          className="text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={async () => {
                            setProcessingApprovalId(req.id)
                            try {
                              let productConfigs = undefined
                              if (req.type === 'direct_purchase' && req.items?.length > 0) {
                                productConfigs = req.items.map((it, idx) => {
                                  const cfg = getApprovalItemConfig(req.id, it, idx)
                                  return {
                                    productId: it.productId || `item_${idx}`,
                                    sellingPrice: parseFloat(cfg.sellingPrice) || undefined,
                                    minStockThreshold: parseInt(cfg.minStockThreshold, 10) || undefined,
                                    costPrice: it.costPerUnit || undefined,
                                    unit: cfg.unit || it.unit || 'Piece',
                                  }
                                })
                              }
                              await approveApprovalRequest(req.id, productConfigs)
                              toast.success('Request Approved', 'Stock and product catalog have been updated automatically!')
                            } catch (err) {
                              toast.error('Approval Failed', err.message || 'Could not approve request.')
                            } finally {
                              setProcessingApprovalId(null)
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          {isProcessing ? 'Processing...' : 'Approve & Apply Stock'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Bulk Excel Import Modal */}
      {isImportExcelModalOpen && (
        <Modal
          isOpen={isImportExcelModalOpen}
          onClose={() => {
            if (!isImportingExcel) setIsImportExcelModalOpen(false)
          }}
          title="Single-Click Excel Inventory Import"
        >
          <div className="space-y-5">
            <p className="text-xs sm:text-sm text-slate-500">
              Populate your Warehouse and Retail Store directly from an Excel spreadsheet (<span className="font-semibold text-slate-700">.xlsx, .xls, .csv</span>).
            </p>

            {/* Quick 1-Click Kaya Yasmin Auto Parts Preset */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      1-Click Import: Kaya Yasmin Auto Parts
                    </h4>
                    <Badge variant="success" className="text-[10px] uppercase font-bold py-0.5 px-2">
                      Pre-Packaged
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Load all <strong>219 auto parts</strong> directly:
                    <span className="inline-block mx-1 font-semibold text-emerald-800">6 Warehouse products (225 units of gas cylinders)</span>
                    &amp;
                    <span className="inline-block mx-1 font-semibold text-blue-800">218 Store products (1,965 units of parts &amp; oils)</span>.
                    Oils default to <strong>0.5% commission</strong> and general parts to <strong>2.5%</strong>. Only items allocated to each location will show there!
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={isImportingExcel}
                    onClick={handleLoadPreloadedExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Load Kaya Yasmin Auto Parts (219 Items)
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Excel File Upload */}
            <div className="border border-dashed border-slate-300 hover:border-emerald-400 transition-colors rounded-2xl p-5 text-center bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileChange}
                disabled={isImportingExcel}
                className="hidden"
              />
              <UploadCloud className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <h5 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                Or Upload Any Inventory Excel / CSV
              </h5>
              <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto mb-3">
                Supports multi-sheet workbooks with sheets named <em>"Inventory store"</em> (Warehouse) and <em>"Inventory shop"</em> (Store), or standard inventory spreadsheets.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isImportingExcel}
                onClick={() => fileInputRef.current?.click()}
                className="font-bold text-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Select Excel File (.xlsx, .xls, .csv)
              </Button>
            </div>

            {/* Parsed Data Preview */}
            {excelParsedData && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                      {excelParsedData.fileName}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {excelParsedData.sheetsDetected?.join(' • ')}
                  </span>
                </div>

                {/* Summary badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-100/80 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Products</span>
                    <span className="text-base font-extrabold text-slate-900">{excelParsedData.summary.totalProducts}</span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100">
                    <span className="text-[10px] text-amber-700 block uppercase font-bold">Warehouse Stock</span>
                    <span className="text-base font-extrabold text-amber-900">{excelParsedData.summary.warehouseUnits.toLocaleString()} units</span>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
                    <span className="text-[10px] text-blue-700 block uppercase font-bold">Store Stock</span>
                    <span className="text-base font-extrabold text-blue-900">{excelParsedData.summary.storeUnits.toLocaleString()} units</span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2.5 text-center border border-purple-100">
                    <span className="text-[10px] text-purple-700 block uppercase font-bold">Oils (0.5% Comm.)</span>
                    <span className="text-base font-extrabold text-purple-900">{excelParsedData.summary.oilProductsCount} items</span>
                  </div>
                </div>

                {/* Quick 6-row preview table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Item Name</th>
                        <th className="py-2 px-2">Category</th>
                        <th className="py-2 px-2 text-right">Wh Qty</th>
                        <th className="py-2 px-2 text-right">Store Qty</th>
                        <th className="py-2 px-2 text-right">Selling Price</th>
                        <th className="py-2 px-2 text-center">Comm.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelParsedData.items.slice(0, 6).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[160px]">{item.name}</td>
                          <td className="py-2 px-2 text-slate-500 truncate max-w-[100px]">{item.category}</td>
                          <td className="py-2 px-2 text-right font-bold text-amber-700">
                            {item.warehouseStock !== undefined ? item.warehouseStock : '—'}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-blue-700">
                            {item.storeStock !== undefined ? item.storeStock : '—'}
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-slate-700">
                            {item.sellingPriceRange || (item.sellingPrice ? formatCurrency(item.sellingPrice) : '—')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Badge variant={item.defaultCommissionRate === 0.5 ? 'secondary' : 'default'} className="text-[10px] py-0 px-1">
                              {item.defaultCommissionRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelParsedData.items.length > 6 && (
                    <div className="p-2 text-center bg-slate-50 text-[11px] text-slate-500 font-medium">
                      + {excelParsedData.items.length - 6} more products ready to populate
                    </div>
                  )}
                </div>

                {/* Option to clear existing catalog */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={excelImportClearExisting}
                    onChange={(e) => setExcelImportClearExisting(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      Replace &amp; clean existing products first (Recommended)
                    </span>
                    <span className="text-slate-500 text-[11px] leading-tight block">
                      Clears old test items and resets stocks so your inventory cleanly matches the Excel workbook.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isImportingExcel}
                onClick={() => setIsImportExcelModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!excelParsedData || isImportingExcel}
                onClick={handleConfirmBulkImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isImportingExcel ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Populating Inventory...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Populate Warehouse &amp; Store Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Database Modal */}
      {isClearDbModalOpen && isOwner && (
        <Modal
          isOpen={isClearDbModalOpen}
          onClose={() => {
            if (!isClearingDatabase) {
              setIsClearDbModalOpen(false)
              setClearDbConfirmationText('')
            }
          }}
          title="Clear Database & Reset All Inventory"
        >
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm mb-1 text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                Permanent Action - Cannot be undone
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Clearing the database will permanently delete all business catalog and transaction records for this organization.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block">The following data will be wiped:</span>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>All products and categories in the catalog</li>
                <li>All warehouse stock quantities (reset to empty)</li>
                <li>All retail store stock quantities (reset to empty)</li>
                <li>All pending &amp; past stock transfer / purchase approvals</li>
                <li>All sales transactions and audit activity logs</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                To confirm, type <span className="font-mono text-rose-700 uppercase bg-rose-50 px-1 py-0.5 rounded border border-rose-200">CLEAR</span> below:
              </label>
              <input
                type="text"
                value={clearDbConfirmationText}
                onChange={(e) => setClearDbConfirmationText(e.target.value)}
                placeholder="Type CLEAR to confirm"
                disabled={isClearingDatabase}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isClearingDatabase}
                onClick={() => {
                  setIsClearDbModalOpen(false)
                  setClearDbConfirmationText('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                disabled={clearDbConfirmationText.trim().toUpperCase() !== 'CLEAR' || isClearingDatabase}
                onClick={handleConfirmClearDatabase}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isClearingDatabase ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Wiping Database...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Wipe &amp; Reset Everything
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
