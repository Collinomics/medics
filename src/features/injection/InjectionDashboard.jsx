import { useState, useEffect } from 'react'
import { Syringe, PackageCheck, UserCheck, RefreshCw, ClipboardList } from 'lucide-react'
import { getInjectionOrders } from '@/services/pharmacyService'
import InjectionOrderModal from './InjectionOrderModal'

const STATUS_BADGE = {
  pending:  <span className="badge badge-amber">Pending</span>,
  done:     <span className="badge badge-green">Done</span>,
  forwarded:<span className="badge badge-blue">Forwarded to Pharmacy</span>,
}

export default function InjectionDashboard() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [activeOrder, setActive]= useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getInjectionOrders(filter)
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const stats = {
    pending:   orders.filter((o) => o.status === 'pending').length,
    done:      orders.filter((o) => o.status === 'done').length,
    forwarded: orders.filter((o) => o.status === 'forwarded').length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Injection Room</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary" title="Refresh"><RefreshCw size={15} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Orders',     value: stats.pending,   icon: Syringe,     color: 'text-amber-600 bg-amber-50' },
          { label: 'Administered Today', value: stats.done,      icon: UserCheck,   color: 'text-green-600 bg-green-50' },
          { label: 'Forwarded',          value: stats.forwarded, icon: PackageCheck,color: 'text-blue-600 bg-blue-50' },
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
          <h2 className="text-base font-semibold text-gray-800">Injection Orders</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['pending', 'done', 'all'].map((f) => (
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No {filter === 'all' ? '' : filter} injection orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order #</th><th>Patient</th><th>Drug / Dose</th>
                  <th>From Doctor</th><th>Time</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <InjectionRow key={order.id} order={order} statusBadge={STATUS_BADGE[order.status]} onOpen={() => setActive(order)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeOrder && (
        <InjectionOrderModal order={activeOrder} onClose={() => setActive(null)} onSuccess={() => { setActive(null); load() }} />
      )}
    </div>
  )
}

function InjectionRow({ order, statusBadge, onOpen }) {
  const time = new Date(order.time || Date.now()).toLocaleTimeString('en-UG', {
    hour: '2-digit', minute: '2-digit',
  })
  return (
    <tr>
      <td>
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {order.order_no || `INJ-${order.id}`}
        </span>
      </td>
      <td className="font-medium text-gray-900">{order.patient_name || '—'}</td>
      <td className="text-sm text-gray-700">{order.drug || '—'}</td>
      <td className="text-sm text-gray-500">{order.doctor || '—'}</td>
      <td className="text-sm text-gray-500">{time}</td>
      <td>{statusBadge}</td>
      <td>
        <button
          onClick={onOpen}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            order.status === 'pending'
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          {order.status === 'pending' ? 'Process' : 'View'}
        </button>
      </td>
    </tr>
  )
}
