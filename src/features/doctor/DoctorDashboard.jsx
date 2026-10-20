import { useState, useEffect } from 'react'
import { Stethoscope, Clock, CheckCircle, RefreshCw, Users } from 'lucide-react'
import { getDoctorQueue } from '@/services/patientService'
import ConsultationModal from './ConsultationModal'
import { startVisit } from '@/services/patientService'

const STATUS_BADGE = {
  waiting:          <span className="badge badge-amber">Waiting</span>,
  in_consultation:  <span className="badge badge-blue">In Consultation</span>,
  sent_to_lab:      <span className="badge badge-purple">At Lab</span>,
  sent_to_pharmacy: <span className="badge badge-green">At Pharmacy</span>,
  sent_to_injection:<span className="badge badge-blue">Injection Room</span>,
  sent_to_dental:   <span className="badge badge-gray">Dental</span>,
  completed:        <span className="badge badge-green">Completed</span>,
}

export default function DoctorDashboard() {
  const [queue, setQueue]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeVisit, setActive]  = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getDoctorQueue()
    setQueue(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stats = {
    waiting:       queue.filter((v) => v.status === 'waiting').length,
    consulting:    queue.filter((v) => v.status === 'in_consultation').length,
    done:          queue.filter((v) => v.status === 'completed').length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Doctor Portal</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary" title="Refresh queue"><RefreshCw size={15} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Waiting',         value: stats.waiting,    icon: Clock,       color: 'text-amber-600 bg-amber-50' },
          { label: 'In Consultation', value: stats.consulting, icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed Today', value: stats.done,       icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Queue — fills remaining space */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Patient Queue</h2>
          <span className="badge badge-amber">{stats.waiting} waiting</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading queue…
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No patients in queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Queue No.</th><th>Patient</th><th>Type</th><th>Vitals</th>
                  <th>Chief Complaint</th><th>Waiting Since</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((visit) => (
                  <QueueRow key={visit.id} visit={visit} statusBadge={STATUS_BADGE[visit.status]} onOpen={async () => { const v=visit.status==='waiting'?await startVisit(visit.id):visit; setActive(v) }} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeVisit && (
        <ConsultationModal visit={activeVisit} onClose={() => setActive(null)} onSuccess={() => { setActive(null); load() }} />
      )}
    </div>
  )
}

function QueueRow({ visit, statusBadge, onOpen }) {
  const time = new Date(visit.created_at).toLocaleTimeString('en-UG', {
    hour: '2-digit', minute: '2-digit',
  })

  const canConsult = ['waiting', 'in_consultation', 'ready_for_review', 'waiting_review'].includes(visit.status)

  return (
    <tr>
      <td>
        <span className="font-mono text-sm font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
          {visit.queue_no}
        </span>
      </td>
      <td>
        <div>
          <p className="font-medium text-gray-900">{visit.patient_name}</p>
          <p className="text-xs text-gray-400">{visit.visit_no}</p>
        </div>
      </td>
      <td>
        <span className={`badge ${
          visit.patient_type === 'student' ? 'badge-blue' :
          visit.patient_type === 'staff'   ? 'badge-purple' : 'badge-gray'
        }`}>
          {visit.patient_type}
        </span>
      </td>
      <td>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>Temp: <span className="font-medium">{visit.temperature || '—'}°C</span></p>
          <p>BP: <span className="font-medium">{visit.blood_pressure || '—'}</span></p>
          <p>Wt: <span className="font-medium">{visit.weight || '—'} kg</span></p>
        </div>
      </td>
      <td>
        <p className="text-sm text-gray-600 max-w-[160px] truncate" title={visit.symptoms}>
          {visit.symptoms || '—'}
        </p>
      </td>
      <td className="text-sm text-gray-500">{time}</td>
      <td>{statusBadge}</td>
      <td>
        <button
          onClick={onOpen}
          disabled={!canConsult}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            canConsult
              ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {visit.status === 'in_consultation' ? 'Continue' : 'Consult'}
        </button>
      </td>
    </tr>
  )
}
