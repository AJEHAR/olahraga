import { useState } from 'react'
import { collection, collectionGroup, doc, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, ErrorBanner } from '../../components/UI'

const LANES = 8

export default function Heats() {
  const { comp, loading } = useAdminCompetition()
  if (loading) return <Spinner />
  if (!comp) return <EmptyState title="Tiada pertandingan dijumpai" />
  return <HeatsContent comp={comp} />
}

function HeatsContent({ comp }) {
  const eventsCol = collection(db, 'competitions', comp.id, 'events')
  const { data: allEvents } = useCollectionData(eventsCol)
  const trackEvents = allEvents.filter((e) => e.type === 'trek')
  const [selectedId, setSelectedId] = useState('')
  const selected = trackEvents.find((e) => e.id === selectedId) || null

  return (
    <div>
      <PageHeader title="Jana Heat" subtitle={`${comp.name} — hanya acara trek memerlukan heat/lorong`} />
      {trackEvents.length === 0 ? (
        <EmptyState title="Tiada acara trek" description="Tambah acara trek di halaman Kategori & Acara." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="card p-3">
            <ul className="space-y-1">
              {trackEvents.map((ev) => (
                <li key={ev.id}>
                  <button
                    onClick={() => setSelectedId(ev.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      selectedId === ev.id ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    {ev.discipline}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {selected ? (
            <HeatEditor comp={comp} event={selected} />
          ) : (
            <EmptyState title="Pilih acara" description="Pilih acara trek di sebelah kiri untuk jana heat." />
          )}
        </div>
      )}
    </div>
  )
}

function HeatEditor({ comp, event }) {
  const heatsCol = collection(db, 'competitions', comp.id, 'events', event.id, 'heats')
  const { data: heats } = useCollectionData(heatsCol)
  const { data: participants, loading } = useCollectionData(
    query(collectionGroup(db, 'participants'), where('eventIds', 'array-contains', event.id))
  )
  const [error, setError] = useState('')

  async function generateHeats() {
    setError('')
    if (participants.length === 0) {
      setError('Tiada peserta didaftarkan untuk acara ini.')
      return
    }
    const numHeats = Math.max(1, Math.ceil(participants.length / LANES))
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const heatGroups = Array.from({ length: numHeats }, () => [])
    shuffled.forEach((p, idx) => heatGroups[idx % numHeats].push(p))

    await Promise.all(
      heatGroups.map((group, idx) =>
        setDoc(doc(heatsCol, `heat_${idx + 1}`), {
          heatNumber: idx + 1,
          laneAssignments: group.map((p, laneIdx) => ({
            participantId: p.id,
            participantName: p.name,
            teamId: p.teamId,
            lane: laneIdx + 1,
          })),
        })
      )
    )
    await updateDoc(doc(db, 'competitions', comp.id, 'events', event.id), { status: 'sedang_berjalan' })
  }

  return (
    <div className="card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">{event.discipline}</h2>
          <p className="text-xs text-slate-500">{participants.length} peserta didaftarkan</p>
        </div>
        <button onClick={generateHeats} className="btn-primary text-sm" disabled={loading}>
          {heats.length > 0 ? 'Jana Semula Heat' : 'Jana Heat'}
        </button>
      </div>
      <ErrorBanner message={error} />
      {heats.length === 0 ? (
        <p className="text-sm text-slate-400">Belum dijana. Maksimum {LANES} lorong setiap heat.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...heats]
            .sort((a, b) => a.heatNumber - b.heatNumber)
            .map((heat) => (
              <div key={heat.id} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-700">Heat {heat.heatNumber}</p>
                <ul className="space-y-1 text-sm">
                  {[...heat.laneAssignments]
                    .sort((a, b) => a.lane - b.lane)
                    .map((l) => (
                      <li key={l.participantId} className="flex justify-between">
                        <span className="text-slate-400">Lorong {l.lane}</span>
                        <span>{l.participantName}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
