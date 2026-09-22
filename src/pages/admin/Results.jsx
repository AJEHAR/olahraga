import { useMemo, useState } from 'react'
import { collection, collectionGroup, doc, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, ErrorBanner, EventStatusBadge } from '../../components/UI'
import { calculatePositions, pointsForPosition, formatTime, parseTimeToSeconds } from '../../lib/ranking'

export default function AdminResults() {
  const { comp, loading } = useAdminCompetition()
  if (loading) return <Spinner />
  if (!comp) return <EmptyState title="Tiada pertandingan dijumpai" />
  return <ResultsContent comp={comp} />
}

function ResultsContent({ comp }) {
  const eventsCol = collection(db, 'competitions', comp.id, 'events')
  const { data: events } = useCollectionData(eventsCol)
  const [selectedId, setSelectedId] = useState('')
  const selected = events.find((e) => e.id === selectedId) || null

  return (
    <div>
      <PageHeader title="Rekod & Sahkan Keputusan" subtitle={comp.name} />
      {events.length === 0 ? (
        <EmptyState title="Belum ada acara" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="card p-3">
            <ul className="space-y-1">
              {events.map((ev) => (
                <li key={ev.id}>
                  <button
                    onClick={() => setSelectedId(ev.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                      selectedId === ev.id ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>{ev.discipline}</span>
                    <EventStatusBadge status={ev.status} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {selected ? (
            <ResultEditor comp={comp} event={selected} />
          ) : (
            <EmptyState title="Pilih acara" description="Pilih acara di sebelah kiri untuk masuk keputusan." />
          )}
        </div>
      )}
    </div>
  )
}

function ResultEditor({ comp, event }) {
  const resultsCol = collection(db, 'competitions', comp.id, 'events', event.id, 'results')
  const { data: savedResults } = useCollectionData(resultsCol)
  const { data: participants, loading: pLoading } = useCollectionData(
    query(collectionGroup(db, 'participants'), where('eventIds', 'array-contains', event.id))
  )

  const savedMap = useMemo(() => Object.fromEntries(savedResults.map((r) => [r.id, r])), [savedResults])
  const [draft, setDraft] = useState({}) // participantId -> raw input string (time) or number (distance)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isLocked = event.status === 'disahkan'

  function getValue(participantId) {
    if (draft[participantId] !== undefined) return draft[participantId]
    const saved = savedMap[participantId]
    if (!saved) return ''
    return event.type === 'trek' ? formatTime(saved.value) : saved.value
  }

  function setValue(participantId, value) {
    setDraft((d) => ({ ...d, [participantId]: value }))
  }

  async function saveAndCompute(confirm) {
    setError('')
    if (participants.length === 0) {
      setError('Tiada peserta didaftarkan untuk acara ini.')
      return
    }
    setBusy(true)
    try {
      const entries = participants.map((p) => {
        const raw = getValue(p.id)
        const value = event.type === 'trek' ? parseTimeToSeconds(raw) : raw === '' ? null : parseFloat(raw)
        return { participantId: p.id, participant: p, value }
      })
      const ranked = calculatePositions(entries, event.type)
      const batch = writeBatch(db)
      ranked.forEach((r) => {
        const points = confirm ? pointsForPosition(r.position, comp.pointsTable || {}) : 0
        batch.set(doc(resultsCol, r.participantId), {
          value: r.value,
          position: r.position,
          points,
          participantName: r.participant.name,
          teamId: r.participant.teamId,
          competitionCode: comp.code,
          eventId: event.id,
          discipline: event.discipline,
          eventType: event.type,
        })
      })
      batch.update(doc(db, 'competitions', comp.id, 'events', event.id), {
        status: confirm ? 'disahkan' : 'selesai',
      })
      await batch.commit()
      setDraft({})
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">{event.discipline}</h2>
          <p className="text-xs text-slate-500">
            {event.type === 'trek' ? 'Masukkan masa (mm:ss.ss atau ss.ss)' : 'Masukkan jarak/ketinggian terbaik (m)'}
          </p>
        </div>
        <EventStatusBadge status={event.status} />
      </div>
      <ErrorBanner message={error} />
      {isLocked && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          Keputusan telah disahkan dan dikunci. Untuk ubah, hubungi pentadbir sistem.
        </p>
      )}
      {pLoading ? (
        <Spinner />
      ) : participants.length === 0 ? (
        <p className="text-sm text-slate-400">Tiada peserta didaftarkan untuk acara ini.</p>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-1.5 pr-2">Peserta</th>
                  <th className="py-1.5 pr-2">Nilai</th>
                  <th className="py-1.5">Kedudukan Tersimpan</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-t border-slate-50">
                    <td className="py-1.5 pr-2">{p.name}</td>
                    <td className="py-1.5 pr-2">
                      <input
                        className="input !py-1 w-32 text-xs"
                        disabled={isLocked}
                        placeholder={event.type === 'trek' ? 'mm:ss.ss' : 'meter'}
                        value={getValue(p.id)}
                        onChange={(e) => setValue(p.id, e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 text-slate-500">{savedMap[p.id]?.position ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLocked && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => saveAndCompute(false)} className="btn-secondary" disabled={busy}>
                Simpan Draf & Kira Kedudukan
              </button>
              <button onClick={() => saveAndCompute(true)} className="btn-primary" disabled={busy}>
                Sahkan Keputusan Rasmi
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
