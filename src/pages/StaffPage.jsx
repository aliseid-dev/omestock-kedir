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
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'

export function StaffPage() {
  const { staff, stores, saveStaffMember, companyCode, approveStaffMember, rejectStaffMember } = useTenant()
  const { isOwner, currentUser } = useAuth()

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
    })
    setIsModalOpen(true)
  }

  const handleToggleStatus = (member) => {
    saveStaffMember({ ...member, active: !member.active }, currentUser)
  }

  const handleApprove = async (memberId) => {
    setProcessingId(memberId)
    try {
      const chosenStoreId = assignedStores[memberId] || stores[0]?.id || null
      await approveStaffMember(memberId, chosenStoreId)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (memberId) => {
    setProcessingId(memberId)
    try {
      await rejectStaffMember(memberId)
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
        email: formData.email,
        role: formData.role,
        status: formData.status,
        storeId: formData.role === 'salesperson' ? formData.storeId : null,
        passcode: formData.passcode || '1234',
        active: formData.status === 'approved' ? formData.active : false,
      },
      currentUser
    )
    setIsModalOpen(false)
  }

  // Filter pending staff awaiting owner approval
  const pendingStaff = staff.filter(
    s => s.role === 'salesperson' && (s.status === 'pending' || (s.active === false && s.status !== 'approved' && s.status !== 'rejected'))
  )

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            Staff & Commission Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Owner controls for sales staff accounts, authorization, and commissions
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-bold w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Salesperson</span>
        </Button>
      </div>

      {/* 6-Digit Company Code Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Staff Sign-Up Code
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Share With Sales Staff
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Sales staff must enter this 6-digit organization code during registration to bind to your store.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-slate-900 bg-white px-3.5 py-1.5 rounded-2xl border border-emerald-200 shadow-2xs">
            {companyCode || '------'}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="Copy 6-digit code"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending Approval Requests Section */}
      {pendingStaff.length > 0 && (
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 shadow-xs">
          <CardHeader className="pb-3 border-b border-amber-200/70">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Salesperson Approvals ({pendingStaff.length})
              </CardTitle>
              <Badge variant="warning" className="text-[10px] font-bold">
                Action Required
              </Badge>
            </div>
            <p className="text-xs text-amber-800/90 mt-1">
              These staff members entered your 6-digit company code and are currently locked out awaiting your approval.
            </p>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {pendingStaff.map((member) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                    {member.name?.slice(0, 2).toUpperCase() || 'SP'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                      <Badge variant="warning" className="text-[10px] font-bold">
                        Pending Approval
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{member.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Registered: {member.createdAt ? new Date(member.createdAt).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 md:pt-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Assign Store:</span>
                    <select
                      value={assignedStores[member.id] || member.storeId || stores[0]?.id || ''}
                      onChange={(e) => setAssignedStores({ ...assignedStores, [member.id]: e.target.value })}
                      className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={processingId === member.id}
                      onClick={() => handleApprove(member.id)}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{processingId === member.id ? 'Approving...' : 'Approve Access'}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === member.id}
                      onClick={() => handleReject(member.id)}
                      className="flex-1 sm:flex-initial text-rose-700 border-rose-200 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {staff.map((member) => {
          const assignedStore = stores.find(s => s.id === member.storeId)
          const isPending = member.status === 'pending' || (member.role === 'salesperson' && member.active === false && member.status !== 'approved' && member.status !== 'rejected')
          const isRejected = member.status === 'rejected'

          return (
            <Card key={member.id} className="border-slate-200/90 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={member.role === 'owner' ? 'purple' : 'info'}>
                      {member.role === 'owner' ? 'Owner' : 'Salesperson'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Store</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {assignedStore ? assignedStore.name : 'All'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Status</span>
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-500" /> Rejected
                      </span>
                    ) : member.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" /> Disabled
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {isPending && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={processingId === member.id}
                      onClick={() => handleApprove(member.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      <span>Approve</span>
                    </Button>
                  )}

                  {!isPending && member.role !== 'owner' && (
                    <button
                      onClick={() => handleToggleStatus(member)}
                      className="touch-manipulation"
                    >
                      {member.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          Disabled
                        </span>
                      )}
                    </button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(member)}
                    className="min-h-[36px] px-2.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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

      {/* Add / Edit Staff Slide-Up Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Edit: ${editingStaff.name}` : 'Add Salesperson Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name:</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address:</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] text-sm"
              placeholder="e.g. john@omedla.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role:</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              >
                <option value="salesperson">Salesperson</option>
                <option value="owner">Owner / Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status:</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {formData.role === 'salesperson' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Retail Store:</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px]"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}


          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="w-full sm:w-auto font-bold min-h-[44px]">
              Save Staff Account
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
