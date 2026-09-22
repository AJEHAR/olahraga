import { useMemo, useState } from 'react'
import { collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, EventStatusBadge } from '../../components/UI'

export default function Schedule() {
  const { comp, loading } = useAdminCompetition()
  if (loading) return <Spinner />
  if (!comp) return <EmptyState title="Tiada pertandingan dijumpai" />
  return <ScheduleContent comp={comp} />
}

function ScheduleContent({ comp }) {
  const eventsCol = collection(db, 'competitions', comp.id, 'events')
  const catsCol = collection(db, 'competitions', comp.id, 'categories')
  const { data: events } = useCollectionData(eventsCol)
  const { data: categories } = useCollectionData(catsCol)
  const [dayFilter, setDayFilter] = useState('')
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])

  const days = useMemo(() => {
    const set = new Set(
      events.filter((e) => e.scheduledAt).map((e) => new Date(e.scheduledAt).toISOString().slice(0, 10))
    )
    return [...set].sort()
  }, [events])

  const sorted = [...events].sort((a, b) => {
    if (!a.scheduledAt) return 1
    if (!b.scheduledAt) return -1
    return new Date(a.scheduledAt) - new Date(b.scheduledAt)
  })
  const filtered = dayFilter
    ? sorted.filter((e) => e.scheduledAt && new Date(e.scheduledAt).toISOString().slice(0, 10) === dayFilter)
    : sorted

  async function updateSchedule(eventId, field, value) {
    await updateDoc(doc(eventsCol, eventId), { [field]: value })
  }

  if (events.length === 0) {
    return (
      <div>
        <PageHeader title="Jadual Acara" subtitle={comp.name} />
        <EmptyState title="Belum ada acara" description="Tambah acara dahulu di halaman Kategori & Acara." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Jadual Acara" subtitle={comp.name} />
      {days.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setDayFilter('')}
            className={`badge ${dayFilter === '' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Semua hari
          </button>
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setDayFilter(d)}
              className={`badge ${dayFilter === d ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2.5">Tarikh &amp; Masa</th>
              <th className="px-3 py-2.5">Acara</th>
              <th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5">Lokasi</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev) => (
              <tr key={ev.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    type="datetime-local"
                    className="input !py-1 text-xs"
                    value={ev.scheduledAt ? toLocalInput(ev.scheduledAt) : ''}
                    onChange={(e) =>
                      updateSchedule(ev.id, 'scheduledAt', e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                </td>
                <td className="px-3 py-2 font-medium text-slate-800">{ev.discipline}</td>
                <td className="px-3 py-2 text-slate-500">
                  {catMap[ev.categoryId] ? `${catMap[ev.categoryId].ageGroup} ${catMap[ev.categoryId].gender}` : '—'}
                </td>
                <td className="px-3 py-2">
                  <input
                    className="input !py-1 text-xs"
                    placeholder={ev.type === 'trek' ? 'Trek' : 'Padang'}
                    defaultValue={ev.location || ''}
                    onBlur={(e) => updateSchedule(ev.id, 'location', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <EventStatusBadge status={ev.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function toLocalInput(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
