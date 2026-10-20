import { Link } from 'react-router-dom'
import {
  Activity, LogIn, Monitor, ArrowRight,
  UserPlus, Stethoscope, FlaskConical,
  Pill, CheckCircle, Shield, Clock, Users,
} from 'lucide-react'

const JOURNEY = [
  { step: '01', icon: UserPlus,     title: 'Reception',     desc: 'Register, get triaged and receive your queue number.',          color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { step: '02', icon: Stethoscope,  title: 'Doctor',        desc: 'See the doctor, receive your diagnosis and care plan.',         color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { step: '03', icon: FlaskConical, title: 'Lab / Pharmacy',desc: 'Get lab tests done or collect prescribed medication.',          color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { step: '04', icon: CheckCircle,  title: 'Discharge',     desc: 'Your visit is complete — records are saved to your profile.',   color: 'bg-green-50 text-green-600 border-green-100' },
]

const STATS = [
  { value: '5,000+', label: 'Students & Staff Served', icon: Users },
  { value: '< 2 min', label: 'Average Queue Time',     icon: Clock },
  { value: '100%',   label: 'Digital Records',         icon: Shield },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img src="/kyu_logo.png" alt="KYU" className="w-11 h-11 object-contain" />
            <div>
              <p className="text-[10px] text-gray-400 leading-none uppercase tracking-widest">Kyambogo University</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Medical Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/waiting" className="btn-secondary gap-2 hidden sm:inline-flex">
              <Monitor size={15} /> Waiting Screen
            </Link>
            <Link to="/login" className="btn-primary gap-2">
              <LogIn size={15} /> Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)"}} />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold bg-white/10 border border-white/20 text-primary-100 px-3 py-1.5 rounded-full mb-6">
            <Shield size={12} /> Medical Center Information System — MCIS
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Your health, managed<br />
            <span className="text-primary-200">simply and digitally</span>
          </h1>
          <p className="mt-5 text-primary-200 text-base md:text-lg max-w-2xl mx-auto">
            Kyambogo University Medical Center's integrated platform for patient registration,
            consultation, laboratory, pharmacy and health records — all in one place.
          </p>
          <div className="flex gap-4 mt-8 justify-center flex-wrap">
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
              <LogIn size={16} /> Staff Login
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary-500/40 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-500/60 transition-colors">
              <UserPlus size={16} /> Student / Staff Registration
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-extrabold text-white">{value}</p>
              <p className="text-gray-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Patient journey */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-3xl font-bold text-gray-900">Your visit, step by step</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            From the moment you walk in to the time you leave — everything is tracked, digital and instant.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {JOURNEY.map(({ step, icon: Icon, title, desc, color }, i) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${color} bg-white shadow-sm mb-4`}>
                  <Icon size={24} />
                </div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Step {step}</p>
                <p className="font-bold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                {i < JOURNEY.length - 1 && (
                  <ArrowRight size={16} className="text-gray-300 mt-3 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for patients */}
      <section className="bg-gradient-to-br from-primary-50 to-teal-50/50 border-t border-primary-100">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Already registered?</h2>
          <p className="text-gray-500 mt-2">
            Log in to view your visit history, prescriptions and health notifications.
          </p>
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            <Link to="/login" className="btn-primary px-6 py-2.5">
              <LogIn size={15} /> Login to My Portal
            </Link>
            <Link to="/register" className="btn-secondary px-6 py-2.5">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/kyu_logo.png" alt="KYU" className="w-9 h-9 object-contain" />
            <span className="text-sm text-gray-300 font-medium">KYU Medical Center — MCIS</span>
          </div>
          <div className="flex gap-6 text-xs">
            <Link to="/waiting" className="hover:text-white transition-colors">Waiting Screen</Link>
            <Link to="/login"   className="hover:text-white transition-colors">Staff Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Kyambogo University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
