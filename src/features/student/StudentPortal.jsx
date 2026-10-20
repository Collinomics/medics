import { useState, useEffect } from 'react'
import {
  User, CreditCard, ClipboardList, Bell,
  Edit2, CheckCircle, Clock, ChevronDown,
  ChevronUp, FlaskConical, Pill, Syringe,
  Smile, Heart, Shield, Phone, Mail,
  MapPin, AlertCircle, ChevronRight,
} from 'lucide-react'
import MedicalCard from '@/components/MedicalCard'
import useAuthStore from '@/store/authStore'
import {
  getMyProfile, updateMyProfile,
  getMyVisits, getMyNotifications, markNotificationRead,
  uploadPhoto, deletePhoto,
} from '@/services/studentService'
import { useToast } from '@/store/toastStore'
import { getMedicalCardSettings } from '@/services/settingsService'

const REFERRED_ICONS = {
  lab:       { icon: FlaskConical, label: 'Lab',       color: 'text-purple-600 bg-purple-50 border-purple-100' },
  pharmacy:  { icon: Pill,         label: 'Pharmacy',  color: 'text-green-600  bg-green-50  border-green-100' },
  injection: { icon: Syringe,      label: 'Injection', color: 'text-blue-600   bg-blue-50   border-blue-100' },
  dental:    { icon: Smile,        label: 'Dental',    color: 'text-orange-600 bg-orange-50 border-orange-100' },
}

export default function StudentPortal() {
  const user  = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const toast = useToast()

  const [profile, setProfile]             = useState(null)
  const [visits, setVisits]               = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('overview')
  const [cardSettings, setCardSettings]   = useState(null)

  useEffect(() => {
    Promise.all([getMyProfile(), getMyVisits(), getMyNotifications(), getMedicalCardSettings().catch(() => null)])
      .then(([p, v, n, settings]) => { setProfile(p); setVisits(v); setNotifications(n); setCardSettings(settings); updateUser({ photo_url: p.photo_url }) })
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <Heart size={16} className="animate-pulse text-primary-400" /> Loading your health portal…
      </div>
    )
  }

  const cardIssued   = profile?.medical_card_status === 'issued'
  const cardPending  = profile?.medical_card_status === 'pending_verification'
  const cardRejected = profile?.medical_card_status === 'rejected'

  return (
    <div className="min-h-full bg-gradient-to-br from-primary-50 via-white to-teal-50/30">

      {/* Hero header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden min-[430px]:flex w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center shrink-0 text-2xl font-bold overflow-hidden">
              {profile?.photo_url
                ? <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                : (profile?.firstname?.[0] || user?.name?.[0] || '?').toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-200 text-sm">Welcome back</p>
              <h1 className="text-xl sm:text-2xl font-bold mt-0.5 truncate">
                {profile?.firstname} {profile?.lastname}
              </h1>
              <p className="text-primary-300 text-xs sm:text-sm mt-0.5 break-words">
                {profile?.reg_no || profile?.student_no || profile?.staff_no || user?.username}
                {profile?.course && ` · ${profile.course}`}
              </p>
            </div>
            <div className="shrink-0">
              {cardIssued ? (
                <div className="flex items-center gap-2 bg-green-400/20 border border-green-300/30 text-green-100 text-xs font-medium px-3 py-2 rounded-xl">
                  <Shield size={14} />
                  <span className="hidden sm:inline">Card Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-300/30 text-amber-100 text-xs font-medium px-3 py-2 rounded-xl">
                  <AlertCircle size={14} />
                  <span className="hidden sm:inline">Card Pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar inside hero */}
        <div className="max-w-3xl mx-auto px-2 sm:px-6 overflow-x-auto overflow-y-hidden sm:overflow-visible">
          <div className="flex min-w-max sm:min-w-0 gap-1 pb-0">
            {[
              { key: 'overview',      label: 'Overview' },
              { key: 'visits',        label: `Visits (${visits.length})` },
              { key: 'profile',       label: 'Profile' },
              { key: 'notifications', label: unreadCount > 0 ? `Inbox (${unreadCount})` : 'Inbox' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap font-medium transition-all border-b-2 -mb-px ${
                  activeTab === key
                    ? 'border-white text-white'
                    : 'border-transparent text-primary-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">

            {/* Medical card banner */}
            {cardPending && (
              <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <CreditCard size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Registration under review</p>
                  <p className="text-xs text-amber-600 mt-0.5">Your details have been submitted and are awaiting verification by the Medical Center admin. You will be notified once your card is assigned.</p>
                </div>
              </div>
            )}
            {cardRejected && (
              <div className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Registration not approved</p>
                  <p className="text-xs text-red-600 mt-0.5">Your registration was not approved. Please visit the Medical Center with your valid student/staff ID to resolve this.</p>
                </div>
              </div>
            )}
            {!cardIssued && !cardPending && !cardRejected && (
              <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <CreditCard size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Your medical card hasn't been issued yet</p>
                  <p className="text-xs text-amber-600 mt-0.5">Visit the Medical Center or register online to get your card.</p>
                </div>
              </div>
            )}

            {cardIssued && (
              <MedicalCard
                profile={profile}
                cardSettings={cardSettings}
                onPhotoChange={async (file) => {
                  if (file) {
                    const res = await uploadPhoto(file)
                    setProfile((p) => ({ ...p, photo_url: res.photo_url }))
                    updateUser({ photo_url: res.photo_url })
                  } else {
                    await deletePhoto()
                    setProfile((p) => ({ ...p, photo_url: null }))
                    updateUser({ photo_url: null })
                  }
                }}
              />
            )}

            {/* Stat tiles */}
            <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
              {[
                { label: 'Visits', value: visits.length, icon: ClipboardList, color: 'text-primary-600 bg-primary-50' },
                { label: 'Medical Card', value: cardIssued ? 'Active' : 'Pending', icon: CreditCard, color: cardIssued ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50' },
                { label: 'Unread', value: unreadCount || 'None', icon: Bell, color: unreadCount > 0 ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Most recent visit */}
            {visits.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Most Recent Visit</p>
                  <button onClick={() => setActiveTab('visits')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="p-5">
                  <VisitCard visit={visits[0]} />
                </div>
              </div>
            )}

            {/* Quick contact info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Contact Information</p>
              <div className="space-y-2">
                {[
                  { icon: Phone, value: profile?.contact || '—' },
                  { icon: Mail,  value: profile?.email   || '—' },
                  { icon: MapPin,value: profile?.home_address || '—' },
                ].map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-3 text-sm">
                    <Icon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Visits */}
        {activeTab === 'visits' && (
          <div className="space-y-3">
            {visits.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-16 text-gray-400">
                <ClipboardList size={36} className="mb-2 opacity-30" />
                <p className="text-sm">No visits recorded yet.</p>
              </div>
            ) : visits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <VisitCard visit={visit} />
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <EditProfileForm
            profile={profile}
            onSave={async (updates) => {
              const updated = await updateMyProfile(updates)
              setProfile(updated)
              toast.success('Profile updated successfully')
            }}
            cardIssued={cardIssued}
          />
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Notifications</p>
              {unreadCount > 0 && <span className="badge badge-red">{unreadCount} unread</span>}
            </div>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Bell size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No notifications.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-4 px-5 py-4 ${!n.read ? 'bg-primary-50/40' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-gray-200' : 'bg-primary-500'}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('en-UG', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n.id)} className="text-xs text-primary-600 hover:underline shrink-0">
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function VisitCard({ visit }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(visit.visit_date).toLocaleDateString('en-UG', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Heart size={16} className="text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{visit.diagnosis}</p>
              <span className="badge badge-green text-xs"><CheckCircle size={10} className="mr-0.5" /> Completed</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{date} · {visit.doctor}</p>
            <p className="text-xs text-gray-300">{visit.visit_no}</p>
          </div>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="p-1 text-gray-300 hover:text-gray-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 ml-13 space-y-3 pl-13">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Symptoms</p>
              <p className="text-sm text-gray-700">{visit.symptoms || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Prescription</p>
              <p className="text-sm text-gray-700">{visit.prescription || '—'}</p>
            </div>
          </div>
          {visit.referred_to?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Referred to</p>
              <div className="flex gap-2 flex-wrap">
                {visit.referred_to.map((ref) => {
                  const r = REFERRED_ICONS[ref]
                  if (!r) return null
                  return (
                    <span key={ref} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${r.color}`}>
                      <r.icon size={12} /> {r.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditProfileForm({ profile, onSave, cardIssued }) {
  const [form, setForm]   = useState({ ...profile })
  const [saving, setSaving] = useState(false)
  const [error, setError]  = useState('')
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError('')
    try { await onSave(form) }
    catch { setError('Failed to save changes.') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">My Profile</p>
        {cardIssued && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Shield size={12} /> Some fields locked
          </span>
        )}
      </div>

      {cardIssued && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
          Your medical card has been issued — name, DOB and sex are locked. Contact Reception to update them.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'firstname',    label: 'First Name',   type: 'text',  lock: cardIssued },
          { name: 'lastname',     label: 'Last Name',    type: 'text',  lock: cardIssued },
          { name: 'dob',          label: 'Date of Birth',type: 'date',  lock: cardIssued },
          { name: 'contact',      label: 'Phone',        type: 'text',  lock: false },
          { name: 'email',        label: 'Email',        type: 'email', lock: false },
        ].map(({ name, label, type, lock }) => (
          <div key={name}>
            <label className="form-label">{label}</label>
            <input
              name={name} type={type} value={form[name] || ''}
              onChange={set} className="form-input"
              disabled={lock}
            />
          </div>
        ))}
        <div>
          <label className="form-label">Sex</label>
          <select name="sex" value={form.sex || ''} onChange={set} className="form-input" disabled={cardIssued}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Home Address</label>
          <input name="home_address" value={form.home_address || ''} onChange={set} className="form-input" />
        </div>
        <div><label className="form-label">Registration Number</label><input value={form.reg_no || form.student_no || ''} className="form-input bg-gray-50" disabled /></div>
        <div><label className="form-label">Student / Staff Number</label><input value={form.student_no || form.staff_number || ''} className="form-input bg-gray-50" disabled /></div>
        <div><label className="form-label">Faculty</label><input name="faculty" value={form.faculty || ''} onChange={set} className="form-input" /></div>
        <div><label className="form-label">Course</label><input name="course" value={form.course || ''} onChange={set} className="form-input" /></div>
        <div><label className="form-label">Year of Entry</label><input name="year_of_entry" type="number" value={form.year_of_entry || ''} onChange={set} className="form-input" /></div>
        <div><label className="form-label">Year of Study</label><select name="year_of_study" value={form.year_of_study || ''} onChange={set} className="form-input"><option value="">Select</option>{[1,2,3,4,5,6].map((year)=><option key={year} value={year}>Year {year}</option>)}</select></div>
        <div><label className="form-label">Course Duration</label><input name="course_duration" type="number" value={form.course_duration || ''} onChange={set} className="form-input" /></div>
        <div><label className="form-label">Card Expiry Year</label><input value={form.year_of_entry && form.course_duration ? Number(form.year_of_entry) + Number(form.course_duration) : String(form.medical_card_expiry || '').slice(0,4)} className="form-input bg-gray-50" disabled /></div>
        <div>
          <label className="form-label">Next of Kin</label>
          <input name="next_of_kin" value={form.next_of_kin || ''} onChange={set} className="form-input" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <div className="flex justify-end pt-1">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : <><Edit2 size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}
