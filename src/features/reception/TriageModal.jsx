import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

export default function TriageModal({ patient, onClose, onSubmit }) {
  const [vitals, setVitals] = useState({ temperature: '', blood_pressure: '', weight: '', symptoms: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setV = (e) => setVitals((v) => ({ ...v, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      await onSubmit(vitals)
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to add to queue.')
      setLoading(false)
    }
  }

  const name = patient.full_name || `${patient.firstname || ''} ${patient.lastname || ''}`.trim()
  const sub  = patient.reg_no || patient.student_no || patient.student_id || patient.staff_number || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Record Triage & Add to Queue</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vitals for this visit (all optional)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Patient summary */}
          <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
              {name[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{name}</p>
              <p className="text-xs text-gray-500 truncate">
                {sub}{sub && patient.medical_card_no ? ' · ' : ''}{patient.medical_card_no ? `Card ${patient.medical_card_no}` : ''}
                {!sub && !patient.medical_card_no ? (patient.person_type || patient.patient_type || '') : ''}
              </p>
            </div>
            <span className={`shrink-0 badge ${patient.medical_card_status === 'issued' ? 'badge-green' : 'badge-amber'}`}>
              {patient.medical_card_status === 'issued' ? 'Card issued' : 'No card'}
            </span>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Temperature (°C)</label>
              <input name="temperature" value={vitals.temperature} onChange={setV} className="form-input" placeholder="37.2" />
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
            <textarea
              name="symptoms"
              value={vitals.symptoms}
              onChange={setV}
              rows={3}
              className="form-input resize-none"
              placeholder="Briefly describe why the patient is visiting today…"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100 gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Adding…' : 'Add to Queue'}
          </button>
        </div>
      </div>
    </div>
  )
}
