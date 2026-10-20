import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { createStaff, updateStaff } from '@/services/adminService'
import { useToast } from '@/store/toastStore'
import { KYU_FACULTIES } from '@/utils/constants'

const ROLE_OPTIONS = [
  { value: 'reception', label: 'Receptionist' },
  { value: 'doctor',    label: 'Doctor' },
  { value: 'lab',       label: 'Lab Technician' },
  { value: 'pharmacy',  label: 'Pharmacist' },
  { value: 'injection', label: 'Injection Nurse' },
  { value: 'dental',    label: 'Dental Officer' },
  { value: 'records',   label: 'Records Officer' },
  { value: 'admin',     label: 'Admin' },
]

const DEPT_OPTIONS = [
  'Administration',
  'Outpatient / Consultation',
  'Laboratory',
  'Pharmacy',
  'Injection Room',
  'Dental Clinic',
  'Data & Records',
]

export default function StaffModal({ staff, onClose, onSuccess }) {
  const toast   = useToast()
  const isEdit  = Boolean(staff)

  const [form, setForm] = useState({
    name:       staff?.name     || '',
    username:   staff?.username || '',
    email:      staff?.email    || '',
    role:       staff?.role     || '',
    department: staff?.department || '',
    password:   '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }))

  const handleSubmit = async () => {
    if (!form.name.trim())     { setError('Full name is required.'); return }
    if (!form.username.trim()) { setError('Username is required.'); return }
    if (!form.role)            { setError('Role is required.'); return }
    if (!isEdit && !form.password.trim()) { setError('Password is required for new accounts.'); return }

    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        const updates = { name: form.name, email: form.email, role: form.role, department: form.department }
        if (form.password) updates.password = form.password
        await updateStaff(staff.id, updates)
        toast.success(`${form.name}'s account updated`)
      } else {
        await createStaff({ ...form })
        toast.success(`Account created for ${form.name}`)
      }
      onSuccess()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Staff Account' : 'Add Staff Account'}</h2>
            <p className="text-sm text-gray-400">{isEdit ? `Editing ${staff.name}` : 'Create a new system user'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Full Name <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="form-input"
                placeholder="e.g. Dr. Paul Okullo"
              />
            </div>

            <div>
              <label className="form-label">Username <span className="text-red-500">*</span></label>
              <input
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                className="form-input"
                placeholder="e.g. doctor1"
                disabled={isEdit}
              />
              {isEdit && <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>}
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="form-input"
                placeholder="e.g. doctor@kyu.ac.ug"
              />
            </div>

            <div>
              <label className="form-label">Role <span className="text-red-500">*</span></label>
              <select value={form.role} onChange={(e) => set('role', e.target.value)} className="form-input">
                <option value="">Select role…</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)} className="form-input">
                <option value="">Select department…</option>
                {DEPT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">
                {isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="form-input pr-10"
                  placeholder={isEdit ? 'Leave blank to keep current password' : 'Set a strong password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {error && (
          <p className="mx-6 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg shrink-0">{error}</p>
        )}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100 shrink-0 gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
