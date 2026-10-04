import React, { useState } from 'react'
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
    rejectApprovalRequest
  } = useTenant()

  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'history'
  const [processingId, setProcessingId] = useState(null)
  const [rejectPromptId, setRejectPromptId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const pendingCount = pendingApprovals?.length || 0
  const historyList = approvalHistory || []

  const handleApprove = async (req) => {
    setProcessingId(req.id)
    try {
      await approveApprovalRequest(req.id)
      toast.success(
        'Request Approved',
        `Stock transfer/purchase for "${req.items?.[0]?.productName || 'items'}" has been approved and applied.`
      )
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
    <div className="space-y-5 pb-24 sm:pb-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
              Notifications & Requests
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review staff inventory requests, stock transfers, and automated alerts.
            </p>
          </div>
        </div>

        {/* Telegram Integration Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>Telegram Sync Active</span>
        </div>
      </div>

      {/* Tabs Switcher: Pending vs History */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[11px]">
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
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
                  <h3 className="font-extrabold text-slate-900 text-base">You're all caught up!</h3>
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
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Request Top Bar: Type + Timestamp */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isTransfer ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {isTransfer ? <Package className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm sm:text-base">
                            {isTransfer ? 'Stock Transfer Request' : 'Direct Purchase Inflow'}
                          </span>
                          <Badge
                            variant={isTransfer ? 'blue' : 'purple'}
                            className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider"
                          >
                            {isTransfer ? 'Transfer' : 'Purchase'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>
                            Requested by <strong className="text-slate-800">{req.requestedByUserName}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(req.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {req.totalCost !== undefined && req.totalCost > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cost</span>
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {req.totalCost.toLocaleString()} ETB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Route & Destination Details */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    {isTransfer ? (
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                          {req.sourceLocationName || 'Warehouse'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-emerald-800">
                          {req.destinationLocationName || 'Store 1'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 text-slate-700">
                        <div>
                          <span className="text-slate-400 font-semibold">Destination:</span>{' '}
                          <strong className="text-slate-900">{req.destinationLocationName || 'Store'}</strong>
                        </div>
                        {req.supplierName && (
                          <div>
                            <span className="text-slate-400 font-semibold">Supplier:</span>{' '}
                            <strong className="text-slate-900">{req.supplierName}</strong>
                          </div>
                        )}
                        {req.paymentMethod && (
                          <div>
                            <span className="text-slate-400 font-semibold">Payment:</span>{' '}
                            <strong className="text-slate-900">{req.paymentMethod}</strong>
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

                  {/* Itemized Manifest List */}
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
                            {it.quantity} units {it.costPerUnit ? `@ ${it.costPerUnit.toLocaleString()} ETB` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons for Owner */}
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
                          className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRejectPromptId(null)
                              setRejectReason('')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleReject(req)}
                          >
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="secondary"
                          size="md"
                          disabled={isProcessing}
                          onClick={() => setRejectPromptId(req.id)}
                          className="text-rose-700 hover:bg-rose-50 border-rose-200 font-bold"
                        >
                          <X className="w-4 h-4 mr-1 text-rose-500" />
                          <span>Reject</span>
                        </Button>

                        <Button
                          variant="primary"
                          size="md"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs"
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
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isApproved ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900 text-sm">
                        {isTransfer ? 'Stock Transfer' : 'Direct Purchase'}
                      </span>
                      <Badge
                        variant={isApproved ? 'success' : 'danger'}
                        className="text-[10px] px-2 py-0.2 font-bold uppercase tracking-wider"
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <span className="text-[11px] text-slate-400">
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

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                    <span>
                      Items: <strong>{req.items?.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}</strong>
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
