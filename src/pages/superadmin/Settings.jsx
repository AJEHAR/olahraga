import { useEffect, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useDocData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner } from '../../components/UI'

export default function SuperAdminSettings() {
  const ref = doc(db, 'settings', 'landingPage')
  const { data, loading } = useDocData(ref)
  const [form, setForm] = useState({ badge: '', headline: '', subtitle: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm({ badge: data.badge || '', headline: data.headline || '', subtitle: data.subtitle || '' })
  }, [data])

  async function save(e) {
    e.preventDefault()
    await setDoc(ref, form)
    setSaved(true)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Tetapan Sistem" subtitle="Label Landing Page" />
      <form onSubmit={save} className="card max-w-md space-y-3 p-4">
        {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">Disimpan.</p>}
        <div>
          <label className="label">Badge</label>
          <input className="input" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
        </div>
        <div>
          <label className="label">Headline</label>
          <input className="input" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
        </div>
        <div>
          <label className="label">Subtitle</label>
          <textarea
            className="input"
            rows={3}
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          />
        </div>
        <button className="btn-primary" type="submit">
          Simpan
        </button>
      </form>
    </div>
  )
}
