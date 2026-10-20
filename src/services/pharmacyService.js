import api from './api'
import { USE_MOCK } from './config'
import { mockDrugs, mockPrescriptions, mockInjectionOrders } from '@/mock/pharmacy'

// GET /api/drugs
export async function getDrugs() {
  if (USE_MOCK) {
    await delay(400)
    return mockDrugs
  }
  const { data } = await api.get('/drugs')
  return data.data
}

// GET /api/prescriptions?status=pending
export async function getPrescriptions(status = 'pending') {
  if (USE_MOCK) {
    await delay(400)
    return status === 'all'
      ? mockPrescriptions
      : mockPrescriptions.filter((p) => p.status === status)
  }
  const { data } = await api.get('/prescriptions', { params: { status } })
  return data.data
}

// POST /api/prescriptions  (doctor creates prescription)
export async function createPrescription(visitId, items) {
  if (USE_MOCK) {
    await delay(500)
    const newRx = {
      id: mockPrescriptions.length + 1,
      prescription_no: `RX-2026-00${mockPrescriptions.length + 1}`,
      visit_id: visitId,
      status: 'pending',
      items,
      created_at: new Date().toISOString(),
    }
    mockPrescriptions.push(newRx)
    return newRx
  }
  const { data } = await api.post('/prescriptions', { visit_id: visitId, items })
  return data.data
}

// PUT /api/prescriptions/:id/dispense  (pharmacist dispenses)
export async function dispensePrescription(id, items) {
  if (USE_MOCK) {
    await delay(600)
    const rx = mockPrescriptions.find((p) => p.id === id)
    if (rx) rx.status = 'dispensed'
    return rx
  }
  const { data } = await api.put(`/prescriptions/${id}/dispense`, { items })
  return data.data
}

// GET /api/injection-orders?status=pending
export async function getInjectionOrders(status = 'pending') {
  if (USE_MOCK) {
    await delay(400)
    return status === 'all'
      ? mockInjectionOrders
      : mockInjectionOrders.filter((o) => o.status === status)
  }
  const { data } = await api.get('/injection-orders', { params: { status } })
  return data.data
}

// PUT /api/injection-orders/:id/done
export async function markInjectionDone(id, dischargedTo, drug, remarks) {
  if (USE_MOCK) {
    await delay(500)
    return { id, status: 'done', discharged_to: dischargedTo }
  }
  const { data } = await api.put(`/injection-orders/${id}/done`, { discharged_to: dischargedTo, drug, remarks })
  return data.data
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
