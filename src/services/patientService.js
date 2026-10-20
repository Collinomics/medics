import api from './api'
import { USE_MOCK } from './config'
import { mockPatients, mockVisits } from '@/mock/patients'

// GET /api/patients/search?q=
export async function searchPatients(query) {
  if (USE_MOCK) {
    await delay(400)
    const q = query.toLowerCase()
    return mockPatients.filter(
      (p) =>
        p.firstname.toLowerCase().includes(q) ||
        p.lastname.toLowerCase().includes(q) ||
        p.student_no?.includes(q) ||
        p.patient_no.toLowerCase().includes(q)
    )
  }
  const { data } = await api.get('/patients/search', { params: { q: query } })
  return data.data
}

// GET /api/patients
export async function getPatients() {
  if (USE_MOCK) {
    await delay(400)
    return mockPatients
  }
  const { data } = await api.get('/patients')
  return data.data
}

// GET /api/patients/:id
export async function getPatient(id) {
  if (USE_MOCK) {
    await delay(300)
    return mockPatients.find((p) => p.id === id) || null
  }
  const { data } = await api.get(`/patients/${id}`)
  return data.data
}

// POST /api/patients
export async function registerPatient(patientData) {
  if (USE_MOCK) {
    await delay(700)
    const newPatient = {
      ...patientData,
      id: mockPatients.length + 1,
      patient_no: `P-2026-00${mockPatients.length + 1}`,
      medical_card_status: 'pending',
      medical_card_no: null,
      created_at: new Date().toISOString(),
    }
    mockPatients.push(newPatient)
    return newPatient
  }
  const { data } = await api.post('/patients', patientData)
  return data.data
}

// POST /api/visits  (create visit / triage)
export async function createVisit(visitData) {
  if (USE_MOCK) {
    await delay(600)
    const newVisit = {
      ...visitData,
      id: mockVisits.length + 1,
      visit_no: `V-2026-00${String(mockVisits.length + 1).padStart(2, '0')}`,
      queue_no: `Q${String(mockVisits.length + 1).padStart(3, '0')}`,
      status: 'waiting',
      created_at: new Date().toISOString(),
    }
    mockVisits.push(newVisit)
    return newVisit
  }
  const { data } = await api.post('/visits', visitData)
  return data.data
}

// GET /api/visits?date=today  (today's queue for reception)
export async function getTodaysVisits() {
  if (USE_MOCK) {
    await delay(400)
    return mockVisits
  }
  const { data } = await api.get('/visits', { params: { date: 'today' } })
  return data.data
}

// GET /api/visits/queue  (doctor's queue — waiting patients)
export async function getDoctorQueue() {
  if (USE_MOCK) {
    await delay(400)
    return mockVisits.filter((v) => ['waiting', 'in_consultation'].includes(v.status))
  }
  const { data } = await api.get('/visits/queue')
  return data.data
}

// PUT /api/visits/:id  (update visit status / add diagnosis)
export async function updateVisit(id, updates) {
  if (USE_MOCK) {
    await delay(500)
    const idx = mockVisits.findIndex((v) => v.id === id)
    if (idx !== -1) mockVisits[idx] = { ...mockVisits[idx], ...updates }
    return mockVisits[idx]
  }
  const { data } = await api.put(`/visits/${id}`, updates)
  return data.data
}

// POST /api/visits/:id/consultation (diagnosis and all clinical orders)
export async function saveConsultation(id, consultation) {
  if (USE_MOCK) {
    return updateVisit(id, {
      diagnosis: consultation.diagnosis,
      symptoms: consultation.symptoms,
      notes: consultation.notes,
      status: consultation.routes[0] || 'completed',
    })
  }
  const { data } = await api.post(`/visits/${id}/consultation`, consultation)
  return data.data
}
export async function startVisit(id) { if (USE_MOCK) return updateVisit(id,{status:'in_consultation'}); const {data}=await api.post(`/visits/${id}/start`); return data.data }
export async function completeVisit(id, notes) { if (USE_MOCK) return updateVisit(id,{status:'completed',notes}); const {data}=await api.post(`/visits/${id}/complete`,{status:'completed',notes}); return data.data }

// GET /api/visits/history
export async function getVisitHistory(params = {}) {
  if (USE_MOCK) {
    await delay(400)
    return mockVisits
  }
  const { data } = await api.get('/visits/history', { params })
  return data.data
}

// DELETE /api/visits/:id
export async function deleteVisit(id) {
  if (USE_MOCK) {
    await delay(300)
    const idx = mockVisits.findIndex((v) => v.id === id)
    if (idx !== -1) mockVisits.splice(idx, 1)
    return
  }
  await api.delete(`/visits/${id}`)
}

// PUT /api/patients/:id
export async function updatePatient(id, data) {
  if (USE_MOCK) {
    await delay(400)
    const idx = mockPatients.findIndex((p) => p.id === id)
    if (idx !== -1) mockPatients[idx] = { ...mockPatients[idx], ...data }
    return mockPatients[idx]
  }
  const { data: res } = await api.put(`/patients/${id}`, data)
  return res?.data
}

// POST /api/medical-cards  (issue medical card)
export async function issueMedicalCard(patientId) {
  if (USE_MOCK) {
    await delay(500)
    const patient = mockPatients.find((p) => p.id === patientId)
    if (patient) {
      patient.medical_card_status = 'issued'
      patient.medical_card_no = `MC-2026-00${String(patientId).padStart(3, '0')}`
      // Mirror status onto any open visit for that patient
      mockVisits
        .filter((v) => v.patient_id === patientId)
        .forEach((v) => {
          v.medical_card_status = 'issued'
          v.medical_card_no = patient.medical_card_no
        })
    }
    return patient
  }
  const { data } = await api.post('/medical-cards', { patient_id: patientId })
  return data.data
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
