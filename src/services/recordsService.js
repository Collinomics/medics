import api from './api'
import { USE_MOCK } from './config'
import { mockDrugs } from '@/mock/pharmacy'
import { mockVisits } from '@/mock/patients'

// GET /api/records/drugs  (stock levels)
export async function getDrugStock() {
  if (USE_MOCK) {
    await delay(400)
    return mockDrugs
  }
  const { data } = await api.get('/records/drugs')
  return data.data
}

// GET /api/records/trends?from=&to=
export async function getTrends(from, to) {
  if (USE_MOCK) {
    await delay(500)
    return {
      disease_trends: [
        { month: 'Jan', malaria: 45, fever: 30, typhoid: 12 },
        { month: 'Feb', malaria: 38, fever: 42, typhoid: 8 },
        { month: 'Mar', malaria: 52, fever: 28, typhoid: 15 },
        { month: 'Apr', malaria: 60, fever: 35, typhoid: 10 },
        { month: 'May', malaria: 48, fever: 50, typhoid: 18 },
        { month: 'Jun', malaria: 55, fever: 45, typhoid: 14 },
      ],
      drug_consumption: [
        { month: 'Jan', paracetamol: 120, coartem: 60, amoxicillin: 45 },
        { month: 'Feb', paracetamol: 98,  coartem: 48, amoxicillin: 52 },
        { month: 'Mar', paracetamol: 140, coartem: 72, amoxicillin: 38 },
        { month: 'Apr', paracetamol: 160, coartem: 85, amoxicillin: 60 },
        { month: 'May', paracetamol: 130, coartem: 65, amoxicillin: 55 },
        { month: 'Jun', paracetamol: 145, coartem: 70, amoxicillin: 48 },
      ],
      demographics: {
        by_type:   [{ name: 'Students', value: 68 }, { name: 'Staff', value: 22 }, { name: 'Dependants', value: 10 }],
        by_gender: [{ name: 'Male', value: 54 }, { name: 'Female', value: 46 }],
      },
    }
  }
  const { data } = await api.get('/records/trends', { params: { from, to } })
  const raw = data.data

  if (raw.disease_trends && raw.drug_consumption && raw.demographics) return raw

  // Normalize backend shape → frontend shape
  const disease_trends = (raw.visits_by_month || []).map((m) => ({
    month:   m.month,
    malaria: 0,
    fever:   0,
    typhoid: 0,
    total:   m.visits,
  }))

  // Inject top_diagnoses counts into the months array
  ;(raw.top_diagnoses || []).forEach((d) => {
    const key = d.diagnosis?.toLowerCase()
    disease_trends.forEach((m) => {
      if (key?.includes('malaria')) m.malaria = Math.round(d.count / disease_trends.length)
      else if (key?.includes('typhoid')) m.typhoid = Math.round(d.count / disease_trends.length)
      else if (key?.includes('flu') || key?.includes('fever') || key?.includes('uri')) m.fever = Math.round(d.count / disease_trends.length)
    })
  })

  const drug_consumption = (raw.visits_by_month || []).map((m, i) => {
    const usage = raw.drug_usage || []
    return {
      month:        m.month,
      paracetamol:  Math.round((usage[0]?.dispensed || 0) / disease_trends.length),
      coartem:      Math.round((usage[1]?.dispensed || 0) / disease_trends.length),
      amoxicillin:  Math.round((usage[2]?.dispensed || 0) / disease_trends.length),
    }
  })

  const total = (raw.patient_types || []).reduce((s, t) => s + t.count, 0) || 1
  const by_type = (raw.patient_types || []).map((t) => ({
    name:  t.type.charAt(0).toUpperCase() + t.type.slice(1) + 's',
    value: Math.round((t.count / total) * 100),
  }))

  return {
    disease_trends,
    drug_consumption,
    demographics: {
      by_type,
      by_gender: [{ name: 'Male', value: 54 }, { name: 'Female', value: 46 }],
    },
    raw,
  }
}

// GET /api/records/export  (trigger PDF generation)
export async function exportReport(from, to) {
  if (USE_MOCK) {
    await delay(1000)
    alert('PDF export will be available when the backend is connected.')
    return null
  }
  const response = await api.get('/records/export', {
    params: { from, to },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `mcis-report-${from}-${to}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
