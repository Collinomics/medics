import api from './api'
export async function getDentalReferrals(status='pending'){const {data}=await api.get('/referrals',{params:{status}});return data.data}
export async function completeDentalReferral(id,outcome,notes){const {data}=await api.put(`/referrals/${id}/complete`,{outcome,notes});return data.data}
