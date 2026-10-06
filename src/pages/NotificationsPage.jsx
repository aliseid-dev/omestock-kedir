import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Package,
  ShoppingCart,
  Send,
  Check,
  X,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { isOwner } = useAuth()
  const { toast } = useToast()
  const {
    pendingApprovals,
    approvalHistory,
    approveApprovalRequest,
    rejectApprovalRequest,
    products,
    telegramSubscribers = [],
    getTelegramBotInfo,
  } = useTenant()

  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'history'
  const [processingId, setProcessingId] = useState(null)
  const [rejectPromptId, setRejectPromptId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approvalConfigs, setApprovalConfigs] = useState({})
  const [botUsername, setBotUsername] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Fetch Bot Username for easy 1-click sharing
  useEffect(() => {
    if (getTelegramBotInfo) {
      getTelegramBotInfo()
        .then((data) => {
          if (data?.ok && data.result?.username) {
            setBotUsername(data.result.username)
          }
        })
        .catch(() => {})
    }
  }, [getTelegramBotInfo])

  const pendingCount = pendingApprovals?.length || 0
  const historyList = approvalHistory || []

  const getItemConfig = (reqId, it, idx) => {
    const itemKey = `${reqId}_${it.productId || idx}`
    if (approvalConfigs[itemKey]) {
      return approvalConfigs[itemKey]
    }
    const matchedProd = products?.find(
      (p) =>
        p.id === it.productId ||
        (it.productName && p.name?.toLowerCase().trim() === it.productName?.toLowerCase().trim())
    )
    const cost = it.costPerUnit || matchedProd?.costPrice || 0

    // Smart selling price calculation:
    // If it.sellingPrice was passed and is strictly above cost and not the dummy 30 (unless cost is <= 24), use it.
    let defaultSellingPrice = it.sellingPrice
    if (
      !defaultSellingPrice ||
      (cost > 25 && defaultSellingPrice === 30) ||
      (cost > 0 && defaultSellingPrice <= cost)
    ) {
      defaultSellingPrice =
        matchedProd?.sellingPrice && matchedProd.sellingPrice > cost
          ? matchedProd.sellingPrice
          : cost > 0
          ? Math.round(cost * 1.25)
          : 3500
    }

    const defaultMinStock = it.minStockThreshold || matchedProd?.minStockThreshold || 5
    return {
      sellingPrice: defaultSellingPrice,
      minStockThreshold: defaultMinStock,
    }
  }

  const handleUpdateItemConfig = (reqId, it, idx, field, value) => {
    const itemKey = `${reqId}_${it.productId || idx}`
    const current = getItemConfig(reqId, it, idx)
    setApprovalConfigs((prev) => ({
      ...prev,
      [itemKey]: {
        ...current,
        [field]: value,
      },
    }))
  }

  const handleApprove = async (req) => {
    setProcessingId(req.id)
    try {
      const productConfigs = (req.items || []).map((it, idx) => {
        const cfg = getItemConfig(req.id, it, idx)
        return {
          productId: it.productId,
          sellingPrice: parseFloat(cfg.sellingPrice) || undefined,
          minStockThreshold: parseInt(cfg.minStockThreshold, 10) || undefined,
          costPrice: it.costPerUnit || undefined,
          unit: it.unit || undefined,
        }
      })

      await approveApprovalRequest(req.id, productConfigs)
      toast.success('Approved Successfully', 'Stock has been updated automatically.')
    } catch (err) {
      toast.error('Approval Failed', err.message || 'Could not approve request.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (req) => {
    setProcessingId(req.id)
    try {
      await rejectApprovalRequest(req.id, rejectReason.trim() || 'Rejected by Owner in App')
      toast.info('Request Rejected', 'The request has been rejected. No stock changes applied.')
      setRejectPromptId(null)
      setRejectReason('')
    } catch (err) {
      toast.error('Rejection Failed', err.message || 'Could not reject request.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 pb-36 sm:pb-12 max-w-4xl mx-auto px-1 sm:px-0 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-1.5 truncate">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
              Notifications & Requests
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block mt-0.5">
              Review staff inventory requests, stock transfers, and automated alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Telegram 1-Tap Connect Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-3.5 sm:p-5 text-white shadow-xs border border-indigo-900/40 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-black text-xs sm:text-sm uppercase tracking-wide text-blue-200">
              Telegram Approvals
            </span>
            <span className="bg-blue-800/80 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-600/50">
              {telegramSubscribers.length} Connected Approver{telegramSubscribers.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-blue-100/90 leading-relaxed max-w-xl">
            Accept and reject stock transfers and direct purchases with 1 tap from your phone.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer min-h-[38px]"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Open @{botUsername}</span>
            </a>
          )}
          
        </div>
      </div>

      {/* Tabs Switcher: Pending vs History */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px]">
              {pendingCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>History & Logs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">
            {historyList.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: PENDING APPROVAL REQUESTS ─── */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingCount === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-white">
              <CardContent className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">You&apos;re all caught up!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    There are no pending stock transfer or purchase approval requests requiring your review.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/inventory"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <span>View Stock Inventory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((req) => {
              const isTransfer = req.type === 'transfer'
              const isProcessing = processingId === req.id
              const isRejectingThis = rejectPromptId === req.id

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
                >
                  {/* Request Top Bar: Icon, Title, Badge, Time, Total Cost */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isTransfer ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {isTransfer ? <Package className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                        </div>
                        <span className="font-black text-slate-900 text-sm sm:text-base truncate">
                          {isTransfer ? 'Stock Transfer' : 'Direct Purchase'}
                        </span>
                        <Badge
                          variant={isTransfer ? 'info' : 'purple'}
                          className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider shrink-0"
                        >
                          {isTransfer ? 'Transfer' : 'Purchase'}
                        </Badge>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Requester & Cost Row */}
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                      <span className="text-slate-500 truncate">
                        Requested by <strong className="text-slate-900">{req.requestedByUserName}</strong>
                      </span>
                      {req.totalCost !== undefined && req.totalCost > 0 && (
                        <div className="text-right shrink-0">
                          <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs border border-slate-200/70">
                            {req.totalCost.toLocaleString()} ETB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route & Destination Details (Structured Micro-Grid) */}
                  <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    {isTransfer ? (
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                          {req.sourceLocationName || 'Warehouse'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-emerald-800">
                          {req.destinationLocationName || 'Store 1'}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
                          <span className="font-extrabold text-slate-800">{req.destinationLocationName || 'Store 1'}</span>
                        </div>
                        {req.paymentMethod && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                            <span className="font-extrabold text-slate-800">{req.paymentMethod}</span>
                          </div>
                        )}
                        {req.supplierName && (
                          <div className="col-span-2 pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Supplier</span>
                            <span className="font-bold text-slate-700 truncate block">{req.supplierName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {req.notes && (
                      <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200/60">
                        Note: {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Itemized Manifest List / Owner Pricing Configuration */}
                  {isOwner && !isTransfer ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Review cost and set retail selling price & stock alert:</span>
                      </div>

                      <div className="space-y-2">
                        {req.items?.map((it, idx) => {
                          const cfg = getItemConfig(req.id, it, idx)
                          return (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                            >
                              {/* Product Name & Quantity Badge */}
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-black text-slate-900 text-sm truncate">{it.productName}</span>
                                <span className="text-[11px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 shrink-0">
                                  {it.quantity} {it.unit || 'Piece'}
                                </span>
                              </div>

                              {/* Purchase Cost & Subtotal */}
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>
                                  Cost: <strong className="text-slate-800">{it.costPerUnit ? `${it.costPerUnit.toLocaleString()} ETB` : '-'}</strong>
                                </span>
                                {it.quantity > 1 && it.costPerUnit && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Subtotal: <strong className="text-slate-900">{((it.costPerUnit || 0) * (it.quantity || 1)).toLocaleString()} ETB</strong>
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Pricing & Min Stock Inputs */}
                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/60">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Selling Price (ETB) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={cfg.sellingPrice}
                                    onChange={(e) =>
                                      handleUpdateItemConfig(req.id, it, idx, 'sellingPrice', e.target.value)
                                    }
                                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[38px]"
                                    placeholder="e.g. 3500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Min Stock Alert
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={cfg.minStockThreshold}
                                    onChange={(e) =>
                                      handleUpdateItemConfig(req.id, it, idx, 'minStockThreshold', e.target.value)
                                    }
                                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[38px]"
                                    placeholder="e.g. 5"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-200/70 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-100/70 px-3 py-1.5 font-bold text-slate-600 text-[11px] flex justify-between">
                        <span>Item Name</span>
                        <span>Quantity & Rate</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {req.items?.map((it, idx) => (
                          <div key={idx} className="px-3 py-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{it.productName}</span>
                            <span className="font-extrabold text-slate-800">
                              {it.quantity} {it.unit || 'units'} {it.costPerUnit ? `@ ${it.costPerUnit.toLocaleString()} ETB` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Owner (50/50 Mobile Grid) */}
                  {isOwner ? (
                    isRejectingThis ? (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2.5 animate-in fade-in">
                        <label className="block text-xs font-bold text-rose-900">
                          Reason for rejection (optional):
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Price too high, stock already available..."
                          className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() => {
                              setRejectPromptId(null)
                              setRejectReason('')
                            }}
                            className="w-full text-slate-700 min-h-[42px] font-bold"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="danger"
                            size="md"
                            disabled={isProcessing}
                            onClick={() => handleReject(req)}
                            className="w-full font-bold min-h-[42px]"
                          >
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="secondary"
                          size="md"
                          disabled={isProcessing}
                          onClick={() => setRejectPromptId(req.id)}
                          className="w-full flex items-center justify-center text-rose-700 bg-rose-50/70 hover:bg-rose-100 border-rose-200 font-bold min-h-[44px] rounded-xl text-xs sm:text-sm cursor-pointer"
                        >
                          <X className="w-4 h-4 mr-1 text-rose-500" />
                          <span>Reject</span>
                        </Button>

                        <Button
                          variant="primary"
                          size="md"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req)}
                          className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black shadow-xs min-h-[44px] rounded-xl text-xs sm:text-sm cursor-pointer"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          <span>{isProcessing ? 'Applying…' : 'Approve & Apply'}</span>
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="text-right text-[11px] font-bold text-amber-600 italic">
                      Awaiting review by Business Owner (via Web or Telegram).
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ─── TAB 2: HISTORY & LOGS ─── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {historyList.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-60" />
                <p className="font-bold text-slate-700 text-sm">No approval history yet</p>
                <p className="text-xs">Past approved and rejected requests will be logged here.</p>
              </CardContent>
            </Card>
          ) : (
            historyList.map((req) => {
              const isApproved = req.status === 'approved'
              const isTransfer = req.type === 'transfer'

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-2 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isApproved ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {isTransfer ? 'Stock Transfer' : 'Direct Purchase'}
                      </span>
                      <Badge
                        variant={isApproved ? 'success' : 'danger'}
                        className="text-[10px] px-2 py-0.2 font-bold uppercase tracking-wider shrink-0"
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0">
                      {req.reviewedAt
                        ? new Date(req.reviewedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                    <span>
                      Items: <strong>{req.items?.map((i) => `${i.productName} (${i.quantity} ${i.unit || 'units'})`).join(', ')}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {isTransfer
                        ? `${req.sourceLocationName || 'Warehouse'} ➔ ${req.destinationLocationName || 'Store'}`
                        : `Inbound to ${req.destinationLocationName || 'Store'}`}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Requested by {req.requestedByUserName}</span>
                    <span>
                      Reviewed by {req.reviewedByUserName || 'Owner'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
