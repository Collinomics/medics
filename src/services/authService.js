import api from './api'
import { USE_MOCK } from './config'
import { mockUsers } from '@/mock/users'

// POST /api/auth/login
export async function login(username, password) {
  if (USE_MOCK) {
    await delay(600)
    const user = mockUsers.find(
      (u) => u.username === username && u.password === password
    )
    if (!user) throw { response: { data: { error: 'Invalid username or password.' } } }
    const { password: _, ...safeUser } = user
    return { user: safeUser, token: 'mock-jwt-token' }
  }
  const { data } = await api.post('/auth/login', { username, password })
  return data.data
}

// POST /api/auth/register
export async function register(formData) {
  if (USE_MOCK) {
    await delay(800)
    const username = formData.student_no || formData.staff_no ||
      `${formData.surname || 'patient'}${String(formData.contact || '').slice(-4)}`.toLowerCase()
    return {
      full_name: `${formData.surname || ''} ${formData.other_names || ''}`.trim(),
      username,
      email: formData.email || null,
      message: 'Account created successfully.',
    }
  }
  const { data } = await api.post('/auth/register', formData)
  return data.data
}

// GET /api/auth/me
export async function getMe() {
  if (USE_MOCK) {
    await delay(300)
    return mockUsers[0]
  }
  const { data } = await api.get('/auth/me')
  return data.data
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
