import { useState, useEffect } from 'react'
import { FlaskConical, Clock, CheckCircle, RefreshCw, Microscope } from 'lucide-react'
import { getLabRequests } from '@/services/labService'
import LabResultModal from './LabResultModal'

const STATUS_BADGE = {
  pending:   <span className="badge badge-amber">Pending</span>,
  completed: <span className="badge badge-green">Completed</span>,
}

export default function LabDashboard() {
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [activeReq, setActiveReq] = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getLabRequests(filter)
    setRequests(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const stats = {
    pending:   requests.filter((r) => r.status === 'pending').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Laboratory</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary" title="Refresh"><RefreshCw size={15} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Tests',   value: stats.pending,   icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Completed Today', value: stats.completed, icon: CheckCircle,  color: 'text-green-600 bg-green-50' },
          { label: 'Tests Available', value: 8,               icon: FlaskConical, color: 'text-blue-600 bg-blue-50' },
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

      {/* Orders table — fills remaining space */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-800">Test Orders</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['pending', 'completed', 'all'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading…
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Microscope size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No {filter === 'all' ? '' : filter} test orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order #</th><th>Patient</th><th>Test</th><th>Requested By</th>
                  <th>Date &amp; Time</th><th>Status</th><th>Result</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <LabOrderRow key={req.id} req={req} statusBadge={STATUS_BADGE[req.status]} onEnterResult={() => setActiveReq(req)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeReq && (
        <LabResultModal request={activeReq} onClose={() => setActiveReq(null)} onSuccess={() => { setActiveReq(null); load() }} />
      )}
    </div>
  )
}

function LabOrderRow({ req, statusBadge, onEnterResult }) {
  const dt = new Date(req.request_date)
  const dateStr = dt.toLocaleDateString('en-UG', { day: '2-digit', month: 'short' })
  const timeStr = dt.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })

  return (
    <tr>
      <td>
        <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
          {req.request_no}
        </span>
      </td>
      <td className="font-medium text-gray-900">{req.patient_name}</td>
      <td>
        <div className="flex items-center gap-1.5">
          <FlaskConical size={14} className="text-purple-400 shrink-0" />
          <span className="text-sm text-gray-700">{req.test_name}</span>
        </div>
      </td>
      <td className="text-sm text-gray-500">{req.requested_by}</td>
      <td className="text-sm text-gray-500">{dateStr} {timeStr}</td>
      <td>{statusBadge}</td>
      <td>
        {req.result ? (
          <span className="text-sm font-medium text-gray-800">{req.result}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td>
        {req.status === 'pending' ? (
          <button
            onClick={onEnterResult}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Enter Result
          </button>
        ) : (
          <button
            onClick={onEnterResult}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            View
          </button>
        )}
      </td>
    </tr>
  )
}
