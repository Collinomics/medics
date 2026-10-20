import api from './api'
import { USE_MOCK } from './config'
import { mockStudentVisits, mockNotifications } from '@/mock/studentPortal'
import { mockPatients } from '@/mock/patients'
import useAuthStore from '@/store/authStore'

// GET /api/my/profile
export async function getMyProfile() {
  if (USE_MOCK) {
    await delay(400)
    const username = useAuthStore.getState().user?.username
    return mockPatients.find((p) => p.student_no === username) || mockPatients[0]
  }
  const { data } = await api.get('/my/profile')
  return data.data
}

// PUT /api/my/profile
export async function updateMyProfile(updates) {
  if (USE_MOCK) {
    await delay(600)
    const username = useAuthStore.getState().user?.username
    const patient = mockPatients.find((p) => p.student_no === username) || mockPatients[0]
    Object.assign(patient, updates)
    return patient
  }
  const { data } = await api.put('/my/profile', updates)
  return data.data
}

// GET /api/my/visits
export async function getMyVisits() {
  if (USE_MOCK) {
    await delay(400)
    return mockStudentVisits
  }
  const { data } = await api.get('/my/visits')
  return data.data
}

// GET /api/my/notifications
export async function getMyNotifications() {
  if (USE_MOCK) {
    await delay(300)
    return mockNotifications
  }
  const { data } = await api.get('/my/notifications')
  return data.data
}

// PUT /api/my/notifications/:id/read
export async function markNotificationRead(id) {
  if (USE_MOCK) {
    await delay(200)
    const n = mockNotifications.find((n) => n.id === id)
    if (n) n.read = true
    return n
  }
  const { data } = await api.put(`/my/notifications/${id}/read`)
  return data.data
}

// POST /api/my/photo
export async function uploadPhoto(file) {
  const fd = new FormData()
  fd.append('photo', file)
  const { data } = await api.post('/my/photo', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

// DELETE /api/my/photo
export async function deletePhoto() {
  const { data } = await api.delete('/my/photo')
  return data.data
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
