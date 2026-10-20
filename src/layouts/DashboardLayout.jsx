import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, Menu, X, LogOut,
  Home, Stethoscope, FlaskConical,
  Syringe, Pill, BarChart2, User,
  Bell, ChevronRight, ShieldCheck, Smile,
  Settings,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { ROLES } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { getMyNotifications, markNotificationRead } from '@/services/studentService'
import { getOperationalSettings } from '@/services/settingsService'

const NAV_ITEMS = [
  { to: '/admin',      label: 'Admin',          icon: ShieldCheck,  roles: [ROLES.ADMIN] },
  { to: '/reception',  label: 'Reception',      icon: Home,         roles: [ROLES.ADMIN, ROLES.RECEPTIONIST] },
  { to: '/doctor',     label: 'Doctor Portal',  icon: Stethoscope,  roles: [ROLES.ADMIN, ROLES.DOCTOR] },
  { to: '/lab',        label: 'Laboratory',     icon: FlaskConical, roles: [ROLES.ADMIN, ROLES.LAB] },
  { to: '/injection',  label: 'Injection Room', icon: Syringe,      roles: [ROLES.ADMIN, ROLES.INJECTION] },
  { to: '/pharmacy',   label: 'Pharmacy',       icon: Pill,         roles: [ROLES.ADMIN, ROLES.PHARMACIST] },
  { to: '/dental',     label: 'Dental Clinic',  icon: Smile,        roles: [ROLES.ADMIN, ROLES.DENTAL] },
  { to: '/records',    label: 'Data & Records', icon: BarChart2,    roles: [ROLES.ADMIN, ROLES.RECORDS] },
  { to: '/my-portal',  label: 'My Portal',      icon: User,         roles: [ROLES.STUDENT, ROLES.STAFF, ROLES.DEPENDENT] },
  { to: '/settings',   label: 'Settings',       icon: Settings,     roles: Object.values(ROLES) },
]

const ROLE_COLORS = {
  admin:     'bg-purple-500',
  reception: 'bg-blue-500',
  doctor:    'bg-teal-500',
  lab:       'bg-violet-500',
  injection: 'bg-cyan-500',
  pharmacy:  'bg-green-500',
  dental:    'bg-orange-500',
  records:   'bg-indigo-500',
  student:   'bg-primary-500',
  staff:     'bg-orange-500',
  dependent: 'bg-pink-500',
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-right hidden lg:block">
      <p className="text-xs font-mono text-slate-300 leading-none">
        {time.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[10px] text-slate-500 mt-0.5">
        {time.toLocaleDateString('en-UG', { weekday: 'short', day: '2-digit', month: 'short' })}
      </p>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, logout, updateUser } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [systemSettings, setSystemSettings] = useState(null)

  const loadNotifications = async () => {
    try { setNotifications(await getMyNotifications()) } catch { setNotifications([]) }
  }

  useEffect(() => {
    loadNotifications()
    getOperationalSettings().then(setSystemSettings).catch(() => {})
    const id = setInterval(loadNotifications, 60000)
    return () => clearInterval(id)
  }, [user?.id])

  const unreadNotifications = notifications.filter((item) => !item.read)
  const readNotification = async (id) => {
    await markNotificationRead(id)
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }

  const visibleLinks = NAV_ITEMS.filter((item) => item.roles.includes(user?.role))
  const avatarColor  = ROLE_COLORS[user?.role] || 'bg-slate-500'
  const currentPage  = visibleLinks.find((n) => n.to === location.pathname)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <img src="/kyu_logo.png" alt="KYU" className="w-11 h-11 object-contain shrink-0" />
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Kyambogo University</p>
          <p className="text-sm font-bold text-white leading-tight mt-0.5">Medical Center</p>
        </div>
      </div>

      {/* Module label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Modules</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {visibleLinks.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                {label}
              </div>
              {active && <ChevronRight size={14} className="text-primary-300" />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700/60 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-white ${avatarColor}`}>
            {user?.photo_url ? <img src={user.photo_url} alt={user?.name || 'Profile'} className="w-full h-full object-cover" onError={() => updateUser({ photo_url: null })} /> : initials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="relative z-30 flex items-center justify-between h-14 px-3 sm:px-4 bg-white border-b border-gray-200 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-900">{currentPage?.label || 'Dashboard'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LiveClock />
            {user?.notifications_enabled !== false && <div className="relative">
              <button onClick={() => { setNotificationsOpen((open) => !open); if (!notificationsOpen) loadNotifications() }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative" aria-label="Notifications">
                <Bell size={18} />
                {unreadNotifications.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}</span>}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    <button onClick={() => setNotificationsOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={16}/></button>
                  </div>
                  {notifications.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications.</p> : notifications.map((item) => (
                    <button key={item.id} onClick={() => !item.read && readNotification(item.id)} className={`block w-full border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${item.read ? '' : 'bg-primary-50/60'}`}>
                      <p className={`text-sm ${item.read ? 'text-gray-600' : 'font-medium text-gray-900'}`}>{item.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('en-UG')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden text-xs font-bold text-white ${avatarColor}`}>
              {user?.photo_url ? <img src={user.photo_url} alt={user?.name || 'Profile'} className="w-full h-full object-cover" onError={() => updateUser({ photo_url: null })} /> : initials(user?.name)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col">
          {(systemSettings?.announcement_enabled || systemSettings?.maintenance_mode) && (
            <div className={`px-4 py-2 text-center text-sm font-medium ${systemSettings.maintenance_mode ? 'bg-amber-100 text-amber-900 border-b border-amber-200' : 'bg-primary-50 text-primary-800 border-b border-primary-100'}`}>
              {systemSettings.maintenance_mode ? systemSettings.maintenance_message : systemSettings.announcement_message}
            </div>
          )}
          <div className="flex-1">{children}</div>
          <footer className="border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Kyambogo University Medical Center. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  )
}
