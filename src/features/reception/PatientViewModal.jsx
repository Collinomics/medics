import { X } from 'lucide-react'

export default function PatientViewModal({ visit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Visit Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0 text-xl font-bold text-primary-600">
              {visit.patient_name?.split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{visit.patient_name}</p>
              <p className="text-sm text-gray-500">{visit.visit_no}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${
                  visit.patient_type === 'student' ? 'badge-blue' :
                  visit.patient_type === 'staff'   ? 'badge-purple' : 'badge-gray'
                }`}>{visit.patient_type}</span>
                <span className="font-mono text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                  {visit.queue_no}
                </span>
              </div>
            </div>
          </div>

          {/* Faculty / Course */}
          {(visit.faculty || visit.course) && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
              {visit.faculty && <p className="font-medium">{visit.faculty}</p>}
              {visit.course  && <p className="text-gray-500">{visit.course}</p>}
            </div>
          )}

          {/* Vitals */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vitals</p>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3">
              {[
                { label: 'Temperature', value: visit.temperature ? `${visit.temperature}°C` : '—' },
                { label: 'Blood Pressure', value: visit.blood_pressure || '—' },
                { label: 'Weight', value: visit.weight ? `${visit.weight} kg` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          {visit.symptoms && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Chief Complaint</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{visit.symptoms}</p>
            </div>
          )}

          <div className="text-xs text-gray-400 text-right">
            Registered at {new Date(visit.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  )
}
