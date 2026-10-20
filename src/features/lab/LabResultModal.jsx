import { useState } from 'react'
import { X, FlaskConical, CheckCircle } from 'lucide-react'
import { submitLabResult } from '@/services/labService'
import { useToast } from '@/store/toastStore'

export default function LabResultModal({ request, onClose, onSuccess }) {
  const toast = useToast()
  const [result, setResult]   = useState(request.result || '')
  const [remarks, setRemarks] = useState(request.remarks || '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const isDone = request.status === 'completed'

  const handleSubmit = async () => {
    if (!result.trim()) { setError('Please enter the test result.'); return }
    setLoading(true)
    setError('')
    try {
      await submitLabResult(request.id, result, remarks)
      toast.success(`Result submitted for ${request.test_name}`)
      onSuccess()
    } catch {
      setError('Failed to save result. Try again.')
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
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FlaskConical size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Lab Result</h2>
              <p className="text-xs text-gray-500">{request.request_no}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-sm">
            <div>
              <p className="text-xs text-gray-400">Patient</p>
              <p className="font-medium text-gray-800">{request.patient_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Test</p>
              <p className="font-medium text-gray-800">{request.test_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Requested By</p>
              <p className="font-medium text-gray-800">{request.requested_by}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              {request.status === 'completed'
                ? <span className="badge badge-green">Completed</span>
                : <span className="badge badge-amber">Pending</span>}
            </div>
          </div>

          <div>
            <label className="form-label">
              Result <span className="text-red-500">*</span>
            </label>
            <input
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="form-input"
              placeholder="e.g. Positive, Negative, 5.2 mmol/L…"
              disabled={isDone}
            />
          </div>

          <div>
            <label className="form-label">Remarks / Notes</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder="Any additional observations…"
              disabled={isDone}
            />
          </div>

          {isDone && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm">
              <CheckCircle size={16} />
              Result already submitted. Doctor has been notified.
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
              {loading ? 'Submitting…' : <><CheckCircle size={15} /> Submit Result</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
