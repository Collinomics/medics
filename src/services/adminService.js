import api from './api'
import { USE_MOCK } from './config'
import { mockUsers } from '@/mock/users'
import { mockPatients, mockVisits } from '@/mock/patients'

// GET /api/admin/stats
export async function getSystemStats() {
  if (USE_MOCK) {
    await delay(400)
    const today = new Date().toISOString().slice(0, 10)
    return {
      total_patients:  mockPatients.length,
      visits_today:    mockVisits.filter((v) => v.created_at?.startsWith(today)).length,
      active_staff:    mockUsers.filter((u) => !['student','staff','dependent'].includes(u.role) && u.status !== 'inactive').length,
      cards_issued:    mockPatients.filter((p) => p.medical_card_status === 'issued').length,
      pending_lab:     0,
      pending_rx:      0,
    }
  }
  const { data } = await api.get('/admin/stats')
  return data.data
}

// GET /api/admin/staff
export async function getStaff() {
  if (USE_MOCK) {
    await delay(400)
    return mockUsers.filter((u) => !['student','staff','dependent'].includes(u.role))
  }
  const { data } = await api.get('/admin/staff')
  return data.data
}

// POST /api/admin/staff
export async function createStaff(staffData) {
  if (USE_MOCK) {
    await delay(700)
    const newUser = {
      ...staffData,
      id: mockUsers.length + 1,
      status: 'active',
      password: 'password',
    }
    mockUsers.push(newUser)
    return newUser
  }
  const { data } = await api.post('/admin/staff', staffData)
  return data.data
}

// PUT /api/admin/staff/:id
export async function updateStaff(id, updates) {
  if (USE_MOCK) {
    await delay(500)
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...updates }
    return mockUsers[idx]
  }
  const { data } = await api.put(`/admin/staff/${id}`, updates)
  return data.data
}

// PUT /api/admin/staff/:id/toggle-status
export async function toggleStaffStatus(id) {
  if (USE_MOCK) {
    await delay(400)
    const user = mockUsers.find((u) => u.id === id)
    if (user) user.status = user.status === 'active' ? 'inactive' : 'active'
    return user
  }
  const { data } = await api.put(`/admin/staff/${id}/toggle-status`)
  return data.data
}

// GET /api/admin/pending-registrations
export async function getPendingRegistrations() {
  if (USE_MOCK) { await delay(300); return [] }
  const { data } = await api.get('/admin/pending-registrations')
  return data.data
}

// PUT /api/admin/pending-registrations/:id/approve
export async function approveRegistration(id) {
  const { data } = await api.put(`/admin/pending-registrations/${id}/approve`)
  return data.data
}

// PUT /api/admin/pending-registrations/:id/reject
export async function rejectRegistration(id) {
  const { data } = await api.put(`/admin/pending-registrations/${id}/reject`, { reason: 'Registration rejected by administrator.' })
  return data.data
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
