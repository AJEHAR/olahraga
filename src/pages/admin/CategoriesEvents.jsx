import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, ErrorBanner } from '../../components/UI'
import { DISCIPLINES, DEFAULT_AGE_GROUPS, GENDERS } from '../../lib/constants'

export default function CategoriesEvents() {
  const { comp, loading } = useAdminCompetition()
  if (loading) return <Spinner />
  if (!comp) return <EmptyState title="Tiada pertandingan dijumpai" />
  return <CategoriesEventsContent comp={comp} />
}

function CategoriesEventsContent({ comp }) {
  const catsCol = collection(db, 'competitions', comp.id, 'categories')
  const eventsCol = collection(db, 'competitions', comp.id, 'events')
  const { data: categories } = useCollectionData(catsCol)
  const { data: events } = useCollectionData(eventsCol)

  return (
    <div>
      <PageHeader title="Kategori & Acara" subtitle={comp.name} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoriesPanel catsCol={catsCol} categories={categories} />
        <EventsPanel eventsCol={eventsCol} events={events} categories={categories} />
      </div>
    </div>
  )
}

function CategoriesPanel({ catsCol, categories }) {
  const [ageGroup, setAgeGroup] = useState('')
  const [gender, setGender] = useState('L')
  const [error, setError] = useState('')

  async function addCategory(e) {
    e.preventDefault()
    setError('')
    if (!ageGroup.trim()) return setError('Isi kumpulan umur.')
    if (categories.some((c) => c.ageGroup === ageGroup.trim() && c.gender === gender)) {
      return setError('Kategori ini sudah wujud.')
    }
    await addDoc(catsCol, { ageGroup: ageGroup.trim(), gender })
    setAgeGroup('')
  }

  async function removeCategory(id) {
    await deleteDoc(doc(catsCol, id))
  }

  return (
    <div className="card p-4">
      <h2 className="mb-3 font-semibold text-slate-900">Kategori Umur & Jantina</h2>
      <ErrorBanner message={error} />
      <form onSubmit={addCategory} className="mb-4 flex flex-wrap gap-2">
        <input
          className="input flex-1 min-w-[140px]"
          list="age-groups"
          placeholder="cth: Bawah 15"
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
        />
        <datalist id="age-groups">
          {DEFAULT_AGE_GROUPS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <select className="input w-32" value={gender} onChange={(e) => setGender(e.target.value)}>
          {GENDERS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button className="btn-primary shrink-0" type="submit">
          Tambah
        </button>
      </form>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada kategori.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {c.ageGroup} · {c.gender === 'L' ? 'Lelaki' : 'Perempuan'}
              </span>
              <button onClick={() => removeCategory(c.id)} className="text-xs text-red-500 hover:underline">
                Buang
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EventsPanel({ eventsCol, events, categories }) {
  const [discipline, setDiscipline] = useState('')
  const [type, setType] = useState('trek')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  async function addEvent(e) {
    e.preventDefault()
    setError('')
    if (!discipline || !categoryId) return setError('Pilih disiplin dan kategori.')
    await addDoc(eventsCol, {
      discipline,
      type,
      categoryId,
      round: 'akhir',
      status: 'belum_mula',
      scheduledAt: null,
      createdAt: serverTimestamp(),
    })
    setDiscipline('')
  }

  async function removeEvent(id) {
    await deleteDoc(doc(eventsCol, id))
  }

  const disciplineOptions = DISCIPLINES[type]

  return (
    <div className="card p-4">
      <h2 className="mb-3 font-semibold text-slate-900">Senarai Acara</h2>
      <ErrorBanner message={error} />
      {categories.length === 0 && (
        <p className="mb-3 text-xs text-amber-600">Tambah sekurang-kurangnya satu kategori dahulu.</p>
      )}
      <form onSubmit={addEvent} className="mb-4 space-y-2">
        <div className="flex gap-2">
          <select
            className="input"
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setDiscipline('')
            }}
          >
            <option value="trek">Trek</option>
            <option value="padang">Padang</option>
          </select>
          <select className="input flex-1" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="">Pilih disiplin…</option>
            {disciplineOptions.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <select className="input flex-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Pilih kategori…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ageGroup} · {c.gender === 'L' ? 'Lelaki' : 'Perempuan'}
              </option>
            ))}
          </select>
          <button className="btn-primary shrink-0" type="submit" disabled={categories.length === 0}>
            Tambah Acara
          </button>
        </div>
      </form>
      {events.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada acara.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {events.map((ev) => {
            const cat = categories.find((c) => c.id === ev.categoryId)
            return (
              <li key={ev.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{ev.discipline}</span>{' '}
                  <span className="text-slate-400">
                    · {cat ? `${cat.ageGroup} ${cat.gender === 'L' ? 'L' : 'P'}` : '—'} · {ev.type}
                  </span>
                </span>
                <button onClick={() => removeEvent(ev.id)} className="text-xs text-red-500 hover:underline">
                  Buang
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
