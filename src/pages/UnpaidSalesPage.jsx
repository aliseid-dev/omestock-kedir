import React, { useState } from 'react'
import {
  ClockAlert,
  Search,
  CheckCircle,
  Phone,
  Calendar,
  Banknote,
  Download,
  AlertCircle
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency, formatDate, exportToExcel } from '../lib/utils'
import { ETHIOPIAN_PAYMENT_PROVIDERS, DEFAULT_BANK } from '../lib/ethiopian-banks'

export function UnpaidSalesPage() {
  const { sales, settleCreditSale } = useTenant()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSaleToSettle, setSelectedSaleToSettle] = useState(null)
  const [settleMethod, setSettleMethod] = useState('Cash') // 'Cash' | 'Banking'
  const [settleBank, setSettleBank] = useState(DEFAULT_BANK)

  // Filter only unpaid credit sales
  const unpaidSales = sales.filter(s => s.paymentMethod === 'Credit' && s.paymentStatus === 'Unpaid')

  // Search filter
  const filteredUnpaidSales = unpaidSales.filter(s => {
    const term = searchTerm.toLowerCase()
    return (
      s.invoiceNumber.toLowerCase().includes(term) ||
      (s.customerName && s.customerName.toLowerCase().includes(term)) ||
      (s.customerPhone && s.customerPhone.includes(term)) ||
      ((s.storeName || '')).toLowerCase().includes(term)
    )
  })

  // Total outstanding balance
  const totalOutstanding = unpaidSales.reduce((sum, s) => sum + s.totalAmount, 0)

  // Handle Settle Submit
  const handleSettleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSaleToSettle) return
    let bankName = null
    if (settleMethod === 'Banking') {
      const bObj = ETHIOPIAN_PAYMENT_PROVIDERS.find(b => b.id === settleBank)
      bankName = bObj ? bObj.name : settleBank
    }
    const saleInfo = { ...selectedSaleToSettle }
    await settleCreditSale(selectedSaleToSettle.id, settleMethod, bankName, currentUser)
    setSelectedSaleToSettle(null)
    toast.success(
      'Credit Debt Settled',
      `Payment of ${formatCurrency(saleInfo.totalAmount)} recorded for Invoice #${saleInfo.invoiceNumber} (${saleInfo.customerName || 'Customer'}).`
    )
  }

  // Export to Excel
  const handleExport = () => {
    const data = filteredUnpaidSales.map(s => ({
      Invoice: s.invoiceNumber,
      Customer: s.customerName || 'N/A',
      Phone: s.customerPhone || 'N/A',
      Date: formatDate(s.timestamp),
      Store: s.storeName,
      Salesperson: s.salespersonName,
      OutstandingAmount: s.totalAmount,
    }))
    exportToExcel(data, 'OMESTOCK_Unpaid_Credit_Sales')
    toast.success('Report Exported', 'Unpaid credit sales exported to Excel.')
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClockAlert className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            Unpaid Sales
          </h1>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-amber-50/70 border-amber-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Total Outstanding Credit</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-950 mt-1">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              <Banknote className="w-6 h-6 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Customers</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{unpaidSales.length} Debtors</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <ClockAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input - Full Width on Mobile */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search customer name, phone, invoice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
        />
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredUnpaidSales.map((sale) => (
          <Card key={sale.id} className="border-amber-200/90 shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400">{sale.invoiceNumber}</span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{sale.customerName || 'Walk-in Customer'}</h3>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-amber-700">{formatCurrency(sale.totalAmount)}</div>
                  <Badge variant="warning" className="text-[10px]">Unpaid Credit</Badge>
                </div>
              </div>

              {sale.customerPhone && (
                <div className="pt-1">
                  <a
                    href={`tel:${sale.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 touch-manipulation active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call: {sale.customerPhone}</span>
                  </a>
                </div>
              )}

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>{sale.storeName} &bull; by {sale.salespersonName}</span>
                <span>{formatDate(sale.timestamp)}</span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedSaleToSettle(sale)}
                className="w-full min-h-[44px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                <span>Settle Payment Now</span>
              </Button>
            </CardContent>
          </Card>
        ))}

        {filteredUnpaidSales.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6">
            {searchTerm ? 'No matching unpaid credit accounts found' : 'All clear! No unpaid credit sales pending.'}
          </div>
        )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <Card className="hidden md:block">
        <CardHeader className="py-3.5 px-6 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Open Credit Accounts ({filteredUnpaidSales.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer / Debtor</th>
                <th className="px-4 py-3 font-medium">Store & Staff</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Credit Balance</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUnpaidSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {sale.invoiceNumber}
                    <div className="text-[10px] text-amber-700 font-normal">Credit Sale</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{sale.customerName || 'Unknown Customer'}</div>
                    {sale.customerPhone && (
                      <a href={`tel:${sale.customerPhone}`} className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{sale.customerPhone}</span>
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div>{sale.storeName}</div>
                    <div className="text-[10px] text-slate-400">Sold by {sale.salespersonName}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {formatDate(sale.timestamp)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-amber-700 text-sm">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setSelectedSaleToSettle(sale)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 min-h-[36px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Settle Payment</span>
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUnpaidSales.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    {searchTerm ? 'No matching unpaid credit sales found' : 'All clear! No unpaid credit sales pending.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Settle Payment Slide-Up Modal */}
      {selectedSaleToSettle && (
        <Modal
          isOpen={Boolean(selectedSaleToSettle)}
          onClose={() => setSelectedSaleToSettle(null)}
          title={`Settle ${selectedSaleToSettle.invoiceNumber}`}
        >
          <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedSaleToSettle.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-200/80 mt-1 pt-1.5">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-extrabold text-slate-900 text-base">{formatCurrency(selectedSaleToSettle.totalAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Received Settlement Via:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'Banking'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSettleMethod(method)}
                    className={`p-3 rounded-xl border font-bold text-xs text-center transition-all touch-manipulation min-h-[44px] ${
                      settleMethod === method
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {settleMethod === 'Banking' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-blue-900">Received in Bank / Digital Wallet:</label>
                <select
                  value={settleBank}
                  onChange={(e) => setSettleBank(e.target.value)}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold"
                >
                  {ETHIOPIAN_PAYMENT_PROVIDERS.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="md" onClick={() => setSelectedSaleToSettle(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
                Confirm & Mark as Paid
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
