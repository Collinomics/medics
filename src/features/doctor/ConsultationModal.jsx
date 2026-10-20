import { useState, useEffect } from 'react'
import {
  X, Plus, Trash2, FlaskConical, Pill,
  Syringe, Smile, Send, PackageCheck,
} from 'lucide-react'
import { saveConsultation, completeVisit } from '@/services/patientService'
import { getDrugs } from '@/services/pharmacyService'
import { getLabTests } from '@/services/labService'
import { useToast } from '@/store/toastStore'

const ROUTE_OPTIONS = [
  { value: 'sent_to_lab',       label: 'Laboratory',    icon: FlaskConical, color: 'border-purple-300 bg-purple-50 text-purple-700 data-[active=true]:border-purple-500 data-[active=true]:bg-purple-100' },
  { value: 'sent_to_pharmacy',  label: 'Pharmacy',      icon: Pill,         color: 'border-green-300 bg-green-50 text-green-700 data-[active=true]:border-green-500 data-[active=true]:bg-green-100' },
  { value: 'sent_to_injection', label: 'Injection Room',icon: Syringe,      color: 'border-blue-300 bg-blue-50 text-blue-700 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-100' },
  { value: 'sent_to_dental',    label: 'Dental',        icon: Smile,        color: 'border-gray-300 bg-gray-50 text-gray-700 data-[active=true]:border-gray-500 data-[active=true]:bg-gray-100' },
]

const EMPTY_RX = { drug_id: '', drug_name: '', dosage: '', frequency: '', duration: '', quantity: '' }
const EMPTY_LAB = { test_id: '', test_name: '' }

export default function ConsultationModal({ visit, onClose, onSuccess }) {
  const isReview = ['ready_for_review', 'waiting_review'].includes(visit.status)
  const toast = useToast()
  const [tab, setTab]             = useState('diagnosis')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const [drugs, setDrugs]         = useState([])
  const [labTests, setLabTests]   = useState([])

  // Diagnosis
  const [symptoms, setSymptoms]   = useState(visit.symptoms || '')
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis || '')
  const [notes, setNotes]         = useState('')

  // Prescriptions
  const [rxItems, setRxItems]     = useState([{ ...EMPTY_RX }])

  // Lab orders
  const [labOrders, setLabOrders] = useState([{ ...EMPTY_LAB }])

  // Routing — multiple destinations allowed
  const [routes, setRoutes]       = useState([])
  const [injectionOrder, setInjectionOrder] = useState({ drug: '', dose: '', administration_route: '', instructions: '' })

  useEffect(() => {
    getDrugs().then(setDrugs)
    getLabTests().then(setLabTests)
  }, [])

  // Prescription helpers
  const addRx    = () => setRxItems((r) => [...r, { ...EMPTY_RX }])
  const removeRx = (i) => setRxItems((r) => r.filter((_, idx) => idx !== i))
  const setRx    = (i, field, val) =>
    setRxItems((r) => r.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleDrugSelect = (i, drugId) => {
    const drug = drugs.find((d) => d.id === Number(drugId))
    setRx(i, 'drug_id', drugId)
    setRx(i, 'drug_name', drug?.name || '')
  }

  // Lab order helpers
  const addLab    = () => setLabOrders((l) => [...l, { ...EMPTY_LAB }])
  const removeLab = (i) => setLabOrders((l) => l.filter((_, idx) => idx !== i))
  const setLab    = (i, testId) => {
    const test = labTests.find((t) => t.id === Number(testId))
    setLabOrders((l) => l.map((item, idx) =>
      idx === i ? { test_id: testId, test_name: test?.test_name || '' } : item
    ))
  }

  // Route toggle
  const toggleRoute = (val) =>
    setRoutes((r) => r.includes(val) ? r.filter((x) => x !== val) : [...r, val])

  const handleSubmit = async () => {
    if (!diagnosis.trim() && !isReview) { setError('Please enter a diagnosis.'); return }
    if (routes.length === 0 && !isReview) { setError('Please select where to route the patient.'); return }

    setError('')
    setLoading(true)
    try {
      const validRxItems   = rxItems.filter((r) => r.drug_id)
      const validLabOrders = labOrders.filter((l) => l.test_id)

      if (isReview) await completeVisit(visit.id, notes)
      else await saveConsultation(visit.id, {
        diagnosis,
        symptoms,
        notes,
        routes,
        prescriptions: validRxItems.map((item) => ({ ...item, drug_id: Number(item.drug_id) })),
        lab_orders: validLabOrders.map((item) => ({ test_id: Number(item.test_id) })),
        injection_order: routes.includes('sent_to_injection') ? injectionOrder : undefined,
      })

      toast.success(`${visit.patient_name} routed — consultation saved`)
      onSuccess()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Consultation</h2>
            <p className="text-sm text-gray-500">{visit.patient_name} · {visit.queue_no}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Patient vitals summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-gray-500">Temp: <strong className="text-gray-800">{visit.temperature || '—'}°C</strong></span>
            <span className="text-gray-500">BP: <strong className="text-gray-800">{visit.blood_pressure || '—'}</strong></span>
            <span className="text-gray-500">Weight: <strong className="text-gray-800">{visit.weight || '—'} kg</strong></span>
            <span className={`badge ml-auto ${
              visit.patient_type === 'student' ? 'badge-blue' :
              visit.patient_type === 'staff' ? 'badge-purple' : 'badge-gray'
            }`}>{visit.patient_type}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: 'diagnosis',    label: 'Diagnosis' },
            { key: 'prescription', label: 'Prescription' },
            { key: 'lab',          label: 'Lab Orders' },
            { key: 'drugs',        label: 'Drug Stock' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Diagnosis tab */}
          {tab === 'diagnosis' && (
            <div className="space-y-4">
              <div>
                <label className="form-label">Symptoms / Presenting Complaint</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="List symptoms…"
                />
              </div>
              <div>
                <label className="form-label">Diagnosis <span className="text-red-500">*</span></label>
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Malaria, URTI, Gastritis…"
                />
              </div>
              <div>
                <label className="form-label">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Any extra clinical notes…"
                />
              </div>

              {/* Routing */}
              <div>
                <label className="form-label">Route Patient To <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-2">Select one or more destinations.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROUTE_OPTIONS.map(({ value, label, icon: Icon, color }) => {
                    const active = routes.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        data-active={active}
                        onClick={() => toggleRoute(value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${color}`}
                      >
                        <Icon size={20} />
                        <span className="text-sm font-medium">{label}</span>
                        {active && (
                          <span className="ml-auto w-5 h-5 rounded-full bg-current opacity-20 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-current" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              {routes.includes('sent_to_injection') && (
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-blue-800">Injection order details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className="form-input" placeholder="Drug" value={injectionOrder.drug} onChange={(e)=>setInjectionOrder({...injectionOrder,drug:e.target.value})}/>
                    <input className="form-input" placeholder="Dose" value={injectionOrder.dose} onChange={(e)=>setInjectionOrder({...injectionOrder,dose:e.target.value})}/>
                    <input className="form-input" placeholder="Route, e.g. IM" value={injectionOrder.administration_route} onChange={(e)=>setInjectionOrder({...injectionOrder,administration_route:e.target.value})}/>
                    <input className="form-input" placeholder="Instructions" value={injectionOrder.instructions} onChange={(e)=>setInjectionOrder({...injectionOrder,instructions:e.target.value})}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prescription tab */}
          {tab === 'prescription' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Add drugs to prescribe. Leave empty to skip.</p>
              {rxItems.map((item, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Drug {i + 1}</p>
                    {rxItems.length > 1 && (
                      <button onClick={() => removeRx(i)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Drug</label>
                    <select
                      value={item.drug_id}
                      onChange={(e) => handleDrugSelect(i, e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select drug…</option>
                      {drugs.filter((d) => d.location === 'Pharmacy').map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.stock_qty} {d.unit} in stock
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Dosage</label>
                      <input
                        value={item.dosage}
                        onChange={(e) => setRx(i, 'dosage', e.target.value)}
                        className="form-input"
                        placeholder="e.g. 1 tablet"
                      />
                    </div>
                    <div>
                      <label className="form-label">Frequency</label>
                      <select
                        value={item.frequency}
                        onChange={(e) => setRx(i, 'frequency', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select…</option>
                        <option>Once daily</option>
                        <option>Twice daily</option>
                        <option>Three times daily</option>
                        <option>Four times daily</option>
                        <option>Every 8 hours</option>
                        <option>Stat (once only)</option>
                        <option>As needed (PRN)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Duration</label>
                      <input
                        value={item.duration}
                        onChange={(e) => setRx(i, 'duration', e.target.value)}
                        className="form-input"
                        placeholder="e.g. 5 days"
                      />
                    </div>
                    <div>
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setRx(i, 'quantity', e.target.value)}
                        className="form-input"
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addRx} className="btn-secondary w-full justify-center">
                <Plus size={15} /> Add Another Drug
              </button>
            </div>
          )}

          {/* Lab orders tab */}
          {tab === 'lab' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Select tests to order for this patient.</p>
              {labOrders.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={item.test_id}
                    onChange={(e) => setLab(i, e.target.value)}
                    className="form-input flex-1"
                  >
                    <option value="">Select test…</option>
                    {labTests.map((t) => (
                      <option key={t.id} value={t.id}>{t.test_name}</option>
                    ))}
                  </select>
                  {labOrders.length > 1 && (
                    <button onClick={() => removeLab(i)} className="text-red-400 hover:text-red-600 p-1.5">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addLab} className="btn-secondary w-full justify-center">
                <Plus size={15} /> Add Another Test
              </button>
            </div>
          )}

          {/* Drug stock tab */}
          {tab === 'drugs' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Current pharmacy and injection room stock levels.</p>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Drug</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugs.map((d) => (
                      <tr key={d.id}>
                        <td className="font-medium text-gray-800">{d.name}</td>
                        <td className="text-gray-500">{d.category}</td>
                        <td>
                          <span className={`font-semibold ${d.stock_qty < 20 ? 'text-red-600' : 'text-gray-800'}`}>
                            {d.stock_qty}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">{d.unit}</span>
                        </td>
                        <td>
                          <span className={`badge ${d.location === 'Pharmacy' ? 'badge-green' : 'badge-blue'}`}>
                            {d.location}
                          </span>
                        </td>
                        <td>
                          {d.stock_qty === 0
                            ? <span className="badge badge-red">Out of Stock</span>
                            : d.stock_qty < 20
                            ? <span className="badge badge-amber">Low Stock</span>
                            : <span className="badge badge-green">Available</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {error && (
          <p className="mx-6 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg shrink-0">{error}</p>
        )}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100 shrink-0 gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : <><Send size={15} /> {isReview ? 'Complete Visit' : 'Submit & Route Patient'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
