import api from './api'

export async function getAccountSettings() {
  const { data } = await api.get('/settings/account')
  return data.data
}

export async function updateAccountSettings(values) {
  const { data } = await api.put('/settings/account', values)
  return data.data
}

export async function changePassword(values) {
  const { data } = await api.put('/settings/password', values)
  return data.data
}

export async function uploadAccountPhoto(file) {
  const body = new FormData()
  body.append('photo', file)
  const { data } = await api.post('/settings/photo', body, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data.data
}

export async function deleteAccountPhoto() {
  const { data } = await api.delete('/settings/photo')
  return data.data
}

export async function getMedicalCardSettings() {
  const { data } = await api.get('/settings/medical-card')
  return data.data
}

export async function updateMedicalCardSettings(values) {
  const { data } = await api.put('/settings/medical-card', values)
  return data.data
}

export async function getOperationalSettings() {
  const { data } = await api.get('/settings/operational')
  return data.data
}

export async function updateOperationalSettings(values) {
  const { data } = await api.put('/settings/operational', values)
  return data.data
}
