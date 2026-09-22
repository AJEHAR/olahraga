import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, doc, query, where } from 'firebase/firestore'
import { useDocData, useCollectionData } from '../../hooks/useLiveDoc'
import { db } from '../../firebase/config'
import { Spinner, EmptyState, EventStatusBadge } from '../../components/UI'
import { formatTime } from '../../lib/ranking'

export default function Results() {
  const { code } = useParams()
  const { data: comp, loading: compLoading } = useDocData(doc(db, 'competitions', code))
  const { data: categories } = useCollectionData(collection(db, 'competitions', code, 'categories'))
  const { data: events, loading: eventsLoading } = useCollectionData(
    query(collection(db, 'competitions', code, 'events'), where('status', '==', 'disahkan'))
  )
  const [categoryFilter, setCategoryFilter] = useState('')

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const filteredEvents = categoryFilter ? events.filter((e) => e.categoryId === categoryFilter) : events

  if (compLoading) return <Spinner />
  if (!comp) {
    return (
      <EmptyState
        title="Pertandingan tidak dijumpai"
        description={`Tiada pertandingan dengan kod "${code}".`}
        action={
          <Link to="/" className="btn-secondary">
            Kembali
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{comp.code}</p>
        <h1 className="text-xl font-bold text-slate-900">{comp.name}</h1>
        <p className="text-sm text-slate-500">{comp.orgName}</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Link to={`/carta/${code}`} className="btn-secondary text-sm">
          Carta Kedudukan Pasukan →
        </Link>
        <select className="input max-w-xs" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.ageGroup} · {c.gender === 'L' ? 'Lelaki' : 'Perempuan'}
            </option>
          ))}
        </select>
      </div>

      {eventsLoading ? (
        <Spinner />
      ) : filteredEvents.length === 0 ? (
        <EmptyState title="Belum ada keputusan disahkan" description="Semak semula selepas acara berjalan." />
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <EventResultCard key={event.id} code={code} event={event} category={categoryMap[event.categoryId]} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventResultCard({ code, event, category }) {
  const { data: results, loading } = useCollectionData(collection(db, 'competitions', code, 'events', event.id, 'results'))
  const sorted = [...results]
    .filter((r) => r.position != null)
    .sort((a, b) => a.position - b.position)

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{event.discipline}</h3>
          <p className="text-xs text-slate-500">
            {category ? `${category.ageGroup} · ${category.gender === 'L' ? 'Lelaki' : 'Perempuan'}` : ''}
          </p>
        </div>
        <EventStatusBadge status={event.status} />
      </div>
      {loading ? (
        <Spinner />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-400">Tiada keputusan.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="py-1.5 pr-2">Kedudukan</th>
              <th className="py-1.5 pr-2">Peserta</th>
              <th className="py-1.5">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 last:border-0">
                <td className="py-1.5 pr-2 font-semibold text-slate-700">{r.position}</td>
                <td className="py-1.5 pr-2">{r.participantName || r.id}</td>
                <td className="py-1.5">{event.type === 'trek' ? formatTime(r.value) : `${r.value} m`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
