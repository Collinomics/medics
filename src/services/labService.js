import api from './api'
import { USE_MOCK } from './config'
import { mockLabTests, mockLabRequests } from '@/mock/lab'

// GET /api/lab-tests  (master list of test types)
export async function getLabTests() {
  if (USE_MOCK) {
    await delay(300)
    return mockLabTests
  }
  const { data } = await api.get('/lab-tests')
  return data.data
}

// GET /api/lab-requests?status=pending
export async function getLabRequests(status = 'pending') {
  if (USE_MOCK) {
    await delay(400)
    return status === 'all'
      ? mockLabRequests
      : mockLabRequests.filter((r) => r.status === status)
  }
  const { data } = await api.get('/lab-requests', { params: { status } })
  return data.data
}

// PUT /api/lab-requests/:id  (enter result)
export async function submitLabResult(id, result, remarks) {
  if (USE_MOCK) {
    await delay(500)
    const req = mockLabRequests.find((r) => r.id === id)
    if (req) { req.result = result; req.remarks = remarks; req.status = 'completed' }
    return req
  }
  const { data } = await api.put(`/lab-requests/${id}`, { result, remarks, status: 'completed' })
  return data.data
}

// POST /api/lab-requests  (doctor orders a test)
export async function orderLabTest(visitId, testId, requestedBy) {
  if (USE_MOCK) {
    await delay(400)
    const test = mockLabTests.find((t) => t.id === testId)
    const newReq = {
      id: mockLabRequests.length + 1,
      request_no: `LR-2026-00${mockLabRequests.length + 1}`,
      patient_name: 'Patient',
      test_name: test?.test_name || 'Unknown',
      requested_by: requestedBy,
      visit_id: visitId,
      status: 'pending',
      result: null,
      remarks: null,
      request_date: new Date().toISOString(),
    }
    mockLabRequests.push(newReq)
    return newReq
  }
  const { data } = await api.post('/lab-requests', { visit_id: visitId, test_id: testId })
  return data.data
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
