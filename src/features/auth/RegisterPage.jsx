import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, ChevronRight, ChevronLeft,
  CheckCircle, User, BookOpen, Heart, Users, AlertCircle, Lock, Eye, EyeOff, ChevronDown,
} from 'lucide-react'
import { KYU_FACULTIES, KYU_COURSES } from '@/utils/constants'
import { register } from '@/services/authService'

const STEPS = [
  { label: 'About You',      icon: User },
  { label: 'Academic Info',  icon: BookOpen },
  { label: 'Medical',        icon: Heart },
  { label: 'Next of Kin',    icon: Users },
  { label: 'Create Account', icon: Lock },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const DRAFT_KEY  = 'mcis_register_draft'
const BLANK_FORM = {
  person_type: 'student',
  surname: '', other_names: '',
  sex: '', dob: '', blood_group: '',
  contact: '', email: '', home_address: '',
  reg_no: '', student_no: '', year_of_entry: '',
  faculty_id: '', course: '', course_duration: '', year_of_study: '',
  staff_no: '', position: '',
  has_chronic: 'no', chronic_details: '',
  been_hospitalised: 'no', hospitalisation_details: '',
  known_allergies: '',
  kin_name: '', kin_relation: '', kin_contact: '',
  password: '', confirm_password: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(() => {
    try { return Number(localStorage.getItem(DRAFT_KEY + '_step') || 0) } catch { return 0 }
  })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(null)
  const [showPassword, setShowPw] = useState(false)
  const [showConfirm, setShowCf]  = useState(false)

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      return saved ? { ...BLANK_FORM, ...JSON.parse(saved), password: '', confirm_password: '' } : { ...BLANK_FORM }
    } catch { return { ...BLANK_FORM } }
  })

  // Persist draft whenever form changes (skip passwords)
  useEffect(() => {
    try {
      const { password, confirm_password, ...safe } = form
      localStorage.setItem(DRAFT_KEY, JSON.stringify(safe))
    } catch {}
  }, [form])

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY + '_step', String(step)) } catch {}
  }, [step])

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(DRAFT_KEY + '_step') } catch {}
  }

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  // Username is derived server-side; compute preview to show user
  const derivedUsername = form.student_no || form.staff_no ||
    (form.surname ? form.surname.toLowerCase().replace(/\s+/g, '') + (form.contact || '').slice(-4) : '')

  // Auto-fill student email from student number
  const handleStudentNoBlur = () => {
    if (form.student_no && !form.email) {
      setForm((p) => ({ ...p, email: `${form.student_no}@std.kyu.ac.ug` }))
    }
  }

  // Parse reg no → auto-fill year_of_entry and year_of_study
  // e.g. "24/U/ITD/08050/PD" → entry=2024, study=year 2 if current month ≥ August
  const handleRegNoChange = (e) => {
    const val = e.target.value
    setForm((p) => ({ ...p, reg_no: val }))

    const match = val.match(/^(\d{2})\//)
    if (!match) return

    const entryShort = parseInt(match[1], 10)
    const entryYear  = entryShort <= 50 ? 2000 + entryShort : 1900 + entryShort

    const now        = new Date()
    const currentYear = now.getFullYear()
    const month      = now.getMonth() + 1  // 1-12

    // New academic year starts in August; each August adds a year of study
    let yearsElapsed = currentYear - entryYear
    if (month >= 8) yearsElapsed += 1
    const yearOfStudy = Math.max(1, Math.min(yearsElapsed, 5))

    setForm((p) => ({
      ...p,
      reg_no: val,
      year_of_entry: p.year_of_entry || String(entryYear),
      year_of_study: p.year_of_study || String(yearOfStudy),
    }))
  }

  const canProceed = () => {
    if (step === 0) return form.surname && form.other_names && form.sex && form.dob && form.contact
    if (step === 1) {
      if (form.person_type === 'student') return form.reg_no
      if (form.person_type === 'staff')   return form.staff_no
      return true
    }
    if (step === 3) return form.kin_name && form.kin_contact
    if (step === 4) {
      return form.password.length >= 6 && form.password === form.confirm_password
    }
    return true
  }

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      const data = await register(form)
      clearDraft()
      setDone({ full_name: data.full_name, username: data.username, email: data.email })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error
      if (err.response?.data?.errors) {
        const first = Object.values(err.response.data.errors)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError(msg || 'Submission failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're enrolled!</h1>
          <p className="text-gray-500 text-sm mb-4">
            Welcome, <span className="font-semibold text-gray-800">{done.full_name}</span>. Your account is ready.
          </p>

          {/* Login credentials box */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-left mb-4">
            <p className="text-xs font-semibold text-primary-700 mb-2">Your login credentials</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600">Username</span>
                <span className="font-mono text-sm font-bold text-primary-900">{done.username}</span>
              </div>
              {done.email && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary-600">Email</span>
                  <span className="text-sm text-primary-900">{done.email}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-primary-500 mt-2">Save these — you'll need them to log in.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-left mb-5">
            <p className="font-semibold mb-1">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Log in now to view your portal</li>
              <li>The admin will verify your submitted details</li>
              <li>Once approved, your medical card number is assigned</li>
              <li>You'll receive a notification in your portal inbox</li>
            </ol>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">
            Log in now
          </button>
        </div>
      </div>
    )
  }

  const passwordsMatch = form.password && form.confirm_password && form.password !== form.confirm_password

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex flex-col">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/kyu_logo.png" alt="KYU" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none">Kyambogo University</p>
            <p className="text-sm font-bold text-gray-900 leading-tight">Medical Center</p>
          </div>
        </Link>
        <Link to="/login" className="text-sm text-primary-600 hover:underline">Already registered? Sign in</Link>
      </header>

      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg">

          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Medical Center Enrolment</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enrol to access healthcare services at Kyambogo University Medical Center.
            </p>
          </div>

          {/* Draft-restored notice */}
          {step > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 mb-4 text-xs text-blue-700">
              <span>Your progress was saved — continuing from where you left off.</span>
              <button
                type="button"
                onClick={() => { clearDraft(); setStep(0); setForm({ ...BLANK_FORM }) }}
                className="text-blue-500 hover:underline ml-3 shrink-0"
              >
                Start over
              </button>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center mb-6">
            {STEPS.map(({ label, icon: Icon }, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    i < step  ? 'bg-primary-600 border-primary-600 text-white' :
                    i === step ? 'bg-white border-primary-600 text-primary-600' :
                    'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {i < step ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  <p className={`text-xs mt-1 font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>
                    {label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="card p-4 sm:p-6 space-y-4">

            {/* ── Step 0: Personal Info ── */}
            {step === 0 && (
              <>
                <div>
                  <label className="form-label">I am a <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {[['student','Student'],['staff','Staff / Lecturer'],['dependent','Dependant of Staff']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm((p) => ({ ...p, person_type: val }))}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                          form.person_type === val
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-primary-300'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Surname <span className="text-red-500">*</span></label>
                    <input name="surname" value={form.surname} onChange={set} className="form-input" placeholder="e.g. Muzira" />
                  </div>
                  <div>
                    <label className="form-label">Other Names <span className="text-red-500">*</span></label>
                    <input name="other_names" value={form.other_names} onChange={set} className="form-input" placeholder="e.g. Collins Musomba" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Sex <span className="text-red-500">*</span></label>
                    <select name="sex" value={form.sex} onChange={set} className="form-input">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Date of Birth <span className="text-red-500">*</span></label>
                    <input name="dob" type="date" value={form.dob} onChange={set} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Blood Group</label>
                    <select name="blood_group" value={form.blood_group} onChange={set} className="form-input">
                      <option value="">Unknown</option>
                      {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Phone <span className="text-red-500">*</span></label>
                    <input name="contact" value={form.contact} onChange={set} className="form-input" placeholder="07XXXXXXXX" />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input name="email" type="email" value={form.email} onChange={set} className="form-input" />
                  </div>
                </div>

                <div>
                  <label className="form-label">Home / Residential Address</label>
                  <input name="home_address" value={form.home_address} onChange={set} className="form-input" placeholder="e.g. Ntinda, Kampala" />
                </div>
              </>
            )}

            {/* ── Step 1: Academic / ID Info ── */}
            {step === 1 && (
              <>
                {form.person_type === 'student' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Full Reg. No. <span className="text-red-500">*</span></label>
                        <input
                          name="reg_no"
                          value={form.reg_no}
                          onChange={handleRegNoChange}
                          className="form-input"
                          placeholder="e.g. 24/U/ITD/08050/PD"
                        />
                      </div>
                      <div>
                        <label className="form-label">Student No.</label>
                        <input name="student_no" value={form.student_no} onChange={set} onBlur={handleStudentNoBlur} className="form-input" placeholder="e.g. 2400808050" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Faculty / School</label>
                      <select
                        name="faculty_id"
                        value={form.faculty_id}
                        onChange={(e) => setForm((p) => ({ ...p, faculty_id: e.target.value, course: '' }))}
                        className="form-input"
                      >
                        <option value="">Select Faculty</option>
                        {KYU_FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="form-label">Course / Programme</label>
                        <CourseCombobox
                          facultyId={form.faculty_id}
                          value={form.course}
                          onChange={(val) => setForm((p) => ({ ...p, course: val }))}
                        />
                      </div>
                      <div>
                        <label className="form-label">Duration (years) <span className="text-red-500">*</span></label>
                        <select name="course_duration" value={form.course_duration} onChange={set} className="form-input">
                          <option value="">Select</option>
                          {[2,3,4,5,6].map((y) => <option key={y} value={y}>{y} yrs</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">
                          Year of Study
                          {form.year_of_study && <span className="ml-1 text-[10px] text-primary-500 font-normal">(auto-filled)</span>}
                        </label>
                        <select name="year_of_study" value={form.year_of_study} onChange={set} className="form-input">
                          <option value="">Select</option>
                          {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">
                          Year of Entry
                          {form.year_of_entry && <span className="ml-1 text-[10px] text-primary-500 font-normal">(auto-filled)</span>}
                        </label>
                        <input name="year_of_entry" value={form.year_of_entry} onChange={set} className="form-input" placeholder="e.g. 2024" maxLength={4} />
                      </div>
                    </div>
                    {form.year_of_entry && form.year_of_study && (
                      <p className="text-xs text-gray-400 -mt-2">
                        Calculated from your reg. number — correct these if they are wrong.
                      </p>
                    )}
                  </>
                )}

                {form.person_type === 'staff' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Staff Number <span className="text-red-500">*</span></label>
                        <input name="staff_no" value={form.staff_no} onChange={set} onBlur={suggestUsername} className="form-input" placeholder="e.g. STAFF-0234" />
                      </div>
                      <div>
                        <label className="form-label">Position / Title</label>
                        <input name="position" value={form.position} onChange={set} className="form-input" placeholder="e.g. Lecturer" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Department / Faculty</label>
                      <select name="faculty_id" value={form.faculty_id} onChange={set} className="form-input">
                        <option value="">Select Department</option>
                        {KYU_FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {form.person_type === 'dependent' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                    <p className="font-semibold mb-1">Dependant of Staff</p>
                    <p className="text-xs">Please provide the staff member's details in the Next of Kin section on the last step.</p>
                  </div>
                )}
              </>
            )}

            {/* ── Step 2: Medical History ── */}
            {step === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                  This information is confidential and only visible to medical staff. Answer honestly for your own safety.
                </div>

                <div>
                  <label className="form-label">Do you have any chronic condition(s)?</label>
                  <div className="flex gap-2">
                    {[['no','No'],['yes','Yes']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm((p) => ({ ...p, has_chronic: val }))}
                        className={`px-6 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          form.has_chronic === val ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-200 text-gray-600'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                  {form.has_chronic === 'yes' && (
                    <textarea name="chronic_details" value={form.chronic_details} onChange={set}
                      rows={2} className="form-input resize-none mt-2"
                      placeholder="e.g. Diabetes, Hypertension, Asthma…" />
                  )}
                </div>

                <div>
                  <label className="form-label">Have you been hospitalised before?</label>
                  <div className="flex gap-2">
                    {[['no','No'],['yes','Yes']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm((p) => ({ ...p, been_hospitalised: val }))}
                        className={`px-6 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          form.been_hospitalised === val ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-200 text-gray-600'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                  {form.been_hospitalised === 'yes' && (
                    <textarea name="hospitalisation_details" value={form.hospitalisation_details} onChange={set}
                      rows={2} className="form-input resize-none mt-2"
                      placeholder="Briefly describe when and why…" />
                  )}
                </div>

                <div>
                  <label className="form-label">Known Allergies</label>
                  <input name="known_allergies" value={form.known_allergies} onChange={set}
                    className="form-input" placeholder="e.g. Penicillin, Sulfa drugs — or 'None'" />
                </div>
              </>
            )}

            {/* ── Step 3: Next of Kin ── */}
            {step === 3 && (
              <>
                <p className="text-sm text-gray-500">
                  Provide someone we can contact in case of emergency.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                    <input name="kin_name" value={form.kin_name} onChange={set} className="form-input" placeholder="Full name of next of kin" />
                  </div>
                  <div>
                    <label className="form-label">Relationship</label>
                    <input name="kin_relation" value={form.kin_relation} onChange={set} className="form-input" placeholder="e.g. Mother, Father, Sibling" />
                  </div>
                  <div>
                    <label className="form-label">Phone Number <span className="text-red-500">*</span></label>
                    <input name="kin_contact" value={form.kin_contact} onChange={set} className="form-input" placeholder="07XXXXXXXX" />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 4: Create Account ── */}
            {step === 4 && (
              <>
                <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 text-sm text-primary-700">
                  <p className="font-semibold">Almost done — set a password</p>
                  <p className="text-xs mt-0.5 text-primary-600">
                    Your username is automatically set from your student/staff number. Just choose a password.
                  </p>
                </div>

                {/* Username preview — read only */}
                <div>
                  <label className="form-label">Your Username</label>
                  <div className="form-input bg-gray-50 font-mono text-gray-700 select-all cursor-default flex items-center justify-between">
                    <span>{derivedUsername || '—'}</span>
                    <span className="text-xs text-gray-400 font-sans ml-2 shrink-0">auto-assigned</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Use this to log in. You can request a change later if needed.
                  </p>
                </div>

                {/* Email preview */}
                <div>
                  <label className="form-label">Recovery Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={set}
                    className="form-input"
                    placeholder={form.person_type === 'student' ? `e.g. ${derivedUsername || 'studentno'}@std.kyu.ac.ug` : 'your.email@example.com'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {form.person_type === 'student'
                      ? 'Your KYU student email was pre-filled from your student number. Correct it if needed.'
                      : 'Used for password recovery. Required — you can always update it later.'}
                  </p>
                </div>

                <div>
                  <label className="form-label">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set}
                      className="form-input pr-10"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      name="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm_password}
                      onChange={set}
                      className={`form-input pr-10 ${passwordsMatch ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCf((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordsMatch && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> Passwords do not match
                    </p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>By submitting, you confirm that all information provided is accurate. The Medical Center admin will verify your details before issuing your card.</p>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              {step > 0 ? (
                <button type="button" onClick={() => { setError(''); setStep((s) => s - 1) }} className="btn-secondary">
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <Link to="/" className="btn-secondary">Cancel</Link>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => { setError(''); setStep((s) => s + 1) }}
                  disabled={!canProceed()}
                  className="btn-primary"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="btn-primary"
                >
                  {loading ? 'Submitting…' : 'Create Account & Register'}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Already have a card? <Link to="/login" className="text-primary-600 hover:underline">Login to your portal</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Searchable course combobox ──────────────────────────────────────────────
function CourseCombobox({ facultyId, value, onChange }) {
  const [query, setQuery]     = useState(value || '')
  const [open, setOpen]       = useState(false)
  const [custom, setCustom]   = useState(false)
  const wrapRef               = useRef(null)

  // Keep text in sync if parent resets (e.g. faculty change)
  useEffect(() => {
    if (!value) { setQuery(''); setCustom(false) }
  }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const list = facultyId ? (KYU_COURSES[Number(facultyId)] || []) : []

  const filtered = query.trim()
    ? list.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
    : list

  const select = (course) => {
    setQuery(course)
    onChange(course)
    setOpen(false)
    setCustom(false)
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)   // live-update so custom typed values are captured
    setOpen(true)
    setCustom(false)
  }

  const enterCustom = () => {
    setCustom(true)
    setOpen(false)
    setQuery('')
    onChange('')
  }

  if (custom) {
    return (
      <div className="space-y-1">
        <input
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value) }}
          className="form-input"
          placeholder="Type your course / programme"
        />
        <button
          type="button"
          onClick={() => { setCustom(false); setQuery(value || ''); }}
          className="text-xs text-primary-600 hover:underline"
        >
          ← Back to list
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <input
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setOpen(true)}
          className="form-input pr-8"
          placeholder={facultyId ? 'Search or select your course…' : 'Select a faculty first'}
          disabled={!facultyId}
        />
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {open && facultyId && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={() => select(c)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors ${value === c ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
              >
                {c}
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-gray-400">No match — try typing more or use "Other"</p>
          )}
          <button
            type="button"
            onMouseDown={enterCustom}
            className="w-full text-left px-4 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50 border-t border-gray-100 transition-colors"
          >
            Other — type my own course
          </button>
        </div>
      )}
    </div>
  )
}
