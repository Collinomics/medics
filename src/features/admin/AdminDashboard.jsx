import { useState, useEffect } from 'react'
import {
  Users, CreditCard, Activity, UserCheck,
  RefreshCw, UserPlus, ToggleLeft, ToggleRight, Pencil,
  ShieldCheck, ClipboardList, CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  getSystemStats, getStaff, toggleStaffStatus,
  getPendingRegistrations, approveRegistration, rejectRegistration,
} from '@/services/adminService'
import { USE_MOCK } from '@/services/config'
import { useToast } from '@/store/toastStore'
import StaffModal from './StaffModal'

const ROLE_LABEL = {
  admin:     'Admin',
  reception: 'Receptionist',
  doctor:    'Doctor',
  lab:       'Lab Technician',
  pharmacy:  'Pharmacist',
  injection: 'Injection Nurse',
  dental:    'Dental Officer',
  records:   'Records Officer',
}

const ROLE_BADGE = {
  admin:     'badge-purple',
  reception: 'badge-blue',
  doctor:    'badge-blue',
  lab:       'badge-purple',
  pharmacy:  'badge-green',
  injection: 'badge-blue',
  dental:    'badge-amber',
  records:   'badge-purple',
}

export default function AdminDashboard() {
  const toast = useToast()
  const [activeTab, setActiveTab]   = useState('staff')
  const [stats, setStats]           = useState(null)
  const [staff, setStaff]           = useState([])
  const [pending, setPending]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [modalStaff, setModal]      = useState(undefined)
  const [expandedRow, setExpanded]  = useState(null)

  const load = async () => {
    setLoading(true)
    const [s, u, p] = await Promise.all([getSystemStats(), getStaff(), getPendingRegistrations()])
    setStats(s)
    setStaff(u)
    setPending(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id, name) => {
    try {
      const res = await approveRegistration(id)
      toast.success(`${name} approved — card ${res.medical_card_number} assigned`)
      setPending((prev) => prev.filter((p) => p.id !== id))
      setStats((s) => s ? { ...s, cards_issued: (s.cards_issued || 0) + 1 } : s)
    } catch {
      toast.error('Failed to approve. Try again.')
    }
  }

  const handleReject = async (id, name) => {
    try {
      await rejectRegistration(id)
      toast.info(`${name}'s registration rejected`)
      setPending((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to reject. Try again.')
    }
  }

  const handleToggle = async (user) => {
    const next = user.status === 'active' ? 'inactive' : 'active'
    await toggleStaffStatus(user.id)
    setStaff((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u))
    toast.info(`${user.name} marked as ${next}`)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" title="Refresh"><RefreshCw size={15} /></button>
          <button onClick={() => setModal(null)} className="btn-primary">
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients',  value: stats?.total_patients,  icon: Users,       color: 'text-blue-600 bg-blue-50' },
          { label: 'Visits Today',    value: stats?.visits_today,    icon: Activity,    color: 'text-primary-600 bg-primary-50' },
          { label: 'Active Staff',    value: stats?.active_staff,    icon: UserCheck,   color: 'text-green-600 bg-green-50' },
          { label: 'Cards Issued',    value: stats?.cards_issued,    icon: CreditCard,  color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : (value ?? 0)}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System status banner */}
      <div className={`card p-4 flex items-center gap-3 ${USE_MOCK ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${USE_MOCK ? 'bg-amber-100' : 'bg-green-100'}`}>
          <ShieldCheck size={18} className={USE_MOCK ? 'text-amber-600' : 'text-green-600'} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${USE_MOCK ? 'text-amber-800' : 'text-green-800'}`}>
            {USE_MOCK ? 'Running in Demo Mode' : 'System Running Normally'}
          </p>
          <p className={`text-xs mt-0.5 ${USE_MOCK ? 'text-amber-600' : 'text-green-600'}`}>
            {USE_MOCK
              ? <>Mock data active — flip <code className="bg-amber-100 px-1 rounded">USE_MOCK</code> in config to connect the backend.</>
              : 'All modules connected to the live database.'}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <UserCheck size={15} /> Staff Accounts
          <span className={`badge ${activeTab === 'staff' ? 'badge-blue' : 'badge-gray'}`}>{staff.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ClipboardList size={15} /> Pending Registrations
          {pending.length > 0 && <span className="badge badge-amber">{pending.length}</span>}
        </button>
      </div>

      {/* ── Staff Accounts ── */}
      {activeTab === 'staff' && (
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-800">Staff Accounts</h2>
          <span className="badge badge-blue">{staff.length} account{staff.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((user) => (
                  <StaffRow
                    key={user.id}
                    user={user}
                    onEdit={() => setModal(user)}
                    onToggle={() => handleToggle(user)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      )} {/* end staff tab */}

      {/* ── Pending Registrations ── */}
      {activeTab === 'pending' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-800">Pending Registrations</h2>
            <span className="badge badge-amber">{pending.length} awaiting review</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Loading…
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <CheckCircle size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No pending registrations. All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pending.map((p) => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                        {p.full_name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{p.full_name}</p>
                          {p.registration_source === 'reception'
                            ? <span className="badge badge-blue text-[10px] px-1.5 py-0.5">Registered by Reception</span>
                            : <span className="badge badge-gray text-[10px] px-1.5 py-0.5">Self-registered</span>
                          }
                        </div>
                        <p className="text-xs text-gray-500">
                          {p.reg_no || p.student_id || p.staff_number || '—'} · {p.person_type}
                          {p.course && ` · ${p.course}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Submitted {new Date(p.submitted_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpanded(expandedRow === p.id ? null : p.id)}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        {expandedRow === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button
                        onClick={() => handleReject(p.id, p.full_name)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(p.id, p.full_name)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
                      >
                        <CheckCircle size={13} /> Approve & Issue Card
                      </button>
                    </div>
                  </div>

                  {expandedRow === p.id && (
                    <div className="mt-3 ml-13 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 rounded-xl p-4 text-xs">
                      {[
                        ['Full Name',    p.full_name],
                        ['Type',         p.person_type],
                        ['Reg / Staff No', p.reg_no || p.staff_number || '—'],
                        ['Gender',       p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : '—'],
                        ['Date of Birth',p.date_of_birth || '—'],
                        ['Blood Group',  p.blood_group || '—'],
                        ['Faculty',      p.faculty || '—'],
                        ['Course',       p.course || '—'],
                        ['Year',         p.year_of_study ? `Year ${p.year_of_study}` : '—'],
                        ['Phone',        p.phone || '—'],
                        ['Email',        p.email || '—'],
                        ['Address',      p.home_address || '—'],
                        ['Next of Kin',  p.kin_name || '—'],
                        ['Kin Contact',  p.kin_contact || '—'],
                        ['Relationship', p.kin_relation || '—'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-gray-400 uppercase tracking-wider text-[10px]">{label}</p>
                          <p className="text-gray-700 font-medium mt-0.5 truncate">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff modal */}
      {modalStaff !== undefined && (
        <StaffModal
          staff={modalStaff}
          onClose={() => setModal(undefined)}
          onSuccess={() => { setModal(undefined); load() }}
        />
      )}
    </div>
  )
}

function StaffRow({ user, onEdit, onToggle }) {
  const isActive = user.status !== 'inactive'

  return (
    <tr>
      <td className="font-medium text-gray-900">{user.name}</td>
      <td>
        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {user.username}
        </span>
      </td>
      <td>
        <span className={`badge ${ROLE_BADGE[user.role] || 'badge-gray'}`}>
          {ROLE_LABEL[user.role] || user.role}
        </span>
      </td>
      <td className="text-sm text-gray-500">{user.department || '—'}</td>
      <td>
        <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Edit account"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600'
                : 'bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600'
            }`}
            title={isActive ? 'Deactivate account' : 'Activate account'}
          >
            {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
        </div>
      </td>
    </tr>
  )
}
