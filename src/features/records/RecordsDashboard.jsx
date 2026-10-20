import { useState, useEffect } from 'react'
import {
  BarChart2, TrendingUp, Users, Package,
  Download, RefreshCw, AlertTriangle,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getTrends, getDrugStock, exportReport } from '@/services/recordsService'
import { getOperationalSettings } from '@/services/settingsService'

const PIE_COLORS = ['#2563eb', '#0694a2', '#7c3aed', '#d97706', '#dc2626']

export default function RecordsDashboard() {
  const [trends, setTrends]     = useState(null)
  const [stock, setStock]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [activeChart, setActiveChart] = useState('disease')
  const [settings, setSettings] = useState({ low_stock_threshold: 20, expiry_warning_days: 90 })

  const today = new Date()
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  const [from] = useState(sixMonthsAgo.toISOString().slice(0, 10))
  const [to]   = useState(today.toISOString().slice(0, 10))

  const load = async () => {
    setLoading(true)
    const [t, s, systemSettings] = await Promise.all([getTrends(from, to), getDrugStock(), getOperationalSettings().catch(() => settings)])
    setTrends(t)
    setStock(s)
    setSettings(systemSettings)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleExport = async () => {
    setExporting(true)
    await exportReport(from, to)
    setExporting(false)
  }

  const lowStock  = stock.filter((d) => d.stock_qty > 0 && d.stock_qty < settings.low_stock_threshold)
  const outStock  = stock.filter((d) => d.stock_qty === 0)
  const totalVisits = trends
    ? trends.disease_trends.reduce((s, m) => s + (m.malaria + m.fever + m.typhoid), 0)
    : 0

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Data &amp; Records</h1>
          <p className="text-xs text-gray-400 mt-0.5">Analytics overview — last 6 months</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting
              ? <><RefreshCw size={15} className="animate-spin" /> Exporting…</>
              : <><Download size={15} /> Export PDF</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Visits (6mo)', value: totalVisits,      icon: Users,         color: 'text-blue-600 bg-blue-50' },
          { label: 'Drug Items in Stock',value: stock.length,     icon: Package,       color: 'text-green-600 bg-green-50' },
          { label: 'Low Stock Alerts',   value: lowStock.length,  icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Out of Stock',       value: outStock.length,  icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      {loading ? (
        <div className="card flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
          <RefreshCw size={16} className="animate-spin" /> Loading analytics…
        </div>
      ) : trends && (
        <>
          {/* Chart toggle */}
          <div className="card p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <h2 className="section-title flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-600" />
                {activeChart === 'disease' ? 'Disease / Diagnosis Trends' : 'Drug Consumption Trends'}
              </h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveChart('disease')}
                  className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                    activeChart === 'disease' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Disease Trends
                </button>
                <button
                  onClick={() => setActiveChart('drugs')}
                  className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                    activeChart === 'drugs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Drug Consumption
                </button>
              </div>
            </div>

            {activeChart === 'disease' ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends.disease_trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="malaria" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Malaria" />
                  <Line type="monotone" dataKey="fever"   stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} name="Fever" />
                  <Line type="monotone" dataKey="typhoid" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} name="Typhoid" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trends.drug_consumption} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paracetamol" name="Paracetamol" fill="#2563eb" radius={[4,4,0,0]} />
                  <Bar dataKey="coartem"     name="Coartem"     fill="#0694a2" radius={[4,4,0,0]} />
                  <Bar dataKey="amoxicillin" name="Amoxicillin" fill="#7c3aed" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Demographics row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <Users size={18} className="text-primary-600" /> Patient Type
              </h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie
                      data={trends.demographics.by_type}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {trends.demographics.by_type.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {trends.demographics.by_type.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-semibold text-gray-900 ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-primary-600" /> Gender Distribution
              </h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie
                      data={trends.demographics.by_gender}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#0694a2" />
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {trends.demographics.by_gender.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: i === 0 ? '#2563eb' : '#0694a2' }} />
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-semibold text-gray-900 ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drug stock table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="section-title flex items-center gap-2">
            <Package size={18} className="text-primary-600" /> Drug &amp; Equipment Stock
          </h2>
          {(lowStock.length > 0 || outStock.length > 0) && (
            <span className="badge badge-amber flex items-center gap-1">
              <AlertTriangle size={12} />
              {lowStock.length + outStock.length} item{lowStock.length + outStock.length !== 1 ? 's' : ''} need attention
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Drug / Item</th>
                  <th>Category</th>
                  <th>Stock Qty</th>
                  <th>Unit</th>
                  <th>Expiry</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((drug) => (
                  <StockRow key={drug.id} drug={drug} threshold={settings.low_stock_threshold} expiryWarningDays={settings.expiry_warning_days} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StockRow({ drug, threshold, expiryWarningDays }) {
  const isOut  = drug.stock_qty === 0
  const isLow  = drug.stock_qty > 0 && drug.stock_qty < threshold
  const isGood = drug.stock_qty >= threshold

  const expiry = drug.expiry
    ? new Date(drug.expiry).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const isExpiringSoon = drug.expiry
    && (new Date(drug.expiry) - new Date()) < expiryWarningDays * 24 * 60 * 60 * 1000

  return (
    <tr className={isOut ? 'bg-red-50' : isLow ? 'bg-amber-50/40' : ''}>
      <td className="font-medium text-gray-900">{drug.name}</td>
      <td className="text-gray-500">{drug.category}</td>
      <td>
        <span className={`font-bold text-base ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'}`}>
          {drug.stock_qty}
        </span>
      </td>
      <td className="text-gray-500 text-xs">{drug.unit}</td>
      <td>
        <span className={isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-500'}>
          {expiry}
        </span>
      </td>
      <td>
        <span className={`badge ${drug.location === 'Pharmacy' ? 'badge-green' : 'badge-blue'}`}>
          {drug.location}
        </span>
      </td>
      <td>
        {isOut  && <span className="badge badge-red">Out of Stock</span>}
        {isLow  && <span className="badge badge-amber">Low Stock</span>}
        {isGood && <span className="badge badge-green">Available</span>}
      </td>
    </tr>
  )
}
