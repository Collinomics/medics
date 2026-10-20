import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ToastContainer from '@/components/Toast'
import { ROLES } from '@/utils/constants'
import ProtectedRoute from '@/router/ProtectedRoute'

// Public pages
import LandingPage    from '@/features/landing/LandingPage'
import WaitingScreen  from '@/features/landing/WaitingScreen'
import LoginPage      from '@/features/auth/LoginPage'
import RegisterPage   from '@/features/auth/RegisterPage'

// Protected pages
import AdminDashboard     from '@/features/admin/AdminDashboard'
import StudentPortal      from '@/features/student/StudentPortal'
import ReceptionDashboard from '@/features/reception/ReceptionDashboard'
import DoctorDashboard    from '@/features/doctor/DoctorDashboard'
import LabDashboard       from '@/features/lab/LabDashboard'
import InjectionDashboard from '@/features/injection/InjectionDashboard'
import PharmacyDashboard  from '@/features/pharmacy/PharmacyDashboard'
import RecordsDashboard   from '@/features/records/RecordsDashboard'
import DentalDashboard    from '@/features/dental/DentalDashboard'
import SettingsPage       from '@/features/settings/SettingsPage'

const { ADMIN, RECEPTIONIST, DOCTOR, LAB, INJECTION, PHARMACIST, DENTAL, RECORDS, STUDENT, STAFF, DEPENDENT } = ROLES

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <p className="text-6xl font-bold text-gray-200">404</p>
        <p className="text-lg font-semibold text-gray-700 mt-2">Page not found</p>
        <a href="/" className="btn-primary mt-4 inline-flex">Go Home</a>
      </div>
    </div>
  )
}

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <p className="text-6xl font-bold text-gray-200">403</p>
        <p className="text-lg font-semibold text-gray-700 mt-2">You don't have permission to view this page.</p>
        <a href="/" className="btn-secondary mt-4 inline-flex">Go Home</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<LandingPage />} />
        <Route path="/waiting" element={<WaitingScreen />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Student / Non-technical staff portal */}
        <Route path="/my-portal" element={
          <ProtectedRoute allowedRoles={[STUDENT, STAFF, DEPENDENT]}>
            <StudentPortal />
          </ProtectedRoute>
        } />

        {/* Reception */}
        <Route path="/reception" element={
          <ProtectedRoute allowedRoles={[ADMIN, RECEPTIONIST]}>
            <ReceptionDashboard />
          </ProtectedRoute>
        } />

        {/* Doctor */}
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={[ADMIN, DOCTOR]}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />

        {/* Laboratory */}
        <Route path="/lab" element={
          <ProtectedRoute allowedRoles={[ADMIN, LAB]}>
            <LabDashboard />
          </ProtectedRoute>
        } />

        {/* Injection Room */}
        <Route path="/injection" element={
          <ProtectedRoute allowedRoles={[ADMIN, INJECTION]}>
            <InjectionDashboard />
          </ProtectedRoute>
        } />

        {/* Pharmacy */}
        <Route path="/pharmacy" element={
          <ProtectedRoute allowedRoles={[ADMIN, PHARMACIST]}>
            <PharmacyDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dental" element={<ProtectedRoute allowedRoles={[ADMIN, DENTAL]}><DentalDashboard /></ProtectedRoute>} />

        {/* Data & Records */}
        <Route path="/records" element={
          <ProtectedRoute allowedRoles={[ADMIN, RECORDS]}>
            <RecordsDashboard />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={Object.values(ROLES)}>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
