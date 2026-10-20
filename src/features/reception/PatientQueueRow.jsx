import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { deleteVisit, updateVisit } from '@/services/patientService'
import { useToast } from '@/store/toastStore'

const TYPE_LABEL = { student: 'Student', staff: 'Staff', dependent: 'Dependant', other: 'Other' }
const TYPE_BADGE = { student: 'badge-blue', staff: 'badge-purple', dependent: 'badge-pink', other: 'badge-gray' }

export default function PatientQueueRow({ visit, statusBadge, onRefresh }) {
  const toast = useToast()
  const [expanded, setExpanded] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [draft, setDraft] = useState({
    temperature:    visit.temperature    ?? '',
    blood_pressure: visit.blood_pressure ?? '',
    weight:         visit.weight         ?? '',
    symptoms:       visit.symptoms       ?? '',
  })

  const time = new Date(visit.created_at).toLocaleTimeString('en-UG', {
    hour: '2-digit', minute: '2-digit',
  })

  const setD = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))

  const handleEdit = (e) => {
    e.stopPropagation()
    setDraft({
      temperature:    visit.temperature    ?? '',
      blood_pressure: visit.blood_pressure ?? '',
      weight:         visit.weight         ?? '',
      symptoms:       visit.symptoms       ?? '',
    })
    setEditing(true)
    setExpanded(true)
  }

  const handleSave = async (e) => {
    e.stopPropagation()
    setSaving(true)
    try {
      await updateVisit(visit.id, draft)
      toast.success('Visit details updated')
      setEditing(false)
      onRefresh()
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = (e) => {
    e.stopPropagation()
    setEditing(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Remove ${visit.patient_name} from today's queue?`)) return
    setDeleting(true)
    try {
      await deleteVisit(visit.id)
      toast.info(`${visit.patient_name} removed from queue`)
      onRefresh()
    } catch {
      toast.error('Failed to remove from queue.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <tr
        onClick={() => { if (!editing) setExpanded((v) => !v) }}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <td>
          <span className="font-mono text-sm font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
            {visit.queue_no}
          </span>
        </td>
        <td>
          <div>
            <p className="font-medium text-gray-900">{visit.patient_name}</p>
            <p className="text-xs text-gray-400 font-mono">
              {visit.visit_no}{visit.reg_no ? ` · ${visit.reg_no}` : ''}
            </p>
          </div>
        </td>
        <td>
          <span className={`badge ${TYPE_BADGE[visit.patient_type] || 'badge-gray'}`}>
            {TYPE_LABEL[visit.patient_type] || visit.patient_type}
          </span>
        </td>
        <td>
          <div className="text-xs text-gray-600 max-w-[160px]">
            {visit.faculty
              ? <p className="truncate font-medium">{visit.faculty.replace('Faculty of ', '').replace('School of ', '')}</p>
              : null}
            {visit.course
              ? <p className="truncate text-gray-400">{visit.course}</p>
              : <span className="text-gray-300">—</span>}
          </div>
        </td>
        <td>
          <div className="text-xs text-gray-600 space-y-0.5">
            {visit.temperature    && <p>Temp: <span className="font-medium">{visit.temperature}°C</span></p>}
            {visit.blood_pressure && <p>BP: <span className="font-medium">{visit.blood_pressure}</span></p>}
            {visit.weight         && <p>Wt: <span className="font-medium">{visit.weight} kg</span></p>}
            {!visit.temperature && !visit.blood_pressure && !visit.weight && <span className="text-gray-300">—</span>}
          </div>
        </td>
        <td className="text-sm text-gray-500">{time}</td>
        <td>{statusBadge}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} title="Save"
                  className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-40">
                  <Check size={14} />
                </button>
                <button onClick={handleCancel} title="Cancel"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} title="Edit vitals / complaint"
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={handleDelete} disabled={deleting} title="Remove from queue"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40">
                  <Trash2 size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }} title={expanded ? 'Collapse' : 'Expand'}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-primary-50 border-b border-primary-100">
          <td colSpan={8} className="px-5 py-3">
            {editing ? (
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="form-label text-xs">Temp (°C)</label>
                  <input name="temperature" value={draft.temperature} onChange={setD}
                    className="form-input py-1.5 text-sm w-24" placeholder="37.2" autoFocus />
                </div>
                <div>
                  <label className="form-label text-xs">Blood Pressure</label>
                  <input name="blood_pressure" value={draft.blood_pressure} onChange={setD}
                    className="form-input py-1.5 text-sm w-28" placeholder="120/80" />
                </div>
                <div>
                  <label className="form-label text-xs">Weight (kg)</label>
                  <input name="weight" value={draft.weight} onChange={setD}
                    className="form-input py-1.5 text-sm w-24" placeholder="65" />
                </div>
                <div className="flex-1 min-w-48">
                  <label className="form-label text-xs">Chief Complaint</label>
                  <input name="symptoms" value={draft.symptoms} onChange={setD}
                    className="form-input py-1.5 text-sm" placeholder="Reason for visit…" />
                </div>
              </div>
            ) : (
              visit.symptoms ? (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider shrink-0 mt-0.5">Chief Complaint</span>
                  <span className="text-sm text-gray-700">{visit.symptoms}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No chief complaint recorded.</p>
              )
            )}
          </td>
        </tr>
      )}
    </>
  )
}
