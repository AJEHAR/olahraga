import { collection } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useMyTeam } from '../../hooks/useMyTeam'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, Spinner, EmptyState, EventStatusBadge } from '../../components/UI'

export default function TeamSchedule() {
  const { team, loading } = useMyTeam()
  if (loading) return <Spinner />
  if (!team) return <EmptyState title="Pasukan tidak dijumpai" />
  return <TeamScheduleContent team={team} />
}

function TeamScheduleContent({ team }) {
  const { data: events } = useCollectionData(collection(db, 'competitions', team.competitionCode, 'events'))
  const sorted = [...events].sort((a, b) => {
    if (!a.scheduledAt) return 1
    if (!b.scheduledAt) return -1
    return new Date(a.scheduledAt) - new Date(b.scheduledAt)
  })

  return (
    <div>
      <PageHeader title="Jadual Acara" subtitle={team.name} />
      {sorted.length === 0 ? (
        <EmptyState title="Belum ada acara dijadualkan" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {sorted.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{ev.discipline}</p>
                <p className="text-xs text-slate-500">
                  {ev.scheduledAt ? new Date(ev.scheduledAt).toLocaleString('ms-MY') : 'Belum dijadualkan'}
                  {ev.location ? ` · ${ev.location}` : ''}
                </p>
              </div>
              <EventStatusBadge status={ev.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
