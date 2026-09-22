import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { ErrorBanner } from '../components/UI'
import { DEFAULT_POINTS_TABLE } from '../lib/constants'
import { slugifyUsername, toPseudoEmail, generatePassword } from '../lib/credentials'

export default function SignUpAdmin() {
  const { signUpAsAdmin } = useAuth()
  const [form, setForm] = useState({ orgName: '', compName: '', compCode: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null) // { username, password }

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const username = slugifyUsername(form.compCode)
    if (!username) {
      setError('Kod Pertandingan mesti mengandungi sekurang-kurangnya satu huruf/nombor.')
      return
    }
    setBusy(true)
    try {
      // Semak kod pertandingan belum digunakan (doc id = kod).
      const codeUpper = form.compCode.trim().toUpperCase()
      const existing = await getDoc(doc(db, 'competitions', codeUpper))
      if (existing.exists()) {
        setError('Kod Pertandingan ini sudah digunakan. Sila pilih kod lain.')
        return
      }

      const password = generatePassword()
      const pseudoEmail = toPseudoEmail(username)
      const user = await signUpAsAdmin({ email: pseudoEmail, password })
      await addDoc(collection(db, 'competitions'), {
        code: codeUpper,
        name: form.compName,
        orgId: user.uid,
        orgName: form.orgName,
        pointsTable: DEFAULT_POINTS_TABLE,
        createdAt: serverTimestamp(),
      })
      setCreated({ username, password })
    } catch (err) {
      setError(mapError(err))
    } finally {
      setBusy(false)
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-md py-10">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Pertandingan Dicipta</h1>
        <p className="mb-6 text-sm text-slate-500">
          Simpan maklumat log masuk ini — ia hanya dipaparkan sekali.
        </p>
        <div className="card space-y-4 p-5">
          <CredentialRow label="Username" value={created.username} />
          <CredentialRow label="Kata Laluan" value={created.password} />
          <Link to="/log-masuk" className="btn-primary block w-full text-center">
            Ke Halaman Log Masuk
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Daftar Admin & Cipta Pertandingan</h1>
      <p className="mb-6 text-sm text-slate-500">
        Satu akaun Admin = satu organisasi/kelab/sekolah. Username & kata laluan akan dijana automatik
        selepas anda submit.
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
          <p className="mt-1 text-xs text-slate-400">
            Digunakan orang ramai untuk lihat keputusan rasmi, dan sebagai asas username Admin anda.
          </p>
        </div>
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Mencipta…' : 'Daftar & Cipta Pertandingan'}
        </button>
      </form>
    </div>
  )
}

function CredentialRow({ label, value }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard tak tersedia — pengguna salin manual */
    }
  }
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input className="input font-mono" readOnly value={value} />
        <button type="button" onClick={copy} className="btn-secondary shrink-0 !px-3 text-xs">
          {copied ? 'Disalin!' : 'Salin'}
        </button>
      </div>
    </div>
  )
}

function mapError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return 'Kod Pertandingan ini sudah digunakan. Sila pilih kod lain.'
  const detail = code || err?.message || 'ralat tidak diketahui'
  return `Pendaftaran gagal (${detail}). Sila cuba lagi.`
}
