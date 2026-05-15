import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import LoadingSpinner from './components/common/LoadingSpinner.jsx'
import Layout from './components/Layout/Layout.jsx'

import LoginPage from './pages/Login/LoginPage.jsx'
import RegisterPage from './pages/Register/RegisterPage.jsx'
import DashboardPage from './pages/Dashboard/DashboardPage.jsx'
import FilesPage from './pages/Files/FilesPage.jsx'
import BillingPage from './pages/Billing/BillingPage.jsx'
import UsagePage from './pages/Usage/UsagePage.jsx'
import NotificationsPage from './pages/Notifications/NotificationsPage.jsx'
import SettingsPage from './pages/Settings/SettingsPage.jsx'
import AdminPage from './pages/Admin/AdminPage.jsx'

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Restoring session..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Outlet />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/usage" element={<UsagePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}