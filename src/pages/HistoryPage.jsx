import React, { useState, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  Download,
  RotateCcw,
  Receipt,
  Eye,
  Printer,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Calendar,
  Check
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency, formatDate, exportToExcel } from '../lib/utils'

// Helper to convert date to YYYY-MM-DD in local timezone
function getLocalDateString(dateInput) {
  if (!dateInput) return ''
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function HistoryPage() {
  const { sales = [], stores = [], tenantName = 'OMESTOCK' } = useTenant()
  const { toast } = useToast()

  // Filter modal toggle
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Filter states
  // 'daily' | 'weekly' | 'monthly' | 'all' | 'custom'
  const [datePreset, setDatePreset] = useState('daily')
  const [specificDate, setSpecificDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState('ALL')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL')

  // Selected sale for receipt modal preview
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null)

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (datePreset !== 'daily') count++
    if (specificDate) count++
    if (selectedStore !== 'ALL') count++
    if (selectedPaymentMethod !== 'ALL') count++
    if (selectedPaymentStatus !== 'ALL') count++
    return count
  }, [datePreset, specificDate, selectedStore, selectedPaymentMethod, selectedPaymentStatus])

  // Filter sales list
  const filteredSales = useMemo(() => {
    const now = new Date()
    const todayStr = getLocalDateString(now)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return sales.filter((s) => {
      const saleDate = new Date(s.timestamp || s.createdAt)
      const saleDateStr = getLocalDateString(saleDate)

      // 1. Time / Date Filter
      if (datePreset === 'daily') {
        if (saleDateStr !== todayStr) return false
      } else if (datePreset === 'weekly') {
        const diffMs = now.getTime() - saleDate.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays < -0.1 || diffDays > 7) return false
      } else if (datePreset === 'monthly') {
        if (saleDate.getFullYear() !== currentYear || saleDate.getMonth() !== currentMonth) {
          return false
        }
      } else if (datePreset === 'custom' && specificDate) {
        if (saleDateStr !== specificDate) return false
      }

      // 2. Store Location Filter
      if (selectedStore !== 'ALL') {
        if (s.storeId !== selectedStore && s.storeName !== selectedStore) return false
      }

      // 3. Payment Method Filter
      if (selectedPaymentMethod !== 'ALL') {
        if (s.paymentMethod !== selectedPaymentMethod) return false
      }

      // 4. Payment Status Filter
      if (selectedPaymentStatus !== 'ALL') {
        if (s.paymentStatus !== selectedPaymentStatus) return false
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const inv = (s.invoiceNumber || s.receiptNumber || '').toLowerCase()
        const cust = (s.customerName || '').toLowerCase()
        const phone = (s.customerPhone || '').toLowerCase()
        const staff = (s.salespersonName || s.staffName || '').toLowerCase()
        const store = (s.storeName || '').toLowerCase()
        const payMethod = (s.paymentMethod || '').toLowerCase()
        const bankProv = (s.bankProvider || '').toLowerCase()
        const bankRef = (s.bankRef || '').toLowerCase()
        const itemNames = (s.items || []).map((it) => it.productName || '').join(' ').toLowerCase()
        const itemCodes = (s.items || []).map((it) => it.productCode || it.code || '').join(' ').toLowerCase()
        const qDigits = q.replace(/\D/g, '')
        const itemDigitsMatch = Boolean(
          qDigits && (s.items || []).some((it) => (it.productCode || it.code || '').replace(/\D/g, '').includes(qDigits))
        )

        const matches =
          inv.includes(q) ||
          cust.includes(q) ||
          phone.includes(q) ||
          staff.includes(q) ||
          store.includes(q) ||
          payMethod.includes(q) ||
          bankProv.includes(q) ||
          bankRef.includes(q) ||
          itemNames.includes(q) ||
          itemCodes.includes(q) ||
          itemDigitsMatch

        if (!matches) return false
      }

      return true
    })
  }, [sales, datePreset, specificDate, selectedStore, selectedPaymentMethod, selectedPaymentStatus, searchQuery])

  // Reset all filters to defaults
  const handleResetFilters = () => {
    setDatePreset('daily')
    setSpecificDate('')
    setSelectedStore('ALL')
    setSelectedPaymentMethod('ALL')
    setSelectedPaymentStatus('ALL')
    setSearchQuery('')
    setIsFilterOpen(false)
    toast.info('Filters Reset', "Showing today's sales across all stores.")
  }

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (filteredSales.length === 0) {
      toast.error('No Data', 'There are no transactions matching your current filters.')
      return
    }

    const exportRows = filteredSales.map((s) => ({
      'Receipt #': s.invoiceNumber || s.receiptNumber,
      'Date': formatDate(s.timestamp || s.createdAt),
      'Store': s.storeName || 'Main Store',
      'Salesperson': s.salespersonName || s.staffName || 'Staff',
      'Customer': s.customerName || 'Walk-in',
      'Phone': s.customerPhone || '',
      'Payment Method': s.paymentMethod,
      'Bank Provider': s.bankProvider || '',
      'Reference #': s.bankRef || '',
      'Status': s.paymentStatus || 'Paid',
      'Items': (s.items || []).map((it) => `${it.productName} (x${it.quantity})`).join(', '),
      'Total (ETB)': s.totalAmount ?? s.total ?? 0,
    }))

    const fileName = `OMESTOCK_History_${datePreset}${specificDate ? `_${specificDate}` : ''}`
    exportToExcel(exportRows, fileName)
    toast.success('Report Exported', `Exported ${filteredSales.length} transactions to Excel.`)
  }

  // Badge helper for payment methods
  const renderPaymentBadge = (sale) => {
    switch (sale.paymentMethod) {
      case 'Cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Banknote className="w-3 h-3 text-emerald-600" />
            Cash
          </span>
        )
      case 'Telebirr':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Smartphone className="w-3 h-3 text-sky-600" />
            Telebirr
          </span>
        )
      case 'Banking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Building2 className="w-3 h-3 text-purple-600" />
            {sale.bankProvider ? `Bank (${sale.bankProvider})` : 'Banking'}
          </span>
        )
      case 'Credit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <CreditCard className="w-3 h-3 text-amber-600" />
            Credit ({sale.paymentStatus || 'Unpaid'})
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {sale.paymentMethod || 'Other'}
          </span>
        )
    }
  }

  // Format label for current active period
  const activePeriodLabel = useMemo(() => {
    if (datePreset === 'daily') return 'Today'
    if (datePreset === 'weekly') return 'Last 7 Days'
    if (datePreset === 'monthly') return 'This Month'
    if (datePreset === 'custom' && specificDate) return specificDate
    if (datePreset === 'all') return 'All Time'
    return 'Custom'
  }, [datePreset, specificDate])

  return (
    <div className="space-y-3 sm:space-y-4 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* ─── Compact Top Header Bar ─── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <History className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Sales History
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Showing: <span className="font-bold text-slate-800">{activePeriodLabel}</span>
            </p>
          </div>
        </div>

        {/* Top Right Action: Export Excel */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-50 border-slate-200 h-9 shrink-0"
          title="Export filtered records to Excel"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Export Excel</span>
        </Button>
      </div>

      {/* ─── Top Search Bar + Filter Icon Button Row ─── */}
      <div className="flex items-center gap-2">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search receipt #, customer, item, cashier, bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px] shadow-2xs placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`relative flex items-center justify-center gap-1.5 px-3.5 sm:px-4 min-h-[42px] rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-2xs ${
            activeFilterCount > 0
              ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
          title="Open filters"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

      </div>

      {/* ─── Active Filter Pills (Removable tags when filters are active) ─── */}
      {(datePreset !== 'daily' || specificDate || selectedStore !== 'ALL' || selectedPaymentMethod !== 'ALL' || selectedPaymentStatus !== 'ALL') && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Filtered by:
          </span>

          {/* Period Pill */}
          {datePreset !== 'daily' && !specificDate && (
            <button
              type="button"
              onClick={() => setDatePreset('daily')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <span>{activePeriodLabel}</span>
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}

          {/* Specific Date Pill */}
          {specificDate && (
            <button
              type="button"
              onClick={() => {
                setSpecificDate('')
                setDatePreset('daily')
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors"
            >
              <span>Date: {specificDate}</span>
              <X className="w-3 h-3 text-emerald-700" />
            </button>
          )}

          {/* Store Pill */}
          {selectedStore !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedStore('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 hover:bg-purple-200 transition-colors"
            >
              <span>Store: {stores.find(s => s.id === selectedStore || s._id === selectedStore)?.name || selectedStore}</span>
              <X className="w-3 h-3 text-purple-700" />
            </button>
          )}

          {/* Payment Method Pill */}
          {selectedPaymentMethod !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-900 hover:bg-sky-200 transition-colors"
            >
              <span>Payment: {selectedPaymentMethod}</span>
              <X className="w-3 h-3 text-sky-700" />
            </button>
          )}

          {/* Status Pill */}
          {selectedPaymentStatus !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedPaymentStatus('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
            >
              <span>Status: {selectedPaymentStatus}</span>
              <X className="w-3 h-3 text-amber-700" />
            </button>
          )}

          {/* Reset All Action */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 ml-1 underline cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ─── Transactions Table (Desktop) & Cards (Mobile) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {filteredSales.length === 0 ? (
          /* Empty State */
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">No transactions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No sales matched your active filters or search query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-1 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Salesperson</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Total (ETB)</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredSales.map((sale) => {
                    const invoiceNum = sale.invoiceNumber || sale.receiptNumber || 'INV-SALE'
                    const itemCount = (sale.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)
                    const itemsSummary = (sale.items || [])
                      .map((it) => `${it.productName} (x${it.quantity})`)
                      .join(', ')

                    return (
                      <tr
                        key={sale.id || sale._id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setSelectedSaleForReceipt(sale)}
                      >
                        {/* Receipt # */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            <span>{invoiceNum}</span>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {formatDate(sale.timestamp || sale.createdAt)}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant="purple" className="text-[10px] font-bold">
                            {sale.storeName || 'Main Store'}
                          </Badge>
                        </td>

                        {/* Salesperson */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-800">
                          {sale.salespersonName || sale.staffName || 'Staff'}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div>
                            <span className="font-semibold text-slate-900">
                              {sale.customerName || 'Walk-in'}
                            </span>
                            {sale.customerPhone && (
                              <p className="text-[10px] text-slate-400">{sale.customerPhone}</p>
                            )}
                          </div>
                        </td>

                        {/* Items Sold */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span
                            className="truncate block text-slate-600"
                            title={itemsSummary}
                          >
                            <span className="font-bold text-slate-800 mr-1">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}:
                            </span>
                            {itemsSummary || 'Standard Sale'}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderPaymentBadge(sale)}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-slate-900 text-sm">
                          {formatCurrency(sale.totalAmount ?? sale.total ?? 0)}
                        </td>

                        {/* View Receipt Action */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="View official receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Visible on mobile & tablet) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const invoiceNum = sale.invoiceNumber || sale.receiptNumber || 'INV-SALE'
                const itemCount = (sale.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)
                const itemsSummary = (sale.items || [])
                  .map((it) => `${it.productName} (x${it.quantity})`)
                  .join(', ')

                return (
                  <div
                    key={sale.id || sale._id}
                    onClick={() => setSelectedSaleForReceipt(sale)}
                    className="p-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors space-y-2.5 cursor-pointer"
                  >
                    {/* Card Top Row: Invoice # & Total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-slate-400" />
                        <span className="font-extrabold text-sm text-slate-900">{invoiceNum}</span>
                        <Badge variant="purple" className="text-[9px] px-1.5 py-0 font-bold">
                          {sale.storeName || 'Store'}
                        </Badge>
                      </div>
                      <span className="font-black text-sm text-slate-900">
                        {formatCurrency(sale.totalAmount ?? sale.total ?? 0)}
                      </span>
                    </div>

                    {/* Card Second Row: Date & Customer */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(sale.timestamp || sale.createdAt)}</span>
                      <span className="font-medium text-slate-700">
                        {sale.customerName || 'Walk-in'}
                        {sale.customerPhone ? ` (${sale.customerPhone})` : ''}
                      </span>
                    </div>

                    {/* Card Items Summary */}
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <span className="font-bold text-slate-800 mr-1">{itemCount} items:</span>
                      <span className="truncate">{itemsSummary || 'Standard Sale'}</span>
                    </div>

                    {/* Card Bottom Row: Payment Badge & Staff */}
                    <div className="flex items-center justify-between pt-1">
                      <div>{renderPaymentBadge(sale)}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        By <span className="font-bold text-slate-700">{sale.salespersonName || sale.staffName || 'Staff'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      {/* ─── Filter Modal / Drawer (Triggered by the Filter Icon Button) ─── */}
      {isFilterOpen && (
        <Modal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          title="Filter Sales History"
          maxWidth="sm:max-w-md max-w-sm"
        >
          <div className="space-y-4 text-slate-800">
            
            {/* 1. Time Period Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Time Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'daily', label: 'Today' },
                  { id: 'weekly', label: 'This Week' },
                  { id: 'monthly', label: 'This Month' },
                  { id: 'all', label: 'All Time' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDatePreset(item.id)
                      setSpecificDate('')
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      datePreset === item.id && !specificDate
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Specific Search Date */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Specific Search Date</span>
                {specificDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpecificDate('')
                      setDatePreset('daily')
                    }}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    const val = e.target.value
                    setSpecificDate(val)
                    if (val) {
                      setDatePreset('custom')
                    } else {
                      setDatePreset('daily')
                    }
                  }}
                  className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl border transition-all ${
                    specificDate
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>
            </div>

            {/* 3. Store Location Filter */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">
                Store Location
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="ALL">All Stores & Locations</option>
                {stores.map((st) => (
                  <option key={st.id || st._id} value={st.id || st._id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Payment Method Filter */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">
                Payment Method
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Cash">Cash Only</option>
                <option value="Telebirr">Telebirr Only</option>
                <option value="Banking">Banking (Bank Transfer)</option>
                <option value="Credit">Credit / Customer Debt</option>
              </select>
            </div>

            {/* 5. Payment Status Filter */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">
                Payment Status
              </label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Paid">Paid Only</option>
                <option value="Unpaid">Unpaid (Credit Debt)</option>
              </select>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                Reset All
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFilterOpen(false)}
                className="text-xs px-5 font-bold"
              >
                Apply Filters
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ─── Detailed Official Receipt Modal ─── */}
      {selectedSaleForReceipt && (
        <Modal
          isOpen={Boolean(selectedSaleForReceipt)}
          onClose={() => setSelectedSaleForReceipt(null)}
          title="Sales Receipt Preview"
          maxWidth="sm:max-w-xl max-w-md"
        >
          <div className="space-y-5">
            
            {/* Thermal / Paper Receipt Slip Aesthetics */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 font-mono text-xs">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-black text-base tracking-tight text-slate-900 font-sans">
                  {tenantName}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  {selectedSaleForReceipt.storeName || 'Main Store'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest pt-1">
                  OFFICIAL SALES RECEIPT
                </div>
              </div>

              {/* Receipt Details Header */}
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="font-bold">Receipt #:</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedSaleForReceipt.invoiceNumber || selectedSaleForReceipt.receiptNumber || 'INV-SALE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Date & Time:</span>
                  <span>{formatDate(selectedSaleForReceipt.timestamp || selectedSaleForReceipt.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Cashier / Staff:</span>
                  <span>{selectedSaleForReceipt.salespersonName || selectedSaleForReceipt.staffName || 'Staff'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Customer:</span>
                  <span>
                    {selectedSaleForReceipt.customerName || 'Walk-in Customer'}
                    {selectedSaleForReceipt.customerPhone ? ` (${selectedSaleForReceipt.customerPhone})` : ''}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="pt-2 border-t border-dashed border-slate-300">
                <div className="flex justify-between text-slate-500 font-bold pb-1.5 border-b border-slate-200 text-[11px]">
                  <span>Item</span>
                  <span className="text-right">Qty &bull; Price &bull; Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100 py-1">
                  {(selectedSaleForReceipt.items || []).map((it, idx) => {
                    const price = it.price ?? 0
                    const qty = it.quantity ?? 1
                    const subtotal = it.subtotal ?? (price * qty)

                    return (
                      <div key={idx} className="py-1.5 flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{it.productName}</p>
                          <p className="text-[10px] text-slate-500">
                            {qty} x {formatCurrency(price)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totals Section */}
              <div className="pt-3 border-t-2 border-slate-900 space-y-1.5">
                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900">
                  <span>TOTAL AMOUNT:</span>
                  <span>{formatCurrency(selectedSaleForReceipt.totalAmount ?? selectedSaleForReceipt.total ?? 0)}</span>
                </div>

                <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                  <span>Payment Method:</span>
                  <span className="font-bold text-slate-900">
                    {selectedSaleForReceipt.paymentMethod}
                    {selectedSaleForReceipt.bankProvider ? ` (${selectedSaleForReceipt.bankProvider})` : ''}
                  </span>
                </div>

                {selectedSaleForReceipt.bankRef && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Reference / Code:</span>
                    <span className="font-mono text-slate-900 font-bold">{selectedSaleForReceipt.bankRef}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Payment Status:</span>
                  <span className={`font-bold ${selectedSaleForReceipt.paymentStatus === 'Unpaid' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {selectedSaleForReceipt.paymentStatus || 'Paid'}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400 font-sans">
                Thank you for your business! &bull; OMESTOCK POS
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Receipt</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedSaleForReceipt(null)}
                className="text-xs px-5 font-bold"
              >
                Done
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}
export default HistoryPage
