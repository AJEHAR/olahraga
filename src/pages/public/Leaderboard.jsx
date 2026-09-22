import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, collectionGroup, doc, query, where } from 'firebase/firestore'
import { useCollectionData, useDocData } from '../../hooks/useLiveDoc'
import { db } from '../../firebase/config'
import { Spinner, EmptyState } from '../../components/UI'
import { aggregateTeamPoints } from '../../lib/ranking'

export default function Leaderboard() {
  const { code } = useParams()
  const { data: comp, loading: compLoading } = useDocData(doc(db, 'competitions', code))
  const { data: teams } = useCollectionData(
    query(collection(db, 'teams'), where('competitionCode', '==', code))
  )
  // Kutip semua keputusan disahkan merentasi acara pertandingan ini (collectionGroup 'results'
  // ditapis ikut competitionCode disimpan pada setiap doc keputusan untuk query merentasi acara).
  const { data: results, loading: resultsLoading } = useCollectionData(
    query(collectionGroup(db, 'results'), where('competitionCode', '==', code))
  )

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams])
  const ranking = useMemo(() => aggregateTeamPoints(results), [results])

  if (compLoading) return <Spinner />
  if (!comp) {
    return (
      <EmptyState
        title="Pertandingan tidak dijumpai"
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
        <h1 className="text-xl font-bold text-slate-900">Carta Kedudukan Pasukan</h1>
        <p className="text-sm text-slate-500">{comp.name}</p>
      </div>

      <Link to={`/keputusan/${code}`} className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Lihat keputusan setiap acara
      </Link>

      {resultsLoading ? (
        <Spinner />
      ) : ranking.length === 0 ? (
        <EmptyState title="Belum ada mata dikira" description="Mata dikemaskini automatik apabila keputusan disahkan." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Pasukan</th>
                <th className="px-4 py-2.5 text-right">Jumlah Mata</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, idx) => (
                <tr key={r.teamId} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{idx + 1}</td>
                  <td className="px-4 py-2.5">{teamMap[r.teamId]?.name || r.teamId}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-brand-700">{r.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
