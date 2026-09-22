import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/acara', label: 'Kategori & Acara' },
    { to: '/admin/jadual', label: 'Jadual' },
    { to: '/admin/heat', label: 'Jana Heat' },
    { to: '/admin/keputusan', label: 'Keputusan' },
    { to: '/admin/pasukan', label: 'Pasukan' },
    { to: '/admin/mata', label: 'Jadual Mata' },
  ],
  pengurus_pasukan: [
    { to: '/pasukan', label: 'Dashboard', end: true },
    { to: '/pasukan/peserta', label: 'Peserta' },
    { to: '/pasukan/jadual', label: 'Jadual' },
    { to: '/pasukan/keputusan', label: 'Keputusan' },
  ],
  superadmin: [
    { to: '/superadmin', label: 'Dashboard', end: true },
    { to: '/superadmin/tetapan', label: 'Tetapan Sistem' },
  ],
}

const ROLE_LABEL = {
  admin: 'Admin',
  pengurus_pasukan: 'Pengurus Pasukan',
  superadmin: 'Super Admin',
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const items = profile ? NAV_BY_ROLE[profile.role] || [] : []

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-pink-600 text-white text-sm">
              🏃
            </span>
            <span>Sistem Olahraga</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <span className="hidden sm:inline text-xs text-slate-500">{ROLE_LABEL[profile.role]}</span>
                <button onClick={handleSignOut} className="btn-secondary !px-3 !py-1.5 text-xs">
                  Log Keluar
                </button>
              </>
            ) : (
              <Link to="/log-masuk" className="btn-primary !px-3 !py-1.5 text-xs">
                Log Masuk
              </Link>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <div className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Sistem Pengurusan Pertandingan Olahraga
      </footer>
    </div>
  )
}
