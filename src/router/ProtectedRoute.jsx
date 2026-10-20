import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import DashboardLayout from '@/layouts/DashboardLayout'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
