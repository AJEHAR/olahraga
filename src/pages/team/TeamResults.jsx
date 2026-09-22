import { collectionGroup, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useMyTeam } from '../../hooks/useMyTeam'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState } from '../../components/UI'
import { formatTime } from '../../lib/ranking'

export default function TeamResults() {
  const { team, loading, teamId } = useMyTeam()
  if (loading) return <Spinner />
  if (!team) return <EmptyState title="Pasukan tidak dijumpai" />
  return <TeamResultsContent team={team} teamId={teamId} />
}

function TeamResultsContent({ team, teamId }) {
  const { data: results, loading } = useCollectionData(
    query(collectionGroup(db, 'results'), where('teamId', '==', teamId))
  )

  return (
    <div>
      <PageHeader title="Keputusan Pasukan" subtitle={team.name} />
      {loading ? (
        <Spinner />
      ) : results.length === 0 ? (
        <EmptyState
          title="Belum ada keputusan disahkan"
          description="Keputusan dipapar di sini selepas Admin mengesahkannya."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Peserta</th>
                <th className="px-3 py-2.5">Acara</th>
                <th className="px-3 py-2.5">Kedudukan</th>
                <th className="px-3 py-2.5">Nilai</th>
                <th className="px-3 py-2.5">Mata</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{r.participantName}</td>
                  <td className="px-3 py-2 text-slate-500">{r.discipline || '—'}</td>
                  <td className="px-3 py-2 font-semibold">{r.position ?? '—'}</td>
                  <td className="px-3 py-2">{r.eventType === 'trek' ? formatTime(r.value) : `${r.value} m`}</td>
                  <td className="px-3 py-2 font-semibold text-brand-700">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
