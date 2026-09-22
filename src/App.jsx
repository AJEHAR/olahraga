import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RequireRole from './components/RequireRole'
import Layout from './components/Layout'

import Landing from './pages/public/Landing'
import Results from './pages/public/Results'
import Leaderboard from './pages/public/Leaderboard'
import Login from './pages/Login'
import SignUpAdmin from './pages/SignUpAdmin'

import AdminDashboard from './pages/admin/Dashboard'
import CategoriesEvents from './pages/admin/CategoriesEvents'
import Schedule from './pages/admin/Schedule'
import Heats from './pages/admin/Heats'
import AdminResults from './pages/admin/Results'
import Teams from './pages/admin/Teams'
import PointsTable from './pages/admin/PointsTable'

import TeamDashboard from './pages/team/Dashboard'
import Participants from './pages/team/Participants'
import TeamSchedule from './pages/team/TeamSchedule'
import TeamResults from './pages/team/TeamResults'

import SuperAdminDashboard from './pages/superadmin/Dashboard'
import SuperAdminSettings from './pages/superadmin/Settings'

import { ROLES } from './lib/constants'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Awam */}
            <Route path="/" element={<Landing />} />
            <Route path="/log-masuk" element={<Login />} />
            <Route path="/daftar-admin" element={<SignUpAdmin />} />
            <Route path="/keputusan/:code" element={<Results />} />
            <Route path="/carta/:code" element={<Leaderboard />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/acara"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <CategoriesEvents />
                </RequireRole>
              }
            />
            <Route
              path="/admin/jadual"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <Schedule />
                </RequireRole>
              }
            />
            <Route
              path="/admin/heat"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <Heats />
                </RequireRole>
              }
            />
            <Route
              path="/admin/keputusan"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <AdminResults />
                </RequireRole>
              }
            />
            <Route
              path="/admin/pasukan"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <Teams />
                </RequireRole>
              }
            />
            <Route
              path="/admin/mata"
              element={
                <RequireRole roles={[ROLES.ADMIN]}>
                  <PointsTable />
                </RequireRole>
              }
            />

            {/* Pengurus Pasukan */}
            <Route
              path="/pasukan"
              element={
                <RequireRole roles={[ROLES.PENGURUS_PASUKAN]}>
                  <TeamDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/pasukan/peserta"
              element={
                <RequireRole roles={[ROLES.PENGURUS_PASUKAN]}>
                  <Participants />
                </RequireRole>
              }
            />
            <Route
              path="/pasukan/jadual"
              element={
                <RequireRole roles={[ROLES.PENGURUS_PASUKAN]}>
                  <TeamSchedule />
                </RequireRole>
              }
            />
            <Route
              path="/pasukan/keputusan"
              element={
                <RequireRole roles={[ROLES.PENGURUS_PASUKAN]}>
                  <TeamResults />
                </RequireRole>
              }
            />

            {/* Super Admin */}
            <Route
              path="/superadmin"
              element={
                <RequireRole roles={[ROLES.SUPERADMIN]}>
                  <SuperAdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/superadmin/tetapan"
              element={
                <RequireRole roles={[ROLES.SUPERADMIN]}>
                  <SuperAdminSettings />
                </RequireRole>
              }
            />

            <Route path="*" element={<Landing />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
