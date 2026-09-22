import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { ErrorBanner } from '../../components/UI'

export default function Landing() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLookup(e) {
    e.preventDefault()
    setError('')
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setBusy(true)
    try {
      const snap = await getDoc(doc(db, 'competitions', trimmed))
      if (!snap.exists()) {
        setError('Kod pertandingan tidak dijumpai. Semak semula.')
        return
      }
      navigate(`/keputusan/${trimmed}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <section className="py-14 text-center">
        <span className="badge mb-4 bg-brand-100 text-brand-700">Sistem Pengurusan Pertandingan Olahraga</span>
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Urus pertandingan olahraga anda — pendaftaran, jadual, heat, keputusan & mata pasukan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-500">
          Direka khusus untuk hari sukan dan kejohanan trek &amp; padang. Pengurus pasukan daftar peserta,
          Admin urus jadual dan keputusan — semua dalam satu tempat.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/daftar-admin" className="btn-primary">
            Daftar Sebagai Admin
          </Link>
          <Link to="/log-masuk" className="btn-secondary">
            Log Masuk
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-md pb-14">
        <div className="card p-5">
          <h2 className="mb-1 font-semibold text-slate-900">Lihat Keputusan Rasmi</h2>
          <p className="mb-4 text-sm text-slate-500">Masukkan Kod Pertandingan — tiada log masuk diperlukan.</p>
          <ErrorBanner message={error} />
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              className="input uppercase"
              placeholder="cth: SUKAN2026"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn-primary shrink-0" disabled={busy} type="submit">
              Cari
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
