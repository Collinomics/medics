import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, CheckCircle, Pill } from 'lucide-react'
import { dispensePrescription } from '@/services/pharmacyService'
import { useToast } from '@/store/toastStore'

export default function DispenseModal({ prescription, onClose, onSuccess }) {
  const toast = useToast()
  const [loading, setLoading]   = useState(false)
  const [dispensed, setDispensed] = useState(prescription.status === 'dispensed')
  const [error, setError]       = useState('')
  const [quantities, setQuantities] = useState(() => Object.fromEntries(prescription.items.map((item) => [item.id, item.dispensed_quantity || item.quantity])))

  const isNew = ['pending', 'partial'].includes(prescription.status)

  const handleDispense = async () => {
    setLoading(true)
    setError('')
    try {
      await dispensePrescription(prescription.id, prescription.items.map((item) => ({ item_id: item.id, quantity: Number(quantities[item.id] || 0) })))
      setDispensed(true)
      toast.success(`Prescription ${prescription.prescription_no} dispensed`)
    } catch {
      setError('Failed to dispense. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintEMF = () => {
    const printContent = buildEMFContent(prescription)
    const win = window.open('', '_blank', 'width=800,height=600')
    win.document.write(printContent)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Pill size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Dispense Prescription</h2>
              <p className="text-xs text-gray-500">{prescription.prescription_no}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Patient & doctor info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-sm">
            <div>
              <p className="text-xs text-gray-400">Patient</p>
              <p className="font-semibold text-gray-900">{prescription.patient_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Prescribing Doctor</p>
              <p className="font-medium text-gray-800">{prescription.doctor}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Prescription #</p>
              <p className="font-mono text-sm font-semibold text-green-700">{prescription.prescription_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="font-medium text-gray-800">
                {new Date(prescription.created_at).toLocaleDateString('en-UG')}
              </p>
            </div>
          </div>

          {/* Drug items */}
          <div>
            <p className="form-label mb-2">Prescribed Drugs</p>
            <div className="border border-gray-200 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Drug</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Dosage</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{item.drug_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.dosage}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.frequency}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.duration}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                        {isNew ? <input type="number" min={item.dispensed_quantity || 0} max={item.quantity} value={quantities[item.id]} onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))} className="form-input w-20 ml-auto text-right" /> : `${item.dispensed_quantity}/${item.quantity}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {dispensed && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2.5 rounded-lg text-sm">
              <CheckCircle size={16} />
              Drugs dispensed successfully. You can now print the EMF.
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100 shrink-0 gap-3">
          <button onClick={onClose} className="btn-secondary">
            {dispensed ? 'Close' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {dispensed && (
              <button onClick={handlePrintEMF} className="btn-secondary">
                <Printer size={15} /> Print EMF
              </button>
            )}
            {isNew && !dispensed && (
              <button onClick={handleDispense} disabled={loading} className="btn-primary">
                {loading ? 'Processing…' : <><CheckCircle size={15} /> Confirm Dispense</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function buildEMFContent(rx) {
  const date = new Date(rx.created_at).toLocaleDateString('en-UG', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const rows = rx.items.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.drug_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.dosage}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.frequency}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.duration}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>EMF — ${rx.prescription_no}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 14px; margin: 0; font-weight: normal; color: #555; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
    .label { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
    .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #1d4ed8; color: white; }
    th { padding: 8px 12px; text-align: left; font-size: 12px; }
    .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .sig-line { border-top: 1px solid #111; margin-top: 32px; padding-top: 4px; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Kyambogo University Medical Center</h1>
      <h2>Electronic Medical Form (EMF) — Drug Dispensing</h2>
    </div>
    <div style="text-align:right;font-size:12px;color:#555;">
      <p style="margin:0;"><strong>${rx.prescription_no}</strong></p>
      <p style="margin:0;">${date}</p>
    </div>
  </div>

  <div class="grid">
    <div><div class="label">Patient Name</div><div class="value">${rx.patient_name}</div></div>
    <div><div class="label">Prescribing Doctor</div><div class="value">${rx.doctor}</div></div>
    <div><div class="label">Prescription #</div><div class="value">${rx.prescription_no}</div></div>
    <div><div class="label">Date Dispensed</div><div class="value">${date}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Drug Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th style="text-align:right;">Qty</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <div><div class="sig-line">Pharmacist Signature &amp; Stamp</div></div>
    <div><div class="sig-line">Patient / Collector Signature</div></div>
  </div>
</body>
</html>`
}
