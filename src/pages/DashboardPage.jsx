import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Store,
  Calendar,
  Banknote,
  Boxes,
  Layers,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Plus,
  X,
  Check,
  CheckCircle2,
  Package,
  Edit3,
  Tag,
  Coins,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  LayoutDashboard,
  Trash2,
  Loader2,
  ArrowDownToLine,
  Search,
  Building2
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../lib/utils'
import './DashboardPage.css'

export function DashboardPage() {
  const {
    products = [],
    stores = [],
    warehouses = [],
    sales = [],
    commissionSettlements = [],
    expenses = [],
    restocks = [],
    addExpense,
    deleteExpense,
    recordRestock,
    deleteRestock,
    activeOrg,
    tenantName,
    updateProduct
  } = useTenant()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  // ─── Modal States ───
  const [activeModal, setActiveModal] = useState(null) // 'stock' | 'sales' | 'date' | 'expense' | 'expenseList' | 'setPrice' | 'restockList' | 'addRestock'
  const [dateTarget, setDateTarget] = useState('sales') // 'sales' | 'profit' | 'restock'
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null)
  const [newPurchasePriceInput, setNewPurchasePriceInput] = useState('')
  const [isSavingPrice, setIsSavingPrice] = useState(false)

  // ─── Filter States ───
  const [salesRange, setSalesRange] = useState('daily') // 'daily' | 'monthly' | 'custom'
  const [profitRange, setProfitRange] = useState('gross') // 'gross' | 'lastMonth' | 'thisMonth' | 'custom'
  const [restockRange, setRestockRange] = useState('daily') // 'daily' | 'weekly' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [customSalesLabel, setCustomSalesLabel] = useState('')
  const [customProfitLabel, setCustomProfitLabel] = useState('')

  // ─── Restock Filters & Custom Range State ───
  const [customRestockStartDate, setCustomRestockStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().split('T')[0]
  })
  const [customRestockEndDate, setCustomRestockEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [customRestockLabel, setCustomRestockLabel] = useState('')
  const [restockSearchQuery, setRestockSearchQuery] = useState('')
  const [restockLocationFilter, setRestockLocationFilter] = useState('ALL')

  // ─── Quick Add Restock Form State ───
  const [newRestockProductId, setNewRestockProductId] = useState('')
  const [newRestockQty, setNewRestockQty] = useState('10')
  const [newRestockDestId, setNewRestockDestId] = useState('')
  const [newRestockDestType, setNewRestockDestType] = useState('store')
  const [newRestockCost, setNewRestockCost] = useState('')
  const [newRestockSelling, setNewRestockSelling] = useState('')
  const [newRestockSupplier, setNewRestockSupplier] = useState('')
  const [newRestockPayment, setNewRestockPayment] = useState('Cash')
  const [newRestockNotes, setNewRestockNotes] = useState('')
  const [newRestockDate, setNewRestockDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSavingRestock, setIsSavingRestock] = useState(false)

  // ─── Real-Time Expense Form State ───
  const [newExpenseCat, setNewExpenseCat] = useState('Inventory restock')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseNote, setNewExpenseNote] = useState('')
  const [newExpenseDate, setNewExpenseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSavingExpense, setIsSavingExpense] = useState(false)

  const currentDateLong = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }, [])

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ─── Real Inventory & Stock Calculations ───
  const {
    totalStockUnits,
    totalInventoryValue,
    categories,
    categoryBreakdown,
    lowStockItems,
    itemsNeedingPrice,
    validPriceCount,
    validPricePct,
    healthyStockPct
  } = useMemo(() => {
    let units = 0
    let value = 0
    const catMap = {}
    const lowStock = []
    const missingPrice = []

    products.forEach((p) => {
      // Total store + warehouse stock
      let pStock = 0
      stores.forEach((s) => {
        pStock += Number(s.stock?.[p.id] || 0)
      })
      warehouses.forEach((w) => {
        pStock += Number(w.stock?.[p.id] || 0)
      })

      units += pStock

      // Strict purchase price (cost price) valuation
      const costPrice = Number(p.costPrice || 0)
      value += pStock * costPrice

      // Category count & distribution
      const cat = p.category || 'General'
      catMap[cat] = (catMap[cat] || 0) + (pStock > 0 ? pStock : 1)

      // Low stock check
      const minStock = Number(p.minStock || 5)
      if (pStock <= minStock) {
        lowStock.push({ ...p, stock: pStock })
      }

      // Valid purchase price check (must be >= 1.00)
      if (costPrice < 1) {
        missingPrice.push({ ...p, currentCost: costPrice, stock: pStock })
      }
    })

    const totalCats = Object.keys(catMap)
    const validCount = products.length - missingPrice.length
    const validPct = products.length > 0 ? Math.round((validCount / products.length) * 100) : 100
    const healthyPct = products.length > 0 ? Math.round(((products.length - lowStock.length) / products.length) * 100) : 100

    // Compute category percentages for Donut
    const totalCatUnits = Object.values(catMap).reduce((a, b) => a + b, 0) || 1
    const breakdown = totalCats.slice(0, 5).map((catName, idx) => {
      const u = catMap[catName]
      const pct = Math.round((u / totalCatUnits) * 100)
      const colors = ['#059669', '#10b981', '#0d9488', '#0284c7', '#d97706']
      return {
        name: catName,
        units: u,
        pct: pct,
        color: colors[idx % colors.length]
      }
    })

    return {
      totalStockUnits: units,
      totalInventoryValue: value,
      categories: totalCats,
      categoryBreakdown: breakdown,
      lowStockItems: lowStock,
      itemsNeedingPrice: missingPrice,
      validPriceCount: validCount,
      validPricePct: validPct,
      healthyStockPct: healthyPct
    }
  }, [products, stores, warehouses])

  const categoryConicGradient = useMemo(() => {
    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      return '#059669'
    }
    let acc = 0
    const parts = []
    categoryBreakdown.forEach((c) => {
      const next = Math.min(100, acc + c.pct)
      parts.push(`${c.color} ${acc}% ${next}%`)
      acc = next
    })
    if (acc < 100 && parts.length > 0) {
      parts.push(`${categoryBreakdown[categoryBreakdown.length - 1].color} ${acc}% 100%`)
    }
    return `conic-gradient(from -90deg, ${parts.join(', ')})`
  }, [categoryBreakdown])

  // Product cost map for instant COGS lookup
  const productCostMap = useMemo(() => {
    const map = new Map()
    products.forEach((p) => {
      if (p.id) map.set(p.id, Number(p.costPrice || 0))
      if (p._id) map.set(p._id, Number(p.costPrice || 0))
    })
    return map
  }, [products])

  // Helper to convert date to YYYY-MM-DD in local timezone
  const getLocalDateString = (dateInput) => {
    if (!dateInput) return ''
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // ─── Real Sales Data & Day-By-Day Calculations ───
  const {
    todaySalesTotal,
    todaySalesCount,
    todayGrossProfit,
    monthSalesTotal,
    monthSalesCount,
    monthGrossProfit,
    lastMonthSalesTotal,
    lastMonthGrossProfit,
    prevMonthName,
    weeklyBarsData
  } = useMemo(() => {
    const today = new Date()
    const todayStr = getLocalDateString(today)
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const prevMonth = prevMonthDate.getMonth()
    const prevYear = prevMonthDate.getFullYear()
    const prevMonthLabel = prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    let todayTotal = 0
    let todayCount = 0
    let todayCost = 0

    let monthTotal = 0
    let monthCount = 0
    let monthCost = 0

    let lastMonthTotal = 0
    let lastMonthCost = 0

    // Setup 7-day tracking (ending today)
    const daysArr = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      daysArr.push({
        date: d,
        dayStr: getLocalDateString(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: 0
      })
    }

    sales.forEach((s) => {
      const saleDate = new Date(s.createdAt || s.timestamp || Date.now())
      const saleDateStr = getLocalDateString(saleDate)
      const saleAmount = Number(s.totalAmount ?? s.total ?? 0)

      // Calculate cost of items in this sale
      let saleCost = 0
      if (Array.isArray(s.items)) {
        s.items.forEach((it) => {
          const qty = Number(it.quantity) || 1
          const unitPrice = Number(it.price || it.sellingPrice || (saleAmount / qty))
          const knownCost = productCostMap.get(it.productId)
          const unitCost = knownCost && knownCost > 0 ? knownCost : Number(it.costPrice || 0) > 0 ? Number(it.costPrice) : unitPrice * 0.7
          saleCost += unitCost * qty
        })
      } else {
        saleCost = saleAmount * 0.7
      }

      // Today
      if (saleDateStr === todayStr) {
        todayTotal += saleAmount
        todayCost += saleCost
        todayCount += 1
      }

      // This Month
      if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
        monthTotal += saleAmount
        monthCost += saleCost
        monthCount += 1
      }

      // Previous Month
      if (saleDate.getMonth() === prevMonth && saleDate.getFullYear() === prevYear) {
        lastMonthTotal += saleAmount
        lastMonthCost += saleCost
      }

      // 7 Days
      const matchDay = daysArr.find((day) => day.dayStr === saleDateStr)
      if (matchDay) {
        matchDay.total += saleAmount
      }
    })

    const finalTodayGross = Math.max(0, todayTotal - todayCost)
    const finalMonthGross = Math.max(0, monthTotal - monthCost)
    const finalLastMonthGross = Math.max(0, lastMonthTotal - lastMonthCost)

    // Accurate 7-day bar chart
    const maxBarVal = Math.max(...daysArr.map((d) => d.total), 1)
    const bars = daysArr.map((d, idx) => {
      const heightPct = d.total > 0 ? Math.min(100, Math.max(12, Math.round((d.total / maxBarVal) * 100))) : 6
      return {
        label: d.label,
        value: d.total,
        heightPct: heightPct,
        isToday: idx === 6
      }
    })

    return {
      todaySalesTotal: todayTotal,
      todaySalesCount: todayCount,
      todayGrossProfit: finalTodayGross,
      monthSalesTotal: monthTotal,
      monthSalesCount: monthCount,
      monthGrossProfit: finalMonthGross,
      lastMonthSalesTotal: lastMonthTotal,
      lastMonthGrossProfit: finalLastMonthGross,
      prevMonthName: prevMonthLabel,
      weeklyBarsData: bars
    }
  }, [sales, productCostMap])

  // ─── Modal B: Selected Sales Transactions List (Real Store Sales) ───
  const activeModalSalesList = useMemo(() => {
    const now = new Date()
    const todayStr = getLocalDateString(now)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    if (salesRange === 'daily') {
      const todaySales = sales.filter((s) => {
        const d = new Date(s.createdAt || s.timestamp || Date.now())
        return getLocalDateString(d) === todayStr
      })

      if (todaySales.length > 0) {
        return {
          title: "Today's sales detail",
          subtitle: `${currentDateLong} · ${todaySales.length} transaction${todaySales.length === 1 ? '' : 's'} recorded`,
          list: todaySales,
          isFallback: false
        }
      }

      // If 0 sales today, show recent transactions from store history
      if (sales.length > 0) {
        const recent = [...sales]
          .sort((a, b) => {
            const tA = new Date(a.createdAt || a.timestamp || 0).getTime()
            const tB = new Date(b.createdAt || b.timestamp || 0).getTime()
            return tB - tA
          })
          .slice(0, 30)

        return {
          title: "Recent store sales detail",
          subtitle: `No sales recorded today yet · Showing ${recent.length} recent transaction${recent.length === 1 ? '' : 's'} from store history`,
          list: recent,
          isFallback: true
        }
      }

      return {
        title: "Today's sales detail",
        subtitle: `${currentDateLong} · 0 transactions recorded`,
        list: [],
        isFallback: false
      }
    }

    if (salesRange === 'monthly') {
      const monthSales = sales.filter((s) => {
        const d = new Date(s.createdAt || s.timestamp || Date.now())
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth
      })
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      return {
        title: `${monthName} sales detail`,
        subtitle: `${monthSales.length} transaction${monthSales.length === 1 ? '' : 's'} recorded in ${monthName}`,
        list: monthSales,
        isFallback: false
      }
    }

    // Custom
    const sDate = new Date(customStartDate)
    const eDate = new Date(customEndDate)
    eDate.setHours(23, 59, 59, 999)
    const customSales = sales.filter((s) => {
      const d = new Date(s.createdAt || s.timestamp || Date.now())
      return d >= sDate && d <= eDate
    })
    return {
      title: "Custom range sales detail",
      subtitle: `${customSalesLabel || 'Custom period'} · ${customSales.length} transaction${customSales.length === 1 ? '' : 's'} recorded`,
      list: customSales,
      isFallback: false
    }
  }, [sales, salesRange, customStartDate, customEndDate, customSalesLabel, currentDateLong])

  // ─── Current Selected Sales Values ───
  const currentSalesDisplay = useMemo(() => {
    if (salesRange === 'daily') {
      return {
        value: formatCurrency(todaySalesTotal),
        sub: `${todaySalesCount.toLocaleString()} transactions · Today`
      }
    }
    if (salesRange === 'monthly') {
      const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })
      return {
        value: formatCurrency(monthSalesTotal),
        sub: `${monthSalesCount.toLocaleString()} transactions · ${monthName}`
      }
    }
    const sDate = new Date(customStartDate)
    const eDate = new Date(customEndDate)
    eDate.setHours(23, 59, 59, 999)
    const customSales = sales.filter((s) => {
      const d = new Date(s.createdAt || s.timestamp || Date.now())
      return d >= sDate && d <= eDate
    })
    const total = customSales.reduce((sum, s) => sum + Number(s.totalAmount ?? s.total ?? 0), 0)
    return {
      value: formatCurrency(total),
      sub: `${customSales.length.toLocaleString()} transactions · ${customSalesLabel || 'Custom period'}`
    }
  }, [salesRange, todaySalesTotal, todaySalesCount, monthSalesTotal, monthSalesCount, sales, customStartDate, customEndDate, customSalesLabel])

  // ─── Real-Time Restocked Items Calculations ───
  const allRestockedItems = useMemo(() => {
    const itemsList = []
    restocks.forEach((r) => {
      const dateStr = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '')
      const createdAt = r.createdAt || r.date || ''
      const destName = r.destinationName || 'Store'
      const destType = r.destinationType || 'store'
      const destId = r.destinationId || ''
      const supplier = r.supplierName || ''
      const paymentMethod = r.paymentMethod || 'Cash'
      const notes = r.notes || ''
      const recordedBy = r.recordedBy || 'Store Owner'
      const restockId = String(r.id || r._id || '');
      const items = Array.isArray(r.items) ? r.items : []
      items.forEach((it, idx) => {
        const qty = Number(it.quantity) || 1
        const cost = Number(it.costPerUnit) || 0
        const selling = Number(it.sellingPrice) || 0
        const totalVal = cost > 0 ? cost * qty : 0

        const prod = products.find((p) => p.id === it.productId || p._id === it.productId)
        const pName = it.productName || prod?.name || 'Stock Item'
        const pCode = it.productCode || prod?.code || ''
        const pCat = it.category || prod?.category || 'General'
        const pUnit = it.unit || prod?.unit || 'Piece'

        itemsList.push({
          uniqueKey: `${restockId}_${it.productId || 'p'}_${idx}`,
          restockId,
          _id: r._id,
          productId: it.productId,
          productName: pName,
          productCode: pCode,
          category: pCat,
          unit: pUnit,
          quantity: qty,
          costPerUnit: cost,
          sellingPrice: selling,
          totalValuation: totalVal,
          destinationName: destName,
          destinationType: destType,
          destinationId: destId,
          supplierName: supplier,
          paymentMethod,
          notes,
          recordedBy,
          date: dateStr,
          createdAt,
          source: r.source || 'restock',
        })
      })
    })

    return itemsList.sort((a, b) => {
      const tA = new Date(a.createdAt || a.date || 0).getTime()
      const tB = new Date(b.createdAt || b.date || 0).getTime()
      return tB - tA
    })
  }, [restocks, products])

  // ─── Today's Restocked Summary for KPI Card ───
  const { todayRestockedUnits, todayRestockedDistinct, todayRestockedItems } = useMemo(() => {
    const todayStr = getLocalDateString(new Date())
    const todayItems = allRestockedItems.filter((item) => {
      const itemDateStr = item.date || getLocalDateString(new Date(item.createdAt))
      return itemDateStr === todayStr
    })
    const units = todayItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)
    const distinct = new Set(todayItems.map((it) => it.productId || it.productName)).size
    return {
      todayRestockedUnits: units,
      todayRestockedDistinct: distinct,
      todayRestockedItems: todayItems,
    }
  }, [allRestockedItems])

  // Filtered restocked items based on active range (Daily, Weekly, Custom)
  const filteredRestockedItems = useMemo(() => {
    const now = new Date()
    const todayStr = getLocalDateString(now)

    return allRestockedItems.filter((item) => {
      const itemDate = new Date(item.date || item.createdAt)
      const itemDateStr = item.date || getLocalDateString(itemDate)

      if (restockRange === 'daily') {
        return itemDateStr === todayStr
      }

      if (restockRange === 'weekly') {
        const diffMs = now.getTime() - itemDate.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        return diffDays >= -0.2 && diffDays <= 7.2
      }

      // custom
      const sDate = new Date(customRestockStartDate)
      sDate.setHours(0, 0, 0, 0)
      const eDate = new Date(customRestockEndDate)
      eDate.setHours(23, 59, 59, 999)
      return itemDate >= sDate && itemDate <= eDate
    })
  }, [allRestockedItems, restockRange, customRestockStartDate, customRestockEndDate])

  // Filtered list for restock modal (applies search & destination filters)
  const modalDisplayRestockItems = useMemo(() => {
    let list = filteredRestockedItems

    if (restockLocationFilter !== 'ALL') {
      list = list.filter(
        (it) => it.destinationId === restockLocationFilter || it.destinationName === restockLocationFilter
      )
    }

    if (restockSearchQuery.trim()) {
      const q = restockSearchQuery.toLowerCase().trim()
      list = list.filter(
        (it) =>
          it.productName.toLowerCase().includes(q) ||
          it.productCode.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.destinationName.toLowerCase().includes(q) ||
          (it.supplierName && it.supplierName.toLowerCase().includes(q))
      )
    }

    return list
  }, [filteredRestockedItems, restockLocationFilter, restockSearchQuery])

  // Current display stats for the Dashboard restocked section
  const currentRestockDisplay = useMemo(() => {
    const totalUnits = filteredRestockedItems.reduce((acc, it) => acc + it.quantity, 0)
    const distinctProducts = new Set(filteredRestockedItems.map((it) => it.productId || it.productName)).size
    const totalValuation = filteredRestockedItems.reduce((acc, it) => acc + it.totalValuation, 0)

    let rangeTitle = 'Restocked today'
    let rangeSubtitle = `${currentDateLong} · ${distinctProducts} distinct item${distinctProducts === 1 ? '' : 's'} stocked in`

    if (restockRange === 'weekly') {
      rangeTitle = 'Restocked this week'
      rangeSubtitle = `Last 7 days · ${distinctProducts} distinct item${distinctProducts === 1 ? '' : 's'} stocked in`
    } else if (restockRange === 'custom') {
      rangeTitle = 'Restocked items'
      rangeSubtitle = `${customRestockLabel || 'Custom period'} · ${distinctProducts} distinct item${distinctProducts === 1 ? '' : 's'} stocked in`
    }

    const isFallback = restockRange === 'daily' && filteredRestockedItems.length === 0

    return {
      title: rangeTitle,
      subtitle: rangeSubtitle,
      totalUnits,
      distinctProducts,
      totalValuation,
      items: isFallback ? allRestockedItems.slice(0, 6) : filteredRestockedItems.slice(0, 6),
      totalCount: filteredRestockedItems.length,
      isFallback,
    }
  }, [filteredRestockedItems, restockRange, currentDateLong, customRestockLabel, allRestockedItems])

  // ─── Real-Time Operational Expenses (Convex + Commission Settlements) ───
  const allOperationalExpenses = useMemo(() => {
    const list = []

    // 1. Real-time expenses logged to Convex expenses table
    expenses.forEach((e) => {
      const d = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '')
      list.push({
        id: e._id || e.id,
        _id: e._id,
        category: e.category || 'Other',
        amount: Number(e.amount) || 0,
        note: e.note || '',
        date: d,
        recordedBy: e.recordedBy || 'Store Owner',
        createdAt: e.createdAt || d,
        isSettlement: false
      })
    })

    // 2. Real-time staff commission settlement payouts from Convex
    commissionSettlements.forEach((cs) => {
      const d = cs.createdAt ? cs.createdAt.split('T')[0] : ''
      list.push({
        id: cs._id || cs.id || `cset_${cs.createdAt}`,
        _id: cs._id,
        category: 'Staff commissions',
        amount: Number(cs.amount) || 0,
        note: `Commission payout to ${cs.staffName || 'Staff'} (${cs.salesCount || 0} sales settled)`,
        date: d,
        recordedBy: cs.settledByUserName || 'Owner',
        createdAt: cs.createdAt || d,
        isSettlement: true
      })
    })

    return list.sort((a, b) => {
      const tA = new Date(a.date || a.createdAt || 0).getTime()
      const tB = new Date(b.date || b.createdAt || 0).getTime()
      return tB - tA
    })
  }, [expenses, commissionSettlements])

  // Active period label for expenses
  const expensesPeriodLabel = useMemo(() => {
    if (profitRange === 'lastMonth') {
      return prevMonthName
    }
    if (profitRange === 'custom') {
      return customProfitLabel || 'Custom period'
    }
    return currentMonthYear
  }, [profitRange, prevMonthName, customProfitLabel, currentMonthYear])

  // Filter expenses matching the active financial view
  const filteredExpenses = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const prevYear = prevMonthDate.getFullYear()
    const prevMonth = prevMonthDate.getMonth()

    if (profitRange === 'lastMonth') {
      return allOperationalExpenses.filter((e) => {
        const d = new Date(e.date || e.createdAt)
        return !isNaN(d.getTime()) && d.getFullYear() === prevYear && d.getMonth() === prevMonth
      })
    }

    if (profitRange === 'custom') {
      const sDate = new Date(customStartDate)
      const eDate = new Date(customEndDate)
      eDate.setHours(23, 59, 59, 999)
      return allOperationalExpenses.filter((e) => {
        const d = new Date(e.date || e.createdAt)
        return !isNaN(d.getTime()) && d >= sDate && d <= eDate
      })
    }

    // Default (gross / thisMonth): running current month
    return allOperationalExpenses.filter((e) => {
      const d = new Date(e.date || e.createdAt)
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })
  }, [allOperationalExpenses, profitRange, customStartDate, customEndDate])

  // ─── Real-Time Expense Breakdown & Conic Gradient ───
  const { totalExpenses, expenseCategoriesBreakdown, conicGradientStyle } = useMemo(() => {
    const total = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const catTotals = {}
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other'
      catTotals[cat] = (catTotals[cat] || 0) + (Number(e.amount) || 0)
    })

    const categoryMap = {
      'Inventory restock': { color: '#059669', class: 'green' },
      'Utilities': { color: '#10b981', class: 'green' },
      'Staff': { color: '#d97706', class: 'amber' },
      'Staff commissions': { color: '#f59e0b', class: 'amber' },
      'Packaging': { color: '#0d9488', class: 'violet' },
      'Rent': { color: '#0284c7', class: 'cyan' },
      'Logistics & Transport': { color: '#6366f1', class: 'pink' },
      'Maintenance': { color: '#64748b', class: 'slate' },
      'Other': { color: '#94a3b8', class: 'slate' }
    }

    const defaultColorPalette = ['#059669', '#10b981', '#0d9488', '#0284c7', '#d97706', '#64748b']

    let currentPct = 0
    const gradientParts = []
    const breakdown = Object.entries(catTotals).map(([cat, amt], idx) => {
      const pct = total > 0 ? (amt / total) * 100 : 0
      const cfg = categoryMap[cat] || {
        color: defaultColorPalette[idx % defaultColorPalette.length],
        class: 'blue'
      }
      gradientParts.push(`${cfg.color} ${currentPct.toFixed(2)}% ${(currentPct + pct).toFixed(2)}%`)
      currentPct += pct
      return {
        name: cat,
        amount: amt,
        pct: Math.round(pct),
        colorClass: cfg.class,
        colorHex: cfg.color
      }
    })

    const gradient = total > 0 && gradientParts.length > 0
      ? `conic-gradient(from -90deg, ${gradientParts.join(', ')})`
      : 'conic-gradient(from -90deg, #e2e8f0 0% 100%)'

    return {
      totalExpenses: total,
      expenseCategoriesBreakdown: breakdown,
      conicGradientStyle: gradient
    }
  }, [filteredExpenses])

  // ─── Profit Display (Coming Soon · 0 Data) ───
  const currentProfitDisplay = useMemo(() => {
    return {
      title: 'Net Profit',
      value: '0.00 ETB',
      sub: 'Automated profit analytics & margin calculation coming soon',
      pct: 0
    }
  }, [])

  // ─── Save Purchase Price Handler ───
  const handleSavePurchasePrice = async (e) => {
    e.preventDefault()
    if (!selectedProductForPrice) return
    const priceNum = parseFloat(newPurchasePriceInput)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.warning('Invalid Price', 'Please enter a valid purchase price.')
      return
    }

    try {
      setIsSavingPrice(true)
      await updateProduct(
        selectedProductForPrice.id,
        { costPrice: priceNum },
        currentUser
      )
      toast.success(
        'Purchase Price Updated',
        `Set cost price of "${selectedProductForPrice.name}" to ${formatCurrency(priceNum)}.`
      )
      setActiveModal(null)
      setSelectedProductForPrice(null)
      setNewPurchasePriceInput('')
    } catch (err) {
      console.error(err)
      toast.error('Update Failed', 'Failed to save purchase price. Please try again.')
    } finally {
      setIsSavingPrice(false)
    }
  }

  // ─── Real-Time Add Expense Handler (Convex Mutation) ───
  const handleAddExpense = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(newExpenseAmount)
    if (!newExpenseAmount || isNaN(amountNum) || amountNum <= 0) {
      toast.warning('Invalid Amount', 'Please provide a valid expense amount greater than 0.')
      return
    }

    try {
      setIsSavingExpense(true)
      await addExpense({
        category: newExpenseCat,
        amount: amountNum,
        note: newExpenseNote.trim(),
        date: newExpenseDate || new Date().toISOString().split('T')[0]
      })
      toast.success('Expense Recorded', `${formatCurrency(amountNum)} added to ${newExpenseCat} in real time.`)
      setActiveModal(null)
      setNewExpenseAmount('')
      setNewExpenseNote('')
    } catch (err) {
      console.error(err)
      toast.error('Record Failed', err.message || 'Failed to record expense. Please try again.')
    } finally {
      setIsSavingExpense(false)
    }
  }

  // ─── Real-Time Delete Expense Handler (Convex Mutation) ───
  const handleDeleteExpense = async (exp) => {
    if (exp.isSettlement) {
      toast.info('Staff Settlement', 'Staff commission payouts are settled and managed from the Staff page.')
      return
    }
    if (!window.confirm(`Delete expense "${exp.category}: ${formatCurrency(exp.amount)}"?`)) return
    try {
      await deleteExpense(exp._id || exp.id)
      toast.success('Expense Deleted', 'Expense removed successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Delete Failed', err.message || 'Could not delete expense.')
    }
  }

  // ─── Real-Time Record Restock Handler (Convex Mutation) ───
  const handleRecordRestockSubmit = async (e) => {
    e.preventDefault()
    if (!newRestockProductId) {
      toast.warning('Product Required', 'Please select a product to restock.')
      return
    }
    const qty = parseFloat(newRestockQty)
    if (!qty || qty <= 0) {
      toast.warning('Invalid Quantity', 'Please enter a quantity greater than 0.')
      return
    }

    const prod = products.find((p) => p.id === newRestockProductId || p._id === newRestockProductId)
    if (!prod) {
      toast.error('Product Error', 'Selected product was not found.')
      return
    }

    const destType = newRestockDestType
    const effectiveDestId = newRestockDestId || (destType === 'warehouse' ? warehouses[0]?.id : stores[0]?.id)
    const destObj = destType === 'warehouse'
      ? warehouses.find((w) => w.id === effectiveDestId)
      : stores.find((s) => s.id === effectiveDestId)
    const effectiveDestName = destObj?.name || (destType === 'warehouse' ? 'Warehouse' : 'Store')

    setIsSavingRestock(true)
    try {
      await recordRestock({
        destinationType: destType,
        destinationId: effectiveDestId,
        destinationName: effectiveDestName,
        items: [
          {
            productId: prod.id || prod._id,
            productName: prod.name,
            productCode: prod.code || undefined,
            category: prod.category || 'General',
            quantity: qty,
            costPerUnit: newRestockCost !== '' ? parseFloat(newRestockCost) : (prod.costPrice || 0),
            sellingPrice: newRestockSelling !== '' ? parseFloat(newRestockSelling) : (prod.sellingPrice || 0),
            unit: prod.unit || 'Piece',
          },
        ],
        paymentMethod: newRestockPayment,
        supplierName: newRestockSupplier.trim() || undefined,
        notes: newRestockNotes.trim() || undefined,
        date: newRestockDate || new Date().toISOString().split('T')[0],
      })

      toast.success(
        'Stock Intake Recorded',
        `Successfully stocked in +${qty} ${prod.unit || 'units'} of "${prod.name}" to ${effectiveDestName}.`
      )
      setActiveModal(null)
      setNewRestockProductId('')
      setNewRestockQty('10')
      setNewRestockCost('')
      setNewRestockSelling('')
      setNewRestockSupplier('')
      setNewRestockNotes('')
    } catch (err) {
      console.error('Failed to record restock:', err)
      toast.error('Record Failed', err.message || 'Could not record restock.')
    } finally {
      setIsSavingRestock(false)
    }
  }

  // ─── Real-Time Delete Restock Handler (Convex Mutation) ───
  const handleDeleteRestock = async (restockId) => {
    if (!window.confirm('Are you sure you want to delete this restock record?')) return
    try {
      await deleteRestock(restockId)
      toast.success('Record Deleted', 'Restock record removed successfully.')
    } catch (err) {
      console.error('Delete restock failed:', err)
      toast.error('Delete Failed', err.message || 'Could not delete restock record.')
    }
  }

  // ─── Apply Custom Date Range Handler ───
  const handleApplyDateRange = () => {
    const s = new Date(customStartDate)
    const e = new Date(customEndDate)
    if (!customStartDate || !customEndDate || isNaN(s) || isNaN(e) || e < s) {
      toast.warning('Invalid Date Range', 'End date must be on or after start date.')
      return
    }

    const fmtShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const label = `${fmtShort(s)} – ${fmtShort(e)}`

    if (dateTarget === 'sales') {
      setSalesRange('custom')
      setCustomSalesLabel(label)
      toast.info('Sales Filter Applied', `Showing sales for ${label}.`)
    } else if (dateTarget === 'profit') {
      setProfitRange('custom')
      setCustomProfitLabel(label)
      toast.info('Profit Filter Applied', `Showing profit calculation for ${label}.`)
    } else if (dateTarget === 'restock') {
      setRestockRange('custom')
      setCustomRestockStartDate(customStartDate)
      setCustomRestockEndDate(customEndDate)
      setCustomRestockLabel(label)
      toast.info('Restock Filter Applied', `Showing restocked items for ${label}.`)
      setActiveModal('restockList')
      return
    }
    setActiveModal(null)
  }

  return (
    <div className="dashboard-page">

      {/* ================= KPI ROW ================= */}
      <section className="kpi-row">

        {/* 1. Inventory value */}
        <article className="card kpi">
          <div className="kpi-head">
            <span className="kpi-label">Total inventory value</span>
            <span className="icon-badge green">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="kpi-value">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="kpi-sub">
            <span className="trend up">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
            <span>real-time valuation</span>
          </div>
          <svg className="sparkline" viewBox="0 0 260 64" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,46 L26,40 L52,44 L78,31 L104,35 L130,23 L156,27 L182,16 L208,21 L234,10 L260,7 L260,64 L0,64 Z"
              fill="url(#sparkFill)"
            />
            <path
              d="M0,46 L26,40 L52,44 L78,31 L104,35 L130,23 L156,27 L182,16 L208,21 L234,10 L260,7"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="kpi-foot">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {products.length.toLocaleString()} items &bull; {categories.length} categories
            </span>
          </div>
        </article>

        {/* 2. Total stock (Clickable -> Opens Modal A) */}
        <article
          className="card kpi kpi-clickable"
          role="button"
          tabIndex={0}
          onClick={() => setActiveModal('stock')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setActiveModal('stock')
            }
          }}
          aria-label="Open stock details"
        >
          <div className="kpi-head">
            <span className="kpi-label">Total stock</span>
            <span className="icon-badge green">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="kpi-body">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kpi-value">
                {totalStockUnits.toLocaleString()} <span className="unit">units</span>
              </div>
              <div className="kpi-sub" style={{ marginTop: '8px' }}>
                <span className="badge warn">
                  <TrendingDown className="w-3 h-3" /> {lowStockItems.length} low stock
                </span>
              </div>
            </div>
            <div className="ring-wrap r100">
              <svg viewBox="0 0 100 100">
                <circle className="ring-track" cx="50" cy="50" r="40" />
                <circle
                  className="ring-progress green"
                  cx="50"
                  cy="50"
                  r="40"
                  style={{
                    strokeDasharray: 251.32,
                    strokeDashoffset: 251.32 * (1 - healthyStockPct / 100)
                  }}
                />
              </svg>
              <div className="ring-center">
                <strong>{healthyStockPct}%</strong>
                <span>healthy</span>
              </div>
            </div>
          </div>
          <div className="kpi-foot">
            <span>Open stock details</span>
            <ArrowRight className="w-3 h-3 text-emerald-700" />
          </div>
        </article>

        {/* 3. Restocked today (Clickable -> Opens Modal G) */}
        <article
          className="card kpi kpi-clickable"
          role="button"
          tabIndex={0}
          onClick={() => {
            setRestockRange('daily')
            setActiveModal('restockList')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setRestockRange('daily')
              setActiveModal('restockList')
            }
          }}
          aria-label="Open restocked items"
        >
          <div className="kpi-head">
            <span className="kpi-label">Restocked today</span>
            <span className="icon-badge green">
              <ArrowDownToLine className="w-4 h-4" />
            </span>
          </div>
          <div className="kpi-body">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kpi-value text-emerald-700">
                {todayRestockedUnits > 0 ? `+${todayRestockedUnits.toLocaleString()}` : '0'}{' '}
                <span className="unit">units</span>
              </div>
              <div className="kpi-sub" style={{ marginTop: '8px' }}>
                {todayRestockedDistinct > 0 ? (
                  <span className="trend up">
                    <TrendingUp className="w-3 h-3" /> {todayRestockedDistinct} product{todayRestockedDistinct === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">0 items received today</span>
                )}
              </div>
            </div>
          </div>
          <div className="kpi-foot">
            <span>
              {todayRestockedItems.length > 0
                ? `${todayRestockedItems.length} intake${todayRestockedItems.length === 1 ? '' : 's'} recorded`
                : 'Open restock details'}
            </span>
            <ArrowRight className="w-3 h-3 text-emerald-700" />
          </div>
        </article>

        {/* 4. Required purchase price */}
        <article className="card kpi">
          <div className="kpi-head">
            <span className="kpi-label">
              Required purchase price <em className="asterisk">*</em>
            </span>
            <span className="icon-badge amber">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="kpi-body">
            <div className="ring-wrap r80">
              <svg viewBox="0 0 100 100">
                <circle className="ring-track" cx="50" cy="50" r="40" />
                <circle
                  className="ring-progress amber"
                  cx="50"
                  cy="50"
                  r="40"
                  style={{
                    strokeDasharray: 251.32,
                    strokeDashoffset: 251.32 * (1 - validPricePct / 100)
                  }}
                />
              </svg>
              <div className="ring-center">
                <strong>{validPricePct}%</strong>
                <span>valid</span>
              </div>
            </div>
            <div className="mini-list">
              {itemsNeedingPrice.length === 0 ? (
                <div className="py-2 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>All items have valid cost prices</span>
                </div>
              ) : (
                itemsNeedingPrice.slice(0, 3).map((p, idx) => (
                  <div key={p.id || idx} className="mini-row">
                    <span className="mini-name">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className={`mini-price ${!p.costPrice || p.costPrice < 1 ? 'miss' : ''}`}>
                      {p.costPrice && p.costPrice >= 1 ? formatCurrency(p.costPrice) : '—'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductForPrice(p)
                        setNewPurchasePriceInput(p.costPrice ? String(p.costPrice) : '')
                        setActiveModal('setPrice')
                      }}
                      className="pill-btn js-set-price"
                    >
                      Set price
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="kpi-foot">
            <span>
              {validPriceCount} of {products.length} items have a valid purchase price
            </span>
          </div>
        </article>

      </section>

      {/* ================= MAIN GRID ================= */}
      <section className="main-grid">

        {/* ---- Daily sales (Clickable -> Opens Modal B) ---- */}
        <article
          className="card sales-card"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            if (e.target.closest('#salesFilters')) return
            setActiveModal('sales')
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('#salesFilters')) {
              e.preventDefault()
              setActiveModal('sales')
            }
          }}
          aria-label="Open today's sales detail"
        >
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>Daily sales</h2>
              <p className="sub">Last 7 days performance</p>
            </div>
            <div className="pills" id="salesFilters" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={`pill ${salesRange === 'daily' ? 'active' : ''}`}
                onClick={() => setSalesRange('daily')}
              >
                Daily
              </button>
              <button
                type="button"
                className={`pill ${salesRange === 'monthly' ? 'active' : ''}`}
                onClick={() => setSalesRange('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`pill ${salesRange === 'custom' ? 'active' : ''}`}
                onClick={() => {
                  setDateTarget('sales')
                  setActiveModal('date')
                }}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="sales-body">
            <div>
              <div className="big-value">{currentSalesDisplay.value}</div>
              <div className="muted" style={{ fontSize: '12.5px', fontWeight: 500, marginTop: '4px' }}>
                {currentSalesDisplay.sub}
              </div>
            </div>
            <span className="open-hint">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View detail</span>
            </span>
          </div>

          <div className="bars" id="salesBars">
            {weeklyBarsData.map((bar, idx) => (
              <div key={idx} className="bar-col">
                <div className="bar-track">
                  <div
                    className={`bar ${bar.isToday ? 'hi' : ''}`}
                    style={{ height: `${bar.heightPct}%` }}
                    data-val={formatCurrency(bar.value)}
                  />
                </div>
                <span className="bar-lbl">{bar.label}</span>
              </div>
            ))}
          </div>
        </article>

        {/* ---- Expenses & profit ---- */}
        <article className="card exp-card">
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>Expenses &amp; profit</h2>
              <p className="sub">{expensesPeriodLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              {filteredExpenses.length > 0 && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setActiveModal('expenseList')}
                  title="View full expense records"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View list</span>
                </button>
              )}
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setNewExpenseDate(new Date().toISOString().split('T')[0])
                  setActiveModal('expense')
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add expense</span>
              </button>
            </div>
          </div>

          <div className="exp-top">
            <div
              className="donut-wrap cursor-pointer"
              onClick={() => setActiveModal('expenseList')}
              title="Click to view all expenses"
            >
              <div className="donut" style={{ background: conicGradientStyle }}>
                <div className="donut-hole">
                  <strong>{formatCurrency(totalExpenses)}</strong>
                  <span>expenses</span>
                </div>
              </div>
            </div>
            {expenseCategoriesBreakdown.length === 0 ? (
              <div className="flex-1 py-2 text-slate-400 space-y-1">
                <p className="text-xs font-semibold text-slate-600">No expenses recorded for {expensesPeriodLabel}</p>
                <p className="text-[11.5px] text-slate-400">
                  Click <b>+ Add expense</b> to record store rent, utilities, restocking, or packaging overhead in real time.
                </p>
              </div>
            ) : (
              <ul
                className="legend cursor-pointer"
                onClick={() => setActiveModal('expenseList')}
                title="Click to view all records"
              >
                {expenseCategoriesBreakdown.map((item, idx) => (
                  <li key={idx}>
                    <span className={`dot ${item.colorClass}`} />
                    <span className="lg-name">{item.name}</span>
                    <span className="lg-val">{formatCurrency(item.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="profit-box">
            <div className="ring-wrap r104">
              <svg viewBox="0 0 100 100">
                <circle className="ring-track" cx="50" cy="50" r="40" />
                <circle
                  className="ring-progress green"
                  cx="50"
                  cy="50"
                  r="40"
                  style={{
                    strokeDasharray: 251.32,
                    strokeDashoffset: 251.32
                  }}
                />
              </svg>
              <div className="ring-center">
                <strong>0%</strong>
                <span>margin</span>
              </div>
            </div>
            <div className="profit-info">
              <div className="profit-head">
                <div className="flex items-center gap-2">
                  <span className="lbl">Profit</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
              <div className="big-value">0.00 ETB</div>
              <div className="sub">Automated profit analytics &amp; margin calculation coming soon</div>
            </div>
          </div>
        </article>

      </section>

      {/* ================= REQUIRED PURCHASE PRICE SECTION ================= */}
      <section className="card required-section">
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <h2>
              Required purchase price <em className="asterisk">*</em>
            </h2>
            <p className="sub">Items missing a valid purchase price (must be &ge; 1.00 ETB)</p>
          </div>
          <span className="badge warn warn-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Action needed</span>
          </span>
        </div>

        <div className="req-body">
          <div className="ring-wrap r116">
            <svg viewBox="0 0 100 100">
              <circle className="ring-track" cx="50" cy="50" r="40" />
              <circle
                className="ring-progress amber"
                cx="50"
                cy="50"
                r="40"
                style={{
                  strokeDasharray: 251.32,
                  strokeDashoffset: 251.32 * (1 - validPricePct / 100)
                }}
              />
            </svg>
            <div className="ring-center">
              <strong>
                {validPriceCount}
                <span style={{ fontSize: '13px', color: '#8fa2bd' }}>/{products.length}</span>
              </strong>
              <span>set</span>
            </div>
          </div>

          <div className="req-cards">
            {itemsNeedingPrice.length === 0 ? (
              <div className="w-full py-8 text-center text-slate-500 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">All products have a valid cost/purchase price!</span>
                <span className="text-xs text-slate-500">Gross and net profit calculations are operating with 100% data coverage.</span>
              </div>
            ) : (
              itemsNeedingPrice.slice(0, 6).map((p, idx) => (
                <div key={p.id || idx} className="req-card">
                  <div className="req-icon">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="req-info">
                    <span className="req-name">{p.name}</span>
                    <span className="req-price">
                      Current:{' '}
                      {p.costPrice && p.costPrice >= 1 ? (
                        <b>{formatCurrency(p.costPrice)}</b>
                      ) : (
                        <b className="bad">missing</b>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductForPrice(p)
                      setNewPurchasePriceInput(p.costPrice ? String(p.costPrice) : '')
                      setActiveModal('setPrice')
                    }}
                    className="btn-solid js-set-price"
                  >
                    Set purchase price
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ================= MODAL A · STOCK DETAILS ================= */}
      {activeModal === 'stock' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal wide" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>Stock details</h3>
            <p className="modal-sub">{activeOrg?.name || tenantName || 'OMESTOCK'} &bull; snapshot as of today</p>

            <div className="stat-grid">
              <div className="stat-tile">
                <div className="st-lbl">Total units</div>
                <div className="st-val">{totalStockUnits.toLocaleString()}</div>
              </div>
              <div className="stat-tile warn">
                <div className="st-lbl">Low stock</div>
                <div className="st-val">{lowStockItems.length}</div>
              </div>
              <div className="stat-tile warn">
                <div className="st-lbl">Price &lt; 1.00</div>
                <div className="st-val">{itemsNeedingPrice.length}</div>
              </div>
              <div className="stat-tile ok">
                <div className="st-lbl">Categories</div>
                <div className="st-val">{categories.length}</div>
              </div>
            </div>

            <div className="split">
              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{
                    background: categoryConicGradient
                  }}
                >
                  <div className="donut-hole">
                    <strong>{totalStockUnits.toLocaleString()}</strong>
                    <span>units</span>
                  </div>
                </div>
              </div>
              <ul className="legend">
                {categoryBreakdown.map((c, idx) => (
                  <li key={idx}>
                    <span className="dot" style={{ background: c.color }} />
                    <span className="lg-name">{c.name}</span>
                    <span className="lg-val">{c.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-footer-line">
              <span>
                <b>{healthyStockPct}%</b> of stock is healthy
              </span>
              <span>{lowStockItems.length} items below reorder point</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL B · TODAY'S SALES DETAIL ================= */}
      {activeModal === 'sales' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal wide" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>{activeModalSalesList.title}</h3>
            <p className="modal-sub">{activeModalSalesList.subtitle}</p>

            {activeModalSalesList.isFallback && (
              <div className="mb-4 px-3.5 py-2.5 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <Store className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>No sales recorded today yet. Showing recent transactions from your store history.</span>
              </div>
            )}

            {activeModalSalesList.list.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No transactions recorded</p>
                <p className="text-xs text-slate-400">Transactions processed in the POS will appear here in real time.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Time / Date</th>
                      <th>Receipt &amp; Items</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Payment</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeModalSalesList.list.map((sale) => {
                      const saleDate = new Date(sale.createdAt || sale.timestamp || Date.now())
                      const timeStr = saleDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      const dateStr = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      const invoiceNum = sale.invoiceNumber || sale.receiptNumber || 'REC-SALE'
                      const items = Array.isArray(sale.items) ? sale.items : []
                      const totalQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0) || 1
                      const primaryItem = items[0]?.productName || items[0]?.name || 'Sale Item'
                      const otherCount = items.length - 1
                      const totalAmt = Number(sale.totalAmount ?? sale.total ?? 0)
                      const allItemsTooltip = items.map((it) => `${it.productName || it.name || 'Item'} (x${it.quantity || 1})`).join(', ')

                      return (
                        <tr key={sale.id || sale._id}>
                          <td>
                            <span className="tpill">{timeStr}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{dateStr}</span>
                          </td>
                          <td>
                            <div className="font-bold text-slate-900 truncate max-w-xs" title={allItemsTooltip}>
                              {primaryItem}
                              {otherCount > 0 && (
                                <span className="text-[11px] font-normal text-slate-500 ml-1.5 cursor-help" title={allItemsTooltip}>
                                  +{otherCount} more
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {invoiceNum} {sale.storeName ? `• ${sale.storeName}` : ''}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="qpill">{totalQty}</span>
                          </td>
                          <td>
                            <span className="text-xs font-semibold text-slate-700">
                              {sale.paymentMethod || 'Cash'}
                            </span>
                          </td>
                          <td className="num">
                            <b>{formatCurrency(totalAmt)}</b>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Grand total</td>
                      <td className="num">
                        {formatCurrency(
                          activeModalSalesList.list.reduce(
                            (acc, it) => acc + Number(it.totalAmount ?? it.total ?? 0),
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="modal-footer-line">
              <span>
                Showing <b>{activeModalSalesList.list.length}</b> transactions
              </span>
              <span>
                Grand total:{' '}
                <b>
                  {formatCurrency(
                    activeModalSalesList.list.reduce(
                      (acc, it) => acc + Number(it.totalAmount ?? it.total ?? 0),
                      0
                    )
                  )}
                </b>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL C · CUSTOM DATE RANGE ================= */}
      {activeModal === 'date' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>
              {dateTarget === 'sales'
                ? 'Custom sales range'
                : dateTarget === 'restock'
                ? 'Custom restock range'
                : 'Custom profit range'}
            </h3>
            <p className="modal-sub">Choose a start and end date to filter the figures.</p>

            {/* Quick date presets */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Presets:</span>
              <button
                type="button"
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setCustomStartDate(today)
                  setCustomEndDate(today)
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                onClick={() => {
                  const y = new Date()
                  y.setDate(y.getDate() - 1)
                  const yStr = y.toISOString().split('T')[0]
                  setCustomStartDate(yStr)
                  setCustomEndDate(yStr)
                }}
              >
                Yesterday
              </button>
              <button
                type="button"
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                onClick={() => {
                  const d = new Date()
                  const end = d.toISOString().split('T')[0]
                  d.setDate(d.getDate() - 6)
                  setCustomStartDate(d.toISOString().split('T')[0])
                  setCustomEndDate(end)
                }}
              >
                Past 7 Days
              </button>
              <button
                type="button"
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                onClick={() => {
                  const now = new Date()
                  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                  setCustomStartDate(start)
                  setCustomEndDate(now.toISOString().split('T')[0])
                }}
              >
                This Month
              </button>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="dashStartDate">Start date</label>
                <input
                  type="date"
                  id="dashStartDate"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="dashEndDate">End date</label>
                <input
                  type="date"
                  id="dashEndDate"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-solid"
                onClick={handleApplyDateRange}
              >
                <Check className="w-4 h-4" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL D · ADD EXPENSE ================= */}
      {activeModal === 'expense' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>Record store expense</h3>
            <p className="modal-sub">Add operational overhead synced in real time across all sessions.</p>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="field">
                <label>Category</label>
                <select
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(e.target.value)}
                >
                  <option value="Inventory restock">Inventory restock</option>
                  <option value="Utilities">Utilities &amp; electricity</option>
                  <option value="Staff">Staff stipend &amp; wages</option>
                  <option value="Packaging">Packaging &amp; supplies</option>
                  <option value="Rent">Store rent</option>
                  <option value="Logistics & Transport">Logistics &amp; transport</option>
                  <option value="Maintenance">Maintenance &amp; repairs</option>
                  <option value="Other">Other overhead</option>
                </select>
              </div>

              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={newExpenseDate}
                  onChange={(e) => setNewExpenseDate(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Amount (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 500.00"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label>Notes / Receipt details (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Electric bill for Store 1"
                  value={newExpenseNote}
                  onChange={(e) => setNewExpenseNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setActiveModal(null)}
                  disabled={isSavingExpense}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-solid" disabled={isSavingExpense}>
                  {isSavingExpense ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Expense</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL E · EXPENSES DETAIL LIST ================= */}
      {activeModal === 'expenseList' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal wide" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>{expensesPeriodLabel} store expenses</h3>
            <p className="modal-sub">
              {filteredExpenses.length} expense record{filteredExpenses.length === 1 ? '' : 's'} &bull; Total: {formatCurrency(totalExpenses)}
            </p>

            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Banknote className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No expenses recorded for {expensesPeriodLabel}</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Log operational costs like electricity, rent, logistics, or inventory restocking to calculate net operating profits.
                </p>
                <button
                  type="button"
                  className="btn-solid mx-auto inline-flex items-center gap-1.5"
                  onClick={() => {
                    setNewExpenseDate(new Date().toISOString().split('T')[0])
                    setActiveModal('expense')
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Expense</span>
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Notes / Description</th>
                      <th>Logged By</th>
                      <th className="num">Amount</th>
                      <th style={{ width: '44px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id || exp._id}>
                        <td>
                          <span className="tpill">{exp.date}</span>
                        </td>
                        <td>
                          <span className="font-bold text-slate-800">{exp.category}</span>
                          {exp.isSettlement && (
                            <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                              Staff Settlement
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="text-xs text-slate-600">{exp.note || '—'}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-500">{exp.recordedBy || 'Owner'}</span>
                        </td>
                        <td className="num">
                          <b>{formatCurrency(exp.amount)}</b>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {!exp.isSettlement ? (
                            <button
                              type="button"
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete this expense"
                              onClick={() => handleDeleteExpense(exp)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300" title="Commission payout (manage in Staff page)">&bull;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Total Expenses ({expensesPeriodLabel})</td>
                      <td className="num">{formatCurrency(totalExpenses)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="modal-footer-line">
              <span>
                Showing <b>{filteredExpenses.length}</b> records
              </span>
              <button
                type="button"
                className="btn-solid text-xs py-1.5 px-3"
                onClick={() => {
                  setNewExpenseDate(new Date().toISOString().split('T')[0])
                  setActiveModal('expense')
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Record New Expense</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL E · SET PURCHASE PRICE ================= */}
      {activeModal === 'setPrice' && selectedProductForPrice && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>Set purchase price</h3>
            <p className="modal-sub">
              Define the unit acquisition / cost price for <b>{selectedProductForPrice.name}</b>.
            </p>

            <form onSubmit={handleSavePurchasePrice} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Product Code:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedProductForPrice.code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-bold text-slate-900">{selectedProductForPrice.category || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Selling Price:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(selectedProductForPrice.sellingPrice || selectedProductForPrice.price || 0)}</span>
                </div>
              </div>

              <div className="field">
                <label>Purchase / Cost Price (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 250.00"
                  value={newPurchasePriceInput}
                  onChange={(e) => setNewPurchasePriceInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setActiveModal(null)}
                  disabled={isSavingPrice}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-solid"
                  disabled={isSavingPrice}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingPrice ? 'Saving...' : 'Save Purchase Price'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL G · RESTOCKED ITEMS LIST ================= */}
      {activeModal === 'restockList' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="dashboard-modal wide" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>
              {restockRange === 'daily'
                ? "Today's Restocked Items"
                : restockRange === 'weekly'
                ? 'Restocked Items (This Week)'
                : 'Restocked Items (Custom Period)'}
            </h3>
            <p className="modal-sub">{currentRestockDisplay.subtitle}</p>

            {/* Controls Bar: Range Pills + Search + Location Filter + Add Stock Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-1">
              <div className="pills">
                <button
                  type="button"
                  className={`pill ${restockRange === 'daily' ? 'active' : ''}`}
                  onClick={() => setRestockRange('daily')}
                >
                  Daily
                </button>
                <button
                  type="button"
                  className={`pill ${restockRange === 'weekly' ? 'active' : ''}`}
                  onClick={() => setRestockRange('weekly')}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className={`pill ${restockRange === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    setDateTarget('restock')
                    setActiveModal('date')
                  }}
                >
                  Custom Date
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                    placeholder="Search item, code..."
                    value={restockSearchQuery}
                    onChange={(e) => setRestockSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={restockLocationFilter}
                  onChange={(e) => setRestockLocationFilter(e.target.value)}
                >
                  <option value="ALL">All locations</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      Store: {s.name}
                    </option>
                  ))}
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      Warehouse: {w.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn-solid text-xs py-1.5 px-3"
                  onClick={() => {
                    setNewRestockDate(new Date().toISOString().split('T')[0])
                    setActiveModal('addRestock')
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Stock In</span>
                </button>
              </div>
            </div>

            {/* List or Empty State */}
            {modalDisplayRestockItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ArrowDownToLine className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No restocked items found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {restockSearchQuery || restockLocationFilter !== 'ALL'
                    ? 'No items matched your current filter criteria. Try clearing search or selecting all locations.'
                    : 'No items were stocked in during this period. Arrived inventory or warehouse inbounds will appear here automatically.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {restockRange === 'daily' && allRestockedItems.length > 0 && (
                    <button
                      type="button"
                      className="btn-ghost text-xs py-1.5 px-3"
                      onClick={() => setRestockRange('weekly')}
                    >
                      View This Week
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-solid text-xs py-1.5 px-3"
                    onClick={() => {
                      setNewRestockDate(new Date().toISOString().split('T')[0])
                      setActiveModal('addRestock')
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Record Stock Intake</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Time / Date</th>
                      <th>Product &amp; Code</th>
                      <th>Destination</th>
                      <th style={{ textAlign: 'center' }}>Qty Added</th>
                      <th className="num">Unit Cost</th>
                      <th className="num">Intake Value</th>
                      <th>Supplier / Logged By</th>
                      <th style={{ width: '40px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDisplayRestockItems.map((item) => {
                      const d = new Date(item.createdAt || item.date)
                      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                      const dateStr = item.date || (!isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')

                      return (
                        <tr key={item.uniqueKey}>
                          <td>
                            <span className="tpill">{timeStr || 'Intake'}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{dateStr}</span>
                          </td>
                          <td>
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                              {item.productCode && (
                                <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-semibold text-[10px]">
                                  {item.productCode}
                                </span>
                              )}
                              <span>{item.category}</span>
                              {item.notes && <span className="text-slate-400" title={item.notes}>• {item.notes}</span>}
                            </div>
                          </td>
                          <td>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {item.destinationType === 'warehouse' ? (
                                <Building2 className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Store className="w-3 h-3 text-emerald-700" />
                              )}
                              <span>{item.destinationName}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="qpill green font-bold">
                              +{item.quantity} {item.unit || 'pcs'}
                            </span>
                          </td>
                          <td className="num">
                            {item.costPerUnit > 0 ? (
                              <span className="text-xs text-slate-600">{formatCurrency(item.costPerUnit)}</span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="num">
                            {item.totalValuation > 0 ? (
                              <b className="text-emerald-700">{formatCurrency(item.totalValuation)}</b>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td>
                            <div className="text-xs text-slate-800 font-semibold">
                              {item.supplierName || 'Direct / Stock In'}
                            </div>
                            <div className="text-[10.5px] text-slate-400">
                              By {item.recordedBy || 'Owner'}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.source !== 'approval' ? (
                              <button
                                type="button"
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Delete this restock record"
                                onClick={() => handleDeleteRestock(item._id || item.restockId)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300" title="Approved direct purchase (managed via History)">&bull;</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Grand Total</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="qpill green font-bold">
                          +{modalDisplayRestockItems.reduce((acc, it) => acc + it.quantity, 0).toLocaleString()} units
                        </span>
                      </td>
                      <td></td>
                      <td className="num">
                        <b className="text-emerald-700">
                          {formatCurrency(
                            modalDisplayRestockItems.reduce((acc, it) => acc + it.totalValuation, 0)
                          )}
                        </b>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="modal-footer-line">
              <span>
                Showing <b>{modalDisplayRestockItems.length}</b> restock record{modalDisplayRestockItems.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                className="btn-solid text-xs py-1.5 px-3"
                onClick={() => {
                  setNewRestockDate(new Date().toISOString().split('T')[0])
                  setActiveModal('addRestock')
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Stock In Another Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL H · RECORD STOCK INTAKE ================= */}
      {activeModal === 'addRestock' && (
        <div
          className="dashboard-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal('restockList')
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="dashboard-modal-x"
              onClick={() => setActiveModal('restockList')}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3>Record stock intake</h3>
            <p className="modal-sub">Add arrived items and restock inventory directly in real time.</p>

            <form onSubmit={handleRecordRestockSubmit} className="space-y-4">
              <div className="field">
                <label>Product *</label>
                <select
                  value={newRestockProductId}
                  onChange={(e) => {
                    const pid = e.target.value
                    setNewRestockProductId(pid)
                    const p = products.find((prod) => prod.id === pid || prod._id === pid)
                    if (p) {
                      if (p.costPrice) setNewRestockCost(String(p.costPrice))
                      if (p.sellingPrice) setNewRestockSelling(String(p.sellingPrice))
                    }
                  }}
                  required
                >
                  <option value="">-- Choose item to stock in --</option>
                  {products.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} {p.code ? `[${p.code}]` : ''} ({p.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Quantity to Add *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newRestockQty}
                    onChange={(e) => setNewRestockQty(e.target.value)}
                    placeholder="e.g. 20"
                    required
                  />
                </div>
                <div className="field">
                  <label>Intake Date *</label>
                  <input
                    type="date"
                    value={newRestockDate}
                    onChange={(e) => setNewRestockDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Destination Location *</label>
                  <select
                    value={
                      newRestockDestId
                        ? `${newRestockDestType}:${newRestockDestId}`
                        : stores[0]
                        ? `store:${stores[0].id}`
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        const [type, id] = val.split(':')
                        setNewRestockDestType(type)
                        setNewRestockDestId(id)
                      }
                    }}
                  >
                    <optgroup label="Stores">
                      {stores.map((s) => (
                        <option key={s.id} value={`store:${s.id}`}>
                          Store: {s.name}
                        </option>
                      ))}
                    </optgroup>
                    {warehouses.length > 0 && (
                      <optgroup label="Warehouses">
                        {warehouses.map((w) => (
                          <option key={w.id} value={`warehouse:${w.id}`}>
                            Warehouse: {w.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="field">
                  <label>Supplier / Vendor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. TotalEnergies, Al-Buraq"
                    value={newRestockSupplier}
                    onChange={(e) => setNewRestockSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Unit Cost Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 150.00"
                    value={newRestockCost}
                    onChange={(e) => setNewRestockCost(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Payment Method</label>
                  <select
                    value={newRestockPayment}
                    onChange={(e) => setNewRestockPayment(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Telebirr">Telebirr</option>
                    <option value="Credit">Credit / Account Payable</option>
                    <option value="Consignment">Consignment</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Notes / Memo</label>
                <input
                  type="text"
                  placeholder="Optional delivery note or invoice ref"
                  value={newRestockNotes}
                  onChange={(e) => setNewRestockNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setActiveModal('restockList')}
                  disabled={isSavingRestock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-solid"
                  disabled={isSavingRestock}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingRestock ? 'Recording...' : 'Stock In Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
export default DashboardPage
