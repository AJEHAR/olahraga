import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { ErrorBanner } from '../components/UI'
import { DEFAULT_POINTS_TABLE } from '../lib/constants'

export default function SignUpAdmin() {
  const { signUpAsAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    orgName: '',
    compName: '',
    compCode: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.compCode.trim()) {
      setError('Sila isi Kod Pertandingan.')
      return
    }
    setBusy(true)
    try {
      const user = await signUpAsAdmin({ email: form.email, password: form.password })
      await addDoc(collection(db, 'competitions'), {
        code: form.compCode.trim().toUpperCase(),
        name: form.compName,
        orgId: user.uid,
        orgName: form.orgName,
        pointsTable: DEFAULT_POINTS_TABLE,
        createdAt: serverTimestamp(),
      })
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(mapError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Daftar Admin & Cipta Pertandingan</h1>
      <p className="mb-6 text-sm text-slate-500">
        Satu akaun Admin = satu organisasi/kelab/sekolah. Anda akan menjadi Admin bagi pertandingan ini.
      </p>
      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <ErrorBanner message={error} />
        <div>
          <label className="label">Nama Organisasi / Sekolah / Kelab</label>
          <input className="input" required value={form.orgName} onChange={set('orgName')} />
        </div>
        <div>
          <label className="label">Nama Pertandingan</label>
          <input
            className="input"
            required
            placeholder="cth: Hari Sukan Tahunan 2026"
            value={form.compName}
            onChange={set('compName')}
          />
        </div>
        <div>
          <label className="label">Kod Pertandingan</label>
          <input
            className="input uppercase"
            required
            placeholder="cth: SUKAN2026"
            value={form.compCode}
            onChange={set('compCode')}
          />
          <p className="mt-1 text-xs text-slate-400">Digunakan orang ramai untuk lihat keputusan rasmi.</p>
        </div>
        <hr className="border-slate-200" />
        <div>
          <label className="label">Emel</label>
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Kata Laluan</label>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={set('password')}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Mencipta…' : 'Daftar & Cipta Pertandingan'}
        </button>
      </form>
    </div>
  )
}

function mapError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return 'Emel sudah didaftarkan.'
  if (code.includes('weak-password')) return 'Kata laluan terlalu lemah (min. 6 aksara).'
  return 'Pendaftaran gagal. Sila cuba lagi.'
}
