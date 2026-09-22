import { collection } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useMyTeam } from '../../hooks/useMyTeam'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, StatCard, Spinner, EmptyState } from '../../components/UI'
import { Link } from 'react-router-dom'

export default function TeamDashboard() {
  const { team, loading, teamId } = useMyTeam()
  const { data: participants } = useCollectionData(teamId ? collection(db, 'teams', teamId, 'participants') : null)

  if (loading) return <Spinner />
  if (!team) return <EmptyState title="Pasukan tidak dijumpai" />

  const registeredEvents = participants.reduce((sum, p) => sum + (p.eventIds?.length || 0), 0)

  return (
    <div>
      <PageHeader title={team.name} subtitle={`Kod Pertandingan: ${team.competitionCode}`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Peserta Didaftar" value={participants.length} />
        <StatCard label="Pendaftaran Acara" value={registeredEvents} />
        <StatCard label="Kod Pertandingan" value={team.competitionCode} />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/pasukan/peserta" className="card p-4 hover:shadow-md">
          <p className="font-semibold text-slate-900">Daftar Peserta</p>
          <p className="mt-0.5 text-sm text-slate-500">Tambah peserta & daftar ke acara</p>
        </Link>
        <Link to="/pasukan/jadual" className="card p-4 hover:shadow-md">
          <p className="font-semibold text-slate-900">Jadual Acara</p>
          <p className="mt-0.5 text-sm text-slate-500">Lihat tarikh & masa acara</p>
        </Link>
        <Link to="/pasukan/keputusan" className="card p-4 hover:shadow-md">
          <p className="font-semibold text-slate-900">Keputusan</p>
          <p className="mt-0.5 text-sm text-slate-500">Lihat keputusan disahkan</p>
        </Link>
      </div>
    </div>
  )
}
