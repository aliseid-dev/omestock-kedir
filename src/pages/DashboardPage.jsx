import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ClockAlert,
  Download,
  Calendar,
  ArrowUpRight,
  ShoppingCart,
  Boxes,
  Users
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, formatDate, exportToExcel } from '../lib/utils'

export function DashboardPage() {
  const { stores, warehouses, products, sales, staff } = useTenant()
  const { isOwner } = useAuth()
  const [timeFilter, setTimeFilter] = useState('monthly') // 'daily' | 'weekly' | 'monthly' | 'yearly'

  // Low stock calculation across all stores & central warehouse
  const lowStockAlerts = useMemo(() => {
    const alerts = []
    
    // Check stores
    stores.forEach(store => {
      products.forEach(prod => {
        const qty = store.stock[prod.id] || 0
        if (qty <= (prod.minStockThreshold || 5)) {
          alerts.push({
            locationName: store.name,
            locationType: 'Store',
            productId: prod.id,
            productName: prod.name,
            currentStock: qty,
            minThreshold: prod.minStockThreshold || 5,
            isOut: qty === 0,
          })
        }
      })
    })

    // Check central warehouse
    warehouses.forEach(wh => {
      products.forEach(prod => {
        const qty = wh.stock[prod.id] || 0
        if (qty <= (prod.minStockThreshold || 5)) {
          alerts.push({
            locationName: wh.name,
            locationType: 'Warehouse',
            productId: prod.id,
            productName: prod.name,
            currentStock: qty,
            minThreshold: prod.minStockThreshold || 5,
            isOut: qty === 0,
          })
        }
      })
    })

    return alerts
  }, [stores, warehouses, products])

  // Filter sales by timeline
  const filteredSales = useMemo(() => {
    const now = new Date()
    return sales.filter(s => {
      const saleDate = new Date(s.timestamp)
      const diffMs = now - saleDate
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      if (timeFilter === 'daily') return diffDays <= 1
      if (timeFilter === 'weekly') return diffDays <= 7
      if (timeFilter === 'monthly') return diffDays <= 30
      if (timeFilter === 'yearly') return diffDays <= 365
      return true
    })
  }, [sales, timeFilter])

  // Financial Metrics Calculations
  const metrics = useMemo(() => {
    let totalInventoryValue = 0
    let totalItemsInStock = 0

    products.forEach(p => {
      let prodQty = 0
      warehouses.forEach(wh => { prodQty += (wh.stock[p.id] || 0) })
      stores.forEach(st => { prodQty += (st.stock[p.id] || 0) })
      
      totalItemsInStock += prodQty
      totalInventoryValue += prodQty * p.costPrice
    })

    const grossSales = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0)

    let cogs = 0
    let totalCommissions = 0
    let unpaidCreditTotal = 0

    filteredSales.forEach(s => {
      totalCommissions += (s.commissionTotal || 0)
      if (s.paymentMethod === 'Credit' && s.paymentStatus === 'Unpaid') {
        unpaidCreditTotal += s.totalAmount
      }
      (s.items || []).forEach(item => {
        cogs += (item.costPrice || 0) * (item.quantity || 1)
      })
    })

    const netProfit = grossSales - cogs - totalCommissions

    return {
      totalInventoryValue,
      totalItemsInStock,
      grossSales,
      cogs,
      totalCommissions,
      netProfit,
      unpaidCreditTotal,
      salesCount: filteredSales.length,
    }
  }, [products, warehouses, stores, filteredSales])

  // Excel Export
  const handleExportExcel = () => {
    const exportRows = filteredSales.map(s => ({
      Invoice: s.invoiceNumber,
      Date: formatDate(s.timestamp),
      Store: s.storeName,
      Salesperson: s.salespersonName,
      PaymentMethod: s.paymentMethod,
      PaymentStatus: s.paymentStatus,
      Customer: s.customerName || 'Walk-in',
      TotalAmount: s.totalAmount,
      CommissionPaid: s.commissionTotal,
    }))

    exportToExcel(exportRows, `OMESTOCK_Sales_Report_${timeFilter}`)
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Timeframe Filter Selector (Horizontal Touch Pills) */}
          <div className="flex items-center justify-between sm:justify-start bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {['daily', 'weekly', 'monthly', 'yearly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg capitalize transition-colors touch-manipulation active:scale-95 ${
                  timeFilter === tf
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Mobile Stacked 1 Col -> Tablet 2 Cols -> Desktop 4 Cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Gross Sales */}
        <Card className="bg-white border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(metrics.grossSales)}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-bold text-emerald-600">{metrics.salesCount} orders</span> in {timeFilter}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-white border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(metrics.netProfit)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gross sales minus COGS & commissions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Inventory Valuation */}
        <Card className="bg-white border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(metrics.totalInventoryValue)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.totalItemsInStock} total units across warehouse & stores
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unpaid Credit Sales */}
        <Card className="bg-white border-amber-200/90 shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unpaid Credit Debts</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClockAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {formatCurrency(metrics.unpaidCreditTotal)}
              </div>
              <Link to="/unpaid-sales" className="text-xs font-semibold text-amber-700 hover:underline mt-1 inline-flex items-center gap-1 touch-manipulation">
                View Unpaid Sales list &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
        {/* Excel Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </Button>

      </div>

      {/* Low Stock Alerts Notification Panel */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="py-3 px-4 sm:px-5 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <CardTitle className="text-xs sm:text-sm font-bold text-amber-900">
                Low Stock Threshold Alerts ({lowStockAlerts.length} items flagged)
              </CardTitle>
            </div>
            <Link to="/inventory">
              <Button size="sm" variant="outline" className="text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100 min-h-[36px] w-full sm:w-auto">
                Restock via Transfer &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {lowStockAlerts.map((alert, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{alert.productName}</p>
                    <p className="text-[11px] text-slate-500">{alert.locationName} ({alert.locationType})</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.isOut ? 'danger' : 'warning'}>
                      {alert.currentStock} left (Min: {alert.minThreshold})
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales: Responsive Cards on Mobile, Table on Desktop */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="py-3.5 px-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Recent Sales Transactions
            </CardTitle>
            <Link to="/pos" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold">
              New Sale <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          {/* Mobile Card List (Hidden on md+) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{sale.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{formatDate(sale.timestamp)}</span>
                  </div>
                  <Badge
                    variant={
                      sale.paymentMethod === 'Cash'
                        ? 'success'
                        : sale.paymentMethod === 'Banking'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {sale.paymentMethod} &bull; {sale.paymentStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{sale.storeName} &bull; by {sale.salespersonName}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                  <span className="text-slate-500">
                    Comm: <span className="text-emerald-700 font-bold">+{formatCurrency(sale.commissionTotal)}</span>
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
            {filteredSales.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No sales recorded for this timeframe
              </div>
            )}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Store</th>
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {sale.invoiceNumber}
                      <div className="text-[10px] text-slate-400">{formatDate(sale.timestamp)}</div>
                    </td>
                    <td className="px-4 py-3.5">{sale.storeName}</td>
                    <td className="px-4 py-3.5">{sale.salespersonName}</td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          sale.paymentMethod === 'Cash'
                            ? 'success'
                            : sale.paymentMethod === 'Banking'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {sale.paymentMethod} &bull; {sale.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-emerald-600 font-medium">
                      +{formatCurrency(sale.commissionTotal)}
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No sales recorded for this timeframe
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  )
}
