import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorBanner } from '../components/UI'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn({ email, password })
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Log Masuk</h1>
      <p className="mb-6 text-sm text-slate-500">
        Untuk Admin dan Pengurus Pasukan. Peserta tidak memerlukan akaun.
      </p>
      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <ErrorBanner message={error} />
        <div>
          <label className="label">Emel</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Kata Laluan</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Log masuk…' : 'Log Masuk'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Admin baharu?{' '}
        <Link to="/daftar-admin" className="font-semibold text-brand-600 hover:underline">
          Daftar & Cipta Pertandingan
        </Link>
      </p>
    </div>
  )
}

function mapAuthError(err) {
  const code = err?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Emel atau kata laluan tidak sah.'
  }
  if (code.includes('too-many-requests')) return 'Terlalu banyak percubaan. Cuba lagi sebentar.'
  return 'Log masuk gagal. Sila cuba lagi.'
}
