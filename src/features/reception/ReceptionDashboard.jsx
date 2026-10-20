import { useState, useEffect, useMemo } from 'react'
import { Search, UserPlus, Users, RefreshCw, Clock, ChevronDown, X, ChevronRight,
         CheckCircle2, ChevronLeft as ChevronPrev, ChevronRight as ChevronNext, History } from 'lucide-react'
import { getTodaysVisits, getPatients, createVisit, getVisitHistory } from '@/services/patientService'
import { KYU_FACULTIES, KYU_COURSES } from '@/utils/constants'
import { useToast } from '@/store/toastStore'
import RegisterPatientModal from './RegisterPatientModal'
import PatientQueueRow from './PatientQueueRow'

const STATUS_BADGE = {
  waiting:          <span className="badge badge-amber">Waiting</span>,
  in_consultation:  <span className="badge badge-blue">In Consultation</span>,
  sent_to_lab:      <span className="badge badge-purple">At Lab</span>,
  sent_to_pharmacy: <span className="badge badge-green">At Pharmacy</span>,
  sent_to_injection:<span className="badge badge-blue">Injection Room</span>,
  sent_to_dental:   <span className="badge badge-gray">Dental</span>,
  completed:        <span className="badge badge-green">Completed</span>,
  discharged:       <span className="badge badge-gray">Discharged</span>,
  removed:          <span className="badge badge-red">Removed</span>,
}

const TYPE_BADGE = { student: 'badge-blue', staff: 'badge-purple', dependent: 'badge-pink', other: 'badge-gray' }
const TYPE_LABEL = { student: 'Student', staff: 'Staff', dependent: 'Dependant', other: 'Other' }

const PAGE_SIZE   = 50
const BLANK_VITALS = { temperature: '', blood_pressure: '', weight: '', symptoms: '' }

export default function ReceptionDashboard() {
  const toast = useToast()

  const [activeTab, setActiveTab]       = useState('queue')
  const [persons, setPersons]           = useState([])
  const [visits, setVisits]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  // Add-to-queue tab state
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [courseFilter, setCourseFilter]   = useState('')
  const [page, setPage]                   = useState(1)
  const [expandedId, setExpandedId]       = useState(null)
  const [vitals, setVitals]               = useState(BLANK_VITALS)
  const [addingId, setAddingId]           = useState(null)

  // Queue tab state
  const [qStatus, setQStatus]   = useState('')
  const [qType, setQType]       = useState('')
  const [qFaculty, setQFaculty] = useState('')
  const [qCourse, setQCourse]   = useState('')

  // History tab state
  const [histDate, setHistDate]       = useState(() => new Date().toISOString().slice(0, 10))
  const [histSearch, setHistSearch]   = useState('')
  const [histStatus, setHistStatus]   = useState('')
  const [histType, setHistType]       = useState('')
  const [history, setHistory]         = useState([])
  const [histLoading, setHistLoading] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    const [p, v] = await Promise.all([getPatients(), getTodaysVisits()])
    setPersons(p)
    setVisits(v)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])
  useEffect(() => { setPage(1) }, [search, typeFilter, facultyFilter, courseFilter])

  // Load history when tab becomes active or filters change
  useEffect(() => {
    if (activeTab !== 'history') return
    loadHistory()
  }, [activeTab, histDate, histStatus, histType])

  const loadHistory = async () => {
    setHistLoading(true)
    try {
      const params = {}
      if (histDate)   params.date   = histDate
      if (histStatus) params.status = histStatus
      if (histType)   params.type   = histType
      const data = await getVisitHistory(params)
      setHistory(data)
    } catch {
      toast.error('Failed to load history.')
    } finally {
      setHistLoading(false)
    }
  }

  // ── Person list ──
  const listCourseOptions = useMemo(() => {
    if (!facultyFilter) return []
    const f = KYU_FACULTIES.find((f) => f.name === facultyFilter)
    return f ? (KYU_COURSES[f.id] || []) : []
  }, [facultyFilter])

  // Track person IDs already in today's active queue
  const inQueueIds = useMemo(() => new Set(visits.map((v) => v.patient_id)), [visits])

  const filteredPersons = useMemo(() => {
    const q = search.toLowerCase()
    return persons.filter((p) => {
      if (q && !(
        (p.full_name    || '').toLowerCase().includes(q) ||
        (p.reg_no       || '').toLowerCase().includes(q) ||
        (p.student_no   || p.student_id || '').toLowerCase().includes(q) ||
        (p.staff_number || '').toLowerCase().includes(q) ||
        (p.medical_card_no || '').toLowerCase().includes(q)
      )) return false
      if (typeFilter    && (p.person_type || p.patient_type) !== typeFilter)  return false
      if (facultyFilter && p.faculty !== facultyFilter)                        return false
      if (courseFilter  && p.course  !== courseFilter)                         return false
      return true
    })
  }, [persons, search, typeFilter, facultyFilter, courseFilter])

  const totalPages  = Math.max(1, Math.ceil(filteredPersons.length / PAGE_SIZE))
  const pagePersons = filteredPersons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasListFilter = search || typeFilter || facultyFilter || courseFilter

  // ── Queue filtering ──
  const qCourseOptions = useMemo(() => {
    if (!qFaculty) return []
    const f = KYU_FACULTIES.find((f) => f.name === qFaculty)
    return f ? (KYU_COURSES[f.id] || []) : []
  }, [qFaculty])

  const filteredQueue = useMemo(() => visits.filter((v) => {
    if (qStatus  && v.status       !== qStatus)  return false
    if (qType    && v.patient_type !== qType)     return false
    if (qFaculty && v.faculty      !== qFaculty)  return false
    if (qCourse  && v.course       !== qCourse)   return false
    return true
  }), [visits, qStatus, qType, qFaculty, qCourse])

  const hasQFilter   = qStatus || qType || qFaculty || qCourse
  const clearQFilters = () => { setQStatus(''); setQType(''); setQFaculty(''); setQCourse('') }

  // ── History search (client-side on already-fetched data) ──
  const filteredHistory = useMemo(() => {
    if (!histSearch) return history
    const q = histSearch.toLowerCase()
    return history.filter((v) =>
      (v.patient_name || '').toLowerCase().includes(q) ||
      (v.visit_no     || '').toLowerCase().includes(q) ||
      (v.reg_no       || '').toLowerCase().includes(q)
    )
  }, [history, histSearch])

  // ── Stats ──
  const stats = {
    today:     visits.length,
    waiting:   visits.filter((v) => v.status === 'waiting').length,
    completed: visits.filter((v) => ['completed','discharged'].includes(v.status)).length,
  }

  // ── Inline expand / add to queue ──
  const handleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setVitals(BLANK_VITALS); return }
    setExpandedId(id); setVitals(BLANK_VITALS)
  }

  const setV = (e) => setVitals((v) => ({ ...v, [e.target.name]: e.target.value }))

  const handleAddToQueue = async (person) => {
    const pid = person.id || person.person_id
    setAddingId(pid)
    try {
      await createVisit({
        person_id:    pid,
        patient_name: person.full_name,
        patient_type: person.person_type || person.patient_type,
        ...vitals,
      })
      toast.success(`${person.full_name} added to queue`)
      setExpandedId(null); setVitals(BLANK_VITALS)
      const v = await getTodaysVisits()
      setVisits(v)
      setActiveTab('queue')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to queue.')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-3 h-full">

      {/* Stats */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3">
        {[
          { label: 'Visits Today', value: stats.today,     icon: Users,        color: 'text-blue-600 bg-blue-50' },
          { label: 'In Queue',     value: stats.waiting,   icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Completed',    value: stats.completed, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[
            { key: 'queue',   label: "Today's Queue" },
            { key: 'add',     label: 'Add to Queue' },
            { key: 'history', label: 'History', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon size={13} />}
              {label}
              {key === 'queue' && stats.waiting > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {stats.waiting}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={loadAll} disabled={loading} className="btn-secondary py-1.5 px-3" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowRegister(true)} className="btn-primary py-1.5 px-3 text-sm">
            <UserPlus size={15} /> Register Person
          </button>
        </div>
      </div>

      {/* ── TAB: Add to Queue ── */}
      {activeTab === 'add' && (
        <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-8 pr-8 py-1.5 text-sm w-full"
                placeholder="Search by name, Reg. No., student no., or card no.…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <FilterSelect value={typeFilter} onChange={setTypeFilter} placeholder="All Types"
                options={[{value:'student',label:'Student'},{value:'staff',label:'Staff'},{value:'dependent',label:'Dependant'},{value:'other',label:'Other'}]}
              />
              <FilterSelect value={facultyFilter} onChange={(v) => { setFacultyFilter(v); setCourseFilter('') }} placeholder="All Faculties" wide
                options={KYU_FACULTIES.map((f) => ({ value: f.name, label: f.name.replace('Faculty of ','').replace('School of ','') }))}
              />
              {facultyFilter && listCourseOptions.length > 0 && (
                <FilterSelect value={courseFilter} onChange={setCourseFilter} placeholder="All Courses" wide
                  options={listCourseOptions.map((c) => ({ value: c, label: c }))}
                />
              )}
              {hasListFilter && (
                <button onClick={() => { setSearch(''); setTypeFilter(''); setFacultyFilter(''); setCourseFilter('') }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">
                  <X size={11} /> Clear
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {filteredPersons.length} {filteredPersons.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-50 overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
                <RefreshCw size={14} className="animate-spin" /> Loading…
              </div>
            ) : pagePersons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Users size={26} className="mb-2 opacity-30" />
                <p className="text-sm">{hasListFilter ? 'No people match.' : 'No records in system yet.'}</p>
              </div>
            ) : (
              pagePersons.map((person) => {
                const pid      = person.id || person.person_id
                const expanded = expandedId === pid
                const type     = person.person_type || person.patient_type
                const sub      = person.reg_no || person.student_no || person.student_id || person.staff_number || ''
                const faculty  = (person.faculty || '').replace('Faculty of ','').replace('School of ','')
                const alreadyInQueue = inQueueIds.has(pid)

                return (
                  <div key={pid}>
                    <button
                      onClick={() => !alreadyInQueue && handleExpand(pid)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        alreadyInQueue
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : expanded ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-sm font-semibold text-primary-700">
                        {(person.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{person.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {sub}{faculty ? ` · ${faculty}` : ''}{person.course ? ` · ${person.course}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 badge ${TYPE_BADGE[type] || 'badge-gray'}`}>
                        {TYPE_LABEL[type] || type}
                      </span>
                      {alreadyInQueue
                        ? <span className="shrink-0 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">In queue</span>
                        : <ChevronRight size={14} className={`shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                      }
                    </button>

                    {expanded && (
                      <div className="px-4 pb-3 pt-2 bg-primary-50 border-t border-primary-100">
                        <div className="flex flex-wrap gap-2 items-end">
                          <div>
                            <label className="form-label text-xs">Temp (°C)</label>
                            <input name="temperature" value={vitals.temperature} onChange={setV}
                              className="form-input py-1.5 text-sm w-24" placeholder="37.2" autoFocus />
                          </div>
                          <div>
                            <label className="form-label text-xs">Blood Pressure</label>
                            <input name="blood_pressure" value={vitals.blood_pressure} onChange={setV}
                              className="form-input py-1.5 text-sm w-28" placeholder="120/80" />
                          </div>
                          <div>
                            <label className="form-label text-xs">Weight (kg)</label>
                            <input name="weight" value={vitals.weight} onChange={setV}
                              className="form-input py-1.5 text-sm w-24" placeholder="65" />
                          </div>
                          <div className="flex-1 min-w-44">
                            <label className="form-label text-xs">Chief Complaint</label>
                            <input name="symptoms" value={vitals.symptoms} onChange={setV}
                              className="form-input py-1.5 text-sm" placeholder="Reason for visit…" />
                          </div>
                          <button
                            onClick={() => handleAddToQueue(person)}
                            disabled={addingId === pid}
                            className="btn-primary py-1.5 text-sm shrink-0 whitespace-nowrap"
                          >
                            {addingId === pid ? 'Adding…' : 'Add to Queue'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredPersons.length)} of {filteredPersons.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronPrev size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                  .reduce((acc, n, i, arr) => {
                    if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                    acc.push(n); return acc
                  }, [])
                  .map((n, i) =>
                    n === '…' ? (
                      <span key={`e-${i}`} className="px-1 text-xs text-gray-400">…</span>
                    ) : (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          page === n ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}>{n}</button>
                    )
                  )
                }
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronNext size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Today's Queue ── */}
      {activeTab === 'queue' && (
        <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <FilterSelect value={qStatus} onChange={setQStatus} placeholder="All Statuses"
              options={[
                {value:'waiting',label:'Waiting'},{value:'in_consultation',label:'In Consultation'},
                {value:'sent_to_lab',label:'At Lab'},{value:'sent_to_pharmacy',label:'At Pharmacy'},
                {value:'sent_to_injection',label:'Injection Room'},{value:'sent_to_dental',label:'Dental'},
              ]}
            />
            <FilterSelect value={qType} onChange={setQType} placeholder="All Types"
              options={[{value:'student',label:'Student'},{value:'staff',label:'Staff'},{value:'dependent',label:'Dependant'},{value:'other',label:'Other'}]}
            />
            <FilterSelect value={qFaculty} onChange={(v) => { setQFaculty(v); setQCourse('') }} placeholder="All Faculties" wide
              options={KYU_FACULTIES.map((f) => ({ value: f.name, label: f.name.replace('Faculty of ','').replace('School of ','') }))}
            />
            {qFaculty && qCourseOptions.length > 0 && (
              <FilterSelect value={qCourse} onChange={setQCourse} placeholder="All Courses" wide
                options={qCourseOptions.map((c) => ({ value: c, label: c }))}
              />
            )}
            {hasQFilter && (
              <button onClick={clearQFilters}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">
                <X size={11} /> Clear
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {filteredQueue.length} {filteredQueue.length === 1 ? 'patient' : 'patients'} in view
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <RefreshCw size={15} className="animate-spin" /> Loading…
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users size={28} className="mb-2 opacity-30" />
              <p className="text-sm">{hasQFilter ? 'No patients match the filters.' : 'No patients in queue.'}</p>
              {hasQFilter && <button onClick={clearQFilters} className="mt-1.5 text-xs text-primary-600 hover:underline">Clear filters</button>}
            </div>
          ) : (
            <div className="overflow-auto flex-1 min-h-0">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Queue No.</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Faculty / Course</th>
                    <th>Vitals</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((visit) => (
                    <PatientQueueRow key={visit.id} visit={visit} statusBadge={STATUS_BADGE[visit.status]} onRefresh={loadAll} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
          {/* History filters */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={histDate}
                onChange={(e) => setHistDate(e.target.value)}
                className="form-input py-1.5 text-sm w-40"
              />
              <FilterSelect value={histStatus} onChange={setHistStatus} placeholder="All Statuses"
                options={[
                  {value:'completed',label:'Completed'},
                  {value:'discharged',label:'Discharged'},
                  {value:'removed',label:'Removed from Queue'},
                ]}
              />
              <FilterSelect value={histType} onChange={setHistType} placeholder="All Types"
                options={[{value:'student',label:'Student'},{value:'staff',label:'Staff'},{value:'dependent',label:'Dependant'},{value:'other',label:'Other'}]}
              />
              {(histStatus || histType) && (
                <button onClick={() => { setHistStatus(''); setHistType('') }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">
                  <X size={11} /> Clear
                </button>
              )}
              <button onClick={loadHistory} disabled={histLoading}
                className="btn-secondary py-1.5 px-3" title="Refresh history">
                <RefreshCw size={13} className={histLoading ? 'animate-spin' : ''} />
              </button>
              <span className="ml-auto text-xs text-gray-400">{filteredHistory.length} records</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-8 pr-8 py-1.5 text-sm w-full"
                placeholder="Search by name, visit no., or reg. no.…"
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
              />
              {histSearch && (
                <button onClick={() => setHistSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {histLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <RefreshCw size={15} className="animate-spin" /> Loading…
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <History size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No records for this date.</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1 min-h-0">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Visit No.</th>
                    <th>Queue No.</th>
                    <th>Name</th>
                    <th>Reg / ID</th>
                    <th>Type</th>
                    <th>Faculty / Course</th>
                    <th>Vitals</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Receptionist</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((v) => (
                    <tr key={v.id} className={v.deleted_from_queue ? 'opacity-50' : ''}>
                      <td><span className="font-mono text-xs text-gray-600">{v.visit_no}</span></td>
                      <td>
                        <span className="font-mono text-sm font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {v.queue_no}
                        </span>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900 text-sm">{v.patient_name}</p>
                      </td>
                      <td className="font-mono text-xs text-gray-500">{v.reg_no || '—'}</td>
                      <td>
                        <span className={`badge ${TYPE_BADGE[v.patient_type] || 'badge-gray'}`}>
                          {TYPE_LABEL[v.patient_type] || v.patient_type}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs text-gray-600 max-w-[150px]">
                          {v.faculty && <p className="truncate font-medium">{v.faculty.replace('Faculty of ','').replace('School of ','')}</p>}
                          {v.course  && <p className="truncate text-gray-400">{v.course}</p>}
                          {!v.faculty && !v.course && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {v.temperature    && <p>Temp: <span className="font-medium">{v.temperature}°C</span></p>}
                          {v.blood_pressure && <p>BP: <span className="font-medium">{v.blood_pressure}</span></p>}
                          {v.weight         && <p>Wt: <span className="font-medium">{v.weight} kg</span></p>}
                          {!v.temperature && !v.blood_pressure && !v.weight && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(v.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>{STATUS_BADGE[v.status] ?? <span className="badge badge-gray">{v.status}</span>}</td>
                      <td className="text-xs text-gray-500">{v.receptionist_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showRegister && (
        <RegisterPatientModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); loadAll() }}
        />
      )}
    </div>
  )
}

function FilterSelect({ value, onChange, placeholder, options, wide = false }) {
  return (
    <div className={`relative ${wide ? 'min-w-40' : 'min-w-28'}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`form-input py-1.5 text-sm w-full appearance-none pr-7 ${value ? 'text-primary-700 border-primary-300 bg-primary-50' : 'text-gray-600'}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}
