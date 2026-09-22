import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useMyTeam } from '../../hooks/useMyTeam'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, ErrorBanner } from '../../components/UI'
import { GENDERS } from '../../lib/constants'
import { calculateAge, eligibleCategories } from '../../lib/ranking'

const MAX_INDIVIDUAL_EVENTS = 3 // had cadangan — Admin boleh ubah dalam kejohanan sebenar (spec §8)

export default function Participants() {
  const { team, loading, teamId } = useMyTeam()
  if (loading) return <Spinner />
  if (!team) return <EmptyState title="Pasukan tidak dijumpai" />
  return <ParticipantsContent team={team} teamId={teamId} />
}

function ParticipantsContent({ team, teamId }) {
  const participantsCol = collection(db, 'teams', teamId, 'participants')
  const { data: participants } = useCollectionData(participantsCol)
  const { data: categories } = useCollectionData(
    collection(db, 'competitions', team.competitionCode, 'categories')
  )
  const { data: events } = useCollectionData(collection(db, 'competitions', team.competitionCode, 'events'))

  const [editing, setEditing] = useState(null) // participant id being edited, or 'new'

  return (
    <div>
      <PageHeader
        title="Daftar Peserta"
        subtitle={team.name}
        action={
          <button className="btn-primary text-sm" onClick={() => setEditing('new')}>
            + Tambah Peserta
          </button>
        }
      />

      {editing && (
        <ParticipantForm
          key={editing}
          participantsCol={participantsCol}
          participant={editing === 'new' ? null : participants.find((p) => p.id === editing)}
          categories={categories}
          events={events}
          competitionCode={team.competitionCode}
          teamId={teamId}
          onClose={() => setEditing(null)}
        />
      )}

      {participants.length === 0 ? (
        <EmptyState title="Belum ada peserta" description="Tambah peserta pertama pasukan anda." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">No. K/P</th>
                <th className="px-3 py-2.5">Jantina</th>
                <th className="px-3 py-2.5">Kategori</th>
                <th className="px-3 py-2.5">Acara</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId)
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{p.name}</td>
                    <td className="px-3 py-2 text-slate-500">{p.icNumber}</td>
                    <td className="px-3 py-2">{p.gender === 'L' ? 'Lelaki' : 'Perempuan'}</td>
                    <td className="px-3 py-2 text-slate-500">{cat ? cat.ageGroup : '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{p.eventIds?.length || 0}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button className="text-xs text-brand-600 hover:underline" onClick={() => setEditing(p.id)}>
                        Edit
                      </button>{' '}
                      <button
                        className="ml-2 text-xs text-red-500 hover:underline"
                        onClick={() => deleteDoc(doc(participantsCol, p.id))}
                      >
                        Buang
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ParticipantForm({ participantsCol, participant, categories, events, competitionCode, teamId, onClose }) {
  const [name, setName] = useState(participant?.name || '')
  const [icNumber, setIcNumber] = useState(participant?.icNumber || '')
  const [dob, setDob] = useState(participant?.dob || '')
  const [gender, setGender] = useState(participant?.gender || 'L')
  const [eventIds, setEventIds] = useState(participant?.eventIds || [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const eligible = useMemo(() => (dob ? eligibleCategories(dob, categories, gender) : []), [dob, categories, gender])
  const categoryId = eligible[0]?.id || null
  const eligibleEventIds = new Set(events.filter((e) => e.categoryId === categoryId).map((e) => e.id))
  const availableEvents = events.filter((e) => eligibleEventIds.has(e.id))

  function toggleEvent(id) {
    setEventIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id)
      const isRelay = events.find((e) => e.id === id)?.discipline?.toLowerCase().includes('berganti')
      const individualCount = ids.filter(
        (x) => !events.find((e) => e.id === x)?.discipline?.toLowerCase().includes('berganti')
      ).length
      if (!isRelay && individualCount >= MAX_INDIVIDUAL_EVENTS) {
        setError(`Maksimum ${MAX_INDIVIDUAL_EVENTS} acara individu setiap peserta.`)
        return ids
      }
      setError('')
      return [...ids, id]
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !icNumber.trim() || !dob) return setError('Isi semua maklumat wajib.')
    if (!categoryId) return setError('Tiada kategori umur sepadan tarikh lahir/jantina ini dalam pertandingan.')
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        icNumber: icNumber.trim(),
        dob,
        gender,
        categoryId,
        eventIds,
        teamId,
        competitionCode,
      }
      if (participant) {
        await updateDoc(doc(participantsCol, participant.id), payload)
      } else {
        await addDoc(participantsCol, payload)
      }
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-6 space-y-3 p-4">
      <ErrorBanner message={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nama Penuh</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">No. Kad Pengenalan</label>
          <input className="input" required value={icNumber} onChange={(e) => setIcNumber(e.target.value)} />
        </div>
        <div>
          <label className="label">Tarikh Lahir</label>
          <input className="input" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          {dob && (
            <p className="mt-1 text-xs text-slate-400">
              Umur: {calculateAge(dob)} — {eligible.length > 0 ? `Kategori: ${eligible[0].ageGroup}` : 'tiada kategori sepadan'}
            </p>
          )}
        </div>
        <div>
          <label className="label">Jantina</label>
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
            {GENDERS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {dob && (
        <div>
          <label className="label">Daftar ke Acara (maks {MAX_INDIVIDUAL_EVENTS} acara individu)</label>
          {availableEvents.length === 0 ? (
            <p className="text-sm text-slate-400">Tiada acara tersedia untuk kategori ini.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableEvents.map((ev) => (
                <button
                  type="button"
                  key={ev.id}
                  onClick={() => toggleEvent(ev.id)}
                  className={`badge border ${
                    eventIds.includes(ev.id)
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {ev.discipline}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          Batal
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Simpan Peserta'}
        </button>
      </div>
    </form>
  )
}
