import { useState, useEffect } from 'react'
import { Pill, PackageCheck, Printer, RefreshCw, ClipboardList } from 'lucide-react'
import { getPrescriptions } from '@/services/pharmacyService'
import DispenseModal from './DispenseModal'

const STATUS_BADGE = {
  pending:   <span className="badge badge-amber">Pending</span>,
  partial:   <span className="badge badge-blue">Partially Dispensed</span>,
  dispensed: <span className="badge badge-green">Dispensed</span>,
}

export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('pending')
  const [activeRx, setActiveRx]           = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getPrescriptions(filter)
    setPrescriptions(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const stats = {
    pending:   prescriptions.filter((r) => r.status === 'pending').length,
    dispensed: prescriptions.filter((r) => r.status === 'dispensed').length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Pharmacy</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary" title="Refresh"><RefreshCw size={15} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending',          value: stats.pending,   icon: Pill,         color: 'text-amber-600 bg-amber-50' },
          { label: 'Dispensed Today',  value: stats.dispensed, icon: PackageCheck, color: 'text-green-600 bg-green-50' },
          { label: 'EMFs Printed',     value: stats.dispensed, icon: Printer,      color: 'text-blue-600 bg-blue-50' },
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

      {/* Prescriptions table — fills remaining space */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-800">Prescriptions</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['pending', 'partial', 'dispensed', 'all'].map((f) => (
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
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No {filter === 'all' ? '' : filter} prescriptions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Rx #</th><th>Patient</th><th>Doctor</th><th>Drugs</th>
                  <th>Time</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <PrescriptionRow key={rx.id} rx={rx} statusBadge={STATUS_BADGE[rx.status]} onOpen={() => setActiveRx(rx)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeRx && (
        <DispenseModal prescription={activeRx} onClose={() => setActiveRx(null)} onSuccess={() => { setActiveRx(null); load() }} />
      )}
    </div>
  )
}

function PrescriptionRow({ rx, statusBadge, onOpen }) {
  const time = new Date(rx.created_at).toLocaleTimeString('en-UG', {
    hour: '2-digit', minute: '2-digit',
  })
  return (
    <tr>
      <td>
        <span className="font-mono text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
          {rx.prescription_no}
        </span>
      </td>
      <td className="font-medium text-gray-900">{rx.patient_name}</td>
      <td className="text-sm text-gray-500">{rx.doctor}</td>
      <td>
        <div className="space-y-0.5">
          {rx.items.map((item, i) => (
            <p key={i} className="text-xs text-gray-600">
              {item.drug_name} — {item.dosage}
            </p>
          ))}
        </div>
      </td>
      <td className="text-sm text-gray-500">{time}</td>
      <td>{statusBadge}</td>
      <td>
        <button
          onClick={onOpen}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            ['pending', 'partial'].includes(rx.status)
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          {['pending', 'partial'].includes(rx.status) ? 'Dispense' : 'View / Print'}
        </button>
      </td>
    </tr>
  )
}
