import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Percent,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  KeyRound,
  Copy,
  Check,
  Clock,
  ClockAlert,
  UserCheck,
  UserX,
  AlertCircle,
  Store
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'

export function StaffPage() {
  const { staff, stores, sales, saveStaffMember, companyCode, approveStaffMember, rejectStaffMember } = useTenant()
  const { isOwner, currentUser } = useAuth()
  const { toast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [assignedStores, setAssignedStores] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'salesperson',
    status: 'approved',
    storeId: stores[0]?.id || '',
    passcode: '1234',
    active: true,
    allowCreditSales: true,
  })

  // Strict Owner Guard: If not owner, show Access Denied
  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-500">
          Staff management and commission adjustments are strictly restricted to Business Owners. Please switch to an Owner account to manage staff.
        </p>
      </div>
    )
  }

  const handleCopyCode = () => {
    if (!companyCode) return
    navigator.clipboard.writeText(companyCode)
    setCopiedCode(true)
    toast.info('Code Copied', 'Company invitation code copied to clipboard.')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleOpenAdd = () => {
    setEditingStaff(null)
    setFormData({
      name: '',
      email: '',
      role: 'salesperson',
      status: 'approved',
      storeId: stores[0]?.id || '',
      passcode: '1234',
      active: true,
      allowCreditSales: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (member) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status || (member.active ? 'approved' : 'pending'),
      storeId: member.storeId || stores[0]?.id || '',
      passcode: member.passcode || '1234',
      active: member.active ?? true,
      allowCreditSales: member.allowCreditSales ?? true,
    })
    setIsModalOpen(true)
  }

  const handleToggleStatus = (member) => {
    const nextActive = !member.active
    saveStaffMember({ ...member, active: nextActive }, currentUser)
    toast.success('Status Updated', `${member.name} is now ${nextActive ? 'Active' : 'Deactivated'}.`)
  }

  const handleApprove = async (memberId) => {
    setProcessingId(memberId)
    try {
      const chosenStoreId = assignedStores[memberId] || stores[0]?.id || null
      const stObj = stores.find(s => s.id === chosenStoreId)
      const member = staff.find(s => s.id === memberId)
      await approveStaffMember(memberId, chosenStoreId)
      toast.success(
        'Staff Approved',
        `${member?.name || 'Staff member'} approved and assigned to ${stObj?.name || 'store'}.`
      )
    } catch (err) {
      console.error(err)
      toast.error('Approval Failed', 'Could not approve staff member.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (memberId) => {
    setProcessingId(memberId)
    try {
      const member = staff.find(s => s.id === memberId)
      await rejectStaffMember(memberId)
      toast.info('Request Rejected', `Staff request for ${member?.name || 'member'} was rejected.`)
    } catch (err) {
      console.error(err)
      toast.error('Action Failed', 'Could not reject staff member.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await saveStaffMember(
      {
        ...(editingStaff ? editingStaff : {}),
        name: formData.name,
        email: editingStaff?.email || formData.email,
        role: formData.role,
        status: formData.status,
        storeId: formData.role === 'salesperson' ? formData.storeId : null,
        passcode: formData.passcode || '1234',
        active: formData.status === 'approved' ? (formData.active ?? true) : false,
        allowCreditSales: formData.role === 'owner' ? true : (formData.allowCreditSales ?? true),
      },
      currentUser
    )
    setIsModalOpen(false)
    toast.success(
      editingStaff ? 'Staff Updated' : 'Staff Added',
      `Saved profile for ${formData.name}.`
    )
  }

  // Filter pending staff awaiting owner approval
  const pendingStaff = staff.filter(
    s => s.role === 'salesperson' && (s.status === 'pending' || (s.active === false && s.status !== 'approved' && s.status !== 'rejected'))
  )

  // Unpaid sales for the staff member currently being edited
  const editingStaffUnpaidSales = editingStaff && sales
    ? sales.filter(s => (s.salespersonId === editingStaff.id || s.salespersonId === editingStaff.userId || s.salespersonName === editingStaff.name) && s.paymentMethod === 'Credit' && s.paymentStatus === 'Unpaid')
    : []
  const editingStaffUnpaidTotal = editingStaffUnpaidSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            Staff Control
          </h1>
        </div>
      </div>

    

      {/* Pending Approval Requests Section */}
      {pendingStaff.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200/90 shadow-xs overflow-hidden">
          {/* Header Strip */}
          <div className="bg-amber-500/10 px-4 sm:px-5 py-3 border-b border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                Pending Staff Approvals
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/60">
              {pendingStaff.length} Awaiting Review
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
            {pendingStaff.map((member, index) => {
              const selectedStoreId = assignedStores[member.id] || member.storeId || stores[0]?.id || ''
              const isProcessing = processingId === member.id

              return (
                <div
                  key={member.id}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${index > 0 ? 'pt-4' : ''}`}
                >
                  {/* Left: Staff Identity */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-black text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
                      {member.name?.slice(0, 2).toUpperCase() || 'SP'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{member.name}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{member.email}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Registered: {member.createdAt ? new Date(member.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Store Assignment Tile & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
                    {/* Store Selector Tile */}
                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:w-60 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-1">
                          Assign Store
                        </label>
                        <select
                          value={selectedStoreId}
                          onChange={(e) => setAssignedStores({ ...assignedStores, [member.id]: e.target.value })}
                          className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                        >
                          {stores.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReject(member.id)}
                        className="h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Reject application"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(member.id)}
                        className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-black hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{isProcessing ? 'Approving...' : 'Approve & Assign'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-2.5">
        {staff.map((member) => {
          const assignedStore = stores.find(s => s.id === member.storeId)
          const isPending = member.status === 'pending' || (member.role === 'salesperson' && member.active === false && member.status !== 'approved' && member.status !== 'rejected')
          const isRejected = member.status === 'rejected'

          return (
            <div
              key={member.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3"
            >
              {/* Left: Avatar + Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                  {member.name ? member.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                    {member.role === 'owner' ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        Owner
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        Staff
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{member.email}</p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                    <Store className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{assignedStore ? assignedStore.name : 'All Locations'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions / Status */}
              <div className="flex items-center gap-2 shrink-0">
                {isPending ? (
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={processingId === member.id}
                    className="h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Approve</span>
                  </button>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                    <XCircle className="w-3 h-3 text-rose-500" /> Rejected
                  </span>
                ) : member.role !== 'owner' ? (
                  <button
                    onClick={() => handleToggleStatus(member)}
                    className="touch-manipulation cursor-pointer"
                    title="Toggle active status"
                  >
                    {member.active ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Disabled
                      </span>
                    )}
                  </button>
                ) : null}

                <button
                  onClick={() => handleOpenEdit(member)}
                  className="w-8 h-8 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Edit staff details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <Card className="hidden md:block">
        <CardHeader className="py-3.5 px-6 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Active Staff Directory ({staff.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Assigned Store</th>
                <th className="px-4 py-3 font-medium text-center">Approval Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staff.map((member) => {
                const assignedStore = stores.find(s => s.id === member.storeId)
                const isPending = member.status === 'pending' || (member.role === 'salesperson' && member.active === false && member.status !== 'approved' && member.status !== 'rejected')
                const isRejected = member.status === 'rejected'

                return (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{member.name}</div>
                      <div className="text-[11px] text-slate-400">{member.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={member.role === 'owner' ? 'purple' : 'info'}>
                        {member.role === 'owner' ? 'Owner / Admin' : 'Salesperson'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {assignedStore ? assignedStore.name : 'All Locations / Central'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isPending ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                          </span>
                          <button
                            onClick={() => handleApprove(member.id)}
                            disabled={processingId === member.id}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 transition-colors cursor-pointer"
                          >
                            Approve Now
                          </button>
                        </div>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" /> Rejected
                        </span>
                      ) : (
                        <button
                          onClick={() => member.role !== 'owner' && handleToggleStatus(member)}
                          disabled={member.role === 'owner'}
                          className="cursor-pointer"
                          title={member.role === 'owner' ? 'Owner account cannot be disabled' : 'Click to toggle active status'}
                        >
                          {member.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved (Active)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" /> Disabled
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(member)}
                        className="text-xs p-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500 hover:text-slate-900" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Staff Access Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Manage Access: ${editingStaff.name}` : 'Staff Access & Assignment'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Staff Member Identity Banner (Read-only Login Email) */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
              {formData.name ? formData.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 truncate">{formData.name}</h4>
              <div className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-mono">{formData.email}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-auto shrink-0">
                  Login Email
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name:</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm font-medium"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="pt-1 border-t border-slate-100">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Access & Permissions
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Access Level:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-xs font-semibold cursor-pointer"
                >
                  <option value="salesperson">Salesperson</option>
                  <option value="owner">Owner / Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approval Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-xs font-semibold cursor-pointer"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {formData.role === 'salesperson' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Retail Store:</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-xs font-semibold cursor-pointer"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.status === 'approved' && formData.role !== 'owner' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Active Staff Access</div>
                  <div className="text-[11px] text-slate-400">Allow this member to access POS and make sales</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.active ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                      formData.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Unpaid / Credit Sales Access Permission */}
              <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <div>
                  <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <ClockAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Allow Unpaid / Credit Sales</span>
                  </div>
                  <div className="text-[11px] text-amber-700">Authorize salesperson to issue goods on credit</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, allowCreditSales: !(formData.allowCreditSales ?? true) })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.allowCreditSales !== false ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                      formData.allowCreditSales !== false ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Pending Unpaid Debt Summary */}
              {editingStaffUnpaidTotal > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-amber-100/60 border border-amber-300/80 rounded-xl text-amber-950 text-xs">
                  <div className="flex items-center gap-2">
                    <ClockAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold">Recorded Customer Debt: </span>
                      <span className="font-extrabold text-amber-900">{formatCurrency(editingStaffUnpaidTotal)}</span>
                      <span className="text-amber-800 text-[11px] ml-1">
                        ({editingStaffUnpaidSales.length} open {editingStaffUnpaidSales.length === 1 ? 'debt' : 'debts'})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
              Save Access Settings
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
