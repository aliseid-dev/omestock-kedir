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
  DollarSign
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatDate, exportToExcel } from '../lib/utils'

export function AuditTrailPage() {
  const { auditLogs } = useTenant()
  const { isOwner, currentUser } = useAuth()
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

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction
    const matchesSearch =
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesAction && matchesSearch
  })

  // Export logs to Excel
  const handleExportExcel = () => {
    const exportData = filteredLogs.map(l => ({
      Timestamp: formatDate(l.timestamp),
      Actor: l.actorName,
      Role: l.role,
      ActionType: l.action,
      Description: l.description,
      Target: l.target || 'General',
    }))
    exportToExcel(exportData, 'OMESTOCK_Audit_Trail')
  }

  const getActionBadge = (action) => {
    switch (action) {
      case 'SALE_RECORDED':
        return <Badge variant="success">Sale</Badge>
      case 'WAREHOUSE_INBOUND':
        return <Badge variant="purple">Wh Inbound</Badge>
      case 'PRODUCT_CREATED':
        return <Badge variant="info">New Product</Badge>
      case 'STOCK_TRANSFER':
        return <Badge variant="purple">Transfer</Badge>
      case 'DIRECT_STORE_PURCHASE':
        return <Badge variant="info">Store Purchase</Badge>
      case 'CREDIT_SALE_SETTLED':
        return <Badge variant="warning">Debt Settled</Badge>
      case 'STAFF_CREATED':
      case 'STAFF_UPDATED':
        return <Badge variant="default">Staff</Badge>
      default:
        return <Badge variant="default">System</Badge>
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
            Immutable log of salesperson sales, stock transfers, and system actions
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
              { id: 'ALL', label: 'All' },
              { id: 'SALE_RECORDED', label: 'Sales' },
              { id: 'STOCK_TRANSFER', label: 'Transfers' },
              { id: 'DIRECT_STORE_PURCHASE', label: 'Purchases' },
              { id: 'CREDIT_SALE_SETTLED', label: 'Settled' },
            ].map(f => (
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

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search audit trail..."
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
          <CardTitle className="text-sm font-bold text-slate-900">
            Recorded Activity Events ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-3.5 sm:p-4 hover:bg-slate-50/60 transition-colors flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-900">{log.actorName}</span>
                  <Badge variant={log.role === 'owner' ? 'purple' : 'info'} className="text-[10px] py-0">
                    {log.role}
                  </Badge>
                  {getActionBadge(log.action)}
                </div>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  {log.description}
                </p>
                {log.target && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Target: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[10px]">{log.target}</code>
                  </p>
                )}
              </div>

              <div className="text-right text-[10px] sm:text-[11px] text-slate-400 shrink-0">
                {formatDate(log.timestamp)}
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching activity logged
            </div>
          )}
        </div>
      </Card>

    </div>
  )
}
