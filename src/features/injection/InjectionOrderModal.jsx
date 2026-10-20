import { useState } from 'react'
import { X, Syringe, CheckCircle, Send } from 'lucide-react'
import { markInjectionDone } from '@/services/pharmacyService'
import { useToast } from '@/store/toastStore'

const DISCHARGE_OPTIONS = [
  { value: 'discharged', label: 'Discharge Patient (done)' },
  { value: 'pharmacy',   label: 'Forward to Pharmacy' },
  { value: 'doctor',     label: 'Return to Doctor' },
]

export default function InjectionOrderModal({ order, onClose, onSuccess }) {
  const toast = useToast()
  const [dischargedTo, setDischargedTo] = useState('discharged')
  const [drugGiven, setDrugGiven]       = useState(order.drug || '')
  const [remarks, setRemarks]           = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const isDone = order.status === 'done'

  const handleSubmit = async () => {
    if (!drugGiven.trim()) { setError('Please enter the drug administered.'); return }
    setLoading(true)
    setError('')
    try {
      await markInjectionDone(order.id, dischargedTo, drugGiven, remarks)
      toast.success(`Injection administered for ${order.patient_name}`)
      onSuccess()
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Syringe size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Injection Order</h2>
              <p className="text-xs text-gray-500">
                {order.patient_name} · {order.order_no || `INJ-${order.id}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-sm">
            <div>
              <p className="text-xs text-gray-400">Patient</p>
              <p className="font-semibold text-gray-900">{order.patient_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Referred By</p>
              <p className="font-medium text-gray-800">{order.doctor || '—'}</p>
            </div>
          </div>

          <div>
            <label className="form-label">Drug / Injection Administered <span className="text-red-500">*</span></label>
            <input
              value={drugGiven}
              onChange={(e) => setDrugGiven(e.target.value)}
              className="form-input"
              placeholder="e.g. Gentamicin 80mg IV"
              disabled={isDone}
            />
          </div>

          <div>
            <label className="form-label">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="form-input resize-none"
              placeholder="Any observations or notes…"
              disabled={isDone}
            />
          </div>

          {!isDone && (
            <div>
              <label className="form-label">After Administration</label>
              <div className="space-y-2 mt-1">
                {DISCHARGE_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="discharged_to"
                      value={value}
                      checked={dischargedTo === value}
                      onChange={() => setDischargedTo(value)}
                      className="accent-primary-600 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isDone && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm">
              <CheckCircle size={16} /> This order has already been processed.
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">
            {isDone ? 'Close' : 'Cancel'}
          </button>
          {!isDone && (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : <><Send size={15} /> Mark as Done</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
