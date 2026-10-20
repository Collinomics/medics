import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { login as loginService } from '@/services/authService'
import { USE_MOCK } from '@/services/config'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, token } = await loginService(form.username, form.password)
      login(user, token)
      // Route to correct dashboard based on role
      const role = user.role
      const routes = {
        admin:     '/admin',
        reception: '/reception',
        doctor:    '/doctor',
        lab:       '/lab',
        injection: '/injection',
        pharmacy:  '/pharmacy',
        records:   '/records',
        dental:    '/dental',
        student:   '/my-portal',
        staff:     '/my-portal',
        dependent: '/my-portal',
      }
      navigate(routes[role] || '/login')
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/kyu_logo.png" alt="Kyambogo University" className="w-24 h-24 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kyambogo University Medical Center
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Username / Reg. No.</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. 2400808050 or jdoe"
                className="form-input"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="form-input pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-400 cursor-not-allowed" title="Contact the admin to reset your password">
              Forgot password?
            </span>
            <Link to="/register" className="text-primary-600 hover:underline">
              Register
            </Link>
          </div>
        </div>

        {USE_MOCK && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <p className="font-semibold">Frontend demo mode</p>
            <p className="mt-1 text-blue-700">Password for every demo account: <strong>password</strong></p>
            <p className="mt-2 leading-5 text-blue-700">
              admin · receptionist · doctor · lab · nurse · pharmacist · 2400808050
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
