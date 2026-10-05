import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Search,
  Download,
  Filter,
  Activity,
  User,
  ShoppingBag,
  ArrowRightLeft,
  Store,
  Warehouse,
  Package,
  CreditCard,
  Banknote,
  CheckCircle2,
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatDate, formatCurrency, exportToExcel } from '../lib/utils'

// Helper to resolve raw database IDs into human-readable labels, or null to hide them
function resolveTarget(target, { stores = [], warehouses = [], products = [], staff = [], sales = [] }) {
  if (!target) return null
  const targetStr = String(target).trim()

  // Handle transfer targets: "fromId -> toId" or "fromName → toName"
  if (targetStr.includes('->') || targetStr.includes('→')) {
    const parts = targetStr.split(/->|→/).map((s) => s.trim())
    const fromLoc =
      warehouses.find((w) => w.id === parts[0] || w._id === parts[0])?.name ||
      stores.find((s) => s.id === parts[0] || s._id === parts[0])?.name ||
      parts[0]
    const toLoc =
      warehouses.find((w) => w.id === parts[1] || w._id === parts[1])?.name ||
      stores.find((s) => s.id === parts[1] || s._id === parts[1])?.name ||
      parts[1]

    const isRawFrom = /^[a-z0-9_-]{15,}$/i.test(fromLoc)
    const isRawTo = /^[a-z0-9_-]{15,}$/i.test(toLoc)
    if (isRawFrom || isRawTo) return null
    return `${fromLoc} → ${toLoc}`
  }

  // Check stores
  const matchedStore = stores.find((s) => s.id === targetStr || s._id === targetStr)
  if (matchedStore) return matchedStore.name

  // Check warehouses
  const matchedWarehouse = warehouses.find((w) => w.id === targetStr || w._id === targetStr)
  if (matchedWarehouse) return matchedWarehouse.name

  // Check products
  const matchedProduct = products.find((p) => p.id === targetStr || p._id === targetStr)
  if (matchedProduct) return matchedProduct.name

  // Check staff
  const matchedStaff = staff.find((st) => st.id === targetStr || st._id === targetStr)
  if (matchedStaff) return matchedStaff.name

  // Check sales
  const matchedSale = sales.find((s) => s.id === targetStr || s._id === targetStr)
  if (matchedSale) return matchedSale.invoiceNumber || matchedSale.receiptNumber

  // If it still looks like an un-resolved database ID (e.g. "jn78sde8artyjad23szkbmctfs8fmc2m"), HIDE IT
  if (/^[a-z0-9_-]{15,}$/i.test(targetStr)) {
    return null
  }

  return targetStr
}

// Helper to find the actual sale record from an audit log
function resolveSaleForLog(log, sales = []) {
  if (!log) return null
  const invMatch = log.description?.match(/INV-\d{4}-\d{4}/i)
  const invNum = invMatch ? invMatch[0].toUpperCase() : null

  return sales.find((s) => {
    if (invNum && (s.invoiceNumber?.toUpperCase() === invNum || s.receiptNumber?.toUpperCase() === invNum)) {
      return true
    }
    if (log.target && (s.id === log.target || s._id === log.target || s.invoiceNumber === log.target)) {
      return true
    }
    return false
  })
}

export function AuditTrailPage() {
  const { auditLogs = [], sales = [], stores = [], warehouses = [], products = [], staff = [] } = useTenant()
  const { isOwner, currentUser } = useAuth()
  const { toast } = useToast()
  const [filterAction, setFilterAction] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Strictly Owner-Only Guard
  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Owner Access Only</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The system audit trail contains confidential staff activities, sales records, and inventory adjustments. Only verified Business Owners have permission to review audit logs.
        </p>
        <div className="pt-2">
          <Badge variant="danger">Role: {currentUser?.role || 'User'} (Unauthorized)</Badge>
        </div>
      </div>
    )
  }

  // Filter logs with smart search (searches log text, items sold, invoice numbers, customer info)
  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction

    if (!searchTerm.trim()) return matchesAction

    const matchedSale = resolveSaleForLog(log, sales)
    const targetName = resolveTarget(log.target, { stores, warehouses, products, staff, sales }) || ''
    const itemNames = matchedSale?.items?.map((i) => i.productName).join(' ') || ''
    const customerInfo = `${matchedSale?.customerName || ''} ${matchedSale?.customerPhone || ''}`
    const invoiceNum = matchedSale?.invoiceNumber || matchedSale?.receiptNumber || ''

    const searchPool = `${log.description || ''} ${log.actorName || ''} ${log.action || ''} ${targetName} ${itemNames} ${customerInfo} ${invoiceNum}`.toLowerCase()

    return matchesAction && searchPool.includes(searchTerm.toLowerCase().trim())
  })

  // Export logs to Excel with detailed item sales breakdown
  const handleExportExcel = () => {
    const exportData = filteredLogs.map((l) => {
      const matchedSale = resolveSaleForLog(l, sales)
      const targetName = resolveTarget(l.target, { stores, warehouses, products, staff, sales }) || ''

      let itemsSummary = ''
      let totalAmountStr = ''
      if (matchedSale) {
        itemsSummary = matchedSale.items?.map((it) => `${it.quantity}x ${it.productName}`).join(', ') || ''
        totalAmountStr = formatCurrency(matchedSale.total ?? matchedSale.totalAmount ?? 0)
      }

      return {
        Timestamp: formatDate(l.timestamp),
        Actor: l.actorName,
        Role: l.role,
        ActionType: l.action,
        Description: l.description,
        ItemsSold: itemsSummary || '-',
        TotalAmount: totalAmountStr || '-',
        Location: targetName || matchedSale?.storeName || 'General',
      }
    })
    exportToExcel(exportData, 'OMESTOCK_Audit_Trail')
    toast.success('Audit Logs Exported', 'Audit trail exported to Excel with full details.')
  }

  const getActionBadge = (action) => {
    switch (action) {
      case 'SALE_RECORDED':
        return <Badge variant="success">Sale</Badge>
      case 'WAREHOUSE_INBOUND':
        return <Badge variant="info">Wh Purchase</Badge>
      case 'PRODUCT_CREATED':
        return <Badge variant="info">New Product</Badge>
      case 'PRODUCT_UPDATED':
        return <Badge variant="default">Edit Product</Badge>
      case 'PRODUCT_DELETED':
        return <Badge variant="danger">Delete Product</Badge>
      case 'STOCK_TRANSFER':
        return <Badge variant="purple">Transfer</Badge>
      case 'DIRECT_STORE_PURCHASE':
        return <Badge variant="info">Store Purchase</Badge>
      case 'CREDIT_SALE_SETTLED':
        return <Badge variant="warning">Debt Settled</Badge>
      case 'STAFF_CREATED':
      case 'STAFF_UPDATED':
        return <Badge variant="default">Staff</Badge>
      case 'STORE_CREATED':
      case 'STORE_DELETED':
        return <Badge variant="purple">Branch</Badge>
      default:
        return <Badge variant="default">System</Badge>
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'SALE_RECORDED':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100 shadow-2xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
        )
      case 'CREDIT_SALE_SETTLED':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100 shadow-2xs">
            <Banknote className="w-4 h-4" />
          </div>
        )
      case 'STOCK_TRANSFER':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100 shadow-2xs">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        )
      case 'DIRECT_STORE_PURCHASE':
      case 'WAREHOUSE_INBOUND':
      case 'PRODUCT_CREATED':
      case 'PRODUCT_UPDATED':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100 shadow-2xs">
            <Package className="w-4 h-4" />
          </div>
        )
      case 'STAFF_CREATED':
      case 'STAFF_UPDATED':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
        )
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time verified log of sales, products sold, transfers, and system activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-semibold w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Excel</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Activities' },
              { id: 'SALE_RECORDED', label: 'Sales' },
              { id: 'STOCK_TRANSFER', label: 'Transfers' },
              { id: 'DIRECT_STORE_PURCHASE', label: 'Purchases' },
              { id: 'CREDIT_SALE_SETTLED', label: 'Settled Debts' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterAction(f.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors touch-manipulation min-h-[36px] ${
                  filterAction === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search product sold, invoice, staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[40px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries List */}
      <Card>
        <CardHeader className="py-3 px-4 sm:px-6 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Recorded Activity Events ({filteredLogs.length})</span>
            {searchTerm && (
              <span className="text-xs font-normal text-slate-400">
                Filtered by &quot;{searchTerm}&quot;
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const matchedSale = resolveSaleForLog(log, sales)
            const resolvedTarget = resolveTarget(log.target, { stores, warehouses, products, staff, sales })
            const storeDisplayName =
              matchedSale?.storeName ||
              stores.find((st) => st.id === matchedSale?.storeId || st._id === matchedSale?.storeId)?.name ||
              resolvedTarget ||
              'Main Store'

            return (
              <div
                key={log.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-3 text-xs"
              >
                {getActionIcon(log.action)}

                <div className="flex-1 min-w-0">
                  {/* Top line: Actor Name, Role Badge, Action Badge, and Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{log.actorName}</span>
                      <Badge variant={log.role === 'owner' ? 'purple' : 'info'} className="text-[10px] py-0">
                        {log.role}
                      </Badge>
                      {getActionBadge(log.action)}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  {/* SALE_RECORDED: Detailed Breakdown of What Was Sold */}
                  {log.action === 'SALE_RECORDED' ? (
                    matchedSale ? (
                      <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-3.5 space-y-2.5">
                        {/* Meta header: Invoice, Store Branch, Payment Method, Customer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs text-[11px]">
                              {matchedSale.invoiceNumber || matchedSale.receiptNumber}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                              <Store className="w-3 h-3 text-slate-400" />
                              {storeDisplayName}
                            </span>
                            <Badge
                              variant={
                                matchedSale.paymentMethod === 'Credit'
                                  ? 'warning'
                                  : matchedSale.paymentMethod === 'Banking'
                                  ? 'info'
                                  : 'success'
                              }
                              className="text-[10px] py-0 font-semibold"
                            >
                              {matchedSale.paymentMethod}{' '}
                              {matchedSale.bankProvider ? `(${matchedSale.bankProvider})` : ''}
                            </Badge>
                          </div>

                          {matchedSale.customerName && matchedSale.customerName !== 'Walk-in Customer' && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Customer: <strong className="text-slate-800">{matchedSale.customerName}</strong>
                              {matchedSale.customerPhone && (
                                <span className="text-slate-400 ml-1">({matchedSale.customerPhone})</span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Items Sold List */}
                        <div className="bg-white rounded-lg border border-slate-200/70 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                          {matchedSale.items && matchedSale.items.length > 0 ? (
                            matchedSale.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50/50"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                                    {it.quantity}x
                                  </span>
                                  <span className="font-semibold text-slate-900 truncate">
                                    {it.productName || 'Product'}
                                  </span>
                                </div>
                                <div className="text-right shrink-0 pl-2">
                                  <span className="font-bold text-slate-800">
                                    {formatCurrency(it.subtotal || (it.price || 0) * it.quantity)}
                                  </span>
                                  {it.quantity > 1 && (
                                    <span className="block text-[10px] text-slate-400">
                                      @{formatCurrency(it.price || 0)} / unit
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-600 font-medium">
                              {log.description}
                            </div>
                          )}
                        </div>

                        {/* Total Sale Footer */}
                        <div className="flex items-center justify-between pt-0.5 px-1 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Total Sale Amount
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(matchedSale.total ?? matchedSale.totalAmount ?? 0)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Clean fallback if the sale record itself was not in current sales state */
                      <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <p className="text-slate-800 font-medium text-xs leading-relaxed">
                          {log.description}
                        </p>
                      </div>
                    )
                  ) : log.action === 'CREDIT_SALE_SETTLED' ? (
                    <div className="mt-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                      <p className="text-slate-800 font-medium text-xs leading-relaxed">
                        {log.description}
                      </p>
                      {matchedSale && (
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                            {matchedSale.invoiceNumber || matchedSale.receiptNumber}
                          </span>
                          <span>
                            Settled Total:{' '}
                            <strong className="text-slate-900 font-bold">
                              {formatCurrency(matchedSale.total ?? matchedSale.totalAmount ?? 0)}
                            </strong>
                          </span>
                          {matchedSale.items && (
                            <span className="text-slate-500">
                              ({matchedSale.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default Event Display (Transfers, Inbound, Products, Staff, Stores) */
                    <div className="mt-1 space-y-1">
                      <p className="text-slate-700 text-xs leading-relaxed">{log.description}</p>
                      {resolvedTarget && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <span className="text-slate-400 font-medium">Target:</span>
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {resolvedTarget}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-500">No matching activity events found</p>
              <p className="text-[11px] text-slate-400">
                Try selecting &quot;All Activities&quot; or clearing your search query.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
