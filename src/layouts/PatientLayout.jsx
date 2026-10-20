import { useNavigate } from 'react-router-dom'
import { Activity, LogOut, Bell } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function PatientLayout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/kyu_logo.png" alt="KYU" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[10px] text-gray-400 leading-none uppercase tracking-widest">Kyambogo University</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Medical Center</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
              {initials(user?.name)}
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <LogOut size={15} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
