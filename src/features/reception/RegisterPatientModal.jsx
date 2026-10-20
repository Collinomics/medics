import { useState, useRef, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, User, BookOpen, Users, Activity, ChevronDown } from 'lucide-react'
import { registerPatient, createVisit } from '@/services/patientService'
import { useToast } from '@/store/toastStore'
import { KYU_FACULTIES, KYU_COURSES } from '@/utils/constants'

const STEPS = [
  { label: 'Personal Info',  icon: User },
  { label: 'Academic / ID', icon: BookOpen },
  { label: 'Next of Kin',   icon: Users },
  { label: 'Triage',        icon: Activity },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']

const BLANK = {
  patient_type: 'student',
  firstname: '', lastname: '',
  sex: '', dob: '', blood_group: '',
  contact: '', email: '', home_address: '',
  // Student
  reg_no: '', student_no: '', faculty_id: '', course: '', course_duration: '', year_of_study: '', year_of_entry: '',
  // Staff
  staff_no: '', position: '',
  // Kin
  kin_name: '', kin_contact: '', kin_relation: '',
}

const BLANK_VITALS = { temperature: '', blood_pressure: '', weight: '', symptoms: '' }

export default function RegisterPatientModal({ onClose, onSuccess }) {
  const toast = useToast()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ ...BLANK })
  const [vitals, setVitals]   = useState({ ...BLANK_VITALS })

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const setV = (e) => setVitals((v) => ({ ...v, [e.target.name]: e.target.value }))

  // Parse reg no → auto-fill year_of_entry and year_of_study
  const handleRegNoChange = (e) => {
    const val = e.target.value
    setForm((p) => ({ ...p, reg_no: val }))
    const match = val.match(/^(\d{2})\//)
    if (!match) return
    const entryShort = parseInt(match[1], 10)
    const entryYear  = entryShort <= 50 ? 2000 + entryShort : 1900 + entryShort
    const now        = new Date()
    let yearsElapsed = now.getFullYear() - entryYear
    if (now.getMonth() + 1 >= 8) yearsElapsed += 1
    const yearOfStudy = Math.max(1, Math.min(yearsElapsed, 5))
    setForm((p) => ({
      ...p,
      reg_no: val,
      year_of_entry: p.year_of_entry || String(entryYear),
      year_of_study: p.year_of_study || String(yearOfStudy),
    }))
  }

  const canProceed = () => {
    if (step === 0) return form.firstname.trim() && form.lastname.trim() && form.sex && form.contact
    if (step === 1) {
      if (form.patient_type === 'student') return form.reg_no.trim()
      if (form.patient_type === 'staff')   return form.staff_no.trim()
      return true
    }
    if (step === 2) return form.kin_name.trim() && form.kin_contact.trim()
    return true
  }

  const doRegister = async (addToQueue) => {
    setError(''); setLoading(true)
    try {
      const pat = await registerPatient({
        ...form,
        full_name: `${form.firstname.trim()} ${form.lastname.trim()}`,
      })
      if (addToQueue) {
        await createVisit({
          person_id:    pat.id || pat.person_id,
          patient_name: pat.full_name,
          patient_type: pat.patient_type || pat.person_type,
          ...vitals,
        })
        toast.success(`${pat.full_name} registered and added to queue`)
      } else {
        toast.success(`${pat.full_name} registered — pending admin verification`)
      }
      onSuccess()
    } catch (err) {
      const d = err?.response?.data
      const msg = d?.message || d?.error || (d?.errors ? Object.values(d.errors)[0]?.[0] : null) || 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Register New Person</h2>
            <p className="text-xs text-gray-500 mt-0.5">For people not yet in the system</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 pt-4 pb-1 shrink-0">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step  ? 'bg-primary-600 border-primary-600 text-white' :
                  i === step ? 'bg-white border-primary-600 text-primary-600' :
                  'bg-white border-gray-200 text-gray-400'
                }`}>
                  {i < step ? <CheckCircle size={14} /> : <Icon size={14} />}
                </div>
                <p className={`text-[10px] mt-0.5 font-medium hidden sm:block whitespace-nowrap ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-3.5 transition-colors ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── Step 0: Personal Info ── */}
          {step === 0 && (
            <>
              {/* Type toggle */}
              <div>
                <label className="form-label">This person is a <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {[['student','Student'],['staff','Staff / Lecturer'],['dependent','Dependant']].map(([val, lbl]) => (
                    <button key={val} type="button"
                      onClick={() => setForm((p) => ({ ...p, patient_type: val }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        form.patient_type === val
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-primary-300'
                      }`}>{lbl}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">First Name <span className="text-red-500">*</span></label>
                  <input name="firstname" value={form.firstname} onChange={set} className="form-input" placeholder="e.g. Aisha" autoFocus />
                </div>
                <div>
                  <label className="form-label">Last Name <span className="text-red-500">*</span></label>
                  <input name="lastname" value={form.lastname} onChange={set} className="form-input" placeholder="e.g. Nakato" />
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
                  <label className="form-label">Date of Birth</label>
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
                <label className="form-label">Home Address</label>
                <input name="home_address" value={form.home_address} onChange={set} className="form-input" placeholder="e.g. Ntinda, Kampala" />
              </div>
            </>
          )}

          {/* ── Step 1: Academic / ID Info ── */}
          {step === 1 && (
            <>
              {form.patient_type === 'student' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Full Reg. No. <span className="text-red-500">*</span></label>
                      <input name="reg_no" value={form.reg_no} onChange={handleRegNoChange}
                        className="form-input" placeholder="e.g. 24/U/ITD/08050/PD" autoFocus />
                    </div>
                    <div>
                      <label className="form-label">Student No.</label>
                      <input name="student_no" value={form.student_no} onChange={set}
                        className="form-input" placeholder="e.g. 2400808050" />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Faculty / School</label>
                    <select name="faculty_id" value={form.faculty_id}
                      onChange={(e) => setForm((p) => ({ ...p, faculty_id: e.target.value, course: '' }))}
                      className="form-input">
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
                      <label className="form-label">Duration (yrs)</label>
                      <select name="course_duration" value={form.course_duration} onChange={set} className="form-input">
                        <option value="">Select</option>
                        {[2,3,4,5,6].map((y) => <option key={y} value={y}>{y} yrs</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">
                        Year of Entry
                        {form.year_of_entry && <span className="ml-1 text-[10px] text-primary-500">(auto-filled)</span>}
                      </label>
                      <input name="year_of_entry" value={form.year_of_entry} onChange={set}
                        className="form-input" placeholder="e.g. 2024" maxLength={4} />
                    </div>
                    <div>
                      <label className="form-label">
                        Year of Study
                        {form.year_of_study && <span className="ml-1 text-[10px] text-primary-500">(auto-filled)</span>}
                      </label>
                      <select name="year_of_study" value={form.year_of_study} onChange={set} className="form-input">
                        <option value="">—</option>
                        {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.year_of_entry && form.year_of_study && (
                    <p className="text-xs text-gray-400 -mt-2">Calculated from the reg. number — correct if wrong.</p>
                  )}
                </>
              )}

              {form.patient_type === 'staff' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Staff Number <span className="text-red-500">*</span></label>
                      <input name="staff_no" value={form.staff_no} onChange={set}
                        className="form-input" placeholder="e.g. STAFF-0234" autoFocus />
                    </div>
                    <div>
                      <label className="form-label">Position / Title</label>
                      <input name="position" value={form.position} onChange={set}
                        className="form-input" placeholder="e.g. Lecturer" />
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

              {form.patient_type === 'dependent' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-semibold mb-1">Dependant of Staff</p>
                  <p className="text-xs">Provide the staff member's details in the Next of Kin step.</p>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Next of Kin ── */}
          {step === 2 && (
            <>
              <p className="text-sm text-gray-500">Emergency contact details.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                  <input name="kin_name" value={form.kin_name} onChange={set}
                    className="form-input" placeholder="Full name of next of kin" autoFocus />
                </div>
                <div>
                  <label className="form-label">Relationship</label>
                  <input name="kin_relation" value={form.kin_relation} onChange={set}
                    className="form-input" placeholder="e.g. Mother, Father" />
                </div>
                <div>
                  <label className="form-label">Phone <span className="text-red-500">*</span></label>
                  <input name="kin_contact" value={form.kin_contact} onChange={set}
                    className="form-input" placeholder="07XXXXXXXX" />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Triage & Queue ── */}
          {step === 3 && (
            <>
              {/* Person summary */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                  {(form.firstname[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{form.firstname} {form.lastname}</p>
                  <p className="text-xs text-gray-500">
                    {form.reg_no || form.staff_no || '—'} · {form.patient_type}
                    {form.course ? ` · ${form.course}` : ''}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400">All vitals are optional — fill what is available.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Temperature (°C)</label>
                  <input name="temperature" value={vitals.temperature} onChange={setV} className="form-input" placeholder="37.2" autoFocus />
                </div>
                <div>
                  <label className="form-label">Blood Pressure</label>
                  <input name="blood_pressure" value={vitals.blood_pressure} onChange={setV} className="form-input" placeholder="120/80" />
                </div>
                <div>
                  <label className="form-label">Weight (kg)</label>
                  <input name="weight" value={vitals.weight} onChange={setV} className="form-input" placeholder="65" />
                </div>
              </div>
              <div>
                <label className="form-label">Chief Complaint / Symptoms</label>
                <textarea name="symptoms" value={vitals.symptoms} onChange={setV}
                  rows={3} className="form-input resize-none"
                  placeholder="Briefly describe the reason for the visit…" />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100 gap-3 shrink-0">
          {step > 0 ? (
            <button onClick={() => { setError(''); setStep((s) => s - 1) }} className="btn-secondary">
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={() => { setError(''); setStep((s) => s + 1) }} disabled={!canProceed()} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => doRegister(false)} disabled={loading} className="btn-secondary whitespace-nowrap">
                {loading ? 'Saving…' : 'Register Only'}
              </button>
              <button onClick={() => doRegister(true)} disabled={loading} className="btn-primary whitespace-nowrap">
                {loading ? 'Saving…' : 'Register & Add to Queue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Searchable course combobox ──────────────────────────────────────────────
function CourseCombobox({ facultyId, value, onChange }) {
  const [query, setQuery]   = useState(value || '')
  const [open, setOpen]     = useState(false)
  const [custom, setCustom] = useState(false)
  const wrapRef             = useRef(null)

  useEffect(() => {
    if (!value) { setQuery(''); setCustom(false) }
  }, [value])

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const list     = facultyId ? (KYU_COURSES[Number(facultyId)] || []) : []
  const filtered = query.trim() ? list.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase())) : list

  const select = (course) => { setQuery(course); onChange(course); setOpen(false); setCustom(false) }

  const handleChange = (e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setCustom(false) }

  const enterCustom = () => { setCustom(true); setOpen(false); setQuery(''); onChange('') }

  if (custom) {
    return (
      <div className="space-y-1">
        <input autoFocus value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value) }}
          className="form-input" placeholder="Type the course / programme" />
        <button type="button" onClick={() => { setCustom(false); setQuery(value || '') }}
          className="text-xs text-primary-600 hover:underline">← Back to list</button>
      </div>
    )
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input value={query} onChange={handleChange} onFocus={() => setOpen(true)}
        className="form-input pr-8"
        placeholder={facultyId ? 'Search or select course…' : 'Select a faculty first'}
        disabled={!facultyId} />
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      {open && facultyId && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0
            ? filtered.map((c) => (
                <button key={c} type="button" onMouseDown={() => select(c)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors ${value === c ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}>
                  {c}
                </button>
              ))
            : <p className="px-4 py-3 text-sm text-gray-400">No match — use "Other" below</p>
          }
          <button type="button" onMouseDown={enterCustom}
            className="w-full text-left px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 border-t border-gray-100">
            Other — type my own course
          </button>
        </div>
      )}
    </div>
  )
}
