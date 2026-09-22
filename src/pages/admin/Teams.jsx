import { useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { initializeApp, deleteApp } from 'firebase/app'
import { db, app as mainApp } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, ErrorBanner } from '../../components/UI'

export default function Teams() {
  const { comp, loading, orgId } = useAdminCompetition()
  if (loading) return <Spinner />
  if (!comp) return <EmptyState title="Tiada pertandingan dijumpai" />
  return <TeamsContent comp={comp} orgId={orgId} />
}

function TeamsContent({ comp, orgId }) {
  const teamsCol = collection(db, 'teams')
  const { data: teams } = useCollectionData(teamsCol)
  const orgTeams = teams.filter((t) => t.orgId === orgId && t.competitionCode === comp.code)

  const [form, setForm] = useState({ teamName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastCreated, setLastCreated] = useState(null)

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function invite(e) {
    e.preventDefault()
    setError('')
    setLastCreated(null)
    if (!form.teamName.trim()) return setError('Isi nama pasukan.')
    setBusy(true)
    // Cipta akaun Auth untuk Pengurus Pasukan TANPA log keluar Admin semasa:
    // guna instance app Firebase kedua sementara (pattern lazim untuk "admin creates user").
    const secondaryApp = initializeApp(mainApp.options, `invite-${Date.now()}`)
    const secondaryAuth = getAuth(secondaryApp)
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password)
      const teamRef = await addDoc(teamsCol, {
        orgId,
        competitionCode: comp.code,
        name: form.teamName.trim(),
        managerId: cred.user.uid,
        createdAt: serverTimestamp(),
      })
      await setDoc(doc(db, 'users', cred.user.uid), {
        role: 'pengurus_pasukan',
        orgId,
        teamId: teamRef.id,
        email: form.email,
        createdAt: serverTimestamp(),
      })
      setLastCreated({ email: form.email, teamName: form.teamName })
      setForm({ teamName: '', email: '', password: '' })
    } catch (err) {
      setError(mapError(err))
    } finally {
      await secondaryAuth.signOut().catch(() => {})
      await deleteApp(secondaryApp)
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Pasukan & Pengurus Pasukan" subtitle={comp.name} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-slate-900">Jemput Pengurus Pasukan Baharu</h2>
          <ErrorBanner message={error} />
          {lastCreated && (
            <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
              Akaun untuk "{lastCreated.teamName}" dicipta. Kongsikan emel & kata laluan kepada pengurus pasukan
              secara selamat.
            </p>
          )}
          <form onSubmit={invite} className="space-y-3">
            <div>
              <label className="label">Nama Pasukan</label>
              <input className="input" required value={form.teamName} onChange={set('teamName')} />
            </div>
            <div>
              <label className="label">Emel Pengurus Pasukan</label>
              <input className="input" type="email" required value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Kata Laluan Sementara</label>
              <input
                className="input"
                type="text"
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
              />
            </div>
            <button className="btn-primary w-full" disabled={busy} type="submit">
              {busy ? 'Mencipta akaun…' : 'Cipta Akaun Pengurus Pasukan'}
            </button>
          </form>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-slate-900">Senarai Pasukan ({orgTeams.length})</h2>
          {orgTeams.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada pasukan.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orgTeams.map((t) => (
                <li key={t.id} className="py-2 text-sm">
                  {t.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function mapError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return 'Emel sudah didaftarkan.'
  if (code.includes('weak-password')) return 'Kata laluan terlalu lemah (min. 6 aksara).'
  return 'Gagal cipta akaun. Sila cuba lagi.'
}
