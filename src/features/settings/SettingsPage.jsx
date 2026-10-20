import { useEffect, useRef, useState } from 'react'
import { Camera, KeyRound, Palette, Save, Settings, Trash2, User } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { KYU_FACULTIES } from '@/utils/constants'
import {
  changePassword, deleteAccountPhoto, getAccountSettings, getMedicalCardSettings,
  getOperationalSettings, updateAccountSettings, updateMedicalCardSettings,
  updateOperationalSettings, uploadAccountPhoto,
} from '@/services/settingsService'

const DEFAULT_COLOR = { bg: '#fce4ec', border: '#9d174d', text: '#831843' }

export default function SettingsPage() {
  const authUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const toast = useToast()
  const fileRef = useRef(null)
  const [account, setAccount] = useState(null)
  const [card, setCard] = useState(null)
  const [operations, setOperations] = useState(null)
  const [password, setPassword] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [busy, setBusy] = useState('')

  useEffect(() => {
    Promise.all([getAccountSettings(), authUser?.role === 'admin' ? getMedicalCardSettings() : Promise.resolve(null), authUser?.role === 'admin' ? getOperationalSettings() : Promise.resolve(null)])
      .then(([accountData, cardData, operationalData]) => { setAccount(accountData); setCard(cardData); setOperations(operationalData) })
      .catch(() => toast.error('Unable to load settings.'))
  }, [authUser?.role])

  const saveAccount = async () => {
    setBusy('account')
    try {
      const result = await updateAccountSettings(account)
      setAccount(result); updateUser(result); toast.success('Account settings saved.')
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to save account settings.') }
    finally { setBusy('') }
  }

  const savePassword = async () => {
    setBusy('password')
    try {
      await changePassword(password)
      setPassword({ current_password: '', password: '', password_confirmation: '' })
      toast.success('Password changed successfully.')
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to change password.') }
    finally { setBusy('') }
  }

  const changePhoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy('photo')
    try { const result = await uploadAccountPhoto(file); setAccount(result); updateUser(result); toast.success('Profile photo updated.') }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to upload photo.') }
    finally { setBusy(''); event.target.value = '' }
  }

  const removePhoto = async () => {
    setBusy('photo')
    try { const result = await deleteAccountPhoto(); setAccount(result); updateUser(result); toast.success('Profile photo removed.') }
    catch { toast.error('Unable to remove photo.') }
    finally { setBusy('') }
  }

  const setFacultyColor = (faculty, field, value) => setCard((current) => ({
    ...current,
    faculty_colors: { ...current.faculty_colors, [faculty]: { ...(current.faculty_colors[faculty] || DEFAULT_COLOR), [field]: value } },
  }))

  const saveCard = async () => {
    setBusy('card')
    try { setCard(await updateMedicalCardSettings(card)); toast.success('Medical card settings saved.') }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to save card settings.') }
    finally { setBusy('') }
  }

  const saveOperations = async () => {
    setBusy('operations')
    try { setOperations(await updateOperationalSettings(operations)); toast.success('Operational settings saved.') }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to save operational settings.') }
    finally { setBusy('') }
  }

  if (!account) return <div className="p-6 text-sm text-gray-400">Loading settings…</div>

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div><h1 className="page-title">Settings</h1><p className="text-sm text-gray-500 mt-1">Manage your account and system preferences.</p></div>

      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5"><User size={18} className="text-primary-600"/><h2 className="font-semibold text-gray-900">My profile</h2></div>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
              {account.photo_url ? <img src={account.photo_url} alt="Profile" className="w-full h-full object-cover" onError={() => setAccount((current) => ({ ...current, photo_url: null }))}/> : account.name?.split(' ').map((part) => part[0]).join('').slice(0, 2)}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={changePhoto}/>
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={busy === 'photo'} onClick={() => fileRef.current?.click()}><Camera size={14}/> Change</button>
              {account.photo_url && <button className="p-2 rounded-lg bg-red-50 text-red-600" onClick={removePhoto}><Trash2 size={15}/></button>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div><label className="form-label">Full name</label><input className="form-input" value={account.name || ''} onChange={(e) => setAccount({ ...account, name: e.target.value })}/></div>
            <div><label className="form-label">Email address</label><input type="email" className="form-input" value={account.email || ''} onChange={(e) => setAccount({ ...account, email: e.target.value })}/></div>
            <div><label className="form-label">Username</label><input className="form-input bg-gray-50" value={account.username || ''} disabled/></div>
            <div><label className="form-label">Role</label><input className="form-input bg-gray-50 capitalize" value={account.role || ''} disabled/></div>
            <label className="sm:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
              <span><span className="block text-sm font-medium text-gray-800">Notifications</span><span className="block text-xs text-gray-400">Show account and workflow notifications.</span></span>
              <input type="checkbox" className="w-4 h-4" checked={account.notifications_enabled} onChange={(e) => setAccount({ ...account, notifications_enabled: e.target.checked })}/>
            </label>
            <div className="sm:col-span-2 flex justify-end"><button className="btn-primary" onClick={saveAccount} disabled={busy === 'account'}><Save size={15}/>{busy === 'account' ? 'Saving…' : 'Save profile'}</button></div>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5"><KeyRound size={18} className="text-primary-600"/><h2 className="font-semibold text-gray-900">Change password</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="form-label">Current password</label><input type="password" className="form-input" value={password.current_password} onChange={(e) => setPassword({ ...password, current_password: e.target.value })}/></div>
          <div><label className="form-label">New password</label><input type="password" className="form-input" value={password.password} onChange={(e) => setPassword({ ...password, password: e.target.value })}/></div>
          <div><label className="form-label">Confirm new password</label><input type="password" className="form-input" value={password.password_confirmation} onChange={(e) => setPassword({ ...password, password_confirmation: e.target.value })}/></div>
        </div>
        <div className="flex justify-end mt-4"><button className="btn-primary" onClick={savePassword} disabled={busy === 'password'}><KeyRound size={15}/>{busy === 'password' ? 'Changing…' : 'Change password'}</button></div>
      </section>

      {authUser?.role === 'admin' && card && (
        <section className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><Palette size={18} className="text-purple-600"/><div><h2 className="font-semibold text-gray-900">Medical card appearance</h2><p className="text-xs text-gray-400">These colours apply to student cards and their printed copies.</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div><label className="form-label">Institution name</label><input className="form-input" value={card.institution_name} onChange={(e) => setCard({ ...card, institution_name: e.target.value })}/></div>
            <div><label className="form-label">Card title</label><input className="form-input" value={card.card_title} onChange={(e) => setCard({ ...card, card_title: e.target.value })}/></div>
          </div>
          <div className="space-y-3">
            {[...KYU_FACULTIES.map((item) => item.name), 'default'].map((faculty) => {
              const colors = card.faculty_colors?.[faculty] || DEFAULT_COLOR
              return <div key={faculty} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center rounded-xl border border-gray-100 p-3" style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}>
                <span className="text-sm font-semibold">{faculty === 'default' ? 'Default / unassigned faculty' : faculty}</span>
                <div className="flex flex-wrap gap-3 text-xs">
                  {[['bg','Background'],['border','Border'],['text','Text']].map(([field,label]) => <label key={field} className="flex items-center gap-1.5 bg-white/80 rounded-lg px-2 py-1"><span className="text-gray-600">{label}</span><input type="color" value={colors[field]} onChange={(e) => setFacultyColor(faculty, field, e.target.value)} className="w-7 h-7 border-0 bg-transparent"/></label>)}
                </div>
              </div>
            })}
          </div>
          <div className="flex justify-end mt-5"><button className="btn-primary" onClick={saveCard} disabled={busy === 'card'}><Settings size={15}/>{busy === 'card' ? 'Saving…' : 'Save system settings'}</button></div>
        </section>
      )}

      {authUser?.role === 'admin' && operations && (
        <section className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><Settings size={18} className="text-primary-600"/><div><h2 className="font-semibold text-gray-900">System operations</h2><p className="text-xs text-gray-400">Controls used by registration, queues, cards, pharmacy and account sessions.</p></div></div>

          <SettingGroup title="Medical centre identity">
            <TextSetting label="Centre name" field="centre_name" value={operations} setValue={setOperations}/>
            <TextSetting label="Email" field="centre_email" type="email" value={operations} setValue={setOperations}/>
            <TextSetting label="Telephone" field="centre_phone" value={operations} setValue={setOperations}/>
            <TextSetting label="Address" field="centre_address" value={operations} setValue={setOperations}/>
          </SettingGroup>

          <SettingGroup title="Registration and medical cards">
            <ToggleSetting label="Automatically approve new registrations" field="registration_auto_approve" value={operations} setValue={setOperations}/>
            <TextSetting label="Card number prefix" field="card_number_prefix" value={operations} setValue={setOperations}/>
            <NumberSetting label="Default card validity (years)" field="default_card_validity_years" min="1" max="10" value={operations} setValue={setOperations}/>
          </SettingGroup>

          <SettingGroup title="Patient queue">
            <TextSetting label="Queue number prefix" field="queue_prefix" value={operations} setValue={setOperations}/>
            <NumberSetting label="Maximum patients per day" field="daily_patient_limit" min="1" max="5000" value={operations} setValue={setOperations}/>
          </SettingGroup>

          <SettingGroup title="Pharmacy and stock">
            <NumberSetting label="Low-stock threshold" field="low_stock_threshold" min="1" value={operations} setValue={setOperations}/>
            <NumberSetting label="Expiry warning period (days)" field="expiry_warning_days" min="1" value={operations} setValue={setOperations}/>
            <ToggleSetting label="Allow partial prescription dispensing" field="allow_partial_dispensing" value={operations} setValue={setOperations}/>
          </SettingGroup>

          <SettingGroup title="Security and communication">
            <NumberSetting label="Login session duration (hours)" field="session_duration_hours" min="1" max="168" value={operations} setValue={setOperations}/>
            <ToggleSetting label="Show system announcement" field="announcement_enabled" value={operations} setValue={setOperations}/>
            <TextSetting label="Announcement message" field="announcement_message" value={operations} setValue={setOperations}/>
            <ToggleSetting label="Maintenance mode notice" field="maintenance_mode" value={operations} setValue={setOperations}/>
            <TextSetting label="Maintenance message" field="maintenance_message" value={operations} setValue={setOperations}/>
          </SettingGroup>

          <div className="flex justify-end mt-5"><button className="btn-primary" onClick={saveOperations} disabled={busy === 'operations'}><Save size={15}/>{busy === 'operations' ? 'Saving…' : 'Save operational settings'}</button></div>
        </section>
      )}
    </div>
  )
}

function SettingGroup({ title, children }) {
  return <div className="border-t border-gray-100 py-5 first:border-0 first:pt-0"><h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div></div>
}

function TextSetting({ label, field, value, setValue, type = 'text' }) {
  return <div><label className="form-label">{label}</label><input type={type} className="form-input" value={value[field] || ''} onChange={(e) => setValue({ ...value, [field]: e.target.value })}/></div>
}

function NumberSetting({ label, field, value, setValue, min, max }) {
  return <div><label className="form-label">{label}</label><input type="number" min={min} max={max} className="form-input" value={value[field]} onChange={(e) => setValue({ ...value, [field]: Number(e.target.value) })}/></div>
}

function ToggleSetting({ label, field, value, setValue }) {
  return <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 sm:col-span-2"><span className="text-sm font-medium text-gray-700">{label}</span><input type="checkbox" className="w-4 h-4" checked={Boolean(value[field])} onChange={(e) => setValue({ ...value, [field]: e.target.checked })}/></label>
}
